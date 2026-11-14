// @ts-check
/**
 * Lot V : capture d'une page servie, pleine page, et son arbre d'accessibilité
 * (page.ariaSnapshot()). Animations figées pour que deux captures du même état coïncident.
 * Mêmes réglages que la capture « après » de reduce (simulatePage), pour comparer à ses références.
 */
import { gotoAndSettle, DEFAULT_WAIT_MS } from '../browser/navigate.js';
import { hideThirdParty } from '../browser/simulate.js';

/**
 * Lot J, J5 étendu : `thirdParty` (sélecteurs de sources.json) masqués dans la capture, comme dans
 * les références de reduce --sources ; l'arbre d'accessibilité est lu avant le masque.
 * @param {{ url: string, viewport?: { width: number, height: number }, waitMs?: number, storageState?: string, thirdParty?: string[] }} opts
 * @returns {Promise<{ png: Buffer, aria: string, status: number | null, finalUrl: string }>}
 */
export async function capturePage({ url, viewport = { width: 1366, height: 900 }, waitMs = DEFAULT_WAIT_MS, storageState, thirdParty = [] }) {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport, storageState: storageState ?? undefined });
    const page = await context.newPage();
    const nav = await gotoAndSettle(page, url, { waitMs });
    const aria = await page.ariaSnapshot();
    await hideThirdParty(page, thirdParty, true);
    const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
    return { png, aria, status: nav.status, finalUrl: nav.finalUrl };
  } finally {
    await browser.close();
  }
}
