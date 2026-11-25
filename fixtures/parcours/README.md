# Projets du parcours

Huit projets fictifs de la commande `npm run parcours` (D72), un par moment de la page et un à trois sites. Construits le 24/11/2026 en jouant le parcours de bout en bout sur Orbe Café, servi par `npm run demo` ; l'adresse réelle du serveur de démonstration y est remplacée par `http://127.0.0.1:4173`, et son dossier d'hôte par `127.0.0.1_4173`.

| Projet | Moment | Sorties |
|---|---|---|
| `lancement` | Rien de fait, aucune page : l'écran des pages, vide (D77) | Aucune |
| `pages` | Trois pages retenues, deux avec leur nom, pas encore validées : l'écran des pages (D77) | Aucune |
| `constat` | Mesure faite, dette pas encore vue : l'écran de la dette (D79) ; dette vue, la marque à saisir | La mesure des composants (chiffres, scores, types et versions avec leurs hauteurs, les onze captures), un extrait de l'audit, lancé avec le fichier de sources (valeurs d'interface et de contenu, ce que le code écrit, couleurs par usage et rôle d'élément, polices par rôle) et un rapport de remplacement ; sans entrée de marque, la dette vue, il donne l'écran de la marque (D80) |
| `marque` | Marque acceptée, aucune table : la planche des rôles reste affichée | Constat, verdict de la saisie |
| `decisions` | Décisions en attente : la revue | Constat, verdict, table sans décision lue ; `decisions.json`, copie de `fixtures/marque-demo/decisions-valise.json`, en tranche 8 sur 15 |
| `livraison` | Feuilles ajoutées, pas encore prouvées | Constat, verdict, table qui a lu toutes les décisions, manifeste des feuilles ajoutées, rangé sous la réduction (`ajout/2026-11-24T1335/`, D86) |
| `bilan` | Rendu validé, suivi en cours ; sans `avant-apres.json`, l'avant et après (D86) | Tout, l'audit du constat, et la vérification : verdict (55 lignes, 54 arrivées, une seulement au survol), manifeste réduit à ses lignes (identifiant, famille, ancienne et nouvelle valeur), et par page `avant.png`, `actuel.png` et `verification.json` |
| `plusieurs` | Trois sites, une marque refusée | Trois constats ; Orbe Café et Écume et Sel acceptées, Brume (`#00ccff`) refusée |

Commandes jouées, depuis la racine du dépôt, `<p>` le projet, `<o>` son dossier `sorties` :

```
npm run composants -- <adresse>/desordre/carte.html /desordre/compte.html /desordre/gestion.html --out <o>/composants/orbe --nom "Annuaire des cafés"
npm run saisie -- <p>/marques/orbe/entree.json --verdict <o>/saisies/orbe.json && node src/cli/planche.js --marque <p>/marques/orbe
npm run reduce -- <adresse>/desordre/carte.html /desordre/compte.html /desordre/gestion.html --target fixtures/marque-demo/cible-valise.json --tokens <p>/marques/orbe/marque.resolver.json --sources fixtures/marque-demo/sources.json [--decisions <o>/decisions.json] --references <o>/references --out <o>/reductions
npm run ajout -- --modifications <o>/reductions/<hôte>/<horodatage>/modifications.json --sortie <o>/ajout/<horodatage>
npm run verify -- <adresse>/desordre/carte.html /desordre/compte.html /desordre/gestion.html --reference <o>/references --sources fixtures/marque-demo/sources.json --ajout <o>/ajout/<horodatage> --out <o>/verify
```

Pour `plusieurs`, le constat d'Écume et Sel porte sur `/annuaire/liste.html` et `/annuaire/fiche.html` avec `--signatures config/signatures/vuetify.json`, celui de Brume sur `/index.html` et `/page-2.html` ; les entrées viennent de `tokens/ecume-et-sel/entree.json` et d'une entrée écrite pour l'essai. Les décisions du bilan sont celles de `decisions-valise.json`, complétées par le candidat le plus proche, et la carte de plein gardée.

Extraits : seuls les champs que l'état lit sont gardés (`constat.json` : `chiffres`, `scores`, et pour `constat` les types et leurs versions ; `table.json` : les lignes avec leur valeur, usage, relation et classe, le résumé avant et après de chaque famille, les cartes de plein et leurs lignes, les décisions lues ; `verdict.json` : pages, état de chaque ligne, sortie). Les verdicts de la saisie et `decisions.json` sont entiers. `modifications.json` et `feuilles-ajoutees.json` sont vides : l'état ne lit que leur présence. Les écrans (`constat.html`, `revue.html`, `roles.html`) sont des pages de remplacement d'une ligne.

Complétés le 25/11/2026 (D86) :

- L'audit du constat, recopié dans `bilan`, porte aussi, pour chaque couleur et chaque usage, ses occurrences et son contenu (`count`, `content`), et les couleurs vues seulement à un état (`states.onlyInStates`) : relevés par un audit relancé ce jour-là sur les mêmes pages, avec le même fichier de sources, dont les champs déjà extraits coïncidaient tous.
- La vérification de `bilan` vient de la partie jouée le 25/11/2026 sur Orbe Café (dossier de jeu, réduction de 17 h 43, vérification de 17 h 44), rangée sous les horodatages du 24/11 : verdict (identifiant, titre, état, éléments touchés) et lignes du manifeste ; sa table reste celle du 24/11 (17 couleurs après la réduction, 16 le 25/11). Les images de chaque page sont des aplats de quelques pixels, de hauteurs différentes, écrits pour l'essai : l'état ne lit que leur présence et leur hauteur.
- Le 25/11/2026 aussi (D87), `bilan` porte de quoi écrire la remise, tiré de la même partie : `modifications.json` réduit à ses entrées (feuille, ligne, sélecteur, propriété, valeur écrite, variable, section), le manifeste des feuilles ajoutées complété (`tokensCss`, feuilles, déclarations : feuille, ligne, sélecteur, propriété, pages, écrite) et les cinq feuilles écrites par `npm run ajout`, telles quelles.
