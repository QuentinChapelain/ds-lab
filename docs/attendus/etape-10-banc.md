# Étape 10, lot 1 : le banc d'essai, ses deux bras et les trois écritures

Attendu écrit le 22/11/2026, avant le code, d'après la demande du 21/11 (« préparer l'essai de l'agent neuf ») et la décision de Quentin du même jour (deux bras, pas de borne de temps, le but est l'outil et non la page), qui l'emporte en cas d'écart. Accepté à l'arrêt 1 (0 h 58), avec les réponses de Quentin (« on suit tes reco », 0 h 57) et sept corrections de Claude reportées ici. Étiquettes : [F] mesuré ou lu, [H] hypothèse, [V] à vérifier, [Q] tranché par Quentin.

## But

Un agent neuf, qui n'a que l'app, le skill et un clone de ds-lab, fait un annuaire dans une petite app Vuetify fictive, pour trois marques. Ce lot ne lance pas cet essai. Il pose ce qui permet de le jouer, puis de le rejouer à l'identique après chaque amélioration de l'outil : l'app, le banc d'essai, ses deux bras, le relecteur et le carnet. L'annuaire n'est qu'un banc d'essai : on y mesure l'outil, pas la page.

## Départ [F, lu le 22/11/2026 à 0 h 03]

- `main` suit `origin/main` sur `02606f8`. La copie est propre, sans verrou ni remise. Restent les branches `audit-node` et `relecture-corrections`.
- La CI de `main` (44912284956) est verte, 13 jobs, 3 min 30.
- `KNOWN_ISSUES.md` a 25 lignes et trois titres. `skill/ds-lab/SKILL.md` a 46 lignes et ne contient pas la phrase « fait foi ».
- `npm audit` donne 0 à la racine et 0 dans l'atelier. Node 24.22.3. `npm test` : 1 064 verts.
- L'atelier est en Vuetify 4.3.4, Vue 3.5.45, Vite 8.3.8 et `@vitejs/plugin-vue` 6.0.10.

## Les cinq mots [Q, 0 h 57]

| Mot | Sens |
|---|---|
| **relecteur** | Relit le fichier que l'agent vient d'écrire, par les contrôles de `verifier`, et lui dit quoi faire ; il ne corrige rien. Le mot rejoint « Relit », dans la colonne Contrôle de `docs/regles.md` |
| **carnet** | Le fichier du dépôt de l'utilisateur où l'agent note chaque question |
| **banc d'essai** (« le banc ») | La commande qui pose un dossier d'essai, puis en relève les traces |
| **passage** | Une session d'agent du début à la fin, dans un dossier d'essai à lui (`A-1` … `B-3`) |
| **bras** | A : le skill seul. B : le skill, plus le relecteur, plus le carnet |

## Le brief, mot pour mot [Q, 0 h 57]

Il suit la maquette de l'annuaire de Quentin. Cette maquette est hors du dépôt et tirée d'un terrain réel : rien n'en est recopié, ni nom, ni entreprise, ni école. Le brief ne demande que la ligne d'un membre et la liste, pas le reste de l'écran. Il ne nomme ni composant, ni token, ni règle. L'agent le reçoit tel quel, collé en premier message.

