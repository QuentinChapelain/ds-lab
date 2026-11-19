# Attendu : bouton à icône seule, icônes Material Design

Message de Claude (`2026-11-19-07-de-claude-lot-bouton-icone.md`), mot pour mot, puis les réponses au plan (`2026-11-19-09-de-claude-reponses-plan-bouton-icone.md`), mot pour mot. Plan : `2026-11-19-08-de-claude-code-plan-bouton-icone.md`, dans la boîte aux lettres, hors dépôt. Go de Quentin le 19/11/2026, 6 h 32.

## Message

### Lot « bouton-icone » (étape 6) : demande de plan

De : Claude, pour Claude Code, terminal de ds-lab. 19/11/2026, 6 h 24.
PLAN SEULEMENT : aucun fichier modifié, aucun commit. Quentin donne le go en collant le message qui renvoie à ce fichier.

#### 0. Contrôle

`git status` propre ; HEAD attendu `04699df` = `origin/main` ; CI de `main` (exécution 44464097529) **verte**, sinon arrête-toi et dis-le. Crée la branche `bouton-icone`.

#### 1. L'enveloppe `BoutonIcone`, sur la fabrique (D51)

Pièce à part du bouton (une enveloppe = une pièce). Réutilise les jetons, le thème et les variantes du bouton (D43 à D45).

| Option | Valeurs | Règle |
|---|---|---|
| libellé | texte | **Obligatoire.** Devient le nom accessible (`aria-label`). Nomme l'action (« Fermer »), jamais l'icône. Un `aria-label` ou `aria-labelledby` posé à la main lève |
| icône | composant | **Obligatoire.** Décorative (`aria-hidden`), `taille-icone.normale` (20) en taille normale, `taille-icone.petite` (16) en petite |
| variante | discret (défaut), secondaire, principal, danger-discret | Mêmes couleurs que le bouton de même variante |
| taille | normale (40 × 40), petite (32 × 32) | Carré ; `hauteur.controle.*` des deux côtés |
| désactivé | booléen | Comme le bouton : `aria-disabled`, reste dans l'ordre du focus |
| type | button, submit, reset | Comme le bouton, avec la même règle sur submit |

Hors menu : chargement, pleine largeur, texte visible, info-bulle (voir 3).

