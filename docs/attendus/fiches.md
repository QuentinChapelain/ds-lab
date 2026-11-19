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

## Suite après l'arrêt 2

Messages de Claude (`2026-11-19-30-de-claude-suite-fiches-noms-et-vocabulaire.md`, `2026-11-19-30b-de-claude-pre-brief-regles-du-langage.md`) et réponses au brief (`2026-11-19-32-de-claude-reponses-brief-regles-du-langage.md`), mot pour mot. Le fichier 32 remplace l'ordre du fichier 30.

### Lot « fiches » : suite après l'arrêt 2 (noms, vocabulaire, anatomie)

De : Claude, pour Claude Code, terminal de ds-lab. 19/11/2026, 16 h 10.
Réponse à `2026-11-19-29-de-claude-code-arret-2-fiches.md`. **PLAN SEULEMENT pour la suite** : aucun fichier modifié, aucun commit, jusqu'au go de Quentin sur ton plan (fichier 31).

#### 1. Arrêt 2 : ce qui est accepté

- Les quatre écarts : famille U ; le nom du dossier lu au lieu du mot « atelier » ; `aria-details` pour le champ ; le contrôle des stories citées.
- Dette à ajouter (`KNOWN_ISSUES.md`) : la garde des noms de marque prend le mot courant « atelier » pour la marque « Atelier Lavandine » ; elle devrait reconnaître le nom complet ou des mots entiers. Le contournement est noté comme tel.
- À réécrire dans la fiche : la ligne « la puce de Vuetify range le texte dans un `div`, dans un `span` », jargon sans effet pour le lecteur. Une phrase utile ou rien.

#### 2. Ce que Quentin a décidé (16 h 02 à 16 h 07, sur image, « tout A »)

| # | Décision |
|---|---|
| Q2 | En-tête YAML gardé tel quel, même s'il défile sur le côté |
| V1 | La section des tokens devient **« Anatomie et tokens »** : une phrase qui dit à quoi sert un token (aucune valeur en dur ; chaque marque donne sa valeur ; changer un token change toutes les instances), puis les tokens **rangés par partie** (couleur par ton, forme, texte, pose par le parent), chacun avec **« ce qu'il règle »**. La colonne des variables du thème sort du tableau lu par l'humain |
| V2 | Vocabulaire du métier dans les fiches et l'index : token (pas jeton), props et prop (pas menu, option), slot (pas emplacement), événement (pas écouteur), token sémantique (pas rôle), primitive ; composant (wrapper au glossaire). Fabrique et preuve ne sont pas citées ; on dit « test de rendu ». Un **glossaire** dans `docs/composants/README.md`, avec l'ancien mot de ds-lab en regard |
| V3 | Portée : les fiches et l'index seulement. Le reste du dépôt (« jeton » dans README, décisions, dette) est garé pour un petit lot à part |
| V4 | « Ce qu'il règle » est **généré depuis `$description`** de la source DTCG. Un token cité sans description : panne. Ajoute les descriptions qui manquent dans `tokens/commun/*.tokens.json` (au moins `texte.marque`, `fond.composant`) : documentation seulement, aucune valeur ne change, sorties CSS et Vuetify identiques à l'octet |
| N1 | **Règle de nommage des composants**, en décision (D56 ou D57, propose) : nom de code anglais, le plus courant dans les grands design systems (vérifié sur Component Gallery) ; d'après la fonction, pas la forme ; singulier, PascalCase, sans abréviation ; suffixe de famille commun ; jamais un nom réservé par le HTML (`Label`). Le texte de la fiche reste en français |
| N2 | Correspondance : Bouton → `Button`, BoutonIcone → `IconButton`, ChampTexte → `TextField`, Carte → `Card`, Avatar → `Avatar`, Etiquette → `Tag` |
| N3 | Le renommage se fait **dans ce lot**, avant les cinq autres fiches |
| N4 | Les noms des tokens (français) ne changent pas : garé, le glossaire fait le pont |

#### 3. Ce que je tranche (technique)

