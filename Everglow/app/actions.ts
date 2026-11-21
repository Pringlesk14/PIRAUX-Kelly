"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, destroySession, requireUser } from "@/lib/auth";
import { PRIVATE_DIR, deletePublic, saveUpload } from "@/lib/uploads";
import { dayKey } from "@/lib/challenges";

export type FormState = { error?: string } | undefined;

const STORY_HOURS = 24;

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const displayName = String(form.get("display_name") ?? "").trim() || username;
  const password = String(form.get("password") ?? "");
  if (!/^[a-z0-9_.]{3,20}$/.test(username))
    return { error: "Nom d'utilisateur : 3 à 20 caractères (lettres, chiffres, _ ou .)." };
  if (password.length < 6) return { error: "Le mot de passe doit faire au moins 6 caractères." };
  if (db().prepare("SELECT 1 FROM users WHERE username = ?").get(username))
    return { error: "Ce nom d'utilisateur est déjà pris." };
  const hash = await bcrypt.hash(password, 10);
  const res = db()
    .prepare("INSERT INTO users (username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?)")
    .run(username, displayName.slice(0, 40), hash, Date.now());
  await createSession(Number(res.lastInsertRowid));
  redirect("/");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const row = db().prepare("SELECT id, password_hash FROM users WHERE username = ?").get(username) as
    | { id: number; password_hash: string }
    | undefined;
  if (!row || !(await bcrypt.compare(password, row.password_hash)))
    return { error: "Nom d'utilisateur ou mot de passe incorrect." };
  await createSession(row.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function createPost(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const target = String(form.get("target") ?? "post");
  if (target === "capsule") return createCapsule(user.id, form);
  if (target === "half") return createHalf(user.id, form);
  const file = form.get("media");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisis une vidéo ou une photo." };
  if (target === "post" && !file.type.startsWith("video/")) return { error: "Choisis une vidéo. Les photos se partagent en Moitié-moitié." };
  let saved;
  try {
    saved = await saveUpload(file);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const now = Date.now();
  if (target === "story") {
    db()
      .prepare("INSERT INTO stories (user_id, kind, media, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
      .run(user.id, saved.kind, saved.name, now, now + STORY_HOURS * 3600 * 1000);
    revalidatePath("/photos");
    redirect("/photos");
  }
  const caption = String(form.get("caption") ?? "").trim().slice(0, 500);
  const challengeDay = form.get("challenge") ? dayKey(now) : null;
  db()
    .prepare("INSERT INTO posts (user_id, kind, media, caption, created_at, challenge_day) VALUES (?, ?, ?, ?, ?, ?)")
    .run(user.id, saved.kind, saved.name, caption, now, challengeDay);
  revalidatePath("/");
  redirect(challengeDay ? "/" : "/?tab=abonnements");
}

const CAPSULE_DELAYS: Record<string, number> = {
  "1min": 60_000,
  "1h": 3600_000,
  "1d": 86400_000,
  "1w": 7 * 86400_000,
  "1m": 30 * 86400_000,
  "1y": 365 * 86400_000,
};
const CAPSULE_MAX_MS = 50 * 365 * 86400_000;

async function createCapsule(senderId: number, form: FormData): Promise<FormState> {
  const title = String(form.get("title") ?? "").trim().slice(0, 60);
  const message = String(form.get("message") ?? "").trim().slice(0, 1000);
  const to = String(form.get("to") ?? "").trim().toLowerCase();
  const when = String(form.get("when") ?? "");
  const file = form.get("media");
  const hasFile = file instanceof File && file.size > 0;
  if (!title) return { error: "Donne un titre à ta capsule." };
  if (!hasFile && !message) return { error: "Ajoute un message, une photo ou une vidéo à ta capsule." };
  const recipient = db().prepare("SELECT id FROM users WHERE username = ?").get(to) as { id: number } | undefined;
  const connected =
    recipient &&
    (recipient.id === senderId ||
      db().prepare("SELECT 1 FROM follows WHERE (follower_id = ? AND followee_id = ?) OR (follower_id = ? AND followee_id = ?)").get(senderId, recipient.id, recipient.id, senderId));
  if (!recipient || !connected) return { error: "Choisis à qui envoyer la capsule : toi-même, ou une personne que tu suis ou qui te suit." };
  const now = Date.now();
  let openAt: number;
  if (when === "date") {
    const day = String(form.get("date") ?? "");
    openAt = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T00:00:00`).getTime() : NaN;
    if (Number.isNaN(openAt)) return { error: "Choisis la date d'ouverture." };
    if (openAt <= now) return { error: "Choisis une date dans le futur." };
    if (openAt > now + CAPSULE_MAX_MS) return { error: "Une capsule peut être scellée pour 50 ans maximum." };
  } else if (CAPSULE_DELAYS[when]) {
    openAt = now + CAPSULE_DELAYS[when];
  } else {
    return { error: "Choisis quand la capsule s'ouvrira." };
  }
  let media: { name: string; kind: string } | null = null;
  if (hasFile) {
    try {
      media = await saveUpload(file as File, { dir: PRIVATE_DIR });
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
  db()
    .prepare(
      `INSERT INTO capsules (sender_id, recipient_id, title, message, media, media_kind, created_at, open_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(senderId, recipient.id, title, message, media?.name ?? null, media?.kind ?? null, now, openAt);
  revalidatePath("/capsules");
  redirect("/capsules");
}

export async function deletePost(postId: number) {
  const user = await requireUser();
  db().prepare("DELETE FROM posts WHERE id = ? AND user_id = ?").run(postId, user.id);
  redirect(`/u/${user.username}`);
}

export async function toggleLike(postId: number) {
  const user = await requireUser();
  const del = db().prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?").run(user.id, postId);
  if (del.changes === 0) db().prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").run(user.id, postId);
  const { n } = db().prepare("SELECT COUNT(*) AS n FROM likes WHERE post_id = ?").get(postId) as { n: number };
  return { liked: del.changes === 0, count: n };
}

export async function addComment(postId: number, form: FormData) {
  const user = await requireUser();
  const body = String(form.get("body") ?? "").trim().slice(0, 500);
  if (!body) return;
  db().prepare("INSERT INTO comments (user_id, post_id, body, created_at) VALUES (?, ?, ?, ?)").run(user.id, postId, body, Date.now());
  revalidatePath(`/p/${postId}`);
}

export async function toggleFollow(targetId: number) {
  const user = await requireUser();
  if (targetId === user.id) return;
  const del = db().prepare("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?").run(user.id, targetId);
  if (del.changes === 0) db().prepare("INSERT OR IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)").run(user.id, targetId);
  revalidatePath("/u/[username]", "page");
}

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const displayName = String(form.get("display_name") ?? "").trim().slice(0, 40) || user.username;
  const bio = String(form.get("bio") ?? "").trim().slice(0, 200);
  let avatar = user.avatar;
  const file = form.get("avatar");
  if (file instanceof File && file.size > 0) {
    try {
      avatar = (await saveUpload(file, { onlyPhotos: true })).name;
    } catch (e) {
      return { error: (e as Error).message };
    }
  }
  db().prepare("UPDATE users SET display_name = ?, bio = ?, avatar = ? WHERE id = ?").run(displayName, bio, avatar, user.id);
  redirect(`/u/${user.username}`);
}

export async function sendMessage(recipientId: number, body: string) {
  const user = await requireUser();
  const text = body.trim().slice(0, 2000);
  if (!text || recipientId === user.id) return;
  db().prepare("INSERT INTO messages (sender_id, recipient_id, body, created_at) VALUES (?, ?, ?, ?)").run(user.id, recipientId, text, Date.now());
}

export async function sendSnap(recipientId: number, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const file = form.get("media");
  if (recipientId === user.id || !db().prepare("SELECT 1 FROM users WHERE id = ?").get(recipientId)) return { error: "Destinataire introuvable." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choisis une photo ou une vidéo." };
  let saved;
  try {
    saved = await saveUpload(file, { dir: PRIVATE_DIR });
  } catch (e) {
    return { error: (e as Error).message };
  }
  db()
    .prepare("INSERT INTO messages (sender_id, recipient_id, body, created_at, kind, media, media_kind) VALUES (?, ?, '', ?, 'snap', ?, ?)")
    .run(user.id, recipientId, Date.now(), saved.name, saved.kind);
  revalidatePath("/messages");
}

/** Opens a received snap. It can only be opened once: returns null if it was already opened. */
export async function openSnap(messageId: number): Promise<{ kind: "video" | "photo" } | null> {
  const user = await requireUser();
  const now = Date.now();
  const res = db()
    .prepare("UPDATE messages SET opened_at = ?, read_at = ? WHERE id = ? AND recipient_id = ? AND kind = 'snap' AND opened_at IS NULL AND media IS NOT NULL")
    .run(now, now, messageId, user.id);
  if (res.changes === 0) return null;
  const m = db().prepare("SELECT media_kind FROM messages WHERE id = ?").get(messageId) as { media_kind: "video" | "photo" };
  return { kind: m.media_kind };
}

/* ---------- Moitié-moitié ---------- */

const HALF_MS = 24 * 3600 * 1000;

/** True if `a` follows `b` or `b` follows `a`. */
function connected(a: number, b: number) {
  return !!db().prepare("SELECT 1 FROM follows WHERE (follower_id = ? AND followee_id = ?) OR (follower_id = ? AND followee_id = ?)").get(a, b, b, a);
}

/** Posts the left half of a photo (cropped on the device), waiting 24 h for someone to complete it. */
async function createHalf(userId: number, form: FormData): Promise<FormState> {
  const file = form.get("media");
  if (!(file instanceof File) || file.size === 0 || !file.type.startsWith("image/")) return { error: "Choisis une photo." };
  const caption = String(form.get("caption") ?? "").trim().slice(0, 200);
  const invite = String(form.get("invite") ?? "").trim().toLowerCase();
  let invitedId: number | null = null;
  if (invite) {
    const u = db().prepare("SELECT id FROM users WHERE username = ?").get(invite) as { id: number } | undefined;
    if (!u || u.id === userId || !connected(userId, u.id)) return { error: "Choisis une personne que tu suis ou qui te suit, ou « Tout le monde »." };
    invitedId = u.id;
  }
  let saved;
  try {
    saved = await saveUpload(file, { onlyPhotos: true });
  } catch (e) {
    return { error: (e as Error).message };
  }
  const now = Date.now();
  db()
    .prepare("INSERT INTO halves (user_id, media, caption, invited_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(userId, saved.name, caption, invitedId, now, now + HALF_MS);
  revalidatePath("/photos");
  redirect("/photos");
}

/** Completes someone's half with the right half of your photo, and publishes the result. */
export async function completeHalf(halfId: number, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const file = form.get("media");
  if (!(file instanceof File) || file.size === 0) return { error: "Ajoute ta moitié de photo." };
  let saved;
  try {
    saved = await saveUpload(file, { onlyPhotos: true });
  } catch (e) {
    return { error: (e as Error).message };
  }
  const now = Date.now();
  // Claims the half in one statement, so two people can't complete it at the same time.
  const claim = db()
    .prepare(
      `UPDATE halves SET completed_at = ? WHERE id = ? AND completed_at IS NULL AND expires_at > ?
         AND user_id != ? AND (invited_id IS NULL OR invited_id = ?)`,
    )
    .run(now, halfId, now, user.id, user.id);
  if (claim.changes === 0) {
    await deletePublic(saved.name);
    return { error: "Trop tard : cette moitié a déjà été complétée, ou ses 24 h sont passées." };
  }
  const half = db().prepare("SELECT user_id, media, caption FROM halves WHERE id = ?").get(halfId) as { user_id: number; media: string; caption: string };
  const post = db()
    .prepare("INSERT INTO posts (user_id, kind, media, caption, created_at, duo_partner_id, duo_media) VALUES (?, 'photo', ?, ?, ?, ?, ?)")
    .run(half.user_id, half.media, half.caption, now, user.id, saved.name);
  db().prepare("UPDATE halves SET post_id = ? WHERE id = ?").run(Number(post.lastInsertRowid), halfId);
  revalidatePath("/photos");
  redirect(`/p/${post.lastInsertRowid}`);
}
