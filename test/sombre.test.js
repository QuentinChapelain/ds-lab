// @ts-check
/**
 * Mode sombre (docs/attendus/etape-4b-contextes.md). Attendus écrits à la main
 * avant le code, chiffres par culori (wcagContrast) :
 *   page #121212 : 1,121 contre le noir ; commande : node --input-type=module -e "import {wcagContrast} from 'culori';
 *     console.log(wcagContrast('#121212','#000000'))" ;
 *   M1 couleur en sombre : pas 9 = source ; pas 1 à 7 au rapport à la page des cibles claires au pas 1 (cible ÷ 1,02),
 *      à 1 % près ; pas 8 (bordure de champ en erreur) ≥ 3:1 sur background.surface (ajout après l'image : 2,97 sinon) ; pas 11 à 9:1 et pas 12 à 12,75:1 sur la page, à 1 % près ; chroma du pas 11 au moins celle de la
 *      source (Orbe Café : bleu #2b4c7e, chroma 0,093 ; repère #8bb9ff, 0,112) ; checkValise passe ;
 *   M2 neutres dessinés : background.app à 1 % de #121212 en contraste contre le noir ; background.app < background.subtle < background.surface
 *      < background.component < survol < appui en luminance ; texte principal ≠ #ffffff ; text.default sur background.app 12,75
 *      et text.secondary sur background.app 5,49, chacun à 3 % du clair (12,68 et 5,45) ; border.strong ≥ 3 sur background.app,
 *      background.subtle et background.surface ;
 *   M3 tokens/commun/mode.sombre.tokens.json = sombreTokens (pas de dérive) ; checkValise passe ; sur-inverse = pas 1 du
 *      neutre ;
 *   M4 le fichier des rôles est le même dans les deux modes ; en clair, background.surface et text.on-inverse restent #ffffff ;
 *   M5 bouton en sombre, primaire et statuts : plein = pas 11, survol = pas 12, texte = pas 1 de l'échelle sombre, en
 *      alias ; texte sur le plein ≥ 7:1 (DS1), environ 9:1 ; l'aplat plein (background.brand.strong, text.on-brand), le
 *      bouton inversé, border.focus.inverse et l'accent fort gardent leurs valeurs claires ; text.brand.large ≥ 3:1
 *      sur les fonds sombres ;
 *   M6 fichiers sombres écrits = sortie de la saisie ; les 5 marques fictives passent le contraste en sombre.
 * Correction du 18/11/2026 (D45, docs/attendus/finitions-bouton.md) : M5, le survol n'est plus le pas 12 mais la
 *   clarté OKLCH du pas 11 + 0,05, valeur calculée, formule en $extensions["ds-lab.survol"] ; il s'éclaircit.
 *   Primaire : Atelier Lavandine #d4b5ff, Écume et Sel #ddffff, Grenat Papeterie #ffa7be, Maison Alberto #ffe17e,
 *   Orbe Café #97c6ff ; statuts, toutes marques : erreur #ffaaa2, succès #31de93, avertissement #ffe6ac, info #73ccff.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wcagContrast, oklch } from 'culori';
import { generateScale, checkValise, TARGETS } from '../src/valise/generate.js';
import { scaleToDtcg, valiseFromTokens, sombreTokens, CIBLES_SOMBRES } from '../src/tokens/primitives.js';
import { loadRoles, contratRoles, resolveRoles } from '../src/tokens/roles.js';
import { saisir, serialiser } from '../src/tokens/saisie.js';
import { COMMUN, RESOLVER, lireResolver, partager } from '../src/tokens/resolver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = ['orbe-cafe', 'atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie', 'maison-alberto'];
const PAGE = 1.121;
/** @param {string} p */
const lire = (p) => JSON.parse(readFileSync(p, 'utf8'));
const noir = (/** @type {string} */ h) => wcagContrast(h, '#000000');
const proche = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ tol) => Math.abs(a / b - 1) <= tol;
/** Rôles résolus d'une marque dans un mode. @param {string} m @param {string} mode */
const roles = (m, mode) => {
  const s = loadRoles(join(ROOT, 'tokens', m), { mode });
  const r = resolveRoles(s.semantique, s.primitives, s.marque);
  return (/** @type {string} */ role) => /** @type {any} */ (r.get(role)).hex;
};

