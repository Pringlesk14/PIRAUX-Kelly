import fs from "node:fs";
import { Readable } from "node:stream";

const MIME: Record<string, string> = {
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
  jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
};

/** Streams a file, with Range support so videos can play and seek. */
export function serveFile(full: string, req: Request, cacheControl: string) {
  let size: number;
  try {
    size = fs.statSync(full).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const type = MIME[full.split(".").pop()!] ?? "application/octet-stream";
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": cacheControl };
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") ?? "");
  if (m) {
    const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(Readable.toWeb(fs.createReadStream(full, { start, end })) as ReadableStream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(Readable.toWeb(fs.createReadStream(full)) as ReadableStream, { headers: { ...headers, "Content-Length": String(size) } });
}
