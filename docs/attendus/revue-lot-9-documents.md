Lot 9 de la revue : cohérence de la documentation. Ce message fait 59 lignes, de cette ligne à FIN-DU-MESSAGE comprises ; compte-les avec un outil avant de commencer, et arrête-toi si le compte diffère.

L'attendu est ce message : verse-le dans docs/attendus/revue-lot-9-documents.md, confronte-le au dépôt, réponds aux questions Q1 à Q5, puis propose ton plan. Ne modifie rien avant mon accord sur le plan.

## Départ

- main à 9e0ca3c, arbre propre. Branche : revue-lot-9.
- Constats relevés par Claude en lecture seule le 16/11/2026 sur 9e0ca3c. Les numéros de ligne sont ceux de ce commit.

## Règle du lot

- Seuls des fichiers .md changent : README.md, ARCHITECTURE.md, CLAUDE.md, KNOWN_ISSUES.md, docs/*.md, docs/attendus/LISEZMOI.md, plus le nouvel attendu. `git diff --stat main` ne montre rien dans src/, test/, tokens/, fixtures/, package.json.
- Aucune sortie de l'outil ne change. Les trois contrôles et npm run types restent à 0, npm test ne perd aucun vert (821), test/derive-docs.test.js compris.
- Point d'arrêt : si une correction demande de toucher autre chose qu'un .md, ou si un constat ci-dessous est faux, arrête-toi et dis lequel.
- Les décisions (docs/decisions.md) gardent leur histoire et leur numéro : on n'y réécrit que ce qui est nommé ici, et on n'en ajoute aucune.
- Aucune extension de garde dans ce lot (ce serait toucher test/).
- Deux commits : (0) attendu, (1) documentation. Compte rendu : la liste des constats, chacun « corrigé », « faux » ou « laissé, raison ».

## A. Contradictions

A1. ARCHITECTURE.md:140, « Les trois contrôles sortent en 0 ou en 1 » contredit D18, README.md:74 et src/cli/garde.js (0, 1 ou 2). Écrire les trois issues.
A2. CLAUDE.md:28 dit « les quatre contrôles (contraste, espacements, typo, types) » ; README et ARCHITECTURE disent « trois contrôles », types à part, et D26 ne vaut que pour trois. Vocabulaire retenu partout : « les trois contrôles de la cible (contraste, espacements, typo) » et, à part, « npm run types ». La règle de CLAUDE.md reste la même : les quatre commandes à 0 avant chaque commit.
A3. docs/contrat-de-marque.md:17, « lancé par npm run saisie dans les deux modes » : depuis D31 la saisie ne lance plus la commande, elle fait le même calcul (rolesDuResolver, lignesContraste). Le dire ainsi.
A4. docs/decisions.md, D13 : « Trois motifs de refus ». README.md:89 et le contrat en listent davantage (police des titres, D17 ; échelle commune redéfinie, D25). Ne pas réécrire la décision : ajouter à sa conséquence une phrase qui renvoie aux motifs ajoutés par D17 et D25.
A5. docs/decisions.md, D20, conséquence : « dimensionRow (src/reduce/propose.js, C5) ». docs/identifiants.md:22 dit que ce renvoi C5 ne vit plus que dans les attendus. Retirer « C5 » de D20, ou corriger identifiants.md si le renvoi est voulu (voir Q1).
A6. docs/identifiants.md:40, D20 « affichée dans : migration.md, table.json ». Le motif passe aussi dans le « Détail » d'une carte de revue.html (src/report/review.js:361 à 369, plainReason rend tel quel un motif qu'il ne connaît pas). Ajouter revue.html si Q2 le confirme.
A7. ARCHITECTURE.md:93, ligne « Entrée » de la table des couches : cinq cellules pour quatre colonnes, la description de npm run saisie est collée en trop. La retirer (elle est déjà dans la table des commandes).
A8. ARCHITECTURE.md:31, « Chaque commande npm a son point d'entrée dans src/cli/ » : faux pour demo (test/helpers/demo.js), types (tsc) et test. Nommer les exceptions.

## B. État dépassé

B1. KNOWN_ISSUES.md:49, le paragraphe « Corrigés et retirés d'ici » s'arrête au lot 5. Ajouter ce que les lots 6, 8 et 8 bis ont corrigé.
B2. KNOWN_ISSUES.md:72, « à confirmer quand la consigne sera structurée (lot 6) » : le lot 6 est fait, et src/report/migration.js:233 donne toujours r.new à une ligne en attente. Voir Q3, puis écrire la ligne sans renvoi à un lot futur.
B3. KNOWN_ISSUES.md:51 (30 erreurs en strict « à la fin du lot 3 ») et :73 (91 exports « au recompte du lot 4 ») : comptes antérieurs aux lots 4 à 6. Voir Q4.
B4. KNOWN_ISSUES.md:20, « les échelles de primitives.tokens.json » : trois fichiers portent ce nom (tokens/commun/, tokens/orbe-cafe/, la copie figée). Écrire le chemin complet.
B5. ARCHITECTURE.md:100, échelles générées « lues par npm run contraste avec --marque » : depuis D26, sans l'option aussi.
B6. README.md:176, ARCHITECTURE.md:86 et docs/attendus/LISEZMOI.md : « attendus des prochains lots ». Le dossier tient 13 attendus de lots faits. Écrire ce qu'il est : l'attendu de chaque lot, écrit avant le code, gardé à sa date. Ajouter docs/identifiants.md à la ligne docs/ des deux tables.
B7. README.md:173 et ARCHITECTURE.md:80, contenu de tokens/commun/ : cinq fichiers cités sur huit. Manquent le mode sombre commun, la police du produit, l'aplat. README : ajouter aussi config/ à la table « Dépôt ».
B8. Traces d'histoire dans les pages lues par un nouveau venu. README.md : titres « Étape 3 : nommer les rôles » et « Étape 4 : saisir une marque » (deviennent « Nommer les rôles », « Saisir une marque »), « (lot 2 de l'étape 4) » ligne 175, « (étape 4c) » ligne 178, « lot V » ligne 181. ARCHITECTURE.md : « (revue de code, lot 4) » ligne 54, « (revue de code, lot 3) » ligne 156. Les retirer ; vérifier qu'aucun lien ne vise les ancres des deux titres. KNOWN_ISSUES.md et docs/decisions.md gardent leurs mentions : c'est leur rôle.

## C. Manques

C1. CLAUDE.md, sous les commandes : les trois contrôles prennent --marque <dossier> ; sans l'option, ils jugent chaque marque de tokens/ et sortent en 1 si une seule échoue (D26). Aucune commande n'a de marque par défaut.
C2. CLAUDE.md, dans « Règles », trois lignes pour les gardes qu'un agent casse en écrivant, chacune avec son test : aucun nom de marque dans le code de src/ (test/marque-en-dur.test.js, D26) ; aucun numéro de lot, d'étape ou de séance dans les commentaires, les titres de tests, les noms de fichiers de test ni les textes que l'outil écrit (test/histoire.test.js) ; src/cli/ n'est importé par aucun module de src/ (test/couches.test.js). CLAUDE.md reste sous 50 lignes.
C3. CLAUDE.md, « Quand lire quoi » : ajouter docs/identifiants.md (avant de citer ou de créer un identifiant de règle) et docs/contrat-de-marque.md (avant de toucher à la saisie ou à un motif de refus).
C4. README.md:33 et :34 : l'option --etroit <fichier> de npm run espacements et de npm run typo n'est pas documentée (src/cli/espacements.js:23, src/cli/typo.js:22).
C5. docs/contrat-de-marque.md : la colonne « Refusé à la saisie » ignore l'échelle commune redéfinie (D25) et le fichier de police que le navigateur refuse de charger ; la colonne « Entré par le client » ignore la forme { "echelle": nom } (README.md:92). Les ajouter, en une page toujours.

## Questions de confrontation

Q1. Le « C5 » de D20 désigne-t-il le cas de test/candidats.test.js ou l'ancien renvoi du motif d'égalité ? Selon la réponse, A5 se corrige dans decisions.md ou dans identifiants.md.
Q2. Le texte « (D20) » paraît-il dans revue.html d'une réduction de fixtures qui a une égalité ? Montre la ligne.
Q3. Une ligne « en attente » de migration.md porte-t-elle encore la proposition en nouvelle valeur après le lot 6 ? Si oui, est-ce une dette ou le comportement voulu (R5 : rien n'est appliqué) ?
Q4. Recompte, sans rien modifier : erreurs de `npx tsc -p tsconfig.json --strict`, et exports jamais importés par la méthode du lot 4. Si un recompte n'est pas possible à l'identique, dis-le : la ligne gardera son compte et sa date.
Q5. README.md:19, « 90 lignes, dont 35 déjà sur la cible ; 55 qui changent ; 27 tranchées (15 d'office, 10 corrections, 2 hors table) ; 14 proches ; 14 décisions » : ces nombres sont-ils ceux de la réduction valise sur 9e0ca3c ? Claude ne les a pas relancés.

Autre chose que tu vois se contredire entre ces huit documents et le code, et qui n'est pas dans cette liste : dis-le dans la confrontation, sans le corriger.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

1. Départ : main à 9e0ca3c, arbre propre ; `npm test` 821 tests, 821 verts ; contraste, espacements, typo et types à 0 [F].
2. Q1 : le « C5 » de D20 désigne le cas C5 de `test/candidats.test.js`. Au commit de D20 (18ea832), C5 marquait la règle du défaut de `dimensionRow` (commentaire « C5 : le défaut est le pas le plus proche de toute l'échelle », `src/reduce/propose.js:211`), et l'attendu du lot 2 l'appelait « C5 de dimensionRow » [F] ; ce commentaire existe toujours (`src/reduce/propose.js:226`) [F]. Renvoi voulu [H] : A5 se corrige dans `docs/identifiants.md`. D31 cite aussi « (C5) » pour `test/contraste-modes.test.js`, que `docs/identifiants.md:21` ne nomme pas [F].
3. Q2 et A6 : constat faux. Sur les six réductions de fixtures relancées sur 9e0ca3c, « (D20) » paraît 0 fois dans chaque `revue.html` (18 fois dans `migration.md` et 6 fois dans `table.json` des pages en désordre) [F]. `plainReason` connaît le motif d'égalité (`src/report/review.js:271`) : il le réécrit, « cette valeur est à égale distance de 2px et de 4px : l'outil ne choisit pas, à toi de trancher », et ne garde en fin de motif que les identifiants R et M [F]. L'erreur est celle de Claude au relevé : la règle de `src/report/review.js:271` n'avait pas été lue. A6 est retiré du lot.
4. Q3 : une ligne « en attente » de `migration.md` porte la proposition de l'outil dans la colonne « proposé » (« aucun défaut » pour une égalité), sous la phrase de R5 (`src/report/migration.js:449` à `:453`) [F]. Rien ne l'applique : la consigne dit « ne l'applique pas » sans écrire la valeur (`src/report/consigne.js:251`), `modifications.json` ne pose sur ses déclarations qu'un commentaire (`src/report/modifications.js:153`) [F]. Comportement voulu (R5), pas une dette.
5. Q4 : `npx tsc -p tsconfig.json --strict` donne 30 erreurs sur 9e0ca3c, même répartition qu'à la fin du lot 3 : 11 TS7006, 11 TS7016 (culori 10, pngjs 1), 2 variables sans type (TS7034, TS7005), 6 `null` ou `undefined` possibles [F]. Exports : la méthode du recompte du lot 4 n'est écrite nulle part ; la méthode de la passe 0 de la revue résout l'import par espace de noms, ce n'est donc pas elle. Pas de recompte à l'identique : la ligne garde son compte et sa date.
6. Q5 : réduction des pages en désordre avec `fixtures/marque-demo/cible-valise.json` et le resolver d'Orbe Café, sur 9e0ca3c : 90 lignes, 35 inchangées, 15 auto, 10 corrections, 2 hors table, 14 proches, 14 décisions [F]. README.md:19 est juste.
7. B4 : les 12 échecs de `checkValise` se comptent sur la valise `fixtures/marque-demo/cible-valise.json` [F] ; ses 72 pas sont identiques à ceux de `tokens/commun/primitives.tokens.json` (neutre, erreur, succès) et de `tokens/orbe-cafe/primitives.tokens.json` (bleu, terre, sable) [F]. Aucun des trois fichiers nommés `primitives.tokens.json` ne donne seul 12 échecs : la ligne nomme la valise et les deux chemins.
8. B1 : depuis le lot 5, une seule ligne a quitté `KNOWN_ISSUES.md` (l'exception de D18, lot 6) ; les lots 8 et 8 bis n'en ont retiré aucune [F]. Le paragraphe « Corrigés et retirés » nomme ce que ces lots ont corrigé, d'après D25 à D31 et leurs attendus.
9. A8 : ARCHITECTURE.md:37 dit la même chose que la ligne 31 (« un fichier par commande npm ») ; corrigée avec elle.
10. Contradictions relevées hors de la liste : README.md:31 (résumé de la saisie sans mode sombre ni resolver) ; CLAUDE.md:14 (contraste, sortie 1 sans l'échelle commune redéfinie) ; ARCHITECTURE.md:83 (« d'avant l'étape 4b ») ; KNOWN_ISSUES.md:71 (renvoi au lot du script de la page) ; D23 (« les trois contrôles »).

Décisions de Quentin (16/11/2026) : A6 retiré du lot ; A5 dans `docs/identifiants.md` (lignes 20 et 21, et 22 si elle en devient fausse), D20 inchangée ; A8 étendu à ARCHITECTURE.md:37 ; B2 : ligne 72 retirée et nommée dans « Corrigés et retirés » comme comportement voulu (R5), avec `src/report/consigne.js` et `src/report/modifications.js` en preuve ; B3 : ligne 51 recomptée, ligne 73 garde son compte et sa date et dit que la méthode n'est pas écrite ; B4 : la valise et les deux chemins ; A2 : README.md:74 et ARCHITECTURE.md alignés. Hors liste : README.md:31 corrigé (mode sombre et resolver) ; CLAUDE.md:14, ARCHITECTURE.md:83, KNOWN_ISSUES.md:71 et D23 laissés. Les deux commits s'enchaînent ; pas de fusion avant vérification.
