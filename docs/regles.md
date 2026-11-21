# Règles

Le langage que ds-lab produit, pour tout utilisateur de l'outil : le design system (DS), le nommage (NM), les composants (CP) et leur documentation (DOC). Chaque énoncé est rangé dans l'une de quatre cases (D65).

| Mot | Sens | Qui le tient |
|---|---|---|
| Règle | Énoncé vrai ou faux, qu'un contrôle tranche ; la CI bloque | La machine |
| Défaut | Valeur calculée ou posée, sans seuil sourcé ; écrite dans une décision | La machine |
| Technique | Le comment d'une règle dans un framework (`docs/techniques/`) | L'agent ou l'humain lit |
| Consigne | Dite à l'agent, non contrôlable ; ne bloque pas | L'agent ou l'humain lit |

Un défaut bloque comme une règle. Il se change par une décision écrite ; une règle ne se change pas.

## Écrire une règle

1. Une règle est un énoncé vrai ou faux, qu'un contrôle tranche.
2. Elle porte sur une relation entre rôles et ne nomme aucun framework ; le comment par framework est une technique, écrite à part.
3. Son seuil a une source (norme, ou jugement sur image consigné avec ses mesures). Sans source, c'est un défaut.
4. Elle dit son repli quand la cible est inatteignable (modèle : D04).
5. Son contrôle relit le résultat écrit, pour toute marque, sans valeur recopiée à la main.
6. Son message d'échec dit quoi faire.
7. Une exception porte sa raison, à l'endroit de l'exception.
8. Ce qui ne peut pas être contrôlé n'est pas une règle : c'est une consigne.

Une règle garde son numéro pour toujours, même devenue défaut ou consigne. Une partie détachée prend DF<n> (défaut) ou CS<n> (consigne). Une technique n'a pas de numéro : elle porte celui de sa règle. La colonne Contrôle commence par l'un de quatre mots : **Relit** (le résultat écrit, pour toute marque, tout composant ou tout module), **Liste fixe**, **Recopié** (valeurs recopiées à la main), **Absent**. Quand plusieurs contrôles se partagent l'énoncé, le mot est celui du plus faible ; « en partie » dit qu'une part de l'énoncé n'est pas contrôlée (`test/regles.test.js`).

## Design system

| | Règle | Raison | Seuil | Contrôle | Technique |
|---|---|---|---|---|---|
| DS1 | Sur un plein, texte foncé seulement s'il atteint 7:1 sur le plein (et 4,5:1 sur le survol) ; sinon texte blanc | En dessous, conforme au ratio, mais le texte vibre | Jugement sur image consigné (D04) | Absent : appliquée à la saisie, `npm run saisie` (D04) ; rien ne relit la règle sur les jetons écrits ; statut avertissement hors règle, texte foncé à 5,77:1 sur le plein (D04) | — |
| DS2 | L'anneau de focus se pose sur le fond de page, jamais sur le plein, et y tient son seuil ; son décalage est DF1 | Sur une marque moyenne, anneau et plein ont la même couleur | WCAG 1.4.11 (3:1) | Liste fixe : `npm run contraste`, toute marque en clair et en large ; sombre et étroit sur cinq marques écrites en dur (`test/contraste-modes.test.js`, C2) ; le décalage, DF1 | — |
| DS3 | Le parent porte l'espace, l'enfant n'a pas de marge | Pas de fusion de marges, responsive simple | — | Liste fixe : planche d'Orbe Café (`test/espacements-planche.test.js`), preuve de `DsTag` | — |
| DS5 | Les écarts sont strictement croissants | La hiérarchie se lit à la distance | — | Relit : `npm run espacements` | — |
| DS6 | En étroit, une valeur ne dépasse pas sa valeur large, et l'ordre des écarts et des titres tient ; ce qui change en étroit est DF2 | Une page étroite ne grossit rien, et sa hiérarchie se lit comme en large | — | Relit : `npm run espacements` et `npm run typo` | — |
| DS8 | Affichage et titres strictement décroissants, en large et en étroit | Hiérarchie à toutes les largeurs | — | Relit : `npm run typo` | — |
| DS9 | Ne jamais prendre une primitive s'il existe un rôle pour la relation | Sinon les valeurs libres reviennent | — | Absent : la liste « sans rôle » de `npm run espacements` et de `npm run typo` s'affiche sans bloquer | — |
| DS10 | Un style de texte ne porte pas de couleur | Séparer forme et couleur | — | Liste fixe : `test/typo-jetons.test.js`, couche commune | — |
| DS11 | Affichage et titres 1 à 3 portent une consigne commune de hauteur de capitale, la même pour toutes les polices ; aucun autre style n'en porte ; son rapport est DF3 | Une police de client change la hauteur visible des titres ; une règle unique, sans réglage par marque (D17) | — | Relit : `npm run typo` | — |
| DS12 | Chaque fond nomme son texte, et la paire tient son seuil dans tous les thèmes | Un texte lisible ne dépend pas de la marque (D03) | WCAG 1.4.3 et 1.4.11 (4,5:1, 3:1) ; exceptions avec leur raison dans `tokens/commun/paires.json` ; repli : la saisie refuse la marque | Liste fixe : `npm run contraste`, toute marque en clair et en large ; sombre et étroit sur cinq marques écrites en dur (`test/contraste-modes.test.js`, C2) ; table du thème relue pour toute marque (`test/theme-vuetify.test.js`) | — |
| DS13 | Le primaire, c'est ce qui se clique : aucun rôle d'interaction ne pointe sur l'accent ; l'accent est CS3 | Une couleur qui veut dire « cliquable » ne sert pas à décorer (D05) | — | Absent | — |
| DS14 | Une paire interdite porte sa règle de remplacement | Interdire sans dire quoi faire laisse le choix au hasard (D06) | — | Relit : `npm run contraste` ; une règle vide est une panne | — |
| DS15 | Une bordure discrète ou par défaut est décorative, jamais seule pour repérer un champ ou un état | Elle n'atteint pas 3:1 (D07) | WCAG 1.4.11 | Liste fixe : `tokens/commun/paires.json` (`sansPaire`), `test/roles-semantique.test.js` ; contour de `DsTextInput` (`test/champ-carte-jetons.test.js`) | — |
| DS17 | En marque blanche, le libellé (boutons, champs, onglets) prend la police du produit, que la marque ne remplace pas ; titres et texte suivent DF4 | La lisibilité d'un formulaire ne dépend pas d'une police d'affiche (D16, D44) | — | Relit : `npm run typo` (police par rôle) | — |
| DS18 | L'interligne du corps (grand et moyen) vaut au moins 1,5 | Les lignes d'un paragraphe ne se mêlent pas | WCAG 1.4.8, niveau AAA (technique suffisante C21) | Relit : `npm run typo` | — |

