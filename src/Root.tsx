import "./fonts";
import { Composition, Folder } from "remotion";
import { Episode, SCENES } from "./Episode";
import { CLIP_COUNT, CLIP_FRAMES, FPS, HEIGHT, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Episode"
      component={Episode}
      durationInFrames={CLIP_FRAMES * CLIP_COUNT}
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
