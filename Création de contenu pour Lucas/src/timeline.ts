import { createContext, useContext } from "react";
import { FPS } from "./theme";

/**
 * Début / fin de la voix dans chaque clip source (s), mesurés sur l'audio.
 * Aucun mot n'est coupé : on garde PAD secondes de marge de chaque côté.
 */
const SPEECH = [
  { start: 0.6, end: 8.45 },
  { start: 1.5, end: 8.0 },
  { start: 1.7, end: 8.4 },
  { start: 2.2, end: 9.15 },
  { start: 0.95, end: 9.0 },
  { start: 1.3, end: 8.9 },
];
const PAD = 0.35;

/**
 * Points d'entrée / sortie (s, temps du clip source) : les silences de
 * début et de fin sont resserrés pour que les phrases s'enchaînent avec
 * ~0,1 s de respiration (PAD + PAD − fondu). La fin du dernier clip est
 * gardée pour l'écran « À très vite ».
 */
export const CLIP_WINDOWS = SPEECH.map((s, i) => ({
  in: i === 0 ? 0.3 : Math.max(0, s.start - PAD),
  out: i === SPEECH.length - 1 ? 9.9 : Math.min(10, s.end + PAD),
}));

/**
 * Pauses à l'intérieur des clips (s, temps du clip source), mesurées sur
 * l'audio (silence franc uniquement, jamais dans un mot ni un rire).
 * Chacune est retirée par une « coupe douce » qui laisse ~0,15 s de pause.
 */
const PAUSES: [number, number][][] = [
  [
    [2.65, 3.29],
    [4.9, 5.34],
  ],
  [],
  [[6.7, 7.17]],
  [],
  [[3.27, 4.3]],
  [[4.45, 5.05]],
];
/** Pause gardée de chaque côté d'une coupe (s). */
const KEEP = 0.075;

/** Durée du fondu enchaîné (image) entre deux clips, en images. */
export const XFADE = 14;
/** Durée du mini-fondu d'une coupe douce dans un même clip, en images. */
export const CUT_XFADE = 3;
/** Durée du fondu sonore, plus court : il ne touche que les silences. */
export const AUDIO_FADE = 5;

/**
 * Accélération appliquée à l'export final (voir le script « speed »).
 * Les timings du projet restent en vitesse normale.
 */
export const SPEED = 1.1;

/** Nature d'un raccord : changement de clip, ou coupe douce dans un même clip. */
export type JoinKind = "clip" | "cut" | null;

export type Segment = {
  clip: number;
  inFrame: number;
  outFrame: number;
  length: number;
  /** Chevauchement avec le segment précédent (images). */
  overlap: number;
  /** Image de début dans l'épisode. */
  start: number;
  inKind: JoinKind;
  outKind: JoinKind;
};

/** Chaque clip découpé en segments (sa fenêtre moins ses pauses), bout à bout. */
export const SEGMENTS: Segment[] = (() => {
  const out: Segment[] = [];
  let cursor = 0;
  CLIP_WINDOWS.forEach((w, clip) => {
    const bounds: [number, number][] = [];
    let from = w.in;
    for (const [ps, pe] of PAUSES[clip]) {
      bounds.push([from, ps + KEEP]);
      from = pe - KEEP;
    }
    bounds.push([from, w.out]);
    bounds.forEach(([a, b], k) => {
      const inFrame = Math.round(a * FPS);
      const outFrame = Math.round(b * FPS);
      const inKind: JoinKind = out.length === 0 ? null : k === 0 ? "clip" : "cut";
      const overlap = inKind === "clip" ? XFADE : inKind === "cut" ? CUT_XFADE : 0;
      const start = cursor - overlap;
      if (out.length) out[out.length - 1].outKind = inKind;
      out.push({ clip, inFrame, outFrame, length: outFrame - inFrame, overlap, start, inKind, outKind: null });
      cursor = start + (outFrame - inFrame);
    });
  });
  return out;
})();

const LAST = SEGMENTS[SEGMENTS.length - 1];
export const EPISODE_FRAMES = LAST.start + LAST.length;

/**
 * Informations de transition transmises à la couche vidéo d'une scène
 * (en images, temps du clip source). Absent = clip lu seul, sans transition.
 */
export type ClipTransition = {
  inFrame: number;
  outFrame: number;
  inKind: JoinKind;
  outKind: JoinKind;
};

export const TransitionContext = createContext<ClipTransition | null>(null);
export const useClipTransition = () => useContext(TransitionContext);
