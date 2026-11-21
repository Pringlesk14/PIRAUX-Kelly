"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

export function Nav({ username, unread, capsulesReady, halvesForMe }: { username: string; unread: number; capsulesReady: number; halvesForMe: number }) {
  const path = usePathname();
  const is = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));
  return (
    <nav className="nav">
      <Link href="/" className={is("/") ? "active" : ""}>
        <Icon name="home" />
        Vidéos
      </Link>
      <Link href="/photos" className={is("/photos") || is("/moitie") ? "active" : ""} style={{ position: "relative" }}>
        <Icon name="image" />
        Photos
        {halvesForMe > 0 && <span className="unread-dot" style={{ position: "absolute", top: 4, right: 12 }} />}
      </Link>
      <Link href="/create" className="create" aria-label="Publier">
        <Icon name="plus" />
      </Link>
      <Link href="/capsules" className={is("/capsules") ? "active" : ""} style={{ position: "relative" }}>
        <Icon name="hourglass" />
        Capsules
        {capsulesReady > 0 && <span className="unread-dot" style={{ position: "absolute", top: 4, right: 12 }} />}
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
