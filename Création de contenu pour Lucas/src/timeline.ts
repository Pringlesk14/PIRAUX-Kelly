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
const PAD = 0.45;

/**
 * Points d'entrée / sortie (s, temps du clip source) : les silences de
 * début et de fin sont resserrés pour que les phrases s'enchaînent avec
 * ~0,3 s de respiration (PAD + PAD − fondu). La fin du dernier clip est
 * gardée pour l'écran « À très vite ».
 */
export const CLIP_WINDOWS = SPEECH.map((s, i) => ({
  in: i === 0 ? 0.3 : Math.max(0, s.start - PAD),
  out: i === SPEECH.length - 1 ? 9.9 : Math.min(10, s.end + PAD),
}));

/** Durée du fondu enchaîné (image) entre deux clips, en images. */
export const XFADE = 14;
/** Durée du fondu sonore, plus court : il ne touche que les silences. */
export const AUDIO_FADE = 5;

/**
 * Accélération appliquée à l'export final (voir le script « render »).
 * Les timings du projet restent en vitesse normale.
 */
export const SPEED = 1.1;

export const clipFrames = (i: number) => {
  const w = CLIP_WINDOWS[i];
  return {
    inFrame: Math.round(w.in * FPS),
    outFrame: Math.round(w.out * FPS),
    length: Math.round(w.out * FPS) - Math.round(w.in * FPS),
  };
};

export const EPISODE_FRAMES =
  CLIP_WINDOWS.reduce((sum, _, i) => sum + clipFrames(i).length, 0) -
  XFADE * (CLIP_WINDOWS.length - 1);

/**
 * Informations de transition transmises à la couche vidéo d'une scène
 * (en images, temps du clip source). Absent = clip lu seul, sans transition.
 */
export type ClipTransition = {
  inFrame: number;
  outFrame: number;
  fadeIn: boolean;
  fadeOut: boolean;
};

export const TransitionContext = createContext<ClipTransition | null>(null);
export const useClipTransition = () => useContext(TransitionContext);
