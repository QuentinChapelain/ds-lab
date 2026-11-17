#!/usr/bin/env node
// @ts-check
/**
 * Écrit tokens/commun/mode.sombre.tokens.json (neutre dessiné sur la page #121212, statuts,
 * surface, texte sur inverse) si checkValise passe sur chaque échelle, et tokens/commun/aplat.tokens.json (emplacements
 * de l'aplat plein). Dessinés une fois, communs à toutes les marques.
 * Usage : node src/cli/sombre.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkValise } from '../valise/generate.js';
import { sombreTokens, valiseFromTokens } from '../tokens/primitives.js';
import { aplatTokens } from '../tokens/pleins.js';
import { COMMUN } from '../tokens/resolver.js';
import { garderVersion } from './version.js';

garderVersion('sombre');
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
const aplat = join(COMMUN, 'aplat.tokens.json');
writeFileSync(aplat, JSON.stringify(aplatTokens(), null, 2) + '\n');
console.log(`écrit : ${aplat}`);
