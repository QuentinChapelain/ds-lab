# Dette connue

État au 15/11/2026.

- Tests C14 et E5 rouges, dans `test/e2e-desordre.test.js`, depuis avant l'étape 3 ; chacun attend une décision, pas seulement du code.
  - C14 : `#24426f` n'est rendu qu'au survol forcé, et les couleurs d'état vont dans `stateColors` (`src/rendered/aggregate.js`), jamais dans les usages d'où `propose` tire les lignes (`src/reduce/propose.js:1009`), si bien que la valeur n'a pas de ligne [F].
  - E5 : l'attendu veut « décision » pour une égalité 12/16 px, qu'il écrit lui-même comme hypothèse, alors que l'outil départage l'égalité vers la plus petite valeur et range 14px en « proche » (`src/reduce/propose.js:211`) [F].
- Tailles de texte en px : `indexTokens` (`src/report/migration.js`) n'indexe que les px ; bascule en rem à faire après adaptation (D12, `docs/decisions.md`).
- Interlettrage à 0 partout, à régler avec une vraie police.
- Police du produit (`tokens/commun/police.tokens.json`) : `system-ui, sans-serif`, valeur provisoire [H], à choisir avec une vraie police.
- Styles de titre (affichage, titres 1 à 3) : hauteurs de ligne relevées à l'étape 4c pour les capitales accentuées (D17) ; interlettrage à reprendre avec de vraies polices.
- Consigne de hauteur de capitale des titres : rapport 0,7 [H], à juger sur image (D17).
- Consigne : la hauteur de ligne suit la taille calculée, pas la taille ajustée, mesuré dans Chromium 147 seulement ; Firefox et Safari non mesurés [V] (forme `cap-height <nombre>` : Chrome 127, Firefox 92, Safari 17, selon MDN).
- Consigne : Oswald est rendu 14 % plus petit que sa taille nominale (capitale 810 sur 1 000 : 0,7 ÷ 0,81 = 0,864) ; EB Garamond 7,7 % plus grand (650 sur 1 000) ; Georgia d'Orbe Café 1 % plus grand. C'est le prix d'une même hauteur de capitale visible.
- Contrôle d'encre : pire cas sur tout le jeu de caractères, même si cette capitale et cette descendante ne se suivent jamais ; le canvas de Chromium borne l'encre par les points de contrôle des courbes, un peu au-delà du contour (jusqu'à 0,006 em sur les polices d'essai). Le contrôle est prudent, il peut refuser une police qui passerait à l'œil.
- Police des titres sans fichier (Orbe Café, Georgia) : ni hauteur de capitale ni encre contrôlées ; Georgia touchait déjà avant la consigne avec les lignes de l'étape 3.
- Image des titres de l'étape 4c (`local/lot-4c/titres.png`) et son script : dans `local/` seulement.
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
- Mode sombre : `couleur.sable` d'Orbe Café n'a pas d'échelle sombre (aucun rôle ne la lit).
- `npm run reduce --tokens` lit un seul fichier : la cible ds-lab est maintenant répartie entre `tokens/commun/` et la marque ; les tests de bout en bout lisent une copie figée des primitives d'avant l'étape 4b (`fixtures/marque-demo/jetons/primitives.tokens.json`). À faire : lire un resolver.
- Clair : pour une marque très foncée, `texte.interactif` (pas 11) est plus foncé que la couleur du client et se distingue mal du texte courant (Grenat Papeterie : `#4f0020` contre `texte.principal` `#363026`, 1,19:1).
- `npm run espacements` et `npm run typo` ne prennent pas `--mode` : ils ne lisent pas de couleur, la largeur y est contrôlée par le contexte étroit.
- Table des 8 marques par mode (lot 3 de l'étape 4b) : dans `local/lot-4b/` seulement, témoins compris.
- Trois fichiers source au-delà de 1 000 lignes ; ni lint ni CI.
- Mode sombre : la carte (`fond.surface`, `#181818`) est jugée peu détachée de la page (`#121212`) sur image ; rapport carte sur page 1,055:1 en sombre contre 1,035:1 en clair [F], donc l'écart de teinte n'explique pas le jugement ; cause non établie [V], à reprendre à l'étape des composants.

## Revue de code du 15/11

Constats de la revue en lecture seule (commit 4341b94), filets posés par le lot 0 (`docs/attendus/revue-lot-0-filets.md`) ; aucun n'est corrigé.

- `apply` tient `border` pour un raccourci des rayons : un `border` écrit après `border-radius` envoie les quatre rayons en écart à tort (`src/apply/apply.js:152`, `covers`) [F].
- Audit : toute panne pendant la mesure d'une page est rangée en « échec du chargement », et la page reste dans l'agrégat du rendu (`src/audit/run.js:144`, autour de `measureRendered`, `src/rendered/run.js`) [F].
- Une clé de `decisions.json` qui ne vise aucune ligne ni carte est ignorée sans trace : la carte de simulation est la même qu'avec aucune décision (`src/reduce/propose.js:1106`, `decisionKeyFor`) [F].
- Une couleur de marque illisible (`#12345`, `rouge`) devient un gris rangé sur l'échelle `neutre` (règle M1) au lieu de lever en nommant l'emplacement (`src/brand/brand.js:41`, `resolveBrand`) [F].
- Motif R9 « texte sous 4,5:1 » écrit en dur, même quand le seuil de la paire vaut 3 (`src/reduce/propose.js:734, 758` ; relu par `src/report/review.js:276, 278`) [F].
- `npm run espacements` et `npm run typo` sortent en 1 sur une panne (fichier absent), comme sur une règle en échec, quand `contraste` sort en 2 (`src/cli/espacements.js:55`, `src/cli/typo.js:55`) [F].
- Quatre blocs JSDoc posés au-dessus de la mauvaise fonction, si bien que `runReduce`, `buildMigration`, `renderMarkdown` et `renderReview` ne sont pas vérifiés par `@ts-check` (`src/cli/reduce.js:73`, `src/report/migration.js:166, 421`, `src/report/review.js:433`) [F].
- Annotations en retard : 69 des 77 erreurs de TypeScript non strict viennent de types JSDoc qui n'ont pas suivi les lots, surtout dans `src/reduce/propose.js`, `src/rendered/aggregate.js` et `src/browser/simulate.js` [F].
- Copie figée `fixtures/marque-demo/jetons/primitives.tokens.json` : `reduce --tokens` accepte sans le dire un fichier qui ne donne aucun jeton (le resolver passé tel quel en donne 0), et la copie, seule lue par les tests, masque ce cas (`src/cli/reduce.js:94`, `indexTokens` dans `src/report/migration.js:62`) [F].
- Une ligne « inchangé » qui reçoit une décision écrite est appliquée par `mapping` (`src/reduce/propose.js:1166`) et dite « inchangé » à sa valeur d'avant par la migration (`src/report/migration.js:269`) [F] ; que la revue puisse produire une telle décision n'est pas établi [V].
