Étape 5, lot 5d : deux lancements, la même sortie. Ce message fait 42 lignes, de cette ligne à FIN-DU-MESSAGE comprises ; compte-les avec un outil avant de commencer, et arrête-toi si le compte diffère.

L'attendu est ce message : verse-le dans docs/attendus/etape-5d-determinisme.md, confronte-le au code, réponds aux questions Q1 à Q5 avec des mesures, puis propose ton plan. Ne modifie rien d'autre avant mon accord. Vérifie node -v avant toute commande (Node 24, .node-version).

## Départ

- main à d40de41, CI verte. Branche : etape-5d.
- Dette inscrite dans KNOWN_ISSUES.md : l'ordre des feuilles de audit.json (numéros de feuille, ordre de certaines clés) varie d'un lancement à l'autre, même sur une page ; deux images base64 de revue.html changent entre deux captures du même code (réduction de la page de marque).

## But

Sur une même entrée et une même machine, chaque sortie de l'outil est identique à l'octet d'un lancement à l'autre, sans neutralisation. Ce qui ne peut pas l'être est nommé, avec sa cause.

## Ce qui entre

1. Audit : un ordre des feuilles défini par une règle, pas par l'arrivée des réponses. La règle se lit dans les données (ordre des pages données, puis ordre des feuilles dans le document), pas dans l'horloge.
2. Captures : la cause des images qui varient est trouvée ; si elle est dans notre code (animation, transition, curseur, police pas encore chargée, attente), elle est corrigée ; si elle est dans le navigateur, elle est inscrite en dette avec sa preuve.
3. Un test par sortie rendue stable : deux lancements, comparaison à l'octet.
4. Le script de capture de local/ n'a plus besoin de neutraliser ce qui est corrigé ; dis ce qui reste neutralisé (chemin, port) et pourquoi.
5. Documentation : KNOWN_ISSUES.md (lignes fermées ou réécrites), ARCHITECTURE.md (un invariant avec son test), une décision dans docs/decisions.md si la règle d'ordre en est une.

## Règle du lot

- Le contenu des sorties ne change pas : mêmes feuilles, mêmes valeurs, mêmes comptes. Seul l'ordre devient stable. Si un compte ou une valeur change, arrête-toi.
- Les sorties des réductions de fixtures, de la saisie et des contrôles restent identiques à l'octet, hors ce que le lot stabilise.
- Tests rouges d'abord : montre un test qui échoue aujourd'hui par instabilité, avec le nombre de lancements qu'il lui faut pour échouer.
- Point d'arrêt : si la stabilité demande de changer une mesure ou une attente qui modifie ce que l'outil relève, arrête-toi.
- npm test, les trois contrôles, types, knip et dependances restent verts ; CI verte à la fin.

## Questions de confrontation

Q1. D'où vient l'ordre des feuilles aujourd'hui, fichier et ligne ? Sur 20 lancements d'un audit d'une page et d'un audit de plusieurs pages de fixtures, combien d'ordres distincts ?
Q2. Quelles clés de audit.json varient, et lesquelles en dépendent en aval (table.json, migration.md, modifications.json, identifiants de déclaration) ?
Q3. Les deux images de revue.html : lesquelles, de combien de pixels diffèrent-elles, où dans l'image, sur combien de lancements sur 20 ? Cause établie ou hypothèse ?
Q4. D'autres sorties varient-elles entre deux lancements (date, durée, port, chemin temporaire, ordre de clés) ? Liste-les toutes, avec ce qui est voulu (une date) et ce qui ne l'est pas.
Q5. Coût en durée de npm test des tests ajoutés.

## Commits

(0) attendu ; (1) tests rouges ; (2) code ; (3) documentation. Pousse après chaque commit. Ne fusionne pas : Claude vérifie d'abord.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

