import { Emoji } from "./Emoji";
import { AbsoluteFill, random } from "remotion";
import { useEnterExit } from "./timing";

/** Emojis qui montent depuis le bas de l'écran (rires, cœurs…). */
export const FloatingEmojis: React.FC<{
  at: number;
  until: number;
  emojis: string[];
  count?: number;
  seed?: string;
}> = ({ at, until, emojis, count = 14, seed = "float" }) => {
  const { visible, exit, local, fps } = useEnterExit(at, until);
  if (!visible) return null;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {Array.from({ length: count }).map((_, i) => {
        const delay = random(`${seed}-d-${i}`) * fps * 1.2;
        const t = (local - delay) / fps;
        if (t < 0) return null;
        const speed = 500 + random(`${seed}-s-${i}`) * 400;
        const x = 60 + random(`${seed}-x-${i}`) * 960;
        const size = 80 + random(`${seed}-z-${i}`) * 70;
        const sway = Math.sin(t * 3 + i) * 40;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + sway,
              top: 1950 - t * speed,
              transform: `rotate(${Math.sin(t * 2 + i) * 18}deg)`,
            }}
          >
            <Emoji e={emojis[i % emojis.length]} size={size} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
