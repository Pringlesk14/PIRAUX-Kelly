import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db, isBlocked } from "@/lib/db";
import { conversation, streakDays } from "@/lib/messages";

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const other = db().prepare("SELECT id FROM users WHERE username = ?").get((await params).username) as { id: number } | undefined;
  if (!other) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (isBlocked(me.id, other.id)) return NextResponse.json({ error: "blocked" }, { status: 403 });
  return NextResponse.json({ messages: conversation(me.id, other.id), streak: streakDays(me.id, other.id) });
}
