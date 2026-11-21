export function formatCountdown(ms: number) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  const d = Math.floor(s / 86400);
  const hh = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return d > 0 ? `${d} j ${hh} h ${mm} min ${ss} s` : `${hh}:${mm}:${ss}`;
}

export function formatDate(t: number) {
  return new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
