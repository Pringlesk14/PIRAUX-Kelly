"use client";

import { useEffect, useRef, useState } from "react";
import { sendMessage } from "@/app/actions";
import type { Message } from "@/lib/messages";
import { Icon } from "./Icon";

const POLL_MS = 3000;

export function Chat({ meId, otherId, username, initial }: { meId: number; otherId: number; username: string; initial: Message[] }) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const lastId = useRef(initial.at(-1)?.id ?? 0);

  const refresh = async () => {
    const res = await fetch(`/api/messages/${username}?after=${lastId.current}`, { cache: "no-store" });
    if (!res.ok) return;
    const fresh: Message[] = await res.json();
    if (fresh.length) {
      lastId.current = fresh.at(-1)!.id;
      setMessages((m) => [...m, ...fresh.filter((f) => !m.some((x) => x.id === f.id))]);
    }
  };

  useEffect(() => {
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages.length]);

  return (
    <>
      <div className="thread" ref={threadRef}>
        {messages.length === 0 && <p className="empty">Dis bonjour à @{username} 👋</p>}
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.sender_id === meId ? "me" : "them"}`}>{m.body}</div>
        ))}
      </div>
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
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Écris un message…" maxLength={2000} autoComplete="off" />
        <button className="btn" aria-label="Envoyer"><Icon name="send" size={18} /></button>
      </form>
    </>
  );
}
