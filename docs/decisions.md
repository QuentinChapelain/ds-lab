# Décisions

Trente et une décisions, chacune avec sa raison et sa conséquence. Aucune valeur n'est recopiée ici : elles se lisent dans `tokens/commun/` et dans le dossier de chaque marque.

### D01
- **Décision** : les rôles se nomment propriété.sens.emphase.état.
- **Raison** : la propriété d'abord dit où le rôle s'applique.
- **Conséquence** : un nouveau rôle suit ce schéma.

### D02
- **Décision** : un rôle qui porte la marque pointe vers un emplacement de la couche marque, jamais vers une teinte de marque ; les rôles neutres et de statut pointent directement vers leurs primitives, communes à toutes les marques.
- **Raison** : changer de marque sans réécrire les rôles.
- **Conséquence** : le fichier de rôles est le même pour toutes les marques.

### D03
- **Décision** : la paire texte sur fond est fixée et vérifiée à la saisie de la marque.
- **Raison** : pas de calcul par le navigateur.
- **Conséquence** : une marque qui échoue est refusée avant d'entrer.

### D04
- **Décision** : pleins du primaire et de l'accent, lus sur l'échelle, dans cet ordre. 1. Blanc ≥ 4,5 sur le pas 9 : couleur exacte, texte blanc ; survol par voile blanc de 8 % si le blanc atteint 5,5 (sombre), sinon par voile noir de 15 % (soutenu), valeur calculée et formule en `$extensions` dans les deux cas. 2. Sinon, pas 12 ≥ 7 sur le pas 9 et ≥ 4,5 sur le pas 10 : couleur exacte, texte au pas 12, survol au pas 10 (clair). 3. Sinon : pas 11, texte blanc, survol au pas 12 (moyen). Les quatre statuts gardent leur bouton d'avant l'étape 4, figé dans `src/tokens/pleins.js`. Aucun forçage de la couleur exacte.
- **Raison** : lisibilité jugée sur image le 15/11/2026 ; seuil 7 : un jaune saturé à 7,18, une turquoise à 7,19 et un vert à 7,22 jugés bons, 6,57 et 5,33 jugés mauvais. Survol soutenu : le pas 10 restait à ΔE 1,33 du repos, invisible ; le voile noir le met à ΔE 6,68 sur Atelier Lavandine. L'accessibilité est une obligation légale : pas d'option hors garantie.
- **Conséquence** : la couleur exacte du client est sur le bouton dès qu'un texte lisible s'y pose ; sinon le bouton prend le pas 11. Statuts figés pour que la couche marque d'Orbe Café reste identique ; le bouton d'avertissement garde un texte foncé à 5,77 (`KNOWN_ISSUES.md`). En sombre (lot 2 bis de l'étape 4b, décision sur image du 15/11/2026), une règle unique, sans valeur calculée ni condition par marque : le bouton prend la version lumineuse de la couleur du client, plein = pas 11 de l'échelle sombre, survol = pas 12, texte = pas 1 (7:1 au moins, DS1), statuts compris. L'aplat plein (`fond.marque.fort`, `texte.sur-marque`, bouton inversé) garde la couleur exacte du client dans les deux modes : en sombre, le bouton et l'aplat plein n'ont donc plus la même couleur.

### D05
- **Décision** : primaire = ce qui se clique ; accent = identité, rare, jamais porteur d'un sens ; sans accent saisi, repli sur un neutre.
- **Raison** : usage constaté dans les systèmes de référence.
- **Conséquence** : le bouton secondaire est neutre.

### D06
- **Décision** : une paire interdite porte sa règle de remplacement.
- **Raison** : c'est une décision de design, pas une exception.
- **Conséquence** : le contrôle l'affiche sans échouer.

### D07
- **Décision** : les bordures discrète et par défaut sont décoratives, jamais seules pour repérer un champ ou un état.
- **Raison** : elles sont sous 3:1.
- **Conséquence** : elles n'ont pas de paire.

### D08
- **Décision** : le rôle s'appelle marge-interieure et non retrait.
- **Raison** : « retrait » désigne l'alinéa en typographie.
- **Conséquence** : vocabulaire à garder.

### D09
- **Décision** : l'écart interne prend le plus petit pas non nul de l'échelle, et seul l'écart de section se réduit en étroit.
- **Raison** : majorité des systèmes de référence.
- **Conséquence** : voir DS4 et DS6 (`docs/regles.md`).

### D10
- **Décision** : onze styles de texte, un seul rôle d'affichage grand.
- **Raison** : contraintes du cas d'entraînement.
- **Conséquence** : ne pas ajouter un style jumeau d'un autre.

### D11
- **Décision** : le style mention est plus petit que corps.petit.
- **Raison** : le WCAG n'impose aucune taille minimale, et à taille égale les deux rôles étaient jumeaux.
- **Conséquence** : voir D10.

### D12
- **Décision** : les tailles de texte restent en px pour l'instant.
- **Raison** : l'outil de migration n'indexe pas le rem.
- **Conséquence** : voir `KNOWN_ISSUES.md`.

### D13
- **Décision** : une marque entre par un fichier d'entrée et `npm run saisie` ; une couleur saisie donne une échelle générée (pas 9 = couleur saisie), le nom d'une échelle existante est réservé à Orbe Café. Trois motifs de refus : entrée invalide, `checkValise` en échec sur une échelle générée, paire de rôles sous son seuil.
- **Raison** : D03, la paire est vérifiée à la saisie ; Orbe Café garde ses échelles écrites à la main.
- **Conséquence** : une marque refusée n'écrit rien. Primaire grise, primaire proche d'un statut et accent proche du primaire ne sont pas des refus : ils sont montrés dans la table de calibrage. Revue de code, lot 5 : la forme réservée à Orbe Café est remplacée par une règle commune, lue dans le dossier de la marque (D25).

### D14
- **Décision** : deux niveaux d'aplat de marque, non cliquables : clair (`fond.marque.discret`, pas 3 du primaire ; `fond.accent.discret`, pas 3 de l'accent) et plein (`fond.marque.fort`, valeur du plein du primaire). Sur l'aplat plein, tout passe en retourné : texte `texte.sur-marque`, bouton inversé (`fond.interactif.inverse`, `texte.sur-interactif.inverse`, dont seul le texte change au survol), anneau `bordure.focus.inverse`. Titres de marque : `texte.marque.grand`, pour l'affichage et les titres 1 et 2 seulement, pas 9 du primaire s'il tient 3:1 sur les fonds clairs, sinon 10, sinon 11, choisi à la saisie.
- **Raison** : créer du relief dans une page avec la couleur du client ; sur l'aplat plein, l'anneau au pas 11 tombait entre 1,00 et 1,55:1 pour six marques sur huit.
- **Conséquence** : sur `fond.marque.fort`, `texte.marque.grand`, `texte.interactif`, le bouton principal et `bordure.focus` sont des paires interdites, chacune avec sa règle (D06). `fond.accent.fort` reste aux petites surfaces.

