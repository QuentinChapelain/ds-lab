# Dette connue

État au 15/11/2026.

- Tests C14 et E5 rouges, dans `test/e2e-desordre.test.js`, depuis avant l'étape 3.
- Tailles de texte en px : `indexTokens` (`src/report/migration.js`) n'indexe que les px ; bascule en rem à faire après adaptation (D12, `docs/decisions.md`).
- Interlettrage à 0 partout, à régler avec une vraie police.
- Primitives espace 0, 8, 12 et 64 sans rôle, à revoir après les composants.
- Règle DS10 sans contrôle (`docs/regles.md`).
- `texte.marque.grand` réservé à l'affichage et aux titres 1 et 2 (D14) : aucun contrôle ne vérifie cette limite, comme DS10.
- Bouton principal sur l'aplat clair d'une marque claire : 1,40:1 (Écume et Sel) entre le bouton et l'aplat ; jugé suffisant sur image, sans paire ni refus. Piste pour l'étape des composants : un contour très léger de la teinte du bouton.
- La planche des rôles ne montre que les paires dont l'élément devant est un texte ou une bordure : l'interdite « bouton principal sur `fond.marque.fort` » n'y paraît pas ; `npm run contraste` la liste.
- `checkValise` : 12 échecs sur les échelles de `primitives.tokens.json` (écart de teinte, contraste non croissant, texte sur le pas 10) ; les statuts générés passent.
- Seuil du texte foncé sur un plein (7:1, D04) calibré à l'œil sur quelques teintes seulement (un jaune saturé, une turquoise, un vert) ; seuil 5,5 du survol par voile repris d'avant, non recalibré.
- Bouton d'avertissement (statut figé) : texte foncé à 5,77:1 sur le plein, sous le seuil de 7 retenu pour les couleurs du client (DS1).
- DS1 est appliquée par construction à la saisie ; aucun contrôle ne relit la règle sur les jetons écrits.
- Balayage du calibrage (étape 4a, lot 3 bis) : les refus restants sont des échecs de `checkValise` (doublons, écart de teinte) sur des couleurs très claires ; aucun refus pour le contraste.
- Seuil de largeur (600 px) encore une hypothèse.
- Mode sombre, hypothèses jugées sur image (lot 2 bis de l'étape 4b) : page `#121212` ; cibles des pas 1 à 7 au rapport clair à la page, pas 8 à 3,1 × fond.surface ; pas 11 des couleurs à 9:1 sur la page (attendu « environ 8:1 », calé sur les repères `#8bb9ff` et `#c4a3ff`) ; neutre : pas 8 à 3,1 × fond.surface, pas 9 au milieu géométrique des pas 8 et 11 ; `fond.surface` entre les pas 2 et 3.
- Générateur, mode sombre seulement : chroma atténuée en luminance du côté du noir ; arrondi cherché à ± 2 par canal pour tenir la teinte (Écume et Sel dérivait de 3,34°) ; la source est exclue des autres pas (Grenat Papeterie : la cible du pas 7, 2,09 contre le noir, tombait sur la source). Pas 11 et 12 au-dessus de la chroma de la source si le gamut le permet.
- Mode sombre : une source claire (école « foncée » : avertissement, accent jaune, primaire cyan) garde ses pas 10 à 12 au-delà du pas 9 ; son texte de couleur et son bouton montent vers 12 à 17:1.
- Mode sombre : l'accent fort (`fond.accent.fort`, `texte.sur-accent`) garde ses valeurs claires, comme l'aplat plein (lecture : l'accent n'est pas un bouton, D05).
- `paires.json` ne déclare les bordures de statut que sur `fond.app` : un champ en erreur posé sur `fond.surface` n'a pas de paire (vu en sombre, 2,97:1 avant correction du pas 8 ; contrôlé par `test/sombre.test.js`).
- Mode sombre : `couleur.sable` d'Orbe Café n'a pas d'échelle sombre (aucun rôle ne la lit).
- `npm run contraste` ne lit que le mode clair ; contrôle des deux modes au lot 3 de l'étape 4b.
- `npm run reduce --tokens` lit un seul fichier : la cible ds-lab est maintenant répartie entre `tokens/commun/` et la marque ; les tests de bout en bout lisent une copie figée des primitives d'avant l'étape 4b (`fixtures/marque-demo/jetons/primitives.tokens.json`). À faire : lire un resolver.
- Clair : pour une marque très foncée, `texte.interactif` (pas 11) est plus foncé que la couleur du client et se distingue mal du texte courant (Grenat Papeterie : `#4f0020` contre `texte.principal` `#363026`, 1,19:1).
- Trois fichiers source au-delà de 1 000 lignes ; ni lint ni CI ; revue de code prévue après l'étape 4.
