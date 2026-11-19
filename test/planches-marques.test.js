// @ts-check
/**
 * Planches des cinq marques, même code (docs/attendus/revue-lot-5-marque.md, Q4 et Q5).
 * Sans navigateur ; les tests de mise en page restent sur une marque (roles-, espacements-, typo-planche.test.js), après
 * une mesure faite une fois sur les quatre premières.
 *
 * Attendus écrits à la main avant le code (16/11/2026) :
 *   P1 chaque marque de tokens/ (dossiersDeMarque) a ses trois planches versionnées, roles.html, espacements.html et
 *      typo.html, égales à la sortie de leur fonction (planche(dossier) de src/report/roles.js, espacements.js, typo.js) :
 *      15 fichiers ;
 *   P2 chaque planche nomme sa marque, lue dans le champ name du resolver, dans son <title> et dans son <h1>, et ne nomme
 *      aucune autre marque ;
 *   P3 le texte d'essai du spécimen de la typo est « <nom> ouvre le mardi », une fois par style (13 styles, dont les deux des initiales de l'avatar) ;
 *   P4 node src/cli/planche.js --marque <dossier> : seule cette marque ; une option ou une planche inconnue sort en 2
 *      (planche-commande.test.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dossiersDeMarque, nomDeMarque } from '../src/tokens/resolver.js';
import { planche as roles } from '../src/report/roles.js';
import { planche as espacements } from '../src/report/espacements.js';
import { planche as typo } from '../src/report/typo.js';

const PLANCHES = /** @type {const} */ ([['roles.html', roles], ['espacements.html', espacements], ['typo.html', typo]]);
const MARQUES = dossiersDeMarque();
const NOMS = MARQUES.map(nomDeMarque);
/** @param {string} s */
const echap = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

test('P1 quinze planches versionnées, égales à la sortie de leur fonction', () => {
  assert.equal(MARQUES.length, 5);
  for (const d of MARQUES) for (const [f, page] of PLANCHES) assert.equal(readFileSync(join(d, f), 'utf8'), page(d), join(d, f));
});

test('P2 chaque planche nomme sa marque, et elle seule', () => {
  MARQUES.forEach((d, i) => {
    for (const [f] of PLANCHES) {
      const html = readFileSync(join(d, f), 'utf8');
      const nom = echap(NOMS[i]);
      assert.ok(new RegExp(`<title>[^<]*${nom}</title>`).test(html), `${d}${f} : titre`);
      assert.ok(new RegExp(`<h1[^>]*>[^<]*${nom}</h1>`).test(html), `${d}${f} : h1`);
      for (const autre of NOMS.filter((n) => n !== NOMS[i])) assert.ok(!html.includes(echap(autre)), `${d}${f} : ${autre}`);
    }
  });
});

test('P3 texte d\'essai du spécimen : « <nom> ouvre le mardi », une fois par style', () => {
  MARQUES.forEach((d, i) => {
    const html = readFileSync(join(d, 'typo.html'), 'utf8');
    assert.equal(html.split(`${echap(NOMS[i])} ouvre le mardi`).length - 1, 13, d);
    assert.ok(!html.includes('torréfie le mardi'), d);
  });
});
