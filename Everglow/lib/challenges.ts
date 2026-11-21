/** One theme a day, the same for everyone. The list loops, so add themes freely. */
export const THEMES = [
  "Ton réveil le plus dur 😴",
  "Ton plus beau moment de la semaine ✨",
  "Montre ton objet le plus bizarre 🧸",
  "Ton talent caché 🎩",
  "Imite ton prof préféré 👩‍🏫",
  "Ta recette en 15 secondes 🍳",
  "La vue depuis ta fenêtre 🪟",
  "Ton animal fait le show 🐶",
  "Ta danse la plus ratée 💃",
  "Raconte une honte en 10 secondes 🙈",
  "Ton look du jour 👟",
  "Un fou rire entre amis 😂",
  "Ta chanson du moment 🎧",
  "Avant / après ✂️",
  "Le plus beau ciel 🌅",
  "Ton endroit secret 🗺️",
  "Défi : zéro parole, que des gestes 🤐",
  "Ta routine du soir 🌙",
  "Ce que personne ne sait sur toi 🤫",
  "Ton meilleur souvenir d'enfance 🧒",
  "Fais rire en 5 secondes ⏱️",
  "Ton sport en action ⚽",
  "Ta collection 📦",
  "La pire idée que tu as eue 💡",
  "Le plat que tu rates toujours 🍝",
  "Ton duo préféré 👯",
  "Ta ville en 3 plans 🏙️",
  "Remercie quelqu'un en vidéo 💌",
  "Ton rêve le plus fou 🚀",
  "Un truc qui te rend heureux ☀️",
];

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(t: number = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d.getTime());
}

export function endOfDay() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

export function themeFor(day: string) {
  const n = Math.round(Date.parse(`${day}T00:00:00Z`) / 86400000);
  return THEMES[((n % THEMES.length) + THEMES.length) % THEMES.length];
}
