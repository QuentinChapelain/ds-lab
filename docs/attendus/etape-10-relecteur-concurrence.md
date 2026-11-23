# Étape 10, lot 6 : quatre défauts du relecteur, quatre lectures fausses du relevé

Attendu écrit le 23/11/2026, avant le code, d'après la demande du même jour (boîte, fichier 81, qui reprend le fichier 80). Étiquettes : [F] lu ou mesuré, [H] hypothèse, [V] à vérifier, [Q] tranché par Quentin, [C] tranché par Claude, [P] proposé par Claude Code. Lot mécanique : Quentin a dit de ne pas s'arrêter à l'arrêt 1 [Q] ; les choix [P] se lisent à l'arrêt 2.

## Départ [F, lu le 23/11/2026, sans `git fetch`]

`main` = `7404fde`, copie propre ; branche locale `relecteur-concurrence`. Passages B-4 à B-6 relevés (fichier 80). Rien d'autre dans ce lot : ni le skill, ni le bloc du carnet, ni le brief [C].

## Ce que dit la documentation de Claude Code

[F, `code.claude.com/docs/en/hooks.md`, lue le 23/11/2026, jusqu'au caractère 119 894 sur 293 801]

| Point | Ce qu'elle dit | Ce que le lot en fait |
|---|---|---|
| Hooks en parallèle | « When an event fires, its matching hooks run in parallel. » Deux appels d'outils d'un même message lancent deux `PostToolUse` [F, B-5, fichier 80] | D1 |
| `CLAUDE_PROJECT_DIR` | « the project root where the session started » ; exportée au processus du hook | D3 |
| `cwd` de l'entrée | « the new directory after Claude runs `cd` » | D3 : n'est plus la racine |
| Entrée | « Your script receives the event's JSON input on stdin » ; la page ne dit pas que l'entrée est fermée ensuite | D2 : un délai court, pas une lecture sans fin |

## Le relecteur (`src/cli/relecteur.js`)

| # | Défaut [F, fichier 80] | Correction | Test |
|---|---|---|---|
| D1 | Deux hooks simultanés écrivent `dernier.json.tmp` sous le même nom : l'un renomme, l'autre sort en panne (`ENOENT`) | **Écriture atomique par appel** [P] : le fichier temporaire porte le numéro du processus (`dernier.json.<pid>.tmp`), puis `rename`. Aucune relecture perdue : un appel relit l'écart entre les empreintes qu'il a lues et celles qu'il mesure, et toute empreinte écrite vient d'un appel qui a relu ce qui la sépare de la précédente ; au pire, deux appels simultanés relisent le même fichier, et l'agent lit deux fois le même bloc [P]. Un fichier du périmètre qui disparaît entre la liste et la lecture (un `mv` d'un autre outil) est sauté, pas une panne [P] | **RL9** : départ, puis cinq fois une écriture par le shell suivie de deux `PostToolUse` lancés ensemble : aucune panne, au moins l'un des deux rend le bloc, le journal a une ligne par appel, sans panne |
| D2 | Lancé à la main sans entrée, `readFileSync(0)` attend sans fin (B-5 : 10 min) | Entrée d'un terminal : sortie tout de suite. Sinon, rien reçu en **2 s** [P], ou une entrée vide : sortie 2 (D18 : l'entrée n'a pas pu être jugée), une ligne : « relecteur : aucune entrée : il est lancé par les hooks de Claude Code (SessionStart, PostToolUse, Stop) ; à la main, lancer verifier : `node "$DS_LAB/src/cli/verifier.js"` » suivi des options qu'il a reçues. Rien au journal : sans entrée, pas de session | **RL10** : entrée vide, réponse immédiate ; entrée ouverte et muette, sortie en moins de 5 s ; le message, mot pour mot |
| D3 | Le périmètre se compte depuis `cwd` de l'entrée, qui suit le `cd` de l'agent (B-6 : périmètre vide dans `src/components/ds`, puis 33 fichiers relus au retour) | La racine : `CLAUDE_PROJECT_DIR` si elle est posée, sinon `cwd` de l'entrée, sinon le dossier courant [P] | **RL11** : `CLAUDE_PROJECT_DIR` à la racine, appels depuis `src/components` : rien relu à tort ; un fichier écrit par le shell, relu sous son chemin depuis la racine ; l'appel suivant depuis la racine, rien |
| D4 | La panne de D1 n'est pas au journal ; `rapport.md` de B-5 dit le hook cassé | Tombe avec D1. Une panne, une fois la session connue, s'écrit au journal avant la sortie : `{ heure, evenement, outil, panne: <message>, code: 2 }` | **RL12** : mémoire illisible (`dernier.json` tronqué) : code 2, « relecteur : <message> », et la ligne de panne au journal |

## Le relevé (`src/banc/traces.js`)

