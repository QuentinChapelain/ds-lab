# Le parcours, en POC : projet, commande `parcours`, page du parcours, section « Conduire » du skill

Attendu écrit le 24/11/2026, avant le code, d'après la demande du même jour (boîte, fichier 86), ses trois compléments (87 : tokens seulement ; 88 : les mots ; 89 : un seul site) la réponse à l'arrêt 1 (fichier 90), qui change le rôle de la page et fait un constat par site, et la réponse à la version 2 (fichier 91) : quatre temps, une idée par moment, le dernier résultat gardé à l'écran. Étiquettes : [F] lu ou mesuré, [H] hypothèse, [V] à vérifier, [Q] tranché par Quentin, [C] tranché par Claude, [P] proposé par Claude Code. Version 3 ; go de Quentin le 24/11/2026, sans nouvel arrêt sur l'attendu.

## Départ [F, lu le 24/11/2026, sans `git fetch`]

`main` = `9c1e359`, copie propre, cet attendu seul non suivi. Branche à créer au go : `parcours`. `npm test` : 1 119.

## Le besoin [Q, fichiers 86 et 90]

**Le chat conduit, le panneau montre.** À gauche, on agit : on dit, l'IA lance, explique, répond aux « pourquoi ». À droite, on regarde : où on en est, ce que l'outil a fait, la preuve. Le panneau se regarde, il ne se lit pas ; il doit aussi rassurer et convaincre, car lancé seul, le skill est une boîte noire. La page est servie sur `127.0.0.1` : le panneau d'aperçu refuse `file://` (essai du 24/11). Une tranche mince, jouée de bout en bout, sur du fictif.

## Les mots [Q, 24/11, en réponse à l'arrêt 1]

| Mot | Ce que c'est | Combien |
|---|---|---|
| Produit | Ce qu'on migre : le même code, les mêmes modèles de page | 1 par projet |
| Site | Une adresse où le produit tourne | 1 ou plusieurs |
| Marque | L'identité posée sur un site : couleur, accent, police des titres | 1 par site |

Les textes du parcours (page, sortie de la commande, section du skill) disent ces trois mots, jamais « client », « plateforme », ni « le site » pour le produit. Ils s'accordent au nombre de sites : un projet à un site ne montre aucune trace du pluriel (pas de « (s) », pas de « 1 sites »).

Contradictions avec les textes existants, non reprises dans ce lot [F, lus le 24/11] : le README dit « le site audité », « lire la marque d'un site » (cohérent : un site est une adresse) ; « client » reste dans `docs/regles.md` (DS17, DF4 : « la police du client ») et dans le README (« une marque par client »). À reprendre au lot d'alignement des écrans.

## P1. Le projet [C, fichier 90 : accepté]

Un dossier, un fichier `projet.json`, écrit par l'IA ou à la main. Clés en anglais, comme `entree.json` (D62) ; chemins relatifs au fichier.

```json
{
  "product": "Annuaire des cafés",
  "sites": [
    { "id": "orbe", "url": "http://127.0.0.1:4173", "pages": ["/annuaire/", "/annuaire/page-2.html"], "brand": "marques/orbe/entree.json" }
  ],
  "target": "cible.json",
  "signatures": "config/signatures/vuetify.json",
  "outputs": "sorties"
}
```

| Clé | Ce qu'elle dit | Obligatoire |
|---|---|---|
| `product` | Le nom du produit, titre de la page | Oui |
| `sites[]` | `id` (minuscules, chiffres, tirets ; unique), `url` (http ou https), `pages` (un échantillon : une page par modèle ; au moins une pour que l'étape Site soit faite), `brand` (l'`entree.json` de la marque ; ses jetons et ses planches sont dans son dossier) | Au moins un site, `id` et `url` |
| `target` | La cible de `reduce` (`--target`) | Non : sans elle, Décisions dit « Pas de cible : écrire `target` dans projet.json » |
| `signatures` | Table de signatures du constat (`--signatures`) | Non |
| `outputs` | La racine des sorties ; chaque commande y a un sous-dossier fixe | Oui |

Disposition fixe sous `outputs` : la commande ne cherche rien ailleurs, et la commande suivante qu'elle propose y écrit. Chaque commande range déjà ses sorties sous `<racine>/<hôte>/<horodatage>/` (`freeOutputDir`, `src/report/json.js`) [F] : la racine passée par `--out` suffit, aucune commande ne change, sauf la saisie.

