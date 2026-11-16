Étape 5, lot 5a : une CI qui rejoue ce qu'on tient à la main. Ce message fait 50 lignes, de cette ligne à FIN-DU-MESSAGE comprises ; compte-les avec un outil avant de commencer, et arrête-toi si le compte diffère.

L'attendu est ce message : verse-le dans docs/attendus/etape-5a-ci.md, confronte-le au dépôt, réponds aux questions Q1 à Q6, puis propose ton plan. Ne modifie rien d'autre avant mon accord sur le plan.

## Départ

- main à 6add7e0, arbre propre. Branche : etape-5a.
- Aucune CI : pas de dossier .github/. Les quatre commandes et npm test ne tournent que sur le Mac de Quentin.
- Dépôt public QuentinChapelain/ds-lab.

## But

À chaque push, GitHub rejoue sur une machine neuve ce que CLAUDE.md demande avant un commit : npm run types, les trois contrôles de la cible, npm test avec Chromium. Le lot dit aussi, preuve à l'appui, ce qui ne tenait que parce que c'était le Mac.

## Ce qui entre

1. Un seul fichier de workflow, .github/workflows/ci.yml, un seul job, des étapes dans cet ordre : checkout, Node, npm ci, Chromium, npm run types, npm run contraste, npm run espacements, npm run typo, npm test. Chaque commande a son étape : la ligne rouge dit laquelle a échoué.
2. Déclencheurs : push sur toute branche, et workflow_dispatch. Pas de pull_request en plus : une PR d'une branche du dépôt montre déjà l'exécution du push.
3. Réglages : ubuntu-24.04 épinglé (pas ubuntu-latest) ; Node 22, la borne basse de engines ; cache npm de setup-node ; permissions contents: read ; timeout-minutes 15 ; concurrency qui annule l'exécution précédente de la même branche ; aucun secret.
4. Chromium installé par le playwright-core du dépôt (sa commande install avec les dépendances système), pas par un paquet de plus. Pas de cache du navigateur dans ce lot.
5. Documentation : README (une section courte sur la CI et ce qu'elle rejoue), ARCHITECTURE.md (un invariant, avec le fichier de workflow en preuve), KNOWN_ISSUES.md (« ni lint ni CI » devient « pas de lint » ; plus toute limite trouvée par ce lot), CLAUDE.md seulement si une règle de travail change.

## Règle du lot

- Aucun fichier de src/, tokens/ ni fixtures/ ne change. Aucune dépendance ajoutée, package.json et package-lock.json inchangés.
- Aucun test n'est modifié, sauté ni retiré pour faire passer la CI.
- Point d'arrêt : si une étape échoue sur le runner alors qu'elle passe sur le Mac, arrête-toi. Donne l'étape, le test, le message, et la cause si tu la vois (police système absente, rendu, chemin, fuseau, locale, vitesse). Ne corrige pas : c'est une décision, et peut-être un lot.
- Point d'arrêt : si une étape passe sur le runner pour une mauvaise raison (test sauté, commande qui ne lit rien), dis-le de la même façon.
- Un commentaire du workflow dit sa raison, pas son histoire : aucun numéro de lot ni d'étape dans ci.yml.

## Preuve attendue

- L'adresse d'une exécution verte sur la branche etape-5a, et pour chaque étape sa durée.
- Le compte de tests du runner comparé à celui du Mac (821 verts), avec chaque test sauté nommé et sa raison.
- Une exécution rouge voulue, puis annulée : une paire de contraste cassée sur une branche jetable (etape-5a-rouge, jamais fusionnée, supprimée ensuite), pour voir que la CI refuse bien et que la ligne rouge nomme la marque et la paire. Donne l'adresse de cette exécution.

## Questions de confrontation

Q1. Comment Chromium est-il installé sur le Mac aujourd'hui, et à quelle version ? La commande install de playwright-core 1.59.1 accepte-t-elle --with-deps chromium, et installe-t-elle la variante que chromium.launch() lance par défaut ?
Q2. Durée de npm test sur le Mac, et part des fichiers qui lancent un navigateur (Claude en compte 22 sur 91 par recherche de texte, à confirmer).
Q3. test/noms-interdits.test.js saute ses deux tests quand local/noms-interdits.txt est absent : sur le runner il le sera toujours. Confirme le compte attendu en CI (819 verts et 2 sautés ?). Y a-t-il d'autres tests qui dépendent de local/, de .auth/ ou d'un état du Mac ?
Q4. Quels tests dépendent d'une police du système par le rendu (Georgia d'Orbe Café, system-ui du produit) et pas seulement par son nom dans un jeton ? Lesquels comparent des pixels ou des mesures d'encre qui changeraient avec une police de repli ?
Q5. package-lock.json liste le binaire TypeScript de chaque plateforme (60 entrées @typescript/typescript-*, dont linux-x64) : npm ci sur le runner installe-t-il bien celui de Linux, sans option ?
Q6. Versions majeures courantes de actions/checkout et de actions/setup-node à la date du jour, vérifiées à la source. Dis si tu recommandes de les épingler par empreinte de commit plutôt que par étiquette, et pourquoi.