| # | Lecture fausse [F, fichier 80] | Correction | Test |
|---|---|---|---|
| R1 | Les appels de `carnet.js` sont comptés par le nom du fichier dans la commande ; une fonction (`c() {…}`) le nomme une fois pour plusieurs lignes : « 4, 8 et 6 ligne(s) … écrites à la main », faux | On compte les **appels du shell** qui nomment `carnet.js`, et chaque ligne datée est rattachée à l'un d'eux si son heure tombe entre la seconde de l'appel et celle de son résultat (`tool_result`), une seconde de marge ; sans résultat, deux minutes [P]. Une ligne qui ne tombe dans aucun : « hors de tout appel de carnet.js, à lire » ; une ligne non datée le reste | **RV11** : une fonction shell qui écrit trois lignes en un appel : trois lignes dans l'appel, aucune hors ; une ligne datée hors de tout appel, signalée |
| R2 | Une panne du relecteur n'est que dans le journal de Claude Code (`hook_blocking_error`) : non comptée | Deux sources : les lignes `panne` du journal du relecteur (D4), comptées par événement ; et, dans les sessions du brief, les attachements `hook_blocking_error` dont la commande nomme `relecteur.js` et dont le message n'a aucune ligne `✗` (un échec de contrôle en a toujours une) : « pannes vues par Claude Code », avec l'heure, le hook et la première ligne | **RV12** : un journal du relecteur avec une panne ; un journal de Claude Code avec une panne et un échec de contrôle : une panne de chaque source, l'échec n'en est pas une |
| R3 | La notification d'une tâche de fond (`origin.kind` : `task-notification`, texte `<task-notification>`) compte comme un message de l'humain : « L'agent attend l'humain : 10 min », faux | Ni humain ni agent : elle ne fait ni début ni attente ; `heures.md` dit leur nombre. `heures` passe de `src/cli/banc.js` à `src/banc/traces.js`, pour être testée seule [P] | **RV13** : brief, agent, notification 10 min plus tard, agent : 0 min d'attente, une notification |
| R4 | Un `>` dans une chaîne entre guillemets est pris pour une redirection (cibles `qui`, `25`, `»`, `/,$p`) | Les chaînes entre guillemets sont masquées avant de chercher redirection, `tee`, `cp` et `mv`, sauf celle qui suit un `>` : c'est sa cible | **RV14** : `--question "a > b ?"`, `sed -n '/<style>/,$p'`, `echo "a > b" > src/c.vue`, `printf x > 'src/d.vue'` : deux signaux, `src/c.vue` et `src/d.vue` |

Ce qui suit : RV9 et RV10, la ligne du carnet de `ecritures.md`.

## D71 complétée

Une puce « Correction » : écriture par appel, sortie sans entrée, racine du projet, panne au journal ; et ce que le relevé lit de plus. **Limite** : deux appels simultanés peuvent relire le même fichier, et l'agent lire deux fois le même bloc ; une session lancée hors de Claude Code, sans `CLAUDE_PROJECT_DIR`, retombe sur `cwd`.

## Tests

`npm test` : 1 111 + 8 = **1 119** [H] (RL9 à RL12, RV11 à RV14). Aucun fichier de test ajouté, aucune dépendance. L'atelier n'est pas touché. Les autres contrôles à 0, `npm audit` aux deux endroits. Chaque test du relecteur est d'abord vu rouge sur le code d'avant.

## Commits

| Commit | Contenu |
|---|---|
| C1 | Cet attendu |
| C2 | Le relecteur (RL9 à RL12) ; D71 complétée ; README, ARCHITECTURE, identifiants |
| C3 | Le relevé (RV11 à RV14) ; D71 complétée ; identifiants |

Un résumé du diff, écrit dans la boîte **avant** chaque commit. Pas d'arrêt 1 [Q]. **Arrêt 2** : les comptes, la branche locale, rien de poussé.

## Hors périmètre

Rejouer B-5 (en B-7, sans humain, sur le commit du lot) ; l'écart de B-6 ; le tableau des améliorations (carnet écrit d'un seul coup, retours du relecteur non mesurés, `MemberCard`, noms des pièces provisoires) [C, fichier 81].

## Écarts relevés en écrivant le code

- **« Qui nomment », pas « qui lancent ».** Un appel compté pour le carnet est un appel du shell dont la commande nomme `carnet.js` : dans B-4, l'un des trois en nomme le chemin sans le lancer. Le texte dit « appels du shell qui nomment carnet.js ».
- **`lignesJson`** n'est plus exportée : `heures` l'emploie maintenant dans `traces.js`, et knip refusait l'export resté sans usage.
- **Le relevé corrigé, rejoué sur B-4 à B-6** [F, 23/11/2026, sorties dans le scratchpad, `local/banc/` non touché, sortie 0 pour les trois] : les lignes du carnet, 7, 10 et 7, toutes datées pendant un appel qui nomme `carnet.js`, aucune « à la main » ; B-5, une panne vue par Claude Code (`ENOENT … rename … dernier.json.tmp`, 16:40:35.508), 0 attente de l'humain et 1 notification de tâche de fond ; aucune cible `qui`, `25`, `»` ou `/,$p` dans les trois `ecritures.md`.