| Sous-dossier | Écrit par | Lu par l'état |
|---|---|---|
| `composants/<id>/<hôte>/<horodatage>/` | `npm run composants -- <url> <pages…> --out <outputs>/composants/<id>` ; refait sans navigateur par `--releve` | `constat.json` ; écran `constat.html` |
| `decisions-composants.json` | Les versions à garder, écrites par l'IA sous la dictée du designer, ou à la main (format existant, `fixtures/marque-demo/decisions-composants.json`) | Passé au constat par `--decisions` |
| `saisies/<id>.json` | `npm run saisie -- <entrée> --verdict <fichier>` (nouveau, ci-dessous) | Le verdict de la marque du site |
| `reductions/<hôte>/<horodatage>/` | `npm run reduce -- … --out <outputs>/reductions --references <outputs>/references` | `table.json`, `modifications.json` ; écran `revue.html` |
| `decisions.json` | Exporté depuis la revue par le designer | Les décisions de la table |
| `ajout/` | `npm run ajout -- --sortie <outputs>/ajout` | `feuilles-ajoutees.json` |
| `verify/<hôte>/<horodatage>/` | `npm run verify -- … --ajout <outputs>/ajout --out <outputs>/verify` | `verdict.json` |

« Le plus récent » est le dossier d'horodatage le plus grand dans l'ordre du texte (`2026-11-24T1430`, puis `-2`), jamais la date d'un fichier : même projet, même état [C].

**Un constat par site** [Q, fichier 90]. Décisions, Livraison et la preuve se font une fois, sur le premier site de la liste. **Limite**, à écrire dans la décision : l'outil réduit une origine à la fois (`reduce`, `ajout` et `verify` prennent une adresse et ses chemins) ; les autres sites reçoivent la même table, sans preuve sur leurs pages. Aucune comparaison automatique des constats dans ce lot.

**Où vit un projet** [C] : la commande ne suppose rien d'autre que le chemin qu'on lui passe. Fictifs : `fixtures/parcours/`. Réel : sous `local/`, jamais commité.

### La saisie écrit son verdict, si on le lui demande [C, fichier 90 : accepté]

Une marque refusée n'écrit rien (D31) : rien sur le disque ne dit qu'elle est refusée, ni pourquoi. `npm run saisie -- <entrée> --verdict <fichier>` écrit en plus, acceptée **ou** refusée, `{ "name", "verdict": "acceptée" | "refusée", "motifs": [...], "entree": "<sha256 de l'entrée>" }`, sans date (sortie déterministe). Sans l'option, rien ne change : même sortie, mêmes fichiers, D31 tient. L'empreinte dit si l'entrée a changé depuis.

## P2. L'état, calculé

Pour chaque étape, dans l'ordre, son propre état d'après ses sorties ; l'étape **en cours** est la première qui n'est pas faite ; les suivantes sont **à venir** et disent ce qui les ouvre. Une étape faite reste faite même si une étape d'avant ne l'est plus. Qui agit [P] : designer, développeur, l'outil ; « la main est à » nomme qui doit agir maintenant (l'outil quand l'action suivante est une commande que le chat peut lancer).

