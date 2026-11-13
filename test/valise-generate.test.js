// @ts-check
/**
 * Lot G : générateur de valise visé par contraste (src/valise/generate.js), règles G0 à G7
 * de l'attendu du lot G (G1, G5 et G7 corrigés le 13/11/2026). Sources fictives seulement :
 * celles d'Orbe Café, une très foncée, un rose saturé, un rouge, un vert, un gris.
 * Les contrastes sont recalculés ici avec culori (wcagContrast), indépendamment du générateur.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { wcagContrast, oklch, differenceEuclidean } from 'culori';
import { TARGETS, generateScale, generateValise, checkValise, writeValise } from '../src/valise/generate.js';

const k = (/** @type {string} */ hex) => wcagContrast(hex, '#ffffff');
const dE = (/** @type {string} */ a, /** @type {string} */ b) => 100 * differenceEuclidean('oklab')(a, b);
/** Écart angulaire signé b − a, dans [−180, 180]. */
const dh = (/** @type {number} */ a, /** @type {number} */ b) => ((((b - a) % 360) + 540) % 360) - 180;
/** Tolérance relative sur un contraste visé (arrondi à l'hexadécimal). */
const near = (/** @type {number} */ got, /** @type {number} */ want, /** @type {string} */ msg) => assert.ok(Math.abs(got - want) / want <= 0.01, `${msg} : ${got.toFixed(3)}, visé ${want.toFixed(3)}`);

const SOURCES = {
  // Orbe Café (marque fictive) : neutre, bleu (foncé, k 8,61), terre, sable (clair, k 1,57), erreur, succès.
  neutre: '#8a8478',
  bleu: '#2b4c7e',
  terre: '#c8553d',
  sable: '#f0c987',
  erreur: '#d93036',
  succes: '#1f8a5b',
  // Autres sources fictives.
  nuitTresFoncee: '#120c2a',
  roseSature: '#e5005a',
  rouge: '#d63a2f',
  vert: '#1e8e4f',
  gris: '#858585',
};
const CHROMATIC = ['bleu', 'terre', 'sable', 'erreur', 'succes', 'nuitTresFoncee', 'roseSature', 'rouge', 'vert'];
/** Pas dont la teinte se mesure (chroma OKLCH ≥ 0,02, le seuil gris du lot M). */
const hued = (/** @type {string[]} */ steps) => steps.map((v, i) => ({ step: i + 1, v, o: oklch(v) })).filter((x) => (x.o.c ?? 0) >= 0.02);

test('G0 : culori seul, sans leonardo ni chroma.js', async () => {
  const src = await readFile(new URL('../src/valise/generate.js', import.meta.url), 'utf8');
  const imports = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
  assert.ok(imports.includes('culori'), 'culori importé');
  for (const i of imports) assert.ok(!/leonardo|chroma-js|chroma\b/.test(i), `import interdit : ${i}`);
});

test('G0 : chaque pas atteint son contraste visé sur blanc ; pas 9 = source exacte ; chroma jamais au-dessus de la source', () => {
  for (const name of ['neutre', 'terre', 'erreur', 'succes', 'roseSature', 'rouge', 'vert', 'gris']) {
    const s = generateScale(name, SOURCES[name]);
    assert.equal(s.school, 'normale', `${name} : école`);
    assert.equal(s.steps[8], SOURCES[name], `${name} : pas 9`);
    for (const step of [1, 2, 3, 4, 5, 6, 7, 8, 11, 12]) near(k(s.steps[step - 1]), TARGETS[step], `${name}-${step}`);
    const c9 = oklch(SOURCES[name]).c ?? 0;
    for (const [i, v] of s.steps.entries()) assert.ok((oklch(v).c ?? 0) <= c9 + 0.004, `${name}-${i + 1} : chroma ${oklch(v).c} au-dessus de la source ${c9}`);
    // Courbe de chroma : atténuée vers 1 et 12.
    if (CHROMATIC.includes(name)) {
      assert.ok((oklch(s.steps[0]).c ?? 0) < (oklch(s.steps[5]).c ?? 0), `${name} : pas 1 moins saturé que le pas 6`);
      assert.ok((oklch(s.steps[11]).c ?? 0) < c9, `${name} : pas 12 moins saturé que la source`);
    }
  }
});

