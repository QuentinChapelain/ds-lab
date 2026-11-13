#!/usr/bin/env node
// @ts-check
/**
 * npm run verify -- <adresse> --reference <dossier> [--save] [options]
 *
 * Lot V : vérifier qu'une page n'a pas bougé. Avec --save, capture la page (pleine page)
 * et son arbre d'accessibilité dans le dossier de référence. Sans --save, capture à nouveau
 * et compare : pourcentage de pixels différents, image des différences, arbre identique ou diff.
 * Les fichiers sont ceux de reduce --references : <page>.reference.png, <page>.reference.aria.yml.
 */
import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveAddresses } from '../lib/addresses.js';
import { stampOf, freeOutputDir } from '../report/json.js';
import { capturePage } from '../verify/capture.js';
import { referenceFiles, writeReference, verifyPage } from '../verify/reference.js';

const USAGE = `Usage : npm run verify -- <adresse> --reference <dossier> [--save] [options]
  --reference <dossier>      dossier des références : <page>.reference.png, <page>.reference.aria.yml
                             (ceux de npm run reduce -- … --references <dossier>)
  --save                     enregistre la référence au lieu de comparer
  --storage-state <fichier>  session enregistrée par npm run login
  --viewport <LxH>           fenêtre (défaut : 1366x900, celle de la réduction)
  --out <dossier>            racine des sorties de comparaison (défaut : local/verify)
  -h, --help                 cette aide`;

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      reference: { type: 'string' },
      save: { type: 'boolean', default: false },
      'storage-state': { type: 'string' },
      viewport: { type: 'string', default: '1366x900' },
      out: { type: 'string', default: 'local/verify' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) return console.log(USAGE);
  const vp = /^(\d+)x(\d+)$/.exec(String(values.viewport));
  const problem =
    positionals.length !== 1 ? 'une adresse et une seule est attendue'
    : !values.reference ? '--reference est attendu'
    : !vp ? `--viewport : format LxH attendu (reçu « ${values.viewport} »)`
    : null;
  if (problem || !vp || !values.reference) {
    console.error(`Erreur : ${problem}\n\n${USAGE}`);
    process.exit(2);
  }
  const [url] = resolveAddresses(positionals);
  const refDir = String(values.reference);
  const viewport = { width: Number(vp[1]), height: Number(vp[2]) };
  const storageState = values['storage-state'];

  if (values.save) {
    const files = await writeReference(refDir, url, await capturePage({ url, viewport, storageState }));
    console.log(`Référence enregistrée : ${files.png}, ${files.aria}`);
    return;
  }

  let r;
  try {
    r = await verifyPage({ url, referenceDir: refDir, viewport, storageState });
  } catch (e) {
    if (/** @type {any} */ (e).code !== 'ENOENT') throw e;
    const f = referenceFiles(refDir, url);
    console.error(`Erreur : référence absente (${f.png}, ${f.aria}) ; la créer avec --save ou reduce --references`);
    process.exit(2);
  }
  const { shot, pixels, aria } = r;
  const dir = await freeOutputDir(String(values.out), new URL(url).host, stampOf(new Date()));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'actuel.png'), shot.png);
  await writeFile(join(dir, 'differences.png'), pixels.diffPng);
  await writeFile(join(dir, 'actuel.aria.yml'), shot.aria + '\n');
  if (!aria.identical) await writeFile(join(dir, 'aria.diff'), aria.diff + '\n');
  const { diffPng, ...counts } = pixels;
  await writeFile(join(dir, 'verification.json'), JSON.stringify({ url, reference: r.files, viewport, pixels: counts, aria: { identical: aria.identical } }, null, 2) + '\n');

  console.log(`${url}`);
  console.log(`Pixels différents : ${pixels.different} / ${pixels.total} (${pixels.percent.toFixed(4)} %)`);
  if (pixels.sizeMismatch) console.log(`Taille : référence ${pixels.sizeMismatch.reference.join('×')}, actuelle ${pixels.sizeMismatch.actual.join('×')}`);
  console.log(`Arbre d'accessibilité : ${aria.identical ? 'identique' : 'différent (aria.diff)'}`);
  console.log(`Sorties : ${dir}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
