# Architecture

La carte du dépôt, limitée à ce qui change rarement. Les valeurs se lisent dans `tokens/commun/` et dans le dossier de chaque marque, les règles dans `docs/regles.md`, les décisions dans `docs/decisions.md`, la dette dans `KNOWN_ISSUES.md`. Tout chemin cité dans la documentation s'écrit depuis la racine du dépôt ; `test/derive-docs.test.js` vérifie qu'il existe.

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
```

Chaque commande npm a son point d'entrée dans `src/cli/`. Toute commande a trois issues (D18) : 0 tout passe, 1 l'entrée a été lue et jugée (règle en échec, marque refusée avec son motif), 2 l'entrée n'a pas pu être jugée (fichier absent ou illisible, option inconnue, panne), message d'une ligne préfixé par le nom de la commande ; la garde commune est `src/cli/garde.js`. Les sorties d'audit et de réduction sur un vrai site vont dans `local/`, jamais versionné.

## src/, un dossier par ligne

| Dossier | Rôle |
|---|---|
| `src/cli/` | Points d'entrée : un fichier par commande npm, plus les générateurs de jetons et de planches ; `garde.js`, lancement commun et codes de sortie (D18) |
| `src/audit/` | Orchestration d'un audit (navigateur, une session par hôte, pages, rapports) ; exécution facultative du script v1 |
| `src/browser/` | Ce qui tourne dans le navigateur : chargement, feuilles de style, relevé du rendu, états forcés, simulation d'une table |
| `src/declared/` | Audit du déclaré : toutes les feuilles de toutes les pages, dédoublonnées et comptées |
| `src/rendered/` | Audit du rendu : relevé d'une page chargée, puis agrégation de toutes les pages |
| `src/lib/` | Fonctions pures partagées : couleurs (OKLab, ΔE, contraste WCAG), unités, clés de valeurs, adresses, sources |
| `src/reduce/` | Proposition de la table ancien → nouveau, texte sur plein, déclarations sources et conflits |
| `src/brand/` | Marque déclarée dans la cible ; lecture rapide de la marque d'un site, avant la réduction |
| `src/polices/` | Police des titres d'une marque : lecture d'un WOFF2 (mesures, graisses, licence, couverture), sans dépendance ; garde-fous ; contrôle d'encre de deux lignes dans Chromium (`encre.js`, playwright-core déjà présent), lancé par la saisie quand l'entrée donne les fichiers |
| `src/valise/` | Générateur d'échelles visé par contraste, et son contrôle `checkValise` |
| `src/tokens/` | Jetons DTCG d'une marque : lecteur de resolver, primitives, pleins, rôles et paires, espacements, styles de texte ; calcul des trois contrôles |
| `src/report/` | Sorties lisibles : rapport d'audit, revue, `migration.md`, planches des rôles, des espacements et de la typo, calibrage des pleins |
| `src/apply/` | Application de `modifications.json` aux feuilles d'une copie du site |
| `src/verify/` | Captures, références et comparaisons (pixels, arbre d'accessibilité), partagées par reduce et verify |

## Autres dossiers

| Dossier | Contenu |
|---|---|
| `tokens/commun/` | Couches communes à toutes les marques : primitives, statuts, rôles, paires, contexte étroit |
| `tokens/orbe-cafe/` | Jetons DTCG de la marque fictive (entrée, échelles écrites à la main, marque, resolver) et ses trois planches HTML, générées |
| `tokens/atelier-lavandine/`, `tokens/ecume-et-sel/`, `tokens/grenat-papeterie/` | Trois marques fictives saisies par fichier : entrée, échelles générées, couche marque, resolver |
| `fixtures/marque-demo/` | Pages fictives, pièges, cibles et attendus des tests de bout en bout ; `fixtures/marque-demo/jetons/primitives.tokens.json`, primitives d'Orbe Café d'avant l'étape 4b, figées comme cible de `npm run reduce` ; `fixtures/polices/`, quatre polices d'essai sous licence libre, chacune avec sa licence |
| `test/` | Tests `node --test` ; `test/helpers/` sert la marque fictive en local |
| `config/` | Exemple de fichier de sources, à copier dans `local/` |
| `docs/` | Règles du design system, décisions, contrat de marque, attendus des prochains lots |
| `local/`, `.auth/` | Données de vrais sites et sessions enregistrées : jamais versionnés |

## Couches de jetons

| Couche | Fichier | Écrit par | Lu par |
|---|---|---|---|
| Entrée | `tokens/orbe-cafe/entree.json`, un par marque | à la main | `npm run saisie` |
| Primitives communes | `tokens/commun/primitives.tokens.json` | à la main | `src/tokens/` |
| Échelles d'Orbe Café | `tokens/orbe-cafe/primitives.tokens.json` (bleu, terre, sable) | à la main | marque |
| Statuts | `tokens/commun/statuts.tokens.json` | `src/cli/statuts.js`, si `checkValise` passe | marque, rôles |
| Mode sombre commun | `tokens/commun/mode.sombre.tokens.json` : neutre dessiné sur la page `#121212`, statuts sombres, surface et texte sur inverse | `src/cli/sombre.js`, si `checkValise` passe | contexte sombre de chaque resolver |
| Police du produit | `tokens/commun/police.tokens.json` : `marque.police.texte`, commune ; une couche marque qui la déclare la remplace ; `police.titre.hauteur-capitale`, consigne commune des styles de titre, rangée avec les primitives | à la main | jeu marque de chaque resolver |
| Aplat plein | `tokens/commun/aplat.tokens.json` : `marque.primaire.aplat`, `sur-aplat`, `aplat-survol`, alias du plein | `src/cli/sombre.js` | jeu marque de chaque resolver |
| Échelles générées | `echelles.tokens.json` à côté de l'entrée (aucune pour Orbe Café) | `npm run saisie` | marque, `npm run contraste` avec `--marque` |
| Marque | `tokens/orbe-cafe/marque.tokens.json` | `npm run saisie` (`src/cli/saisie.js`) | rôles, styles de texte |
| Sémantique (rôles) | `tokens/commun/semantique.tokens.json` | à la main | les trois contrôles, les planches |
| Mode sombre de la marque | `echelles.sombre.tokens.json`, `marque.sombre.tokens.json` à côté de l'entrée : échelles sombres, bouton aux pas 11, 12 et 1, aplat plein et accent fort aux valeurs claires, texte de marque choisi sur les fonds sombres | `npm run saisie` | contexte sombre du resolver |
| Contexte étroit | `tokens/commun/largeur.etroit.tokens.json` : rôles qui changent sous 600 px, jeton entier | à la main | `npm run espacements`, `npm run typo`, planches |
| Paires | `tokens/commun/paires.json` | à la main | `npm run contraste`, planche des rôles |
| Resolver | `tokens/orbe-cafe/marque.resolver.json`, un par marque : jeux primitives, marque, rôles ; modificateurs mode et largeur | `npm run saisie` | `src/tokens/resolver.js`, lecteur maison |

