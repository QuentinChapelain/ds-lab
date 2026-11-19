# Attendu : fiches des composants

Message de Claude (`2026-11-19-26-de-claude-lot-fiches.md`), mot pour mot, puis les réponses au plan (`2026-11-19-28-de-claude-reponses-plan-fiches.md`), mot pour mot. Plan : `2026-11-19-27-de-claude-code-plan-fiches.md`, dans la boîte aux lettres, hors dépôt. Go de Quentin le 19/11/2026, 14 h 46.

## Message

### Lot « fiches » (étape 7) : demande de plan

De : Claude, pour Claude Code, terminal de ds-lab. 19/11/2026, 13 h 50.
PLAN SEULEMENT : aucun fichier modifié, aucun commit. Quentin donne le go en collant le message qui renvoie à ce fichier.

#### 0. Contrôle

`git status` propre ; HEAD = `origin/main` = `0819ce6`. CI de `main` lue par Claude à 13 h 17 : exécution 44518465090, succès. Relis-la (règle L4 de D53) : verte, on continue ; rouge, arrête-toi et dis-le. Branche `fiches`.

#### 1. Pourquoi

Étape 7 du parcours : une fiche par enveloppe (Avatar, Bouton, BoutonIcone, Carte, ChampTexte, Etiquette), lisible par un humain et par une machine. L'humain : Quentin, sur son téléphone, sur GitHub. La machine : l'agent neuf de l'étape 10, qui devra monter l'annuaire sans inventer d'option.

Forme choisie par Quentin (13 h 48, sur image, B) : **un fichier Markdown par composant dans le dépôt, dont une partie est générée depuis le menu**. Le `*.menu.js` est déjà le contrat machine ; la fiche le recopie et ajoute ce que le code ne dit pas.

#### 2. La fiche

Emplacement proposé : `docs/composants/<nom>.md`. Les mêmes sections, dans le même ordre, pour les six :

| # | Section | Écrite ou générée |
|---|---|---|
| 1 | Titre et rôle en une phrase | Écrite |
| 2 | En-tête structuré (par exemple YAML en tête) : nom, fichier à importer, composant Vuetify enveloppé, décisions, stories | Générée ou vérifiée, propose |
| 3 | Quand l'utiliser ; quand prendre autre chose (pièces à venir comprises : puce de filtre, bouton bascule…) | Écrite, courte |
| 4 | Menu : option, type, obligatoire, défaut, valeurs admises | Générée depuis le menu |
| 5 | Refusé : écouteurs, attributs retirés, ce qui lève hors liste blanche | Générée depuis le menu et la fabrique |
| 6 | Jetons : rôles employés | Propose : générée si la source le permet, sinon écrite et vérifiée |
| 7 | Accessibilité : nom accessible, contraste mesuré sur les dix thèmes | Écrite, depuis l'attendu et la preuve |
| 8 | En situation : un exemple minimal à copier, et le lien vers les stories | Écrite ; l'exemple doit passer la fabrique sans lever (testé) |
| 9 | Décisions et dette : D.., lignes de `KNOWN_ISSUES.md` | Écrite |
| 10 | Preuve | Écrite |

Règles :
- Les blocs générés sont entre deux marques ; un script les écrit. La CI refuse une fiche dont un bloc généré ne correspond plus au menu (même esprit que les autres contrôles). Mets ce contrôle dans le job rapide : la CI doit rester à 4 min au plus.
- Un index court, lisible par une machine, liste les six fiches avec leur phrase de rôle. Propose son nom et sa place (`llms.txt` à la racine, `docs/composants/index.md`, ou autre) avec la raison.
- Français, mots simples, une fiche se lit en deux minutes. Aucun nom de client, aucun site réel.
- Sources de la partie écrite : `docs/attendus/` (bouton, champ-carte, bouton-icone, avatar-etiquette), D43 à D55, `KNOWN_ISSUES.md`, les commentaires des menus.

#### 3. Hors lot

