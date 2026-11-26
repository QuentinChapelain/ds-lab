# Mon design system

Le dossier de travail de ds-lab pour un produit : tout ce que l'outil produit y est rangé (le projet, les sorties, la remise). Le code du produit n'y est pas, et l'outil n'y touche pas. Ce dossier est un dossier de projet : il sert à jouer le parcours de ds-lab sur un site, avec le skill du clone (`$DS_LAB`).

## Le site

- Son adresse se donne dans le chat : un site en ligne, ou une app servie sur le poste (`http://localhost:…`).
- Une app locale est servie par l'humain, pas par l'IA : elle doit répondre pendant toute la partie (la mesure, la réduction, l'avant et après la relisent). Si elle ne répond pas, le dire en une phrase, avec l'adresse, et demander de la relancer ; ne pas la lancer soi-même.
- La cible est `cible.json` (`target`) : les rayons, les espacements et les tailles vers lesquels on ramène l'existant ; ses couleurs sont remplacées par celles de la marque.
- Pas de `sources.json` : une feuille servie par une autre origine (un bandeau de cookies, un widget) est mesurée comme le reste. Si l'humain veut la décrire, le format est `fixtures/marque-demo/sources.json` du clone.

## Le projet

Pas encore de `projet.json` : le skill ds-lab conduit (section « Conduire »). La marque n'a pas d'entrée : elle se lit sur le site.

## Repartir de zéro

Quand l'humain dit « on repart de zéro », ou le demande autrement :

1. Arrêter les tâches de fond de ce dossier (le parcours servi). Pas l'app de l'humain : elle n'est pas lancée d'ici.
2. Lancer `node "$DS_LAB/src/cli/projet.js" "$PWD"` depuis ce dossier, sans demander : il remet le dossier à son départ, sans toucher au clone.
3. Oublier le projet d'avant. Ne pas fermer les onglets du panneau : en garder un.
4. Faire comme au premier message, chaque fois : relancer le parcours servi, avant le projet (« Avant le projet » de la conduite), charger le lancement dans l'onglet gardé, mettre le volet d'aperçu devant et vérifier qu'il l'est (« Le panneau » de la conduite), puis dire le lancement. « Ouvre l'écran avec le bouton Ouvrir » ne se dit qu'après avoir essayé de mettre le volet devant, sans y arriver.

Ne rien dire de la commande ni de ce qu'elle a effacé.

## Les tâches

Chaque commande lancée se décrit en français, avec les mots de l'humain, en fond ou non : « mesurer tes pages », « ranger tes choix et les appliquer ». Jamais en anglais. Le texte écrit entre deux outils s'affiche dans le chat : en français, à l'humain, ou rien.

## Regarder le site

Sans l'ouvrir dans le panneau : `npm run parcours -- --regarder <adresse>`, depuis le clone (« Avant le projet » de la conduite).