> Bonjour,
>
> Quai Nord a besoin d'un annuaire des membres : une page à l'adresse `/annuaire`, dans le menu, à côté des autres pages.
>
> Ce que la page montre de chaque membre, du plus important au moins important :
>
> 1. Son nom, en entier. C'est ce qu'on cherche des yeux, et il mène à son profil.
> 2. Sa photo. Sans photo, ou si elle ne charge pas, ses initiales.
> 3. Son poste, puis son entreprise et sa ville. L'entreprise mène à sa page.
> 4. Son groupe et sa promo, quand on les connaît.
> 5. Ce à quoi cette personne est ouverte (parler de son métier, relire un CV…), quand elle l'a dit. C'est ce qui donne envie de lui écrire : cela doit se détacher du reste, et pas par la couleur seule.
> 6. Une action, « Écrire », et un bouton « Plus d'actions » qui propose « Voir le profil » et « Ajouter aux contacts ».
>
> La page a pour titre « Annuaire ». Les membres s'y suivent l'un sous l'autre, dans l'ordre des données. Un nom long passe à la ligne. Rien ne déborde. Au clavier, on atteint chaque membre et chacune de ses actions. La page se lit sur téléphone comme sur ordinateur.
>
> Les données, liens compris, sont dans `src/data/membres.js`.
>
> L'app est servie sous trois marques : Écume et Sel, Grenat Papeterie et Maison Alberto. L'annuaire doit tenir dans chacune, en clair comme en sombre.
>
> Pour le design system, suis le skill ds-lab.

**Pour un passage sans humain**, le même texte reçoit un dernier paragraphe :

> Personne ne pourra te répondre pendant ce travail. Quand tu as une question, écris-la, choisis ce qui te semble le plus juste, et continue.

**Ce que le brief change :**
- **Les pièces manquantes** : le design system n'a ni lien (B9) ni menu, et l'agent devra les poser. C'est voulu, puisque la mesure « questions pour ajouter un composant » porte là-dessus. Ce lot ne les ajoute pas à ds-lab.
- **La comparaison avec l'étape 8** ne vaut plus que pour le nom, la photo et la promo. Pour l'œil de Quentin, la référence est sa maquette.
- **Le contenu de « Plus d'actions »** (deux entrées) vient de Claude, la maquette ne l'ouvre pas [H].

## Deux biais acceptés

- **NM5 cite `MemberCard`** : « `MemberCard` est une `DsCard` ». La règle est dans le skill, et les deux bras la lisent.
- **Le bras B reçoit deux aides à la fois**, le relecteur et le carnet : on ne saura pas laquelle joue.

## Ce qui est tranché, une ligne chacun

1. **Clé de regroupement de `verifier`** : pour le contraste, la marque et le jeton primitif par lequel passe le plus de paires en échec ; on le prend en premier, puis on recommence sur le reste. Pour les espacements et la typo : la marque et la règle. Pour le style : le fichier et la règle de Stylelint. Pour le skill : la copie. Un bloc par clé, avec un seul « À faire ».
2. **`KNOWN_ISSUES.md`** : le titre devient « À payer à l'ajout d'une marque ou d'un composant » et aucune entrée ne sort [F]. Seul `docs/attendus/etape-9-regles.md:226` cite l'ancien titre, et un attendu se garde à sa date.
3. **Phrase de priorité** : à la fin de « Avant de commencer » dans `SKILL.md`, la première chose que l'agent lit après les prérequis.
4. **L'app** vit dans `fixtures/app-fictive/` et se copie hors du dépôt à chaque passage.
5. **Les trois marques** sont celles du brief. La mesure est la luminance WCAG du `primary` du thème clair de `vuetify.json`, calculée par culori (`wcagLuminance`, `local/etape-10-banc/outils/lum.mjs`) [F] : Écume et Sel 0,624 (la plus claire), Grenat Papeterie 0,055 (la plus foncée), Maison Alberto 0,138 (la médiane des cinq). Les deux autres : Atelier Lavandine 0,160, Orbe Café 0,072.
6. **Les marques dans l'app** : leurs `entree.json` sont déjà posées dans `tokens/<marque>/`, copies de celles de ds-lab. L'app garde aussi ses anciens thèmes, écrits à la main dans `src/plugins/vuetify.js`.
7. **Le relecteur n'entre pas dans `skill/ds-lab/`** avant que le lot 2 l'ait décidé. Le bras A doit recevoir exactement le même skill que le bras B. Son code est `src/cli/relecteur.js` ; son mode d'emploi est dans le README et dans D67 ; une seule commande le pose.
8. **Le carnet** se pose avec le relecteur, dans le bras B seulement : un bloc dans le `CLAUDE.md` de l'app, et le fichier `carnet.md`.
9. **La forme du retour** : la sortie d'erreur et le code 2 quand le fichier relu a un échec ou une panne ; une ligne de contexte (`additionalContext`) sinon.
10. **Le dossier des passages** : `~/Developer/banc/<bras>-<n>/`, hors de ds-lab. Ni `~/Developer/` ni `~/` n'ont de `CLAUDE.md` [F].
11. **Nouvelle dépendance** : aucune à la racine. L'app a son propre `package.json` et son propre verrou, aux versions de l'atelier, plus `vue-router` 5.4.0 (publié le 07/10/2026 [F, `npm view`]).

