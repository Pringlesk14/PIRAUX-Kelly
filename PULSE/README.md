# PULSE — prototype navigable

> Ta voix, ton univers.
> Des passions à partager, des rencontres à vivre, des voix à découvrir.

Application sociale vocale (18+) : communautés par passion, salons vocaux, activités, messages et avatars personnalisables.
Ce dossier contient un **prototype web mobile** en un seul fichier (`index.html`, HTML/CSS/JS sans dépendance ni build).
Il sert à valider le parcours et l'univers visuel avant de choisir la technique définitive.

## Lancer

Ouvrir `index.html` dans un navigateur (idéalement en largeur mobile). Les données restent dans le navigateur (`localStorage`).
Réglages → « Se déconnecter et effacer ce prototype » remet tout à zéro.

## Recentrage du 18 novembre 2026

- Lancement resserré : 4 communautés (Musique, Jeux vidéo, Discussions & langues, Cinéma & séries) et une interface en français et en anglais. Les autres langues sont affichées « bientôt ».
- Ajouts : voix de 15 s sur le profil, Pulse du jour, talkie-walkie entre amis, Mode Duo (bêta), échange de langues, sous-titres en direct dans les salons, rendez-vous de la semaine, saison 1, badges et niveaux, suppression du compte.
- Retirés pour le lancement : PULSE Premium et les accessoires PULSE+, traduction vocale en direct, appels vidéo.
- Plan de construction et de publication : document « PULSE — Plan pour construire et publier l'application » (Claude Docs).

## Décisions de Kelly (18 novembre 2026)

- Logo B (violet-rose-cyan, « Logo futuriste PULSE en néon cosmique ») et palette Cosmique violette : verrouillés dans le prototype.
- Talkie-walkie en direct, façon Tenten : on appuie, l'ami entend pendant qu'on parle, rien n'est enregistré. Amis et groupe, mode « Ne pas déranger ».
- Avis des testeurs : écran « Donne ton avis » qui prépare un message à envoyer par WhatsApp ou à copier (la démo n'enregistre rien).

## Jeux entre amis

- **Onde** : jeu de cartes original aux couleurs de PULSE (même couleur ou même chiffre, cartes Saut, Inverse, +2 et Prisme, annonce « Pulse ! »), jouable contre 3 joueurs simulés.
- **L'Intrus** : jeu de mots à rôle caché (un joueur a un mot proche), indices puis vote, jouable contre 3 joueurs simulés.
- **Quiz** (7 thèmes dont emoji-rébus, bonus de rapidité), **Petit bac**, **Pendu**, **Quatre en ligne**, **Tu préfères ?**, **Qui de nous ?**, **Action ou vérité**, plus le **Blind test** : 11 jeux en tout, contre des joueurs simulés.
- Les noms et visuels de jeux existants (Uno, Undercover…) ne sont pas utilisés : ce sont des marques.

## Interactivité ajoutée

- Voix de synthèse pour les exemples (Pulse du jour, présentations, réponses du talkie-walkie), via la voix Claude de la page publiée ou la synthèse vocale du navigateur.
- Blind test avec de vraies mélodies du domaine public jouées par le navigateur, contre deux joueurs simulés ; prestation audible dans l'audition à l'aveugle.
- Salons « vivants » : arrivées, départs, réactions et messages simulés ; réponses simulées dans les messages et le talkie-walkie (désactivables dans Réglages → Démo).
- Salon partagé en vrai (page publiée) : les personnes qui ont la page ouverte en même temps se voient dans le même salon, avec leur avatar, leur état de micro et leurs réactions.
- Dictée (page publiée, navigateurs Chromium) : quand ton micro est ouvert dans un salon, tes paroles s'affichent en sous-titres et les autres les voient.

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

1. Palette finale (bascule dans Réglages) : Cosmique (vitrine néon) ou Ocean Signal. Les codes Ocean Signal du prototype sont une proposition.
2. Variante de logo : A (violet-rose, « Logo PULSE néon dans l'espace ») ou B (violet-rose-cyan, « Logo futuriste PULSE en néon cosmique »). Bascule dans Réglages ; B est affiché par défaut.
3. Les 4 nouveaux archétypes d'avatar.
4. Organisation des onglets : Salons et Activités hors de la barre basse, ou dans la barre.
5. Mécanique du « talkie-walkie » : direct en temps réel ou message vocal rapide.
6. Périmètre de la traduction et contenu de PULSE+.
7. Pile technique pour la vraie application (mobile natif ou web, serveur, fournisseur audio temps réel).

## Références et visuels

- `DOSSIER_MAITRE.md` : dossier de transmission du 18 novembre 2026 (fait foi).
- `references/` : les 14 images PULSE originales. La « Vitrine néon » sert de modèle principal à l'interface.
- `assets/` : illustrations découpées dans les maquettes de Kelly (accueil, découvrir, communauté Musique, salon, « Mon univers ») et l'icône micro. Ce sont des visuels provisoires en résolution limitée, à remplacer par des versions HD.

## Écarts connus avec les maquettes

- Les avatars du prototype sont dessinés en vectoriel pour pouvoir porter chaque accessoire. Les maquettes montrent des avatars 3D façon film d'animation : il faudra des visuels 3D en couches (corps, têtes, accessoires) pour atteindre ce rendu tout en gardant la personnalisation.
- Les icônes de catégories sont lumineuses mais plates ; les maquettes utilisent des icônes 3D.
