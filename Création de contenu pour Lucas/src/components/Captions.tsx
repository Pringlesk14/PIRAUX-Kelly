import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CLAMP, COLORS, FONT } from "../theme";
import { CUT_XFADE, useClipTransition } from "../timeline";

export type Word = { text: string; start: number; end: number };

type Page = { words: Word[]; start: number; end: number };

/** Regroupe les mots en « pages » de 3 mots max, coupées à la ponctuation. */
const toPages = (words: Word[]): Page[] => {
  const pages: Page[] = [];
  let current: Word[] = [];
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const gap = prev ? w.start - prev.end : 0;
    if (current.length >= 3 || (current.length > 0 && gap > 0.5)) {
      pages.push({ words: current, start: current[0].start, end: 0 });
      current = [];
    }
    current.push(w);
    if (/[.,!?…]$/.test(w.text)) {
      pages.push({ words: current, start: current[0].start, end: 0 });
      current = [];
    }
  });
  if (current.length) pages.push({ words: current, start: current[0].start, end: 0 });
  pages.forEach((p, i) => {
    const last = p.words[p.words.length - 1];
    const next = pages[i + 1];
    p.end = next ? Math.min(next.start, last.end + 0.8) : last.end + 0.8;
  });
  return pages;
};

const clean = (t: string) => t.replace(/[.,]$/, "");

/** Sous-titres animés façon karaoké, mot actif surligné. */
export const Captions: React.FC<{ words: Word[]; top?: number }> = ({
  words,
  top = 1270,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tr = useClipTransition();
  // Sur une coupe douce, les sous-titres sortants laissent la place aux entrants.
  if (tr?.outKind === "cut" && frame >= tr.outFrame - CUT_XFADE) return null;
  const t = frame / fps;
  const pages = toPages(words);
  const page = pages.find((p) => t >= p.start && t < p.end);
  if (!page) return null;

  const pageFrame = frame - Math.round(page.start * fps);
  const enter = spring({ frame: pageFrame, fps, config: { damping: 14, stiffness: 220 } });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top,
          left: 70,
          right: 70,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 30px",
          transform: `translateY(${(1 - enter) * 40}px) scale(${0.85 + 0.15 * enter})`,
          opacity: interpolate(enter, [0, 0.3], [0, 1], CLAMP),
        }}
      >
        {page.words.map((w, i) => {
          const nextStart = page.words[i + 1]?.start ?? page.end;
          const active = t >= w.start && t < nextStart;
          const said = t >= w.start;
          const pop = spring({
            frame: frame - Math.round(w.start * fps),
            fps,
            config: { damping: 10, stiffness: 260 },
          });
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 84,
                lineHeight: 1.15,
                textTransform: "uppercase",
                color: active ? COLORS.yellow : "white",
                opacity: said ? 1 : 0.55,
                WebkitTextStroke: "14px black",
                paintOrder: "stroke fill",
                textShadow: "0 8px 0 rgba(0,0,0,0.35)",
                display: "inline-block",
                transform: active ? `scale(${1 + 0.12 * (1 - pop) + 0.04})` : "scale(1)",
              }}
            >
              {clean(w.text)}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