| # | Étape | Faite quand | En cours : la main, l'action, la commande suivante | Fait chiffré | Écran |
|---|---|---|---|---|---|
| 1 | Site / Sites | Chaque site a une `url` et au moins une page | Designer : « choisir une page par modèle dans chaque site » ; l'IA l'écrit dans `projet.json` | Un site : « 4 pages ». Plusieurs : « 3 sites, 4 pages chacun » ; nombres différents : « 3 sites : 4, 4 et 2 pages » [P] | Aucun |
| 2 | Constat | Chaque site a son `constat.json` [C, fichier 91] | Un site sans constat : l'outil, `npm run composants -- <url> <pages…> --out <outputs>/composants/<id> --nom "<produit>"` (et `--signatures`, `--decisions <outputs>/decisions-composants.json` s'ils existent) | Un site : « 27 éléments, 7 types, 12 versions ». Plusieurs : une ligne par site. Dans « Tout le parcours » seulement, sans bloquer : « versions choisies : 0 sur 7 » (`scores.versionsAGarder`) | `constat.html` |
| 3 | Marques | Chaque site a un verdict « acceptée » dont l'empreinte est celle de son entrée | Une marque sans verdict, ou à l'entrée changée : l'outil, `npm run saisie -- <entrée> --verdict <outputs>/saisies/<id>.json`, puis `node src/cli/planche.js --marque <dossier>`. Une marque refusée : le designer, « corriger l'entrée de <marque> : <premier motif> » | Un site : « acceptée » ou « refusée : <motif> ». Plusieurs : une ligne par site | Les planches (`roles.html`, `typo.html`, `espacements.html`) d'une marque acceptée, s'il en existe |
| 4 | Décisions | Le dernier `table.json` n'a plus de décision en attente, `modifications.json` est à côté, et les décisions de la table sont celles de `decisions.json` | Pas de table : l'outil, `npm run reduce -- <url> <pages…> --target <target> --tokens <resolver de la marque du premier site> --references <outputs>/references --out <outputs>/reductions`. Décisions en attente : le designer, « trancher dans la revue et exporter decisions.json dans <outputs>/ ». Plus rien en attente mais la table ne les a pas lues : l'outil, la même commande avec `--decisions <outputs>/decisions.json` | « 12 décisions tranchées sur 14 » : en attente = ligne de classe `décision` sans décision (`decisionFor`, `src/reduce/propose.js`) et carte de plein sans choix, lues avec `decisions.json` s'il existe, sinon avec les décisions de la table | `revue.html` |
| 5 | Livraison | Le dernier `verdict.json` sort en 0 | Pas de `feuilles-ajoutees.json` : le développeur, `npm run ajout -- --modifications <…>/modifications.json --sortie <outputs>/ajout`. Pas de verdict : l'outil, `npm run verify -- <url> <pages…> --reference <outputs>/references --ajout <outputs>/ajout --out <outputs>/verify`. Verdict en 1 : le développeur, « lire pertes.md : n lignes non arrivées » | « 31 lignes arrivées sur 36, 2 pages » | Aucun |
| 6 | Suivi | Jamais : le suivi dure [C] | Ouvert quand Livraison est faite : l'outil, la commande de verify, relancée | « Dernier contrôle : <horodatage>, 36 lignes arrivées sur 36 » | Aucun : le suivi demande une CI, que le produit n'a pas encore |

Le choix des versions à garder n'est pas une porte [C, fichier 91] : c'est un travail long, qui bloquerait le chemin dès le premier temps. Il reste proposé, sans bloquer : sa ligne dans « Tout le parcours », son « pourquoi » dans « Conduire » ; `decisions-composants.json` est lu s'il existe.

### Quatre temps [Q, fichier 91]

Le calcul garde six étapes ; l'affichage les range en quatre temps, ceux de la présentation de Quentin du 21/11 (« un geste, quatre temps, trois portes »). Un temps est fait quand toutes ses étapes le sont, en cours quand l'une l'est, à venir sinon.

| Temps | Étapes | Porte : là où l'humain décide, sur un écran |
|---|---|---|
| Mesurer | Site ou Sites, Constat | Aucune |
| Décider | Marques, Décisions | La marque ; la revue |
| Poser | Livraison | Aucune pour le designer |
| Tenir | Suivi | La planche et la CI : sans écran aujourd'hui, dit tel quel |

**Limites** [P], à écrire dans la décision : un verdict plus ancien que les feuilles qu'il juge n'est pas repéré (rien ne les relie) ; une réduction refaite sur une autre cible n'est pas distinguée de la précédente.

## P3. La commande `parcours` [Q]

`npm run parcours -- <projet.json> [--servir] [--port <n>]`.

- Lit le projet, calcule l'état, écrit `parcours.html` à côté de `projet.json`, et dans le terminal, au plus six lignes :

```
Annuaire des cafés · 3 sites, 3 marques
En cours : Décider · Marques
La main est au designer.
À faire : corriger l'entrée de Brume : <premier motif>, puis la saisir à nouveau.
Commande suivante : npm run saisie -- marques/brume/entree.json --verdict sorties/saisies/brume.json
Page : http://127.0.0.1:4311/ avec --servir ; écrite : <chemin>/parcours.html
```

- `--servir` sert sur `127.0.0.1` seulement (`node:http`, port 4311 par défaut [P]) : `/` recalcule l'état et réécrit la page à chaque demande (un rechargement suffit après une commande) ; les écrans sont servis sous des chemins fixes, `/composants/<id>/…`, `/reductions/…`, `/marques/<id>/…` (le dossier de l'entrée de chaque site), rien d'autre ; un chemin qui sort d'une racine est un 404. Tous de la même origine, ce qui permet de les embarquer. Il tourne jusqu'à Ctrl-C.
- Sortie 0 ; 2 sur un projet illisible (fichier absent, JSON illisible, clé obligatoire absente ou mal formée, `id` en double, port pris), avec un message d'une ligne qui nomme la cause (D18). Une sortie absente n'est pas une panne : c'est un état. Une sortie illisible (JSON cassé) est une panne qui la nomme.
- Aucune dépendance ajoutée. `src/parcours/` (état, rendu, serveur), `src/cli/parcours.js` ; rien hors de `src/cli/` n'importe de `src/cli/`.

