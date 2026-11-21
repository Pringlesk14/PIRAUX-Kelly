import { db } from "./db";
import { deletePrivate } from "./uploads";

/** How long a snap's file stays reachable after it was opened, then it is deleted. */
export const SNAP_WINDOW_MS = 2 * 60 * 1000;

export type Message = {
  id: number;
  sender_id: number;
  body: string;
  created_at: number;
  kind: "text" | "snap";
  media_kind: "video" | "photo" | null;
  opened_at: number | null;
};

/** Deletes the files of snaps that were opened more than SNAP_WINDOW_MS ago. */
function purgeOpenedSnaps() {
  const old = db()
    .prepare("SELECT id, media FROM messages WHERE kind = 'snap' AND media IS NOT NULL AND opened_at IS NOT NULL AND opened_at < ?")
    .all(Date.now() - SNAP_WINDOW_MS) as { id: number; media: string }[];
  for (const s of old) {
    deletePrivate(s.media).catch(() => {});
    db().prepare("UPDATE messages SET media = NULL WHERE id = ?").run(s.id);
  }
}

/** The conversation between two users, marking received text messages as read. */
export function conversation(meId: number, otherId: number): Message[] {
  purgeOpenedSnaps();
  const rows = db()
    .prepare(
      `SELECT id, sender_id, body, created_at, kind, media_kind, opened_at FROM messages
        WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
        ORDER BY id DESC LIMIT 300`,
    )
    .all(meId, otherId, otherId, meId) as unknown as Message[];
  // Snaps stay "unread" until they are opened.
  db().prepare("UPDATE messages SET read_at = ? WHERE recipient_id = ? AND sender_id = ? AND read_at IS NULL AND kind = 'text'").run(Date.now(), meId, otherId);
  return rows.reverse();
}

const dayIndex = (d: string) => Math.round(Date.parse(d + "T00:00:00Z") / 86400000);

/** Number of consecutive days, up to today or yesterday, on which the two users exchanged snaps. */
export function streakDays(a: number, b: number): number {
  const rows = db()
    .prepare(
      `SELECT DISTINCT date(created_at / 1000, 'unixepoch', 'localtime') AS d FROM messages
        WHERE kind = 'snap' AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
        ORDER BY d DESC`,
    )
    .all(a, b, b, a) as { d: string }[];
  const today = dayIndex((db().prepare("SELECT date('now', 'localtime') AS t").get() as { t: string }).t);
  let expected = rows.length && dayIndex(rows[0].d) === today ? today : today - 1;
  let n = 0;
  for (const r of rows) {
    if (dayIndex(r.d) !== expected) break;
    n++;
    expected--;
  }
  return n;
}
