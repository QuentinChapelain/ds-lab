Étape 5, lot 5b : l'outil donne le même résultat sur toute machine. Ce message fait 41 lignes, de cette ligne à FIN-DU-MESSAGE comprises ; compte-les avec un outil avant de commencer, et arrête-toi si le compte diffère.

L'attendu est ce message : verse-le dans docs/attendus/etape-5b-plateforme.md, confronte-le au code, réponds aux questions Q1 à Q5, puis propose ton plan. Ne modifie rien d'autre avant mon accord.

## Départ

- Branche etape-5a à 26d4f99, CI rouge sur le runner : 3 tests en échec, 0 sur le Mac. Le lot 5b se fait sur cette même branche, à la suite : la CI le jugera à chaque push. La règle du lot 5a « aucun fichier de src/, fixtures/ ni test/ ne change » est levée pour ce qui est nommé ici, et pour cela seulement.
- Faits établis par les deux diagnostics (exécutions 43962290379 et 43964073175), à recopier dans l'attendu avec leurs tableaux : sous Linux, measureText de Chromium rend des bornes d'encre entières, sur une grille de 1/64 de la taille, arrondies vers l'extérieur, jusqu'à 0,014 em au-delà du Mac ; aucune taille de mesure n'accorde les deux systèmes ; la lecture des pixels d'un caractère dessiné sur un canvas les accorde à 0,001 em, 18 mesures sur 18. L'anneau de focus du navigateur vaut #005fcc sur le Mac et #101010 sur le runner.

## Décision de Quentin (16/11/2026), portée par ce message

L'encre d'une police se mesure sur le tracé réellement dessiné, lu dans les pixels, pas sur les bornes que rend measureText. Raison : un verdict de saisie ne dépend pas de la machine qui le rend. Conséquence acceptée : la mesure n'est plus majorée par les points de contrôle des courbes ; elle baisse jusqu'à 0,006 em sur les polices d'essai, et les écarts entre deux lignes grandissent d'autant.

## Ce qui entre

1. Encre (src/polices/encre.js) : haut et bas de l'encre, et hauteur du H, lus dans les pixels à 1 000 px. Une seule méthode, la même pour toutes les polices et toutes les machines.
2. Tests de l'encre : la référence de E3 devient le contour exact (fontTools BoundsPen sur l'instance de graisse), à 0,002 em ; les bornes de E4 sont recalculées sur la nouvelle mesure. Les nombres de référence sont écrits dans le test avec leur origine ; fontTools reste hors du dépôt.
3. Anneau de focus : l'attendu de la réduction des pages en désordre reconnaît l'anneau du navigateur par sa nature (état focus, outline-color, marqué anneau du navigateur), pas par sa couleur. L'outil ne change pas : il a raison sur les deux systèmes.
4. Une décision D32 dans docs/decisions.md (décision, raison, conséquence, sans valeur recopiée), D17 complétée d'un renvoi, KNOWN_ISSUES.md mis à jour (la ligne du contrôle d'encre « borné par les points de contrôle » change ; ce qui reste dépendant de la machine y est inscrit), README et ARCHITECTURE.md si une phrase devient fausse.

## Règle du lot

- Le verdict de la saisie des quatre polices d'essai ne change pas : trois acceptées, Bebas Neue refusée pour ses graisses. Si un verdict change, sur le Mac ou sur le runner, arrête-toi et dis lequel.
- Les fichiers de jetons des quatre marques restent identiques à l'octet, sauf réponse contraire à Q2.
- Tests rouges d'abord, sur le Mac : le compte rendu montre la sortie rouge avant le code.
- Preuve de fin : la CI verte sur etape-5a, 819 verts et 2 sautés, et les mêmes mesures d'encre sur le Mac et sur le runner, en tableau.
- Point d'arrêt : si la lecture des pixels ne tient pas 0,002 em entre Mac et runner sur une mesure, arrête-toi avec la mesure.

## Questions de confrontation

