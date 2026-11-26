// @ts-check
/**
 * L'écriture de la marque que donne le parcours, sans les captures de l'atelier (D101) : elles demandent sa version
 * construite, que les parts de npm test n'ont pas, et sont prouvées par la preuve de l'atelier (a-ta-marque). Des
 * images d'essai, unies, prennent leur place.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { COMPOSANTS, captureDe } from '../../src/parcours/diapason.js';

/** Une image PNG d'essai, unie. @param {number} l @param {number} h */
const pngDEssai = (l, h) => PNG.sync.write(Object.assign(new PNG({ width: l, height: h }), { data: Buffer.alloc(l * h * 4, 200) }));

/**
 * Lance la commande jusqu'aux captures, puis écrit une image d'essai par composant, 200 × 80 pixels.
 * @param {string} commande  la commande du parcours, qui finit par les captures
 * @param {string} dossier  le dossier de la marque
 * @param {string} cwd  la racine du clone
 */
export function ecrireSansCaptures(commande, dossier, cwd) {
  const [ecrire, captures] = commande.split(' && npm run captures -- --marque ');
  assert.ok(captures, 'la commande finit par les captures de l’atelier');
  const r = spawnSync('sh', ['-c', ecrire], { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  mkdirSync(join(dossier, 'composants'), { recursive: true });
  for (const c of COMPOSANTS) writeFileSync(join(dossier, captureDe(c.cle)), pngDEssai(200, 80));
}
