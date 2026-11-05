import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CLAMP } from "../theme";

/**
 * Gère l'apparition (ressort) et la disparition (fondu rapide) d'un élément
 * entre `at` et `until`, exprimés en secondes relatives à la scène.
 */
export const useEnterExit = (
  at: number,
  until: number,
  config: { damping?: number; stiffness?: number; mass?: number } = {},
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = Math.round(at * fps);
  const end = Math.round(until * fps);
  const visible = frame >= start && frame < end;
  const enter = spring({
    frame: frame - start,
    fps,
    config: { damping: 12, stiffness: 170, ...config },
  });
  const exit = interpolate(frame, [end - 6, end], [1, 0], CLAMP);
  return { visible, enter, exit, local: frame - start, frame, fps };
};

/** Ressort qui démarre à `at` secondes. */
export const useSpringAt = (
  at: number,
  config: { damping?: number; stiffness?: number } = {},
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - Math.round(at * fps),
    fps,
    config: { damping: 200, ...config },
  });
};
