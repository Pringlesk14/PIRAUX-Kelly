import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/time";
import { streakDays } from "@/lib/messages";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

type Conv = { id: number; username: string; display_name: string; avatar: string | null; body: string; kind: "text" | "snap"; opened_at: number | null; created_at: number; sender_id: number; unread: number };
type Person = { id: number; username: string; display_name: string; avatar: string | null };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await requireUser();
  const q = ((await searchParams).q ?? "").trim();
  const convs = db()
    .prepare(
      `WITH last AS (
         SELECT CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS other, MAX(id) AS mid
           FROM messages WHERE sender_id = ? OR recipient_id = ? GROUP BY other)
       SELECT u.id, u.username, u.display_name, u.avatar, m.body, m.kind, m.opened_at, m.created_at, m.sender_id,
              (SELECT COUNT(*) FROM messages x WHERE x.sender_id = u.id AND x.recipient_id = ? AND x.read_at IS NULL) AS unread
         FROM last JOIN messages m ON m.id = last.mid JOIN users u ON u.id = last.other
        ORDER BY m.id DESC`,
    )
    .all(me.id, me.id, me.id, me.id) as unknown as Conv[];
  const people = q
    ? (db()
        .prepare("SELECT id, username, display_name, avatar FROM users WHERE id != ? AND (username LIKE ? OR display_name LIKE ?) ORDER BY username LIMIT 20")
        .all(me.id, `%${q}%`, `%${q}%`) as unknown as Person[])
    : [];

  return (
    <main>
      <header className="topbar"><b style={{ fontSize: 18 }}>Messages</b></header>
      <form className="page" style={{ paddingBottom: 4 }}>
        <input className="input" name="q" defaultValue={q} placeholder="Rechercher quelqu'un…" autoComplete="off" />
      </form>
      {q && (
        <div className="search-results">
          {people.length === 0 && <p className="empty" style={{ padding: 16 }}>Personne ne correspond à « {q} ».</p>}
          {people.map((p) => (
            <div key={p.id} className="list-item">
              <Link href={`/u/${p.username}`}><Avatar user={p} size={44} /></Link>
              <Link href={`/u/${p.username}`} style={{ flex: 1 }}><b>{p.display_name}</b><div className="preview">@{p.username}</div></Link>
              <Link href={`/messages/${p.username}`} className="btn secondary" style={{ padding: "6px 14px", fontSize: 13 }}>Écrire</Link>
            </div>
          ))}
        </div>
      )}
      {!q && convs.length === 0 && <p className="empty">Aucune conversation. Recherche quelqu&apos;un pour lui écrire.</p>}
      {!q &&
        convs.map((c) => (
          <Link key={c.id} href={`/messages/${c.username}`} className="list-item">
            <Avatar user={c} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{c.display_name}</b>{(() => { const n = streakDays(me.id, c.id); return n > 0 ? <span className="streak">🔥 {n}</span> : null; })()}
              <div className="preview" style={c.unread ? { color: "var(--text)", fontWeight: 600 } : undefined}>
                {c.kind === "snap"
                  ? c.sender_id === me.id ? (c.opened_at ? "Snap ouvert ✓" : "Snap envoyé") : c.opened_at ? "Snap ouvert" : "📸 Nouveau snap"
                  : `${c.sender_id === me.id ? "Toi : " : ""}${c.body}`} · {timeAgo(c.created_at)}
              </div>
            </div>
            {c.unread > 0 && <span className="unread-dot" />}
          </Link>
        ))}
    </main>
  );
}
