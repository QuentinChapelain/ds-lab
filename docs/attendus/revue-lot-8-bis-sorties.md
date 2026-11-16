Nettoyage après la revue, lot 8 bis : les textes écrits par l'outil qui portent une trace d'histoire. Branche revue-lot-8-bis depuis main (6943bd8). Attendu court : le tableau du lot 8 et la décision de Quentin.

## Décision de Quentin (16/11/2026)

- À faire : lignes 1, 2, 3, 4, 5, 6, 7, 8, 9 et 11, avec les propositions du tableau.
- À ne pas toucher : lignes 10 et 12.
- Ligne 11 : vérifier d'abord que C5 affiché désigne la règle de D20 partout où il sort ; sinon, arrêt.
- Lignes 5 et 6 : prouver qu'aucun test ne lit ces descriptions, ou dire lequel.
- Règle : seuls ces textes changent dans les sorties. Capture avant, comparaison après : chaque fichier différent l'est par ces textes et rien d'autre. Les fichiers versionnés de `tokens/` sont réécrits par leurs commandes, pas à la main.
- Tests d'abord : la garde d'histoire s'étend aux chaînes de `src/` que l'outil écrit, rouge sur ces textes. Tests à l'octet et fixtures touchés mis à jour, chacun listé.
- Commits enchaînés : attendu, garde rouge, code, documentation (KNOWN_ISSUES, `docs/identifiants.md` pour C5). Pas de fusion.

## Tableau du lot 8

Rien n'a changé dans ce lot. Lecteur : développeur, designer, ou personne (texte présent mais lu par aucun des deux).