- **Un commit de renommage seul, sans aucun changement de comportement.** `git mv` pour garder l'historique. Sa preuve : même nombre de tests, tous verts ; test de rendu à 362 sur 362 ; CI verte ; aucune valeur de token ni sortie CSS ou Vuetify changée. Le rendu doit être le même : dis comment tu le montres (planches comparées, ou autre).
- Ce que le renommage touche : fichiers `.vue`, `.menu.js`, stories, `nom` et `prefixe` des menus, noms des tests de rendu et des jobs de CI, fiche et index, `CLAUDE.md`, `README.md`, `ARCHITECTURE.md`, `KNOWN_ISSUES.md`. **Les décisions D01 à D55 ne sont pas réécrites** : la nouvelle décision porte la table ancien nom → nouveau nom.
- Préfixe des messages de refus : le nom de code (`Tag : attribut refusé : …`). Titres des stories : le nom de code (`Composants/Tag`). Titre lisible d'une fiche : « Tag (étiquette) ». Fichiers des fiches : `tag.md`, `button.md`, `icon-button.md`, `text-field.md`, `card.md`, `avatar.md`.
- Identifiants des règles et des tests existants (W5, U…) : inchangés.
- Descriptions des tokens (V4) : un commit à part, avant celui des fiches, avec la preuve que les sorties sont identiques.

#### 4. Ordre proposé, sur la branche `fiches`

| # | Commit | Arrêt |
|---|---|---|
| 3 | Renommage des six composants, sans changement de comportement | **A** : CI verte, liste de ce qui a changé de nom, preuve que le rendu n'a pas bougé |
| 4 | Descriptions des tokens manquantes (sorties identiques) | |
| 5 | Générateur : vocabulaire, glossaire, « Anatomie et tokens », « ce qu'il règle » ; fiche du `Tag` refaite | **B** : lien GitHub de `docs/composants/tag.md`, que Quentin juge sur son téléphone |
| 6 | Les cinq autres fiches et l'index complet | **C** |
| 7 | Documentation : décisions, dette (dont « atelier » et le « jeton » garé), README, ARCHITECTURE, CLAUDE.md, identifiants ; puis fusion en avance rapide si vert, avec l'accord de Quentin | |

Corrige l'ordre si tu vois mieux, et dis pourquoi.

#### 5. Ta réponse

Plan dans `local/boite-aux-lettres/2026-11-19-31-de-claude-code-plan-suite-fiches.md` :
- inventaire du renommage (fichiers et occurrences, par composant), et ce qui pourrait casser (garde de Vuetify, chemins dans la dérive, jobs de CI) ;
- liste des tokens cités sans `$description` ;
- forme de « Anatomie et tokens » (comment la partie de chaque token est connue : générée ou écrite) et du glossaire ;
- commits, arrêts, temps prévu sur les réels du lot.

Questions de design pour Quentin en mots simples avec une recommandation ; questions techniques pour Claude.

### Pré-brief : les règles du langage (complément du fichier 30, à lire avant de planifier)

De : Claude, pour Claude Code, terminal de ds-lab. 19/11/2026, 16 h 20.
**BRIEF SEULEMENT : aucun fichier du dépôt modifié, aucun commit.** Ce pré-brief est un premier jet ; à toi d'en faire un brief complet, que Quentin validera avant tout travail. Il passe avant le plan demandé par le fichier 30 : les règles disent quoi renommer.

#### 1. Pourquoi

En jugeant la fiche de l'étiquette, Quentin a posé trois règles (vocabulaire du métier, tokens expliqués, noms de composants standards), puis a vu qu'elles sont d'un autre ordre : ce sont les règles du **langage que l'outil produit**. Elles doivent valoir pour tout utilisateur de ds-lab, y compris externe, pas seulement pour nos six composants. Il demande de les rédiger maintenant [Q, 16 h 09 et 16 h 17].

#### 2. Deux sortes de règles, à ne pas mélanger

