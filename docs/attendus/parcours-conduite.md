# Attendu : le parcours cible, lot 1. La conduite et le dialogue

Attendu écrit le 24/11/2026, avant le code, par Claude Code (boîte, fichier 99), en réponse à la demande (fichier 98), qui renvoie au fichier 96. Réponse de Claude (fichier 102), sources posées (fichiers 100 et 101) ; go de Quentin le 24/11/2026, qui confirme les trois avis du fichier 102 : le chiffre de la dette, les ouvertures « en attendant » avec la retouche de la 9, la main à l'outil dans `etat.js`. Les écarts du code sont à la fin.

Étiquettes : [F] lu ou mesuré, [H] hypothèse, [V] à vérifier, [Q] tranché par Quentin, [C] tranché par Claude, [P] proposé par Claude Code.

## Départ [F, lu le 24/11/2026, sans `git fetch`]

`main` = `c4b4265`, copie propre. `npm test` : 1 131, d'après le message de `fad5252`, non relancé. Branche à créer au go : `parcours-conduite`. Au go, cet attendu entre au dépôt sous `docs/attendus/parcours-conduite.md`, sans nom de site réel.

## Les sources [F]

- **La voix** : boîte, fichier 100 (`voix-ds-lab-v1.md`) : la charte, les trois exemples, les mots à éviter. Ses ouvertures sont dépassées là où la maquette « Parcours cible » en donne une autre.
- **Le dialogue** : boîte, fichier 101 (`dialogue-du-parcours-v1.md`), premier jet non relu par Quentin : les questions et leurs réponses. Ses ouvertures sont dépassées. Les deux premières questions de chaque moment sont gardées, les autres rangées en réserve, hors du format [C, fichier 102].
- **Les ouvertures** : la maquette « Parcours cible ds-lab », lue le 24/11/2026.

## Ce qui est livré

| # | Pièce | Ce que fait le lot |
|---|---|---|
| L1 | « Conduire » | Le texte du fichier 96, amendé (table plus bas). `SKILL.md` n'en garde qu'un renvoi, le texte va dans `conduire.md` (Q5 plus bas) |
| L2 | La voix | En tête de `conduire.md` : les six règles, les trois exemples, les mots à éviter, recopiés mot pour mot |
| L3 | Le dialogue | `docs/dialogue-du-parcours.md`, un format fixe, lu par `src/parcours/dialogue.js`. Un fichier mal formé est une panne qui nomme le moment, sortie 2 (D18). `parcours` écrit sous ses lignes un bloc « Pour le chat » : l'ouverture du moment, chiffres remplis, puis ses deux questions et leurs réponses |
| L4 | L'entrée sans projet | « Conduire » joue aussi quand l'humain donne une adresse ou plusieurs. Règle des pages : celle du fichier 98, recopiée telle quelle |
| L5 | Un état honnête | Une étape faite avec des choix ouverts s'écrit « faite, n choix reportés », dans l'état, le terminal et la page. Le Suivi redit les reports |
| L6 | Fichier presque bon, chemin entier | Quand `decisions.json` manque, `parcours` nomme le fichier voisin des sorties qui lui ressemble (espace autour du nom, autre casse, « (1) ») et dit quoi faire : « le renommer en decisions.json ». L'action donne le chemin absolu du dossier des sorties |
| L7 | Un seul compte | Une seule fonction compte les décisions. `reduce` écrit en plus une ligne « décisions à trancher : n, texte sur plein compris ». L'action et « tranchées sur » donnent ce même n. Sur Orbe Café : 15, 15 et 15 sur 15 |

### Le format du dialogue [P]

Un titre de niveau 2 par moment, dans l'ordre des 13 moments. Sous chaque titre, cinq champs :

- `Temps` ;
- `Joue` : oui ou non ;
- `Ouverture` ;
- `En attendant son écran` : facultatif ;
- deux questions, chacune avec sa réponse.

Un chiffre s'écrit `{nom}` et `parcours` le remplit depuis une sortie. Une variante au pluriel est permise pour un projet à plusieurs sites. Ni plus ni moins de deux questions par moment.

Une réponse qui dépend du cas (« Ton avis sur celle-ci ? ») ne peut pas être un texte fixe. Le fichier en donne la forme, d'après la voix : une phrase, sa raison, puis « C'est toi qui choisis. ».

### Amendements au texte du fichier 96, appliqués [Q et C, fichier 98]

