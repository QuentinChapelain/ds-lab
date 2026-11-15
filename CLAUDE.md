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

## Commandes

```
npm test                 tous les tests
npm run contraste        paires de rôles de couleur ; sortie 1 si une paire échoue
npm run espacements      espacements par relation ; sortie 1 si une règle échoue
npm run typo             styles de texte ; sortie 1 si une règle échoue
```

Les trois contrôles restent à 0 échec, et npm test ne perd aucun vert, avant chaque commit et à la fin de chaque lot.

## Règles du design system

@docs/regles.md

## Quand lire quoi

- `ARCHITECTURE.md` : avant de toucher à `src/` ou d'ajouter un dossier, une commande ou une couche de jetons.
- `docs/decisions.md` : avant de changer un jeton, un nom de rôle ou une règle de contrôle.
- `KNOWN_ISSUES.md` : avant de proposer un lot, et pour y ajouter toute dette laissée en sortant.
- `docs/attendus/` : l'attendu nommé dans le message, avant le plan.
- `README.md` : avant de changer ce que l'outil fait ou ses commandes.
