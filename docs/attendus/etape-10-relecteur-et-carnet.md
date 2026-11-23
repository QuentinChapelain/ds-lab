# Étape 10, lot 5 : le relecteur voit ce qui s'écrit par le shell, le carnet a de vraies heures

Attendu écrit le 23/11/2026, avant le code, d'après les demandes du même jour (boîte, fichiers 68 et 69). Étiquettes : [F] lu ou mesuré, [H] hypothèse, [V] à vérifier, [Q] tranché par Quentin, [C] tranché par Claude, [P] proposé par Claude Code, accepté à l'arrêt 1. Accepté à l'arrêt 1 (15 h 58, fichier 71), bloc du carnet compris : le texte de Claude, retenu par Quentin (« on suit ta reco »).

## But

1. **Le relecteur relit ce qui a changé, quel que soit l'outil qui l'a écrit** [C]. Les IA neuves écrivent par le shell : le bras B n'a pas eu de relecteur (B-2 : 0 appel ; B-3 : au plus 1, sur `rapport.md`) [F, fichier 66].
2. **Le carnet a de vraies heures** : une commande date la ligne, au moment où la question se pose [C]. B-2 et B-3 ont écrit leur carnet d'un bloc, en fin de session, à des heures que personne n'a lues [F].
3. **Le relevé dit ce qu'il ne disait pas** : les outils qui écrivent, le relecteur, les heures du carnet, la session qui porte le brief, ce qu'une session avec humain charge en plus, le dossier temporaire, son propre code de sortie [C].

Un défaut de l'outil, pas du banc : il se corrige dans `src/cli/relecteur.js`, que toute équipe pose. Ce lot ne lance aucun passage. Ni le skill, ni un jeton, ni un composant, ni l'atelier ne changent [C] : le bras A (A-1 à A-3) reste valable.

## Départ [F, lu le 23/11/2026 à 15 h 41, sans `git fetch`]

`main` = `origin/main` = `e49a4e8`, copie propre, CI de `main` (45039998909) verte. Passages posés dans `~/Developer/banc/composer/` : A-1 à A-3, B-1 à B-3, B-9. Ni test, ni `npm audit` lancés pour écrire cet attendu.

## 1. Le relecteur

### Ce que dit la documentation de Claude Code

[F, pages `.md` de code.claude.com/docs/en, lues le 23/11/2026 : `hooks`, `tools-reference`, `cli-reference`, `settings-reference`, `env-vars`, `headless`, `chrome`]

| Point | Ce qu'elle dit | Ce que le lot en fait |
|---|---|---|
| Outils qui écrivent | `Write`, `Edit`, `NotebookEdit` ; `Bash` et `PowerShell` lancent des commandes. `MultiEdit` n'existe plus | Matcher `Edit\|Write\|NotebookEdit\|Bash\|PowerShell` (une expression régulière, admise). Pas `*` : chaque `Read` et chaque recherche coûterait un démarrage de Node ; un outil d'un serveur MCP qui écrirait est vu à l'appel suivant, ou à la fin du tour [P] |
| `PostToolUse` | Reçoit `session_id`, `cwd`, `tool_name`, `tool_input`, `tool_response`. Code 2 : la sortie d'erreur est montrée à l'IA, l'outil a déjà tourné | Inchangé |
| Fichiers écrits par le shell | `tool_response.bashEditDiff.changedFiles`, mais « best effort », « public beta », sous un réglage (`bashEditDiffEnabled`), sans les fichiers ignorés par git | Non pris : les empreintes ne dépendent ni d'un réglage de l'équipe, ni d'une bêta, ni de l'outil [P] |
| `Stop` | Code 2 ou `decision: "block"` avec `reason` : l'IA continue. `stop_hook_active` vaut `true` quand l'arrêt suit un `Stop` bloqué : « check this value … to avoid blocking on a condition that will never resolve ». Après huit relances de suite, Claude Code passe outre. Ne tourne pas sur une interruption de l'humain | Une seule relance, par `stop_hook_active` [C confirmé] |
| `-p` | « Without `--bare`, a `-p` session runs the hooks in a project's `.claude/settings.json` » | Les passages sans humain gardent les trois hooks. `--bare` et `--safe-mode` coupent les hooks : écartés |
| `SessionStart` | Reçoit `session_id` et `source` (`startup`, `resume`, `clear`, `compact`, `fork`) | Prend les empreintes de départ ; sur `resume` ou `compact`, garde celles qui existent [P] |
| Délai | 600 s par défaut pour un hook `command` | Aucun délai posé |
| Variables | Un hook hérite de l'environnement ; l'`env` des réglages vaut « for the subprocesses Claude Code starts ». `TMPDIR` n'est pas nommé (seul `CLAUDE_CODE_TMPDIR`, pour les fichiers internes de Claude Code) | Que `TMPDIR` de l'`env` atteigne le hook et le shell : [V], à vérifier à l'arrêt 2 par un essai technique, pas un passage numéroté (accepté) ; s'il n'arrive pas, le dire et proposer avant de contourner ; `DS_LAB` l'atteint [F, D67] |
| `FileChanged` | Un hook sur un fichier changé, « whatever wrote it » | Non pris : la page ne dit pas qu'il suit un motif comme `src/**/*.vue` [V] |

