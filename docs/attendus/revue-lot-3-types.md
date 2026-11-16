Nettoyage après la revue, lot 3 : les types. Ce message est l'attendu. Ouvre la branche revue-lot-3 depuis main (b839712), verse-le dans docs/attendus/revue-lot-3-types.md, confronte-le au code, propose un plan et attends.

CONTEXTE
Les fichiers de src/ portent @ts-check et rien ne les vérifie. La passe 1a (local/revue-code/passe-1a-types.md) a classé 77 erreurs en mode non strict : 0 bogue, 22 causes d'annotation, 3 limites de l'outil. Depuis, les lots 0 à 2 ont changé le code.

CE QUI ENTRE
1. Les quatre blocs JSDoc posés au-dessus de la mauvaise fonction (runReduce, buildMigration, renderMarkdown, renderReview) : chacun sur sa fonction.
2. Les annotations en retard : les 22 causes de la passe 1a, plus celles qui apparaissent une fois les quatre fonctions vérifiées, plus celles nées des lots 0 à 2.
3. Les 3 limites de l'outil : l'en-tête de src/browser/sheets.js reformulé, le tableau versions et la variable school annotés.
4. Une commande npm run types : vérification non stricte de src/, sans rien émettre, avec un tsconfig à la racine. Elle sort en 0.
5. Un test : aucun bloc JSDoc à @param n'est suivi d'un autre bloc JSDoc.

RÈGLE DU LOT
Aucun changement de comportement. Seuls changent des commentaires JSDoc et des annotations. Si une erreur ne se corrige qu'en changeant du code, arrête-toi sur celle-là : dis laquelle, et si c'est un bogue.

QUESTIONS DE CONFRONTATION
A. Combien d'erreurs aujourd'hui, sur main, en non strict ? Combien après avoir recollé les quatre blocs ?
B. Dépendances de développement : typescript et les types de Node seraient les deux premières du dépôt. Quelle version épingler, et la version 7 s'installe-t-elle comme les précédentes ? Dis ce que cela ajoute à node_modules et à package-lock.json.
C. Le mode strict (50 erreurs de plus à la passe 1a, dont culori sans types) : hors de ce lot. Dis seulement ce qu'il coûterait.

MÉTHODE
Le test du point 5 d'abord, rouge. Puis les blocs, puis les annotations, fichier par fichier. npm run types rejoint les contrôles à tenir à 0 avant chaque commit.

DOCUMENTATION
CLAUDE.md (la commande et la règle « à 0 ») ; README et ARCHITECTURE (commande, dépendances de développement) ; KNOWN_ISSUES.md : retirer les lignes des blocs et des annotations, ajouter le mode strict non tenu.

RÉSULTAT ATTENDU
npm run types à 0 ; les trois contrôles à 0 ; npm test entièrement vert ; git diff sur src/ sans ligne de code changée hors annotations.

PLAN
D'abord la confrontation, avec A, B, C. Puis le plan. Attends ma réponse.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

1. Comptes : 89 erreurs non strictes sur main (b839712), et non 77 ; 114 une fois les quatre blocs recollés ; 138 et 148 en strict [F] (TypeScript 7.0.2, réglages de la passe 1a). Les 12 nouvelles viennent des lots 1a (garde.js) et 2 (C14 : enEtat, etats, option etat d'addUsage ; E5 : noDefault ; un appel de plus à addUsage avec index) ; aucune n'a disparu [F]. Les 25 qui naissent du recollage sont des champs absents des types : Row (plein, capture, etats, noDefault, declarations, conflict, conflicts, coupledDeclarations, slot, alternatives), le bloc de buildMigration (witnesses, conflicts, pleins, decisions dans meta) [F].
2. src/cli/garde.js:32, `process.exitCode = (await main()) ?? 0` : TS2322, `void | number` vers `string | number`. Pas un bogue : un void vaut undefined à l'exécution et `?? 0` rend 0 [F] ; TypeScript ne retire pas void par `??`. Une annotation seule ne suffit pas : élargir `main` en `() => number | undefined | …` casse marque.js:65 et verify.js:108 [F]. Seule ligne de code autorisée à changer dans ce lot : conversion JSDoc `/** @type {number} */ ((await main()) ?? 0)`, parenthèses comprises.
3. buildMigration a reçu depuis la revue un bloc court d'une ligne (src/report/migration.js:230) ; le bloc complet le remplace, complété de witnesses et conflicts, qui lui manquent.
4. Installation de la version 7 : le paquet typescript n'est plus qu'un lanceur (2,5 Mo) ; le compilateur est un binaire par plateforme, 20 dépendances facultatives @typescript/typescript-<os>-<cpu>, dont npm n'installe que celle de la machine (26 Mo en darwin-arm64) [F]. La version 6 était un seul paquet JavaScript de 24,3 Mo [F]. Ajout mesuré : 4 paquets, node_modules de 14,7 à 48,2 Mo, package-lock.json de 10 à 33 entrées (+396 lignes) [F]. `npm ci --omit=optional` rendrait tsc inutilisable ; pas d'API JavaScript en version 7.
5. Mode strict, hors lot : 35 erreurs de plus après recollage, dont 17 paramètres sans type, 11 modules sans types (culori 10, pngjs 1 : @types/culori 4.0.1 et @types/pngjs 6.0.5, ou un .d.ts local), 2 variables sans type, 5 null ou undefined possibles, seuls à pouvoir demander une garde dans le code [H].

Réponses du propriétaire (16/11/2026) : garde.js:32, voie (a), la conversion JSDoc avec parenthèses, seule ligne de code changée, notée ici comme écart ; typescript 7.0.2 et @types/node 22.20.5, en version exacte, dans devDependencies ; npm run types entre à l'étape 1 en sortant en 1. Cinq commits enchaînés : cet attendu seul, puis test rouge et outillage, blocs, annotations, documentation. Un champ ajouté à un type reçoit son type réel quand le code le montre ; any seulement si le voisinage est déjà en any ; nombre de any ajoutés donné à la fin. Documentation en plus : ARCHITECTURE (binaire par plateforme, dépendances facultatives, npm ci --omit=optional) ; KNOWN_ISSUES (pas d'API JavaScript en version 7, à vérifier à l'étape 5 pour Knip et dependency-cruiser).
