// @ts-check
/**
 * Simulation d'une table ancien → nouveau sur une page chargée : chaque
 * valeur calculée qui figure dans la table est remplacée, dans ce navigateur
 * seulement, par un style en ligne !important. Rien n'est envoyé au site.
 * Captures avant et après de la page entière et d'exemples par changement,
 * pour juger sur pièces (même logique qu'une revue de régression visuelle).
 * Limites : les pseudo-éléments ne sont pas modifiés ; un élément créé après
 * le relevé ne l'est pas non plus.
 */

/**
 * Exécutée dans la page. Relève les remplacements à faire et les garde dans window.__dsSim.
 * @param {Record<string, Record<string, string>>} map  par famille : ancien → nouveau
 */
export function scanInPage(map) {
  const SIDES = ['top', 'right', 'bottom', 'left'];
  const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
  /** @param {string} v */
  const pxKey = (v) => {
    const m = /^(-?\d+(?:\.\d+)?)px$/.exec(v.trim());
    return m ? `${Math.round(Number(m[1]) * 100) / 100}px` : null;
  };
  /** @param {string} v */
  const hexKey = (v) => {
    const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(v.trim());
    if (!m || (m[4] !== undefined && Number(m[4]) < 1)) return null;
    return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
  };
  /** @type {Element[]} */
  const els = [];
  /** @type {{ i: number, prop: string, value: string }[]} */
  const ops = [];
  /** @type {Map<string, { family: string, old: string, new: string, count: number, samples: number[] }>} */
  const changes = new Map();
  /** @param {number} i @param {string} family @param {string} prop @param {string | null} key */
  const consider = (i, family, prop, key) => {
    const next = key ? map[family]?.[key] : undefined;
    if (!key || !next) return;
    ops.push({ i, prop, value: next });
    const k = `${family}|${key}`;
    let c = changes.get(k);
    if (!c) changes.set(k, (c = { family, old: key, new: next, count: 0, samples: [] }));
    c.count++;
    if (c.samples.length < 2 && !c.samples.includes(i)) {
      const r = els[i].getBoundingClientRect();
      if (r.width >= 8 && r.height >= 8) c.samples.push(i);
    }
  };
  /** @param {Element} el */
  const visit = (el) => {
    const cs = getComputedStyle(el);
    if (el.getClientRects().length > 0 && cs.visibility !== 'hidden' && parseFloat(cs.opacity) !== 0) {
      const i = els.length;
      els.push(el);
      let text = false;
      for (const n of el.childNodes) if (n.nodeType === 3 && (n.textContent ?? '').trim()) text = true;
      for (const c of CORNERS) consider(i, 'radii', `border-${c}-radius`, pxKey(cs.getPropertyValue(`border-${c}-radius`)));
      for (const s of SIDES) {
        for (const p of ['margin', 'padding']) {
          const k = pxKey(cs.getPropertyValue(`${p}-${s}`));
          if (k && k !== '0px') consider(i, 'spacing', `${p}-${s}`, k);
        }
        if (cs.getPropertyValue(`border-${s}-style`) !== 'none' && parseFloat(cs.getPropertyValue(`border-${s}-width`)) > 0)
          consider(i, 'colors', `border-${s}-color`, hexKey(cs.getPropertyValue(`border-${s}-color`)));
      }
      if (/\b(flex|grid)\b/.test(cs.display)) for (const g of ['row-gap', 'column-gap']) consider(i, 'spacing', g, pxKey(cs.getPropertyValue(g)));
      consider(i, 'colors', 'background-color', hexKey(cs.backgroundColor));
      if (text) {
        consider(i, 'fontSizes', 'font-size', pxKey(cs.fontSize));
        consider(i, 'colors', 'color', hexKey(cs.color));
      }
    }
    for (const child of el.children) visit(child);
    if (el.shadowRoot) for (const child of el.shadowRoot.children) visit(child);
  };
  if (document.body) for (const child of document.body.children) visit(child);
  Object.defineProperty(window, '__dsSim', { value: { els, ops }, configurable: true });
  return { elements: els.length, operations: ops.length, changes: [...changes.values()] };
}

