import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listPosts } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { timeAgo } from "@/lib/time";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { LikeButton } from "@/components/LikeButton";
import { StoriesBar } from "@/components/StoriesBar";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const user = await requireUser();
  const posts = listPosts(user.id, "p.kind = 'photo'", []);
  return (
    <main>
      <header className="topbar">
        <span className="logo">everglow</span>
      </header>
      <StoriesBar user={user} />
      {posts.length === 0 && (
        <div className="empty">
          <p>Aucune photo pour l&apos;instant.</p>
          <Link className="btn" href="/create">Publier une photo</Link>
        </div>
      )}
      {posts.map((p) => (
        <article key={p.id} className="post">
          <Link href={`/u/${p.username}`} className="head">
            <Avatar user={p} size={34} />
            <b>{p.username}</b>
            <span className="muted small">· {timeAgo(p.created_at)}</span>
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="media" src={mediaUrl(p.media)} alt={p.caption || `Photo de ${p.username}`} loading="lazy" />
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