Q1. Le facteur de taille de la consigne de hauteur de capitale diffère aussi : Oswald 0,8641 sur le Mac, 0,8689 sur le runner ; EB Garamond 1,0769 et 1,0750. Comment est-il mesuré (encre.js:78, rendu avec font-size-adjust ?) ? Est-ce le navigateur qui rend réellement le titre à une taille différente sous Linux, ou notre mesure ? Peut-il se calculer depuis le fichier (hauteur de capitale d'OS/2, déjà lue), et les deux valeurs s'accordent-elles alors ? Ne tranche pas : donne les nombres.
Q2. Quelles sorties portent une mesure d'encre : console de la saisie, descriptions ou $extensions des jetons, planches, calibrage ? Lesquelles changent sur le Mac avec la nouvelle mesure, et de combien de lignes ? Une marque versionnée donne-t-elle des fichiers de police ?
Q3. Coût : durée du contrôle d'encre d'une police avant et après, sur le Mac et sur le runner.
Q4. Un test fabrique-t-il un refus d'encre (deux lignes qui se touchent) ? Tient-il encore avec une mesure plus basse de 0,006 em, sans retoucher sa police ni son seuil ?
Q5. Après ces deux corrections, reste-t-il dans les sorties de l'outil une valeur qui dépend du système (police de repli, couleur du système, arrondi) ? Liste-les sans les corriger.

## Commits

(0) attendu ; (1) tests rouges ; (2) code ; (3) documentation. Pousse après chaque commit. Le rouge voulu et la documentation de la CI (lot 5a) reprennent ensuite, sur la CI verte. Ne fusionne pas : Claude vérifie d'abord.

FIN-DU-MESSAGE

## Faits des deux diagnostics (16/11/2026)

Exécutions 43962290379 (deux lancements sur deux runners, sorties identiques à l'octet) et 43964073175. Chromium 147.0.7727.15 des deux côtés ; Mac : darwin, Node 25.6.1 ; runner : ubuntu-24.04, Node 22.23.4. Bornes de référence calculées avec fontTools 4.60.2, hors du dépôt, sur l'instance de chaque graisse (`instantiateVariableFont`) : `ControlBoundsPen` (points de contrôle) et `BoundsPen` (contour exact).

Anneau de focus du navigateur, seul état non lu de la réduction des pages en désordre [F] :

| | Mac | Runner |
|---|---|---|
| valeur | `#005fcc` | `#101010` |
| contexte | focus, outline-color, anneau du navigateur | focus, outline-color, anneau du navigateur |

measureText à 1 000 px, en em [F] (fontTools contrôle / Mac / runner) :

| Police | Graisse | haut | bas | H |
|---|---|---|---|---|
| Oswald | 600 | 1,0710 / 1,0710 / 1,0790 | 0,2681 / 0,2680 / 0,2820 | 0,8100 / 0,8100 / 0,8130 |
| Oswald | 700 | 1,0750 / 1,0750 / 1,0790 | 0,2770 / 0,2770 / 0,2820 | 0,8100 / 0,8100 / 0,8130 |
| EB Garamond | 600 | 0,8468 / 0,8470 / 0,8600 | 0,2895 / 0,2895 / 0,2970 | 0,6541 / 0,6541 / 0,6570 |
| EB Garamond | 700 | 0,8511 / 0,8510 / 0,8600 | 0,2892 / 0,2892 / 0,2970 | 0,6546 / 0,6546 / 0,6570 |
| Cinzel | 600 | 0,9243 / 0,9240 / 0,9380 | 0,2705 / 0,2705 / 0,2820 | 0,7000 / 0,7000 / 0,7040 |
| Cinzel | 700 | 0,9354 / 0,9360 / 0,9380 | 0,2843 / 0,2843 / 0,2970 | 0,7000 / 0,7000 / 0,7040 |

Sur le runner, les valeurs brutes d'`actualBoundingBoxAscent` et `Descent` sont toutes entières, sur le Mac non ; à 1 000 px, chacune est l'arrondi supérieur de k × 15,625 px (1/64 de la taille), d'où 600 et 700 identiques pour Oswald et EB Garamond [F]. Notre code n'arrondit pas (division par 1 000).

Selon la taille de mesure (18 mesures : 3 polices × 2 graisses × haut, bas, H) [F] :

| Taille | Plus grand écart Mac/runner (em) | Mesures accordées à 0,002 em | Plus grand écart runner/fontTools contrôle |
|---|---|---|---|
| 64 px | 0,0132 | 2 | 0,0132 |
| 100 px | 0,0095 | 8 | 0,0095 |
| 256 px | 0,0038 | 10 | 0,0038 |
| 512 px | 0,0135 | 2 | 0,0132 |
| 1 000 px | 0,0140 | 1 | 0,0139 |
| 2 048 px | 0,0135 | 2 | 0,0132 |
| 4 096 px | 0,0135 | 2 | 0,0132 |
| pixels, 1 000 px | 0,0010 | 18 | 0,0008 (contour) |

Le Mac reste à 0,0006 em de fontTools contrôle à toutes les tailles. La grille de 1/64 tient sur les 18 mesures à 512, 1 000, 2 048 et 4 096 px, sur 12 à 100 px, sur 7 à 256 px.

Lecture des pixels à 1 000 px, en em (fontTools contour / Mac / runner) [F] :

| Police | Graisse | haut | bas | H |
|---|---|---|---|---|
| Oswald | 600 | 1,0710 / 1,0710 / 1,0710 | 0,2681 / 0,2680 / 0,2680 | 0,8100 / 0,8100 / 0,8100 |
| Oswald | 700 | 1,0750 / 1,0750 / 1,0750 | 0,2770 / 0,2770 / 0,2770 | 0,8100 / 0,8100 / 0,8100 |
| EB Garamond | 600 | 0,8453 / 0,8460 / 0,8460 | 0,2895 / 0,2900 / 0,2900 | 0,6541 / 0,6540 / 0,6540 |
| EB Garamond | 700 | 0,8490 / 0,8500 / 0,8490 | 0,2892 / 0,2900 / 0,2900 | 0,6546 / 0,6550 / 0,6550 |
| Cinzel | 600 | 0,9243 / 0,9240 / 0,9240 | 0,2648 / 0,2650 / 0,2650 | 0,7000 / 0,7000 / 0,7000 |
| Cinzel | 700 | 0,9354 / 0,9360 / 0,9360 | 0,2783 / 0,2790 / 0,2790 | 0,7000 / 0,7000 / 0,7000 |

Écarts entre deux lignes (E4, ligne − encre, px, facteur mesuré par chaque machine), Mac / runner [F] : Oswald de 3,17 à 5,94 / de 2,77 à 5,43 ; EB Garamond de 1,06 à 3,80 / de 0,30 à 3,22 ; Cinzel de 1,43 à 4,11 / de 0,72 à 3,60 ; aucun nul ni négatif. Verdict de la saisie identique : Oswald, EB Garamond, Cinzel acceptées ; Bebas Neue refusée (graisses absentes : 600, 700 ; présentes : 400).

## Écarts constatés à la confrontation

1. Q1, le facteur de taille. Il est mesuré comme un rapport de largeurs (`src/polices/encre.js:72-80`) : un `span` de dix H à 100 px, avec puis sans `font-size-adjust: cap-height 0,7`. Calculé depuis le fichier, 0,7 × unités par em ÷ hauteur de capitale d'OS/2 (déjà lues par `lirePolice`), il vaut 0,8642 (Oswald), 1,0769 (EB Garamond), 1 (Cinzel) [F] ; le Mac mesure 0,8641, 1,0769, 1 [F]. Le runner mesure 0,8689 et 1,0750 : exactement le rapport de dix avances de H arrondies au pixel entier (Oswald 700 : avance 0,61 em, 530 / 610 ; EB Garamond 700 : 0,801 em, 860 / 800) [F, arithmétique sur les avances lues par fontTools]. L'écart vient donc de la mesure des largeurs, avances arrondies au pixel sous Linux [H], pas d'une taille de rendu différente [H, non mesuré].
2. Q1, conséquence : E3 compare aussi le facteur à 0,002 près. Oswald sur le runner, 0,8689 contre 0,8642 (écart 0,0047), reste rouge si seules les bornes d'encre passent aux pixels [F]. La décision portée par ce message ne nomme pas le facteur : sans décision sur lui, la CI ne peut pas être verte.
3. Q2 : une seule sortie porte une mesure d'encre, la console de la saisie, quand l'entrée donne les fichiers de la police des titres (`src/cli/saisie.js:39-42`) ; rien dans les jetons, les planches ni le calibrage [F]. Aucune des quatre marques versionnées ne donne de fichier de police (Georgia, Trebuchet MS, Palatino… par leurs noms) [F] : leurs fichiers de jetons et leur console ne changent pas. Sur le Mac, seules les consoles de saisie d'une entrée avec fichiers changent : les dix lignes d'encre, d'au plus 0,006 em × taille utilisée.
4. Q3 : sur le Mac, `mesurerEncre` pour une police (600 et 700) prend environ 110 ms aujourd'hui, environ 900 ms par lecture des pixels (prototype hors du dépôt, canvas de 1 600 × 3 000 px, un `getImageData` par caractère) [F]. Le runner mesure aujourd'hui 335 ms pour les trois polices de E3 [F] ; après, mesuré par la CI.
5. Q4 : E4 fabrique des refus d'encre avec les hauteurs de ligne d'avant D17. Recalculés avec la lecture des pixels et le facteur du fichier, sur les mesures du Mac comme du runner : Oswald 3 refus (le plus mince, affichage.moyen en large, −0,08 px, inchangé : le contour d'Oswald égale ses points de contrôle), EB Garamond 5, Cinzel 5 : les mêmes styles qu'aujourd'hui [F]. Écart le plus petit d'EB Garamond avec les lignes de D17 : 1,07 px (Mac), 1,12 px (runner), 1,16 px (fontTools contour), dans la borne actuelle de E4 (0,9 à 1,2) [F]. Aucun autre test ne fabrique de refus d'encre [F].
6. Q5, valeurs des sorties qui dépendent encore du système : le facteur de taille (point 1) ; la couleur de l'anneau de focus dans « États non lus » de `migration.md` et `table.json`, juste sur chaque machine ; les captures de `revue.html` (tracé, polices de repli, lissage) ; les mesures qui suivent la mise en page (taille d'un élément pour la pilule de R7, retour à la ligne avec une police de repli), sans différence observée sur les fixtures [F] ; une référence de `npm run verify` enregistrée sur une machine et comparée sur une autre ; le nom des dossiers de sortie, en heure locale (`src/report/json.js:19`), quand `audit.json` date en UTC.
7. `#005fcc` n'est écrit que dans `fixtures/marque-demo/expected-migration.json:58` ; le test le cherche par sa valeur (`test/e2e-migration.test.js:173-178`).

Décisions de Quentin (16/11/2026) : le facteur de taille se calcule depuis le fichier, consigne × unités par em ÷ hauteur de capitale d'OS/2, sans navigateur ; la mesure par largeurs est retirée. La consigne et la règle de refus ne changent pas ; une police sans hauteur de capitale est déjà refusée. D32 le dit avec les bornes d'encre : aucune mesure d'encre ni de taille ne dépend de la machine. Dette inscrite : la taille réellement rendue d'un titre sous Linux avec `font-size-adjust` n'est pas mesurée [V]. E3 donne toutes ses valeurs dans son message d'échec. Coût d'environ 0,9 s par police accepté ; la durée sur le runner est donnée au compte rendu. Une encre qui touche le bord du canvas est une panne (sortie 2), couverte par un test. Les six points de Q5 vont dans `KNOWN_ISSUES.md`, sans correction, le nom des dossiers de sortie en heure locale compris. Quatre commits, poussés un par un ; arrêt à la CI verte, avant le rouge voulu.

## Écarts constatés à l'exécution

1. Tests rouges (commit 1), sur le Mac : E3 rouge, 7 mesures hors tolérance (les quatre facteurs mesurés par largeurs, de 9e-5 à 3e-5 du calcul du fichier ; EB Garamond 700 haut 0,851 pour 0,849 ; Cinzel bas 0,2705 pour 0,2648 et 0,2843 pour 0,2783) ; E6 rouge (l'option de cadre n'existait pas, la mesure aboutissait) ; la règle de l'anneau par sa nature passe déjà sur le Mac [F].
2. E6 ajoute un test : 822 tests, 820 verts et 2 sautés en CI, au lieu de 819 et 2.
3. Cadre de mesure : un cadre fixe, puis la largeur d'avance plus 0,25 em, coûtaient de 1,6 à 2,2 s par police ; avec 0,25 em, le Q de Cinzel touchait le bord, et la garde l'a rendu en panne, pas en mesure fausse [F]. Retenu : chaque caractère cadré sur ses bornes horizontales de `measureText` (elles ne servent qu'à le placer), 0,05 em de marge, une seule hauteur de 1,5 em de part et d'autre de la ligne de base, une lecture de pixels limitée à la largeur du caractère.
4. Coût, pour une police (600 et 700, lancement de Chromium compris) : environ 0,65 s sur le Mac, 1,9 s sur le runner (E3 : 5,7 s pour trois polices), contre 0,11 s avant [F]. Au-delà des 0,9 s acceptés sur le Mac pour le runner.
5. Les mesures du runner viennent d'une exécution de diagnostic sur une branche jetable (`etape-5b-diag`, exécution 43968746045, supprimée ensuite) : E3 vert n'affiche pas ses valeurs.

## Sorties

- CI verte sur a9509ef (exécution 43967620324) : 822 tests, 820 verts, 2 sautés (`test/noms-interdits.test.js`, liste absente) [F]. Contrôles et types à 0.
- Mesures d'encre en em, contour fontTools / Mac / runner, même code (a9509ef) [F] :

| Police | Graisse | haut | bas | H |
|---|---|---|---|---|
| Oswald | 600 | 1,0710 / 1,071 / 1,071 | 0,2681 / 0,268 / 0,268 | 0,8100 / 0,810 / 0,810 |
| Oswald | 700 | 1,0750 / 1,075 / 1,075 | 0,2770 / 0,277 / 0,277 | 0,8100 / 0,810 / 0,810 |
| EB Garamond | 600 | 0,8453 / 0,846 / 0,846 | 0,2895 / 0,290 / 0,290 | 0,6541 / 0,654 / 0,654 |
| EB Garamond | 700 | 0,8490 / 0,850 / 0,849 | 0,2892 / 0,290 / 0,290 | 0,6546 / 0,655 / 0,655 |
| Cinzel | 600 | 0,9243 / 0,924 / 0,924 | 0,2648 / 0,265 / 0,265 | 0,7000 / 0,700 / 0,700 |
| Cinzel | 700 | 0,9354 / 0,936 / 0,936 | 0,2783 / 0,279 / 0,279 | 0,7000 / 0,700 / 0,700 |

- Plus grand écart Mac/runner : 0,001 em (EB Garamond 700, haut). Facteur identique sur les deux machines : 700/810, 700/650, 1. E4 : plus grand écart Mac/runner entre deux lignes 0,065 px ; écart le plus petit Oswald 3,17 / 3,17 px, EB Garamond 1,07 / 1,12 px, Cinzel 1,68 / 1,68 px [F].
- Verdict de la saisie, Mac et runner : Oswald, EB Garamond, Cinzel acceptées (sortie 0) ; Bebas Neue refusée (sortie 1, graisses absentes : 600, 700) [F]. Fichiers de jetons des quatre marques inchangés.
- Anneau de focus : `#005fcc` sur le Mac, `#101010` sur le runner, reconnu par sa nature des deux côtés.
