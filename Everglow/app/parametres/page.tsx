import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout, unblockUser } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requireUser();
  const blocked = db()
    .prepare("SELECT u.id, u.username, u.display_name, u.avatar FROM blocks b JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = ? ORDER BY b.created_at DESC")
    .all(me.id) as { id: number; username: string; display_name: string; avatar: string | null }[];
  const openReports = me.is_admin ? (db().prepare("SELECT COUNT(*) AS n FROM reports WHERE resolved_at IS NULL").get() as { n: number }).n : 0;

  return (
    <main>
      <header className="topbar">
        <Link href={`/u/${me.username}`} className="icon-btn" aria-label="Retour"><Icon name="back" /></Link>
        <b style={{ fontSize: 17 }}>Paramètres</b>
      </header>
      <div className="page settings">
        <section>
          <h2 className="section-title" style={{ margin: "0 0 8px" }}>Mon compte</h2>
          <Link href={`/u/${me.username}/edit`} className="settings-row">Modifier mon profil</Link>
          <Link href="/regles" className="settings-row">Règles de la communauté et confidentialité</Link>
          {me.is_admin ? (
            <Link href="/admin" className="settings-row">
              Espace modération {openReports > 0 && <span className="badge-count">{openReports}</span>}
            </Link>
          ) : null}
          <form action={logout}><button className="settings-row">Se déconnecter</button></form>
        </section>

        <section>
          <h2 className="section-title" style={{ margin: "20px 0 8px" }}>Comptes bloqués</h2>
          {blocked.length === 0 && <p className="muted small">Tu n&apos;as bloqué personne. Pour bloquer quelqu&apos;un, va sur son profil.</p>}
          {blocked.map((u) => (
            <div key={u.id} className="list-item" style={{ padding: "8px 0" }}>
              <Avatar user={u} size={40} />
              <div style={{ flex: 1 }}><b>{u.display_name}</b><div className="preview">@{u.username}</div></div>
              <form action={unblockUser.bind(null, u.id)}><button className="btn secondary" style={{ padding: "6px 14px", fontSize: 13 }}>Débloquer</button></form>
            </div>
          ))}
        </section>

        <section>
          <h2 className="section-title" style={{ margin: "20px 0 8px" }}>Zone sensible</h2>
          <DeleteAccountForm />
        </section>
      </div>
    </main>
  );
}
