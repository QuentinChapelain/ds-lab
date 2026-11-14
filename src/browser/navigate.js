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
