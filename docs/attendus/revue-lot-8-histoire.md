Nettoyage après la revue, lot 8 : traces d'histoire. Ce message est l'attendu. Ouvre la branche revue-lot-8 depuis main (6c7311c), verse-le dans docs/attendus/revue-lot-8-histoire.md, confronte-le au code, propose un plan et attends.

CONTEXTE
Thème T8 de la passe 1b et point 5 de local/revue-code/passe-1c-tests.md. Le lot 7 (gros chantiers) n'est pas fait : ce lot passe avant lui, sur décision de Quentin. Quentin suit de loin : Claude répond aux questions techniques.

CE QUI ENTRE
1. Commentaires de src/ et de test/ : les mentions de lot, d'étape, de séance et de « revue de code » sont retirées. La raison écrite dans le commentaire reste. Quand une décision existe, le commentaire y renvoie (D12, pas « lot K »).
2. Les 14 fichiers de test nommés par leur lot sont renommés par sujet, un pour un, avec les noms proposés au point 5 de la passe 1c. Pas de fusion ni de découpe de fichier dans ce lot : pour lot-j-revue, lot-j-revue-2 et lot-k6-pleins, propose un nom un pour un.
3. test/helpers/lot5.js et les titres de test qui racontent un lot : même traitement.
4. Les identifiants de règles cités dans les sorties (R4, M1, J3...) : une table dans docs/, un identifiant, sa règle en une phrase, où elle est codée. Dis d'abord ce que docs/regles.md contient déjà.

HORS DU LOT
docs/attendus/ et docs/decisions.md : c'est l'histoire écrite, elle reste. Les noms de branches. Tout changement de code.

RÈGLE DU LOT
Aucune ligne de code ne change dans src/, hors commentaires : vérifie-le avec ton script sans-commentaires du lot 3. Dans test/, seuls changent les noms de fichiers, les chemins d'import, les titres et les commentaires. Aucune sortie ne change : les identifiants de règles affichés restent tels quels. Si un nom de lot apparaît dans une sortie, une donnée ou un nom de fichier écrit par l'outil, arrête-toi et dis où.

QUESTIONS DE CONFRONTATION
A. Compte aujourd'hui les mentions par dossier et par forme (lot, étape, séance, revue). Combien portent une raison utile, combien ne sont qu'une étiquette ?
B. Pour 10 commentaires pris au hasard, montre avant et après, pour que le style soit jugé avant de traiter les autres.
C. Table de renommage des fichiers de test, un pour un, et qui cite ces noms ailleurs (docs, KNOWN_ISSUES, attendus, scripts npm, derive-docs.test.js).
D. Les identifiants de règles : liste complète, avec ceux qui apparaissent dans une sortie et ceux qui ne vivent que dans des commentaires. Lesquels n'ont aucune définition écrite ?
E. Y a-t-il un nom de lot dans une sortie ou une donnée ?

MÉTHODE
Un test d'abord, rouge : aucune mention de lot, d'étape ou de séance dans src/ ni dans les noms de fichiers de test. Renommages par git mv, dans un commit à part, pour garder l'historique. Puis les commentaires, dossier par dossier. Les quatre contrôles à 0 et aucun vert perdu avant chaque commit. Commits enchaînés une fois le plan accepté.

DOCUMENTATION
La table des règles dans docs/ ; ARCHITECTURE et README si un nom de fichier cité change ; KNOWN_ISSUES ; l'attendu avec ses écarts.

RÉSULTAT ATTENDU
Le test de garde vert ; src/ identique hors commentaires ; npm test avec le même nombre de tests, tous verts ; les quatre contrôles à 0 ; les sorties des 5 réductions identiques à l'octet à celles de main.

PLAN
D'abord la confrontation, avec A à E. Puis le plan. Attends la réponse.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

