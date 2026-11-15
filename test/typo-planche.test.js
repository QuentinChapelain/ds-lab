// @ts-check
/**
 * Séance 3c, typo, lot 3 : planche tokens/orbe-cafe/typo.html.
 *
 * Attendu écrit à la main avant le code de src/report/typo.js, d'après le plan typo du 15/11/2026 :
 *   spécimen des onze styles, une ligne [data-specimen] par style, avec taille, ligne et rapport écrits ;
 *   trois situations [data-situation] : hero (un hero de page d'accueil sur deux lignes exactement),
 *   contenu (titres 1 à 3, chapô, texte courant, un titre long [data-titre-long] qui passe à la ligne),
 *   dense (tableau, titre.4, corps.petit) ;
 *   chaque élément [data-style] a, dans Chromium, la taille, la hauteur de ligne (à 0,01 px), la graisse et la
 *   police de son style ; à 420 px la valeur en étroit quand le style en a une (sous 600 px), à 1 200 px la
 *   valeur large ;
 *   polices calculées : 'Georgia, serif' (police.titre), '"Orbe Sans", Arial, sans-serif' (police.texte) ;
 *   décisions du 15/11/2026 prises sur la planche : mention à 12 / 16 dans les jetons ; hero et corps.petit
 *   inchangés ; plus aucun réglage (ni bouton radio, ni « réglage ») : la planche lit ses valeurs dans les jetons ;
 *   gap et padding seulement : marge calculée nulle partout, une seule déclaration margin (la remise à zéro),
 *   chaque gap vaut un rôle d'espacement (var(--ecart-…) ou var(--marge-interieure-…)) ;
 *   rendue à 420 et à 1 200 px sans défilement horizontal ; page autonome, aucun script ni ressource externe ;
 *   le fichier versionné est à jour.
 * Étape 4c (D17) : lignes d'affichage.grand 76 / 48, d'affichage.moyen 60 / 40, de titre.1 40 en large.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { planche } from '../src/report/typo.js';

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'tokens', 'orbe-cafe');
const FILE = join(DIR, 'typo.html');
const html = readFileSync(FILE, 'utf8');

const TITRE = 'Georgia, serif';
const TEXTE = '"Orbe Sans", Arial, sans-serif';
/** style → [taille, ligne, taille étroit, ligne étroit, graisse, police] */
const STYLES = /** @type {Record<string, [number, number, number | null, number | null, number, string]>} */ ({
  'affichage.grand': [60, 76, 36, 48, 700, TITRE],
  'affichage.moyen': [48, 60, 30, 40, 700, TITRE],
  'titre.1': [30, 40, 24, 32, 700, TITRE],
  'titre.2': [24, 32, 20, 28, 700, TITRE],
  'titre.3': [20, 28, 18, 24, 600, TITRE],
  'titre.4': [16, 24, null, null, 700, TEXTE],
  'corps.grand': [18, 28, null, null, 400, TEXTE],
  'corps.moyen': [16, 24, null, null, 400, TEXTE],
  'corps.petit': [14, 20, null, null, 400, TEXTE],
  libelle: [14, 20, null, null, 600, TEXTE],
  mention: [12, 16, null, null, 400, TEXTE],
});
/** @param {string} style @param {number} width @returns {[number, number]} */
const attendu = (style, width) => {
  const [t, l, te, le] = STYLES[style];
  return width < 600 && te !== null && le !== null ? [te, le] : [t, l];
};

/** @type {import('playwright-core').Browser} */
let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});
/** @param {number} width */
async function open(width) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(pathToFileURL(FILE).href);
  return page;
}
/** Mesures de tous les [data-style]. @param {import('playwright-core').Page} page */
const mesures = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-style]')].map((e) => {
      const s = getComputedStyle(e);
      const lh = parseFloat(s.lineHeight);
      return {
        style: /** @type {string} */ (e.getAttribute('data-style')),
        id: e.id,
        taille: parseFloat(s.fontSize),
        ligne: lh,
        graisse: Number(s.fontWeight),
        police: s.fontFamily,
        lignes: Math.round(e.getBoundingClientRect().height / lh),
        hauteur: e.getBoundingClientRect().height,
        tag: e.tagName,
      };
    }),
  );

