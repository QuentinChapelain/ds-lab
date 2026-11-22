# Étape 10, lot 3 : Inventorier, et Composer en mode libre marqué

Attendu écrit le 22/11/2026, avant le code, d'après la demande du même jour. Accepté à l'arrêt 1 (12 h 40), textes compris. Étiquettes : [F] lu ou mesuré, [H] hypothèse, [V] à vérifier, [Q] tranché par Quentin, [C] tranché par Claude, [P] proposé par Claude Code, accepté à l'arrêt 1.

## But

1. **Un quatrième exercice, Inventorier** : avant de composer, regarder ce que la page demande et ce que l'app a déjà [Q].
2. **Composer dit son mode** : libre et marqué. Le catalogue d'abord ; ce qui manque se crée, à un endroit qui le dit [Q].

Ce lot ne lance aucun passage. Ni le skill, ni un jeton, ni un composant, ni la page de référence ne changent [C].

## Départ [F, lu le 22/11/2026 à 12 h 33, sans `git fetch`]

`main` = `origin/main` = `32163f6`, copie propre, CI de `main` (45016755788) verte, 2 min 56. `~/Developer/banc/` n'existe pas. Ni test, ni `npm audit` lancés pour écrire cet attendu.

## 1. Les textes [C, montrés à Quentin, « go »]

**Inventorier** : `fixtures/banc/composer/description-brute.txt`, à l'octet, une ligne vide, puis :

> Ne construis rien. Écris dans `inventaire.md` : les pièces que cette page demande ; pour chacune, ce que l'app a déjà pour la faire, ou ce qui manque ; les questions que tu me poserais avant de commencer.

**Composer** : le brief validé, sa dernière ligne remplacée par :

> Pour le design system, suis le skill ds-lab. Sers-toi d'abord de ce que l'app a déjà. Si une pièce manque, crée-la dans `src/provisoire/`, avec les valeurs du thème. À la fin, écris `rapport.md` : ce que tu as employé, ce que tu as créé et pourquoi.

**Sans humain** : Composer garde `sans-humain.txt`. Pour Inventorier, « choisis ce qui te semble le plus juste, et continue » contredit « ne construis rien » et « les questions que tu me poserais » : `brief-seul.txt` y est le brief seul [P].

La description brute n'entre toujours ni dans l'app ni dans la copie de ds-lab ; elle est le brief d'Inventorier (D68 disait « jamais copiée » : D69 le précise).

## 2. La configuration [P]

Dans `fixtures/banc/exercices.json` :
- `inventorier` prend `"depart": "composer"` : couches, retraits, copies et saisie sont ceux de Composer, sans les récrire. `pages` est vide : ni construction ni planches.
- `brief` devient une liste de fichiers, joints par une ligne vide.
- `rendu` nomme le fichier que le brief demande (`inventaire.md`, `rapport.md`), à la racine de l'app ; `provisoire` nomme le dossier de Composer ; `sansHumain` dit si le paragraphe s'ajoute ; `reference` nomme la liste d'Inventorier.

Les deux bras restent posables. Seul A sera joué ; en B, `carnet.md` serait compté parmi les fichiers touchés, et les questions auraient deux endroits, `carnet.md` et `inventaire.md`.

## 3. Le relevé d'Inventorier

`inventaire.md` copié, puis `releve-inventaire.md` et `.json` :

| Mesure | Comment |
|---|---|
| Fichier rendu | `inventaire.md` à la racine ; ailleurs ou absent : dit |
| Fichiers touchés en dehors | Le diff depuis « départ », moins `inventaire.md`. Attendu : aucun. Un changement dans la copie de ds-lab est dit aussi, pour tous les exercices [P] |
| Ce que la session a lu | Dans le journal, sinon dans `session.jsonl` : fichiers nommés par `Read`, par une commande ou une recherche, et appel du skill ; rangés en skill, fiches, composants, gabarit, pages, données, clone. Un dossier ou un motif nommé (`docs/composants/*.md`) est noté à part : à lire |
| Pièces | Par pièce de la référence : les lignes d'`inventaire.md` qui la nomment, face à ce qui était attendu ; sinon **manquée**. Une pièce que la description ne demande pas n'est jamais manquée |
| Inventées à tort | Avec leur ligne : chaque `Ds…` et chaque chemin cité qui n'existe pas au départ (à lire : il peut être cité comme un manque, ou comme un fichier à créer) ; les lignes de liste, de tableau et de titre qui ne correspondent à aucune pièce |