Rien ne contredit les points de Claude.

### Le fonctionnement [C, technique ; détails P]

| # | Quoi | Comment |
|---|---|---|
| 1 | **Ce qui est relu** | À chaque appel, les fichiers du périmètre (une marque saisie de `--marques`, un fichier d'un motif de `--style`) dont le contenu a changé depuis l'appel précédent, quel que soit l'outil. L'empreinte du contenu (SHA-1), pas la date : `cat >` deux fois dans la même seconde garde la même date [P]. Un fichier de marque change : sa marque entière est relue, comme aujourd'hui. Un fichier retiré n'est pas relu |
| 2 | **La mémoire** | Dans `<dossier temporaire>/ds-lab-relecteur/<session_id>/` (`os.tmpdir()`, donc `TMPDIR` s'il est posé) : les empreintes au départ de la session, celles du dernier appel, et un journal d'une ligne par appel (heure, événement, outil, fichiers relus, échecs, code). Rien dans le dépôt de l'équipe : `git status` reste propre [C] |
| 3 | **Le départ de la session** | Un hook `SessionStart` prend les empreintes de départ [P]. Sans lui, le premier `PostToolUse` arrive après la première écriture : il ne saurait pas ce qui a changé. Sans empreintes de départ (session reprise, hook ajouté en cours), le premier appel prend les siennes et ne relit que le fichier de `tool_input.file_path`, s'il y en a un, comme D67 ; le journal le dit |
| 4 | **Après chaque outil** | `PostToolUse`, sur les outils de la section précédente. Un échec : « relecteur : <fichier> » et les blocs de `verifier`, code 2, comme aujourd'hui. Rien de changé, ou relu sans échec : **aucune sortie**, code 0 [C : « ne coûte rien »] ; la ligne de contexte « 0 échec » de D67 disparaît |
| 5 | **À la fin du tour** | `Stop` : relit tout le périmètre changé depuis le départ de la session. Un échec : l'agent ne finit pas, il reçoit les blocs et « corrige, puis finis ». Une seule relance : quand Claude Code dit que l'arrêt vient déjà d'un `Stop` bloqué (`stop_hook_active`), le relecteur laisse finir, et écrit les échecs restants au journal et pour l'humain [P] |
| 6 | **Coût** | Stylelint n'est chargé que si un fichier de style a changé [P] : un `ls` coûte le démarrage de Node et les empreintes, sans sortie |
| 7 | **`--poser` relancé** | Remplace le hook `PostToolUse` du relecteur, ajoute `SessionStart` et `Stop`, sans doublon ni perte des autres hooks ; remplace la section « Carnet » du `CLAUDE.md` au lieu d'en ajouter une seconde ; garde `carnet.md` [C]. Aujourd'hui, un bloc changé s'ajouterait à côté de l'ancien [F, `relecteur.js`, ligne 109] |

Ce qui ne change pas : la commande du hook refuse un `DS_LAB` absent (code 2) ; une page intouchée n'est pas relue (RL5) ; un fichier changé est relu entier, fautes du départ comprises, comme aujourd'hui [F].

## 2. Le carnet

### La commande [C, technique ; options P]

`node "$DS_LAB/src/cli/carnet.js" --question "…" (--choix "…" | --reponse "…") [--fichier <chemin>]`

- Ajoute une ligne à `carnet.md`, cherché dans le dossier courant puis ses parents ; absent : sortie 2, « carnet.md introuvable : … poser le carnet (`relecteur.js --poser`) ou lancer depuis le dépôt ».
- L'heure est celle de la machine, écrite par la commande : `2026-11-23T15:41:07+01:00`, à la seconde, avec le décalage, pour se comparer au journal en UTC.
- `--choix` : ce que l'agent a décidé faute de réponse ; `--reponse` : ce que l'humain a répondu ; l'un des deux, pas les deux. Une barre `|` et un retour à la ligne sont échappés dans la cellule.
- Sortie 0 avec une ligne « carnet : ligne ajoutée », 2 sur une panne (D18), sous la garde de Node (D40).

### Le bloc du `CLAUDE.md` [Q, 23/11/2026, 15 h 58]

> ## Carnet
>
> Chaque fois que tu dois choisir quelque chose que la demande ne dit pas, écris-le au carnet avant de l'appliquer, par cette commande, qui date la ligne :
>
> `node "$DS_LAB/src/cli/carnet.js" --question "…" --choix "…" --fichier <fichier>`
>
> `--question` dit ce qui n'était pas dit, `--choix` ce que tu as décidé ; si tu l'as demandé à l'humain et qu'il a répondu, `--reponse` à la place de `--choix`. N'écris pas `carnet.md` toi-même.

Le déclencheur est un fait observable, un choix que la demande ne couvre pas : l'IA neuve ne nomme ses choix « questions » qu'après coup (A-1 et les quatre rapports) [C]. Le bloc ne pousse pas à demander à l'humain avant de faire : une autre ligne du tableau des améliorations, pour ne pas changer deux choses à la fois. La mesure : une ligne datée avant le premier fichier qui applique le choix.

## 3. Le banc et le relevé

| # | Quoi | Comment |
|---|---|---|
| 1 | **`pose.md`, composants `Ds…`** | « Composants Ds… du catalogue posés » ne compte que les noms dont `src/components/ds/<Nom>.vue` est au départ ; une ligne de plus, « Autres Ds… posés (pièces créées) », compte le reste [P]. Aujourd'hui `DsLinkButton : 3` est rangé avec le catalogue [F, `releve.js`, ligne 113] |
| 2 | **Outils qui écrivent** (`ecritures.md`) | Pour chaque session : appels par outil ; les appels `Edit`, `Write` (et les autres outils d'écriture) avec leur fichier ; les appels du shell qui ont l'air d'écrire (`>`, `>>` vers un fichier, `tee`, `sed -i`, `cp`, `mv`, un script qui ouvre en écriture), avec la cible lue : **des signaux, à lire** [P]. Bras B : le journal du relecteur dit, pour chaque appel, l'outil et les fichiers du périmètre changés, sans signal à interpréter [F au relevé] |
| 3 | **Le relecteur** | Bras B : appels, par événement (`SessionStart`, `PostToolUse`, `Stop`) ; retours en échec ; relances refusées à la fin ; lu dans son journal, dans le `TMPDIR` du passage |
| 4 | **Les heures du carnet** | Chaque ligne : son heure, dans la session ou hors d'elle, avant ou après le premier fichier changé qu'elle nomme ; le nombre d'appels de `carnet.js` dans le journal face au nombre de lignes (une ligne de plus que d'appels est écrite à la main) |
| 5 | **`TMPDIR` du passage** | `<passage>/tmp/`, créé à la pose, posé dans l'`env` de `.claude/settings.local.json` comme `DS_LAB` et `PATH` ; le relevé le copie (`tmp/`, sans `node_modules`) et en liste le contenu. Limite : un chemin écrit en toutes lettres, `/tmp/shot.mjs`, ne passe pas par `TMPDIR` [F : les quatre passages l'écrivent ainsi]. Le relevé liste en plus les chemins de `/tmp` et `/private/tmp` que nomment les commandes de la session [P] : la fuite reste possible, elle devient visible |
| 6 | **Code de sortie de `--relever`** | `sortie.txt` : `0`, écrit en dernier ; sur une panne, `2` et le message, avant de sortir [P] |
| 7 | **`heures.md`, plusieurs sessions** | La session du brief est celle dont un message de l'humain contient la première ligne de `brief.txt` ; les autres sont nommées, avec leurs heures, et écartées du calcul. Aucune : toutes, et c'est dit [P] |
| 8 | **Ce qu'une session avec humain charge** | `charge.json` lu aussi dans le journal de Claude Code (outils différés, serveurs MCP, skills, types d'agents) ; ses différences avec la pose (skill `ds-lab` seul, aucun serveur MCP) dans `charge.md`. Les deux commandes de `depart.txt` prennent `--no-chrome` (« Disable Chrome browser integration for this session », prioritaire sur les réglages) [P] ; sans humain, Claude in Chrome n'était déjà pas chargé [F, fichier 67] : la commande reste la même dans les deux modes (D67). Le reste ne s'écarte pas seul : aucune option ne coupe tous les plugins ; `--bare` et `--safe-mode` coupent aussi les hooks et le skill du projet ; couper `easel` par `enabledPlugins` demande son nom de plugin, et la page ne dit pas si un plugin intégré s'y coupe [V]. Ces différences, le relevé les écrit seul |
| 9 | **`depart.txt`** | Avant la commande « Avec humain » : « Terminal de macOS, fenêtre neuve, invite `~ %` ; jamais un terminal d'éditeur ni un dossier de ds-lab : ses variables (`OLDPWD`) nommeraient le vrai dépôt » ; écart 3 du fichier 64, pris [C] |

