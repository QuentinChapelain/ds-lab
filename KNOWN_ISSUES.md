# Dette connue

État au 15/11/2026.

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
- Saisie, exception à « rien n'est écrit » (D18) : le contrôle `contraste` est relancé sur les fichiers déjà écrits ; s'il ne conclut pas, ou trouve une paire en échec, la saisie sort en 2 avec les fichiers en place (`src/cli/saisie.js`). Remède (écrire à côté, contrôler, puis remplacer) renvoyé au lot de la fusion unique du contexte de marque.
- Saisie, contrôle d'encre : le refus « fichier de police que le navigateur ne charge pas » (`PoliceRefusee`, `src/polices/encre.js`) est codé mais sans test, faute d'un fichier qui passe les garde-fous et que Chromium rejette.
- Codé sans test (lot 1b de la revue) : le motif « non stabilisé après 10 tours » de la boucle de `propose` (aucune entrée connue ne la fait osciller, `src/reduce/propose.js`) ; la trace en panne dans un audit de bout en bout (testée au niveau de `measureRendered` seulement, aucun moyen de la provoquer dans une vraie page) ; les messages d'une navigation échouée de `reduce --live` et de `npm run login` (fenêtre visible).
- États forcés (D19) : les échantillons d'état ne sont pas tracés ; l'anneau de focus du navigateur est reconnu par repli, un contour `outline-style: auto` (`src/rendered/aggregate.js`, `addStates`). Un site qui écrit lui-même `outline-style: auto` verrait sa couleur de focus rangée avec celle du navigateur. Remède : tracer chaque échantillon à l'état forcé (un appel `CSS.getMatchedStylesForNode` par échantillon et par état, dans `collectStates`) et lire l'origine de la règle.
- États forcés (D19) : les paires de contraste du texte sur un fond survolé ne sont pas créées ; une couleur de survol est rangée sans contrôle de contraste.
- États forcés (D19) : une couleur de survol est comparée comme une couleur indépendante, au plus proche de la table, sans lien avec la couleur qu'elle survole. Avec une valise, un survol plus sombre que le pas 10 tombe hors table, fond sombre (R8) : `#24426f` sur les pages en désordre. Lecture à étudier : le survol d'un plein est l'état d'un rôle, à rattacher au survol du système plutôt qu'à un pas de la table.
- Mode sombre : la carte (`fond.surface`, `#181818`) est jugée peu détachée de la page (`#121212`) sur image ; rapport carte sur page 1,055:1 en sombre contre 1,035:1 en clair [F], donc l'écart de teinte n'explique pas le jugement ; cause non établie [V], à reprendre à l'étape des composants.

## Revue de code du 15/11

Constats de la revue en lecture seule (commit 4341b94), filets posés par le lot 0 (`docs/attendus/revue-lot-0-filets.md`). Corrigés et retirés d'ici : les codes de sortie des contrôles (lot 1a), la panne d'audit rangée en échec de chargement, la clé de décision orpheline et la couleur de marque illisible (lot 1b, D18) ; `border` dans apply, le motif R9 en dur, la divergence « inchangé » avec décision, C14 et E5 (lot 2, D19, D20).

- Quatre blocs JSDoc posés au-dessus de la mauvaise fonction, si bien que `runReduce`, `buildMigration`, `renderMarkdown` et `renderReview` ne sont pas vérifiés par `@ts-check` (`src/cli/reduce.js:76`, `src/report/migration.js:166, 431`, `src/report/review.js:444`) [F].
- Annotations en retard : 69 des 77 erreurs de TypeScript non strict viennent de types JSDoc qui n'ont pas suivi les lots, surtout dans `src/reduce/propose.js`, `src/rendered/aggregate.js` et `src/browser/simulate.js` [F].
- Copie figée `fixtures/marque-demo/jetons/primitives.tokens.json` : `reduce --tokens` accepte sans le dire un fichier qui ne donne aucun jeton (le resolver passé tel quel en donne 0), et la copie, seule lue par les tests, masque ce cas (`src/cli/reduce.js:94`, `indexTokens` dans `src/report/migration.js:62`) [F].
