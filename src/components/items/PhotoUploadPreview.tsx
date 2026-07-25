"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

export interface PhotoPreviewItem {
  /** Local key for React list rendering; not persisted anywhere. */
  id: string;
  url: string;
  /**
   * The raw `File` for a locally-added photo pending upload (create mode).
   * Absent for already-persisted photos rendered read-only (edit mode) —
   * `PATCH /api/v1/items/:id` doesn't accept photo uploads, see
   * `src/components/items/ItemForm.tsx`.
   */
  file?: File;
}

interface PhotoUploadPreviewProps {
  photos: PhotoPreviewItem[];
  onAdd?: (files: FileList) => void;
  onRemove?: (id: string) => void;
  disabled?: boolean;
  /** Hides the add/remove controls — used to show an item's existing photos in edit mode. */
  readOnly?: boolean;
}

/**
 * Multi-photo preview grid for the item form (create/edit). In create mode,
 * newly selected files are kept as local blob URL previews (via
 * `URL.createObjectURL`) alongside the raw `File`, which the form later
 * appends to the `multipart/form-data` request body for `POST /api/v1/items`.
 * In edit mode (`readOnly`), it only renders existing photos — no upload UI.
 */
export function PhotoUploadPreview({
  photos,
  onAdd,
  onRemove,
  disabled,
  readOnly = false,
}: PhotoUploadPreviewProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      onAdd?.(event.target.files);
    }
    // Reset so selecting the same file again still triggers onChange.
    event.target.value = "";
  }

  return (
    <div className="flex flex-wrap gap-3">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview or served from local uploads route, not a remote asset */}
          <img src={photo.url} alt="Pratinjau foto barang" className="size-full object-cover" />
          {!readOnly && (
            <button
              type="button"
              onClick={() => onRemove?.(photo.id)}
              disabled={disabled}
              aria-label="Hapus foto"
              className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground ring-1 ring-foreground/10 hover:bg-destructive/20 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input text-xs text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden="true" />
          Tambah Foto
        </button>
      )}

      {!readOnly && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleChange}
          aria-label="Unggah foto barang"
        />
      )}

      {photos.length === 0 && readOnly && (
        <p className="text-xs text-muted-foreground">Belum ada foto untuk barang ini.</p>
      )}
    </div>
  );
}
