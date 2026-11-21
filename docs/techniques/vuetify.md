# Techniques : Vuetify

Le comment, dans Vuetify 4 (Vue 3), de chaque règle marquée « Oui » dans la colonne Technique de `docs/regles.md` (D65). Une ligne par règle, au numéro de la règle. Un autre framework remplit les mêmes lignes dans son fichier, `docs/techniques/<framework>.md` : `test/regles.test.js` (Z2) refuse une règle marquée sans sa ligne.

| Règle | Dans Vuetify | Contrôle |
|---|---|---|
| NM1 | Les variables du thème (`--v-ds-…`), les couleurs du thème (`brand-tint`, `on-avatar`) et les clés de la table `tokens/commun/vuetify.json` sont en anglais, comme les noms de Vuetify | `test/anciens-noms.test.js` (N4 à N7), `npm --prefix atelier run fiches -- --verifier` |
| NM3 | Le framework des composants est Vuetify : une prop prend son nom chez Vuetify quand le HTML n'en a pas (`variant`, `size`, `loading`) ; une valeur de Vuetify qui ne dit rien (`default`) cède au nom courant (`medium`) | Source `vuetify` dans `atelier/composants/noms.json`, `npm --prefix atelier run fiches -- --verifier` |
| CP1 | Le menu du composant déclare `ecouteurs: false` ; la fabrique (`atelier/composants/fabrique.js`) refuse alors tout attribut `on…`, la forme que Vue donne aux écouteurs | `test/fabrique-enveloppes.test.js` (W9) |
| CP3 | Le style d'un composant lit les variables de la table (`var(--v-ds-…)`) et les couleurs du thème (`rgb(var(--v-theme-…))`) ; une exception s'écrit `/* stylelint-disable-next-line <règle> -- <raison> */` | Tests de rendu (`npm --prefix atelier run preuve`) |
| CP4 | `VBtn` ne paraît que dans `DsButton`, `VTextField`, `VField` et `VInput` dans `DsTextInput`, `VCard` dans `DsCard`, `VAvatar` dans `DsAvatar`, `VChip` dans `DsTag` ; `DsIconButton` rend `DsButton` | `test/enveloppe-bouton.test.js` (E1 à E12) |
| CP9 | Un module n'importe rien de `vuetify` et n'écrit ni balise `V…` ni balise ou classe `v-…` | `test/modules.test.js` (L1) |
| CP10 | Le style d'un module ne lit que `var(--v-ds-…)` | `test/modules.test.js` (L2) |
