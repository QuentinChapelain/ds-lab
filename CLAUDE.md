# ds-lab

## But

Laboratoire de design system multi-marque, de l'audit à la génération par IA. Ce dépôt est public.

## Règles

- Marques fictives uniquement. Jamais de nom de client réel, ni feuille CSS, ni capture, ni donnée issue d'une plateforme réelle dans le dépôt.
- Le contenu de `.auth/` et de `local/` ne doit jamais être copié dans un fichier versionné ni dans un message de commit.
- Étiqueter chaque affirmation des rapports : [F] mesuré, [H] hypothèse, [V] à vérifier.
- Un design system ne se réduit pas à la couleur : audits et tokens couvrent aussi tailles, espacements, rayons, ombres, graisses, interlignages et durées.
- Tokens au format DTCG 2025.10.
- Proposer un plan avant tout code ; signaler chaque dépendance ajoutée.
- Lis l'attendu nommé dans le message (`docs/attendus/<fichier>`) avant de proposer un plan ; si le message contient lui-même l'attendu, c'est lui : ne le cherche pas.
- Un lot n'est fini que si README, ARCHITECTURE et docs sont à jour.
- Aucun nom de marque dans le code de `src/`, chaînes comprises, commentaires exclus (`test/marque-en-dur.test.js`, D26).
- Aucun numéro de lot, d'étape ou de séance dans les commentaires, les titres de tests, les noms de fichiers de test ni les textes que l'outil écrit (`test/histoire.test.js`).
- Aucun module de `src/` hors de `src/cli/` n'importe de `src/cli/` (`test/couches.test.js`).
- Aucun bouton de Vuetify (`VBtn`, `v-btn`) hors de `atelier/composants/DsButton.vue` : passer par l'enveloppe (`test/enveloppe-bouton.test.js`, D43).
- Aucun champ de Vuetify (`VTextField`, `VField`, `VInput`, `v-text-field`) hors de `atelier/composants/DsTextInput.vue`, ni carte (`VCard`, `v-card`) hors de `atelier/composants/DsCard.vue`, ni avatar (`VAvatar`, `v-avatar`) hors de `atelier/composants/DsAvatar.vue`, ni puce (`VChip`, `v-chip`) hors de `atelier/composants/DsTag.vue` (`test/enveloppe-bouton.test.js`, D49, D50, D54, D55).
- Chaque enveloppe déclare son menu dans son fichier `.menu.js` et passe par `atelier/composants/fabrique.js` (`test/fabrique-enveloppes.test.js`, D51).
- Aucune pièce de Vuetify ni valeur visuelle dans `atelier/modules/` : un module assemble des composants `Ds…` par la fabrique et ne porte que la mise en page, par les variables du thème, des mots-clés, 0 et 100 % (`test/modules.test.js`, D61).
- Chaque fichier de test entre dans une part de `test/parts-de-la-ci.json`, la plus légère, et une seule (`test/parts-de-la-ci.test.js`, D58).

## Commandes

```
npm test                 tous les tests
npm run contraste        paires de rôles de couleur ; sortie 1 si une paire échoue
npm run espacements      espacements par relation ; sortie 1 si une règle échoue
npm run typo             styles de texte ; sortie 1 si une règle échoue
npm run types            types JSDoc de src/ (TypeScript, non strict, sans émission) ; sortie 1 s'il reste une erreur
npm run knip             fichiers, exports et dépendances qui ne servent plus ; sortie 1 s'il en reste
npm run dependances      cycles d'import, modules orphelins de src/ ; sortie 1 si une règle échoue
npm --prefix atelier run fiches -- --verifier   fiches des composants et des modules, table des noms ; sortie 1 si une fiche ne correspond plus
```

Les trois contrôles de la cible (contraste, espacements, typo) prennent `--marque <dossier>` ; sans l'option, ils jugent chaque marque de `tokens/` et sortent en 1 si une seule échoue (D26). Aucune commande n'a de marque par défaut.

Les trois contrôles de la cible, npm run types, npm run knip, npm run dependances et le contrôle des fiches restent à 0 échec, et npm test ne perd aucun vert, avant chaque commit et à la fin de chaque lot. La CI (`.github/workflows/ci.yml`) rejoue ces commandes à chaque push ; elle ne remplace pas le lancement local.

Avant chaque commit qui touche `atelier/`, la table `tokens/commun/vuetify.json` ou la sortie thème Vuetify : `npm --prefix atelier run build`, puis `npm --prefix atelier run preuve` à 0 échec ; la CI la rejoue à chaque push, un job par composant (`npm --prefix atelier run preuve -- <composant>`, D53).

main n'accepte qu'un push en avance rapide d'un commit dont le check `controles` est vert (ruleset « main protégée », D35) : pousser la branche, attendre sa CI, pousser le même commit sur main, supprimer la branche. La CI de main, rejouée sur ce même commit, n'est pas attendue pour clore le lot : elle reste une trace, et un rouge y est lu au contrôle de départ du lot suivant (D53).

`npm audit` à la racine et dans l'atelier à chaque lot ; un avis ouvert entre dans `KNOWN_ISSUES.md`.

Node : la version de `.node-version` (Node 24 LTS), seule source pour le poste, la CI et la garde des commandes (D40). Une commande de l'outil lancée sous une autre version majeure sort en 2 avant de lire son entrée : vérifier `node -v` avant les commandes.

## Règles du langage produit

@docs/regles.md

## Quand lire quoi

- `ARCHITECTURE.md` : avant de toucher à `src/` ou d'ajouter un dossier, une commande ou une couche de jetons.
- `docs/decisions.md` : avant de changer un jeton, un nom de rôle ou une règle de contrôle.
- `docs/anciens-noms.json` : pour lire un nom de token cité par une décision ou un attendu d'avant le 21/11/2026 (D62).
- `docs/identifiants.md` : avant de citer ou de créer un identifiant de règle.
- `docs/contrat-de-marque.md` : avant de toucher à la saisie ou à un motif de refus.
- `KNOWN_ISSUES.md` : la dette à payer, avec son moment ; avant de proposer un lot, et pour y ajouter toute dette laissée en sortant. Une limite acceptée s'écrit à sa place (puce « Limite » de sa décision, fiche, README, ARCHITECTURE), pas dans ce fichier (D64).
- `docs/feuille-de-route.md` : ce qui manque au design system ; avant de proposer un composant ou un token.
- `docs/attendus/` : l'attendu nommé dans le message, avant le plan.
- `README.md` : avant de changer ce que l'outil fait ou ses commandes.
- `docs/regles.md` : avant de nommer un composant, une prop ou un token, ou d'écrire une fiche (NM, CP, DOC).
- `docs/composants/` et `docs/modules/` : avant d'employer ou de changer un composant ou un module ; après un changement de props, de rendu ou de tokens, `npm --prefix atelier run fiches` régénère les fiches (D56, D61).
