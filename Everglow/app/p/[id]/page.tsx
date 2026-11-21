import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, listPosts } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { timeAgo } from "@/lib/time";
import { addComment, deletePost, giveGlow } from "@/app/actions";
import { dayKey, endOfDay } from "@/lib/challenges";
import { Countdown } from "@/components/Countdown";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { LikeButton } from "@/components/LikeButton";

export const dynamic = "force-dynamic";

type Comment = { id: number; body: string; created_at: number; username: string; display_name: string; avatar: string | null };

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const id = Number((await params).id);
  const [post] = Number.isInteger(id) ? listPosts(me.id, "p.id = ?", [id], 1) : [];
  if (!post) notFound();
  const comments = db()
    .prepare(
      `SELECT c.id, c.body, c.created_at, u.username, u.display_name, u.avatar
         FROM comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at`,
    )
    .all(post.id) as unknown as Comment[];
  const glows = (db().prepare("SELECT COUNT(*) AS n FROM glows WHERE post_id = ?").get(post.id) as { n: number }).n;
  const myGlow = db().prepare("SELECT post_id FROM glows WHERE user_id = ? AND day = ?").get(me.id, dayKey()) as { post_id: number } | undefined;

  return (
    <main>
      <header className="topbar">
        <Link href={`/u/${post.username}`} className="row"><Avatar user={post} size={32} /><b>{post.username}</b></Link>
        <span className="muted small">· {timeAgo(post.created_at)}</span>
        <span className="spacer" />
        {post.user_id === me.id && (
          <form action={deletePost.bind(null, post.id)}>
            <button className="icon-btn" aria-label="Supprimer la publication" title="Supprimer"><Icon name="trash" size={20} /></button>
          </form>
        )}
      </header>
      {post.kind === "video" ? (
        <video className="detail-media" src={mediaUrl(post.media)} controls autoPlay loop playsInline />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="detail-media" src={mediaUrl(post.media)} alt={post.caption} />
      )}
      <div className="post" style={{ marginBottom: 0 }}>
        <div className="bar">
          {post.kind === "video" ? (
            <LikeButton postId={post.id} liked={!!post.liked} count={post.like_count} size={26} />
          ) : (
            <>
              <span className="glow-count">✨ {glows} Lueur{glows > 1 ? "s" : ""}</span>
              {post.user_id === me.id ? (
                <span className="muted small">C&apos;est ta photo</span>
              ) : myGlow?.post_id === post.id ? (
                <span className="glow-given">Tu lui as offert ta Lueur aujourd&apos;hui</span>
              ) : myGlow ? (
                <span className="muted small">Lueur déjà offerte aujourd&apos;hui · nouvelle dans <Countdown openAt={endOfDay()} className="cd" /></span>
              ) : (
                <form action={giveGlow.bind(null, post.id)}>
                  <button className="btn" style={{ padding: "6px 14px", fontSize: 13 }}>Offrir ma Lueur du jour</button>
                </form>
              )}
            </>
          )}
          <span className="action"><Icon name="comment" size={26} />{comments.length}</span>
        </div>
        {post.caption && <div className="caption"><b>{post.username}</b> {post.caption}</div>}
      </div>
      {comments.length === 0 && <p className="empty" style={{ padding: 24 }}>Sois le premier à commenter.</p>}
      {comments.map((c) => (
        <div key={c.id} className="comment">
          <Link href={`/u/${c.username}`}><Avatar user={c} size={32} /></Link>
          <div className="body">
            <b>{c.username}</b> <span className="muted small">{timeAgo(c.created_at)}</span>
            <div>{c.body}</div>
          </div>
        </div>
      ))}
      <form className="comment-form" action={addComment.bind(null, post.id)}>
        <input className="input" name="body" placeholder="Ajouter un commentaire…" maxLength={500} required autoComplete="off" />
        <button className="btn" aria-label="Envoyer"><Icon name="send" size={18} /></button>
      </form>
    </main>
  );
}
