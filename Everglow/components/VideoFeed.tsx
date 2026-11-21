"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FeedPost } from "@/lib/db";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { LikeButton } from "./LikeButton";

function Clip({ post, muted, onToggleMute }: { post: FeedPost; muted: boolean; onToggleMute: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  // Play only the clip that is on screen.
  useEffect(() => {
    const video = ref.current!;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setPaused(false);
        } else {
          video.pause();
          video.currentTime = 0;
        }
      },
      { threshold: 0.6 },
    );
    obs.observe(video);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="clip">
      <video
        ref={ref}
        src={`/media/${post.media}`}
        loop
        playsInline
        muted={muted}
        preload="metadata"
        onClick={() => {
          const v = ref.current!;
          if (v.paused) { v.play(); setPaused(false); } else { v.pause(); setPaused(true); }
        }}
      />
      {paused && <div className="paused"><Icon name="play" size={72} fill="rgba(255,255,255,.8)" stroke="none" /></div>}
      <div className="overlay">
        <Link href={`/u/${post.username}`} className="author">
          <Avatar user={post} size={36} />@{post.username}
        </Link>
        {post.caption && <div className="caption">{post.caption}</div>}
      </div>
      <div className="actions">
        <LikeButton postId={post.id} liked={!!post.liked} count={post.like_count} />
        <Link href={`/p/${post.id}`} className="action" aria-label="Commentaires">
          <Icon name="comment" size={32} />
          {post.comment_count}
        </Link>
        <button type="button" className="action" onClick={onToggleMute} aria-label={muted ? "Activer le son" : "Couper le son"}>
          <Icon name={muted ? "mute" : "volume"} size={30} />
        </button>
      </div>
    </section>
  );
}

export function VideoFeed({ posts }: { posts: FeedPost[] }) {
  // Browsers only autoplay muted videos; the viewer turns sound on once.
  const [muted, setMuted] = useState(true);
  return (
    <div className="feed">
      {posts.map((p) => (
        <Clip key={p.id} post={p} muted={muted} onToggleMute={() => setMuted(!muted)} />
      ))}
    </div>
  );
}
