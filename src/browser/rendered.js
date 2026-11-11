// @ts-check
/**
 * Rendu : relevé des styles calculés dans la page (conventions R1 à R9, R3 bis, R5 bis, R11 bis).
 * La fonction `collectInPage` est sérialisée et exécutée par page.evaluate :
 * elle ne dépend de rien d'extérieur. Elle renvoie des chaînes brutes ;
 * la normalisation et l'agrégation se font côté Node (src/rendered/aggregate.js).
 */

/**
 * @typedef {object} RenderedRecord
 * @property {number} parent          indice du parent (-1 pour html) ; pour un pseudo-élément, son élément
 * @property {boolean} retained       élément retenu (R1) ou pseudo-élément retenu (R2)
 * @property {string} bg              background-color calculé
 * @property {boolean} bgImage        background-image différent de none
 * @property {string} opacity
 * @property {string} [tag]
 * @property {string} [pseudo]        '::before', '::after' ou '::placeholder'
 * @property {boolean} [textOnly]     pseudo-élément ::placeholder : propriétés typographiques seulement (R3 bis)
 * @property {boolean} [overlap]      porteur de texte dont le centre tombe sur un peintre hors de sa lignée (R11 bis)
 * @property {string} [selector]
 * @property {string} [role]
 * @property {boolean} [text]         porteur de texte (R3, R2)
 * @property {Record<string, string>} [props]
 */

/**
 * @typedef {object} PageCollection
 * @property {string} url
 * @property {RenderedRecord[]} records
 * @property {number} iframes
 * @property {number} excluded
 */

