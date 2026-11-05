import { Emoji } from "./Emoji";
import { interpolate } from "remotion";
import { CLAMP, COLORS, FONT } from "../theme";
import { useEnterExit } from "./timing";

const DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];

/** Calendrier « À FAIRE » dont le jour défile puis s'arrête sur DEMAIN. */
export const DayFlipper: React.FC<{ at: number; landAt: number; until: number; y?: number }> = ({
  at,
  landAt,
  until,
  y = 150,
}) => {
  const { visible, enter, exit, frame, fps } = useEnterExit(at, until, { damping: 11 });
  if (!visible) return null;
  const landed = frame >= landAt * fps;
  const idx = Math.floor((frame - at * fps) / 3) % DAYS.length;
  const label = landed ? "DEMAIN" : DAYS[idx];
  const flip = frame % 3;
  const landPop = landed
    ? interpolate(frame - landAt * fps, [0, 4, 10], [1.35, 0.95, 1], CLAMP)
    : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: y,
        width: 600,
        transform: `translateX(-50%) rotate(4deg) scale(${enter * exit})`,
        transformOrigin: "50% 0%",
        borderRadius: 26,
        overflow: "hidden",
        border: `7px solid ${COLORS.ink}`,
        boxShadow: `12px 12px 0 ${COLORS.ink}`,
        background: "white",
        fontFamily: FONT,
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: COLORS.red,
          color: "white",
          fontWeight: 900,
          fontSize: 44,
          padding: "10px 0",
        }}
      >
        <Emoji e="📅" size={48} style={{ marginTop: -8 }} /> DEVOIRS À FAIRE
      </div>
      <div
        style={{
          fontWeight: 900,
          fontSize: 92,
          padding: "22px 0",
          whiteSpace: "nowrap",
          color: landed ? COLORS.red : COLORS.ink,
          transform: `scale(${landPop}) ${landed ? "" : `translateY(${flip * -6}px)`}`,
        }}
      >
        {label}
        {landed ? <Emoji e="🙃" size={90} style={{ marginLeft: 14, marginTop: -10 }} /> : null}
      </div>
    </div>
  );
};
