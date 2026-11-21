// @ts-check
/**
 * T4 : planche tokens/orbe-cafe/roles.html, une ligne par paire de rôles
 * (fond, mot écrit, ratio, seuil, verdict), groupée par propriété de l'élément devant.
 *
 * Attendu écrit à la main avant le code de src/report/roles.js :
 *   deux groupes dans cet ordre : text, border (focus compris) ; dans chaque groupe, les paires dans
 *   l'ordre de paires.json, puis les paires interdites du groupe (verdict « interdite » et sa règle) ;
 *   texte : 37 paires + 2 interdites ; bordure : 11 paires + 2 interdites (décisions après T5, 14/11/2026,
 *   et interdite border.focus sur background.interactive.strong, 15/11/2026) ;
 *   ratio affiché tronqué à 2 décimales, virgule décimale, « :1 » (jamais arrondi vers le seuil) ;
 *   seuil « 4,5:1 » ou « 3:1 » ; verdict « conforme », « échec », « exception » ou « interdite » ;
 *   aucun échec (décisions du 14/11/2026) ;
 *   décision du 14/11/2026 : le nom du fond se lit dans chaque ligne, à toutes les largeurs ; vérifié
 *   dans Chromium à 420 px de large (le nom du fond de chaque ligne est visible, dans la fenêtre, sans
 *   défilement horizontal de la page) ;
 *   page autonome : aucune ressource externe ; le fichier versionné est à jour.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { loadRoles, contratRoles } from '../src/tokens/roles.js';
import { rolesHtml } from '../src/report/roles.js';
import { charger, COMMUN, ORBE } from './helpers/jetons.js';
import { PAIRES_BOUTON, PAIRES_AVATAR } from './helpers/roles-ajoutes.js';

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'tokens', 'orbe-cafe');
const FILE = join(DIR, 'roles.html');
const html = readFileSync(FILE, 'utf8');
const paires = charger('paires.json');

// Ratios d’Orbe Café, écrits à la main : à ne pas lire comme une règle commune (mesure Q5).
const INTERDITES_ORBE_CAFE = new Map([
  ['text.secondary|background.component.pressed', { ratio: 4.3327, regle: 'sur background.component.pressed, le texte passe en text.default' }],
  ['text.secondary|background.interactive.strong', { ratio: 1.5348, regle: 'sur un plein, le texte est text.on-*' }],
  ['border.strong|background.component', { ratio: 2.8718, regle: 'un champ se pose sur background.surface' }],
  ['border.focus|background.interactive.strong', { ratio: 1.5406, regle: 'l’anneau de focus est décalé de 2 px et se pose sur le fond de la page, jamais sur le plein' }],
]);
// La troncature se fait sur la valeur arrondie à 4 décimales (5,02 × 100 = 501,999… en
// flottant, qui donnait 5,01).
const trunc = (/** @type {number} */ n) => (Math.floor(Math.round(n * 10000) / 100) / 100).toFixed(2).replace('.', ',');

/** @param {string} s */
const rows = (s) => [...s.matchAll(/<tr data-devant="([^"]+)" data-fond="([^"]+)"[^>]*>([^]*?)<\/tr>/g)].map((m) => ({ devant: m[1], fond: m[2], body: m[3] }));
/** @param {string} body */
const cells = (body) => [...body.matchAll(/<td[^>]*>([^]*?)<\/td>/g)].map((m) => m[1]);
/** @param {string} s */
const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const group = (/** @type {string} */ role) => role.split('.')[0];

test('T4 la planche versionnée est à jour', () => {
  assert.equal(html, rolesHtml(contratRoles(loadRoles(DIR)), 'Orbe Café'));
});

test('T4 page autonome, en français, titrée', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="fr">/);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.doesNotMatch(html, /(src|href)="https?:/);
});

test('T4 groupes par propriété : text (37 + 15 ajoutées + 3 du bouton + 1 de l\'avatar et de l\'étiquette, et 4 interdites) puis border (11 + 3 + 4 de statut, et 3 interdites)', () => {
  const sections = [...html.matchAll(/<section data-propriete="([^"]+)">([^]*?)<\/section>/g)];
  assert.deepEqual(sections.map((s) => s[1]), ['text', 'border']);
  assert.equal(rows(sections[0][2]).length, 56 + PAIRES_BOUTON.length + PAIRES_AVATAR.length, '+ les paires du bouton, de l\'avatar et de l\'étiquette');
  assert.equal(rows(sections[1][2]).length, 21, '+ 4 bordures de statut sur background.surface');
  for (const r of rows(sections[0][2])) assert.match(r.devant, /^text\./);
  for (const r of rows(sections[1][2])) assert.match(r.devant, /^border\./);
});

test('T4 une ligne par paire : paires de paires.json, puis interdites, par groupe', () => {
  const want = ['text', 'border'].flatMap((g) => [
    ...paires.pairs.filter((/** @type {any} */ p) => group(p.foreground) === g).map((/** @type {any} */ p) => [p.foreground, p.background]),
    ...paires.forbidden.filter((/** @type {any} */ p) => group(p.foreground) === g).map((/** @type {any} */ p) => [p.foreground, p.background]),
  ]);
  assert.deepEqual(rows(html).map((r) => [r.devant, r.fond]), want);
});

