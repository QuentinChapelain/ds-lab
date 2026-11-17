Lot « le verdict par décision » : la preuve juge la décision du designer, pas ce que l'outil a réussi à écrire. Ce message fait 45 lignes, de cette ligne à FIN-DU-MESSAGE comprises ; compte-les avec un outil avant de commencer, et arrête-toi si le compte diffère.

L'attendu est ce message : verse-le dans docs/attendus/verdict-par-decision.md, confronte-le au code, réponds aux questions Q1 à Q5 avec des mesures, puis propose ton plan. Ne modifie rien d'autre avant mon accord. Vérifie node -v (Node 24).

## Départ

- main à b5fcb00, CI verte (exécution 40). Branche : verdict-par-decision.
- Défaut constaté : verify --ajout sort en 0 et dit « chaque ligne écrite est arrivée » alors que des lignes décidées ne sont pas arrivées, parce qu'elles n'ont pas pu être écrites ou sont hors de modifications.json. Erreur de l'attendu précédent, qui faisait porter la sortie sur les seules lignes écrites.
- Le détail des deux passages sur un site réel est dans local/ajout-a/rapport.md et local/ajout-a-2/rapport.md : lis-les, n'en recopie rien. Rien de ce site n'entre dans le dépôt ni dans un message de commit : ni nom, ni adresse, ni feuille, ni capture, ni chiffre mesuré sur lui.

## But

verify --ajout rend un verdict par ligne décidée, toutes ses déclarations comprises, écrites ou non. Il dit par quel canal une décision n'arrive pas. Il ne sort en 0 que si chaque ligne décidée est arrivée.

## Ce qui entre

1. Pièges d'abord, dans les fixtures : une ligne décidée dont la valeur vient d'un attribut style ; une ligne décidée tenue par un bloc de style injecté par un script ; une bordure en raccourci dont la couleur vient d'une variable posée en ligne ; une ligne à deux déclarations dont une seule peut être écrite.
2. Verdict par ligne : « arrivée » seulement si toutes ses déclarations sont arrivées sur tous leurs éléments ; sinon « en partie » ou « non arrivée », avec le compte. Une ligne non écrite ou hors de modifications.json est jugée comme les autres.
3. Canal : pour chaque ligne qui n'arrive pas entière, ce qui tient la valeur à l'écran, en clair : attribut style, bloc de style injecté par un script, variable, raccourci, autre règle. Et ce que le développeur doit faire.
4. Résumé : une phrase finale qui compte les lignes décidées par état. Elle ne dit jamais « chaque ligne écrite est arrivée » quand une ligne décidée ne l'est pas.
5. Sortie : 0 si toutes les lignes décidées sont arrivées, 1 sinon, 2 sur une panne.
6. Hauteur : verify --ajout rend la hauteur de la page intacte, lue dans le même chargement avant la pose, et celle de la page avec les feuilles.
7. Causes justes dans pertes.md : une valeur en var() ou inherit n'a pas pour cause « unité inconnue ».
8. Documentation : README, ARCHITECTURE, une décision qui corrige D38 là où il le faut (table.json peut changer sur un site dont les valeurs portent !important), KNOWN_ISSUES avec les défauts des deux passages que ce lot ne corrige pas.

## Règle du lot

- verify lit modifications.json et la sortie d'ajout, rien d'autre de la réduction (D30). Si le verdict demande une information que ces fichiers n'ont pas, dis laquelle et où elle existe.
- Sur les six réductions de fixtures, les feuilles ajoutées et les sorties d'apply restent identiques à l'octet. Les réductions qui ont des lignes hors de modifications.json sortiront désormais en 1 : c'est voulu, dis lesquelles et adapte leurs tests en le montrant.
- Tests rouges d'abord. Aucun chargement du site réel.
- npm test, les trois contrôles, types, knip et dependances verts sur le Mac ; CI verte sur la branche.

## Questions de confrontation

Q1. Pour une ligne non écrite ou hors de modifications.json, sait-on quels éléments elle vise et quelle valeur elle vise ? Avec quels fichiers ?
Q2. Sur les pièges, que dit verify --ajout aujourd'hui, et que sort-il ? Montre le rouge.
Q3. Peut-on nommer le canal de façon sûre (attribut style, bloc injecté, variable) à partir de ce que le navigateur dit de la règle qui gagne ? Les cas où on ne peut pas.
Q4. Sur les six réductions, combien de lignes décidées par état avec la nouvelle règle ?
Q5. Durée ajoutée à npm test.

## Commits

(0) attendu ; (1) pièges et tests rouges ; (2) code ; (3) documentation. Pousse la branche après chaque commit. Ne pousse pas sur main : Claude vérifie d'abord.

FIN-DU-MESSAGE
