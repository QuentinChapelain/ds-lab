# Attendu : audit des composants, le constat

Message de Quentin du 18/11/2026, mot pour mot, puis les textes des (i), puis ses réponses au plan. Forme validée sur maquette le 18/11/2026 ; « go » le 18/11/2026.

## Message

Lot « audit des composants : le constat ». PLAN SEULEMENT : aucun fichier modifié dans le dépôt, aucun commit.

0. Contrôle : git status propre ; branche main ; HEAD = origin/main = 79a877a ; CI de main verte. Si un point manque, arrête-toi et dis lequel.
1. Crée la branche audit-composants.
2. Plan pour la commande npm run composants. Elle regarde des pages et rend un constat. Elle ne juge rien : pas de verdict, pas de catalogue d'enveloppes, pas de comparaison à une cible. Le but du lot est de faire marcher l'outil.

Ce qu'elle relève, au repos, par élément :
- le type, par le rôle d'accessibilité calculé (bouton avec texte, bouton à icône seule, lien, champ de texte, liste déroulante, case à cocher, radio, interrupteur, onglet, menu, fenêtre) ; pour les pièces sans rôle (carte, puce, avatar, badge), par la signature du framework s'il y en a un ;
- l'origine : le nom du framework, par une table de signatures qui est une donnée, facultative (sans framework, tout marche pareil) ; sinon « Fait maison », nommé par sa classe ; sinon « Sans style » ;
- le rendu : hauteur, arrondi, épaisseur de bordure, marge intérieure, taille et graisse de police ; ni couleur ni largeur ;
- le poids : nombre de fois, pages ; un élément identique sur toutes les pages compté une fois, marqué gabarit ;
- une capture de la première occurrence de chaque version ;
- le code : classes, endroit sur la page, extrait HTML court.
Une version = un type, une origine, un nom. Les apparences différentes d'une même version sont comptées ; dis si tu les montrerais en vignettes séparées.
Non identifiés : blocs répétés sans rôle ni signature. Propose la règle qui en fait des candidats (piste : classe maison répétée), sans seuil deviné, et dis ses faux positifs.

Décisions du designer : un fichier facultatif, écrit à la main, relu par la commande. Deux sortes de lignes : la version à garder d'un type ; le sort d'un bloc non identifié (laisser tel quel, ou rattacher à un type existant ou nouveau). Un bloc rattaché devient une version de ce type, marquée « rattaché à la main ». Les décisions se réappliquent à l'audit suivant. Propose un nom stable pour désigner une version ou un bloc, et ce qu'on fait d'une ligne qui vise une cible absente.

Scores, chacun en « x sur y », sans note globale :
- source unique : éléments sur la version la plus répandue de leur type, sur le total ;
- accessibilité de base : éléments interactifs qui ont un nom accessible, s'atteignent au clavier et ont une zone de clic d'au moins 24 px de côté, sur le total des éléments interactifs ;
- versions à garder choisies : sur le nombre de types ;
- fiabilité de l'audit : éléments identifiés, sur identifiés plus non identifiés ;
- effort : éléments qui ne sont pas sur la version à garder de leur type, à défaut pas sur la plus répandue.

