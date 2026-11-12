// @ts-check
/**
 * Simulation d'une table ancien → nouveau sur une page chargée : chaque
 * valeur calculée qui figure dans la table est remplacée, dans ce navigateur
 * seulement, par un style en ligne !important. Rien n'est envoyé au site.
 * La simulation est réversible et se pilote par famille ou par changement :
 * c'est ce qui permet une capture « après » par changement isolé, et un
 * interrupteur avant / après dans la page (mode --live).
 * Limites : les pseudo-éléments ne sont pas modifiés ; un élément créé après
 * le relevé ne l'est qu'après une nouvelle lecture de la page.
 * Lot B : chaque remplacement suit l'usage de sa ligne (R3 : texte, bordure, fond,
 * plein ; marge, retrait, gouttière ; pilule, rayon), les marges auto ne sont pas
 * touchées (R7) et les éléments tiers sont exclus (R6). Les règles d'usage sont
 * celles de src/rendered/aggregate.js, réécrites ici parce que la fonction est
 * sérialisée dans la page.
 */

/**
 * Exécutée dans la page. Relève les remplacements à faire et installe
 * window.__dsSim = { els, ops, changes, show }. Tout est éteint au départ.
 * @param {Record<string, any>} map  par famille : ancien (ou ancien|usage) → nouveau ; thirdParty : sélecteurs (R6)
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
  /** @param {string} hex */
  const lum = (hex) => {
    const [R, G, B] = [1, 3, 5].map((i) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  const previous = /** @type {any} */ (window).__dsSim;
  if (previous) previous.show({ on: false });
  /** R6 : sélecteurs tiers valides. @type {string[]} */
  const third = [];
  for (const sel of Array.isArray(map.thirdParty) ? map.thirdParty : []) {
    try {
      document.querySelector(sel);
      third.push(sel);
    } catch {
      // sélecteur invalide : ignoré, comme au relevé
    }
  }
  /** @param {Element} el */
  const hasText = (el) => {
    for (const n of el.childNodes) if (n.nodeType === 3 && (n.textContent ?? '').trim()) return true;
    const t = el.tagName.toLowerCase();
    if (t === 'input' || t === 'textarea') {
      const type = (el.getAttribute('type') ?? 'text').toLowerCase();
      return !['hidden', 'checkbox', 'radio', 'range', 'color', 'file', 'image'].includes(type) && String(/** @type {any} */ (el).value ?? '') !== '';
    }
    if (t === 'select') return ((/** @type {any} */ (el).selectedOptions?.[0]?.textContent) ?? '').trim() !== '';
    return false;
  };
  // Pleins : éléments dont le fond opaque porte un texte plus clair que lui (R1).
  /** @type {Set<Element>} */
  const plein = new Set();
  if (document.body)
    for (const el of document.body.querySelectorAll('*')) {
      if (!hasText(el) || el.getClientRects().length === 0) continue;
      const fg = hexKey(getComputedStyle(el).color);
      if (!fg) continue;
      for (/** @type {Element | null} */ let x = el; x; x = x.parentElement) {
        const bg = hexKey(getComputedStyle(x).backgroundColor);
        if (!bg) continue;
        if (lum(fg) > lum(bg)) plein.add(x);
        break;
      }
    }
  /** R7 : côtés en marge auto (même sonde que le relevé). @param {Element} el @param {CSSStyleDeclaration} cs */
  const autoSidesOf = (el, cs) => {
    const margins = () => SIDES.map((s) => parseFloat(getComputedStyle(el).getPropertyValue(`margin-${s}`)) || 0);
    const before = SIDES.map((s) => parseFloat(cs.getPropertyValue(`margin-${s}`)) || 0);
    if (!before.some((m) => m > 0) || /^(inline|contents|none)$/.test(cs.display)) return [];
    const st = /** @type {HTMLElement} */ (el).style;
    if (!st) return [];
    const saved = el.getAttribute('style');
    const r = el.getBoundingClientRect();
    /** @type {string[]} */
    const out = [];
    /** @param {[string, string][]} props @param {number[]} sides */
    const probe = (props, sides) => {
      st.setProperty('transition', 'none', 'important');
      st.setProperty('box-sizing', 'border-box', 'important');
      for (const [k, v] of props) st.setProperty(k, v, 'important');
      const after = margins();
      if (saved === null) el.removeAttribute('style');
      else el.setAttribute('style', saved);
      for (const i of sides) if (before[i] > 0 && after[i] < before[i] - 0.5) out.push(SIDES[i]);
    };
    if (before[1] > 0 || before[3] > 0) probe([['width', `${r.width + 2}px`], ['max-width', 'none'], ['min-width', '0px'], ['flex-shrink', '0']], [1, 3]);
    if (before[0] > 0 || before[2] > 0) probe([['height', `${r.height + 2}px`], ['max-height', 'none'], ['min-height', '0px'], ['flex-shrink', '0']], [0, 2]);
    return out;
  };
  /** @type {Element[]} */
  const els = [];
  /** @type {{ i: number, prop: string, value: string, family: string, key: string, prev: string, prevPriority: string }[]} */
  const ops = [];
  /** @type {Map<string, { key: string, family: string, old: string, usage?: string, new: string, count: number, samples: number[], props: string[] }>} */
  const changes = new Map();
  /** @param {number} i @param {string} family @param {string} prop @param {string | null} old @param {string} [usage] */
  const consider = (i, family, prop, old, usage) => {
    const next = old ? (usage ? map[family]?.[`${old}|${usage}`] ?? map[family]?.[old] : map[family]?.[old]) : undefined;
    if (!old || !next) return;
    const key = usage ? `${family}|${old}|${usage}` : `${family}|${old}`;
    const style = /** @type {HTMLElement} */ (els[i]).style;
    ops.push({ i, prop, value: next, family, key, prev: style?.getPropertyValue(prop) ?? '', prevPriority: style?.getPropertyPriority(prop) ?? '' });
    let c = changes.get(key);
    if (!c) changes.set(key, (c = { key, family, old, usage, new: next, count: 0, samples: [], props: [] }));
    c.count++;
    const kind = prop.replace(/-(top|right|bottom|left)(-(left|right))?/, '');
    if (!c.props.includes(kind)) c.props.push(kind);
    if (c.samples.length < 2 && !c.samples.includes(i)) {
      const r = els[i].getBoundingClientRect();
      if (r.width >= 8 && r.height >= 8) c.samples.push(i);
    }
  };
  /** @param {Element} el */
  const visit = (el) => {
    if (el.hasAttribute('data-ds-lab')) return;
    if (third.some((sel) => el.matches(sel))) return;
    const cs = getComputedStyle(el);
    if (el.getClientRects().length > 0 && cs.visibility !== 'hidden' && parseFloat(cs.opacity) !== 0) {
      const i = els.length;
      els.push(el);
      let text = false;
      for (const n of el.childNodes) if (n.nodeType === 3 && (n.textContent ?? '').trim()) text = true;
      const box = el.getBoundingClientRect();
      for (const c of CORNERS) {
        const k = pxKey(cs.getPropertyValue(`border-${c}-radius`));
        const n = k ? parseFloat(k) : 0;
        const pill = n >= 500 || (box.width > 0 && box.height > 0 && n >= Math.min(box.width, box.height) / 2);
        consider(i, 'radii', `border-${c}-radius`, k, pill ? 'pilule' : 'rayon');
      }
      const auto = autoSidesOf(el, cs);
      for (const s of SIDES) {
        const m = pxKey(cs.getPropertyValue(`margin-${s}`));
        if (m && m !== '0px' && !auto.includes(s)) consider(i, 'spacing', `margin-${s}`, m, 'marge');
        const p = pxKey(cs.getPropertyValue(`padding-${s}`));
        if (p && p !== '0px') consider(i, 'spacing', `padding-${s}`, p, 'retrait');
        if (cs.getPropertyValue(`border-${s}-style`) !== 'none' && parseFloat(cs.getPropertyValue(`border-${s}-width`)) > 0)
          consider(i, 'colors', `border-${s}-color`, hexKey(cs.getPropertyValue(`border-${s}-color`)), 'bordure');
      }
      if (/\b(flex|grid)\b/.test(cs.display)) for (const g of ['row-gap', 'column-gap']) consider(i, 'spacing', g, pxKey(cs.getPropertyValue(g)), 'gouttière');
      consider(i, 'colors', 'background-color', hexKey(cs.backgroundColor), plein.has(el) ? 'plein' : 'fond');
      if (text) {
        consider(i, 'fontSizes', 'font-size', pxKey(cs.fontSize));
        consider(i, 'colors', 'color', hexKey(cs.color), 'texte');
      }
    }
    for (const child of el.children) visit(child);
    if (el.shadowRoot) for (const child of el.shadowRoot.children) visit(child);
  };
  if (document.body) for (const child of document.body.children) visit(child);
  // Lot B, R1 : fond de page porté par html ou body.
  for (const el of [document.documentElement, document.body]) {
    if (!el) continue;
    const i = els.length;
    els.push(el);
    consider(i, 'colors', 'background-color', hexKey(getComputedStyle(el).backgroundColor), plein.has(el) ? 'plein' : 'fond');
  }
  /**
   * Allume ou éteint la simulation, pour tout, pour des familles ou pour des changements.
   * @param {{ on: boolean, families?: string[] | null, keys?: string[] | null }} o
   */
  const show = (o) => {
    let active = 0;
    for (const op of ops) {
      const style = /** @type {HTMLElement} */ (els[op.i]).style;
      if (!style) continue;
      const on = o.on && (!o.families || o.families.includes(op.family)) && (!o.keys || o.keys.includes(op.key));
      if (on) {
        style.setProperty(op.prop, op.value, 'important');
        active++;
      } else if (op.prev) style.setProperty(op.prop, op.prev, op.prevPriority);
      else style.removeProperty(op.prop);
    }
    return active;
  };
  const list = [...changes.values()];
  /** @type {Record<string, number>} */
  const byFamily = {};
  for (const op of ops) byFamily[op.family] = (byFamily[op.family] ?? 0) + 1;
  Object.defineProperty(window, '__dsSim', { value: { els, ops, changes: list, byFamily, show }, configurable: true });
  return { elements: els.length, operations: ops.length, changes: list, byFamily };
}

/** Exécutée dans la page : rectangles (coordonnées de page) des éléments demandés. @param {number[]} indices */
export function rectsInPage(indices) {
  const { els } = /** @type {any} */ (window).__dsSim;
  return indices.map((i) => {
    const r = els[i].getBoundingClientRect();
    return { i, x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
  });
}

/** Exécutée dans la page. @param {{ on: boolean, families?: string[] | null, keys?: string[] | null }} o */
export function showInPage(o) {
  return /** @type {any} */ (window).__dsSim.show(o);
}

/**
 * Exécutée dans la page : barre « avant / après » du mode --live, dans un
 * shadow root (marqué data-ds-lab, que le relevé ignore). Feuille construite :
 * pas de <style> en ligne, donc pas de conflit avec une CSP stricte.
 */
export function toolbarInPage() {
  const LABELS = /** @type {Record<string, string>} */ ({ colors: 'Couleurs', spacing: 'Espacements', fontSizes: 'Tailles', radii: 'Rayons' });
  const sim = /** @type {any} */ (window).__dsSim;
  if (!sim) return false;
  document.querySelectorAll('[data-ds-lab]').forEach((n) => n.remove());
  const host = document.createElement('div');
  host.setAttribute('data-ds-lab', 'barre');
  const root = host.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(`
    :host { all: initial; position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 2147483647; font: 14px/1.3 system-ui, -apple-system, sans-serif; }
    .barre { display: flex; align-items: center; gap: 12px; background: #16181d; color: #fff; padding: 8px 12px; border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,.35); white-space: nowrap; }
    .seg { display: inline-flex; background: #2b2f38; border-radius: 8px; padding: 2px; }
    button { font: inherit; border: 0; border-radius: 6px; padding: 6px 12px; cursor: pointer; background: transparent; color: #cfd3da; }
    button[aria-pressed="true"] { background: #fff; color: #16181d; font-weight: 600; }
    label { display: inline-flex; align-items: center; gap: 5px; cursor: pointer; color: #e6e8ec; }
    small { color: #9aa1ad; }
    .relire { background: #2b2f38; color: #fff; }
  `);
  root.adoptedStyleSheets = [sheet];
  const barre = document.createElement('div');
  barre.className = 'barre';
  const seg = document.createElement('span');
  seg.className = 'seg';
  /** @type {Record<string, HTMLButtonElement>} */
  const buttons = {};
  for (const name of ['Avant', 'Après']) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = name;
    buttons[name] = b;
    seg.appendChild(b);
  }
  barre.appendChild(seg);
  /** @type {Record<string, HTMLInputElement>} */
  const boxes = {};
  for (const [family, n] of Object.entries(sim.byFamily)) {
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = true;
    boxes[family] = box;
    const small = document.createElement('small');
    small.textContent = String(n);
    label.append(box, LABELS[family] ?? family, small);
    barre.appendChild(label);
  }
  const relire = document.createElement('button');
  relire.type = 'button';
  relire.className = 'relire';
  relire.textContent = 'Relire la page';
  barre.appendChild(relire);
  root.appendChild(barre);
  let on = true;
  const refresh = () => {
    const families = Object.entries(boxes).filter(([, b]) => b.checked).map(([f]) => f);
    /** @type {any} */ (window).__dsSim.show({ on, families });
    buttons['Avant'].setAttribute('aria-pressed', String(!on));
    buttons['Après'].setAttribute('aria-pressed', String(on));
    host.setAttribute('data-etat', on ? 'apres' : 'avant');
  };
  buttons['Avant'].addEventListener('click', () => { on = false; refresh(); });
  buttons['Après'].addEventListener('click', () => { on = true; refresh(); });
  for (const b of Object.values(boxes)) b.addEventListener('change', refresh);
  relire.addEventListener('click', () => /** @type {any} */ (window).__dsLive?.());
  document.documentElement.appendChild(host);
  refresh();
  return true;
}

/**
 * Mode --live : à chaque page chargée dans ce contexte, la table est relevée
 * et la barre avant / après posée. Le script est injecté par le navigateur
 * (pas par une balise), donc une CSP du site ne le bloque pas.
 * @param {import('playwright-core').BrowserContext} context
 * @param {Record<string, Record<string, string>>} map
 * @param {{ delayMs?: number }} [opts]
 */
export async function installLive(context, map, { delayMs = 800 } = {}) {
  await context.addInitScript({
    content: `(() => {
  if (window.top !== window) return;
  const scan = ${scanInPage.toString()};
  const toolbar = ${toolbarInPage.toString()};
  const map = ${JSON.stringify(map)};
  window.__dsLive = () => { scan(map); return toolbar(); };
  window.addEventListener('load', () => setTimeout(window.__dsLive, ${Number(delayMs)}));
})();`,
  });
}

const PAD = 12;
const MAX_W = 520;
const MAX_H = 240;

/**
 * @typedef {{ png: string, width: number, height: number, box: { x: number, y: number, width: number, height: number } }} Shot
 *   png : base64 ; box : rectangle de l'élément modifié dans la capture, en pixels
 */

/**
 * @param {import('playwright-core').Page} page
 * @param {{ x: number, y: number, width: number, height: number }} r
 * @returns {Promise<Shot>}
 */
async function crop(page, r) {
  const doc = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  const x = Math.max(0, Math.floor(r.x - PAD));
  const y = Math.max(0, Math.floor(r.y - PAD));
  const width = Math.max(8, Math.min(MAX_W, Math.ceil(r.width + 2 * PAD), doc.width - x));
  const height = Math.max(8, Math.min(MAX_H, Math.ceil(r.height + 2 * PAD), doc.height - y));
  const buf = await page.screenshot({ fullPage: true, clip: { x, y, width, height }, animations: 'disabled' });
  return {
    png: buf.toString('base64'),
    width,
    height,
    box: { x: Math.round(r.x - x), y: Math.round(r.y - y), width: Math.round(Math.min(r.width, width)), height: Math.round(Math.min(r.height, height)) },
  };
}

/**
 * @typedef {object} SimulatedChange
 * @property {string} key       clé de la ligne (famille|ancien[|usage])
 * @property {string} family
 * @property {string} [usage]
 * @property {string} old
 * @property {string} new
 * @property {number} count
 * @property {string[]} props   propriétés touchées, sans le côté (padding, margin, color…)
 * @property {{ before: Shot, after: Shot }[]} crops  l'« après » ne contient que ce changement
 */

/**
 * Simule la table sur une page déjà chargée. La page est laissée avec toute
 * la table appliquée.
 * @param {import('playwright-core').Page} page
 * @param {Record<string, Record<string, string>>} map
 * @param {{ maxCropped?: number, fullPage?: boolean }} [opts]
 *   maxCropped : nombre de changements illustrés par des captures (les plus fréquents d'abord)
 * @returns {Promise<{ url: string, elements: number, operations: number, changes: SimulatedChange[], before: string | null, after: string | null }>}
 */
export async function simulatePage(page, map, { maxCropped = 80, fullPage = true } = {}) {
  const scan = await page.evaluate(scanInPage, map);
  const before = fullPage ? (await page.screenshot({ fullPage: true, animations: 'disabled' })).toString('base64') : null;
  const shown = new Set([...scan.changes].sort((a, b) => b.count - a.count).slice(0, maxCropped));
  /** @type {Map<number, Shot>} */
  const beforeShots = new Map();
  for (const r of await page.evaluate(rectsInPage, [...new Set([...shown].flatMap((c) => c.samples))])) beforeShots.set(r.i, await crop(page, r));
  /** @type {Map<string, { before: Shot, after: Shot }[]>} */
  const shots = new Map();
  for (const c of shown) {
    if (!c.samples.length) continue;
    const key = c.key;
    await page.evaluate(showInPage, { on: true, keys: [key] });
    const list = [];
    for (const r of await page.evaluate(rectsInPage, c.samples)) {
      const b = beforeShots.get(r.i);
      if (b) list.push({ before: b, after: await crop(page, r) });
    }
    shots.set(key, list);
    await page.evaluate(showInPage, { on: false });
  }
  await page.evaluate(showInPage, { on: true });
  const after = fullPage ? (await page.screenshot({ fullPage: true, animations: 'disabled' })).toString('base64') : null;
  return {
    url: page.url(),
    elements: scan.elements,
    operations: scan.operations,
    changes: scan.changes.map((/** @type {any} */ c) => ({ key: c.key, family: c.family, old: c.old, usage: c.usage, new: c.new, count: c.count, props: c.props, crops: shots.get(c.key) ?? [] })),
    before,
    after,
  };
}
