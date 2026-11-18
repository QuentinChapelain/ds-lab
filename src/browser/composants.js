// @ts-check
/**
 * Relevé des pièces d'interface d'une page chargée, au repos (D46). Trois temps, dans le même chargement :
 *   1. l'arbre d'accessibilité du navigateur, par le protocole DevTools (Accessibility.getFullAXTree) : pour chaque
 *      nœud d'un rôle relevé, son rôle calculé, son nom calculé et s'il est focalisable, posés sur l'élément du DOM ;
 *   2. la suite de la touche Tab depuis le haut de la page, jusqu'au retour sur un élément déjà atteint ou sur le body,
 *      au plus une fois par élément focalisable, plus une ;
 *   3. le relevé, exécuté dans la page (`releverDansLaPage`, sérialisée : elle ne dépend de rien d'extérieur) : les
 *      éléments d'un rôle relevé, les pièces sans rôle d'une signature qui donne un type, et les blocs (une classe et
 *      une surface visible) hors de toute pièce.
 * Les éléments à capturer restent dans la page (`window.__dsCibles`) : `capturer` les photographie à la demande.
 * Rien n'est écrit dans le site : les marques posées le sont dans le navigateur de l'outil.
 */

/** Rôles calculés relevés (noms de l'arbre d'accessibilité de Chromium). */
const ROLES = ['button', 'link', 'textbox', 'searchbox', 'combobox', 'listbox', 'checkbox', 'radio', 'switch', 'tab', 'menu', 'menubar', 'dialog', 'alertdialog'];

/**
 * @typedef {{ selecteur: string, nom: string, type?: string, boite?: string, framework: string }} Piece
 *   une signature d'une table, avec le nom de son framework ; boite : l'élément intérieur qui porte le cadre visible de la
 *   pièce, mesuré à sa place (D47)
 * @typedef {{ hauteur: number, rayons: number[], bordures: number[], marges: number[], taille: number, graisse: number }} Mesures
 *   marges : marge intérieure, haut, droite, bas, gauche ; rayons : haut-gauche, haut-droite, bas-droite, bas-gauche
 * @typedef {object} Releve
 * @property {'role' | 'type' | 'bloc'} sorte    élément d'un rôle relevé, pièce sans rôle d'une signature, ou bloc
 * @property {number} index                    rang dans le relevé de la page, et dans window.__dsCibles
 * @property {string} [role]                   rôle calculé
 * @property {string} [nom]                    nom calculé
 * @property {boolean} [texte]                 texte visible (hors glyphe d'icône)
 * @property {boolean} [clavier]               atteint au clavier : suite de Tab, ou membre focalisable d'un groupe atteint
 * @property {[number, number]} [zone]         zone de clic : la plus grande boîte, l'élément ou son label
 * @property {{ nom: string, type?: string, framework: string } | null} [piece]  signature trouvée
 * @property {string} balise
 * @property {string[]} classes                classes de la pièce (racine de la signature, sinon l'élément)
 * @property {Mesures} mesures                 mesures de la pièce, ou de sa boîte intérieure si la signature en nomme une
 * @property {string} chemin                   chemin depuis le body, balise, première classe et rang parmi ses pareils
 * @property {string} selecteur                sélecteur court
 * @property {string} endroit                  repère de la page et titre qui précède
 * @property {string} extrait                  HTML de la pièce, enfants repliés, 200 caractères au plus
 * @property {number[]} [ancetres]             bloc : rangs des blocs qui le contiennent
 */

/**
 * Exécutée dans la page : aucune référence extérieure.
 * @param {{ pieces: Piece[], roles: string[] }} arg
 * @returns {Releve[]}
 */
