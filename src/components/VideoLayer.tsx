import {
  AbsoluteFill,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type Zoom = { at: number; scale: number };
export type Shake = { at: number; until: number; intensity: number };

/**
 * Vidéo plein écran avec « punch-in » d'entrée, zooms d'emphase et
 * secousses de caméra.
 */
export const VideoLayer: React.FC<{
  src: string;
  zooms?: Zoom[];
  shakes?: Shake[];
  origin?: string;
}> = ({ src, zooms = [], shakes = [], origin = "50% 32%" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Punch-in à l'entrée de la scène (1.15 → 1).
  const intro = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 10 });
  let scale = 1 + 0.15 * (1 - intro);

  // Zooms d'emphase successifs.
  let previous = 1;
  for (const z of zooms) {
    const p = spring({
      frame: frame - Math.round(z.at * fps),
      fps,
      config: { damping: 200 },
      durationInFrames: 8,
    });
    scale += (z.scale - previous) * p;
    previous = z.scale;
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
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
