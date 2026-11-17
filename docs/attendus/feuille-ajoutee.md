Lot « feuille ajoutée » : le système s'ajoute à côté de l'ancien code, sans y toucher. Ce message fait 47 lignes, de cette ligne à FIN-DU-MESSAGE comprises ; compte-les avec un outil avant de commencer, et arrête-toi si le compte diffère.

L'attendu est ce message : verse-le dans docs/attendus/feuille-ajoutee.md, confronte-le au code, réponds aux questions Q1 à Q8 avec des mesures, puis propose ton plan. Ne modifie rien d'autre avant mon accord. Vérifie node -v avant toute commande (Node 24, .node-version).

## Départ

- main à cfd5e3d, CI verte (exécution 30). Branche : feuille-ajoutee.
- Aujourd'hui, npm run apply réécrit les feuilles d'une copie du site, et npm run verify compare cette copie à la référence tirée de la simulation validée. La simulation pose les valeurs par style en ligne sur chaque élément.
- Il manque la sortie qui ne touche à aucune feuille existante : une feuille de plus, chargée après les autres.

## But

Une sortie écrit la feuille ajoutée d'une réduction : seulement les changements décidés, même sélecteur, même propriété, nouvelle valeur branchée sur son jeton. Chargée sur le site intact avec la feuille des jetons, elle rend les pages identiques au pixel à la simulation validée. Là où elle ne peut pas gagner contre l'ancien code, l'outil le dit, ligne par ligne.

## Ce qui entre

1. La sortie lit modifications.json et rien d'autre de la réduction, comme apply (D30). Elle n'écrit dans aucune feuille du site.
2. Chaque règle de la feuille porte en commentaire l'identifiant de sa ligne, le même que dans la revue et la consigne : un composant refait retire ses lignes.
3. Le contexte d'origine est gardé : une déclaration écrite sous une requête média, un @supports ou un @layer est réécrite sous le même.
4. Preuve : la feuille est chargée dans le navigateur de l'outil sur le site intact, après toutes les autres, et comparée à la référence. Cible : 0 pixel d'écart et le même arbre d'accessibilité, sur chaque réduction de fixtures qui a des jetons.
5. Ce qui ne peut pas être gagné (style en ligne, !important d'origine, autre cas trouvé) est listé dans un fichier à part, avec l'identifiant, la cause et ce qu'il faudrait faire.
6. Tests rouges d'abord, dont un piège par cause de perte trouvée en Q3.
7. Documentation : README, ARCHITECTURE, une décision, KNOWN_ISSUES.

## Règle du lot

- Aucune surenchère en silence : pas de !important ni de spécificité gonflée ajoutés sans que la ligne le dise et que la décision l'autorise. Propose la règle, je tranche.
- La feuille des jetons chargée avec elle ne doit rien changer d'autre : le rendu est identique quand le système de l'utilisateur est en sombre, et à la largeur mobile des réductions. Si le bloc sombre ou le bloc étroit de jetons.css change une page que l'ancien site ne prévoit pas de changer, arrête-toi et dis-le.
- Les sorties existantes restent identiques à l'octet. npm test, les trois contrôles, types, knip et dependances verts sur le Mac ; CI verte sur la branche.
- Aucune page d'un site réel dans ce lot : fixtures seulement.

## Questions de confrontation

Q1. Que contient modifications.json pour une déclaration : suffit-il à réécrire la règle entière (sélecteur complet, contexte média, !important, raccourci comme margin à plusieurs valeurs) ? Que manque-t-il ?
Q2. Où brancher la sortie et la preuve : une option d'apply, de verify, une commande ? Ce que tu recommandes et pourquoi.
Q3. Dans les fixtures, combien de déclarations modifiées la feuille ajoutée ne gagnerait pas, par cause (style en ligne, !important, ordre de chargement, spécificité, autre) ?
Q4. Une feuille de l'ancien site chargée après la nôtre (morceau chargé à la demande) : que se passe-t-il, et quelles parades sans surenchère ?
Q5. Quelle feuille de jetons charger : tokens.css d'apply ou jetons.css de la marque ? Écart entre les deux pour les variables utilisées.
Q6. Système en sombre : la page change-t-elle avec jetons.css ? Combien de pixels, sur quelles fixtures ?
Q7. Largeur mobile : la simulation et la feuille donnent-elles la même valeur quand un jeton change en étroit ? Liste les cas.
Q8. Deux générations de suite identiques à l'octet ? Durée ajoutée à npm test.

## Commits

(0) attendu ; (1) tests rouges ; (2) code ; (3) documentation. Pousse la branche après chaque commit. Ne pousse pas sur main : Claude vérifie d'abord.

FIN-DU-MESSAGE
