# Techniques : Vuetify

Généré par `npm run skill` depuis `docs/techniques/vuetify.md` du clone de ds-lab : ne pas le modifier à la main, le recopier quand le clone avance.

Le comment, dans ce framework, de chaque règle marquée « Oui » dans la colonne Technique de `regles.md`. Les chemins cités sont ceux du clone : ses composants `Ds…` sont un exemple et un gabarit.

| Règle | Comment | Contrôle dans ce dépôt |
|---|---|---|
| NM1 | Les variables du thème (`--v-ds-…`), les couleurs du thème (`brand-tint`, `on-avatar`) et les clés de la table `tokens/commun/vuetify.json` sont en anglais, comme les noms de Vuetify | Non contrôlée ici |
| NM3 | Le framework des composants est Vuetify : une prop prend son nom chez Vuetify quand le HTML n'en a pas (`variant`, `size`, `loading`) ; une valeur de Vuetify qui ne dit rien (`default`) cède au nom courant (`medium`) | Non contrôlée ici |
| CP1 | Le menu du composant déclare `ecouteurs: false` ; la fabrique (`atelier/composants/fabrique.js`) refuse alors tout attribut `on…`, la forme que Vue donne aux écouteurs | Non contrôlée ici |
| CP3 | Le style d'un composant lit les variables de la table (`var(--v-ds-…)`) et les couleurs du thème (`rgb(var(--v-theme-…))`) ; une exception s'écrit `/* stylelint-disable-next-line <règle> -- <raison> */` | `verifier` (style) |
| CP4 | `VBtn` ne paraît que dans `DsButton`, `VTextField`, `VField` et `VInput` dans `DsTextInput`, `VCard` dans `DsCard`, `VAvatar` dans `DsAvatar`, `VChip` dans `DsTag` ; `DsIconButton` rend `DsButton` | Non contrôlée ici |
| CP9 | Un module n'importe rien de `vuetify` et n'écrit ni balise `V…` ni balise ou classe `v-…` | Non contrôlée ici |
| CP10 | Le style d'un module ne lit que `var(--v-ds-…)` | Non contrôlée ici |