## Nommage

| | Règle | Raison | Seuil | Contrôle | Technique |
|---|---|---|---|---|---|
| NM1 | L'interface publique est en anglais : noms de composants, props, valeurs, événements, slots, classes CSS `ds-`, noms des tokens, variables CSS et du thème, couleurs du thème ; ds-lab y ajoute les clés de `paires.json` et de la table du thème ; le texte est CS4 | Un utilisateur externe et un agent lisent les noms des grands design systems | — | Relit, en partie : forme et source de chaque nom (NM2) ; anciens noms, D62, `docs/anciens-noms.json` (`test/anciens-noms.test.js`) ; la langue elle-même n'est pas vérifiée | Oui |
| NM2 | Un composant prend le nom le plus courant parmi ceux qui désignent sa fonction dans les design systems de référence (Component Gallery) ; d'après la fonction, pas la forme ; singulier, PascalCase, sans abréviation, préfixé ; une famille partage son dernier mot (`DsIconButton` est un `DsButton`). ds-lab : le préfixe vaut `Ds` | Un nom courant se devine ; un nom en deux mots ne heurte aucun élément HTML (guide de style de Vue, règle « multi-word component names ») ; « parmi ceux qui désignent sa fonction » écarte un nom courant qui désigne aussi une autre pièce | Component Gallery, relevé du 19/11/2026 (D57) | Recopié : comptes de la table des noms (`atelier/composants/noms.json`) ; forme relue par `npm --prefix atelier run fiches -- --verifier`, qui vérifie la valeur du préfixe, `Ds` ; préfixe à rendre réglable par client : le contrôle vérifiera alors sa présence, jamais sa valeur ; « sans abréviation » et « dernier mot » non vérifiés | — |
| NM3 | Une prop prend le nom du même concept dans le HTML (`disabled`, `required`, `href`), sinon dans le framework des composants, sinon le nom courant ; ses valeurs disent l'usage, jamais une mesure (`small`, pas `32`) | Un utilisateur du HTML ou du framework ne réapprend rien ; une valeur vague ne s'explique pas | — | Recopié : source de chaque prop et de chaque valeur, déclarée à la main dans `atelier/composants/noms.json` ; « jamais une mesure » non vérifié | Oui |
| NM4 | Un token est nommé d'après son usage, `propriété.sens.emphase.état`, jamais d'après une teinte ni un pas ; il nomme un rôle, pas un objet, et un token qui règle une seule pièce porte son nom de code (`avatar-size`, `background.avatar`) | Changer de couleur ne doit pas renommer un token (D01) ; le nom de code dit qui lit le token (D63) | — | Relit : `test/roles-semantique.test.js` (T1) ; « un rôle, pas un objet » et le nom de code ne sont pas vérifiés | — |
| NM5 | Un module prend un nom de domaine suivi de sa pièce de base, sans préfixe (`MemberCard` est une `DsCard`, `MemberList` une liste) ; ses props reprennent le nom de la prop du composant assemblé quand le concept est le même (`href`, `image`, `headingLevel`) | `Ds` dit « pièce du design system » ; un module appartient au produit, et son nom dit ce qu'il assemble (D61) | — | Relit, en partie : forme du nom, table des noms (`atelier/composants/noms.json`), `npm --prefix atelier run fiches -- --verifier` ; la pièce de base et les props reprises ne sont pas vérifiées | — |

