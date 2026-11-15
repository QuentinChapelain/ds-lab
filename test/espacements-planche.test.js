// @ts-check
/**
 * Séance 3c, lot 3 : planche des espacements par relation (tokens/orbe-cafe/espacements.html).
 *
 * Attendu écrit à la main avant le code de src/report/espacements.js, d'après la séance 3c du 15/11/2026 :
 *   une page complète d'Orbe Café (marque fictive) : au moins trois sections dans main, dont un formulaire
 *   avec un message d'erreur sur deux lignes et une rangée de trois cartes ;
 *   les cinq espaces cotés et nommés, une cote [data-cote] par rôle, qui porte le nom du rôle et sa valeur
 *   en px ; chaque cote couvre exactement l'espace réel qu'elle nomme :
 *     ecart.dans-composant 4 (étiquette → champ), ecart.entre-composants 16 (champ → champ),
 *     ecart.entre-groupes 24 (en-tête de section → contenu), ecart.section 48 (section → section),
 *     marge-interieure.composant 16 (bord d'une carte → son contenu) ;
 *   le parent porte l'espace : gap et padding uniquement ; marge calculée nulle sur tous les éléments,
 *     une seule déclaration margin dans la feuille, la remise à zéro ;
 *   rendue dans Chromium à 420 et à 1 200 px de large : aucun défilement horizontal, cotes dans la fenêtre ;
 *     les trois cartes sur une ligne à 1 200 px, une par ligne à 420 px ; le message d'erreur sur deux lignes
 *     aux deux largeurs ;
 *   deux réglages visibles, sans script : ecart.dans-composant à 4 ou 8 px (4 par défaut, le token) ;
 *     ecart.section à 48 ou 32 px en étroit (48 par défaut ; 32 ne s'applique que sous 600 px de large,
 *     seuil [H]) ; la cote suit le réglage ;
 *   page autonome : aucune ressource externe, aucun script ; le fichier versionné est à jour.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { planche } from '../src/report/espacements.js';

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'tokens', 'orbe-cafe');
const FILE = join(DIR, 'espacements.html');
const html = readFileSync(FILE, 'utf8');

const ATTENDU = /** @type {Record<string, number>} */ ({
  'ecart.dans-composant': 4,
  'ecart.entre-composants': 16,
  'ecart.entre-groupes': 24,
  'ecart.section': 48,
  'marge-interieure.composant': 16,
});

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

/**
 * Mesures dans la page : pour chaque cote, l'espace réel (entre l'hôte et son voisin suivant, ou padding
 * de l'hôte pour une marge intérieure), la bande dessinée et le texte.
 * @param {import('playwright-core').Page} page
 */
const mesures = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-cote]')].map((c) => {
      const host = /** @type {HTMLElement} */ (c.parentElement);
      const h = host.getBoundingClientRect();
      const b = c.getBoundingClientRect();
      const role = c.getAttribute('data-cote');
      let reel;
      let bande;
      if (role === 'marge-interieure.composant') {
        const s = getComputedStyle(host);
        reel = [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(parseFloat);
        bande = parseFloat(getComputedStyle(c).borderTopWidth);
      } else {
        const n = /** @type {Element} */ (host.nextElementSibling).getBoundingClientRect();
        reel = Math.round((n.top - h.bottom) * 100) / 100;
        bande = Math.round(b.height * 100) / 100;
        if (Math.abs(b.top - h.bottom) > 0.5) bande = -1;
      }
      // innerText : le texte affiché, sans la valeur masquée de l'autre réglage.
      return { role, reel, bande, texte: /** @type {HTMLElement} */ (c).innerText, gauche: b.left, droite: b.right, visible: b.width > 0 };
    }),
  );

