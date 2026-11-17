// @ts-check
/**
 * Garde de version (docs/attendus/verify-se-reconnait.md, décisions de Quentin du 17/11/2026, D40). Attendus écrits à
 * la main avant le code :
 *   N1 la version majeure de Node qui tourne est comparée à celle de .node-version, seule source : même majeure,
 *      aucun refus, quelle que soit la mineure ; autre majeure, plus basse ou plus haute, un refus d'une ligne qui dit
 *      la version qui tourne et celle qui est demandée ;
 *   N2 une commande lancée sous une autre majeure sort en 2, avant de lire son entrée : une ligne sur la sortie
 *      d'erreur, préfixée par le nom de la commande, rien sur la sortie standard ;
 *   N3 chaque commande de l'outil (chaque fichier de src/cli/ qui n'est pas un module partagé, chaque script de
 *      package.json qui lance un fichier du dépôt) passe par la garde.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { refusDeVersion } from '../src/cli/version.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('N1 même majeure : aucun refus ; autre majeure : un refus d\'une ligne', () => {
  assert.equal(refusDeVersion('24.22.3', '24.22.3'), null);
  assert.equal(refusDeVersion('24.1.0', '24.22.3\n'), null);
  assert.equal(refusDeVersion('22.11.0', '24.22.3'), 'Node 22.11.0, ds-lab demande Node 24 (.node-version : 24.22.3)');
  assert.equal(refusDeVersion('25.6.1', '24.22.3'), 'Node 25.6.1, ds-lab demande Node 24 (.node-version : 24.22.3)');
});

test('N2 une commande sous une autre majeure sort en 2, une ligne, rien lu', async () => {
  const attendue = (await readFile(`${ROOT}.node-version`, 'utf8')).trim();
  const autre = `${Number(attendue.split('.')[0]) - 2}.11.0`;
  const faux = `data:text/javascript,Object.defineProperty(process.versions,'node',{value:'${autre}'})`;
  const r = await new Promise((ok) => {
    const c = spawn(process.execPath, ['--import', faux, 'src/cli/contraste.js', '--marque', 'dossier-qui-n-existe-pas'], { cwd: ROOT });
    let stdout = '';
    let stderr = '';
    c.stdout.on('data', (d) => (stdout += d));
    c.stderr.on('data', (d) => (stderr += d));
    c.on('close', (status) => ok({ status, stdout, stderr }));
  });
  assert.deepEqual(r, {
    status: 2,
    stdout: '',
    stderr: `contraste : Node ${autre}, ds-lab demande Node ${attendue.split('.')[0]} (.node-version : ${attendue})\n`,
  });
});

test('N3 chaque commande de l\'outil passe par la garde', async () => {
  const partages = new Set(['garde.js', 'version.js']);
  const fichiers = (await readdir(`${ROOT}src/cli`)).filter((f) => f.endsWith('.js') && !partages.has(f)).map((f) => `src/cli/${f}`);
  const pkg = JSON.parse(await readFile(`${ROOT}package.json`, 'utf8'));
  for (const s of Object.values(pkg.scripts)) {
    const m = /^node (\S+\.js)\b/.exec(String(s));
    if (m && !fichiers.includes(m[1])) fichiers.push(m[1]);
  }
  /** @type {string[]} */
  const sans = [];
  for (const f of fichiers) {
    const t = await readFile(`${ROOT}${f}`, 'utf8');
    if (!/\blancer\(/.test(t) && !/\bgarderVersion\(/.test(t)) sans.push(f);
  }
  assert.deepEqual(sans, []);
});
