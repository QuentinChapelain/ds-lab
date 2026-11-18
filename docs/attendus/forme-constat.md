# Attendu : forme du constat (audit des composants, second lot)

Message de Claude, validé par Quentin le 18/11/2026, mot pour mot (`2026-11-18-06-de-claude-lot-forme-du-constat.md`), puis les réponses au plan (`2026-11-18-08-de-claude-reponses-plan-forme-du-constat.md`). Go de Quentin le 18/11/2026.

## Message

Version : v1 (18/11/2026, 20 h 55). De : Claude, pour Claude Code, terminal de ds-lab. Même texte dans le projet Claude (`attendu-forme-constat-v1.md`) et dans la boîte aux lettres (`2026-11-18-06-de-claude-lot-forme-du-constat.md`).
Étiquettes : **[F]** vérifié · **[H]** proposition, à confronter au code · **[Q]** dit par Quentin.

### Pourquoi ce lot

Quentin a ouvert les constats A et B sur téléphone à 20 h 35 : « visuellement c'est pas super, trop d'info-bulles et le style est pas génial ; ça manque de guidage » [Q]. Les chiffres et le relevé sont justes : ce lot ne touche qu'à la forme. Il a validé une maquette à 20 h 54 (« on suit tes recos, go ») [Q].

### PLAN SEULEMENT d'abord

Aucun fichier modifié, aucun commit avant le go.

