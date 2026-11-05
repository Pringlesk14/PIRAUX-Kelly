# PIRAUX-Kelly — Motion design Remotion

Mini-série verticale (9:16, 1080×1920, 24 i/s) de 6 clips de 10 s montés en
un épisode de 60 s : « les devoirs de vacances ».

## Démarrage

```bash
npm install
npm run dev           # Remotion Studio : aperçu et réglages en direct
npm run render        # épisode complet → out/episode.mp4
npm run render:clips  # chaque clip séparément → out/clip1..6.mp4
```

## Organisation

| Dossier | Contenu |
| --- | --- |
| `public/videos/` | Les 6 clips source (`clip1.mp4` … `clip6.mp4`) |
| `public/emoji/` | Emojis Noto en SVG (Google, licence Apache 2.0) |
| `src/captions/` | Transcription mot à mot (texte + timings en secondes) |
| `src/scenes/` | Une scène par clip : animations calées sur la parole |
| `src/components/` | Briques réutilisables : sous-titres, stickers, tampons, checklist, bouton d'abonnement… |
| `src/theme.ts` | Couleurs, police, format |

## Modifier

- **Corriger un sous-titre** : éditer le `text` du mot dans `src/captions/clipN.json`.
- **Décaler une animation** : changer `at` / `until` (en secondes) dans `src/scenes/SceneN.tsx`.
- **Changer les couleurs** : `COLORS` dans `src/theme.ts`.
