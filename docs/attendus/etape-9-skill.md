# Étape 9, lot 2 : le skill pour un dépôt externe

Attendu écrit le 21/11/2026, avant le code, d'après la demande du même jour (« le lot 2 allongé, sans borne de temps », 14 h 11) et le chiffrage de l'arrêt 2 du lot 1, qui vaut plan. Accepté à l'arrêt 1 (14 h 24), avec les réponses de Quentin reportées ici et deux ajouts : le compte des énoncés contrôlés en tête du skill, et la copie du skill qui vieillit. Étiquettes : [F] mesuré ou lu, [H] hypothèse, [V] à vérifier, [Q] à trancher par Quentin.

## But

Une équipe externe reçoit, dans son propre dépôt, un skill, les règles réécrites pour elle et les contrôles des tokens. Elle n'a pas de modèle de dépôt à copier. Ces contrôles tournent chez elle et dans sa CI, sans que le clone de ds-lab soit à un endroit précis.

## Départ [F, lu le 21/11/2026 à 14 h 15]

- `main` suit `origin/main` sur `2d26f81`, copie propre. Branche `etape-9-skill` créée en local, pas poussée.
- La CI de `main` (44904921188) est verte. La part 2 a duré 3 min 29, de 12:38:33Z à 12:42:02Z ; c'était 3 min 28 sur la branche du lot 1. Il n'y a pas eu d'autre exécution depuis : la troisième mesure sera la CI de la branche de ce lot, lue à l'arrêt 2, sans rien y changer.
- `npm audit` donne 0 à la racine et 0 dans l'atelier. Node 24.22.3.

## Le parcours de l'utilisateur

1. **Obtenir ds-lab** : `git clone` à l'endroit de son choix, puis `npm ci` dans le clone. Le chemin du clone va dans une variable du shell, `DS_LAB`, que seules les commandes du skill emploient : **le code ne la lit pas**. Il trouve ses couches communes par son propre emplacement (`import.meta.url`, comme `COMMUN` aujourd'hui). Dans la CI de l'utilisateur, une étape clone ds-lab à un commit fixé. Le paquet installable reste garé.
2. **Poser le skill** : copier `skill/ds-lab/` du clone dans `.claude/skills/ds-lab/` de son dépôt.
3. **Saisir chaque marque** : `node "$DS_LAB/src/cli/saisie.js" tokens/<marque>/entree.json`. Puis le thème : `node "$DS_LAB/src/cli/vuetify.js" --marque tokens/<marque>`.
4. **Vérifier** : `node "$DS_LAB/src/cli/verifier.js" --marques tokens --style "src/**/*.vue"`, en local et dans sa CI.

## 1. Les couches communes à adresse stable

**Constat [F]** : le resolver écrit par la saisie cite `tokens/commun/` par un chemin relatif. Ce chemin est `../commun/` dans ds-lab, et `../../../…/ds-lab/tokens/commun/` hors de ds-lab (`modeleResolver`, `src/tokens/resolver.js:153`). Hors de ds-lab, il casse dès que le clone bouge.

**La forme** : le `$ref` d'une couche commune porte un préfixe que le lecteur traduit vers le `tokens/commun/` du clone qui lit. Le `$ref` d'un fichier de la marque reste relatif, comme aujourd'hui.

| | Option A (recommandée) | Option B |
|---|---|---|
| Forme | `{ "$ref": "ds-lab:commun/primitives.tokens.json" }` | `{ "$ref": "https://raw.githubusercontent.com/<compte>/ds-lab/<commit>/tokens/commun/primitives.tokens.json" }`, lu dans le clone si `<commit>` est son commit |
| Pour | Courte, sans réseau. Elle nomme le fournisseur et le dossier où se trouve le fichier dans le clone | Une vraie URL : un outil DTCG tiers peut la suivre. Elle fixe la version des couches communes |
| Contre | Un outil DTCG tiers ne la suit pas. Les couches lues sont celles du clone, et la CI de l'utilisateur fixe ce commit | Le nom du compte GitHub figure dans chaque marque. Chaque mise à jour du clone oblige à relancer la saisie de toutes les marques. Il faut aussi `git` dans le clone pour lire son commit |

Je recommande A. B lie chaque marque à l'hébergeur et à un commit : c'est plus de cérémonie pour l'utilisateur, alors que sa CI fixe déjà le commit du clone. [V] D'après ma lecture, DTCG 2025.10 admet dans `$ref` une URI quelconque ; je relis le texte du module Resolver avant d'écrire D66.

