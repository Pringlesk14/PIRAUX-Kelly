# PULSE — prototype navigable

> Ta voix, ton univers.
> Des passions à partager, des rencontres à vivre, des voix à découvrir.

Application sociale vocale (18+) : communautés par passion, salons vocaux, activités, messages et avatars personnalisables.
Ce dossier contient un **prototype web mobile** en un seul fichier (`index.html`, HTML/CSS/JS sans dépendance ni build).
Il sert à valider le parcours et l'univers visuel avant de choisir la technique définitive.

## Lancer

Ouvrir `index.html` dans un navigateur (idéalement en largeur mobile). Les données restent dans le navigateur (`localStorage`).
Réglages → « Se déconnecter et effacer ce prototype » remet tout à zéro.

## Ce qui fonctionne dans le prototype

- Onboarding : bienvenue (logo, slogan, accroche validée du 6 novembre), pseudo, date de naissance avec refus des moins de 18 ans, pays, langues, au moins 3 passions, avatar.
- Avatar : 4 archétypes distincts (Humain·e, Androïde, Être cosmique, Animal totem) remplaçant Nébuleux / Éclat / Humain ; onglets Forme, Têtes, Accessoires, Aura ; 10 accessoires dessinés comme de vrais objets et portés sur l'avatar (guitare, micro, manette, casque, couronne, chapeau, bonnet, lunettes, ailes, papillon).
- Navigation : Accueil | Découvrir | **PULSE** (micro central) | Messages | Profil, plus des pages Salons et Activités accessibles depuis l'Accueil, Découvrir et les communautés.
- Découvrir : recherche (salons, communautés, personnes), filtres langue et « en direct », 9 catégories, personnes par passions communes.
- Communautés : rejoindre/quitter, onglets À propos / Activités / Membres, règles.
- Salons : entrer, lever la main, passage au micro, écran d'autorisation micro, état « micro coupé / ouvert » explicite, réactions, inviter, signaler, quitter, mini-barre « Tu es dans… ». Création de salon public ou privé.
- Activités : en direct / à venir / terminées ; audition à l'aveugle (« Je me retourne ») et quiz jouables dans les salons.
- Messages : conversations, envoi de texte, bouton de traduction, note vocale, blocage, signalement.
- Profil et réglages : bio, langues, statistiques réelles du prototype, « Mon univers », confidentialité (âge visible, qui peut m'écrire, personnes bloquées), notifications, animations réduites.
- Interface en 6 langues (FR, EN, ES, IT, DE, PT) pour les menus et textes principaux.
- Bascule de palette **Cosmique** / **Ocean Signal** pour l'arbitrage.

## Ce qui est simulé (et signalé comme tel à l'écran)

Audio des salons (rien n'est capté ni diffusé), hôte qui accepte une main levée, participants et compteurs, traductions (pré-rédigées), notes vocales, rappels et notifications, acceptation des demandes d'amis, autres joueurs des activités.

## Pas encore construit

Comptes et serveur, vérification d'âge renforcée, audio temps réel, appels et Mode Duo, message vocal express (talkie-walkie), traduction automatique, modération côté équipe, PULSE+ et paiements.

## Décisions à faire valider par Kelly

1. Palette finale : Cosmique (vitrine néon) ou Ocean Signal. Les codes Ocean Signal du prototype sont une proposition.
2. Variante de logo (A ou B) : les images n'étaient pas dans le dépôt, le logo du prototype est provisoire.
3. Les 4 nouveaux archétypes d'avatar.
4. Organisation des onglets : Salons et Activités hors de la barre basse, ou dans la barre.
5. Mécanique du « talkie-walkie » : direct en temps réel ou message vocal rapide.
6. Périmètre de la traduction et contenu de PULSE+.
7. Pile technique pour la vraie application (mobile natif ou web, serveur, fournisseur audio temps réel).

## Références

Le dossier de transmission du 18 novembre 2026 fait foi. Les 14 visuels PULSE (dont « Vitrine néon de l'application PULSE.png ») ne sont pas encore dans le dépôt : les ajouter dans `PULSE/references/` permettra de coller plus finement aux maquettes.
