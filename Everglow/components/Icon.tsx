const PATHS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  image: "M4 5h16v14H4zM4 15l4-4 5 5 3-3 4 4M15.5 9.5h.01",
  plus: "M12 5v14M5 12h14",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  heart: "M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z",
  comment: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  back: "M15 18l-6-6 6-6",
  close: "M18 6 6 18M6 6l12 12",
  play: "M7 4v16l13-8z",
  video: "M3 6h12v12H3zM15 10l6-3v10l-6-3",
  volume: "M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14",
  mute: "M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6",
  trash: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14",
};

export function Icon({ name, size = 24, fill = "none", stroke = "currentColor" }: { name: keyof typeof PATHS | string; size?: number; fill?: string; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