**Le nom du préfixe** [Q, 14 h 24] : option A, `ds-lab:commun/<fichier>`. Pas d'adresse web liée à un commit.

**Lecture** :
- `resoudre` traduit le préfixe vers `join(COMMUN, <fichier>)`. Une adresse qui sort du dossier (`..`, chemin absolu) ou nomme un fichier absent est une panne, sortie 2 : « resolver : ds-lab:commun/<fichier> n'existe pas dans <clone>/tokens/commun/ : mettre le clone de ds-lab à jour, ou relancer la saisie ».
- Les `$ref` relatifs se lisent comme avant : une marque écrite avant ce lot reste lisible.
- `npm run css` (Terrazzo) reçoit le resolver avec le préfixe traduit en URL `file://` du clone, avant `parse` [V : Terrazzo suit une URL `file://` absolue dans `$ref` ; il suit déjà un `$ref` relatif].

**Écriture** : `modeleResolver` écrit le préfixe pour chaque couche commune, où que soit le dossier. Le paramètre `dossier` ne sert plus aux couches communes.

**Les cinq marques de `tokens/`** : leurs resolvers sont réécrits par la saisie, depuis leur `entree.json`. Le diff ne touche que les `$ref` des couches communes des cinq `marque.resolver.json`. Tout autre fichier écrit reste identique à l'octet : échelles, couches marque, `jetons.css`, `vuetify.json`, planches. Cette forme unique remplace l'ancienne dans ds-lab comme ailleurs.

**Limite écrite (D66)** : la marque d'un utilisateur suit les couches communes du clone qui la lit. Un changement de ces couches change donc ses valeurs au prochain contrôle, et sa CI le voit.

## 2. Le dossier des marques

`contraste`, `espacements` et `typo` prennent une option qui nomme le dossier des marques. Ils jugent chaque marque de ce dossier, c'est-à-dire chaque sous-dossier qui a un `marque.resolver.json`, dans le format de D26 : un bloc par marque, sortie 1 si une marque échoue.
- Sans l'option, rien ne change : ils jugent `tokens/` de ds-lab.
- Avec `--marque` en plus : sortie 2, « l'un ou l'autre : --marque <dossier> pour une marque, --marques <dossier> pour toutes celles d'un dossier ».
- Un dossier sans marque : sortie 2, « aucune marque dans <dossier> (un sous-dossier avec marque.resolver.json) : lancer d'abord la saisie ».

**Son nom** [Q, 14 h 24] : `--marques <dossier>`. `reduce` a déjà `--tokens <fichier>` (D28), dans un autre sens.

## 3. `verifier`

Usage : `node <clone>/src/cli/verifier.js --marques <dossier> --style <motif> [--style <motif>…]`. Les deux options sont obligatoires. Sans l'une d'elles, sortie 2 avec ce qu'il faut passer. Un motif qui ne trouve aucun fichier est aussi une panne, sortie 2.

Ce qu'il lance, dans le processus et sans relancer les commandes :
- `contraste` dans les quatre contextes, pour chaque marque, avec le refus d'une échelle commune redéfinie (D25) ;
- `espacements` et `typo` pour chaque marque ;
- la garde du style, par l'API de Stylelint, avec `stylelint.config.mjs` du clone, sur les fichiers des motifs.

Ce qu'il écrit : une ligne d'en-tête, **une ligne par échec**, puis une ligne de bilan. Il n'écrit pas les ✓. Chaque ligne d'échec dit le contrôle, la marque ou le fichier, le contexte, le constat et la règle ; elle finit par « À faire : … ». Sortie 0 sans échec, 1 sinon, 2 sur une panne (D18).

« À faire », par cause :
- **Paire sous son seuil** : relancer la saisie, puis changer la couleur qu'elle nomme si elle refuse la marque ; ne pas corriger les jetons à la main.
- **Échelle commune redéfinie** : le motif de la saisie (D25), mot pour mot.
- **Espacements, typo** : [H] le texte se fixe au code, d'après la cause que chaque règle connaît. Le test VR6 refuse une ligne d'échec sans « À faire ».
- **Style** : le message de `stylelint.config.mjs` (CP3), qui dit déjà quoi faire.

