#!/usr/bin/env node
// @ts-check
/**
 * Séance 3b : écrit tokens/orbe-cafe/marque.tokens.json (emplacements de marque d'Orbe Café,
 * règle des pleins en trois cas) à partir de primitives.tokens.json et statuts.tokens.json.
 * Usage : node src/cli/emplacements.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { marqueTokens } from '../tokens/pleins.js';

const dir = fileURLToPath(new URL('../../tokens/orbe-cafe/', import.meta.url));
const read = (/** @type {string} */ f) => JSON.parse(readFileSync(join(dir, f), 'utf8')).couleur;
const prim = read('primitives.tokens.json');
const stat = read('statuts.tokens.json');
const steps = (/** @type {string} */ s) => Array.from({ length: 12 }, (_, i) => (prim[s] ?? stat[s])[String(i + 1)].$value.hex);
const src = (/** @type {string} */ s) => ({ scale: s, steps: steps(s) });

const tokens = marqueTokens({
  primaire: src('bleu'),
  accent: src('terre'),
  statuts: { erreur: src('erreur'), succes: src('succes'), avertissement: src('avertissement'), info: src('info') },
  description:
    "Emplacements de marque d'Orbe Café (marque fictive), séance 3b du 15/11/2026. Format DTCG 2025.10. Les rôles de semantique.tokens.json pointent vers marque.<emplacement>.* ; chaque emplacement pointe vers une échelle, et ses pleins suivent la règle en trois cas (sombre, moyen, clair) lue sur le pas 9. Alias seulement, sauf le survol d'un plein sombre (voile blanc 8 %, valeur calculée, formule en $extensions). Changer de marque, c'est changer ce fichier.",
});
const out = join(dir, 'marque.tokens.json');
writeFileSync(out, JSON.stringify(tokens, null, 2) + '\n');
console.log(`écrit : ${out}`);
