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
 * @property {boolean} [imageBox]     boîte d'image : son fond est du contenu, pas de l'interface (R18)
 * @property {boolean} [icon]         pseudo-élément dont le content est un glyphe de police d'icônes (R11 ter)
 * @property {boolean} [overlap]      porteur de texte dont le centre tombe sur un peintre hors de sa lignée (R11 bis)
 * @property {string} [selector]
 * @property {string} [role]
 * @property {boolean} [text]         porteur de texte (R3, R2)
 * @property {Record<string, string>} [props]
 * @property {[number, number]} [box]       largeur et hauteur de la boîte (lot B, pilule R7)
 * @property {string[]} [autoMargins]     côtés dont la marge est auto (lot B, R7)
 * @property {{ neighbor: string }} [proseLink]  lien sans soulignement dans du texte courant, couleur du texte voisin (lot M)
 */

/**
 * @typedef {object} PageCollection
 * @property {string} url
 * @property {RenderedRecord[]} records
 * @property {number} iframes
 * @property {number} excluded
 * @property {{ elements: number, selectors: Record<string, number>, invalid: string[] }} [thirdParty]  éléments tiers écartés (R17)
 */

/**
 * Exécutée dans la page : aucune référence extérieure.
 * @param {string[]} [thirdSelectors]  sélecteurs CSS des composants tiers à écarter (R17)
 */
