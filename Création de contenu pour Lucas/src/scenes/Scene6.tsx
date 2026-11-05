import { Overlays } from "../components/Overlays";
import { AbsoluteFill } from "remotion";
import { Banner } from "../components/Banner";
import { Captions } from "../components/Captions";
import { BottomShade } from "../components/Effects";
import { LikeBurst, Subscribe } from "../components/Subscribe";
import { VideoLayer } from "../components/VideoLayer";
import { COLORS } from "../theme";
import words from "../captions/clip6.json";

/** « Abonne-toi, mets un petit like et on se retrouve très vite ! » */
export const Scene6: React.FC = () => {
  return (
    <AbsoluteFill>
      <VideoLayer src="videos/clip6.mp4" zooms={[{ at: 7.18, scale: 1.08 }]} />
      <BottomShade />
      <Overlays>
        <BottomShade />
        <Banner at={2.34} until={4.4} text="Prochaines aventures" emoji="📺" size={56} y={230} />
        <Banner at={3.36} until={4.4} text="& galères" emoji="😅" size={72} y={360} rotate={3} bg="white" />
        <Subscribe at={4.4} clickAt={5.28} until={7.1} />
        <LikeBurst at={5.94} until={7.1} x={830} y={800} />
        <Banner at={7.18} until={10.1} text="À très vite" emoji="👋" size={96} y={300} bg={COLORS.yellow} />
        <Captions words={words} />
      </Overlays>
    </AbsoluteFill>
  );
};
