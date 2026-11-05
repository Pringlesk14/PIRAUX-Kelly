import { Audio, interpolate, staticFile, useVideoConfig } from "remotion";
import clip1 from "../captions/clip1.json";
import clip2 from "../captions/clip2.json";
import clip3 from "../captions/clip3.json";
import clip4 from "../captions/clip4.json";
import clip5 from "../captions/clip5.json";
import clip6 from "../captions/clip6.json";
import { CLAMP } from "../theme";
import { CLIP_WINDOWS, clipFrames, XFADE } from "../timeline";

const CAPTIONS = [clip1, clip2, clip3, clip4, clip5, clip6];

/** Volume de la musique quand personne ne parle / pendant la parole. */
const OPEN = 0.19;
const DUCKED = 0.075;
/** Temps de montée / descente du « ducking » (s). */
const RAMP = 0.25;

/**
 * Moments de la musique qui doivent rester audibles même sous la voix
 * (temps de l'épisode, en s — voir scripts/generate-music.py).
 */
const ACCENTS = (end: number): { from: number; to: number; level: number }[] => [
  { from: 0, to: 0.7, level: 0.17 }, // démarrage de la musique
  { from: end - 2.9, to: end, level: 0.17 }, // accord final
];

/** Intervalles de parole sur la timeline de l'épisode (en secondes). */
const speechIntervals = (fps: number) => {
  const out: [number, number][] = [];
  let start = 0;
  CAPTIONS.forEach((words, i) => {
    const offset = start / fps - CLIP_WINDOWS[i].in;
    for (const w of words) out.push([w.start + offset, w.end + offset]);
    start += clipFrames(i).length - XFADE;
  });
  return out;
};

/**
 * Musique de fond originale : un seul thème lo-fi / chill sur toute la vidéo
 * (scripts/generate-music.py), qui baisse
 * automatiquement quand Lucas parle et remonte dans les silences.
 */
export const Music: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const speech = speechIntervals(fps);

  const volume = (f: number) => {
    const t = f / fps;
    let talk = 0;
    for (const [s, e] of speech) {
      if (t >= s - RAMP && t <= e + RAMP) {
        const amt = t < s ? 1 - (s - t) / RAMP : t > e ? 1 - (t - e) / RAMP : 1;
        talk = Math.max(talk, amt);
      }
    }
    let level = OPEN + (DUCKED - OPEN) * talk;
    for (const a of ACCENTS(durationInFrames / fps)) {
      const k = interpolate(t, [a.from - 0.1, a.from, a.to, a.to + 0.15], [0, 1, 1, 0], CLAMP);
      level = Math.max(level, a.level * k);
    }
    const fadeIn = interpolate(f, [0, 8], [0, 1], CLAMP);
    const fadeOut = interpolate(f, [durationInFrames - 18, durationInFrames], [1, 0], CLAMP);
    return level * fadeIn * fadeOut;
  };

  return <Audio src={staticFile("music/musique.mp3")} volume={volume} />;
};