Changer de marque, c'est changer la couche marque ; les rôles restent les mêmes. Le resolver fusionne les jeux dans l'ordre primitives, marque, rôles, puis le contexte de chaque modificateur ; le dernier jeton gagne, en entier.

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm run audit` | Mesurer un site : déclaré et rendu |
| `npm run marque` | Lire la marque d'un site avant la réduction ; ne décide rien : sort en 0, ou en 2 sur une panne |
| `npm run reduce` | Ranger l'existant dans la cible : table, revue, consigne ; `modifications.json` avec `--tokens` |
| `npm run apply` | Appliquer `modifications.json` aux feuilles d'une copie du site |
| `npm run verify` | Comparer une page à sa référence (pixels, arbre d'accessibilité) ; sort en 0 même si des pixels diffèrent, en 2 sur une panne |
| `npm run login` | Enregistrer une session dans `.auth/` |
| `npm run demo` | Servir la marque fictive en local |
| `npm run saisie` | Saisir une marque depuis son entrée : échelles, couche marque, mode sombre, resolver, contraste dans les deux modes ; sort en 1 si elle est refusée, avec motif et mode, en 2 sur une panne |
| `npm run contraste` | Paires de rôles ; sort en 1 si une paire est sous son seuil sans exception écrite, en 2 sur une panne ; `--marque <dossier>` pour une autre marque, `--mode clair|sombre` et `--largeur large|etroit` pour le contexte |
| `npm run espacements` | Écarts par relation, valeurs en étroit, règles de proximité ; sort en 1 si l'une échoue, en 2 sur une panne |
| `npm run typo` | Règles des styles de texte ; sort en 1 si l'une échoue, en 2 sur une panne |
| `npm test` | Tous les tests |

Générateurs sans commande npm, lancés avec `node` : `src/cli/statuts.js`, `src/cli/sombre.js`, `src/cli/calibrage.js`, `src/cli/planche.js`, `src/cli/planche-espaces.js`, `src/cli/planche-typo.js`.

## Invariants

Chacun est tenu par le code ou par un test, cité.

- Le site audité n'est jamais modifié : les nouvelles valeurs sont posées dans le navigateur de l'outil, le temps des captures (`src/browser/simulate.js`).
- `npm run apply` ne remplace une déclaration que si la valeur écrite est celle attendue, sinon il la sort en écart ; relancé sur une copie migrée, il ne change rien (`test/lot-s-apply.test.js`).
- Un rôle de couleur ou d'espacement est un alias vers la couche marque ou vers une primitive, jamais une valeur brute (`test/roles-semantique.test.js`, `test/espacements-semantique.test.js`). Dans un style de texte, police, taille et graisse sont des alias ; interligne et interlettrage sont écrits en nombre (`test/typo-jetons.test.js`).
- Les jetons suivent le format DTCG 2025.10 (`test/roles-semantique.test.js`) ; les resolvers aussi (`test/resolver.test.js`).
- Les trois contrôles sortent en 0 ou en 1 ; un lot les laisse à 0.
- Une marque refusée par `npm run saisie` n'écrit rien ; la couche marque d'Orbe Café en sort identique, octet par octet (`test/saisie.test.js`).
- Aucun nom réel dans un fichier versionné, un chemin ou un message de commit (`test/noms-interdits.test.js`).
- Rien de `local/` ni de `.auth/` n'est versionné (`.gitignore`).
- Chaque commande et chaque chemin cités dans la documentation existent (`test/derive-docs.test.js`).

## Dépendances

`playwright-core` (navigateur), `postcss` et `@projectwallace/css-analyzer` (lecture du CSS), `culori` (couleurs, contraste), `pixelmatch` et `pngjs` (comparaison de captures). Aucune dépendance de développement. Toute nouvelle dépendance est signalée dans le plan du lot.
