import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, isBlocked } from "@/lib/db";
import { conversation, streakDays } from "@/lib/messages";
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
  if (isBlocked(me.id, other.id))
    return (
      <main>
        <header className="topbar">
          <Link href="/messages" className="icon-btn" aria-label="Retour"><Icon name="back" /></Link>
          <b>Conversation indisponible</b>
        </header>
        <p className="empty">Vous ne pouvez plus vous écrire : l&apos;un de vous a bloqué l&apos;autre.</p>
      </main>
    );
  return (
    <main className="chat">
      <header className="topbar">
        <Link href="/messages" className="icon-btn" aria-label="Retour"><Icon name="back" /></Link>
        <Link href={`/u/${other.username}`} className="row">
          <Avatar user={other} size={34} />
          <div><b>{other.display_name}</b><div className="muted small">@{other.username}</div></div>
        </Link>
        <span className="spacer" />
        <Link href={`/signaler?type=user&id=${other.id}`} className="icon-btn" aria-label="Signaler ce compte" title="Signaler"><Icon name="flag" size={20} /></Link>
      </header>
      <Chat meId={me.id} otherId={other.id} username={other.username} name={other.display_name} initial={conversation(me.id, other.id)} initialStreak={streakDays(me.id, other.id)} />
    </main>
  );
}