- **Une décision se prend à un seul endroit.** Une décision visuelle se prend dans le panneau. Une décision sans image se prend en boutons dans le chat, avec la question à choix de l'app. Jamais les deux.
- **Le vocabulaire de l'outil.** La puce « un mot de l'outil s'explique » est retirée. L'IA ne dit ni réduction, ni proche, ni d'office, ni rattachement. Elle dit le tri, les fondations, la vérification.
- **Les chiffres.** Un chiffre par message au plus, tiré d'une sortie. Les autres sont à l'écran.
- **« Poser les feuilles ajoutées » s'enchaîne sans arrêt.** `etat.js` garde « la main est au développeur » pour cette étape : `conduire.md` dit que seule compte l'écriture hors des sorties [P, à trancher]. Autre voie : passer la main à l'outil dans `etat.js`. C'est une ligne, mais elle change PC et la page.
- **Les choix sans écran.** La puce « se propose dans le chat » ne garde que les pages. Les versions à garder et les blocs ne se proposent plus : ils sont reportés (L5). La liste des pages reste la seule liste permise au chat.
- **Les onglets.** « Ouvrir deux onglets dans le panneau » est gardé sous condition [V]. Je n'ai pas vérifié que l'app ouvre deux onglets d'aperçu. Repli : ouvrir l'écran par « Ouvrir seul », puis recharger le parcours.

## Réponses aux cinq questions

### Q1. 13 moments, 6 étapes : ce qui joue maintenant

**Un écart à signaler [F, `src/parcours/etat.js`] :** l'outil a **six** étapes, pas sept : Site, Constat, Marques, Décisions, Livraison, Suivi. « Versions à garder » n'est qu'un « pourquoi » de `conduire.md` : le choix vit dans le constat.

**La règle [P] :** un moment joue s'il dit vrai aujourd'hui. Il peut le faire avec son ouverture cible. Ou avec une ouverture « en attendant son écran » : écrite dans le fichier, à valider avec cet attendu, et remplacée par la cible au lot de l'écran. Un moment qui ne peut pas dire vrai attend.

`parcours` choisit le moment d'après l'état, jamais l'IA. Le moment est servi quand la sortie de son étape arrive : c'est la règle « le dernier résultat reste à l'écran » de D72. Un état peut servir deux moments, dans l'ordre.

| # | Moment | État qui le sert | Joue | Ouverture servie |
|---|---|---|---|---|
| 1 | Lancer | Avant tout projet | Oui | Cible, mot pour mot. Servie par `conduire.md`, puisqu'il n'y a pas encore de projet (ci-dessous) |
| 2 | Les pages | Avant tout projet ; ou un site sans pages | Oui, liste dans le chat | Le texte du fichier 98, sans « à droite ». Variante plurielle [P] : « J'ai regardé tes sites. Voilà, pour chacun, les pages qui me semblent les plus représentatives. Tu peux les changer si tu veux. » |
| 3 | La dette | Constat fait, marque pas encore saisie | Oui ; l'écran est `constat.html` | Cible, avec un chiffre à remplir (voir sous la table) |
| 4 | La marque, porte 1 | Même état, après la 3 | En attendant | Écran et relevé de la marque sur les pages : hors du lot. En attendant [P] : « Ta marque, je la prends dans ton fichier : je ne sais pas encore la relever sur tes pages. Je la pose sur les fondations, puis je te montre. » Puis la saisie s'enchaîne. Un refus se dit avec le motif de l'outil |
| 5 | Les fondations | Marque acceptée, pas encore de table | Oui ; l'écran est la planche des rôles | En attendant [P] : on retire « On regarde les composants », puisque le 6 attend. « Les fondations sont prêtes, à ta marque : les valeurs, les rôles, les règles. Elles ne sont pas encore sur ton site. On y compare tes pages. » |
| 6 | Les composants à ta marque | — | Non | — |
| 7 | Le tri | Table écrite, aucune décision tranchée | En attendant | La validation d'un geste n'existe pas : on retire la phrase des valeurs proches. [P] : « J'ai comparé tes pages aux fondations. La plupart des valeurs, je les ai rangées seul. Il reste {decisions} décisions où il faut ton œil. » |
| 8 | La revue, porte 2 | Décisions en attente (aussi juste après le 7) | Oui ; l'écran est `revue.html` | Cible, mot pour mot. « Une par une » : je ne sais pas si l'IA peut amener une carte à l'écran du panneau [V, session de jeu]. Sinon l'humain descend, l'IA répond |
| 9 | Avant, après, porte 3 | Livraison | En attendant | L'écran est hors du lot. [P] : « Je pose tes décisions à côté de l'ancien code, dans les sorties, puis je les vérifie sur chaque page. Rien n'est installé sur ton site. » L'ajout et la vérification s'enchaînent |
| 10 | La remise | — | Non | — |
| 11 | Les composants à garder | — | Non | Ses choix comptent dans les reports (L5) |
| 12 | Le bilan | Suivi | En attendant | La mesure après installation n'est pas branchée. [P], deux variantes selon les reports. Avec reports : « La livraison tient sur les pages qu'on a regardées, pas encore sur ton site. Il reste {reportes} choix mis de côté, on les reprend quand tu veux. Le reste revient au développeur, et je refais le tour après chaque changement. » Sans report : la phrase du milieu devient « Rien n'est mis de côté : de mon côté, c'est terminé. » |
| 13 | Remplacer et tenir | — | Non | — |