test('M1 couleur en sombre : pas 9 = source, pas 1 à 8 calés sur la page, pas 11 à 9:1 et 12 à 12,75:1, chroma tenue', () => {
  assert.ok(proche(noir('#121212'), PAGE, 0.001));
  const g = generateScale('bleu', '#2b4c7e', { fond: 'sombre', cibles: CIBLES_SOMBRES.couleur, chromaTextes: 'max' });
  assert.equal(g.steps[8], '#2b4c7e');
  for (let i = 1; i <= 7; i++) assert.ok(proche(noir(g.steps[i - 1]) / PAGE, TARGETS[i] / 1.02, 0.01), `pas ${i} : ${noir(g.steps[i - 1]) / PAGE}`);
  assert.ok(wcagContrast(g.steps[7], roles('orbe-cafe', 'sombre')('background.surface')) >= 3, 'pas 8 : 3:1 sur background.surface');
  assert.ok(proche(noir(g.steps[10]) / PAGE, 9, 0.01), `pas 11 : ${noir(g.steps[10]) / PAGE}`);
  assert.ok(proche(noir(g.steps[11]) / PAGE, 12.75, 0.01), `pas 12 : ${noir(g.steps[11]) / PAGE}`);
  assert.ok((oklch(g.steps[10]).c ?? 0) >= 0.093, `chroma du pas 11 : ${oklch(g.steps[10]).c}`);
  assert.deepEqual(checkValise(valiseFromTokens({ color: { bleu: scaleToDtcg(g, 'essai') } })), []);
});

test('M2 neutres dessinés : page vers #121212, surfaces de plus en plus claires, textes proches du clair', () => {
  const h = roles('orbe-cafe', 'sombre');
  const c = roles('orbe-cafe', 'clair');
  assert.ok(proche(noir(h('background.app')), PAGE, 0.01), `background.app ${h('background.app')}`);
  const suite = ['background.app', 'background.subtle', 'background.surface', 'background.component', 'background.component.hover', 'background.component.pressed'].map((r) => noir(h(r)));
  for (let i = 1; i < suite.length; i++) assert.ok(suite[i] > suite[i - 1], `ordre des fonds : ${suite.map((x) => x.toFixed(3)).join(' < ')}`);
  assert.notEqual(h('text.default'), '#ffffff');
  for (const t of ['text.default', 'text.secondary']) assert.ok(proche(wcagContrast(h(t), h('background.app')), wcagContrast(c(t), c('background.app')), 0.03), t);
  for (const f of ['background.app', 'background.subtle', 'background.surface']) assert.ok(wcagContrast(h('border.strong'), h(f)) >= 3, `border.strong sur ${f}`);
  for (const b of ['border.error', 'border.success', 'border.warning', 'border.info']) assert.ok(wcagContrast(h(b), h('background.surface')) >= 3, `${b} sur background.surface`);
});

test('M3 commun sombre : fichier = sombreTokens, checkValise passe, on-inverse = pas 1 du neutre', () => {
  const ecrit = readFileSync(join(COMMUN, 'mode.sombre.tokens.json'), 'utf8');
  const attendu = sombreTokens(lire(join(COMMUN, 'primitives.tokens.json')), lire(join(COMMUN, 'statuts.tokens.json')));
  assert.equal(ecrit, JSON.stringify(attendu, null, 2) + '\n');
  assert.deepEqual(checkValise(valiseFromTokens(attendu)), []);
  assert.equal(attendu.color['on-inverse'].$value, '{color.neutral.1}');
  // Emplacements des fonds teintés en sombre (docs/attendus/carte-membre-liste.md) : pas 5 du neutre et du primaire.
  assert.deepEqual(Object.keys(attendu.color).filter((k) => !k.startsWith('$')), ['surface', 'on-inverse', 'tint', 'neutral', 'error', 'success', 'warning', 'info']);
  assert.equal(attendu.color.tint.$value, '{color.neutral.5}');
  assert.deepEqual(Object.keys(attendu).filter((k) => !k.startsWith('$')), ['color', 'brand']);
  assert.equal(attendu.brand.primary.tint.$value, '{brand.primary.5}');
});

