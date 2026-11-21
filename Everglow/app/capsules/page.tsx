import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/capsules";
import { Countdown } from "@/components/Countdown";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

type Row = { id: number; title: string; open_at: number; opened_at: number | null; sender_id: number; recipient_id: number; sender: string; recipient: string };

export default async function CapsulesPage() {
  const me = await requireUser();
  const now = Date.now();
  // Titles and dates only: a capsule's content is never sent before it opens.
  const rows = db()
    .prepare(
      `SELECT c.id, c.title, c.open_at, c.opened_at, c.sender_id, c.recipient_id, s.display_name AS sender, r.display_name AS recipient
         FROM capsules c JOIN users s ON s.id = c.sender_id JOIN users r ON r.id = c.recipient_id
        WHERE c.recipient_id = ? OR c.sender_id = ?
        ORDER BY c.open_at`,
    )
    .all(me.id, me.id) as unknown as Row[];
  const mine = rows.filter((c) => c.recipient_id === me.id);
  const ready = mine.filter((c) => c.open_at <= now && !c.opened_at);
  const sealed = mine.filter((c) => c.open_at > now);
  const opened = mine.filter((c) => c.opened_at).reverse();
  const sent = rows.filter((c) => c.sender_id === me.id && c.recipient_id !== me.id);

  const card = (c: Row, mode: "in" | "sent") => {
    const isReady = c.open_at <= now;
    const who = mode === "sent" ? `Pour ${c.recipient}` : `De ${c.sender_id === me.id ? "toi" : c.sender}`;
    const status = c.opened_at && mode === "in" ? `ouverte le ${formatDate(c.opened_at)}` : isReady ? (mode === "sent" ? "peut être ouverte" : "prête à ouvrir !") : `s'ouvre le ${formatDate(c.open_at)}`;
    const inner = (
      <>
        <span className={`orb${isReady ? "" : " sealed"}`}>{isReady ? "✨" : <Icon name="hourglass" size={22} />}</span>
        <span className="info">
          <b>{c.title}</b>
          <span className="muted small">{who} · {status}</span>
          {!isReady && <Countdown openAt={c.open_at} />}
        </span>
      </>
    );
    const cls = `capsule${isReady && !c.opened_at && mode === "in" ? " ready" : ""}${c.opened_at && mode === "in" ? " opened" : ""}`;
    return mode === "in" && isReady ? (
      <Link key={c.id} href={`/capsules/${c.id}`} className={cls}>{inner}</Link>
    ) : (
      <div key={c.id} className={cls}>{inner}</div>
    );
  };
  const section = (title: string, list: Row[], mode: "in" | "sent") =>
    list.length > 0 && (
      <>
        <h2 className="section-title">{title}</h2>
        {list.map((c) => card(c, mode))}
      </>
    );

  return (
    <main>
      <header className="topbar">
        <b style={{ fontSize: 18 }}>Capsules</b>
        <span className="spacer" />
        <Link href="/create?type=capsule" className="btn" style={{ padding: "6px 14px", fontSize: 13 }}>Nouvelle capsule</Link>
      </header>
      <div className="capsule-hero">
        <b>Des souvenirs scellés dans le temps.</b>
        Envoie une vidéo, une photo ou un message qui ne s&apos;ouvrira qu&apos;à la date choisie : dans une heure, le jour d&apos;un anniversaire ou dans 10 ans. Même toi, tu ne peux pas l&apos;ouvrir avant.
      </div>
      {section("Prêtes à ouvrir", ready, "in")}
      {section("Scellées", sealed, "in")}
      {section("Déjà ouvertes", opened, "in")}
      {section("Envoyées", sent, "sent")}
      {rows.length === 0 && <p className="empty">Aucune capsule pour l&apos;instant.</p>}
      <div style={{ height: 16 }} />
    </main>
  );
}