### D15
- **Décision** : les couches communes à toutes les marques vivent dans `tokens/commun/` ; chaque marque a un resolver DTCG 2025.10 (`marque.resolver.json`), écrit par la saisie, lu par un lecteur maison (`src/tokens/resolver.js`). Deux modificateurs : mode (clair, sombre) et largeur (large, étroit). Un contexte remplace des jetons entiers ; le seuil de l'étroit est dans `$extensions["ds-lab.largeur"]` du modificateur.
- **Raison** : une même marque en clair et en sombre, en large et en étroit, sans changer un seul rôle ; un format qu'un outil DTCG standard lit, sans dépendance de plus.
- **Conséquence** : le fichier des rôles est le même dans tous les contextes ; un style de texte en étroit répète son composite entier. Mode sombre [H] (lot 2 bis) : page `#121212`, chaque surface posée au-dessus plus claire (fond.app, fond.discret, fond.surface, fonds de composant) ; neutres dessinés, textes au rapport du clair (12,75 et 5,49 sur la page) ; échelles de couleur générées depuis le même pas 9, contraste visé contre le noir, pas 11 à 9:1 sur la page et pas 12 à 12,75:1, à la chroma la plus forte que permet le gamut. `fond.surface` et `texte.sur-inverse` pointent vers `couleur.surface` et `couleur.sur-inverse` ; l'aplat plein vers trois emplacements communs, `marque.primaire.aplat`, `sur-aplat`, `aplat-survol` (`tokens/commun/aplat.tokens.json`), alias du plein en clair.