1. Point d'arrêt (règle du lot) : des noms de lot, d'étape et de séance sont écrits par l'outil [F]. Dans le code de `src/`, hors commentaires :
   - `src/report/review.js` : 10 lignes de commentaires CSS et JavaScript à l'intérieur des gabarits de la page de revue (`:721`, `:764`, `:766`, `:836`, `:860`, `:869`, `:894`, `:904`, `:911`, `:973`). Ce sont des chaînes pour l'outil : elles sortent telles quelles dans chaque `revue.html` (10 lignes « Lot J », « Lot P, étape 3 », « Lot C », « Lot P-fin » dans chacune des 5 réductions de main).
   - `src/report/consigne.js:265` : « rattaché, rôle à revoir à l'étape 3 », dans `migration.md` et `modifications.json` (3 lignes dans `valise` et `desordre`, 2 dans `pieges`). Fixé par `test/e2e-migration.test.js:391`.
   - `src/report/calibrage.js:237` : « Étape 4, séance a, lot 3 bis. », dans la page de calibrage.
   - `src/report/differences.js:43` : « effet sur les chiffres de l'étape 1 à mesurer », dans le rapport d'audit. Fixé par `test/e2e-audit.test.js:82` et `test/report-unit.test.js:102`.
   - `src/tokens/pleins.js:192` : « (étape 4b, lot 2 bis) », dans le `$description` de `tokens/commun/aplat.tokens.json`.
   - `src/tokens/primitives.js:79` : « séance 3a du 14/11/2026 », dans le `$description` de `tokens/commun/statuts.tokens.json`.
   - `src/valise/generate.js:336` : « générateur visé par contraste (lot G) », nom du générateur écrit dans la valise.
   Dans les données versionnées : `$description` des fichiers de `tokens/commun/` et `tokens/orbe-cafe/` (séance 2b, 3a, 3b, 3c, étape 4, 4b, 4c), recopiées par la saisie dans les fichiers qu'elle écrit ; `$comment` de `fixtures/marque-demo/cible-valise.json` (« séance 2b »), recopié dans chaque `table.json` des réductions ; notes `corrected`, `added`, `status` des attendus `fixtures/marque-demo/expected-*.json` (lot V, lot P-fin, lot M, étape 1 à 3). Les mots « étape » de `src/audit/run.js` et `src/reduce/run.js` (étape navigation, feuilles, mesure, trace) nomment des temps du chargement d'une page, pas l'histoire, et restent [F].
