#!/usr/bin/env node
// @ts-check
/**
 * Séance 3c, typo : écrit la planche tokens/orbe-cafe/typo.html à partir des jetons.
 * Usage : node src/cli/planche-typo.js
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { planche } from '../report/typo.js';

const dir = fileURLToPath(new URL('../../tokens/orbe-cafe/', import.meta.url));
const out = join(dir, 'typo.html');
await writeFile(out, planche(dir));
console.log(`écrit : ${out}`);
