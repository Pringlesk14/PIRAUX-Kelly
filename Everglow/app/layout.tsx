import type { Metadata, Viewport } from "next";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Everglow",
  description: "Vidéos, photos, stories et messages. Partage ce qui te fait briller.",
};

export const viewport: Viewport = { themeColor: "#0b0a12", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const unread = user
    ? (db().prepare("SELECT COUNT(*) AS n FROM messages WHERE recipient_id = ? AND read_at IS NULL").get(user.id) as { n: number }).n
    : 0;
  return (
    <html lang="fr">
      <body>
        <div className="app">
          {children}
          {user && <Nav username={user.username} unread={unread} />}
        </div>
      </body>
    </html>
  );
}