## 0. La sortie du relecteur revient-elle à l'agent ?

**Lu dans la doc de Claude Code** (`code.claude.com/docs/en/hooks`, le 22/11 à 0 h 06) [F] : pour `PostToolUse`, « exit 2 : Shows stderr to Claude; the tool already ran » ; `decision: "block"` « adds the reason next to the tool result » ; `additionalContext` est « added to Claude's context alongside the tool result ». La sortie standard d'un code 0 et la sortie d'erreur d'un code 1 ne vont pas à l'agent. L'entrée d'un `Write` porte `tool_input.file_path`. Délai par défaut d'un hook de commande : 600 s.

**Pas encore essayé [V].** Le mode auto m'a refusé une session `claude -p`. L'essai est prêt, et Quentin le lance (environ 30 s, Haiku) :

```
! sh /Users/qc/Developer/ds-lab/local/etape-10-banc/outils/essai-hook/lancer.sh
```

Il écrit cinq fichiers, et chaque écriture déclenche une forme de sortie : A, code 2 et sortie d'erreur ; B, `decision: "block"` ; C, `additionalContext` ; D, code 0 et sortie standard ; E, code 1. Le hook note le `file_path` qu'il reçoit dans `appels.log`.

**Attendu** :
- cinq lignes dans `appels.log`, une par fichier, avec son chemin ;
- l'agent cite A, B et C, et ni D ni E ;
- A porte `env=vu-par-le-hook` : la variable posée par `.claude/settings.local.json` atteint le hook.

**Selon le résultat** : si A ne revient pas, je prends B. Si ni A ni B ne reviennent, le relecteur devient une consigne du `CLAUDE.md` (« lancer `verifier` après chaque fichier »). **C4 ne s'écrit pas avant cet essai.**

**La durée** : 0,18 s pour `verifier` sur les trois marques et deux `.vue` [F, trois mesures].

## 1. Les trois écritures

### `verifier` regroupe par cause