Constat en JSON, Markdown et HTML lisible sur téléphone, pour un décideur, un designer et un développeur. Le mot « enveloppe » n'y apparaît jamais ; le framework est appelé par son nom ; les étiquettes d'origine sont neutres, sans couleur de jugement. Blocs, dans l'ordre :
- en-tête (site, pages, framework) ;
- une phrase : « N éléments relevés, de T types, en V versions. A viennent de [framework], B sont faits autrement. C blocs ne sont pas identifiés. » ;
- quatre cartes de score, deux par ligne, puis la ligne d'effort ;
- par type : titre ; « x fois · n versions · source unique a sur b » ; une ligne pleine largeur par version (image à gauche ; étiquette d'origine, nom, nombre, pages à droite) ; un accordéon « Voir le code » (nom dans le code, où, extrait, mesures) ; puis « Version à garder » et son état (« pas encore choisie » ou le nom) ;
- non identifiés, triés par nombre : image, nom, nombre, pages, accordéon, état ;
- limites de cet audit, toujours écrites ;
- un bouton (i) d'explication sur chaque titre et chaque score ; les textes sont à la fin de ce fichier.
Relevé brut gardé ; constat recalculable sans navigateur. Sortie 0, ou 2 sur une panne (D18).

Deux pages d'annuaire fictives (liste et fiche) dans les fixtures de la marque de démonstration : bouton avec texte 6 (Vuetify 3, fait maison an-btn 2, sans style 1 avec une zone de clic de 22 px de haut) ; bouton à icône seule 5 (Vuetify 4, fait maison 1 sans nom accessible) ; champ de texte 4 (Vuetify 2, fait maison an-champ 2) ; liste déroulante 3 (Vuetify 1, fait maison 2 dont 1 non atteignable au clavier) ; case à cocher 2 (sans style) ; onglet 3 (Vuetify) ; carte 4 (Vuetify) ; bloc an-carte 3, non identifié ; un en-tête de 2 boutons sur les deux pages, compté une fois, gabarit, hors des chiffres. Dis si des classes du framework écrites à la main suffisent ou s'il faut un vrai rendu.

Valeurs attendues, écrites avant le code.
Lancement A, sans fichier de décisions : 27 éléments, 7 types, 12 versions ; 17 Vuetify, 10 autrement ; 3 non identifiés ; source unique 20 sur 27 ; accessibilité de base 20 sur 23 ; versions à garder choisies 0 sur 7 ; fiabilité 27 sur 30 ; effort 7.
Lancement B, an-carte rattaché à la carte et version à garder du bouton avec texte = Vuetify : 30 éléments, 7 types, 13 versions ; 17 Vuetify, 13 autrement ; 0 non identifié ; source unique 20 sur 30 ; accessibilité de base 20 sur 23 ; versions à garder choisies 1 sur 7 ; fiabilité 30 sur 30 ; effort 10 ; carte 7 fois en 2 versions dont 3 rattachés à la main.
Tu peux ajuster les pages, pas ces chiffres. Si un chiffre te paraît faux, dis-le au lieu de l'ajuster.

Documentation : décision numérotée, README, ARCHITECTURE, KNOWN_ISSUES ; attendu dans docs/attendus/audit-composants.md, qui reprend ce message mot pour mot, les textes des (i), puis les réponses de Quentin au plan.
Hors lot : rapport pour le développeur, catalogue d'enveloppes et verdicts, score de composants posés, thème Tailwind, reconnaissance automatique des non identifiés, états, composants ouverts, audit du code source, note globale, tout site réel.

3. Pour chaque point : fichiers touchés, ce que tu réutilises de src/browser, src/rendered, src/verify et src/report, tests ajoutés, découpage en commits, dépendance ajoutée s'il y en a. Dis comment tu obtiens le rôle d'accessibilité calculé, le nom accessible et l'atteinte au clavier, lus dans le code existant, pas supposés. Dis si les captures entrent dans l'invariant « mêmes fichiers à l'octet ». Marque [H] ce que tu supposes.
Deux arrêts : ce plan ; puis le constat HTML des lancements A et B, avec son chemin pour que Quentin l'ouvre sur téléphone, et la CI.

## Textes des (i)

| Mot affiché | Texte |
|---|---|
| Type d'élément | Une famille de pièces d'interface qui font la même chose : bouton, champ, carte |
| Version | Une façon dont ce type est codé sur le site. Deux versions font le même travail avec un code différent |
| Origine | D'où vient le code : du jeu de pièces du site, de l'équipe, ou du navigateur sans habillage |
| Version à garder | La version que l'équipe garde pour ce type d'élément. Les autres seront remplacées par elle. Le designer la choisit, avec le développeur |
| Source unique | Part des éléments qui utilisent la version la plus répandue de leur type. Plus c'est haut, moins il y a de doublons |
| Accessibilité de base | Chaque élément a un nom lisible par un lecteur d'écran, s'atteint au clavier, et a une zone de clic assez grande. C'est un minimum, pas un audit complet |
| Versions à garder choisies | Types dont la version à garder est choisie par le designer |
| Fiabilité de l'audit | Part des éléments que l'outil a su identifier. Le reste est dans « Non identifiés » |
| Effort | Nombre d'endroits à modifier pour n'avoir qu'une version par type |
| Non identifiés | Des blocs répétés que l'outil ne sait pas nommer. À laisser tels quels, ou à rattacher à un type |

Réserves à écrire dans « Limites de cet audit » : pages au repos, sans survol ni menus ouverts ; une seule largeur ; nombre de pages vues ; source unique à 100 % ne veut pas dire « bien » ; l'accessibilité de base est un minimum ; les types non vus sur ces pages ne sont pas comptés ; l'outil regarde la page affichée et ne donne pas le fichier du projet.

## Réponses de Quentin au plan

| Point | Réponse |
|---|---|
| Q1, zone de clic | Oui : la plus grande des deux boîtes, celle de l'élément et celle du `<label>` qui le contient ou le désigne par `for`. Le document « Understanding 2.5.8 » du W3C ne dit rien du label ; la règle « Target Size 5 » d'OpenA11y admet d'agrandir le label à 24 px. Écris-le ainsi dans la décision, sans dire que le WCAG l'impose |
| Q2, clavier | Oui, la règle du tabindex itinérant, et la limite « flèches non pressées » |
| Q3, gabarit | Oui, tel que proposé : hors de tous les chiffres, montré une fois sous son type. Règle d'identité acceptée |
| Q4, « Fait maison » | (a) : textes affichés dans `src/report/constat.textes.json`, borné par le test proposé |
| Bouton sans style | Gardé nu, à 21 px. Dans `docs/attendus/audit-composants.md`, note que l'attendu disait 22 et que 21 est la mesure ; les chiffres ne changent pas |
| Égalité | « À égalité » avec les deux noms ; l'outil ne choisit pas |
| Apparences | **Choix de Quentin** : une ligne par version, avec « n apparences » ; une petite vignette par apparence dans « Voir le code », avec ses mesures. Comme ton plan |
| Phrase sans table de signatures | **Choix de Quentin** : « N éléments relevés, de T types, en V versions. Aucun framework reconnu. C blocs ne sont pas identifiés. » Pas de « faits autrement » sans framework. Avec un framework, la phrase de l'attendu ne change pas |
| `--sources` | Hors lot |
| « Sans style » lu dans le code | D'accord, en dette |
| Emplacements, extrait de 200 caractères | D'accord |

Mesure du bouton sans style : l'attendu disait 22 px de haut ; un bouton sans classe mesure 21 px dans Chromium 147 [F]. Le bouton reste nu, à 21 px : les chiffres ne changent pas.

### Limites ajoutées au bloc « Limites de cet audit », mot pour mot

- « Les onglets, les menus et les groupes de boutons radio comptent comme atteints au clavier si l'un d'eux l'est. L'outil ne vérifie pas que les flèches marchent. »
- « La zone de clic compte l'élément ou son libellé cliquable. Sous 24 px, une commande laissée à la taille du navigateur compte comme un défaut, alors que les règles WCAG l'acceptent. »
- « Un élément présent à l'identique sur toutes les pages est montré une fois et ne compte dans aucun chiffre. »

### Correction du plan

Rien n'est poussé sur `main` : la branche `audit-composants` est poussée pour la CI ; l'arrêt 2 vient avant la fusion, qui se fera sur l'avis de Quentin.
