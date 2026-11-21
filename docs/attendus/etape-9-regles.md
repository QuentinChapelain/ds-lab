# Étape 9, lot 1 : les règles

Attendu écrit le 21/11/2026, avant le code, d'après la demande, le plan et les réponses de Quentin du même jour (« OK sur tout », 12 h 33). Accepté à l'arrêt 1 avec quatre corrections, reportées ici : le compte des énoncés, l'enchaînement des commits, DS18 règle au niveau AAA, un endroit pour chaque consigne. Étiquettes : [F] mesuré ou lu, [H] hypothèse, [V] à vérifier.

## But

Ajouter un composant ou un framework vite, de façon presque déterministe : chaque énoncé de `docs/regles.md` est rangé dans l'une des quatre cases, et ce que la machine tient est dit par son contrôle.

## Les quatre mots

| Mot | Sens | Qui le tient |
|---|---|---|
| Règle | Énoncé vrai ou faux, qu'un contrôle tranche ; la CI bloque | La machine |
| Défaut | Valeur calculée ou posée, sans seuil sourcé ; écrite dans une décision. Il bloque comme une règle ; il se change par une décision écrite, une règle ne se change pas | La machine |
| Technique | Le comment d'une règle dans un framework | L'agent ou l'humain lit |
| Consigne | Dite à l'agent, non contrôlable ; ne bloque pas | L'agent ou l'humain lit |

## Règles d'écriture des règles

1. Une règle est un énoncé vrai ou faux, qu'un contrôle tranche.
2. Elle porte sur une relation entre rôles et ne nomme aucun framework ; le comment par framework est une technique, écrite à part.
3. Son seuil a une source (norme, ou jugement sur image consigné avec ses mesures). Sans source, c'est un défaut.
4. Elle dit son repli quand la cible est inatteignable (modèle : D04).
5. Son contrôle relit le résultat écrit, pour toute marque, sans valeur recopiée à la main.
6. Son message d'échec dit quoi faire.
7. Une exception porte sa raison, à l'endroit de l'exception.
8. Ce qui ne peut pas être contrôlé n'est pas une règle : c'est une consigne.

## Numéros

- Une règle garde son numéro pour toujours, même devenue défaut ou consigne entière (DS4, DS7, DOC5, DS16, CP8).
- Une partie détachée prend **DF<n>** (défaut) ou **CS<n>** (consigne), dans l'ordre ci-dessous.
- Une règle nouvelle prend le numéro suivant de sa série (DS18).
- Une technique n'a pas de numéro : elle porte celui de sa règle, une ligne par règle, dans `docs/techniques/<framework>.md`.

## Le tri

Colonne Contrôle : chaque cellule commence par l'un de quatre mots.
- **Relit** : le contrôle relit le résultat écrit, pour toute marque, ou pour tout composant ou module.
- **Liste fixe** : il relit sur une liste fixe.
- **Recopié** : il compare à des valeurs recopiées à la main.
- **Absent** : il n'y en a pas.

Pour un contrôle en partie, on prend le mot du maillon le plus faible, et la suite le dit.

### Règles