function releverDansLaPage({ pieces, roles }) {
  const w = /** @type {any} */ (window);
  /** @type {Map<Element, { role: string, nom: string, focalisable: boolean }>} */
  const ax = w.__dsAx ?? new Map();
  /** @type {Set<Element>} */
  const tab = w.__dsTabVu ?? new Set();
  const ROLES = new Set(roles);
  const GROUPES = '[role="tablist"], [role="menu"], [role="menubar"], [role="radiogroup"], [role="listbox"], [role="tree"], [role="grid"]';
  const REPERES = /** @type {Record<string, string>} */ ({ HEADER: 'en-tête', NAV: 'navigation', MAIN: 'contenu', FOOTER: 'pied de page', ASIDE: 'à côté' });
  const body = document.body;
  const r2 = (/** @type {number} */ n) => Math.round(n * 100) / 100;
  const px = (/** @type {string} */ v) => r2(parseFloat(v) || 0);
  /** @param {Element} el @param {string} sel */
  const correspond = (el, sel) => {
    try {
      return el.matches(sel);
    } catch {
      return false;
    }
  };
  /** @param {Element} el */
  const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  /** Texte visible, sans les glyphes d'icône (zone à usage privé). @param {Element} el */
  const texteVisible = (el) => {
    const t = el.tagName;
    if (t === 'INPUT') {
      const type = (el.getAttribute('type') ?? '').toLowerCase();
      if (['button', 'submit', 'reset'].includes(type)) return String(/** @type {any} */ (el).value ?? '').trim() !== '';
    }
    const s = String(/** @type {any} */ (el).innerText ?? '').replace(/[-\s]/gu, '').replace(/[\u{f0000}-\u{10ffff}]/gu, '');
    return s !== '';
  };
  /** @param {Element} el @returns {import('./composants.js').Mesures} */
  const mesures = (el) => {
    const cs = getComputedStyle(el);
    const cotes = ['top', 'right', 'bottom', 'left'];
    const b = el.getBoundingClientRect();
    // Un rayon en pourcentage (50 %) est converti en px depuis la boîte : le plus petit des deux côtés, celui qui se voit.
    const rayon = (/** @type {string} */ v) => (v.trim().endsWith('%') ? r2((parseFloat(v) / 100) * Math.min(b.width, b.height)) : px(v));
    return {
      hauteur: r2(b.height),
      rayons: ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map((c) => rayon(cs.getPropertyValue(`border-${c}-radius`))),
      bordures: cotes.map((c) => (/^(none|hidden)$/.test(cs.getPropertyValue(`border-${c}-style`)) ? 0 : px(cs.getPropertyValue(`border-${c}-width`)))),
      marges: cotes.map((c) => px(cs.getPropertyValue(`padding-${c}`))),
      taille: px(cs.fontSize),
      graisse: Number(cs.fontWeight) || 400,
    };
  };
  /** Fond, bordure, ombre ou rayon non nuls. @param {Element} el */
  const surface = (el) => {
    const cs = getComputedStyle(el);
    if (!/^(rgba\(0, 0, 0, 0\)|transparent)$/.test(cs.backgroundColor) || cs.backgroundImage !== 'none') return true;
    if (cs.boxShadow !== 'none') return true;
    for (const c of ['top', 'right', 'bottom', 'left'])
      if (!/^(none|hidden)$/.test(cs.getPropertyValue(`border-${c}-style`)) && parseFloat(cs.getPropertyValue(`border-${c}-width`)) > 0) return true;
    return ['top-left', 'top-right', 'bottom-right', 'bottom-left'].some((c) => parseFloat(cs.getPropertyValue(`border-${c}-radius`)) > 0);
  };
  /** @param {Element} el */
  const court = (el) => {
    const t = el.tagName.toLowerCase();
    if (el.id) return `${t}#${el.id}`;
    const c = [...el.classList].slice(0, 2);
    return c.length ? `${t}.${c.join('.')}` : t;
  };
  /** Depuis le body : balise, première classe, rang parmi les frères de même balise. @param {Element} el */
  const chemin = (el) => {
    /** @type {string[]} */
    const parts = [];
    for (let x = /** @type {Element | null} */ (el); x && x !== body; x = x.parentElement) {
      const p = x.parentElement;
      const rang = p ? [...p.children].filter((c) => c.tagName === x?.tagName).indexOf(x) + 1 : 1;
      const c = x.classList[0];
      parts.unshift(`${x.tagName.toLowerCase()}${c ? `.${c}` : ''}:${rang}`);
    }
    return parts.join('>');
  };
  /** @param {Element} el */
  const selecteur = (el) => {
    let p = el.parentElement;
    while (p && p !== body && !p.id && !p.classList.length) p = p.parentElement;
    return p && p !== body ? `${court(p)} ${court(el)}` : court(el);
  };
  const titres = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(visible);
  /** Repère le plus extérieur, puis le dernier titre qui précède l'élément. @param {Element} el */
  const endroit = (el) => {
    let repere = '';
    for (let x = el.parentElement; x && x !== body; x = x.parentElement) if (REPERES[x.tagName]) repere = REPERES[x.tagName];
    // Un titre qui précède l'élément dans un de ses ancêtres : pas celui d'une carte voisine.
    const avant = titres.filter((h) => h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING && !h.contains(el) && h.parentElement?.contains(el)).pop();
    const titre = avant ? String(/** @type {any} */ (avant).innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 40) : '';
    return [repere, titre].filter(Boolean).join(' › ');
  };
  /** Balise ouvrante, texte court ou « … », balise fermante ; 200 caractères au plus. @param {Element} el */
  const extrait = (el) => {
    const nu = /** @type {Element} */ (el.cloneNode(false)).outerHTML;
    const fin = `</${el.tagName.toLowerCase()}>`;
    const ouvre = nu.endsWith(fin) ? nu.slice(0, -fin.length) : nu;
    const vide = /^(input|img|br|hr|meta|link|source|area|col|embed|wbr)$/i.test(el.tagName);
    const texte = String(/** @type {any} */ (el).innerText ?? '').replace(/\s+/g, ' ').trim();
    const dedans = vide ? '' : el.children.length ? '…' : texte.length > 40 ? `${texte.slice(0, 40)}…` : texte;
    const s = vide ? ouvre : `${ouvre}${dedans}${fin}`;
    return s.length > 200 ? `${s.slice(0, 199)}…` : s;
  };
  /** @param {Element} el */
  const typee = (el) => pieces.find((p) => p.type && correspond(el, p.selecteur));

  const tous = [...body.querySelectorAll('*')];
  const aRole = tous.filter((el) => ax.has(el) && ROLES.has(/** @type {any} */ (ax.get(el)).role) && visible(el));
  // Limite d'une pièce : le premier ancêtre qui contient un autre élément d'un rôle relevé, ou une pièce sans rôle.
  /** @type {Map<Element, number>} */
  const compte = new Map();
  for (const el of aRole) for (let a = el.parentElement; a && a !== body; a = a.parentElement) compte.set(a, (compte.get(a) ?? 0) + 1);
  /** @type {Releve[]} */
  const out = [];
  /** @type {Element[]} */
  const cibles = [];
  /** @type {Set<Element>} */
  const racines = new Set();
  for (const el of aRole) {
    const chaine = [el];
    for (let a = el.parentElement; a && a !== body && compte.get(a) === 1 && !typee(a); a = a.parentElement) chaine.push(a);
    /** @type {{ piece: Piece, racine: Element } | null} */
    let sig = null;
    for (const [i, x] of chaine.entries()) {
      const p = pieces.find((q) => (i === 0 || !q.type) && correspond(x, q.selecteur));
      if (p) {
        sig = { piece: p, racine: x };
        break;
      }
    }
    const racine = sig ? sig.racine : el;
    racines.add(racine);
    // La boîte intérieure que nomme la signature (le cadre d'un champ) est mesurée à la place de la racine.
    const mesuree = (sig?.piece.boite && racine.querySelector(sig.piece.boite)) || racine;
    const a = /** @type {{ role: string, nom: string, focalisable: boolean }} */ (ax.get(el));
    // Zone de clic : la plus grande boîte, l'élément ou un label qui le contient ou le désigne.
    const boite = el.getBoundingClientRect();
    let zone = /** @type {[number, number]} */ ([r2(boite.width), r2(boite.height)]);
    /** @type {Element | null} */
    let label = null;
    for (const l of [...(/** @type {any} */ (el).labels ?? [])]) {
      const b = l.getBoundingClientRect();
      if (b.width * b.height > zone[0] * zone[1]) {
        zone = [r2(b.width), r2(b.height)];
        label = l;
      }
    }
    let clavier = tab.has(el);
    if (!clavier && a.focalisable) {
      const g = el.closest(GROUPES);
      const nom = el.tagName === 'INPUT' && (el.getAttribute('type') ?? '').toLowerCase() === 'radio' ? el.getAttribute('name') : null;
      const membres = g ? [...tab].filter((t) => g.contains(t)) : nom ? [...tab].filter((t) => t.tagName === 'INPUT' && t.getAttribute('name') === nom && /** @type {any} */ (t).form === /** @type {any} */ (el).form) : [];
      clavier = membres.length > 0;
    }
    out.push({
      sorte: 'role',
      index: out.length,
      role: a.role,
      nom: a.nom,
      texte: texteVisible(el),
      clavier,
      zone,
      piece: sig ? { nom: sig.piece.nom, framework: sig.piece.framework, ...(sig.piece.type ? { type: sig.piece.type } : {}) } : null,
      balise: el.tagName.toLowerCase(),
      classes: [...racine.classList],
      mesures: mesures(mesuree),
      chemin: chemin(el),
      selecteur: selecteur(racine),
      endroit: endroit(el),
      extrait: extrait(racine),
    });
    cibles.push(label && racine === el && label.contains(el) ? label : racine);
  }
  // Pièces sans rôle d'une signature qui donne un type, hors d'une pièce d'un rôle relevé.
  /** @param {Element} el */
  const dansRacine = (el) => [...racines].some((r) => r.contains(el));
  /** @type {Set<Element>} */
  const typees = new Set();
  for (const el of tous) {
    if (aRole.includes(el) || !visible(el) || dansRacine(el)) continue;
    const p = typee(el);
    if (!p) continue;
    typees.add(el);
    out.push({
      sorte: 'type',
      index: out.length,
      piece: { nom: p.nom, framework: p.framework, type: /** @type {string} */ (p.type) },
      balise: el.tagName.toLowerCase(),
      classes: [...el.classList],
      mesures: mesures((p.boite && el.querySelector(p.boite)) || el),
      chemin: chemin(el),
      selecteur: selecteur(el),
      endroit: endroit(el),
      extrait: extrait(el),
    });
    cibles.push(el);
  }
  // Blocs : une classe et une surface visible, hors de toute pièce ; chacun dit les blocs qui le contiennent.
  /** @param {Element} el */
  const dansPiece = (el) => dansRacine(el) || [...typees].some((t) => t.contains(el));
  /** @type {Map<Element, number>} */
  const blocs = new Map();
  for (const el of tous) {
    if (!el.classList.length || aRole.includes(el) || typees.has(el) || !visible(el) || dansPiece(el) || !surface(el)) continue;
    /** @type {number[]} */
    const ancetres = [];
    for (let a = el.parentElement; a && a !== body; a = a.parentElement) if (blocs.has(a)) ancetres.push(/** @type {number} */ (blocs.get(a)));
    blocs.set(el, out.length);
    out.push({
      sorte: 'bloc',
      index: out.length,
      balise: el.tagName.toLowerCase(),
      classes: [...el.classList],
      mesures: mesures(el),
      chemin: chemin(el),
      selecteur: selecteur(el),
      endroit: endroit(el),
      extrait: extrait(el),
      ancetres,
    });
    cibles.push(el);
  }
  w.__dsCibles = cibles;
  return out;
}

