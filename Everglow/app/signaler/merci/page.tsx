import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { describeTarget } from "@/lib/reports.view";
import { blockUser } from "@/app/actions";

export default async function ReportThanksPage({ searchParams }: { searchParams: Promise<{ type?: string; id?: string }> }) {
  const me = await requireUser();
  const { type = "", id = "" } = await searchParams;
  const target = describeTarget(type, Number(id));
  const owner = target?.owner
    ? (db().prepare("SELECT id FROM users WHERE username = ?").get(target.owner) as { id: number } | undefined)
    : undefined;
  const canBlock = owner && owner.id !== me.id && !db().prepare("SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?").get(me.id, owner.id);
  return (
    <main className="empty" style={{ paddingTop: 80 }}>
      <div style={{ fontSize: 44 }}>🙏</div>
      <h1 className="page-title">Merci, c&apos;est envoyé</h1>
      <p>L&apos;équipe de modération va regarder ton signalement. Si le contenu ne respecte pas les règles, il sera supprimé.</p>
      {canBlock && (
        <>
          <p>Tu peux aussi bloquer @{target!.owner} : vous ne vous verrez plus et ne pourrez plus vous écrire.</p>
          <form action={blockUser.bind(null, owner!.id)}>
            <button className="btn secondary">Bloquer @{target!.owner}</button>
          </form>
        </>
      )}
      <p style={{ marginTop: 20 }}><Link href="/" className="btn">Retour à Everglow</Link></p>
    </main>
  );
}