test('3c planche : page autonome, sans script, fichier à jour', () => {
  assert.equal(html, planche(DIR));
  assert.doesNotMatch(html, /<script|<link|@import|url\(|https?:\/\//i);
  assert.match(html, /Orbe Café/);
});

test('3c planche : une seule déclaration margin, la remise à zéro', () => {
  const decl = html.match(/margin[\w-]*\s*:[^;}]*/g) ?? [];
  assert.deepEqual(decl, ['margin: 0']);
});

for (const width of [420, 1200]) {
  test(`3c planche à ${width} px : structure, pas de défilement, marges nulles`, async () => {
    const page = await open(width);
    const r = await page.evaluate(() => ({
      sections: document.querySelectorAll('main > section').length,
      forms: document.querySelectorAll('main form').length,
      cartes: document.querySelectorAll('.carte').length,
      scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      marges: [...document.querySelectorAll('*')]
        .filter((e) => { const s = getComputedStyle(e); return [s.marginTop, s.marginRight, s.marginBottom, s.marginLeft].some((m) => m !== '0px'); })
        .map((e) => e.tagName),
    }));
    assert.ok(r.sections >= 3, `sections : ${r.sections}`);
    assert.equal(r.forms, 1);
    assert.equal(r.cartes, 3);
    assert.equal(r.scroll, 0, 'défilement horizontal');
    assert.deepEqual(r.marges, [], 'éléments avec une marge');
    await page.close();
  });

  test(`3c planche à ${width} px : cartes, message d'erreur sur deux lignes`, async () => {
    const page = await open(width);
    const r = await page.evaluate(() => {
      const tops = [...document.querySelectorAll('.carte')].map((c) => Math.round(c.getBoundingClientRect().top));
      const e = /** @type {HTMLElement} */ (document.querySelector('.message-erreur'));
      return { tops, lignes: Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)) };
    });
    if (width === 1200) assert.equal(new Set(r.tops).size, 1, `une ligne : ${r.tops}`);
    else assert.ok(r.tops[0] < r.tops[1] && r.tops[1] < r.tops[2], `une carte par ligne : ${r.tops}`);
    assert.equal(r.lignes, 2, 'message sur deux lignes');
    await page.close();
  });

  test(`3c planche à ${width} px : cinq cotes nommées, chacune couvre l'espace réel`, async () => {
    const page = await open(width);
    const m = await mesures(page);
    assert.deepEqual(m.map((c) => c.role).sort(), Object.keys(ATTENDU).sort());
    for (const c of m) {
      const px = ATTENDU[/** @type {string} */ (c.role)];
      assert.ok(c.texte.includes(/** @type {string} */ (c.role)) && c.texte.includes(`${px} px`), `${c.role} : texte « ${c.texte} »`);
      assert.doesNotMatch(c.texte, /réglage/, `${c.role} : aucun réglage par défaut`);
      assert.ok(c.visible && c.gauche >= 0 && c.droite <= width, `${c.role} : dans la fenêtre`);
      if (Array.isArray(c.reel)) assert.deepEqual(c.reel, [px, px, px, px], `${c.role} : padding`);
      else assert.equal(c.reel, px, `${c.role} : espace réel`);
      assert.equal(c.bande, px, `${c.role} : bande cotée`);
    }
    await page.close();
  });

  test(`3c planche à ${width} px : réglages dans-composant 4 / 8 et section 48 / 32 en étroit`, async () => {
    const page = await open(width);
    assert.ok(await page.isChecked('#reglage-dans-composant-4'));
    assert.ok(await page.isChecked('#reglage-section-48'));
    assert.ok(await page.isVisible('#reglage-dans-composant-8'));
    await page.check('#reglage-dans-composant-8');
    await page.check('#reglage-section-32');
    const m = Object.fromEntries((await mesures(page)).map((c) => [c.role, c]));
    const dc = m['ecart.dans-composant'];
    assert.equal(dc.reel, 8);
    assert.equal(dc.bande, 8);
    assert.match(dc.texte, /8 px/);
    const sec = width < 600 ? 32 : 48;
    assert.equal(m['ecart.section'].reel, sec, 'section après réglage');
    assert.equal(m['ecart.section'].bande, sec);
    assert.match(m['ecart.section'].texte, new RegExp(`${sec} px`));
    assert.equal(m['ecart.entre-composants'].reel, 16, 'les autres espaces ne bougent pas');
    await page.close();
  });
}
