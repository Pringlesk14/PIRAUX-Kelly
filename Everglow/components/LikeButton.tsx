"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/app/actions";
import { Icon } from "./Icon";

export function LikeButton({ postId, liked: initialLiked, count: initialCount, size = 32 }: { postId: number; liked: boolean; count: number; size?: number }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      className={`action${liked ? " liked" : ""}`}
      aria-pressed={liked}
      aria-label="J'aime"
      onClick={() => {
        setLiked(!liked);
        setCount(count + (liked ? -1 : 1));
        start(async () => {
          const res = await toggleLike(postId);
          setLiked(res.liked);
          setCount(res.count);
        });
      }}
    >
      <Icon name="heart" size={size} />
      {count}
    </button>
  );
}
