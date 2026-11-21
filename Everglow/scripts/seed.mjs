// Fills Everglow with demo accounts and content so the site isn't empty.
// Usage: npm run seed   (needs ffmpeg to generate the demo videos and photos)
import { DatabaseSync } from "node:sqlite";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

const root = process.cwd();
const dataDir = path.join(root, "data");
const uploadDir = path.join(root, "uploads");
const privateDir = path.join(root, "private-uploads");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(privateDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "everglow.db"));
db.exec("PRAGMA foreign_keys = ON;");
db.exec(fs.readFileSync(path.join(root, "lib", "schema.sql"), "utf8"));

if (db.prepare("SELECT COUNT(*) AS n FROM users").get().n > 0) {
  console.log("La base contient déjà des comptes : rien à faire. Supprime le dossier data/ pour repartir de zéro.");
  process.exit(0);
}

let hasFfmpeg = true;
try { execFileSync("ffmpeg", ["-version"], { stdio: "ignore" }); } catch { hasFfmpeg = false; }

const FONT = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "C:/Windows/Fonts/arialbd.ttf"].find((f) => fs.existsSync(f));

function text(label, size) {
  if (!FONT) return "";
  const safe = label.replace(/[':\\]/g, "");
  return `,drawtext=fontfile='${FONT.replace(/:/g, "\\:")}':text='${safe}':fontcolor=white:fontsize=${size}:x=(w-text_w)/2:y=(h-text_h)/2:shadowcolor=black@0.5:shadowx=3:shadowy=3`;
}

function makeVideo(label, c0, c1, seconds = 6, dir = uploadDir) {
  const name = `${crypto.randomUUID()}.mp4`;
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "lavfi", "-i", `gradients=s=720x1280:c0=${c0}:c1=${c1}:speed=0.02:d=${seconds}:r=30${text(label, 64)}`,
    "-f", "lavfi", "-i", `sine=frequency=330:d=${seconds},volume=0.05`,
    "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-c:a", "aac", "-movflags", "+faststart",
    path.join(dir, name),
  ]);
  return name;
}

function makePhoto(label, c0, c1, size = "1080x1080", dir = uploadDir) {
  const name = `${crypto.randomUUID()}.jpg`;
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "lavfi", "-i", `gradients=s=${size}:c0=${c0}:c1=${c1}:d=1${text(label, 72)}`,
    "-frames:v", "1", "-q:v", "3", path.join(dir, name),
  ]);
  return name;
}

const now = Date.now();
const dayKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const H = 3600 * 1000;
const hash = bcrypt.hashSync("everglow", 10);
const users = [
  { u: "kelly", n: "Kelly", bio: "Fondatrice d'Everglow ✨" },
  { u: "lucas", n: "Lucas", bio: "Vidéos drôles et devoirs de vacances 📚😂" },
  { u: "ines", n: "Inès", bio: "Photo · voyage · couchers de soleil 🌅" },
  { u: "noah", n: "Noah", bio: "Skate et musique 🛹🎧" },
];
const ids = {};
for (const x of users) {
  ids[x.u] = Number(db.prepare("INSERT INTO users (username, display_name, password_hash, bio, created_at) VALUES (?, ?, ?, ?, ?)").run(x.u, x.n, hash, x.bio, now - 30 * 24 * H).lastInsertRowid);
}
const follow = db.prepare("INSERT OR IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)");
for (const a of Object.values(ids)) for (const b of Object.values(ids)) if (a !== b && (a + b) % 3 !== 0) follow.run(a, b);

