"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, destroySession, requireUser } from "@/lib/auth";
import { saveUpload } from "@/lib/uploads";

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
  const file = form.get("media");
  const target = String(form.get("target") ?? "post");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisis une vidéo ou une photo." };
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
  db()
    .prepare("INSERT INTO posts (user_id, kind, media, caption, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(user.id, saved.kind, saved.name, caption, now);
  revalidatePath("/");
  redirect(saved.kind === "video" ? "/" : "/photos");
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
      avatar = (await saveUpload(file, true)).name;
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
