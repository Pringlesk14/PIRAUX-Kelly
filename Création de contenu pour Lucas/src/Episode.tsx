import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  Series,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Music } from "./components/Music";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { Scene6 } from "./scenes/Scene6";
import { CLAMP, COLORS } from "./theme";
import { SEGMENTS, TransitionContext } from "./timeline";

export const SCENES = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6];

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        height: 12,
        width: `${((frame + 1) / durationInFrames) * 100}%`,
        background: COLORS.yellow,
        boxShadow: "0 0 12px rgba(0,0,0,0.4)",
      }}
    />
  );
};

/** Fondu d'entrée du clip suivant par-dessus le précédent. */
const CrossFade: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  const opacity =
    frames > 0
      ? interpolate(frame, [0, frames], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.quad) })
      : 1;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const FadeToBlack: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], CLAMP);
  return <AbsoluteFill style={{ backgroundColor: "black", opacity }} />;
};

/**
 * Les 6 clips resserrés autour de la parole (pauses retirées par des coupes
 * douces), enchaînés en fondus avec un mouvement de caméra continu, sur une
 * musique de fond : une seule vidéo fluide, sans blanc.
 */
export const Episode: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "black" }}>
    <Series>
      {SEGMENTS.map((seg, i) => {
        const Scene = SCENES[seg.clip];
        const { inFrame, outFrame, inKind, outKind } = seg;
        return (
          <Series.Sequence key={i} durationInFrames={seg.length} offset={-seg.overlap}>
            <TransitionContext.Provider value={{ inFrame, outFrame, inKind, outKind }}>
              <CrossFade frames={seg.overlap}>
                {/* Décale le temps : les timings des scènes restent ceux du clip source. */}
                <Sequence from={-inFrame}>
                  <Scene />
                </Sequence>
              </CrossFade>
            </TransitionContext.Provider>
          </Series.Sequence>
        );
      })}
    </Series>
    <Music />
    <ProgressBar />
    <FadeToBlack />
  </AbsoluteFill>
);