if (hasFfmpeg) {
  console.log("Génération des vidéos et photos de démo…");
  const post = db.prepare("INSERT INTO posts (user_id, kind, media, caption, created_at, challenge_day) VALUES (?, ?, ?, ?, ?, ?)");
  // Daily challenge: two entries today, three yesterday (they make up the podium).
  const today = dayKey(now), yesterday = dayKey(now - 24 * H);
  const videos = [
    ["lucas", "Lundi matin", "0xff5f8f", "0x2b1055", "Quand le réveil sonne pour la rentrée 😭 #school", now - 2 * H, today],
    ["ines", "Ciel du matin", "0xa66bff", "0x4fc3f7", "Ma participation au défi du jour 🌌", now - 1 * H, today],
    ["noah", "Kickflip", "0x4fc3f7", "0x0b0a12", "Premier kickflip réussi !! 🛹🔥", now - 26 * H, yesterday],
    ["ines", "Golden hour", "0xffb347", "0xff5f8f", "La lumière ce soir était incroyable 🌅", now - 28 * H, yesterday],
    ["kelly", "Bienvenue", "0xa66bff", "0xff5f8f", "Bienvenue sur Everglow ✨ Partage ce qui te fait briller !", now - 30 * H, yesterday],
  ];
  for (const [u, label, c0, c1, cap, t, day] of videos) post.run(ids[u], "video", makeVideo(label, c0, c1), cap, t, day);
  const photos = [
    ["ines", "Plage", "0x4fc3f7", "0xffb347", "Souvenir de vacances 🏖️", 7],
    ["kelly", "Everglow", "0xff5f8f", "0xa66bff", "Le logo est prêt 💖", 4],
    ["noah", "Skatepark", "0x5ee6a8", "0x16141f", "Session du dimanche", 3],
    ["lucas", "Fond d ecran", "0xffb347", "0xa66bff", "Mon nouveau fond d'écran 🎨", 2],
    ["noah", "Le spot", "0x4fc3f7", "0x5ee6a8", "Le spot de ce soir", 1],
  ];
  // Constellation: past Lueurs, at most one per person per day, so today's is still free for everyone.
  const glow = db.prepare("INSERT INTO glows (user_id, post_id, day, created_at) VALUES (?, ?, ?, ?)");
  const nextDay = {};
  photos.forEach(([u, label, c0, c1, cap, glows], k) => {
    const pid = Number(post.run(ids[u], "photo", makePhoto(label, c0, c1), cap, now - (k + 1) * 3 * H, null).lastInsertRowid);
    const givers = Object.keys(ids).filter((x) => x !== u);
    for (let g = 0; g < glows; g++) {
      const giver = givers[g % givers.length];
      nextDay[giver] = (nextDay[giver] ?? 0) + 1;
      glow.run(ids[giver], pid, dayKey(now - nextDay[giver] * 24 * H), now - nextDay[giver] * 24 * H);
    }
  });
  const story = db.prepare("INSERT INTO stories (user_id, kind, media, created_at, expires_at) VALUES (?, ?, ?, ?, ?)");
  story.run(ids.lucas, "photo", makePhoto("Story de Lucas", "0xff5f8f", "0xffb347", "720x1280"), now - H, now + 23 * H);
  story.run(ids.ines, "video", makeVideo("Story d Ines", "0xa66bff", "0x4fc3f7", 5), now - 2 * H, now + 22 * H);
  story.run(ids.noah, "photo", makePhoto("Story de Noah", "0x5ee6a8", "0x4fc3f7", "720x1280"), now - 3 * H, now + 21 * H);
  const firstPost = db.prepare("SELECT id FROM posts ORDER BY id LIMIT 1").get().id;
  const comment = db.prepare("INSERT INTO comments (user_id, post_id, body, created_at) VALUES (?, ?, ?, ?)");
  comment.run(ids.ines, firstPost, "Trop vrai 😂", now - H);
  comment.run(ids.noah, firstPost, "Pareil chaque lundi", now - H / 2);
  const like = db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)");
  for (const { id } of db.prepare("SELECT id FROM posts").all()) for (const uid of Object.values(ids)) if ((id + uid) % 2) like.run(uid, id);
  // A clear winner for yesterday's podium: Noah's kickflip (3rd video).
  const kickflip = db.prepare("SELECT id FROM posts WHERE caption LIKE 'Premier kickflip%'").get().id;
  for (const u of ["kelly", "lucas", "ines"]) like.run(ids[u], kickflip);

  // Capsules: one opens two minutes after seeding, two are sealed for a year, one is already open.
  const D = 24 * H;
  const capsule = db.prepare(`INSERT INTO capsules (sender_id, recipient_id, title, message, media, media_kind, created_at, open_at, opened_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  capsule.run(ids.lucas, ids.kelly, "Ouvre-moi vite 👀", "Je l'ai scellée pour qu'elle s'ouvre deux minutes après ton arrivée.\nBienvenue dans les Capsules d'Everglow ! 🎉",
    makeVideo("Surprise", "0xffb347", "0xa66bff", 6, privateDir), "video", now - 2 * H, now + 2 * 60 * 1000, null);
  capsule.run(ids.ines, ids.kelly, "Nos vacances, un an après 🌅", "Tu te souviens de cette plage ? Je voulais que tu revoies ça exactement un an plus tard.",
    makePhoto("Un an plus tard", "0x4fc3f7", "0xffb347", "1080x1080", privateDir), "photo", now - D, now + 364 * D, null);
  capsule.run(ids.kelly, ids.kelly, "Lettre à moi dans 1 an", "Est-ce qu'Everglow a des milliers d'utilisateurs ? J'espère que tu es fière du chemin parcouru.",
    null, null, now - 3 * D, now + 362 * D, null);
  capsule.run(ids.noah, ids.kelly, "Pour quand tu auras 1 000 abonnés", "Je savais que tu y arriverais 🛹✨",
    makeVideo("1000 abonnes", "0x5ee6a8", "0xff5f8f", 6, privateDir), "video", now - 30 * D, now - 2 * D, now - 2 * D);

  // Snaps: past days build flame streaks, and Noah sent one that is still waiting to be opened.
  const snap = db.prepare(`INSERT INTO messages (sender_id, recipient_id, body, created_at, read_at, kind, media, media_kind, opened_at)
                           VALUES (?, ?, '', ?, ?, 'snap', ?, ?, ?)`);
  for (let d = 4; d >= 1; d--) snap.run(d % 2 ? ids.lucas : ids.kelly, d % 2 ? ids.kelly : ids.lucas, now - d * D, now - d * D, null, "photo", now - d * D);
  for (let d = 2; d >= 1; d--) snap.run(ids.ines, ids.kelly, now - d * D, now - d * D, null, "photo", now - d * D);
  snap.run(ids.noah, ids.kelly, now - 5 * 60 * 1000, null, makePhoto("Snap de Noah", "0x5ee6a8", "0x4fc3f7", "720x1280", privateDir), "photo", null);
} else {
  console.log("ffmpeg introuvable : comptes créés sans vidéos ni photos de démo.");
}

const msg = db.prepare("INSERT INTO messages (sender_id, recipient_id, body, created_at) VALUES (?, ?, ?, ?)");
msg.run(ids.lucas, ids.kelly, "Salut ! Ton appli est trop bien 🔥", now - 40 * 60 * 1000);
msg.run(ids.ines, ids.kelly, "Tu as vu ma nouvelle photo ?", now - 20 * 60 * 1000);

console.log("✅ Contenu de démo créé.");
console.log("   Comptes : kelly, lucas, ines, noah. Mot de passe pour tous : everglow");
