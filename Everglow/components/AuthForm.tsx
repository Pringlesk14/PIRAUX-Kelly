"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, register, type FormState } from "@/app/actions";
import { MIN_AGE, PARENTAL_CONSENT_UNDER, ageFrom } from "@/lib/age";

export function AuthForm({ mode, notice }: { mode: "login" | "register"; notice?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : register, undefined);
  // Controlled fields so React doesn't clear them when the server returns an error.
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [parentOk, setParentOk] = useState(false);
  const [rulesOk, setRulesOk] = useState(false);
  const age = ageFrom(birthdate);
  const tooYoung = !Number.isNaN(age) && age < MIN_AGE;
  const needsParent = !Number.isNaN(age) && age >= MIN_AGE && age < PARENTAL_CONSENT_UNDER;
  return (
    <main className="auth">
      <div className="logo">everglow</div>
      <p className="tagline">Partage ce qui te fait briller ✨</p>
      <form action={action}>
        {notice && !state?.error && <p className="notice">{notice}</p>}
        {state?.error && <p className="error">{state.error}</p>}
        <div className="field">
          <label htmlFor="username">Nom d&apos;utilisateur</label>
          <input className="input" id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" required />
        </div>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="display_name">Nom affiché</label>
            <input className="input" id="display_name" name="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ex. : Kelly" />
          </div>
        )}
        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input className="input" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
        </div>
        {mode === "register" && (
          <>
            <div className="field">
              <label htmlFor="birthdate">Date de naissance</label>
              <input className="input" id="birthdate" name="birthdate" type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} required />
              <span className="muted small">Elle n&apos;est pas affichée sur ton profil. Everglow est ouvert à partir de {MIN_AGE} ans.</span>
            </div>
            {tooYoung && <p className="error">Everglow est réservé aux personnes de {MIN_AGE} ans et plus. Reviens nous voir plus tard !</p>}
            {needsParent && (
              <label className="check">
                <input type="checkbox" name="parent_ok" checked={parentOk} onChange={(e) => setParentOk(e.target.checked)} required />
                <span>Un parent ou responsable légal est d&apos;accord pour que je m&apos;inscrive (obligatoire avant {PARENTAL_CONSENT_UNDER} ans).</span>
              </label>
            )}
            <label className="check">
              <input type="checkbox" name="rules_ok" checked={rulesOk} onChange={(e) => setRulesOk(e.target.checked)} required />
              <span>
                J&apos;accepte les <Link href="/regles" target="_blank" style={{ color: "var(--glow-2)" }}>règles de la communauté et la politique de confidentialité</Link>.
              </span>
            </label>
          </>
        )}
        <button className="btn block" disabled={pending || tooYoung}>
          {pending ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>
      <p className="muted small" style={{ textAlign: "center", marginTop: 20 }}>
        {mode === "login" ? (
          <>Pas encore de compte ? <Link href="/register" style={{ color: "var(--glow-2)" }}>Inscris-toi</Link></>
        ) : (
          <>Déjà inscrit ? <Link href="/login" style={{ color: "var(--glow-2)" }}>Connecte-toi</Link></>
        )}
      </p>
      <p className="muted small" style={{ textAlign: "center", marginTop: 8 }}>
        <Link href="/regles">Règles de la communauté et confidentialité</Link>
      </p>
    </main>
  );
}
