# Attendu : avatar et étiquette

Message de Claude (`2026-11-19-19-de-claude-lot-avatar-etiquette.md`), mot pour mot, puis les réponses au plan (`2026-11-19-21-de-claude-reponses-plan-avatar-etiquette.md`), mot pour mot. Plan : `2026-11-19-20-de-claude-code-plan-avatar-etiquette.md`, dans la boîte aux lettres, hors dépôt. Go de Quentin le 19/11/2026, 11 h 16.

## Message

### Lot « avatar-etiquette » (étape 6) : demande de plan

De : Claude, pour Claude Code, terminal de ds-lab. 19/11/2026, 10 h 58.
PLAN SEULEMENT : aucun fichier modifié, aucun commit. Quentin donne le go en collant le message qui renvoie à ce fichier.

#### 0. Contrôle

`git status` propre ; HEAD = `origin/main` = `44c645b`. Lis le résultat de la CI de `main` (44500559899, en cours à 10 h 56, règle L4 de D53) : verte, on continue ; rouge, arrête-toi et dis-le. Branche `avatar-etiquette`.

#### 1. Pourquoi

La carte membre de l'annuaire (étape 8) : photo ou initiales, nom, promo, étiquettes (ville, secteur, « mentor »), lien vers le profil. Le badge est retiré du lot (il appartient à la navigation). Ce lot ne touche pas à la carte : l'assemblage est l'étape 8.

#### 2. Avatar (`Avatar.vue`, sur la fabrique, autour de `VAvatar`)

| Option | Valeurs | Règle |
|---|---|---|
| nom | texte | **Obligatoire.** Sert au nom accessible et aux initiales |
| image | adresse | Option. Si absente, ou si elle échoue au chargement : initiales |
| décoratif | booléen, défaut faux | Vrai quand le nom est écrit à côté (carte membre) : l'avatar est muet (`alt=""`, initiales `aria-hidden`). Faux : nommé par `nom` (une seule fois, pas de double lecture image + initiales) |
| taille | normale (40), grande (56) | Propose les jetons (primitives et rôles de taille, taille du texte des initiales) |

Choix de Quentin (9 h 51, sur image) : **rond** ; initiales sur **pastel de marque pour tous** (une seule règle, pas de couleur par personne). Propose les rôles (par exemple `fond.marque.discret` et un texte de marque) et mesure **4,5:1** pour les initiales, dans les dix thèmes, clair et sombre.
Règle des initiales, déterministe : propose-la (par exemple première lettre des deux premiers mots, en capitales, accents gardés), avec ses cas limites (un seul mot, trait d'union, particule, nom vide refusé).
Hors menu : clic, lien, badge d'état, groupe d'avatars, couleur par personne, autres formes.

#### 3. Étiquette (`Etiquette.vue`, sur la fabrique, autour de `VChip`)

| Option | Valeurs | Règle |
|---|---|---|
| texte | emplacement ou prop, dis lequel | **Obligatoire**, court |
| ton | neutre (défaut), marque | Neutre pour classer, marque pour mettre en avant ; **pas de couleur par catégorie** |

Choix de Quentin : **pilule à fond teinté**. Propose les rôles des deux tons, texte à **4,5:1** sur son fond, dans les dix thèmes. Rôle d'arrondi pilule sur `rayon.pilule` : propose le nom (comble B10).
**Statique** : ni survol, ni focus, ni clic. Lis dans le code de Vuetify 4.3.4 ce que `VChip` rend par défaut (balise, rôle, `tabindex`, ondulation) et ce qu'il faut lui couper. Écouteurs, `closable`, `filter`, `link`, `href`, `to` : refusés. Les puces de filtre et supprimables sont d'autres pièces, à noter en dette.
Taille : une seule ; propose le style de texte et la hauteur, et dis comment une suite d'étiquettes se range (écart, retour à la ligne).

#### 4. Garde, preuve, vitrine

- Garde : `VAvatar` et `VChip` (et leurs classes) seulement dans leurs enveloppes.
- Tests sans navigateur : refus du menu (W5), règle des initiales (cas limites), jetons et contrastes.
- Preuve : deux nouveaux jobs de CI (un par composant, D53). Arbre d'accessibilité : avatar nommé ou muet selon `décoratif`, une seule lecture ; image en échec → initiales ; étiquette sans focus ni rôle interactif.
- Vitrine : avatar (photo, initiales, image en échec, deux tailles, décoratif ou non) ; étiquettes (deux tons, une rangée qui passe à la ligne) ; une ligne « en situation » : avatar grand + nom + promo + trois étiquettes, sans enveloppe de carte (c'est l'étape 8), pour juger l'ensemble. Dix thèmes, planches dans `local/avatar-etiquette-captures/`.
- D54 (avatar), D55 (étiquette) ; attendu `docs/attendus/avatar-etiquette.md`.

#### 5. Ta réponse

Plan dans `local/boite-aux-lettres/2026-11-19-20-de-claude-code-plan-avatar-etiquette.md` : ce que tu lis dans Vuetify, rôles et contrastes mesurés, fichiers, tests, commits, prévu sur les réels des lots précédents. Questions de design pour Quentin en mots simples avec une recommandation ; questions techniques pour Claude. Arrêts : le plan, l'attendu, les planches avant la documentation.

## Réponses au plan

### Réponses au plan : avatar-etiquette

De : Claude, pour Claude Code, terminal de ds-lab. 19/11/2026, 11 h 14.
Réponse à `2026-11-19-20-de-claude-code-plan-avatar-etiquette.md`. Plan accepté, avec les réponses ci-dessous. Quentin donne le go en collant le message qui renvoie à ce fichier.

#### Questions techniques, tranchées par Claude

| T | Réponse |
|---|---|
| T1 | Noms acceptés tels quels |
| T2 | Oui : ajouter les deux espacements de l'étiquette à `HORS_CONTROLE` |
| T3 | Oui : `<img>` simple par-dessus les initiales, retiré en échec ; racine `span` avec `role="img"` et `aria-label`, ou `aria-hidden` si décoratif ; les trois attributs retirés de la liste blanche. Photo à fond transparent : en dette |
| T4 | Garder `span` ; `div` dans `span` en dette, avec la règle d'usage (l'étiquette se pose dans une ligne ou un `<li>`) |
| T5 | Oui : `initiales.js` à côté de la fabrique ; famille A ; gardes E9 à E12 |
| T6 | Sans objet : voir Q5 |

