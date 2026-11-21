"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/capsules";

/** Live countdown (capsule opening, end of the daily challenge); refreshes the page at zero. */
export function Countdown({ openAt, className = "count" }: { openAt: number; className?: string }) {
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
    <span className={className} suppressHydrationWarning>
      {formatCountdown(left)}
    </span>
  );
}
