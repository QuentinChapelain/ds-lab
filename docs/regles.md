# Règles

Les règles du langage que ds-lab produit, pour tout utilisateur de l'outil : le design system (DS), le nommage (NM), les composants (CP) et leur documentation (DOC). Chacune a sa raison et son contrôle. Une règle sans contrôle est une dette (`KNOWN_ISSUES.md`).

## Design system

| | Règle | Raison | Contrôle |
|---|---|---|---|
| DS1 | Sur un plein, texte foncé seulement s'il atteint 7:1 sur le plein (et 4,5:1 sur le survol) ; sinon texte blanc | En dessous, conforme au ratio, mais le texte vibre | Appliquée à la saisie, `npm run saisie` (D04) ; statut avertissement hors règle, en dette |
| DS2 | L'anneau de focus se pose sur le fond de page, décalé de 2 px, jamais sur le plein | Sur une marque moyenne, anneau et plein ont la même couleur | `npm run contraste` |
| DS3 | Le parent porte l'espace, l'enfant n'a pas de marge | Pas de fusion de marges, responsive simple | Tests des planches (`test/espacements-planche.test.js`) |
| DS4 | L'écart entre composants vaut au moins le double de l'écart interne | On doit voir à quel champ appartient un message | `npm run espacements` |
| DS5 | Les écarts sont strictement croissants | La hiérarchie se lit à la distance | `npm run espacements` |
| DS6 | Seuls les grands écarts et les grands textes varient avec la largeur | Pratique observée dans les systèmes de référence | `npm run espacements` et `npm run typo` |
| DS7 | Une hauteur de ligne est un multiple de 4 px : on choisit la hauteur, puis on en déduit le rapport | Grille | `npm run typo` |
| DS8 | Affichage et titres strictement décroissants, en large et en étroit | Hiérarchie à toutes les largeurs | `npm run typo` |
| DS9 | Ne jamais prendre une primitive s'il existe un rôle pour la relation | Sinon les valeurs libres reviennent | Liste « sans rôle » de `npm run espacements` et de `npm run typo` |
| DS10 | Un style de texte ne porte pas de couleur, et un seul affichage grand par page | Séparer forme et couleur | Contrôle à écrire |
| DS11 | Affichage et titres 1 à 3 portent une consigne commune de hauteur de capitale (0,7 × la taille [H]), la même pour toutes les polices ; aucun autre style n'en porte | Une police de client change la hauteur visible des titres ; une règle unique, sans réglage par marque (D17) | `npm run typo` |
| DS12 | Chaque fond nomme son texte, et la paire tient son seuil dans tous les thèmes | Un texte lisible ne dépend pas de la marque (D03) | `npm run contraste` |
| DS13 | Le primaire, c'est ce qui se clique ; l'accent, c'est l'identité, rare, jamais porteur de sens | Une couleur qui veut dire « cliquable » ne sert pas à décorer (D05) | En dette |
| DS14 | Une paire interdite porte sa règle de remplacement | Interdire sans dire quoi faire laisse le choix au hasard (D06) | `npm run contraste` : une règle vide est une panne |
| DS15 | Une bordure discrète ou par défaut est décorative, jamais seule pour repérer un champ ou un état | Elle n'atteint pas 3:1 (D07) | `tokens/commun/paires.json` (`sansPaire`), `test/roles-semantique.test.js` |
| DS16 | Les aplats de marque ne se cliquent pas | Ils ont la couleur de la marque, pas celle de l'action (D14) | En dette |
| DS17 | En marque blanche, les titres prennent la police du client ; le texte, les libellés et les boutons, celle du produit | La lisibilité d'un formulaire ne dépend pas d'une police d'affiche (D16, D44) | `npm test` (`test/police-produit.test.js`) |

## Nommage

| | Règle | Raison | Contrôle |
|---|---|---|---|
| NM1 | L'interface publique est en anglais : noms de composants, props, valeurs, événements, slots, classes CSS `ds-`. Le texte est en français : fiches, messages, décisions, et le code interne de ds-lab (`src/`, tests, outils) | Un utilisateur externe et un agent lisent les noms des grands design systems ; l'équipe lit le texte en français | Table des noms (NM2) ; les noms des tokens et des variables du thème, encore en français, sont en dette |
| NM2 | Un composant prend le nom le plus courant parmi ceux qui désignent sa fonction dans les design systems de référence (Component Gallery) ; d'après la fonction, pas la forme ; singulier, PascalCase, sans abréviation, préfixé `Ds` ; une famille partage son dernier mot (`DsIconButton` est un `DsButton`) | Un nom courant se devine ; un nom en deux mots ne heurte aucun élément HTML (guide de style de Vue, règle « multi-word component names ») ; « parmi ceux qui désignent sa fonction » écarte un nom courant qui désigne aussi une autre pièce | `atelier/composants/noms.json`, lu par `npm --prefix atelier run fiches -- --verifier` |
| NM3 | Une prop prend le nom du même concept dans le HTML (`disabled`, `required`, `href`), sinon dans Vuetify (`variant`, `size`, `loading`), sinon le nom courant ; ses valeurs disent l'usage, jamais une mesure (`small`, pas `32`). Exception : une valeur de Vuetify qui ne dit rien (`default`) cède au nom courant (`medium`) | Un utilisateur du HTML ou de Vuetify ne réapprend rien ; une valeur vague ne s'explique pas | Source de chaque prop et de chaque valeur dans `atelier/composants/noms.json` |
| NM4 | Un token est nommé d'après son usage, `propriété.sens.emphase.état`, jamais d'après une teinte ni un pas | Changer de couleur ne doit pas renommer un token (D01) | `test/roles-semantique.test.js` (T1) |
| NM5 | Un module prend un nom de domaine suivi de sa pièce de base, sans préfixe (`MemberCard` est une `DsCard`, `MemberList` une liste) ; ses props reprennent le nom de la prop du composant assemblé quand le concept est le même (`href`, `image`, `headingLevel`) | `Ds` dit « pièce du design system » ; un module appartient au produit, et son nom dit ce qu'il assemble (D61) | Table des noms (`atelier/composants/noms.json`), `npm --prefix atelier run fiches -- --verifier` |

