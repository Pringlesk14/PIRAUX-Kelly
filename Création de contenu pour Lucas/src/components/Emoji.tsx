import { Img, staticFile } from "remotion";

/** Nom de fichier à partir de l'emoji : « ❤️ » → « 2764 ». */
const toCode = (emoji: string) =>
  [...emoji]
    .map((c) => c.codePointAt(0)!)
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16))
    .join("-");

/**
 * Emoji Noto en SVG (public/emoji). Rendu identique partout,
 * sans dépendre des polices installées sur la machine.
 */
export const Emoji: React.FC<{ e: string; size: number; style?: React.CSSProperties }> = ({
  e,
  size,
  style,
}) => (
  <Img
    src={staticFile(`emoji/${toCode(e)}.svg`)}
    style={{ width: size, height: size, display: "inline-block", verticalAlign: "middle", ...style }}
  />
);
