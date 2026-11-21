import Link from "next/link";
import { MIN_AGE, PARENTAL_CONSENT_UNDER } from "@/lib/age";

export const metadata = { title: "Règles et confidentialité · Everglow" };

export default function RulesPage() {
  return (
    <main className="page rules">
      <Link href="/" className="logo" style={{ fontSize: 26 }}>everglow</Link>
      <h1 className="page-title" style={{ marginTop: 16 }}>Règles de la communauté</h1>
      <p>Everglow est fait pour partager ce qui te fait briller. Pour que tout le monde s&apos;y sente bien, ces règles s&apos;appliquent à toutes les vidéos, photos, stories, capsules, snaps, messages et commentaires.</p>
      <ol>
        <li><b>Respecte les autres.</b> Pas de harcèlement, d&apos;insultes, de moqueries répétées ni de menaces.</li>
        <li><b>Pas de haine.</b> Rien qui attaque quelqu&apos;un pour son origine, sa religion, son genre, son orientation, son handicap ou son apparence.</li>
        <li><b>Pas de contenu sexuel ni de nudité.</b> Et rien du tout qui mette en scène un mineur de façon inappropriée.</li>
        <li><b>Pas de violence ni de danger.</b> Pas de défis dangereux, d&apos;automutilation encouragée, d&apos;armes ou de drogues mises en avant.</li>
        <li><b>Sois toi-même.</b> Pas de faux compte, pas d&apos;usurpation d&apos;identité.</li>
        <li><b>Pas d&apos;arnaque ni de spam.</b></li>
        <li><b>Respecte la vie privée.</b> Ne publie pas la photo, l&apos;adresse ou les infos de quelqu&apos;un sans son accord.</li>
        <li><b>Respecte les droits d&apos;auteur.</b> Publie ce que tu as le droit de partager.</li>
      </ol>
      <p>Si tu vois quelque chose qui ne respecte pas ces règles, utilise le drapeau 🚩 <b>Signaler</b> sur la publication, le commentaire ou le profil. Tu peux aussi <b>bloquer</b> quelqu&apos;un depuis son profil : vous ne vous verrez plus et ne pourrez plus vous écrire. L&apos;équipe de modération peut supprimer un contenu ou suspendre un compte.</p>

      <h2 className="page-title" style={{ marginTop: 28 }}>Âge</h2>
      <p>Everglow est ouvert à partir de <b>{MIN_AGE} ans</b>. Avant {PARENTAL_CONSENT_UNDER} ans, un parent ou responsable légal doit être d&apos;accord pour l&apos;inscription.</p>

      <h2 className="page-title" style={{ marginTop: 28 }}>Confidentialité</h2>
      <ul>
        <li><b>Ce que nous gardons :</b> ton nom d&apos;utilisateur, ton nom affiché, ta bio, ta photo de profil, ta date de naissance (jamais affichée), ton mot de passe chiffré, et ce que tu publies ou envoies.</li>
        <li><b>Pourquoi :</b> uniquement pour faire fonctionner Everglow. Pas de publicité, pas de revente de données.</li>
        <li><b>Contenus privés :</b> les capsules et les snaps sont stockés à part et ne sont montrés qu&apos;à leur destinataire. Un snap est effacé peu après avoir été vu. En Moitié-moitié, seule la moitié choisie de ta photo est envoyée.</li>
        <li><b>Tes droits :</b> tu peux modifier ton profil à tout moment, et <b>supprimer ton compte</b> dans les Paramètres : tes publications, messages, capsules et fichiers sont alors effacés.</li>
      </ul>
      <p className="muted small" style={{ marginTop: 24 }}>Version bêta. Ces règles seront complétées avant l&apos;ouverture au public.</p>
    </main>
  );
}