test('M4 rôles identiques dans les deux modes ; surface et texte sur inverse blancs en clair', () => {
  const chemin = join(ROOT, 'tokens', 'orbe-cafe', RESOLVER);
  const sem = lire(join(COMMUN, 'semantique.tokens.json'));
  const { $description, ...attendus } = sem;
  for (const mode of ['clair', 'sombre']) assert.deepEqual(partager(lireResolver(chemin, { mode })).semantique, attendus, mode);
  const c = roles('orbe-cafe', 'clair');
  assert.equal(c('background.surface'), '#ffffff');
  assert.equal(c('text.on-inverse'), '#ffffff');
});

/** Survols attendus en sombre (D45), écrits à la main depuis l'attendu. */
const SURVOLS_SOMBRES = {
  primary: { 'atelier-lavandine': '#d4b5ff', 'ecume-et-sel': '#ddffff', 'grenat-papeterie': '#ffa7be', 'maison-alberto': '#ffe17e', 'orbe-cafe': '#97c6ff' },
  error: '#ffaaa2', success: '#31de93', warning: '#ffe6ac', info: '#73ccff',
};

test('M5 bouton sombre : pas 11 et 1 en alias, survol calculé qui éclaircit, texte ≥ 7:1 ; aplat plein, bouton inversé et accent fort aux valeurs claires', () => {
  const figes = ['background.brand.strong', 'text.on-brand', 'background.interactive.inverse', 'text.on-interactive.inverse', 'text.on-interactive.inverse.hover', 'border.focus.inverse', 'background.accent.strong', 'text.on-accent'];
  for (const m of MARQUES) {
    const d = join(ROOT, 'tokens', m);
    const sombre = lire(join(d, 'marque.sombre.tokens.json')).brand;
    const scale = /^\{color\.([^.]+)\.\d+\}$/.exec(lire(join(d, 'marque.tokens.json')).brand.primary['1'].$value)?.[1];
    for (const [e, s] of [['primary', scale], ['error', 'error'], ['success', 'success'], ['warning', 'warning'], ['info', 'info']]) {
      assert.equal(sombre[e].solid.$value, `{color.${s}.11}`, `${m} ${e}`);
      const survol = sombre[e]['solid-hover'];
      const attendu = e === 'primary' ? SURVOLS_SOMBRES.primary[m] : SURVOLS_SOMBRES[e];
      assert.equal(survol.$value.hex, attendu, `${m} ${e} : survol`);
      assert.deepEqual({ base: survol.$extensions['ds-lab.survol'].base, clarte: survol.$extensions['ds-lab.survol'].clarte }, { base: `{color.${s}.11}`, clarte: 0.05 }, `${m} ${e} : formule`);
      assert.equal(sombre[e]['on-solid'].$value, `{color.${s}.1}`, `${m} ${e}`);
    }
    const h = roles(m, 'sombre');
    const c = roles(m, 'clair');
    const ds1 = wcagContrast(h('text.on-interactive'), h('background.interactive.strong'));
    assert.ok(ds1 >= 7, `${m} : ${ds1}`);
    assert.ok(wcagContrast(h('text.on-interactive'), h('background.interactive.strong.hover')) >= 4.5, m);
    assert.ok(/** @type {any} */ (oklch(h('background.interactive.strong.hover'))).l > /** @type {any} */ (oklch(h('background.interactive.strong'))).l, `${m} : le survol éclaircit`);
    for (const s of ['error', 'success', 'warning', 'info']) assert.ok(wcagContrast(h(`text.on-${s}`), h(`background.${s}.strong`)) >= 7, `${m} ${s}`);
    for (const r of figes) assert.equal(h(r), c(r), `${m} : ${r}`);
    for (const f of ['background.app', 'background.surface', 'background.subtle', 'background.brand.subtle']) assert.ok(wcagContrast(h('text.brand.large'), h(f)) >= 3, `${m} : ${f}`);
  }
});

test('M6 fichiers sombres = sortie de la saisie ; les 5 marques fictives passent le contraste en sombre', () => {
  for (const m of MARQUES) {
    const dossier = join(ROOT, 'tokens', m);
    const r = saisir(lire(join(dossier, 'entree.json')), { dossier });
    assert.deepEqual(r.motifs, [], m);
    assert.equal(serialiser(r.echellesSombres), readFileSync(join(dossier, 'echelles.sombre.tokens.json'), 'utf8'), m);
    assert.equal(serialiser(r.marqueSombre), readFileSync(join(dossier, 'marque.sombre.tokens.json'), 'utf8'), m);
    assert.deepEqual(contratRoles(loadRoles(dossier, { mode: 'sombre' })).fails, [], m);
  }
});