| | Énoncé | Seuil | Contrôle | Technique |
|---|---|---|---|---|
| DS1 | Sur un plein, texte foncé seulement s'il atteint 7:1 sur le plein et 4,5:1 sur le survol ; sinon texte blanc (repli) | Jugement sur image consigné (D04) | Absent : appliquée à la saisie, rien ne relit les jetons écrits | — |
| DS2 | L'anneau de focus se pose sur le fond de page et tient 3:1 contre lui, jamais sur le plein | WCAG 1.4.11 | Liste fixe : `contraste` relit toute marque en clair et en large ; le sombre et l'étroit, sur cinq marques (C2) | — |
| DS3 | Le parent porte l'espace, l'enfant n'a pas de marge | — | Liste fixe : la planche d'Orbe Café ; la preuve de `DsTag` | — |
| DS5 | Les écarts sont strictement croissants | — | Relit (`espacements`) | — |
| DS6 | En étroit, une valeur ne dépasse pas sa valeur large, et l'ordre des écarts tient | — | Relit (`espacements`, `typo`) | — |
| DS8 | Affichage et titres strictement décroissants, en large et en étroit | — | Relit (`typo`) | — |
| DS9 | Ne jamais prendre une primitive s'il existe un rôle pour la relation | — | Absent : la liste « sans rôle » s'affiche sans bloquer | — |
| DS10 | Un style de texte ne porte pas de couleur | — | Liste fixe : `typo-jetons`, couche commune | — |
| DS11 | Affichage et titres 1 à 3 portent une même consigne de hauteur de capitale, pour toutes les polices ; aucun autre style n'en porte | — | Relit (`typo`) | — |
| DS12 | Chaque fond nomme son texte, et la paire tient son seuil dans tous les thèmes ; une marque dont une paire échoue est refusée à la saisie (repli) | WCAG 1.4.3, 1.4.11 | Liste fixe : comme DS2 ; la table Vuetify est relue pour toute marque | — |
| DS13 | Aucun rôle d'interaction ne pointe sur l'accent | — | Absent | — |
| DS14 | Une paire interdite porte sa règle de remplacement | — | Relit (`contraste`) | — |
| DS15 | Une bordure discrète ou par défaut est décorative, jamais seule pour repérer un champ ou un état | WCAG 1.4.11 | Liste fixe : `sansPaire` sur la couche commune ; le contour de `DsTextInput` | — |
| DS17 | Le libellé (bouton, champ) prend la police du produit, que la marque ne remplace pas | — | Relit (`typo`, règle de police) | — |
| DS18 | L'interligne du corps vaut au moins 1,5 | WCAG 1.4.8, niveau AAA, technique C21 [F, lu au W3C le 21/11/2026] | Relit (`typo`) | — |
| NM1 | L'interface publique est en anglais : composants, props, valeurs, événements, slots, classes, tokens, variables | — | Relit, en partie : la forme et la source de chaque nom, les anciens noms ; la langue elle-même n'est pas vérifiée | Oui |
| NM2 | Un composant prend le nom le plus courant pour sa fonction ; singulier, PascalCase, sans abréviation, préfixé ; une famille partage son dernier mot. ds-lab : le préfixe vaut `Ds` | Component Gallery, relevé du 19/11/2026 | Recopié : les comptes de la table des noms ; forme relue ; « sans abréviation » et « dernier mot » absents | — |
| NM3 | Une prop prend le nom du concept dans le HTML, sinon dans le framework, sinon le nom courant ; ses valeurs disent l'usage, jamais une mesure | — | Recopié : une source déclarée à la main dans la table des noms | Oui |
| NM4 | Inchangée (décision du 21/11/2026) ; sa colonne dit la part sans contrôle | — | Relit (T1) ; « un rôle, pas un objet » et le nom de code : absents | — |
| NM5 | Inchangée | — | Relit, en partie : la forme ; « sa pièce de base » et les props reprises, absents | — |
| CP1 | Inchangée | — | Relit chaque menu (W9) | Oui |
| CP2 | Inchangée | — | Relit chaque menu (W1 à W8) | — |
| CP3 | Inchangée | — | Relit chaque composant rendu (preuve) et chaque style (`npm run style`) | Oui |
| CP4 | Une pièce du framework ne paraît que dans le composant qui l'enveloppe | — | Liste fixe : sept pièces (E1 à E12) | Oui |
| CP5 | Inchangée | — | Liste fixe : W5 ; les attributs retirés, menu par menu | — |
| CP6 | Ce qui mène ailleurs prend `href` et rend un lien ; ce qui agit rend un bouton | — | Liste fixe : CP1 et la preuve de `DsCard` | — |
| CP7 | Inchangée | — | Liste fixe : `DsTag` et `MemberCard` | — |
| CP9 | Un module n'emploie aucune pièce du framework : seulement des composants et des modules | — | Relit chaque module (L1) | Oui |
| CP10 | Inchangée | — | Relit chaque module (L2) ; son message ne dit pas quoi faire | Oui |
| DOC1 à DOC4 | Inchangées | — | DOC1 à DOC3 : Relit (`fiches -- --verifier`) ; DOC4 : Liste fixe (mots refusés) | — |

### Défauts