## Composants

| | Règle | Raison | Seuil | Contrôle | Technique |
|---|---|---|---|---|---|
| CP1 | Un composant est statique ou interactif, jamais les deux : un composant sans événement refuse tout attribut `on…` | Une pièce qui « se clique un peu » n'a ni rôle ni focus (D50, D55) | — | Relit : chaque menu, `test/fabrique-enveloppes.test.js` (W9) ; tests de rendu (tabulation, rôle) | Oui |
| CP2 | Tout usage hors des props est refusé, avec un message qui nomme le composant et la prop, et rien n'est rendu | Une erreur visible tout de suite vaut mieux qu'un rendu faux (D51) | — | Relit : chaque menu, `test/fabrique-enveloppes.test.js` (W1 à W8), stories de refus | — |
| CP3 | Aucune valeur visuelle en dur dans un composant : couleur, taille, espace, rayon, ombre, graisse, interligne, durée | Chaque marque donne ses valeurs ; changer un token change toutes ses instances. DS9 refuse la primitive, CP3 la valeur nue | — | Relit, en partie : tests de rendu (valeurs rendues égales aux tokens) ; garde de lecture du style en dette | Oui |
| CP4 | Une pièce du framework ne paraît que dans le composant qui l'enveloppe | Le composant est le seul endroit à changer (D41, D43) | — | Liste fixe : sept pièces, `test/enveloppe-bouton.test.js` (E1 à E12) | Oui |
| CP5 | Le nom accessible vient d'une prop obligatoire ; un `aria-label` posé à la main est refusé quand le composant le pose | Un bouton à icône sans nom est muet (D52, D54) | — | Liste fixe : attributs retirés des menus, W5, arbre d'accessibilité des tests de rendu | — |
| CP6 | Ce qui mène ailleurs est un lien (`href`) ; ce qui agit est un bouton ; dans une page, CS5 | Le clavier et le lecteur d'écran savent ce que sont un lien et un bouton (D50) | — | Liste fixe : CP1, preuve de `DsCard` à lien | — |
| CP7 | Un composant refuse un usage, jamais une donnée : pas de limite de longueur sur un texte venu des données ; trop long, il est coupé par « … » et reste entier dans la page | Un refus ferait disparaître une donnée (D55) | — | Liste fixe : les tests de rendu de `DsTag` et de `MemberCard` vérifient un texte long | — |
| CP9 | Un module n'emploie aucune pièce du framework : seulement des composants `Ds…` et d'autres modules | Le composant reste le seul endroit à changer (CP4, D61) | — | Relit : chaque module, `test/modules.test.js` (L1) | Oui |
| CP10 | Le style d'un module ne porte que la mise en page : variables du thème, mots-clés, 0 et 100 %, sans calcul ni valeur nue | Ses pièces portent les valeurs visuelles ; un module qui en écrit une la sort des tokens (D61) | — | Relit : chaque module, `test/modules.test.js` (L2) ; son message ne dit pas quoi faire | Oui |

## Documentation

