# Attendu : noms des tokens en anglais

Demande de Claude (`2026-11-20-19-de-claude-demande-tokens-en-anglais.md`), plan de Claude Code (`2026-11-20-20-…`), réponses (`2026-11-20-21-…`), arrêt 1 (`2026-11-20-22-…`) et ses réponses (`2026-11-21-01-…`), tous dans la boîte aux lettres, hors dépôt. Go de Quentin le 20/11/2026 à 22 h 16 jusqu'à l'arrêt 1 ; mots `feature`, `supporting-text` et `full` validés et go jusqu'à l'arrêt 2 le 21/11/2026 à 0 h 25. Les messages sont résumés ici ; la table des mots est donnée en entier, et la table par nom complet est `docs/anciens-noms.json`.

## Demande, résumée

Les noms des tokens et des noms publics du thème passent en anglais avant l'étape 9, en lot à part, pour que le skill, les règles et l'app qui suivent sortent en anglais du premier coup. NM1 perd son exception : l'interface publique est en anglais, le code interne et le texte restent en français.

- **Dans le lot** : chemins des tokens (primitives, statuts, rôles, aplat, police, marque, échelles), variables CSS (`--…`, `--ds-…`, `--v-ds-…`), couleurs du thème Vuetify nommées par ds-lab, emplacements du contrat de marque, clés de `paires.json`.
- **Reste en français** : `$description`, fiches, messages, décisions, code interne (NM1).
- **Non réécrits** : `docs/decisions.md` et `docs/attendus/`. La table `docs/anciens-noms.json` les relie, tenue par un test.
- **Hors périmètre** : noms de fichiers et de dossiers de `tokens/`, noms des marques, préfixe `Ds`, vocabulaire interne (« jeton », « rôle », « enveloppe »), commandes npm.
- **Dette** : le tri de `KNOWN_ISSUES.md` est un lot à part. Ce lot ferme trois entrées : noms des tokens en français, classe CSS du générateur de `roles.html`, deux écritures du nom d'une variable CSS.

## Réponses, résumées

| # | Réponse |
|---|---|
| C1, C2, C4 à C13, C17 | `background`, `tint`, `solid`, `subtle`, `strong`, `gap`, relations `within-…` et `between-…`, `border-radius` (rôles) et `radius` (primitives), `padding`, `on-…`, `display`, `label`, `pressed` |
| C3, `aplat` | **`feature`** : Carbon `$background-brand`, décrit « Feature background color », sans variante d'état. Le mot vient de la description du token, pas de son nom. `fill` écarté : chez Polaris, `bg-fill` est le fond d'un petit élément, bouton ou badge |
| C14, `mention` | **`supporting-text`** : M3, le texte d'aide et d'erreur sous un champ (`@material/web`). `caption` écarté : Vuetify 4 a retiré `text-caption` |
| C15, `etiquette` | `tag`, le nom de code de `DsTag`, comme `avatar-size` et `icon-size` |
| C16, `principal` | `default` : `text.default`. Dans Vuetify, `text-primary` colore un texte avec la couleur de marque |
| `pilule` | **`full`** : Atlassian, Polaris, Primer, M3 et Tailwind ; aucun système ne dit `pill` |
| Q1 | Valeurs `echelle` d'Orbe Café renommées (forcé) ; clés de `entree.json` renommées, dans ce lot, commit à part |
| Q2 | Clés de `$extensions` inchangées |
| Q3 | Clés de la table `tokens/commun/vuetify.json` renommées |
| Q4 | Les noms cités dans les autres entrées de `KNOWN_ISSUES.md` sont renommés ; rien d'autre n'y bouge |
| Q5 | Thèmes `<marque>-light`, `<marque>-dark` ; contextes `light`, `dark`, `wide`, `narrow` ; modificateur `width`. Dans ce lot, commit à part. Un contexte nommé sous `ds-lab.mode` ou `ds-lab.largeur` prend le même nom ; les clés de `$extensions` ne bougent pas |
| Fichiers | `*.sombre.tokens.json`, `largeur.etroit.tokens.json`, `npm run sombre` inchangés ; une ligne de dette le dit |

Aussi accepté : `docs/anciens-noms.json` et son test, la copie figée lue à travers la table, la nouvelle empreinte d'Orbe Café, `src/lib/nom-css.js` (quatre écritures du nom d'une variable CSS réunies), la classe `echantillon-fond` dans `roles.html`, une note de changement au README sans alias ni étiquette git, trois arrêts, un commit vert à chaque fois.

## La table des mots

**Règle des dimensions** : un groupe de rôles prend le nom de la propriété CSS qu'il règle (`gap`, `padding`, `height`, `width`, `border-width`, `border-radius`) ; un groupe de primitives prend le nom court de son échelle (`space`, `size`, `radius`, `stroke`). Elle tient B4 (`test/bouton-jetons.test.js`).

