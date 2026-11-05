import { AbsoluteFill } from "remotion";
import { Banner } from "../components/Banner";
import { Captions } from "../components/Captions";
import { Checklist } from "../components/Checklist";
import { BottomShade } from "../components/Effects";
import { Sticker } from "../components/Sticker";
import { VideoLayer } from "../components/VideoLayer";
import words from "../captions/clip1.json";
import { PLAN } from "./plan";

/** « Pendant les vacances, j'avais un programme parfait… » */
export const Scene1: React.FC = () => (
  <AbsoluteFill>
    <VideoLayer src="videos/clip1.mp4" zooms={[{ at: 6.38, scale: 1.1 }]} />
    <BottomShade />
    <Banner at={0} until={1.7} text="Mes vacances" emoji="🏖️" y={230} size={90} />
    <Checklist
      at={1.76}
      until={9.95}
      title="Le programme parfait"
      items={[
        { ...PLAN[0], appearAt: 3.16, checkAt: 3.5 },
        { ...PLAN[1], appearAt: 4.32, checkAt: 4.6 },
        { ...PLAN[2], appearAt: 5.76, checkAt: 6.8 },
      ]}
    />
    <Sticker at={7.4} until={9.95} x={850} y={860} emoji="😎" label="Tranquille" rotate={8} />
    <Captions words={words} />
  </AbsoluteFill>
);
