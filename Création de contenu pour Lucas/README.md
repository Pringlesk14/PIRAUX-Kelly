# Création de contenu pour Lucas — Motion design Remotion

**Rendu final : [`rendu-final.mp4`](rendu-final.mp4)**

Vidéo verticale (9:16, 1080×1920, 24 i/s) d'environ 39 s : « les devoirs de vacances ».
Les 6 clips sont resserrés autour de la parole (aucun mot coupé, ~0,1 s entre les
phrases), les longues pauses sont retirées par des coupes douces, la vidéo est
accélérée de 10 % à l'export, et les clips sont enchaînés en fondus avec un
mouvement de caméra continu, sur une musique originale : **un seul thème lo-fi /
chill** (piano électrique doux, basse ronde, batterie feutrée, petit motif en pizzicato,
grain de vinyle) qui tourne sur toute la vidéo, se pose sur un accord final et baisse
automatiquement quand Lucas parle.

## Démarrage

Toutes les commandes se lancent depuis ce dossier.

```bash
npm install
npm run dev           # Remotion Studio : aperçu et réglages en direct
npm run render        # épisode complet → rendu-final.mp4 (accéléré x1,1)
npm run render:clips  # chaque clip séparément → out/clip1..6.mp4
```

## Organisation

| Dossier | Contenu |
| --- | --- |
| `public/videos/` | Les 6 clips source (`clip1.mp4` … `clip6.mp4`) |
| `public/music/` | Musique de fond originale (générée par `scripts/generate-music.py`) |
| `public/emoji/` | Emojis Noto en SVG (Google, licence Apache 2.0) |
| `src/captions/` | Transcription mot à mot (texte + timings en secondes) |
| `src/scenes/` | Une scène par clip : animations calées sur la parole |
| `src/components/` | Briques réutilisables : sous-titres, stickers, tampons, checklist, bouton d'abonnement… |
| `src/theme.ts` | Couleurs, police, format |
| `src/timeline.ts` | Points d'entrée/sortie de chaque clip et durée des fondus |

## Modifier

- **Corriger un sous-titre** : éditer le `text` du mot dans `src/captions/clipN.json`.
- **Décaler une animation** : changer `at` / `until` (en secondes) dans `src/scenes/SceneN.tsx`.
- **Respiration entre les phrases / durée des fondus** : `PAD` et `XFADE` dans `src/timeline.ts`.
- **Pauses retirées dans les clips** : `PAUSES` dans `src/timeline.ts` (début / fin de chaque silence, en secondes).
- **Vitesse** : `SPEED` dans `src/timeline.ts` et le facteur du script `speed` dans `package.json` (`-itsscale` = 1/vitesse, `atempo` = vitesse).
- **Volume de la musique** : `OPEN` (silences) et `DUCKED` (pendant la parole) dans `src/components/Music.tsx`.
- **Régénérer la musique** : `python3 scripts/generate-music.py` (accords, motif et tempo dans le script).
- **Changer les couleurs** : `COLORS` dans `src/theme.ts`.
