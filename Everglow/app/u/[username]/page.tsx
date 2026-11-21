import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, listPosts, type User } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { logout, toggleFollow } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { DuoImage } from "@/components/DuoImage";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ tab?: string }> }) {
  const me = await requireUser();
  const { username } = await params;
  const tab = (await searchParams).tab === "photos" ? "photos" : "videos";
  const user = db().prepare("SELECT id, username, display_name, bio, avatar FROM users WHERE username = ?").get(username) as User | undefined;
  if (!user) notFound();
  const isMe = user.id === me.id;
  const count = (sql: string, ...p: number[]) => (db().prepare(sql).get(...p) as { n: number }).n;
  const followers = count("SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?", user.id);
  const following = count("SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?", user.id);
  const likes = count("SELECT COUNT(*) AS n FROM likes l JOIN posts p ON p.id = l.post_id WHERE p.user_id = ?", user.id);
  const iFollow = count("SELECT COUNT(*) AS n FROM follows WHERE follower_id = ? AND followee_id = ?", me.id, user.id) > 0;
  const hasStory = count("SELECT COUNT(*) AS n FROM stories WHERE user_id = ? AND expires_at > ?", user.id, Date.now()) > 0;
  // Photos include the Moitié-moitié photos this person completed for someone else.
  const posts = listPosts(me.id, "(p.user_id = ? OR p.duo_partner_id = ?) AND p.kind = ?", [user.id, user.id, tab === "photos" ? "photo" : "video"], 200);

  return (
    <main>
      <header className="topbar">
        <b style={{ fontSize: 18 }}>@{user.username}</b>
        <span className="spacer" />
        {isMe && (
          <form action={logout}><button className="btn secondary" style={{ padding: "6px 14px", fontSize: 13 }}>Déconnexion</button></form>
        )}
      </header>
      <div className="profile-head">
        {hasStory ? (
          <Link href={`/stories/${user.username}`} className="avatar-ring"><Avatar user={user} size={84} /></Link>
        ) : (
          <Avatar user={user} size={90} />
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{user.display_name}</div>
          <div className="stats">
            <div><b>{followers}</b><span>abonnés</span></div>
            <div><b>{following}</b><span>abonnements</span></div>
            <div><b>{likes}</b><span>j&apos;aime</span></div>
          </div>
        </div>
      </div>
      {user.bio && <p className="bio">{user.bio}</p>}
      <div className="profile-actions">
        {isMe ? (
          <Link href={`/u/${user.username}/edit`} className="btn secondary">Modifier le profil</Link>
        ) : (
          <>
            <form action={toggleFollow.bind(null, user.id)} style={{ display: "flex" }}>
              <button className={`btn block${iFollow ? " secondary" : ""}`}>{iFollow ? "Abonné ✓" : "S'abonner"}</button>
            </form>
            <Link href={`/messages/${user.username}`} className="btn secondary">Message</Link>
          </>
        )}
      </div>
      <nav className="tabs">
        <Link href={`/u/${user.username}`} className={tab === "videos" ? "active" : ""}>Vidéos</Link>
        <Link href={`/u/${user.username}?tab=photos`} className={tab === "photos" ? "active" : ""}>Photos</Link>
      </nav>
      {posts.length === 0 ? (
        <p className="empty">Rien ici pour l&apos;instant.</p>
      ) : (
        <div className="grid">
          {posts.map((p) => (
            <Link key={p.id} href={`/p/${p.id}`}>
              {p.kind === "video" ? (
                <>
                  <video src={`${mediaUrl(p.media)}#t=0.5`} muted playsInline preload="metadata" />
                  <span className="badge"><Icon name="play" size={16} fill="#fff" stroke="none" /></span>
                </>
              ) : (
                p.duo_media ? (
                  <DuoImage left={p.media} right={p.duo_media} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(p.media)} alt={p.caption} loading="lazy" />
                )
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
