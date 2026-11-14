#!/usr/bin/env node
// @ts-check
/**
 * Séance 3a, T4 : écrit la planche tokens/orbe-cafe/roles.html à partir des paires de rôles.
 * Usage : node src/cli/planche.js
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadRoles, contratRoles } from '../tokens/roles.js';
import { rolesHtml } from '../report/roles.js';

const dir = fileURLToPath(new URL('../../tokens/orbe-cafe/', import.meta.url));
const out = join(dir, 'roles.html');
await writeFile(out, rolesHtml(contratRoles(loadRoles(dir))));
console.log(`écrit : ${out}`);
