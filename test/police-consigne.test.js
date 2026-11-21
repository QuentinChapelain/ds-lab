// @ts-check
/**
 * Consigne commune de hauteur de capitale des styles de titre (docs/attendus/etape-4c-police-des-titres.md,
 * réponse 9). Attendus écrits à la main avant le code :
 *   C1 tokens/commun/police.tokens.json déclare font.heading.cap-height, $type number, 0,7 [H] ;
 *   C2 dans semantique.tokens.json et largeur.etroit.tokens.json, affichage et titres 1 à 3 portent
 *      $extensions["ds-lab.hauteur-capitale"] = "{font.heading.cap-height}" ; aucun autre style n'en porte ;
 *      la valeur composite garde ses cinq propriétés DTCG ;
 *   C3 typo() lit la consigne, résolue, en large et en étroit : 0,7 pour les cinq styles, rien pour les autres ;
 *      la règle « hauteur-capitale » échoue si un style de titre la perd ou si un autre style la porte ;
 *   C4 la planche typo écrit font-size-adjust: cap-height 0.7 sur les cinq styles de titre, et nulle part ailleurs ;
 *   C5 le resolver de chaque marque fictive résout la consigne (0,7).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { typo, SUR_POLICE_TITRE, CONSIGNE } from '../src/tokens/typo.js';
import { dossiersDeMarque, COMMUN, largeurs, enEtroit } from '../src/tokens/resolver.js';
import { ORBE } from './helpers/jetons.js';
import { flattenTokens } from '../src/tokens/roles.js';
import { planche } from '../src/report/typo.js';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const lire = (/** @type {string} */ f) => JSON.parse(readFileSync(join(COMMUN, f), 'utf8'));
const ALIAS = '{font.heading.cap-height}';

test('C1 jeton commun de la consigne', () => {
  const t = lire('police.tokens.json').font.heading['cap-height'];
  assert.equal(t.$type, 'number');
  assert.equal(t.$value, 0.7);
  assert.equal(CONSIGNE, 'ds-lab.hauteur-capitale');
});

test('C2 les cinq styles de titre portent la consigne, en large et en étroit', () => {
  for (const f of ['semantique.tokens.json', 'largeur.etroit.tokens.json'])
    for (const [chemin, tok] of flattenTokens(lire(f).typo)) {
      const style = chemin.replace(/\.\$root$/, '');
      assert.deepEqual(Object.keys(tok.$value).sort(), ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight'], `${f} ${style}`);
      // La note de l'équipe (ds-lab.note, DOC3, D57) n'est pas une consigne : elle est mise de côté.
      const { 'ds-lab.note': _note, ...extensions } = tok.$extensions ?? {};
      if (SUR_POLICE_TITRE.includes(style)) assert.deepEqual(extensions, { 'ds-lab.hauteur-capitale': ALIAS }, `${f} ${style}`);
      else assert.equal(tok.$extensions?.['ds-lab.hauteur-capitale'], undefined, `${f} ${style}`);
    }
});

test('C3 typo() lit la consigne ; la règle échoue si elle manque ou déborde', () => {
  const l = largeurs(ORBE);
  const run = (/** @type {any} */ sem) => typo(sem, l.large.primitives, l.large.marque, { ...l.etroit, semantique: enEtroit(sem, l.contexte) });
  const r = run(l.large.semantique);
  for (const s of r.styles) {
    const attendu = SUR_POLICE_TITRE.includes(s.style) ? 0.7 : null;
    assert.equal(s.hauteurCapitale, attendu, s.style);
    if (s.etroit) assert.equal(s.etroit.hauteurCapitale, attendu, `${s.style} étroit`);
  }
  assert.ok(r.regles.find((g) => g.id === 'hauteur-capitale')?.ok);
  const sans = structuredClone(l.large.semantique);
  delete sans.typography.heading['2'].$extensions;
  sans.typography.body.medium.$extensions = { 'ds-lab.hauteur-capitale': ALIAS };
  const g = run(sans).regles.find((x) => x.id === 'hauteur-capitale');
  assert.deepEqual(g?.details, ['heading.2 en large : consigne absente', 'body.medium en large : consigne hors des styles de titre']);
});

test('C4 la planche typo écrit la consigne sur les cinq styles de titre seulement', () => {
  const html = planche(ORBE);
  for (const s of ['display-large', 'display-medium', 'heading-1', 'heading-2', 'heading-3'])
    assert.match(html, new RegExp(`\\.t-${s} \\{[^}]*font-size-adjust: cap-height 0\\.7;`), s);
  for (const s of ['heading-4', 'body-medium', 'label', 'supporting-text']) assert.doesNotMatch(html, new RegExp(`\\.t-${s} \\{[^}]*font-size-adjust`), s);
});

test('C5 chaque marque fictive résout la consigne', () => {
  for (const m of dossiersDeMarque().map((d) => basename(d))) {
    const l = largeurs(join(ROOT, 'tokens', m));
    const r = typo(l.large.semantique, l.large.primitives, l.large.marque, { ...l.etroit, semantique: enEtroit(l.large.semantique, l.contexte) });
    assert.deepEqual(r.styles.filter((s) => s.hauteurCapitale === 0.7).map((s) => s.style), SUR_POLICE_TITRE, m);
  }
});
