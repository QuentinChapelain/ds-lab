# Contrat de marque

Tout part de la couleur du client : chaque rôle prend dans sa palette le pas qui convient. Le client remplit un fichier d'entrée ; `npm run saisie -- <entree.json>` génère le reste, ou refuse la marque avec son motif et n'écrit rien (D13, `docs/decisions.md`).

| Entré par le client | Généré | Refusé à la saisie | Hors contrat |
|---|---|---|---|
| **Couleur primaire**, `#rrggbb` : ce qui se clique (D05) | Échelle de 12 pas, pas 9 = couleur saisie ; bouton, survol, texte sur le bouton, texte interactif, anneau de focus | Couleur absente ou illisible ; échelle qui échoue à `checkValise` (doublon, teinte qui dérive, contraste non croissant, texte sur le plein) | Primaire grise ou proche d'un statut : montrée par le calibrage, ni refusée ni garantie distincte |
| **Accent**, facultatif, `#rrggbb` : identité, jamais porteur d'un sens | Échelle de 12 pas et son plein ; sans accent, repli sur le neutre (D05) | Mêmes motifs que le primaire | Accent proche du primaire : montré, pas refusé |
| **Polices** : noms de familles pour les titres et pour le texte | `marque.police`, lue par les styles de texte | Liste absente ou vide | Chargement, métriques et rendu de la police (séance c) |
| **Nom** de la marque | Descriptions des fichiers de jetons | Nom absent ; clé inconnue dans l'entrée | |
| Rien d'autre : neutres, statuts, rôles, paires, espacements, tailles de texte sont communs à toutes les marques | Couche marque `marque.tokens.json` et échelles `echelles.tokens.json`, à côté de l'entrée | Paire de rôles sous son seuil | Texte posé sur une image : le contrôle mesure une couleur, pas une photo |

## Ce que le système garantit

| Garantie | Commande qui la contrôle |
|---|---|
| Chaque paire de rôles atteint son seuil WCAG 2.1 : 4,5:1 pour le texte, 3:1 pour la bordure de champ et le focus ; sinon la marque est refusée | `npm run contraste -- --marque <dossier>`, lancé par `npm run saisie` |
| Chaque échelle générée passe `checkValise` : pas de doublon, teinte tenue, contraste croissant, texte lisible sur les pas 9 et 10 | `npm run saisie` |
| La couleur exacte du client est sur le bouton dès qu'un texte lisible s'y pose : blanc à 4,5:1, ou texte foncé à 7:1 (D04, DS1) ; sinon le bouton prend le pas 11. Aucun forçage | `npm run saisie` (règle appliquée à la génération) |
| Les rôles sont les mêmes pour toutes les marques ; un rôle de marque pointe vers la couche marque (D02) | `npm test` |
| Espacements par relation et styles de texte tiennent leurs règles (DS4 à DS8), communs à toutes les marques | `npm run espacements`, `npm run typo` |
| Les statuts (erreur, succès, avertissement, information) gardent le même bouton pour toutes les marques | `npm test` |

Exception connue : le bouton d'avertissement porte un texte foncé à 5,77:1, conforme au WCAG mais sous le seuil de 7 de DS1 (`KNOWN_ISSUES.md`).
