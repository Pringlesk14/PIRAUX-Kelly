import { createContext, useContext } from "react";
import { FPS } from "./theme";

/**
 * Points d'entrée / sortie (en secondes, temps du clip source) : on coupe
 * les silences de début et de fin pour que la parole s'enchaîne comme
 * dans une seule prise.
 */
export const CLIP_WINDOWS = [
  { in: 0.3, out: 8.75 },
  { in: 1.3, out: 8.35 },
  { in: 1.55, out: 8.8 },
  { in: 1.95, out: 9.5 },
  { in: 0.75, out: 9.25 },
  { in: 1.1, out: 10.0 },
];

/** Durée du fondu enchaîné entre deux clips (images). */
export const XFADE = 8;

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
