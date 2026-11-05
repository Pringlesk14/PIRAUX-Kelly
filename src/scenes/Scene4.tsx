import { AbsoluteFill } from "remotion";
import { Captions } from "../components/Captions";
import { Checklist } from "../components/Checklist";
import { BottomShade } from "../components/Effects";
import { Stamp } from "../components/Stamp";
import { Sticker } from "../components/Sticker";
import { VideoLayer } from "../components/VideoLayer";
import words from "../captions/clip4.json";
import { PLAN } from "./plan";

/** « Je pensais passer mes vacances à m'amuser… Quelle organisation ! » */
export const Scene4: React.FC = () => (
  <AbsoluteFill>
    <VideoLayer src="videos/clip4.mp4" zooms={[{ at: 8.16, scale: 1.12 }]} />
    <BottomShade />
    <Checklist
      at={2.6}
      until={8.1}
      title="Le programme parfait ?"
      items={[
        { ...PLAN[0], checkAt: 0, crossAt: 4.36 },
        { ...PLAN[1], checkAt: 0, crossAt: 3.8 },
        { ...PLAN[2], checkAt: 0, crossAt: 5.28, replace: { at: 6.7, label: "→ la veille au soir !" } },
      ]}
    />
    <Stamp at={8.16} until={9.95} text="Organisation" sub="0 / 10" y={330} rotate={-10} size={92} />
    <Sticker at={8.6} until={9.95} x={850} y={760} emoji="👏" size={140} />
    <Captions words={words} />
  </AbsoluteFill>
);
