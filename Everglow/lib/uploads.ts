import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const TYPES: Record<string, { ext: string; kind: "video" | "photo" }> = {
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
  "video/quicktime": { ext: "mov", kind: "video" },
  "image/jpeg": { ext: "jpg", kind: "photo" },
  "image/png": { ext: "png", kind: "photo" },
  "image/webp": { ext: "webp", kind: "photo" },
  "image/gif": { ext: "gif", kind: "photo" },
};

export const ACCEPT = Object.keys(TYPES).join(",");

/** Saves an uploaded file and returns its public name and kind. */
export async function saveUpload(file: File, onlyPhotos = false) {
  const type = TYPES[file.type];
  if (!type || (onlyPhotos && type.kind !== "photo")) throw new Error("Format de fichier non pris en charge.");
  if (file.size === 0) throw new Error("Le fichier est vide.");
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${type.ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { name, kind: type.kind };
}
