import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/capsules";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

type Capsule = {
  id: number; title: string; message: string; media: string | null; media_kind: "video" | "photo" | null;
  created_at: number; open_at: number; opened_at: number | null; recipient_id: number; sender_id: number;
  username: string; display_name: string; avatar: string | null;
};

export default async function CapsulePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const c = db()
    .prepare(
      `SELECT c.*, u.username, u.display_name, u.avatar FROM capsules c JOIN users u ON u.id = c.sender_id WHERE c.id = ?`,
    )
    .get(Number((await params).id)) as Capsule | undefined;
  if (!c || c.recipient_id !== me.id) notFound();
  if (c.open_at > Date.now()) redirect("/capsules");
  const first = !c.opened_at;
  const openedAt = c.opened_at ?? Date.now();
  if (first) db().prepare("UPDATE capsules SET opened_at = ? WHERE id = ? AND opened_at IS NULL").run(openedAt, c.id);

  return (
    <main>
      <header className="topbar">
        <Link href="/capsules" className="icon-btn" aria-label="Retour"><Icon name="back" /></Link>
        <b style={{ fontSize: 17 }}>{c.title}</b>
      </header>
      <div className={`capsule-open${first ? " first" : ""}`}>
        {first && <div className="burst" aria-hidden="true" />}
        <div className="reveal">
          <div className="row" style={{ padding: 16 }}>
            <Avatar user={c} size={40} />
            <div>
              <b>{c.sender_id === me.id ? "Toi" : c.display_name}</b>
              <div className="muted small">Scellée le {formatDate(c.created_at)} · ouverte le {formatDate(openedAt)}</div>
            </div>
          </div>
          {c.media &&
            (c.media_kind === "video" ? (
              <video className="detail-media" src={`/capsule-media/${c.id}`} controls autoPlay loop playsInline muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="detail-media" src={`/capsule-media/${c.id}`} alt="Contenu de la capsule" />
            ))}
          {c.message && <p className="capsule-message">{c.message}</p>}
        </div>
      </div>
    </main>
  );
}
