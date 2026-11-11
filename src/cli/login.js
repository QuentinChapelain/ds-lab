#!/usr/bin/env node
// @ts-check
/**
 * npm run login -- <adresse> [--name <nom>]
 *
 * Ouvre une fenêtre de navigateur sur l'adresse. La personne se connecte à la
 * main ; la session (cookies et localStorage) est enregistrée toutes les deux
 * secondes dans .auth/<nom>.json, droits 600, jusqu'à la fermeture de la
 * fenêtre. Aucun identifiant ne passe par la ligne de commande ni par ce script.
 * Le fichier se donne ensuite à l'audit : --storage-state .auth/<nom>.json
 */
import { parseArgs } from 'node:util';
import { mkdir, writeFile, rename, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const USAGE = `Usage : npm run login -- <adresse> [--name <nom>]

  Se connecter dans la fenêtre qui s'ouvre, puis la fermer.
  La session est écrite dans .auth/<nom>.json (défaut : session), jamais versionné.`;

/**
 * @param {string[]} argv
 */
export function parseLoginArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { name: { type: 'string', default: 'session' }, help: { type: 'boolean', short: 'h', default: false } },
  });
  if (values.help) return { help: true };
  if (positionals.length !== 1) throw new Error('une adresse est attendue');
  let url;
  try {
    url = new URL(positionals[0]).href;
  } catch {
    throw new Error(`adresse invalide : ${positionals[0]}`);
  }
  const name = String(values.name);
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(name)) throw new Error('--name : lettres, chiffres, tirets et soulignés seulement');
  return { help: false, url, file: join('.auth', `${name}.json`) };
}

/**
 * Écrit l'état de session sans jamais laisser un fichier lisible par d'autres.
 * @param {string} file
 * @param {unknown} state
 */
export async function saveState(file, state) {
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(state), { mode: 0o600 });
  await chmod(tmp, 0o600);
  await rename(tmp, file);
}

async function main() {
  let parsed;
  try {
    parsed = parseLoginArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`Erreur : ${/** @type {Error} */ (e).message}\n\n${USAGE}`);
    process.exit(2);
  }
  if (parsed.help || !parsed.url || !parsed.file) {
    console.log(USAGE);
    return;
  }
  const { chromium } = await import('playwright-core');
  await mkdir('.auth', { recursive: true, mode: 0o700 });
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  await page.goto(parsed.url, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  console.log(`Fenêtre ouverte. Connecte-toi, puis ferme la fenêtre. Session : ${parsed.file}`);
  let saves = 0;
  let open = true;
  page.on('close', () => (open = false));
  browser.on('disconnected', () => (open = false));
  while (open) {
    try {
      await saveState(parsed.file, await context.storageState());
      saves++;
    } catch {
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  await browser.close().catch(() => {});
  console.log(saves ? `Session enregistrée dans ${parsed.file} (droits 600).` : 'Aucune session enregistrée.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`Erreur : ${e.message}`);
    process.exit(1);
  });
}