Manifeste de Storybook, serveur MCP, `docgen`, TypeScript, pages MDX, Storybook 11, DESIGN.md. Raisons : en aperçu, expérimental pour Vue, et nos options sont déclarées par la fabrique, que l'analyse statique risque de ne pas voir [hypothèse]. Revus à l'étape 9, après Storybook 11. Ne change aucun composant ni jeton.

#### 4. Attendu, arrêts, décision

- Attendu `docs/attendus/fiches.md`.
- Arrêts : 1. le plan ; 2. l'attendu et **la fiche de l'étiquette seule**, poussée sur la branche, avec le lien GitHub de la fiche rendue (Quentin la juge sur son téléphone) ; 3. les cinq autres fiches et l'index, avant la documentation.
- Une décision : D56 (forme des fiches, contrôle, index).

#### 5. Ta réponse

Plan dans `local/boite-aux-lettres/2026-11-19-27-de-claude-code-plan-fiches.md` : script et contrôle, format de l'en-tête, ce qui est généré et ce qui ne peut pas l'être, nom de l'index, test des exemples, fichiers, commits, temps prévu sur les réels des lots précédents. Questions de design pour Quentin en mots simples avec une recommandation ; questions techniques pour Claude.

## Réponses au plan

### Lot « fiches » : réponses au plan

De : Claude, pour Claude Code, terminal de ds-lab. 19/11/2026, 14 h 31.
Réponse à `2026-11-19-27-de-claude-code-plan-fiches.md`. Le plan est accepté avec les précisions ci-dessous. Quentin donne le go en collant le message qui renvoie à ce fichier.

#### Design : Quentin (14 h 30, sur image, « tout A »)

| # | Choix |
|---|---|
| Q1 | `docs/composants/README.md`, liste générée ; pas de `llms.txt` |
| Q2 | En-tête YAML gardé, court ; jugé à l'arrêt 2 sur téléphone, réduit s'il déborde |
| Q3 | Une ligne écrite par option sous le tableau, contrôlée |
| Q4 | Un seul exemple, le cas le plus courant |
| Q5 | Lien vers le fichier des stories sur GitHub, avec le nom de la story |
| Q6 | Pièces à venir nommées « à venir », avec leur repère de dette |

#### Technique : Claude

| # | Réponse |
|---|---|
| T1 | D'accord : `atelier/fiches.js`, `npm --prefix atelier run fiches [-- --verifier]` |
| T2 | D'accord sur les marques et les cinq blocs ; l'en-tête appartient au script |
| T3 | D'accord pour `String(regle)`, à une condition : le test N vérifie, pour chaque règle, que le message tiré est celui que lève `verifierUsage` sur le cas qui la déclenche. Note en dette (`KNOWN_ISSUES.md`) : le message rangé à côté de la règle dans le menu, à faire au prochain lot qui touche les menus |
| T4 | D'accord. Ajout : un jeton écrit à la main (`ds-ecart-entre-etiquettes`) est contrôlé lui aussi : il doit exister dans la table ou dans les thèmes, sinon panne |
| T5 | D'accord, avec un cas écrit à la main pour chacune des deux résolutions (lien depuis le fichier, chemin entre accents graves depuis la racine) |
| T6 | D'accord pour le lecteur à grammaire fermée. Il prouve que l'exemple respecte le menu, pas son rendu : dis-le en une ligne dans l'attendu |
| T7 | D'accord : famille N, D56 |
| T8 | D'accord : `champ.md` |
| T9 | D'accord pour générer les contrastes, **par la fonction même de `npm run contraste`**, jamais une seconde formule. Si elle ne s'importe pas sans navigateur, arrête-toi et dis-le. Affiche le seuil de chaque paire (`paires.json`) à côté du chiffre. Le message 26 est corrigé en ce sens |

#### Rappels