test('G2 : gamut sans écrasement — les pas 12 des rouges gardent leur teinte et ne se confondent plus', () => {
  const reds = ['terre', 'erreur', 'roseSature', 'rouge'].map((n) => ({ n, s: generateScale(n, SOURCES[n]) }));
  for (const { n, s } of reds) {
    assert.notEqual(s.steps[11], '#6a0000', `${n}-12 vaut encore #6a0000`);
    assert.ok(Math.abs(dh(oklch(SOURCES[n]).h ?? 0, oklch(s.steps[11]).h ?? 0)) <= 3, `${n}-12 : teinte ${oklch(s.steps[11]).h}, source ${oklch(SOURCES[n]).h}`);
  }
  const twelves = new Set(reds.map((x) => x.s.steps[11]));
  assert.equal(twelves.size, reds.length, `pas 12 en double : ${reds.map((x) => `${x.n} ${x.s.steps[11]}`).join(', ')}`);
});

test('G2 bis : écart de teinte du pas 1 au pas 12 ≤ 3° ; décalage voulu ≤ 5° vers le chaud aux pas clairs, en option', () => {
  for (const name of CHROMATIC) {
    const s = generateScale(name, SOURCES[name]);
    const hs = hued(s.steps).map((x) => x.o.h ?? 0);
    const span = Math.max(...hs.map((a) => Math.max(...hs.map((b) => Math.abs(dh(a, b))))));
    assert.ok(span <= 3, `${name} : écart de teinte ${span.toFixed(2)}° (${hs.map((h) => h.toFixed(1)).join(', ')})`);
  }
  const shifted = generateScale('terre-décalée', SOURCES.terre, { hueShift: 4 });
  const hs = hued(shifted.steps);
  const span = Math.max(...hs.map((a) => Math.max(...hs.map((b) => Math.abs(dh(a.o.h ?? 0, b.o.h ?? 0))))));
  assert.ok(span <= 5, `décalage : écart ${span.toFixed(2)}°`);
  const h9 = oklch(SOURCES.terre).h ?? 0;
  const light = hs.filter((x) => x.step <= 8);
  assert.ok(light.some((x) => Math.abs(dh(h9, 70)) - Math.abs(dh(x.o.h ?? 0, 70)) > 1), 'décalage : un pas clair au moins plus proche du chaud (70°) que le pas 9');
  assert.equal(generateScale('terre', SOURCES.terre).signals.includes('décalage de teinte'), false, 'désactivé par défaut');
});

test('G1 : source foncée, la marque est le plein (9 exact, 10 à 12 vers le noir) ; au-delà de 13, échelle comprimée', () => {
  const bleu = generateScale('bleu', SOURCES.bleu);
  assert.equal(bleu.school, 'foncée');
  assert.equal(bleu.steps[8], SOURCES.bleu);
  const k9 = k(SOURCES.bleu);
  [0.25, 0.5, 0.8].forEach((x, i) => near(k(bleu.steps[9 + i]), k9 + (21 - k9) * x, `bleu-${10 + i}`));
  assert.ok(!bleu.signals.includes('échelle comprimée'), 'bleu (k 8,61) : pas comprimée');
  const nuit = generateScale('nuit', SOURCES.nuitTresFoncee);
  assert.ok(k(SOURCES.nuitTresFoncee) > 13);
  assert.ok(nuit.signals.includes('échelle comprimée'), `nuit : signaux ${nuit.signals.join(', ')}`);
  for (let i = 9; i < 12; i++) assert.ok(k(nuit.steps[i]) > k(nuit.steps[i - 1]), `nuit : pas ${i + 1} plus foncé que ${i}`);
});

