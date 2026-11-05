import { Overlays } from "../components/Overlays";
import { AbsoluteFill } from "remotion";
import { Banner } from "../components/Banner";
import { Captions } from "../components/Captions";
import { DayFlipper } from "../components/DayFlipper";
import { BottomShade } from "../components/Effects";
import { Sticker } from "../components/Sticker";
import { VideoLayer } from "../components/VideoLayer";
import { COLORS } from "../theme";
import words from "../captions/clip2.json";

/** « Sauf que voilà, entre les jeux, les vidéos et les grasses matinées… » */
export const Scene2: React.FC = () => (
  <AbsoluteFill>
    <VideoLayer src="videos/clip2.mp4" zooms={[{ at: 5.16, scale: 1.1 }]} />
    <BottomShade />
    <Overlays>
      <Banner
        at={1.2}
        until={2.4}
        text="Sauf que…"
        emoji="😅"
        bg={COLORS.red}
        color="white"
        size={96}
        y={260}
      />
      <Sticker at={2.88} until={5.1} x={230} y={720} emoji="🎮" label="Jeux" rotate={-10} />
      <Sticker at={3.42} until={5.1} x={860} y={640} emoji="📱" label="Vidéos" rotate={9} color="#7DD3FC" />
      <Sticker
        at={4.14}
        until={5.1}
        x={290}
        y={1040}
        emoji="😴"
        label="Grasses mat'"
        rotate={-4}
        color="#FDA4AF"
      />
      <DayFlipper at={6.66} landAt={7.74} until={9.95} />
      <Captions words={words} />
    </Overlays>
  </AbsoluteFill>
);
