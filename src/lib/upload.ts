import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local filesystem upload helper for item photos, per `docs/decision-log.md`
 * "Storage foto barang di filesystem lokal" and `docs/technical-spec.md` §10
 * (`./uploads`, gitignored, persistent Docker volume in production).
 *
 * Files are written under `<project root>/uploads/items/<itemId>/<filename>`
 * — kept outside `public/` so nothing forces us to serve them as build-time
 * static assets; they're instead streamed back by
 * `src/app/uploads/[...path]/route.ts`, which lets both local dev and the
 * production VPS volume work the same way.
 */

// Assumption (not specified elsewhere in docs): 5MB per file, JPEG/PNG/WebP
// only. Revisit if a stricter/looser limit is decided later.
export const MAX_ITEM_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const ALLOWED_ITEM_PHOTO_MIME_TYPES = Object.keys(ALLOWED_MIME_TO_EXTENSION);

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const ITEM_PHOTOS_DIR = "items";

export class InvalidFileTypeError extends Error {
  constructor(mimeType: string) {
    super(`File type "${mimeType}" is not allowed.`);
    this.name = "InvalidFileTypeError";
  }
}

export class FileTooLargeError extends Error {
  constructor(size: number) {
    super(`File size ${size} bytes exceeds the ${MAX_ITEM_PHOTO_SIZE_BYTES} bytes limit.`);
    this.name = "FileTooLargeError";
  }
}

/** Validates type/size of an uploaded photo without touching the filesystem. */
export function validateItemPhotoFile(file: File): void {
  if (!ALLOWED_MIME_TO_EXTENSION[file.type]) {
    throw new InvalidFileTypeError(file.type);
  }
  if (file.size > MAX_ITEM_PHOTO_SIZE_BYTES) {
    throw new FileTooLargeError(file.size);
  }
}

/**
 * Writes a validated item photo to `uploads/items/<itemId>/<uuid>.<ext>` and
 * returns the public-facing URL (served via `/uploads/items/...`) plus the
 * generated filename. Caller is expected to have called
 * `validateItemPhotoFile` first.
 */
export async function saveItemPhotoFile(
  itemId: string,
  file: File
): Promise<{ url: string; filename: string }> {
  const extension = ALLOWED_MIME_TO_EXTENSION[file.type] ?? "bin";
  const filename = `${randomUUID()}.${extension}`;

  const itemDir = path.join(UPLOAD_ROOT, ITEM_PHOTOS_DIR, itemId);
  await mkdir(itemDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(itemDir, filename), buffer);

  return { url: `/uploads/${ITEM_PHOTOS_DIR}/${itemId}/${filename}`, filename };
}
