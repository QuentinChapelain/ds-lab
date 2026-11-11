# Script v1 factice (tests)

Remplace le vrai script v1, qui reste hors du dépôt, pour tester l'option
`--v1-script` : même nom de fonction (`window.dsAudit`), même forme de résultat,
valeurs simples calculées sur la page.

```js
window.dsAudit = async function (pages = []) {
  const visible = [...document.body.querySelectorAll('*')].filter(
    (el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden',
  );
  return {
    rules: 0,
    rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
    declared: { colors: 1, opaque: 1, once: 1, groups_dE2: 1, groups_dE5: 1, sizes: 1, topColors: '', topSizes: '', bySource: { inline: 1 } },
    rendered: { elements: visible.length, colors: 0, sizes: '', topColors: '' },
    pagesDemandees: pages.length,
  };
};
```
