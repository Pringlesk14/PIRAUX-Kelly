import { Overlays } from "../components/Overlays";
import { AbsoluteFill } from "remotion";
import { Banner } from "../components/Banner";
import { Captions } from "../components/Captions";
import { BottomShade, RedAlert } from "../components/Effects";
import { EmojiStack } from "../components/EmojiStack";
import { Stamp } from "../components/Stamp";
import { VideoLayer } from "../components/VideoLayer";
import { COLORS } from "../theme";
import words from "../captions/clip3.json";

/** « Et maintenant, c'est la panique… une montagne de devoirs… » */
export const Scene3: React.FC = () => (
  <AbsoluteFill>
    <VideoLayer
      src="videos/clip3.mp4"
      zooms={[
        { at: 2.42, scale: 1.15 },
        { at: 3.74, scale: 1.04 },
        { at: 7.4, scale: 1.16 },
      ]}
      shakes={[
        { at: 2.42, until: 3.5, intensity: 1.3 },
        { at: 7.9, until: 8.7, intensity: 0.8 },
      ]}
    />
    <BottomShade />
    <Overlays>
      <RedAlert at={2.42} until={4.6} />
      <RedAlert at={7.6} until={9.95} />
      <Banner
        at={2.42}
        until={3.7}
        text="Panique !"
        emoji="😱"
        bg={COLORS.red}
        color="white"
        size={110}
        jitter
        y={250}
      />
      <Stamp at={3.74} until={6.1} text="J-1" sub="AVANT LA RENTRÉE" y={270} rotate={7} size={120} />
      <EmojiStack at={5.22} until={9.95} emoji="📚" count={7} x={920} bottom={1120} />
      <Banner at={7.9} until={9.95} text="La galère" emoji="😩" bg="white" size={96} y={250} rotate={3} />
      <Captions words={words} />
    </Overlays>
  </AbsoluteFill>
);