/**
 * Pose sur chaque élément d'un rôle relevé son rôle calculé, son nom et s'il est focalisable (window.__dsAx).
 * Rend le nombre de nœuds focalisables de l'arbre.
 * @param {import('playwright-core').Page} page
 */
async function poserArbre(page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('DOM.enable');
    await cdp.send('Accessibility.enable');
    await cdp.send('DOM.getDocument', { depth: 0 });
    await page.evaluate(() => {
      /** @type {any} */ (window).__dsAx = new Map();
    });
    const { nodes } = /** @type {any} */ (await cdp.send('Accessibility.getFullAXTree'));
    let focalisables = 0;
    for (const n of nodes) {
      const focalisable = !!n.properties?.find((/** @type {any} */ p) => p.name === 'focusable')?.value?.value;
      if (focalisable) focalisables++;
      if (n.ignored || !n.backendDOMNodeId || !ROLES.includes(n.role?.value)) continue;
      const { object } = /** @type {any} */ (await cdp.send('DOM.resolveNode', { backendNodeId: n.backendDOMNodeId }));
      if (!object?.objectId) continue;
      await cdp.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: 'function (role, nom, focalisable) { window.__dsAx.set(this, { role, nom, focalisable }); }',
        arguments: [{ value: n.role.value }, { value: String(n.name?.value ?? '') }, { value: focalisable }],
      });
    }
    return focalisables;
  } finally {
    await cdp.detach().catch(() => {});
  }
}

