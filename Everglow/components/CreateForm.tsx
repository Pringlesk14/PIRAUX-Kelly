"use client";

import { useActionState, useEffect, useState } from "react";
import { createPost, type FormState } from "@/app/actions";
import { Icon } from "./Icon";

export function CreateForm({ accept, initialTarget }: { accept: string; initialTarget: "post" | "story" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createPost, undefined);
  const [target, setTarget] = useState(initialTarget);
  const [preview, setPreview] = useState<{ url: string; video: boolean } | null>(null);
  const [caption, setCaption] = useState("");
  // React clears the file field after a failed send, so clear the preview too.
  useEffect(() => {
    if (state?.error) setPreview(null);
  }, [state]);

  return (
    <form action={action}>
      <div className="segmented">
        <label><input type="radio" name="target" value="post" checked={target === "post"} onChange={() => setTarget("post")} />Publication</label>
        <label><input type="radio" name="target" value="story" checked={target === "story"} onChange={() => setTarget("story")} />Story 24 h</label>
      </div>
      {state?.error && <p className="error">{state.error}</p>}
      <label className="dropzone">
        <input
          type="file"
          name="media"
          accept={accept}
          required
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (preview) URL.revokeObjectURL(preview.url);
            setPreview(f ? { url: URL.createObjectURL(f), video: f.type.startsWith("video/") } : null);
          }}
        />
        {preview ? (
          preview.video ? (
            <video className="preview" src={preview.url} muted autoPlay loop playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="preview" src={preview.url} alt="Aperçu" />
          )
        ) : (
          <>
            <Icon name="video" size={40} />
            <b style={{ color: "var(--text)" }}>Choisis une vidéo ou une photo</b>
            <span className="small">Vidéo → fil Vidéos · Photo → fil Photos</span>
          </>
        )}
      </label>
      {target === "post" ? (
        <div className="field">
          <label htmlFor="caption">Légende</label>
          <textarea className="input" id="caption" name="caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} placeholder="Dis-en un peu plus… #everglow" />
        </div>
      ) : (
        <p className="muted small">Ta story sera visible pendant 24 heures, puis elle disparaîtra.</p>
      )}
      <button className="btn block" disabled={pending}>{pending ? "Envoi en cours…" : target === "story" ? "Partager la story" : "Publier"}</button>
    </form>
  );
}
