"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

type Story = { id: number; kind: "video" | "photo"; media: string; created_at: number };
type Author = { username: string; display_name: string; avatar: string | null };

const PHOTO_MS = 5000;

export function StoryViewer({ author, stories, nextUser }: { author: Author; stories: Story[]; nextUser: string | null }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const story = stories[i];

  const next = () => {
    if (i < stories.length - 1) { setI(i + 1); setProgress(0); }
    else if (nextUser) router.push(`/stories/${nextUser}`);
    else router.push("/photos");
  };
  const prev = () => { if (i > 0) { setI(i - 1); setProgress(0); } };

  useEffect(() => {
    if (story.kind === "video") return;
    const start = Date.now();
    const t = setInterval(() => {
      const p = (Date.now() - start) / PHOTO_MS;
      if (p >= 1) { clearInterval(t); next(); } else setProgress(p);
    }, 50);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const hours = Math.max(1, Math.round((Date.now() - story.created_at) / 3600000));

  return (
    <div className="story-viewer">
      <div className="inner">
        <div className="bars">
          {stories.map((s, k) => (
            <div className="bar" key={s.id}><div style={{ width: `${k < i ? 100 : k === i ? progress * 100 : 0}%` }} /></div>
          ))}
        </div>
        <div className="head">
          <Link href={`/u/${author.username}`} className="row"><Avatar user={author} size={32} /><b>{author.username}</b></Link>
          <span className="small" style={{ opacity: 0.8 }}>{hours} h</span>
          <span className="spacer" />
          <Link href="/photos" className="icon-btn" aria-label="Fermer"><Icon name="close" /></Link>
        </div>
        {story.kind === "video" ? (
          <video
            key={story.id}
            ref={videoRef}
            className="media"
            src={`/media/${story.media}`}
            autoPlay
            playsInline
            onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
            onEnded={next}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={story.id} className="media" src={`/media/${story.media}`} alt={`Story de ${author.username}`} />
        )}
        <button className="tap left" aria-label="Précédente" onClick={prev} />
        <button className="tap right" aria-label="Suivante" onClick={next} />
      </div>
    </div>
  );
}
