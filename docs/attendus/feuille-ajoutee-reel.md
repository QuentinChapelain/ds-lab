Lot « feuilles ajoutées, à l'épreuve du réel » : retrouver les règles d'une feuille compressée, gagner à armes égales, prouver décision par décision. Ce message fait 45 lignes, de cette ligne à FIN-DU-MESSAGE comprises ; compte-les avec un outil avant de commencer, et arrête-toi si le compte diffère.

L'attendu est ce message : verse-le dans docs/attendus/feuille-ajoutee-reel.md, confronte-le au code, réponds aux questions Q1 à Q6 avec des mesures, puis propose ton plan. Ne modifie rien d'autre avant mon accord. Vérifie node -v (Node 24).

## Départ

- main à ed59da4, CI verte (exécution 35). Branche : feuille-ajoutee-reel.
- Un passage en lecture sur un site réel, le 17/11/2026, a montré des défauts de l'outil sur une feuille compressée : règles ambiguës, !important d'origine rangé sous la garde, raccourcis contenant un var(), règles introuvables ; et un compte de pixels qui ne dit pas quelles décisions sont arrivées, parce qu'une page plus courte de quelques pixels décale tout. Le détail et les chiffres sont dans local/ajout-a/rapport.md, section R6 : lis-le, n'en recopie rien.
- Rien de ce site n'entre dans le dépôt, ni dans un message de commit : ni nom, ni adresse, ni feuille, ni capture, ni chiffre mesuré sur lui. Chaque défaut devient un piège fictif.

## But

Sur une feuille compressée, l'outil retrouve chaque déclaration décidée. Une déclaration d'origine en !important est gagnée à armes égales, et c'est dit. La preuve ne compte plus des pixels : elle dit, pour chaque décision, si elle est arrivée à l'écran.

## Ce qui entre

1. Pièges d'abord, dans les fixtures, écrits avant le code : une feuille sur une seule ligne où le même sélecteur revient plusieurs fois ; !important collé à la valeur ; raccourci dont la valeur contient un var() ; feuille injectée par un script après le chargement ; lien qui porte un attribut media.
2. Repérage : chaque déclaration décidée est retrouvée sans ambiguïté dans une feuille compressée. modifications.json peut gagner les champs qu'il faut ; dis lesquels.
3. Armes égales (décision de Quentin du 17/11/2026, qui remplace le point 5 de D37 pour ce cas) : une déclaration d'origine en !important est écrite avec !important, jamais ailleurs. Son commentaire dit « provisoire : !important d'origine », et pertes.md les compte dans une section à part. Aucune spécificité ajoutée.
4. Causes justes : garde, !important, raccourci, règle introuvable, feuille injectée par un script sont cinq causes distinctes dans pertes.md. Une valeur de repli ne contient jamais !important.
5. Preuve par décision : verify --ajout rend, pour chaque ligne décidée, « arrivée », « arrivée en partie (n éléments sur m) » ou « non arrivée », avec la règle qui gagne quand elle n'arrive pas. Il sort en 1 dès qu'une ligne écrite n'est pas arrivée. Le compte de pixels reste affiché, il ne décide plus.
6. La fenêtre vient de la réduction : ajout et verify prennent celle de modifications.json, sans option à donner.
7. Documentation : README, ARCHITECTURE, une décision, KNOWN_ISSUES. Les défauts de R6 que ce lot ne corrige pas y sont inscrits, sans nommer le site ni reprendre ses chiffres.

## Règle du lot

- Sur les six réductions de fixtures, les feuilles ajoutées restent identiques à l'octet, et les sorties d'apply aussi. Seul modifications.json peut changer, par ajout de champs.
- Tests rouges d'abord. Point d'arrêt : si retrouver une règle demande de deviner (deux candidates que rien ne distingue), arrête-toi et montre le cas.
- Aucun chargement du site réel dans ce lot.
- npm test, les trois contrôles, types, knip et dependances verts sur le Mac ; CI verte sur la branche.

## Questions de confrontation

Q1. Comment la trace repère-t-elle une déclaration aujourd'hui (feuille, ligne, sélecteur) ? Qu'a-t-elle de plus précis à donner (colonne, rang de la règle, texte) ?
Q2. Sur les pièges, combien de déclarations la garde refuse-t-elle aujourd'hui, par cause ? Montre le rouge.
Q3. Comment savoir qu'une décision est arrivée : quelle valeur comparer, lue où, pour une couleur, une dimension, un raccourci ? Que faire d'un élément présent sur la page à la simulation et absent à la vérification ?
Q4. Feuille injectée par un script : peut-on la reconnaître à la génération ? Que dit-on au développeur ?
Q5. Lesquels des 15 défauts de R6 ce lot corrige-t-il, lesquels vont en dette ?
Q6. Durée ajoutée à npm test.

## Commits

(0) attendu ; (1) pièges et tests rouges ; (2) code ; (3) documentation. Pousse la branche après chaque commit. Ne pousse pas sur main : Claude vérifie d'abord.

FIN-DU-MESSAGE
