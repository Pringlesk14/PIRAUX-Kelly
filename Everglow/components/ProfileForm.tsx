"use client";

import { useActionState, useState } from "react";
import { updateProfile, type FormState } from "@/app/actions";

export function ProfileForm({ displayName, bio }: { displayName: string; bio: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, undefined);
  const [name, setName] = useState(displayName);
  const [text, setText] = useState(bio);
  return (
    <form action={action}>
      {state?.error && <p className="error">{state.error}</p>}
      <div className="field">
        <label htmlFor="avatar">Photo de profil</label>
        <input className="input" id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
      </div>
      <div className="field">
        <label htmlFor="display_name">Nom affiché</label>
        <input className="input" id="display_name" name="display_name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
      </div>
      <div className="field">
        <label htmlFor="bio">Bio</label>
        <textarea className="input" id="bio" name="bio" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} />
      </div>
      <button className="btn block" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
    </form>
  );
}
