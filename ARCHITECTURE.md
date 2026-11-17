# Architecture

La carte du dépôt, limitée à ce qui change rarement. Les valeurs se lisent dans `tokens/commun/` et dans le dossier de chaque marque, les règles dans `docs/regles.md`, les décisions dans `docs/decisions.md`, les identifiants de règles cités par les sorties dans `docs/identifiants.md`, la dette dans `KNOWN_ISSUES.md`. Tout chemin cité dans la documentation s'écrit depuis la racine du dépôt ; `test/derive-docs.test.js` vérifie qu'il existe.

## Schéma d'ensemble

```
Migration d'un site existant (phases 2 et 3 du README)

  page servie ──► audit ───────────► reduce ──────────────────► apply ───────► verify
                  déclaré et rendu    table ancien → nouveau     copie du site   pixels et arbre
                  src/declared/       src/reduce/  src/brand/    src/apply/      d'accessibilité
                  src/rendered/       simulation : src/browser/                  src/verify/
                  src/browser/        revue, consigne : src/report/

Jetons d'une marque (phase 1)

  entree.json ──► npm run saisie ──► échelles générées ──┐
                  refus avec motif                       ▼
  primitives ──────────────────────────────────────► marque ──► sémantique (rôles) ──► paires
       └───────────────────────── src/tokens/ ──────────┴──────────────────────────────┘
                     réunis par marque.resolver.json : jeux, contextes mode et largeur
                                      │
               ┌──────────────────────┴───────────────────────┐
         contrôles, sortie 0, 1 ou 2                   planches HTML
         npm run contraste                             src/report/roles.js
         npm run espacements                           src/report/espacements.js
         npm run typo                                  src/report/typo.js

         feuille CSS de la marque, tous contextes : npm run css, src/tokens/css.js, par Terrazzo (D36)
         tokens/<marque>/jetons.css
```

Chaque commande npm a son point d'entrée dans `src/cli/`, sauf `npm run demo` (`test/helpers/demo.js`), `npm run types` (`tsc`), `npm run knip` (`knip`), `npm run dependances` (`depcruise`) et `npm test` (`node --test`). L'orchestration de l'audit et de la réduction vit dans leur couche, `src/audit/run.js` et `src/reduce/run.js` (D30) ; aucun module de `src/` hors de `src/cli/` n'importe de `src/cli/`. Toute commande a trois issues (D18) : 0 tout passe, 1 l'entrée a été lue et jugée (règle en échec, marque refusée avec son motif), 2 l'entrée n'a pas pu être jugée (fichier absent ou illisible, option inconnue, panne), message d'une ligne préfixé par le nom de la commande ; la garde commune est `src/cli/garde.js`. Les sorties d'audit et de réduction sur un vrai site vont dans `local/`, jamais versionné.

## src/, un dossier par ligne

