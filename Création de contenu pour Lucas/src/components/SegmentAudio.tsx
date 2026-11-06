import { Audio, interpolate, staticFile } from "remotion";
import { CLAMP } from "../theme";
import { AUDIO_FADE, CUT_XFADE, Segment } from "../timeline";

/**
 * Son d'un segment de clip, posé explicitement (début / durée dans la
 * source) : il reste parfaitement calé sur l'image, même quand le même
 * clip est découpé en plusieurs morceaux par des coupes douces.
 */
export const SegmentAudio: React.FC<{ seg: Segment }> = ({ seg }) => {
  const fadeLen = (kind: Segment["inKind"]) => (kind === "cut" ? CUT_XFADE : AUDIO_FADE);
  // f = image depuis le début du segment.
  const volume = (f: number) => {
    let v = 1;
    if (seg.inKind) v *= interpolate(f, [0, fadeLen(seg.inKind)], [0, 1], CLAMP);
    if (seg.outKind) v *= interpolate(f, [seg.length - fadeLen(seg.outKind), seg.length], [1, 0], CLAMP);
    return v;
  };
  return (
    <Audio
      src={staticFile(`videos/clip${seg.clip + 1}.mp4`)}
      trimBefore={seg.inFrame}
      durationInFrames={seg.length}
      volume={volume}
    />
  );
};
