"use client";

import { useActionState, useRef, useState } from "react";
import { completeHalf, type FormState } from "@/app/actions";
import { cropHalf } from "@/lib/crop";
import { DuoImage } from "./DuoImage";

export function CompleteHalf({ halfId, left }: { halfId: number; left: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(completeHalf.bind(null, halfId), undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError("");
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Ta moitié doit être une photo.");
    setBusy(true);
    try {
      // Only the right half of your photo is sent.
      const half = await cropHalf(f, "right");
      const dt = new DataTransfer();
      dt.items.add(half);
      e.target.files = dt.files;
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(half));
    } catch {
      setError("Impossible de lire cette photo. Essaie avec une autre.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form action={action} style={{ padding: "0 16px 16px" }}>
      {(state?.error || error) && <p className="error">{state?.error || error}</p>}
      <input ref={input} id="half-file" type="file" name="media" accept="image/*" onChange={pick} hidden />
      <DuoImage
        left={left}
        right={preview}
        rightSlot={
          <label className="half empty" htmlFor="half-file">
            <b>+</b>
            {busy ? "Préparation…" : "Touche ici pour ajouter ta moitié"}
          </label>
        }
      />
      <div className="row" style={{ marginTop: 14 }}>
        {preview && (
          <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={() => input.current?.click()}>Changer</button>
        )}
        <button className="btn" style={{ flex: 2 }} disabled={!preview || busy || pending}>{pending ? "Assemblage…" : "Assembler la photo"}</button>
      </div>
    </form>
  );
}