/* Exécutée dans la page : aucune référence extérieure. */
export function collectInPage() {
  const TEXT_PROPS = [
    'color',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'letter-spacing',
    'text-decoration-line',
    'text-decoration-color',
  ];
  const SIDES = ['top', 'right', 'bottom', 'left'];
  const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
  const BOX_PROPS = [
    ...SIDES.map((s) => `margin-${s}`),
    ...SIDES.map((s) => `padding-${s}`),
    ...SIDES.flatMap((s) => [`border-${s}-width`, `border-${s}-style`, `border-${s}-color`]),
    ...CORNERS.map((c) => `border-${c}-radius`),
    'display',
    'row-gap',
    'column-gap',
    'box-shadow',
    'background-color',
    'outline-style',
    'outline-width',
    'outline-color',
    'position',
    'transition-duration',
    'transition-timing-function',
    'animation-name',
    'animation-duration',
    'animation-timing-function',
  ];
  const META = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'LINK', 'META', 'TITLE', 'BASE']);
  const FIELD_ROLES = new Set(['textbox', 'combobox', 'checkbox', 'radio', 'switch', 'searchbox']);
  const SVG_SHAPES = new Set(['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'use']);
  const NO_TEXT_INPUT = new Set(['hidden', 'checkbox', 'radio', 'range', 'color', 'file', 'image']);
  const PAINTER_TAGS = new Set(['img', 'video', 'canvas', 'svg']);
  const body = document.body;
  /** @type {any[]} */
  const records = [];
  /** @type {Element[]} */
  const elements = [];
  let iframes = 0;
  let excluded = 0;

  /** @param {Element} el */
  const directText = (el) => {
    for (const n of el.childNodes) if (n.nodeType === 3 && (n.textContent ?? '').trim()) return true;
    return false;
  };
  /**
   * R3 bis : texte porté par un champ. `value` : le champ affiche une valeur ;
   * `placeholder` : il est vide et affiche son texte d'indice.
   * @param {Element} el
   * @returns {{ value: boolean, placeholder: boolean }}
   */
  const fieldText = (el) => {
    const t = el.tagName.toLowerCase();
    const anyEl = /** @type {any} */ (el);
    if (t === 'input' || t === 'textarea') {
      if (t === 'input' && NO_TEXT_INPUT.has((el.getAttribute('type') ?? 'text').toLowerCase())) return { value: false, placeholder: false };
      const value = String(anyEl.value ?? '') !== '';
      return { value, placeholder: !value && (el.getAttribute('placeholder') ?? '').trim() !== '' };
    }
    if (t === 'select') {
      const o = anyEl.selectedOptions?.[0];
      return { value: !!o && (o.textContent ?? '').trim() !== '', placeholder: false };
    }
    return { value: false, placeholder: false };
  };
  /** @param {Element} el @param {boolean} text */
  const roleOf = (el, text) => {
    const r = (el.getAttribute('role') ?? '').trim().toLowerCase().split(/\s+/)[0];
    if (r === 'button') return 'bouton';
    if (r === 'link') return 'lien';
    if (FIELD_ROLES.has(r)) return 'champ';
    if (r === 'heading') return 'titre';
    if (r === 'img') return 'image';
    const t = el.tagName.toLowerCase();
    if (t === 'button') return 'bouton';
    if (t === 'input') {
      const type = (el.getAttribute('type') ?? '').toLowerCase();
      return ['button', 'submit', 'reset'].includes(type) ? 'bouton' : 'champ';
    }
    if (t === 'a' && el.hasAttribute('href')) return 'lien';
    if (t === 'select' || t === 'textarea') return 'champ';
    if (/^h[1-6]$/.test(t)) return 'titre';
    if (['img', 'svg', 'picture', 'video', 'canvas'].includes(t)) return 'image';
    if (/** @type {any} */ (el).ownerSVGElement) return 'image';
    return text ? 'texte' : 'conteneur';
  };
  /** @param {Element} el */
  const selectorOf = (el) => {
    const t = el.tagName.toLowerCase();
    if (el.id) return `${t}#${el.id}`;
    const cls = [...el.classList].slice(0, 2);
    return cls.length ? `${t}.${cls.join('.')}` : t;
  };
  /**
   * @param {CSSStyleDeclaration} cs
   * @param {boolean} text
   * @param {Element | null} [el]  l'élément, pour fill et stroke des formes SVG ; null pour un pseudo-élément
   */
  const propsOf = (cs, text, el = null) => {
    /** @type {Record<string, string>} */
    const p = {};
    if (text) for (const k of TEXT_PROPS) p[k] = cs.getPropertyValue(k);
    for (const k of BOX_PROPS) p[k] = cs.getPropertyValue(k);
    p['opacity'] = cs.getPropertyValue('opacity');
    // R5 bis : dégradés (le texte complet n'est gardé que s'il contient un dégradé).
    const bi = cs.getPropertyValue('background-image');
    if (bi.includes('gradient(')) p['background-image'] = bi;
    if (el && SVG_SHAPES.has(el.tagName.toLowerCase()) && /** @type {any} */ (el).ownerSVGElement) {
      p['fill'] = cs.getPropertyValue('fill');
      p['stroke'] = cs.getPropertyValue('stroke');
    }
    return p;
  };

  /**
   * @param {Element} el
   * @param {number} parent
   * @param {boolean} inBody  el est un descendant de body
   */
  const visit = (el, parent, inBody) => {
    const idx = records.length;
    const cs = getComputedStyle(el);
    const tag = el.tagName.toUpperCase();
    if (tag === 'IFRAME' || tag === 'FRAME') iframes++;
    const visible = el.getClientRects().length > 0 && cs.visibility !== 'hidden';
    const retained = inBody && visible;
    if (inBody && !visible && !META.has(tag)) excluded++;
    /** @type {any} */
    const rec = { parent, retained, bg: cs.backgroundColor, bgImage: cs.backgroundImage !== 'none', opacity: cs.opacity };
    const field = retained ? fieldText(el) : { value: false, placeholder: false };
    if (retained) {
      const text = directText(el) || field.value;
      rec.tag = el.tagName.toLowerCase();
      rec.selector = selectorOf(el);
      rec.role = roleOf(el, text);
      rec.text = text;
      rec.props = propsOf(cs, text, el);
    }
    records.push(rec);
    elements.push(el);
    if (retained && field.placeholder) {
      // R3 bis : le texte d'indice est porté par ::placeholder ; typographie et fond seulement.
      const ps = getComputedStyle(el, '::placeholder');
      /** @type {Record<string, string>} */
      const props = {};
      for (const k of TEXT_PROPS) props[k] = ps.getPropertyValue(k);
      props['background-color'] = ps.getPropertyValue('background-color');
      props['opacity'] = ps.getPropertyValue('opacity');
      records.push({
        parent: idx,
        retained: true,
        bg: ps.backgroundColor,
        bgImage: ps.backgroundImage !== 'none',
        opacity: ps.opacity,
        tag: rec.tag,
        pseudo: '::placeholder',
        textOnly: true,
        selector: rec.selector + '::placeholder',
        role: rec.role,
        text: true,
        props,
      });
      elements.push(el);
    }
    if (retained) {
      for (const pseudo of ['::before', '::after']) {
        const ps = getComputedStyle(el, pseudo);
        const content = ps.content;
        if (!content || content === 'none' || content === 'normal' || ps.display === 'none' || ps.visibility === 'hidden') continue;
        const text = [...content.matchAll(/"((?:[^"\\]|\\.)*)"/g)].some((m) => m[1].trim() !== '');
        records.push({
          parent: idx,
          retained: true,
          bg: ps.backgroundColor,
          bgImage: ps.backgroundImage !== 'none',
          opacity: ps.opacity,
          tag: rec.tag,
          pseudo,
          selector: rec.selector + pseudo,
          role: rec.role,
          text,
          props: propsOf(ps, text),
        });
        elements.push(el);
      }
    }
    if (tag === 'HEAD') return;
    const childInBody = inBody || el === body;
    for (const child of el.children) visit(child, idx, childInBody);
    if (el.shadowRoot) for (const child of el.shadowRoot.children) visit(child, idx, childInBody);
  };

  visit(document.documentElement, -1, false);

  // R11 bis : porteurs de texte dont le centre tombe sur un peintre hors de leur lignée.
  /** @type {{ el: Element, rect: DOMRect }[]} */
  const painters = [];
  records.forEach((r, i) => {
    if (!r.retained || r.pseudo) return;
    const pos = r.props.position;
    const painted = (pos === 'absolute' || pos === 'fixed') && (r.bgImage || !/^(rgba\(0, 0, 0, 0\)|transparent)$/.test(r.bg));
    if (!PAINTER_TAGS.has(r.tag) && !painted) return;
    const rect = elements[i].getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) painters.push({ el: elements[i], rect });
  });
  if (painters.length) {
    records.forEach((r, i) => {
      if (!r.retained || !r.text) return;
      const el = elements[i];
      const rect = el.getBoundingClientRect();
      if (!(rect.width > 0 && rect.height > 0)) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (
        painters.some(
          (p) => p.el !== el && !p.el.contains(el) && !el.contains(p.el) && cx >= p.rect.left && cx <= p.rect.right && cy >= p.rect.top && cy <= p.rect.bottom,
        )
      )
        r.overlap = true;
    });
  }

  // Gardés pour --trace-rendered et pour les états (R15) : élément de chaque relevé, par indice,
  // et lecture des propriétés d'un élément dans son état courant.
  Object.defineProperty(window, '__dsAuditElements', { value: elements, configurable: true });
  Object.defineProperty(window, '__dsAuditProps', {
    value: (/** @type {number} */ i, /** @type {boolean} */ text) => propsOf(getComputedStyle(elements[i]), text, elements[i]),
    configurable: true,
  });
  return { url: location.href, records, iframes, excluded };
}

/**
 * @param {import('playwright-core').Page} page
 * @returns {Promise<PageCollection>}
 */
export async function collectRendered(page) {
  return /** @type {PageCollection} */ (await page.evaluate(collectInPage));
}