- Compte du message : 42 lignes (`wc -l`), 28 non vides [F]. Le message annonçait 36 lignes : un compte écrit par Claude sans outil. Décision de Quentin (17/11/2026) : le message est complet, et 42 remplace 36 dans la première ligne ci-dessus ; le reste est versé tel qu'il a été reçu.
- Conditions des mesures [F] : Node 24.22.3, main à d40de41, fixtures servies par `test/helpers/serveur.js`, `waitMs` 100, date fixée. Chaque série de lancements tourne sur un seul serveur, donc sur le même port. Les scripts sont dans `local/lot-5d/`.
- Q1 [F] : l'ordre est celui dans lequel Chromium annonce les feuilles. `collectSheets` empile les en-têtes de `CSS.styleSheetAdded` à leur arrivée (`src/browser/sheets.js:34-36`), puis les parcourt dans cet ordre (`src/browser/sheets.js:50`). `dedupeSheets` numérote ensuite les feuilles dans le même ordre (`id: byKey.size`, `src/declared/analyze.js:84`). Sur 20 lancements :
  - audit de `desordre/carte.html` : 3 ordres distincts (10, 8 et 2 lancements) ;
  - audit des trois pages en désordre : 3 ordres distincts (12, 7 et 1), seules les trois feuilles de la première page changeant de place.
  - Sur `index.html`, qui contient les cinq sortes de feuilles, l'ordre d'arrivée de 5 chargements a donné 3 ordres. La feuille importée et la feuille construite n'ont pas de nœud propriétaire dans l'en-tête CDP [F].
- Q2 [F] : ce qui varie dans `audit.json` :
  - `declared.sheets` est permuté (numéro ↔ adresse) ;
  - `locations[].sheet` et l'ordre des emplacements dans 11 familles (couleurs, tailles, graisses, interlignages, marges, retraits, gouttières, rayons, bordures, interlettrages, familles de polices) ;
  - l'ordre des clés de `values.<valeur>.sources`, de `.originals` et de `colors.bySource`.
  - Ramenées à une forme canonique (feuilles nommées par leur adresse, clés et emplacements triés), les trois variantes sont identiques dans chacun des deux cas : mêmes feuilles, mêmes valeurs, mêmes comptes. `rapport.md` suit `audit.json` (3 variantes), `rapport.html` ne varie pas (20 sur 20).
  - En aval, aucune variation. Sur 20 lancements des six réductions de fixtures, `table.json`, `migration.md` et `modifications.json` sont identiques à l'octet (18 fichiers). La réduction ne lit pas `audit.json`. L'identifiant de déclaration (`declarationId`, `src/browser/trace.js`) est `adresse|ligne|sélecteur|propriété` et ne dépend pas de l'ordre. La trace indexe les feuilles par `styleSheetId`.
  - L'ordre de `collectSheets` atteint aussi les contradictions de marque : `brandSheets` (`src/reduce/run.js:131-137`) et `readBrand` (`src/brand/read.js`, `marque.json`). La page de marque n'a qu'une feuille, donc aucune variation n'est observable sur les fixtures.
  - Les emplacements sont plafonnés à 10 (`MAX_LOCATIONS`, `src/declared/analyze.js:54`) : les 10 gardés sont les premiers dans l'ordre des feuilles. Sur l'audit des trois pages, 4 listes atteignent le plafond et gardent les mêmes emplacements dans les trois ordres. Sur une autre page, l'ordre d'arrivée peut changer quels emplacements sont gardés [H, lu dans le code].
- Q3 [F] : les images qui varient sont les deux captures pleine page de la page de marque (rangs 30 « avant » et 31 « après » sur 31), venues de `simulatePage` (`src/browser/simulate.js:599-601`). Les 29 vignettes ne varient pas, et `revue.html` est identique hors de ses images (20 sur 20).
  - Sur 20 lancements : 3 variantes de l'image 30 (5, 12 et 3 lancements), 3 de l'image 31 (13, 3 et 4), 5 versions de `revue.html` (8, 5, 3, 3 et 1).
  - Écart : 1 à 10 px sur 1 366 × 900, 1/255 au plus, tous à x 323-324, sur des coins arrondis de bord gauche : le champ e-mail (y 401-403 et 432-434) et un bloc plus bas (y 734).
  - Les quatre autres réductions qui ont des captures pleine page (désordre, pièges, proximité, valise) ne varient pas.
- Q3, cause établie par l'effet, mécanisme en hypothèse :
  - Sans le code de ds-lab, `goto` puis 100 ms, la capture est stable (30 sur 30). Après `gotoAndSettle`, elle varie déjà (2 captures sur 30). Après `scanInPage`, 3 sur 30. À délai variable, elle change avec l'attente.
  - La page n'a ni animation, ni transition, ni police web, ni curseur (`caret` masqué par Playwright). Les options `--run-all-compositor-stages-before-draw`, `--disable-gpu`, `--disable-gpu-rasterization`, `--disable-lcd-text` et `--deterministic-mode` laissent 2 ou 3 captures sur 20 [F].
  - `--disable-partial-raster` donne 1 capture sur 20, à délai variable. Avec cette option, le `revue.html` de la page de marque est identique sur 20 lancements, et les 23 autres fichiers des six réductions sont identiques à l'octet à ceux d'aujourd'hui (ports neutralisés) [F].
  - Mécanisme supposé : Chromium redessine seulement la partie invalidée d'une tuile, et l'anticrénelage d'un coin dépend des invalidations passées. Ces invalidations viennent de la fin du chargement et des sondes de style de `scanInPage`, dont le moment varie [H].
  - L'image 30 stabilisée est l'une des trois variantes d'aujourd'hui. L'image 31 stabilisée en est une quatrième, à 1 px et 1/255 de la plus fréquente [F].
