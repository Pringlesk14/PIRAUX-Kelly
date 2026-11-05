export const FPS = 24;
export const WIDTH = 1080;
export const HEIGHT = 1920;
/** Chaque clip source dure ~10 s (10,03 s à 24 i/s). */
export const CLIP_FRAMES = 240;
export const CLIP_COUNT = 6;

export const COLORS = {
  yellow: "#FFD43B",
  red: "#FF3B3B",
  blue: "#2F6BFF",
  green: "#22C55E",
  ink: "#111111",
  paper: "#FFFDF5",
  line: "#C9DBFF",
};

export const FONT = "'Montserrat', sans-serif";

export const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
