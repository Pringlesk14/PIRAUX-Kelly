import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db, hiddenIds, listPosts } from "@/lib/db";
import { timeAgo } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import { Countdown } from "@/components/Countdown";
import { DuoImage } from "@/components/DuoImage";
import { Icon } from "@/components/Icon";
import { LikeButton } from "@/components/LikeButton";
import { StoriesBar } from "@/components/StoriesBar";

export const dynamic = "force-dynamic";

type Half = { id: number; media: string; caption: string; expires_at: number; username: string; invited_id: number | null; invited: string | null };

export default async function PhotosPage() {
  const user = await requireUser();
  const now = Date.now();
  const open = `h.completed_at IS NULL AND h.expires_at > ? AND h.user_id NOT IN (${hiddenIds(user.id)})`;
  const select = `SELECT h.id, h.media, h.caption, h.expires_at, u.username, h.invited_id, iu.username AS invited
                    FROM halves h JOIN users u ON u.id = h.user_id LEFT JOIN users iu ON iu.id = h.invited_id`;
  // Halves you can complete: sent to you first, then open ones, soonest to expire first.
  const forMe = db()
    .prepare(`${select} WHERE ${open} AND h.user_id != ? AND (h.invited_id IS NULL OR h.invited_id = ?) ORDER BY (h.invited_id IS NULL), h.expires_at LIMIT 30`)
    .all(now, user.id, user.id) as unknown as Half[];
  const waiting = db().prepare(`${select} WHERE ${open} AND h.user_id = ? ORDER BY h.expires_at`).all(now, user.id) as unknown as Half[];
  const posts = listPosts(user.id, "p.kind = 'photo'", []);

  return (
    <main>
      <header className="topbar">
        <span className="logo">everglow</span>
        <span className="spacer" />
        <Link href="/create?type=half" className="btn" style={{ padding: "6px 14px", fontSize: 13 }}>✂️ Lancer une moitié</Link>
      </header>
      <StoriesBar user={user} />
      <div className="duo-intro">
        <b>Moitié-moitié</b> : une photo, deux personnes. Quelqu&apos;un prend la moitié gauche, un ami complète la droite là où il est. Il a 24 h !
      </div>

      {forMe.length > 0 && (
        <>
          <h2 className="section-title">À compléter</h2>
          <div className="halves">
            {forMe.map((h) => (
              <Link key={h.id} href={`/moitie/${h.id}`} className={`half-card${h.invited_id === user.id ? " for-me" : ""}`}>
                <DuoImage left={h.media} />
                <span className="meta">
                  <b>@{h.username}</b> {h.invited_id === user.id ? "· pour toi" : "· ouvert à tous"}
                  <br />
                  {h.caption}
                  <br />⏳ <Countdown openAt={h.expires_at} className="cd" />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {waiting.length > 0 && (
        <>
          <h2 className="section-title">Tes moitiés en attente</h2>
          {waiting.map((h) => (
            <div key={h.id} className="pending">
              <DuoImage left={h.media} rightSlot={<div className="half empty" />} />
              <span>
                {h.invited ? <>En attente de <b>@{h.invited}</b></> : "Ouverte à tout le monde"}
                <br />
                <span className="muted">Encore <Countdown openAt={h.expires_at} className="cd" /> pour être complétée</span>
              </span>
            </div>
          ))}
        </>
      )}

      <h2 className="section-title">Photos à deux</h2>
      {posts.length === 0 && (
        <div className="empty">
          <p>Aucune photo pour l&apos;instant.</p>
          <Link className="btn" href="/create?type=half">Lancer la première moitié</Link>
        </div>
      )}
      {posts.map((p) => (
        <article key={p.id} className="post">
          <div className="head">
            <Avatar user={p} size={30} />
            <Link href={`/p/${p.id}`} className="duo-title">{p.partner_username ? `${p.username} × ${p.partner_username}` : p.username}</Link>
            <span className="muted small">· {timeAgo(p.created_at)}</span>
          </div>
          <Link href={`/p/${p.id}`} aria-label="Ouvrir la photo" style={{ display: "block" }}>
            {p.duo_media ? (
              <DuoImage left={p.media} right={p.duo_media} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="media" src={`/media/${p.media}`} alt={p.caption} loading="lazy" />
            )}
          </Link>
          <div className="bar">
            <LikeButton postId={p.id} liked={!!p.liked} count={p.like_count} size={26} />
            <Link href={`/p/${p.id}`} className="action"><Icon name="comment" size={26} />{p.comment_count}</Link>
          </div>
          {p.caption && <div className="caption"><b>{p.username}</b> {p.caption}</div>}
        </article>
      ))}
    </main>
  );
}
