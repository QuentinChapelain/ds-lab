# Attendu : étape 4, séance a, contrat de marque

Question : que peut changer un client, et que garantit le système ?

Constat à vérifier : src/cli/emplacements.js n'écrit la couche marque que pour Orbe Café ; aucune commande ne saisit une marque quelconque ; les seuils du cas clair de src/tokens/pleins.js sont une hypothèse.

Lots, dans l'ordre :
1. Saisie. Une marque = un fichier d'entrée (couleur primaire, accent facultatif, polices). Une commande génère ses échelles et sa couche marque dans tokens/<marque>/, lance le contrôle de contraste, sort 0 si la marque est acceptée, sinon un code non nul avec le motif. Orbe Café passe par cette commande sans changer de valeur.
2. Trois marques fictives ajoutées par fichier : une moyenne, une claire, une sans accent. Les témoins réels restent dans local/.
3. Calibrage. Une table des 8 marques et un balayage des teintes près des seuils du cas clair. Aucun seuil ne change sans décision de Quentin sur image.
4. Contrat. docs/contrat-de-marque.md, une page, quatre colonnes : entré par le client, généré, refusé à la saisie, forçable hors garantie. Chaque garantie cite la commande qui la contrôle.
5. Après décision de Quentin : aplat de marque plein et aplat léger, non cliquables ; texte de marque pour les grands titres (couleur exacte si elle passe 3:1 sur le fond le plus foncé autorisé, sinon premier pas qui passe ; affichage et titres 1 et 2 seulement) ; bouton posé sur un aplat ; option « forcer la couleur exacte », affichée hors garantie par le contrôle sans le faire échouer.

Hors périmètre : mode sombre, largeur, resolver (séance b) ; police du client, rem (séance c) ; texte posé sur une image (hors contrat).

Fini quand : les 8 marques sont acceptées ou refusées par la commande, avec motif ; les trois contrôles sortent 0 ; le test de dérive passe ; le contrat tient en une page. Limite : 2 heures.

## Précisions après confrontation

Validées par Quentin le 15/11/2026.

Constats de la confrontation :

- [F] Générer l'échelle d'Orbe Café depuis son pas 9 change 11 pas sur 12 de bleu, terre et succes (et le texte sur plein de terre) : « sans changer de valeur » demande qu'une entrée puisse nommer une échelle existante.
- [F] Aucune commande ne refuse une marque aujourd'hui. Sur dix primaires d'essai (les quatre témoins, gris, cyan clair, quasi noir, rouge proche du statut erreur, jaune vif, vert clair), checkValise et le contrôle de contraste passent. Correction du lot 1 : ce n'est pas par construction ; sur une grille de 216 couleurs (canaux 00, 33, 66, 99, cc, ff), 14 échouent à checkValise et 3 au contraste. Les motifs de refus sont à poser.
- [F] Deux règles disent « clair » différemment : le générateur (contraste du pas 9 sur blanc < 3,2 : plein clair, texte foncé) et la règle des pleins (clarté et teinte jaune ou orangée). Un cyan clair, un vert clair ou le témoin T-moyenne sont « plein clair » pour le générateur et « moyen » pour la règle : le bouton prend le pas 11 et la couleur exacte du client n'y apparaît pas.
- [F] Sans accent, le repli sur le neutre (D05) donne à texte.accent la couleur de texte.secondaire (neutre 11).

Réponses :

1. Une entrée de couleur est soit une couleur (échelle générée), soit le nom d'une échelle existante, réservé à Orbe Café. Le fichier marque.tokens.json d'Orbe Café est réécrit à l'identique, vérifié octet par octet.
2. Trois motifs de refus à la saisie : entrée invalide ; checkValise en échec sur les échelles générées ; paire de rôles en échec. Primaire grise, primaire proche d'un statut et accent proche du primaire sont seulement montrés dans la table du lot 3.
3. Les couches communes (neutres, statuts, rôles, paires, espaces, typo) restent lues dans tokens/orbe-cafe/ pour cette séance ; dette dans KNOWN_ISSUES.md, à traiter en séance b.
4. Les 8 marques : Orbe Café, les 3 fictives du lot 2 et les 4 témoins. La table des 8 est dans local/lot-4a/ ; seules les 4 marques fictives sont versionnées.
5. La marque claire du lot 2 est un cyan clair (hors de la bande jaune ou orangée).
6. Commande saisie (script npm du même nom), entrée dans tokens/<marque>/entree.json ; option --marque pour la commande contraste.

Lecture retenue : les polices de l'entrée sont des noms de familles seulement, écrits dans marque.police, sans chargement ni contrôle.

Ajouts :

