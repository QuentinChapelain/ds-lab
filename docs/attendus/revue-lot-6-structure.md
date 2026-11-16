Nettoyage après la revue, lot 6 : structure moyenne. Ce message est l'attendu. Ouvre la branche revue-lot-6 depuis main (b7c6522), verse-le dans docs/attendus/revue-lot-6-structure.md, confronte-le au code, propose un plan et attends.

CONTEXTE
Thèmes T3 et T7 et constat D7 de la passe 1b (local/revue-code/passe-1b-synthese.md, zones B, C, D). Les lots 0 à 5 ont changé le code : relis chaque constat avant de t'y fier. Quentin suit de loin : Claude répond aux questions techniques.

CE QUI ENTRE
1. T3 : modifications.json n'est plus reconstruit en relisant la prose. Une consigne structurée, dans src/report/, est lue par migration.md et par modifications.json.
2. T7 : runReduce sort de src/cli/. Dis où vont aussi couplingsOf et les fonctions de reduce rangées dans src/browser/trace.js, si le déplacement est simple.
3. D7 : dans la saisie, une seule fusion de contexte de marque, la même que celle du resolver. La saisie écrit ses fichiers à côté, contrôle, puis remplace : une panne ou un refus ne laisse rien d'écrit. Plus de sous-processus pour relancer contraste.
4. L'exception écrite dans D18 (le contrôle relancé après écriture) est retirée de la décision si le point 3 la ferme.

HORS DU LOT
Le code de page partagé, la découpe de propose.js, le script de la revue et les vignettes d'une carte décidée (lot 7). L'agrégat d'audit qui calcule les usages de reduce, s'il demande plus qu'un déplacement.

RÈGLE DU LOT
Aucune sortie ne change : migration.md, modifications.json, table.json, revue.html des réductions sur fixtures, et les fichiers écrits par la saisie des 4 marques, identiques à l'octet avant et après. Seule exception admise : ce que la saisie laisse sur le disque après une panne ou un refus. Si une autre sortie change, arrête-toi et dis laquelle.

QUESTIONS DE CONFRONTATION
A. T3 : comment modifications.json est-il fabriqué aujourd'hui, ligne par ligne ? Quelles phrases de migration.md, si on les changeait, casseraient le fichier ? Montre-le sur un essai.
B. T7 : pour chaque fonction à déplacer, d'où vers où, et qui l'importe. Y a-t-il un risque d'import circulaire ?
C. D7 : en quoi la fusion à la main de la saisie diffère-t-elle de celle du resolver ? Sur les 4 marques, donnent-elles le même résultat ? Que reste-t-il sur le disque aujourd'hui après un refus, et après une panne ?
D. Quels tests protègent chaque point, lesquels manquent. Lesquels peuvent être écrits sans navigateur.
E. Ce que tu laisserais hors du lot, et pourquoi.

MÉTHODE
Capture d'abord toutes les sorties de la règle du lot sur main, pour la comparaison finale. Tests d'abord, rouges là où un défaut existe (phrase changée qui casse modifications.json, fichiers laissés après une panne). Un point par commit. Les quatre contrôles à 0 et aucun vert perdu avant chaque commit. Commits enchaînés une fois le plan accepté.

DOCUMENTATION
ARCHITECTURE (où vivent runReduce, la consigne, la fusion) ; docs/decisions.md (D18 retouchée, décisions nouvelles si besoin) ; KNOWN_ISSUES ; l'attendu avec ses écarts.

RÉSULTAT ATTENDU
Les sorties de la règle du lot identiques à l'octet ; la saisie ne laisse rien après une panne ou un refus ; les quatre contrôles à 0 ; npm test entièrement vert.

PLAN
D'abord la confrontation, avec A à E. Puis le plan. Attends la réponse.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

1. Point 1 : `modifications.json` relit la prose dans trois sections de la consigne, pas toute la consigne : `CHANGE AUSSI`, `SIGNALE SANS MODIFIER`, `VÉRIFICATION`, plus un remplacement de phrase (« Les déclarations de CONFLITS ») (`src/apply/modifications.js:206-210`). `NE TOUCHE PAS` n'est pas relu : il est réécrit à la main, en seconde copie des phrases de `agentBrief` (`:184`) [F]. Essai sur la réduction `desordre` (copie de `src/` dans `local/revue-lot-6/essai/`) : titre `CHANGE AUSSI` renommé → `brief.changeAussi` vide, sans erreur ; ligne vide ajoutée dans `SIGNALE SANS MODIFIER` → 4 entrées au lieu de 5, sans erreur ; phrase de `VÉRIFICATION` reformulée → le remplacement ne se fait plus, `reste.md` renverrait à une section CONFLITS qu'il n'a pas [F]. Seul ce dernier cas est vu par un test (`test/lot-s-e2e.test.js`, S4, avec Chromium).
2. Point 2 : les « fonctions de reduce rangées dans `src/browser/trace.js` » sont `unitOf` et `declarationId`. `unitOf` se déplace simplement ; `declarationId` est lue aussi par `src/browser/simulate.js`, et la ranger dans `src/reduce/declarations.js` créerait un import circulaire (`declarations.js` importe `scanInPage` de `simulate.js`) [F].
3. Point 3 : sur les 4 marques, la fusion à la main de la saisie et celle du resolver donnent les mêmes rôles (51) et le même contrat, en clair et en sombre [F]. Elles diffèrent par l'ordre : la saisie pose les échelles de la marque après la couche marque et, en sombre, après `tokens/commun/mode.sombre.tokens.json` ; le resolver les pose avant. Sur une marque construite dont `primitives.tokens.json` redéfinit `neutre` (valeur claire commune), la saisie refuse 18 paires en sombre, le resolver n'en trouve aucune en échec [F]. `test/contraste-modes.test.js` (C5) recopie la recette de la saisie et le dit : il ne prouve pas ce que fait `saisir()`.
4. Point 3 : aujourd'hui, un refus n'écrit rien [F] (`test/saisie.test.js` S6, `test/pannes.test.js` N7). Une panne pendant l'écriture laisse un mélange : essai sur une copie d'Écume et Sel, primaire changée, `marque.resolver.json` en lecture seule → sortie 2, quatre fichiers réécrits, le resolver ancien [F]. Le contrôle relancé après écriture (`src/cli/saisie.js:70`) laisse, s'il échoue, tous les fichiers écrits (D18, exception).

