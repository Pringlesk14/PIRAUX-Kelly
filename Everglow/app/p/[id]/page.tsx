import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, listPosts } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { timeAgo } from "@/lib/time";
import { addComment, deletePost } from "@/app/actions";
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
          <LikeButton postId={post.id} liked={!!post.liked} count={post.like_count} size={26} />
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
