#!/usr/bin/env node
// @ts-check
/**
 * Séance 3c : écrit la planche tokens/orbe-cafe/espacements.html à partir des rôles d'espacement.
 * Usage : node src/cli/planche-espaces.js
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { planche } from '../report/espacements.js';

const dir = fileURLToPath(new URL('../../tokens/orbe-cafe/', import.meta.url));
const out = join(dir, 'espacements.html');
await writeFile(out, planche(dir));
console.log(`écrit : ${out}`);