| Dossier | Rôle |
|---|---|
| `src/cli/` | Points d'entrée : un fichier par commande npm, sauf `demo`, `types` et `test`, plus les générateurs de jetons et de planches ; `garde.js`, lancement commun et codes de sortie (D18), et `parMarque`, un contrôle sur une marque ou sur chacune (D26) |
| `src/audit/` | Orchestration d'un audit (navigateur, une session par hôte, pages, rapports) ; exécution facultative du script v1 |
| `src/browser/` | Ce qui tourne dans le navigateur : lancement de Chromium (`lancement.js`, D34), chargement, feuilles de style dans l'ordre de la cascade (`sheets.js`, D33), relevé du rendu, états forcés, simulation d'une table |
| `src/declared/` | Audit du déclaré : toutes les feuilles de toutes les pages, dédoublonnées et comptées |
| `src/rendered/` | Audit du rendu : relevé d'une page chargée, puis agrégation de toutes les pages |
| `src/lib/` | Fonctions pures partagées : couleurs (OKLab, ΔE, contraste WCAG), mise en forme des sorties (`format.js`), unités, clés de valeurs, adresses, sources ; lecture d'un fichier JSON et message d'erreur d'une ligne (`fichiers.js`, D30) |
| `src/reduce/` | Proposition de la table ancien → nouveau, texte sur plein et couplages, déclarations sources et conflits ; orchestration de `npm run reduce` (`run.js`, `runReduce`, D30) |
| `src/brand/` | Marque déclarée dans la cible ; lecture rapide de la marque d'un site, avant la réduction |
| `src/polices/` | Police des titres d'une marque : lecture d'un WOFF2 (mesures, graisses, licence, couverture), sans dépendance ; garde-fous ; contrôle d'encre de deux lignes dans Chromium (`encre.js`, playwright-core déjà présent), lancé par la saisie quand l'entrée donne les fichiers |
| `src/valise/` | Générateur d'échelles visé par contraste, et son contrôle `checkValise` |
| `src/tokens/` | Jetons DTCG d'une marque : lecteur de resolver, liste des marques (`dossiersDeMarque`, `nomDeMarque`), primitives, pleins, rôles et paires, espacements, styles de texte ; calcul des trois contrôles de la cible (contraste, espacements, typo) ; écriture de la saisie, à côté puis en remplacement (`ecriture.js`, D31) ; feuille CSS complète d'une marque, écrite par Terrazzo depuis son resolver et comparée au lecteur avant écriture (`css.js`, D36) |
| `src/report/` | Sorties lisibles : rapport d'audit, revue, `migration.md`, planches des rôles, des espacements et de la typo d'une marque (`planche(dossier)`), calibrage des pleins ; consigne pour un agent, structurée (`consigne.js`, D29), et `modifications.json` (`modifications.js`) ; texte du contrôle de contraste (`contraste.js`) |
| `src/apply/` | Application de `modifications.json` aux feuilles d'une copie du site ; lit le fichier, n'importe rien de `src/reduce/` ni de `src/report/` (D30) |
| `src/verify/` | Captures, références et comparaisons (pixels, arbre d'accessibilité), partagées par reduce et verify |

## Fonctions communes

Une règle écrite à plusieurs endroits a une seule définition ; chaque lecteur l'importe.

| Règle | Définition | Lue par |
|---|---|---|
| Nombre à la française, texte échappé pour le HTML, arrondi à 4 décimales | `fr`, `esc`, `r4` dans `src/lib/format.js` ; chaque sortie nomme son format par les options de `fr` (D22) | consoles des contrôles et de la saisie, planches, revue, migration, calibrage, rapports d'audit, générateur |
| Contraste WCAG | `contrastRatio` dans `src/lib/color.js` ; culori n'en calcule plus dans `src/`, il reste l'oracle des tests (D22) | reduce, revue, migration, rapports d'audit, jetons, générateur, calibrage |
| Résolution d'alias DTCG | `resoudreAlias` dans `src/tokens/roles.js`, à côté de `flattenTokens` (D23) | rôles de couleur, espacements, typo |
| Valeur retenue après décision | `retenue` dans `src/reduce/propose.js`, à côté de `decisionFor` (D21) | simulation, conflits de déclarations, contrôle de proximité, migration, revue |
| Marques et leur nom | `dossiersDeMarque` et `nomDeMarque` dans `src/tokens/resolver.js` : chaque dossier de `tokens/` qui a un `marque.resolver.json`, et le champ `name` de ce resolver (D26) | les trois contrôles de la cible sans `--marque`, les planches |
| Échelles écrites à la main d'une marque | `echellesPropres` dans `src/tokens/saisie.js` : `primitives.tokens.json` du dossier, ou rien (D25) | saisie, calibrage |
| Aucune échelle commune redéfinie par une marque | `echellesCommunesRedefinies` et `motifRedefinies` dans `src/tokens/saisie.js` (D25) | saisie (refus), `npm run contraste` (échec) |
| Fusion de contexte d'une marque | `rolesDuResolver` dans `src/tokens/roles.js` : le resolver de la marque, résolu dans un contexte ; la saisie lui donne ses fichiers en mémoire (`enLigne`, `src/tokens/resolver.js`, D31) | `loadRoles` (contrôles, planches), saisie et son contrôle final |
| Texte du contrôle de contraste | `lignesContraste` dans `src/report/contraste.js` (D31) | `npm run contraste`, saisie |
| Consigne pour un agent | `consigneAgent` dans `src/report/consigne.js` : sections en listes d'entrées, consigne réduite de `reste.md` à côté (D29) | `migration.md` (texte), `modifications.json` (entrées) |
| Valeur après la table d'une couleur, par usage | `mapped` dans `src/reduce/pleins.js` (D30) | cartes de plein, couplages, migration |
| Lecture d'un fichier JSON | `lireJson` dans `src/lib/fichiers.js` : message qui nomme le fichier (absent, dossier, JSON illisible) (D30) | commandes, `runReduce` |
| Lancement de Chromium | `lancerChromium` dans `src/browser/lancement.js`, avec `--disable-partial-raster` (D34) | audit, reduce et `--live`, marque, verify, login, contrôle d'encre de la saisie |
| Nom d'une variable CSS de jeton | `cssVar` dans `src/report/modifications.js` : chemin du jeton, points remplacés par des tirets ; `cssVarFallback` (`src/report/consigne.js`) en garde une seconde écriture (`KNOWN_ISSUES.md`) | `tokens.css` de `npm run apply`, feuille de `npm run css` (D36) |
| Jetons de `--tokens` | `jetonsDe` dans `src/tokens/resolver.js` : un resolver est résolu dans ses contextes par défaut, un fichier de jetons est lu tel quel (D28) | `npm run reduce` |

Un nouveau module de fonctions communes va dans `src/lib/` s'il ne dépend d'aucune couche ; sinon à côté de la fonction dont la règle dépend, comme `retenue` à côté de `decisionFor`. `test/format.test.js` et `test/contraste-source.test.js` vérifient qu'aucune copie ne revient.

Aucune branche de code ne dépend du nom d'une marque : une différence réelle entre marques vit dans les données de la marque (un fichier de son dossier, un champ de son resolver), pas dans `src/` (D25, D26 ; `test/marque-en-dur.test.js`).

## Autres dossiers

| Dossier | Contenu |
|---|---|
| `tokens/commun/` | Couches communes à toutes les marques : primitives, statuts, mode sombre commun, police du produit, aplat plein, rôles, paires, contexte étroit |
| `tokens/orbe-cafe/` | Jetons DTCG de la marque fictive d'entraînement : entrée, échelles écrites à la main, marque, resolver, ses trois planches HTML et sa feuille CSS `jetons.css`, générées |
| `tokens/atelier-lavandine/`, `tokens/ecume-et-sel/`, `tokens/grenat-papeterie/` | Trois marques fictives saisies par fichier : entrée, échelles générées, couche marque, resolver, leurs trois planches HTML et leur feuille CSS `jetons.css`, générées |
| `fixtures/marque-demo/` | Pages fictives, pièges, cibles et attendus des tests de bout en bout ; `fixtures/marque-demo/cascade/`, pages d'essai de l'ordre des feuilles (D33), dont un import redirigé par le serveur des tests (`test/helpers/serveur.js`) ; `fixtures/marque-demo/jetons/primitives.tokens.json`, primitives d'Orbe Café d'avant l'étape 4b, figées : référence de cet état passé seulement (`test/roles-statuts.test.js`), les tests de `npm run reduce` lisent le resolver d'Orbe Café (D28) ; `fixtures/polices/`, quatre polices d'essai sous licence libre, chacune avec sa licence |
| `test/` | Tests `node --test`, nommés par sujet ; `test/helpers/` sert la marque fictive en local et porte le lexeur des gardes (`test/helpers/commentaires.js`) |
| `config/` | Exemple de fichier de sources, à copier dans `local/` |
| `.github/workflows/` | La CI : un job, une étape par commande (`.github/workflows/ci.yml`) |
| `knip.json`, `.dependency-cruiser.json` | Configurations de `npm run knip` (entrées : `src/cli/*.js` et les tests ; les scripts npm en ajoutent d'autres) et de `npm run dependances` (deux règles, chacune avec sa raison) |
| `.node-version` | Version de Node du poste de travail (24.22.3), lue par un gestionnaire de versions ; la CI garde Node 22, borne basse de `engines` |
| `docs/` | Règles du design system, décisions, contrat de marque, identifiants de règles (`docs/identifiants.md`) ; dans `docs/attendus/`, l'attendu de chaque lot, écrit avant le code et gardé à sa date |
| `local/`, `.auth/` | Données de vrais sites et sessions enregistrées : jamais versionnés |

## Couches de jetons

| Couche | Fichier | Écrit par | Lu par |
|---|---|---|---|
| Entrée | `tokens/orbe-cafe/entree.json`, un par marque | à la main | `npm run saisie` |
| Primitives communes | `tokens/commun/primitives.tokens.json` | à la main | `src/tokens/` |
| Échelles écrites à la main | `primitives.tokens.json` à côté de l'entrée, s'il existe : seules échelles qu'une entrée peut nommer, aucune du nom d'une échelle commune (D25) ; Orbe Café seule en a un (bleu, terre, sable) | à la main | marque, saisie, calibrage |
| Statuts | `tokens/commun/statuts.tokens.json` | `src/cli/statuts.js`, si `checkValise` passe | marque, rôles |
| Mode sombre commun | `tokens/commun/mode.sombre.tokens.json` : neutre dessiné sur la page `#121212`, statuts sombres, surface et texte sur inverse | `src/cli/sombre.js`, si `checkValise` passe | contexte sombre de chaque resolver |
| Police du produit | `tokens/commun/police.tokens.json` : `marque.police.texte`, commune ; une couche marque qui la déclare la remplace ; `police.titre.hauteur-capitale`, consigne commune des styles de titre, rangée avec les primitives | à la main | jeu marque de chaque resolver |
| Aplat plein | `tokens/commun/aplat.tokens.json` : `marque.primaire.aplat`, `sur-aplat`, `aplat-survol`, alias du plein | `src/cli/sombre.js` | jeu marque de chaque resolver |
| Échelles générées | `echelles.tokens.json` à côté de l'entrée (aucune pour Orbe Café) | `npm run saisie` | marque, `npm run contraste`, avec ou sans `--marque` |
| Marque | `tokens/orbe-cafe/marque.tokens.json` | `npm run saisie` (`src/cli/saisie.js`) | rôles, styles de texte |
| Sémantique (rôles) | `tokens/commun/semantique.tokens.json` | à la main | les trois contrôles de la cible, les planches |
| Mode sombre de la marque | `echelles.sombre.tokens.json`, `marque.sombre.tokens.json` à côté de l'entrée : échelles sombres, bouton aux pas 11, 12 et 1, aplat plein et accent fort aux valeurs claires, texte de marque choisi sur les fonds sombres | `npm run saisie` | contexte sombre du resolver |
| Contexte étroit | `tokens/commun/largeur.etroit.tokens.json` : rôles qui changent sous 600 px, jeton entier | à la main | `npm run espacements`, `npm run typo`, planches |
| Paires | `tokens/commun/paires.json` | à la main | `npm run contraste`, planche des rôles |
| Resolver | `tokens/orbe-cafe/marque.resolver.json`, un par marque : jeux primitives, marque, rôles ; modificateurs mode et largeur | `npm run saisie` | `src/tokens/resolver.js`, lecteur maison ; Terrazzo, pour `npm run css` (D36) |
| Feuille CSS | `tokens/orbe-cafe/jetons.css`, une par marque : `:root` en clair et large, puis les seuls jetons que le sombre change (`prefers-color-scheme: dark`) et que l'étroit change (`width <` seuil du resolver) | `npm run css`, par Terrazzo | les pages d'un produit ; aucune commande de l'outil |

Changer de marque, c'est changer la couche marque ; les rôles restent les mêmes. Le resolver fusionne les jeux dans l'ordre primitives, marque, rôles, puis le contexte de chaque modificateur ; le dernier jeton gagne, en entier.

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm run audit` | Mesurer un site : déclaré et rendu ; sort en 2 si une page n'a pas pu être mesurée (audit écrit, incomplet) ou si aucune ne l'a été (rien d'écrit) |
| `npm run marque` | Lire la marque d'un site avant la réduction ; ne décide rien : sort en 0, ou en 2 sur une panne |
| `npm run reduce` | Ranger l'existant dans la cible : table, revue, consigne ; `modifications.json` avec `--tokens <fichier>`, fichier de jetons ou resolver d'une marque ; sort en 2 dès qu'une page tombe, ou si `--tokens` ne donne aucun jeton (D28) |
| `npm run apply` | Appliquer `modifications.json` aux feuilles d'une copie du site ; sort en 1 s'il reste un écart, en 2 sur une panne |
| `npm run verify` | Comparer une page à sa référence (pixels, arbre d'accessibilité) ; sort en 0 même si des pixels diffèrent, en 2 sur une panne |
| `npm run login` | Enregistrer une session dans `.auth/` ; sort en 2 sur une panne |
| `npm run demo` | Servir la marque fictive en local |
| `npm run saisie` | Saisir une marque depuis son entrée : échelles, couche marque, mode sombre, resolver, contraste dans les deux modes ; sort en 1 si elle est refusée, avec motif et mode, en 2 sur une panne |
| `npm run contraste` | Paires de rôles ; sort en 1 si une paire est sous son seuil sans exception écrite, ou si la marque redéfinit une échelle commune (D25), en 2 sur une panne ; `--mode clair|sombre` et `--largeur large|etroit` pour le contexte |
| `npm run css` | Feuille CSS complète de chaque marque, tous contextes, par Terrazzo, dans `tokens/<marque>/jetons.css` ; sort en 1 si une marque est refusée (sombre et étroit changent un même jeton, ou Terrazzo et le lecteur diffèrent ; sa feuille n'est pas écrite), en 2 sur une panne, rien d'écrit (D36) |
| `npm run espacements` | Écarts par relation, valeurs en étroit, règles de proximité ; sort en 1 si l'une échoue, en 2 sur une panne |
| `npm run typo` | Règles des styles de texte ; sort en 1 si l'une échoue, en 2 sur une panne ; `--couche-marque <fichier>` pour une couche marque donnée à part |
| `npm run types` | Types JSDoc des fichiers de `src/` (`@ts-check`) : `tsc -p tsconfig.json`, non strict, sans rien émettre ; sort en 1 s'il reste une erreur. Tenu à 0 avant chaque commit, comme les trois contrôles de la cible |
| `npm run knip` | Ce qui ne sert plus : fichiers, exports, dépendances de `src/` et `test/` (`knip`, `knip.json`) ; sort en 1 s'il reste un élément. Tenu à 0 avant chaque commit |
| `npm run dependances` | Cycles d'import et modules orphelins de `src/` (`depcruise src test`, `.dependency-cruiser.json`) ; sort en 1 si une règle échoue. Tenu à 0 avant chaque commit |
| `npm test` | Tous les tests |

Les trois contrôles de la cible et `npm run css` prennent `--marque <dossier>` ; sans l'option, ils traitent chaque marque de `tokens/` qui a un resolver, un bloc par marque sous son en-tête, et sortent en 1 si une marque échoue (D26). Aucune commande ne prend de marque par défaut.

Générateurs sans commande npm, lancés avec `node` : `src/cli/statuts.js`, `src/cli/sombre.js`, `src/cli/calibrage.js`, et `src/cli/planche.js [--marque <dossier>] [roles|espacements|typo]`, qui écrit les planches d'une marque dans son dossier, ou de chaque marque sans `--marque` (les trois sans planche nommée ; D27).

## Invariants

Chacun est tenu par le code ou par un test, cité.

- Deux lancements sur la même entrée et la même machine donnent les mêmes sorties, à l'octet et sans neutralisation : audit (`audit.json`, `rapport.md`, `rapport.html`), réduction (`revue.html`, `table.json`, `migration.md`, `modifications.json`), capture de `verify` ; Chromium n'est lancé que par `lancerChromium` (D34) (`test/determinisme.test.js`). Les feuilles d'une page sont rangées dans l'ordre de la cascade (D33 ; `test/feuilles-cascade.test.js`). Seuls la date (horodatage, injectable par `now`) et le nom du dossier de sortie changent d'un lancement à l'autre ; le port fait partie de l'adresse donnée.
- Le site audité n'est jamais modifié : les nouvelles valeurs sont posées dans le navigateur de l'outil, le temps des captures (`src/browser/simulate.js`).
- `npm run apply` ne remplace une déclaration que si la valeur écrite est celle attendue, sinon il la sort en écart ; relancé sur une copie migrée, il ne change rien (`test/apply-unit.test.js`).
- Un rôle de couleur ou d'espacement est un alias vers la couche marque ou vers une primitive, jamais une valeur brute (`test/roles-semantique.test.js`, `test/espacements-semantique.test.js`). Dans un style de texte, police, taille et graisse sont des alias ; interligne et interlettrage sont écrits en nombre (`test/typo-jetons.test.js`).
- Les jetons suivent le format DTCG 2025.10 (`test/roles-semantique.test.js`) ; les resolvers aussi (`test/resolver.test.js`).
- Les trois contrôles de la cible sortent en 0, 1 ou 2 (D18) : 0 tout passe, 1 une règle échoue, 2 l'entrée n'a pas pu être jugée ; un lot les laisse à 0, comme `npm run types`.
- Une marque refusée par `npm run saisie`, ou une saisie en panne, n'écrit rien ; la couche marque d'Orbe Café en sort identique, octet par octet (`test/saisie.test.js`, `test/saisie-ecriture.test.js`, `test/pannes.test.js`).
- La saisie juge le contraste par la même fusion que les contrôles, celle du resolver (`test/contraste-modes.test.js`, C5).
- `modifications.json` ne relit pas le texte de `migration.md` : il lit les entrées de la consigne structurée (`test/consigne-unit.test.js`).
- `src/cli/` n'est importé par aucun autre module de `src/` ; `src/browser/` n'importe que `src/browser/` et `src/lib/` (`test/couches.test.js`). Les règles de couches n'ont que cette définition.
- Aucun fichier, export ni dépendance qui ne sert plus : un export que rien n'importe perd le mot `export`, sans exception nommée (`npm run knip`).
- Aucun cycle d'import ; aucun module de `src/` sans lien, ni importé ni importateur (`npm run dependances`).
- Aucun nom réel dans un fichier versionné, un chemin ou un message de commit (`test/noms-interdits.test.js`).
- Aucun nom de marque dans le code de `src/`, commentaires exclus (`test/marque-en-dur.test.js`, D26).
- Les planches versionnées de chaque marque égalent la sortie de leur fonction (`test/planches-marques.test.js`, D27).
- La feuille CSS versionnée de chaque marque égale une génération neuve ; dans chaque combinaison de contextes, ses variables effectives sont exactement les jetons du lecteur, avec la même valeur ; tout jeton qu'apply sait écrire y a le nom et la valeur de `tokens.css` (`test/css-jetons.test.js`, D36). Le seuil de l'étroit se lit dans le resolver ; une marque dont sombre et étroit changent un même jeton est refusée (`test/css-commande.test.js`).
- Rien de `local/` ni de `.auth/` n'est versionné (`.gitignore`).
- À chaque push, une machine neuve (ubuntu-24.04, Node 22) rejoue `npm ci`, l'installation de Chromium, `npm run types`, `npm run knip`, `npm run dependances`, les trois contrôles de la cible et `npm test`, une étape par commande ; une étape en échec arrête les suivantes. Actions épinglées par empreinte, lecture seule, aucun secret (`.github/workflows/ci.yml`).
- Chaque commande et chaque chemin cités dans la documentation existent, attendus exceptés : ils décrivent le dépôt à leur date (`test/derive-docs.test.js`).
- Un commentaire dit sa raison, pas son histoire : aucun numéro de lot, d'étape ou de séance dans les commentaires de `src/` et de `test/`, les titres des tests ni les noms de fichiers de test ; un commentaire renvoie à une décision par son numéro (`test/histoire.test.js`). La même garde couvre les textes que l'outil écrit : chaînes de `src/` (y compris un commentaire placé dans le gabarit d'une page), descriptions des jetons de `tokens/`, `$comment` des cibles de `fixtures/marque-demo/`.

## Dépendances

`playwright-core` (navigateur), `postcss` et `@projectwallace/css-analyzer` (lecture du CSS), `culori` (conversions de couleurs et ΔE ; dans les tests, oracle indépendant du contraste), `pixelmatch` et `pngjs` (comparaison de captures), `@terrazzo/parser` et `@terrazzo/plugin-css` 2.10.0, en version exacte (feuille CSS des jetons, `npm run css`, D36). Toute nouvelle dépendance est signalée dans le plan du lot.

Terrazzo : `@terrazzo/parser` lit le resolver et résout chaque combinaison de contextes, `@terrazzo/plugin-css` écrit la feuille ; tous deux sont appelés depuis `src/tokens/css.js`, sans fichier de configuration ni ligne de commande. `@terrazzo/plugin-css` déclare `@terrazzo/cli` en peerDependency : npm l'installe avec vite, rolldown et lightningcss (30 paquets, environ 35 Mo), qu'aucune commande ne charge (`KNOWN_ISSUES.md`). Les `engines` les plus exigeants de cet arbre (vite, rolldown) demandent Node `^20.19.0 || >=22.12.0`.

Dépendances de développement, en version exacte, pour les commandes d'analyse seulement :

- `typescript` 7.0.2 : vérifie les types JSDoc de `src/` selon `tsconfig.json` à la racine (`allowJs`, `checkJs`, `noEmit`, modules `nodenext`, `strict: false`). La version 7 est un compilateur natif : le paquet `typescript` n'est qu'un lanceur, le compilateur est un binaire par plateforme (`@typescript/typescript-<os>-<cpu>`), installé par les dépendances facultatives ; npm n'installe que celui de la machine, et `package-lock.json` les liste toutes. `npm ci --omit=optional` (ou `--no-optional`) rend `tsc` inutilisable.
- `@types/node` 22.20.5 : types de la plus ancienne version de Node prise en charge (`engines` : `>=22`), pour qu'un appel à une API plus récente soit signalé.
- `knip` 6.45.1 (`npm run knip`) : lit le code avec oxc, sans charger TypeScript ; il ne lit que le `package.json` du paquet `typescript`, pour rattacher le binaire `tsc` du script `types`. Demande Node `^20.19.0 || >=22.12.0`.
- `dependency-cruiser` 18.7.2 (`npm run dependances`) : lit le JavaScript avec acorn ; il lit le `package.json` du paquet `typescript` pour en connaître la version et écarte la 7.0, sans effet sur ce dépôt, qui n'a pas de source TypeScript. Sa ligne de commande refuse de démarrer hors de Node `^22||^24||>=26`.
