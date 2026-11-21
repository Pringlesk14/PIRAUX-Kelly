import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db, listPosts } from "@/lib/db";
import { dayKey, endOfDay, themeFor, yesterdayKey } from "@/lib/challenges";
import { mediaUrl } from "@/lib/media";
import { VideoFeed } from "@/components/VideoFeed";
import { Countdown } from "@/components/Countdown";

export const dynamic = "force-dynamic";

type Tab = "defi" | "podium" | "abonnements";

export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const raw = (await searchParams).tab;
  const tab: Tab = raw === "podium" || raw === "abonnements" ? raw : "defi";
  const today = dayKey();
  const yesterday = yesterdayKey();
  const title = themeFor(today);
  const endsAt = endOfDay();

  const header = (
    <>
      <div className="feed-header">
        <div className="row" style={{ gap: 18, pointerEvents: "auto", fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>
          <Link href="/?tab=abonnements" style={{ opacity: tab === "abonnements" ? 1 : 0.6 }}>Abonnements</Link>
          <Link href="/" style={{ opacity: tab === "defi" ? 1 : 0.6 }}>Défi du jour</Link>
          <Link href="/?tab=podium" style={{ opacity: tab === "podium" ? 1 : 0.6 }}>Podium</Link>
        </div>
      </div>
      {tab === "defi" && (
        <Link className="challenge-pill" href="/create?challenge=1">
          🔥 {title} · fin dans <Countdown openAt={endsAt} className="cd" />
        </Link>
      )}
    </>
  );

  if (tab === "podium") {
    const top = listPosts(user.id, "p.kind = 'video' AND p.challenge_day = ?", [yesterday], 3, "like_count DESC, p.created_at");
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <main style={{ position: "relative" }}>
        {header}
        <div className="podium page">
          <div className="cc-eyebrow">Podium du défi d&apos;hier</div>
          <h2 className="podium-title">{themeFor(yesterday)}</h2>
          {top.length === 0 && <p className="empty">Personne n&apos;a participé au défi d&apos;hier. Le podium de demain t&apos;attend !</p>}
          {top.map((p, i) => (
            <Link key={p.id} href={`/p/${p.id}`} className={`podium-row${i === 0 ? " first" : ""}`}>
              <span className="medal">{medals[i]}</span>
              <video src={`${mediaUrl(p.media)}#t=0.5`} muted playsInline preload="metadata" />
              <span className="info">
                <b>@{p.username}</b>
                <span className="muted small">{p.caption}</span>
                <span className="small">❤️ {p.like_count}</span>
              </span>
            </Link>
          ))}
          <p className="muted small">Classement selon les ❤️ reçus par les vidéos du défi.</p>
        </div>
      </main>
    );
  }

  if (tab === "abonnements") {
    const posts = listPosts(user.id, "p.kind = 'video' AND (p.user_id = ? OR p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?))", [user.id, user.id]);
    return (
      <main style={{ position: "relative" }}>
        {header}
        {posts.length === 0 ? (
          <div className="empty" style={{ paddingTop: 120 }}>Les personnes que tu suis n&apos;ont pas encore publié de vidéo.</div>
        ) : (
          <VideoFeed posts={posts} />
        )}
      </main>
    );
  }

  const posts = listPosts(user.id, "p.kind = 'video' AND p.challenge_day = ?", [today]);
  const joined = !!db().prepare("SELECT 1 FROM posts WHERE user_id = ? AND challenge_day = ?").get(user.id, today);
  return (
    <main style={{ position: "relative" }}>
      {header}
      <VideoFeed posts={posts} challenge={{ today, yesterday, title, endsAt, count: posts.length, joined }} />
    </main>
  );
}
