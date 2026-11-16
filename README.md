# ds-lab

Laboratoire de design system multi-marque, de l'audit à la génération par IA. Marques fictives uniquement (la marque d'entraînement s'appelle Orbe Café).

## Le besoin

Une équipe hérite d'un produit sans design system : des centaines de valeurs écrites en dur, une marque par client, des textes qui échouent au contraste. Elle veut passer à un système sans tout redessiner et sans casser l'existant.

Une migration ne se fait pas à l'aveugle. Elle a trois phases, et la difficulté n'est pas au même endroit :

| Phase | Ce que c'est | Qui la fait |
|---|---|---|
| 1. Définir la cible | Le design system voulu : échelles, usages, ce qu'un client peut changer ; puis créer les jetons | Le designer. Aucune règle ne la remplace |
| 2. Faire la correspondance | Rattacher chaque valeur existante à la cible, selon son usage | Des règles pour ce qu'elles savent trancher, le designer pour le reste, en voyant l'effet |
| 3. Appliquer | Remplacer dans le CSS, puis vérifier | Le développeur et son agent. Mécanique, **une fois les phases 1 et 2 faites** |

`ds-lab` sert les trois : il mesure l'existant, vérifie la cible, range ce qu'une règle sait trancher, montre au designer en situation ce qui demande un jugement, et remet au développeur une consigne qu'un agent applique telle quelle, vérifiée avant et après.

Sur les pages fictives d'Orbe Café, une fois la cible posée (valise d'Orbe Café, réduction du 16/11/2026) : 90 lignes, dont 35 déjà sur la cible. Sur les 55 qui changent, les règles en tranchent 27 (15 d'office, 10 corrections, 2 hors table) ; le designer valide les 14 proches et tranche les 14 décisions.

## Ce que fait l'outil

```
npm run audit  -- <adresse> [options]                        mesurer l'existant
npm run reduce -- <adresse> --target <cible.json> [options]  ranger, revoir, produire la consigne
npm run marque -- <adresse> --prefix <préfixe> [options]     lire la marque d'un site avant la réduction (ne décide rien)
npm run login                                                enregistrer une session (dans .auth/)
npm run verify -- <adresse> --reference <dossier> [--save] [--sources <fichier>]   vérifier qu'une page n'a pas bougé (pixels, arbre d'accessibilité) ; avec --sources, ses éléments tiers sont masqués, comme dans les références de reduce --sources
npm run apply  -- --modifications <fichier> --racine <dossier> [--essai]   appliquer au CSS la part tranchée
npm run demo   -- [--racine <dossier>]                       servir la marque fictive en local
npm run saisie     -- <entree.json>                          saisir une marque : échelles, couche marque, contraste ; refus avec motif
npm run contraste   -- [--paires <fichier>] [--marque <dossier>]   contrôler les paires de rôles de couleur
npm run espacements -- [--semantique <fichier>]              contrôler les espacements par relation
npm run typo        -- [--semantique <fichier>] [--primitives <fichier>] [--marque <fichier>]   contrôler les styles de texte
npm run types                                                vérifier les types JSDoc de src/ (non strict, sans rien émettre)
npm test
```

`npm run reduce` produit trois fichiers, quatre avec `--tokens` :

| Fichier | Pour qui | Contenu |
|---|---|---|
| `revue.html` | Le designer | Chaque changement en situation ; les décisions à prendre ; export de `decisions.json` |
| `migration.md` | Le développeur | La table, les décisions, les exceptions, puis une consigne pour un agent |
| `table.json` | L'outil | La proposition et la synthèse. Le tour suivant relit `decisions.json`, exporté depuis la revue et passé avec `--decisions` |
| `modifications.json` | `npm run apply` | Avec `--tokens` : chaque déclaration à modifier (feuille, ligne, sélecteur, propriété, valeur écrite attendue, nouvelle valeur), les commentaires à poser, le contenu de `tokens.css` |

Le site audité n'est jamais modifié : les nouvelles valeurs sont posées dans le navigateur de l'outil, le temps des captures. Options utiles : `--tokens` (nommer les lignes par les jetons DTCG), `--decisions` (relire les choix du designer), `--live` (fenêtre avec une barre avant / après), `--viewport 390x844` (mobile).

`npm run apply` modifie une copie du site, à la racine donnée : il remplace chaque déclaration de `modifications.json` si la valeur écrite est bien celle attendue (sinon, un écart), pose les commentaires et écrit `tokens.css`. Relancé sur une copie déjà migrée, il ne change aucune feuille. Il ne touche pas au HTML ; il écrit `reste.md`, la consigne de ce qui reste pour l'agent (lien vers `tokens.css`, attributs d'accessibilité, écarts). `--essai` n'écrit rien. Il sort en 0 si tout est appliqué ou déjà appliqué, en 1 s'il reste au moins un écart (`--essai` compris), en 2 sur une panne : feuille illisible ou CSS invalide, et rien n'est écrit (D18).