Réponses du propriétaire (16/11/2026) :
- Plan accepté, quatre commits ; déplacements de B acceptés, `declarationId` reste dans `src/browser/trace.js`, l'argument `target` jamais lu est retiré.
- Marque qui redéfinit une échelle commune (décision de Quentin) : interdite, pas notée en dette. La saisie la refuse (sortie 1), le motif nomme l'échelle ; même contrôle lu par `contraste` si c'est simple ; test rouge d'abord ; dans `docs/decisions.md`, à la suite de D25. La marque construite de l'essai C reste refusée, pour ce motif seulement : seul changement de verdict admis.
- Écriture en quatre temps acceptée ; le test de panne couvre « échelle générée devenue échelle nommée » : `echelles.tokens.json` n'est supprimé qu'au remplacement final.
- Sorties des 5 réductions et de la saisie des 4 marques identiques à l'octet à `local/revue-lot-6/avant/`, console de la saisie comprise. Commits enchaînés, pas de fusion.

## Écarts constatés à l'exécution

1. Point 2 : `runReduce` lisait `lireJson` dans `src/cli/garde.js`. Pour que `src/reduce/run.js` n'importe rien de `src/cli/`, `lireJson` et `premiereLigne` passent dans `src/lib/fichiers.js` ; cinq commandes changent d'import [F].
2. Point 2 : `src/reduce/pleins.js` avait déjà une copie identique de `mapped` ; une seule définition reste, exportée [F]. Point 1 : `hasToken` et le repli `var(--jeton, valeur)` étaient écrits deux fois (`migration.js`, `modifications.js`) ; une seule définition, dans `src/report/consigne.js` [F].
3. Point 2 : `test/couches.test.js` ne garde que `src/cli/reduce.js` du côté des tests : `test/login.test.js` lit `saveState` et `readState` dans `src/cli/login.js`, hors du lot (`KNOWN_ISSUES.md`) [F].
4. Point 3 : `test/pannes.test.js` N10 testait l'exception de D18 (« fichiers écrits » après un contrôle final en échec) ; il est tombé au commit 3, comme attendu, et a été réécrit : contrôle final forcé en panne ou en incohérence, sortie 2, rien d'écrit [F].
5. Règle des échelles communes : le contrôle vit à un seul endroit (`echellesCommunesRedefinies`, `motifRedefinies`, `src/tokens/saisie.js`), lu par la saisie (refus, sortie 1) et par `contraste` (échec, sortie 1). Dans `contraste`, il passe après la lecture du resolver : un contexte inconnu sort toujours en 2. Entré comme suite de D25, sans nouveau numéro [F].
6. Tests rouges avant le code [F] : `test/consigne-unit.test.js` (module `src/report/modifications.js` absent) ; `test/couches.test.js` L1 (28 imports de `runReduce` ou `linesOf` depuis `src/cli/reduce.js`) et L3 (module absent) ; `test/saisie-ecriture.test.js` W1 (18 motifs de contraste au lieu d'un), W2 (`contraste` sort en 0), W3 (quatre fichiers réécrits), W4 (`echelles.tokens.json` supprimé), W5 (module absent), W6 (`child_process` importé) ; `test/contraste-modes.test.js` C5 (`saisir()` ne rendait pas ses contrats). Sorties gardées dans `local/revue-lot-6/rouge-*.txt`.

## Sorties

Comparées à `local/revue-lot-6/avant/` (main, b7c6522) après chacun des trois commits de code : 0 fichier différent sur 45 (20 pour les réductions : 4 sorties × 5 réductions sur fixtures ; 25 pour la saisie : fichiers de jetons et resolver de chacune des 4 marques, sa console, et l'état git de `tokens/`, vide) [F]. `npm run contraste` identique à main sans option, `--mode sombre`, `--largeur etroit`, les deux, et `--marque tokens/orbe-cafe/ --mode sombre` [F]. Seul changement de verdict : la marque construite de l'essai C, refusée pour « primitives.tokens.json : échelle commune redéfinie, neutre » au lieu de 18 paires en sombre.
