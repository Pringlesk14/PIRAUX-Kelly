"use client";

import { useActionState, useEffect, useState } from "react";
import { createPost, type FormState } from "@/app/actions";
import { Icon } from "./Icon";
import { DuoImage } from "./DuoImage";
import { cropHalf } from "@/lib/crop";

type Target = "post" | "half" | "story" | "capsule";
type Person = { username: string; display_name: string };

export function CreateForm({ accept, initialTarget, me, people, challengeTitle }: { accept: string; initialTarget: Target; me: string; people: Person[]; challengeTitle: string }) {
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
  const [joinChallenge, setJoinChallenge] = useState(true);
  const [halfCaption, setHalfCaption] = useState("");
  const [invite, setInvite] = useState("");
  const [cropping, setCropping] = useState(false);
  const [localError, setLocalError] = useState("");
  const cap = target === "capsule";
  const half = target === "half";
  const fileAccept = target === "post" ? "video/mp4,video/webm,video/quicktime" : half ? "image/jpeg,image/png,image/webp,image/gif" : accept;

  // React clears the file field after a failed send, so clear the preview too.
  useEffect(() => {
    if (state?.error) setPreview(null);
  }, [state]);

  // Each kind of post accepts different files, so a chosen file is cleared when switching.
  const switchTo = (t: Target) => {
    setTarget(t);
    setLocalError("");
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const f = input.files?.[0];
    setLocalError("");
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    if (!f) return;
    if (target === "post" && !f.type.startsWith("video/")) {
      input.value = "";
      return setLocalError("Choisis une vidéo. Les photos se partagent en Moitié-moitié.");
    }
    if (half) {
      if (!f.type.startsWith("image/")) {
        input.value = "";
        return setLocalError("Une moitié doit être une photo.");
      }
      setCropping(true);
      try {
        const left = await cropHalf(f, "left");
        const dt = new DataTransfer();
        dt.items.add(left);
        input.files = dt.files;
        setPreview({ url: URL.createObjectURL(left), video: false });
      } catch {
        input.value = "";
        setLocalError("Impossible de lire cette photo. Essaie avec une autre.");
      } finally {
        setCropping(false);
      }
      return;
    }
    setPreview({ url: URL.createObjectURL(f), video: f.type.startsWith("video/") });
  };

  return (
    <form action={action}>
      <div className="segmented">
        <label><input type="radio" name="target" value="post" checked={target === "post"} onChange={() => switchTo("post")} />Vidéo</label>
        <label><input type="radio" name="target" value="half" checked={half} onChange={() => switchTo("half")} />Moitié ✂️</label>
        <label><input type="radio" name="target" value="story" checked={target === "story"} onChange={() => switchTo("story")} />Story</label>
        <label><input type="radio" name="target" value="capsule" checked={cap} onChange={() => switchTo("capsule")} />Capsule</label>
      </div>
      {(localError || state?.error) && <p className="error">{localError || state?.error}</p>}
      {half && (
        <p className="muted small" style={{ margin: "0 0 14px", lineHeight: 1.45 }}>
          Choisis une photo : on garde sa <b>moitié gauche</b> (l&apos;autre moitié ne quitte pas ton téléphone). Un ami aura 24 h pour compléter la droite avec sa propre photo.
        </p>
      )}
      {cap && (
        <p className="muted small" style={{ margin: "0 0 14px", lineHeight: 1.45 }}>
          Scelle un souvenir : il reste verrouillé jusqu&apos;à la date choisie, même pour la personne qui le reçoit.
        </p>
      )}
      <label className={half ? "half-pick" : "dropzone"}>
        <input key={target} type="file" name="media" accept={fileAccept} required={!cap} onChange={onFile} hidden={half} />
        {half ? (
          preview ? (
            <DuoImage left={preview.url} rightSlot={<div className="half empty"><b>?</b>Ton ami complète ici</div>} />
          ) : (
            <div className="duo">
              <div className="half empty"><b>+</b>{cropping ? "Préparation…" : "Ta moitié gauche"}</div>
              <div className="half empty">Ton ami complète ici</div>
              <span className="seam" />
            </div>
          )
        ) : preview ? (
          preview.video ? (
            <video className="preview" src={preview.url} muted autoPlay loop playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="preview" src={preview.url} alt="Aperçu" />
          )
        ) : (
          <>
            <Icon name={cap ? "hourglass" : "video"} size={40} />
            <b style={{ color: "var(--text)" }}>{cap ? "Ajoute une vidéo ou une photo (facultatif)" : target === "post" ? "Choisis une vidéo" : "Choisis une vidéo ou une photo"}</b>
            <span className="small">{cap ? "Elle restera cachée jusqu'à l'ouverture" : target === "post" ? "Elle rejoint le fil Vidéos" : "Visible 24 h"}</span>
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
      ) : half ? (
        <>
          <div className="field">
            <label htmlFor="half-caption">Légende</label>
            <input className="input" id="half-caption" name="caption" value={halfCaption} onChange={(e) => setHalfCaption(e.target.value)} maxLength={200} placeholder="Ex. : Moi à la plage, et toi t'es où ?" />
          </div>
          <div className="field">
            <label htmlFor="invite">Qui complète ?</label>
            <select className="input" id="invite" name="invite" value={invite} onChange={(e) => setInvite(e.target.value)}>
              <option value="">Tout le monde</option>
              {people.map((p) => (
                <option key={p.username} value={p.username}>{p.display_name} (@{p.username}) seulement</option>
              ))}
            </select>
          </div>
        </>
      ) : target === "post" ? (
        <div className="field">
          <label htmlFor="caption">Légende</label>
          <textarea className="input" id="caption" name="caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} placeholder="Dis-en un peu plus… #everglow" />
          <label className="check" style={{ marginTop: 8 }}>
            <input type="checkbox" name="challenge" checked={joinChallenge} onChange={(e) => setJoinChallenge(e.target.checked)} />
            <span>
              Participer au <b>Défi du jour</b> : {challengeTitle}
              <br />
              <span className="muted small">Décoche pour la publier seulement pour tes abonnés.</span>
            </span>
          </label>
        </div>
      ) : (
        <p className="muted small">Ta story sera visible pendant 24 heures, puis elle disparaîtra.</p>
      )}
      <button className="btn block" disabled={pending || cropping}>
        {pending ? "Envoi en cours…" : cap ? "Sceller la capsule" : half ? "Envoyer ma moitié" : target === "story" ? "Partager la story" : "Publier"}
      </button>
    </form>
  );
}