Codes de sortie de la chaîne (D18) : `npm run audit` sort en 2 si une page n'a pas pu être mesurée (l'avertissement nomme l'étape : navigation, feuilles, mesure), si sa trace est en panne ou si le script v1 y échoue ; l'audit est alors écrit, incomplet ; si aucune page n'est mesurée, rien n'est écrit. `npm run reduce` s'arrête en 2 dès qu'une page tombe, ou si une couleur de marque de la cible est illisible ; il affiche les avertissements de navigation (statut HTTP, redirection, feuilles illisibles), les sélecteurs tiers invalides et les clés de `decisions.json` qui ne visent aucune ligne ni carte, sans s'arrêter. `npm run marque` affiche aussi les avertissements de navigation. Pour toutes les commandes, une erreur d'usage tient en une ligne préfixée par la commande, sortie 2, sans l'aide ; `-h` donne l'aide.

## Le parcours d'une décision

1. **Audit** : ce qui s'affiche vraiment, par usage.
2. **Cible** : la valise et ses jetons.
3. **Table** : chaque valeur × usage rangée dans une classe (voir le glossaire).
4. **Revue** : le designer choisit, en voyant l'effet sur tous les éléments touchés.
5. **Consigne** : `migration.md`, avec les mêmes identifiants que la revue ; ce qui n'est pas choisi est marqué « ne touche pas ».
6. **Contrôle** : l'outil relancé sur le CSS modifié, sur les pages de la table et sur des pages témoins jamais vues.

## Étape 3 : nommer les rôles

La cible est écrite en quatre couches de jetons DTCG. Les couches communes à toutes les marques sont dans `tokens/commun/` ; chaque marque a son dossier, `tokens/orbe-cafe/` pour Orbe Café :

| Couche | Fichier | Ce qu'elle nomme |
|---|---|---|
| Primitives | `tokens/commun/primitives.tokens.json` et `tokens/commun/statuts.tokens.json`, communes ; échelles de la marque à part (`tokens/orbe-cafe/primitives.tokens.json`, ou `echelles.tokens.json` générées) | Les valeurs : échelles de couleur, espaces, tailles de texte, graisses, rayons |
| Marque | `tokens/orbe-cafe/marque.tokens.json` | Les emplacements qu'un client remplit (primaire, accent, statuts, polices) et la règle des pleins |
| Rôles | `tokens/commun/semantique.tokens.json` | Les usages : couleurs de fond, de texte et de bordure, espacements par relation, styles de texte ; chacun en alias vers la marque ou une primitive |
| Paires | `tokens/commun/paires.json` | Les paires de rôles devant / fond et leur seuil de contraste, les exceptions écrites et les paires interdites |

Changer de marque, c'est changer la couche marque : les rôles restent les mêmes. Chaque marque a un resolver au format DTCG 2025.10, `marque.resolver.json`, qui réunit ses jeux de jetons et déclare deux contextes : le mode (clair, sombre) et la largeur (large, étroit). Un contexte échange des valeurs sous les rôles sans en changer un seul ; en étroit, seuls l'écart de section et les grands textes changent (`tokens/commun/largeur.etroit.tokens.json`). Trois commandes contrôlent la cible ; chacune sort en 0 si tout passe, en 1 si une règle échoue, en 2 si elle n'a pas pu juger (fichier absent ou illisible, option inconnue, panne), avec un message d'une ligne (D18) :

- `npm run contraste` : chaque paire de rôles atteint son seuil WCAG 2.1, sauf exception écrite ; les paires interdites sont affichées. `--mode sombre` et `--largeur etroit` choisissent le contexte (clair et large par défaut).
- `npm run espacements` : écarts strictement croissants, valeurs en étroit, règles de proximité ; les primitives sans rôle sont affichées.
- `npm run typo` : règles des styles de texte (hauteurs de ligne, hiérarchie en large et en étroit, consigne de hauteur de capitale des titres) ; les primitives sans rôle sont affichées.

