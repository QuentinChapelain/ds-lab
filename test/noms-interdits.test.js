// @ts-check
/**
 * Garde-fou du dépôt public : aucun fichier versionné, aucun chemin et aucun
 * message de commit ne contient un nom interdit (client réel, plateforme réelle).
 * La liste est lue dans local/noms-interdits.txt, jamais versionné : un nom par
 * ligne, casse ignorée, lignes « # » ignorées. Sans ce fichier, le test est ignoré.
 * Un écart est signalé par le numéro du nom dans la liste, jamais par le nom.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LIST = join(ROOT, 'local', 'noms-interdits.txt');

/** @type {string[] | null} */
let names = null;
try {
  names = readFileSync(LIST, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('#'))
    .map((s) => s.toLowerCase());
} catch {
  names = null;
}
const skip = names?.length ? false : 'local/noms-interdits.txt absent ou vide';

/** @param {string} text */
const found = (text) => {
  const t = text.toLowerCase();
  return (names ?? []).flatMap((n, i) => (t.includes(n) ? [`nom n° ${i + 1}`] : []));
};

test('aucun fichier versionné ne contient un nom interdit, ni dans son chemin ni dans son contenu', { skip }, () => {
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT }).toString('utf8').split('\0').filter(Boolean);
  assert.ok(files.length > 0, 'aucun fichier versionné trouvé');
  /** @type {string[]} */
  const hits = [];
  for (const f of files) {
    for (const n of found(f)) hits.push(`${f} (chemin) : ${n}`);
    let buf;
    try {
      buf = readFileSync(join(ROOT, f));
    } catch {
      continue; // fichier supprimé du disque, pas encore du dépôt
    }
    if (buf.includes(0)) continue; // binaire
    for (const n of found(buf.toString('utf8'))) hits.push(`${f} : ${n}`);
  }
  assert.deepEqual(hits, []);
});

test('aucun message de commit de la branche ne contient un nom interdit', { skip }, () => {
  const log = execFileSync('git', ['log', '--format=%h%x00%B%x01'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
  /** @type {string[]} */
  const hits = [];
  for (const entry of log.split('\x01')) {
    const [hash, body] = entry.trim().split('\0');
    if (!hash) continue;
    for (const n of found(body ?? '')) hits.push(`${hash} : ${n}`);
  }
  assert.deepEqual(hits, []);
});
