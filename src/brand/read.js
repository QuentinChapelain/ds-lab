// @ts-check
/**
 * Lot M, M0 : lecture rapide de la marque, avant la réduction. Pour chaque page :
 *   - les variables posées par le back-office sur <html style>, dont le nom commence par
 *     le préfixe donné (réglable : le préfixe réel d'une plateforme reste hors dépôt) ;
 *   - les couleurs fortes du rendu (texte, fond, bordure ; opaques ; chroma OKLCH ≥ 0,02) ;
 *   - les contradictions entre ces variables et les feuilles (M7, voir brand.js).
 * Le résultat sert à écrire le bloc brand de la cible ; il ne décide rien.
 */
import { gotoAndSettle, DEFAULT_WAIT_MS } from '../browser/navigate.js';
import { collectSheets } from '../browser/sheets.js';
import { normalizeColor, isOpaque } from '../lib/color.js';
import { contradictionsIn, isGrey } from './brand.js';

/**
 * Exécutée dans la page : attribut style de <html> et couleurs calculées des éléments visibles.
 * @param {string} prefix
 */
function readInPage(prefix) {
  const style = document.documentElement.getAttribute('style') ?? '';
  const variables = style
    .split(';')
    .map((d) => d.split(':'))
    .filter((p) => p.length >= 2 && p[0].trim().startsWith(prefix))
    .map((p) => ({ name: p[0].trim(), value: p.slice(1).join(':').trim() }));
  /** @type {string[]} */
  const colors = [];
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (!el.getClientRects().length || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim());
    if (ownText) colors.push(cs.color);
    colors.push(cs.backgroundColor);
    for (const side of ['top', 'right', 'bottom', 'left'])
      if (parseFloat(cs.getPropertyValue(`border-${side}-width`)) > 0 && cs.getPropertyValue(`border-${side}-style`) !== 'none') colors.push(cs.getPropertyValue(`border-${side}-color`));
  }
  return { variables, colors };
}

/**
 * @param {{ addresses: string[], viewport?: { width: number, height: number }, waitMs?: number, prefix?: string, storageState?: string }} opts
 * @returns {Promise<{ variables: { name: string, value: string }[], strong: { value: string, count: number }[], contradictions: { variable: string, backOffice: string, sheet: string, where: string[] }[] }>}
 */
export async function readBrand({ addresses, viewport = { width: 1366, height: 900 }, waitMs = DEFAULT_WAIT_MS, prefix = '--', storageState }) {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  /** @type {Map<string, string>} */
  const variables = new Map();
  /** @type {Map<string, number>} */
  const counts = new Map();
  /** @type {any[]} */
  const sheets = [];
  const seen = new Set();
  try {
    const context = await browser.newContext({ viewport, storageState: storageState ?? undefined });
    for (const url of addresses) {
      const page = await context.newPage();
      try {
        await gotoAndSettle(page, url, { waitMs });
        const r = await page.evaluate(readInPage, prefix);
        for (const v of r.variables) if (!variables.has(v.name)) variables.set(v.name, normalizeColor(v.value)?.hex ?? v.value);
        for (const c of r.colors) {
          const hex = normalizeColor(c)?.hex;
          if (hex && isOpaque(hex)) counts.set(hex, (counts.get(hex) ?? 0) + 1);
        }
        for (const s of (await collectSheets(page)).sheets) {
          const key = s.href ?? `${url}#${s.styleSheetId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          sheets.push(s);
        }
      } finally {
        await page.close().catch(() => {});
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }
  const strong = [...counts.entries()]
    .filter(([hex]) => !isGrey(hex))
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([value, count]) => ({ value, count }));
  return {
    variables: [...variables.entries()].map(([name, value]) => ({ name, value })),
    strong,
    contradictions: contradictionsIn(sheets, Object.fromEntries(variables)),
  };
}