Trois planches montrent la cible en situation : `tokens/orbe-cafe/roles.html`, `tokens/orbe-cafe/espacements.html`, `tokens/orbe-cafe/typo.html`, écrites par `node src/cli/planche.js [roles|espacements|typo]` (les trois sans argument). Les règles et leurs raisons sont dans `docs/regles.md`, les décisions dans `docs/decisions.md`.

## Étape 4 : saisir une marque

Une marque entre par un fichier, `tokens/orbe-cafe/entree.json` pour Orbe Café : un nom, une couleur primaire, un accent facultatif et la police des titres : ses noms de familles, et ses fichiers WOFF2 si le client les donne (`{ "familles": [...], "fichiers": [...] }`, chemins relatifs à l'entrée). Sans fichier, la police est acceptée par ses noms et la saisie l'affiche « non contrôlée » ; avec fichiers, elle lit ses mesures (unités par em, hauteur de capitale, hauteur d'x, ascendante, descendante), ses graisses, sa licence et sa couverture (`src/polices/`), puis mesure dans Chromium l'encre de deux lignes de chaque style de titre, en large et en étroit, avec la consigne de hauteur de capitale (D17) : taille utilisée, hauteur de capitale obtenue, encre (capitale accentuée de la ligne 2 sur descendante de la ligne 1) et écart avec la hauteur de ligne, affichés. La police du texte est celle du produit, commune à toutes les marques (`tokens/commun/police.tokens.json`, D16) ; une entrée peut la remplacer par `polices.texte`. `npm run saisie -- <entree.json>` génère les échelles (pas 9 = couleur saisie), écrit la couche marque et le resolver à côté de l'entrée, puis lance `npm run contraste` sur cette marque.

| Sortie | Quand | Ce qui est écrit |
|---|---|---|
| 0 | Marque acceptée | `marque.tokens.json`, `marque.resolver.json`, et `echelles.tokens.json` si une échelle est générée |
| 1 | Marque refusée : entrée invalide, `checkValise` en échec sur une échelle générée, paire de rôles sous son seuil, en clair ou en sombre, ou police des titres refusée par un garde-fou (format WOFF2, graisses des titres, signes français, licence déclarée, hauteur de capitale) ou par son encre (deux lignes qui se touchent sur un style de titre), ou fichier de police que le navigateur refuse de charger | Rien ; chaque motif est affiché avec son mode, `(clair)` ou `(sombre)` |
| 2 | Panne, la marque n'a pas pu être jugée (D18) : aucun fichier donné, fichier absent ou JSON illisible, couche commune cassée, Chromium qui ne se lance pas pendant le contrôle d'encre ; message d'une ligne | Rien. Exception : si le contrôle `contraste` relancé après écriture ne conclut pas, ou trouve une paire en échec (incohérence de l'outil), les fichiers sont écrits et le message le dit |

Sans accent, l'accent se replie sur le neutre (D05). Les couches communes (neutres, statuts, rôles, paires, espaces, typo) sont lues dans `tokens/commun/`. Orbe Café nomme ses échelles existantes (`{ "echelle": "bleu" }`), forme réservée à elle seule : sa couche marque est réécrite à l'identique. Les règles et la raison sont dans D13 (`docs/decisions.md`) ; le contrat tient en une page, `docs/contrat-de-marque.md`.

La saisie écrit aussi le mode sombre de la marque : une échelle sombre pour le primaire et l'accent, générée depuis le même pas 9, et une couche marque sombre. En sombre, la page est un gris très foncé (`#121212`) et chaque surface posée au-dessus est plus claire ; les textes de couleur sont plus lumineux (pas 11 à 9:1 sur la page) ; le bouton prend la version lumineuse de la couleur du client (pas 11, texte au pas 1), l'aplat plein garde la couleur exacte. Neutres et statuts sombres sont communs (`tokens/commun/mode.sombre.tokens.json`, écrit par `node src/cli/sombre.js`). Les rôles ne changent pas d'un mode à l'autre ; les cibles sombres sont des hypothèses jugées sur image.

Trois marques fictives sont saisies de la même façon, toutes acceptées :

| Marque | Primaire | Accent | Plein du primaire |
|---|---|---|---|
| Atelier Lavandine (`tokens/atelier-lavandine/`) | violet moyen | jaune | soutenu : couleur exacte, texte blanc, survol par voile noir de 15 % |
| Écume et Sel (`tokens/ecume-et-sel/`) | cyan clair | orangé | clair : couleur exacte, texte au pas 12 |
| Grenat Papeterie (`tokens/grenat-papeterie/`) | grenat foncé | aucun, repli sur le neutre | sombre : couleur exacte |

Chaque marque a deux niveaux d'aplat non cliquables, clair (pas 3) et plein (valeur du bouton), et un texte de marque pour les grands titres, choisi à la saisie pour tenir 3:1 sur les fonds clairs. Sur l'aplat plein, texte, bouton et anneau de focus sont retournés (D14).

Calibrage de la règle des pleins : `node src/cli/calibrage.js --sortie <dossier> <entree.json>...` écrit `calibrage.html` et `calibrage.md`. La table a une colonne par marque : verdict de la saisie, classe selon le générateur, classe selon la règle des pleins, couleur exacte sur le bouton ou non, et trois indicateurs qui ne refusent rien (primaire grise, statut le plus proche, accent proche du primaire). Le balayage montre, pour des teintes de 30° à 140° et des clartés de 0,60 à 0,92, le bouton selon la règle (D04) et, pour une case moyenne, celui du cas clair avec son contraste. Il ne change aucun seuil. Avec des marques témoins, la sortie va dans `local/`.

## Glossaire

### Le système

| Terme | Définition |
|---|---|
| Design system | Les valeurs, composants et règles qu'un produit partage, écrits une fois et appliqués partout |
| Valeur en dur | Une couleur ou une taille écrite directement dans le CSS (`#595959`, `10px`) |
| Jeton (token) | Une valeur nommée, écrite une fois dans un format neutre (`espace.8`) ; la variable CSS ou Dart en est la traduction |
| DTCG | Le format standard des jetons (2025.10) |
| Primitive | Un jeton qui nomme une valeur : `couleur.bleu.11`, `espace.8` (dans la valise, le pas s'appelle `bleu-11`) |
| Rôle | Un jeton qui nomme un usage : `texte.secondaire`, `ecart.entre-composants` |
| Échelle | Une suite ordonnée de valeurs pour une famille |
| Pas | Une position dans l'échelle. Pour une couleur, le pas dit l'usage : 1-2 fonds, 3-5 composants, 6-8 bordures, 9-10 pleins, 11-12 texte |
| Tranche | Les pas réservés à un usage (le texte prend 11 ou 12) |
| Plein | Un fond coloré qui porte un texte (bouton, étiquette) ; le texte posé dessus s'appelle onSolid |
| Valise | La cible générique : 12 pas, valeurs générées par contraste visé, règles d'usage. On change de marque en changeant les valeurs derrière les noms |
| Contrat de marque | Ce qu'un client peut changer, et ce que le système garantit : [docs/contrat-de-marque.md](docs/contrat-de-marque.md) |

### La méthode

| Terme | Définition |
|---|---|
| Audit | Mesurer l'existant. **Déclaré** : ce que contient le CSS. **Rendu** : ce qui s'affiche (souvent beaucoup moins) |
| Usage | Le rôle d'une valeur dans la page : texte, fond, bordure, marge, retrait, gouttière. L'usage choisit la tranche, pas la ressemblance |
| Relation | Ce que sépare un espace : dans le composant (un champ et son message) ou entre composants (deux champs) |
| Réduction | Ranger l'existant dans la cible, sans redessiner |
| Table | Une ligne par valeur × usage : nouvelle valeur, jeton, classe, origine dans le CSS. Une couleur vue seulement au survol, au focus ou à l'appui, écrite par le site, a sa ligne, marquée par son état (D19) |
| Classes | **inchangé** (déjà sur la cible) · **auto** (écart invisible, appliqué) · **proche** (écart faible, appliqué par défaut, refusable un par un) · **correction** (contraste réparé d'office, annulable) · **décision** (le designer tranche ; toute valeur à égale distance de deux pas en est une, sans défaut, D20) · **hors table** (laissé tel quel, avec son motif) |
| Règles | Ce que le code décide seul (R1 à R9) : l'usage choisit la tranche, le contraste est vérifié, la mise en page et les éléments tiers sont exclus, une décision n'est jamais appliquée sans réponse |
| Contraste | Rapport de luminance entre un texte et son fond. Seuils retenus (WCAG 2.1 AA) : 4,5:1 pour le texte ; 3:1 pour le grand texte (24 px, ou 18,67 px en gras) et pour une bordure de champ |
| Marge, retrait, gouttière | Espace autour d'un élément, à l'intérieur de ses bords, entre les enfants d'un conteneur |

### L'outil

| Terme | Définition |
|---|---|
| Pages en désordre | Pages fictives écrites avec des défauts connus (`fixtures/marque-demo/desordre/`) |
| Piège | Un défaut observé sur un vrai site, reproduit sur une page fictive et écrit avant elle, pour prouver qu'une règle le corrige |
| Simulation | Les nouvelles valeurs posées dans le navigateur, le temps des captures |
| Revue | La page où le designer voit chaque changement et décide |
| Carte de décision | Dans la revue : une image, un sélecteur de versions, « Choisir cette version » |
| Version | La valeur actuelle ou un candidat, montrés au même endroit. « Le plus proche » n'est pas une recommandation |
| Identifiant et titre | `esp-17 Marge basse · champ « Nom » et 4 autres (champs, textes)`, le même dans la revue, `migration.md` et la fenêtre en direct |
| Fenêtre en direct | Le site avec une barre pour appliquer les changements une ligne ou une famille à la fois (`--live`) |
| Rattacher | Remplacer une valeur déjà sur la cible par la variable de son jeton : rien ne change à l'écran, mais la valeur suit désormais le jeton |
| Repli | L'ancienne valeur, écrite en second dans `var(--jeton, ancienne valeur)` comme la source l'écrivait (rem, rgb()) : la page garde son rendu si `tokens.css` manque. Retiré en fin de migration |
| Consigne pour l'agent | La fin de `migration.md` : déclarer les variables CSS à partir des jetons (`tokens.css`), remplacer, ne pas toucher, vérifier |
| Pages témoins | Pages que les décisions n'ont pas vues, pour vérifier les effets de bord |
| Contrôle après modification | Relancer l'outil sur le CSS modifié et comparer au prévu |

### La façon de travailler

| Terme | Définition |
|---|---|
| Lot | Un ensemble de changements avec un seul objectif |
| Attendu | Ce qu'on doit voir, écrit et validé avant le code |
| Passage | Le designer utilise l'outil seul ; ce qui bloque devient le lot suivant |
| `local/` et `.auth/` | Données de vrais sites (`local/`) et sessions enregistrées (`.auth/`) : jamais versionnées |

## Dépôt

| Dossier | Contenu |
|---|---|
| `src/` | Audit, réduction, simulation, rapports |
| `tokens/commun/` | Couches communes à toutes les marques : primitives, statuts, rôles, paires, contexte étroit |
| `tokens/orbe-cafe/` | Jetons DTCG de la marque fictive (entrée, échelles, marque, resolver) et les trois planches |
| `tokens/atelier-lavandine/`, `tokens/ecume-et-sel/`, `tokens/grenat-papeterie/` | Trois marques fictives saisies par fichier (lot 2 de l'étape 4) |
| `docs/` | Règles du design system, décisions, contrat de marque, attendus des prochains lots |
| `fixtures/marque-demo/` | Pages fictives, pièges, cibles, attendus |
| `fixtures/polices/` | Quatre polices d'essai sous licence libre, chacune avec sa licence (étape 4c) |
| `test/` | Tests, dont `noms-interdits` qui refuse tout nom réel dans un fichier ou un message de commit |

Dépendances : `playwright-core` (navigateur), `postcss` et `@projectwallace/css-analyzer` (lecture du CSS), `culori` (conversions de couleurs et ΔE ; oracle des contrastes dans les tests), `pixelmatch` et `pngjs` (comparaison de captures, lot V). Dépendances de développement : `typescript` 7.0.2 et `@types/node` 22.20.5, pour `npm run types` seulement.

Règles : marques fictives uniquement ; rien de `local/` ni de `.auth/` dans un fichier versionné ; attendu avant le code. Carte du code : [ARCHITECTURE.md](ARCHITECTURE.md).

## Limites

- Validé sur des pages fictives et sur un vrai site en lecture seule, pas encore avec une équipe.
- Le CSS migré garde un repli à retirer en fin de migration : `var(--jeton, ancienne valeur)` reste tant que toutes les pages ne sont pas passées aux jetons.
- Les pseudo-éléments (icônes) ne sont pas simulés ; le contraste du texte sur image est mesuré mais marqué à vérifier, car le fond réel est incertain.
- `npm run apply` vaut là où la feuille servie est le fichier source : une feuille compilée, minifiée ou assemblée par un outil de build n'a pas les lignes du fichier qu'on modifie.
- Les contrastes ne sont pas mesurés sur les pages témoins : seules les pages de la table entrent dans les paires texte sur fond et dans la liste des paires sous le seuil.
- La dette connue est tenue à jour dans [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

Licence MIT.