#### Questions de design, validées par Quentin (11 h 13), sur recommandation

| Q | Réponse |
|---|---|
| Q1 | Initiales et texte de l'étiquette « marque » : `texte.marque` (pas 12 du primaire), rôle ajouté |
| Q2 | Initiales 16 et 24 px demi-gras ; étiquette 14 px normal |
| Q3 | 24 px de haut, 12 px de marge, 8 px entre deux étiquettes |
| Q4 | Neutre : `fond.composant` et `texte.principal` |
| Q5 | **Non à ta recommandation.** Pas de limite de longueur ni de refus : le texte d'une étiquette vient des données, et un refus ferait disparaître la carte d'un membre. Le texte reste sur une ligne, coupé par « … » quand la place manque (`text-overflow: ellipsis`, largeur maximale = celle du parent) ; le texte entier reste dans le DOM et dans l'arbre d'accessibilité. La preuve le vérifie sur une étiquette longue. Règle dans D55 |
| Q6 | La règle des initiales et ses quinze cas, telles quelles |

#### À montrer aux planches

En sombre : le rond et la pilule sur une carte (1,03:1) ; Écume et Sel, les deux tons d'étiquette. Ajoute à la ligne « en situation » une étiquette longue coupée.

#### Rappels

Arrêts : l'attendu (compte rendu fichier 22), puis les planches avant la documentation (fichier 23), CI de la branche verte. Rien sur `main`. Relevé du temps dans `local/avatar-etiquette-temps.md`.

## Valeurs attendues, écrites à la main le 19/11/2026

Ce que le code devra donner, d'après le plan (`2026-11-19-20-…`) et les réponses ci-dessus. Les couleurs et les dimensions sont lues dans les jetons par un résolveur écrit à part, sans rien importer de `src/`. Les rapports sont calculés par culori 4.0.2 (`wcagContrast`). Le script et la commande sont en fin de section. `texte.marque` n'existe pas encore : le script lit sa future valeur, `marque.primaire.12`.

### Lu dans le code [F]

**Vuetify 4.3.4** (`lib/components/VAvatar/VAvatar.js` et `.css`, `lib/components/VChip/VChip.js` et `.css`, `lib/components/VImg/VImg.js`, `lib/composables/variant.js`, `lib/composables/router.js`) :

- **`VAvatar`**
  - Balise `div` par défaut (prop `tag`). Aucun rôle, aucun `aria-*`.
  - Contenu : `image` rend un `VImg` (`alt=""`, `cover`) ; `icon` rend un `VIcon` ; `text` rend le texte nu ; un emplacement remplace tout cela, sous un `VDefaultsProvider` qui ne règle que `VImg` et `VIcon`.
  - Toujours une `<span class="v-avatar__underlay">` (`genOverlays(false, 'v-avatar')`). `badge` enveloppe l'avatar dans un `VBadge`.
  - Style : `border-radius: 50%` ; côté par `--v-avatar-height` (40 px en `default`, 56 px en `x-large`), ou en style en ligne pour une taille en nombre ; densités −4 et −8 px ; `transition` de 0,2 s sur `width` et `height` ; variante `flat` par défaut : fond `surface`, texte `on-surface` à opacité moyenne, ombre nulle.
