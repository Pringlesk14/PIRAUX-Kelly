import path from "node:path";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PRIVATE_DIR } from "@/lib/uploads";
import { serveFile } from "@/lib/serve";

// A capsule's file is only given to its recipient, and only once its date has come.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  const c = db().prepare("SELECT recipient_id, media, open_at FROM capsules WHERE id = ?").get(Number((await params).id)) as
    | { recipient_id: number; media: string | null; open_at: number }
    | undefined;
  if (!me || !c || !c.media || c.recipient_id !== me.id || c.open_at > Date.now()) return new Response("Not found", { status: 404 });
  return serveFile(path.join(PRIVATE_DIR, c.media), req, "private, no-store");
}