Dis comment tu respectes la garde E2 (le bouton de Vuetify n'existe que dans `Bouton.vue`) : réutiliser `Bouton.vue` dessous, ou élargir la garde à `BoutonIcone.vue`. Recommande, avec le pour et le contre.

#### 2. Bibliothèque d'icônes (trou B4) : Material Design Icons en SVG

Choix de Quentin (6 h 21) : Material Design Icons, en chemins SVG (`@mdi/js`), le jeu natif de Vuetify. Une dépendance de plus, dans l'atelier seulement : dis sa version, son poids et sa licence, et lance `npm audit`.
- Le contrat reste neutre : l'option `icone` reçoit un composant. Propose la plus petite aide qui fait d'un chemin `@mdi/js` un composant d'icône, sans `VIcon` si possible (dis pourquoi).
- Propose si les icônes dessinées à la main des stories du bouton et du champ passent à `@mdi/js` dans ce lot, sans changer leur rendu mesuré par la preuve.
- KNOWN_ISSUES : B4 passe de « trou » à « choisi, D52 ».

#### 3. Info-bulle : pas dans ce lot

Choix de Quentin : le libellé suffit pour ce lot ; l'info-bulle viendra comme pièce à part avec les jetons d'élévation et de superposition (B1). Note-le dans KNOWN_ISSUES et dans D52, avec la règle à venir : « l'info-bulle d'un bouton à icône seule reprend son libellé, au survol et au focus ».

#### 4. Preuve, tests, vitrine

- Contrastes : l'icône est un élément non textuel : 3:1 contre `fond.surface` et `fond.app`, dans les dix thèmes, pour chaque variante, au repos et au survol. Tableau dans l'attendu.
- Cible : 32 px ≥ 24 (WCAG 2.5.8) ; dis-le dans D52.
- Arbre d'accessibilité : nom = libellé ; icône muette ; désactivé lu.
- Refus : sans libellé ; sans icône ; variante inconnue ; `aria-label` posé à la main ; attribut refusé.
- Vitrine : 4 variantes × 2 tailles × états (repos, survol, focus, désactivé), dix thèmes ; une ligne « champ de recherche + bouton à icône » et « bouton + bouton à icône » pour l'alignement.
- Planches PNG par thème dans `local/bouton-icone-captures/`.
- D52 ; attendu `docs/attendus/bouton-icone.md`.

#### 5. Ta réponse

Plan dans `local/boite-aux-lettres/2026-11-19-08-de-claude-code-plan-bouton-icone.md` : fichiers, tests, commits, questions de design pour Quentin (en mots simples, avec une recommandation). Prévu par commit en t'appuyant sur le réel du lot champ-carte (61 min pour 8 h prévues). Arrêts : le plan, l'attendu, les planches avant la documentation.

## Réponses au plan

### Réponses au plan : bouton-icone

De : Claude, pour Claude Code, terminal de ds-lab. 19/11/2026, 6 h 32.
Réponse à `2026-11-19-08-de-claude-code-plan-bouton-icone.md`. Plan accepté. Quentin donne le go en collant le message qui renvoie à ce fichier.

#### Questions techniques, tranchées par Claude

| T | Réponse |
|---|---|
| T1 | A : `BoutonIcone.vue` rend `Bouton.vue` dessous ; garde E2 inchangée ; E8 en plus. Les deux contreparties (classes internes du bouton, zone de statut vide) vont dans D52 |
| T2 | Oui : `icone(chemin)` dans `atelier/composants/icone.js` |
| T3 | Oui : préfixe « bouton à icône » |
| T4 | Laisser `aria-pressed` ; dette : « bouton bascule, pièce à venir » |
| T5 | Élargir les quatre descriptions dans ce lot |

#### Questions de design, validées par Quentin (6 h 31), sur recommandation

| Q | Réponse |
|---|---|
| Q1 | Carré, arrondi `arrondi.controle` (8 px) |
| Q2 | Secondaire à côté d'un champ de recherche |
| Q3 | Accepté dans les actions d'une carte : la règle du menu de la carte admet `Bouton` et `BoutonIcone` |
| Q4 | Icônes des stories passées à `@mdi/js` dans ce lot, sans changer les mesures de la preuve |

#### À montrer aux planches

- Survol des variantes discrètes (1,07 à 1,09 contre la page) : vue de près, clair et sombre.
- Principal d'Écume et Sel en clair (1,51 contre la page).

#### Rappels

Arrêts : l'attendu (compte rendu dans le fichier 10), puis les planches avant la documentation (fichier 11), CI de la branche verte. Rien sur `main`. Relevé du temps dans `local/bouton-icone-temps.md`.

## Valeurs attendues, écrites à la main le 19/11/2026

Ce que le code devra donner, d'après le plan (`2026-11-19-08-…`) et les réponses ci-dessus. Les couleurs et les dimensions sont lues dans les jetons par un résolveur écrit à part, sans rien importer de `src/`. Les rapports sont calculés par culori 4.0.2 (`wcagContrast`). Le script et la commande sont en fin de section.

### Lu dans le code [F]

**Vuetify 4.3.4** (`lib/components/VIcon/VIcon.js`, `lib/composables/icons.js`, `lib/components/VBtn/VBtn.css`) :
- **`VIcon`.** Il rend un `<i class="v-icon notranslate">` avec des classes de taille, ou une taille écrite en ligne d'après sa prop `size`. Il pose `aria-hidden`, sauf s'il a un écouteur de clic : il prend alors `role="button"`.
- **Jeu d'icônes en SVG.** Un chemin devient un `<svg class="v-icon__svg" role="img" aria-hidden="true">`. Il faut déclarer le jeu d'icônes dans `createVuetify`.
- **`v-btn--icon`** (prop `icon` du bouton) : largeur minimale nulle, tailles et densités propres.

**`@mdi/js` 7.4.47** (archive du registre npm, lue hors dépôt) :
- `package.json` : licence `Apache-2.0`, `"sideEffects": false`, `"module": "mdi.js"`, aucune dépendance à l'exécution. Dernière version, publiée le 27/12/2023.
- `LICENSE` : « Pictogrammers Free License ». Les icônes sont sous Apache 2.0, « certaines redistribuées sous leur propre licence » ; le code est sous MIT.
- Archive de 1,69 Mo, 6,56 Mo une fois installée, en 8 fichiers. `mdi.js` (2,8 Mo) est une suite de `export var mdiNom = "<chemin>"` sur une grille de 24 × 24.
- Aucun avis de sécurité pour ce paquet dans la base de GitHub (`gh api "/advisories?ecosystem=npm&affects=@mdi/js"` : 0).
- Les cinq chemins des stories, recopiés de `mdi.js` :
  - `mdiPlus` : `M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z`, la même croix que l'icône dessinée du bouton (`M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z`) ;
  - `mdiMagnify`, `mdiClose`, `mdiDelete`, `mdiPencil`.

**L'atelier :**
- `Bouton.vue` rend toujours sa zone `role="status"`, vide hors chargement.
- Ses règles de forme sont `.ds-bouton.v-btn` (marge intérieure, largeur minimale) et `.ds-bouton.v-btn.ds-bouton--petite` (hauteur).
- La preuve du champ mesure la boîte de l'icône, l'écart jusqu'au texte et `aria-hidden`, pas son dessin (`atelier/preuve/champ.js`).

### Dimensions [F]

Les mêmes dans les dix thèmes. Aucun jeton nouveau.

| Rôle | Valeur | Usage |
|---|---|---|
| `hauteur.controle.normale` | 40 px | côté du bouton à icône de taille normale |
| `hauteur.controle.petite` | 32 px | côté du petit bouton à icône ; au moins 24 × 24 (WCAG 2.5.8) |
| `taille-icone.normale` | 20 px | icône en taille normale |
| `taille-icone.petite` | 16 px | icône en petite taille |
| `arrondi.controle` | 8 px | arrondi, aux deux tailles (Q1) |

L'icône est centrée : 10 px de chaque côté en normale, 8 px en petite, à 0,5 px près.

### Couleurs et rapports [F]

L'icône prend la couleur du texte du bouton de même variante. Pour les variantes sans fond, elle est entourée de la page (`fond.app`) ou d'une surface (`fond.surface`) ; pour les autres, du fond du bouton. Seuil : 3:1, élément non textuel (WCAG 1.4.11).

**Rôles communs** : chaque valeur est la même dans les cinq marques, par mode. Le script l'a vérifié.

| Icône | Contre | Variante, état | Clair | Sombre | Attendu |
|---|---|---|---|---|---|
| `texte.erreur` | `fond.app` | danger-discret, repos, sur la page | `#cb1d2a` / `#fbfbfb` 5,41 | `#ff978f` / `#121212` 8,99 | passe |
| `texte.erreur` | `fond.surface` | danger-discret, repos, sur une surface | `#cb1d2a` / `#ffffff` 5,60 | `#ff978f` / `#181818` 8,52 | passe |
| `texte.erreur` | `fond.erreur.discret` | danger-discret, survol | `#cb1d2a` / `#fff0ee` 5,06 | `#ff978f` / `#231918` 8,23 | passe |
| `texte.principal` | `fond.surface` | secondaire, repos | `#363026` / `#ffffff` 13,06 | `#d8d5ce` / `#181818` 12,12 | passe |
| `texte.principal` | `fond.composant.survol` | secondaire, survol | `#363026` / `#ecebe9` 10,96 | `#d8d5ce` / `#212121` 10,99 | passe |
| `bordure.forte` | `fond.app` | contour du secondaire, sur la page | `#958f84` / `#fbfbfb` 3,10 | `#6a665c` / `#121212` 3,27 | passe |
| `bordure.forte` | `fond.surface` | contour du secondaire, sur une surface | `#958f84` / `#ffffff` 3,21 | `#6a665c` / `#181818` 3,10 | passe |
| `texte.desactive` | `fond.desactive` | désactivé, principal et secondaire | `#8a8478` / `#f3f2f1` 3,32 | `#7d786c` / `#1b1b1b` 3,92 | exception écrite (WCAG 1.4.3 et 1.4.11, composant inactif) |
| `texte.desactive` | `fond.app` | désactivé, discrets, sur la page | `#8a8478` / `#fbfbfb` 3,59 | `#7d786c` / `#121212` 4,26 | exception, passe 3 quand même |
| `texte.desactive` | `fond.surface` | désactivé, discrets, sur une surface | `#8a8478` / `#ffffff` 3,72 | `#7d786c` / `#181818` 4,04 | exception, passe 3 quand même |
| `fond.erreur.discret` | `fond.app` | survol du danger-discret contre la page | `#fff0ee` / `#fbfbfb` 1,07 | `#231918` / `#121212` 1,09 | pour mémoire, à montrer aux planches |

**Rôles de la marque** : discret et principal. Chaque case donne l'icône, son fond et le rapport.

| Thème | discret, repos, page (`texte.interactif` / `fond.app`) | discret, repos, surface (`texte.interactif` / `fond.surface`) | discret, survol (`texte.interactif` / `fond.interactif.discret`) | principal, repos (`texte.sur-interactif` / `fond.interactif.fort`) | principal, survol (`texte.sur-interactif` / `fond.interactif.fort.survol`) |
|---|---|---|---|---|---|
| atelier-lavandine-clair | `#8247ce` / `#fbfbfb` 5,42 | `#8247ce` / `#ffffff` 5,61 | `#8247ce` / `#f5f1fe` 5,05 | `#ffffff` / `#8a4fd8` 5,01 | `#ffffff` / `#7b3ec7` 6,26 |
| atelier-lavandine-sombre | `#c4a4fe` / `#121212` 9,00 | `#c4a4fe` / `#181818` 8,53 | `#c4a4fe` / `#1d1925` 8,28 | `#131019` / `#c4a4fe` 9,04 | `#131019` / `#d4b5ff` 10,62 |
| ecume-et-sel-clair | `#21708b` / `#fbfbfb` 5,40 | `#21708b` / `#ffffff` 5,59 | `#21708b` / `#e3f6fe` 5,03 | `#003647` / `#7fdbff` 8,33 | `#003647` / `#6fcbee` 7,08 |
| ecume-et-sel-sombre | `#c9efff` / `#121212` 15,41 | `#c9efff` / `#181818` 14,61 | `#c9efff` / `#1b1b1b` 14,17 | `#121212` / `#c9efff` 15,41 | `#121212` / `#ddffff` 17,68 |
| grenat-papeterie-clair | `#4f0020` / `#fbfbfb` 15,00 | `#4f0020` / `#ffffff` 15,52 | `#4f0020` / `#fcf0f2` 13,95 | `#ffffff` / `#7a1f3d` 10,04 | `#ffffff` / `#6a0d30` 12,26 |
| grenat-papeterie-sombre | `#fc96ae` / `#121212` 9,02 | `#fc96ae` / `#181818` 8,55 | `#fc96ae` / `#2f1119` 8,32 | `#1e0d11` / `#fc96ae` 9,02 | `#1e0d11` / `#ffa7be` 10,28 |
| maison-alberto-clair | `#836304` / `#fbfbfb` 5,41 | `#836304` / `#ffffff` 5,60 | `#836304` / `#fbf3e1` 5,07 | `#ffffff` / `#836304` 5,60 | `#ffffff` / `#745500` 6,90 |
| maison-alberto-sombre | `#ffd060` / `#121212` 12,88 | `#ffd060` / `#181818` 12,21 | `#ffd060` / `#1d1b17` 11,83 | `#121212` / `#ffd060` 12,88 | `#121212` / `#ffe17e` 14,56 |
| orbe-cafe-clair | `#4c6994` / `#fbfbfb` 5,40 | `#4c6994` / `#ffffff` 5,59 | `#4c6994` / `#f1f3f7` 5,03 | `#ffffff` / `#2b4c7e` 8,61 | `#ffffff` / `#1e3e6f` 10,64 |
| orbe-cafe-sombre | `#86b6fe` / `#121212` 9,04 | `#86b6fe` / `#181818` 8,57 | `#86b6fe` / `#111b2a` 8,35 | `#0e1218` / `#86b6fe` 9,06 | `#0e1218` / `#97c6ff` 10,58 |

**Pour mémoire, à montrer aux planches** (rien n'est exigé par WCAG ici) :

| Thème | plein principal contre la page (`fond.interactif.fort` / `fond.app`) | plein principal contre une surface (`fond.interactif.fort` / `fond.surface`) | survol du discret contre la page (`fond.interactif.discret` / `fond.app`) |
|---|---|---|---|
| atelier-lavandine-clair | 4,84 | 5,01 | 1,07 |
| atelier-lavandine-sombre | 9,00 | 8,53 | 1,09 |
| ecume-et-sel-clair | **1,51** | **1,56** | 1,07 |
| ecume-et-sel-sombre | 15,41 | 14,61 | 1,09 |
| grenat-papeterie-clair | 9,71 | 10,04 | 1,07 |
| grenat-papeterie-sombre | 9,02 | 8,55 | 1,08 |
| maison-alberto-clair | 5,41 | 5,60 | 1,07 |
| maison-alberto-sombre | 12,88 | 12,21 | 1,09 |
| orbe-cafe-clair | 8,32 | 8,61 | 1,07 |
| orbe-cafe-sombre | 9,04 | 8,57 | 1,08 |

**Seuils :**
- Le plus bas d'une icône active est à 5,01 : le principal d'Atelier Lavandine en clair, comme le texte du bouton (D43). En survol, le plus bas est à 5,03 (discret d'Écume et Sel et d'Orbe Café, en clair).
- Le contour du secondaire est à 3,10 au plus bas.
- Chaque paire active est déjà une paire de texte de `paires.json` (seuil 4,5). **Aucun rôle, aucune primitive, aucune paire à ajouter.**

### Comportement attendu

**Aide d'icône** (`atelier/composants/icone.js`) :
- `icone(chemin)` rend un composant : `<svg viewBox="0 0 24 24" fill="currentColor" focusable="false"><path d="<chemin>"></svg>`.
- Elle n'importe pas `@mdi/js` : tout chemin sur une grille de 24 × 24 convient.
- Ni nom, ni rôle, ni `aria-hidden` sur le `<svg>` : c'est l'enveloppe qui rend l'icône muette.
- Ce n'est pas une enveloppe : pas de menu ni de fabrique, et W8 ne la lit pas.

**Icônes des stories** (Q4) :
- Le bouton prend `mdiPlus`, le champ `mdiMagnify`, par l'aide.
- `Bouton.stories.js` prend ses thèmes, son en-tête et ses icônes dans `atelier/stories/commun.js`. Les icônes dessinées à la main disparaissent.
- La preuve garde ses **198 vérifications, toutes vertes**, avec les mêmes lignes. Seules les planches PNG du champ changent (dessin de la loupe).
- Le verrou de l'atelier gagne une entrée, `@mdi/js` 7.4.47 [H]. `npm audit` de l'atelier : 0 alerte [H].

**Bouton à icône** (`BoutonIcone.vue`, préfixe « bouton à icône ») :

| Option | Type | Défaut | Valeurs admises |
|---|---|---|---|
| `libelle` (« libellé ») | String | — (obligatoire) | |
| `icone` (« icône ») | [Object, Function] | — (obligatoire) | |
| `variante` | String | `'discret'` | `discret`, `secondaire`, `principal`, `danger-discret` |
| `taille` | String | `'normale'` | `normale`, `petite` |
| `desactive` | Boolean | false | |
| `type` | String | `'button'` | `button`, `submit`, `reset` |

- `emits` vaut `['click']`.
- La liste blanche est celle du bouton (`id`, `aria-*`, `data-*`, écouteurs), moins `aria-label` et `aria-labelledby`.

Messages, à l'octet :
- « bouton à icône : libellé obligatoire » (absent, `null` ou `''`) ;
- « bouton à icône : icône obligatoire » ;
- « bouton à icône : variante inconnue : danger (discret, secondaire, principal, danger-discret) » ;
- « bouton à icône : taille inconnue : grande (normale, petite) » ;
- « bouton à icône : type inconnu : image (button, submit, reset) » ;
- « bouton à icône : attribut refusé : aria-label », de même pour `aria-labelledby` et pour `color` ;
- « bouton à icône : désactivé refusé sur type=submit ».

`id`, `aria-describedby`, `data-*` et `onClick` passent.

**Rendu (T1, A) :**
- Un `<span class="ds-bouton-icone ds-bouton-icone--<taille>">` en `display: contents`, qui contient un `Bouton`.
- Le `Bouton` reçoit la variante, la taille, le désactivé, le type, `aria-label` = le libellé, les `id`, `data-*` et écouteurs donnés. Son emplacement de texte contient `<span class="ds-bouton-icone__icone" aria-hidden="true">` et le composant d'icône.
- Pas d'option `icone` du bouton (elle ajouterait l'écart icône–texte), ni `chargement`, ni `pleineLargeur`.
- `BoutonIcone.vue` importe `./Bouton.vue`, et ne nomme ni `VBtn` ni `v-btn` : E2 reste mot pour mot.
- Forme : largeur = hauteur = 40 ou 32 px, marge intérieure 0, arrondi 8 px, sans `!important`. Les sélecteurs passent devant ceux du bouton par leur spécificité.
- Couleurs, survol, focus, désactivé, clic et envoi bloqués : ceux du bouton de même variante, sans rien recopier.

**Carte** (Q3) :
- La règle du rendu admet `Bouton` et `BoutonIcone` dans les actions.
- Son message devient « carte : actions : seuls Bouton et BoutonIcone sont admis » (voir « Ajouts », 1).

**Descriptions de la table Vuetify** (T5), sans changer les jetons :
- `ds-hauteur-controle-normale` : « Hauteur du bouton et du champ, et côté du bouton à icône, en taille normale. »
- `ds-hauteur-controle-petite` : « Hauteur du bouton et côté du bouton à icône, en petite taille. »
- `ds-taille-icone-normale` : « Icône du bouton, du bouton à icône et du champ, en taille normale. »
- `ds-taille-icone-petite` : « Icône du bouton et du bouton à icône, en petite taille. »
- Toujours 37 variables `ds-`, chacune égale à son jeton dans les dix thèmes (V9).

**Tests sans navigateur :**
- **W5** rejoue les refus génériques sur le nouveau menu, puis ses messages ci-dessus, et la carte qui admet un `BoutonIcone` dans ses actions.
- **W8** voit `BoutonIcone.vue` passer par la fabrique et son menu.
- **E8** : `BoutonIcone.vue` importe `./Bouton.vue`. E1 à E7 sont inchangés.
- **B5** : les rapports des deux premiers tableaux de couleurs, à 2 décimales, dans les dix thèmes. Chaque icône active ≥ 3 contre son fond ; le désactivé est dans son exception.

**Stories** (`BoutonIcone.stories.js`) :
- **Planche** : 4 variantes × 2 tailles × 4 états (repos, survol, focus, désactivé), soit 32 boutons. Puis deux lignes d'alignement :
  - un champ de recherche et un bouton à icône secondaire « Rechercher », de taille normale (Q2) ;
  - un bouton secondaire « Modifier » et un bouton à icône danger-discret « Supprimer ».
- **Vitrine** : les dix thèmes, au repos et désactivé, sur la page et sur une surface.
- **Survol de près** (à montrer aux planches) : les discrets agrandis, au repos et au survol forcé, en clair et en sombre.
- **Clavier**, **Bac à sable**, et **six refus** : sans libellé, sans icône, variante inconnue, `aria-label` à la main, attribut refusé, désactivé sur submit.
- Libellés : « Fermer », « Rechercher », « Supprimer », « Modifier », « Ajouter ». Jamais le nom de l'icône.

**Preuve** (`atelier/preuve/bouton-icone.js`), sur chaque thème, en développement et en version construite, pour chacun des 32 boutons de la planche :
- boîte de 40 × 40 ou 32 × 32 px ;
- icône de 20 ou 16 px, centrée à 0,5 px près ;
- arrondi de 8 px ;
- fond et couleur de l'icône égaux aux jetons des tableaux, au repos et au survol forcé ;
- contour `bordure.forte` du secondaire ;
- anneau de focus (`bordure.focus`, 2 px, décalé de 2 px) au focus forcé ;
- le désactivé en `fond.desactive` et `texte.desactive`, transparent pour les discrets ;
- aucune ombre, aucune transition.

Les deux lignes d'alignement : dans chaque ligne, les deux boîtes ont 40 px de haut, le même bord haut et le même bord bas, à 0 px près. Les planches de la version construite vont dans `local/bouton-icone-captures/`, une par thème.

Sur le premier thème :
- **Arbre d'accessibilité.** Un nœud `button` dont le nom est le libellé. Aucun nœud de l'icône. Le désactivé est lu comme désactivé. La zone de statut est présente et vide [H].
- **Clavier.** Le bouton désactivé est atteint par Tab ; son clic n'est pas émis et le formulaire n'est pas envoyé. Le bouton actif émet son clic, et un bouton `submit` envoie son formulaire.
- **Refus.** Les six stories de refus montrent l'erreur qui nomme l'usage, et aucun bouton.

Le bouton, le champ et la carte gardent leurs 198 vérifications. Le nombre total de vérifications sera donné au commit.

**Hors de ce lot, pour KNOWN_ISSUES :**
- l'info-bulle (avec B1) ;
- le bouton bascule (`aria-pressed`), pièce à venir ;
- la zone de statut vide de chaque bouton à icône ;
- le style du bouton à icône lié aux classes internes du bouton ;
- la licence de chaque icône de `@mdi/js` [V] ;
- un paquet dont la dernière version date du 27/12/2023 ;
- le survol à peine visible des discrets et le principal pâle d'Écume et Sel en clair, si les planches le confirment.

### Ajouts trouvés en écrivant l'attendu, à valider à l'arrêt

1. **Le message de refus de la carte change.** Avec Q3, « carte : actions : seul Bouton est admis » deviendrait faux. Je propose « carte : actions : seuls Bouton et BoutonIcone sont admis ». C'est le seul message d'une enveloppe existante qui change. La story de refus de la carte et sa ligne de preuve le suivent.
2. **Une story « survol de près ».** C'est pour montrer, à l'arrêt des planches, ce que la réponse 09 demande (le survol des discrets, en clair et en sombre). La preuve ne la mesure pas : c'est une vue, pas une règle.
3. **La taille et le type inconnus** sont dans la liste des messages, alors que le message 07 ne nomme que la variante. Ils viennent de la fabrique, comme pour le bouton, et W5 les rejoue déjà.

### Script et commande

Lancé sous Node 24.22.3 depuis la racine du dépôt. Le script est lu sur l'entrée standard pour que `culori` se résolve depuis la racine, sans fichier ajouté au dépôt : `fnm exec --using=24.22.3 node --input-type=module - < attendu-bouton-icone.mjs`. Il écrit une ligne par thème : les dimensions, puis chaque paire avec ses deux couleurs et leur rapport.

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { wcagContrast } from 'culori';
const T = 'tokens';
const lire = (f) => JSON.parse(readFileSync(f, 'utf8'));
const aplatir = (o, p = [], m = new Map()) => {
  for (const [k, v] of Object.entries(o)) {
    if (k === '$root') { m.set(p.join('.'), v); continue; }
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    if ('$value' in v) m.set([...p, k].join('.'), v); else aplatir(v, [...p, k], m);
  }
  return m;
};
const PAIRES = [
  ['texte.interactif', 'fond.app'], ['texte.interactif', 'fond.surface'], ['texte.interactif', 'fond.interactif.discret'],
  ['texte.erreur', 'fond.app'], ['texte.erreur', 'fond.surface'], ['texte.erreur', 'fond.erreur.discret'],
  ['texte.principal', 'fond.surface'], ['texte.principal', 'fond.composant.survol'],
  ['bordure.forte', 'fond.app'], ['bordure.forte', 'fond.surface'],
  ['texte.sur-interactif', 'fond.interactif.fort'], ['texte.sur-interactif', 'fond.interactif.fort.survol'],
  ['texte.desactive', 'fond.desactive'], ['texte.desactive', 'fond.app'], ['texte.desactive', 'fond.surface'],
  ['fond.interactif.fort', 'fond.app'], ['fond.interactif.fort', 'fond.surface'],
  ['fond.interactif.discret', 'fond.app'], ['fond.erreur.discret', 'fond.app'],
];
const DIMENSIONS = ['hauteur.controle.normale', 'hauteur.controle.petite', 'taille-icone.normale', 'taille-icone.petite', 'arrondi.controle'];
for (const d of readdirSync(T).filter((d) => existsSync(join(T, d, 'entree.json'))).sort()) {
  const r = lire(join(T, d, 'marque.resolver.json'));
  for (const mode of ['clair', 'sombre']) {
    const fichiers = [...['primitives', 'marque', 'roles'].flatMap((s) => r.sets[s].sources.map((x) => x.$ref)), ...r.modifiers.mode.contexts[mode].map((x) => x.$ref)];
    const j = new Map();
    for (const f of fichiers) for (const [k, v] of aplatir(lire(join(T, d, f)))) j.set(k, v);
    const val = (n) => { const v = j.get(n)?.$value; if (v === undefined) throw new Error(n); return typeof v === 'string' && v.startsWith('{') ? val(v.slice(1, -1)) : v; };
    const hex = (n) => val(n).hex;
    const px = (n) => { const v = val(n); return `${v.value}${v.unit}`; };
    const ligne = [`${d}-${mode}`, ...DIMENSIONS.map((n) => `${n} ${px(n)}`)];
    for (const [a, b] of PAIRES) ligne.push(`${a}/${b} ${hex(a)}/${hex(b)} ${wcagContrast(hex(a), hex(b)).toFixed(2)}`);
    console.log(ligne.join(' | '));
  }
}
```
