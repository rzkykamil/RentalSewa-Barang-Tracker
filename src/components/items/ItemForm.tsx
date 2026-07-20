"use client";

import * as React from "react";
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
import type { MockItemCondition } from "@/lib/mock/items";

export interface ItemFormValues {
  name: string;
  description: string;
  category: string;
  condition: MockItemCondition | "";
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
  initialValues?: ItemFormValues;
  initialPhotos?: PhotoPreviewItem[];
  /** Only rendered in edit mode. */
  onDeactivate?: () => void;
  isDeactivated?: boolean;
}

let photoIdCounter = 0;
function nextPhotoId() {
  photoIdCounter += 1;
  return `local-photo-${photoIdCounter}`;
}

/**
 * Shared form for creating and editing a barang. Periode 4 (frontend +
 * mock data only): submitting simulates a network round-trip and does not
 * persist across the mock item list — see docs/todo/frontend.md.
 */
export function ItemForm({
  mode,
  initialValues,
  initialPhotos,
  onDeactivate,
  isDeactivated,
}: ItemFormProps) {
  const [name, setName] = React.useState(initialValues?.name ?? "");
  const [description, setDescription] = React.useState(initialValues?.description ?? "");
  const [category, setCategory] = React.useState(initialValues?.category ?? "");
  const [condition, setCondition] = React.useState<MockItemCondition | "">(
    initialValues?.condition ?? ""
  );
  const [pricePerDay, setPricePerDay] = React.useState(initialValues?.pricePerDay ?? "");
  const [photos, setPhotos] = React.useState<PhotoPreviewItem[]>(initialPhotos ?? []);
  const [errors, setErrors] = React.useState<FieldErrors>({});
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
    if (!description.trim()) nextErrors.description = itemFormCopy.errors.descriptionRequired;
    if (!category.trim()) nextErrors.category = itemFormCopy.errors.categoryRequired;
    if (!condition) nextErrors.condition = itemFormCopy.errors.conditionRequired;

    const priceNumber = Number(pricePerDay);
    if (!pricePerDay.trim()) {
      nextErrors.pricePerDay = itemFormCopy.errors.priceRequired;
    } else if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      nextErrors.pricePerDay = itemFormCopy.errors.priceInvalid;
    }

    if (photos.length === 0) nextErrors.photos = itemFormCopy.errors.photosRequired;

    return nextErrors;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("loading");

    // Simulated network round-trip (mock only — no real persistence yet).
    setTimeout(() => {
      setStatus("success");
    }, 800);
  }

  const isLoading = status === "loading";

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
                onValueChange={(value) => setCondition(value as MockItemCondition)}
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

          {status === "success" && (
            <p role="status" className="text-sm font-medium text-status-positive">
              {mode === "create" ? itemFormCopy.successCreate : itemFormCopy.successEdit}
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="text-sm font-medium text-destructive">
              Gagal menyimpan barang. Coba lagi.
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
