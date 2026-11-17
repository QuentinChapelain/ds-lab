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

## Commandes

```
npm test                 tous les tests
npm run contraste        paires de rôles de couleur ; sortie 1 si une paire échoue
npm run espacements      espacements par relation ; sortie 1 si une règle échoue
npm run typo             styles de texte ; sortie 1 si une règle échoue
npm run types            types JSDoc de src/ (TypeScript, non strict, sans émission) ; sortie 1 s'il reste une erreur
npm run knip             fichiers, exports et dépendances qui ne servent plus ; sortie 1 s'il en reste
npm run dependances      cycles d'import, modules orphelins de src/ ; sortie 1 si une règle échoue
```

Les trois contrôles de la cible (contraste, espacements, typo) prennent `--marque <dossier>` ; sans l'option, ils jugent chaque marque de `tokens/` et sortent en 1 si une seule échoue (D26). Aucune commande n'a de marque par défaut.

Les trois contrôles de la cible, npm run types, npm run knip et npm run dependances restent à 0 échec, et npm test ne perd aucun vert, avant chaque commit et à la fin de chaque lot. La CI (`.github/workflows/ci.yml`) rejoue ces commandes à chaque push ; elle ne remplace pas le lancement local.

main n'accepte qu'un push en avance rapide d'un commit dont le check `controles` est vert (ruleset « main protégée », D35) : pousser la branche, attendre la CI, pousser le même commit sur main, supprimer la branche.

Node : la version de `.node-version` (Node 24 LTS). Vérifier `node -v` avant les commandes : sous Node 25, `npm run dependances` refuse de démarrer.

## Règles du design system

@docs/regles.md

## Quand lire quoi

- `ARCHITECTURE.md` : avant de toucher à `src/` ou d'ajouter un dossier, une commande ou une couche de jetons.
- `docs/decisions.md` : avant de changer un jeton, un nom de rôle ou une règle de contrôle.
- `docs/identifiants.md` : avant de citer ou de créer un identifiant de règle.
- `docs/contrat-de-marque.md` : avant de toucher à la saisie ou à un motif de refus.
- `KNOWN_ISSUES.md` : avant de proposer un lot, et pour y ajouter toute dette laissée en sortant.
- `docs/attendus/` : l'attendu nommé dans le message, avant le plan.
- `README.md` : avant de changer ce que l'outil fait ou ses commandes.
