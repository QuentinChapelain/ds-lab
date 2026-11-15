# Règles du design system

Dix règles, chacune avec sa raison et son contrôle. Une règle sans contrôle est une dette (`KNOWN_ISSUES.md`).

| | Règle | Raison | Contrôle |
|---|---|---|---|
| DS1 | Sur un plein moyen, jamais de texte foncé | Conforme au ratio, mais le texte vibre | `npm run contraste` |
| DS2 | L'anneau de focus se pose sur le fond de page, décalé de 2 px, jamais sur le plein | Sur une marque moyenne, anneau et plein ont la même couleur | `npm run contraste` |
| DS3 | Le parent porte l'espace, l'enfant n'a pas de marge | Pas de fusion de marges, responsive simple | Tests des planches (`test/espacements-planche.test.js`) |
| DS4 | L'écart entre composants vaut au moins le double de l'écart interne | On doit voir à quel champ appartient un message | `npm run espacements` |
| DS5 | Les écarts sont strictement croissants | La hiérarchie se lit à la distance | `npm run espacements` |
| DS6 | Seuls les grands écarts et les grands textes varient avec la largeur | Pratique observée dans les systèmes de référence | `npm run espacements` et `npm run typo` |
| DS7 | Une hauteur de ligne est un multiple de 4 px : on choisit la hauteur, puis on en déduit le rapport | Grille | `npm run typo` |
| DS8 | Affichage et titres strictement décroissants, en large et en étroit | Hiérarchie à toutes les largeurs | `npm run typo` |
| DS9 | Ne jamais prendre une primitive s'il existe un rôle pour la relation | Sinon les valeurs libres reviennent | Liste « sans rôle » de `npm run espacements` et de `npm run typo` |
| DS10 | Un style de texte ne porte pas de couleur, et un seul affichage grand par page | Séparer forme et couleur | Contrôle à écrire |
