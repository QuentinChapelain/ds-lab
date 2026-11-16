Nettoyage après la revue, lot 4 : copies simples et retraits. Ce message est l'attendu. Ouvre la branche revue-lot-4 depuis main (7b3ad9c), verse-le dans docs/attendus/revue-lot-4-copies.md, confronte-le au code, propose un plan et attends.

CONTEXTE
La passe 1b (local/revue-code/passe-1b-synthese.md et les zones A à D) a relevé des règles écrites en plusieurs copies et du code mort. Les lots 0 à 3 ont changé le code depuis : relis chaque constat avant de t'y fier.

CE QUI ENTRE
Copies, une seule source pour chacune :
1. T5 : fr (8 définitions, plusieurs arrondis), esc (6 définitions, trois comportements sur null), r4 (4 définitions), contraste WCAG à deux sources.
2. D2 : résolution d'alias écrite trois fois, messages divergents.
3. T2 : « valeur retenue après décision », cinq endroits dont une variante.
4. D5 : trois commandes de planche identiques à trois lignes près.
Retraits :
5. A2 : captures par changement mortes.
6. D3 : champ statuts mort.
7. Les 3 exports morts : DEFAULT_SOURCES_PATH, PLEIN_CHOICES, MODIFICATEURS.
8. Q5, décidée le 15/11 : audit.json n'écrit plus le champ properties vide pour les 8 familles qui ne le remplissent pas.

HORS DU LOT
Le code de page recopié entre collectInPage et scanInPage (lot 7). « Orbe Café » en dur (lot 5). modifications.json (lot 6).

RÈGLE DU LOT
Une copie n'est fusionnée que si le comportement gardé est nommé. Là où deux copies divergent, ne choisis pas : c'est une question de confrontation. Un retrait n'est fait que si tu prouves que rien ne lit la chose retirée (src, test, fixtures, docs, sorties relues par une autre commande).

