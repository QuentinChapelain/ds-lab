# ds-lab

## But

Laboratoire de design system multi-marque, de l'audit à la génération par IA. Ce dépôt est public.

## Règles

- Marques fictives uniquement. Jamais de nom de client réel, ni feuille CSS, ni capture, ni donnée issue d'une plateforme réelle dans le dépôt.
- Le contenu de `.auth/` et de `local/` ne doit jamais être copié dans un fichier versionné ni dans un message de commit.
- Étiqueter chaque affirmation des rapports : [F] mesuré, [H] hypothèse, [V] à vérifier.
- Un design system ne se réduit pas à la couleur : audits et tokens couvrent aussi tailles, espacements, rayons, ombres, graisses, interlignages et durées.
- Tokens au format DTCG 2025.10.
- On avance par pas (D75) : une demande courte dans la boîte ; la réponse dans le terminal, dix lignes au plus (ce qu'on va faire, dans quel ordre, les questions), rien dans la boîte ; le « go » de Quentin ; le code, les contrôles, le commit poussé sur `main` ; une note courte dans la boîte (ce qui a changé, ce qu'il faut jouer) ; Quentin joue deux minutes, son verdict donne le pas suivant. Ni attendu écrit, ni arrêt, ni résumé de diff à valider, ni nouveau dossier de jeu.
- Aucun code avant le « go » ; signaler chaque dépendance ajoutée.
- Chaque écran s'arrête à « satisfaisant pour un POC » : on ne polit pas, on avance jusqu'au bout du parcours, puis on revient.
- Un pas n'est fini que si README, ARCHITECTURE et docs sont à jour.
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
npm run verifier         tokens, style et copie du skill d'un autre dépôt (--marques, --style, --skill) ; sortie 1 sur un échec
npm run parcours -- <projet.json> [--servir] [--attendre]   état d'un projet, faits du moment pour le chat, page du parcours (le lancement avant le projet) ; --attendre finit quand la main quitte l'humain ; sortie 2 sur un projet illisible
npm run jeu -- <dossier>   pose le dossier de jeu, branché sur ce clone, ou le remet à son départ ; le dossier de Quentin : ~/Developer/banc/parcours/jeu
npm run skill            réécrit les textes de skill/ds-lab/ après un changement de docs/regles.md ou de docs/techniques/
npm run types            types JSDoc de src/ (TypeScript, non strict, sans émission) ; sortie 1 s'il reste une erreur
npm run knip             fichiers, exports et dépendances qui ne servent plus ; sortie 1 s'il en reste
npm run dependances      cycles d'import, modules orphelins de src/ ; sortie 1 si une règle échoue
npm run style            style des composants et des modules (CP3) ; sortie 1 sur une valeur visuelle en dur
npm --prefix atelier run fiches -- --verifier   fiches des composants et des modules, table des noms ; sortie 1 si une fiche ne correspond plus
```

`npm run contraste` se lance aussi avec `--mode dark`, `--largeur narrow` et les deux : la CI juge les quatre contextes (D65). Les trois contrôles de la cible (contraste, espacements, typo) prennent `--marque <dossier>` ; sans l'option, ils jugent chaque marque de `tokens/` et sortent en 1 si une seule échoue (D26) ; `--marques <dossier>` juge chaque marque d'un autre dossier (D66). Aucune commande n'a de marque par défaut.

Les trois contrôles de la cible, npm run types, npm run knip, npm run dependances, npm run style et le contrôle des fiches restent à 0 échec, et npm test ne perd aucun vert, avant chaque commit. La CI (`.github/workflows/ci.yml`) rejoue ces commandes à chaque push ; elle ne remplace pas le lancement local.

Avant chaque commit qui touche `atelier/`, la table `tokens/commun/vuetify.json` ou la sortie thème Vuetify : `npm --prefix atelier run build`, puis `npm --prefix atelier run preuve` à 0 échec ; la CI la rejoue à chaque push, un job par composant (`npm --prefix atelier run preuve -- <composant>`, D53).

On travaille sur `main`. main n'accepte qu'un push en avance rapide d'un commit dont le check `controles` est vert (ruleset « main protégée », D35) : pousser le commit sur une branche jetable, attendre sa CI, pousser le même commit sur main, supprimer la branche, sans arrêt ni annonce : c'est la cuisine de Claude. Quentin joue dès que c'est codé, sans attendre la CI. La CI de main, rejouée sur ce même commit, n'est pas attendue pour clore le pas : elle reste une trace, et un rouge y est lu au départ du pas suivant (D53).

`npm audit` à la racine et dans l'atelier à chaque pas ; un avis ouvert entre dans `KNOWN_ISSUES.md`.

Node : la version de `.node-version` (Node 24 LTS), seule source pour le poste, la CI et la garde des commandes (D40). Une commande de l'outil lancée sous une autre version majeure sort en 2 avant de lire son entrée : vérifier `node -v` avant les commandes.

## Règles du langage produit

@docs/regles.md

## Quand lire quoi

- `ARCHITECTURE.md` : avant de toucher à `src/` ou d'ajouter un dossier, une commande ou une couche de jetons.
- `docs/decisions.md` : avant de changer un jeton, un nom de rôle ou une règle de contrôle.
- `docs/anciens-noms.json` : pour lire un nom de token cité par une décision ou un attendu d'avant le 21/11/2026 (D62).
- `docs/identifiants.md` : avant de citer ou de créer un identifiant de règle.
- `docs/contrat-de-marque.md` : avant de toucher à la saisie ou à un motif de refus.
- `KNOWN_ISSUES.md` : la dette à payer, avec son moment ; avant de proposer un pas, et pour y ajouter toute dette laissée en sortant. Une limite acceptée s'écrit à sa place (puce « Limite » de sa décision, fiche, README, ARCHITECTURE), pas dans ce fichier (D64).
- `docs/feuille-de-route.md` : ce qui manque au design system ; avant de proposer un composant ou un token.
- `docs/attendus/` : les attendus d'avant le 25/11/2026, en archive ; on n'en écrit plus (D75).
- `README.md` : avant de changer ce que l'outil fait ou ses commandes.
- `docs/regles.md` : avant de nommer un composant, une prop ou un token, d'écrire une fiche (NM, CP, DOC), ou d'écrire ou de changer une règle (ses huit règles d'écriture, D65).
- `docs/techniques/` : le comment d'une règle dans un framework, une ligne par règle ; avant de toucher à une enveloppe ou d'ajouter un framework.
- `skill/ds-lab/` : ce que reçoit une autre équipe (D66) ; après un changement de `docs/regles.md` ou de `docs/techniques/`, `npm run skill`.
- `docs/composants/` et `docs/modules/` : avant d'employer ou de changer un composant ou un module ; après un changement de props, de rendu ou de tokens, `npm --prefix atelier run fiches` régénère les fiches (D56, D61).