- **`VImg`**
  - Le `<img>` est sous `v-show` jusqu'au chargement, puis apparaît par une transition.
  - En échec : état `error`, événement `error`, emplacement `error` ou rien. Rendu par l'avatar, l'avatar reste vide.
  - Avec un `alt` non vide, son enveloppe (`VResponsive`) prend `role="img"` et `aria-label`, et le `<img>` garde son `alt` : deux nœuds nommés pour une image.
  - Chargement au défilement (IntersectionObserver), sauf avec `eager`.
- **`VChip`**
  - Balise `span` par défaut ; `<a>` avec `href` ou `to`.
  - Cliquable (`isClickable`) dès qu'il a un lien, un écouteur de clic (attribut ou prop `onClick`), `link: true` ou un `VChipGroup` parent, et jamais avec `link: false`. Cliquable, il prend `tabindex="0"`, l'écouteur `keydown` (Entrée, Espace), l'ondulation (`v-ripple`), la couche `v-chip__overlay` (opacifiée au survol et au focus), le curseur main et `user-select: none`.
  - Non cliquable : ni `tabindex`, ni rôle, ni ondulation, ni couche de survol ; seule la `<span class="v-chip__underlay">`.
  - `closable` ajoute un `<button>` ; `filter` une coche dans un groupe ; `modelValue` faux ne rend rien.
  - Le texte est dans un `<div class="v-chip__content">`, enfant du `<span>` : non conforme au modèle de contenu HTML.
  - Style : `border-radius: 9999px` ; variante `tonal` par défaut, dont le fond est la couleur du texte à `--v-activated-opacity` sur la sous-couche ; taille `default` à 32 px de haut, 14 px de texte, 12 px de marges ; `white-space: nowrap`, `overflow: hidden`, `max-width: 100%` ; `.v-chip__content` en `inline-flex`.

### Jetons [F pour les valeurs existantes, H pour les nouvelles jusqu'au commit]

**Primitives nouvelles** (`tokens/commun/primitives.tokens.json`) : `taille.24` = 24 px, `taille.56` = 56 px.

**Rôles nouveaux** (`tokens/commun/semantique.tokens.json`), les mêmes dans les dix thèmes sauf `texte.marque` :

| Rôle | Alias | Valeur | Usage |
|---|---|---|---|
| `texte.marque` | `{marque.primaire.12}` | par thème, tableau suivant | initiales ; texte de l'étiquette « marque » |
| `arrondi.pilule` | `{rayon.pilule}` | 9999 px | avatar et étiquette (comble B10) |
| `taille-avatar.normale` | `{taille.40}` | 40 px | côté de l'avatar normal |
| `taille-avatar.grande` | `{taille.56}` | 56 px | côté du grand avatar |
| `hauteur.etiquette` | `{taille.24}` | 24 px | hauteur de l'étiquette |
| `marge-interieure.etiquette` | `{espace.12}` | 12 px | marge à gauche et à droite du texte de l'étiquette |
| `ecart.entre-etiquettes` | `{espace.8}` | 8 px | écart entre deux étiquettes, en ligne et entre deux lignes |
| `typo.initiales.normale` | `{marque.police.texte}`, `{taille-texte.16}`, `{graisse.600}`, interligne 1,5 | 16 px, 600, ligne de 24 px | initiales de l'avatar normal |
| `typo.initiales.grande` | `{marque.police.texte}`, `{taille-texte.24}`, `{graisse.600}`, interligne 1,3333 | 24 px, 600, ligne de 32 px | initiales du grand avatar |

