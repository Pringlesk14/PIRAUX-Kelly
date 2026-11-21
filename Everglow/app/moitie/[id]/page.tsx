import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db, isBlocked } from "@/lib/db";
import { CompleteHalf } from "@/components/CompleteHalf";
import { Countdown } from "@/components/Countdown";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function CompleteHalfPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const h = db()
    .prepare(
      `SELECT h.id, h.media, h.caption, h.expires_at, h.completed_at, h.invited_id, h.user_id, u.username
         FROM halves h JOIN users u ON u.id = h.user_id WHERE h.id = ?`,
    )
    .get(Number((await params).id)) as
    | { id: number; media: string; caption: string; expires_at: number; completed_at: number | null; invited_id: number | null; user_id: number; username: string }
    | undefined;
  const allowed = h && h.user_id !== me.id && (h.invited_id === null || h.invited_id === me.id) && !isBlocked(me.id, h.user_id);
  const open = h && !h.completed_at && h.expires_at > Date.now();

  return (
    <main>
      <header className="topbar">
        <Link href="/photos" className="icon-btn" aria-label="Retour"><Icon name="back" /></Link>
        <b style={{ fontSize: 17 }}>{allowed ? `Compléter la moitié de @${h!.username}` : "Moitié-moitié"}</b>
      </header>
      {!allowed || !open ? (
        <p className="empty">Cette moitié n&apos;est plus disponible : elle a été complétée, ses 24 h sont passées, ou elle était réservée à quelqu&apos;un d&apos;autre.</p>
      ) : (
        <>
          <p className="complete-hint">
            {h!.caption && <>« {h!.caption} »<br /></>}
            <span className="muted small">Prends une photo là où tu es : on garde sa moitié droite pour compléter celle de @{h!.username}.</span>
          </p>
          <CompleteHalf halfId={h!.id} left={h!.media} />
          <p className="muted small" style={{ textAlign: "center" }}>⏳ Encore <Countdown openAt={h!.expires_at} className="cd" /></p>
        </>
      )}
    </main>
  );
}
