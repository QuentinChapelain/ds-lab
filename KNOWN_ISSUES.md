# Dette connue

État au 15/11/2026.

- Tests C14 et E5 rouges, dans `test/e2e-desordre.test.js`, depuis avant l'étape 3.
- Tailles de texte en px : `indexTokens` (`src/report/migration.js`) n'indexe que les px ; bascule en rem à faire après adaptation (D12, `docs/decisions.md`).
- Valeurs en étroit rangées dans `$extensions["ds-lab.etroit"]`, invisibles pour un outil DTCG standard ; seuil de largeur encore une hypothèse.
- Interlettrage à 0 partout, à régler avec une vraie police.
- Primitives espace 0, 8, 12 et 64 sans rôle, à revoir après les composants.
- Règle DS10 sans contrôle (`docs/regles.md`).
- `checkValise` : 12 échecs sur les échelles de `primitives.tokens.json` (écart de teinte, contraste non croissant, texte sur le pas 10) ; les statuts générés passent.
- Seuil du texte foncé sur un plein (7:1, D04) calibré à l'œil sur quelques teintes seulement (un jaune saturé, une turquoise, un vert) ; seuil 5,5 du survol par voile repris d'avant, non recalibré.
- Bouton d'avertissement (statut figé) : texte foncé à 5,77:1 sur le plein, sous le seuil de 7 retenu pour les couleurs du client (DS1).
- DS1 est appliquée par construction à la saisie ; aucun contrôle ne relit la règle sur les jetons écrits.
- Balayage du calibrage (étape 4a, lot 3 bis) : les refus restants sont des échecs de `checkValise` (doublons, écart de teinte) sur des couleurs très claires ; aucun refus pour le contraste.
- Couches communes (neutres, statuts, rôles, paires, espaces, typo) lues dans `tokens/orbe-cafe/` par toutes les marques, mêlées aux échelles d'Orbe Café : à séparer en séance b.
- Trois fichiers source au-delà de 1 000 lignes ; ni lint ni CI ; revue de code prévue après l'étape 4.