La comparaison est à lire, pas un verdict [C] : un motif peut rater une tournure, et une ligne juste peut sortir de la liste. Ni les questions ni la qualité du classement ne sont jugées par la machine.

### La liste de référence

Dans `fixtures/banc/inventorier/reference.json`, cachée. La description brute demande plus que le brief de Composer (P5, P6, P17 à P19) : la page de référence ne les a pas, la liste les a, sinon une bonne réponse serait dite inventée. **D** : demandée par la description. **R** : dans la page de référence, pas dans la description.

| # | Pièce | | Ce que l'app a, ou ce qui manque |
|---|---|---|---|
| P1 | Gabarit de page (barre, largeur, pied) | D | A : `GabaritPage` |
| P2 | Aplat et titre h1 | D | A : le bandeau de `GabaritPage` |
| P3 | Carte de recherche sur l'aplat | D | A : `DsCard` dans le slot `bandeau` ; elle impose un titre (R6) |
| P4 | Champ de recherche | D | A : `DsTextInput` ; réduire la liste est à écrire |
| P5 | Recherche avancée | D | Manque |
| P6 | Navigation locale | D | Manque ; aucun rôle « sélectionné » (B3) |
| P7 | Titre de section | R | A : `SectionPage` |
| P8 | Carte du coup de main | D | A : `DsCard` |
| P9 | Photo ou initiales | D | A : `DsAvatar` |
| P10 | Bouton d'action | D | A : `DsButton` |
| P11 | Lien (nom, entreprise, adresse d'écriture) | R | Manque (B9, R5) |
| P12 | Trois cartes côte à côte | D | A : `DsCard` ; la grille manque (B6), les actions ne s'alignent pas (R19) |
| P13 | Étiquettes d'ouverture | D | A : `DsTag` ; ni icône ni ton fort (R20) |
| P14 | Question en exemple | D | Aucun composant : du texte, aux styles du thème |
| P15 | Conteneur de liste | D | Manque (R21) |
| P16 | Ligne de liste | D | Manque (R6, R21) |
| P17 | Filtre et tri | D | Manque ; Vuetify a une liste de choix |
| P18 | Modes d'affichage | D | Manque ; Vuetify a une bascule |
| P19 | Pages de la liste | D | Manque ; Vuetify a une pagination |
| P20 | Compte des membres | R | Aucun composant : du texte |
| P21 | Rien trouvé | R | Manque (B7) |
| P22 | Carte des personnes qui animent | D | A : `DsCard`, `DsAvatar` |
| P23 | Données | R | A : `src/data/membres.js` |
| P24 | Route et entrée du menu | R | A : `src/router.js`, la barre du gabarit |

## 4. Le relevé de Composer, en plus

| Mesure | Comment |
|---|---|
| Pièces marquées | Les fichiers de `src/provisoire/`, qui n'existe pas au départ |
| Marquage manqué | Les pièces neuves ailleurs : tout `.vue`, et tout `.js` qui rend (`defineComponent`, `h(`) hors de `src/provisoire/`, sauf la page que la route nomme. Aujourd'hui tout `src/pages/` est écarté : un composant posé là échapperait [F] |
| Pièces de Vuetify sans composant `Ds…` | Comptées par nom [P]. « Ce que l'app a déjà » comprend Vuetify : une `v-pagination` n'est ni du catalogue, ni créée, ni marquée. Sans ce compte, cet écart-là n'a pas d'origine. Le relevé nomme la **troisième origine** : ni catalogue, ni créée [C] |
| Rapport | `rapport.md` à la racine, ailleurs ou absent ; copié ; nomme-t-il chaque fichier créé (chemin, nom de fichier ou nom du composant, en mot entier) |

`verifier` juge `src/provisoire/` comme le reste : le motif `src/**/*.vue` le prend déjà [F]. Il n'y lit ni `.js` ni `.css`, que le relevé compte.

Non vu : une pièce écrite dans le corps de la page, comme la page de référence le fait pour ses listes.

**La page de référence n'est pas stricte** [F]. Strict veut dire : le catalogue seulement, s'arrêter sur un manque. Elle a créé deux pièces (`MemberRow`, `MemberTagList`, dans `src/modules/`) et deux liens nus, faute de lien et de ligne de liste. Passée au relevé, elle donne deux marquages manqués (RV7). D69 la dira **« composée avec soin avant les modes »**, pas « stricte » [P].

## 5. Les données et la liste d'Installer

- **`COUP_DE_MAIN`** : `role: 'Responsable du réseau'`, le même que celui de Solène Vasseur dans `ANIMATION` [F], et `equipe: 'Équipe de Quai Nord'`, pour que « de l'équipe » s'affiche [P]. Écrits par `fabriquer-membres.js`. La page de référence ne les montre pas : planches inchangées.
- **`docs/attendus/etape-10-exercices.md`, section 8**, trois lignes de plus, rien de corrigé : **R20** l'étiquette n'a ni icône ni ton fort, les ouvertures ne se détachent pas ; **R21** ni conteneur ni ligne de liste : la liste n'a pas de carte, une ligne prend cinq lignes de texte ; **R22** l'aplat garde sa couleur claire en sombre : règle à revoir. La case à 1,51:1 y est déjà (R16).

## 6. Biais acceptés

- Le brief d'Inventorier ne nomme ni le skill, ni les marques, ni les données : c'est une mesure de plus. Composer, lui, nomme le skill.
- La copie de ds-lab garde `docs/feuille-de-route.md`, qui liste des manques (B3, B6, B7, B9). Une équipe l'aurait aussi : elle n'est pas cachée, le relevé dit si elle a été lue.
- D69, README et ARCHITECTURE restent lisibles dans la copie : ils ne disent rien de la liste de référence.
- En bras B de Composer, le carnet et `rapport.md` coexistent.
- La liste de référence et la page de référence ont le même auteur.

## Tests

| Fichier | Tests |
|---|---|
| `test/app-fictive.test.js` | **AF5** : `role` et `equipe` ; le rôle égale celui d'`ANIMATION` |
| `test/exercices.test.js` | **EX6** la liste de référence et la description brute ne sont ni dans l'app ni dans la copie. **EX7** les trois briefs ; celui de Composer finit par la nouvelle ligne, mot pour mot. **EX9** le départ d'Inventorier égale celui de Composer à l'octet ; ni `src/provisoire/`, ni `inventaire.md`, ni `rapport.md`. **EX10** le brief d'Inventorier commence par la description brute à l'octet et finit par le paragraphe ; chaque pièce de la référence a un motif, et chaque `Ds…` et chemin qu'elle cite existe au départ |
| `test/banc.test.js` | **BN5** le message nomme quatre exercices. **BN6** un passage d'Inventorier : brief joint, `brief-seul.txt` sans le paragraphe, relevé sans construction ni planche |
| `test/releve.test.js` | **RV5** un inventaire simulé : trouvées, manquées, jamais manquée une pièce R, `Ds…` et chemin qui n'existent pas, lignes hors liste, fichier touché en dehors. **RV6** un journal simulé : `Read`, commande, motif, appel du skill, clone ; repli sur `session.jsonl`. **RV7** pièces marquées et manquées, pièces de Vuetify sans `Ds…`, rapport absent, partiel, complet ; la page de référence |

`npm test` : 1 095 + 6 = **1 101** [H]. Aucun fichier de test ajouté, aucune dépendance. L'atelier n'est pas touché : la preuve est celle de la CI. Les autres contrôles à 0, `npm audit` aux trois endroits. CI sous 4 min [H : un départ de plus à fabriquer].

## Commits

| Commit | Contenu |
|---|---|
| C1 | Cet attendu ; les données (AF5) ; R20 à R22 |
| C2 | Inventorier : configuration, brief, liste, pose, relevé (EX6, EX7, EX9, EX10, BN5, BN6, RV5, RV6) ; D69 |
| C3 | Composer en mode libre marqué : brief et relevé (EX7, RV7) ; D69 complétée |

README, ARCHITECTURE et identifiants dans chaque commit qui les touche. Un résumé du diff, montré **avant** chaque commit. **À l'arrêt 2** : les comptes, et les deux relevés sur un travail simulé.

## Hors périmètre

Tout passage, B-9 compris ; le marquage à l'écran des pièces provisoires (tableau des améliorations) [C] ; les modes dans le skill ; toute correction de ds-lab.