L'écart 4 du fichier 64 (trois défauts de `lu.md`) n'est pas pris : le lot ne touche pas `src/banc/lectures.js` [C : « sinon laisse »].

## 4. D71

Le relecteur relit le périmètre changé depuis son dernier appel, après chaque outil qui peut écrire et à la fin du tour, avec une mémoire hors du dépôt ; le carnet s'écrit par une commande qui date la ligne ; ce que le relevé ajoute. **Raison** : fichiers 66 à 69 de la boîte, et la documentation lue. **Limite** : un chemin de `/tmp` écrit en toutes lettres ; une interruption de l'humain saute la relecture de fin de tour ; `easel` et les skills propres au mode interactif restent chargés avec un humain ; un fichier changé par un processus lancé en fond entre deux appels est relu au suivant, attribué à l'outil de cet appel ; les signaux d'écriture du shell sont à lire.

## Tests

| Fichier | Tests |
|---|---|
| `test/relecteur.test.js` | **RL2** suit : un `.vue` propre ne rend rien. **RL3** suit : `--poser` relancé sur une pose de D67 remplace le hook et la section « Carnet », sans doublon, garde les autres hooks et `carnet.md`. **RL6** une écriture par le shell : départ de session, un `.vue` en dur écrit hors de tout outil d'édition, appel `PostToolUse` avec `tool_name: "Bash"` : code 2 et son bloc ; l'appel suivant, rien d'écrit : aucune sortie ; une marque cassée par le shell : ses blocs. **RL7** la fin du tour : changé depuis le départ et en échec, l'arrêt est refusé avec les blocs ; avec `stop_hook_active`, laissé ; propre, rien. **RL8** la mémoire est hors du dépôt (`git status` propre), une par session ; le journal du relecteur a une ligne par appel. **CN1** le carnet : ligne datée à la seconde avec décalage, cellule échappée, `--choix` et `--reponse` exclusifs, `carnet.md` cherché dans les parents, absent : sortie 2 |
| `test/banc.test.js` | **BN8** `TMPDIR` du passage dans les réglages et créé ; la consigne du terminal et `--no-chrome` dans `depart.txt` ; BN7 suit (`TMPDIR` dans le passage) |
| `test/releve.test.js` | **RV8** catalogue et autres `Ds…` séparés dans `pose.md`. **RV9** un journal simulé à deux sessions : celle du brief prise, l'autre nommée ; outils et signaux d'écriture du shell ; chemins de `/tmp`. **RV10** relevé du bras B simulé : journal du relecteur, heures du carnet face à la session et aux appels de `carnet.js`, `TMPDIR` listé, `sortie.txt` à 0 et à 2 ; `charge.json` d'une session avec humain |

`npm test` : 1 103 + 7 = **1 110** [H]. Aucun fichier de test ajouté, aucune dépendance. L'atelier n'est pas touché. Les autres contrôles à 0, `npm audit` aux deux endroits.

## Commits

| Commit | Contenu |
|---|---|
| C1 | Cet attendu |
| C2 | Le relecteur et le carnet (RL2, RL3, RL6 à RL8, CN1) ; D71 ; README, ARCHITECTURE, identifiants |
| C3 | Le banc et le relevé (BN8, RV8 à RV10) ; D71 complétée |

Un résumé du diff, montré **avant** chaque commit. **Arrêt 1** : cet attendu, le texte du bloc. **Arrêt 2** : les comptes, et un relevé du bras B sur un passage simulé.

## Hors périmètre

Tout passage (B-4 à B-6 viennent après, sur le commit du lot) ; le skill ; le relecteur dans le skill ; le lien-bouton du catalogue et le slot `actions` de `DsCard` ; les rapports qui déclarent plus de contrôles qu'ils n'en ont faits ou taisent une exception ; l'IA neuve qui ne pose aucune question à l'humain présent : tableau des améliorations [C].
