// @ts-check
/**
 * Chargement d'une page avant mesure : événement load, puis networkidle
 * plafonné (une expiration n'est pas une erreur), puis un délai réglable.
 */

export const DEFAULT_WAIT_MS = 2000;
export const NETWORK_IDLE_TIMEOUT_MS = 10000;

/**
 * @param {import('playwright-core').Page} page
 * @param {string} url
 * @param {{ waitMs?: number, networkIdleTimeoutMs?: number, gotoTimeoutMs?: number }} [opts]
 * @returns {Promise<{ status: number | null, networkIdle: boolean, finalUrl: string }>}
 */
export async function gotoAndSettle(
  page,
  url,
  { waitMs = DEFAULT_WAIT_MS, networkIdleTimeoutMs = NETWORK_IDLE_TIMEOUT_MS, gotoTimeoutMs = 60000 } = {},
) {
  const response = await page.goto(url, { waitUntil: 'load', timeout: gotoTimeoutMs });
  let networkIdle = true;
  try {
    await page.waitForLoadState('networkidle', { timeout: networkIdleTimeoutMs });
  } catch {
    networkIdle = false;
  }
  if (waitMs > 0) await page.waitForTimeout(waitMs);
  return { status: response?.status() ?? null, networkIdle, finalUrl: page.url() };
}

/**
 * @typedef {{ text: string, tag: '[F]' | '[V]' }} AvertissementNavigation
 */

/**
 * Avertissements de navigation d'une page, partagés par l'audit, reduce et la lecture
 * de marque. Statut HTTP d'erreur, redirection, networkidle non atteint, feuilles illisibles (collectSheets).
 * @param {{ url: string, status?: number | null, finalUrl?: string, networkIdle?: boolean }} nav résultat de gotoAndSettle, avec l'adresse demandée
 * @param {string[]} [feuilles] avertissements de collectSheets
 * @returns {AvertissementNavigation[]}
 */
export function navigationWarnings(nav, feuilles = []) {
  /** @type {AvertissementNavigation[]} */
  const w = [];
  if (nav.networkIdle === false) w.push({ text: `${nav.url} : networkidle non atteint en ${NETWORK_IDLE_TIMEOUT_MS / 1000} s, mesure faite quand même.`, tag: '[F]' });
  if (typeof nav.status === 'number' && nav.status >= 400) w.push({ text: `${nav.url} : statut HTTP ${nav.status}.`, tag: '[F]' });
  if (nav.finalUrl && nav.finalUrl !== nav.url) w.push({ text: `${nav.url} : redirigée vers ${nav.finalUrl} (session expirée ?).`, tag: '[V]' });
  for (const t of feuilles) w.push({ text: `${nav.url} : ${t}`, tag: '[F]' });
  return w;
}
