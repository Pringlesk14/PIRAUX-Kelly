import Link from "next/link";

export default function NotFound() {
  return (
    <main className="empty" style={{ paddingTop: 120 }}>
      <div className="logo" style={{ fontSize: 40 }}>404</div>
      <p>Cette page n&apos;existe pas ou a disparu (comme une story 😉).</p>
      <Link className="btn" href="/">Retour à l&apos;accueil</Link>
    </main>
  );
}
