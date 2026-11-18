// @ts-check
/**
 * docs/attendus/revue-lot-4-copies.md, point 1 : le contraste WCAG a une seule source,
 * contrastRatio de src/lib/color.js (réponse de Quentin du 16/11/2026) ; culori reste l'oracle indépendant des tests.
 *
 * Attendus écrits à la main avant le code (16/11/2026) :
 *   les deux calculs donnent le même nombre, à l'égalité exacte, sur toutes les paires de rôles des cinq marques, en
 *     clair et en sombre, en large et en étroit (paires et interdites) : mesuré à la confrontation, 1 248 paires pour
 *     quatre marques, écart 0 ; avec Maison Alberto (18/11/2026) : 5 marques × 4 contextes × (70 paires + 8 interdites)
 *     = 1 560 ;
 *   une entrée qui n'est pas #rrggbb lève une erreur qui la nomme : « #fff », « white », « transparent », « #ffffff80 »
 *     (aujourd'hui : NaN, en silence) ;
 *   aucun fichier de src/ n'importe wcagContrast de culori (aujourd'hui : 5 fichiers).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wcagContrast } from 'culori';
import { contrastRatio } from '../src/lib/color.js';
import { loadRoles, contratRoles } from '../src/tokens/roles.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = ['orbe-cafe', 'atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie', 'maison-alberto'];

test('W1 contrastRatio et culori : même nombre sur toutes les paires de rôles', () => {
  let n = 0;
  for (const m of MARQUES)
    for (const mode of ['clair', 'sombre'])
      for (const largeur of ['large', 'etroit']) {
        const c = contratRoles(loadRoles(join(ROOT, 'tokens', m), { mode, largeur }));
        for (const p of [...c.pairs, ...c.interdites]) {
          n++;
          assert.equal(contrastRatio(p.hexDevant, p.hexFond), wcagContrast(p.hexDevant, p.hexFond), `${m} ${mode} ${largeur} : ${p.devant} sur ${p.fond}`);
        }
      }
  assert.equal(n, 1560);
});

test('W2 une entrée qui n’est pas #rrggbb lève en la nommant', () => {
  for (const x of ['#fff', 'white', 'transparent', '#ffffff80']) {
    assert.throws(() => contrastRatio(x, '#000000'), (e) => e instanceof Error && e.message.includes(`« ${x} »`), x);
    assert.throws(() => contrastRatio('#000000', x), (e) => e instanceof Error && e.message.includes(`« ${x} »`), x);
  }
});

/** @param {string} d @returns {string[]} */
const sources = (d = join(ROOT, 'src')) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(join(d, e.name)) : e.name.endsWith('.js') ? [relative(ROOT, join(d, e.name))] : []));

test('W3 une source : aucun fichier de src/ n’importe wcagContrast', () => {
  const found = sources().filter((f) => /import\s*\{[^}]*\bwcagContrast\b[^}]*\}\s*from\s*'culori'/.test(readFileSync(join(ROOT, f), 'utf8')));
  assert.deepEqual(found, []);
});
