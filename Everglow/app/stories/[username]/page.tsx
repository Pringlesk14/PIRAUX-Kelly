import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, hiddenIds, isBlocked } from "@/lib/db";
import { StoryViewer } from "@/components/StoryViewer";

export const dynamic = "force-dynamic";

export default async function StoriesPage({ params }: { params: Promise<{ username: string }> }) {
  const me = await requireUser();
  const { username } = await params;
  const author = db().prepare("SELECT id, username, display_name, avatar FROM users WHERE username = ?").get(username) as
    | { id: number; username: string; display_name: string; avatar: string | null }
    | undefined;
  if (!author || (author.id !== me.id && isBlocked(me.id, author.id))) notFound();
  const now = Date.now();
  const stories = db()
    .prepare("SELECT id, kind, media, created_at FROM stories WHERE user_id = ? AND expires_at > ? ORDER BY created_at")
    .all(author.id, now) as unknown as { id: number; kind: "video" | "photo"; media: string; created_at: number }[];
  if (stories.length === 0) notFound();
  // Next person in the stories bar order, so stories play one after another.
  const order = db()
    .prepare(
      `SELECT u.username FROM stories s JOIN users u ON u.id = s.user_id
        WHERE s.expires_at > ? AND s.user_id != ? AND s.user_id NOT IN (${hiddenIds(me.id)}) GROUP BY u.id ORDER BY MAX(s.created_at) DESC`,
    )
    .all(now, me.id) as unknown as { username: string }[];
  const idx = order.findIndex((o) => o.username === author.username);
  const nextUser = author.id === me.id ? order[0]?.username ?? null : order[idx + 1]?.username ?? null;
  return <StoryViewer author={author} stories={stories} nextUser={nextUser} />;
}