### D16
- **Décision** : en marque blanche, la police des titres (affichage, titres 1 à 3) est celle du client, entrée par `polices.titre` ; la police du texte (titre 4, corps, libellés, mentions, boutons) est celle du produit, commune à toutes les marques, déclarée une fois dans `tokens/commun/police.tokens.json`. `polices.texte` reste possible dans l'entrée et remplace la police du produit.
- **Raison** : décision de Quentin du 15/11/2026, 17 h 51 : le client ne change pas la police du texte, le système garde la capacité de la changer.
- **Conséquence** : une entrée sans `polices.texte` est acceptée ; sa couche marque n'écrit que `police.titre`, le resolver lit la police du produit avant la couche marque. Valeur de la police du produit : hypothèse (`KNOWN_ISSUES.md`).

### D17
- **Décision** : affichage et titres 1 à 3 portent une consigne commune de hauteur de capitale, `police.titre.hauteur-capitale` (`tokens/commun/police.tokens.json`), écrite sur chaque style dans `$extensions["ds-lab.hauteur-capitale"]` et rendue en CSS par `font-size-adjust: cap-height` ; la même pour toutes les marques, aucun réglage par police. Les hauteurs de ligne de ces styles sont relevées, sur la grille de 4 px : affichage grand 76 px en large et 48 px en étroit, affichage moyen 60 et 40, titre 1 40 en large ; titres 2 et 3 inchangés.
- **Raison** : décisions de Quentin du 15/11/2026, 18 h 10 et 19 h 59. La police du client change la hauteur visible des titres ; une consigne commune la ramène à la même hauteur de capitale. Les hauteurs de ligne de l'étape 3 avaient été calées sur des références sans capitales accentuées ; en français, É, À et Ê montent au-dessus de la ligne, et l'encre de deux lignes se touchait avec les trois polices d'essai (Oswald, EB Garamond, Cinzel). Georgia touchait déjà avant la consigne.
- **Conséquence** : le format DTCG n'a pas de propriété pour cette consigne : un outil DTCG standard lit le style sans elle. Une police dont l'encre de deux lignes se touche encore, ou dont le fichier n'a pas de hauteur de capitale, est refusée à la saisie ; l'encre se mesure dans Chromium (`src/polices/encre.js`), au pire cas : la capitale la plus haute du jeu de caractères sur la descendante la plus basse. Une police à capitale haute est rendue plus petite que sa taille nominale (Oswald : 14 %), une police à capitale basse plus grande (EB Garamond : 7,7 %). Rapport 0,7 : hypothèse, à juger sur image (`KNOWN_ISSUES.md`).