- Arrêts : 2 (attendu, fiche de l'étiquette poussée, lien GitHub de la fiche rendue) et 3 (cinq fiches et index). Relevé du temps dans `local/fiches-temps.md`.
- Aucun composant, menu, jeton ni story modifié ; aucune dépendance ajoutée ; CI sous 4 min.
- Rien sur `main` sans l'accord de Quentin.

## Valeurs attendues, écrites à la main le 19/11/2026

Ce lot ne modifie ni composant, ni menu, ni jeton, ni story. Il n'ajoute aucune dépendance.

### Lu dans le dépôt [F]

- Les six menus (`atelier/composants/*.menu.js`) sont des données, sauf leurs règles, qui sont des fonctions. Chaque règle a la forme `condition ? 'message' : null`. Le message n'existe que dans le texte de la fonction.
- Les emplacements ne sont pas dans les menus. On les lit dans les `.vue` : `slots.default` pour le bouton ; `slots.default` et `slots.actions` pour la carte.
- Les jetons sont les variables `--v-theme-<couleur>` et `--v-ds-<variable>` des `.vue`. On les remonte à leur rôle par `tokens/commun/vuetify.json` : `couleurs` (fond et texte, la forme `on-<couleur>` donnant le texte) et `variables` (jeton, et champ d'un style de texte).
- Le bouton à icône n'emploie que des variables de taille. Ses couleurs viennent du bouton, qu'il rend (`import Bouton from './Bouton.vue'`).
- `ds-ecart-entre-etiquettes` n'est employé que par la story et la preuve de l'étiquette.
- Les contrastes sont calculés par la fonction de `npm run contraste` : `loadRoles(dossier, { mode })` puis `contratRoles(set)`, dans `src/tokens/roles.js`. Ce fichier n'importe que `node:fs`, `node:path`, `culori` et des modules de `src/` sans navigateur. Il s'importe donc sans navigateur (condition de T9).
- Le chiffre s'écrit comme dans `npm run contraste` : deux décimales arrondies, virgule, « :1 » (`fr(…, { decimales: 2, zeros: true })`, `src/lib/format.js`).

### Script et commandes

- **`atelier/fiches.js`**. Deux scripts dans `atelier/package.json`, sans dépendance :
  - `npm --prefix atelier run fiches` réécrit l'en-tête et les blocs générés de chaque fiche présente, puis l'index. Il ne touche pas aux parties écrites. Une seconde passe ne change aucun octet ;
  - `npm --prefix atelier run fiches -- --verifier` n'écrit rien. Il sort en 0 si tout correspond, en 1 s'il trouve un écart, en 2 sur une panne (D18), par la garde commune (`lancer`, `src/cli/garde.js`). Il tourne donc sous la version de Node de `.node-version` seulement.
- Il lit les menus, les `.vue` et les stories en texte, `tokens/commun/vuetify.json`, `tokens/commun/paires.json`, les jetons des marques (par `loadRoles`), `docs/decisions.md` et `KNOWN_ISSUES.md`. Il n'a besoin d'aucune installation de l'atelier.
- Une table du script relie chaque menu à sa fiche :
  - `Bouton` → `bouton` ;
  - `BoutonIcone` → `bouton-icone` ;
  - `ChampTexte` → `champ` ;
  - `Carte` → `carte` ;
  - `Avatar` → `avatar` ;
  - `Etiquette` → `etiquette`.

  Ce sont les noms de la preuve (`atelier/preuve/<nom>.js`). Un menu absent de la table, ou un nom sans preuve, est une panne.
- **CI** : une étape `npm --prefix atelier run fiches -- --verifier` dans le job `rapides`, après `npm run typo`.
- **Tant que les six fiches ne sont pas écrites**, le contrôle juge les fiches présentes, et l'index ne liste qu'elles. Une fois les six écrites, il exige une fiche par menu, et un menu par fiche.

### Forme d'une fiche (`docs/composants/<nom>.md`)

Dans cet ordre :

1. **L'en-tête YAML**, qui appartient en entier au script : de la première ligne `---` à la seconde.
2. **Le bloc `titre`** : `# <titre>`.
3. **La phrase de rôle** : la première ligne non vide après le bloc `titre`. Une seule ligne, qui finit par un point.
4. Huit titres de niveau 2, exactement ceux-ci, dans cet ordre :
   1. `## Quand l'utiliser` ;
   2. `## Menu` (bloc `menu`, puis une ligne écrite par option) ;
   3. `## Refusé` (bloc `refus`) ;
   4. `## Jetons` (bloc `jetons`, puis les lignes écrites des jetons de pose) ;
   5. `## Accessibilité` (texte écrit, puis bloc `contrastes`) ;
   6. `## En situation` (un seul bloc de code `vue`, puis le lien vers les stories) ;
   7. `## Décisions et dette` ;
   8. `## Preuve`.

**Marques d'un bloc.** Chacune tient sur une ligne :
- ouverture : `<!-- genere:<bloc> : écrit par npm --prefix atelier run fiches -->` ;
- fermeture : `<!-- /genere:<bloc> -->`.

Il y a cinq blocs : `titre`, `menu`, `refus`, `jetons`, `contrastes`. Chacun est présent une fois et une seule.

**Une ligne d'option**, dans la section Menu, hors du bloc : `` - `<option>` : <ce qu'elle fait>. `` Il en faut une par option du menu, dans l'ordre du menu, ni plus ni moins.

### En-tête et blocs attendus de l'étiquette, à l'octet

```
---
nom: Etiquette
titre: Étiquette
fichier: atelier/composants/Etiquette.vue
menu: atelier/composants/Etiquette.menu.js
enveloppe: VChip
decisions: [D55, D51]
stories: atelier/stories/Etiquette.stories.js
preuve: npm --prefix atelier run preuve -- etiquette
---
```

D'où vient chaque champ :
- `nom` vient de `menu.nom` ;
- `titre` vient du dernier segment du `title` des stories ;
- `enveloppe` vient de l'import de `vuetify/components` du `.vue`. Pour le bouton à icône, c'est celui du `.vue` importé, suivi de « (par Bouton) » : `enveloppe: VBtn (par Bouton)` ;
- `decisions` vient de la première parenthèse de numéros de décision dans le commentaire de tête du menu : `[D52, D51]` pour le bouton à icône.

```
<!-- genere:titre : écrit par npm --prefix atelier run fiches -->
# Étiquette
<!-- /genere:titre -->
```

```
<!-- genere:menu : écrit par npm --prefix atelier run fiches -->
| Option | Type | Obligatoire | Défaut | Valeurs admises |
|---|---|---|---|---|
| `texte` | texte | oui | aucun | libre |
| `ton` | texte | non | `'neutre'` | `'neutre'`, `'marque'` |

Événements émis : aucun. Emplacements : aucun.
<!-- /genere:menu -->
```

Comment s'écrivent les types et les valeurs :
- types : `String` donne « texte », `Boolean` « booléen », `Number` « nombre », `Object` « objet », `Function` « fonction » ; plusieurs types sont joints par « ou » (« objet ou fonction ») ;
- défauts et valeurs, en littéraux : `'neutre'`, `3`, `false`, `null`, `''`.

Ce qu'on attend des autres menus :
- **carte** : `niveau` est « nombre », de défaut `3`, de valeurs `2`, `3`, `4`. La ligne finale est « Événements émis : aucun. Emplacements : `default`, `actions`. » ;
- **bouton** : `icone` est « objet ou fonction », de défaut `null`. La ligne finale est « Événements émis : `click`. Emplacements : `default`. ».

```
<!-- genere:refus : écrit par npm --prefix atelier run fiches -->
Attributs admis en plus des options : `id`, `aria-*`, `data-*`. Retirés : `aria-label`, `aria-labelledby`. Écouteurs : refusés.

Tout autre usage lève une erreur, et rien n'est rendu. Messages, dans l'ordre où ils sont vérifiés :

- `étiquette : attribut refusé : <attributs>`
- `étiquette : texte obligatoire`
- `étiquette : ton inconnu : <valeur> (neutre, marque)`
<!-- /genere:refus -->
```

Comment se construisent les phrases et la liste :
- **Écouteurs** : un menu qui admet les écouteurs donne « Écouteurs (`on…`) : admis. ».
- **Retirés** : un menu sans attribut retiré donne « Retirés : aucun. ».
- **Ordre des messages** :
  1. l'attribut refusé ;
  2. une ligne par option obligatoire, puis une par option à valeurs, dans l'ordre du menu ;
  3. une ligne par règle ;
  4. une ligne par règle du rendu, suivie de « , au rendu ».
- **Doublons** : un message identique à un message déjà listé n'est pas répété. La première règle de l'avatar redit « avatar : nom obligatoire ».
- **Messages des règles, tirés du texte de la fonction** : c'est la chaîne qui suit le `?`, une seule par règle, sinon c'est une panne. Pour les sept règles des six menus :
  - `bouton : désactivé refusé sur type=submit` ;
  - `bouton à icône : désactivé refusé sur type=submit` ;
  - `avatar : nom obligatoire` ;
  - `avatar : nom sans lettre` ;
  - `carte : texte alternatif obligatoire avec une image` ;
  - `carte : lien et actions ensemble refusés` ;
  - `carte : actions : seuls Bouton et BoutonIcone sont admis`, au rendu.

```
<!-- genere:jetons : écrit par npm --prefix atelier run fiches -->
| Jeton | Variables du thème |
|---|---|
| `fond.marque.discret` | `marque-discret` |
| `texte.marque` | `on-marque-discret` |
| `fond.composant` | `composant` |
| `texte.principal` | `on-composant` |
| `arrondi.pilule` | `ds-arrondi-pilule` |
| `hauteur.etiquette` | `ds-hauteur-etiquette` |
| `marge-interieure.etiquette` | `ds-marge-interieure-etiquette` |
| `typo.corps.petit` | `ds-corps-petit-police`, `ds-corps-petit-taille`, `ds-corps-petit-graisse`, `ds-corps-petit-interligne` |
<!-- /genere:jetons -->
```

Comment se construit le tableau :
- **Ordre** : d'abord les couleurs, dans l'ordre de `couleurs` de la table, le fond puis le texte de chacune. Puis les variables, dans l'ordre de `variables`.
- **Une ligne par jeton** : les variables d'un même jeton sont jointes sur sa ligne, à sa première place.
- **Bouton à icône** : il prend les variables de son `.vue` et celles du `.vue` qu'il importe (le bouton).
- **Pannes** :
  - une variable lue qui n'est pas dans la table ;
  - une variable `ds-` citée en code dans la section Jetons, hors du bloc, qui n'est pas dans `variables` (T4).

```
<!-- genere:contrastes : écrit par npm --prefix atelier run fiches -->
| Devant | Fond | Plus bas des 10 thèmes | Seuil |
|---|---|---|---|
| `texte.marque` | `fond.marque.discret` | 11,65:1 (Atelier Lavandine, clair) | 4,50:1 |
| `texte.principal` | `fond.composant` | 11,68:1 (Atelier Lavandine, clair) | 4,50:1 |
<!-- /genere:contrastes -->
```

**Quelles paires vont dans le tableau** :
1. Pour chaque couleur de la table employée par le `.vue` (son fond ou son texte), sa paire « texte sur fond ». Elle doit être dans `paires` de `tokens/commun/paires.json`, sinon c'est une panne.
2. Pour chaque variable `ds-` dont le jeton commence par `texte.` ou `bordure.`, les paires de `paires` où ce jeton est devant, sur un fond de la pièce, sur `fond.app` ou sur `fond.surface`.
3. Les paires interdites n'y vont jamais.

**Ordre des lignes** : celui de la règle, puis celui de `paires.json`.

**Les thèmes** : les marques de `tokens/` dans l'ordre de leur dossier, chacune en clair puis en sombre. En cas d'égalité, c'est le premier thème au plus bas qui est nommé.

**Le seuil** est `min` de la paire, celui de `paires.json`. Une paire qui porte une exception écrite donne « 4,50:1, exception écrite ».

**Chiffres de l'étiquette**, à recalculer par un autre chemin : culori 4.0.2, `wcagContrast`, sur les couleurs déjà écrites dans `tokens/<marque>/vuetify.json` (`on-<couleur>` sur `<couleur>`), sous Node 24.22.3. Script dans `local/fiches-contrastes.mjs`, lu sur l'entrée standard depuis la racine :

```
COULEURS="composant marque-discret" node --input-type=module < local/fiches-contrastes.mjs
```

| Paire | Plus bas | Thème | Les dix |
|---|---|---|---|
| `texte.marque` sur `fond.marque.discret` | 11,6513 | Atelier Lavandine, clair | de 11,6513 à 16,8848 |
| `texte.principal` sur `fond.composant` | 11,6831 | Atelier Lavandine, clair | 11,6831 en clair et 11,7526 en sombre, dans les cinq marques |

Le script :

```js
// Contrastes de l'étiquette dans les dix thèmes, par culori sur les thèmes Vuetify écrits : chemin indépendant du code.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { wcagContrast } from 'culori';
const couleurs = (process.env.COULEURS ?? "").split(" ");
for (const c of couleurs) {
  let bas = null;
  for (const m of readdirSync('tokens').sort()) {
    const f = `tokens/${m}/vuetify.json`;
    if (!existsSync(`tokens/${m}/marque.resolver.json`)) continue;
    const t = JSON.parse(readFileSync(f, 'utf8'));
    for (const [nom, th] of Object.entries(t.themes)) {
      const r = wcagContrast(th.colors[`on-${c}`], th.colors[c]);
      console.log(c, nom, r.toFixed(4));
      if (!bas || r < bas.r) bas = { r, nom };
    }
  }
  console.log('PLUS BAS', c, bas.nom, bas.r.toFixed(4), Math.floor(bas.r * 100) / 100);
}
```

Ces deux chiffres sont aussi ceux de D55 (11,68 et 11,65).

### Ce qui est écrit et contrôlé

| Contrôle | Écart (sortie 1) | Panne (sortie 2) |
|---|---|---|
| En-tête et blocs | un bloc qui n'est pas ce que le script écrirait | une marque absente, en double, ou ouverte sans fin ; un en-tête absent |
| Sections | un titre de niveau 2 manquant, en trop ou hors d'ordre | |
| Phrase de rôle | absente, sur plusieurs lignes, ou sans point final | |
| Lignes d'option | une option sans sa ligne, une ligne d'une option hors du menu, un ordre différent | |
| Décisions et dette | un `D<n>` sans `### D<n>` dans `docs/decisions.md` ; un `B<n>` sans ligne `\| B<n> \|` dans `KNOWN_ISSUES.md` | |
| Jetons écrits | | une variable `ds-` inconnue (T4) |
| Story citée | une story « X » de la section En situation sans export ni `name: 'X'` dans le fichier des stories | |
| Exemple | pas exactement un bloc `vue` ; un exemple que la fabrique refuse | une syntaxe hors grammaire |
| Index | un index qui n'est pas ce que le script écrirait | |

**Sortie du contrôle** :
- une ligne par fichier : `✓ docs/composants/etiquette.md`, ou une ligne `✗ docs/composants/etiquette.md : <écart>` par écart ;
- puis la même chose pour `docs/composants/README.md`.

**Les écarts s'écrivent ainsi** :
- `bloc menu à régénérer (npm --prefix atelier run fiches)` ;
- `en-tête à régénérer (npm --prefix atelier run fiches)` ;
- `sections : attendu « ## Refusé » en place 3, trouvé « ## Refus »` ;
- `phrase de rôle absente` ;
- `option sans sa ligne : ton` ;
- `ligne d'une option hors du menu : couleur` ;
- `décision inconnue : D99` ;
- `dette inconnue : B99` ;
- `story inconnue : « Planche bis »` ;
- `exemple refusé : étiquette : attribut refusé : closable`.

**Une panne** s'écrit `fiches : <fichier> : <cause>`. Par exemple : `fiches : docs/composants/etiquette.md : marque genere:menu absente`.

### L'exemple (section En situation)

Le lecteur prouve que l'exemple respecte le menu, pas qu'il se rend comme prévu : le rendu, c'est la preuve qui le juge (T6).

**Un bloc ```` ```vue ````** : un `<script setup>`, puis un `<template>`. La grammaire est fermée.

**Dans le script**, trois formes de ligne seulement :
- `import <Nom> from './composants/<Nom>.vue';` : une enveloppe, chemin lu depuis `atelier/` ; il doit mener au `fichier` de l'en-tête de sa fiche ;
- `import { a, b } from '<module>';` : des noms importés, remplacés par une fonction ;
- `const <x> = icone(<y>);` ou `const <x> = '<texte>';`.

**Dans le gabarit** :
- les balises des enveloppes importées, fermées ou auto-fermantes ;
- les balises HTML en minuscules (`ul`, `li`, `p`, `div`, `span`), dont on lit seulement le contenu ;
- `<template #<emplacement>>` dans une enveloppe ;
- du texte sans `{{`.

**Les attributs** :
- `nom="texte"` ;
- `nom` seul (vrai pour une option booléenne, `''` sinon) ;
- `:nom="…"`, où « … » est un nombre, `true`, `false`, `null`, `'texte'`, ou un nom défini dans le script ;
- `@evenement="nom"` ;
- `v-model="nom"`, qui donne `modelValue = ''` et l'écouteur `onUpdate:modelValue`.

**Ce que fait le lecteur, comme Vue** :
- un nom d'attribut en tirets devient camelCase pour être comparé aux options. Ce qui est au menu va dans les options, ce qui n'y est pas reste attribut, sous son nom écrit ;
- `@x` donne l'écouteur `onX`. Il est retiré des attributs si `x` est un événement du menu, et il reste attribut sinon ;
- les défauts du menu sont appliqués.

**La vérification** : chaque enveloppe, imbriquées comprises, passe `verifierUsage(menu, options, attributs, emplacements, { rendu: true })`. Ses emplacements sont des fonctions qui rendent des nœuds `{ type: { name } }` pour une enveloppe, `{ type: '<balise>' }` pour une balise HTML, et une chaîne pour du texte.

**Tout le reste est hors grammaire, et c'est une panne qui le nomme** : `{{ … }}`, `v-if`, `v-for`, une expression (`:x="a + b"`), un nom non défini dans `:x`, une balise en majuscule non importée.

**Exemple attendu de l'étiquette, le cas le plus courant (Q4)** : une suite d'étiquettes en liste (D55).

```vue
<script setup>
import Etiquette from './composants/Etiquette.vue';
</script>

<template>
  <ul class="etiquettes">
    <li><Etiquette texte="Lyon" /></li>
    <li><Etiquette texte="Finance" /></li>
    <li><Etiquette texte="Mentor" ton="marque" /></li>
  </ul>
</template>
```

### L'index (`docs/composants/README.md`)

Il est généré en entier. Il n'a qu'une phrase de tête, puis une ligne par fiche présente, dans l'ordre de la table. Au commit de la première fiche, seule l'étiquette y est :

```
<!-- genere:index : écrit par npm --prefix atelier run fiches -->
# Fiches des composants

Une fiche par enveloppe de l'atelier : son rôle, son menu, ce qu'elle refuse, ses jetons, son accessibilité, un exemple à copier. Les blocs `genere` de chaque fiche, et cette liste, sont écrits par `npm --prefix atelier run fiches` depuis les menus, les composants et les jetons ; `npm --prefix atelier run fiches -- --verifier` refuse une fiche qui ne leur correspond plus.

| Composant | Fiche | Rôle |
|---|---|---|
| `Etiquette` | [Étiquette](etiquette.md) | <phrase de rôle de la fiche> |
<!-- /genere:index -->
```

### Dérive de la documentation (T5)

Dans `test/derive-docs.test.js` :
- une cible de lien `](…)` se résout depuis le dossier du fichier qui la contient, comme sur GitHub ;
- un chemin entre accents graves, ou dans un bloc de code, se résout depuis la racine, comme aujourd'hui.

Les deux cas sont écrits à la main :
- dans `docs/composants/x.md`, `](../../atelier/composants/Etiquette.vue)` donne `atelier/composants/Etiquette.vue`, et `](etiquette.md)` donne `docs/composants/etiquette.md` ;
- dans le même fichier, `` `atelier/composants/Etiquette.vue` `` reste `atelier/composants/Etiquette.vue` ;
- un lien qui sort du dépôt (`](../../../x)`) est gardé, et il manque.

### Cas de test (famille U, `test/fiches.test.js`)

La famille N, proposée au plan (T7), sert déjà dans `test/version-node.test.js` et d'autres tests, même si `docs/identifiants.md` ne la liste pas : U, pour « fiches d'usage » (B8), ne sert nulle part [F, recherche de `U<n>` dans `src/`, `test/`, l'atelier et `docs/identifiants.md`].

- **U1 En-tête** :
  - celui de l'étiquette, à l'octet ci-dessus ;
  - `enveloppe: VBtn (par Bouton)` et `decisions: [D52, D51]` pour le bouton à icône.
- **U2 Menu** :
  - le bloc de l'étiquette, à l'octet ;
  - `niveau` et les emplacements de la carte, `icone` et l'événement du bouton, comme écrit ci-dessus.
- **U3 Refus** :
  - le bloc de l'étiquette, à l'octet ;
  - pour les six menus, la liste des attributs admis est confrontée à `verifierUsage` : `id`, `aria-describedby` et `data-x` passent ; chaque attribut retiré lève ; `onClick` passe si, et seulement si, les écouteurs sont admis ; `class` lève ;
  - pour chacune des sept règles, le message tiré est celui que lève `verifierUsage` sur un cas qui la déclenche (T3). Les cas sont écrits à la main :
    - bouton et bouton à icône : `desactive` et `type: 'submit'` ;
    - avatar : `nom: '   '`, puis `nom: '123'` ;
    - carte : `media` sans `texteAlternatif` ; `lien` et un emplacement `actions` ; un `<a>` dans `actions` ;
  - une règle sans message lisible (deux chaînes après des `?`, ou aucune) est une panne.
- **U4 Jetons** :
  - le bloc de l'étiquette, à l'octet ;
  - les jetons du bouton à icône comprennent ceux du bouton (`fond.interactif.fort`, `bordure.focus`) ;
  - une variable `--v-ds-inconnue` dans un `.vue` d'essai est une panne qui la nomme ;
  - une variable `ds-` écrite et inconnue est une panne.
- **U5 Contrastes** :
  - le bloc de l'étiquette, à l'octet (11,65 et 11,68, chiffres de culori ci-dessus) ;
  - la paire `texte.desactive` sur `fond.desactive` du bouton porte « exception écrite » ;
  - une couleur dont la paire manque à `paires.json` est une panne.
- **U6 Marques** :
  - une marque absente, en double, ou ouverte sans fin est une panne nommée ;
  - régénérer une fiche garde ses parties écrites à l'octet, et une seconde passe ne change rien.
- **U7 Parties écrites** : sur une fiche d'essai, chaque écart du tableau « Ce qui est écrit et contrôlé » donne sa ligne `✗`, mot pour mot.
- **U8 Exemple** :
  - **passent** : l'exemple de l'étiquette ; un bouton avec icône (`const Crayon = icone(mdiPencil);`, `:icone="Crayon"`) et `@click="modifier"` ; une carte avec `<template #actions>` et un `Bouton` ; un champ avec `v-model="courriel"`, `libelle="Courriel"` et `type="email"` ;
  - **sont refusés, message mot pour mot** :
    - `<Etiquette texte="Lyon" closable />` → `étiquette : attribut refusé : closable` ;
    - `<Etiquette texte="Lyon" @click="ouvrir" />` → `étiquette : attribut refusé : onClick` ;
    - `<Carte titre="T" niveau="2" />` → `carte : niveau inconnu : 2 (2, 3, 4)`, la valeur écrite sans deux-points étant une chaîne ;
    - une carte avec `lien` et `actions` → `carte : lien et actions ensemble refusés` ;
    - un `<a>` dans les actions d'une carte → `carte : actions : seuls Bouton et BoutonIcone sont admis` ;
    - `<Bouton type="submit" desactive>` → `bouton : désactivé refusé sur type=submit` ;
  - **sont des pannes** : `{{ x }}`, `v-if`, `:x="a + b"`, un nom non défini, une balise `Inconnue`.
- **U9 Index** : l'index de l'étiquette seule, à l'octet ci-dessus, avec sa phrase de rôle.
- **U10 Le dépôt** : `fiches -- --verifier` sort en 0 sur le dépôt.

### Temps

Relevé dans `local/fiches-temps.md` (hors dépôt).
