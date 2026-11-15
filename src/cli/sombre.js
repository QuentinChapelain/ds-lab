#!/usr/bin/env node
// @ts-check
/**
 * Étape 4b, lot 2 : écrit tokens/commun/mode.sombre.tokens.json (neutre et statuts en miroir, surface et texte sur
 * inverse au noir) si checkValise passe sur chaque échelle. Dessiné une fois, commun à toutes les marques.
 * Usage : node src/cli/sombre.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkValise } from '../valise/generate.js';
import { sombreTokens, valiseFromTokens } from '../tokens/primitives.js';
import { COMMUN } from '../tokens/resolver.js';

const read = (/** @type {string} */ f) => JSON.parse(readFileSync(join(COMMUN, f), 'utf8'));
const tokens = sombreTokens(read('primitives.tokens.json'), read('statuts.tokens.json'));
const fails = checkValise(valiseFromTokens(tokens));
if (fails.length) {
  console.error(`mode sombre non écrit : ${fails.join(' ; ')}`);
  process.exit(1);
}
const out = join(COMMUN, 'mode.sombre.tokens.json');
writeFileSync(out, JSON.stringify(tokens, null, 2) + '\n');
console.log(`écrit : ${out}`);
