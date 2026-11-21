"use client";

import { useEffect, useRef, useState } from "react";
import { openSnap, sendMessage, sendSnap } from "@/app/actions";
import type { Message } from "@/lib/messages";
import { Icon } from "./Icon";

const POLL_MS = 3000;
const SNAP_PHOTO_SECONDS = 10;

function SnapViewer({ id, kind, name, onClose }: { id: number; kind: "video" | "photo"; name: string; onClose: () => void }) {
  const [left, setLeft] = useState<number | null>(kind === "photo" ? SNAP_PHOTO_SECONDS : null);
  // Kept in a ref so the chat's polling re-renders don't restart the timer.
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (kind !== "photo") return;
    const end = Date.now() + SNAP_PHOTO_SECONDS * 1000;
    const t = setInterval(() => {
      const l = Math.ceil((end - Date.now()) / 1000);
      if (l <= 0) {
        clearInterval(t);
        close.current();
      } else setLeft(l);
    }, 200);
    return () => clearInterval(t);
  }, [kind]);
  return (
    <div className="story-viewer">
      <div className="inner">
        <div className="head">
          <b>{name}</b>
          <span className="spacer" />
          {left !== null && <span className="snap-count" aria-label="Secondes restantes">{left}</span>}
          <button className="icon-btn" onClick={onClose} aria-label="Fermer" style={{ color: "#fff" }}><Icon name="close" /></button>
        </div>
        {kind === "video" ? (
          <video
            className="media"
            src={`/snap-media/${id}`}
            autoPlay
            playsInline
            onTimeUpdate={(e) => setLeft(Math.ceil(e.currentTarget.duration - e.currentTarget.currentTime) || null)}
            onEnded={onClose}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="media" src={`/snap-media/${id}`} alt={`Snap de ${name}`} />
        )}
        <button className="tap right" style={{ width: "100%", top: 60 }} aria-label="Fermer le snap" onClick={onClose} />
      </div>
    </div>
  );
}

export function Chat({ meId, otherId, username, name, initial, initialStreak }: { meId: number; otherId: number; username: string; name: string; initial: Message[]; initialStreak: number }) {
  const [messages, setMessages] = useState(initial);
  const [streak, setStreak] = useState(initialStreak);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [viewer, setViewer] = useState<{ id: number; kind: "video" | "photo" } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    const res = await fetch(`/api/messages/${username}`, { cache: "no-store" });
    if (!res.ok) return;
    const data: { messages: Message[]; streak: number } = await res.json();
    setMessages(data.messages);
    setStreak(data.streak);
  };

  useEffect(() => {
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages.length]);

  const bubble = (m: Message) => {
    const mine = m.sender_id === meId;
    if (m.kind === "snap") {
      if (mine) return <div key={m.id} className="bubble me snap"><Icon name="camera" size={16} /> Snap envoyé{m.opened_at ? " · ouvert" : ""}</div>;
      if (m.opened_at) return <div key={m.id} className="bubble them snap done"><Icon name="camera" size={16} /> Snap ouvert</div>;
      return (
        <button
          key={m.id}
          className="bubble them snap new"
          onClick={async () => {
            const opened = await openSnap(m.id);
            if (opened) setViewer({ id: m.id, kind: opened.kind });
            else refresh();
          }}
        >
          <Icon name="camera" size={16} /> Nouveau snap · touche pour voir
        </button>
      );
    }
    return <div key={m.id} className={`bubble ${mine ? "me" : "them"}`}>{m.body}</div>;
  };

  return (
    <>
      <div className="topbar-extra muted small" style={{ padding: "6px 16px", borderBottom: "1px solid var(--border)" }}>
        {streak > 0 ? <><span className="streak" style={{ marginLeft: 0 }}>🔥 {streak}</span> jour{streak > 1 ? "s" : ""} d&apos;affilée à vous envoyer des snaps</> : "Envoyez-vous un snap chaque jour pour allumer une flamme 🔥"}
      </div>
      <div className="thread" ref={threadRef}>
        {messages.length === 0 && (
          <p className="empty">
            Dis bonjour à @{username} 👋
            <br />
            <span className="small">Touche l&apos;appareil photo pour envoyer un snap : il disparaît dès qu&apos;il a été vu.</span>
          </p>
        )}
        {messages.map(bubble)}
      </div>
      {error && <p className="error" style={{ margin: "0 12px" }}>{error}</p>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const body = text.trim();
          if (!body) return;
          setText("");
          await sendMessage(otherId, body);
          await refresh();
        }}
      >
        <label className="snap-btn" title="Envoyer un snap" aria-label="Envoyer un snap (photo ou vidéo qui disparaît après une vue)" style={{ opacity: sending ? 0.5 : 1 }}>
          <Icon name="camera" size={22} />
          <input
            type="file"
            accept="image/*,video/*"
            disabled={sending}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setSending(true);
              setError("");
              const fd = new FormData();
              fd.set("media", f);
              const res = await sendSnap(otherId, fd);
              setSending(false);
              if (res?.error) setError(res.error);
              await refresh();
            }}
          />
        </label>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={sending ? "Envoi du snap…" : "Écris un message…"} maxLength={2000} autoComplete="off" />
        <button className="btn" aria-label="Envoyer"><Icon name="send" size={18} /></button>
      </form>
      {viewer && (
        <SnapViewer
          id={viewer.id}
          kind={viewer.kind}
          name={name}
          onClose={() => {
            setViewer(null);
            refresh();
          }}
        />
      )}
    </>
  );
}