| | Règle | Raison | Seuil | Contrôle | Technique |
|---|---|---|---|---|---|
| DOC1 | Chaque composant a sa fiche (`docs/composants/`), et chaque module la sienne (`docs/modules/`), aux mêmes sections | Un humain et un agent savent où chercher | — | Relit : `npm --prefix atelier run fiches -- --verifier` | — |
| DOC2 | Ce qui se déduit du code est généré, jamais recopié | Une copie vieillit sans le dire | — | Relit : `npm --prefix atelier run fiches -- --verifier` | — |
| DOC3 | Chaque token cité par une fiche dit en une phrase ce qu'il règle et où il sert (`$description`) : ni pas d'échelle, ni numéro de règle ou de décision, ni nom d'un autre token, ni mesure. Ce qui sert à l'équipe (raison, décision, mesure) va dans `$extensions["ds-lab.note"]` | Le lecteur sait à quoi sert un token sans ouvrir la source ; l'équipe ne perd rien | — | Relit : `test/roles-semantique.test.js` (T1) ; `npm --prefix atelier run fiches -- --verifier` : un token cité sans description est une panne, une description qui porte un numéro, un nom de token, une mesure, un pas ou plus d'une phrase est un écart | — |
| DOC4 | Vocabulaire du métier (token, prop, slot, événement) ; chaque mot propre à ds-lab est au glossaire (`docs/composants/README.md`) | Le lecteur externe parle la langue des design systems | — | Liste fixe : `npm --prefix atelier run fiches -- --verifier`, mots refusés hors code et hors glossaire | — |

## Défauts

| | Défaut | Valeur | Raison | Décision | Contrôle |
|---|---|---|---|---|---|
| DS4 | L'écart entre composants vaut au moins le double de l'écart interne | 2 × | On doit voir à quel champ appartient un message ; régularité observée dans les systèmes lus, pas une norme | D65 | Relit : `npm run espacements` |
| DS7 | Une hauteur de ligne est un multiple de la grille ; la méthode est CS1 | 4 px | Grille | D65 | Relit : `npm run typo` |
| DOC5 | Une fiche se lit en deux minutes : 500 mots écrits au plus, hors en-tête, tableaux, code et blocs générés | 500 mots | Elle est lue sur un téléphone | D57 | Relit : `npm --prefix atelier run fiches -- --verifier` |
| DF1 | L'anneau de focus est décalé hors du composant (de DS2) | 2 px | Il se pose sur le fond, pas sur le plein | D65 | Recopié : `test/bouton-jetons.test.js` ; la preuve mesure l'anneau |
| DF2 | Seuls l'écart de section et les grands textes (affichage, titres 1 à 3) changent en étroit (de DS6) | Sous 600 px [H] | Pratique observée dans les systèmes de référence | D65 | Recopié : `test/typo-jetons.test.js`, couche commune |
| DF3 | Rapport de la consigne de hauteur de capitale (de DS11) | 0,7 × la taille [H] | Hypothèse, à juger sur image | D17 | Absent : `npm run typo` vérifie une même valeur, entre 0 et 1, pas la valeur |
| DF4 | Les titres (affichage, titres 1 à 3) prennent la police du client ; le titre 4, le corps et la mention celle du produit, sauf si l'entrée en déclare une (de DS17) | `font.product` | Le client ne change pas la police du texte ; le système garde la capacité de la changer | D16, D44 | Relit : `npm run typo` (police par rôle) |
| DF5 | Interligne des petits styles (corps petit, libellé, texte d'aide) | Au moins 1,3 | Valeur posée, sans norme | D65 | Relit : `npm run typo` |
| DF6 | Taille du corps moyen | Au moins 1 rem (16 px) | Taille de texte par défaut des navigateurs | D65 | Relit : `npm run typo` |
| DF7 | Aucune taille de texte sous ce seuil, en large et en étroit | 12 px | Valeur posée, sans norme | D65 | Relit : `npm run typo` |

## Consignes

| | Consigne | Où elle se lit |
|---|---|---|
| DS16 | Les aplats de marque ne se cliquent pas : ils ont la couleur de la marque, pas celle de l'action (D14) | `docs/feuille-de-route.md` (B12) |
| CP8 | Les règles de pose sont écrites dans la fiche, section « Quand l'utiliser » : un seul bouton principal par vue ; un texte d'exemple ne remplace jamais le libellé ni l'aide (D49) ; ce sont des règles de page, pas de composant | Fiches (`docs/composants/`, `docs/modules/`) |
| CS1 | On choisit la hauteur de ligne, puis on en déduit le rapport (de DS7) | `tokens/commun/semantique.tokens.json`, « ligne visée » de chaque style de texte |
| CS2 | Un seul affichage grand par page (de DS10) | `docs/regles.md` |
| CS3 | L'accent, c'est l'identité : rare, jamais porteur de sens (de DS13) | `docs/regles.md` |
| CS4 | Le texte (fiches, messages, décisions) est dans la langue de l'équipe ; ds-lab écrit en français, et son code interne (`src/`, tests, outils) aussi : c'est son choix (de NM1) | `docs/regles.md` |
| CS5 | Jamais un bloc rendu cliquable par un attribut `on…` dans une page (de CP6) | `docs/composants/card.md` (`href`) |
