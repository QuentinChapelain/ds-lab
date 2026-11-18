# Attendu : graphiques du constat (audit des composants, troisième lot)

Message de Claude, validé par Quentin le 18/11/2026, mot pour mot (`2026-11-18-11-de-claude-lot-graphiques-du-constat.md`), puis les réponses au plan (`2026-11-18-13-de-claude-reponses-plan-graphiques-du-constat.md`). Go de Quentin le 18/11/2026.

## Message

Version : v1 (18/11/2026, 22 h 45). De : Claude, pour Claude Code, terminal de ds-lab. Même texte dans le projet Claude (`attendu-graphiques-constat-v1.md`) et dans la boîte aux lettres (`2026-11-18-11-de-claude-lot-graphiques-du-constat.md`).
Étiquettes : **[F]** vérifié · **[H]** proposition, à confronter au code · **[Q]** dit par Quentin.

### Pourquoi ce lot

Quentin, sur le constat refait (22 h 26) : « on peut pas avoir des petits graphs jolis, enfin une page plus sympa » [Q]. Le constat a les bons blocs, mais aucune image d'ensemble : rien ne fait voir la dette d'un coup d'œil. Maquette montrée à 22 h 27 ; Quentin suit les recommandations de Claude [Q]. La page reste un fichier unique, sans script, sans dépendance : les graphiques sont du SVG ou du CSS écrits par le rendu.

### PLAN SEULEMENT d'abord

Aucun fichier modifié, aucun commit avant le go.

0. Contrôle : `git status` propre ; branche `main` ; HEAD = origin/main = `c078505` ; CI de main verte. Sinon arrête-toi et dis pourquoi.
1. Crée la branche `graphiques-constat`.
2. Plan pour les points ci-dessous. **Aucun chiffre existant ne change, le relevé ne change pas.**

### Ce qui change dans `constat.html`

| Bloc | Contenu |
|---|---|
| Anneau des origines | Juste sous l'en-tête, à la place de la phrase : un anneau découpé par origine, le nombre d'éléments au centre ; à côté, trois lignes de texte : « N viennent de [framework] », « N sont faits maison », « N sont sans style » (ligne omise à 0). Sans table de signatures : pas de part framework, et « Aucun framework reconnu » |
| Ce qu'il vous reste à faire | Inchangé |
| Scores | Sous chaque « x sur y », une barre de progression fine, de la couleur du texte, sans vert ni rouge. Les (i) restent |
| **Les versions, type par type** | Nouveau bloc, qui sert de sommaire. Une ligne par type : son nom, « n versions », et une barre horizontale découpée en un segment par version, coloré par origine. La longueur totale de la barre est proportionnelle au nombre d'éléments du type (le plus grand type = pleine largeur). Ordre : celui des fiches. Chaque ligne est un lien vers sa fiche. Sous le titre : « Une barre d'une seule couleur : une seule version. » Légende des origines en bas du bloc |
| Fiches | **Toutes repliées** (`<details>`), doublons compris ; le résumé d'une fiche : nom, « x fois, en n versions », et son « À faire » en une ligne courte. Un lien du sommaire ouvre la fiche visée [H : dis comment, sans script ; à défaut, le lien y mène et la fiche s'ouvre d'un toucher] |
| Lignes de mesures | Elles quittent la fiche et vont dans « Voir le code ». Sous l'image restent : origine, nom court, « x fois », la mention « la plus répandue » ou « à égalité », les défauts, et les **différences** (seulement ce qui diffère entre versions, comme aujourd'hui) |

### Couleurs des origines

- Une couleur dit l'origine, jamais « bien » ou « mal ». Ni vert, ni orange, ni rouge.
- Proposition [H] : le framework prend l'accent déjà utilisé (`texte.info`) ; « Fait maison » un neutre soutenu ; « Sans style » un neutre clair ; un segment « rattaché à la main » garde la couleur de « Fait maison ». Tout vient des jetons communs, clair et sombre. Dis si le contraste entre segments voisins tient 3:1 dans les deux modes, et sinon propose.
- La couleur ne porte jamais seule l'information : chaque segment a un texte de remplacement (`<title>` ou équivalent) « origine, nom, x fois », et la légende est écrite.

### Markdown et JSON

Le JSON gagne ce qu'il faut pour redessiner les graphiques (parts par origine, segments par type). Le Markdown ne dessine rien : il garde ses tableaux.

### Valeurs attendues, écrites avant le code

