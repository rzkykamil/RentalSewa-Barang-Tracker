"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/auth/FormField";
import { PhotoUploadPreview, type PhotoPreviewItem } from "@/components/items/PhotoUploadPreview";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { itemConditionOptions, itemFormCopy } from "@/lib/copy/items";
import type { ItemCondition } from "@/generated/prisma/enums";
import type { ItemPhotoDto } from "@/modules/items/items.service";

export interface ItemFormValues {
  name: string;
  description: string;
  category: string;
  condition: ItemCondition | "";
  pricePerDay: string;
}

interface FieldErrors {
  name?: string;
  description?: string;
  category?: string;
  condition?: string;
  pricePerDay?: string;
  photos?: string;
}

interface ItemFormProps {
  mode: "create" | "edit";
  /** Required in edit mode — target of `PATCH`/`DELETE /api/v1/items/:id`. */
  itemId?: string;
  initialValues?: ItemFormValues;
  /** Existing photos, edit mode only — rendered read-only (see PATCH note below). */
  initialPhotos?: ItemPhotoDto[];
  /** Only rendered in edit mode. */
  onDeactivate?: () => void;
  isDeactivated?: boolean;
}

interface ItemApiErrorResponse {
  error: { code: string; message: string; details?: unknown };
}

const MAX_PHOTOS = 8;

let photoIdCounter = 0;
function nextPhotoId() {
  photoIdCounter += 1;
  return `local-photo-${photoIdCounter}`;
}

/**
 * Shared form for creating and editing a barang.
 *
 * Create mode posts `multipart/form-data` to `POST /api/v1/items` (fields +
 * photo files). Edit mode sends a JSON body to `PATCH /api/v1/items/:id` —
 * that endpoint is JSON-only and doesn't accept photo uploads
 * (`docs/decision-log.md` "PATCH /items/:id tidak menerima upload foto"), so
 * the photos field is shown read-only in edit mode instead of editable.
 */
