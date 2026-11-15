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