| Segment | Anglais |
|---|---|
| `accent`, `app`, `focus`, `info`, `inverse`, `section`, `surface` | inchangés |
| `affichage` | `display` |
| `aplat`, `aplat-survol`, `sur-aplat` | `feature`, `feature-hover`, `on-feature` |
| `appui` | `pressed` |
| `arrondi` (rôles) | `border-radius` |
| `avertissement` | `warning` |
| `blanc` | `white` |
| `bleu`, `terre`, `sable`, `neutre` | `blue`, `earth`, `sand`, `neutral` |
| `bordure` | `border` |
| `colonne` | `column` |
| `composant` | `component` |
| `contour` | `default` (`epaisseur.contour` → `border-width.default`) |
| `controle` | `control` |
| `corps` | `body` |
| `couleur` | `color` |
| `decalage` | `offset` |
| `defaut` | `default` |
| `desactive` | `disabled` |
| `discret`, `discrete` | `subtle` |
| `ecart` | `gap` |
| `dans-composant`, `entre-blocs`, `entre-composants`, `entre-etiquettes`, `entre-groupes` | `within-component`, `between-blocks`, `between-components`, `between-tags`, `between-groups` |
| `epaisseur` | `border-width` |
| `erreur` | `error` |
| `espace` | `space` |
| `etiquette` | `tag` |
| `fond` | `background` |
| `fort`, `forte` | `strong` |
| `graisse` | `font-weight` |
| `grand`, `grande` | `large` |
| `hauteur` | `height` |
| `hauteur-capitale` | `cap-height` |
| `icone-texte` | `icon-text` |
| `initiales` | `initials` |
| `interactif` | `interactive` |
| `largeur` | `width` |
| `libelle` | `label` |
| `marge-interieure` | `padding` |
| `marque` | `brand` |
| `mention` | `supporting-text` |
| `moyen`, `normale` | `medium` |
| `petit`, `petite` | `small` |
| `pilule` | `full` |
| `plein`, `plein-survol` | `solid`, `solid-hover` |
| `police` | `font` |
| `primaire`, `secondaire` | `primary`, `secondary` |
| `principal` | `default` |
| `produit` | `product` |
| `rayon` (primitives) | `radius` |
| `succes` | `success` |
| `sur-…` | `on-…` (`sur-plein` → `on-solid`, `sur-interactif` → `on-interactive`) |
| `survol` | `hover` |
| `taille` (primitives), `taille-avatar`, `taille-icone`, `taille-texte` | `size`, `avatar-size`, `icon-size`, `font-size` |
| `teinte` | `tint` |
| `texte`, `texte-grand` | `text`, `text-large` |
| `titre` | `heading` |
| `trait` (primitives) | `stroke` |
| `typo` | `typography` |

Un pas d'échelle reste un nombre ; `pilule` est un nom de pas, traduit (`rayon.pilule` → `radius.full`). Deux chemins font exception : `marque.police.texte` → `brand.font.body` et `marque.police.titre` → `brand.font.heading`.

Exemples : `fond.marque.teinte` → `background.brand.tint` ; `texte.sur-interactif.inverse.survol` → `text.on-interactive.inverse.hover` ; `marque.primaire.aplat` → `brand.primary.feature` ; `typo.mention` → `typography.supporting-text` ; `arrondi.pilule` → `border-radius.full`.

### Hors des chemins

- **Variables CSS** : `--` suivi du chemin, points remplacés par des tirets (`--background-brand-tint`). Une seule fonction l'écrit (`src/lib/nom-css.js`).
- **Variables du thème** (`--v-ds-…`) : les mêmes mots ; les suffixes de typographie sont ceux de Terrazzo (`police` → `font-family`, `taille` → `font-size`, `graisse` → `font-weight`, `interligne` → `line-height`, `hauteur-capitale` → `cap-height`) ; `contour` → `border`, `contour-carte` → `card-border`, `titre-carte` → `card-title`. Exemples : `--v-ds-libelle-police` → `--v-ds-label-font-family`, `--v-ds-ecart-entre-etiquettes` → `--v-ds-gap-between-tags`.
- **Couleurs du thème** nommées par ds-lab : `erreur-fort-survol` → `error-strong-hover`, `composant-survol` → `component-hover`, `interactif-discret` → `interactive-subtle`, `erreur-discret` → `error-subtle`, `desactive` → `disabled`, `marque-teinte` → `brand-tint`, `teinte` → `tint`. Aucune ne prend le nom d'une couleur de Vuetify 4.3.4.
- **`paires.json`** : `seuils` → `thresholds`, `paires` → `pairs`, `devant` → `foreground`, `fond` → `background`, `interdites` → `forbidden`, `regle` → `rule` ; `type` et `exception` inchangés. Valeurs de `type` : `texte` → `text`, `bordure` → `border`, `grand-texte` → `large-text`, `focus` inchangé.
- **Table `tokens/commun/vuetify.json`** (Q3) : `couleurs` → `colors`, `polices` → `fonts`, `fond` → `background`, `texte` → `text`, `jeton` → `token`, `champ` → `field`, `sansPaire` → `unpaired` ; `variables` inchangé.
- **`entree.json`** (Q1) : `nom` → `name`, `primaire` → `primary`, `polices` → `fonts`, `titre` → `heading`, `texte` → `body`, `echelle` → `scale`, `familles` → `families`, `fichiers` → `files` ; `accent` et `description` inchangés. Le `nom` du `vuetify.json` de chaque marque devient `name`. Un message de refus reste en français ; s'il cite une clé, il cite la nouvelle.
- **Resolver et thèmes** (Q5) : modificateur `largeur` → `width`, `mode` inchangé ; contextes `clair` → `light`, `sombre` → `dark`, `large` → `wide`, `etroit` → `narrow` ; thèmes `<marque>-clair` → `<marque>-light`, `<marque>-sombre` → `<marque>-dark`. Les noms des jeux du resolver (`primitives`, `marque`, `roles`) ne bougent pas.

