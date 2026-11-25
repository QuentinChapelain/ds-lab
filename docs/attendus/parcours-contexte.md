# Attendu : le parcours cible, lot 1, reprise. Le contexte à la place du dialogue

Attendu écrit le 25/11/2026, avant le code, par Claude Code (boîte, 25/11, fichier 02), en réponse à la demande de reprise (fichier 01). Go de Quentin le 25/11/2026, avec trois précisions [Q] : le lancement finit par « Colle l'adresse de ton site, ou de plusieurs, pour commencer. » ; « sans toucher à ton site » et la voix allégée acceptés ; un commit d'étape sur la branche pour l'essai J-3.

Étiquettes : [F] lu ou mesuré, [H] hypothèse, [V] à vérifier, [Q] tranché par Quentin, [C] tranché par Claude, [P] proposé par Claude Code.

## Départ [F, lu le 25/11/2026]

Branche `parcours-conduite` à `a427256`, copie propre, `npm test` non relancé (1 139 d'après le commit). Lus : `SKILL.md`, `conduire.md`, `src/parcours/dialogue.js`, `src/cli/parcours.js`, le haut de `src/parcours/etat.js`, l'attendu `docs/attendus/parcours-conduite.md`.

## Ce que fait la reprise [P]

| # | Pièce | Ce qui change |
|---|---|---|
| R1 | Fiche | `skill/ds-lab/contexte.md`, écrite à la main, une page (400 mots au plus), aux sept parties du fichier 01. Les faits des 26 réponses y entrent ; leurs répliques non |
| R2 | Faits | `parcours` écrit, à la place de « Pour le chat », un bloc de faits sans guillemets (Q2) |
| R3 | Lancement | En tête de `contexte.md`, seul texte fixe, entre deux marques. Rien d'autre n'est dit mot pour mot |
| R4 à R6 | Conduite | `conduire.md` réécrit et raccourci : formulaire réservé, rien de l'interface ni de la cuisine, ne pas redire, voix allégée |
| — | Retraits | `docs/dialogue-du-parcours.md`, `src/parcours/dialogue.js`, le bloc des ouvertures de `npm run skill` (`avecOuvertures`), la section « Les moments » et « Avant le projet » de `conduire.md`, les tests des 13 moments et des deux questions |
| — | Décision | D74 : le contexte à la place du dialogue. D73 garde L4 à L7 et la main à l'outil ; sa partie dialogue est remplacée |

Ce qui reste tel quel : l'entrée par une adresse et la règle des pages, l'enchaînement sans demander, l'accompagnement aux décisions, L5, L6, L7, la main à l'outil pour la pose, la ligne Node.

## Les cinq questions

### Q1. Où vit la fiche, et comment être sûr qu'elle est lue

**Où** : un fichier à part, `skill/ds-lab/contexte.md`, recopié par `npm run skill` comme `conduire.md`. Pas dans `SKILL.md` (498 mots sur 500), pas en tête de `conduire.md` : la fiche sert aussi aux questions, elle doit se lire seule, en une page.

**Le renvoi** : la section « Conduire » de `SKILL.md` dit « Lire alors `contexte.md` puis `conduire.md` en entier avant le premier message ». Deux mots de plus, repris ailleurs dans la section ; le plafond de 500 reste tenu par son test.

**Être sûr** : aucun mécanisme ne garantit qu'une IA lit un fichier. Le levier le plus fort [P] : le lancement n'existe **que** dans `contexte.md`. Pour dire son premier message, l'IA doit l'avoir ouvert. Si elle improvise son lancement, l'essai J-3 le voit en dix secondes.

### Q2. Ce que `parcours` donne à la place des messages

Des lignes de faits, une par fait, sans guillemets ni phrase à dire, tirées de l'état déjà calculé (`fait`, `main`, `ecran`, `chiffres`, `reportes`). Forme, au moment du constat [P ; chiffres pour l'exemple, pas tirés d'une sortie] :

```
Pour le chat, faits à dire avec tes mots :
  Fait : le constat de 3 pages
  Chiffre : 11 versions de composants
  Écran : le constat
  Ensuite : la marque, prise dans son fichier
  Main : l'outil ; enchaîner
  Reporté : 3 choix
  Durée : 42 min depuis le premier constat
```

Une ligne absente quand elle est vide. Un seul chiffre. Les mots sont ceux de l'humain : ni nom de fichier, ni mot de l'outil. Le choix des 13 moments disparaît du code : le fait suit l'étape en cours, et l'IA le dit dans la voix.

### Q3. Ce qu'un test tient encore

| Contrôle | Où |
|---|---|
| `contexte.md` existe, tient en 400 mots, porte les sept parties, et n'a aucun mot à éviter (mots de l'outil, « Bienvenue », « conforme », « Other », « formulaire ») | SK, étendu |
| Le lancement est le seul texte entre ses deux marques, et le seul entre guillemets de `contexte.md` ; deux messages au plus ; il finit sur la demande de l'adresse | SK |
| `conduire.md` ne dit plus « mot pour mot », n'a plus de bloc d'ouvertures | SK |
| Pour chaque fixture, la sortie de `parcours` ne contient aucun « » [F : aujourd'hui, les huit « de `etat.js` sont dans des commentaires] et porte au plus une ligne « Chiffre » | PC |
| L5, L6, L7, la main de la pose : tests gardés tels quels | PC |
| La durée sur une fixture (Q4) | PC |

Retirés : le test du dialogue (13 moments, deux questions, ouvertures servies) et SK1 pour les ouvertures. Leurs numéros sont marqués retirés dans `docs/identifiants.md`, jamais repris [V au go].

Ne se teste pas : R4 à R6, le ton, le fait que l'IA lise la fiche. Jugé en jouant.

### Q4. La durée

**Oui, c'est une petite chose, sans dépendance** [P]. Les sorties de mesure, de tri et de preuve sont dans des dossiers horodatés à la minute (`2026-11-24T1334`), que `etat.js` lit déjà par leur nom (`plusRecent`), jamais par la date d'un fichier. La durée = le plus récent de tous ces dossiers moins le plus ancien des constats. Une fonction d'une quinzaine de lignes, une ligne au terminal, à la page et dans les faits.

Ses limites, dites dans la ligne :

- elle part du premier constat, pas de l'adresse : le choix des pages n'est pas compté ;
- les pauses sont comprises : un projet repris le lendemain dit « 1 j 2 h » ;
- la saisie de la marque et la pose n'ont pas de dossier horodaté : elles ne comptent que si une sortie horodatée vient après ;
- à la minute près, sur l'heure de la machine qui écrit les dossiers [V : heure locale, non vérifié].

C'est un temps écoulé, pas une mesure de l'objectif : la fiche le dit, l'IA ne promet aucune durée.

### Q5. Le panneau avant le projet

Rien dans ce lot ne l'empêche. Le retrait du dialogue l'aide plutôt : plus de texte recopié dans `conduire.md` à garder d'accord avec un écran. Seule contrainte à connaître : `parcours` sort en 2 sans `projet.json` ; l'écran d'entrée demandera un mode sans projet, que ce lot ne fige pas.

## Le lancement et la voix [Q, go du 25/11/2026]

Je reprends le texte du fichier 01, avec une retouche [P] : « rien ne casse » est une promesse que rien ne mesure. Ce qui est vrai à ce commit, c'est que le site n'est pas modifié.

> ds-lab fait passer un site existant à un design system, sans chantier interminable. Il mesure tes pages, règle seul ce qui peut l'être, et ne te laisse que les décisions qui comptent. Le résultat se pose à côté de ton code, sans toucher à ton site.
>
> Colle l'adresse de ton site, ou de plusieurs, pour commencer.

La voix : la table de `conduire.md` perd le titre « compagnon d'atelier » et la ligne « Des verbes d'atelier ». « Bienvenue » entre dans les mots à éviter. Le reste reste.

## Arrêts

1. **Cet attendu.** Quentin dit « go ».
2. **Essai de l'entrée** : la fiche, le lancement et `conduire.md` réécrits suffisent, puisque l'entrée se joue avant tout projet. Je prépare J-3 comme J-2, depuis un commit d'étape sur la branche [Q]. Quentin joue deux minutes. Un non, et on corrige.
3. **Le reste** (faits, durée, retraits, tests, docs), puis **la session entière** chronométrée, jusqu'à la revue au moins. Aucune fusion avant son verdict.

Fin du lot : README, ARCHITECTURE, D74, identifiants, attendu au dépôt sous `docs/attendus/parcours-contexte.md`. Aucune dépendance ajoutée.
