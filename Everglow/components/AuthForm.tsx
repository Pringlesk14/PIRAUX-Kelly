"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, register, type FormState } from "@/app/actions";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : register, undefined);
  // Controlled fields so React doesn't clear them when the server returns an error.
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  return (
    <main className="auth">
      <div className="logo">everglow</div>
      <p className="tagline">Partage ce qui te fait briller ✨</p>
      <form action={action}>
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
          <input className="input" id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
        </div>
        <button className="btn block" disabled={pending}>
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
    </main>
  );
}
