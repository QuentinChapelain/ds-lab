# Décisions

Dix-huit décisions, chacune avec sa raison et sa conséquence. Aucune valeur n'est recopiée ici : elles se lisent dans `tokens/commun/` et dans le dossier de chaque marque.

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
- **Conséquence** : une marque refusée n'écrit rien. Primaire grise, primaire proche d'un statut et accent proche du primaire ne sont pas des refus : ils sont montrés dans la table de calibrage.

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
- **Conséquence** : les commandes passent par une garde commune (`src/cli/garde.js`) : la commande rend 0 ou 1, une exception sort en 2. Saisie : une couche commune cassée, Chromium qui ne se lance pas ou toute erreur de mesure d'encre est une panne ; un fichier de police que le navigateur refuse de charger reste un refus. Avant 2, rien n'est écrit, sauf une exception : le contrôle `contraste` relancé après écriture ; s'il ne conclut pas, ou s'il trouve une paire en échec (incohérence de l'outil, puisqu'un refus n'écrit rien), la saisie sort en 2, fichiers écrits, et le dit ; elle n'efface rien, pour ne pas détruire une marque valide déjà en place (`KNOWN_ISSUES.md`). `espacements()` et `typo()` exigent le contexte étroit : sans lui, les règles en étroit passeraient sans rien contrôler ; un contexte étroit qui ne change aucune valeur reste accepté. `npm run verify` sort en 0 même quand des pixels diffèrent : il compare, il ne juge pas. Chaîne de migration (revue, lot 1b, 16/11/2026) : `npm run audit` sort en 2 si une page n'a pas pu être mesurée (l'étape tombée est nommée : navigation, feuilles, mesure ; la page n'entre alors ni dans le rendu ni dans le déclaré), si sa trace est en panne ou si le script v1 y échoue (la page reste mesurée, sans trace ou sans comparaison) : l'audit est écrit, « incomplet » ; aucune page mesurée : rien n'est écrit. `npm run reduce` s'arrête en 2 dès qu'une page tombe : une table faite sur une partie des pages tromperait ; une couleur de marque illisible dans la cible est une panne. `npm run apply` compare chaque entrée à la feuille et refuse celles qui ne correspondent plus : 0 tout appliqué ou déjà appliqué, 1 au moins un écart (listé dans `reste.md`), 2 panne (feuille illisible, CSS invalide : rien n'est écrit), `--essai` compris ; une feuille absente de la copie est un écart. Une erreur d'usage (argument manquant, option inconnue, format faux) est une panne comme une autre : une ligne préfixée par la commande, sortie 2, sans l'aide ; `-h` donne l'aide, sortie 0. Une clé de `decisions.json` qui ne vise aucune ligne ni carte n'arrête rien : le site a pu changer entre deux réductions ; elle est listée au journal, dans `table.json` et dans `migration.md`.