| | Défaut | Valeur | Décision | Contrôle |
|---|---|---|---|---|
| DS4 | L'écart entre composants vaut au moins le double de l'écart interne | 2 × | D65 (régularité observée, pas une norme) | Relit (`espacements`) |
| DS7 | Une hauteur de ligne est un multiple de la grille | 4 px | D65 | Relit (`typo`) |
| DOC5 | Une fiche se lit en deux minutes | 500 mots écrits | D57 | Relit (`fiches -- --verifier`) |
| DF1 | Décalage de l'anneau de focus (de DS2) | 2 px | D65 | Recopié (`bouton-jetons`) ; vu par la preuve |
| DF2 | Seuls l'écart de section, l'affichage et les titres 1 à 3 changent en étroit (de DS6) | Sous 600 px [H] | D65 | Recopié (`typo-jetons`, couche commune) |
| DF3 | Rapport de la hauteur de capitale (de DS11) | 0,7 [H] | D17 | Absent : `typo` vérifie une même valeur entre 0 et 1, pas 0,7 |
| DF4 | Titres à la police du client ; texte, titre 4 et mention à celle du produit, sauf si l'entrée en déclare une (de DS17) | — | D16, D44 | Relit (`typo`, règle de police) |
| DF5 | Interligne des petits styles (petit corps, libellé, texte d'aide) | Au moins 1,3 | D65 | Relit (`typo`) |
| DF6 | Taille du corps moyen | Au moins 1 rem | D65 | Relit (`typo`) |
| DF7 | Aucune taille de texte sous ce seuil | 12 px | D65 | Relit (`typo`) |

### Consignes

| | Consigne | Où elle se lit |
|---|---|---|
| DS16 | Les aplats de marque ne se cliquent pas | Feuille de route, B12 |
| CP8 | Règles de pose, dans la fiche, section « Quand l'utiliser » | Fiches |
| CS1 | Choisir la hauteur de ligne, puis en déduire le rapport (de DS7) | `tokens/commun/semantique.tokens.json`, styles de texte |
| CS2 | Un seul affichage grand par page (de DS10) | Fiches |
| CS3 | L'accent est l'identité : rare, jamais porteur de sens (de DS13) | `docs/regles.md` |
| CS4 | Le texte (fiches, messages, décisions) est dans la langue de l'équipe ; ds-lab écrit en français, c'est son choix (de NM1) | `docs/regles.md` |
| CS5 | Jamais un bloc rendu cliquable dans une page (de CP6) | Fiche de `DsCard` |

**Énoncé corrigé, sans changer le sens décidé** : DS17 rejoint D16 et D44 ; la seconde moitié devient DF4.

**Le reste, inchangé à l'octet** : les énoncés et raisons de DS1, DS3, DS5, DS8, DS9, DS12, DS14, DS15, NM4, NM5, CP1, CP2, CP3, CP5, CP7, CP10 et DOC1 à DOC4.

### Techniques de Vuetify (`docs/techniques/vuetify.md`)

Une ligne par règle marquée « Oui » dans la colonne Technique : NM1, NM3, CP1, CP3, CP4, CP9, CP10. Chaque ligne a trois colonnes :
- le numéro ;
- le comment dans Vuetify ;
- le contrôle qui le vérifie.

Un autre framework remplit les mêmes lignes dans `docs/techniques/<framework>.md`.

## Contrôle de la forme des règles (`test/regles.test.js`, Z1 à Z3)

Borné à 30 min. S'il dépasse, il sort du lot et le compte rendu le dit.

- **Z1**. Les tables portent 33 règles, 10 défauts et 7 consignes, soit 50 énoncés, comptés par le test et non écrits à la main ailleurs. Chaque numéro de `docs/regles.md` est unique et de la forme `DS`, `NM`, `CP`, `DOC`, `DF` ou `CS` suivie d'un nombre. Chaque cellule Contrôle commence par l'un des quatre mots.
- **Z2**. Chaque règle marquée « Oui » a sa ligne dans chaque fichier de `docs/techniques/`. Chaque ligne d'un fichier de technique porte le numéro d'une règle qui existe.
- **Z3**. Le contrôle refuse :
  - un fichier de technique sans la ligne de CP4 ;
  - un numéro en double ;
  - une cellule Contrôle qui ne commence par aucun des quatre mots.

## Garde du style (`npm run style`, CP3)

**Outil** : Stylelint, règles du noyau seulement, avec `postcss-html`. Ce sont deux dépendances de développement à la racine. La version est fixée après `npm audit`.

**Fichiers lus** : les `<style>` de `atelier/composants/*.vue` et de `atelier/modules/*.vue`.

**Propriétés jugées** : couleur, fond, bordure, rayon, contour, tailles, marges, `gap`, côtés, police, taille et graisse du texte, interligne, espacement des lettres, ombres, transitions et animations, et les propriétés personnalisées. Aucune n'est déclarée aujourd'hui [F].

**Valeurs admises** :
- `var(--v-ds-…)` et `rgb(var(--v-theme-…))` ;
- un `calc` de ces variables et de nombres sans unité ;
- `0`, `100%` et les mots-clés ;
- jamais un nom de couleur (`red`) ni une graisse en mot (`bold`).

**Hors de CP3** : `opacity`, `transform`, `clip-path` et `aspect-ratio`. C'est une limite écrite dans la colonne Contrôle de CP3 ; le gabarit (`:style`) n'est pas lu non plus.

**Message d'échec** : « Valeur brute « <valeur> » pour <propriété> : prendre var(--v-ds-…) ou rgb(var(--v-theme-…)) ; sinon une exception avec sa raison. »

**Une suppression sans raison est refusée** (`reportDescriptionlessDisables`), ainsi qu'une suppression qui ne nomme pas sa règle.

### Sur le code d'aujourd'hui, sans exception [F, essai du 21/11/2026 hors du dépôt]

7 signalements, sortie 1 :

| Fichier | Ligne | Déclaration |
|---|---|---|
| `DsButton.vue` | 194 | `animation: ds-button-spinner 1s linear infinite` |
| `DsButton.vue` | 215 | `width: 1px` |
| `DsButton.vue` | 216 | `height: 1px` |
| `DsButton.vue` | 217 | `margin: -1px` |
| `DsTextInput.vue` | 189 | `width: 1px` |
| `DsTextInput.vue` | 190 | `height: 1px` |
| `DsTextInput.vue` | 191 | `margin: -1px` |

Les quatre autres composants et les deux modules passent.

### Après le lot

0 signalement, sortie 0. Deux exceptions, chacune avec sa raison sur place :
- **le texte caché aux yeux**, trois lignes par fichier : motif standard du texte lu par les lecteurs d'écran, sans valeur de marque ;
- **la roue** : aucun token de durée encore (B2).

Le rendu ne change pas : la preuve reste à 546, et les 120 captures sont identiques.

### Fichier piège (`test/garde-style.test.js`, O1 et O2)

**O1** : chacune de ces déclarations est refusée.

| Famille | Déclarations |
|---|---|
| Couleurs | `color: #333`, `color: red`, `background: rgba(0, 0, 0, .5)`, `border-color: hsl(0 0% 50%)` |
| Espaces | `padding: 8px`, `margin: .5rem`, `gap: 4px` |
| Texte | `font-size: 14px`, `font-weight: bold`, `font-weight: 600`, `line-height: 1.5`, `letter-spacing: .5px` |
| Formes | `border-radius: 4px`, `box-shadow: 0 1px 2px #000` |
| Durées | `transition: color 200ms`, `animation-duration: 1s` |
| Propriété personnalisée | `--x: 3px` |
| Variable du mauvais préfixe | `gap: var(--space-8)` |
| Suppressions | une sans raison ; une sans nom de règle |

**O2** : chacune de ces déclarations passe.

| Sorte | Déclarations |
|---|---|
| Variables | `gap: var(--v-ds-gap-between-components)`, `color: rgb(var(--v-theme-on-surface))`, `min-height: calc(var(--v-ds-x) * 2)` |
| Valeurs nues admises | `margin: 0`, `width: 100%` |
| Mots-clés | `transition: none`, `font-family: inherit` |
| Suppression | une suppression avec sa règle et sa raison |

## Renvois

- **B13** (`docs/feuille-de-route.md`) :
  - Trou : « Pas de badge (statut ou compteur), ni dans la navigation ni sur `DsAvatar` ».
  - Mordra à : « Navigation, avatar avec un statut ».
  - Avis : « Nom retenu par NM2 : Badge (44 systèmes) ».

  `atelier/composants/noms.json:654` cite (B13).
- **`ARCHITECTURE.md:215`** : « (test B5 de `test/bouton-jetons.test.js`, D52) ».
- **`docs/identifiants.md`** : une ligne de collision B (tests B1 à B5, feuille de route B1 à B13), et les préfixes DF et CS. Les autres lettres de tests ne bougent pas.
- **Renvois vers une partie détachée** :
  - « décalé de 2 px (DS2) » et « Décalage … (DS2) » de `tokens/commun/vuetify.json` (l. 125 et 158) citent DF1 ;
  - « seuls … (DS6) » de `src/tokens/resolver.js:175`, des cinq resolvers et de `tokens/commun/largeur.etroit.tokens.json` citent « DS6, DF2 ».

  Aucune valeur ne change. Les resolvers et les thèmes ne diffèrent que par ces chaînes, vérifié par diff.

## La CI et les listes de marques (C4, borné à une heure)

- La CI lance `npm run contraste` dans les quatre contextes : sans option, avec `--mode dark`, avec `--largeur narrow`, avec les deux. Ce sont trois étapes de plus. Aujourd'hui, les cinq marques sortent en 0 dans chacun [F, lancé le 21/11/2026 à 12 h 36].
- Les tests à liste de marques écrite en dur et à assertions en relations lisent `dossiersDeMarque()` :
  - fichiers : `avatar-etiquette`, `bouton-jetons`, `champ-carte-jetons`, `contraste-source`, `contraste-modes`, `resolver`, `sombre`, `aplats`, `police-produit`, `police-consigne` ;
  - le compte exact des tests est relevé au commit.

  Dans ces fichiers, les tests à littéraux gardent leurs tables. Une sixième marque les ferait échouer sur une clé absente, au lieu d'être ignorée.
- `sans-marque` D1 garde sa liste : elle est son attendu.

## Ce qui va dans `KNOWN_ISSUES.md` (« À payer à l'étape 9 »)

Une ligne chacun, avec son coût :
- DS1, DS9 et DS13 sans contrôle ;
- les listes fixes de DS3, DS10, DS15, CP4, CP5, CP6 et CP7 ;
- les valeurs recopiées de NM2, NM3, DF1 et DF2 ;
- les 11 tests à littéraux par marque ;
- le message de L2.

L'entrée CP3 sort.

## Documentation

- **`docs/regles.md`** : en tête les quatre mots, la phrase des défauts, les huit règles d'écriture et les numéros ; puis Règles, Défauts et Consignes.
- **D65**, en-tête des décisions à soixante-cinq.
- **README** : commandes, `npm run style`, et la CI à quatre contextes.
- **ARCHITECTURE** : `docs/techniques/`, la garde du style, ses deux dépendances.
- **`CLAUDE.md`** :
  - `npm run style` dans les commandes à 0 avant chaque commit ;
  - `docs/techniques/` dans « Quand lire quoi » ;
  - la CI à quatre contextes.
- **`docs/identifiants.md`**.
- **`test/parts-de-la-ci.json`** : les deux fichiers de test nouveaux.

## Comptes attendus

| Contrôle | Attendu |
|---|---|
| `npm test` | 1 037 tests avant ; plus Z1 à Z3 et O1, O2, soit 1 042 [H] ; aucun vert perdu |
| Preuve | 546 |
| Captures | 120, identiques au pixel |
| `npm audit` | 0 avis à la racine et dans l'atelier [F, au départ] |
| Contrôles de la cible, `types`, `knip`, `dependances`, fiches, `style` | 0 échec |

## Commits

| # | Contenu |
|---|---|
| C1 | Renvois |
| C2 | Règles, techniques, D65, renvois vers les parties détachées, Z1 à Z3 |
| C3 | Garde du style, O1 et O2 |
| C4 | Les quatre contextes en CI, et `dossiersDeMarque()` |

Deux arrêts : l'attendu, puis le résultat et la CI. Les commits s'enchaînent ; le résumé de chaque diff est écrit dans la boîte. Arrêt avant si un contrôle rougit, si un compte attendu ne tient pas ou si une borne de temps est dépassée.
