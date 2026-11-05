import { Emoji } from "./Emoji";
import { interpolate } from "remotion";
import { CLAMP, COLORS, FONT } from "../theme";
import { useEnterExit } from "./timing";

/** Bandeau titre en haut de l'écran, entrée en glissé + rebond. */
export const Banner: React.FC<{
  at: number;
  until: number;
  text: string;
  emoji?: string;
  y?: number;
  bg?: string;
  color?: string;
  rotate?: number;
  size?: number;
  jitter?: boolean;
}> = ({
  at,
  until,
  text,
  emoji,
  y = 190,
  bg = COLORS.yellow,
  color = COLORS.ink,
  rotate = -3,
  size = 76,
  jitter = false,
}) => {
  const { visible, enter, exit, local } = useEnterExit(at, until);
  if (!visible) return null;
  const jx = jitter ? Math.sin(local * 3.1) * 6 : 0;
  const jy = jitter ? Math.cos(local * 2.3) * 4 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: y,
        transform: `translate(calc(-50% + ${jx + (1 - enter) * -700}px), calc(-50% + ${jy}px)) rotate(${rotate}deg) scale(${exit})`,
        opacity: interpolate(enter, [0, 0.2], [0, 1], CLAMP),
        background: bg,
        color,
        border: `7px solid ${COLORS.ink}`,
        boxShadow: `10px 10px 0 ${COLORS.ink}`,
        borderRadius: 22,
        padding: "16px 34px",
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <span>{text}</span>
      {emoji ? <Emoji e={emoji} size={size * 1.1} /> : null}
    </div>
  );
};
