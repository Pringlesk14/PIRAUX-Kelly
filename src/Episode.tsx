import { AbsoluteFill, Series, useCurrentFrame, useVideoConfig } from "remotion";
import { Flash } from "./components/Effects";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { Scene6 } from "./scenes/Scene6";
import { CLIP_FRAMES, COLORS } from "./theme";

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

/** Les 6 clips montés bout à bout avec flashs de transition. */
export const Episode: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "black" }}>
    <Series>
      {SCENES.map((Scene, i) => (
        <Series.Sequence key={i} durationInFrames={CLIP_FRAMES}>
          <Scene />
          {i > 0 ? <Flash /> : null}
        </Series.Sequence>
      ))}
    </Series>
    <ProgressBar />
  </AbsoluteFill>
);