Six moments jouent avec leur ouverture cible ou presque : 1, 2, 3, 5, 8 et, en partie, 7. Trois jouent en attendant leur écran : 4, 9 et 12. Quatre attendent : 6, 10, 11 et 13.

**Le chiffre de la dette (moment 3), tranché [Q, go] :** La cible dit « 37 couleurs ». Or le parcours ne lance pas l'audit (la mesure branchée est hors du lot). Le seul chiffre de mesure disponible à ce moment est celui du constat. Retenu : « Il y a du monde : {versions} versions de composants. » Sur Orbe Café, cela fait 11. Les couleurs reviendront avec la mesure branchée.

**Lancer et Les pages, avant le projet.** `parcours` ne tourne pas sans projet. `npm run skill` recopie donc ces deux ouvertures depuis le fichier du dialogue dans `conduire.md`, entre deux marques. C'est le même mécanisme que le bloc du compte de `SKILL.md`. Le mot à mot tient, et SK1 le garde.

**Quand « Conduire » joue [P].** Il joue si l'humain donne une adresse ou plusieurs, un fichier de projet, ou appelle `/ds-lab` sans autre demande. La description du skill ne change pas (D72).

**Ce que l'IA écrit dans le projet (L4) [P].** Elle écrit ce qu'elle a vu et ce qui a été accepté :

- `product` : le nom lu sur le site, dit dans la même phrase que la liste ;
- `sites` : `id`, `url`, `pages` ;
- `outputs` : `"sorties"` ;
- `brand` : seulement si `marques/<id>/entree.json` existe à côté ;
- `target` : seulement si une cible existe à côté.

Une clé absente se lit dans l'action de `parcours`, comme aujourd'hui.

### Q2. Comment l'IA regarde le site [P]

1. **D'abord le navigateur dont l'IA dispose** : le navigateur de l'app, ou Chrome piloté. Il rend le script, et une app Vuetify n'a rien à lire sans script. L'IA ouvre l'adresse, suit la navigation et le pied de page, et regarde les pages. Elle retient, par modèle de page, celle qui porte le plus de composants.
2. **À défaut, le HTML de la page** (`curl`). Limite dite simplement : une page rendue par le script ne se lit pas ainsi. Si le HTML est vide, l'IA dit « Ça, je ne sais pas le voir » et demande les pages.
3. **Pas de Chromium du clone, pas de script d'exploration** [Q, fichier 98].