## P4. La page du parcours [Q, fichier 90, déroulé validé sur maquette à 13 h 07]

Un fichier HTML autonome, sans script, clair et sombre (`prefers-color-scheme`), lisible à 640 px sans défilement horizontal. Titre : le nom du produit ; dessous, à plusieurs sites seulement, « 3 sites, 3 marques ». Puis trois parties :

| Partie | Contenu |
|---|---|
| A. La barre | Une ligne : quatre segments, Mesurer, Décider, Poser, Tenir, l'état de chacun par sa couleur et par son texte de remplacement. Rien d'autre [Q, fichier 91] |
| B. Le moment en cours, et lui seul | Un des moments ci-dessous |
| C. Le reste, replié | Un seul `<details>` fermé, « Tout le parcours » : les six étapes rangées sous leurs quatre temps, leur état, qui agit, leur fait chiffré, leur écran (lien), ce qui ouvre une étape à venir |

La ligne d'action dit le temps, puis l'étape : « Décider · Marques », qui a la main, quoi faire. Plus de « n sur 6 ».

**Chaque moment porte une phrase, une seule**, qui dit ce qu'il faut comprendre, au-dessus de son écran ; elle compte dans les 60 mots. Les phrases sont celles de la présentation de Quentin, telles quelles [Q, fichier 91] :

| Moment | La phrase |
|---|---|
| Lancement | « Un geste, quatre temps, trois portes. » |
| Constat | « On mesure ce qui s'affiche vraiment, pas ce que le code contient. » |
| Marque | « Une couleur de marque devient douze pas. Le pas 9 est la couleur exacte. » |
| Marque refusée | « Une marque illisible n'entre pas, et le message dit pourquoi. » |
| Revue | « On choisit une relation, pas une valeur. » |
| Bilan | « La couche visuelle tient ses seuils. Voici ce qui reste à faire vérifier par un humain. » |

**Le dernier résultat reste à l'écran jusqu'à ce que l'étape suivante ait produit une sortie** [C, fichier 91] :

| Cas | Partie B |
|---|---|
| L'étape en cours a déjà une sortie et un écran | Son écran |
| L'étape en cours n'a encore rien produit, et l'étape d'avant a un écran | L'écran de l'étape d'avant, avec une ligne : « Fait : Constat. Ensuite : Marques, <l'action>. » |
| Ni l'un ni l'autre | Étape sans écran |

