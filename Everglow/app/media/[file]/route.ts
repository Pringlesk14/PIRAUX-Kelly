import path from "node:path";
import { UPLOAD_DIR } from "@/lib/uploads";
import { serveFile } from "@/lib/serve";

// Public files: posts, stories and profile photos.
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[a-f0-9-]+\.[a-z0-9]+$/.test(file)) return new Response("Not found", { status: 404 });
  return serveFile(path.join(UPLOAD_DIR, file), req, "public, max-age=31536000, immutable");
}
