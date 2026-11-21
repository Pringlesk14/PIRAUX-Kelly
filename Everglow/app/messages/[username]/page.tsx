import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation } from "@/lib/messages";
import { Avatar } from "@/components/Avatar";
import { Chat } from "@/components/Chat";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ username: string }> }) {
  const me = await requireUser();
  const other = db().prepare("SELECT id, username, display_name, avatar FROM users WHERE username = ?").get((await params).username) as
    | { id: number; username: string; display_name: string; avatar: string | null }
    | undefined;
  if (!other || other.id === me.id) notFound();
  return (
    <main className="chat">
      <header className="topbar">
        <Link href="/messages" className="icon-btn" aria-label="Retour"><Icon name="back" /></Link>
        <Link href={`/u/${other.username}`} className="row">
          <Avatar user={other} size={34} />
          <div><b>{other.display_name}</b><div className="muted small">@{other.username}</div></div>
        </Link>
      </header>
      <Chat meId={me.id} otherId={other.id} username={other.username} initial={conversation(me.id, other.id)} />
    </main>
  );
}
