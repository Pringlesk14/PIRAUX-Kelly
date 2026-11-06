import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CLAMP } from "../theme";
import { useClipTransition } from "../timeline";

export type Zoom = { at: number; scale: number };
export type Shake = { at: number; until: number; intensity: number };

const ease = Easing.inOut(Easing.cubic);

/** Amplitude du mouvement de caméra qui « relie » deux clips. */
const LINK_ZOOM = 0.07;
const LINK_FRAMES = 28;

/**
 * Vidéo plein écran avec zooms d'emphase doux, secousses de caméra,
 * et mouvement de caméra continu + fondu sonore aux raccords.
 */
export const VideoLayer: React.FC<{
  src: string;
  zooms?: Zoom[];
  shakes?: Shake[];
  origin?: string;
}> = ({ src, zooms = [], shakes = [], origin = "50% 32%" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tr = useClipTransition();

  // Zooms d'emphase successifs, en douceur (~0,6 s).
  let scale = 1;
  let previous = 1;
  for (const z of zooms) {
    const a = Math.round(z.at * fps);
    const p = interpolate(frame, [a, a + 14], [0, 1], { ...CLAMP, easing: ease });
    scale += (z.scale - previous) * p;
    previous = z.scale;
  }

  // Raccord : le clip qui part pousse légèrement vers l'avant, le clip
  // qui arrive termine ce même mouvement → une seule caméra continue.
  if (tr) {
    if (tr.outKind === "clip") {
      scale *= interpolate(frame, [tr.outFrame - LINK_FRAMES, tr.outFrame], [1, 1 + LINK_ZOOM], {
        ...CLAMP,
        easing: Easing.in(Easing.quad),
      });
    }
    if (tr.inKind === "clip") {
      scale *= interpolate(frame, [tr.inFrame, tr.inFrame + LINK_FRAMES], [1 + LINK_ZOOM, 1], {
        ...CLAMP,
        easing: Easing.out(Easing.quad),
      });
    }
  }

  // Secousses (pseudo-bruit déterministe).
  let x = 0;
  let y = 0;
  let rot = 0;
  for (const s of shakes) {
    const a = Math.round(s.at * fps);
    const b = Math.round(s.until * fps);
    if (frame >= a && frame < b) {
      const decay = 1 - (frame - a) / (b - a);
      const k = s.intensity * decay;
      x += Math.sin(frame * 2.7) * 14 * k;
      y += Math.cos(frame * 3.3) * 10 * k;
      rot += Math.sin(frame * 1.9) * 0.8 * k;
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
          transformOrigin: origin,
        }}
      >
        <OffthreadVideo
          src={staticFile(src)}
          // Dans l'épisode, le son est posé à part (SegmentAudio) pour rester calé à l'image.
          muted={tr !== null}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