test('G1, option « teinte seulement » : la source va au pas texte de contraste le plus proche, le pas 9 est généré', () => {
  const s = generateScale('nuit', SOURCES.nuitTresFoncee, { school: 'teinte' });
  assert.equal(s.school, 'teinte seulement');
  assert.ok(s.signals.includes('teinte seulement'));
  assert.equal(s.steps[11], SOURCES.nuitTresFoncee, 'source au pas 12 (k > 13)');
  assert.notEqual(s.steps[8], SOURCES.nuitTresFoncee);
  near(k(s.steps[10]), TARGETS[11], 'nuit-11');
  assert.ok(k(s.steps[8]) >= 4.5, 'pas 9 généré : texte blanc lisible');
  const b = generateScale('bleu', SOURCES.bleu, { school: 'teinte' });
  assert.equal(b.steps[10], SOURCES.bleu, 'bleu (k 8,61) : plus proche de 5,6 que de 13, au pas 11');
});

test('G1 corrigé : source claire, école « plein clair » (9 exact, 7 et 8 peuvent être plus foncés)', () => {
  const s = generateScale('sable', SOURCES.sable);
  assert.equal(s.school, 'plein clair');
  assert.ok(s.signals.includes('plein clair'));
  assert.equal(s.steps[8], SOURCES.sable);
  for (const step of [1, 2, 3, 4, 5, 6, 7, 8, 11, 12]) near(k(s.steps[step - 1]), TARGETS[step], `sable-${step}`);
  assert.ok(k(s.steps[9]) > k(s.steps[8]), 'pas 10 un cran plus foncé que le 9');
  near(k(s.steps[9]), Math.min(k(SOURCES.sable) * 1.18, Math.sqrt(k(SOURCES.sable) * 5.6)), 'sable-10 (G3)');
  assert.ok(wcagContrast(s.onSolid, s.steps[8]) >= 4.5 && k(s.onSolid) > 4.5, 'onSolid foncé');
});

test('G3 : k10 = min(k9 × 1,18 ; √(k9 × 5,6)), strictement entre 9 et 11 ; signal si 10 ↔ 11 < ΔE 2', () => {
  for (const name of ['neutre', 'terre', 'erreur', 'succes', 'roseSature', 'rouge', 'vert', 'gris']) {
    const s = generateScale(name, SOURCES[name]);
    const k9 = k(SOURCES[name]);
    // G4 corrigé : texte blanc, le pas 10 suit G3 ; texte foncé, il s'arrête où ce texte reste lisible
    // (21 / 4,5), ou passe un cran plus clair (k9 / 1,18) s'il ne se distinguerait plus du 9.
    const g3 = Math.min(k9 * 1.18, Math.sqrt(k9 * 5.6));
    const white = wcagContrast('#ffffff', SOURCES[name]) >= 4.5;
    const want10 = white ? g3 : s.step10 === 'plus foncé' ? Math.min(g3, (21 / 4.5) * 0.99) : k9 / 1.18;
    near(k(s.steps[9]), want10, `${name}-10 (${s.step10})`);
    if (s.step10 === 'plus foncé') assert.ok(k(s.steps[8]) < k(s.steps[9]) && k(s.steps[9]) < k(s.steps[10]), `${name} : 9 < 10 < 11`);
    else assert.ok(k(s.steps[7]) < k(s.steps[9]) && k(s.steps[9]) < k(s.steps[8]), `${name} : 8 < 10 < 9`);
    assert.equal(s.signals.includes('10 ↔ 11 < ΔE 2'), dE(s.steps[9], s.steps[10]) < 2, `${name} : signal 10 ↔ 11 (ΔE ${dE(s.steps[9], s.steps[10]).toFixed(2)})`);
  }
  // Brique fictive (k 5,31, proche du pas 11 visé à 5,6) : 10 et 11 presque confondus, signalé.
  // (Erreur, k 4,74, donne ΔE 2,03 : au-dessus du seuil, pas de signal ; vérifié par la boucle ci-dessus.)
  assert.ok(generateScale('brique', '#c23a38').signals.includes('10 ↔ 11 < ΔE 2'), 'brique (k 5,31) : 10 et 11 proches, signalé');
});