| Sorte | Pour qui | Où |
|---|---|---|
| Règles du langage produit : nommage, composants, documentation | Tout utilisateur de l'outil | `docs/regles.md`, à la suite de DS1 à DS11, même forme : règle, raison, contrôle. « Une règle sans contrôle est une dette » |
| Règles de notre façon de travailler | Quentin, Claude, Claude Code | `CLAUDE.md`, inchangé |

Propose si `docs/regles.md` suffit ou s'il faut le découper (il a 17 lignes aujourd'hui), et comment un utilisateur externe y arrive depuis le README.

#### 3. Premier jet des règles (identifiants provisoires : vérifie qu'ils sont libres, dans les tests aussi)

| # | Règle | Contrôle envisagé |
|---|---|---|
| NM1 | Le code est en anglais : composants, props, valeurs, événements, slots, tokens. Le texte est en français : fiches, messages, décisions | Pas d'accent ni de mot d'une liste refusée dans l'interface du code ; tokens en dette |
| NM2 | Nom de composant : le plus courant dans les design systems de référence, d'après la fonction et non la forme ; singulier, PascalCase, suffixe de famille ; jamais un nom réservé par le HTML | Table de référence dans le dépôt (nom, sources) ; un composant hors table est refusé |
| NM3 | Une prop prend le nom du même concept dans le HTML ou dans Vuetify quand il existe (`disabled`, `label`, `size`) | La table de référence |
| NM4 | Un token est nommé d'après son usage, jamais d'après sa valeur | À écrire |
| CP1 | Un composant fait une seule chose : statique ou interactif, jamais les deux | Existe (menus, tests de rendu) |
| CP2 | Tout usage hors des props est refusé | Existe (D51, W5) |
| CP3 | Aucune valeur en dur : toute valeur visuelle vient d'un token | Étape 9 |
| DOC1 | Chaque composant a une fiche, aux mêmes sections | `fiches -- --verifier` |
| DOC2 | Ce qui se déduit du code est généré, jamais recopié | `fiches -- --verifier` |
| DOC3 | Chaque token dit ce qu'il règle (`$description`) | Contrôle V4 du fichier 30 |
| DOC4 | Vocabulaire du métier ; tout mot propre au système est au glossaire | Liste de mots refusés dans les fiches |
| DOC5 | Une fiche se lit en deux minutes | Plafond de mots, à mesurer puis fixer |

#### 4. Le trou déjà visible

Les props et leurs valeurs sont en français (`variante`, `taille`, `desactive`, `libelle`, `ton`, `texte`, `principal`, `neutre`…), mêlés à des props du HTML (`type`, `autocomplete`). Renommer les seuls composants donnerait `<Tag texte="Lyon" ton="marque">`. NM1 et NM3 étendent donc le renommage du fichier 30 à toute l'interface du code. Les tokens restent garés (N4).

Recommandations de Claude, **à confirmer par Quentin sur ton brief** : R2, toute l'interface en anglais (composants, props, valeurs, événements, slots) ; R3, les règles sans contrôle sont écrites quand même, avec leur ligne de dette.

#### 5. Ce que j'attends : le brief complet

Dans `local/boite-aux-lettres/2026-11-19-31-de-claude-code-brief-regles-du-langage.md` :

1. **Les règles, complétées.** Relis D01 à D55, `docs/regles.md`, `docs/contrat-de-marque.md`, `KNOWN_ISSUES.md` : quelles décisions sont en fait des règles valables pour tout utilisateur, et manquent à la liste ? Lesquelles de mon jet sont fausses, redondantes avec DS1 à DS11, ou incontrôlables ? Pour chacune : règle, raison, contrôle (existe, à écrire dans ce lot, ou dette).
2. **La table de référence des noms** : pour chaque composant, prop, valeur, événement et slot actuels, le nom proposé et sa source (HTML, Vuetify 4.3.4 lu dans `web-types.json`, usage courant). Signale les cas discutables (par exemple `ton` : `tone`, `color`, `variant` ?) plutôt que de trancher seul.
3. **Les messages de refus** : restent-ils en français avec des noms de props anglais ? Propose.
4. **Ce que ça change au plan du fichier 30** : inventaire du renommage étendu, ce qui peut casser, ordre des commits (un commit de règles en premier ?), arrêts, temps prévu.
5. **Questions** : de design pour Quentin, en mots simples, avec une recommandation ; techniques pour Claude.

