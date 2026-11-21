import { db } from "./db";

/** A short description of what is being reported, shown on the report form and in moderation. */
export function describeTarget(type: string, id: number): { label: string; href: string | null; owner: string | null; text: string | null } | null {
  if (type === "post") {
    const p = db().prepare("SELECT p.kind, p.caption, u.username FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?").get(id) as
      | { kind: string; caption: string; username: string }
      | undefined;
    return p ? { label: `${p.kind === "video" ? "Vidéo" : "Photo"} de @${p.username}`, href: `/p/${id}`, owner: p.username, text: p.caption || null } : null;
  }
  if (type === "comment") {
    const c = db().prepare("SELECT c.body, c.post_id, u.username FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?").get(id) as
      | { body: string; post_id: number; username: string }
      | undefined;
    return c ? { label: `Commentaire de @${c.username}`, href: `/p/${c.post_id}`, owner: c.username, text: c.body } : null;
  }
  if (type === "user") {
    const u = db().prepare("SELECT username FROM users WHERE id = ?").get(id) as { username: string } | undefined;
    return u ? { label: `Compte @${u.username}`, href: `/u/${u.username}`, owner: u.username, text: null } : null;
  }
  return null;
}