export function collectInPage(thirdSelectors = []) {
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
  const MEDIA_TAGS = new Set(['IMG', 'PICTURE', 'VIDEO', 'CANVAS']);
  const body = document.body;
  /** @type {any[]} */
  const records = [];
  /** @type {Element[]} */
  const elements = [];
  let iframes = 0;
  let excluded = 0;
  const thirdParty = { elements: 0, selectors: /** @type {Record<string, number>} */ ({}), invalid: /** @type {string[]} */ ([]) };
  /** @type {string[]} */
  const validThird = [];
  for (const sel of thirdSelectors) {
    try {
      document.querySelector(sel);
      validThird.push(sel);
    } catch {
      thirdParty.invalid.push(sel);
    }
  }
  /** @param {Element} el */
  const isThird = (el) => validThird.some((sel) => el.matches(sel));
  /** R11 ter : chaînes d'un content, toutes en zone à usage privé. @param {string} content */
  const iconGlyph = (content) => {
    const chars = [...[...content.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]).join('').replace(/\s/g, '')];
    return chars.length > 0 && chars.every((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      return (c >= 0xe000 && c <= 0xf8ff) || c >= 0xf0000;
    });
  };
  /**
   * Pseudo-élément ::before ou ::after tel qu'il est peint, ou null (R2, R1 bis).
   * @param {Element} el @param {string} pseudo
   */
  const pseudoOf = (el, pseudo) => {
    const ps = getComputedStyle(el, pseudo);
    const content = ps.content;
    if (!content || content === 'none' || content === 'normal' || ps.display === 'none' || ps.visibility === 'hidden') return null;
    const text = [...content.matchAll(/"((?:[^"\\]|\\.)*)"/g)].some((m) => m[1].trim() !== '');
    return { ps, text, icon: text && iconGlyph(content), opacity: parseFloat(ps.opacity) };
  };

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
  /**
   * R7 (lot B) : côtés dont la marge est « auto ». Le rendu ne donne que des pixels :
   * on élargit (puis on allonge) l'élément de 2 px par un style en ligne, et un côté
   * dont la marge diminue est auto. Le style d'origine est rétabli aussitôt.
   * @param {Element} el @param {CSSStyleDeclaration} cs
   * @returns {string[]}
   */
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
  /**
   * Lot M : lien sans soulignement posé dans du texte courant. Renvoie la couleur
   * du texte voisin (celle du parent), ou null. Texte courant : le bloc qui porte
   * le lien (premier ancêtre non inline, ni flex ni grid) contient du texte hors lien.
   * @param {Element} el @param {CSSStyleDeclaration} cs
   */
  const proseLink = (el, cs) => {
    if (el.tagName !== 'A' || !el.hasAttribute('href')) return null;
    if (/underline/.test(cs.textDecorationLine)) return null;
    if (cs.borderBottomStyle !== 'none' && parseFloat(cs.borderBottomWidth) > 0) return null;
    let block = el.parentElement;
    while (block && getComputedStyle(block).display.startsWith('inline')) block = block.parentElement;
    if (!block || /\b(flex|grid)\b/.test(getComputedStyle(block).display)) return null;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if ((n.textContent ?? '').trim() && !n.parentElement?.closest('a')) return getComputedStyle(/** @type {Element} */ (el.parentElement)).color;
    }
    return null;
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
      // R18 : une forme en currentColor suit la couleur du texte (icône d'interface).
      p['svg-color'] = cs.getPropertyValue('color');
    }
    return p;
  };

  /**
   * @param {Element} el
   * @param {number} parent
   * @param {boolean} inBody  el est un descendant de body
   * @param {boolean} faded   un ancêtre a une opacity de 0 (R1 bis)
   * @param {boolean} third   un ancêtre est un composant tiers (R17)
   */
  const visit = (el, parent, inBody, faded, third) => {
    const idx = records.length;
    const cs = getComputedStyle(el);
    const tag = el.tagName.toUpperCase();
    if (tag === 'IFRAME' || tag === 'FRAME') iframes++;
    const isFaded = faded || parseFloat(cs.opacity) === 0;
    const isThirdParty = third || (inBody && isThird(el));
    const visible = el.getClientRects().length > 0 && cs.visibility !== 'hidden' && !isFaded;
    const retained = inBody && visible && !isThirdParty;
    if (inBody && !visible && !META.has(tag)) excluded++;
    if (inBody && visible && isThirdParty) {
      thirdParty.elements++;
      const sel = selectorOf(el);
      thirdParty.selectors[sel] = (thirdParty.selectors[sel] ?? 0) + 1;
    }
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
      // Lot B : dimensions de la boîte (pilule, R7) et côtés en marge auto (R7).
      const box = el.getBoundingClientRect();
      rec.box = [Math.round(box.width * 100) / 100, Math.round(box.height * 100) / 100];
      const auto = autoSidesOf(el, cs);
      if (auto.length) rec.autoMargins = auto;
      const neighbor = proseLink(el, cs);
      if (neighbor) rec.proseLink = { neighbor };
      // R18 : boîte d'image = fond d'attente d'un média, sans texte propre.
      if (!text) {
        const isMedia = (/** @type {Element} */ c) =>
          MEDIA_TAGS.has(c.tagName) || getComputedStyle(c).backgroundImage.includes('url(');
        if (cs.backgroundImage.includes('url(') || (el.children.length > 0 && [...el.children].every(isMedia))) rec.imageBox = true;
      }
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
        const found = pseudoOf(el, pseudo);
        if (!found || found.opacity === 0) continue;
        const { ps, text } = found;
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
          icon: found.icon,
          props: propsOf(ps, text),
        });
        elements.push(el);
      }
    }
    if (tag === 'HEAD') return;
    const childInBody = inBody || el === body;
    for (const child of el.children) visit(child, idx, childInBody, isFaded, isThirdParty);
    if (el.shadowRoot) for (const child of el.shadowRoot.children) visit(child, idx, childInBody, isFaded, isThirdParty);
  };

  visit(document.documentElement, -1, false, false, false);

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
    value: (/** @type {number} */ i, /** @type {boolean} */ text) => {
      /** @type {Record<string, { props: Record<string, string>, text: boolean, opacity: number }>} */
      const pseudo = {};
      for (const name of ['::before', '::after']) {
        const found = pseudoOf(elements[i], name);
        if (found) pseudo[name] = { props: propsOf(found.ps, found.text), text: found.text, opacity: found.opacity };
      }
      return { el: propsOf(getComputedStyle(elements[i]), text, elements[i]), pseudo };
    },
    configurable: true,
  });
  return { url: location.href, records, iframes, excluded, thirdParty };
}

/**
 * @param {import('playwright-core').Page} page
 * @param {{ thirdParty?: string[] }} [opts]
 * @returns {Promise<PageCollection>}
 */
export async function collectRendered(page, { thirdParty = [] } = {}) {
  return /** @type {PageCollection} */ (await page.evaluate(collectInPage, thirdParty));
}
