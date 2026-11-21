import { mediaUrl } from "@/lib/media";

const COLORS = ["#ff5f8f", "#a66bff", "#ffb347", "#4fc3f7", "#5ee6a8", "#ff8a65"];

export function Avatar({ user, size = 40 }: { user: { username: string; display_name?: string; avatar: string | null }; size?: number }) {
  if (user.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="avatar" src={mediaUrl(user.avatar)} alt="" width={size} height={size} style={{ width: size, height: size }} />;
  }
  const color = COLORS[[...user.username].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  const letter = (user.display_name || user.username).charAt(0).toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.42, color: "#1a0d14" }}>
      {letter}
    </span>
  );
}
