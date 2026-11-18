31 lignes.
Lot « atelier », premier lot de l'étape des composants. Ce message contient l'attendu. Confronte-le d'abord au code, aux règles et aux décisions du dépôt, puis propose un plan et tes questions. N'installe et n'écris rien avant mon accord.

Contexte
- L'essai jetable de `local/essai-storybook/` (lis son `rapport.md`) a prouvé que Storybook 10 et Vuetify 4 marchent avec nos jetons. Ce lot fait entrer l'atelier dans le dépôt, proprement.
- Décisions prises : les composants seront des enveloppes maison autour de Vuetify 4 (Vue 3) ; l'atelier est Storybook 10 ; le passage à Storybook 11 se fera après sa sortie stable, dans un lot à part.
- Le bouton lui-même (enveloppe, nouveaux jetons, garde contre l'appel direct à Vuetify) est le lot suivant, pas celui-ci.

Ce que le lot livre
1. Une sortie « thème Vuetify » : une commande qui écrit, pour chaque marque de `tokens/`, ses thèmes clair et sombre depuis les jetons résolus. Une seule table de correspondance rôle → couleur Vuetify, commune à toutes les marques, documentée. Les couleurs de texte (`on-…`) sont fournies par nous, jamais calculées par Vuetify. Sortie déterministe, testée.
2. Storybook dans le dépôt, aux versions exactes de l'essai (storybook et `@storybook/vue3-vite` 10.6.7, vuetify 4.3.4, vue 3.5.45, vite 8.3.8), sauf correction de sécurité plus récente dans la même ligne, à signaler.
3. Un sélecteur dans la barre de Storybook : chaque marque de `tokens/`, en clair et en sombre. Le thème est toujours passé par son nom ; le défaut « system » ne sert jamais ; un nom inconnu échoue.
4. La police de la marque branchée (titres et texte), à la place de la police de repli vue dans l'essai.
5. Un seul exemple témoin : un `v-btn` nu, à retirer quand la première enveloppe arrivera. Il ne s'étire pas sur toute la largeur.
6. Une preuve rejouable : pour chaque thème, fond et texte calculés du témoin égaux aux jetons ; rendu identique en développement et en version construite.

Contraintes
- Branche tirée de `main`. Les contrôles du dépôt restent verts (types, knip, dépendances, contraste, espacements, typo, tests), la CI aussi.
- Chaque dépendance ajoutée est signalée, avec le résultat de `npm audit` et ton avis sur les 8 alertes vues dans l'essai.
- Aucun `!important`. Aucun nom de marque dans le code.
- Serveur de développement sur localhost, télémétrie coupée.
- README, ARCHITECTURE et décisions à jour ; cet attendu versé dans `docs/attendus/` une fois confronté.
- Hors lot : enveloppes, nouveaux jetons, manifeste et MCP de Storybook, addon d'accessibilité, tests Vitest, sortie Dart, Storybook 11.

Questions auxquelles ton plan doit répondre
a. Où vit l'atelier : à la racine, ou dans un dossier à part avec son propre `package.json` ? Dis l'effet de chaque option sur knip, dependency-cruiser, les types, le verrou de dépendances et la durée de la CI, puis recommande.
b. Que fait la CI de l'atelier : rien, la construction seule, ou la preuve du point 6 ?
c. `tokens/maison-alberto/` est dans la copie de travail, non suivi. Que coûterait de la garder comme cinquième marque fictive (tests, README, planches, feuille CSS) ? Je déciderai sur ta réponse.
d. Où va la table de correspondance, et quelles couleurs Vuetify couvre-t-elle au minimum pour ce lot ?
e. Découpage en commits, et ce que tu me montreras avant chaque commit.
FIN-DU-MESSAGE

## Réponses au plan, validées le 18/11/2026

12 lignes.
Plan accepté, avec ces réponses. Tu peux commencer par le commit 0 ; arrêt et accord avant chaque commit, comme tu l'as écrit.
1. Maison Alberto : on la garde comme cinquième marque fictive, en commit 0, avec la couverture complète (pas seulement les trois comptes). Une marque à moitié couverte serait une dette cachée. Inscris dans `KNOWN_ISSUES.md` que sa police des titres est sans fichier, donc non contrôlée.
2. `secondary` : sur l'accent, comme tu le proposes, avec son `on-` fourni. Écris dans la table que ce n'est jamais une couleur de bouton (D05) ; la garde viendra avec le lot du bouton.
3. Confirmé : `atelier/` à part avec son verrou ; preuve complète dans le job `controles` ; `@vitejs/plugin-vue` pas ajouté ; branche `atelier` tirée de `main`. Attendu versé sous `docs/attendus/atelier.md`, sans numéro d'étape.
4. Liseré blanc : laissé, inscrit en dette.
5. Alertes picomatch : acceptées avec ton raisonnement. Inscris la dette pour la racine et pour l'atelier, avec la consigne de relancer `npm audit` à chaque lot.
6. Garde du nom de thème : sur notre liste, pas sur celle de Vuetify, comme tu l'as vu.
7. L'en-tête de `docs/decisions.md` (« trente-huit » pour 40) : corrige-le dans le commit de documentation du commit 1, et dis-le dans le résumé.
8. Les lignes marquées [H] de la table (`primary-darken-1`, `surface-variant`, `surface-bright`, `surface-light`) restent étiquetées hypothèse dans leur `$description` : elles seront jugées sur les composants.
Avant le commit 0, montre-moi les valeurs attendues écrites à la main pour Maison Alberto et la commande culori qui les donne.
FIN-DU-MESSAGE
