// @ts-check
/**
 * Mode sombre (docs/attendus/etape-4b-contextes.md). Attendus écrits à la main
 * avant le code, chiffres par culori (wcagContrast) :
 *   page #121212 : 1,121 contre le noir ; commande : node --input-type=module -e "import {wcagContrast} from 'culori';
 *     console.log(wcagContrast('#121212','#000000'))" ;
 *   M1 couleur en sombre : pas 9 = source ; pas 1 à 7 au rapport à la page des cibles claires au pas 1 (cible ÷ 1,02),
 *      à 1 % près ; pas 8 (bordure de champ en erreur) ≥ 3:1 sur fond.surface (ajout après l'image : 2,97 sinon) ; pas 11 à 9:1 et pas 12 à 12,75:1 sur la page, à 1 % près ; chroma du pas 11 au moins celle de la
 *      source (Orbe Café : bleu #2b4c7e, chroma 0,093 ; repère #8bb9ff, 0,112) ; checkValise passe ;
 *   M2 neutres dessinés : fond.app à 1 % de #121212 en contraste contre le noir ; fond.app < fond.discret < fond.surface
 *      < fond.composant < survol < appui en luminance ; texte principal ≠ #ffffff ; texte.principal sur fond.app 12,75
 *      et texte.secondaire sur fond.app 5,49, chacun à 3 % du clair (12,68 et 5,45) ; bordure.forte ≥ 3 sur fond.app,
 *      fond.discret et fond.surface ;
 *   M3 tokens/commun/mode.sombre.tokens.json = sombreTokens (pas de dérive) ; checkValise passe ; sur-inverse = pas 1 du
 *      neutre ;
 *   M4 le fichier des rôles est le même dans les deux modes ; en clair, fond.surface et texte.sur-inverse restent #ffffff ;
 *   M5 bouton en sombre, primaire et statuts : plein = pas 11, survol = pas 12, texte = pas 1 de l'échelle sombre, en
 *      alias ; texte sur le plein ≥ 7:1 (DS1), environ 9:1 ; l'aplat plein (fond.marque.fort, texte.sur-marque), le
 *      bouton inversé, bordure.focus.inverse et l'accent fort gardent leurs valeurs claires ; texte.marque.grand ≥ 3:1
 *      sur les fonds sombres ;
 *   M6 fichiers sombres écrits = sortie de la saisie ; les 5 marques fictives passent le contraste en sombre.
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
  assert.ok(wcagContrast(g.steps[7], roles('orbe-cafe', 'sombre')('fond.surface')) >= 3, 'pas 8 : 3:1 sur fond.surface');
  assert.ok(proche(noir(g.steps[10]) / PAGE, 9, 0.01), `pas 11 : ${noir(g.steps[10]) / PAGE}`);
  assert.ok(proche(noir(g.steps[11]) / PAGE, 12.75, 0.01), `pas 12 : ${noir(g.steps[11]) / PAGE}`);
  assert.ok((oklch(g.steps[10]).c ?? 0) >= 0.093, `chroma du pas 11 : ${oklch(g.steps[10]).c}`);
  assert.deepEqual(checkValise(valiseFromTokens({ couleur: { bleu: scaleToDtcg(g, 'essai') } })), []);
});

test('M2 neutres dessinés : page vers #121212, surfaces de plus en plus claires, textes proches du clair', () => {
  const h = roles('orbe-cafe', 'sombre');
  const c = roles('orbe-cafe', 'clair');
  assert.ok(proche(noir(h('fond.app')), PAGE, 0.01), `fond.app ${h('fond.app')}`);
  const suite = ['fond.app', 'fond.discret', 'fond.surface', 'fond.composant', 'fond.composant.survol', 'fond.composant.appui'].map((r) => noir(h(r)));
  for (let i = 1; i < suite.length; i++) assert.ok(suite[i] > suite[i - 1], `ordre des fonds : ${suite.map((x) => x.toFixed(3)).join(' < ')}`);
  assert.notEqual(h('texte.principal'), '#ffffff');
  for (const t of ['texte.principal', 'texte.secondaire']) assert.ok(proche(wcagContrast(h(t), h('fond.app')), wcagContrast(c(t), c('fond.app')), 0.03), t);
  for (const f of ['fond.app', 'fond.discret', 'fond.surface']) assert.ok(wcagContrast(h('bordure.forte'), h(f)) >= 3, `bordure.forte sur ${f}`);
  for (const b of ['bordure.erreur', 'bordure.succes', 'bordure.avertissement', 'bordure.info']) assert.ok(wcagContrast(h(b), h('fond.surface')) >= 3, `${b} sur fond.surface`);
});

test('M3 commun sombre : fichier = sombreTokens, checkValise passe, sur-inverse = pas 1 du neutre', () => {
  const ecrit = readFileSync(join(COMMUN, 'mode.sombre.tokens.json'), 'utf8');
  const attendu = sombreTokens(lire(join(COMMUN, 'primitives.tokens.json')), lire(join(COMMUN, 'statuts.tokens.json')));
  assert.equal(ecrit, JSON.stringify(attendu, null, 2) + '\n');
  assert.deepEqual(checkValise(valiseFromTokens(attendu)), []);
  assert.equal(attendu.couleur['sur-inverse'].$value, '{couleur.neutre.1}');
  assert.deepEqual(Object.keys(attendu.couleur).filter((k) => !k.startsWith('$')), ['surface', 'sur-inverse', 'neutre', 'erreur', 'succes', 'avertissement', 'info']);
});

test('M4 rôles identiques dans les deux modes ; surface et texte sur inverse blancs en clair', () => {
  const chemin = join(ROOT, 'tokens', 'orbe-cafe', RESOLVER);
  const sem = lire(join(COMMUN, 'semantique.tokens.json'));
  const { $description, ...attendus } = sem;
  for (const mode of ['clair', 'sombre']) assert.deepEqual(partager(lireResolver(chemin, { mode })).semantique, attendus, mode);
  const c = roles('orbe-cafe', 'clair');
  assert.equal(c('fond.surface'), '#ffffff');
  assert.equal(c('texte.sur-inverse'), '#ffffff');
});

test('M5 bouton sombre : pas 11, 12 et 1 en alias, texte ≥ 7:1 ; aplat plein, bouton inversé et accent fort aux valeurs claires', () => {
  const figes = ['fond.marque.fort', 'texte.sur-marque', 'fond.interactif.inverse', 'texte.sur-interactif.inverse', 'texte.sur-interactif.inverse.survol', 'bordure.focus.inverse', 'fond.accent.fort', 'texte.sur-accent'];
  for (const m of MARQUES) {
    const d = join(ROOT, 'tokens', m);
    const sombre = lire(join(d, 'marque.sombre.tokens.json')).marque;
    const scale = /^\{couleur\.([^.]+)\.\d+\}$/.exec(lire(join(d, 'marque.tokens.json')).marque.primaire['1'].$value)?.[1];
    for (const [e, s] of [['primaire', scale], ['erreur', 'erreur'], ['succes', 'succes'], ['avertissement', 'avertissement'], ['info', 'info']]) {
      assert.equal(sombre[e].plein.$value, `{couleur.${s}.11}`, `${m} ${e}`);
      assert.equal(sombre[e]['plein-survol'].$value, `{couleur.${s}.12}`, `${m} ${e}`);
      assert.equal(sombre[e]['sur-plein'].$value, `{couleur.${s}.1}`, `${m} ${e}`);
    }
    const h = roles(m, 'sombre');
    const c = roles(m, 'clair');
    const ds1 = wcagContrast(h('texte.sur-interactif'), h('fond.interactif.fort'));
    assert.ok(ds1 >= 7, `${m} : ${ds1}`);
    assert.ok(wcagContrast(h('texte.sur-interactif'), h('fond.interactif.fort.survol')) >= 4.5, m);
    for (const s of ['erreur', 'succes', 'avertissement', 'info']) assert.ok(wcagContrast(h(`texte.sur-${s}`), h(`fond.${s}.fort`)) >= 7, `${m} ${s}`);
    for (const r of figes) assert.equal(h(r), c(r), `${m} : ${r}`);
    for (const f of ['fond.app', 'fond.surface', 'fond.discret', 'fond.marque.discret']) assert.ok(wcagContrast(h('texte.marque.grand'), h(f)) >= 3, `${m} : ${f}`);
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