**Si le site ne répond pas** (connexion refusée, statut d'erreur, page de connexion), l'IA le dit en une phrase : l'adresse et ce qu'elle a reçu. Elle demande une autre adresse, ou les pages, et n'écrit pas le projet. Pour les sites fictifs, sur 127.0.0.1, le site est lancé par le `CLAUDE.md` du dossier de jeu, comme pour J-1.

[V] Je n'ai pas vérifié que l'IA de l'app de bureau peut lire une page dans son navigateur. D72 établit seulement que le panneau affiche une page servie sur 127.0.0.1. C'est à éprouver à la session de jeu. Je ne fais pas d'essai avant le go.

[F, `fixtures/parcours/plusieurs/`] Sur le projet à trois sites, Orbe Café, Écume et Brume partagent la même origine, sur des chemins et des modèles différents. Le cas « mêmes modèles, mêmes pages » n'y est donc pas joué.

### Q3. Ce qu'un test tient

| Contrôle [P] | Où |
|---|---|
| Mots à éviter refusés : « Super », « Bravo », « Parfait », « ! », les émojis, « n'hésite pas à », « vous », et les mots de l'outil (réduction, proche, d'office, rattachement). Lus dans `conduire.md`, la section « Conduire » de `SKILL.md`, le fichier du dialogue et le bloc « Pour le chat » de `parcours` | SK8 étendu |
| Ni liste ni tableau dans un texte du dialogue. Trois phrases au plus par message. Un chiffre au plus, champ `{…}` compris | Test du dialogue |
| 13 moments, dans l'ordre. Une ouverture et exactement deux questions par moment, chacune avec sa réponse. Chaque `{champ}` est un champ que `parcours` sait remplir | Test du dialogue |
| Pour chaque état des fixtures, `parcours` sert les moments de la table de Q1, ouverture mot pour mot | Test du parcours |
| Les deux ouvertures recopiées dans `conduire.md` égalent celles du fichier | SK1 |
| L5 : la fixture `constat` (versions 0 sur 3) donne « faite, 3 choix reportés » | Test du parcours |
| L6 : une fixture avec `decisions.json ` (espace finale) fait nommer le voisin ; l'action donne un chemin absolu | Test du parcours |
| L7 : les deux tables de J-1, de 15 h 19 et 15 h 27, extraites en fixture, donnent 15, 15 et 15 sur 15. Données fictives d'Orbe Café | Test du parcours |

**Ne se teste pas :**

- ce que l'IA improvise : son ton, ses chiffres hors du fichier, l'absence de « oui » demandé, l'accompagnement aux décisions ;
- le fait qu'elle dise vraiment l'ouverture servie.

C'est jugé à la session de jeu, sur les cinq critères du fichier 98.

[V] Les numéros des nouveaux tests sont à prendre dans `docs/identifiants.md` au go. Chaque nouveau fichier de test entre dans une part de `test/parts-de-la-ci.json`.

### Q4. D'où vient l'écart 37 et 31 [F]

Ce n'est pas un bogue, ce sont deux comptes. **37 = les couleurs rendues distinctes, toutes. 31 = les couleurs d'interface seulement.** Les 6 autres sont des couleurs de contenu : un SVG qui ne suit pas la couleur du texte, ou le fond d'une boîte d'image.

- La réduction retire les occurrences de contenu (`src/reduce/propose.js`, `count - content`).
- L'audit écrit les deux comptes (`src/rendered/aggregate.js`, `distinctInterface`). Son rapport sur les trois mêmes pages d'Orbe Café, le 16/11/2026 (`local/revue-lot-4/audit-apres/`), dit : « Rendu : 37 distinctes » et « Rendu, interface seulement : 31 couleurs […] Couleurs de contenu : 6 ».
- La réduction du 24/11, à 15 h 19, part de 31 (`summary.colors.before`).

**Correction :** rien dans le dépôt. Le 37 ne vit que dans l'écran de la dette de l'artefact : il doit y dire 31 couleurs d'interface, et les 6 de contenu à part. [V] L'audit n'a pas été relancé à `c4b4265`.

**Le « 13 sur 13 », trouvé en passant [F]** (`calculerEtat` relu sur le projet J-1, en lecture seule) :

- Avant les décisions : 14 lignes « décision » hors carte, plus 1 carte de plein, font 15.
- Après les décisions : la carte du plein absorbe 2 de ces lignes (1 ligne, puis 3). `etat.js` ne compte plus que 12 lignes hors carte, plus 1 carte : 13.
- `reduce` écrit 14, car il ne compte pas la carte.

L7 garde donc une ligne tranchée même si une carte l'absorbe ensuite. [V] Au go : comment compter une ligne absorbée qui n'a pas de décision propre.

### Q5. Node, et la place du texte

**Node [P].** Dans « Avant de commencer » de `SKILL.md`, car la règle vaut hors de « Conduire » aussi :

> Sous une autre version, chercher un Node 24 déjà installé (`fnm`, `nvm`) et lancer chaque commande avec lui, en le disant une fois ; sans Node 24, s'arrêter, le dire, et demander à l'humain de l'installer.

L'IA n'installe rien.

**La longueur.** `SKILL.md` compte 487 mots sur 500 (SK4, mesure de DOC5 [F, mesuré]). Le texte du fichier 96 en fait à peu près 600. La section « Conduire » de `SKILL.md` devient donc un renvoi d'environ 40 mots :

- quand elle joue ;
- « lire `conduire.md` en entier avant le premier message, et le suivre » ;
- la commande `parcours`.

La ligne Node prend la place gagnée. `conduire.md` porte, dans l'ordre :

1. la voix (L2) ;
2. les deux ouvertures recopiées ;
3. le texte du fichier 96, amendé ;
4. les « pourquoi » actuels.

SK8 change sa première phrase attendue : « une adresse, ou un fichier de projet ».

## Ce que L5 compte comme reporté [P]

- **Les versions à garder** : y − x de `versionsAGarder`.
- **Les blocs non identifiés sans sort**, si le constat donne leur nombre de blocs [V]. Il donne aujourd'hui `nonIdentifies` en éléments (39 sur Orbe Café), pas en blocs.

Les valeurs proches ne comptent pas : aujourd'hui elles s'appliquent sans choix.

## Fin du lot

README (le parcours : entrée par adresse, bloc « Pour le chat »), ARCHITECTURE (`src/parcours/dialogue.js`, `docs/dialogue-du-parcours.md`), une décision D73 avec sa limite (les moments qui attendent leur écran, les ouvertures « en attendant »), `npm run skill`, `npm audit` aux deux endroits. Aucune dépendance ajoutée. Les contrôles du CLAUDE.md à 0 échec. Pas de build de l'atelier : rien n'y est touché.

## Arrêts

1. **Cet attendu.** Tranché par le go : le chiffre de la dette, les ouvertures « en attendant » (la 9 sans « dans les sorties »), « Poser les feuilles ajoutées » dans `etat.js`, la main à l'outil.
2. **La session de jeu**, sur la branche, avant toute fusion. D'abord Orbe Café à un site, puis les trois sites pour L4, dans un dossier de jeu préparé comme J-1. Elle juge les cinq critères du fichier 98, et les deux [V] de Q1 et de Q2 (le navigateur, la carte amenée à l'écran).

## Hors du lot

Ceux du fichier 98, tels quels.

## Écarts du code [F, 24/11/2026]

- **Les questions** : les deux premières de chaque moment, sauf là où elles ne disent pas vrai aujourd'hui ou cassent la voix (la règle « un moment joue s'il dit vrai aujourd'hui ») : à La dette, « Pourquoi deux chiffres, écrit et affiché ? » attend l'écran de la dette (servies : la deuxième et la troisième) ; à La marque, « Pourquoi douze pas ? » porte plus d'un chiffre (servie : la troisième) ; au Bilan, « Pourquoi remesurer ? » est faux tant que la mesure n'est pas branchée (servies : la deuxième et la troisième). La réponse à « C'est quoi, Diapason ? » est celle de la maquette. Le bloc « Les composants » du premier jet a trois questions pour trois moments qui attendent : l'enveloppe et le framework aux composants à ta marque ; l'enveloppe et le contrôle aux composants à garder ; le contrôle et le framework à « Remplacer et tenir ». La remise a son propre bloc. Les autres questions sont en réserve, en fin de fichier, chacune avec sa raison.
- **Les variantes à plusieurs sites**, écrites par Claude Code là où le texte au singulier serait faux (« ta marque », « ton site ») : La dette et son bouton, La marque, Les fondations, Le tri, Avant et après, Le bilan. La réduction ne portant que sur le premier site (D72), Les fondations, Le tri et Avant et après le disent : « les pages de ton premier site ».
- **Deux boutons** : « On passe à la marque » (La dette), repris de la maquette ; « On garde ces pages » (Les pages), ajouté pour laisser la sélection d'un geste.
- **Les fondations** jouent « en attendant », avec le texte sans les composants.
- **La voix, ce qu'un test lit** : chaque texte qu'un moment peut servir, chaque question et chaque réponse, et le bloc du terminal (PC11). `conduire.md` n'est pas lu en entier : sa charte cite les mots à éviter.
- **Quand « Conduire » joue** : « appelle le skill sans autre demande », pour ne pas lier le texte à une commande.
- **La page du bilan** n'ajoute pas de ligne pour les reports : son moment dépasserait 60 mots (PC5). Les reports s'y lisent dans « Tout le parcours » (« faite, 3 choix reportés »), et le chat les dit au bilan.
- **Le fichier voisin** : espaces autour du nom et « (1) ». Une autre casse ne se voit pas sur un disque qui ignore la casse, où le fichier attendu existe déjà.
- **Le compte des décisions** : une ligne rattachée à une carte sans décision propre n'est pas comptée, la carte la tranche (le [V] de Q4). Les fixtures `livraison` et `bilan` portent déjà le cas d'Orbe Café : aucune fixture ajoutée.
- **Aucun fichier de test ajouté** : PC10 à PC16 dans `test/parcours.test.js`, SK9 dans `test/skill.test.js`.
