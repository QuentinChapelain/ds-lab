# Étape 10, lot 2 : le banc en trois exercices

Attendu écrit le 22/11/2026, avant le code, d'après la demande du même jour (« le banc en trois exercices ») et le recadrage qui la précède. Accepté à l'arrêt 1 (11 h 26), avec les réponses de Quentin (11 h 24) et une correction de la page de référence, reportées ici. Étiquettes : [F] mesuré ou lu, [H] hypothèse, [V] à vérifier, [Q] tranché par Quentin, [C] tranché par Claude.

## But

Le banc fusionné (D67) ne fait qu'un exercice, qui mélange installer, composer et étendre : si le résultat est mauvais, on ne sait pas où ça a cassé. Ce lot le découpe en trois exercices, chacun avec son point de départ et son brief. **Il ne lance aucun passage.** On jouera Composer d'abord (six passages, deux bras), puis Étendre, puis Installer.

## Départ [F, lu le 22/11/2026 à 11 h 20]

- `main` = `origin/main` = `a0207f6`, sans `git fetch`. Copie propre.
- CI de `main` (44999857569) verte, 2 min 59.
- `npm test` : 1 081, d'après le message de `a0207f6`. Rien n'a été lancé pour écrire cet attendu : ni test, ni `npm audit`, ni passage. `~/Developer/banc/` n'existe pas.

## 1. Les trois points de départ [Q]

| Exercice | Ce que l'app contient au départ | Ce que l'IA neuve fait |
|---|---|---|
| **Installer** | L'app d'aujourd'hui : thèmes à la main, valeurs en dur, aucun `Ds…`, trois `entree.json` | Branche les trois marques |
| **Composer** | La même après installation : trois marques saisies, thème de ds-lab branché, six `Ds…`, un gabarit de page, les trois pages passées dessus. Pas d'annuaire | Construit l'annuaire dans le gabarit |
| **Étendre** | Le départ de Composer, plus l'annuaire de référence | Ajoute les pièces qui manquent |

### Une base et des couches

Les départs ne sont pas rangés tout faits : le banc les fabrique.

1. **La base** : `fixtures/app-fictive/`, qui est le départ d'Installer.
2. **La couche de Composer** : `fixtures/banc/composer/couche/`, les seuls fichiers qui changent ou s'ajoutent.
3. **La couche d'Étendre** : `fixtures/banc/etendre/couche/`, la page de référence et ses pièces, posée sur la couche de Composer.
4. **Ce qui vient de ds-lab n'est pas recopié dans `fixtures/`** : composants et fiches sont copiés du commit posé ; les jetons et le thème de chaque marque sont écrits par la saisie et `vuetify.js` de la copie de ds-lab, comme une équipe le ferait.

`fixtures/banc/exercices.json` dit, par exercice : ses couches, les fichiers de la base retirés, ce qui se copie de ds-lab et où, s'il faut saisir les marques, son brief, ses chemins cachés, ses adresses de planches.

| Ce qui change d'Installer à Composer | Fichiers |
|---|---|
| Marques saisies, thème branché | `tokens/<marque>/`, `src/plugins/vuetify.js`, `src/marques.js` (noms des thèmes), `src/styles/app.css` retiré, `src/main.js` (son import) |
| Les six composants et leurs fiches | `src/components/ds/`, `docs/composants/` |
| Le gabarit | `src/gabarit/`, `docs/gabarit.md`, `src/App.vue` |
| Les pages | `src/pages/` |
| Le mode d'emploi de l'app | `README.md` |

De Composer à Étendre ne changent que `src/pages/Annuaire.vue`, `src/modules/`, `src/annuaire/` et `src/router.js`. EX1 et EX2 le prouvent.

### `verifier` à 0 au départ de Composer et d'Étendre [C]

