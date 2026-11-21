"use client";

import { useActionState, useState } from "react";
import { deleteAccount, type FormState } from "@/app/actions";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, undefined);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [password, setPassword] = useState("");
  if (!open)
    return <button type="button" className="btn danger block" onClick={() => setOpen(true)}>Supprimer mon compte</button>;
  return (
    <form action={action} className="danger-zone">
      {state?.error && <p className="error">{state.error}</p>}
      <p className="small" style={{ lineHeight: 1.45, marginTop: 0 }}>
        Tout sera effacé <b>définitivement</b> : ton profil, tes vidéos, photos, stories, capsules, snaps, messages et commentaires. Ça ne peut pas être annulé.
      </p>
      <label className="check">
        <input type="checkbox" name="confirm" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} required />
        <span>Je comprends que tout sera supprimé pour toujours.</span>
      </label>
      <div className="field">
        <label htmlFor="delete-password">Ton mot de passe, pour confirmer</label>
        <input className="input" id="delete-password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </div>
      <div className="row">
        <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={() => setOpen(false)}>Annuler</button>
        <button className="btn danger" style={{ flex: 1 }} disabled={pending || !confirm}>{pending ? "Suppression…" : "Tout supprimer"}</button>
      </div>
    </form>
  );
}
