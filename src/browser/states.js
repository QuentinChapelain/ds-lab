// @ts-check
/**
 * États forcés (R15) : hover, focus et active d'un échantillon d'éléments
 * interactifs, par le protocole DevTools (CSS.forcePseudoState), après
 * collectRendered (qui a gardé les éléments et la fonction de lecture dans la page).
 * Transitions et animations sont coupées le temps du relevé, sinon la valeur lue
 * juste après le changement d'état serait celle du départ de la transition.
 */

export const STATES = /** @type {const} */ ({
  hover: ['hover'],
  focus: ['focus', 'focus-visible'],
  active: ['active'],
});

export const INTERACTIVE_ROLES = new Set(['bouton', 'lien', 'champ']);
export const MAX_STATE_SAMPLES = 60;

/**
 * @typedef {object} StateSample
 * @property {number} index
 * @property {string} role
 * @property {string} selector
 * @property {boolean} text
 * @property {Record<string, string>} rest
 * @property {Record<string, Record<string, string>>} states  par état : propriétés calculées
 * @typedef {{ samples: StateSample[], candidates: number, capped: boolean }} StateCollection
 */

/**
 * Un élément par couple (rôle, sélecteur court), dans l'ordre du DOM.
 * @param {import('./rendered.js').PageCollection} pc
 * @param {number} max
 */
export function pickStateSamples(pc, max = MAX_STATE_SAMPLES) {
  /** @type {Map<string, { index: number, role: string, selector: string, text: boolean }>} */
  const byKey = new Map();
  pc.records.forEach((r, index) => {
    if (!r.retained || r.pseudo || !r.role || !INTERACTIVE_ROLES.has(r.role)) return;
    const key = `${r.role}\n${r.selector}`;
    if (!byKey.has(key)) byKey.set(key, { index, role: r.role, selector: r.selector ?? '', text: !!r.text });
  });
  const all = [...byKey.values()];
  return { picked: all.slice(0, max), candidates: all.length, capped: all.length > max };
}

/**
 * @param {import('playwright-core').Page} page
 * @param {import('./rendered.js').PageCollection} pc
 * @param {{ max?: number }} [opts]
 * @returns {Promise<StateCollection>}
 */
export async function collectStates(page, pc, { max = MAX_STATE_SAMPLES } = {}) {
  const { picked, candidates, capped } = pickStateSamples(pc, max);
  if (!picked.length) return { samples: [], candidates, capped };
  const cdp = await page.context().newCDPSession(page);
  /** @param {number} i @param {boolean} text */
  const read = (i, text) =>
    /** @type {Promise<Record<string, string>>} */ (
      page.evaluate(([idx, t]) => /** @type {any} */ (window).__dsAuditProps(idx, t), /** @type {[number, boolean]} */ ([i, text]))
    );
  /** @type {StateSample[]} */
  const samples = [];
  try {
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    await cdp.send('DOM.getDocument', { depth: 0 });
    // Feuille construite : n'est pas soumise à une CSP qui interdirait un <style> en ligne.
    await page.evaluate(() => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync('*, *::before, *::after { transition: none !important; animation: none !important; }');
      /** @type {any} */ (window).__dsAuditStill = sheet;
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    });
    for (const s of picked) {
      const { result } = /** @type {any} */ (await cdp.send('Runtime.evaluate', { expression: `window.__dsAuditElements[${Number(s.index)}]` }));
      if (!result?.objectId) continue;
      /** @type {number} */
      let nodeId;
      try {
        nodeId = /** @type {any} */ (await cdp.send('DOM.requestNode', { objectId: result.objectId })).nodeId;
      } catch {
        continue;
      }
      if (!nodeId) continue;
      const rest = await read(s.index, s.text);
      /** @type {Record<string, Record<string, string>>} */
      const states = {};
      for (const [state, classes] of Object.entries(STATES)) {
        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [...classes] });
        states[state] = await read(s.index, s.text);
      }
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
      samples.push({ ...s, rest, states });
    }
  } finally {
    await page
      .evaluate(() => {
        const sheet = /** @type {any} */ (window).__dsAuditStill;
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter((x) => x !== sheet);
      })
      .catch(() => {});
    await cdp.detach().catch(() => {});
  }
  return { samples, candidates, capped };
}
