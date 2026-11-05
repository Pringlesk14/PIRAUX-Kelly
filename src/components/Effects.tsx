import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CLAMP } from "../theme";

/** Flash blanc au début d'une scène (transition « cut »). */
export const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5], [0.85, 0], CLAMP);
  if (opacity <= 0) return null;
  return <AbsoluteFill style={{ backgroundColor: "white", opacity }} />;
};

/** Vignette rouge qui pulse (alerte / panique). */
export const RedAlert: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = at * fps;
  const b = until * fps;
  if (frame < a || frame >= b) return null;
  const fade = interpolate(frame, [a, a + 4, b - 8, b], [0, 1, 1, 0], CLAMP);
  const pulse = 0.55 + 0.45 * Math.abs(Math.sin((frame - a) / 4));
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(255,0,0,0) 45%, rgba(255,20,20,0.75) 100%)",
        opacity: fade * pulse,
      }}
    />
  );
};

/** Dégradé sombre en bas pour la lisibilité des sous-titres. */
export const BottomShade: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(transparent 55%, rgba(0,0,0,0.45) 100%)",
    }}
  />
);
