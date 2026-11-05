import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CLAMP } from "../theme";
import { useClipTransition, XFADE } from "../timeline";

/**
 * Habillage d'une scène (sous-titres, stickers…). Aux raccords, celui du
 * clip sortant s'efface sur la 1re moitié du fondu et celui du clip
 * entrant apparaît sur la 2de : jamais de textes superposés.
 */
export const Overlays: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const tr = useClipTransition();
  let opacity = 1;
  if (tr?.fadeIn) {
    opacity *= interpolate(frame, [tr.inFrame + XFADE / 2, tr.inFrame + XFADE], [0, 1], CLAMP);
  }
  if (tr?.fadeOut) {
    opacity *= interpolate(frame, [tr.outFrame - XFADE, tr.outFrame - XFADE / 2], [1, 0], CLAMP);
  }
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
