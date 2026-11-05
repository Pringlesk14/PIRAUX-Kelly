import { Emoji } from "./Emoji";
import { spring } from "remotion";
import { useEnterExit } from "./timing";

/** Pile d'emojis qui monte (ex. la « montagne » de devoirs). */
export const EmojiStack: React.FC<{
  at: number;
  until: number;
  emoji: string;
  count: number;
  x: number;
  bottom: number;
  interval?: number;
  size?: number;
}> = ({ at, until, emoji, count, x, bottom, interval = 0.12, size = 120 }) => {
  const { visible, exit, frame, fps } = useEnterExit(at, until);
  if (!visible) return null;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const start = Math.round((at + i * interval) * fps);
        if (frame < start) return null;
        const drop = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 200 } });
        const offset = (i % 2 === 0 ? -1 : 1) * 14;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + offset,
              top: bottom - i * size * 0.62,
              transform: `translate(-50%, ${(1 - drop) * -260}px) rotate(${offset * 0.6}deg) scale(${exit})`,
              filter: "drop-shadow(0 8px 8px rgba(0,0,0,0.35))",
            }}
          >
            <Emoji e={emoji} size={size} />
          </div>
        );
      })}
    </>
  );
};
