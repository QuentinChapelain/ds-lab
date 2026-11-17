// @ts-check
/**
 * Clé d'une opération de la simulation → identifiant de sa ligne décidée. Une opération porte
 * `famille|ancienne|usage[|relation]` (scanInPage, src/browser/simulate.js) ; une ligne est rangée sous la même clé, ou
 * sans relation, ou sans usage (une ligne hors des échelles n'a pas d'usage) : la clé exacte d'abord, puis sans
 * relation, puis sans usage, comme attachDeclarations (src/reduce/declarations.js).
 * @param {Map<string, string>} parCle  clé de ligne → identifiant
 * @param {string} cle  clé d'une opération
 * @returns {string | null}
 */
export function ligneDeCle(parCle, cle) {
  const p = cle.split('|');
  return parCle.get(cle) ?? parCle.get(p.slice(0, 3).join('|')) ?? parCle.get(p.slice(0, 2).join('|')) ?? null;
}