## Commits

(0) attendu ; (1) workflow ; (2) documentation, après l'exécution verte. Pousse la branche pour déclencher la CI. Ne fusionne pas : Claude vérifie d'abord.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

1. Départ : main à 6add7e0, arbre propre, pas de `.github/` ; `npm test` 821 tests, 821 verts, en 101 à 102 s sur le Mac [F].
2. Q1 : Chromium est installé sur le Mac dans `~/Library/Caches/ms-playwright/` depuis le 27/04/2026 : `chromium-1217` (Chrome for Testing 147.0.7727.15) et `chromium_headless_shell-1217` [F]. `install` de playwright-core 1.59.1 accepte `--with-deps chromium`, et `--only-shell` [F]. `chromium.launch()` sans option lance `chromium-headless-shell` (`node_modules/playwright-core/lib/server/chromium/chromium.js:326`) [F] ; les seuls lancements avec fenêtre sont `reduce --live` et `login`, qu'aucun test ne lance [F]. La CI installe donc la seule variante sans fenêtre (`--only-shell`).
3. Q2, erreur de Claude : l'attendu compte 22 fichiers de test qui lancent un navigateur, par recherche de texte. Mesure par interception de `chromium.launch` dans chaque processus, sous-processus compris : 36 fichiers sur 91, 98 lancements [F]. La recherche de texte manque les lancements indirects (`runReduce`, `runAudit`, encre de la saisie).
4. Q3 : seul `test/noms-interdits.test.js` peut sauter des tests ; attendu en CI : 821 tests, 819 verts, 2 sautés [H]. Aucun autre test ne lit `local/` ni `.auth/` ; seul ce test appelle `git` [F]. Sur le Mac, `TZ=UTC LC_ALL=C.UTF-8` donne 821 verts sur 821 : ni le fuseau ni la locale ne sont des dépendances du Mac [F].
5. Erreur de Claude : l'attendu suppose que le Mac tourne sous la borne basse de `engines`. Il tourne sous Node 25.6.1 [F] ; la CI tourne sous Node 22. L'écart est inscrit dans `KNOWN_ISSUES.md` ; un seul job en Node 22, pas de matrice.
6. Q4 : l'image ubuntu-24.04 n'a pas Georgia [F, liste des paquets de l'image 20261111.370.1]. Tests exposés : `test/typo-planche.test.js`, « hero sur deux lignes » (hauteur réelle du hero dans la police des titres d'Orbe Café) [H] ; `test/police-encre.test.js` (E3, encre de Chromium contre fontTools à 0,002 em, polices de `fixtures/polices/`, tracé FreeType au lieu de CoreText) [H] ; saisie avec fichiers de police (même mesure, marges plus larges) [H]. Les comparaisons de pixels se font dans une même exécution, et `fixtures/` ne porte aucune image de référence [F].
7. Q5, erreur de Claude : `package-lock.json` liste 20 entrées `@typescript/typescript-*`, pas 60 [F]. `linux-x64` y est, `os: linux`, `cpu: x64`, `optional: true` [F] ; `npm ci` installe le paquet facultatif de la plateforme courante [H], vérifié par l'étape `npm run types` du runner.
8. Q6 : versions courantes au 16/11/2026, API GitHub : `actions/checkout` v7.0.1 (`3d3c42e5aac5ba805825da76410c181273ba90b1`, aussi pointé par `v7`), `actions/setup-node` v7.1.0 (`949feb2413d6458794dcd2491c4babbbce0c15c1`, aussi pointé par `v7`) [F]. Épinglées par empreinte, étiquette en commentaire : une étiquette se déplace sans trace dans ce dépôt.