**Le constat de départ** [F, rejoué sur une copie de l'essai du fichier 34, avec `color.primary.11` de Ruche Basse mis à `#f2e6c4`] :
- 32 paires sont en échec, toutes en clair (large et étroit), et toutes passent par `color.primary.11` ;
- ce jeton est lu par `text.interactive`, `text.on-interactive.inverse`, `border.focus`, `background.interactive.strong` et `background.brand.strong` ;
- cela fait 16 paires dans 2 contextes : 18 en DS12, 14 en DS2, la plus basse à 1,11:1.

**La sortie de l'essai du fichier 34, réécrite** :

```
verifier : 2 marques dans tokens/ (Phare Gris, Ruche Basse) ; 3 fichiers de style
✗ contraste · Ruche Basse (tokens/ruche-basse/) : color.primary.11 (#f2e6c4), lu par text.interactive, border.focus, text.on-interactive.inverse, background.interactive.strong, background.brand.strong ; 16 paires sous leur seuil dans 2 contextes sur 4 (clair, large ; clair, étroit), soit 32 échecs, la plus basse à 1,11:1 (DS12 : 18, DS2 : 14).
  À faire : relancer la saisie sur tokens/ruche-basse/entree.json ; si elle refuse la marque, changer la couleur qu'elle nomme. Ne pas corriger les jetons à la main.
✗ style · src/components/MemberBadge.vue : ligne 7 : Valeur brute « 12px » pour padding (declaration-property-value-allowed-list).
  À faire : prendre var(--v-ds-…) ou rgb(var(--v-theme-…)) ; sinon une exception avec sa raison (CP3).
verifier : 33 échecs en 2 blocs (contraste 32, espacements 0, typo 0, style 1, skill 0)
```
Sortie 1.

- **Deux écarts de forme au texte accepté à l'arrêt 1**, fixés au premier essai du code (0 h 59), le fond inchangé : les rôles sont listés en devant d'abord, puis en fond, chacun dans l'ordre des paires ; le bloc de style cite chaque ligne avec son constat tel que Stylelint l'écrit (« ligne 7 : Valeur brute « 12px » pour padding »), plusieurs lignes séparées par « ; ».
- **Un bloc** tient en deux lignes : le constat, puis « À faire ».
- **Le message de Stylelint** se coupe au premier « : » : le constat d'un côté, ce qu'il faut faire de l'autre. Un test refuse un message de `stylelint.config.mjs` qui n'aurait pas cette forme (règle d'écriture 6).
- **Le bilan** garde le compte des échecs, le compte par contrôle et le code de sortie, et y ajoute le nombre de blocs.
- **Une paire qui ne passe par aucun jeton commun** à d'autres échecs fait son propre bloc.
- **Le refus d'une échelle commune redéfinie** (D25) reste un bloc d'une ligne.

### `KNOWN_ISSUES.md` et `SKILL.md`

La phrase, mot pour mot : « Le code fait foi sur ce guide : si une commande, un fichier ou une règle du clone contredit ce guide, suivre le clone et signaler l'écart à l'humain. »

## 2. L'app fictive, page par page

Quai Nord est l'app fictive d'une association d'anciens élèves, servie sous trois marques. Elle tourne avec Vue 3.5.45, Vuetify 4.3.4, Vite 8.3.8, `@vitejs/plugin-vue` 6.0.10, `@mdi/js` 7.4.47 et `vue-router` 5.4.0. Elle n'a ni annuaire ni composant `Ds…`.

| Fichier | Contenu |
|---|---|
| `src/App.vue` | `VApp`, `VAppBar` (le nom de la marque, les liens Accueil, Événements et Adhésion, un `VSelect` de la marque, un `VBtn` clair ou sombre), `VMain`, un pied de page. La marque se lit dans `?marque=<dossier>` |
| `src/pages/Accueil.vue` | Un bandeau (titre et phrase), trois actualités en `VCard`, un `VBtn` « Adhérer » |
| `src/pages/Evenements.vue` | Un `VDataTable` de huit événements, un filtre `VSelect`, un `VChip` d'état |
| `src/pages/Adhesion.vue` | Un formulaire : quatre `VTextField`, un `VCheckbox`, un `VBtn` d'envoi, un `VAlert` de confirmation |
| `src/plugins/vuetify.js` | Six thèmes écrits à la main : trois marques, en clair et en sombre, aux couleurs proches de celles des entrées mais pas égales |
| `src/styles/app.css` et les `<style scoped>` | Des valeurs en dur : `#hex`, `px`, `font-weight: bold`, une ombre, `border-radius: 6px` |
| `src/data/membres.js` | Les dix personnes de `atelier/stories/membres.js`, présentées comme la réponse figée d'une API. Chacune porte poste, entreprise, lien de l'entreprise, ville, groupe, promo, ouverture, lien du profil et lien d'écriture ; entreprises et groupes sont fictifs. Certaines n'ont pas de photo, de promo ou d'ouverture ; une photo est en échec ; un nom est long |
| `tokens/<marque>/entree.json` | Les entrées d'Écume et Sel, Grenat Papeterie et Maison Alberto, copies de celles de `tokens/` |
| `index.html`, `vite.config.js`, `package.json`, `package-lock.json` | De quoi lancer `npm run dev` et `npm run build` |
| `banc.json` | La liste des trois marques, lue par le banc : aucune marque n'est écrite dans `src/` (D26) |

**La dette des thèmes Vuetify hors des `Ds…`** n'est pas payée. Je noterai à l'arrêt 2 ce que j'en vois en clair et en sombre.

**Les gardes de ds-lab** ne lisent que `src/` et `atelier/` [F]. Les pièces de Vuetify de `fixtures/app-fictive/` sont donc admises (fichier 13, section 4).

## 3. Le banc d'essai

Usage : `npm run banc -- --bras A|B --passage <n> [--dossier <racine>]`. La racine par défaut est `~/Developer/banc`. Pour un passage, le banc pose `<racine>/<bras>-<n>/` :

1. **`ds-lab/`**, la copie du commit courant prise par `git archive HEAD`, sans la référence. Elle devient un dépôt git d'un seul commit, sans historique. Le banc lance `npm ci` dedans.
2. **`app/`**, la copie de `fixtures/app-fictive/`, sans `banc.json`. Le banc y lance `npm ci`, puis en fait un dépôt git d'un commit « départ ».
3. **`app/.claude/skills/ds-lab/`**, la copie de `skill/ds-lab/`.
4. **`app/.claude/settings.local.json`** : `env.DS_LAB` et `permissions.additionalDirectories`, tous deux le chemin de `ds-lab/` ; ce fichier est ignoré par git.
5. **Bras B seulement** : `node ds-lab/src/cli/relecteur.js --poser --marques tokens --style "src/**/*.vue"`, lancé dans `app/`. Il écrit le hook dans `app/.claude/settings.json`, le bloc du carnet dans `app/CLAUDE.md` et le fichier `app/carnet.md`, puis le banc refait le commit « départ ».
6. **`brief.txt`** (avec humain) et **`brief-seul.txt`** (sans humain), à côté de `app/`, hors de la vue de l'agent.
7. **`depart.txt`** : le commit de ds-lab, l'heure, le bras, la version de `claude`, la commande exacte du passage et la sortie de `verifier` au départ.

**Ce qui est caché** dans la copie de ds-lab :
- `atelier/modules/`, `atelier/preuve/member-*.js`, `atelier/stories/Member*.stories.js` et `membres.js` ;
- `docs/modules/`, `docs/attendus/` et `fixtures/marque-demo/annuaire/` ;
- `fixtures/app-fictive/` et le code du banc ;
- les captures, déjà hors du dépôt, dans `local/`.

**Ce qui reste** [F] : les six composants `Ds…` ; des mentions dans le texte de `docs/decisions.md`, du README, d'ARCHITECTURE, des fiches des composants et de NM5. **Ce que `verifier` en pense** [H] : rien, puisqu'il ne lit que les marques, le style de l'app, `stylelint.config.mjs` et `skill/ds-lab/`. Ce qui casse dans la copie : `npm test`, la preuve et les fiches de l'atelier. Preuve à l'arrêt 2.

**La commande d'un passage**, la même avec et sans humain [correction 5]. Seule change la façon de donner le brief :

```
cd <passage>/app && claude --model <modèle> --permission-mode auto --setting-sources project,local --strict-mcp-config
```
Sans humain, la commande ajoute `-p "$(cat ../brief-seul.txt)" --output-format stream-json --verbose > ../session.jsonl`.

- **Le modèle** est le même pour les six passages, nommé dans la commande et noté dans `depart.txt`. Je le propose à l'arrêt 2.
- **`--setting-sources project,local` et `--strict-mcp-config`** : la session ne charge ni les réglages du compte (plugins, mode par défaut) ni ses serveurs MCP [V : ce que la session charge encore, les skills de `~/.claude/skills/` et les connecteurs de claude.ai, se lit à l'arrêt 2 sur un passage posé]. Au relevé, la liste de ce que la session a chargé est lue dans son message d'ouverture et ajoutée au relevé.
- **Les permissions** sont les mêmes pour tous les passages. Une demande de permission n'est ni une question ni une attente : elle sort des deux comptes.
- **Qui lance** : Quentin, puisque le mode auto me refuse une session `claude` [F].

**Fin d'un passage** [correction 2] : quand l'agent dit avoir fini. `verifier` à 0 n'en est pas la condition : on ne l'atteint pas sans refaire l'app.

**Relever un passage** : `npm run banc -- --relever <bras>-<n>`. Le résultat va dans `local/banc/<bras>-<n>/` :
- le journal, copié ;
- la sortie finale de `verifier` entière, puis ses échecs comptés à part : ceux des fichiers neufs ou modifiés depuis « départ », et ceux des fichiers intouchés ;
- le diff depuis « départ » ;
- le carnet (bras B) ;
- ce que la session a chargé ;
- le relevé des heures ;
- **12 planches** : `/annuaire?marque=<dossier>`, à 1 280 et à 360 px, en clair et en sombre, pour les trois marques, par `npm run build` de l'app et le Chromium de `playwright-core`. Une page qui ne s'ouvre pas est notée, ce n'est pas une panne du banc.

**Le journal** est dans `~/.claude/projects/<chemin de app/, chaque / devenu ->/<session>.jsonl` ; chaque message y porte son heure (`timestamp`) [F]. Au lot 2, je le lis ainsi :
- **le travail** va du brief au message où l'agent dit avoir fini, moins les attentes ;
- **une attente** va d'un tour fini de l'agent au message suivant de l'humain ;
- **les questions** sont les appels à `AskUserQuestion` et les questions adressées à l'humain en fin de tour ; je les classe à la main (sens, hiérarchie ou langage, ou bien technique ou rendu) et je les croise avec le carnet dans le bras B ;
- **les demandes de permission** sont exclues.

**Durée d'un passage** [H] : de 1 h à 3 h sans humain.

## 4. Le relecteur et le carnet

**Il ne relit que le fichier qui vient d'être écrit** [correction 1], celui de `tool_input.file_path` :
- **un fichier de `tokens/<marque>/`** : le contraste dans les quatre contextes, les espacements et la typo de cette marque ;
- **un fichier jugé par l'un des globs de `--style`** : le style de ce seul fichier ;
- **tout autre fichier** : rien.

`verifier` entier reste lancé à la main, par l'agent, et au relevé.

**Le hook** écrit dans `app/.claude/settings.json` :
```json
{ "hooks": { "PostToolUse": [ { "matcher": "Edit|Write", "hooks": [ { "type": "command", "command": "node \"$DS_LAB/src/cli/relecteur.js\" --marques tokens --style \"src/**/*.vue\"" } ] } ] } }
```
`--poser` fusionne ce hook avec un `settings.json` qui existe, sans rien perdre ; relancé, il ne change rien.

**Ce que l'agent reçoit** :
- sur un échec ou une panne : `relecteur : <fichier>`, suivi des blocs de `verifier` pour ce fichier ; code 2 ;
- s'il ne trouve aucun échec : `relecteur : <fichier>, 0 échec`, en `additionalContext` ;
- sur un fichier qu'il ne juge pas : rien, code 0.

**Le bloc du carnet**, dans le `CLAUDE.md` de l'app :
```
## Carnet
Chaque question que tu poses à l'humain, ou que tu ne peux pas lui poser, s'écrit dans `carnet.md` : une ligne du tableau, avec l'heure, la question, la réponse reçue ou ce que tu as choisi faute de réponse, et le fichier concerné. Puis continue.
```

**`carnet.md`**, posé vide :
```
# Carnet des questions

| Heure | Question | Réponse reçue, ou choix faute de réponse | Fichier |
|---|---|---|---|
```

## 5. La CI

- **Les tests de l'app** sont statiques : elle n'est ni installée ni construite en CI.
- **Les tests du banc** posent un passage sans `npm ci`, avec l'option `--sans-installation` [H : moins de 10 s].
- **Le build de l'app** tourne en local, à l'arrêt 2 et à chaque relevé.
- **Le total** reste sous 4 min.

## Tests

Les séries AF, BN et RL sont libres [F] ; elles vont dans `docs/identifiants.md`. Chaque fichier entre dans la part la plus légère.

| Fichier | Tests |
|---|---|
| `test/verifier.test.js` | VR2, VR4 et VR6 suivent le bloc, sans changer de sens. **VR9** Une couleur cassée : un bloc, le jeton, les rôles, le compte de paires et de contextes, les règles avec leur compte, un « À faire ». **VR10** Deux valeurs en dur dans un fichier : un bloc ; deux fichiers : deux blocs. **VR11** Le bilan garde le compte des échecs et le code de sortie, et compte les blocs ; chaque message de `stylelint.config.mjs` a la forme « constat : à faire » |
| `test/skill.test.js` | **SK6** `SKILL.md` porte la phrase de priorité, mot pour mot |
| `test/app-fictive.test.js` | **AF1** Mêmes versions que l'atelier. **AF2** Ni composant `Ds…`, ni page ni route d'annuaire, ni chemin vers ds-lab. **AF3** Les dix mêmes personnes que `atelier/stories/membres.js`, chacune avec les champs du brief, et chaque cas présent (sans photo, photo en échec, sans promo, sans ouverture, nom long). **AF4** Chaque `entree.json` égale celle de `tokens/`, et `banc.json` nomme ces trois marques |
| `test/banc.test.js` | **BN1** Un passage A : `app/`, le skill copié, `settings.local.json`, une copie de ds-lab sans aucun chemin caché, et un historique d'un commit. **BN2** Un passage B : en plus, le hook, le bloc du carnet et `carnet.md` ; A n'a rien de cela. **BN3** Deux poses : mêmes fichiers à l'octet, hors chemins absolus et heure. **BN4** `verifier`, lancé depuis la copie sur l'app de départ : sortie 1, des blocs de style seulement, 0 contraste |
| `test/relecteur.test.js` | **RL1** Une marque cassée, un fichier de cette marque écrit : code 2, ses blocs sur la sortie d'erreur. **RL2** Un fichier propre : code 0, `additionalContext`. **RL3** `--poser` fusionne avec un `settings.json` existant ; relancé, il ne change rien. **RL4** `DS_LAB` absente, ou une panne : un message qui dit quoi faire. **RL5** Appelé sur une page existante de l'app, intouchée et en faute, après l'écriture d'un autre fichier propre : il ne dit rien de la page en faute [correction 7] |

## Comptes attendus

- `npm test` : 1 064 + 17 = **1 081** [H : 3 VR, 1 SK, 4 AF, 4 BN, 5 RL].
- Preuve : **546**, 0 échec. Captures : **120**, identiques au pixel. L'atelier n'est pas touché : je les rejoue une fois à la fin.
- Les trois contrôles dans les quatre contextes, `types`, `knip`, `dependances`, `style` et les fiches restent à 0. `npm audit` : 0 à la racine, 0 dans l'atelier. Celui de l'app est relevé et noté.

## Commits

| Commit | Contenu |
|---|---|
| C1 | Cet attendu, les trois écritures (`verifier` par bloc, `KNOWN_ISSUES.md`, `SKILL.md`), VR9 à VR11, SK6 |
| C2 | L'app fictive, AF1 à AF4 |
| C3 | Le banc (pose, référence cachée, relevé), BN1 à BN4, `npm run banc` |
| C4 | Le relecteur et le carnet, RL1 à RL5, D67 ; après l'essai du hook |

README, ARCHITECTURE, décisions et identifiants sont mis à jour dans chaque commit qui les touche.

## Hors périmètre

L'essai lui-même ; la comparaison ; un lien ou un menu dans ds-lab ; la pose d'un composant depuis un inventaire (C5) ; la dette des thèmes Vuetify ; les six pistes garées ; le paquet installable ; le serveur MCP ; le préfixe réglable.