**Exemple 1**, une paire qui échoue en sombre et étroit :

```
$ node "$DS_LAB/src/cli/verifier.js" --marques tokens --style "src/**/*.vue"
verifier : 2 marques dans tokens/ (Phare Gris, Ruche Basse) ; 3 fichiers de style
✗ contraste · Ruche Basse (tokens/ruche-basse/) · sombre, étroit : text.accent sur background.app, 3,92:1 < 4,50:1 (DS12). À faire : relancer la saisie sur tokens/ruche-basse/entree.json ; si elle refuse la marque, changer la couleur qu'elle nomme. Ne pas corriger les jetons à la main.
verifier : 1 échec (contraste 1, espacements 0, typo 0, style 0)
```
Sortie 1.

**Exemple 2**, une valeur en dur dans un composant de l'utilisateur :

```
$ node "$DS_LAB/src/cli/verifier.js" --marques tokens --style "src/**/*.vue"
verifier : 2 marques dans tokens/ (Phare Gris, Ruche Basse) ; 3 fichiers de style
✗ style · src/components/MemberBadge.vue:42 : Valeur brute « 12px » pour padding : prendre var(--v-ds-…) ou rgb(var(--v-theme-…)) ; sinon une exception avec sa raison (CP3).
verifier : 1 échec (contraste 0, espacements 0, typo 0, style 1)
```
Sortie 1. Le message de Stylelint dit déjà quoi faire : `verifier` ne lui ajoute pas de « À faire ».

Sans échec, la dernière ligne est : `verifier : 0 échec (contraste en clair et en sombre, en large et en étroit ; espacements ; typo ; style)`.

**Nom de la commande** : `verifier`, comme dans la demande, dans `src/cli/verifier.js`. Il est proche de `npm run verify` et de `fiches -- --verifier`, mais c'est un autre fichier et un autre mot ; je le garde [Q, 14 h 24].

Stylelint et `postcss-html` restent des dépendances de développement : `npm ci` les installe dans le clone [V : `npm run knip` ne refuse pas leur import depuis `src/cli/`].

## 4. Le skill

**Endroit** (tranché) : `skill/ds-lab/` à la racine du dépôt. Il est hors de `.claude/skills/`, pour ne pas s'allumer dans les séances de ds-lab elles-mêmes.

**Nom** [Q, 14 h 24] : `ds-lab`, dans `skill/ds-lab/`.

**Langue** : en français, parce que ses textes sont générés depuis `docs/regles.md`, en français, et qu'une traduction serait une copie qui vieillit (DOC2) ; pour une équipe d'une autre langue, c'est une limite écrite (CS4).

| Fichier | Contenu | Écrit par |
|---|---|---|
| `SKILL.md` | Une page, 500 mots au plus (la mesure de DOC5) : quand s'en servir ; les quatre mots ; « une règle bloque, une consigne se lit » ; l'ordre (saisie, thème, `verifier`, composants) ; `DS_LAB`, et le demander à l'humain s'il n'est pas posé ; Node 24 ; Chromium pour la saisie d'une police de titre | À la main |
| `regles.md` | 33 règles et 10 défauts. Pour chacun : numéro, énoncé, raison, seuil ou valeur, technique, et une colonne « Contrôle dans ce dépôt » à la place de la colonne Contrôle de ds-lab | Généré |
| `consignes.md` | 7 consignes : numéro et texte | Généré |
| `techniques/vuetify.md` | 7 lignes : numéro, « Dans Vuetify » ; « Contrôle dans ce dépôt » à la place du contrôle de ds-lab | Généré |

