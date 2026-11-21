# Dette connue

État au 21/11/2026. Ce fichier ne porte que la dette à payer, chacune avec son moment. Les limites acceptées sont écrites à leur place, sous leur décision (puce « Limite »), dans les fiches, le README ou ARCHITECTURE (D64) ; ce qui manque au design system est dans `docs/feuille-de-route.md`.

## À payer à l'étape 9

- Écarts aux règles d'écriture (D65, `docs/regles.md`), un contrôle à écrire ou à élargir chacun :
  - DS1 : rien ne relit la règle sur les jetons écrits ; dans `npm run contraste`, un texte foncé sur un plein doit atteindre 7:1 sur le plein et 4,5:1 sur le survol (environ 30 min [H]).
  - DS9 : la liste « sans rôle » s'affiche sans bloquer ; chaque entrée de `tokens/commun/vuetify.json` doit nommer un rôle, non une primitive (environ 20 min [H]).
  - DS13 : aucun contrôle ; aucun rôle d'interaction (`background.interactive`, `border.focus`, lien) ne doit pointer sur l'accent, lu dans `tokens/commun/semantique.tokens.json` et la table du thème (environ 20 min [H]).
  - CP7 : seuls `DsTag` et `MemberCard` sont vérifiés ; rejouer chaque menu avec un texte de 10 000 caractères dans chaque option texte, aucun refus attendu (environ 20 min [H]).
  - Listes fixes de DS3 (planche d'Orbe Café, preuve de `DsTag`), DS10 (styles écrits dans `test/typo-jetons.test.js`), DS15 (contour de `DsTextInput`), CP4 (sept pièces de Vuetify), CP5 (attributs retirés, menu par menu) et CP6 (preuve de `DsCard`) : chacune à relire pour tout composant ou tout style quand la pièce suivante arrive (de 20 min à 1 h chacune [H]).
  - Valeurs recopiées de NM2 (comptes de Component Gallery dans `atelier/composants/noms.json`), NM3 (source déclarée à la main), DF1 (`test/bouton-jetons.test.js`) et DF2 (`test/typo-jetons.test.js`).
  - Onze tests comparent des valeurs écrites à la main pour chaque marque et chaque thème : A3, A6 et A7 (`test/avatar-etiquette.test.js`), B3 et B5 (`test/bouton-jetons.test.js`), H2 (`test/champ-carte-jetons.test.js`), la colonne de `test/calibrage.test.js`, trois tests de `test/marques-fictives.test.js`, M5 (`test/sombre.test.js`), le grand texte de `test/aplats.test.js` et P5 (`test/police-produit.test.js`), environ 115 lignes ; ils lisent les marques du dossier `tokens/` (D65), et une sixième marque les fait échouer sur une clé absente ; U5 (`test/fiches.test.js`) écrit en dur le plus bas rapport. À garder pour une marque, comme fixture, avec des relations pour toutes (environ une demi-journée [H]).
  - CP10 : le message de L2 (`test/modules.test.js`) nomme la déclaration sans dire quoi faire.

## À payer à l'étape 10

- Thèmes Vuetify (D41) : seules les couleurs de thème, les deux polices et les variables `ds-` des enveloppes (D43, D49, D50) viennent de nos jetons. Restent celles de Vuetify, lues dans le code de thème de vuetify 4.3.4 (`createTheme`) [F] : bordure (`border-color` noir ou blanc à 12 %), ombre, couleurs `kbd` et `code`, et les opacités des états. Les enveloppes n'en lisent aucune : le survol du bouton est un jeton, le voile de Vuetify est retiré ; le contour, l'opacité et l'animation du champ de Vuetify sont remplacés ; l'ombre nulle que la carte `flat` garde est retirée ; un composant Vuetify utilisé sans enveloppe les garderait.
- Thèmes Vuetify : `surface-variant`, `surface-bright` et `surface-light` sont des hypothèses [H], à juger sur les composants. `primary-darken-1` sert de survol au bouton principal : à juger sur les planches du bouton (`local/button-captures/`). `secondary` (l'accent) n'atteint pas un bouton : l'enveloppe ne transmet aucune couleur et refuse tout attribut hors de sa liste (D43) ; un autre composant Vuetify utilisé sans enveloppe le pourrait encore.
- Classes de texte de Vuetify 4 : `--v-font-heading` est lue par sept classes (display large, moyen, petit ; headline large, moyen, petit ; title large), à chaque largeur [F, lu dans la feuille compilée de vuetify 4.3.4] ; nos titres sont cinq (affichage grand et moyen, titres 1 à 3 ; le titre 4 prend la police du texte, D16). Correspondance des styles de texte à faire, hors des thèmes.

## À payer après l'étape 11

- Valise de démonstration (`fixtures/marque-demo/cible-valise.json`, D62) : ses échelles gardent leurs noms français (`bleu`, `terre`, `sable`) comme tout le vocabulaire de la valise (`'neutre'` dans `src/reduce/propose.js` et `src/brand/brand.js`) ; les jetons d'Orbe Café sont en anglais. Le texte posé sur un plein ne se relie plus à son jeton par le nom de l'échelle : dans la démonstration, `#220000` sur `terre-9` n'a plus de jeton (`color.earth.on-solid` avant), et son couplage n'a plus de variable (`test/simulation-couplages.test.js`, `test/e2e-migration-decisions.test.js`). À trancher : renommer le vocabulaire de la valise, ou relier valise et jetons par la valeur du pas 9.