**Si EX3 ne passe pas, le lot s'arrête et le dit avant tout contournement** ; aucune exception hors de `src/gabarit/` pour l'obtenir [C]. **Atteignable** [H, d'après la lecture de `stylelint.config.mjs`, des six composants et des pages ; aucun essai lancé] :
- contraste, espacements, typo : 0 dès la saisie, BN4 le vérifie déjà [F] ;
- skill : la copie est identique ;
- composants `Ds…` : la même garde les tient à 0 dans l'atelier (`npm run style`) ;
- pages et gabarit : chaque valeur vient du thème. Ce que le thème ne porte pas s'écrit en **exception, à la valeur du jeton, avec le nom du jeton pour raison**, dans `src/gabarit/` seulement.

**Ce que ce 0 ne dit pas** [F] : `verifier` ne lit que les `.vue`. Un fichier `.css`, une valeur dans une prop de Vuetify (`max-width="560"`), `:style` et `grid-template-columns` lui échappent. Les départs n'en abusent pas : plus aucun `.css` dans l'app, ni `px` dans une prop ou un `:style` ; les colonnes d'une grille se calculent sur une variable du thème.

## 2. Où l'IA neuve trouve les composants, les fiches et le gabarit [C, accepté]

| Pièce | Endroit dans l'app | Pourquoi |
|---|---|---|
| Les six composants, avec leur menu, `fabrique.js`, `icone.js`, `initiales.js`, sans en changer un octet | `src/components/ds/` | L'endroit habituel d'une app Vue ; un dossier à part dit « ne pas toucher » |
| Les six fiches et leur index | `docs/composants/` | Le même chemin que dans ds-lab : les liens d'une fiche à l'autre tiennent |
| Le gabarit | `src/gabarit/GabaritPage.vue` et `SectionPage.vue` | Une pièce de l'app, pas de ds-lab |
| Sa fiche | `docs/gabarit.md` | Une page : ce qu'il donne, ce qu'il attend |
| Le renvoi | `README.md` de l'app, une ligne par dossier | Ce qu'une équipe écrit. Aucun nom de composant |

`noms.json` et les modules ne sont pas copiés. Ni le brief ni le README ne nomment un composant : les trouver est une mesure.

## 3. Le gabarit [Q]

`GabaritPage` porte la barre du haut, le bandeau de titre, la largeur du contenu et le pied. `SectionPage` porte le titre d'une section et l'écart jusqu'à son contenu : l'accueil en a une, et le style d'un titre de section doit vivre à un seul endroit. Pas de colonne à gauche [C]. `App.vue` ne garde que la marque et le mode.

| Pièce | Ce que j'en fais | Ce qu'il a fallu inventer |
|---|---|---|
| Barre du haut | `v-app-bar` sur la surface ; nom de la marque, menu en liens, liste des marques (Vuetify), mode en `DsIconButton`. Sous 600 px, le menu passe sur une seconde ligne | La seconde ligne ; l'entrée courante, soulignée (aucun rôle « sélectionné », B3) |
| Bandeau | L'aplat **plein** de la marque, le h1, une phrase facultative, une place sous le titre (slot) | Tout : ni bandeau ni aplat dans le thème |
| Largeur | 1 080 px, celle de l'app aujourd'hui, en exception | Aucun jeton (B6) |
| Marges et écarts | Côtés : `padding.component`. Entre sections : `gap.section`, 48 px et 32 en étroit. Du titre à son contenu : `gap.between-groups`, 24 px | Ces deux jetons existent mais le thème ne les porte pas |
| Titres | Titres 1 et 2 de ds-lab (30 et 24 px ; 24 et 20 en étroit), police et hauteur de capitale par le thème | Même raison ; le thème n'a pas de valeur en étroit |
| Pied | Filet décoratif, corps petit, texte secondaire | — |

**L'aplat.** Le rôle juste est `background.brand.strong`, absent du thème Vuetify. Sa valeur ne change pas d'un mode à l'autre et égale le `primary` du thème **clair**, son texte `on-primary` [F, lu dans les jetons des trois marques : `#7fdbff`/`#003647`, `#7a1f3d`/`#ffffff`, `#836304`/`#ffffff`]. `src/plugins/vuetify.js` ajoute donc `brand-strong` et `on-brand-strong` aux deux thèmes de chaque marque, pris dans le thème clair, sans valeur écrite à la main. EX5 compare aux jetons.

**Les trois pages** :

| Page | Passe aux `Ds…` | Reste tel quel, et pourquoi |
|---|---|---|
| Accueil | Trois `DsCard` | « Adhérer » mène ailleurs : un lien souligné sur l'aplat. `DsButton` ne mène nulle part (B9) et est interdit sur l'aplat (B12) |
| Événements | — | Tableau et liste de Vuetify ; l'état reste une puce de Vuetify, pleine : la fiche de `DsTag` dit « pour dire un statut, rien encore » |
| Adhésion | Quatre `DsTextInput`, un `DsButton` | Case à cocher et alerte de Vuetify. Les messages d'erreur sont rebranchés à la main : `DsTextInput` ne suit pas les règles de `v-form` |

Le comportement des pages ne change pas. `DsAvatar` n'est posé nulle part au départ ; `DsTag` non plus.

## 4. Le brief de Composer, mot pour mot [Q, 22/11, 11 h 11]

Dans `fixtures/banc/composer/brief.txt`, sans mise en gras.

> Nous sommes dans le gabarit de Quai Nord, sur une nouvelle page : « Annuaire », à l'adresse `/annuaire`, à ajouter au menu.
>
> La page a deux sections.
>
> Première section, le bandeau. Un aplat aux couleurs de la marque. Dessus, le titre de la page, « Annuaire », en h1. Dessous, un formulaire de recherche, dans une carte posée sur l'aplat. On y tape un nom ou un besoin. Ce qu'on tape réduit la liste des membres à ceux qui contiennent ces mots.
>
> Deuxième section, le contenu. Quatre blocs, l'un sous l'autre.
>
> 1. Une carte : la petite photo d'une personne de l'équipe, son nom, le nombre de personnes qu'elle a mises en relation, et un bouton pour lui demander un coup de main afin de contacter des gens.
> 2. Une courte liste de trois cartes : trois personnes choisies d'après mon profil. Dans chaque carte : la photo de la personne, son prénom et son nom, son métier, ce à quoi elle est ouverte (relire un CV, parler de son métier, par exemple), un exemple de question qu'on pourrait lui poser, puis un bouton pour lui écrire un message.
> 3. L'annuaire : la liste de tous les membres. Pour chacun : sa photo ou ses initiales, son prénom et son nom, son métier, son entreprise, sa ville, sa promo, ce à quoi il est ouvert, et un bouton pour lui écrire. Il y a 295 membres. La liste affiche les 25 premiers et dit le total.
> 4. Une carte qui présente les personnes qui animent le réseau. Quai Nord en a trois. Le titre de la carte, puis pour chacune son prénom, son nom et son rôle dans l'équipe d'animation.
>
> Viendront après, ne les fais pas : la navigation locale au-dessus des blocs, la recherche avancée, le tri et le filtre de la liste, ses modes d'affichage, ses pages.
>
> Les données sont dans `src/data/membres.js`.
>
> L'app est servie sous trois marques : Écume et Sel, Grenat Papeterie et Maison Alberto. La page doit tenir dans chacune, en clair comme en sombre.
>
> Pour le design system, suis le skill ds-lab.

Le paragraphe des passages sans humain (`fixtures/banc/sans-humain.txt`) ne change pas.

**Trous voulus, à ne pas combler** : le texte du titre de la dernière carte ; l'entreprise dans les trois cartes ; la photo des animateurs ; où mènent les noms et les entreprises ; ce qui doit ressortir en premier ; le téléphone ; un bouton « Plus d'actions ».

**La description brute de Quentin** (11 h 08) est gardée mot pour mot dans `fixtures/banc/composer/description-brute.txt`, jamais copiée dans un passage. La jouer à la place du brief n'est pas dans ce lot. Ce que la mise en forme a changé [Q] : renvoyés à Étendre, la navigation locale, la recherche avancée, le tri, le filtre, les modes d'affichage, les pages ; ajoutés, la phrase sur ce que fait la recherche, le métier, la ville et le bouton dans la liste, « les 25 premiers », les trois dernières lignes ; « fond blanc » devenu « carte posée sur l'aplat », « CTA » devenu « bouton ».

**L'ancien brief** (`fixtures/banc/brief.txt`) est retiré : il est mot pour mot dans `docs/attendus/etape-10-banc.md`.

### Installer [Q, 11 h 24]

> Quai Nord est servie sous trois marques : Écume et Sel, Grenat Papeterie et Maison Alberto. L'équipe de marque nous a donné l'entrée de chacune, dans `tokens/<marque>/entree.json`.
>
> Aujourd'hui les couleurs, les polices et les espacements de l'app sont écrits à la main, page par page. Branche l'app sur ces trois entrées et sur le design system : qu'elle ne garde aucune de ces valeurs à la main, en clair comme en sombre, sans changer ce que font les pages.
>
> Pour le design system, suis le skill ds-lab.

La seconde phrase est changée : « qu'elle prenne tout de là » était faux pour les espacements, une entrée ne porte que le nom, les couleurs et les polices [F].

### Étendre

Pas de brief dans ce lot. La pose refuse et le dit, sortie 2.

## 5. La page de référence : les choix sur les trous [Q, 11 h 24 ; à juger sur les planches]

Écrite à la main par Claude Code, d'après le brief et la hiérarchie de l'ancien. Référence cachée de Composer, départ d'Étendre.

| Trou | Choix |
|---|---|
| Titre de la dernière carte | « Qui anime le réseau » |
| Entreprise dans les trois cartes | Absente : le brief ne la cite pas |
| Photo des animateurs | Montrée, petite, à côté du nom |
| Où mènent les noms et les entreprises | Dans la liste : le nom au profil, l'entreprise à sa page. Dans les trois cartes, le nom ne mène nulle part : `DsCard` refuse un lien et un bouton ensemble |
| Ce qui ressort en premier | La recherche, sur l'aplat. Puis « Demander un coup de main », seul bouton principal de la page (CP8) ; tous les « Écrire » sont secondaires |
| Téléphone | Une colonne ; le bouton passe sous le texte ; un nom long passe à la ligne |
| « Plus d'actions » | Aucun |

Ce que le brief laisse aussi ouvert :

| Point | Choix |
|---|---|
| « Écrire » | **Bouton** [Q] : `DsButton`, qui ouvre l'adresse d'écriture de la personne. Le brief dit « bouton », et une `DsCard` n'admet rien d'autre dans ses actions. Mais la donnée est une adresse, et CP6 dit « ce qui mène ailleurs est un lien » : le bouton y manque, faute de lien dans ds-lab (B9). Le manque est noté dans le relevé d'Installer (R5). Même choix pour « Demander un coup de main » |
| Nom lu de chaque « Écrire » | « Écrire à Camille Ferrand », visible « Écrire » |
| Recherche | À chaque frappe, sans bouton. Accents et casse ignorés ; chaque mot tapé doit se trouver dans le nom, le métier, l'entreprise, la ville, la promo ou une ouverture. Elle ne touche que la liste ; les trois autres blocs restent |
| Carte de recherche | Titre « Rechercher un membre » : `DsCard` exige un titre. Champ « Un nom ou un besoin », aide « Par exemple : Lyon, relire un CV » |
| Compte | « 25 premiers sur 295 membres » ; après une recherche, « 12 membres sur 295 » ; annoncé au lecteur d'écran |
| Rien trouvé | « Aucun membre ne correspond à « … ». » |
| Titres des blocs | « Trois personnes pour vous » [Q], « Tous les membres » |
| Les ouvertures | « À lui demander : », puis une suite de `DsTag` de marque : le texte les détache, pas la couleur seule |
| La question | « Une question à lui poser : », puis la question entre guillemets |
| La raison du choix des trois personnes | Affichée sous le titre du bloc, lue dans les données : une phrase prête à afficher [Q] |
| Le groupe | Pas affiché [Q] : le brief ne le demande plus |
| Une ligne de la liste | Pas une `DsCard`, qui ne peut pas porter un lien sur le nom et un bouton : une pièce de l'app (`src/modules/MemberRow.vue`), avec `DsAvatar`, `DsTag`, `DsButton` et deux liens |

Les pages visées (`/membres/…`, `/entreprises/…`, `/messages/…`) n'existent pas dans l'app : un clic mène à une page vide, comme aujourd'hui. Ce lot ne les ajoute pas.

## 6. Les données

`src/data/membres.js`, dans la base, donc le même dans les trois départs.

- **295 membres** [Q], écrits par `fixtures/banc/fabriquer-membres.js` : graine fixe, sans bibliothèque ni date, rejouable à l'octet ; un nom déjà pris est tiré de nouveau. Les dix d'aujourd'hui en tête, inchangés. Les cas rares sont déjà tous dans ces dix [F] : sans photo, photo perdue, nom long, sans promo, sans groupe, sans ouverture, quatre ouvertures.
- Une vingtaine d'entreprises et une dizaine de villes : plusieurs membres par entreprise et par ville. Prénom et métier s'accordent. Personnes, entreprises et groupes inventés.
- `COUP_DE_MAIN` : nom, photo, nombre de personnes mises en relation, adresse pour demander.
- `PROPOSES` : la raison du choix, une phrase prête à afficher, et trois membres de la liste, chacun avec sa question.
- `ANIMATION` : prénom, nom, photo, rôle.
- Rien de la maquette de Quentin, que je n'ai pas vue.

## 7. Le banc

- `npm run banc -- --exercice composer|etendre|installer --bras A|B --passage <n> --modele <m>`. `--exercice` absent ou inconnu : sortie 2.
- Dossier : `~/Developer/banc/<exercice>/<bras>-<n>/` ; le journal et `depart.txt` suivent.
- Relevé : `npm run banc -- --exercice composer --relever A-1`, dans `local/banc/composer/A-1/`.
- **Chemins cachés** : ceux d'aujourd'hui pour les trois, `fixtures/banc/` compris ; la référence, le brief et la description brute y sont. Pour Étendre, la référence est dans l'app, et le reste (modules de l'atelier) reste caché.
- **D68, README et ARCHITECTURE restent dans la copie** que l'IA neuve peut lire : ils ne diront rien des choix de la section 5.
- **Planches** : 360 et 1 280 px, clair et sombre, trois marques. `/annuaire` pour Composer et Étendre (12) ; les trois pages pour Installer (36).