QUESTIONS DE CONFRONTATION
A. Pour chaque copie de 1 à 4 : où sont les définitions aujourd'hui, en quoi elles divergent, sur quelle entrée réelle elles donnent deux résultats, et quelle sortie (console, revue.html, fichier) changerait selon la copie gardée. Un tableau par règle.
B. Pour le contraste WCAG : les deux sources donnent-elles le même nombre sur toutes les paires des fixtures ? Sinon, lesquelles diffèrent et de combien.
C. Où ranger les fonctions communes ? Dis ce qui existe déjà (un module d'utilitaires, de format) avant de proposer un nouveau fichier.
D. Pour chaque retrait de 5 à 8 : la preuve que rien ne le lit. Pour properties : qui lit audit.json, y compris des fichiers déjà écrits dans local/.
E. Les 69 autres export inutiles (passe 1a) : hors lot. Dis seulement ce que coûterait de les retirer.
F. Quels tests protègent déjà chaque règle, et lesquels manquent.

MÉTHODE
Tests d'abord : pour chaque règle fusionnée, un test qui fixe le comportement gardé, rouge là où une copie diverge. Puis une règle par commit de code si le plan le permet. Les quatre contrôles (contraste, espacements, typo, types) à 0 et aucun vert perdu avant chaque commit.

DOCUMENTATION
ARCHITECTURE (où vivent les fonctions communes) ; KNOWN_ISSUES ; docs/decisions.md si une divergence est tranchée par Quentin ; l'attendu avec ses écarts.

RÉSULTAT ATTENDU
Une définition par règle ; les retraits faits ; les quatre contrôles à 0 ; npm test entièrement vert ; la liste des sorties qui changent, avec avant et après.

PLAN
D'abord la confrontation, avec A à F. Puis le plan. Attends ma réponse.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

1. Point 7 : l'attendu collé fusionnait deux noms (« DEFAULT_SCHOICES ») ; les trois exports morts sont `DEFAULT_SOURCES_PATH` (`src/lib/sources.js`), `PLEIN_CHOICES` (`src/reduce/pleins.js`), `MODIFICATEURS` (`src/tokens/resolver.js`) : seule leur déclaration les cite [F]. Question B et résultat attendu, abîmés au collage, rétablis le 16/11.
2. `fr` : 9 copies nommées, non 8 (la neuvième est dans le script de page de `src/report/review.js`), plus 4 sous un autre nom (`ratioFr`, deux `seuilFr`, `fr1`) et 14 en ligne (`String(x).replace('.', ',')`) [F]. Quatre comportements : `toFixed(2)`, `String(n)`, arrondi à 2 et à 4 décimales sans zéros ; plus la troncature de la planche des rôles et `toFixed(d)` du calibrage [F].
3. Deux défauts de `fr` [F] : la troncature de la planche des rôles se fait sur le flottant brut, et 5,02 × 100 = 501,999… ; elle donne 5,01 pour 1 ratio sur 70 d'Orbe Café (`texte.secondaire` sur `fond.composant`, `tokens/orbe-cafe/roles.html`), 12 occurrences sur les 4 marques × 2 modes × 2 largeurs, toutes à 5,02. `toFixed(2)` d'une valeur en ,xx5 arrondit vers le bas : 11,655 donne 11,65, 1,545 donne 1,54 (console de `npm run contraste`). Le chiffre de 23 ratios donné d'abord mêlait ce défaut aux écarts voulus entre troncature et arrondi.
4. Contraste : les deux sources (`contrastRatio` de `src/lib/color.js`, `wcagContrast` de culori) donnent le même nombre, bit à bit, sur les 16 777 216 couleurs `#rrggbb`, les 1 248 paires de rôles et 19 705 paires des jetons et fixtures [F]. Les seuils de linéarisation diffèrent (0,03928 et 0,04045) sans qu'aucun octet tombe entre les deux. Seul écart : une entrée qui n'est pas `#rrggbb` (`#fff`, `white`) donne NaN d'un côté, un nombre de l'autre.
5. `esc` : aucune entrée réelle n'envoie `null` ; garder une copie ou l'autre ne change aucune sortie mesurée [F].
6. T2 : les lignes ont bougé depuis la passe. La variante de `controlAfter` (`old` au lieu de `null`) ne change aucune valeur [F]. Les vraies divergences : une décision égale à l'ancienne valeur laisse la ligne pour la simulation, mais la migration la range en « appliquée » ou « en attente » (aucune entrée réelle) ; le script de page ne lit pas une décision écrite sur une ligne qui n'est pas de classe décision (14 lignes réelles avec les fixtures de décisions) [F].
7. Alias : un jeton composite de typo qui renvoie à lui-même donne « taille illisible » au lieu de « alias en boucle » ; les chaînes citées et le « depuis » diffèrent d'une copie à l'autre [F].
8. D3 : le champ `statuts` est lu 5 fois dans `src/` et 3 fois dans les tests, toujours un objet vide ; il part avec ses lectures [F].
9. Q5 : la décision du 15/11 n'avait aucune trace écrite hors de cet attendu ; elle entre dans `docs/decisions.md`.
10. A2 : retirer les captures retire le test « captures isolées » (`test/e2e-reduce.test.js`) ; npm test passe de 742 à 741 tests, son assertion sur `spacing.props` passe dans le test voisin. Perte permise par Quentin.
11. Exports inutiles (question E) : 91 noms dans 30 fichiers au recompte, par une méthode qui ne résout pas l'import par espace de noms de `test/candidats.test.js` [H] ; hors lot.

Réponses du propriétaire (16/11/2026) :
- `fr` : une fonction à paramètres, chaque appelant garde son format ; les deux défauts corrigés (troncature sur la valeur arrondie à 4 décimales, arrondi des ,xx5) ; dans le lot, les copies de module, `ratioFr`, les deux `seuilFr` et les copies en ligne ; hors lot, la copie du script de page et `fr1`. L'harmonisation des formats va dans `KNOWN_ISSUES.md`.
- `esc` : `null` et `undefined` donnent la chaîne vide.
- Contraste : `src/lib/color.js` seule source ; une entrée qui n'est pas `#rrggbb` lève en la nommant.
- Alias : une fonction qui rend la valeur finale ; « en boucle » cite la chaîne depuis le point de départ ; « depuis » nomme le jeton ou le champ de départ ; chaque appelant garde son message de type.
- Décision égale à l'ancienne valeur : elle laisse la ligne partout (`docs/decisions.md`).
- Script de page : il lit la valeur retenue calculée côté Node, limité à l'état initial de la page ; la perte à l'export est d'abord vérifiée dans un navigateur ; si le changement déborde l'état initial, arrêt et passage à un test rouge noté dans `KNOWN_ISSUES.md`.
- Planches : une commande `node src/cli/planche.js <roles|espacements|typo>`, les trois sans argument, mêmes octets, garde commune, sans script npm.
- Retraits : quatre commits, un par retrait. Commits enchaînés, sans fusion.
- `esc` (question Q2, posée à part le 16/11) : la chaîne vide pour `null` et `undefined`.

## Écarts constatés à l'exécution

1. `fr` refuse ce qui n'est pas un nombre, sauf si l'appelant donne `vide` : règle prise par analogie avec la réponse sur le contraste, non tranchée par Quentin [H]. Elle a fait apparaître un « NaN » déjà écrit dans `revue.html` : le contraste « après » d'une décision sans défaut (J1), que `src/reduce/propose.js` retire exprès et que `migration.md` sait omettre. Il s'écrit « — », comme un nombre absent des espacements.
2. Contraste : la vérification `#rrggbb` est posée sur `contrastRatio`, et non sur `relativeLuminance` : `addStates` (`src/rendered/aggregate.js`) passe à `relativeLuminance` un fond survolé semi-transparent (`#5b2a8680`), dont l'alpha est ignoré (`KNOWN_ISSUES.md`). Sur toute la suite, aucun ratio ne reçoit autre chose que `#rrggbb` [F].
3. `retenue` vit dans `src/reduce/propose.js`, à côté de `decisionFor`, et non dans `src/reduce/declarations.js` comme le disait le plan : `declarations.js` importe `decisionFor` de `propose.js`.
4. Script de page (D21) : le changement tient à l'état initial. La flèche, les valeurs des paires contrôlées et du bilan viennent de Node ; une ligne de `collect()` lit l'attribut `data-decidee`, écrit par Node, quand la case reste cochée. Aucune logique d'interaction n'est ajoutée.
5. Tests : la règle de troncature de `test/roles-planche.test.js` portait le même défaut (`Math.floor(n * 100)`) ; elle tronque maintenant la valeur arrondie à 4 décimales. Le test « outcomeOf » de V6 reçoit une ligne témoin : sans conflit entre issues différentes, `attachDeclarations` ne montre aucune issue. Une ligne témoin rend le test rouge avant le code et vert après.
6. Copies en ligne : `review.js` reformate un ΔE capturé dans un motif (`fr(Number(m[1]))`) ; `typo` garde « 2 décimales sans zéros » pour la hauteur d'une ligne (`fr(n, { decimales: 2 })`), au lieu de l'arrondi recopié.
7. Tests : 742 au départ, 37 ajoutés (20 rouges avant le code), 1 retiré (« captures isolées », écart 10 ci-dessus) : 778, tous verts.
8. Vu sur image par Claude le 16/11 : sur les cartes `coul-27` (cible-2c) et `coul-01` (valise), la flèche montre la valeur décidée (#4c6994, #6d675b), mais les vignettes « avant / après » de la même carte montrent toujours la proposition de l'outil (#2b4c7e, #958f84) : la carte dit deux choses. La capture des versions reçoit la proposition (`src/cli/reduce.js:293`). 2 cartes sur les 14 décidées des deux réductions [F] ; 10 ont une vignette égale à la décision, `coul-02` et `coul-16` n'en ont pas. Décision de Quentin du 16/11 : non corrigé dans ce lot, renvoyé au lot du script de la page (C3), noté dans `KNOWN_ISSUES.md`.

## Sorties qui changent

Mesurées sur 7b3ad9c puis à la fin du lot. Les contrôles portent sur 4 marques × 2 modes × 2 largeurs, `npm run espacements`, `npm run typo` et le calibrage des 4 entrées. Les 5 réductions sur fixtures sont : désordre, pièges et proximité sur la valise, puis les pages en désordre avec `decisions-passage-2c.json` et avec `decisions-valise.json`. Deux captures de 7b3ad9c sont identiques, une fois les ports normalisés [F].

| Sortie | Avant | Après |
|---|---|---|
| `tokens/orbe-cafe/roles.html`, `texte.secondaire` sur `fond.composant` | 5,01:1 | 5,02:1 |
| console de `npm run contraste`, Écume et Sel en sombre (large et étroit), `texte.accent` sur `fond.discret` | 11,65:1 | 11,66:1 |
| console de `npm run contraste`, Grenat Papeterie en clair (large et étroit), 3 paires interdites | (1,54:1) | (1,55:1) |
| `revue.html`, pages en désordre avec `decisions-passage-2c.json`, détail de la décision sans défaut (J1) | 4,58 avant → NaN | 4,58 avant → — |
| `revue.html`, les 14 lignes à décision écrite (tableau suivant) | proposition affichée, décision perdue à l'export | décision affichée et exportée |
| `revue.html`, toutes les réductions | — | une ligne de plus dans le script de page (`data-decidee`) |
| `audit.json`, déclaré, pages en désordre | 73 `"properties": {}` | aucun ; le reste identique |
| `npm run typo`, style qui renvoie à lui-même | `taille illisible (px ou rem attendu) : libelle.fontSize` | `alias en boucle : typo.libelle → typo.libelle` |
| `npm run typo`, boucle depuis un style | `alias en boucle : renvoi.b1 → renvoi.b2 → renvoi.b1` | `alias en boucle : typo.libelle → renvoi.b1 → renvoi.b2 → renvoi.b1` |

Les autres sorties ne changent pas [F] :
- consoles d'`espacements` et de `typo` ;
- calibrage ;
- `migration.md`, `modifications.json` et `table.json` des 5 réductions ;
- planches des espacements et de la typo ;
- messages d'alias des rôles et des espacements.

Les 14 lignes de D21. Pour chacune : la flèche de la carte avant et après, et la valeur que l'export rend après. Avant, l'export les perdait toutes (vérifié dans Chromium) :

| Réduction | Ligne | Clé | Classe | Décision écrite | Flèche avant | Flèche après | Export après |
|---|---|---|---|---|---|---|---|
| passage 2c | coul-27 | `colors\|#30548a\|texte` | proche | #4c6994 | #2b4c7e | #4c6994 | #4c6994 |
| passage 2c | coul-24 | `colors\|#d0563f\|plein` | auto | #c8553d | #c8553d | #c8553d | #c8553d |
| passage 2c | coul-02 | `colors\|#1f2a44\|texte` | inchangé | #103060 | — | #103060 | #103060 |
| valise | coul-11, coul-13, coul-30, coul-31, coul-32, coul-33 | `colors\|#9a9a9a\|texte`, `#757575`, `#777777`, `#808080`, `#999999`, `#9e9e9e` | correction | #6d675b | #6d675b | #6d675b | #6d675b |
| valise | coul-23 | `colors\|#cccccc\|bordure` | correction | #958f84 | #958f84 | #958f84 | #958f84 |
| valise | coul-28 | `colors\|#4990e2\|plein` | correction | #2b4c7e | #2b4c7e | #2b4c7e | #2b4c7e |
| valise | coul-37 | `colors\|#ef5c56\|texte` | correction | #cb1d2a | #cb1d2a | #cb1d2a | #cb1d2a |
| valise | coul-01 | `colors\|#999999\|bordure` | proche | #6d675b | #958f84 | #6d675b | #6d675b |
| valise | coul-16 | `colors\|#2196f3` | hors table | #4c6994 | — | #4c6994 | #4c6994 |
