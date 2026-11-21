import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation } from "@/lib/messages";

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const other = db().prepare("SELECT id FROM users WHERE username = ?").get((await params).username) as { id: number } | undefined;
  if (!other) return NextResponse.json({ error: "not found" }, { status: 404 });
  const after = Number(new URL(req.url).searchParams.get("after") ?? 0) || 0;
  return NextResponse.json(conversation(me.id, other.id, after));
}