test('typo planche : page autonome, sans script, fichier à jour', () => {
  assert.equal(html, planche(DIR));
  assert.doesNotMatch(html, /<script|<link|@import|url\(|https?:\/\//i);
  assert.match(html, /Orbe Café/);
});

test('typo planche : aucun réglage, valeurs lues dans les jetons', () => {
  assert.doesNotMatch(html, /type="radio"|<input type="radio"|réglage|reglage|:has\(/i);
  assert.match(html, /--mention-taille: 12px; --mention-interligne: 1\.3333;/);
  assert.match(html, /--affichage-grand-interligne: 1\.2667;/);
  assert.match(html, /--corps-petit-interligne: 1\.4286;/);
});

test('typo planche : une seule déclaration margin, chaque gap est un rôle d\'espacement', () => {
  assert.deepEqual(html.match(/margin[\w-]*\s*:[^;}]*/g) ?? [], ['margin: 0']);
  const gaps = html.match(/[^-\w]gap\s*:[^;}]*/g) ?? [];
  assert.ok(gaps.length > 5, `gaps : ${gaps.length}`);
  for (const g of gaps) assert.match(g, /gap: var\(--(ecart|marge-interieure)-[\w-]+\)$/, g);
});

for (const width of [420, 1200]) {
  test(`typo planche à ${width} px : structure, pas de défilement, marges nulles`, async () => {
    const page = await open(width);
    const r = await page.evaluate(() => ({
      specimens: [...document.querySelectorAll('[data-specimen]')].map((e) => e.getAttribute('data-specimen')),
      situations: [...document.querySelectorAll('[data-situation]')].map((e) => e.getAttribute('data-situation')),
      dense: ['table', '[data-style="titre.4"]', '[data-style="corps.petit"]'].map((q) => !!document.querySelector(`[data-situation="dense"] ${q}`)),
      contenu: ['titre.1', 'titre.2', 'titre.3', 'corps.grand', 'corps.moyen'].map((s) => !!document.querySelector(`[data-situation="contenu"] [data-style="${s}"]`)),
      textes: [...document.querySelectorAll('[data-specimen]')].map((e) => e.textContent ?? ''),
      scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      marges: [...document.querySelectorAll('*')]
        .filter((e) => { const s = getComputedStyle(e); return [s.marginTop, s.marginRight, s.marginBottom, s.marginLeft].some((m) => m !== '0px'); })
        .map((e) => e.tagName),
    }));
    assert.deepEqual(r.specimens, Object.keys(STYLES));
    assert.deepEqual(r.situations, ['hero', 'contenu', 'dense']);
    assert.deepEqual(r.dense, [true, true, true], 'écran dense : tableau, titre.4, corps.petit');
    assert.deepEqual(r.contenu, [true, true, true, true, true], 'page de contenu : titres 1 à 3, chapô, texte courant');
    Object.entries(STYLES).forEach(([style, [t, l, te, le]], i) => {
      const txt = r.textes[i];
      assert.ok(txt.includes(`${t} / ${l} px`) && txt.includes(`rapport ${String(Math.round((l / t) * 10000) / 10000).replace('.', ',')}`), `${style} : « ${txt} »`);
      if (te !== null && le !== null) assert.ok(txt.includes(`${te} / ${le} px`), `${style} : étroit`);
    });
    assert.equal(r.scroll, 0, 'défilement horizontal');
    assert.deepEqual(r.marges, [], 'éléments avec une marge');
    await page.close();
  });

  test(`typo planche à ${width} px : chaque [data-style] porte taille, ligne, graisse et police de son style`, async () => {
    const page = await open(width);
    const m = await mesures(page);
    assert.ok(m.length >= 25, `éléments stylés : ${m.length}`);
    assert.deepEqual([...new Set(m.map((e) => e.style))].sort(), Object.keys(STYLES).sort());
    for (const e of m) {
      const [t, l] = attendu(e.style, width);
      const [, , , , g, p] = STYLES[e.style];
      const ou = `${e.style} (${e.tag}${e.id ? `#${e.id}` : ''})`;
      assert.equal(e.taille, t, `${ou} : taille`);
      assert.ok(Math.abs(e.ligne - l) <= 0.01, `${ou} : ligne ${e.ligne} au lieu de ${l}`);
      assert.equal(e.graisse, g, `${ou} : graisse`);
      assert.equal(e.police, p, `${ou} : police`);
    }
    await page.close();
  });

  test(`typo planche à ${width} px : hero sur deux lignes, titre long à la ligne`, async () => {
    const page = await open(width);
    const m = await mesures(page);
    const hero = m.find((e) => e.id === 'hero-titre');
    const long = m.find((e) => e.id === 'titre-long');
    assert.ok(hero && long);
    assert.equal(hero.style, 'affichage.grand');
    assert.equal(hero.lignes, 2, `hero : ${hero.hauteur} px`);
    assert.ok(Math.abs(hero.hauteur - 2 * hero.ligne) < 1, 'hero : hauteur = deux lignes');
    assert.equal(long.style, 'titre.1');
    assert.ok(long.lignes >= 2, `titre long : ${long.lignes} ligne(s)`);
    assert.ok(Math.abs(long.hauteur - long.lignes * long.ligne) < 1, 'titre long : hauteur = lignes × ligne');
    await page.close();
  });
}
