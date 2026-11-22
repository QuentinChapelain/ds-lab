# Identifiants de règles

Les sorties de l'outil citent des règles par un identifiant court, entre parenthèses : « (R9) », « (M6) ». Cette page dit, pour chaque identifiant affiché, sa règle en une phrase, où elle est codée et où elle s'affiche. Les règles du langage produit sont dans `docs/regles.md` : design system (DS1 à DS17), nommage (NM1 à NM4), composants (CP1 à CP8), documentation (DOC1 à DOC5) ; les décisions (D01 à D57) dans `docs/decisions.md`.

Renommer un identifiant affiché change une sortie : c'est une décision à part, pas un nettoyage.

## Collisions

Un même identifiant désigne plusieurs choses. À lire avant de citer l'un d'eux.

| Identifiant | Sens | Où on le lit |
|---|---|---|
| **R1 à R9** | Règles de la **réduction** (classe d'une ligne) | `revue.html`, `migration.md`, `modifications.json`, `table.json` |
| | Conventions du **rendu de l'audit** (R1 à R18, avec des « bis ») | rapport d'audit (`src/report/differences.js`) |
| **D4** | Convention D4 du **déclaré de l'audit** : mots-clés globaux exclus | rapport d'audit |
| | **D04** de `docs/decisions.md` : règle des pleins | `$description` des jetons écrits par la saisie |
| | Ancienne règle des **conflits de déclarations** | attendus seulement ; le code dit « conflit » en clair |
| **D2, D7** | Conventions du déclaré de l'audit | rapport d'audit |
| | D02, D07 de `docs/decisions.md` (deux chiffres) | documentation |
| **C5** | Cas C5 de `test/candidats.test.js` : le défaut est le pas le plus proche de toute l'échelle | tests, commentaire de `dimensionRow` (`src/reduce/propose.js`), D20 de `docs/decisions.md` |
| | Cas C5 de `test/contraste-modes.test.js` (contrat de la saisie) | tests, `ARCHITECTURE.md`, D31 de `docs/decisions.md` |
| | Ancien renvoi du motif d'égalité, devenu D20 (les sorties ne citent plus C5) | attendus seulement |
| **B1 à B5** | Tests B1 à B5 de `test/bouton-jetons.test.js` : jetons du bouton, contrastes de l'icône | tests, `ARCHITECTURE.md`, D52 |
| | Trous B1 à B13 de la feuille de route (`docs/feuille-de-route.md`) | fiches, feuille de route, `KNOWN_ISSUES.md` |
| **R-1 à R-9** | Identifiant et titre d'une ligne, captures (revue) | commentaires et titres de tests, jamais affichés |

Dans le code, `D2` et `D4` sont aussi des noms de constantes de mise en forme (`{ decimales: 2 }`, `{ decimales: 4 }`), sans lien avec ces règles.

## Réduction et migration (`npm run reduce`)

| Id | Règle | Codée dans | Affichée dans |
|---|---|---|---|
| R1 | L'usage choisit la tranche (texte 11-12, bordure 6-8, fond 1-5, plein 9-10), la proximité choisit le pas | `src/reduce/propose.js` | — |
| R2 | Une ligne auto ou proche qui fait passer une paire sous son seuil devient une décision | `src/reduce/propose.js` | motif : `revue.html`, `migration.md`, `table.json` |
| R3 | Une ligne par valeur × usage | `src/rendered/aggregate.js`, `src/reduce/propose.js` | — |
| R4 | À plus de ΔE 10 de toute la valise : hors table, aucune échelle | `src/reduce/propose.js` | motif et section hors table : `revue.html`, `migration.md`, `modifications.json`, `table.json` |
| R5 | Une décision sans réponse, ou une ligne hors table, n'est pas appliquée | `src/reduce/propose.js`, `src/report/review.js` | `revue.html`, `migration.md` |
| R6 | Les éléments tiers sont exclus de la simulation | `src/browser/simulate.js` | — |
| R7 | Espacement négatif, au-delà de 64 px ou marge auto : hors table, mise en page ; un rayon d'au moins la moitié du plus petit côté est une pilule | `src/reduce/propose.js`, `src/rendered/aggregate.js` | motif : `revue.html`, `migration.md`, `modifications.json`, `table.json` |
| R8 | Fond plus sombre que le pas 10 le plus sombre de la valise : hors table ; un texte posé dessus est une décision | `src/reduce/propose.js` | motif : `revue.html`, `migration.md`, `modifications.json`, `table.json` |
| R9 | Correction : la paire la plus défavorable échoue avant et passe après ; appliquée par défaut, annulable | `src/reduce/propose.js` | `revue.html`, `migration.md`, `table.json` |
| D20 | À égale distance de deux pas, l'outil ne tranche pas : au designer de choisir (décision de `docs/decisions.md`) | `src/reduce/propose.js` | motif : `migration.md`, `table.json` |
| J1 | Un candidat qui échoue au contraste alors que la valeur actuelle passe n'est jamais le défaut ; il est grisé, avec sa raison | `src/reduce/propose.js`, `src/report/review.js` | motif : `revue.html`, `migration.md`, `table.json` |
| M1 | Un emplacement de marque gris (chroma OKLCH < 0,02) rejoint neutre | `src/brand/brand.js` | `migration.md` (marque déclarée) |
| M3 | La valeur d'un emplacement de marque, ou d'une variante, va sur l'échelle de cet emplacement ; l'usage choisit le pas | `src/brand/brand.js`, `src/reduce/propose.js` | `migration.md` (marque déclarée) |
| M4 | Les échelles de statut sont réservées aux vrais états (aria-invalid, role="alert", message relié) ; sinon, c'est une décision | `src/reduce/propose.js` | motif : `revue.html`, `table.json` |
| M5 | Une correction de couleur de marque à plus de ΔE 10 devient une décision | `src/reduce/propose.js` | motif : `revue.html`, `table.json` |
| M6 | Une décision propose aussi le pas proche, avec le fond de la paire en échec déplacé | `src/reduce/propose.js`, `src/report/consigne.js` | consigne de `migration.md` |
| M7 | Quand le back-office et la feuille du client se contredisent, c'est signalé et la cible tranche | `src/brand/brand.js`, `src/report/migration.js` | `migration.md` |

Les règles M ne s'affichent qu'avec une marque déclarée (bloc `brand` de la cible). Définitions d'origine : R1 à R9 dans l'en-tête de `src/reduce/propose.js`, `fixtures/marque-demo/expected-desordre-valise.json` et `fixtures/marque-demo/expected-pieges.json` ; M0 à M7 (il n'y a pas de M2) dans `fixtures/marque-demo/expected-marque.json`.

Dans le seul script de `revue.html`, des commentaires citent P3, C7, C10, C12, J1 et J7 ; ce sont des sorties, mais pas des textes lus par le designer.

## Audit (`npm run audit`)

Le rapport d'audit compare l'outil au script v1 et cite ses conventions.

| Id | Règle | Codée dans | Affichée dans |
|---|---|---|---|
| D2 | Une occurrence est un composant de valeur tel qu'écrit : les raccourcis ne sont pas développés | `src/declared/analyze.js` | rapport d'audit |
| D4 | Les mots-clés globaux (inherit, initial, unset, revert, revert-layer) sont exclus de toutes les familles | `src/lib/values.js` | rapport d'audit |
| D7 | Couleurs : toutes les déclarations, propriétés personnalisées comprises ; transparent est exclu | `src/lib/values.js`, `src/declared/analyze.js` | rapport d'audit |
| R1 bis | Les éléments à opacity 0, ou sous un ancêtre à opacity 0, sont écartés du rendu | `src/browser/rendered.js` | rapport d'audit |
| R3 bis | La valeur d'un champ, et le texte indicatif d'un champ vide, sont du texte | `src/browser/rendered.js` | rapport d'audit |
| R5 bis, R6 bis | Couleurs rendues : chaque couleur de bordure distincte, contour, ombres, soulignement, dégradés, fill et stroke | `src/browser/rendered.js` | rapport d'audit |
| R15 | Survol, focus et actif forcés sur un échantillon, rapportés à part | `src/browser/states.js` | rapport d'audit |
| R17 | Les composants tiers du fichier de sources sont écartés du rendu | `src/browser/rendered.js` | rapport d'audit |

Définitions d'origine : D1 à D15 et R1 à R14 dans `fixtures/marque-demo/expected.json` ; R1 bis à R18 dans `fixtures/marque-demo/expected-cas-limites.json`.

## Jetons et valise

| Id | Règle | Codée dans | Affichée dans |
|---|---|---|---|
| DS1, DS6 | Règles du design system (`docs/regles.md`) | `src/tokens/pleins.js`, `src/tokens/resolver.js` | `$description` des jetons écrits par la saisie |
| DF1 à DF7, CS1 à CS5 | Défauts et consignes détachés d'une règle (`docs/regles.md`, D65) | `src/tokens/resolver.js` (DF2) | `$description` du modificateur de largeur des resolvers, descriptions de la table du thème (DF1) |
| D04, D05 | Décisions (`docs/decisions.md`) | `src/tokens/pleins.js`, `src/tokens/saisie.js`, `src/report/calibrage.js` | `$description` des jetons écrits par la saisie ; D04 aussi dans la page de calibrage |
| G5 | La valise n'est écrite que si elle passe tous ses contrôles (checkValise) | `src/valise/generate.js` | message d'erreur de la génération |

## Identifiants des commentaires et des tests

Les autres identifiants ne sortent pas de l'outil ; ils nomment des cas de test et relient un commentaire au test qui le vérifie. Chacun est défini dans l'en-tête de son fichier de test ou dans l'attendu de ses fixtures :

| Famille | Sujet | Défini dans |
|---|---|---|
| A1 à A7 | Règle des initiales de `DsAvatar`, jetons, contrastes et variables `ds-` de `DsAvatar` et `DsTag` dans les dix thèmes ; A5 et A6, fonds teintés, emplacements, valeurs et rapports (D59) ; A7, fond de `DsAvatar` (D63) | `test/avatar-etiquette.test.js` |
| AD1 à AD6 | Adresse stable des couches communes : écriture, lecture dans les quatre contextes, marque copiée hors du dépôt, pannes, ancien `$ref` relatif, feuille CSS (D66) | `test/adresse-commune.test.js` |
| AF1 à AF5 | App fictive du banc d'essai : versions de l'atelier, ni `Ds…` ni annuaire ni ds-lab, les dix membres en tête et les champs du brief, entrées des trois marques, 295 membres rejouables (D67, D68) | `test/app-fictive.test.js` |
| B1 à B5 | Jetons du bouton dans les dix thèmes, contrastes de l'icône du bouton à icône | `test/bouton-jetons.test.js` |
| BN1 à BN6 | Banc d'essai : exercice demandé, passage du bras A posé (copie cachée et sans historique, app de départ, skill, réglages, briefs), passage du bras B (hook, carnet), deux poses identiques, `verifier` depuis la copie (D67), passage d'Inventorier posé et relevé (D69) | `test/banc.test.js`, BN2 dans `test/relecteur.test.js` |
| C1 à C13 | Fenêtre des candidats, grisé des marges, bilan par usage | `test/candidats.test.js`, `test/e2e-candidats-revue.test.js`, `fixtures/marque-demo/expected-candidats.json` |
| E1 à E12 | Gardes des enveloppes (bouton, champ de texte, carte, bouton à icône, avatar, étiquette), découpage d'un composant `.vue` | `test/enveloppe-bouton.test.js` |
| EX1 à EX10 | Points de départ des exercices du banc : fichiers qui diffèrent d'un départ à l'autre, `verifier` à 0, composants et fiches copiés, aplat et exceptions du gabarit égaux aux jetons, pages dans le gabarit (D68), départ, brief et liste de référence d'Inventorier (D69) | `test/exercices.test.js` |
| G0 à G8 | Générateur de valise | `src/valise/generate.js`, `test/valise-generate.test.js`, `test/gris-neutre.test.js` |
| H1 à H4 | Jetons du champ de texte et de la carte dans les dix thèmes | `test/champ-carte-jetons.test.js` |
| I1 à I7 | Rattacher les valeurs inchangées à leur jeton | `test/e2e-migration.test.js`, `test/e2e-migration-decisions.test.js` (I3) |
| J1 à J9 | Captures, contraste des candidats, texte sur plein et sur image, panneau de la revue | `test/candidats-contraste.test.js`, `test/captures-hors-page.test.js`, `test/texte-sur-plein-candidats.test.js`, `test/revue-apercu.test.js`, `test/fond-sous-image.test.js` |
| K1 à K6 | Cartes « Texte sur plein » | `test/cartes-plein.test.js`, `test/cartes-plein-lignes-certaines.test.js` |
| L1 à L4 | Modules : aucune pièce de Vuetify (CP9), style de mise en page seulement (CP10), passage par la fabrique, refus de `MemberCard` et de `MemberList` mot pour mot (D61) | `test/modules.test.js` |
| MQ1 à MQ3 | Dossier des marques des trois contrôles (`--marques`) : un bloc par marque, les deux options ensemble, dossier vide ou absent (D66) | `test/dossier-des-marques.test.js` |
| P1 à P4 | Proximité des marges | `fixtures/marque-demo/expected-proximite.json` |
| R-1 à R-9 | Identifiant et titre d'une ligne, captures par version | `test/e2e-identifiants.test.js`, `test/e2e-versions.test.js` |
| RL1 à RL5 | Relecteur : marque cassée relue, `.vue` propre ou en dur, autre fichier, pose fusionnée et sans effet relancée, sans `DS_LAB` ou entrée illisible, page intouchée tue (D67) | `test/relecteur.test.js` |
| RV1 à RV6 | Relevé d'un passage du banc : composants, pièces de Vuetify, gabarit, signaux de ce que le brief remet à plus tard, commande entière (D68), inventaire face à sa liste, ce que la session a lu (D69) | `test/releve.test.js` |
| S1 à S4 | Modifications et `npm run apply` | `test/e2e-apply.test.js` |
| SK1 à SK6 | Textes du skill : fraîcheur, règles et défauts avec leur contrôle dans le dépôt de l'équipe, comptes, consignes et techniques, `SKILL.md`, retrait des choix de ds-lab, phrase de priorité (D66, D67) | `test/skill.test.js` |
| T0 à T5 | Rôles de couleur, paires, planche | `test/roles-statuts.test.js`, `test/roles-semantique.test.js`, `test/roles-paires.test.js`, `test/roles-planche.test.js` |
| U1 à U14 | Fiches des composants et des modules : en-tête et blocs générés, refus, anatomie, contrastes, marques, parties écrites, exemple, index et glossaire, mots refusés et plafond, table des noms ; U14, fiches des modules (D56, D57, D61) | `test/fiches.test.js` |
| VR1 à VR11 | `verifier` dans un dépôt fictif : tout passe, paire cassée en sombre, échelle redéfinie, valeur en dur, pannes, « À faire » de chaque bloc, dossier de lancement, copie du skill, pas d'échelle cassé en un bloc, style par fichier, bilan et forme des messages (D66, D67) | `test/verifier.test.js` |
| W1 à W9 | Fabrique commune des enveloppes et menus ; W9, CP1 : un composant sans événement refuse les attributs `on…` | `test/fabrique-enveloppes.test.js` |
| Y1 à Y3 | Parts de la CI : chaque fichier de test dans une part et une seule, aucun fichier absent, matrice de la CI et liste d'accord (D58) | `test/parts-de-la-ci.test.js` |

Ces identifiants de cas se répètent d'un fichier de test à l'autre avec un autre sens : G1 à G7 (`test/police-garde-fous.test.js` et `test/valise-generate.test.js`), C1 à C5 (`test/contraste-modes.test.js` et `test/candidats.test.js`), S1 à S7 (`test/saisie.test.js` et `test/e2e-apply.test.js`), J1 et J2 (`test/reduce-jetons.test.js` et la famille J), R1 à R5 (`test/resolver.test.js` et les règles R) ; E1, P1 et L1 désignent chacun des cas différents dans plusieurs fichiers. Un identifiant de cas n'a de sens que dans son fichier.
