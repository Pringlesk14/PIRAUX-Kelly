import { Emoji } from "./Emoji";
import { interpolate, random, spring } from "remotion";
import { CLAMP, COLORS, FONT } from "../theme";
import { useEnterExit } from "./timing";

/** Bouton « S'abonner » cliqué par une main → « Abonné ✓ ». */
export const Subscribe: React.FC<{ at: number; clickAt: number; until: number; y?: number }> = ({
  at,
  clickAt,
  until,
  y = 1060,
}) => {
  const { visible, enter, exit, frame, fps } = useEnterExit(at, until, { damping: 10 });
  if (!visible) return null;
  const click = Math.round(clickAt * fps);
  const clicked = frame >= click;
  const press = interpolate(frame, [click - 3, click, click + 5], [1, 0.86, 1], CLAMP);
  // La main arrive du coin bas-droit et tape sur le bouton.
  const hand = spring({ frame: frame - Math.round(at * fps) - 4, fps, config: { damping: 200 }, durationInFrames: Math.max(1, click - Math.round(at * fps) - 4) });
  const handOut = interpolate(frame, [click + 6, click + 16], [0, 1], CLAMP);
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: y,
        transform: `translate(-50%, -50%) scale(${enter * exit * press})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "26px 54px",
          borderRadius: 999,
          background: clicked ? "#3A3A3A" : COLORS.red,
          color: "white",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 66,
          whiteSpace: "nowrap",
          boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
          border: "6px solid white",
        }}
      >
        <Emoji e="🔔" size={70} />
        {clicked ? "ABONNÉ ✓" : "S'ABONNER"}
      </div>
      <div
        style={{
          position: "absolute",
          left: "62%",
          top: "55%",
          transform: `translate(${(1 - hand) * 420 + handOut * 300}px, ${(1 - hand) * 520 + handOut * 300}px)`,
          filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.4))",
        }}
      >
        <Emoji e="👆" size={140} />
      </div>
    </div>
  );
};

/** Gros cœur « like » avec explosion de petits cœurs. */
export const LikeBurst: React.FC<{ at: number; until: number; x: number; y: number }> = ({
  at,
  until,
  x,
  y,
}) => {
  const { visible, enter, exit, local, fps } = useEnterExit(at, until, { damping: 7, stiffness: 220 });
  if (!visible) return null;
  const t = local / fps;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: exit }}>
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2 + random(`h${i}`) * 0.4;
        const dist = interpolate(t, [0, 0.6], [0, 230 + random(`hd${i}`) * 80], CLAMP);
        const op = interpolate(t, [0.3, 0.8], [1, 0], CLAMP);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              opacity: op,
              transform: `translate(-50%, -50%) translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`,
            }}
          >
            <Emoji e="❤️" size={60} />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          transform: `translate(-50%, -50%) scale(${enter}) rotate(${Math.sin(t * 8) * 6}deg)`,
          filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.4))",
        }}
      >
        <Emoji e="❤️" size={230} />
      </div>
    </div>
  );
};