**Génération** (`npm run skill` écrit les trois fichiers ; une seule fonction, dans `src/report/`) :
- **Choix de ds-lab** : une proposition qui commence par « ds-lab » est retirée de la cellule. Il y en a trois aujourd'hui [F] : NM1 (« ds-lab y ajoute les clés… »), NM2 (« ds-lab : le préfixe vaut `Ds` »), CS4 (« ds-lab écrit en français… »). Le « ds-lab » de DOC4, au milieu d'une phrase, reste.
- **« Contrôle dans ce dépôt »** : on écrit « `verifier` (`contraste`) » (ou `espacements`, `typo`, `style`) si la cellule Contrôle de ds-lab commence par **Relit** et cite l'une de ces quatre commandes. C'est le cas de 16 énoncés [F] : DS2, DS5, DS6, DS8, DS11, DS12, DS14, DS17, DS18, CP3, DS4, DS7, DF4, DF5, DF6, DF7. Pour les 27 autres, on écrit « Non contrôlée ici ». Une telle règle **reste une règle** : une règle ne change pas de case selon le dépôt [Q, 14 h 24].
- **Le compte en tête** : `SKILL.md` et l'en-tête de `regles.md` disent combien d'énoncés `verifier` contrôle dans ce dépôt et combien non (16 et 27 aujourd'hui), avec la phrase : pour une règle « Non contrôlée ici », rien ne bloque, l'agent la tient en la lisant. Le générateur calcule ces comptes ; SK2 les vérifie.
- **Les renvois D<n>** restent ; l'en-tête de `regles.md` dit qu'ils se lisent dans `docs/decisions.md` du clone.

**Fraîcheur** : un test compare les trois fichiers à la sortie du générateur (DOC2).

**La copie qui vieillit** (ajout du 21/11, 14 h 24) : si cela tient en 20 min, `verifier` prend `--skill <dossier>`, le dossier du skill copié, et écrit une ligne quand un fichier diffère de `skill/ds-lab/` du clone, avec « À faire : recopier ». Sinon, une limite dans D66 et dans `SKILL.md`, et une ligne dans `KNOWN_ISSUES.md`.

## 5. Essai de bout en bout (arrêt 2)

Il se fait dans le dossier de travail de la séance, hors du dépôt, avec les commandes de ds-lab seulement.
1. Le clone A est un `git clone` de la branche en `…/a/ds-lab`. Le dépôt fictif est en `…/app/` : deux `entree.json` à couleurs hexadécimales, de deux marques fictives nouvelles, et trois `.vue`.
2. Saisie et thème des deux marques par le clone A.
3. Le clone A est supprimé. Le clone B est cloné en `…/b/ailleurs/ds-lab`, puis `npm ci`.
4. `verifier` par le clone B : sortie 0 attendue. C'est la preuve que l'adresse est stable.
5. On casse une couleur à la main, puis une valeur de style : les sorties réelles sont recopiées à l'arrêt 2, avec leur code.
6. `grep` sur l'app : aucun chemin vers A ni vers B dans les fichiers écrits.

Les commandes et les sorties sont notées dans `local/etape-9-skill/`.

## Tests

Les séries de lettres sont toutes prises (A à Z) [F] : je prends AD, MQ, VR et SK, absentes des tests et des préfixes de règles, et je les ajoute à `docs/identifiants.md`. Chaque fichier entre dans la part la plus légère de `test/parts-de-la-ci.json`.

| Fichier | Tests |
|---|---|
| `test/adresse-commune.test.js` | **AD1** `modeleResolver` écrit le préfixe pour chaque couche commune, dossier dans `tokens/` ou ailleurs ; aucun `$ref` ne remonte vers `commun/`. **AD2** Pour toute marque de `tokens/` (`dossiersDeMarque`), dans les quatre contextes, l'arbre résolu égale celui du même resolver aux `$ref` relatifs. **AD3** Une marque copiée seule dans un dossier temporaire, sans `commun/` à côté : les trois contrôles sortent en 0 avec `--marque`. **AD4** Préfixe vers un fichier absent, ou avec `..` : sortie 2 et message qui dit quoi faire. **AD5** Un resolver aux `$ref` relatifs, comme avant le lot, se lit encore. **AD6** `feuilleCss` sur la marque copiée hors du dépôt égale `jetons.css` de la marque d'origine |
| `test/dossier-des-marques.test.js` | **MQ1** Les trois contrôles, avec l'option, jugent chaque marque d'un dossier temporaire, l'une bonne et l'autre cassée : un bloc chacune, sortie 1. **MQ2** Avec `--marque` en plus : sortie 2. **MQ3** Dossier sans marque : sortie 2 |
| `test/verifier.test.js` | **VR1** Tout passe : sortie 0 et la ligne de bilan. **VR2** Une paire cassée en sombre et étroit seulement : une ligne de contraste, ce contexte nommé, sortie 1. **VR3** Une échelle commune redéfinie : le motif de D25. **VR4** Une valeur en dur dans un `.vue` : une ligne de style, `fichier:ligne`, sortie 1. **VR5** Option absente, motif sans fichier : sortie 2. **VR6** Toute ligne d'échec, de chaque contrôle, finit par « À faire : » ou par le message de CP3. **VR7** Lancé depuis un dossier temporaire hors du dépôt, sur des marques copiées : même sortie que VR1 |
| `test/skill.test.js` | **SK1** Les trois fichiers générés égalent la sortie du générateur. **SK2** `regles.md` porte autant d'énoncés que les tables des règles et des défauts de `docs/regles.md`, comptés par le test ; aucune proposition « ds-lab… » ; la colonne de chaque énoncé suit la règle ci-dessus. **SK3** `consignes.md` porte chaque consigne, et `techniques/vuetify.md` chaque ligne de `docs/techniques/vuetify.md`. **SK4** Chaque fichier et chaque commande que cite `SKILL.md` existent ; `SKILL.md` a 500 mots au plus. **SK5** Le générateur refuse une cellule où « ds-lab » ouvre une proposition qu'il ne sait pas détacher : panne qui nomme le numéro |

Tests modifiés sans changer leur sens : `test/resolver.test.js` (les `$ref` communs attendus prennent le préfixe), `test/police-produit.test.js:82` (même chose).

## Comptes attendus

| | Avant | Après |
|---|---|---|
| `npm test` | 1 042 | 1 063 (21 tests ajoutés ; un écart s'explique à l'arrêt 2) |
| Preuve | 546 | 546 |
| Captures | 120 | 120, identiques au pixel (`pixelmatch`, seuil 0) |
| Fichiers dérivés des cinq marques | — | identiques à l'octet ; seuls les `$ref` communs des cinq resolvers changent |
| Les trois contrôles, `types`, `knip`, `dependances`, `style`, fiches | 0 échec | 0 échec |
| Énoncés de `docs/regles.md` | 33, 10, 7 | inchangés |

**Dépendances** : aucune n'est ajoutée.

## Commits

Ils s'enchaînent sans arrêt, avec le résumé de chaque diff dans la boîte. Je m'arrête plus tôt seulement si un contrôle rougit ou si un compte ne tient pas.
1. **C1 Adresse stable** : lecture, écriture, `npm run css`, les cinq resolvers réécrits, AD1 à AD6, D66, README, ARCHITECTURE.
2. **C2 Dossier des marques** : `parMarque` reçoit un dossier, les trois contrôles, MQ1 à MQ3, README, D26 complété par D66.
3. **C3 `verifier`** : `src/cli/verifier.js` et ses lignes dans `src/report/`, VR1 à VR7, README, ARCHITECTURE, CLAUDE.md.
4. **C4 Skill** : `skill/ds-lab/`, générateur et `npm run skill`, SK1 à SK5, `docs/identifiants.md`, README, ARCHITECTURE, CLAUDE.md, `KNOWN_ISSUES.md`.

Ensuite : l'essai de bout en bout, la branche poussée, sa CI, et l'arrêt 2.

## Hors du lot

Les contrôles CP et les fiches pour un autre dépôt ; la pose d'un composant depuis un inventaire (C5) ; un préfixe de composant réglable ; un serveur MCP ; le paquet installable ; l'étape 10.

## Limites à écrire (D66, README, `SKILL.md`)

- Les couches communes sont celles du clone qui lit ; la CI de l'utilisateur fixe ce commit.
- Un outil DTCG tiers ne suit pas le préfixe (option A).
- La copie du skill dans `.claude/skills/` vieillit quand le clone avance : on la recopie, rien ne le contrôle.
- 27 des 43 règles et défauts ne sont pas contrôlés dans le dépôt de l'utilisateur.
- Le skill est en français.

## Réponses de Quentin [Q, 21/11/2026, 14 h 24]

1. Adresse stable : option A, `ds-lab:commun/<fichier>`.
2. Nom du skill : `ds-lab`, dans `skill/ds-lab/`.
3. Une règle non contrôlée chez l'utilisateur reste une règle, marquée « Non contrôlée ici ».
4. Option du dossier des marques : `--marques <dossier>`.

Tranché aussi : textes en français, limite écrite ; `DS_LAB` lue par les seules commandes du skill ; `verifier` gardé ; séries AD, MQ, VR, SK ; si l'un des trois points [V] tombe, arrêt avant de contourner. Limite à écrire dans D66 : le préfixe `ds-lab:` est dans les fichiers de chaque utilisateur, un changement de nom de l'outil demanderait une migration.
