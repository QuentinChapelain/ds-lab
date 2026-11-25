---
name: ds-lab
description: Design system multi-marque d'une app Vuetify, outillé par un clone de ds-lab. À prendre pour saisir une marque, contrôler ses tokens et le style des composants, ou écrire un composant qui suit les règles du design system.
---

# ds-lab

Ce skill sert quand on saisit une marque, quand on touche à ses tokens ou à son thème Vuetify, quand on écrit ou change le style d'un composant, et avant de pousser : `verifier` dit ce qui bloque.

## Avant de commencer

- Un clone de ds-lab, à l'endroit de son choix, avec `npm ci` lancé dedans. `printenv DS_LAB` donne le chemin du clone ; s'il ne rend rien, demander à l'humain. Le code de ds-lab ne lit pas cette variable : elle ne sert qu'aux commandes ci-dessous.
- Node 24 : sous une autre version majeure (`node -v`), chaque commande sort en 2 sans rien lire. Chercher alors un Node 24 installé, par le gestionnaire présent (`command -v fnm nvm`), jamais un absent ; sinon, demander à l'humain de l'installer.
- La saisie d'une police de titre donnée par ses fichiers mesure l'encre dans Chromium, celui de `playwright-core` du clone.

Le code fait foi sur ce guide : si une commande, un fichier ou une règle du clone contredit ce guide, suivre le clone et signaler l'écart à l'humain.

## Quatre mots

- **Règle** : vraie ou fausse, un contrôle la tranche, elle bloque.
- **Défaut** : une valeur posée ; il bloque comme une règle et se change par une décision écrite.
- **Technique** : le comment d'une règle dans Vuetify (`techniques/vuetify.md`).
- **Consigne** : elle se lit, rien ne la contrôle, elle ne bloque pas (`consignes.md`).

Une règle bloque, une consigne se lit. Les règles et les défauts sont dans `regles.md`.

<!-- compte : écrit par npm run skill, depuis docs/regles.md -->
Dans ce dépôt, `verifier` contrôle 16 des 43 règles et défauts ; 27 ne sont pas contrôlés ici. Pour une règle « Non contrôlée ici », rien ne bloque : l'agent la tient en la lisant.
<!-- /compte -->

## L'ordre

1. **Saisir chaque marque** depuis son entrée, la seule chose écrite à la main : `node "$DS_LAB/src/cli/saisie.js" tokens/<marque>/entree.json`. La saisie écrit la marque à côté de l'entrée, ou la refuse avec son motif. Le format de l'entrée est dans `docs/contrat-de-marque.md` du clone.
2. **Écrire le thème** de chaque marque : `node "$DS_LAB/src/cli/vuetify.js" --marque tokens/<marque>`.
3. **Vérifier** : `node "$DS_LAB/src/cli/verifier.js" --marques tokens --style "src/**/*.vue" --skill .claude/skills/ds-lab`. Sortie 0 : rien ne bloque. Sortie 1 : chaque ligne dit ce qui échoue, la règle, et ce qu'il faut faire. Sortie 2 : une panne, son message dit quoi passer.
4. **Écrire les composants** : lire `regles.md`, `consignes.md` et `techniques/vuetify.md`. Une valeur visuelle vient d'une variable du thème, `var(--v-ds-…)` ou `rgb(var(--v-theme-…))` ; une exception s'écrit sur place, avec sa règle et sa raison. Les composants `Ds…` du clone (`atelier/composants/`) sont un exemple et un gabarit, pas un produit.

Ne jamais corriger les tokens à la main : changer l'entrée et relancer la saisie.

## Conduire

Seulement si l'humain donne une adresse, ou plusieurs, un fichier de projet (`projet.json`), ou appelle le skill sans autre demande. Lire alors `contexte.md` puis `conduire.md` en entier avant le premier message, et les suivre : le lancement, la voix, les faits de `npm run parcours`, ce qui s'enchaîne sans demander.

## Dans la CI

Une étape clone ds-lab à un commit fixé, lance `npm ci` dans le clone, puis la commande de l'étape 3. Changer ce commit change les couches communes que les marques lisent : relancer `verifier` en local avant, et recopier ce skill si `verifier` le demande.

## Limites

- Le skill est en français, la langue de ds-lab.
- Les couches communes (`ds-lab:commun/…` dans chaque resolver) sont celles du clone qui lit.
- Une règle « Non contrôlée ici » ne bloque pas dans ce dépôt.
