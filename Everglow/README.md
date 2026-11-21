# ✨ Everglow

Réseau social qui réunit dans un seul site :

| Fonction | Où la trouver |
|---|---|
| 🎬 Vidéos courtes en plein écran, à faire défiler (onglets « Pour toi » / « Abonnements ») | onglet **Vidéos** |
| 📸 Fil de photos avec likes et commentaires | onglet **Photos** |
| ⏳ Stories qui disparaissent au bout de 24 h | en haut de l'onglet **Photos** |
| 💬 Messages privés, mis à jour en direct | onglet **Messages** |
| 👤 Profils, abonnés, bio, photo de profil | onglet **Profil** |
| ➕ Publier une vidéo, une photo ou une story | bouton **+** |

## Lancer le site sur ton ordinateur

Il faut **Node.js 22 ou plus récent** (à installer depuis https://nodejs.org) et, pour le contenu de démo, **ffmpeg**.

```bash
cd Everglow
npm install        # installe les dépendances (une seule fois)
npm run seed       # optionnel : crée des comptes et du contenu de démo
npm run dev        # lance le site
```

Ouvre ensuite **http://localhost:3000** dans ton navigateur. Sur ordinateur, active le mode téléphone (F12, puis l'icône 📱) pour le voir comme sur mobile.

Comptes de démo : `kelly`, `lucas`, `ines`, `noah`, avec le mot de passe `everglow` pour tous.

## Où sont les données ?

- `data/everglow.db` : la base de données (comptes, publications, messages…)
- `uploads/` : les vidéos et photos envoyées

Pour repartir de zéro, supprime ces deux dossiers.

## Comment c'est construit

- **Next.js 15 + React 19** : les pages et le serveur sont dans le même projet
- **SQLite** (intégré à Node.js) : un simple fichier comme base de données, aucun compte externe nécessaire
- `app/` : les pages (`page.tsx`) et les actions serveur (`actions.ts`)
- `components/` : les éléments réutilisables (fil vidéo, stories, chat…)
- `lib/` : la base de données, les connexions et l'envoi de fichiers

## Prochaines étapes possibles

- Mettre le site en ligne (il faudra alors un hébergeur avec stockage de fichiers, ou passer à une base en ligne)
- Vidéos longues avec chaînes et abonnements
- Notifications (nouveaux abonnés, likes, messages)
- Envoyer des photos dans les messages, messages éphémères
- Filtres et effets pour les photos et les stories
- Modération et signalement de contenus