Le brief répond aussi au fichier 30 : un seul document, pas deux.

### Lot « fiches » : réponses au brief des règles du langage

De : Claude, pour Claude Code, terminal de ds-lab. 19/11/2026, 16 h 34.
Réponse à `2026-11-19-31-de-claude-code-brief-regles-du-langage.md`. Le brief est accepté, avec les précisions ci-dessous ; il remplace l'ordre du fichier 30. Quentin donne le go en collant le message qui renvoie à ce fichier.

#### Design : Quentin (16 h 32, sur tableau, « tout A »)

| # | Choix |
|---|---|
| Q1 | Préfixe `Ds` : `DsButton`, `DsIconButton`, `DsTextInput`, `DsCard`, `DsAvatar`, `DsTag` |
| Q2 | `DsTag` |
| Q3 | `DsTextInput`, **sous condition** : recompte les noms de Component Gallery au commit 4 (pages lues, nombre exact, liste des systèmes dans `noms.json`). Si Text field l'emporte, ou si l'écart tient à moins de 3 systèmes, arrête-toi avant le renommage et dis-le : Quentin retranche |
| Q4 | `tone` : `neutral`, `brand` |
| Q5 | 500 mots écrits au plus par fiche, hors en-tête, tableaux et code |
| Q6 | Messages en français, avec les noms du code, forme unique `<Composant> : <prop ou attribut> : <motif>` |
| Q7 | Les noms du tableau 2 : `ghost`, `medium`, `block`, `errorMessage`, `headingLevel`. NM3 doit nommer l'exception de `medium` (une valeur de Vuetify qui ne dit rien, comme `default`, cède au nom courant), sinon la règle est violée dès sa première application |

#### Technique : Claude

| # | Réponse |
|---|---|
| T1 | D'accord : `docs/decisions.md` est une histoire datée, ses chemins ne sont plus vérifiés par la dérive ; ses commandes le restent |
| T2 | D'accord pour `atelier/composants/noms.json`, lu par le contrôle des fiches. **Pas de copie de la table dans D57** (ce serait contraire à DOC2) : D57 renvoie au fichier et ne garde que les six noms de composant, ancien et nouveau |
| T3 | NM3 strict : `prependIcon`, `prependInnerIcon` |
| T4 | Clés de l'en-tête en anglais ; titres de section en français |
| T5 | **Contre ta recommandation** : les variables du thème sortent de la fiche, sans commentaire caché. Une partie lue par la machine et invisible à l'humain ferait deux documents en un. Les tokens de pose gardent leur variable dans leur ligne écrite |
| T6 | CP3 en dette jusqu'à l'étape 9 |
| T7 | La suite de l'attendu va dans `docs/attendus/fiches.md` |

#### Précisions

- Titres des stories dans la barre latérale : le nom de code (`Composants/DsTag`) si cela ne change aucune planche ; le texte visible dans les stories reste en français.
- Arrêts : avant le renommage si Q3 change ; A (renommage, 0 pixel différent, `git diff tokens/` vide) ; B (fiche du Tag) ; C (cinq fiches, index). Relevé du temps dans `local/fiches-temps.md`.
- Rien sur `main` sans l'accord de Quentin.

## Valeurs attendues de la suite, écrites à la main le 19/11/2026

Brief : `2026-11-19-31-de-claude-code-brief-regles-du-langage.md`, dans la boîte aux lettres, hors dépôt, accepté avec les réponses ci-dessus. Go de Quentin le 19/11/2026, 16 h 35.

### Recompte de Component Gallery (condition de Q3) [F]