test('G4 corrigé : un seul onSolid pour les pas 9 et 10 ; le pas 10 se règle pour le garder lisible (plus foncé si possible, sinon plus clair)', async () => {
  const { onSolidOf } = /** @type {any} */ (await import('../src/report/migration.js'));
  assert.equal(typeof onSolidOf, 'function', 'migration.js : onSolidOf absent');
  for (const name of Object.keys(SOURCES)) {
    const s = generateScale(name, SOURCES[name]);
    assert.equal(typeof s.onSolid, 'string', `${name} : un seul onSolid`);
    for (const step of [9, 10]) assert.ok(wcagContrast(s.onSolid, s.steps[step - 1]) >= 4.5, `${name} : onSolid ${s.onSolid} sur ${step}`);
  }
  // Vert (k 4,17, texte foncé) : le pas 10 reste plus foncé que le 9, au plus 21 / 4,5 sur blanc.
  const vert = generateScale('vert', SOURCES.vert);
  assert.equal(vert.step10, 'plus foncé');
  assert.ok(k(vert.steps[9]) > k(vert.steps[8]) && k(vert.steps[9]) <= 21 / 4.5, `vert-10 : k ${k(vert.steps[9])}`);
  // Vert fictif à k 4,47 : un pas 10 plus foncé se distinguerait à peine (ΔE < 2) → plus clair, signalé.
  assert.ok(k('#1d8853') < 4.5);
  const lim = generateScale('limite', '#1d8853');
  assert.equal(lim.step10, 'plus clair');
  assert.ok(k(lim.steps[9]) < k(lim.steps[8]), 'limite : pas 10 plus clair que le 9');
  assert.ok(lim.signals.includes('pas 10 plus clair que le 9'));
  assert.ok(wcagContrast(lim.onSolid, lim.steps[9]) >= 4.5 && wcagContrast(lim.onSolid, lim.steps[8]) >= 4.5);
  // Échelle normale à texte blanc : le pas 10 suit G3 (plus foncé).
  assert.equal(generateScale('erreur', SOURCES.erreur).step10, 'plus foncé');
  const v = generateValise({ scales: [{ name: 'vert', source: SOURCES.vert }, { name: 'limite', source: '#1d8853' }], dims: { radii: [0], spacing: [0], fontSizes: [16] } });
  assert.equal(typeof v.onSolid.vert, 'string');
  assert.deepEqual(checkValise(v), [], 'pas 10 plus clair : accepté par G5');
  assert.equal(onSolidOf({ terre: { 9: '#220000', 10: '#ffffff' } }, 'terre', 10), '#ffffff', 'ancienne forme par pas toujours lue');
  assert.equal(onSolidOf({ terre: '#220000' }, 'terre', 10), '#220000');
});

test('G7 : contrat de paires écrit dans la valise et tenu ; échelle comprimée : le contrat dit ce qui ne tient pas', () => {
  const v = generateValise({
    scales: Object.entries(SOURCES).map(([name, source]) => ({ name, source })),
    dims: { radii: [0], spacing: [0], fontSizes: [16] },
  });
  assert.ok(v.contract?.pairs?.length, 'contrat absent');
  for (const scale of Object.keys(SOURCES)) {
    const pairs = v.contract.pairs.filter((/** @type {any} */ p) => p.scale === scale);
    const has = (/** @type {string} */ fg, /** @type {string} */ bg, /** @type {number} */ min) => pairs.some((/** @type {any} */ p) => p.fg === fg && p.bg === bg && p.min === min);
    for (const t of ['11', '12']) for (const b of ['1', '2']) assert.ok(has(t, b, 4.5), `${scale} : texte ${t} sur fond ${b}`);
    for (const b of ['1', '2', '3', '4', '5']) assert.ok(has('12', b, 4.5), `${scale} : texte 12 sur fond ${b}`);
    assert.ok(has('onSolid', '9', 4.5) && has('onSolid', '10', 4.5), `${scale} : onSolid sur 9 et 10`);
    assert.ok(has('8', '1', 3), `${scale} : bordure 8 sur fond 1`);
    assert.ok(!has('7', '1', 3), `${scale} : bordure 7 hors contrat (G7 corrigé)`);
    for (const p of pairs) {
      const color = (/** @type {string} */ s) => (s === 'onSolid' ? (typeof v.onSolid[scale] === 'string' ? v.onSolid[scale] : v.onSolid[scale][p.bg]) : v.colors.find((/** @type {any} */ c) => c.name === `${scale}-${s}`).value);
      const ratio = wcagContrast(color(p.fg), color(p.bg));
      assert.ok(Math.abs(ratio - p.ratio) < 5e-4, `${scale} : ${p.fg} sur ${p.bg}, ${p.ratio} écrit, ${ratio} recalculé`);
      assert.equal(p.ok, ratio >= p.min, `${scale} : ${p.fg} sur ${p.bg}`);
    }
  }
  assert.deepEqual(v.contract.fails, [], `contrat en échec : ${JSON.stringify(v.contract.fails)}`);
  assert.ok(v.contract.notes.some((/** @type {string} */ n) => n.startsWith('nuitTresFoncee') && n.includes('échelle comprimée')), `notes : ${v.contract.notes.join(' | ')}`);
});

