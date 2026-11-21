import path from "node:path";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PRIVATE_DIR } from "@/lib/uploads";
import { serveFile } from "@/lib/serve";
import { SNAP_WINDOW_MS } from "@/lib/messages";

// A snap is only given to its recipient, during the short window after they opened it.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  const m = db().prepare("SELECT recipient_id, media, opened_at FROM messages WHERE id = ? AND kind = 'snap'").get(Number((await params).id)) as
    | { recipient_id: number; media: string | null; opened_at: number | null }
    | undefined;
  const ok = me && m && m.media && m.recipient_id === me.id && m.opened_at && Date.now() - m.opened_at < SNAP_WINDOW_MS;
  if (!ok) return new Response("Not found", { status: 404 });
  return serveFile(path.join(PRIVATE_DIR, m!.media!), req, "private, no-store");
}
