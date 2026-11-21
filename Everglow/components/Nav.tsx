"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

export function Nav({ username, unread }: { username: string; unread: number }) {
  const path = usePathname();
  const is = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));
  return (
    <nav className="nav">
      <Link href="/" className={is("/") ? "active" : ""}>
        <Icon name="home" />
        Vidéos
      </Link>
      <Link href="/photos" className={is("/photos") ? "active" : ""}>
        <Icon name="image" />
        Photos
      </Link>
      <Link href="/create" className="create" aria-label="Publier">
        <Icon name="plus" />
      </Link>
      <Link href="/messages" className={is("/messages") ? "active" : ""} style={{ position: "relative" }}>
        <Icon name="chat" />
        Messages
        {unread > 0 && <span className="unread-dot" style={{ position: "absolute", top: 4, right: 14 }} />}
      </Link>
      <Link href={`/u/${username}`} className={is("/u/") ? "active" : ""}>
        <Icon name="user" />
        Profil
      </Link>
    </nav>
  );
}
