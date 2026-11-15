Nettoyage après la revue de code, lot 0 : les filets. Ce message est l'attendu. Verse-le tel quel dans docs/attendus/revue-lot-0-filets.md, confronte-le au code, puis propose un plan et attends.

CONTEXTE
La revue de code du 15/11 (lecture seule, rapports dans local/revue-code/) a classé ses constats. Ce lot pose les tests qui manquent avant tout changement de src/. À lire : local/revue-code/passe-1c-tests.md, points 3, 4 et table finale.

RÈGLES DU LOT
- Aucun fichier de src/ modifié. Seuls changent test/, fixtures/ si un test l'exige, docs/ et KNOWN_ISSUES.md.
- Branche revue-lot-0 depuis main (4341b94). Commits sur la branche, poussée ; pas de fusion dans main.
- Un test nouveau qui sort rouge n'est pas un échec du lot : c'est un constat. Ne corrige pas src/, ne le marque ni todo ni skip, ne le commite pas. Donne-le dans le compte rendu avec sa sortie.
- Les trois contrôles restent à 0. npm test ne perd aucun vert.

CE QUI ENTRE
1. Égalité saisie et resolver. Compléter C4 de test/contraste-modes.test.js, ou ajouter un test à côté : pour chacune des quatre marques fictives, en clair et en sombre, le contrat calculé sur la fusion de saisir() est égal au contrat calculé sur loadRoles(dossier, { mode }). Le titre de C4 ne promet plus que ce qu'il vérifie.
2. Valeur retenue après décision. test/decisions-unit.test.js : trois lignes de table écrites à la main, deux décisions ; mapping, outcomeOf, controlAfter et le statut de migration rendent la même issue. Sans navigateur.
3. Vrais lecteurs de jetons. test/espacements.test.js, test/typo.test.js et test/aplats.test.js passent par largeurs() et loadRoles() au lieu de la fusion de test/helpers/jetons.js. Le seuil d'étroit est lu dans les jetons, plus écrit 600 en dur. L'aide reste pour les jeux modifiés exprès.
4. Assertions vides remplacées :
   - test/e2e-reduce.test.js:150 (>= 0) : une valeur calculée qui change sur /page-2.html ;
   - T2 contrat de test/roles-paires.test.js : la liste ordonnée des échelles et quelques valeurs, écrites à la main ;
   - test/lot-v-couplages.test.js et lot-v-conflits.test.js : la page écrit #FFF ou white, pas #ffffff.
5. Tests sautés. Supprimer les 18 (e2e-marque PM1 à PM8, e2e-pieges P1 à P8b, e2e-desordre C1 lot B) avec leurs constantes AFTER_M, TODO, SKIP_TODAY. Garder le saut conditionnel de noms-interdits.
6. E1 lot B de test/e2e-desordre.test.js : retirer todo, corriger sa note qui dit l'inverse de ce qu'on observe.
7. KNOWN_ISSUES.md :
   - retirer la ligne « revue de code prévue après l'étape 4 » ;
   - ajouter une section « Revue de code du 15/11 » : les cinq bogues prouvés (apply et border, panne d'audit rangée en échec de chargement, clé de décision orpheline, couleur de marque illisible rangée en neutre, motif 4,5:1 en dur), les codes de sortie de espacements et typo sur une panne, les quatre blocs JSDoc mal placés, les annotations en retard, la copie figée qui masque un fichier sans jeton. Une ligne chacun, avec le fichier ;
   - ajouter la dette absente : carte peu détachée de la page en mode sombre ;
   - C14 et E5 : écrire leur cause en une phrase chacun.

CE QUI N'ENTRE PAS
Tout test qui prouve un bogue aujourd'hui (clés orphelines, codes de sortie, border, resolveBrand, alias, motif R9). Le renommage des fichiers lot-*. La copie figée.

RÉSULTAT ATTENDU
- npm test : 2 rouges (C14, E5), 0 sauté hors saut conditionnel, 0 à faire. Donne les totaux avant et après.
- git diff --stat main -- src : vide.
- README et ARCHITECTURE touchés seulement si un chemin cité change.

PLAN
Dis d'abord ce que la confrontation au code change à cet attendu : ce qui est faux, ce qui manque, ce qui coûte plus que prévu. Puis le plan, test par test. Attends ma réponse avant d'écrire.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

1. Égalité saisie et resolver : saisir() ne rend pas sa fusion (src/tokens/saisie.js:285-290) ; sans toucher src/, le test la refait à partir des couches rendues par saisir() : il prouve que ces couches, fusionnées ainsi, donnent le contrat du resolver, pas que saisir() utilise cette fusion [F].
2. Valeur retenue : outcomeOf n'est pas exporté (src/reduce/declarations.js:61), lu par attachDeclarations seulement dans un conflit ; controlAfter ne montre la valeur retenue que si la hiérarchie reste inversée ; le statut demande buildMigration entier. En plus : une ligne « inchangé » avec une décision écrite est appliquée par mapping et dite « inchangé » par la migration [F], occurrence réelle [V].
3. Vrais lecteurs : mêmes résultats que l'aide [F] ; test/aplats.test.js:76 partait de loadRoles(Orbe Café) pour les quatre marques ; etroite() perd ses deux appelants, importée par dix fichiers : supprimée.
4. Assertions vides : sur /page-2.html le titre passe de 54 à 56 px [F] ; dans lot-v-conflits, le test visé porte sur #d8d6d2 (raccourci border-bottom), pas sur #ffffff : la feuille écrira #D8D6D2.
5. Tests sautés : P3b today n'est pas sauté et passe, gardé ; les 9 options { todo: TODO } (10 tests afterB) partent avec la constante ; C1 lot B naît du champ lotB du fichier d'attendus, dans une boucle.
6. E1 : la note est le champ lotB de fixtures/marque-demo/expected-desordre.json, dont le $comment demande de signaler un écart sans corriger ; corriger veut dire changer un attendu écrit à la main.
7. KNOWN_ISSUES : la ligne de la revue prévue porte aussi « trois fichiers au-delà de 1 000 lignes ; ni lint ni CI », gardé ; la carte en sombre n'est dans aucun rapport : carte sur page 1,055:1 en sombre contre 1,035:1 en clair [F].
8. Nom du fichier : docs/attendus/LISEZMOI.md imposait etape-<numéro>-<sujet>.md ; ajout de revue-lot-<n>-<sujet>.md.