## Composants

| | Règle | Raison | Contrôle |
|---|---|---|---|
| CP1 | Un composant est statique ou interactif, jamais les deux : un composant sans événement refuse tout attribut `on…` | Une pièce qui « se clique un peu » n'a ni rôle ni focus (D50, D55) | `test/fabrique-enveloppes.test.js` (W9) ; tests de rendu (tabulation, rôle) |
| CP2 | Tout usage hors des props est refusé, avec un message qui nomme le composant et la prop, et rien n'est rendu | Une erreur visible tout de suite vaut mieux qu'un rendu faux (D51) | `test/fabrique-enveloppes.test.js` (W1 à W8), stories de refus |
| CP3 | Aucune valeur visuelle en dur dans un composant : couleur, taille, espace, rayon, ombre, graisse, interligne, durée | Chaque marque donne ses valeurs ; changer un token change toutes ses instances. DS9 refuse la primitive, CP3 la valeur nue | Tests de rendu (valeurs rendues égales aux tokens) ; garde de lecture du style en dette |
| CP4 | Une pièce de Vuetify ne paraît que dans son composant | Le composant est le seul endroit à changer (D41, D43) | `test/enveloppe-bouton.test.js` (E1 à E12) |
| CP5 | Le nom accessible vient d'une prop obligatoire ; un `aria-label` posé à la main est refusé quand le composant le pose | Un bouton à icône sans nom est muet (D52, D54) | Attributs retirés des menus, W5, arbre d'accessibilité des tests de rendu |
| CP6 | Ce qui mène ailleurs est un lien (`href`) ; ce qui agit est un bouton ; jamais un bloc rendu cliquable par un attribut `on…` | Le clavier et le lecteur d'écran savent ce que sont un lien et un bouton (D50) | CP1 |
| CP7 | Un composant refuse un usage, jamais une donnée : pas de limite de longueur sur un texte venu des données ; trop long, il est coupé par « … » et reste entier dans la page | Un refus ferait disparaître une donnée (D55) | En dette ; le test de rendu du `DsTag` le vérifie pour lui |
| CP8 | Les règles de pose sont écrites dans la fiche, section « Quand l'utiliser » : un seul bouton principal par vue ; un texte d'exemple ne remplace jamais le libellé ni l'aide (D49) | Ce sont des règles de page, pas de composant | En dette |
| CP9 | Un module n'emploie aucune pièce de Vuetify : seulement des composants `Ds…` et d'autres modules | Le composant reste le seul endroit à changer (CP4, D61) | `test/modules.test.js` (L1) |
| CP10 | Le style d'un module ne porte que la mise en page : variables du thème, mots-clés, 0 et 100 %, sans calcul ni valeur nue | Ses pièces portent les valeurs visuelles ; un module qui en écrit une la sort des tokens (D61) | `test/modules.test.js` (L2) |

## Documentation

| | Règle | Raison | Contrôle |
|---|---|---|---|
| DOC1 | Chaque composant a sa fiche (`docs/composants/`), et chaque module la sienne (`docs/modules/`), aux mêmes sections | Un humain et un agent savent où chercher | `npm --prefix atelier run fiches -- --verifier` |
| DOC2 | Ce qui se déduit du code est généré, jamais recopié | Une copie vieillit sans le dire | `npm --prefix atelier run fiches -- --verifier` |
| DOC3 | Chaque token cité par une fiche dit en une phrase ce qu'il règle et où il sert (`$description`) : ni pas d'échelle, ni numéro de règle ou de décision, ni nom d'un autre token, ni mesure. Ce qui sert à l'équipe (raison, décision, mesure) va dans `$extensions["ds-lab.note"]` | Le lecteur sait à quoi sert un token sans ouvrir la source ; l'équipe ne perd rien | `test/roles-semantique.test.js` (T1) ; `npm --prefix atelier run fiches -- --verifier` : un token cité sans description est une panne, une description qui porte un numéro, un nom de token, une mesure, un pas ou plus d'une phrase est un écart |
| DOC4 | Vocabulaire du métier (token, prop, slot, événement) ; chaque mot propre à ds-lab est au glossaire (`docs/composants/README.md`) | Le lecteur externe parle la langue des design systems | `npm --prefix atelier run fiches -- --verifier` : mots refusés hors code et hors glossaire |
| DOC5 | Une fiche se lit en deux minutes : 500 mots écrits au plus, hors en-tête, tableaux, code et blocs générés | Elle est lue sur un téléphone | `npm --prefix atelier run fiches -- --verifier` |