| Moment | Quand | Partie B |
|---|---|---|
| Lancement | Aucune sortie sous `outputs` | La phrase, puis les quatre noms des temps. Trois garanties, chacune vérifiable dans le dépôt : le site n'est jamais modifié (README, `reduce` et `ajout` ; D37, D38) ; on décide sur image (la revue) ; chaque changement est prouvé (`verify --ajout`, une ligne décidée jugée arrivée ou non, D39). Une phrase : « On prend un échantillon de pages dans chaque site, une par modèle de page. » La ligne d'action |
| Étape avec écran | D'après la règle ci-dessus : le constat, une marque, la revue | La phrase du moment, la ligne d'action (avec « Fait : … Ensuite : … » quand l'écran est celui de l'étape d'avant), un lien « Ouvrir seul », puis **l'écran lui-même**, embarqué (`<iframe>`, même origine, titre accessible). Constat : celui du premier site, son nom au-dessus. Marques : à plusieurs sites, une ligne par site ; l'écran est la planche des rôles de la première marque acceptée, la phrase « Marque » ; une marque refusée sans planche à montrer donne la phrase « Marque refusée » et son motif, sans écran. Décisions : `revue.html` |
| Étape sans écran | Site, Livraison ; ou une étape avec écran qui n'a encore rien à montrer, l'étape d'avant non plus | La ligne d'action et le fait chiffré |
| Bilan | Le Suivi en cours | La phrase du bilan **seulement si chaque marque est acceptée et le dernier verdict en 0** ; sinon, ce qui manque. Trois chiffres « avant → après », lus tels quels dans `table.json` (`families.<famille>.summary.before` et `.after`) [F, champs présents dans une table du 14/11] : couleurs, espacements, tailles de texte distinctes (« 31 → 16 couleurs »). Puis le dernier contrôle, lu dans `verdict.json`. Aucun chiffre calculé pour l'effet [Q] |

Règles :

- Hors de l'écran embarqué, la partie B tient en **60 mots visibles au plus** [Q : « une soixantaine »] ; au-delà, c'est du texte pour le chat. Un test compte les mots de B dans chaque projet de test.
- **Jamais « conforme »** dit d'un site ou d'un produit, ni « site conforme », dans la page, le terminal et le skill [Q, fichier 91] : le mot vaut pour une paire et son seuil. Un test le refuse dans tout texte écrit par `parcours` et dans la section « Conduire ».
- La page ne porte aucune autre explication : les « pourquoi » sont dans la section « Conduire » (P5).
- Mise en page de l'écran embarqué, sans nombre : `html` et `body` à 100 % de hauteur, colonne en `display: flex`, `<iframe>` en `flex: auto`, largeur 100 %, `border: 0`. Il prend la hauteur qui reste sous la barre et la ligne d'action ; « Tout le parcours » ouvert, la page défile.
- **Ce qui peut gêner l'embarquement** [V, à l'arrêt 2] : la revue exporte `decisions.json` par un téléchargement lancé en script (`a.download`, `src/report/review.js`) ; dans un cadre, lui-même dans le panneau d'aperçu, le téléchargement peut être bloqué. Le lien « Ouvrir seul » est la parade, toujours présent. Le constat et les planches n'ont pas de script ; la page du parcours non plus (les scripts d'un écran embarqué sont les siens).

### Les valeurs de la page viennent des tokens (fichier 87, tient sans changement)

| # | Règle | Comment [C, fichier 90 : accepté] |
|---|---|---|
| T1 | Aucune valeur visuelle en dur | La page écrit un bloc `:root` généré depuis les couches communes (`primitives`, `statuts`, `police`, `semantique`, et `mode.sombre` dans le bloc sombre ; l'étroit de `largeur.etroit` sous 600 px), une variable par rôle, nommée comme dans `jetons.css` (`--background-app`, `--gap-section`, `--typography-body-medium-font-size`). Hors de ce bloc, chaque valeur est un `var(--…)`, un mot-clé, 0 ou 100 %, sans calcul, comme un module (CP10, D61). Aucun attribut `style` |
| T2 | Un test le tient | Il relit la page écrite : hors des blocs générés, chaque valeur passe la règle de L2 (`test/modules.test.js`) ; chaque variable employée est déclarée ; chaque variable déclarée vaut le jeton relu dans `tokens/commun/`, dans les deux modes. Vu rouge sur une page où l'on écrit `12px` |
| T3 | Mêmes sources que le constat | Rôles neutres communs, sans marque (D26) |
| T4 | La maquette n'est pas une source | Aucune de ses valeurs reprise |

Rôles employés [F, résolus le 24/11 sans aucune marque, comme le constat] : fonds `background.app`, `background.surface`, `background.subtle`, `background.inverse`, `background.info.subtle` ; textes `text.default`, `text.secondary`, `text.info`, `text.on-inverse` ; espaces `gap.within-component`, `gap.between-blocks`, `gap.between-components`, `gap.between-groups`, `gap.section`, `padding.component` ; `width.column` (640 px) pour la colonne ; `border-radius.surface` ; styles `heading.1`, `heading.3`, `body.medium`, `body.small`, `label`.

Ce qui n'a pas de rôle, pris au plus proche pour ce lot, sans rôle créé [C, fichier 90] ; les deux manques entrent dans `docs/feuille-de-route.md` (une épaisseur de bordure ; des rôles d'avancement : fait, en cours, à venir), et Quentin peut y revenir à l'arrêt 2, sur pièce :

| Besoin | Rôle le plus proche, pris tel quel | Pourquoi |
|---|---|---|
| Segment « faite » | `background.inverse` + `text.on-inverse` | Paire existante (`paires.json`), contrôlée dans les deux modes |
| Segment « en cours » | `background.info.subtle` + `text.info` | Paire existante ; ce fond ne tient pas 3:1 sur la page [H] : l'état est aussi dit par le texte de remplacement et dans « Tout le parcours » |
| Segment « à venir » | `background.subtle` + `text.secondary` | Paire existante |
| Lien | `text.info` | `text.interactive` pointe sur la marque : la page n'en a pas (le constat fait de même, D47) |
| Anneau de focus | Celui du navigateur, aucun style | `border.focus` pointe sur la marque |
| Épaisseur de bordure | Aucune bordure : surfaces séparées par leur fond ; `border: 0` sur le cadre | Seule la primitive `stroke.1` existe, sans rôle |
| Police des titres | `font.product` à la place de `brand.font.heading` | La page n'a pas de marque ; `brand.font.body` vaut déjà `font.product` dans les couches communes |
| Quatre segments égaux | `display: table`, `table-layout: fixed`, largeur 100 % | Mots-clés seulement ; une grille demanderait des nombres |

Le design system embarqué (Diapason) et l'alignement du constat, des planches et de la revue sur les mêmes rôles : lot suivant, inscrit dans `KNOWN_ISSUES.md` en sortant, avec son moment [Q, fichier 87].

## P5. Le skill, section « Conduire » [C, fichier 90 : dans ce lot]

Dans `skill/ds-lab/SKILL.md`, écrite à la main. Sa **première ligne** : elle ne joue que si l'humain donne un fichier de projet. Puis, au début d'une session : lancer `parcours` ; donner l'adresse de la page (la servir avec `--servir` en tâche de fond si elle ne l'est pas) ou l'ouvrir dans le panneau ; dire l'étape en une phrase ; proposer l'action suivante ; lancer la commande suivante que donne l'outil, et seulement elle ; résumer sa sortie en trois lignes ; relancer `parcours`. L'IA ne décide pas l'ordre : elle suit ce que répond la commande. On décide sur les écrans ; le chat lance, explique et résume. Puis, pour chaque étape, ce que l'IA répond à « pourquoi », trois phrases au plus, et le « pourquoi » du choix des versions à garder, qui ne bloque pas. La `description` de l'en-tête ne change pas. Puis `npm run skill`.