- Q3, conséquence hors de `revue.html` [F] : la capture de `npm run verify` (`capturePage`) varie aussi. Sur 20 captures de la page de marque inchangée, on obtient 2 captures distinctes, et `compareImages` (seuil 0) compte 5 px différents dans 18 comparaisons sur 19 contre la première. Avec l'option, on obtient 1 capture sur 20 et 0 px.
- Q4, ce qui varie d'un lancement à l'autre [F, lu dans le code et mesuré] :
  - Voulu : la date de l'audit et de la réduction (`meta.date`, `meta.stamp`, titres des rapports, commentaires datés de `modifications.json` et de la consigne), qui est injectable par `now` sauf pour `npm run marque` et `npm run verify` (`new Date()` dans la ligne de commande, nom de dossier seulement). Le nom du dossier de sortie (horodatage, suffixe `-2` à la même minute). La durée affichée par `npm run apply`, à la console seulement.
  - Fixé par l'entrée ou la machine : le port, qui fait partie de l'adresse donnée, dans l'hôte, les adresses et les noms de dossier ; `meta.browser` ; `meta.sources`, relatif au dossier courant.
  - Pas une sortie : le fichier temporaire `.<nom>.saisie-<pid>` de la saisie, renommé ou retiré (D31).
  - Non voulu : l'ordre des feuilles (`audit.json`, `rapport.md`, et l'ordre des contradictions de marque dans `marque.json` et la table, lu dans le code mais pas observé) ; les captures pleine page de `revue.html` ; la capture de `npm run verify`.
  - Non observé, dépendance à l'horloge : `collectSheets` attend 150 ms sans nouvelle annonce. Une feuille annoncée plus tard serait manquée [H].
  - Saisie, générateurs, calibrage et contrôles : identiques entre deux captures au lot 5c (65 fichiers) [F].
- Q5 [F] : `npm test` dure aujourd'hui 100,4 s (822 tests, 822 verts, Mac au repos). Un audit d'une page prend 0,97 s, un audit de trois pages 2,72 s, la réduction de la page de marque 4,6 s (moyennes sur 20). Les tests prévus coûtent environ 17 s de calcul ; leur effet sur la durée totale, les fichiers tournant en parallèle, est à mesurer [V].

### Décisions de Quentin (17/11/2026)

- Feuille importée : ordre de la cascade, pas ordre de lecture. Une feuille importée se range avant la feuille qui l'importe, dans l'ordre de ses `@import`, en profondeur. Raison : l'audit mesure du CSS, et le seul ordre qui a un sens en CSS est celui où les règles s'appliquent (D33). Un cas où la cascade ne se lit pas dans ce que Chromium envoie (import conditionnel, import d'une feuille déjà chargée) arrête le lot.
- Feuilles construites : à la fin, triées par leur texte ; c'est aussi leur place dans la cascade. Dette : l'ordre réel de `adoptedStyleSheets` n'est pas lu.
- `--disable-partial-raster` sur tous les lancements de Chromium de `src/`, par `src/browser/lancement.js`. L'image qui change d'un pixel est acceptée : ce n'est pas une valeur relevée. D34 nomme le défaut que l'option ferme : `verify` comptait 5 px de différence sur une page inchangée, dans 18 comparaisons sur 19.
- Le plafond de 10 emplacements suit le nouvel ordre ; le compte rendu dit si un emplacement gardé change sur les fixtures.
- La stabilité doit tenir sous Linux : un test de `test/determinisme.test.js` qui échoue ou clignote sur le runner alors qu'il passe sur le Mac arrête le lot, avec les valeurs.
- Dette à inscrire : la fenêtre de 150 ms de `collectSheets` ; l'option de lancement est un réglage interne de Chromium, qui peut disparaître (le test le dira) ; le mécanisme du redessin partiel reste une hypothèse.
- Durée de `npm test` après le lot, sur le Mac et sur le runner.
- Commits (0) à (3) enchaînés, poussés après chacun ; arrêt à la CI verte, sans fusion.