0. Contrôle : `git status` propre ; branche `main` ; HEAD = origin/main = `24ec123` ; CI de main verte. Sinon arrête-toi et dis pourquoi.
1. Crée la branche `forme-constat`.
2. Plan pour refaire la forme des trois sorties (`constat.html` d'abord, `constat.md` et `constat.json` en cohérence). **Aucun chiffre existant ne change** : relevé, versions, scores, décisions, noms stables, codes de sortie restent tels quels. Si un point ci-dessous oblige à changer un chiffre, dis-le au lieu de le faire.

### Ce que le constat devient, dans l'ordre

| Bloc | Contenu |
|---|---|
| En-tête | Titre ; une ligne : nom du site, nombre de pages, framework. La taille de fenêtre et la date descendent dans « Limites de cet audit ». Propose comment nommer le site autrement que par une adresse technique (option `--nom` [H]) |
| Phrase | « N éléments, de T types. Pour D types, le site a plusieurs versions du même élément. » Si D vaut 0 : « Chaque type n'a qu'une version. » La phrase longue actuelle (framework, faits autrement, blocs) reste dans le Markdown et le JSON |
| **Ce qu'il vous reste à faire** | Trois lignes, chacune avec son nombre, et omise si le nombre est 0 : « types à doublons : choisir la version à garder » ; « types à une seule version : confirmer » ; « blocs non identifiés : les rattacher ou les laisser ». Si tout est à 0 : « Rien à faire : toutes les versions à garder sont choisies. » Chaque ligne est un lien vers sa partie |
| Scores | Quatre cartes, deux par ligne : « Source unique », « Accessibilité de base », « Versions choisies », « Éléments identifiés ». Le (i) est sur la même ligne que le titre. Puis l'effort, en une phrase : « E endroits à modifier pour n'avoir qu'une version par type. » |
| Types à doublons | D'abord, triés par nombre d'éléments hors de la version la plus répandue, puis par nom. Un type dont la version à garder est déjà choisie passe après ceux qui restent à choisir |
| Types à une seule version | Ensuite, repliés (`<details>`), une ligne chacun : nom, « x fois », origine. Dépliés : la même fiche qu'un type à doublons |
| Non identifiés | Comme aujourd'hui, avec la grande vignette et la ligne « À faire » |
| Comment lire ce constat | Un seul bloc replié, en bas, avant les limites : les définitions de type d'élément, version, origine, version à garder, non identifiés (textes actuels des (i)) |
| Limites de cet audit | Comme aujourd'hui, plus la fenêtre et la date |

### La fiche d'un type

- Titre ; « x fois, en n versions ».
- Par version : **la vignette en pleine largeur, à la taille réelle de l'élément** (réduite seulement si elle dépasse la colonne), sur un fond neutre ; dessous, l'étiquette d'origine, le nom court (`v-btn`), « x fois », et « la plus répandue » s'il y a lieu (à égalité : « à égalité » sur chacune).
- **Défauts d'accessibilité écrits sur la version concernée**, en mots simples : « sans nom pour les lecteurs d'écran », « hors d'atteinte au clavier », « zone de clic trop petite » ; précédés de « k sur x : » si tous les éléments de la version ne sont pas touchés.
- **Différences écrites sous l'image** quand le type a plusieurs versions : seulement les mesures qui diffèrent entre les versions du type, par exemple « bordure 1 px, arrondi 2 px » contre « sans bordure, arrondi 0 ». Règle déterministe à proposer ; aucune couleur.
- Un seul « Voir le code » par type, pour toutes ses versions : nom à recopier dans le fichier de décisions, endroit, extrait, mesures complètes, apparences.
- Une ligne **« À faire »** en fin de fiche, dans un encadré :
  - doublons, rien de choisi : « Choisir la version à garder. Si c'est la plus répandue, E endroits seront à remplacer. » (E = éléments du type hors de la plus répandue ; à égalité, le chiffre est le même pour chacune des premières) ;
  - doublons, version choisie : « Version à garder : nom. E endroits à remplacer. » ;
  - une seule version, non confirmée : « Confirmer cette version comme version à garder. » ;
  - une seule version, choisie : « Version à garder : nom. Rien à remplacer. »
- **Confirmer** n'est pas un nouveau mécanisme : c'est une ligne `garder` dans le fichier de décisions, comme aujourd'hui. Un type à une seule version ne compte pas comme choisi d'office [Q].
- Les noms longs (`type / origine / nom`) ne paraissent plus que dans « Voir le code ».

### Info-bulles

Quatre (i) seulement, sur les quatre scores [Q : « trop d'info-bulles »]. Plus aucun (i) sur les titres de type, « Version », « Origine », « Version à garder », « Non identifiés ».

### Style

- Lisible sur téléphone à 390 px, sans défilement horizontal ; clair et sombre selon le réglage du système.
- Hiérarchie nette : un titre de partie, des fiches à bord fin et coins arrondis, du blanc entre les fiches, texte secondaire en gris.
- Étiquettes d'origine toujours neutres, aucune couleur de jugement. Une seule couleur d'accent, pour l'encadré « À faire » et les nombres du bloc « Ce qu'il vous reste à faire ».
- **Dis si le constat peut prendre ses valeurs dans les jetons de ds-lab** (rôles neutres communs, clair et sombre, écrits en ligne dans le fichier), plutôt que des valeurs écrites à la main [H]. Si c'est simple, fais-le ; sinon dis ce que ça coûte.
- Dis si les captures peuvent être prises à densité 2 pour rester nettes, et ce que cela change pour le poids du fichier et l'invariant à l'octet.

### Valeurs attendues, écrites avant le code

| | Lancement A | Lancement B |
|---|---|---|
| Phrase | 27 éléments, de 7 types ; 4 types à plusieurs versions | 30 éléments, de 7 types ; 5 types à plusieurs versions |
| Types à doublons à choisir | 4 | 4 (le bouton avec texte est déjà choisi) |
| Types à une seule version à confirmer | 3 (carte, onglet, case à cocher) | 2 (onglet, case à cocher) |
| Blocs non identifiés à décider | 1 (an-carte, 3 fois) | ligne omise |
| Bouton avec texte, « À faire » | « Choisir… Si c'est la plus répandue, 3 endroits… » | « Version à garder : v-btn. 3 endroits à remplacer. » |
| Champ de texte, « À faire » | « Choisir… Si c'est la plus répandue, 2 endroits… » | idem |
| Défauts écrits | bouton sans style : zone de clic ; an-icone : sans nom ; an-liste : « 1 sur 2 : hors d'atteinte au clavier » | idem |
| Nombre de (i) | 4 | 4 |
| Scores et effort | inchangés | inchangés |

Si un de ces chiffres te paraît faux, dis-le au lieu de l'ajuster.

### Fini quand

| Critère | Preuve |
|---|---|
| Les valeurs ci-dessus sortent de la commande, A et B | Tests |
| Aucun chiffre du lot précédent ne change | Tests existants verts, sans les affaiblir |
| Quatre (i), aucun « enveloppe », aucun défilement à 390 px, vignette jamais plus petite que l'élément sauf dépassement | Tests |
| Déterminisme à l'octet maintenu | Test existant |
| Textes dans `constat.textes.json` ; attendu dans `docs/attendus/forme-constat.md` (ce message, puis les réponses au plan) ; D47 ou complément de D46, README, KNOWN_ISSUES | Relecture |
| Contrôles, types, knip, dépendances à 0 ; CI de la branche verte | CI |
| Quentin ouvre les constats A et B sur téléphone et juge | Arrêt 2, **avant toute fusion** |

Hors lot : tout nouveau relevé, tout nouveau score, le rapport pour le développeur, une interface pour saisir les décisions, tout site réel.

### Plan attendu, et arrêts

Pour chaque point : fichiers touchés, tests modifiés ou ajoutés (dis lesquels des tests de textes changent, puisque les (i) changent), commits, dépendance s'il y en a (aucune attendue). Marque [H] ce que tu supposes.

1. Arrêt 1 : écris le plan dans `local/boite-aux-lettres/2026-11-18-07-de-claude-code-plan-forme-du-constat.md` et affiche-le.
2. Arrêt 2 : branche poussée pour la CI, **rien sur main** ; compte rendu dans `…-09-de-claude-code-arret-2-forme-du-constat.md` avec les chemins des constats A et B, les valeurs obtenues contre attendues, le lien de la CI, les écarts au plan.

### Preuve

Constats A et B du lot précédent rendus par Claude à 390 px le 18/11 à 20 h 33 ; avis de Quentin à 20 h 35 et 20 h 54 ; maquette montrée à 20 h 37 dans la conversation. Dépôt lu à 20 h 52 : `main` à `24ec123`, CI verte (exécution 44382186537). Valeurs du tableau calculées à la main depuis le constat de A et les décisions de B. Non vérifié : le code de `src/report/constat.js` ; la faisabilité des jetons en ligne et de la densité 2.

## Réponses au plan

| Point | Réponse |
|---|---|
| R1, arrondi en pourcentage | (a) : converti en px depuis la boîte de la pièce. Exception au « relevé tel quel », à dire dans D47 |
| R2, cadre d'un champ Vuetify | **Pas en dette : à corriger dans ce lot**, dans un commit à part, avant le commit de la forme. Une ligne qui dit « sans bordure » sous l'image d'un champ bordé trompe le lecteur, et ce constat est jugé à l'œil. Fais ce que tu décris : un champ `boite` facultatif par signature, qui dit quel élément intérieur mesurer (`.v-field` pour `v-text-field` et `v-select`). Condition : **aucun compte ne change** (éléments, versions, apparences, scores, effort) ; seules des mesures changent. Si un compte bouge, arrête-toi et dis lequel. Écris dans D47 que c'est le second changement du relevé de ce lot, avec R1 |
| R3, nom du site | `--nom`, l'hôte par défaut, pas de lecture des titres. Les lancements A et B de l'arrêt 2 sont faits avec `--nom "Annuaire des cafés"` |
| R4, `densite` | Oui, 2 ; un relevé sans ce champ vaut 1 |
| Jetons | Oui : rôles neutres communs, clair et sombre, en variables CSS dans le fichier ; accent = `texte.info` |
| Bloc « laissé tel quel » | Décidé : il ne compte pas dans « à faire » |
| Singuliers | « 1 type à doublons », « 1 bloc non identifié : le rattacher ou le laisser », « 1 endroit sera à remplacer » : oui |
| Nom court ambigu | Nom court, plus l'origine si deux versions du type portent le même : oui |
| « À faire » d'un bloc, limite de date | Tes textes, tels que proposés |
| Ordre du JSON | Inchangé ; l'ordre guidé est calculé au rendu : oui |
| Tests, commits | D'accord ; quatre commits avec celui de R2 |

### Rappels

- Rien sur `main`. Pousse la branche `forme-constat` pour la CI, puis arrête-toi.
- Arrêt 2 : compte rendu dans `local/boite-aux-lettres/2026-11-18-09-de-claude-code-arret-2-forme-du-constat.md`, avec les chemins des constats A et B, les valeurs obtenues contre attendues, les mesures du relevé qui ont changé par R1 et R2 (avant, après), le lien de la CI et les écarts au plan.
