#!/usr/bin/env node
// @ts-check
/**
 * T0 : écrit tokens/commun/statuts.tokens.json (avertissement, info) si checkValise passe.
 * Usage : node src/cli/statuts.js
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { checkValise } from '../valise/generate.js';
import { statutsTokens, valiseFromTokens } from '../tokens/primitives.js';

const out = fileURLToPath(new URL('../../tokens/commun/statuts.tokens.json', import.meta.url));
const tokens = statutsTokens();
const fails = checkValise(valiseFromTokens(tokens));
if (fails.length) {
  console.error(`statuts non écrits : ${fails.join(' ; ')}`);
  process.exit(1);
}
await writeFile(out, JSON.stringify(tokens, null, 2) + '\n');
console.log(`écrit : ${out}`);
