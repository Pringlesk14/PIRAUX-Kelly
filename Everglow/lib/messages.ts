import { db } from "./db";

export type Message = { id: number; sender_id: number; body: string; created_at: number };

/** Messages between two users after `afterId`, marking the received ones as read. */
export function conversation(meId: number, otherId: number, afterId = 0): Message[] {
  const rows = db()
    .prepare(
      `SELECT id, sender_id, body, created_at FROM messages
        WHERE id > ? AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
        ORDER BY id LIMIT 500`,
    )
    .all(afterId, meId, otherId, otherId, meId) as unknown as Message[];
  db().prepare("UPDATE messages SET read_at = ? WHERE recipient_id = ? AND sender_id = ? AND read_at IS NULL").run(Date.now(), meId, otherId);
  return rows;
}
