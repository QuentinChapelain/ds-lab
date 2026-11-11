// @ts-check
/**
 * --v1-script <chemin> : exécute le script v1 d'origine (bloc ```js d'un
 * fichier Markdown fourni à l'exécution, jamais copié dans le dépôt) sur
 * chaque page, puis compare son résultat brut aux mesures de l'outil.
 * dsAudit([]) est appelée sans liste de pages : la v1 ne mesure que la page
 * courante, sans iframe, ce qui évite le double comptage (écart n° 11).
 */
import { readFile } from 'node:fs/promises';

/**
 * Premier bloc ```js (ou ```javascript) du Markdown.
 * @param {string} markdown
 * @returns {string}
 */
export function extractV1Script(markdown) {
  const m = markdown.match(/^```(?:js|javascript)[^\n]*\n([\s\S]*?)^```/m);
  if (!m) throw new Error('--v1-script : aucun bloc ```js dans le fichier');
  const code = m[1];
  if (!/dsAudit/.test(code)) throw new Error('--v1-script : le bloc ```js ne définit pas dsAudit');
  return code;
}

/**
 * @param {string} path
 */
export async function loadV1Script(path) {
  return extractV1Script(await readFile(path, 'utf8'));
}

/**
 * Exécute le script v1 dans la page et appelle dsAudit([]).
 * L'évaluation passe par le protocole DevTools : la CSP de la page ne la bloque pas.
 * @param {import('playwright-core').Page} page
 * @param {string} code
 * @returns {Promise<{ result: any } | { error: string }>}
 */
export async function runV1(page, code) {
  try {
    const result = await page.evaluate(
      `(async () => {\n${code}\n;if (typeof window.dsAudit !== 'function') throw new Error('dsAudit absente après exécution du script');\nreturn await window.dsAudit([]);\n})()`,
    );
    return { result };
  } catch (e) {
    return { error: /** @type {Error} */ (e).message.split('\n')[0] };
  }
}

/**
 * Même présentation que top() de la v1 : « clé:n » triés par compte décroissant.
 * @param {Record<string, number>} counts
 * @param {number} n
 */
export function v1Top(counts, n = 20) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');
}

/**
 * @param {Record<string, number> | undefined} o
 */
const fmtSources = (o) =>
  o
    ? Object.entries(o)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k}:${v}`)
        .join(' ')
    : '—';

/**
 * @typedef {{ mesure: string, v1: string | number | null, outil: string | number | null, ecart: string, ecarts: string }} ComparisonRow
 */

/**
 * Tableau de comparaison pour une page.
 * @param {any} v1                résultat brut de dsAudit([])
 * @param {{ rootPx: number, declared: any, rendered: any, elements: number }} ours
 *   declared : analyse du déclaré limitée aux feuilles de cette page ;
 *   rendered : agrégat du rendu de cette page seule
 * @returns {ComparisonRow[]}
 */
export function compareV1(v1, ours) {
  const d = ours.declared.families;
  const r = ours.rendered.families;
  const rules = ours.declared.sheets.reduce((/** @type {number} */ t, /** @type {any} */ s) => t + s.rules, 0);
  const bySource = Object.fromEntries(
    Object.entries(d.colors.bySource).map(([k, v]) => [k, /** @type {any} */ (v).distinct]),
  );
  /** @type {[string, any, any, string][]} */
  const rows = [
    ['rootPx', v1?.rootPx, ours.rootPx, '—'],
    ['Règles', v1?.rules, rules, '1, 5–9 ; règles comptées par le CSSOM en v1, par PostCSS ici (hors @keyframes)'],
    ['Déclaré : couleurs distinctes', v1?.declared?.colors, d.colors.distinct, '2–9'],
    ['Déclaré : couleurs opaques', v1?.declared?.opaque, d.colors.opaque, '2–9'],
    ['Déclaré : opaques à une occurrence', v1?.declared?.once, d.colors.opaqueOnce, '1–9'],
    ['Déclaré : groupes ΔE 2', v1?.declared?.groups_dE2, d.colors.groupsDE2.length, '2–9'],
    ['Déclaré : groupes ΔE 5', v1?.declared?.groups_dE5, d.colors.groupsDE5.length, '2–9'],
    ['Déclaré : tailles de police distinctes', v1?.declared?.sizes, d.fontSizes.distinct, '1, 5–10'],
    ['Déclaré : couleurs distinctes par source', fmtSources(v1?.declared?.bySource), fmtSources(bySource), '2–7'],
    ['Rendu : éléments', v1?.rendered?.elements, ours.elements, '13 (shadow DOM ouverts parcourus ici)'],
    ['Rendu : couleurs distinctes', v1?.rendered?.colors, r.colors.distinct, '13, 14, 20, 21'],
    ['Rendu : couleurs distinctes hors pseudo-éléments', v1?.rendered?.colors, r.colors.distinctWithoutPseudo, '14, 20, 21'],
    ['Rendu : tailles (clé v1, 20 premières)', v1?.rendered?.sizes, v1Top(r.fontSizes.v1Keys, 20), '13 (pseudo-éléments comptés ici), 15, 21'],
  ];
  return rows.map(([mesure, a, b, ecarts]) => ({
    mesure,
    v1: a ?? null,
    outil: b ?? null,
    ecart: typeof a === 'number' && typeof b === 'number' ? (b - a > 0 ? `+${b - a}` : String(b - a)) : a === b ? '0' : '—',
    ecarts,
  }));
}
