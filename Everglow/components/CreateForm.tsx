"use client";

import { useActionState, useEffect, useState } from "react";
import { createPost, type FormState } from "@/app/actions";
import { Icon } from "./Icon";

type Target = "post" | "story" | "capsule";
type Person = { username: string; display_name: string };

export function CreateForm({ accept, initialTarget, me, people }: { accept: string; initialTarget: Target; me: string; people: Person[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createPost, undefined);
  const [target, setTarget] = useState<Target>(initialTarget);
  const [preview, setPreview] = useState<{ url: string; video: boolean } | null>(null);
  // Controlled fields so React doesn't clear them when the server returns an error.
  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [to, setTo] = useState(me);
  const [when, setWhen] = useState("1y");
  const [date, setDate] = useState("");
  const cap = target === "capsule";

  // React clears the file field after a failed send, so clear the preview too.
  useEffect(() => {
    if (state?.error) setPreview(null);
  }, [state]);

  return (
    <form action={action}>
      <div className="segmented">
        <label><input type="radio" name="target" value="post" checked={target === "post"} onChange={() => setTarget("post")} />Publication</label>
        <label><input type="radio" name="target" value="story" checked={target === "story"} onChange={() => setTarget("story")} />Story 24 h</label>
        <label><input type="radio" name="target" value="capsule" checked={cap} onChange={() => setTarget("capsule")} />Capsule ⏳</label>
      </div>
      {state?.error && <p className="error">{state.error}</p>}
      {cap && (
        <p className="muted small" style={{ margin: "0 0 14px", lineHeight: 1.45 }}>
          Scelle un souvenir : il reste verrouillé jusqu&apos;à la date choisie, même pour la personne qui le reçoit.
        </p>
      )}
      <label className="dropzone">
        <input
          type="file"
          name="media"
          accept={accept}
          required={!cap}
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
            <Icon name={cap ? "hourglass" : "video"} size={40} />
            <b style={{ color: "var(--text)" }}>{cap ? "Ajoute une vidéo ou une photo (facultatif)" : "Choisis une vidéo ou une photo"}</b>
            <span className="small">{cap ? "Elle restera cachée jusqu'à l'ouverture" : "Vidéo → fil Vidéos · Photo → fil Photos"}</span>
          </>
        )}
      </label>
      {cap ? (
        <>
          <div className="field">
            <label htmlFor="title">Titre</label>
            <input className="input" id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Ex. : À ouvrir le jour de mes 18 ans" required />
          </div>
          <div className="field">
            <label htmlFor="message">Message</label>
            <textarea className="input" id="message" name="message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="Écris à la personne qui l'ouvrira…" />
          </div>
          <div className="field">
            <label htmlFor="to">Pour qui ?</label>
            <select className="input" id="to" name="to" value={to} onChange={(e) => setTo(e.target.value)}>
              <option value={me}>Moi, dans le futur</option>
              {people.map((p) => (
                <option key={p.username} value={p.username}>{p.display_name} (@{p.username})</option>
              ))}
            </select>
            {people.length === 0 && <span className="muted small">Abonne-toi à des personnes pour pouvoir leur envoyer des capsules.</span>}
          </div>
          <div className="field">
            <label htmlFor="when">S&apos;ouvre dans</label>
            <select className="input" id="when" name="when" value={when} onChange={(e) => setWhen(e.target.value)}>
              <option value="1min">1 minute (pour tester)</option>
              <option value="1h">1 heure</option>
              <option value="1d">1 jour</option>
              <option value="1w">1 semaine</option>
              <option value="1m">1 mois</option>
              <option value="1y">1 an</option>
              <option value="date">Choisir une date…</option>
            </select>
          </div>
          {when === "date" && (
            <div className="field">
              <label htmlFor="date">Date d&apos;ouverture</label>
              <input className="input" type="date" id="date" name="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          )}
        </>
      ) : target === "post" ? (
        <div className="field">
          <label htmlFor="caption">Légende</label>
          <textarea className="input" id="caption" name="caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} placeholder="Dis-en un peu plus… #everglow" />
        </div>
      ) : (
        <p className="muted small">Ta story sera visible pendant 24 heures, puis elle disparaîtra.</p>
      )}
      <button className="btn block" disabled={pending}>
        {pending ? "Envoi en cours…" : cap ? "Sceller la capsule" : target === "story" ? "Partager la story" : "Publier"}
      </button>
    </form>
  );
}