| # | Texte, source | Sortie touchée | Lecteur | Proposition | Tests à l'octet touchés |
|---|---|---|---|---|---|
| 1 | 10 commentaires « Lot J, J7 », « Lot P, étape 3 », « Lot C (C12) »… dans le CSS et le script de la page, `src/report/review.js:721` à `:973` | chaque `revue.html` | personne (source de la page) | même style que `src/` : « J7 : … », « Paires contrôlées (P3)… », « dans la formulation du contrôle de proximité » | aucun test du dépôt [F] ; les 5 `revue.html` des captures de comparaison |
| 2 | « rattaché, rôle à revoir à l'étape 3 », `src/report/consigne.js:265` | `migration.md` et `modifications.json` (9 lignes dans chacun, sur 4 réductions) | développeur ou agent qui migre | « rattaché ; rôle à revoir » | `test/e2e-migration.test.js:391` (fin de ligne exacte) [F] |
| 3 | « Étape 4, séance a, lot 3 bis. », `src/report/calibrage.js:237` | `calibrage.html` | designer (décision des pleins) | « Règle en vigueur (D04), décidée sur image le 15/11/2026 : … » | aucun [F] |
| 4 | « effet sur les chiffres de l'étape 1 à mesurer », `src/report/differences.js:43` | rapport d'audit | développeur | « effet sur les chiffres de l'audit à mesurer » | `test/e2e-audit.test.js:82`, `test/report-unit.test.js:102` (texte exact) [F] |
| 5 | « (étape 4b, lot 2 bis) », `src/tokens/pleins.js:192` | `tokens/commun/aplat.tokens.json` (versionné, réécrit par la commande du mode sombre) | développeur, outil DTCG | retirer la parenthèse | aucun ne lit cette description [V] ; le fichier versionné est à réécrire |
| 6 | « séance 3a du 14/11/2026 », `src/tokens/primitives.js:79` | `tokens/commun/statuts.tokens.json` (versionné) | développeur, outil DTCG | « …(avertissement, info), du 14/11/2026. » | aucun ne lit cette description [V] ; le fichier versionné est à réécrire |
| 7 | « générateur visé par contraste (lot G) », `src/valise/generate.js:336` | champ `generator.name` d'une valise générée | personne : aucune commande du dépôt n'écrit de valise, seuls les tests en génèrent | « ds-lab, générateur visé par contraste » | aucun [F] |
| 8 | `$description` écrites à la main : `tokens/commun/primitives.tokens.json` (2), `semantique.tokens.json`, `paires.json`, `police.tokens.json` (2), `tokens/orbe-cafe/primitives.tokens.json` ; `tokens/orbe-cafe/entree.json` (`description`), recopiée par la saisie dans `tokens/orbe-cafe/marque.tokens.json` | ces fichiers ; `marque.tokens.json` d'Orbe Café | développeur, designer qui lit les jetons | dire le contenu sans la séance ni l'étape ; garder la date si elle date une décision | `test/aplats.test.js:60` (empreinte b479882e de `marque.tokens.json` d'Orbe Café) ; sortie de la saisie d'Orbe Café [F] |
| 9 | `$comment` de `fixtures/marque-demo/cible-valise.json` (« séance 2b, 11/11/2026 ») | recopié dans `table.json` de 4 réductions sur 5 | personne | « Valise d'Orbe Café (11/11/2026). … » | aucun test du dépôt [F] ; les `table.json` des captures |
| 10 | `fixtures/marque-demo/jetons/primitives.tokens.json` (« séance 2b », « séance 3c ») | aucune : copie figée de référence | personne | ne pas toucher : c'est une empreinte | `test/roles-statuts.test.js` (empreinte de 3fddd72) [F] |
| 11 | Identifiants affichés en collision (`docs/identifiants.md`) : « (C5) » | `migration.md`, `table.json` | développeur | « (D20) », la décision qui fonde le motif | `test/candidats.test.js`, `test/e2e-candidats-revue.test.js`, `fixtures/marque-demo/expected-candidats.json`, `fixtures/marque-demo/expected-proximite.json` [F] |
| 12 | Identifiants de l'audit D2, D4, D7, R1 bis… | rapport d'audit | développeur | les garder : ils renvoient à `fixtures/marque-demo/expected.json`, et la page des identifiants signale la collision | — |

## Constats avant le code

1. Ligne 11 : « (C5) » n'est écrit qu'à un endroit, `src/reduce/propose.js:240`, dans la branche d'égalité de `dimensionRow` : valeur à égale distance de deux pas, décision sans défaut, c'est la règle de D20 [F]. Dans les sorties des réductions de référence, les 56 occurrences sont toutes « à égale distance de A et B : au designer de choisir (C5) » (38 dans `migration.md`, 18 dans `table.json`) [F]. La page de revue réécrit ce motif en clair et ne lit en fin de motif que les identifiants R et M (`plainReason`, `src/report/review.js`) : « (D20) » n'y change rien [F]. Condition remplie, pas d'arrêt.
2. Lignes 5 et 6, par l'expérience : les deux descriptions remplacées par « SENTINELLE », `npm test` donne 819 tests, 818 verts. Aucun test ne lit la description de `tokens/commun/aplat.tokens.json` [F]. Un test lit celle de `tokens/commun/statuts.tokens.json` : `test/roles-statuts.test.js:44` (« T0 statuts.tokens.json existe et se lit en JSON ») exige qu'elle cite « DTCG 2025.10 » ; le texte proposé le garde [F].
3. Les commandes `node src/cli/sombre.js` et `node src/cli/statuts.js` réécrivent aujourd'hui `aplat`, `mode.sombre` et `statuts` à l'identique [F].
4. Ligne 8 : `primitives.tokens.json`, `semantique.tokens.json`, `paires.json`, `police.tokens.json` de `tokens/commun/`, `tokens/orbe-cafe/primitives.tokens.json` et `tokens/orbe-cafe/entree.json` sont écrits à la main (ARCHITECTURE, couches de jetons) : aucune commande ne les écrit, ils se corrigent à la main. `tokens/orbe-cafe/marque.tokens.json` est réécrit par la saisie depuis `entree.json` [F].
5. Ligne 9, écart avec le tableau : `fixtures/marque-demo/cible-marque.json` porte aussi un `$comment` daté d'un lot (« lot M, 13/11/2026 »), recopié dans `table.json` d'une réduction sur la page de marque. Même nature que `cible-valise.json` ; le tableau ne le nommait pas. Traité avec la ligne 9 [F].
6. Inventaire des chaînes de `src/` qui portent une mention (motifs de la garde, code sans commentaires) : 16 lignes, exactement celles des lignes 1 à 7 [F].
7. Captures de référence (`local/revue-lot-8-bis/avant/`) : 6 réductions (les 5 du lot 8 et la page de marque), la saisie des 4 marques, les fichiers écrits par `sombre` et `statuts`, le calibrage des 4 entrées, l'audit d'une page, une valise générée. Deux captures du même code sont identiques une fois neutralisés le chemin de sortie (console du calibrage) et les images base64 de `revue.html` (captures d'écran). Audit sur une seule page : sur trois pages, l'ordre des feuilles varie d'un lancement à l'autre [F].
8. Ligne 2 : la proposition « rattaché ; rôle à revoir » est appliquée au plus court, sans changer la ponctuation qui suit les sélecteurs : « … : a, button ; rattaché, rôle à revoir. » ; seul « à l'étape 3 » part.