**Le relevé de Composer, en plus**, sur les fichiers neufs ou modifiés, dans `pose.md` et `pose.json`, ainsi que pour Étendre :

| Mesure | Comment |
|---|---|
| Chaque `Ds…` posé | Compté dans le `<template>` et le script des `.vue`, par nom |
| Pièces de Vuetify posées alors qu'un `Ds…` existe | `V…` et `v-…` ; la table vient de la ligne `wraps` des fiches, pas d'une liste à la main. Un `v-btn` avec `to` ou `href` est compté à part : aucun `Ds…` ne mène ailleurs |
| Composants créés | `.vue` neufs, hors de `src/pages/` |
| Composants ou gabarit modifiés | Fichiers de `src/components/ds/`, `docs/composants/`, `src/gabarit/` touchés |
| Gabarit | La page de `/annuaire` importe-t-elle `GabaritPage` ; une barre, un pied ou un `v-main` dans un fichier neuf est signalé |
| « Viendront après » | Cinq signaux (navigation locale, recherche avancée, tri ou filtre, modes d'affichage, pages), chacun avec ses lignes : **à lire, pas un verdict** |

J'ajoute trois comptes, gratuits : les `<button>` et `<input>` nus, qui contournent aussi les composants ; les exceptions de style écrites, puisqu'une exception fait taire `verifier` ; les fichiers `.css` touchés, qu'il ne lit pas.

## 8. Installer, premier relevé : ce qui résiste

Lu avant le code [F] ; complété à l'arrêt 2 par ce que la fabrication aura montré. **L'outil n'est pas corrigé dans ce lot.**

| # | Ce qui résiste |
|---|---|
| R1 | Le skill dit les `Ds…` « un exemple et un gabarit, pas un produit », et ne dit ni quels fichiers copier, ni où, ni de quoi ils dépendent |
| R2 | Le skill fait écrire `vuetify.json` et ne dit pas comment le brancher : `createVuetify`, les noms `<dossier>-light` et `-dark`, le changement de marque. Le seul exemple est `atelier/.storybook/preview.js` |
| R3 | Le thème ne porte que ce que lisent les six composants : ni aplat, ni titres 1 et 2, ni chapô, ni écart de section, ni largeur de page, ni valeur en étroit |
| R4 | `jetons.css` a tout cela, mais ne sert pas une app à plusieurs marques : un `:root` par marque, le sombre par réglage du système ; et `verifier` refuse ses variables, il n'admet que `--v-ds-…` et `--v-theme-…` |
| R5 | Pas de lien (B9) : « Écrire » et « Demander un coup de main » sont des boutons qui mènent à une adresse, contre CP6. Le `href` de `DsCard` est une ancre simple : dans une app à routeur, elle recharge la page |
| R6 | `DsCard` refuse un lien et un bouton ensemble, et exige un titre |
| R7 | `DsTextInput` ignore les règles de `v-form` |
| R8 | `DsTag` n'a pas de statut ; `DsButton` n'a pas de forme pour l'aplat (B12) |
| R9 | `verifier` ne lit ni les `.css`, ni les props de Vuetify, ni les colonnes d'une grille |
| R10 | Les fiches copiées citent des chemins et des décisions du clone, et `card.md` nomme `MemberCard` |
| R11 | Rien ne compare les composants copiés à ceux du clone, alors que `--skill` compare le skill |
| R12 | Aucun gabarit de page dans ds-lab (B6) : largeur, marges, bandeau, titres de section sont inventés (section 3) |

**Ce que la fabrication a montré en plus** [F, 22/11, 11 h 35 à 12 h 00] :

| # | Constat |
|---|---|
| R13 | Les six composants se posent sans en changer un octet : leurs imports ne demandent que `vue` et `vuetify/components`, que l'app a déjà. `verifier` à 0, app construite, aucune erreur dans la page |
| R14 | CP3 refuse une variable CSS de l'app (`var(--gabarit-section)`) : une valeur écrite une fois puis lue trois fois n'est pas possible. Le gabarit répète `gap.section` cinq fois, en exceptions ; 16 exceptions au total pour deux fichiers |
| R15 | Deviné : `createVuetify` reçoit `themes` tel quel ; le nom d'un thème est `<dossier>-light` ou `-dark` ; `wraps` d'une fiche est le seul lien entre une pièce de Vuetify et son composant, et celui de `DsIconButton` ne se lit pas comme les autres |
| R16 | Une case à cocher de Vuetify en `primary` est à 1,51:1 sur la page d'Écume et Sel en clair [culori, `wcagContrast('#7fdbff', '#fbfbfb')`] : le plein d'une marque claire ne repère pas un état, et aucun rôle « coché » n'existe (B3). Rien ne le signale : `verifier` ne lit pas l'attribut `color` |
| R17 | Le titre de la barre, la liste et le tableau de Vuetify gardent leurs styles de texte à eux (dette des thèmes Vuetify, `KNOWN_ISSUES.md`) |
| R18 | Sous un titre sans sous-titre, le contenu d'une `DsCard` suit à 4 px : le champ de recherche colle au titre de sa carte (limite écrite de la fiche, D60) |
| R19 | Trois `DsCard` côte à côte n'alignent pas leurs boutons : rien ne pousse les actions en bas d'une carte étirée |

## 9. Ce qui ne change pas

`verifier` par cause, le relecteur, le carnet, les deux bras, la fin d'un passage, `claude-sonnet-5-5` pour tous. Les trois points non vérifiés du lot 1 (skills du compte écartés, `PATH` du hook, `CLAUDE.md` du clone) se vérifient sur le passage jetable B-9 de Composer, après ce lot.

## Biais acceptés

- **Quentin avait lu un brief de Claude, tiré de sa maquette, avant d'écrire sa description.**
- La fiche de `DsCard`, copiée telle quelle, dit « une ligne d'annuaire : `DsAvatar` en `prepend` (module `MemberCard`) ». Les deux bras la lisent, et NM5 aussi.
- L'IA neuve a sous les yeux les choix du gabarit, exceptions comprises : elle peut les imiter.
- La référence et le gabarit ont le même auteur : la référence ne dit pas si le gabarit se comprend.

## Tests

| Fichier | Tests |
|---|---|
| `test/app-fictive.test.js` | AF1, AF2, AF4 inchangés. **AF3** les dix personnes en tête de la liste, champs et cas dans les 25 premiers. **AF5** 295 membres ; le fichier égale à l'octet ce qu'écrit le script ; noms et profils uniques ; plusieurs membres par entreprise et par ville ; les trois proposés sont dans la liste ; les trois animateurs et la personne de l'équipe ont leurs champs |
| `test/exercices.test.js` | **EX1** d'Installer à Composer, ne diffèrent que les fichiers du tableau de la section 1. **EX2** de Composer à Étendre, que la référence. **EX3** `verifier` sort 0 sur Composer et sur Étendre. **EX4** les six composants et leurs fiches égalent le commit à l'octet ; ni module ni `noms.json`. **EX5** `brand-strong` et son texte égalent les jetons, trois marques, deux modes ; chaque exception du gabarit égale le jeton qu'elle nomme. **EX6** aucun fichier de la référence, ni par chemin ni par contenu, ni la description brute, dans un passage de Composer, copie de ds-lab comprise. **EX7** les briefs ne nomment ni composant, ni token, ni règle, et n'ont pas de mise en gras. **EX8** chaque page du départ de Composer passe par le gabarit ; hors de `src/components/ds/`, aucune pièce de Vuetify qui a un `Ds…`, sauf la puce d'état |
| `test/banc.test.js` | BN1 et BN3 sur Composer, BN4 sur Installer (inchangé). **BN5** `--exercice` absent ou inconnu, et Étendre sans brief : sortie 2, un message qui dit quoi faire |
| `test/relecteur.test.js` | BN2 sur Composer |
| `test/releve.test.js` | Sur un travail simulé. **RV1** comptes des `Ds…`, des pièces de Vuetify, des `v-btn` qui mènent ailleurs. **RV2** composants créés, composants et gabarit modifiés, gabarit employé ou refait. **RV3** les cinq signaux de « viendront après », et aucun sur la page de référence |

`npm test` : 1 081 + 13 = **1 094** [H : AF5, EX1 à EX8, BN5, RV1 à RV3]. Preuve **546** et **120** captures identiques au pixel, rejouées une fois : l'atelier n'est pas touché. Les autres contrôles à 0. `npm audit` à la racine, dans l'atelier et dans l'app. **Aucune dépendance ajoutée.**

CI sous 4 min : les départs de test se fabriquent sans `npm ci`, une fois par fichier [H : moins de 20 s dans la part la plus légère]. L'app n'y est ni installée ni construite ; les trois départs se construisent en local à l'arrêt 2.

## Commits

| Commit | Contenu |
|---|---|
| C1 | Cet attendu ; les 295 membres et leur script ; AF3, AF5 |
| C2 | `exercices.json`, la fabrication des départs, la couche de Composer ; EX1, EX3 (Composer), EX4, EX5, EX8 |
| C3 | La page de référence, le départ d'Étendre ; EX2, EX3 (Étendre), EX6 |
| C4 | Le banc par exercice, les briefs, la description brute, le relevé de Composer ; EX7, BN5, RV1 à RV3 ; D68 |

README, ARCHITECTURE et identifiants sont mis à jour dans chaque commit qui les touche. Un résumé du diff avant chacun.

**Quatre points viennent de l'outil, pas d'un choix de design** : le titre « Rechercher un membre » exigé par la carte ; le nom non cliquable dans les trois cartes ; l'aplat qui garde sa couleur claire en sombre ; « À lui demander : » devant les ouvertures. Un refus de Quentin est une ligne du tableau des améliorations, pas une retouche de ce lot.

**À l'arrêt 2**, Quentin regarde les planches : les trois pages du départ de Composer (36) et l'annuaire de référence (12), plus le relevé d'Installer complété.

## Écarts relevés en écrivant le code

- **Une variable locale** était prévue pour l'écart de section ; CP3 la refuse (R14). Les exceptions restent toutes dans `src/gabarit/`.
- **`SectionPage` a un `chapo`**, comme `GabaritPage` : la raison du choix des trois personnes s'y pose.
- **À 360 px**, le nom de la marque quitte la barre : la liste des marques le dit déjà, et il y était coupé. Dans l'app d'Installer, la barre est coupée à 360 px [F, vu sur la planche] : un passage d'Installer le trouvera.
- **`src/main.js`** perd l'import d'`app.css` ; plus aucune feuille `.css` dans les départs de Composer et d'Étendre.
- **EX3, EX5 et EX8** jugent aussi le départ d'Étendre.
- **RV4** en plus : la commande `--relever` entière, sur un passage posé dans un dossier temporaire, sans installation. `npm test` : **1 095**, au lieu de 1 094.
- **Le relevé s'écrit dans `pose.md` et `pose.json`**, pour Composer et pour Étendre. Ses motifs de signaux sont dans `exercices.json` : `src/` ne peut pas nommer le bouton de Vuetify (garde de l'enveloppe).
- **Les planches disent quand une page déborde** en largeur. Une barre fixe coupée n'allonge pas la page : elle échappe à cette note.
- **Le nom d'une planche porte sa page** (`annuaire-ecume-et-sel-clair-360.png`), puisqu'un exercice peut en avoir plusieurs.
- **La pose fabrique le départ avec la copie de ds-lab**, pas avec le dépôt : un passage montre ce que cette copie sait faire.

## Hors périmètre

Tout passage ; le brief d'Étendre ; une référence pour Étendre ou Installer ; toute correction de ds-lab ; jouer la description brute ; le tableau des améliorations, qui se remplit après les passages.
