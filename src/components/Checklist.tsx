import { Emoji } from "./Emoji";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CLAMP, COLORS, FONT } from "../theme";
import { useEnterExit } from "./timing";

export type ChecklistItem = {
  label: string;
  emoji: string;
  /** Apparition de la ligne (s). Par défaut : en même temps que la carte. */
  appearAt?: number;
  /** Coche verte dessinée à ce moment (s). Avant `at` = déjà cochée. */
  checkAt?: number;
  /** Ligne barrée en rouge à ce moment (s). */
  crossAt?: number;
  /** Nouveau texte manuscrit qui remplace la ligne barrée. */
  replace?: { at: number; label: string };
};

/** Carte « page de cahier » avec une liste qui se coche / se barre. */
export const Checklist: React.FC<{
  at: number;
  until: number;
  title: string;
  items: ChecklistItem[];
  y?: number;
}> = ({ at, until, title, items, y = 110 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { visible, enter, exit } = useEnterExit(at, until, { damping: 13 });
  if (!visible) return null;
  const sp = (sec: number, damping = 200) =>
    spring({ frame: frame - Math.round(sec * fps), fps, config: { damping } });

  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: y,
        width: 800,
        transform: `translateX(-50%) translateY(${(1 - enter) * -400}px) rotate(-2deg) scale(${exit})`,
        transformOrigin: "50% 0%",
        background: COLORS.paper,
        backgroundImage: `repeating-linear-gradient(transparent 0 69px, ${COLORS.line} 69px 72px)`,
        backgroundPosition: "0 82px",
        borderLeft: `8px solid ${COLORS.red}`,
        borderRadius: 18,
        boxShadow: "0 22px 50px rgba(0,0,0,0.4)",
        padding: `18px 34px ${items.some((it) => it.replace) ? 64 : 22}px 40px`,
        fontFamily: FONT,
        color: COLORS.ink,
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 50, height: 64, textTransform: "uppercase" }}>
        {title}
      </div>
      {items.map((item, i) => {
        const appear = sp(item.appearAt ?? at, 12);
        if ((item.appearAt ?? at) * fps > frame) return null;
        const check = item.checkAt !== undefined ? sp(item.checkAt) : 0;
        const cross = item.crossAt !== undefined ? sp(item.crossAt) : 0;
        const repl = item.replace ? sp(item.replace.at, 14) : 0;
        const crossed = item.crossAt !== undefined && frame >= item.crossAt * fps;
        return (
          <div
            key={i}
            style={{
              height: 72,
              display: "flex",
              alignItems: "center",
              gap: 18,
              transform: `translateX(${(1 - appear) * 120}px)`,
              opacity: interpolate(appear, [0, 0.4], [0, 1], CLAMP),
            }}
          >
            {/* Case à cocher */}
            <div
              style={{
                width: 50,
                height: 50,
                flexShrink: 0,
                border: `5px solid ${COLORS.ink}`,
                borderRadius: 10,
                position: "relative",
                background: "white",
              }}
            >
              <svg viewBox="0 0 50 50" style={{ position: "absolute", inset: -6, width: 62, height: 62 }}>
                {crossed ? (
                  <g stroke={COLORS.red} strokeWidth={8} strokeLinecap="round" opacity={cross}>
                    <line x1={12} y1={12} x2={50} y2={50} />
                    <line x1={50} y1={12} x2={12} y2={50} />
                  </g>
                ) : (
                  <path
                    d="M10 28 L24 42 L52 8"
                    fill="none"
                    stroke={COLORS.green}
                    strokeWidth={9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={70}
                    strokeDashoffset={70 * (1 - check)}
                  />
                )}
              </svg>
            </div>
            {/* Libellé + barre rouge + remplacement */}
            <div style={{ position: "relative", fontWeight: 700, fontSize: 46, whiteSpace: "nowrap" }}>
              <span style={{ opacity: item.replace ? 1 - repl * 0.55 : 1 }}>
                {item.label} <Emoji e={item.emoji} size={50} style={{ marginTop: -8 }} />
              </span>
              {item.crossAt !== undefined ? (
                <div
                  style={{
                    position: "absolute",
                    left: -6,
                    right: -6,
                    top: "52%",
                    height: 8,
                    borderRadius: 4,
                    background: COLORS.red,
                    transform: `scaleX(${cross})`,
                    transformOrigin: "0 50%",
                  }}
                />
              ) : null}
              {item.replace && frame >= item.replace.at * fps ? (
                <div
                  style={{
                    position: "absolute",
                    left: 30,
                    top: 58,
                    color: COLORS.red,
                    fontWeight: 900,
                    fontSize: 40,
                    transform: `rotate(-6deg) scale(${repl})`,
                    transformOrigin: "0 100%",
                  }}
                >
                  {item.replace.label}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