/**
 * Suite de la touche Tab depuis le haut de la page (window.__dsTabVu), puis focus rendu et page remise en haut.
 * @param {import('playwright-core').Page} page @param {number} max
 */
async function suiteTab(page, max) {
  await page.evaluate(() => {
    /** @type {any} */ (window).__dsTabVu = new Set();
    /** @type {any} */ (document.activeElement)?.blur?.();
  });
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const fini = await page.evaluate(() => {
      const vu = /** @type {Set<Element>} */ (/** @type {any} */ (window).__dsTabVu);
      const a = document.activeElement;
      if (!a || a === document.body || a === document.documentElement) return vu.size > 0;
      if (vu.has(a)) return true;
      vu.add(a);
      return false;
    });
    if (fini) break;
  }
  await page.evaluate(() => {
    /** @type {any} */ (document.activeElement)?.blur?.();
    window.scrollTo(0, 0);
  });
}

/**
 * Relevé d'une page chargée.
 * @param {import('playwright-core').Page} page @param {{ pieces?: Piece[] }} [opts]
 * @returns {Promise<Releve[]>}
 */
export async function releverPieces(page, { pieces = [] } = {}) {
  const focalisables = await poserArbre(page);
  await suiteTab(page, focalisables + 1);
  return page.evaluate(releverDansLaPage, { pieces, roles: ROLES });
}

/**
 * Capture de l'élément d'un relevé, par son rang : la pièce, ou le label qui contient l'élément s'il est sa zone de clic.
 * @param {import('playwright-core').Page} page @param {number} index
 * @returns {Promise<Buffer>}
 */
export async function capturer(page, index) {
  const h = await page.evaluateHandle((i) => /** @type {any} */ (window).__dsCibles[i], index);
  const el = h.asElement();
  if (!el) throw new Error(`élément ${index} du relevé introuvable dans la page`);
  return el.screenshot({ animations: 'disabled' });
}
