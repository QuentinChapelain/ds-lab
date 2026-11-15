#!/usr/bin/env node
// @ts-check
/**
 * Séance 3a, T3 : contrôle des paires de rôles d'Orbe Café.
 * Sort en 1 si une paire est sous son seuil sans exception écrite, sinon en 0.
 * Le contrat par échelle (contractOf) est affiché pour information ; il ne change pas le code de sortie.
 * Étape 4, séance a : --marque <dossier> contrôle la marque de ce dossier ; sans l'option, Orbe Café.
 * Étape 4, séance b : la marque se lit par son resolver (marque.resolver.json), avec les couches communes de tokens/commun/.
 * Étape 4b, lot 3 : --mode clair|sombre et --largeur large|etroit choisissent le contexte du resolver (clair et large par
 * défaut) ; un contexte inconnu sort en 2.
 * Usage : npm run contraste [-- --paires <fichier>] [--marque <dossier>] [--mode clair|sombre] [--largeur large|etroit]
 */
import { parseArgs } from 'node:util';
import { loadRoles, contrat } from '../tokens/roles.js';
import { ORBE } from '../tokens/resolver.js';

const { values } = parseArgs({ options: { paires: { type: 'string' }, marque: { type: 'string' }, mode: { type: 'string' }, largeur: { type: 'string' } } });
/** @type {ReturnType<typeof contrat>} */
let c;
try {
  c = contrat(loadRoles(values.marque ?? ORBE, { paires: values.paires, mode: values.mode, largeur: values.largeur }));
} catch (e) {
  console.error(`contraste : ${/** @type {Error} */ (e).message}`);
  process.exit(2);
}
// Étape 4b, lot 3 : hors du contexte par défaut, la sortie nomme le contexte ; par défaut, elle reste celle d'avant.
const mode = values.mode ?? 'clair';
const largeur = values.largeur ?? 'large';
if (mode !== 'clair' || largeur !== 'large') console.log(`mode ${mode}, largeur ${largeur}`);

const fr = (/** @type {number} */ n) => n.toFixed(2).replace('.', ',');
const plural = (/** @type {number} */ n, /** @type {string} */ one, /** @type {string} */ many) => `${n} ${n > 1 ? many : one}`;

let group = '';
for (const p of c.roles.pairs) {
  const g = p.devant.split('.')[0];
  if (g !== group) console.log(`\n${(group = g)}`);
  const mark = p.ok ? '✓' : p.exception ? '~' : '✗';
  console.log(`  ${mark} ${p.devant} sur ${p.fond} : ${fr(p.ratio)}:1, seuil ${fr(p.min)}:1${p.exception ? ` (exception : ${p.exception})` : ''}`);
}

console.log(`\n${plural(c.roles.pairs.length, 'paire', 'paires')} de rôles, ${plural(c.roles.fails.length, 'paire en échec', 'paires en échec')}, ${plural(c.roles.exceptions.length, 'exception écrite', 'exceptions écrites')}, ${plural(c.roles.interdites.length, 'paire interdite', 'paires interdites')}.`);
for (const p of c.roles.fails) console.log(`  ✗ ${p.devant} sur ${p.fond} : ${fr(p.ratio)}:1 < ${fr(p.min)}:1`);
for (const p of c.roles.interdites) console.log(`  ⊘ ${p.devant} sur ${p.fond} (${fr(p.ratio)}:1) : interdite, ${p.regle}`);

if (c.echelles.fails.length) {
  console.log(`\nContrat par échelle (contractOf, pour information) : ${plural(c.echelles.fails.length, 'écart', 'écarts')}.`);
  for (const f of c.echelles.fails) console.log(`  · ${f}`);
}
process.exit(c.roles.fails.length ? 1 : 0);
