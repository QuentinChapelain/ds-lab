// @ts-check
/**
 * Écriture des sorties : local/audits/<hôte>/<AAAA-MM-JJTHHMM>/
 * audit.json, rapport.md, rapport.html et, avec --v1-script, v1.json.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { hostDirName } from '../lib/addresses.js';
import { renderReport } from './markdown.js';
import { renderHtml } from './html.js';

/**
 * Horodatage local, à la minute : 2026-11-11T1530.
 * @param {Date} d
 */
export function stampOf(d) {
  /** @param {number} n */
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}`;
}

/**
 * Dossier de sortie libre : suffixe -2, -3… si un audit existe déjà à la même minute.
 * @param {string} root
 * @param {string} host
 * @param {string} stamp
 */
export async function freeOutputDir(root, host, stamp) {
  const base = join(root, hostDirName(host), stamp);
  for (let i = 1; ; i++) {
    const dir = i === 1 ? base : `${base}-${i}`;
    try {
      await access(dir);
    } catch {
      return dir;
    }
  }
}

/**
 * @param {string} dir
 * @param {any} audit
 * @param {any} [v1Raw]
 * @returns {Promise<string[]>} fichiers écrits
 */
export async function writeAuditFiles(dir, audit, v1Raw) {
  await mkdir(dir, { recursive: true });
  const files = [join(dir, 'audit.json'), join(dir, 'rapport.md'), join(dir, 'rapport.html')];
  await writeFile(files[0], JSON.stringify(audit, null, 2) + '\n');
  await writeFile(files[1], renderReport(audit));
  await writeFile(files[2], renderHtml(audit));
  if (v1Raw) {
    files.push(join(dir, 'v1.json'));
    await writeFile(files[3], JSON.stringify(v1Raw, null, 2) + '\n');
  }
  return files;
}
