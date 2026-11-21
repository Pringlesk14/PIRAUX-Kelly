import { requireUser } from "@/lib/auth";
import { db, hiddenIds } from "@/lib/db";
import { ACCEPT } from "@/lib/uploads";
import { CreateForm } from "@/components/CreateForm";
import { themeFor, dayKey } from "@/lib/challenges";

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const me = await requireUser();
  const type = (await searchParams).type;
  const target = type === "story" || type === "capsule" || type === "half" ? type : "post";
  // Capsules can be sent to people you follow or who follow you.
  const people = db()
    .prepare(
      `SELECT username, display_name FROM users WHERE id != ? AND id NOT IN (${hiddenIds(me.id)}) AND id IN (
         SELECT followee_id FROM follows WHERE follower_id = ? UNION SELECT follower_id FROM follows WHERE followee_id = ?)
       ORDER BY display_name`,
    )
    .all(me.id, me.id, me.id) as { username: string; display_name: string }[];
  return (
    <main className="page">
      <h1 className="page-title">Créer</h1>
      <CreateForm accept={ACCEPT} initialTarget={target} me={me.username} people={people} challengeTitle={themeFor(dayKey())} />
    </main>
  );
}
