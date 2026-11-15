# Attendu : étape 4, séance c, police des titres

Question : quand un client change la police des titres, qu'est-ce que le système garantit ?

Contrainte de Quentin : aucun réglage par marque. Une règle, la même pour toutes les polices.

Principe proposé : les styles affichage et titres 1 à 3 portent une consigne commune de hauteur de capitale (font-size-adjust en forme à deux valeurs, cap-height et un rapport unique ; Chrome 127, Firefox 92, Safari 17). La hauteur visible des titres est alors la même quelle que soit la police. Tailles, hauteurs de ligne et DS7 ne changent pas.

Lots :
1. Lecture d'une police. Quand l'entrée donne un fichier pour la police des titres, la saisie lit ses mesures (unités par em, hauteur de capitale, hauteur d'x, ascendante, descendante) et sa couverture. Sans fichier, la police est acceptée par son nom et marquée « non contrôlée », comme aujourd'hui.
2. Garde-fous, avec motif de refus : format WOFF2 ; graisses demandées par les styles de titre présentes (fichiers statiques ou axe de graisse qui les couvre) ; accents et signes français présents (au moins é è ê ë à â î ï ô ù û ü ç œ æ, leurs capitales, « » ’ –) ; champ de licence renseigné.
3. Contrôle. Pour chaque style de titre, en large et en étroit, avec la consigne appliquée : la hauteur de capitale obtenue, et si l'ascendante plus la descendante dépassent la hauteur de ligne (titre sur deux lignes). Propose ce qui est un refus et ce qui est seulement montré.
4. Deux ou trois vraies polices sous licence libre, aux proportions opposées, dont une étroite et haute et, si possible, une sans minuscules. Propose où elles vivent (dépôt avec leur licence, dépendance de développement, ou local/), avec le moins de dépendances possible.
5. Où s'écrit la consigne commune : dis-moi ce que permet le type typography de DTCG et ta proposition.
6. Pour Quentin : local/lot-4c/titres.png, 420 px de large. Pour chaque police, les cinq styles de titre avec le texte « Été à Évian, nos cafés du mois », sur une puis deux lignes, sans la consigne puis avec.
7. Contrat et décisions à jour ; la ligne « réglage des styles de titre selon la police » quitte « hors contrat ».

Hors périmètre : police du texte, rem, composants.

Fini quand : les polices d'essai sont acceptées ou refusées avec motif ; l'image montre des titres de même hauteur visible ; les trois contrôles et les tests passent ; les marques existantes ne changent pas.

## Précisions après confrontation

Validées par Quentin le 15/11/2026 (18 h 10).

Constats de la confrontation :

- [F] Rien ne marque aujourd'hui une police comme « non contrôlée » : la saisie accepte des noms, sans chargement ni contrôle (`src/tokens/saisie.js`). Écrire ce marquage dans la couche marque changerait celle d'Orbe Café (test S1).
- [F] La consigne s'applique aussi aux polices des marques existantes (Georgia, Trebuchet MS, Palatino) : leurs fichiers ne changent pas, leur rendu bouge (taille utilisée = taille × rapport ÷ hauteur de capitale de la police). `semantique.tokens.json`, commun, change.
- [V] Une hauteur de ligne sans unité se multiplie-t-elle par la taille calculée ou par la taille utilisée ? Dans le second cas, DS7 ne tient plus à l'écran.
- [H] Ascendante plus descendante dépassent la hauteur de ligne pour presque toute police en affichage (interlignes de 1,11 à 1,4) : ce qui se voit sur deux lignes, c'est l'encre des capitales accentuées de la ligne 2 contre les descendantes de la ligne 1.
- [F] Graisses demandées par les styles de titre : 700 (affichage, titres 1 et 2) et 600 (titre 3), lues dans les rôles.
- [H] Le type typography de DTCG 2025.10 a cinq propriétés (fontFamily, fontSize, fontWeight, letterSpacing, lineHeight) ; aucune pour font-size-adjust.
- [F] À 420 px, sous le seuil de 600 px, ce sont les tailles en étroit.

Réponses :

1. Rapport : 0,7, hypothèse [H], à juger sur l'image. Orbe Café bougera à peine ; c'est accepté.
2. Licence : le champ du fichier (`name` 13 ou 14 non vide). Le contrat dit que cela prouve qu'une licence est déclarée, pas que le client a le droit d'usage web : ce droit reste à sa charge.
3. Refus si l'encre de deux lignes se touche ou si le fichier n'a pas de hauteur de capitale ; le reste est montré (hauteur de capitale obtenue, taille utilisée, dépassement de l'ascendante plus la descendante). Garde-fou : si plus d'une des polices d'essai normales (Oswald, EB Garamond, Cinzel) est refusée pour l'encre, arrêt et mesures montrées : ce serait la hauteur de ligne des titres à revoir, pas les polices.
4. La saisie peut lancer Chromium quand l'entrée donne un fichier.
5. « Non contrôlée » seulement dans la sortie de la saisie ; le test S1 reste intact.
6. Image : « une ligne » = « Été à Évian », « deux lignes » = la phrase entière avec un retour forcé après « Évian, », avec un trait à la hauteur de capitale.
7. Le rendu des marques existantes peut bouger légèrement ; dire de combien pour Orbe Café.
8. Lot 0 d'abord : si la hauteur de ligne suit la taille utilisée, l'écrire en px dans la sortie CSS et le dire. Vérifier Safari sur MDN.
9. Consigne : un jeton nombre commun, `police.titre.hauteur-capitale` (`tokens/commun/police.tokens.json`), et sur chacun des cinq composites `$extensions["ds-lab.hauteur-capitale"]` en alias vers lui, répété dans le contexte étroit.
10. Polices d'essai : Oswald, EB Garamond, Cinzel et Bebas Neue (cas de refus), dans fixtures/polices/ avec leur licence. fontTools, pour vérifier les mesures, installé dans `local/`, hors dépendances.

Rythme : l'attendu seul d'abord, en un commit. Arrêt après le lot 0 seulement si une mesure contredit le principe ; sinon tous les lots jusqu'à l'image et la documentation, un commit par lot, sans attendre entre les commits, contrôle d'encre compris ; pousser seance-4c, puis arrêt.

Lecture retenue :

- Le point 6 de la réponse est abîmé au collage (« avec le trait à la hauteur rendu des marques existantes ») : lu comme deux réponses, le trait à la hauteur de capitale (6) et le rendu des marques existantes (7).
