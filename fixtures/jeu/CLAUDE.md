# Annuaire des cafés

Le produit à migrer, sur un seul site : la marque fictive Orbe Café. Ce dossier est un dossier de jeu : il sert à jouer le parcours de ds-lab, avec le skill du clone (`$DS_LAB`).

## Le site

- Il n'est pas en ligne : il se sert en local. Avant toute commande qui le lit, et avant de le regarder, le lancer en tâche de fond depuis ce dossier : `node site.mjs`. Il répond sur http://127.0.0.1:4173 ; s'il répond déjà, ne pas le relancer.
- Ses pages commencent à http://127.0.0.1:4173/desordre/carte.html.
- Ses feuilles tierces (un bandeau de cookies servi par une autre origine) sont décrites dans `sources.json` : le nommer dans le projet (`sources`). La cible est `cible.json` (`target`).

## Le projet

Pas encore de `projet.json` : le skill ds-lab conduit (section « Conduire »). La marque n'a pas d'entrée : elle se lit sur le site.

## Repartir de zéro

Quand l'humain dit « on repart de zéro », ou le demande autrement :

1. Arrêter les tâches de fond de ce dossier (le site, le parcours servi).
2. Lancer `node "$DS_LAB/src/cli/jeu.js" "$PWD"` depuis ce dossier, sans demander : il remet le dossier à son départ, sans toucher au clone.
3. Oublier le projet d'avant. Ne pas fermer les onglets du panneau : en garder un.
4. Faire comme au premier message, chaque fois : relancer le site et le parcours servi, avant le projet (« Avant le projet » de la conduite), charger le lancement dans l'onglet gardé, vérifier qu'il est devant, puis dire le lancement. Si l'écran ne se voit pas, le dire une fois : « ouvre l'écran avec le bouton Ouvrir ».

Ne rien dire de la commande ni de ce qu'elle a effacé.