test('T4 colonnes : fond, mot écrit, ratio, seuil, verdict ; nom du fond aussi dans le mot écrit', () => {
  const head = [...html.matchAll(/<thead>([^]*?)<\/thead>/g)].map((m) => [...m[1].matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((x) => x[1]));
  assert.equal(head.length, 2);
  for (const h of head) assert.deepEqual(h, ['Fond', 'Mot écrit', 'Ratio', 'Seuil', 'Verdict']);
  const c = contratRoles(loadRoles(DIR));
  const all = [...c.pairs, ...c.interdites];
  for (const r of rows(html)) {
    const p = all.find((x) => x.devant === r.devant && x.fond === r.fond);
    assert.ok(p, `${r.devant} sur ${r.fond}`);
    const [fond, mot, ratio, seuil, verdict] = cells(r.body);
    assert.ok(text(fond).includes(p.fond) && fond.includes(p.hexFond), `${r.devant} sur ${r.fond} : fond`);
    assert.ok(text(mot).includes(p.devant), `${r.devant} : rôle devant nommé`);
    assert.ok(text(mot).includes(`sur ${p.fond}`), `${r.devant} : nom du fond dans le mot écrit`);
    assert.ok(mot.includes(`background:${p.hexFond}`), `${r.devant} : échantillon sur son fond`);
    assert.ok(mot.includes(r.devant.startsWith('text.') ? `color:${p.hexDevant}` : `border-color:${p.hexDevant}`), `${r.devant} : couleur devant`);
    assert.equal(text(ratio), `${trunc(p.ratio)}:1`);
    // Paire : son seuil (3:1 pour text.brand.large) ; interdite : le seuil de son groupe.
    const groupe = r.devant.startsWith('text.') ? '4,5:1' : '3:1';
    assert.equal(text(seuil), 'min' in p ? `${String(p.min).replace('.', ',')}:1` : groupe);
    const key = `${r.devant}|${r.fond}`;
    // Les 4 interdites d'origine gardent leurs ratios ; celles ajoutées sont lues dans contratRoles.
    const forbidden = INTERDITES_ORBE_CAFE.get(key) ?? c.interdites.find((x) => `${x.devant}|${x.fond}` === key);
    if (forbidden) {
      assert.equal(text(verdict), `interdite ${forbidden.regle}`, key);
      assert.equal(text(ratio), `${trunc(forbidden.ratio)}:1`, key);
    } else if (p.exception) assert.equal(text(verdict), `exception ${p.exception}`, key);
    else assert.equal(text(verdict), 'conforme', key);
  }
});

test('T4 aucune colonne masquée par la feuille', () => {
  const css = /<style>([^]*?)<\/style>/.exec(html)?.[1] ?? '';
  assert.doesNotMatch(css, /display:\s*none/);
});

test('T4 une exception écrite s\'affiche avec son texte et le verdict « exception »', () => {
  const set = structuredClone(loadRoles(DIR));
  set.paires.pairs.push({ foreground: 'border.strong', background: 'background.component.pressed', type: 'border', exception: 'Champ toujours doublé de son libellé.' });
  const out = rolesHtml(contratRoles(set), 'Orbe Café');
  const r = rows(out).find((x) => x.devant === 'border.strong' && x.fond === 'background.component.pressed');
  assert.ok(r);
  assert.equal(text(cells(r.body)[4]), 'exception Champ toujours doublé de son libellé.');
});

/** @type {import('playwright-core').Browser} */
let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

test('T4 à 420 px : le nom du fond se lit dans chaque ligne, sans défilement horizontal', async () => {
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  await page.goto(pathToFileURL(FILE).href);
  const res = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    for (const tr of document.querySelectorAll('tr[data-fond]')) {
      const fond = /** @type {HTMLElement} */ (tr).dataset.fond;
      const seen = [...tr.querySelectorAll('code')].some((el) => {
        if (el.textContent?.trim() !== fond) return false;
        const b = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        return b.width > 0 && b.height > 0 && b.left >= 0 && b.right <= vw && st.visibility !== 'hidden';
      });
      out.push({ key: `${/** @type {HTMLElement} */ (tr).dataset.devant}|${fond}`, seen });
    }
    return { vw, scroll: document.documentElement.scrollWidth, rows: out };
  });
  await page.close();
  assert.equal(res.rows.length, 77 + PAIRES_BOUTON.length + PAIRES_AVATAR.length, '+ 4 bordures de statut sur background.surface, + les paires du bouton, de l\'avatar et de l\'étiquette');
  for (const r of res.rows) assert.ok(r.seen, `${r.key} : nom du fond visible à 420 px`);
  assert.ok(res.scroll <= res.vw, `défilement horizontal : ${res.scroll} > ${res.vw}`);
});
