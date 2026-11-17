Étape 5, lot 5e : des jetons au CSS, par un outil du marché. Ce message fait 47 lignes, de cette ligne à FIN-DU-MESSAGE comprises ; compte-les avec un outil avant de commencer, et arrête-toi si le compte diffère.

L'attendu est ce message : verse-le dans docs/attendus/etape-5e-css.md, confronte-le au code, réponds aux questions Q1 à Q7 avec des mesures, puis propose ton plan. Ne modifie rien d'autre avant mon accord. Vérifie node -v avant toute commande (Node 24, .node-version).

## Départ

- main à 96d3018, CI verte (exécution 24). Branche : etape-5e.
- Aujourd'hui, seul notre lecteur (src/tokens/resolver.js) lit les jetons, et tokens.css n'est écrit que par npm run apply, pour les variables qu'une migration utilise. Il n'existe aucune sortie CSS complète d'une marque.
- Essai fait par Claude hors du dépôt, sur une machine Linux en Node 22 : Terrazzo 2.10.0 (@terrazzo/cli, @terrazzo/plugin-css) lit les quatre marque.resolver.json sans modification (251, 238, 238, 225 jetons) et écrit des variables CSS par combinaison de contextes. Style Dictionary 5 ne lit pas les resolvers : écarté.

## But

Une commande écrit, pour chaque marque, la feuille CSS complète de ses jetons dans tous ses contextes, par Terrazzo. Un test prouve que Terrazzo et notre lecteur donnent la même valeur pour chaque jeton, dans chaque combinaison de contextes, pour chaque marque.

## Ce qui entre

1. Dépendance : Terrazzo, version exacte épinglée. Dis ce que tu ajoutes, en dépendance ou en dépendance de développement, et pourquoi.
2. Une commande npm, avec --marque comme les trois contrôles ; sans l'option, toutes les marques de tokens/. Trois issues (D18).
3. Sortie : un fichier par marque, dans son dossier, versionné. Le mode clair et la largeur large dans :root ; le sombre et l'étroit ne redéclarent que ce qui change, si l'outil le permet (Q4).
4. Le seuil de l'étroit se lit dans le resolver (extension ds-lab.largeur), jamais en dur.
5. Test d'accord : pour chaque marque et chaque combinaison (clair ou sombre, large ou étroit), chaque jeton a la même valeur chez Terrazzo et chez notre lecteur ; aucun jeton présent chez l'un et absent chez l'autre.
6. Test de fraîcheur : le fichier versionné est identique à l'octet à une génération neuve.
7. Documentation : README, ARCHITECTURE, une décision (le choix de Terrazzo et sa raison), KNOWN_ISSUES (sortie Dart non faite ; la CI tourne deux fois sur le même commit, branche puis main).

## Règle du lot

- Une seule configuration pour toutes les marques : aucun fichier de configuration par marque, aucun nom de marque dans src/.
- Les noms de variables suivent la règle existante : le chemin du jeton, points remplacés par des tirets. Toute variable écrite par npm run apply porte le même nom et la même valeur dans la sortie nouvelle.
- Point d'arrêt : si une valeur diffère entre Terrazzo et notre lecteur, arrête-toi et rends le tableau des écarts. Ne corrige ni l'un ni l'autre sans accord.
- Rouge voulu : le test de fraîcheur est vu échouer une fois, sur une branche jetable annoncée avant d'être poussée, puis supprimée.
- Les sorties existantes restent identiques à l'octet. npm test, les trois contrôles, types, knip et dependances restent verts sur le Mac ; CI verte sur la branche.

## Questions de confrontation

Q1. Terrazzo s'installe-t-il et tourne-t-il sur le Mac en Node 24 et sur la CI en Node 22 ? Poids ajouté (paquets, Mo) ; ce qu'en disent knip et dependency-cruiser.
Q2. Peut-on l'appeler depuis notre code, pour toutes les marques, sans fichier de configuration par marque ?
Q3. Jetons vus par Terrazzo et par notre lecteur, par marque et par combinaison : mêmes comptes, mêmes chemins ? Liste les écarts.
Q4. Que sort-il pour le sombre et l'étroit : tout redéclaré, ou seulement ce qui change ? Taille de la feuille dans chaque cas.
Q5. Format des couleurs écrites (l'essai a donné rgb() à pourcentages, les jetons portent un hexadécimal) : peut-on écrire l'hexadécimal du jeton ? Sinon, l'écart est-il nul une fois arrondi sur 8 bits ?
Q6. Que deviennent les styles de texte (type typography), les alias et les descriptions dans la sortie ?
Q7. Deux générations de suite sont-elles identiques à l'octet ? Durée ajoutée à npm test.

## Commits

(0) attendu ; (1) tests rouges ; (2) code ; (3) documentation. Pousse la branche après chaque commit. Ne pousse pas sur main : Claude vérifie d'abord.

FIN-DU-MESSAGE