| | Lancement A | Lancement B |
|---|---|---|
| Anneau | 27 : Vuetify 17, fait maison 7, sans style 3 | 30 : Vuetify 17, fait maison 10, sans style 3 |
| Barres des scores | 20/27, 20/23, 0/7, 27/30 | 20/30, 20/23, 1/7, 30/30 |
| Bouton avec texte | 6 : Vuetify 3, fait maison 2, sans style 1 | idem |
| Champ de texte | 4 : fait maison 2, Vuetify 2 | idem |
| Bouton à icône seule | 5 : Vuetify 4, fait maison 1 | idem |
| Liste déroulante | 3 : fait maison 2, Vuetify 1 | idem |
| Carte | 4 : Vuetify 4 | 7 : Vuetify 4, fait maison 3 (rattachés à la main) |
| Onglet | 3 : Vuetify 3 | idem |
| Case à cocher | 2 : sans style 2 | idem |
| Barre la plus longue | bouton avec texte (6) | carte (7) |
| Fiches ouvertes au chargement | 0 | 0 |

Si un chiffre te paraît faux, dis-le au lieu de l'ajuster.

### Fini quand

| Critère | Preuve |
|---|---|
| Les valeurs ci-dessus sortent de la commande, A et B | Tests |
| Aucun chiffre existant ne change ; relevé identique | Tests existants verts, non affaiblis |
| Aucun script, aucune dépendance, aucun défilement à 390 px, clair et sombre | Tests |
| Chaque segment a son texte de remplacement ; aucune couleur verte, orange ou rouge | Test |
| Déterminisme à l'octet maintenu | Test existant |
| Attendu dans `docs/attendus/graphiques-constat.md` ; D48 ou complément de D47 ; README ; KNOWN_ISSUES | Relecture |
| Contrôles, types, knip, dépendances à 0 ; CI de la branche verte | CI |
| Quentin ouvre les constats A et B sur téléphone et juge | Arrêt 2, **avant toute fusion** |

Hors lot : la tendance depuis l'audit précédent ; tout framework d'interface ; une table de signatures pour une autre bibliothèque ; tout site réel.

### Arrêts

1. Plan dans `local/boite-aux-lettres/2026-11-18-12-de-claude-code-plan-graphiques-du-constat.md`, affiché.
2. Branche poussée pour la CI, **rien sur main** ; compte rendu dans `…-14-de-claude-code-arret-2-graphiques-du-constat.md` : chemins des constats A et B (avec `--nom "Annuaire des cafés"`), valeurs obtenues contre attendues, lien de la CI, écarts au plan.

### Preuve

Dépôt lu sur le Mac le 18/11 à 22 h 41 : `main` locale et `origin/main` à `c078505`, copie propre, CI de `main` verte (lue sur l'API de GitHub), branche `forme-constat` supprimée. Maquette montrée dans la conversation à 22 h 27. Valeurs calculées à la main depuis le constat de A et les décisions de B. Non vérifié : les jetons disponibles pour trois couleurs d'origine ; l'ouverture d'une fiche par un lien sans script.

## Réponses au plan

| Point | Réponse |
|---|---|
| G1, couleurs | Oui : un espace de la couleur de la surface entre deux segments ; framework `texte.info`, fait maison `texte.principal`, sans style `bordure.forte` hachuré. L'exigence « 3:1 entre segments voisins » de l'attendu était impossible : elle devient « 3:1 contre la surface, dans les deux modes ». Écris-le dans D48, avec les ratios mesurés. Les hachures doivent rester lisibles sur un segment étroit (1 élément sur une barre courte) : dis à l'arrêt 2 la largeur du plus petit segment |
| G2, lien vers une fiche repliée | Oui : le lien vise un élément à l'intérieur de la fiche. Quentin l'éprouve sur son téléphone à l'arrêt 2 ; si la fiche ne s'ouvre pas, on gardera la parade (viser la fiche, l'ouvrir d'un toucher). Écris la limite dans KNOWN_ISSUES |
| G3, « À faire » courts | Tes quatre textes, tels quels |
| Lancement sans table | D'accord : 23 éléments, fait maison 20, sans style 3, « Aucun framework reconnu » |
| `ordreGuide` déplacé, champ `graphiques` du JSON, tests, trois commits | D'accord |

Rappels : rien sur `main` ; branche `graphiques-constat` poussée pour la CI ; compte rendu de l'arrêt 2 dans `local/boite-aux-lettres/2026-11-18-14-de-claude-code-arret-2-graphiques-du-constat.md`, avec les chemins des constats A et B (`--nom "Annuaire des cafés"`), les valeurs obtenues contre attendues, le lien de la CI et les écarts au plan.

### Textes retenus du plan (G3)

Repris de `2026-11-18-12-de-claude-code-plan-graphiques-du-constat.md`, acceptés « tels quels » : le « À faire » court du résumé d'une fiche repliée est « Choisir la version à garder », « Version à garder : v-btn », « Confirmer la version » ou « Version à garder : v-card ».
