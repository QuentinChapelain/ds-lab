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
 * @property {string} [label]        lot R : texte visible de l'élément (libellé d'un champ, titre d'un bloc), 31 caractères au plus (R-1)
 * @property {{ n: number, items: { role: string, tag: string, label: string, display: string, bg: string }[] }} [gapChildren]
 *   lot R : conteneur flex ou grid, ses enfants visibles et les deux premiers (titre d'une gouttière, R-1)
 * @property {boolean} [text]         porteur de texte (R3, R2)
 * @property {Record<string, string>} [props]
 * @property {[number, number]} [box]       largeur et hauteur de la boîte (lot B, pilule R7)
 * @property {string[]} [autoMargins]     côtés dont la marge est auto (lot B, R7)
 * @property {{ neighbor: string }} [proseLink]  lien sans soulignement dans du texte courant, couleur du texte voisin (lot M)
 * @property {Record<string, { scope: string, signal: string | null, detail?: string, neighbor: string | null, visiblePx: number | null, role?: string, neighborRole?: string }>} [margins]
 *   lot P : par côté de marge non nulle, relation avec le voisin de ce côté (« dans le composant »,
 *   « entre composants », ou « inconnue » sans élément voisin), signal, voisin et espace visible
 */

/**
 * @typedef {object} PageCollection
 * @property {string} url
 * @property {RenderedRecord[]} records
 * @property {number} iframes
 * @property {number} excluded
 * @property {{ elements: number, selectors: Record<string, number>, invalid: string[] }} [thirdParty]  éléments tiers écartés (R17)
 * @property {Proximity[]} [proximity]  lot P (P3) : paires contrôlées, espace dans le composant face à l'espace entre composants
 * @property {{ message: string, field: string }[]} [messages]  lot P, étape 3 : messages non reliés à leur champ par aria-describedby
 */
/**
 * @typedef {{ scope: string, gapPx: number, mode: 'max' | 'sum', extra: number, parts: string[] }} Space
 *   mode : marges fusionnées (la plus grande) ou additionnées ; extra : reste mesuré (gouttière) ; parts : marges non nulles
 * @typedef {{ elements: string[], roles?: string[], facing?: number, toward?: string, in: Space, out: Space }} Proximity
 *   roles : rôle de chaque élément ; facing : élément de la paire (0 ou 1) qui fait face au voisin ; toward : voisin suivant ou précédent
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
  /**
   * Lot R (R-1) : texte visible d'un bloc, un espace entre deux éléments (« Filtre du jour Nouveau »),
   * un saut de ligne autour d'un élément qui n'est pas en ligne et à chaque br.
   * @param {Element} root
   */
  const spacedText = (root) => {
    let out = '';
    /** @type {Element | null} */
    let last = null;
    /** @param {Node} node */
    const walk = (node) => {
      for (const n of node.childNodes) {
        if (out.length > 400) return;
        if (n.nodeType === 3) {
          const t = (n.textContent ?? '').replace(/\s+/g, ' ');
          if (!t.trim()) continue;
          if (last && last !== n.parentElement) out += ' ';
          out += t;
          last = n.parentElement;
        } else if (n.nodeType === 1) {
          const e = /** @type {Element} */ (n);
          if (META.has(e.tagName)) continue;
          const ecs = getComputedStyle(e);
          if (ecs.display === 'none' || ecs.visibility === 'hidden') continue;
          if (e.tagName === 'BR') {
            out += '\n';
            last = null;
            continue;
          }
          const block = !ecs.display.startsWith('inline') && ecs.display !== 'contents';
          if (block) out += '\n';
          walk(e);
          if (block) out += '\n';
          if (block) last = null;
        }
      }
    };
    walk(root);
    return out;
  };
  /**
   * Lot R (R-1) : texte visible d'un élément, espaces resserrés, coupé à 31 caractères
   * (le titre le coupe à 30 et sait ainsi qu'il a coupé). Un champ donne son libellé
   * (label associé, puis aria-label, puis texte d'indice), jamais sa valeur saisie ;
   * un bloc, son premier titre visible (h1 à h6), sinon la première ligne de son texte.
   * @param {Element} el @param {string} role  rôle donné par roleOf
   */
  const labelOf = (el, role) => {
    const anyEl = /** @type {any} */ (el);
    const clean = (/** @type {any} */ s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    let s = '';
    if (role === 'champ') {
      const labels = [...(anyEl.labels ?? [])].map((/** @type {any} */ l) => clean(l.innerText)).filter(Boolean);
      s = labels[0] || clean(el.getAttribute('aria-label')) || clean(el.getAttribute('placeholder'));
    } else if (role === 'conteneur') {
      const h = [...el.querySelectorAll('h1, h2, h3, h4, h5, h6')].find((x) => x.getClientRects().length > 0);
      const heading = h ? clean(spacedText(h)) : '';
      s = heading || (spacedText(el).split('\n').map(clean).find(Boolean) ?? '');
    } else s = clean(anyEl.innerText ?? el.textContent);
    return s.slice(0, 31);
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
      rec.label = labelOf(el, rec.role);
      if (/\b(flex|grid)\b/.test(cs.display)) {
        const kids = [...el.children].filter((c) => !META.has(c.tagName) && c.getClientRects().length > 0);
        if (kids.length >= 2)
          rec.gapChildren = {
            n: kids.length,
            items: kids.slice(0, 2).map((c) => {
              const role = roleOf(c, directText(c) || fieldText(c).value);
              const ccs = getComputedStyle(c);
              return { role, tag: c.tagName.toLowerCase(), label: labelOf(c, role), display: ccs.display, bg: ccs.backgroundColor };
            }),
          };
      }
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
        label: rec.label,
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
          label: rec.label,
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

  // Lot P : relation de chaque marge avec le voisin de son côté (P1, P2), et paires contrôlées (P3).
  // Règles réécrites dans scanInPage (src/browser/simulate.js), la fonction étant sérialisée dans la page.
  const IN = 'dans le composant';
  const OUT = 'entre composants';
  const CTRL = 'input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([type=image]),select,textarea';
  const HEADINGS = 'h1,h2,h3,h4,h5,h6,[role=heading]';
  const NOT_TEXT = `${HEADINGS},label,button,a[href],${CTRL}`;
  const OPP = /** @type {Record<string, string>} */ ({ top: 'bottom', bottom: 'top', left: 'right', right: 'left' });
  /** @param {Element} e */
  const hasCtrl = (e) => e.matches(CTRL) || !!e.querySelector(CTRL);
  /** @param {Element} e */
  const isText = (e) => !e.matches(NOT_TEXT) && !e.querySelector(NOT_TEXT) && (e.textContent ?? '').trim() !== '';
  /** @param {Element} e */
  const inFlow = (e) => !META.has(e.tagName) && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden' && !/^(absolute|fixed)$/.test(getComputedStyle(e).position);
  /**
   * Voisin du côté demandé : frère en flux, entièrement de ce côté, le plus proche ; à égalité, le plus centré.
   * @param {Element} e @param {string} side
   */
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
    return best ? { el: best, gap: Math.round(key[0] * 100) / 100 } : null;
  };
  /** @param {Element} a @param {Element} b @param {string} attr  a, ou un descendant, pointe b ou un de ses descendants */
  const points = (a, b, attr) =>
    [a, ...a.querySelectorAll(`[${attr}]`)].some((x) =>
      (x.getAttribute(attr) ?? '').split(/\s+/).some((id) => {
        const t = id ? document.getElementById(id) : null;
        return !!t && (t === b || b.contains(t));
      }),
    );
  // Étape 3 : un enfant qui est (et non seulement qui contient) un bouton, un lien ou une liste écarte le conteneur.
  const BLOCKERS = 'button,a[href],ul,ol,table,section,article,nav,form,fieldset';
  /** Conteneur de champ : un seul contrôle, aucun titre, rien d'autre que libellé, contrôle et texte. @param {Element | null} p */
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
  /** Contrôle dont le texte t est le message, d'après la position : précédé du contrôle, sans titre ni contrôle entre. @param {Element} t */
  const fieldOf = (t) => {
    for (let x = t.previousElementSibling; x; x = x.previousElementSibling) {
      if (!inFlow(x)) continue;
      // Lot P-fin : un texte sous le contrôle seulement, jamais à gauche ni à droite.
      if (x.matches(CTRL)) return t.getBoundingClientRect().top >= x.getBoundingClientRect().bottom - 0.5 ? x : null;
      if (!isText(x)) return null;
    }
    return null;
  };
  /**
   * P2 : relation entre deux frères voisins, signaux dans l'ordre.
   * @param {Element} a @param {Element} b
   * @returns {{ scope: string, signal: string | null, detail?: string }}
   */
  const relationOf = (a, b) => {
    if (points(a, b, 'for') || points(b, a, 'for')) return { scope: IN, signal: 'relié', detail: 'relié par for' };
    if (points(a, b, 'aria-describedby') || points(b, a, 'aria-describedby')) return { scope: IN, signal: 'relié', detail: 'relié par aria-describedby' };
    if (fieldBox(a.parentElement)) {
      const [c, o] = hasCtrl(a) ? [a, b] : [b, a];
      if (hasCtrl(c) && !hasCtrl(o) && !o.matches(HEADINGS)) return { scope: IN, signal: 'même conteneur de champ' };
    }
    const fa = isText(a) ? fieldOf(a) : null;
    const fb = isText(b) ? fieldOf(b) : null;
    if ((fa && (fa === b || fa === fb)) || (fb && fb === a)) return { scope: IN, signal: 'déduit de la position' };
    return { scope: OUT, signal: null };
  };
  /** Contrôle dont le texte t est le message : position, même conteneur de champ, ou aria-describedby. @param {Element} t */
  const controlOfMessage = (t) => {
    if (!isText(t)) return null;
    const byPos = fieldOf(t);
    if (byPos) return byPos;
    const p = t.parentElement;
    if (fieldBox(p) && !hasCtrl(t)) return /** @type {Element} */ (p).querySelector(CTRL);
    return null;
  };
  /** @param {Element} t */
  const describedBy = (t) => !!t.id && !!document.querySelector(`[aria-describedby~="${CSS.escape(t.id)}"]`);
  /**
   * Étape 3 : rôle d'un élément pour dire la relation en clair : libellé, champ (contrôle ou
   * conteneur de champ), titre, message (texte rattaché à un contrôle), bloc sinon.
   * @param {Element} e
   */
  const placeOf = (e) =>
    e.matches('label') ? 'libellé'
    : e.matches(CTRL) || fieldBox(e) ? 'champ'
    : e.matches(HEADINGS) ? 'titre'
    : isText(e) && (controlOfMessage(e) || describedBy(e)) ? 'message'
    : 'bloc';
  /** @type {Map<Element, number>} */
  const indexOf = new Map();
  records.forEach((r, i) => {
    if (r.retained && !r.pseudo) indexOf.set(elements[i], i);
  });
  /** @param {Element} e @param {string} side */
  const marginOf = (e, side) => parseFloat(getComputedStyle(e).getPropertyValue(`margin-${side}`)) || 0;
  /** @type {[Element, Element, string, number][]} paires dans le composant : a, b, côté de a vers b, espace visible */
  const inside = [];
  const seenPairs = new Set();
  records.forEach((r, i) => {
    if (!r.retained || r.pseudo || !r.props) return;
    const el = elements[i];
    for (const side of SIDES) {
      if (!marginOf(el, side)) continue;
      const nb = nearOf(el, side);
      if (!nb) {
        (r.margins ??= {})[side] = { scope: 'inconnue', signal: null, neighbor: null, visiblePx: null, role: placeOf(el) };
        continue;
      }
      // Lot P-fin : un texte entre l'élément et son voisin rend la relation inconnue (aucun contrôle).
      if (textBetween(el, nb.el)) {
        (r.margins ??= {})[side] = { scope: 'inconnue', signal: null, detail: 'texte entre l’élément et son voisin', neighbor: null, visiblePx: null, role: placeOf(el) };
        continue;
      }
      const rel = relationOf(el, nb.el);
      (r.margins ??= {})[side] = { ...rel, neighbor: selectorOf(nb.el), visiblePx: nb.gap, role: placeOf(el), neighborRole: placeOf(nb.el) };
      if (rel.scope !== IN) continue;
      const id = [indexOf.get(el), indexOf.get(nb.el)].sort().join(':');
      if (seenPairs.has(id)) continue;
      seenPairs.add(id);
      inside.push([el, nb.el, side, nb.gap]);
    }
  });
  /**
   * Espace entre deux voisins, d'après leurs marges : fusionnées (la plus grande) ou additionnées
   * (flex, grille), plus le reste mesuré (gouttière). @param {Element} a @param {Element} b @param {string} side @param {number} gap
   */
  const spaceOf = (a, b, side, gap) => {
    const ma = marginOf(a, side);
    const mb = marginOf(b, OPP[side]);
    const mode = Math.abs(gap - Math.max(ma, mb)) < 0.5 ? 'max' : 'sum';
    const extra = Math.round((gap - (mode === 'max' ? Math.max(ma, mb) : ma + mb)) * 100) / 100;
    const parts = [ma ? getComputedStyle(a).getPropertyValue(`margin-${side}`) : null, mb ? getComputedStyle(b).getPropertyValue(`margin-${OPP[side]}`) : null].filter(Boolean);
    return { gapPx: gap, mode, extra, parts: /** @type {string[]} */ (parts) };
  };
  /** P3 : chaque élément d'une paire dans le composant, face au composant voisin de son autre côté. @type {any[]} */
  const proximity = [];
  for (const [a, b, side, gap] of inside) {
    for (const [z, away] of [
      [a, OPP[side]],
      [b, side],
    ]) {
      const y = nearOf(/** @type {Element} */ (z), /** @type {string} */ (away));
      if (!y || textBetween(/** @type {Element} */ (z), y.el) || relationOf(/** @type {Element} */ (z), y.el).scope !== OUT) continue;
      proximity.push({
        elements: [selectorOf(a), selectorOf(b), selectorOf(y.el)],
        // Étape 3 : rôles, élément de la paire qui fait face au voisin, et sens (suivant, précédent).
        roles: [placeOf(a), placeOf(b), placeOf(y.el)],
        facing: z === a ? 0 : 1,
        toward: away === 'bottom' || away === 'right' ? 'suivant' : 'précédent',
        in: { scope: IN, ...spaceOf(a, b, side, gap) },
        out: { scope: OUT, ...spaceOf(/** @type {Element} */ (z), y.el, /** @type {string} */ (away), y.gap) },
      });
    }
  }

  // Étape 3 : messages rattachés à leur champ par la seule position ou le conteneur, sans aria-describedby.
  /** @type {{ message: string, field: string }[]} */
  const messages = [];
  records.forEach((r, i) => {
    if (!r.retained || r.pseudo) return;
    const t = elements[i];
    const c = controlOfMessage(t);
    if (!c || points(c, t, 'aria-describedby') || textBetween(c, t)) return;
    messages.push({ message: selectorOf(t), field: selectorOf(c) });
  });

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
  return { url: location.href, records, iframes, excluded, thirdParty, proximity, messages };
}

/**
 * @param {import('playwright-core').Page} page
 * @param {{ thirdParty?: string[] }} [opts]
 * @returns {Promise<PageCollection>}
 */
export async function collectRendered(page, { thirdParty = [] } = {}) {
  return /** @type {PageCollection} */ (await page.evaluate(collectInPage, thirdParty));
}
