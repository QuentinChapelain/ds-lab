// @ts-check
/**
 * Lot V : capture d'une page servie, pleine page, et son arbre d'accessibilité
 * (page.ariaSnapshot()). Animations figées pour que deux captures du même état coïncident.
 * Mêmes réglages que la capture « après » de reduce (simulatePage), pour comparer à ses références.
 */
import { gotoAndSettle, DEFAULT_WAIT_MS } from '../browser/navigate.js';

/**
 * @param {{ url: string, viewport?: { width: number, height: number }, waitMs?: number, storageState?: string }} opts
 * @returns {Promise<{ png: Buffer, aria: string, status: number | null, finalUrl: string }>}
 */
export async function capturePage({ url, viewport = { width: 1366, height: 900 }, waitMs = DEFAULT_WAIT_MS, storageState }) {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport, storageState: storageState ?? undefined });
    const page = await context.newPage();
    const nav = await gotoAndSettle(page, url, { waitMs });
    const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
    const aria = await page.ariaSnapshot();
    return { png, aria, status: nav.status, finalUrl: nav.finalUrl };
  } finally {
    await browser.close();
  }
}