2. Question A : 693 lignes de commentaires portent une mention, dans 553 commentaires et 136 fichiers (474 dans `src/`, 219 dans `test/`) [F] (lexeur, motifs ci-dessous). Par forme, une ligne pouvant en porter plusieurs : lot 618, étape 170, séance 57, revue de code 23 [F]. Classement par motif, relu sur échantillon [H] : 563 étiquettes en tête de phrase suivies de la raison (on retire l'étiquette, la raison reste) ; 119 mentions prises dans la phrase (« avant le lot 3 bis », « comme au lot E », « 48 de l'étape 3 »), à réécrire ; 11 étiquettes seules, sans raison (en-têtes de tests « Lot V, étape 6. Attendus écrits avant le code. », `src/report/consigne.js:277` « Lot I (I6). »). 81 lignes portent déjà un renvoi Dnn [F]. Les 10 lignes de `review.js` du point 1 ne sont pas comptées : ce sont des chaînes.
3. Script « sans-commentaires » du lot 3 : il n'est ni versionné ni dans `local/` ; retrouvé dans le dossier temporaire de la session du lot 3 [F]. Il ne retire que les commentaires de bloc et compare ligne à ligne : insuffisant ici, où les commentaires `//` changent aussi [F]. Remplacé par deux contrôles : un lexeur (`local/revue-lot-8/commentaires.mjs`, chaînes, gabarits, expressions régulières, commentaires), dont le code sans commentaires des 163 fichiers de `src/` et `test/` se compile (`node --check`) avec le même nombre de lignes [F] ; et, indépendant, l'émission de `tsc` avec `removeComments` sur `src/`, à comparer entre main et la branche (sortie 0 sur main) [F].
4. Question C, citations des 14 noms et de `test/helpers/lot5.js` : `ARCHITECTURE.md:137` (`test/lot-s-apply.test.js`) ; 4 imports de `./helpers/lot5.js` (`aplats`, `roles-marque`, `roles-paires`, `roles-semantique`) ; attendus `revue-lot-0-filets.md:19` et `:46`, `revue-lot-1b-pannes-migration.md:47` (sans accents graves), `revue-lot-6-structure.md:41` (`` `test/lot-s-e2e.test.js` ``, entre accents graves) ; aucun dans README, KNOWN_ISSUES, `docs/decisions.md`, `docs/regles.md`, ni dans les scripts npm (motif `test/**/*.test.js`) [F]. Conflit : `test/derive-docs.test.js` lit `docs/**.md`, attendus compris ; après le renommage, `revue-lot-6-structure.md:41` cite un chemin absent et le test passe au rouge, alors que les attendus sont hors du lot [F].
5. Dans `test/`, hors commentaires et titres, les mentions vivent aussi dans des messages d'assertion (« étape 4b, lot 3 : + 4 bordures… », 6 fois), des préfixes de dossiers temporaires (`ds-lab-lot-j1-`, 33 occurrences), une feuille fictive de `lot-s-apply` (`/* Feuille fictive (lot S). */`, donnée du test) et des arguments `local/lot-v` [F]. La règle du lot ne les range pas parmi ce qui peut changer.
6. Question D : `docs/regles.md` définit DS1 à DS11 (règle, raison, contrôle) ; `docs/decisions.md` D01 à D31 [F]. Les autres familles ne sont définies que dans des fixtures ou des commentaires : D1 à D15 et R1 à R18 de l'audit dans `fixtures/marque-demo/expected.json` ; R1 à R9 de la réduction dans l'en-tête de `src/reduce/propose.js` et les `rules` de `expected-desordre-valise.json` et `expected-pieges.json` ; M0 à M7 (sans M2) dans `expected-marque.json` et l'en-tête de `src/brand/brand.js` ; P1 à P4 dans `expected-proximite.json` [F]. Sans définition écrite hors des commentaires de leur lot : C1 à C12, G0 à G8, I1 à I7, J1 à J9, K1 à K6, S1 à S4, R-1 à R-9 (cités : R-1, R-2, R-3, R-8, R-9), et D3, D4 de la gestion des conflits [F]. Collisions : R1 à R9 désignent à la fois des règles de l'audit (rapport d'audit) et de la réduction (revue, migration) ; D4 désigne une convention de l'audit (sortie du rapport), la règle des conflits (commentaires) et D04 de `docs/decisions.md` (sortie de la saisie) ; C5 désigne un cas de `candidats` et un test de `contraste-modes` [F].
7. Identifiants affichés par l'outil [F] : R2, R4, R5, R7, R8, R9 (revue, migration, raison des lignes) ; R1 bis, R3 bis, R5 bis, R6 bis, R15, R17, D2, D4, D7 (rapport d'audit) ; M1, M3, M4, M5, M6, M7 (marque, migration, consigne) ; C5, J1 (raison d'une ligne) ; G5 (erreur de la valise) ; DS1, DS6, D04, D05 (descriptions de jetons) ; P3, C7, C10, C12, J1, J7 dans les seuls commentaires du script de `revue.html` (point 1).

Réponses du propriétaire (16/11/2026) :
- Le style des dix exemples de la confrontation est retenu : l'étiquette part, la raison reste ; « Attendus écrits avant le code » et les identifiants de cas restent ; renvoi à une décision seulement si elle existe.
- Sorties (point 1) : aucune ne change dans les commits 0 à 5, et elles ne vont pas en dette. À la fin du lot, sans code, un tableau avant/après pour chaque texte écrit par l'outil qui porte un lot, une étape ou une séance (les 7 endroits du point 1, les `$description` des jetons, les `$comment` des fixtures) : sortie touchée, lecteur (développeur, designer, personne), texte proposé, tests à l'octet touchés. Quentin tranche sur ce tableau.
- `test/derive-docs.test.js` ignore `docs/attendus/` : exception admise à la règle du lot (une ligne de code dans `test/`).
- Chaînes de `test/` : les 6 messages d'assertion sont traités comme des titres ; les 33 préfixes `ds-lab-lot-…` de `mkdtemp` suivent le nom du fichier ; la feuille fictive « (lot S) » et les arguments `local/lot-v` restent.
- La garde couvre aussi les commentaires et les titres de `test/`.
- D3 et D4 des conflits sont remplacés par la phrase de la règle dans les commentaires.
- Noms `revue-apercu`, `tiers-masques`, `cartes-plein-lignes-certaines` acceptés ; la répartition des sujets entre `revue-apercu` et `tiers-masques` va en dette.
- `docs/identifiants.md` garde les collisions visibles (R1 à R9 en double, D4 en triple, C5). Renommer un identifiant affiché changerait une sortie : hors lot, listé dans le tableau des sorties si besoin.
- Le lexeur est versionné dans `test/helpers/`.
- Plan accepté, commits 0 à 5 enchaînés, sans fusion. Arrêt si l'émission `tsc` sans commentaires diffère ou si une sortie change.