**Écart restant avec le banc**, sans passage rejoué [C, fichier 90] : un passage du banc n'a pas de projet, donc la section ne joue pas. Mais elle est dans le texte que l'agent lit : un passage posé après ce lot reçoit un skill plus long que B-4 à B-6 (les deux bras le même, D71). Les passages déjà posés gardent le skill de leur copie figée de ds-lab (`src/banc/banc.js:86`), et `verifier --skill` compare à cette même copie : ils ne changent pas. Dans un autre dépôt, toute copie du skill devient différente du clone : `verifier --skill` y échoue jusqu'à la recopie, comme prévu (section « Dans la CI » du skill).

## Points tranchés à l'arrêt 1

| Point | Réponse |
|---|---|
| Nom de la commande | `parcours` [Q] |
| Les trois mots | Produit, site, marque, sans « client » [Q] |
| La garde `test/histoire.test.js` | Ne change pas [C]. La page et le terminal écrivent « Décider · Marques » ; aucun « étape » suivi d'un nombre, et le mot « lot » n'est écrit nulle part [F, motifs lus : `/[ÉéEe]tapes? \d/`, `/\b(?:du|au|le|ce|des|dernier) lot\b/`]. Fichier de test : `test/parcours.test.js` |
| Où vit un projet | Le seul chemin passé [C] |
| `saisie --verdict` | Oui [C] |
| Ce qui n'a pas de rôle | Les rôles les plus proches, sans rôle créé ; les manques à la feuille de route [C] |
| La section « Conduire » | Dans ce lot ; description inchangée ; première ligne conditionnelle [C] |
| Les moments | Lancement, étape avec écran, étape sans écran, bilan [Q] ; l'ancien point 6 tombe |
| La barre | Quatre temps, six étapes dessous [Q, fichier 91] |
| Le constat qui attendait le choix des versions | Refusé ; le dernier résultat reste à l'écran [C, fichier 91] |

## Fixtures et tests

Construit et testé sur du fictif seulement : Orbe Café et les marques de `tokens/`. Un projet par moment, plus le cas à un site et le cas à plusieurs, dans `fixtures/parcours/`. Leurs sorties sont réduites aux champs que l'état lit, extraites de sorties réelles produites pendant le lot sur Orbe Café et sur une marque refusée (commande de chaque extrait notée dans `fixtures/parcours/README.md`). Les écrans y sont des pages de remplacement d'une ligne : le test vérifie le cadre et son adresse, pas l'écran.

