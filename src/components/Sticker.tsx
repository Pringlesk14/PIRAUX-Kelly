import { Emoji } from "./Emoji";
import { CLAMP, COLORS, FONT } from "../theme";
import { interpolate } from "remotion";
import { useEnterExit } from "./timing";

/** Gros emoji + étiquette qui « pop » avec un léger balancement. */
export const Sticker: React.FC<{
  at: number;
  until: number;
  x: number;
  y: number;
  emoji: string;
  label?: string;
  rotate?: number;
  color?: string;
  size?: number;
}> = ({ at, until, x, y, emoji, label, rotate = 0, color = COLORS.yellow, size = 150 }) => {
  const { visible, enter, exit, local } = useEnterExit(at, until, { damping: 9 });
  if (!visible) return null;
  const wobble = Math.sin(local / 6) * 4;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${enter * exit}) rotate(${rotate + wobble}deg)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: interpolate(enter, [0, 0.2], [0, 1], CLAMP),
      }}
    >
      <Emoji e={emoji} size={size} style={{ filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.35))" }} />
      {label ? (
        <div
          style={{
            marginTop: 10,
            background: color,
            color: COLORS.ink,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 44,
            padding: "8px 22px",
            borderRadius: 16,
            border: `5px solid ${COLORS.ink}`,
            boxShadow: `6px 6px 0 ${COLORS.ink}`,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};
