# Dette connue

État au 15/11/2026.

- Tests C14 et E5 rouges, dans `test/e2e-desordre.test.js`, depuis avant l'étape 3.
- Tailles de texte en px : `indexTokens` (`src/report/migration.js`) n'indexe que les px ; bascule en rem à faire après adaptation (D12, `docs/decisions.md`).
- Valeurs en étroit rangées dans `$extensions["ds-lab.etroit"]`, invisibles pour un outil DTCG standard ; seuil de largeur encore une hypothèse.
- Interlettrage à 0 partout, à régler avec une vraie police.
- Primitives espace 0, 8, 12 et 64 sans rôle, à revoir après les composants.
- Règle DS10 sans contrôle (`docs/regles.md`).
- `checkValise` : 12 échecs sur les échelles de `primitives.tokens.json` (écart de teinte, contraste non croissant, texte sur le pas 10) ; les statuts générés passent.
- Seuil du cas « sombre » (blanc ≥ 5,5 sur le pas 9) et seuils du cas « clair » de la règle des pleins : hypothèses, à calibrer sur plus de marques.
- Couches communes (neutres, statuts, rôles, paires, espaces, typo) lues dans `tokens/orbe-cafe/` par toutes les marques, mêlées aux échelles d'Orbe Café : à séparer en séance b.
- Trois fichiers source au-delà de 1 000 lignes ; ni lint ni CI ; revue de code prévue après l'étape 4.