- Interlettrage 0 px dans les deux styles, comme les autres.
- Police du texte, par marque : Arial (Atelier Lavandine), Verdana (Écume et Sel), Helvetica (Grenat Papeterie), `system-ui` (Maison Alberto, qui n'en déclare pas), Orbe Sans (Orbe Café), chacune suivie de ses replis.
- Le texte de l'étiquette prend `typo.corps.petit`, qui existe : 14 px, 400, ligne de 20 px.
- `marge-interieure.etiquette` et `ecart.entre-etiquettes` sont hors contrôle d'ordre (`HORS_CONTROLE`, `src/tokens/espacements.js`), comme `ecart.icone-texte` : `npm run espacements` les affiche, sans les juger. `espace.12` quitte la liste des primitives sans rôle.
- `npm run typo` admet les deux styles sans changer son code : police du texte, au moins 12 px, ligne multiple de 4, aucune consigne de capitale.

**Paire nouvelle** (`tokens/commun/paires.json`), après les 73 : `texte.marque` sur `fond.marque.discret`, type texte (4,5). 74 paires.

**Table Vuetify** (`tokens/commun/vuetify.json`) :
- Deux couleurs, de 36 à 40 par thème (20 fonds, 20 textes), chacune une paire de `paires.json` :
  - `marque-discret` : fond `fond.marque.discret`, texte `texte.marque` ;
  - `composant` : fond `fond.composant`, texte `texte.principal`.
- 18 variables `ds-`, de 37 à 55 :

| Variable | Jeton (champ) | Valeur, dans les dix thèmes |
|---|---|---|
| `ds-arrondi-pilule` | `arrondi.pilule` | 9999px |
| `ds-taille-avatar-normale` | `taille-avatar.normale` | 40px |
| `ds-taille-avatar-grande` | `taille-avatar.grande` | 56px |
| `ds-initiales-normale-police`, `-taille`, `-graisse`, `-interligne` | `typo.initiales.normale` | police du texte de la marque, 16px, 600, 1.5 |
| `ds-initiales-grande-police`, `-taille`, `-graisse`, `-interligne` | `typo.initiales.grande` | police du texte de la marque, 24px, 600, 1.3333 |
| `ds-hauteur-etiquette` | `hauteur.etiquette` | 24px |
| `ds-marge-interieure-etiquette` | `marge-interieure.etiquette` | 12px |
| `ds-ecart-entre-etiquettes` | `ecart.entre-etiquettes` | 8px |
| `ds-corps-petit-police`, `-taille`, `-graisse`, `-interligne` | `typo.corps.petit` | police du texte de la marque, 14px, 400, 1.4286 |

**Fichiers régénérés**, dans les cinq marques : `jetons.css`, `vuetify.json`, `roles.html`, `typo.html`, `espacements.html`. Si une autre sortie attendue change (par exemple une liste de primitives), le commit s'arrête là et le dit : aucun fichier attendu n'est recalé.

### Couleurs et rapports [F]

Seuil : 4,5:1 (texte, WCAG 1.4.3). Le pastel, le rond et la pilule ne portent pas d'information à eux seuls : le texte et le nom la portent ; aucun seuil sur la forme [H].

**Rôles communs** (les mêmes dans les cinq marques, par mode) :

| Devant | Fond | Usage | Clair | Sombre | Attendu |
|---|---|---|---|---|---|
| `texte.principal` | `fond.composant` | étiquette neutre | `#363026` / `#f3f2f1` 11,68 | `#d8d5ce` / `#1b1b1b` 11,75 | passe ; paire déjà dans `paires.json` |
| `fond.composant` | `fond.surface` | pilule neutre sur une carte | `#f3f2f1` / `#ffffff` 1,12 | `#1b1b1b` / `#181818` 1,03 | pour mémoire, à montrer aux planches |
| `fond.composant` | `fond.app` | pilule neutre sur la page | `#f3f2f1` / `#fbfbfb` 1,08 | `#1b1b1b` / `#121212` 1,09 | pour mémoire |

**Rôles de la marque** (initiales, étiquette « marque ») :

| Thème | `texte.marque` / `fond.marque.discret` | `fond.marque.discret` / `fond.surface` (pour mémoire) | `fond.marque.discret` / `fond.app` (pour mémoire) |
|---|---|---|---|
| atelier-lavandine-clair | `#470c7e` / `#f5f1fe` 11,65 | `#f5f1fe` / `#ffffff` 1,11 | 1,07 |
| atelier-lavandine-sombre | `#ddcefd` / `#1d1925` 11,76 | `#1d1925` / `#181818` 1,03 | 1,09 |
| ecume-et-sel-clair | `#003647` / `#e3f6fe` 11,66 | `#e3f6fe` / `#ffffff` 1,11 | 1,07 |
| ecume-et-sel-sombre | `#ebf9ff` / `#1b1b1b` 16,02 | `#1b1b1b` / `#181818` 1,03 | 1,09 |
| grenat-papeterie-clair | `#2d000f` / `#fcf0f2` 16,88 | `#fcf0f2` / `#ffffff` 1,11 | 1,07 |
| grenat-papeterie-sombre | `#fec7d2` / `#2f1119` 11,78 | `#2f1119` / `#181818` 1,03 | 1,08 |
| maison-alberto-clair | `#402e00` / `#fbf3e1` 11,82 | `#fbf3e1` / `#ffffff` 1,10 | 1,07 |
| maison-alberto-sombre | `#feeecb` / `#1d1b17` 14,99 | `#1d1b17` / `#181818` 1,03 | 1,09 |
| orbe-cafe-clair | `#103060` / `#f1f3f7` 11,71 | `#f1f3f7` / `#ffffff` 1,11 | 1,07 |
| orbe-cafe-sombre | `#bdd7fe` / `#111b2a` 11,79 | `#111b2a` / `#181818` 1,03 | 1,08 |

- Le plus bas : 11,65 (Atelier Lavandine, clair). `npm run contraste` tient la paire nouvelle dans les dix thèmes.
- **À montrer aux planches** : en sombre, le rond et la pilule à 1,03 contre une carte ; Écume et Sel en sombre, où `fond.marque.discret` vaut `#1b1b1b`, la valeur de `fond.composant` : ses deux tons d'étiquette n'y diffèrent que par le texte (`#ebf9ff` contre `#d8d5ce`).

### Règle des initiales (`atelier/composants/initiales.js`)

`initiales(nom)` rend une chaîne d'une ou deux lettres, ou une chaîne vide si le nom n'a aucune lettre. JavaScript sans Vue, lu par le menu de l'avatar, par l'enveloppe et par les tests.

1. Le nom est coupé en mots sur les espaces (`\s+`) ; les espaces en tête et en fin ne comptent pas.
2. Dans un mot, une élision en tête, `d'` ou `l'` (apostrophe droite `'` ou courbe `’`, la lettre en majuscule ou en minuscule), est sautée.
3. Un mot sans lettre (`\p{L}`) après cela est ignoré : chiffres, ponctuation et emoji ne comptent pas.
4. Un mot est « en minuscules » si sa première lettre est minuscule (`\p{Ll}`). Les mots en minuscules **en tête** sont des particules et sont sautés, sauf si tous les mots sont en minuscules.
5. Initiales : au moins deux mots, première lettre du premier et du dernier ; un seul mot, sa première lettre ; un seul mot à trait d'union, première lettre de sa première et de sa dernière partie qui ont une lettre.
6. Chaque lettre passe par `toLocaleUpperCase('fr')` ; les accents restent. Deux lettres au plus.

Les quinze cas, noms fictifs (validés, Q6) :

| Nom | Initiales | Cas |
|---|---|---|
| `Camille Ferrand` | CF | deux mots |
| `Jean-Baptiste Morel` | JM | trait d'union dans un nom de plusieurs mots |
| `Marie-Lou` | ML | un seul mot à trait d'union |
| `Noé` | N | un seul mot |
| `Hugo de Lassalle` | HL | particule au milieu |
| `de Lassalle` | L | particule en tête, sautée |
| `Inès d'Aubrac` | IA | élision |
| `Inès d’Aubrac` | IA | élision, apostrophe courbe |
| `Émile Brun` | ÉB | accent gardé |
| `élodie brun` | ÉB | tout en minuscules : rien n'est sauté |
| `"  Camille   Ferrand "` | CF | espaces en trop |
| `Ana María Ruiz Soler` | AS | limite : un double nom espagnol donne le dernier mot |
| `李小龙` | 李 | écriture sans capitales |
| `""`, `"   "` | refus | « avatar : nom obligatoire » |
| `"123"`, `"—"` | refus | « avatar : nom sans lettre » |

### Comportement attendu

**Avatar** (`Avatar.vue`, `Avatar.menu.js`, préfixe « avatar ») :

| Option | Type | Défaut | Valeurs admises | Nom dans les messages |
|---|---|---|---|---|
| `nom` | String | — (obligatoire) | | nom |
| `image` | String | — | | image |
| `decoratif` | Boolean | false | | décoratif |
| `taille` | String | `'normale'` | `normale`, `grande` (genre f) | taille |

- `emits` vide ; écouteurs refusés (`ecouteurs: false`) ; `aria-label`, `aria-labelledby` et `aria-hidden` retirés de la liste blanche. `id`, `data-*` et les autres `aria-*` passent.
- Messages, à l'octet :
  - « avatar : nom obligatoire » : absent, `null`, `''`, et un nom fait d'espaces (règle propre, après les options) ;
  - « avatar : nom sans lettre » : `'123'`, `'—'` (règle propre) ;
  - « avatar : taille inconnue : petite (normale, grande) » ;
  - « avatar : attribut refusé : aria-label », de même pour `aria-labelledby`, `aria-hidden`, `onClick`, `class`.
- Rendu : `VAvatar` avec `tag: 'span'`, variante `flat`, ni `image` ni `text` ni `size` de Vuetify, contenu par l'emplacement ; classes `ds-avatar ds-avatar--<taille>`.
  - Dedans : `<span class="ds-avatar__initiales" aria-hidden="true">` (les initiales), toujours rendu ; puis, si `image` est donné et n'a pas échoué, `<img class="ds-avatar__image" src="…" alt="">` par-dessus, qui couvre le rond (`object-fit: cover`, centré).
  - En échec (`error`), l'`<img>` est retiré ; les initiales restent. Un nouveau `image` remet l'échec à zéro. Pendant le chargement, on voit les initiales.
  - Non décoratif : la racine porte `role="img"` et `aria-label` = le nom, espaces en tête et en fin retirés et espaces intérieurs réduits à un (voir « Ajouts », 2). Décoratif : la racine porte `aria-hidden="true"`, ni rôle ni nom.
  - Par jetons : côté `taille-avatar.*`, arrondi `arrondi.pilule`, fond `marque-discret`, initiales `on-marque-discret` en `typo.initiales.*`, centrées ; aucune ombre ; ni la transition de taille ni la sous-couche de Vuetify.
- Hors menu : clic, lien, badge d'état, groupe d'avatars, couleur par personne, autres formes.

**Étiquette** (`Etiquette.vue`, `Etiquette.menu.js`, préfixe « étiquette ») :

| Option | Type | Défaut | Valeurs admises | Nom dans les messages |
|---|---|---|---|---|
| `texte` | String | — (obligatoire) | | texte |
| `ton` | String | `'neutre'` | `neutre`, `marque` (genre m) | ton |

- Le texte est une **prop**, pas un emplacement : rien d'autre que du texte n'entre dans l'étiquette.
- **Aucune limite de longueur ni aucun refus de longueur** (Q5) : un texte de 80 caractères est accepté.
- `emits` vide ; écouteurs refusés ; `aria-label` et `aria-labelledby` retirés de la liste blanche.
- Messages, à l'octet :
  - « étiquette : texte obligatoire » : absent, `null`, `''` ;
  - « étiquette : ton inconnu : accent (neutre, marque) » ;
  - « étiquette : attribut refusé : closable », de même pour `href`, `to`, `link`, `filter`, `onClick`, `tabindex`, `aria-label`, `aria-labelledby`.
  - `id`, `data-*` et `aria-describedby` passent.
- Rendu : `VChip` avec `link: false`, `ripple: false`, variante `text`, taille et densité par défaut ; classes `ds-etiquette ds-etiquette--<ton>` ; contenu par l'emplacement : `<span class="ds-etiquette__texte">` qui porte le texte (voir « Ajouts », 1).
  - Par jetons : hauteur `hauteur.etiquette` (24 px), marges `marge-interieure.etiquette` (12 px), arrondi `arrondi.pilule`, texte en `typo.corps.petit` ; neutre : fond `composant`, texte `on-composant` ; marque : fond `marque-discret`, texte `on-marque-discret`.
  - Une ligne : le texte ne passe jamais à la ligne. Largeur maximale : celle du parent. Quand la place manque, le texte est coupé par « … » (`text-overflow: ellipsis`) ; le texte entier reste dans le DOM et dans l'arbre d'accessibilité.
  - Statique : ni `tabindex`, ni rôle, ni ondulation, ni couche de survol ; aucun changement au survol ; curseur ordinaire ; aucune ombre, aucune transition ; la sous-couche de Vuetify masquée.
- **Suite d'étiquettes** (règle écrite dans D55, sans enveloppe de groupe) : le parent est en flex, avec retour à la ligne, écart `ecart.entre-etiquettes` (8 px) en ligne et entre deux lignes ; l'étiquette n'a pas de marge (DS3). Dans la carte membre, la suite est une liste (`<ul>`, une étiquette par `<li>`).
- Le `div` de Vuetify dans le `span` est gardé (T4), en dette, avec la règle d'usage : l'étiquette se pose dans une ligne ou dans un `<li>`.

**Gardes** (`test/enveloppe-bouton.test.js`) :
- **E9** la détection de l'avatar prend `VAvatar`, un import `vuetify/components/VAvatar`, et `v-avatar` et ses classes (balise, classe, sélecteur, `v-avatar__underlay`) ; elle ne prend ni un commentaire, ni `ds-avatar`, ni `nav-avatar`.
- **E10** dans le code de `src/` et de l'atelier, une seule occurrence de fichier : `atelier/composants/Avatar.vue`, qui importe bien `VAvatar`.
- **E11** la détection de l'étiquette prend `VChip` et ses composés (`VChipGroup`), un import `vuetify/components/VChip`, et `v-chip` et ses classes (`v-chip__content`…) ; elle ne prend ni un commentaire, ni `ds-etiquette`, ni `nav-chip`.
- **E12** une seule occurrence de fichier : `atelier/composants/Etiquette.vue`, qui importe bien `VChip`.
- E1 à E8 inchangés. La preuve ne nomme que les classes `ds-`.

**Tests sans navigateur :**
- **W5** rejoue les refus génériques sur les deux menus, puis leurs messages ci-dessus ; **W8** voit les deux `.vue` passer par la fabrique et leur menu.
- **`test/avatar-etiquette.test.js`**, famille A :
  - **A1** les quinze cas de la règle des initiales ;
  - **A2** les deux primitives et les neuf rôles du tableau des jetons, alias et valeurs ; la paire nouvelle dans `paires.json` ;
  - **A3** les rapports des deux tableaux de couleurs, à 2 décimales, dans les dix thèmes ;
  - **A4** les 18 variables `ds-` et les deux couleurs nouvelles de chaque thème, égales à leur jeton.
- **V1, V2** : 40 couleurs par thème ; **V9** : 55 variables. **T2** : 74 paires, la couverture tenue pour `texte.marque`.
- Le test des espacements voit les deux rôles hors contrôle ; `npm run espacements`, `npm run typo` et `npm run contraste` restent à 0 dans les dix thèmes.

**Stories :**
- `atelier/stories/Avatar.stories.js` :
  - **Planche** : aux deux tailles, avec photo, sans photo, image en échec, et décoratif ; puis les cas d'initiales (deux mots, trait d'union, un mot à trait d'union, particule, élision, accent, un mot).
  - La photo est un portrait dessiné en SVG, en `data:`, sans personne réelle. L'image en échec est un `data:image/png;base64` invalide : l'échec ne dépend pas du réseau.
  - **Vitrine** (dix thèmes, sur la page et sur une surface), **Bac à sable**, et cinq refus : sans nom, nom d'espaces, nom sans lettre, taille inconnue, `aria-label` à la main.
- `atelier/stories/Etiquette.stories.js` :
  - **Planche** : les deux tons ; une rangée de huit étiquettes dans une boîte de 280 px, qui passe à la ligne ; une étiquette longue dans une boîte étroite, coupée par « … ».
  - **En situation** : grand avatar, nom en titre 4, promo en corps petit `texte.secondaire`, puis trois étiquettes (« Lyon » et « Finance » en neutre, « Mentor » en marque) et une étiquette longue coupée, sans carte.
  - **Vitrine** (dix thèmes, sur la page et sur une surface), **Bac à sable**, et quatre refus : sans texte, ton inconnu, `closable`, `href`.

**Preuve** (`atelier/preuve/avatar.js`, `atelier/preuve/etiquette.js`, enchaînées par `preuve.js`, et deux jobs de matrice de la CI, `avatar` et `etiquette`), sur chaque thème, en développement et en version construite :
- **Avatar** : boîte de 40 × 40 et 56 × 56 ; rayon calculé d'au moins la moitié du côté ; fond et couleur des initiales égaux aux jetons ; police, taille et graisse des initiales ; initiales centrées à 0,5 px près ; la photo couvre la boîte ; l'image en échec : initiales visibles et aucun `<img>` ; aucune ombre ; aucune transition.
- **Étiquette** : hauteur 24 ; marges 12 ; rayon calculé d'au moins 12 ; fond et texte des deux tons égaux aux jetons ; style corps petit ; au survol forcé, fond, texte et curseur inchangés ; aucune ombre ni transition ; dans la rangée, 8 px entre deux voisines d'une ligne et entre deux lignes, et au moins deux lignes ; l'étiquette longue : largeur au plus celle de son parent, texte coupé (`scrollWidth` > `clientWidth`, `text-overflow: ellipsis`), texte entier dans le DOM.
- Rendus identiques au pixel ; planches PNG de la version construite dans `local/avatar-etiquette-captures/`, une par thème.

Sur le premier thème :
- **Arbre d'accessibilité** :
  - avatar non décoratif, avec photo, sans photo et en échec : un seul nœud `img`, nommé par le nom, et aucun texte d'initiales lu ;
  - avatar décoratif : aucun nœud ;
  - étiquette : son texte lu, en entier pour l'étiquette longue ; aucun rôle interactif ; non focalisable.
- **Clavier** : de Tab en Tab entre un bouton placé avant la ligne en situation et un bouton placé après, le focus ne s'arrête ni sur un avatar ni sur une étiquette.
- **Clic** : un clic sur une étiquette ne crée aucun élément d'ondulation et n'émet rien.
- **Refus** : chaque story de refus montre l'erreur qui nomme l'usage, et aucune pièce.

Les quatre composants existants gardent leurs 260 vérifications. Le nombre total sera donné au commit.

**Hors de ce lot, pour KNOWN_ISSUES :**
- le badge (navigation), le groupe d'avatars, la couleur par personne ;
- les puces de filtre et les puces supprimables, autres pièces à venir ;
- le `div` dans le `span` de l'étiquette ;
- la photo à fond transparent, qui laisse voir les initiales dessous ;
- la règle des initiales et ses limites (double nom espagnol, titres comme « Dr », une capitale de plusieurs caractères comme `ß`) ;
- le texte coupé d'une étiquette longue, que l'œil ne lit pas en entier ;
- en sombre, le rond et la pilule à 1,03 contre une carte, et les deux tons d'Écume et Sel au même fond, si les planches le confirment.

### Ajouts trouvés en écrivant l'attendu, à valider à l'arrêt

1. **Le texte de l'étiquette dans une `<span>` de l'enveloppe.** `text-overflow: ellipsis` ne coupe pas le texte d'un conteneur flex, et `.v-chip__content` est en `inline-flex` [F, lu dans `VChip.css`]. L'enveloppe pose donc le texte dans `<span class="ds-etiquette__texte">` (bloc en ligne, `overflow: hidden`, `white-space: nowrap`, `text-overflow: ellipsis`, `min-width: 0`), et `.v-chip__content` reçoit `min-width: 0` et `max-width: 100%` [H, à prouver par la preuve].
2. **Le nom accessible de l'avatar est nettoyé de ses espaces en trop**, comme pour les initiales : `"  Camille   Ferrand "` est lu « Camille Ferrand ».
3. **Les refus de l'étiquette ne comptent plus de longueur** (Q5) : la liste de W5 est celle ci-dessus, et une étiquette de 80 caractères est acceptée.
4. **Une étiquette longue dans la planche et dans la ligne en situation**, comme demandé aux planches. La preuve la mesure.

### Script et commande

Lancé sous Node 24.22.3 depuis la racine du dépôt. Le script est lu sur l'entrée standard pour que `culori` se résolve depuis la racine, sans fichier ajouté au dépôt : `fnm exec --using=24.22.3 node --input-type=module - < attendu-avatar-etiquette.mjs`. Il écrit une ligne par thème : les dimensions et les polices, puis chaque paire avec ses deux couleurs et leur rapport.

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
// texte.marque n'existe pas encore : il vaudra {marque.primaire.12}, lu ici directement.
const PAIRES = [
  ['marque.primaire.12', 'fond.marque.discret'],
  ['texte.principal', 'fond.composant'],
  ['fond.marque.discret', 'fond.surface'], ['fond.marque.discret', 'fond.app'],
  ['fond.composant', 'fond.surface'], ['fond.composant', 'fond.app'],
];
const DIMS = ['rayon.pilule', 'taille.40', 'espace.12', 'espace.8', 'taille-texte.14', 'taille-texte.16', 'taille-texte.24'];
for (const d of readdirSync(T).filter((d) => existsSync(join(T, d, 'entree.json'))).sort()) {
  const r = lire(join(T, d, 'marque.resolver.json'));
  for (const mode of ['clair', 'sombre']) {
    const fichiers = [...['primitives', 'marque', 'roles'].flatMap((s) => r.sets[s].sources.map((x) => x.$ref)), ...r.modifiers.mode.contexts[mode].map((x) => x.$ref)];
    const j = new Map();
    for (const f of fichiers) for (const [k, v] of aplatir(lire(join(T, d, f)))) j.set(k, v);
    const val = (n) => { const v = j.get(n)?.$value; if (v === undefined) throw new Error(n); return typeof v === 'string' && v.startsWith('{') ? val(v.slice(1, -1)) : v; };
    const hex = (n) => val(n).hex;
    const px = (n) => { const v = val(n); return `${v.value}${v.unit}`; };
    const ligne = [`${d}-${mode}`, ...DIMS.map((n) => `${n} ${px(n)}`), `graisse.600 ${val('graisse.600')}`, `graisse.400 ${val('graisse.400')}`, `police.texte ${JSON.stringify(val('marque.police.texte'))}`];
    for (const [a, b] of PAIRES) ligne.push(`${a}/${b} ${hex(a)}/${hex(b)} ${wcagContrast(hex(a), hex(b)).toFixed(2)}`);
    console.log(ligne.join(' | '));
  }
}
```