| Projet | Sites | Moment et état attendus, écrits à la main avant le code |
|---|---|---|
| `lancement` | 1 (Orbe Café), son adresse, aucune page | Lancement ; Mesurer · Site en cours, la main au designer |
| `constat` | 1 | Étape avec écran : Mesurer faite ; Décider · Marques en cours, aucun verdict ; la main à l'outil, commande de saisie ; `constat.html` encore affiché, « Fait : Constat. Ensuite : Marques, … » |
| `marque` | 1 | Étape avec écran : Marques faite ; Décider · Décisions en cours, aucune table ; la main à l'outil, commande de reduce ; planche des rôles affichée, « Fait : Marques. Ensuite : Décisions, … » |
| `decisions` | 1 | Étape avec écran : Décider · Décisions en cours, « 12 décisions tranchées sur 14 » (chiffres de l'extrait réel), `revue.html` embarqué |
| `livraison` | 1 | Étape sans écran : Poser · Livraison, feuilles ajoutées, pas de verdict ; la main à l'outil, commande de verify |
| `bilan` | 1 | Bilan : Tenir · Suivi en cours, la phrase du bilan, trois chiffres « avant → après » de la table, le dernier contrôle |
| `plusieurs` | 3 (Orbe Café, Écume et Sel, une marque fictive refusée par la saisie réelle) | Étape avec écran : Mesurer faite (trois constats) ; Décider · Marques en cours, une ligne par site, « refusée : <motif réel> », la main au designer, planche des rôles d'Orbe Café embarquée |

| Test | Ce qu'il tient |
|---|---|
| État, étape par étape | Chaque ligne de la table de P2 : faite, en cours, à venir, la main, l'action, la commande, le fait chiffré, l'écran (cas construits en mémoire, plus les six projets) |
| Moments | Le moment de chaque projet ; partie B : son contenu, 60 mots visibles au plus hors du cadre ; partie A : six segments ; partie C : un seul `<details>`, fermé |
| Singulier et pluriel | Un site et plusieurs : page et terminal ; aucun « (s) », aucun « 1 sites », aucun « client », aucun « plateforme » |
| Pannes | Projet absent, JSON illisible, clé absente, `id` en double, sortie illisible : sortie 2, une ligne qui nomme la cause |
| Déterminisme | Deux écritures du même projet : page identique à l'octet |
| Saisie `--verdict` | Acceptée, refusée (motifs), empreinte ; sans l'option, sortie et fichiers inchangés |
| Page | Sans `<script>`, bloc sombre présent, T2 ; dans Chromium à 640 px, aucun défilement horizontal, dans les deux modes ; le cadre prend la hauteur qui reste |
| Serveur | Sur un port libre : `/` rend la page à jour, un écran monté est servi, `/../` et un chemin hors racine sont des 404, écoute sur `127.0.0.1` seulement |

`npm test` : 1 119 + une vingtaine [H]. Un fichier de test ajouté va dans la part la plus légère (D58). Aucune dépendance. Les autres contrôles à 0, `npm audit` aux deux endroits ; l'atelier n'est pas touché.

## Documentation

README (« Ce que fait l'outil », une section « Le parcours », glossaire : produit, site, marque, temps, porte), ARCHITECTURE (`src/parcours/`, la commande, la disposition des sorties), `docs/decisions.md` (**D72** : le chat conduit, le panneau montre ; état calculé depuis les sorties, disposition fixe, un constat par site, la saisie qui écrit son verdict, la page hors Vue et Vuetify, écart assumé avec le cadrage du 17/11, section 9.6, à rejuger après le POC ; ses limites), `docs/feuille-de-route.md` (épaisseur de bordure, rôles d'avancement), `docs/identifiants.md` si des identifiants de test s'ajoutent, `CLAUDE.md` (la commande), `KNOWN_ISSUES.md` (le lot suivant : Diapason, l'alignement des écrans ; les textes existants qui contredisent les trois mots), skill régénéré.

## Commits

| Commit | Contenu |
|---|---|
| C1 | Cet attendu |
| C2 | `saisie --verdict` et ses tests ; README |
| C3 | L'état, la commande, la page, le serveur, les fixtures, les tests ; README, ARCHITECTURE, D72, feuille de route, CLAUDE.md |
| C4 | La section « Conduire », `npm run skill` ; KNOWN_ISSUES |

Un résumé du diff dans la boîte avant chaque commit.

## Arrêts

