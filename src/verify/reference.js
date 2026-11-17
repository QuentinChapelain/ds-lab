// @ts-check
/**
 * Fichiers de référence d'une page, partagés par reduce --references et verify.
 *   <page>.reference.png       capture pleine page (reduce : après simulation complète)
 *   <page>.reference.aria.yml  arbre d'accessibilité (reduce : avant simulation)
 * <page> = dernier segment du chemin, sans extension (`/` → index).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { capturePage } from './capture.js';
import { compareImages, compareAria } from './compare.js';

/** @param {string} url */
export function pageName(url) {
  const last = new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
  return decodeURIComponent(last).replace(/\.[^.]*$/, '') || 'index';
}

/**
 * @param {string} dir
 * @param {string} url
 */
export function referenceFiles(dir, url) {
  const name = pageName(url);
  return { png: join(dir, `${name}.reference.png`), aria: join(dir, `${name}.reference.aria.yml`) };
}

/**
 * @param {string} dir
 * @param {string} url
 * @param {{ png: Buffer, aria: string }} shot
 */
export async function writeReference(dir, url, { png, aria }) {
  const files = referenceFiles(dir, url);
  await mkdir(dir, { recursive: true });
  await writeFile(files.png, png);
  await writeFile(files.aria, aria + '\n');
  return files;
}

/**
 * Capture la page et la compare à sa référence.
 * @param {{ url: string, referenceDir: string, viewport?: { width: number, height: number }, waitMs?: number, storageState?: string, thirdParty?: string[], ajout?: string }} opts
 *   ajout : dossier écrit par npm run ajout, posé sur la page avant la capture (D37) ; la fenêtre est alors celle de son
 *   manifeste, et `decisions` dit, pour chaque ligne décidée tracée sur la page, si elle est arrivée (D38)
 */
export async function verifyPage({ url, referenceDir, viewport, waitMs, storageState, thirdParty, ajout }) {
  const files = referenceFiles(referenceDir, url);
  const [refPng, refAria] = await Promise.all([readFile(files.png), readFile(files.aria, 'utf8')]);
  const shot = await capturePage({ url, viewport, waitMs, storageState, thirdParty, ajout });
  return { files, shot, pixels: compareImages(refPng, shot.png), aria: compareAria(refAria.replace(/\n$/, ''), shot.aria), decisions: shot.decisions ?? [] };
}
