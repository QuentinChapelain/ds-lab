// @ts-check
/**
 * Police du produit (décision de Quentin, 17 h 51). En marque blanche, la police des titres est
 * celle du client ; celle du texte (et des boutons) est celle du produit, commune, déclarée une fois dans le commun.
 * Attendus écrits à la main avant le code :
 *   P1 tokens/commun/police.tokens.json déclare brand.font.body = ["system-ui", "sans-serif"] [H], et rien d'autre ;
 *      Plus le groupe police (consigne de hauteur de capitale des titres) ;
 *   P2 une entrée sans fonts.body est acceptée ; sa couche marque n'écrit que font.heading ; résolue par le
 *      resolver, brand.font.body vaut la police du produit et corps.moyen la prend ; les titres 1 à 3 prennent la
 *      police du client ;
 *   P3 fonts.heading reste demandée : absente, refus « fonts.heading, liste de noms de familles attendue » ;
 *      fonts.body vide : refus « fonts.body, liste de noms de familles attendue » ;
 *   P4 une marque qui déclare fonts.body la garde (quatre marques fictives) ; leur resolver lit le commun avant la
 *      couche marque ; Maison Alberto, sans fonts.body (18/11/2026), prend la police du produit, comme en P2, et sa
 *      couche marque n'écrit que font.heading ["National Park", "sans-serif"].
 * Correction du 18/11/2026 (D44, docs/attendus/finitions-bouton.md) : la police du produit est font.product
 * ["system-ui", "sans-serif"], que la couche marque ne remplace pas ; brand.font.body du commun en est l'alias.
 *   P1 le commun déclare font.product = ["system-ui", "sans-serif"] et brand.font.body = {font.product} ;
 *   P5 typography.label prend {font.product} : résolu, system-ui, sans-serif dans les cinq marques, même celles qui
 *      déclarent fonts.body ; corps.moyen garde la police du texte de la marque (D16).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saisir } from '../src/tokens/saisie.js';
import { dossiersDeMarque, COMMUN, lireResolver, partager } from '../src/tokens/resolver.js';
import { flattenTokens, resoudreAlias } from '../src/tokens/roles.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PRODUIT = ['system-ui', 'sans-serif'];
/** @param {string} p */
const lire = (p) => JSON.parse(readFileSync(p, 'utf8'));
/** Police résolue (alias suivis) d'un jeton des couches primitives et marque d'une marque. @param {string} d @param {string} chemin */
function policeResolue(d, chemin) {
  const { primitives, marque } = partager(lireResolver(join(d, 'marque.resolver.json')));
  const jetons = new Map([...flattenTokens(primitives), ...flattenTokens(marque)]);
  return resoudreAlias(jetons, jetons.get(chemin).$value, { depuis: chemin, chaine: [chemin] }).valeur;
}

test('P1 police du produit déclarée une fois dans le commun', () => {
  const p = lire(join(COMMUN, 'police.tokens.json'));
  // Le même fichier porte la consigne commune des titres (font.heading.cap-height, police-consigne.test.js).
  assert.deepEqual(Object.keys(p).filter((k) => !k.startsWith('$')), ['brand', 'font']);
  assert.deepEqual(Object.keys(p.brand).filter((k) => !k.startsWith('$')), ['font']);
  assert.equal(p.brand.font.$type, 'fontFamily');
  assert.deepEqual(Object.keys(p.brand.font).filter((k) => !k.startsWith('$')), ['body']);
  assert.equal(p.brand.font.body.$value, '{font.product}');
  assert.equal(p.font.product.$type, 'fontFamily');
  assert.deepEqual(p.font.product.$value, PRODUIT);
});

test('P2 entrée sans fonts.body : acceptée, police du produit pour le texte, du client pour les titres', () => {
  const dossier = mkdtempSync(join(tmpdir(), 'ds-lab-police-'));
  writeFileSync(join(dossier, 'entree.json'), JSON.stringify({ name: 'Essai', primary: '#2b4c7e', fonts: { heading: ['Georgia', 'serif'] } }));
  const r = spawnSync(process.execPath, [join(ROOT, 'src', 'cli', 'saisie.js'), join(dossier, 'entree.json')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const police = lire(join(dossier, 'marque.tokens.json')).brand.font;
  assert.deepEqual(Object.keys(police).filter((k) => !k.startsWith('$')), ['heading']);
  const { marque, semantique } = partager(lireResolver(join(dossier, 'marque.resolver.json')));
  assert.equal(marque.brand.font.body.$value, '{font.product}');
  assert.deepEqual(marque.brand.font.heading.$value, ['Georgia', 'serif']);
  assert.equal(semantique.typography.body.medium.$value.fontFamily, '{brand.font.body}');
  assert.equal(semantique.typography.heading['1'].$value.fontFamily, '{brand.font.heading}');
});

test('P3 fonts.heading demandée ; fonts.body vide refusée', () => {
  const motifs = (/** @type {any} */ fonts) => saisir({ name: 'Essai', primary: '#2b4c7e', fonts }, { dossier: '/ailleurs' }).motifs;
  assert.deepEqual(motifs({ body: ['Arial'] }), ['entrée invalide : fonts.heading, liste de noms de familles attendue']);
  assert.deepEqual(motifs({ heading: ['Georgia'], body: [] }), ['entrée invalide : fonts.body, liste de noms de familles attendue']);
  assert.deepEqual(motifs({ heading: ['Georgia'] }), []);
});

test('P4 les marques fictives gardent leur police de texte ; le commun est lu avant la couche marque', () => {
  for (const m of dossiersDeMarque().map((d) => basename(d))) {
    const d = join(ROOT, 'tokens', m);
    const r = lire(join(d, 'marque.resolver.json'));
    const sources = r.sets.marque.sources.map((/** @type {any} */ s) => s.$ref);
    assert.ok(sources.indexOf('../commun/police.tokens.json') < sources.indexOf('marque.tokens.json'), m);
    assert.deepEqual(policeResolue(d, 'brand.font.body'), lire(join(d, 'entree.json')).fonts.body ?? PRODUIT, m);
  }
  const police = lire(join(ROOT, 'tokens', 'maison-alberto', 'marque.tokens.json')).brand.font;
  assert.deepEqual(Object.keys(police).filter((k) => !k.startsWith('$')), ['heading']);
  assert.deepEqual(police.heading.$value, ['National Park', 'sans-serif']);
});

test('P5 le libellé prend toujours la police du produit ; le corps garde celle de la marque', () => {
  const corps = { 'atelier-lavandine': ['Arial', 'sans-serif'], 'ecume-et-sel': ['Verdana', 'sans-serif'], 'grenat-papeterie': ['Helvetica', 'Arial', 'sans-serif'], 'maison-alberto': PRODUIT, 'orbe-cafe': ['Orbe Sans', 'Arial', 'sans-serif'] };
  for (const [m, attendu] of Object.entries(corps)) {
    const d = join(ROOT, 'tokens', m);
    const { semantique } = partager(lireResolver(join(d, 'marque.resolver.json')));
    assert.equal(semantique.typography.label.$value.fontFamily, '{font.product}', m);
    assert.equal(semantique.typography.body.medium.$value.fontFamily, '{brand.font.body}', m);
    assert.deepEqual(policeResolue(d, 'font.product'), PRODUIT, m);
    assert.deepEqual(policeResolue(d, 'brand.font.body'), attendu, m);
  }
});
