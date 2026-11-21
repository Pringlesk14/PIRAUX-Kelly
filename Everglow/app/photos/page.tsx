import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { dayKey, endOfDay } from "@/lib/challenges";
import { StoriesBar } from "@/components/StoriesBar";
import { Countdown } from "@/components/Countdown";

export const dynamic = "force-dynamic";

type Star = { id: number; media: string; caption: string; username: string; glows: number };

const ROW = 92;
const TOP = 80;

export default async function PhotosPage() {
  const user = await requireUser();
  const photos = db()
    .prepare(
      `SELECT p.id, p.media, p.caption, u.username, (SELECT COUNT(*) FROM glows g WHERE g.post_id = p.id) AS glows
         FROM posts p JOIN users u ON u.id = p.user_id
        WHERE p.kind = 'photo' ORDER BY p.created_at DESC LIMIT 60`,
    )
    .all() as unknown as Star[];
  const given = db()
    .prepare("SELECT g.post_id, u.username FROM glows g JOIN posts p ON p.id = g.post_id JOIN users u ON u.id = p.user_id WHERE g.user_id = ? AND g.day = ?")
    .get(user.id, dayKey()) as { post_id: number; username: string } | undefined;

  // Stars zigzag down the sky; each photo gets a stable sideways offset from its id.
  const jitter = (id: number) => ((id * 9301 + 49297) % 233280) / 233280;
  const stars = photos.map((p, i) => ({ p, x: (i % 2 ? 68 : 30) + (jitter(p.id) - 0.5) * 22, y: TOP + i * ROW, size: 46 + Math.min(p.glows, 10) * 4 }));
  const height = TOP + photos.length * ROW + 30;
  // A person's photos are linked into their own constellation.
  const byUser = new Map<string, typeof stars>();
  for (const st of stars) byUser.set(st.p.username, [...(byUser.get(st.p.username) ?? []), st]);
  const lines = [...byUser.values()].flatMap((group) => group.slice(1).map((st, k) => ({ a: group[k], b: st })));

  return (
    <main>
      <header className="topbar">
        <span className="logo">everglow</span>
        <span className="spacer" />
        <span className="muted small">Constellation</span>
      </header>
      <StoriesBar user={user} />
      <div className="glow-info">
        {given ? (
          <>✨ Ta Lueur d&apos;aujourd&apos;hui brille sur la photo de <b>@{given.username}</b>. Nouvelle Lueur dans <Countdown openAt={endOfDay()} className="cd" />.</>
        ) : (
          <>✨ Tu as <b>1 Lueur</b> à offrir aujourd&apos;hui. Touche une étoile pour voir la photo, et offre ta Lueur à celle que tu préfères.</>
        )}
      </div>
      {photos.length === 0 ? (
        <div className="empty">
          <p>Le ciel est encore vide.</p>
          <Link className="btn" href="/create">Publier la première photo</Link>
        </div>
      ) : (
        <div className="sky" style={{ height }}>
          <svg className="sky-lines" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
            {lines.map(({ a, b }) => (
              <line key={`${a.p.id}-${b.p.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,214,160,.45)" strokeWidth={1.5} strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {stars.map(({ p, x, y, size }) => (
            <Link key={p.id} href={`/p/${p.id}`} className={`star${given?.post_id === p.id ? " given" : ""}`} style={{ left: `${x}%`, top: y }} aria-label={`Photo de ${p.username}, ${p.glows} Lueurs`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(p.media)}
                alt=""
                loading="lazy"
                style={{ width: size, height: size, boxShadow: `0 0 ${8 + p.glows * 4}px ${2 + p.glows}px rgba(255,179,71,${(0.25 + Math.min(p.glows, 10) * 0.06).toFixed(2)})` }}
              />
              <span className="label">@{p.username} · ✨ {p.glows}</span>
            </Link>
          ))}
        </div>
      )}
      <p className="muted small" style={{ padding: "0 16px 16px", lineHeight: 1.45 }}>
        Chaque étoile est une photo. Les photos d&apos;une même personne sont reliées : c&apos;est sa constellation. Plus une photo reçoit de Lueurs, plus elle est grande et brillante.
      </p>
    </main>
  );
}