/** Exécutée dans la page : rectangles (coordonnées de page) des éléments demandés. @param {number[]} indices */
export function rectsInPage(indices) {
  const { els } = /** @type {any} */ (window).__dsSim;
  return indices.map((i) => {
    const r = els[i].getBoundingClientRect();
    return { i, x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
  });
}

/** Exécutée dans la page : applique les remplacements relevés par scanInPage. */
export function applyInPage() {
  const { els, ops } = /** @type {any} */ (window).__dsSim;
  for (const op of ops) /** @type {HTMLElement} */ (els[op.i]).style?.setProperty(op.prop, op.value, 'important');
  return ops.length;
}

const PAD = 12;
const MAX_W = 520;
const MAX_H = 240;

/**
 * @param {import('playwright-core').Page} page
 * @param {{ x: number, y: number, width: number, height: number }} r
 * @param {{ width: number, height: number }} doc
 */
async function crop(page, r, doc) {
  const x = Math.max(0, Math.floor(r.x - PAD));
  const y = Math.max(0, Math.floor(r.y - PAD));
  const width = Math.max(8, Math.min(MAX_W, Math.ceil(r.width + 2 * PAD), doc.width - x));
  const height = Math.max(8, Math.min(MAX_H, Math.ceil(r.height + 2 * PAD), doc.height - y));
  const buf = await page.screenshot({ fullPage: true, clip: { x, y, width, height }, animations: 'disabled' });
  return buf.toString('base64');
}

/**
 * @typedef {object} SimulatedChange
 * @property {string} family
 * @property {string} old
 * @property {string} new
 * @property {number} count
 * @property {{ before: string, after: string }[]} crops  PNG en base64
 */

/**
 * Simule la table sur une page déjà chargée.
 * @param {import('playwright-core').Page} page
 * @param {Record<string, Record<string, string>>} map
 * @param {{ maxCropped?: number, fullPage?: boolean }} [opts]
 *   maxCropped : nombre de changements illustrés par des captures (les plus fréquents d'abord)
 * @returns {Promise<{ url: string, elements: number, operations: number, changes: SimulatedChange[], before: string | null, after: string | null }>}
 */
export async function simulatePage(page, map, { maxCropped = 80, fullPage = true } = {}) {
  const scan = await page.evaluate(scanInPage, map);
  const doc = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  const shown = [...scan.changes].sort((a, b) => b.count - a.count).slice(0, maxCropped);
  const indices = [...new Set(shown.flatMap((c) => c.samples))];
  const before = fullPage ? (await page.screenshot({ fullPage: true, animations: 'disabled' })).toString('base64') : null;
  /** @type {Map<number, string>} */
  const beforeCrops = new Map();
  for (const r of await page.evaluate(rectsInPage, indices)) beforeCrops.set(r.i, await crop(page, r, doc));
  await page.evaluate(applyInPage);
  const docAfter = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  /** @type {Map<number, string>} */
  const afterCrops = new Map();
  for (const r of await page.evaluate(rectsInPage, indices)) afterCrops.set(r.i, await crop(page, r, docAfter));
  const after = fullPage ? (await page.screenshot({ fullPage: true, animations: 'disabled' })).toString('base64') : null;
  return {
    url: page.url(),
    elements: scan.elements,
    operations: scan.operations,
    changes: scan.changes.map((c) => ({
      family: c.family,
      old: c.old,
      new: c.new,
      count: c.count,
      crops: c.samples.filter((i) => beforeCrops.has(i) && afterCrops.has(i)).map((i) => ({ before: /** @type {string} */ (beforeCrops.get(i)), after: /** @type {string} */ (afterCrops.get(i)) })),
    })),
    before,
    after,
  };
}
