"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, isBlocked } from "@/lib/db";
import { createSession, destroySession, requireAdmin, requireUser } from "@/lib/auth";
import { PRIVATE_DIR, deletePrivate, deletePublic, saveUpload } from "@/lib/uploads";
import { MIN_AGE, PARENTAL_CONSENT_UNDER, ageFrom } from "@/lib/age";
import { REPORT_REASONS } from "@/lib/reports";
import { dayKey } from "@/lib/challenges";

export type FormState = { error?: string } | undefined;

const STORY_HOURS = 24;

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const displayName = String(form.get("display_name") ?? "").trim() || username;
  const password = String(form.get("password") ?? "");
  const birthdate = String(form.get("birthdate") ?? "");
  if (!/^[a-z0-9_.]{3,20}$/.test(username))
    return { error: "Nom d'utilisateur : 3 à 20 caractères (lettres, chiffres, _ ou .)." };
  if (password.length < 6) return { error: "Le mot de passe doit faire au moins 6 caractères." };
  const age = ageFrom(birthdate);
  if (Number.isNaN(age)) return { error: "Indique ta date de naissance." };
  if (age < MIN_AGE) return { error: `Everglow est réservé aux personnes de ${MIN_AGE} ans et plus.` };
  if (age < PARENTAL_CONSENT_UNDER && !form.get("parent_ok"))
    return { error: `Avant ${PARENTAL_CONSENT_UNDER} ans, un parent ou responsable doit être d'accord pour que tu t'inscrives.` };
  if (!form.get("rules_ok")) return { error: "Accepte les règles de la communauté pour créer ton compte." };
  if (db().prepare("SELECT 1 FROM users WHERE username = ?").get(username))
    return { error: "Ce nom d'utilisateur est déjà pris." };
  const hash = await bcrypt.hash(password, 10);
  const res = db()
    .prepare("INSERT INTO users (username, display_name, password_hash, created_at, birthdate) VALUES (?, ?, ?, ?, ?)")
    .run(username, displayName.slice(0, 40), hash, Date.now(), birthdate);
  await createSession(Number(res.lastInsertRowid));
  redirect("/");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const row = db().prepare("SELECT id, password_hash, banned_at FROM users WHERE username = ?").get(username) as
    | { id: number; password_hash: string; banned_at: number | null }
    | undefined;
  if (!row || !(await bcrypt.compare(password, row.password_hash)))
    return { error: "Nom d'utilisateur ou mot de passe incorrect." };
  if (row.banned_at) return { error: "Ce compte a été suspendu pour non-respect des règles de la communauté." };
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
      !isBlocked(senderId, recipient.id) && db().prepare("SELECT 1 FROM follows WHERE (follower_id = ? AND followee_id = ?) OR (follower_id = ? AND followee_id = ?)").get(senderId, recipient.id, recipient.id, senderId));
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
  const post = db().prepare("SELECT user_id FROM posts WHERE id = ?").get(postId) as { user_id: number } | undefined;
  if (!post || isBlocked(user.id, post.user_id)) return;
  const body = String(form.get("body") ?? "").trim().slice(0, 500);
  if (!body) return;
  db().prepare("INSERT INTO comments (user_id, post_id, body, created_at) VALUES (?, ?, ?, ?)").run(user.id, postId, body, Date.now());
  revalidatePath(`/p/${postId}`);
}

export async function toggleFollow(targetId: number) {
  const user = await requireUser();
  if (targetId === user.id || isBlocked(user.id, targetId)) return;
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
  if (!text || recipientId === user.id || isBlocked(user.id, recipientId)) return;
  db().prepare("INSERT INTO messages (sender_id, recipient_id, body, created_at) VALUES (?, ?, ?, ?)").run(user.id, recipientId, text, Date.now());
}

