Lot « verify se reconnaît » : corriger les fausses alertes du verdict par décision. Ce message fait 33 lignes, de cette ligne à FIN-DU-MESSAGE comprises ; compte-les avec un outil avant de commencer, et arrête-toi si le compte diffère.

L'attendu est ce message : verse-le dans docs/attendus/verify-se-reconnait.md, fais le diagnostic demandé, puis propose ton plan. Ne modifie rien d'autre avant mon accord. Vérifie node -v avant chaque commande npm ou node, pas seulement au départ (Node 24).

## Départ

- main à c0c6060, CI verte (exécution 45). Branche : verify-se-reconnait.
- Défaut constaté sur un site réel, détail dans local/ajout-a-3/rapport.md, section R5 : lis-le, n'en recopie rien. Rien de ce site n'entre dans le dépôt ni dans un message de commit : ni nom, ni adresse, ni feuille, ni capture, ni chiffre mesuré sur lui.
- Ce qu'on sait : verify pose tokens.css dans un <style> qu'il crée, puis le classe « bloc de style injecté par un script » (src/verify/arrivee.js, classement des feuilles : seules les feuilles ajoutées sont reconnues par leur texte). Des lignes sont dites « non arrivée » ou « en partie » alors que les pixels sont justes.
- Ce qu'on ne sait pas : pourquoi ces lignes ne sont pas comptées arrivées.

## Diagnostic d'abord, sans charger le site réel

D1. À partir de local/ajout-a-3/verify (verification.json, verdict) : pour chaque déclaration douteuse, la valeur visée, la valeur calculée avant et après la pose, la règle gagnante. Où le jugement se trompe-t-il : valeur visée, comparaison, éléments visés, autre ?
D2. Reproduis le défaut sur une page fictive, hors du dépôt. Dis ce qui manquait aux fixtures pour le voir.
D3. Les lignes arrivées des six réductions de fixtures le restent-elles avec la correction envisagée ?
Si D1 ne suffit pas sans recharger le site, arrête-toi et dis ce qu'il faudrait mesurer.

## Ce qui entre

1. Piège d'abord, dans les fixtures : celui de D2, rouge avant le code.
2. verify reconnaît tout ce qu'il pose lui-même (tokens.css, feuilles ajoutées) et ne le nomme jamais comme un canal du site.
3. Le « à faire » ne propose jamais de poser une variable avec elle-même pour repli, ni de poser une feuille ajoutée qui ne porte pas la règle visée ; pour un raccourci dont l'origine porte !important, il le dit.
4. Une seule cause par ligne, la même dans la ligne de verdict, le détail et pertes.md.
5. Garde de version : une commande de l'outil lancée sous une version majeure de Node autre que celle de .node-version sort en 2 avec un message d'une ligne. Dis ce que cela change pour la CI, qui tourne en Node 22, et propose la règle juste avant de coder.
6. Documentation : README, ARCHITECTURE, une décision, KNOWN_ISSUES.

## Règle du lot

- Feuilles ajoutées et sorties d'apply identiques à l'octet sur les six réductions. Tests rouges d'abord. Aucun chargement du site réel.
- npm test, les trois contrôles, types, knip et dependances verts sur le Mac ; CI verte sur la branche. Ne pousse pas sur main.

FIN-DU-MESSAGE