export function ItemForm({
  mode,
  itemId,
  initialValues,
  initialPhotos,
  onDeactivate,
  isDeactivated,
}: ItemFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState(initialValues?.name ?? "");
  const [description, setDescription] = React.useState(initialValues?.description ?? "");
  const [category, setCategory] = React.useState(initialValues?.category ?? "");
  const [condition, setCondition] = React.useState<ItemCondition | "">(
    initialValues?.condition ?? ""
  );
  const [pricePerDay, setPricePerDay] = React.useState(initialValues?.pricePerDay ?? "");
  const [photos, setPhotos] = React.useState<PhotoPreviewItem[]>([]);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  React.useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.url.startsWith("blob:")) URL.revokeObjectURL(photo.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only on unmount
  }, []);

  function handleAddPhotos(files: FileList) {
    const newPhotos = Array.from(files).map((file) => ({
      id: nextPhotoId(),
      url: URL.createObjectURL(file),
      file,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }

  function handleRemovePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((photo) => photo.id === id);
      if (target?.url.startsWith("blob:")) URL.revokeObjectURL(target.url);
      return prev.filter((photo) => photo.id !== id);
    });
  }

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = itemFormCopy.errors.nameRequired;
    if (!category.trim()) nextErrors.category = itemFormCopy.errors.categoryRequired;
    if (!condition) nextErrors.condition = itemFormCopy.errors.conditionRequired;

    const priceNumber = Number(pricePerDay);
    if (!pricePerDay.trim()) {
      nextErrors.pricePerDay = itemFormCopy.errors.priceRequired;
    } else if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      nextErrors.pricePerDay = itemFormCopy.errors.priceInvalid;
    }

    if (mode === "create") {
      if (photos.length === 0) {
        nextErrors.photos = itemFormCopy.errors.photosRequired;
      } else if (photos.length > MAX_PHOTOS) {
        nextErrors.photos = itemFormCopy.errors.photosTooMany;
      }
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setServerError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("loading");

    try {
      let response: Response;

      if (mode === "create") {
        const formData = new FormData();
        formData.set("name", name.trim());
        if (description.trim()) formData.set("description", description.trim());
        formData.set("category", category.trim());
        formData.set("condition", condition);
        formData.set("pricePerDay", pricePerDay);
        photos.forEach((photo) => {
          if (photo.file) formData.append("photos", photo.file);
        });

        response = await fetch("/api/v1/items", { method: "POST", body: formData });
      } else {
        if (!itemId) throw new Error("itemId is required in edit mode");

        response = await fetch(`/api/v1/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() ? description.trim() : null,
            category: category.trim(),
            condition,
            pricePerDay: Number(pricePerDay),
          }),
        });
      }

      if (!response.ok) {
        const body = (await response.json()) as ItemApiErrorResponse;
        setStatus("error");
        setServerError(body.error.message);
        return;
      }

      const body = (await response.json()) as { data: { id: string } };
      setStatus("success");
      router.refresh();
      setTimeout(() => {
        router.push(mode === "create" ? `/owner/items/${body.data.id}` : `/owner/items/${itemId}`);
      }, 900);
    } catch {
      setStatus("error");
      setServerError("Gagal terhubung ke server. Coba lagi.");
    }
  }

  const isLoading = status === "loading" || status === "success";

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <FormField id="item-name" label={itemFormCopy.fields.name.label} error={errors.name}>
            <Input
              id="item-name"
              name="name"
              placeholder={itemFormCopy.fields.name.placeholder}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              disabled={isLoading}
            />
          </FormField>

          <FormField
            id="item-description"
            label={itemFormCopy.fields.description.label}
            error={errors.description}
          >
            <Textarea
              id="item-description"
              name="description"
              placeholder={itemFormCopy.fields.description.placeholder}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={Boolean(errors.description)}
              disabled={isLoading}
              rows={4}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="item-category"
              label={itemFormCopy.fields.category.label}
              error={errors.category}
            >
              <Input
                id="item-category"
                name="category"
                placeholder={itemFormCopy.fields.category.placeholder}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-invalid={Boolean(errors.category)}
                disabled={isLoading}
              />
            </FormField>

            <FormField
              id="item-condition"
              label={itemFormCopy.fields.condition.label}
              error={errors.condition}
            >
              <Select
                value={condition}
                onValueChange={(value) => setCondition(value as ItemCondition)}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="item-condition"
                  className="w-full"
                  aria-invalid={Boolean(errors.condition)}
                >
                  <SelectValue placeholder={itemFormCopy.fields.condition.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {itemConditionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField
            id="item-price"
            label={itemFormCopy.fields.pricePerDay.label}
            error={errors.pricePerDay}
          >
            <Input
              id="item-price"
              name="pricePerDay"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={itemFormCopy.fields.pricePerDay.placeholder}
              value={pricePerDay}
              onChange={(event) => setPricePerDay(event.target.value)}
              aria-invalid={Boolean(errors.pricePerDay)}
              disabled={isLoading}
            />
          </FormField>

          {mode === "create" ? (
            <FormField
              id="item-photos"
              label={itemFormCopy.fields.photos.label}
              error={errors.photos}
              hint={errors.photos ? undefined : itemFormCopy.fields.photos.hint}
            >
              <PhotoUploadPreview
                photos={photos}
                onAdd={handleAddPhotos}
                onRemove={handleRemovePhoto}
                disabled={isLoading}
              />
            </FormField>
          ) : (
            <FormField
              id="item-photos"
              label={itemFormCopy.fields.photos.label}
              hint={itemFormCopy.fields.photos.editReadOnlyHint}
            >
              <PhotoUploadPreview
                photos={(initialPhotos ?? []).map((photo) => ({ id: photo.id, url: photo.url }))}
                readOnly
              />
            </FormField>
          )}

          {status === "success" && (
            <p role="status" className="text-sm font-medium text-status-positive">
              {mode === "create" ? itemFormCopy.successCreate : itemFormCopy.successEdit}
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {serverError ?? "Gagal menyimpan barang. Coba lagi."}
            </p>
          )}

          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row sm:items-center">
            {mode === "edit" && onDeactivate && (
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="destructive" disabled={isDeactivated}>
                    {isDeactivated ? "Barang Nonaktif" : itemFormCopy.deactivate.trigger}
                  </Button>
                }
                title={itemFormCopy.deactivate.dialogTitle}
                description={itemFormCopy.deactivate.dialogDescription}
                confirmLabel={itemFormCopy.deactivate.confirm}
                cancelLabel={itemFormCopy.deactivate.cancel}
                onConfirm={onDeactivate}
              />
            )}
            <Button type="submit" disabled={isLoading} className="sm:ml-auto">
              {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
              {isLoading
                ? mode === "create"
                  ? itemFormCopy.submitCreateLoading
                  : itemFormCopy.submitEditLoading
                : mode === "create"
                  ? itemFormCopy.submitCreate
                  : itemFormCopy.submitEdit}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
