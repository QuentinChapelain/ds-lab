// @ts-check
/**
 * Revue de code, lot 6 (D31) : texte du contrôle de contraste d'une marque, lu par npm run contraste et par la saisie, qui
 * l'affiche après son contrôle final, sans relancer la commande en sous-processus.
 * Hors du contexte par défaut (clair, large), la sortie nomme le contexte (étape 4b, lot 3).
 */
import { fr } from '../lib/format.js';

const D2 = { decimales: 2, zeros: true };
const plural = (/** @type {number} */ n, /** @type {string} */ one, /** @type {string} */ many) => `${n} ${n > 1 ? many : one}`;

/**
 * Lignes à écrire, une par appel à console.log (une ligne peut commencer par un saut de ligne).
 * @param {ReturnType<typeof import('../tokens/roles.js').contrat>} c @param {{ mode?: string, largeur?: string }} [contexte]
 * @returns {string[]}
 */
export function lignesContraste(c, { mode = 'clair', largeur = 'large' } = {}) {
  /** @type {string[]} */
  const L = [];
  if (mode !== 'clair' || largeur !== 'large') L.push(`mode ${mode}, largeur ${largeur}`);
  let group = '';
  for (const p of c.roles.pairs) {
    const g = p.devant.split('.')[0];
    if (g !== group) L.push(`\n${(group = g)}`);
    const mark = p.ok ? '✓' : p.exception ? '~' : '✗';
    L.push(`  ${mark} ${p.devant} sur ${p.fond} : ${fr(p.ratio, D2)}:1, seuil ${fr(p.min, D2)}:1${p.exception ? ` (exception : ${p.exception})` : ''}`);
  }
  L.push(`\n${plural(c.roles.pairs.length, 'paire', 'paires')} de rôles, ${plural(c.roles.fails.length, 'paire en échec', 'paires en échec')}, ${plural(c.roles.exceptions.length, 'exception écrite', 'exceptions écrites')}, ${plural(c.roles.interdites.length, 'paire interdite', 'paires interdites')}.`);
  for (const p of c.roles.fails) L.push(`  ✗ ${p.devant} sur ${p.fond} : ${fr(p.ratio, D2)}:1 < ${fr(p.min, D2)}:1`);
  for (const p of c.roles.interdites) L.push(`  ⊘ ${p.devant} sur ${p.fond} (${fr(p.ratio, D2)}:1) : interdite, ${p.regle}`);
  if (c.echelles.fails.length) {
    L.push(`\nContrat par échelle (contractOf, pour information) : ${plural(c.echelles.fails.length, 'écart', 'écarts')}.`);
    for (const f of c.echelles.fails) L.push(`  · ${f}`);
  }
  return L;
}
