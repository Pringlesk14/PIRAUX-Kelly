# ✨ Everglow

Réseau social qui réunit dans un seul site :

| Fonction | Où la trouver |
|---|---|
| 🔥 **Défi du jour** : un thème par jour pour tout le monde, et le podium du défi d'hier | onglet **Vidéos** |
| ✨ **Constellation** : les photos sont des étoiles, chacun offre une seule Lueur par jour | onglet **Photos** |
| ⏳ Stories qui disparaissent au bout de 24 h | en haut de l'onglet **Photos** |
| ⏳ **Capsules temporelles** : vidéo, photo ou message scellé jusqu'à une date choisie | onglet **Capsules** |
| 💬 Messages privés, mis à jour en direct | onglet **Messages** |
| 👻 Snaps qui disparaissent après une vue, et flammes 🔥 des jours d'affilée | bouton appareil photo dans une conversation |
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

## 🔥 Le Défi du jour (vidéos)

- Chaque jour, un nouveau thème, le même pour tout le monde (la liste est dans `lib/challenges.ts`, on peut en ajouter autant qu'on veut).
- Une vidéo publiée participe au défi par défaut (case à décocher). Le défi se termine à minuit, avec un compte à rebours.
- L'onglet **Podium** montre le 🥇🥈🥉 du défi d'hier, selon les ❤️ reçus.
- L'onglet **Abonnements** garde toutes les vidéos des personnes suivies.

## ✨ La Constellation (photos)

- Chaque photo est une étoile dans un ciel de nuit. Les photos d'une même personne sont reliées : c'est sa constellation.
- Chacun a **une seule Lueur par jour** à offrir à la photo de son choix (pas à la sienne). La base de données elle-même empêche d'en donner deux.
- Plus une photo a reçu de Lueurs, plus son étoile est grande et brillante.

## ⏳ Les Capsules (l'idée propre à Everglow)

Une capsule est un souvenir scellé : une vidéo, une photo et/ou un message qui ne s'ouvre qu'à la date choisie (dans 1 minute pour tester, 1 heure, 1 jour, 1 semaine, 1 mois, 1 an, ou une date précise jusqu'à 50 ans).

- On peut l'envoyer à soi-même dans le futur, ou à une personne qu'on suit ou qui nous suit.
- Avant la date, seuls le titre, l'expéditeur et le compte à rebours sont visibles. Le serveur refuse de donner le contenu, même à quelqu'un qui devinerait l'adresse du fichier.
- Le jour J, la capsule brille dans l'onglet et s'ouvre avec un effet de lumière.

## 👻 Snaps

- Un snap ne peut être ouvert qu'une seule fois, par son destinataire. Le fichier est supprimé du serveur 2 minutes après l'ouverture.
- Les flammes 🔥 comptent les jours d'affilée où deux personnes s'envoient des snaps.

## Où sont les données ?

- `data/everglow.db` : la base de données (comptes, publications, messages…)
- `uploads/` : les vidéos et photos publiques (publications, stories, photos de profil)
- `private-uploads/` : les fichiers des capsules et des snaps, jamais servis publiquement

Pour repartir de zéro, supprime ces trois dossiers.

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
- Filtres et effets pour les photos et les stories
- Modération et signalement de contenus
