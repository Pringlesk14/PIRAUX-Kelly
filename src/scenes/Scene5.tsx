import { Overlays } from "../components/Overlays";
import { AbsoluteFill } from "remotion";
import { Banner } from "../components/Banner";
import { Captions } from "../components/Captions";
import { BottomShade } from "../components/Effects";
import { FloatingEmojis } from "../components/FloatingEmojis";
import { Sticker } from "../components/Sticker";
import { VideoLayer } from "../components/VideoLayer";
import { COLORS } from "../theme";
import words from "../captions/clip5.json";

/** « Je suis toujours là… ce n'est que le début. » */
export const Scene5: React.FC = () => (
  <AbsoluteFill>
    <VideoLayer src="videos/clip5.mp4" zooms={[{ at: 5.16, scale: 1.1 }]} />
    <BottomShade />
    <Overlays>
      <Sticker
        at={2.6}
        until={4.9}
        x={850}
        y={980}
        emoji="💪"
        label="Toujours là"
        rotate={7}
        color="#86EFAC"
      />
      <Banner
        at={5.16}
        until={7.6}
        text="Ce n'est que le début"
        emoji="🔥"
        size={56}
        y={250}
        bg={COLORS.ink}
        color={COLORS.yellow}
      />
      <FloatingEmojis at={7.6} until={10} emojis={["😂", "🤣"]} count={16} seed="rire" />
      <Captions words={words} />
    </Overlays>
  </AbsoluteFill>
);
