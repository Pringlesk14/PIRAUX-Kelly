import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { describeTarget } from "@/lib/reports.view";
import { timeAgo } from "@/lib/time";
import { resolveReport, unbanUser } from "@/app/actions";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

type Report = { id: number; target_type: string; target_id: number; reason: string; details: string; created_at: number; reporter: string | null; count: number };

export default async function AdminPage() {
  await requireAdmin();
  // One card per reported thing, with how many people reported it.
  const reports = db()
    .prepare(
      `SELECT MIN(r.id) AS id, r.target_type, r.target_id, GROUP_CONCAT(DISTINCT r.reason) AS reason,
              GROUP_CONCAT(NULLIF(r.details, ''), ' / ') AS details, MAX(r.created_at) AS created_at,
              MAX(u.username) AS reporter, COUNT(*) AS count
         FROM reports r LEFT JOIN users u ON u.id = r.reporter_id
        WHERE r.resolved_at IS NULL
        GROUP BY r.target_type, r.target_id
        ORDER BY count DESC, created_at DESC`,
    )
    .all() as unknown as Report[];
  const banned = db().prepare("SELECT id, username, banned_at FROM users WHERE banned_at IS NOT NULL ORDER BY banned_at DESC").all() as { id: number; username: string; banned_at: number }[];
  const done = db()
    .prepare("SELECT target_type, target_id, reason, resolution, resolved_at FROM reports WHERE resolved_at IS NOT NULL GROUP BY target_type, target_id ORDER BY resolved_at DESC LIMIT 10")
    .all() as { target_type: string; target_id: number; reason: string; resolution: string; resolved_at: number }[];

  return (
    <main>
      <header className="topbar">
        <Link href="/parametres" className="icon-btn" aria-label="Retour"><Icon name="back" /></Link>
        <b style={{ fontSize: 17 }}>Modération</b>
        <span className="spacer" />
        <span className="muted small">{reports.length} à traiter</span>
      </header>
      <div className="page">
        {reports.length === 0 && <p className="empty">Aucun signalement en attente. 🎉</p>}
        {reports.map((r) => {
          const t = describeTarget(r.target_type, r.target_id);
          return (
            <article key={r.id} className="report-card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <b>{t ? t.label : "Contenu déjà supprimé"}</b>
                <span className="badge-count">{r.count} signalement{r.count > 1 ? "s" : ""}</span>
              </div>
              <div className="small"><span className="tag">{r.reason.split(",").join(" · ")}</span></div>
              {t?.text && <p className="small quote">« {t.text} »</p>}
              {r.details && <p className="small muted">Détails : {r.details}</p>}
              <p className="small muted">Dernier signalement {timeAgo(r.created_at)}</p>
              <div className="row" style={{ flexWrap: "wrap" }}>
                {t?.href && <Link href={t.href} className="btn secondary sm-btn">Voir</Link>}
                <form action={resolveReport.bind(null, r.id, "dismiss")}><button className="btn secondary sm-btn">Ignorer</button></form>
                {r.target_type !== "user" && t && <form action={resolveReport.bind(null, r.id, "remove")}><button className="btn secondary sm-btn">Supprimer le contenu</button></form>}
                {t && <form action={resolveReport.bind(null, r.id, "ban")}><button className="btn danger sm-btn">Suspendre @{t.owner}</button></form>}
              </div>
            </article>
          );
        })}

        {banned.length > 0 && (
          <>
            <h2 className="section-title" style={{ margin: "24px 0 8px" }}>Comptes suspendus</h2>
            {banned.map((u) => (
              <div key={u.id} className="row" style={{ padding: "6px 0" }}>
                <span style={{ flex: 1 }}>@{u.username} <span className="muted small">· {timeAgo(u.banned_at)}</span></span>
                <form action={unbanUser.bind(null, u.id)}><button className="btn secondary sm-btn">Rétablir</button></form>
              </div>
            ))}
          </>
        )}

        {done.length > 0 && (
          <>
            <h2 className="section-title" style={{ margin: "24px 0 8px" }}>Derniers traités</h2>
            {done.map((d) => (
              <p key={`${d.target_type}-${d.target_id}`} className="small muted" style={{ margin: "4px 0" }}>
                {d.target_type} #{d.target_id} · {d.reason} → <b>{d.resolution}</b> · {timeAgo(d.resolved_at)}
              </p>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
