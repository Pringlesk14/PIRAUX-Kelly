import { interpolate } from "remotion";
import { CLAMP, COLORS, FONT } from "../theme";
import { useEnterExit } from "./timing";

/** Tampon qui s'écrase sur l'écran (grand → taille normale). */
export const Stamp: React.FC<{
  at: number;
  until: number;
  text: string;
  sub?: string;
  x?: number;
  y: number;
  rotate?: number;
  color?: string;
  size?: number;
}> = ({ at, until, text, sub, x = 540, y, rotate = -8, color = COLORS.red, size = 96 }) => {
  const { visible, enter, exit } = useEnterExit(at, until, { damping: 14, stiffness: 260 });
  if (!visible) return null;
  const scale = interpolate(enter, [0, 1], [2.6, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
        opacity: interpolate(enter, [0, 0.25], [0, 1], CLAMP) * exit,
        border: `10px solid ${color}`,
        borderRadius: 24,
        padding: "14px 36px",
        background: "rgba(255,255,255,0.92)",
        textAlign: "center",
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: size,
          color,
          textTransform: "uppercase",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: size * 0.45,
            color: COLORS.ink,
            marginTop: 8,
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