- Pages lues le 19/11/2026 en HTML brut : `component.gallery/components/<page>/`. Chaque exemple porte `data-component-name` et `data-design-system-name`.
- Un nom est compté une fois par système, sans casse ni espace ni tiret : « Text input », « Text Input » et « TextInput » ne font qu'un.

| Page | Exemples | Systèmes | Noms, en nombre de systèmes |
|---|---|---|---|
| `text-input` | 72 | 72 | Input 26, **Text input 25**, **Text field 12** (Text field et TextField), Input field 4, Text box 2 |
| `badge` | 123 | 66 | Badge 44, **Tag 32**, Chip 8, Pill 7, Label 5 |
| `button` | 118 | 85 | Button 84, **Icon button 9** |
| `card` | 77 | 65 | Card 53 |
| `avatar` | 38 | 35 | Avatar 35 |

- **Text input l'emporte sur Text field de 13 systèmes** : Q3 tient, `DsTextInput`, et il n'y a pas d'arrêt avant le renommage.
- Input est plus fréquent, mais c'est un seul mot et le nom d'un élément HTML (NM2).
- Les listes des systèmes sont recopiées dans `atelier/composants/noms.json`.

### Les noms

| Avant | Après | Fichiers | Nom de la fiche et du test de rendu | Nom en français (titre de la fiche) |
|---|---|---|---|---|
| `Bouton` | `DsButton` | `DsButton.vue`, `DsButton.menu.js`, `DsButton.stories.js` | `button` | bouton |
| `BoutonIcone` | `DsIconButton` | idem | `icon-button` | bouton à icône |
| `ChampTexte` | `DsTextInput` | idem | `text-input` | champ de texte |
| `Carte` | `DsCard` | idem | `card` | carte |
| `Avatar` | `DsAvatar` | idem | `avatar` | avatar |
| `Etiquette` | `DsTag` | idem | `tag` | étiquette |

**Props, valeurs, événements, slots** (la source entre parenthèses) :
- **DsButton** :
  - `variant` (Vuetify) : `primary`, `secondary`, `ghost`, `danger`, `danger-ghost`, défaut `primary` ;
  - `size` (Vuetify) : `medium`, `small`, défaut `medium` ;
  - `prependIcon` (Vuetify), défaut `null` ;
  - `block` (Vuetify) ;
  - `disabled` (HTML) ;
  - `loading` (Vuetify) ;
  - `type` (HTML) : `button`, `submit`, `reset` ;
  - événement `click`, slot `default`.
- **DsIconButton** :
  - `label` (usage courant), obligatoire ;
  - `icon` (Vuetify), obligatoire ;
  - `variant` : `ghost` par défaut, `secondary`, `primary`, `danger-ghost` ;
  - `size`, `disabled`, `type` ;
  - événement `click`.
- **DsTextInput** :
  - `label` (Vuetify), obligatoire ;
  - `hint` (Vuetify) ;
  - `errorMessage` (Vuetify, au singulier) ;
  - `required` (HTML) ;
  - `disabled` (HTML) ;
  - `type` (HTML) : `text`, `email`, `search`, `password` ;
  - `prependInnerIcon` (Vuetify) ;
  - `modelValue` (Vue) ;
  - `name` (HTML) ;
  - `autocomplete` (HTML) ;
  - `placeholder` (HTML) ;
  - événement `update:modelValue`.
- **DsCard** :
  - `title` (Vuetify), obligatoire ;
  - `headingLevel` (usage courant) : `2`, `3`, `4`, défaut `3` ;
  - `image` (Vuetify) ;
  - `imageAlt` (HTML, `alt`) ;
  - `href` (HTML) ;
  - slots `default` et `actions` (Vuetify).
- **DsAvatar** :
  - `name` (usage courant), obligatoire ;
  - `image` (Vuetify) ;
  - `decorative` (usage courant) ;
  - `size` (Vuetify) : `medium`, `large`.
- **DsTag** :
  - `text` (Vuetify), obligatoire ;
  - `tone` (usage courant) : `neutral`, `brand`, défaut `neutral`.

