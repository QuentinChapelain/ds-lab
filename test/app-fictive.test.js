// @ts-check
/**
 * L'app fictive du banc d'essai (D67, docs/attendus/etape-10-banc.md) : Quai Nord, une app Vuetify déjà remplie, sans
 * annuaire, que le banc copie hors du dépôt pour chaque passage. Statique : l'app n'est ni installée ni construite ici.
 *   AF1 mêmes versions que l'atelier pour Vue, Vuetify, Vite, son greffon Vue et @mdi/js, dans package.json et dans
 *       le verrou ;
 *   AF2 ni composant Ds…, ni page ni adresse d'annuaire, ni mention de ds-lab dans ce que le banc copie ;
 *   AF3 les dix personnes de l'atelier, dans le même ordre, chacune avec les champs que le brief demande, et chaque cas
 *       présent : sans photo, photo perdue, sans promo, sans groupe, sans ouverture, nom long ;
 *   AF4 chaque entrée de marque égale celle de tokens/, à l'octet ; banc.json nomme exactement ces marques.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const APP = join(ROOT, 'fixtures', 'app-fictive');
const json = (/** @type {string} */ f) => JSON.parse(readFileSync(f, 'utf8'));
/** Les fichiers de l'app pour git, sans banc.json, que le banc ne copie pas. */
const copies = () =>
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '.'], { cwd: APP, encoding: 'utf8' })
    .split('\n')
    .filter((f) => f && f !== 'banc.json');

test('AF1 mêmes versions que l’atelier, dans package.json et le verrou', () => {
  const atelier = json(join(ROOT, 'atelier', 'package.json')).devDependencies;
  const app = json(join(APP, 'package.json'));
  const toutes = { ...app.dependencies, ...app.devDependencies };
  const verrou = json(join(APP, 'package-lock.json')).packages;
  for (const p of ['vue', 'vuetify', 'vite', '@vitejs/plugin-vue', '@mdi/js']) {
    assert.equal(toutes[p], atelier[p], p);
    assert.equal(verrou[`node_modules/${p}`]?.version, atelier[p], `${p} dans le verrou`);
  }
});

test('AF2 ni composant Ds…, ni annuaire, ni ds-lab dans ce que le banc copie', () => {
  const fichiers = copies();
  assert.ok(fichiers.includes('src/App.vue') && fichiers.includes('src/data/membres.js'), fichiers.join(', '));
  for (const f of fichiers.filter((x) => !x.endsWith('package-lock.json'))) {
    const t = readFileSync(join(APP, f), 'utf8');
    assert.doesNotMatch(t, /\bDs[A-Z]\w*/, f);
    assert.doesNotMatch(t, /ds-lab/i, f);
  }
  assert.ok(!fichiers.some((f) => /annuaire|membre/i.test(f.replace('src/data/membres.js', ''))), 'un fichier d’annuaire');
  const routes = readFileSync(join(APP, 'src', 'router.js'), 'utf8');
  assert.doesNotMatch(routes, /annuaire|membre/i);
});

test('AF3 les dix personnes de l’atelier, les champs du brief, chaque cas', async () => {
  const atelier = [...readFileSync(join(ROOT, 'atelier', 'stories', 'membres.js'), 'utf8').matchAll(/\bname: (['"])(.+?)\1/g)].map((m) => m[2]);
  assert.equal(atelier.length, 10);
  const { MEMBRES } = await import(pathToFileURL(join(APP, 'src', 'data', 'membres.js')).href);
  assert.deepEqual(MEMBRES.map((/** @type {any} */ m) => m.nom), atelier);
  for (const m of MEMBRES) {
    for (const c of ['nom', 'profil', 'poste', 'ville', 'ecrire']) assert.equal(typeof m[c], 'string', `${m.nom} : ${c}`);
    assert.equal(typeof m.entreprise?.nom, 'string', `${m.nom} : entreprise`);
    assert.match(m.entreprise.lien, /^\/entreprises\/[a-z0-9-]+$/, `${m.nom} : lien de l'entreprise`);
    assert.match(m.profil, /^\/membres\/[a-z0-9-]+$/);
    assert.match(m.ecrire, /^\/messages\/nouveau\?a=[a-z0-9-]+$/);
    if (m.ouvertures) assert.ok(m.ouvertures.length > 0 && m.ouvertures.every((/** @type {any} */ o) => typeof o === 'string'), m.nom);
  }
  const cas = {
    'sans photo': MEMBRES.some((/** @type {any} */ m) => !m.photo),
    'photo perdue': MEMBRES.some((/** @type {any} */ m) => m.photo === 'data:image/png;base64,AAAA'),
    'sans promo': MEMBRES.some((/** @type {any} */ m) => !m.promo),
    'sans groupe': MEMBRES.some((/** @type {any} */ m) => !m.groupe),
    'sans ouverture': MEMBRES.some((/** @type {any} */ m) => !m.ouvertures),
    'nom long': MEMBRES.some((/** @type {any} */ m) => m.nom.length >= 40),
  };
  assert.deepEqual(Object.entries(cas).filter(([, v]) => !v), []);
});

test('AF4 les entrées des marques égalent celles de tokens/, banc.json les nomme', () => {
  const dossiers = readdirSync(join(APP, 'tokens')).sort();
  assert.equal(dossiers.length, 3);
  for (const d of dossiers) assert.equal(readFileSync(join(APP, 'tokens', d, 'entree.json'), 'utf8'), readFileSync(join(ROOT, 'tokens', d, 'entree.json'), 'utf8'), d);
  assert.deepEqual([...json(join(APP, 'banc.json')).marques].sort(), dossiers);
});