### D18
- **Décision** : toute commande a trois issues. 0 : tout passe. 1 : l'entrée a été lue et jugée : une règle échoue, ou la marque est refusée avec son motif. 2 : l'entrée n'a pas pu être jugée : fichier absent ou illisible, option inconnue, panne de l'outil ; message d'une ligne préfixé par le nom de la commande, sans pile. Un refus dit ce que le client doit changer ; une panne dit que l'outil n'a pas pu répondre ; les deux ne se confondent jamais.
- **Raison** : revue de code du 15/11/2026 ; décision de Quentin du 15/11/2026. Une panne rangée en refus envoie le client corriger une marque juste ; une panne rangée en échec de règle fait croire à une règle tenue ou cassée sans qu'elle ait été lue.
- **Conséquence** : les commandes passent par une garde commune (`src/cli/garde.js`) : la commande rend 0 ou 1, une exception sort en 2. Saisie : une couche commune cassée, Chromium qui ne se lance pas ou toute erreur de mesure d'encre est une panne ; un fichier de police que le navigateur refuse de charger reste un refus. Avant 2, rien n'est écrit : la saisie écrit ses fichiers à côté, contrôle, puis remplace ; un contrôle final qui lève ou trouve une paire en échec (incohérence de l'outil, puisqu'un refus n'écrit rien) sort en 2 sans rien laisser d'écrit (D31, revue, lot 6 : l'exception du contrôle relancé après écriture est retirée). `espacements()` et `typo()` exigent le contexte étroit : sans lui, les règles en étroit passeraient sans rien contrôler ; un contexte étroit qui ne change aucune valeur reste accepté. `npm run verify` sort en 0 même quand des pixels diffèrent : il compare, il ne juge pas. Chaîne de migration (revue, lot 1b, 16/11/2026) : `npm run audit` sort en 2 si une page n'a pas pu être mesurée (l'étape tombée est nommée : navigation, feuilles, mesure ; la page n'entre alors ni dans le rendu ni dans le déclaré), si sa trace est en panne ou si le script v1 y échoue (la page reste mesurée, sans trace ou sans comparaison) : l'audit est écrit, « incomplet » ; aucune page mesurée : rien n'est écrit. `npm run reduce` s'arrête en 2 dès qu'une page tombe : une table faite sur une partie des pages tromperait ; une couleur de marque illisible dans la cible est une panne. `npm run apply` compare chaque entrée à la feuille et refuse celles qui ne correspondent plus : 0 tout appliqué ou déjà appliqué, 1 au moins un écart (listé dans `reste.md`), 2 panne (feuille illisible, CSS invalide : rien n'est écrit), `--essai` compris ; une feuille absente de la copie est un écart. Une erreur d'usage (argument manquant, option inconnue, format faux) est une panne comme une autre : une ligne préfixée par la commande, sortie 2, sans l'aide ; `-h` donne l'aide, sortie 0. Une clé de `decisions.json` qui ne vise aucune ligne ni carte n'arrête rien : le site a pu changer entre deux réductions ; elle est listée au journal, dans `table.json` et dans `migration.md`.

### D19
- **Décision** : une couleur vue seulement à un état forcé (survol, focus, appui) entre dans la table si le site l'a écrite ; sa ligne porte son état (« au survol » dans le titre). Un fond survolé sous un texte plus clair que lui est un plein, comme au relevé. L'anneau de focus du navigateur n'entre pas : il reste dans « États non lus » de `migration.md`, nommé comme tel.
- **Raison** : revue de code du 15/11/2026, constat C14 ; décision de Quentin du 16/11/2026, à juger sur le résultat. Une couleur de survol écrite par le site fait partie de son design ; la laisser hors de la table la laissait hors de la migration.
- **Conséquence** : les couleurs d'état vont dans les usages (`addStates`, `src/rendered/aggregate.js`) ; l'audit les compte toujours à part (`states.onlyInStates`). Le critère voulu est l'origine de la valeur ; les échantillons d'état n'étant pas tracés, l'anneau du navigateur est reconnu par repli, un contour `outline-style: auto` (`KNOWN_ISSUES.md`). Une couleur d'état suit les règles de la table : sur les pages en désordre avec la valise, `#24426f`, plus sombre que bleu-10, est hors table par R8. Les paires de contraste du texte sur un fond survolé ne sont pas créées.

### D20
- **Décision** : une valeur à égale distance de deux pas est une décision, sans défaut : nouvelle valeur vide, les deux candidats affichés « à égalité, écart n px », sans « le plus proche ». Sans exception : un écart de 1 px, appliqué d'office hors égalité, n'y échappe pas.
- **Raison** : revue de code du 15/11/2026, constat E5 ; décision de Quentin du 16/11/2026. Départager vers la plus petite valeur était un choix de l'outil, présenté comme un « proche » ou un « auto » : le designer ne le voyait pas.
- **Conséquence** : `dimensionRow` (`src/reduce/propose.js`, C5) rend la classe décision, `noDefault`, le motif « à égale distance de A et B » et marque les deux candidats ; la revue et `migration.md` les disent « à égalité ». Sur les pages en désordre avec la valise, 14px de marge et 3px de rayon passent en décision ; « Égalités tranchées en silence » de `migration.md` est vide.

### D21
- **Décision** : la valeur retenue d'une ligne après décisions a une seule définition, `retenue` (`src/reduce/propose.js`), lue par la simulation, les conflits de déclarations, le contrôle de proximité, la migration et la revue. Un refus (`false`) laisse la ligne ; une décision écrite l'emporte, sauf si elle est égale à l'ancienne valeur : la ligne est alors laissée partout, et la migration la range en « inchangé ». La revue lit à son état initial la valeur retenue calculée côté Node : une décision écrite sur une ligne qui n'est pas à trancher (proche, d'office, correction, inchangé, hors table) est la valeur que montre la flèche de sa carte, et l'export la rend telle quelle.
- **Raison** : revue de code du 15/11/2026, constats B8 et C11 ; décisions de Quentin du 16/11/2026. La migration rangeait une décision égale à l'ancienne valeur en « appliquée » vers la proposition, alors que la simulation laissait la ligne. La revue montrait la proposition, et l'export perdait la décision écrite (11 lignes avec `decisions-valise.json`, 3 avec `decisions-passage-2c.json`, vérifié dans Chromium).
- **Conséquence** : les choix faits dans la page (cases, versions retenues) restent calculés par le script de la page ; seul l'état initial vient de Node, par les données de la page et l'attribut `data-decidee` des cartes. Une décision égale à l'ancienne valeur n'a aucune entrée réelle dans les fixtures. Les vignettes « avant / après » d'une carte ne suivent pas encore la valeur décidée : elles montrent la proposition de l'outil (`coul-27`, `coul-01`, `KNOWN_ISSUES.md`).

### D22
- **Décision** : une seule mise en forme des nombres et du texte (`src/lib/format.js`) : `fr` (virgule décimale), `esc` (échappement HTML), `r4` (arrondi à 4 décimales). Chaque sortie garde son format, nommé par les options de `fr` : nombre tel quel, `decimales`, `zeros`, `tronque`, `vide`. Deux défauts corrigés : la troncature se fait sur la valeur arrondie à 4 décimales (5,02 reste 5,02), et l'arrondi suit l'écriture décimale du nombre (11,655 donne 11,66). `esc` rend la chaîne vide pour `null` et `undefined`. `fr` refuse ce qui n'est pas un nombre, sauf si l'appelant donne `vide`. Le contraste WCAG a une seule source, `contrastRatio` (`src/lib/color.js`) ; une couleur qui n'est pas `#rrggbb` y lève en la nommant. culori reste l'oracle indépendant des tests.
- **Raison** : revue de code du 15/11/2026, constats C4, D9 et D10 ; décisions de Quentin du 16/11/2026. Neuf copies de `fr` (quatre comportements), six d'`esc` (trois comportements sur `null`), quatre de `r4`, deux sources de contraste. La planche des rôles affichait 5,01:1 pour 5,02, `toFixed` arrondissait 11,655 à 11,65, et une couleur mal écrite donnait un contraste NaN, en silence. Les deux sources de contraste donnent le même nombre, bit à bit, sur toute couleur `#rrggbb`.
- **Conséquence** : les formats restent différents d'une sortie à l'autre ; leur harmonisation est une décision à part (`KNOWN_ISSUES.md`). Refuser une valeur qui n'est pas un nombre a fait apparaître un « NaN » dans la revue : le contraste « après » d'une décision sans défaut (J1) ; il s'écrit « — ». `relativeLuminance` accepte encore un `#rrggbbaa`, dont il ignore l'alpha (`KNOWN_ISSUES.md`).

### D23
- **Décision** : une seule résolution d'alias pour les trois contrôles, `resoudreAlias` (`src/tokens/roles.js`, à côté de `flattenTokens`). Elle rend la valeur finale ; chaque contrôle juge le type et garde son message (`couleur illisible`, `dimension illisible`, `taille illisible`, `nombre attendu`). « alias en boucle » cite la chaîne depuis le jeton de départ ; « alias sans cible » nomme, après « depuis », le jeton ou le champ de départ.
- **Raison** : revue de code du 15/11/2026, constat D2 ; décision de Quentin du 16/11/2026. La typo citait sa chaîne sans le style de départ, et un style qui renvoyait à lui-même y passait pour une taille illisible.
- **Conséquence** : seules les lignes d'erreur de `npm run typo` changent, dans ces deux cas ; les codes de sortie restent ceux de D18. Les ensembles de jetons où chercher restent propres à chaque contrôle.

### D24
- **Décision** : au déclaré, `audit.json` n'écrit pas le compte par propriété d'une valeur quand il est vide : c'est le cas des 8 familles lues par Wallace, qui ne donne pas la propriété (couleurs, familles et tailles de police, interlignes, ombres, rayons, durées, courbes). Les 8 familles lues par PostCSS gardent leurs comptes, à la même place.
- **Raison** : décision de Quentin du 15/11/2026 (question Q5 de la revue de code). Un champ toujours vide laisse croire à un compte qui n'existe pas ; aucun lecteur ne s'en sert, ni dans `src/`, ni dans les tests, ni dans les fixtures, ni dans les scripts de `local/`.
- **Conséquence** : les `audit.json` déjà écrits gardent leur champ vide ; aucun outil ne les relit pour ce champ.

### D25
- **Décision** : une entrée nomme une échelle (`{ "echelle": nom }`) seulement si cette échelle est écrite à la main dans le dossier de sa marque, `primitives.tokens.json` ; les échelles communes (neutre, statuts) ne se nomment pas. Une seule lecture, `echellesPropres(dossier)` (`src/tokens/saisie.js`), pour la saisie et le calibrage. Une entrée peut mêler une couleur et une échelle nommée : les deux fichiers d'échelles claires entrent au resolver, `primitives.tokens.json` puis `echelles.tokens.json`, et au contrôle de contraste.
- **Raison** : revue de code, lot 5 ; décision de Quentin du 16/11/2026 (Q3). La règle « réservée à Orbe Café » était une condition sur un nom de marque. Elle cachait deux défauts : une entrée qui mêlait couleur et échelle nommée tombait en panne (« alias sans cible »), et une échelle commune nommée faisait écrire son miroir sombre, qui remplaçait l'échelle sombre commune pour cette marque. Le calibrage lisait les échelles d'Orbe Café pour toutes les marques.
- **Conséquence** : la différence entre marques vit dans leurs données : Orbe Café a ce fichier, les trois autres marques n'en ont pas. Sans lui, nommer une échelle est refusé : « échelle existante : aucune échelle écrite à la main dans le dossier de la marque (primitives.tokens.json) ». Une échelle commune nommée est refusée comme « échelle inconnue ». La couche marque et le resolver d'Orbe Café sont réécrits à l'identique, octet par octet ; la saisie des quatre marques et le calibrage de leurs quatre entrées ne changent pas (`test/echelles-propres.test.js`).
- **Suite (revue de code, lot 6)** : une marque ne redéfinit pas une échelle commune. Une échelle de `primitives.tokens.json` du dossier d'une marque qui porte le nom d'une échelle commune (primitives et statuts de `tokens/commun/`) fait refuser la marque par la saisie (sortie 1) et échouer `npm run contraste` sur ce dossier (sortie 1), avec le même motif, qui nomme l'échelle : « primitives.tokens.json : échelle commune redéfinie, <nom> (les échelles communes se lisent dans tokens/commun/ ; renomme-la dans le dossier de la marque) ». Une seule définition, `echellesCommunesRedefinies` et `motifRedefinies` (`src/tokens/saisie.js`), lue par les deux commandes. Raison : décision de Quentin du 16/11/2026, à la confrontation du lot 6 ; une telle échelle passait avant le mode sombre commun dans le resolver, après lui dans la fusion à la main de la saisie : sur une marque construite qui redéfinit `neutre`, la saisie refusait 18 paires en sombre, `contraste --mode sombre` n'en trouvait aucune. Cette marque est désormais refusée pour ce seul motif (`test/saisie-ecriture.test.js`, W1 et W2) ; aucune des quatre marques n'est touchée.

### D26
- **Décision** : aucune fonction ni commande ne prend de marque par défaut. `loadRoles` et `largeurs` exigent un dossier de marque. `npm run contraste`, `npm run espacements` et `npm run typo` prennent `--marque <dossier>` ; sans l'option, ils contrôlent chaque marque de `tokens/` qui a un `marque.resolver.json` (`dossiersDeMarque`, `src/tokens/resolver.js`), dans l'ordre des dossiers, un bloc par marque précédé de « marque <nom> (tokens/<dossier>/) », le nom lu dans le champ `name` du resolver (`parMarque`, `src/cli/garde.js`). Sortie 1 si une marque échoue, 2 sur une panne. La couche marque donnée à part à `typo` passe par `--couche-marque <fichier>`. Le code de `src/` ne nomme aucune marque, commentaires exclus (`test/marque-en-dur.test.js`).
- **Raison** : revue de code, lot 5 ; décisions de Quentin du 16/11/2026 (Q1, Q2, Q6). Une marque par défaut faisait contrôler Orbe Café seule ; `typo --marque <fichier>` mêlait la couche d'une autre marque aux primitives d'Orbe Café et sortait en 0. Si une différence entre marques est réelle, elle vit dans les données de la marque, pas dans le code.
- **Conséquence** : avec `--marque <dossier>`, chaque contrôle donne la sortie d'avant le lot. La garde est lexicale, sans parseur : elle lit les noms dans `tokens/*/entree.json` (nom, dossier, premier mot du dossier) et les cherche, sans casse ni accent, dans le code sans commentaires, chaînes comprises ; si la lecture d'un fichier se perd, le test le dit.

### D27
- **Décision** : chaque marque a ses trois planches, écrites par le même code, `planche(dossier)` dans `src/report/roles.js`, `espacements.js` et `typo.js`. Le nom de la marque est lu dans le champ `name` de son resolver : titre, en-tête, et texte d'essai du spécimen de la typo, « <nom> ouvre le mardi ». `node src/cli/planche.js --marque <dossier>` écrit celles d'une marque ; sans l'option, celles de toutes. Les tests navigateur des planches restent sur Orbe Café ; `test/planches-marques.test.js` vérifie, sans navigateur, que les 12 planches versionnées égalent la sortie de leur fonction.
- **Raison** : revue de code, lot 5 ; décisions de Quentin du 16/11/2026 (Q4, Q5, puis réponse au point d'arrêt de Q5). Les tests navigateur, lancés une fois sur les quatre marques, passent tous, « hero sur deux lignes » compris, sauf « T4 colonnes » de la planche des rôles pour trois marques ; la cause en est la référence du test, qui porte les ratios d'Orbe Café ; la planche est juste pour les quatre.
- **Conséquence** : la planche de typo d'Orbe Café change sur ses 11 lignes de spécimen (« torréfie » devient « ouvre ») ; ses deux autres planches sont identiques. La référence du test des rôles s'appelle `INTERDITES_ORBE_CAFE` et le dit en commentaire. Les situations des planches de typo et d'espacements restent un contenu d'essai commun, sur le thème d'un café (`KNOWN_ISSUES.md`).

### D28
- **Décision** : `npm run reduce --tokens <fichier>` prend un fichier de jetons ou le resolver DTCG 2025.10 d'une marque. Un resolver (il porte `resolutionOrder`) est résolu depuis son dossier, dans ses contextes par défaut (`jetonsDe`, `src/tokens/resolver.js`). Un fichier qui ne donne aucun jeton que la table sait nommer (couleur en hex, dimension en px) sort en 2 : « reduce : --tokens <chemin> : aucun jeton lu (couleur en hex, dimension en px) ; un fichier .tokens.json ou un resolver DTCG 2025.10 attendu ». Les tests de bout en bout lisent `tokens/orbe-cafe/marque.resolver.json`.
- **Raison** : revue de code du 15/11/2026 ; attendu du lot 5 (16/11/2026). Le resolver passé tel quel donnait 0 jeton, sans le dire ; la copie figée des primitives, seule lue par les tests, masquait ce cas.
- **Conséquence** : le resolver d'Orbe Café donne 133 entrées à l'index, la copie figée 104, qui y sont toutes avec leur valeur. Sur les cinq réductions de fixtures, `table.json` et `revue.html` ne changent pas ; `migration.md` et `modifications.json` ne changent que par le nom du fichier de jetons. La copie figée (`fixtures/marque-demo/jetons/primitives.tokens.json`) reste comme référence de l'état d'avant l'étape 4b (`test/roles-statuts.test.js`).

### D29
- **Décision** : la consigne pour un agent est une structure, `consigneAgent` (`src/report/consigne.js`) : chaque section en liste (CHANGE AUSSI, NE TOUCHE PAS, SIGNALE SANS MODIFIER, VÉRIFICATION) est une liste d'entrées, et la consigne réduite de `reste.md` y est écrite à côté (NE TOUCHE PAS après ce que le script a fait, VÉRIFICATION qui renvoie aux déclarations marquées, pas à CONFLITS). `migration.md` écrit son texte ; `modifications.json` (`buildModifications`, désormais dans `src/report/modifications.js`) lit les entrées, jamais le texte. `src/apply/` ne fait que lire `modifications.json`.
- **Raison** : revue de code, lot 6 (thème T3 de la passe 1b) ; attendu du 16/11/2026. `modifications.json` relisait la prose : un titre de section renommé vidait `changeAussi`, une ligne vide ajoutée tronquait `signale`, une phrase reformulée laissait `reste.md` renvoyer à une section absente, sans erreur ; NE TOUCHE PAS y était une seconde copie, écrite à la main.
- **Conséquence** : les sorties des cinq réductions sur fixtures sont identiques à l'octet. `test/consigne-unit.test.js` vérifie, sans navigateur, que chaque section de `migration.md` est écrite depuis les entrées et que `modifications.json` ne change pas quand le texte change.

### D30
- **Décision** : l'orchestration de `npm run reduce` vit dans `src/reduce/run.js` (`runReduce`, `linesOf`) ; `src/cli/reduce.js` garde l'aide, les options (`parseReduceArgs`) et le lancement. `couplingsOf` et `simulationCouplings` vivent dans `src/reduce/pleins.js`, avec la seule définition de `mapped` ; `unitOf` dans `src/reduce/declarations.js`. `declarationId` reste dans `src/browser/trace.js`. `lireJson` et `premiereLigne` passent dans `src/lib/fichiers.js`.
- **Raison** : revue de code, lot 6 (thème T7) ; attendu du 16/11/2026. Les tests importaient l'orchestration d'un point d'entrée ; la migration calculait une entrée de la simulation. `declarationId` est lue aussi par `src/browser/simulate.js` : la ranger dans `src/reduce/declarations.js`, qui importe `simulate.js`, ferait un import circulaire. `runReduce` lisait `lireJson` dans `src/cli/garde.js`.
- **Conséquence** : `test/couches.test.js` vérifie qu'aucun module de `src/` hors de `src/cli/` n'importe de `src/cli/`, qu'un test n'importe de `src/cli/reduce.js` que `parseReduceArgs`, que `src/browser/` n'importe que `src/browser/` et `src/lib/`, et que `src/apply/` n'importe rien de `src/reduce/` ni de `src/report/`. Sorties identiques à l'octet.

### D31
- **Décision** : la saisie a une seule fusion de contexte de marque, celle du resolver : `saisir()` calcule son contraste par `rolesDuResolver` (`src/tokens/roles.js`, lu aussi par `loadRoles`) sur le resolver de la marque, ses fichiers donnés en mémoire (`enLigne`, `src/tokens/resolver.js`), et rend ses contrats. La commande écrit en quatre temps (`remplacer`, `src/tokens/ecriture.js`) : lire les fichiers en place, écrire les nouveaux à côté (`.<nom>.saisie-<pid>`), contrôler le contraste dans les deux modes sur les textes relus (`controlerEcrits`), puis renommer ; `echelles.tokens.json` d'une échelle générée devenue nommée n'est supprimé qu'au remplacement final. Plus de sous-processus : le texte du contrôle est `lignesContraste` (`src/report/contraste.js`), lu par `npm run contraste` et par la saisie.
- **Raison** : revue de code, lot 6 (constat D7) ; attendu du 16/11/2026. La fusion à la main ordonnait les couches autrement que le resolver (échelles de la marque après le mode sombre commun) ; une panne d'écriture laissait des fichiers mêlés (quatre nouveaux, un ancien) ; un contrôle relancé en échec laissait tout écrit (exception de D18).
- **Conséquence** : une panne ou un refus ne laisse rien d'écrit ; l'exception de D18 est retirée. Les fichiers écrits par la saisie des quatre marques et sa console sont identiques à l'octet. Si la remise en place des fichiers d'origine tombe elle-même, le message nomme les fichiers laissés en l'état (`KNOWN_ISSUES.md`). Tests sans navigateur : `test/saisie-ecriture.test.js`, `test/contraste-modes.test.js` (C5), `test/pannes.test.js` (N10).