**Ce qui est renommé et ce qui ne l'est pas** :
- **Classes CSS** : le préfixe `ds-` est gardé, le reste passe en anglais.
  - Noms des pièces : `ds-button`, `ds-icon-button`, `ds-text-input`, `ds-card`, `ds-avatar`, `ds-tag`.
  - Parties : `__text`, `__icon`, `__spinner`, `__label`, `__hint`, `__error`, `__required`, `__field`, `__title`, `__link`, `__initials`.
  - États et valeurs : `--primary` et chaque valeur, `--disabled`, `--loading`, `--block`, `--inactive`, `--error`, `--icon`, `--link`.
- **Titres des stories** : `Composants/<Nom de code>`. Le texte visible des stories reste en français.
- **Ne changent pas** :
  - les noms des tokens et des variables du thème (N4) ;
  - les clés internes des menus (`options`, `regles`, `evenements`) et le nom des fichiers `.menu.js` (NM1 : le code interne reste en français) ;
  - les identifiants de règles et de tests ;
  - les décisions D01 à D55.
- **Champs des menus** : `prefixe`, `genre` et le `nom` d'une option disparaissent ; le nom du composant sert de préfixe.

### Les messages de refus

**Forme unique** : `<Composant> : <prop ou attribut> : <motif>`, en français, avec les noms du code.

