import Link from "next/link";
import { db, type User } from "@/lib/db";
import { Avatar } from "./Avatar";

type Row = { id: number; username: string; display_name: string; avatar: string | null };

export function StoriesBar({ user }: { user: User }) {
  const people = db()
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.avatar, MAX(s.created_at) AS last
         FROM stories s JOIN users u ON u.id = s.user_id
        WHERE s.expires_at > ? AND s.user_id != ?
        GROUP BY u.id ORDER BY last DESC`,
    )
    .all(Date.now(), user.id) as unknown as Row[];
  const mine = db().prepare("SELECT COUNT(*) AS n FROM stories WHERE user_id = ? AND expires_at > ?").get(user.id, Date.now()) as { n: number };
  return (
    <div className="stories">
      <Link href={mine.n ? `/stories/${user.username}` : "/create?type=story"} className="story-item">
        <span className={`story-add avatar-ring${mine.n ? "" : " seen"}`}>
          <Avatar user={user} size={60} />
          {!mine.n && <span className="plus">+</span>}
        </span>
        <span>Ta story</span>
      </Link>
      {mine.n > 0 && (
        <Link href="/create?type=story" className="story-item" aria-label="Ajouter une story">
          <span className="avatar-ring seen"><span className="avatar" style={{ width: 60, height: 60, fontSize: 28 }}>+</span></span>
          <span>Ajouter</span>
        </Link>
      )}
      {people.map((p) => (
        <Link key={p.id} href={`/stories/${p.username}`} className="story-item">
          <span className="avatar-ring"><Avatar user={p} size={60} /></span>
          <span>{p.username}</span>
        </Link>
      ))}
    </div>
  );
}
