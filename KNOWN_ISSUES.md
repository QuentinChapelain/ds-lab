# Dette connue

État au 21/11/2026. Ce fichier ne porte que la dette à payer, chacune avec son moment. Les limites acceptées sont écrites à leur place, sous leur décision (puce « Limite »), dans les fiches, le README ou ARCHITECTURE (D64) ; ce qui manque au design system est dans `docs/feuille-de-route.md`.

## À payer à l'étape 9

- CP3, aucune valeur en dur : pas de garde de lecture du style des `.vue` des composants avant l'étape 9 (les modules ont la leur, L2) ; elle trouverait deux cas [F] : `1px` du texte caché aux yeux (bouton, champ), justifié, et `1s` de la roue de chargement (B2, `docs/feuille-de-route.md`).

## À payer à l'étape 10

- Thèmes Vuetify (D41) : seules les couleurs de thème, les deux polices et les variables `ds-` des enveloppes (D43, D49, D50) viennent de nos jetons. Restent celles de Vuetify, lues dans le code de thème de vuetify 4.3.4 (`createTheme`) [F] : bordure (`border-color` noir ou blanc à 12 %), ombre, couleurs `kbd` et `code`, et les opacités des états. Les enveloppes n'en lisent aucune : le survol du bouton est un jeton, le voile de Vuetify est retiré ; le contour, l'opacité et l'animation du champ de Vuetify sont remplacés ; l'ombre nulle que la carte `flat` garde est retirée ; un composant Vuetify utilisé sans enveloppe les garderait.
- Thèmes Vuetify : `surface-variant`, `surface-bright` et `surface-light` sont des hypothèses [H], à juger sur les composants. `primary-darken-1` sert de survol au bouton principal : à juger sur les planches du bouton (`local/button-captures/`). `secondary` (l'accent) n'atteint pas un bouton : l'enveloppe ne transmet aucune couleur et refuse tout attribut hors de sa liste (D43) ; un autre composant Vuetify utilisé sans enveloppe le pourrait encore.
- Classes de texte de Vuetify 4 : `--v-font-heading` est lue par sept classes (display large, moyen, petit ; headline large, moyen, petit ; title large), à chaque largeur [F, lu dans la feuille compilée de vuetify 4.3.4] ; nos titres sont cinq (affichage grand et moyen, titres 1 à 3 ; le titre 4 prend la police du texte, D16). Correspondance des styles de texte à faire, hors des thèmes.

## À payer après l'étape 11

- Valise de démonstration (`fixtures/marque-demo/cible-valise.json`, D62) : ses échelles gardent leurs noms français (`bleu`, `terre`, `sable`) comme tout le vocabulaire de la valise (`'neutre'` dans `src/reduce/propose.js` et `src/brand/brand.js`) ; les jetons d'Orbe Café sont en anglais. Le texte posé sur un plein ne se relie plus à son jeton par le nom de l'échelle : dans la démonstration, `#220000` sur `terre-9` n'a plus de jeton (`color.earth.on-solid` avant), et son couplage n'a plus de variable (`test/simulation-couplages.test.js`, `test/e2e-migration-decisions.test.js`). À trancher : renommer le vocabulaire de la valise, ou relier valise et jetons par la valeur du pas 9.
