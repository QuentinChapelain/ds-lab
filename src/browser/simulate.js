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
 * @param {Record<string, any>} map  par famille : ancien (ou ancien|usage) → nouveau ; thirdParty : sélecteurs (R6) ;
 *   lot V, étape 4 : solid, paires « fond|texte » de la cible qui font un plein ; couplings, textes
 *   posés sur un plein qui prennent l'onSolid ({ text, bg, to, onSolid }, voir simulationCouplings)
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
  // Lot P : relation d'une marge avec le voisin de son côté, mêmes règles que collectInPage
  // (src/browser/rendered.js), réécrites ici parce que la fonction est sérialisée dans la page.
  const META = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'LINK', 'META', 'TITLE', 'BASE']);
  const CTRL = 'input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([type=image]),select,textarea';
  const HEADINGS = 'h1,h2,h3,h4,h5,h6,[role=heading]';
  const NOT_TEXT = `${HEADINGS},label,button,a[href],${CTRL}`;
  /** @param {Element} e */
  const hasCtrl = (e) => e.matches(CTRL) || !!e.querySelector(CTRL);
  /** @param {Element} e */
  const isText = (e) => !e.matches(NOT_TEXT) && !e.querySelector(NOT_TEXT) && (e.textContent ?? '').trim() !== '';
  /** @param {Element} e */
  const inFlow = (e) => !META.has(e.tagName) && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && !/^(absolute|fixed)$/.test(getComputedStyle(e).position);
  /** @param {Element} e @param {string} side */
  const nearOf = (e, side) => {
    const r = e.getBoundingClientRect();
    let best = null;
    let key = [Infinity, Infinity];
    for (const x of e.parentElement?.children ?? []) {
      if (x === e || !inFlow(x)) continue;
      const q = x.getBoundingClientRect();
      const gap =
        side === 'bottom' ? (q.top >= r.bottom - 0.5 ? q.top - r.bottom : null)
        : side === 'top' ? (q.bottom <= r.top + 0.5 ? r.top - q.bottom : null)
        : side === 'right' ? (q.left >= r.right - 0.5 ? q.left - r.right : null)
        : q.right <= r.left + 0.5 ? r.left - q.right : null;
      if (gap === null) continue;
      const across = side === 'top' || side === 'bottom' ? Math.abs(q.left + q.width / 2 - (r.left + r.width / 2)) : Math.abs(q.top + q.height / 2 - (r.top + r.height / 2));
      const k = [Math.max(0, gap), across];
      if (k[0] < key[0] - 0.01 || (Math.abs(k[0] - key[0]) <= 0.01 && k[1] < key[1])) {
        best = x;
        key = k;
      }
    }
    return best;
  };
  /** @param {Element} a @param {Element} b @param {string} attr */
  const points = (a, b, attr) =>
    [a, ...a.querySelectorAll(`[${attr}]`)].some((x) =>
      (x.getAttribute(attr) ?? '').split(/\s+/).some((id) => {
        const t = id ? document.getElementById(id) : null;
        return !!t && (t === b || b.contains(t));
      }),
    );
  // Étape 3 : un enfant qui est (et non seulement qui contient) un bouton, un lien ou une liste écarte le conteneur.
  const BLOCKERS = 'button,a[href],ul,ol,table,section,article,nav,form,fieldset';
  /** @param {Element | null} p */
  const fieldBox = (p) =>
    !!p &&
    p.querySelectorAll(CTRL).length === 1 &&
    !p.querySelector(HEADINGS) &&
    [...p.children].every((c) => hasCtrl(c) || c.tagName === 'LABEL' || !(c.matches(BLOCKERS) || c.querySelector(BLOCKERS)));
  /**
   * Lot P-fin : un texte non vide (nœud texte) entre deux frères, comme le « / » d'un paginateur :
   * la relation est alors inconnue. @param {Element} a @param {Element} b
   */
  const textBetween = (a, b) => {
    if (a.parentNode !== b.parentNode) return false;
    const [first, last] = a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? [a, b] : [b, a];
    for (let n = first.nextSibling; n && n !== last; n = n.nextSibling) if (n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim()) return true;
    return false;
  };
  /** @param {Element} t */
  const fieldOf = (t) => {
    for (let x = t.previousElementSibling; x; x = x.previousElementSibling) {
      if (!inFlow(x)) continue;
      // Lot P-fin : un texte sous le contrôle seulement, jamais à gauche ni à droite.
      if (x.matches(CTRL)) return t.getBoundingClientRect().top >= x.getBoundingClientRect().bottom - 0.5 ? x : null;
      if (!isText(x)) return null;
    }
    return null;
  };
  /** @param {Element} el @param {string} side */
  const scopeOf = (el, side) => {
    const b = nearOf(el, side);
    if (!b || textBetween(el, b)) return 'inconnue';
    if (points(el, b, 'for') || points(b, el, 'for') || points(el, b, 'aria-describedby') || points(b, el, 'aria-describedby')) return 'dans le composant';
    if (fieldBox(el.parentElement)) {
      const [c, o] = hasCtrl(el) ? [el, b] : [b, el];
      if (hasCtrl(c) && !hasCtrl(o) && !o.matches(HEADINGS)) return 'dans le composant';
    }
    const fa = isText(el) ? fieldOf(el) : null;
    const fb = isText(b) ? fieldOf(b) : null;
    if ((fa && (fa === b || fa === fb)) || (fb && fb === el)) return 'dans le composant';
    return 'entre composants';
  };
  const spacingMap = map.spacing ?? {};
  // Lot P-fin : valeurs × usage coupées par relation, données (split) ou lues dans les clés « ancien|usage|relation ».
  const splitSet = new Set(Array.isArray(map.split) ? map.split : []);
  for (const k of Object.keys(spacingMap)) {
    const parts = k.split('|');
    if (parts.length === 3) splitSet.add(`${parts[0]}|${parts[1]}`);
  }
  /** Une marge de cette valeur figure dans la table (sous « ancien », « ancien|marge » ou « ancien|marge|relation »). @param {string} old */
  const marginListed = (old) => old in spacingMap || Object.keys(spacingMap).some((k) => k === `${old}|marge` || k.startsWith(`${old}|marge|`));
  // Pleins : éléments dont le fond opaque porte un texte plus clair que lui (R1), ou l'onSolid de
  // son échelle (lot V, étape 4 : paires de la cible, comme au relevé).
  const solid = new Set(Array.isArray(map.solid) ? map.solid : []);
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
        if (lum(fg) > lum(bg) || solid.has(`${bg}|${fg}`)) plein.add(x);
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
  /** with : clé de l'opération de fond à laquelle un couplage est lié (lot V, étape 4). @type {{ i: number, prop: string, value: string, family: string, key: string, prev: string, prevPriority: string, with?: string | null }[]} */
  const ops = [];
  /** Éléments porteurs de texte, pour les couplages. @type {number[]} */
  const textEls = [];
  /** @type {Map<string, { key: string, family: string, old: string, usage?: string, new: string, count: number, samples: number[], props: string[] }>} */
  const changes = new Map();
  /** @param {number} i @param {string} family @param {string} prop @param {string | null} old @param {string} [usage] @param {string} [scope]  lot P : relation d'une marge */
  const consider = (i, family, prop, old, usage, scope) => {
    const next = old ? (usage ? (scope ? map[family]?.[`${old}|${usage}|${scope}`] : undefined) ?? map[family]?.[`${old}|${usage}`] ?? map[family]?.[old] : map[family]?.[old]) : undefined;
    if (!old || !next) return;
    // Lot P-fin : la relation n'entre dans la clé que pour une valeur coupée, comme dans la table.
    const cut = !!scope && splitSet.has(`${old}|${usage}`);
    const key = usage ? `${family}|${old}|${usage}${cut ? `|${scope}` : ''}` : `${family}|${old}`;
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
        const raw = cs.getPropertyValue(`border-${c}-radius`).trim().split(/\s+/)[0];
        const pct = /^(\d+(?:\.\d+)?)%$/.exec(raw);
        if (pct) {
          // R7 (lot M) : un pourcentage de 50 % ou plus est une pilule.
          consider(i, 'radii', `border-${c}-radius`, `${Number(pct[1])}%`, Number(pct[1]) >= 50 ? 'pilule' : 'rayon');
          continue;
        }
        const k = pxKey(raw);
        const n = k ? parseFloat(k) : 0;
        const pill = n >= 500 || (box.width > 0 && box.height > 0 && n >= Math.min(box.width, box.height) / 2);
        consider(i, 'radii', `border-${c}-radius`, k, pill ? 'pilule' : 'rayon');
      }
      const auto = autoSidesOf(el, cs);
      for (const s of SIDES) {
        const m = pxKey(cs.getPropertyValue(`margin-${s}`));
        if (m && m !== '0px' && !auto.includes(s) && marginListed(m)) consider(i, 'spacing', `margin-${s}`, m, 'marge', scopeOf(el, s));
        const p = pxKey(cs.getPropertyValue(`padding-${s}`));
        if (p && p !== '0px') consider(i, 'spacing', `padding-${s}`, p, 'retrait');
        if (cs.getPropertyValue(`border-${s}-style`) !== 'none' && parseFloat(cs.getPropertyValue(`border-${s}-width`)) > 0)
          consider(i, 'colors', `border-${s}-color`, hexKey(cs.getPropertyValue(`border-${s}-color`)), 'bordure');
      }
      if (/\b(flex|grid)\b/.test(cs.display)) for (const g of ['row-gap', 'column-gap']) consider(i, 'spacing', g, pxKey(cs.getPropertyValue(g)), 'gouttière');
      consider(i, 'colors', 'background-color', hexKey(cs.backgroundColor), plein.has(el) ? 'plein' : 'fond');
      // Lot R : la valeur d'un champ rempli est un texte (comme au relevé, R3 bis) : couleur et taille changent.
      if (text || hasText(el)) {
        textEls.push(i);
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
  // Lot V, étape 4 : COUPLAGES. Un texte dont la couleur et le fond (premier fond opaque, lu avant
  // simulation) sont une paire couplée, et dont le fond simulé vaut le fond attendu, prend l'onSolid.
  // L'opération suit celle du fond (with) ; sans opération de fond (fond déjà sur la cible), elle
  // ne s'allume que dans la simulation complète.
  const couplings = Array.isArray(map.couplings) ? map.couplings : [];
  if (couplings.length)
    for (const i of textEls) {
      const el = els[i];
      const fg = hexKey(getComputedStyle(el).color);
      if (!fg) continue;
      /** @type {Element | null} */
      let x = el;
      let bgOld = null;
      for (; x; x = x.parentElement) if ((bgOld = hexKey(getComputedStyle(x).backgroundColor))) break;
      if (!x || !bgOld) continue;
      const j = els.indexOf(x);
      const bgOp = j < 0 ? undefined : ops.find((op) => op.i === j && op.prop === 'background-color');
      const after = bgOp?.value ?? bgOld;
      const c = couplings.find((/** @type {any} */ k) => k.text === fg && k.bg === bgOld && k.to === after);
      if (!c) continue;
      const style = /** @type {HTMLElement} */ (el).style;
      ops.push({ i, prop: 'color', value: c.onSolid, family: 'colors', key: `colors|${fg}|texte|sur-plein`, with: bgOp?.key ?? null, prev: style?.getPropertyValue('color') ?? '', prevPriority: style?.getPropertyPriority('color') ?? '' });
    }
  /**
   * Allume ou éteint la simulation, pour tout, pour des familles ou pour des changements.
   * @param {{ on: boolean, families?: string[] | null, keys?: string[] | null }} o
   */
  const show = (o) => {
    let active = 0;
    // Lot V, étape 4 : un couplage s'allume avec l'opération de fond qu'il suit (with).
    /** @param {(typeof ops)[number]} op */
    const isOn = (op) => o.on && (!o.families || o.families.includes(op.family)) && (!o.keys || o.keys.includes(op.key) || (!!op.with && o.keys.includes(op.with)));
    // Deux passages : on rétablit d'abord, on pose ensuite, pour qu'une opération éteinte
    // n'efface pas une autre posée sur la même propriété du même élément (texte et couplage).
    for (const op of ops) {
      const style = /** @type {HTMLElement} */ (els[op.i]).style;
      if (!style || isOn(op)) continue;
      if (op.prev) style.setProperty(op.prop, op.prev, op.prevPriority);
      else style.removeProperty(op.prop);
    }
    for (const op of ops) {
      const style = /** @type {HTMLElement} */ (els[op.i]).style;
      if (!style || !isOn(op)) continue;
      style.setProperty(op.prop, op.value, 'important');
      active++;
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
 * Lot R, R-2 : liste « Une ligne » (identifiant et titre des lignes présentes sur la page) ;
 * en choisir une n'applique que cette ligne, « Toutes » revient au mode par familles.
 * @param {{ key: string, id: string, title: string }[]} [lines]
 */
export function toolbarInPage(lines = []) {
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
    select { font: inherit; max-width: 360px; background: #2b2f38; color: #fff; border: 0; border-radius: 6px; padding: 5px 8px; }
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
  // Une ligne : les lignes de la table que cette page touche, dans l'ordre des identifiants.
  const known = new Set(sim.changes.map((/** @type {any} */ c) => c.key));
  const here = lines.filter((l) => known.has(l.key)).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const pick = document.createElement('label');
  const select = document.createElement('select');
  const all = document.createElement('option');
  all.value = '';
  all.textContent = 'Toutes';
  select.appendChild(all);
  for (const l of here) {
    const o = document.createElement('option');
    o.value = l.key;
    o.textContent = `${l.id} ${l.title}`;
    select.appendChild(o);
  }
  pick.append('Une ligne', select);
  barre.appendChild(pick);
  const relire = document.createElement('button');
  relire.type = 'button';
  relire.className = 'relire';
  relire.textContent = 'Relire la page';
  barre.appendChild(relire);
  root.appendChild(barre);
  let on = true;
  const refresh = () => {
    const families = Object.entries(boxes).filter(([, b]) => b.checked).map(([f]) => f);
    const only = select.value;
    if (only) /** @type {any} */ (window).__dsSim.show({ on, keys: [only] });
    else /** @type {any} */ (window).__dsSim.show({ on, families });
    for (const b of Object.values(boxes)) b.disabled = !!only;
    host.setAttribute('data-ligne', only);
    buttons['Avant'].setAttribute('aria-pressed', String(!on));
    buttons['Après'].setAttribute('aria-pressed', String(on));
    host.setAttribute('data-etat', on ? 'apres' : 'avant');
  };
  buttons['Avant'].addEventListener('click', () => { on = false; refresh(); });
  buttons['Après'].addEventListener('click', () => { on = true; refresh(); });
  for (const b of Object.values(boxes)) b.addEventListener('change', refresh);
  select.addEventListener('change', refresh);
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
 * @param {{ delayMs?: number, lines?: { key: string, id: string, title: string }[] }} [opts]
 *   lines : identifiant et titre de chaque ligne de la table (R-2), pour la liste « Une ligne »
 */
export async function installLive(context, map, { delayMs = 800, lines = [] } = {}) {
  await context.addInitScript({
    content: `(() => {
  if (window.top !== window) return;
  const scan = ${scanInPage.toString()};
  const toolbar = ${toolbarInPage.toString()};
  const map = ${JSON.stringify(map)};
  const lines = ${JSON.stringify(lines).replace(/</g, '\\u003c')};
  window.__dsLive = () => { scan(map); return toolbar(lines); };
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

/**
 * Lot R, R-3 : exécutée dans la page, après scanInPage et showInPage. Élément d'une ligne
 * (le premier d'au moins 8 × 8 px, sinon le premier touché), son rectangle en coordonnées de
 * page, la valeur calculée de chaque propriété touchée (px ou hex), la taille du document et,
 * règle R-9, les rectangles qui donnent le contexte :
 *   marge      l'élément frère le plus proche à l'écran du côté de la marge (en dessous pour
 *              une marge basse, au-dessus, à gauche, à droite), sinon le bord du parent ; si ce
 *              voisin est le libellé d'un champ, le champ aussi ;
 *   gouttière  les deux premiers enfants qu'elle sépare ;
 *   champ      son libellé (label associé).
 * Lot R : lignes de texte autour (lines) : chaque ligne visible proche de l'élément, avec le bloc
 * qui la porte ; avec un cadre (clip), le nombre de lignes que ses bords haut et bas coupent.
 * @param {{ key: string, i?: number, family: string, usage?: string, lines?: boolean, clip?: { x: number, y: number, width: number, height: number } }} o
 *   i : élément imposé (versions suivantes)
 */
export function versionInPage({ key, i, family, usage, lines = false, clip }) {
  const sim = /** @type {any} */ (window).__dsSim;
  const ops = sim.ops.filter((/** @type {any} */ op) => op.key === key);
  if (!ops.length) return null;
  const change = sim.changes.find((/** @type {any} */ c) => c.key === key);
  const index = i ?? change?.samples?.[0] ?? ops[0].i;
  const el = sim.els[index];
  if (!el) return null;
  const cs = getComputedStyle(el);
  /** @param {string} v */
  const norm = (v) => {
    const px = /^(-?\d+(?:\.\d+)?)px$/.exec(v.trim());
    if (px) return `${Math.round(Number(px[1]) * 100) / 100}px`;
    const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(v.trim());
    if (m) return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
    return v.trim();
  };
  /** @param {Element} e */
  const rectOf = (e) => {
    const r = e.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
  };
  const META = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'LINK', 'META']);
  /** @param {Element | null} e */
  const visible = (e) => !!e && !META.has(e.tagName) && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  /**
   * Frère le plus proche à l'écran, entièrement du côté demandé ; à distance égale, le plus
   * proche dans l'autre axe (centres).
   * @param {Element} e @param {string} side
   */
  const sibling = (e, side) => {
    const r = rectOf(e);
    const T = 0.5;
    let best = null;
    let bestKey = [Infinity, Infinity];
    for (const x of e.parentElement?.children ?? []) {
      if (x === e || !visible(x)) continue;
      const q = rectOf(x);
      const gap =
        side === 'bottom' ? (q.y >= r.y + r.height - T ? q.y - (r.y + r.height) : null)
        : side === 'top' ? (q.y + q.height <= r.y + T ? r.y - (q.y + q.height) : null)
        : side === 'right' ? (q.x >= r.x + r.width - T ? q.x - (r.x + r.width) : null)
        : q.x + q.width <= r.x + T ? r.x - (q.x + q.width) : null;
      if (gap === null) continue;
      const across = side === 'bottom' || side === 'top' ? Math.abs(q.x + q.width / 2 - (r.x + r.width / 2)) : Math.abs(q.y + q.height / 2 - (r.y + r.height / 2));
      const key = [Math.max(0, gap), across];
      if (key[0] < bestKey[0] - 0.01 || (Math.abs(key[0] - bestKey[0]) <= 0.01 && key[1] < bestKey[1])) {
        best = x;
        bestKey = key;
      }
    }
    return best;
  };
  const props = [...new Set(ops.filter((/** @type {any} */ op) => op.i === index).map((/** @type {any} */ op) => op.prop))];
  const er = rectOf(el);
  /** @type {{ kind: string, side?: string, rect: { x: number, y: number, width: number, height: number } }[]} */
  const around = [];
  if (family === 'spacing' && usage === 'marge') {
    for (const p of props) {
      const side = p.replace('margin-', '');
      const s = sibling(el, side);
      if (s) {
        around.push({ kind: 'voisin', side, rect: rectOf(s) });
        // Voisin libellé d'un champ : le champ aussi.
        const control = s.tagName === 'LABEL' ? /** @type {any} */ (s).control : null;
        if (control && control !== el && visible(control)) around.push({ kind: 'champ du voisin', side, rect: rectOf(control) });
      } else if (el.parentElement) {
        // Sans voisin de ce côté : le bord du parent, comme un trait.
        const pr = rectOf(el.parentElement);
        const edge =
          side === 'bottom' ? { x: er.x, y: pr.y + pr.height, width: er.width, height: 0 }
          : side === 'top' ? { x: er.x, y: pr.y, width: er.width, height: 0 }
          : side === 'left' ? { x: pr.x, y: er.y, width: 0, height: er.height }
          : { x: pr.x + pr.width, y: er.y, width: 0, height: er.height };
        around.push({ kind: 'bord du parent', side, rect: edge });
      }
    }
  }
  if (family === 'spacing' && usage === 'gouttière') for (const c of [...el.children].filter(visible).slice(0, 2)) around.push({ kind: 'enfant', rect: rectOf(c) });
  const label = [...(/** @type {any} */ (el).labels ?? [])].find(visible);
  if (label) around.push({ kind: 'libellé', rect: rectOf(label) });
  // R-8 : zone d'espace, en coordonnées de page. Marge : bande hors de l'élément, du côté touché ;
  // retrait : bande à l'intérieur de la bordure, côté par côté ; gouttière : bande entre les deux enfants.
  /** @type {{ side?: string, axis?: string, px: number, rect: { x: number, y: number, width: number, height: number } }[]} */
  const space = [];
  const num = (/** @type {string} */ p) => parseFloat(cs.getPropertyValue(p)) || 0;
  const r2 = (/** @type {number} */ n) => Math.round(n * 100) / 100;
  if (family === 'spacing' && usage === 'marge')
    for (const p of props) {
      const side = p.replace('margin-', '');
      const m = num(p);
      const rect =
        side === 'bottom' ? { x: er.x, y: er.y + er.height, width: er.width, height: m }
        : side === 'top' ? { x: er.x, y: er.y - m, width: er.width, height: m }
        : side === 'left' ? { x: er.x - m, y: er.y, width: m, height: er.height }
        : { x: er.x + er.width, y: er.y, width: m, height: er.height };
      // Lot P-fin : marge absorbée, quand l'espace visible vient de la marge du voisin, plus grande (fusion).
      const s = sibling(el, side);
      if (s) {
        const q = rectOf(s);
        const visible = side === 'bottom' ? q.y - (er.y + er.height) : side === 'top' ? er.y - (q.y + q.height) : side === 'left' ? er.x - (q.x + q.width) : q.x - (er.x + er.width);
        const OPPOSITE = /** @type {Record<string, string>} */ ({ top: 'bottom', bottom: 'top', left: 'right', right: 'left' });
        const theirs = parseFloat(getComputedStyle(s).getPropertyValue(`margin-${OPPOSITE[side]}`)) || 0;
        if (theirs > m + 0.5 && Math.abs(visible - theirs) < 0.5) {
          space.push({ side, px: r2(m), rect, visiblePx: r2(visible), absorbed: true });
          continue;
        }
      }
      space.push({ side, px: r2(m), rect });
    }
  if (family === 'spacing' && usage === 'retrait') {
    const [bt, br, bb, bl] = ['top', 'right', 'bottom', 'left'].map((x) => num(`border-${x}-width`));
    const inner = { x: er.x + bl, y: er.y + bt, width: er.width - bl - br, height: er.height - bt - bb };
    for (const p of props) {
      const side = p.replace('padding-', '');
      const v = num(p);
      const rect =
        side === 'top' ? { x: inner.x, y: inner.y, width: inner.width, height: v }
        : side === 'bottom' ? { x: inner.x, y: inner.y + inner.height - v, width: inner.width, height: v }
        : side === 'left' ? { x: inner.x, y: inner.y, width: v, height: inner.height }
        : { x: inner.x + inner.width - v, y: inner.y, width: v, height: inner.height };
      space.push({ side, px: r2(v), rect });
    }
  }
  if (family === 'spacing' && usage === 'gouttière') {
    const kids = around.filter((a) => a.kind === 'enfant').map((a) => a.rect);
    if (kids.length === 2) {
      const [a, b] = kids;
      const top = Math.min(a.y, b.y);
      const left = Math.min(a.x, b.x);
      if (b.x >= a.x + a.width - 0.5)
        space.push({ axis: 'colonne', px: r2(b.x - (a.x + a.width)), rect: { x: a.x + a.width, y: top, width: b.x - (a.x + a.width), height: Math.max(a.y + a.height, b.y + b.height) - top } });
      else if (b.y >= a.y + a.height - 0.5)
        space.push({ axis: 'rangée', px: r2(b.y - (a.y + a.height)), rect: { x: left, y: a.y + a.height, width: Math.max(a.x + a.width, b.x + b.width) - left, height: b.y - (a.y + a.height) } });
    }
  }
  // Lot R : pour une couleur, le contraste le plus faible des éléments touchés et son seuil.
  // Texte, fond, plein : la couleur du texte de l'élément sur le premier fond opaque, en remontant
  // depuis l'élément (4,5:1, 3:1 en grand texte) ; bordure : sur le fond du parent (3:1).
  /** @type {{ ratio: number, threshold: number, text: string, bg: string } | null} */
  let contrast = null;
  if (family === 'colors') {
    /** @param {string} v */
    const rgb = (v) => {
      const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(v.trim());
      return m && (m[4] === undefined || Number(m[4]) >= 1) ? [1, 2, 3].map((k) => Number(m[k])) : null;
    };
    /** @param {number[]} c */
    const lum = (c) => {
      const [R, G, B] = c.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };
    /** @param {Element | null} e */
    const bgOf = (e) => {
      for (let x = e; x; x = x.parentElement) {
        const c = rgb(getComputedStyle(x).backgroundColor);
        if (c) return c;
      }
      return [255, 255, 255];
    };
    for (const j of [...new Set(ops.map((/** @type {any} */ op) => op.i))]) {
      const e = sim.els[j];
      const ecs = getComputedStyle(e);
      const prop = ops.find((/** @type {any} */ op) => op.i === j).prop;
      const border = usage === 'bordure';
      const fg = rgb(border ? ecs.getPropertyValue(prop) : ecs.color);
      if (!fg) continue;
      const bg = border ? bgOf(e.parentElement) : bgOf(e);
      const size = parseFloat(ecs.fontSize);
      const large = size >= 24 || (size >= (14 * 96) / 72 && Number(ecs.fontWeight) >= 700);
      const threshold = border || large ? 3 : 4.5;
      const [a, b] = [lum(fg), lum(bg)];
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const hexOf = (/** @type {number[]} */ c) => '#' + c.map((n) => n.toString(16).padStart(2, '0')).join('');
      if (!contrast || ratio / threshold < contrast.ratio / contrast.threshold) contrast = { ratio: Math.round(ratio * 10000) / 10000, threshold, text: hexOf(fg), bg: hexOf(bg) };
    }
  }
  // Lignes de texte visibles (boîtes de ligne), avec le bloc qui les porte, près de l'élément.
  /** @type {{ line: { x: number, y: number, width: number, height: number }, block: { x: number, y: number, width: number, height: number } }[]} */
  const textLines = [];
  if (lines || clip) {
    const all = [er, ...around.map((a) => a.rect)];
    const zone = clip ?? {
      x: Math.min(...all.map((r) => r.x)) - 32,
      y: Math.min(...all.map((r) => r.y)) - 440,
      width: Math.max(...all.map((r) => r.x + r.width)) - Math.min(...all.map((r) => r.x)) + 64,
      height: Math.max(...all.map((r) => r.y + r.height)) - Math.min(...all.map((r) => r.y)) + 880,
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!(n.textContent ?? '').trim()) continue;
      let block = n.parentElement;
      if (!block || !visible(block)) continue;
      while (block.parentElement && getComputedStyle(block).display.startsWith('inline')) block = block.parentElement;
      const range = document.createRange();
      range.selectNodeContents(n);
      const b = rectOf(block);
      for (const q of range.getClientRects()) {
        const line = { x: q.left + window.scrollX, y: q.top + window.scrollY, width: q.width, height: q.height };
        if (line.width < 1 || line.height < 1) continue;
        if (line.x > zone.x + zone.width || line.x + line.width < zone.x || line.y > zone.y + zone.height || line.y + line.height < zone.y) continue;
        textLines.push({ line, block: b });
      }
    }
  }
  /** Lignes coupées par le bord haut ou bas du cadre. */
  const cutLines = clip
    ? textLines.filter(({ line: l }) => (l.y < clip.y - 0.5 && l.y + l.height > clip.y + 0.5) || (l.y < clip.y + clip.height - 0.5 && l.y + l.height > clip.y + clip.height + 0.5)).length
    : 0;
  return {
    i: index,
    tag: el.tagName.toLowerCase(),
    values: Object.fromEntries(props.map((p) => [p, norm(cs.getPropertyValue(p))])),
    rect: er,
    around,
    space,
    contrast,
    ...(lines ? { lines: textLines } : {}),
    ...(clip ? { cutLines } : {}),
    doc: { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight },
  };
}

/** @param {number} n */
const r2 = (n) => Math.round(n * 100) / 100;

/** R-9 : marge autour du cadre, hauteur maximale ; R-8 : largeur d'un retrait large, densité des captures. */
export const FRAME = { pad: 16, maxHeight: 400, wideRetrait: 600, scale: 2 };

/**
 * @typedef {{ x: number, y: number, width: number, height: number }} Rect
 * @typedef {object} DecisionVersion
 * @property {string} label     « actuelle », « candidat 1 »…
 * @property {string} value     valeur posée sur la ligne
 * @property {string} [name]    nom du pas de la cible
 * @property {Record<string, string>} measured  valeur calculée de l'élément, par propriété touchée
 * @property {{ kind: string, side?: string, rect: Rect }[]} around  contexte du cadre (R-9), en coordonnées de page
 * @property {{ side?: string, axis?: string, px: number, rect: Rect, visiblePx?: number, absorbed?: boolean }[]} space  zone d'espace (R-8), dans la capture,
 *   en px CSS : bande de marge, de retrait (côté par côté) ou de gouttière ; px : son épaisseur ;
 *   absorbed, visiblePx (lot P-fin) : marge absorbée par celle du voisin, plus grande, et espace visible
 * @property {{ ratio: number, threshold: number, text: string, bg: string }} [contrast]  couleur : contraste le plus faible
 *   des éléments touchés, son seuil et sa paire (texte ou bordure, fond)
 * @property {Shot & { scale: number }} shot  même cadre et même taille pour toutes les versions d'une décision ;
 *   width et height en px CSS, l'image en densité scale
 * @typedef {{ page: string, element: { tag: string, index: number }, clip: Rect, versions: DecisionVersion[] }} DecisionCapture
 */

/**
 * Lot R, R-9 : cadre commun à toutes les versions. Réunion, sous chaque version, de l'élément
 * (pour une gouttière, de ses deux premiers enfants) et de son contexte, plus 16 px, dans le
 * document le plus petit. Au-delà de 400 px de haut, une fenêtre de 400 px : pour un retrait,
 * ancrée en haut de l'élément, ou en bas si seul le retrait bas change ; sinon centrée sur ce
 * qui change (le bord de l'élément du côté de la marge, le milieu entre les deux enfants, à
 * défaut le centre de l'élément). R-8 : un retrait sur un élément de plus de 600 px de large
 * a une fenêtre de 600 px de large, ancrée à gauche, ou à droite si seul le retrait droit change.
 * @param {{ rect: Rect, values: Record<string, string>, around: { kind: string, side?: string, rect: Rect }[], doc: { width: number, height: number } }[]} probes
 * @param {{ usage?: string, family: string }} d
 * @returns {Rect}
 */
export function frameOf(probes, d) {
  const gap = d.family === 'spacing' && d.usage === 'gouttière';
  const rects = probes.flatMap((p) => {
    const kids = p.around.filter((a) => a.kind === 'enfant').map((a) => a.rect);
    const base = gap && kids.length ? kids : [p.rect];
    return [...base, ...p.around.filter((a) => a.kind !== 'enfant').map((a) => a.rect)];
  });
  const docW = Math.min(...probes.map((p) => p.doc.width));
  const docH = Math.min(...probes.map((p) => p.doc.height));
  let x0 = Math.max(0, Math.floor(Math.min(...rects.map((r) => r.x)) - FRAME.pad));
  let x1 = Math.min(docW, Math.ceil(Math.max(...rects.map((r) => r.x + r.width)) + FRAME.pad));
  const retrait = d.family === 'spacing' && d.usage === 'retrait';
  const sides = Object.keys(probes[0].values).map((k) => k.replace('padding-', ''));
  if (retrait && probes[0].rect.width > FRAME.wideRetrait) {
    const p = probes[0];
    if (sides.length === 1 && sides[0] === 'right') {
      x1 = Math.min(docW, Math.ceil(p.rect.x + p.rect.width) + FRAME.pad);
      x0 = Math.max(0, x1 - FRAME.wideRetrait);
    } else {
      x0 = Math.max(0, Math.floor(p.rect.x) - FRAME.pad);
      x1 = Math.min(docW, x0 + FRAME.wideRetrait);
    }
  }
  let y0 = Math.max(0, Math.floor(Math.min(...rects.map((r) => r.y)) - FRAME.pad));
  let y1 = Math.min(docH, Math.ceil(Math.max(...rects.map((r) => r.y + r.height)) + FRAME.pad));
  if (y1 - y0 > FRAME.maxHeight && retrait) {
    // Retrait : coin haut-gauche de l'élément, ou le côté touché s'il n'y en a qu'un.
    const p = probes[0];
    if (sides.length === 1 && sides[0] === 'bottom') {
      y1 = Math.min(y1, Math.ceil(p.rect.y + p.rect.height) + FRAME.pad);
      y0 = y1 - FRAME.maxHeight;
    } else {
      y0 = Math.max(y0, Math.floor(p.rect.y) - FRAME.pad);
      y1 = y0 + FRAME.maxHeight;
    }
  } else if (y1 - y0 > FRAME.maxHeight) {
    const p = probes[0];
    const side = p.around.find((a) => a.side)?.side;
    const kids = p.around.filter((a) => a.kind === 'enfant').map((a) => a.rect);
    const focus =
      side === 'bottom' ? p.rect.y + p.rect.height
      : side === 'top' ? p.rect.y
      : gap && kids.length === 2 ? (kids[0].y + kids[0].height / 2 + kids[1].y + kids[1].height / 2) / 2
      : p.rect.y + p.rect.height / 2;
    const top = Math.round(Math.min(Math.max(focus - FRAME.maxHeight / 2, y0), y1 - FRAME.maxHeight));
    y0 = top;
    y1 = top + FRAME.maxHeight;
  }
  // Lot R : un bord qui coupe une ligne de texte s'élargit jusqu'au bord du bloc qui la porte,
  // dans la limite de 400 px de haut ; au-delà, il passe entre deux lignes, jamais au milieu.
  const all = probes.flatMap((p) => /** @type {any} */ (p).lines ?? []);
  for (let round = 0; round < 6 && all.length; round++) {
    const across = all.filter((/** @type {any} */ t) => t.line.x < x1 && t.line.x + t.line.width > x0);
    const top = across.filter((/** @type {any} */ t) => t.line.y < y0 - 0.5 && t.line.y + t.line.height > y0 + 0.5);
    const bottom = across.filter((/** @type {any} */ t) => t.line.y < y1 - 0.5 && t.line.y + t.line.height > y1 + 0.5);
    if (!top.length && !bottom.length) break;
    if (top.length) {
      const edge = Math.max(0, Math.floor(Math.min(...top.map((/** @type {any} */ t) => t.block.y))));
      y0 = y1 - edge <= FRAME.maxHeight ? edge : Math.ceil(Math.max(...top.map((/** @type {any} */ t) => t.line.y + t.line.height)));
    }
    if (bottom.length) {
      const edge = Math.min(docH, Math.ceil(Math.max(...bottom.map((/** @type {any} */ t) => t.block.y + t.block.height))));
      y1 = edge - y0 <= FRAME.maxHeight ? edge : Math.floor(Math.min(...bottom.map((/** @type {any} */ t) => t.line.y)));
    }
  }
  return { x: x0, y: y0, width: Math.max(8, x1 - x0), height: Math.max(8, y1 - y0) };
}

/**
 * Lot R, R-3 : une capture par version de chaque décision (actuelle, puis chaque candidat).
 * Base : la page d'origine ; chaque version ne change que cette ligne. Un élément par
 * décision, le premier trouvé dans l'ordre des pages ; même cadre pour toutes les versions (R-9).
 * La page vient d'un contexte en densité FRAME.scale (R-8) : l'image a scale × la taille du cadre.
 * @param {import('playwright-core').Page} page  page d'origine déjà chargée
 * @param {{ key: string, family: string, usage?: string, mapKey: string, old: string, candidates: { value: string, name?: string }[], solid?: string[], couplings?: { text: string, bg: string, to: string, onSolid: string }[] }} d
 * @param {string[]} thirdParty
 * @param {{ index?: number, compact?: boolean, labels?: string[] }} [opts]  index : élément imposé (vignette d'un autre élément touché) ;
 *   compact : cadre réduit à l'élément et à son voisin direct (ou aux enfants d'une gouttière), sans libellé ni champ du voisin ;
 *   labels : noms des versions (lot R, 5c : « avant », « après » pour une ligne appliquée)
 * @returns {Promise<DecisionCapture | null>} null si la ligne ne touche rien sur cette page
 */
export async function captureDecision(page, d, thirdParty = [], { index, compact = false, labels } = {}) {
  const versions = [{ label: labels?.[0] ?? 'actuelle', value: d.old }, ...d.candidates.map((c, n) => ({ label: labels?.[n + 1] ?? `candidat ${n + 1}`, value: c.value, name: c.name }))];
  /** @param {string} value @param {number} [i] */
  const pose = async (value, i) => {
    await page.evaluate(scanInPage, { [d.family]: { [d.mapKey]: value }, thirdParty, solid: d.solid ?? [], couplings: d.couplings ?? [] });
    await page.evaluate(showInPage, { on: true });
    return page.evaluate(versionInPage, { key: d.key, i, family: d.family, usage: d.usage, lines: true });
  };
  // Premier passage : l'élément et son contexte sous chaque version, pour un cadre commun.
  const first = await pose(versions[0].value, index);
  if (!first) {
    await page.evaluate(showInPage, { on: false });
    return null;
  }
  const probes = [first];
  for (const v of versions.slice(1)) {
    const p = await pose(v.value, first.i);
    if (p) probes.push(p);
  }
  await page.evaluate(showInPage, { on: false });
  const DIRECT = new Set(['voisin', 'bord du parent', 'enfant']);
  const clip = frameOf(compact ? probes.map((p) => ({ ...p, around: p.around.filter((a) => DIRECT.has(a.kind)) })) : probes, d);
  const scale = await page.evaluate(() => window.devicePixelRatio);
  // Second passage : capture de chaque version dans ce cadre, puis valeur calculée et contexte.
  /** @type {DecisionVersion[]} */
  const out = [];
  for (const v of versions) {
    await pose(v.value, first.i);
    const buf = await page.screenshot({ fullPage: true, clip, animations: 'disabled' });
    const m = await page.evaluate(versionInPage, { key: d.key, i: first.i, family: d.family, usage: d.usage, clip });
    const r = m?.rect ?? first.rect;
    /** @param {Rect} q */
    const rel = (q) => ({ x: r2(q.x - clip.x), y: r2(q.y - clip.y), width: r2(q.width), height: r2(q.height) });
    out.push({
      label: v.label,
      value: v.value,
      ...(v.name ? { name: v.name } : {}),
      measured: m?.values ?? {},
      around: m?.around ?? [],
      space: (m?.space ?? []).map((z) => ({ ...z, rect: rel(z.rect) })),
      ...(m?.contrast ? { contrast: m.contrast } : {}),
      cutLines: m?.cutLines ?? 0,
      shot: {
        png: buf.toString('base64'),
        width: clip.width,
        height: clip.height,
        scale,
        box: { x: Math.round(r.x - clip.x), y: Math.round(r.y - clip.y), width: Math.round(r.width), height: Math.round(r.height) },
      },
    });
  }
  await page.evaluate(showInPage, { on: false });
  return { page: page.url(), element: { tag: first.tag, index: first.i }, clip, versions: out };
}

/**
 * Lot R : exécutée dans la page, après scanInPage. Éléments touchés par une ligne, dans l'ordre
 * de la page, avec un repère lisible (balise, id, deux classes) et leur texte visible (40 caractères ;
 * pour un champ, son libellé).
 * @param {{ key: string }} o
 */
export function touchedInPage({ key }) {
  const sim = /** @type {any} */ (window).__dsSim;
  const seen = new Set();
  /** @type {{ index: number, selector: string, text: string }[]} */
  const out = [];
  for (const op of sim.ops) {
    if (op.key !== key || seen.has(op.i)) continue;
    seen.add(op.i);
    const el = sim.els[op.i];
    const t = el.tagName.toLowerCase();
    const cls = [...el.classList].slice(0, 2);
    const selector = el.id ? `${t}#${el.id}` : cls.length ? `${t}.${cls.join('.')}` : t;
    const field = t === 'input' || t === 'textarea' || t === 'select';
    // Un champ : son libellé (label associé, puis aria-label, puis texte d'indice), jamais sa valeur.
    const label = field ? [...(el.labels ?? [])].map((/** @type {any} */ l) => l.innerText).find((/** @type {string} */ x) => x && x.trim()) : null;
    const text = String(field ? label ?? el.getAttribute('aria-label') ?? el.getAttribute('placeholder') ?? '' : el.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
    out.push({ index: op.i, selector, text });
  }
  return out;
}

/**
 * Lot R : éléments touchés par une décision sur une page déjà chargée (version actuelle posée).
 * @param {import('playwright-core').Page} page
 * @param {{ key: string, family: string, mapKey: string, old: string }} d
 * @param {string[]} thirdParty
 */
export async function touchedElements(page, d, thirdParty = []) {
  await page.evaluate(scanInPage, { [d.family]: { [d.mapKey]: d.old }, thirdParty });
  const list = await page.evaluate(touchedInPage, { key: d.key });
  await page.evaluate(showInPage, { on: false });
  return list;
}
