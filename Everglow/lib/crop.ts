/**
 * Keeps one half of a photo, in the browser, before it is uploaded:
 * the other half never leaves the phone.
 */
export async function cropHalf(file: File, side: "left" | "right", maxHeight = 1600): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxHeight / bitmap.height);
  const halfWidth = Math.floor(bitmap.width / 2);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(halfWidth * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const sx = side === "left" ? 0 : bitmap.width - halfWidth;
  canvas.getContext("2d")!.drawImage(bitmap, sx, 0, halfWidth, bitmap.height, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Impossible de préparer la photo."))), "image/jpeg", 0.9),
  );
  return new File([blob], `${side}.jpg`, { type: "image/jpeg" });
}