Décisions de Quentin (16/11/2026) : `--only-shell` ; empreintes avec l'étiquette en commentaire (relues sur GitHub par Claude : justes) ; `persist-credentials: false`. Un seul job en Node 22, pas de matrice ; écart avec le Mac dans `KNOWN_ISSUES.md`. Rouge voulu : sur `etape-5a-rouge`, seul change le pas 11 d'Écume et Sel ; rien n'en revient dans `etape-5a`. `CLAUDE.md` : la règle « avant chaque commit » dit que la CI rejoue ces commandes à chaque push sans remplacer le lancement local. Rouge sur le hero ou sur l'encre : arrêt, valeurs du runner à côté de celles du Mac.

## Écarts constatés à l'exécution

1. Première exécution sur `etape-5a` (26d4f99, exécution 43959932055) : rouge sur `npm test`, 3 tests en échec sur le runner, 0 sur le Mac [F]. Point d'arrêt : l'anneau de focus du navigateur (`#101010` sous Linux, `#005fcc` sous macOS) et deux tests d'encre (E3, E4 : bornes de `measureText` arrondies vers l'extérieur sous Linux). Le hero sur deux lignes, craint en Q4, passe sur le runner [F].
2. Deux diagnostics sur branches jetables, autorisés puis supprimés (`etape-5a-diag`, exécution 43962290379 ; `etape-5a-diag-2`, exécution 43964073175), puis le lot 5b (`docs/attendus/etape-5b-plateforme.md`, D32) sur cette branche : encre lue dans les pixels, facteur de taille calculé depuis le fichier, anneau reconnu par sa nature.
3. Compte de tests en CI : 822, 820 verts, 2 sautés, au lieu de 821, 819 et 2 : le lot 5b a ajouté E6 [F].
4. Node du runner : 22.23.4 [F].
5. Documentation : `test/derive-docs.test.js` lisait les noms des actions écrits entre accents graves comme des chemins du dépôt ; ils sont écrits en clair dans `KNOWN_ISSUES.md` [F].

## Sorties

- CI verte sur d1384d5 (exécution https://github.com/QuentinChapelain/ds-lab/actions/runs/43969395529) : 822 tests, 820 verts, 2 sautés (`test/noms-interdits.test.js`, « local/noms-interdits.txt absent ou vide ») [F]. Durées : checkout 5 s, Node 7 s, `npm ci` 2 s (cache npm), Chromium et dépendances 29 s, `npm run types` < 1 s, contraste < 1 s, espacements 1 s, typo < 1 s, `npm test` 243 s [F].
- Rouge voulu (exécution https://github.com/QuentinChapelain/ds-lab/actions/runs/43970687764, branche `etape-5a-rouge` depuis d1384d5, pas 11 du primaire d'Écume et Sel en `#cccccc`, seul changement, supprimée ensuite en local et sur GitHub, jamais fusionnée) : étape rouge `npm run contraste`, sortie 1 ; `npm run espacements`, `npm run typo` et `npm test` n'ont pas tourné (skipped) [F]. La ligne rouge nomme la marque et les paires : « marque Écume et Sel (tokens/ecume-et-sel/) », « 70 paires de rôles, 17 paires en échec », dont « ✗ texte.interactif sur fond.app : 1,55:1, seuil 4,50:1 », « ✗ bordure.focus sur fond.composant : 1,44:1, seuil 3,00:1 », « ✗ texte.marque.grand sur fond.marque.discret : 1,44:1, seuil 3,00:1 » ; les trois autres marques : 0 paire en échec [F].
