import "./fonts";
import { Composition, Folder } from "remotion";
import { Episode, SCENES } from "./Episode";
import { CLIP_FRAMES, FPS, HEIGHT, WIDTH } from "./theme";
import { EPISODE_FRAMES } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Episode"
      component={Episode}
      durationInFrames={EPISODE_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
    <Folder name="Clips">
      {SCENES.map((Scene, i) => (
        <Composition
          key={i}
          id={`Clip${i + 1}`}
          component={Scene}
          durationInFrames={CLIP_FRAMES}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      ))}
    </Folder>
  </>
);
