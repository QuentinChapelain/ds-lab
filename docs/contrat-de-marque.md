# Contrat de marque

Tout part de la couleur du client : chaque rôle prend dans sa palette le pas qui convient. Le client remplit un fichier d'entrée ; `npm run saisie -- <entree.json>` génère le reste, ou refuse la marque avec son motif et n'écrit rien (D13, `docs/decisions.md`).

| Entré par le client | Généré | Refusé à la saisie | Hors contrat |
|---|---|---|---|
| **Couleur primaire**, `#rrggbb` : ce qui se clique (D05) | Échelle de 12 pas, pas 9 = couleur saisie ; bouton, survol, texte sur le bouton, texte interactif, anneau de focus ; deux niveaux d'aplat, clair et plein, et le texte de marque des grands titres (D14) ; en sombre, une seconde échelle depuis le même pas 9 ; en sombre, le bouton prend la version lumineuse de la couleur du client (pas 11), l'aplat plein garde la couleur exacte (D04, D15) | Couleur absente ou illisible ; échelle, claire ou sombre, qui échoue à `checkValise` (doublon, teinte qui dérive, contraste non croissant, texte sur le plein) | Primaire grise ou proche d'un statut : montrée par le calibrage, ni refusée ni garantie distincte |
| **Accent**, facultatif, `#rrggbb` : identité, jamais porteur d'un sens | Échelle de 12 pas, son plein pour les petites surfaces et son aplat clair ; sans accent, repli sur le neutre (D05) | Mêmes motifs que le primaire | Accent proche du primaire : montré, pas refusé ; l'harmonie entre le primaire et l'accent n'est pas jugée |
| **Polices** : noms de familles pour les titres et pour le texte | `marque.police`, lue par les styles de texte | Liste absente ou vide | Chargement, métriques et rendu de la police (séance c) |
| **Nom** de la marque | Descriptions des fichiers de jetons | Nom absent ; clé inconnue dans l'entrée | |
| Rien d'autre : neutres, statuts, rôles, paires, espacements, tailles de texte sont communs à toutes les marques, en clair comme en sombre (`tokens/commun/`) | Couche marque `marque.tokens.json` et échelles `echelles.tokens.json`, leur pendant sombre (`marque.sombre.tokens.json`, `echelles.sombre.tokens.json`) et le resolver `marque.resolver.json`, à côté de l'entrée | Paire de rôles sous son seuil | Texte posé sur une image : le contrôle mesure une couleur, pas une photo |

## Ce que le système garantit

| Garantie | Commande qui la contrôle |
|---|---|
| Chaque paire de rôles atteint son seuil WCAG 2.1 : 4,5:1 pour le texte, 3:1 pour la bordure de champ et le focus ; sinon la marque est refusée | `npm run contraste -- --marque <dossier>`, lancé par `npm run saisie` |
| Chaque échelle générée passe `checkValise` : pas de doublon, teinte tenue, contraste croissant, texte lisible sur les pas 9 et 10 | `npm run saisie` |
| La couleur exacte du client est sur le bouton dès qu'un texte lisible s'y pose : blanc à 4,5:1, ou texte foncé à 7:1 (D04, DS1) ; sinon le bouton prend le pas 11. Aucun forçage. Le survol se voit : voile blanc de 8 % ou noir de 15 % sur la couleur exacte, pas 10 ou pas 12 sinon | `npm run saisie` (règle appliquée à la génération) |
| Les rôles sont les mêmes pour toutes les marques ; un rôle de marque pointe vers la couche marque (D02) | `npm test` |
| Espacements par relation et styles de texte tiennent leurs règles (DS4 à DS8), communs à toutes les marques | `npm run espacements`, `npm run typo` |
| Les statuts (erreur, succès, avertissement, information) gardent le même bouton pour toutes les marques ; en sombre, chaque bouton suit la même règle (pas 11, 12 et 1 de son échelle sombre) et son texte tient 7:1 | `npm test` |
| Sur l'aplat clair, texte, liens, anneau et titres de marque (3:1) restent lisibles ; sur l'aplat plein, texte, bouton inversé et anneau sont retournés, au ratio du bouton | `npm run contraste -- --marque <dossier>` |

Exceptions connues (`KNOWN_ISSUES.md`) : le bouton d'avertissement porte un texte foncé à 5,77:1, conforme au WCAG mais sous le seuil de 7 de DS1 ; la limite du texte de marque aux grands titres n'a pas de contrôle.
