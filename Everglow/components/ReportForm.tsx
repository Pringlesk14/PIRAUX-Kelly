"use client";

import { useActionState, useState } from "react";
import { createReport, type FormState } from "@/app/actions";
import { REPORT_REASONS } from "@/lib/reports";

export function ReportForm({ type, id }: { type: string; id: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createReport, undefined);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  return (
    <form action={action}>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={id} />
      {state?.error && <p className="error">{state.error}</p>}
      <fieldset className="reasons">
        <legend className="muted small">Pourquoi signales-tu ce contenu ?</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r} className={`reason${reason === r ? " on" : ""}`}>
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} required />
            {r}
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="details">Détails (facultatif)</label>
        <textarea className="input" id="details" name="details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} placeholder="Explique ce qui ne va pas…" />
      </div>
      <button className="btn block" disabled={pending}>{pending ? "Envoi…" : "Envoyer le signalement"}</button>
      <p className="muted small" style={{ textAlign: "center" }}>Ton signalement est anonyme : la personne signalée ne saura pas que c&apos;est toi.</p>
    </form>
  );
}