| Cas | Message |
|---|---|
| Attribut hors liste | `DsTag : attribut refusé : closable` (inchangé, sauf le préfixe) |
| Prop obligatoire absente ou vide | `DsTag : text : obligatoire` |
| Valeur hors liste | `DsTag : tone : valeur inconnue : accent (neutral, brand)` |
| DsButton, DsIconButton | `DsButton : disabled : refusé avec type=submit` |
| DsAvatar | `DsAvatar : name : obligatoire` (nom fait d'espaces), `DsAvatar : name : sans lettre` |
| DsCard | `DsCard : imageAlt : obligatoire avec image` ; `DsCard : href : refusé avec le slot actions` ; au rendu, `DsCard : slot actions : seuls DsButton et DsIconButton sont admis` |

Une valeur numérique s'écrit telle quelle : `DsCard : headingLevel : valeur inconnue : 5 (2, 3, 4)`.

### Preuve que le rendu ne bouge pas au renommage

1. **Avant** : les 80 planches de `local/bouton-captures/`, `local/champ-carte-captures/`, `local/bouton-icone-captures/` et `local/avatar-etiquette-captures/` sont copiées dans `local/avant-renommage/`.
2. **Après** : la preuve écrit ses planches dans `local/button-captures/`, `local/text-input-card-captures/`, `local/icon-button-captures/` et `local/avatar-tag-captures/`. Chaque paire est comparée par la fonction de comparaison de la preuve (`atelier/preuve/commun.js`, seuil 0).
3. **Attendu** :
   - 80 paires, **0 pixel différent** ;
   - `npm run vuetify` et `npm run css` relancés, et `git diff tokens/` vide ;
   - `npm test`, même nombre de tests qu'avant (1 013), tous verts ;
   - test de rendu à 362 sur 362.

### La fiche, nouvelle forme

**Huit titres de niveau 2**, dans cet ordre :
1. `## Quand l'utiliser` ;
2. `## Props` ;
3. `## Refusé` ;
4. `## Anatomie et tokens` ;
5. `## Accessibilité` ;
6. `## En situation` ;
7. `## Décisions et dette` ;
8. `## Test de rendu`.

**Cinq blocs** : `titre`, `props`, `refus`, `tokens`, `contrastes`.

**En-tête du DsTag, à l'octet** :

```
---
name: DsTag
title: DsTag (étiquette)
file: atelier/composants/DsTag.vue
props: atelier/composants/DsTag.menu.js
wraps: VChip
decisions: [D55, D51]
stories: atelier/stories/DsTag.stories.js
test: npm --prefix atelier run preuve -- tag
---
```

`wraps` du bouton à icône : `VBtn (par DsButton)`.

**Bloc titre** : `# DsTag (étiquette)`.

**Bloc props** :

```
| Prop | Type | Obligatoire | Défaut | Valeurs admises | Nom repris de |
|---|---|---|---|---|---|
| `text` | texte | oui | aucun | libre | Vuetify |
| `tone` | texte | non | `'neutral'` | `'neutral'`, `'brand'` | usage courant |

Événements émis : aucun. Slots : aucun.
```

Les sources s'écrivent « HTML », « Vuetify », « Vue » ou « usage courant ». Une ligne écrite par prop sous le bloc : `` - `<prop>` : … ``, contrôlée comme avant.

**Bloc refus** :

```
Attributs admis en plus des props : `id`, `aria-*`, `data-*`. Retirés : `aria-label`, `aria-labelledby`. Attributs `on…` d'événement : refusés.

Tout autre usage lève une erreur, et rien n'est rendu. Messages, dans l'ordre où ils sont vérifiés :

- `DsTag : attribut refusé : <attributs>`
- `DsTag : text : obligatoire`
- `DsTag : tone : valeur inconnue : <valeur> (neutral, brand)`
```

Un composant qui les admet donne « Attributs `on…` d'événement : admis. ». Une règle du rendu est suivie de « , au rendu ».

**Bloc tokens**, la section « Anatomie et tokens » :

```
Un token est le nom d'une valeur de design. Le composant n'a aucune valeur en dur : chaque marque donne la sienne, et changer un token change toutes ses instances.

| Partie | Token | Ce qu'il règle |
|---|---|---|
| Couleur, tone neutral | `fond.composant` | Fond d'un composant au repos, plus soutenu que la surface ; un champ, une carte et le bouton secondaire se posent sur fond.surface. |
| Couleur, tone neutral | `texte.principal` | Texte courant et titres. |
| Couleur, tone brand | `fond.marque.discret` | Aplat clair de la marque, non cliquable, comme un bandeau, une section ou un encadré. |
| Couleur, tone brand | `texte.marque` | Texte de marque posé sur fond.marque.discret, comme les initiales d'un avatar ou une étiquette mise en avant ; pas 12 du primaire, et non la couleur des liens (D05). |
| Forme | `arrondi.pilule` | Arrondi complet d'une forme ronde ou en pilule, comme un avatar ou une étiquette. |
| Forme | `hauteur.etiquette` | Hauteur d'une étiquette, sur une ligne. |
| Forme | `marge-interieure.etiquette` | Marge intérieure gauche et droite d'une étiquette, de part et d'autre de son texte. |
| Texte | `typo.corps.petit` | Texte de tableau ; ligne visée 20 px. |
```

**Comment se construit le tableau** :
- **La partie** :
  - la famille du token donne Couleur (`texte.`, `fond.`, `bordure.`), Texte (`typo.`, `police.`) ou Forme (tout le reste) ;
  - le sélecteur CSS de la règle où le `.vue` lit la variable donne la précision.
    - Une classe `ds-<pièce>--<x>`, où `x` est une valeur d'une prop du menu, donne « <prop> <valeur> ».
    - Où `x` est une prop booléenne écrite en tirets, elle donne « <prop> ».
    - `:hover` ajoute « au survol », et `:focus-visible` ajoute « au focus ».
    - Toute autre classe, ou aucune, n'ajoute rien.
- **« Ce qu'il règle »** : la `$description` du token, lue dans `tokens/commun/semantique.tokens.json` ou `police.tokens.json`, son `$root` compris. Un token cité sans description est une panne (DOC3). Un `|` y serait échappé.
- **Une ligne par partie et par token** :
  - les parties vont dans cet ordre : Couleur, Forme, Texte ;
  - dans une même famille, les précisions suivent l'ordre du menu : d'abord aucune, puis les props et leurs valeurs dans l'ordre du menu, l'état venant après le repos ;
  - dans une même partie, les tokens suivent l'ordre de la table (couleurs, fond puis texte, puis variables).
- **Le bouton à icône** ne garde que les précisions dont la valeur est dans son propre menu.
- **Les variables du thème ne paraissent pas dans le bloc** (T5).
- **Tokens posés par le parent** : une ligne écrite sous le bloc, `` - Posé par le parent : `<token>` (`<variable ds->`) : … ``. Le token doit avoir sa description et la variable exister dans la table, sinon c'est une panne.

**Bloc contrastes** : inchangé.

**Index (`docs/composants/README.md`)** :
- Il garde son bloc généré, avec la colonne « À quoi il sert » au lieu de « Rôle », un renvoi à `docs/regles.md`, et une ligne par fiche : `` | `DsTag` | [DsTag (étiquette)](tag.md) | <phrase> | `` ;
- puis le **glossaire**, écrit à la main sous le bloc : `## Glossaire`, avec trois colonnes (Mot, Ce qu'il veut dire, Ancien mot de ds-lab).

**Mots refusés (DOC4)** :
- La liste : `jeton`, `menu`, `option`, `emplacement`, `écouteur`, `rôle`, `enveloppe`, `fabrique`, `preuve`, au singulier comme au pluriel, sans casse.
- Où on les cherche : dans le texte des fiches et de l'index, hors en-tête, hors code (en ligne et en bloc) et hors section Glossaire.
- Chaque mot refusé doit paraître dans la colonne « Ancien mot » du glossaire.
- Un mot refusé trouvé est un écart : `mot refusé : preuve (ligne <n>)`.

**Plafond (DOC5)** : 500 mots écrits au plus, hors en-tête, tableaux, code et blocs générés ; un mot est une suite de lettres, de chiffres, d'apostrophes ou de tirets. Au-delà, c'est un écart : `fiche trop longue : <n> mots écrits, 500 au plus`.

**Table des noms (NM1 à NM3)**, `atelier/composants/noms.json`, lue par le contrôle des fiches :
- **Écarts** (sortie 1), une ligne `✗ atelier/composants/noms.json : <écart>` chacun :
  - un composant, une prop, une valeur texte, un événement ou un slot d'un menu ou d'un `.vue` absent de la table ;
  - une entrée de la table que plus rien n'emploie ;
  - une source hors de `html`, `vuetify`, `vue`, `courant` ;
  - un nom mal formé :
    - composant : `Ds` puis PascalCase, en ASCII ;
    - prop : camelCase, en ASCII ;
    - valeur : minuscules, chiffres et tirets ;
    - événement : comme Vue (`click`, `update:modelValue`).
- **Lignes d'écart, par exemple** :
  - `prop absente de la table : DsTag.color` ;
  - `valeur absente de la table : DsTag.tone.accent` ;
  - `entrée sans emploi : DsTag.size` ;
  - `source inconnue : DsTag.text (wikipedia)` ;
  - `nom mal formé : DsTag.Tone`.

**CP1** (`test/fabrique-enveloppes.test.js`) : un menu sans événement a `ecouteurs: false`.

### Cas de test ajoutés

- **U1 à U10 sont repris à la nouvelle forme** : en-tête, blocs props, refus, tokens et contrastes du DsTag à l'octet ci-dessus ; écarts de U7 ; exemples de U8 avec les nouveaux noms et messages.
- **U11 Anatomie** :
  - le bloc du DsTag à l'octet ;
  - le bouton à icône n'a aucune ligne « variant danger » ;
  - un token cité sans description est une panne ;
  - un token posé par le parent inconnu est une panne.
- **U12 Mots refusés et plafond** :
  - une fiche d'essai qui écrit « la preuve » hors code donne `mot refusé : preuve (ligne <n>)` ;
  - la même en code ne donne rien ;
  - une fiche de 501 mots écrits donne l'écart du plafond ;
  - le glossaire contient chaque mot refusé.
- **U13 Table des noms** : chaque écart ci-dessus, sur une table d'essai ; la table du dépôt ne donne aucun écart.
- **W9 CP1** : sur chaque menu, aucun événement entraîne `ecouteurs: false`.
