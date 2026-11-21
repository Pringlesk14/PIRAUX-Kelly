"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/capsules";

/** Live countdown to a capsule's opening; refreshes the page when it reaches zero. */
export function Countdown({ openAt }: { openAt: number }) {
  const router = useRouter();
  const [left, setLeft] = useState(openAt - Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      const l = openAt - Date.now();
      setLeft(l);
      if (l <= 0) {
        clearInterval(t);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [openAt, router]);
  return (
    <span className="count" suppressHydrationWarning>
      {formatCountdown(left)}
    </span>
  );
}