## Ce que le lot garde

- `fixtures/marque-demo/jetons/primitives.tokens.json`, copie figée : inchangée, garde son empreinte ; le test qui la compare aux primitives communes la lit à travers la table.
- `tokens/orbe-cafe/marque.tokens.json` : nouvelle empreinte, ajoutée à la liste datée ; l'ancienne (`c6717998…`) est retrouvée par la traduction à rebours.
- `expected-migration.json` et `expected-desordre-valise.json` : renommés, ce sont des sorties de l'outil.
- Les feuilles du site audité dans `fixtures/` (`--marque-primary-color`, `--fond-encart`) : inchangées, ce sont des entrées.

## Contrôle de la table : `test/anciens-noms.test.js`

1. Chaque nouveau nom existe : chemin dans un resolver, variable dans `jetons.css`, variable ou couleur dans `vuetify.json`.
2. Pas deux anciens noms pour un même nouveau.
3. Chaque chemin est la traduction mot à mot de l'ancien par `mots`, sauf les exceptions.
4. Aucun ancien nom complet ne reste dans `tokens/`, `src/`, les sources de l'atelier, `test/` (hors ce test), `README.md`, `ARCHITECTURE.md`, `CLAUDE.md` et `docs/` (hors `attendus/`, `decisions.md` et la table). Sont exclues les entrées de `fixtures/` et la copie figée.
5. `tokens/orbe-cafe/marque.tokens.json`, traduit à rebours, retrouve l'empreinte `c6717998…`.
6. Chaque `entree.json` n'a que des clés nouvelles, à tous les niveaux, et chaque `vuetify.json` de marque a `name` ; aucune clé ancienne de l'entrée citée en JSON (`"echelle":`), ni `polices.titre` ou `polices.texte`, ne reste dans les descriptions des tokens ni dans les docs (périmètre de 4). Ajouté le 21/11/2026 avec les clés de l'entrée.
7. Aucun ancien nom de thème complet (`orbe-cafe-clair`) ne reste (périmètre de 4) ; dans les fichiers JSON de `tokens/`, lus comme JSON, les modificateurs, leurs contextes, leur défaut, `resolutionOrder` et les clés sous `ds-lab.mode` et `ds-lab.largeur` ne portent que des noms nouveaux ; chaque nouveau thème, modificateur et contexte existe. Ajouté le 21/11/2026 avec les thèmes et les contextes.

## Commits

1. L'attendu et la table (`docs/anciens-noms.json`).
2. Le renommage des tokens, des variables, des couleurs du thème, de `paires.json` et de la table Vuetify ; `src/lib/nom-css.js` ; `echantillon-fond` ; le test de la table ; D62, NM1, README, ARCHITECTURE, CLAUDE.md, docs, fiches et `KNOWN_ISSUES.md`.
3. Les clés de `entree.json` (Q1).
4. Les thèmes, contextes et modificateur du resolver (Q5).

## Valeurs attendues, écrites à la main le 21/11/2026

Mesurées sur `a26264e` [F] :

- 315 chemins de tokens, 61 variables du thème, 7 couleurs du thème nommées par ds-lab, 10 thèmes.
- `npm test` : 1 028 verts. Après le lot : les mêmes, plus ceux de `test/anciens-noms.test.js` ; aucun vert perdu, aucun test retiré ni fusionné.
- Planches des composants et des modules, dans les dix thèmes : **0 pixel d'écart** avant et après.
- Preuve de l'atelier : toutes les vérifications vertes, en même nombre avant et après.
- `roles.html`, `espacements.html`, `typo.html` de chaque marque : identiques à l'octet après traduction à rebours, classe `echantillon-fond` mise à part.
- `jetons.css` : mêmes paires nom traduit à rebours et valeur, mêmes blocs, même nombre de lignes. `vuetify.json` de chaque marque : identique à l'octet après traduction à rebours.
- Contraste, espacements, typo, types, knip, dépendances et fiches : 0 échec, mêmes nombres de paires, de règles et de styles.