- Le seuil du cas sombre (blanc ≥ 5,5 sur le pas 9) est une hypothèse, au même titre que les seuils du cas clair.
- Table du lot 3 : une colonne par marque ; pour chacune, la classe selon le générateur, la classe selon la règle des pleins, et si la couleur exacte du client apparaît sur le bouton.
- Lot 5 : attend un complément d'attendu.
- Lot 6 (les 12 échecs checkValise d'Orbe Café) retiré de la séance ; la dette reste dans KNOWN_ISSUES.md.

## Décisions sur image

Quentin, 15/11/2026, de 13 h 18 à 13 h 48.

- Règle des pleins, pour le primaire et l'accent, lue sur l'échelle, dans cet ordre : 1. blanc ≥ 4,5 sur le pas 9 : couleur exacte, texte blanc ; survol par voile blanc si blanc ≥ 5,5, sinon au pas 10, plus foncé. 2. Sinon, pas 12 ≥ 7 sur le pas 9 et ≥ 4,5 sur le pas 10 : couleur exacte, texte au pas 12, survol au pas 10. 3. Sinon : pas 11, texte blanc, survol au pas 12. Le seuil 7 remplace la condition de clarté et de teinte.
- Les quatre statuts gardent leur bouton actuel, figé ; Orbe Café reste identique octet par octet.
- Aucun forçage : l'option « forcer la couleur exacte » du lot 5 est retirée, l'accessibilité est une obligation légale. Au lot 4, la colonne « forçable hors garantie » devient « hors contrat » : texte posé sur une image.
- Lot 3 bis : D04, DS1 et KNOWN_ISSUES mis à jour, calibrage relancé.

## Complément : lot 5, aplats et titres de marque

Décisions de Quentin sur image, 15/11/2026, de 13 h 58 à 14 h 07. Deux niveaux d'aplat de marque, clair et plein, pour créer du relief dans une page.

1. fond.marque.discret, non cliquable : pas 3 du primaire. Usage : bandeau, section, encadré.
2. fond.accent.discret, non cliquable : pas 3 de l'accent ; sans accent, repli neutre comme D05.
3. fond.marque.fort, non cliquable : même valeur que le plein du primaire (marque.primaire.plein). Le texte posé dessus, titres compris, prend la valeur de marque.primaire.sur-plein, par un rôle de texte nommé selon D01.
4. fond.accent.fort ne change pas ; sa description précise « petites surfaces, comme une étiquette ».
5. texte.marque.grand, pour les styles affichage et titres 1 et 2 seulement : pas 9 du primaire s'il atteint 3:1 sur chacun des fonds fond.app, fond.surface, fond.discret et fond.marque.discret ; sinon pas 10 ; sinon pas 11. Le choix se fait à la saisie, dans la couche marque ; le rôle est un alias.
6. Bouton inversé, réservé à fond.marque.fort : son fond prend la valeur de sur-plein, son texte la valeur du plein. C'est la paire du bouton retournée, donc le même ratio. Rôles : fond.interactif.inverse, texte.sur-interactif.inverse ; au survol, seul le texte change (texte.sur-interactif.inverse.survol, valeur de marque.primaire.plein-survol).
7. Paires déclarées.
   - Sur fond.marque.discret et fond.accent.discret : texte.principal, texte.secondaire, texte.interactif, texte.marque.grand (3:1, grand texte), bordure.focus (3:1) ; texte.accent sur fond.accent.discret. Le bouton principal s'y pose tel quel.
   - Sur fond.marque.fort : le texte du point 3 (texte.sur-marque), le bouton inversé, l'anneau de focus bordure.focus.inverse (valeur de marque.primaire.sur-plein). texte.marque.grand, texte.interactif, le bouton principal et bordure.focus y sont des paires interdites, avec leur règle de remplacement (D06).
8. Orbe Café : ses rôles existants et leurs valeurs ne changent pas ; les ajouts sont les seuls écarts.
9. Documentation : décision D14 ; contrat (deux niveaux d'aplat ; hors contrat : l'harmonie entre le primaire et l'accent du client) ; KNOWN_ISSUES (la limite « grands titres seulement » n'a pas de contrôle, comme DS10).
10. Pour Quentin : une image local/lot-4a/aplats.png, largeur 420 px. Pour chaque marque fictive, le bandeau clair puis le bandeau plein, l'un sous l'autre : titre avec la police de titre (texte.marque.grand sur le clair), une ligne de texte, le bouton (principal sur le clair, inversé sur le plein), et le ratio du titre sous chaque bandeau.

Confrontation et réponses de Quentin (14 h 18) :

- [F] bordure.focus (pas 11 du primaire) sur fond.marque.fort : 1,00 à 1,55:1 pour six des huit marques, Orbe Café compris. Réponse : bordure.focus.inverse sur fond.marque.fort, bordure.focus y devient une paire interdite (point 7 corrigé).
- [F] Bouton principal sur l'aplat clair d'une marque claire : 1,40:1 (Écume et Sel) et 1,08:1 (T-claire) entre le bouton et l'aplat. Réponse : dette notée, sans paire ni refus ; jugé suffisant sur image ; piste pour l'étape des composants, un contour très léger de la teinte du bouton.
- Noms des rôles et survol du bouton inversé (seul le texte change) : validés.
- Orbe Café : la couche marque gagne l'emplacement texte-grand ; retiré, le fichier redevient identique octet par octet.
