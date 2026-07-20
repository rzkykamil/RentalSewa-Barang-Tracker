"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface PhotoPreviewItem {
  /** Local key for React list rendering; not persisted anywhere. */
  id: string;
  url: string;
}

interface PhotoUploadPreviewProps {
  photos: PhotoPreviewItem[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

/**
 * Multi-photo local preview grid for the item form (create/edit). Follows
 * the same `URL.createObjectURL` pattern as the avatar preview in
 * src/components/profile/ProfileForm.tsx, extended to multiple files —
 * there is no real upload yet, previews are local blob URLs only.
 */
export function PhotoUploadPreview({
  photos,
  onAdd,
  onRemove,
  disabled,
}: PhotoUploadPreviewProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      onAdd(event.target.files);
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
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview only, not a remote asset */}
          <img src={photo.url} alt="Pratinjau foto barang" className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(photo.id)}
            disabled={disabled}
            aria-label="Hapus foto"
            className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground ring-1 ring-foreground/10 hover:bg-destructive/20 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input text-xs text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden="true" />
        Tambah Foto
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleChange}
        aria-label="Unggah foto barang"
      />
    </div>
  );
}
