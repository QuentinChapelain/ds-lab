# Le gabarit

Toutes les pages de Quai Nord ont le même gabarit, `src/gabarit/`. Une page décrit son intérieur ; elle ne refait ni la barre du haut, ni le bandeau, ni le pied.

## `GabaritPage`

```vue
<GabaritPage titre="Événements" chapo="Ce qui se prépare dans le réseau, ville par ville.">
  <template #bandeau>…</template>
  …
</GabaritPage>
```

- `titre` : le titre de la page, en h1, dans le bandeau.
- `chapo` : une phrase sous le titre, facultative.
- slot `bandeau` : ce qui se pose sous le titre, sur l'aplat de la marque, facultatif. Le texte y est dans la couleur de l'aplat.
- slot par défaut : le contenu de la page, à la largeur du gabarit. Ses enfants directs sont les sections de la page, espacées par le gabarit.

La barre du haut liste les pages de `src/router.js` qui ont un `meta.titre`, dans leur ordre. Elle change de marque et de mode, que l'adresse porte (`?marque=…&mode=sombre`).

## `SectionPage`

```vue
<SectionPage titre="Actualités">…</SectionPage>
```

- `titre` : le titre de la section, en h2.
- `chapo` : une phrase sous le titre, facultative.
- slot par défaut : le contenu de la section.

## Ce que le thème ne porte pas

L'aplat, les titres, l'écart entre sections et la largeur de page n'ont pas de variable dans le thème. Ils vivent ici et nulle part ailleurs, chacun avec sa raison.
