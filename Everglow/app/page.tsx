import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listPosts } from "@/lib/db";
import { VideoFeed } from "@/components/VideoFeed";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const following = (await searchParams).tab === "abonnements";
  const posts = following
    ? listPosts(user.id, "p.kind = 'video' AND (p.user_id = ? OR p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?))", [user.id, user.id])
    : listPosts(user.id, "p.kind = 'video'", []);
  return (
    <main style={{ position: "relative" }}>
      <div className="feed-header">
        <div className="row" style={{ gap: 18, pointerEvents: "auto", fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>
          <Link href="/?tab=abonnements" style={{ opacity: following ? 1 : 0.6 }}>Abonnements</Link>
          <span className="logo" style={{ fontSize: 22 }}>everglow</span>
          <Link href="/" style={{ opacity: following ? 0.6 : 1 }}>Pour toi</Link>
        </div>
      </div>
      {posts.length === 0 ? (
        <div className="empty" style={{ paddingTop: 120 }}>
          <p>{following ? "Les personnes que tu suis n'ont pas encore publié de vidéo." : "Aucune vidéo pour l'instant."}</p>
          <Link className="btn" href="/create">Publier la première</Link>
        </div>
      ) : (
        <VideoFeed posts={posts} />
      )}
    </main>
  );
}