export async function sendSnap(recipientId: number, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const file = form.get("media");
  if (recipientId === user.id || !db().prepare("SELECT 1 FROM users WHERE id = ?").get(recipientId)) return { error: "Destinataire introuvable." };
  if (isBlocked(user.id, recipientId)) return { error: "Vous ne pouvez plus vous écrire." };
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
    if (!u || u.id === userId || !connected(userId, u.id) || isBlocked(userId, u.id)) return { error: "Choisis une personne que tu suis ou qui te suit, ou « Tout le monde »." };
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
  const owner = db().prepare("SELECT user_id FROM halves WHERE id = ?").get(halfId) as { user_id: number } | undefined;
  if (!owner || isBlocked(user.id, owner.user_id)) return { error: "Cette moitié n'est plus disponible." };
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

/* ---------- Safety: block, report, delete account, moderation ---------- */

export async function blockUser(targetId: number) {
  const user = await requireUser();
  if (targetId === user.id) return;
  db().prepare("INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)").run(user.id, targetId, Date.now());
  // Blocking also removes follows both ways, so neither appears in the other's lists.
  db().prepare("DELETE FROM follows WHERE (follower_id = ? AND followee_id = ?) OR (follower_id = ? AND followee_id = ?)").run(user.id, targetId, targetId, user.id);
  revalidatePath("/", "layout");
}

export async function unblockUser(targetId: number) {
  const user = await requireUser();
  db().prepare("DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?").run(user.id, targetId);
  revalidatePath("/", "layout");
}


export async function createReport(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const type = String(form.get("type") ?? "");
  const id = Number(form.get("id"));
  const reason = String(form.get("reason") ?? "");
  const details = String(form.get("details") ?? "").trim().slice(0, 1000);
  if (!["post", "comment", "user"].includes(type) || !Number.isInteger(id)) return { error: "Ce signalement est incomplet." };
  if (!(REPORT_REASONS as readonly string[]).includes(reason)) return { error: "Choisis une raison." };
  const table = type === "post" ? "posts" : type === "comment" ? "comments" : "users";
  if (!db().prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id)) return { error: "Ce contenu n'existe plus." };
  db()
    .prepare("INSERT INTO reports (reporter_id, target_type, target_id, reason, details, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(user.id, type, id, reason, details, Date.now());
  redirect(`/signaler/merci?type=${type}&id=${id}`);
}

/** Every file a user owns or received privately, so nothing is left behind when the account is deleted. */
function filesOf(userId: number) {
  const pub = db()
    .prepare(
      `SELECT media AS f FROM posts WHERE user_id = ? UNION ALL SELECT duo_media FROM posts WHERE user_id = ? OR duo_partner_id = ?
       UNION ALL SELECT media FROM stories WHERE user_id = ? UNION ALL SELECT media FROM halves WHERE user_id = ?
       UNION ALL SELECT avatar FROM users WHERE id = ?`,
    )
    .all(userId, userId, userId, userId, userId, userId) as { f: string | null }[];
  const priv = db()
    .prepare(
      `SELECT media AS f FROM capsules WHERE sender_id = ? OR recipient_id = ?
       UNION ALL SELECT media FROM messages WHERE sender_id = ? OR recipient_id = ?`,
    )
    .all(userId, userId, userId, userId) as { f: string | null }[];
  return { pub: pub.map((r) => r.f).filter(Boolean) as string[], priv: priv.map((r) => r.f).filter(Boolean) as string[] };
}

export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const password = String(form.get("password") ?? "");
  if (!form.get("confirm")) return { error: "Coche la case pour confirmer que tu veux tout supprimer." };
  const row = db().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
  if (!(await bcrypt.compare(password, row.password_hash))) return { error: "Mot de passe incorrect." };
  const files = filesOf(user.id);
  // Moitié-moitié photos they completed for others contain their photo: remove those too.
  db().prepare("DELETE FROM posts WHERE duo_partner_id = ?").run(user.id);
  db().prepare("DELETE FROM users WHERE id = ?").run(user.id);
  await Promise.all([...files.pub.map(deletePublic), ...files.priv.map(deletePrivate)]);
  await destroySession();
  redirect("/login?supprime=1");
}

/** Moderation: dismiss a report, remove the reported content, or suspend the account behind it. */
export async function resolveReport(reportId: number, action: "dismiss" | "remove" | "ban") {
  const admin = await requireAdmin();
  const r = db().prepare("SELECT target_type, target_id FROM reports WHERE id = ?").get(reportId) as { target_type: string; target_id: number } | undefined;
  if (!r) return;
  let ownerId: number | null = null;
  if (r.target_type === "post") ownerId = (db().prepare("SELECT user_id FROM posts WHERE id = ?").get(r.target_id) as { user_id: number } | undefined)?.user_id ?? null;
  else if (r.target_type === "comment") ownerId = (db().prepare("SELECT user_id FROM comments WHERE id = ?").get(r.target_id) as { user_id: number } | undefined)?.user_id ?? null;
  else ownerId = r.target_id;

  if (action === "remove" && r.target_type === "post") {
    const p = db().prepare("SELECT media, duo_media FROM posts WHERE id = ?").get(r.target_id) as { media: string; duo_media: string | null } | undefined;
    db().prepare("DELETE FROM posts WHERE id = ?").run(r.target_id);
    if (p) await Promise.all([p.media, p.duo_media].filter(Boolean).map((f) => deletePublic(f as string)));
  }
  if (action === "remove" && r.target_type === "comment") db().prepare("DELETE FROM comments WHERE id = ?").run(r.target_id);
  if (action === "ban" && ownerId && ownerId !== admin.id) {
    db().prepare("UPDATE users SET banned_at = ? WHERE id = ?").run(Date.now(), ownerId);
    db().prepare("DELETE FROM sessions WHERE user_id = ?").run(ownerId);
  }
  const label = action === "dismiss" ? "ignoré" : action === "remove" ? "contenu supprimé" : "compte suspendu";
  // Closes every open report about the same thing.
  db()
    .prepare("UPDATE reports SET resolved_at = ?, resolution = ? WHERE target_type = ? AND target_id = ? AND resolved_at IS NULL")
    .run(Date.now(), label, r.target_type, r.target_id);
  revalidatePath("/admin");
}

export async function unbanUser(userId: number) {
  await requireAdmin();
  db().prepare("UPDATE users SET banned_at = NULL WHERE id = ?").run(userId);
  revalidatePath("/admin");
}