test('G5 corrigé : doublons interdits dans une échelle seulement ; deux échelles peuvent partager une valeur', () => {
  // Sources fictives : un gris bleuté et un bleu nuit de teintes proches ; leurs pas clairs peuvent coïncider.
  const v = generateValise({ scales: [{ name: 'ardoise', source: '#8a8d96' }, { name: 'encre', source: '#2b3350' }], dims: { radii: [0], spacing: [0], fontSizes: [16] } });
  assert.deepEqual(checkValise(v), [], 'valise générée sans faute');
  const x = JSON.parse(JSON.stringify(v));
  x.colors.find((/** @type {any} */ c) => c.name === 'encre-1').value = x.colors.find((/** @type {any} */ c) => c.name === 'ardoise-1').value;
  assert.ok(!checkValise(x).some((f) => f.includes('doublon')), 'même valeur dans deux échelles : permis');
  for (const c of v.colors.filter((/** @type {any} */ y) => y.name !== 'blanc')) {
    const step = Number(c.name.split('-').pop());
    if (step <= 8) near(k(c.value), TARGETS[step], c.name);
  }
});

test('G5 : contrôles avant écriture — une valise fautive n’est pas écrite', async () => {
  const v = generateValise({ scales: [{ name: 'terre', source: SOURCES.terre }, { name: 'sable', source: SOURCES.sable }], dims: { radii: [0], spacing: [0], fontSizes: [16] } });
  assert.deepEqual(checkValise(v), [], 'valise générée sans faute');
  const clone = () => JSON.parse(JSON.stringify(v));
  const set = (/** @type {any} */ x, /** @type {string} */ name, /** @type {string} */ value) => (x.colors.find((/** @type {any} */ c) => c.name === name).value = value);
  const get = (/** @type {string} */ name) => v.colors.find((/** @type {any} */ c) => c.name === name).value;
  const cases = [
    ['contraste non croissant', (/** @type {any} */ x) => { set(x, 'terre-4', get('terre-6')); set(x, 'terre-6', get('terre-4')); }],
    ['doublon', (/** @type {any} */ x) => set(x, 'terre-11', get('terre-10'))],
    ['teinte', (/** @type {any} */ x) => set(x, 'terre-11', '#6a0000')],
    ['onSolid', (/** @type {any} */ x) => (x.onSolid.terre = '#ffffff') && set(x, 'terre-10', get('terre-8'))],
    ['contrat', (/** @type {any} */ x) => set(x, 'terre-12', get('terre-11'))],
  ];
  for (const [what, mutate] of cases) {
    const x = clone();
    /** @type {(x: any) => void} */ (mutate)(x);
    const fails = checkValise(x);
    assert.ok(fails.some((f) => f.includes(/** @type {string} */ (what))), `${what} : ${fails.join(' | ') || 'aucune faute vue'}`);
  }
  // Plein clair : seul le pas 9 de sable est exempté de la croissance.
  const y = clone();
  set(y, 'sable-7', get('sable-3'));
  assert.ok(checkValise(y).some((f) => f.includes('contraste non croissant')), 'plein clair : 1 → 8 reste vérifié');
  const dir = await mkdtemp(join(tmpdir(), 'ds-lab-valise-'));
  const bad = clone();
  set(bad, 'terre-11', get('terre-10'));
  await assert.rejects(writeValise(join(dir, 'v.json'), bad), /doublon/);
  await assert.rejects(access(join(dir, 'v.json')), 'la valise fautive n’est pas écrite');
  await writeValise(join(dir, 'ok.json'), v);
  await access(join(dir, 'ok.json'));
});