1. **Cet attendu** : versions 1 et 2 lues à l'arrêt 1 ; la version 3 porte le fichier 91, sans nouvel arrêt [Q, go du 24/11].
2. **La page jouée** : les projets fictifs servis en local, sur des sorties réelles d'Orbe Café, vus par Quentin dans le panneau, l'embarquement des trois écrans éprouvé, et la CI de la branche verte ; rien sur `main` avant son accord. Puis, hors du lot et hors du dépôt, le passage réel : deux sites d'un même produit, un échantillon de pages dans chacun, projet et sorties sous `local/`, aucun nom, aucune adresse, aucune capture dans un fichier versionné ni dans un message de commit. Limites affichées telles quelles : livraison produite et prouvée dans le navigateur de l'outil, pas installée ; suivi sans CI ; une seule origine réduite.

## Hors du lot

La grille de brief ; la lecture du code source ; un écran pour l'étape Site ; le choix automatique des pages d'un grand site ; un plugin ; une MCP App ; le dossier du dirigeant ; le temps gagné ; l'habillage commun des écrans ; Diapason ; reprendre les textes existants aux trois mots ; la comparaison des constats entre sites ; reprendre les présentations d'étape de Quentin pour les explications ; montrer l'outil au travail, en direct ; une image dédiée par étape [Q, fichier 90].

## Écarts relevés en écrivant le code

- **Une clé `sources`** s'ajoute au projet, passée à `reduce` et à `verify` (`--sources`). Sans elle, le parcours joué sur Orbe Café sortait de `verify` en 1 : 11 lignes du bandeau de cookies, élément tiers, non arrivées [F, 24/11/2026]. Avec elle, 54 lignes arrivées sur 54.
- **Une carte de plein gardée** pour le bilan joué : la version « texte foncé » de la carte de `terre` laissait 11 lignes non arrivées, la dette connue du texte posé sur un plein (`#220000`, `KNOWN_ISSUES.md`, « À payer après l'étape 11 ») [F].
- **Le contexte étroit n'est pas écrit** dans la page : son seuil vit dans le resolver de chaque marque, pas dans les couches communes, et la page vise le panneau, 640 px, au-dessus de lui. Limite de D72.
- **Au bilan, la ligne d'action se réduit à sa tête** (« Tenir · Suivi · la main est à l'outil ») : avec « À faire : relancer le contrôle. », le moment faisait 61 mots. Le terminal garde la commande.
- **Les noms d'étape s'accordent** : « Site » et « Marque » pour un site, « Sites » et « Marques » pour plusieurs. Un site se nomme par « du site <id> » (« lancer le constat du site ecume »), pour ne pas écrire « de ecume ».
- **Marque refusée à plusieurs sites** : la phrase « Marque refusée » au-dessus de la planche d'une marque acceptée ; le motif est dans la ligne d'action, la liste par site dit seulement « refusée ».
- **Pas de commande suivante quand l'humain agit** (corriger une entrée, trancher dans la revue, lire `pertes.md`) : relancer la commande de l'outil ne ferait rien de neuf.
- **Le projet `decisions`** tranche 8 décisions sur 15 (copie de `decisions-valise.json` sur une table d'Orbe Café), pas « 12 sur 14 » : chiffres de l'extrait réel, comme l'annonçait l'attendu.
- **Le chemin du projet est lu réel** (`realpathSync`) : sous macOS, un dossier temporaire se nomme `/var/…` et le dossier courant `/private/var/…`, et les commandes proposées remontaient l'arborescence.

## Preuve

Lus le 24/11/2026 : les fichiers 86 à 90 de la boîte ; `README.md` (« Ce que fait l'outil », « Saisir une marque », « Constat des composants », glossaire) ; `skill/ds-lab/SKILL.md` ; `test/histoire.test.js` (motifs) ; `src/report/constat.js` (couleurs du constat : rôles neutres communs, le reste en px écrits) ; `src/cli/saisie.js` (refus : rien d'écrit) ; `src/cli/verify.js` (`verdict.json`) ; `src/cli/reduce.js` et `src/reduce/propose.js` (classes, `decisionFor`, `summary` par famille) ; `src/composants/run.js` et `src/report/json.js` (`freeOutputDir`, sorties par hôte) ; `src/report/review.js` (export par téléchargement) ; `src/banc/banc.js` (copie du skill) ; `tokens/commun/paires.json` ; une `table.json` fictive du 14/11 dans `local/reductions/` (champs `summary.before` et `.after`). Rôles résolus sans marque par `flattenTokens` et `resoudreAlias` (`src/tokens/roles.js`), script dans le scratchpad. Non vérifié : un écran existant embarqué dans une autre page, dans le panneau d'aperçu ; le panneau dans une session ouverte sur un dossier ; la maquette (artefact du compte de Quentin), connue par la description du fichier 90.
