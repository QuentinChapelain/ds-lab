// L'aplat plein de la marque (background.brand.strong) et son texte (text.on-brand). Le thème de ds-lab ne les porte pas ;
// leur valeur est celle du primaire du thème clair, dans les deux modes.

/**
 * Les thèmes d'une marque, avec les couleurs brand-strong et on-brand-strong.
 * @param {Record<string, { dark: boolean, colors: Record<string, string>, variables: Record<string, string> }>} themes
 */
export function avecAplat(themes) {
  const clair = Object.values(themes).find((t) => !t.dark);
  const aplat = { 'brand-strong': clair.colors.primary, 'on-brand-strong': clair.colors['on-primary'] };
  return Object.fromEntries(Object.entries(themes).map(([nom, t]) => [nom, { ...t, colors: { ...t.colors, ...aplat } }]));
}
