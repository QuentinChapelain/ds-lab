#!/usr/bin/env node
// @ts-check
/**
 * npm run verify -- <adresse> --reference <dossier> [--save] [options]
 *
 * Vérifier qu'une page n'a pas bougé. Avec --save, capture la page (pleine page)
 * et son arbre d'accessibilité dans le dossier de référence. Sans --save, capture à nouveau
 * et compare : pourcentage de pixels différents, image des différences, arbre identique ou diff.
 * Les fichiers sont ceux de reduce --references : <page>.reference.png, <page>.reference.aria.yml.
 * Avec --ajout <dossier> (D37) : la page est comparée avec les feuilles ajoutées écrites par npm run ajout,
 * tokens.css en tête, chaque feuille ajoutée juste après la sienne.
 * D18 : sort en 0, même quand des pixels diffèrent (la commande compare, elle ne juge
 * pas), ou en 2 sur une panne (option inconnue, référence absente, Chromium, navigation), par la garde commune
 * (src/cli/garde.js).
 */
import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveAddresses } from '../lib/addresses.js';
import { loadSources } from '../lib/sources.js';
import { stampOf, freeOutputDir } from '../report/json.js';
import { capturePage } from '../verify/capture.js';
import { referenceFiles, writeReference, verifyPage } from '../verify/reference.js';
import { lancer } from './garde.js';

const USAGE = `Usage : npm run verify -- <adresse> --reference <dossier> [--save] [options]
  --reference <dossier>      dossier des références : <page>.reference.png, <page>.reference.aria.yml
                             (ceux de npm run reduce -- … --references <dossier>)
  --save                     enregistre la référence au lieu de comparer
  --storage-state <fichier>  session enregistrée par npm run login
  --sources <fichier>        fichier de sources : ses éléments tiers (thirdParty) sont masqués dans la
                             capture, comme dans les références de reduce --sources
  --ajout <dossier>          dossier écrit par npm run ajout : ses feuilles ajoutées sont posées sur la page
                             avant la capture (tokens.css en tête, chacune juste après sa feuille) ; sans --save
  --viewport <LxH>           fenêtre (défaut : 1366x900, celle de la réduction)
  --out <dossier>            racine des sorties de comparaison (défaut : local/verify)
  -h, --help                 cette aide`;

/**
 * Arguments de la ligne de commande.
 * @param {string[]} argv
 */
export function parseVerifyArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      reference: { type: 'string' },
      save: { type: 'boolean', default: false },
      'storage-state': { type: 'string' },
      sources: { type: 'string' },
      ajout: { type: 'string' },
      viewport: { type: 'string', default: '1366x900' },
      out: { type: 'string', default: 'local/verify' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  return { ...values, positionals };
}

async function main() {
  const values = parseVerifyArgs(process.argv.slice(2));
  const { positionals } = values;
  if (values.help) return console.log(USAGE);
  const vp = /^(\d+)x(\d+)$/.exec(String(values.viewport));
  const problem =
    positionals.length !== 1 ? 'une adresse et une seule est attendue'
    : !values.reference ? '--reference est attendu'
    : !vp ? `--viewport : format LxH attendu (reçu « ${values.viewport} »)`
    : values.ajout && values.save ? "--ajout ne s'emploie pas avec --save : une référence se prend sur la simulation de reduce"
    : null;
  // D18 : une erreur d'usage est une panne d'une ligne, sans l'aide (-h la donne).
  if (problem || !vp || !values.reference) throw new Error(problem ?? 'usage');
  const [url] = resolveAddresses(positionals);
  const refDir = String(values.reference);
  const viewport = { width: Number(vp[1]), height: Number(vp[2]) };
  const storageState = values['storage-state'];
  // J5 : mêmes éléments tiers masqués que dans les références de reduce --sources.
  const thirdParty = values.sources ? (await loadSources({ path: values.sources })).sources?.thirdParty ?? [] : [];

  if (values.save) {
    const files = await writeReference(refDir, url, await capturePage({ url, viewport, storageState, thirdParty }));
    console.log(`Référence enregistrée : ${files.png}, ${files.aria}`);
    return;
  }

  let r;
  try {
    r = await verifyPage({ url, referenceDir: refDir, viewport, storageState, thirdParty, ajout: values.ajout });
  } catch (e) {
    if (/** @type {any} */ (e).code !== 'ENOENT') throw e;
    const f = referenceFiles(refDir, url);
    throw new Error(`référence absente (${f.png}, ${f.aria}) ; la créer avec --save ou reduce --references`);
  }
  const { shot, pixels, aria } = r;
  const dir = await freeOutputDir(String(values.out), new URL(url).host, stampOf(new Date()));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'actuel.png'), shot.png);
  await writeFile(join(dir, 'differences.png'), pixels.diffPng);
  await writeFile(join(dir, 'actuel.aria.yml'), shot.aria + '\n');
  if (!aria.identical) await writeFile(join(dir, 'aria.diff'), aria.diff + '\n');
  const { diffPng, ...counts } = pixels;
  await writeFile(join(dir, 'verification.json'), JSON.stringify({ url, reference: r.files, viewport, thirdParty, ...(values.ajout ? { ajout: values.ajout } : {}), pixels: counts, aria: { identical: aria.identical } }, null, 2) + '\n');

  console.log(`${url}`);
  console.log(`Pixels différents : ${pixels.different} / ${pixels.total} (${pixels.percent.toFixed(4)} %)`);
  if (pixels.sizeMismatch) console.log(`Taille : référence ${pixels.sizeMismatch.reference.join('×')}, actuelle ${pixels.sizeMismatch.actual.join('×')}`);
  if (thirdParty.length) console.log(`Éléments tiers masqués : ${thirdParty.join(', ')}`);
  if (values.ajout) console.log(`Feuilles ajoutées : ${values.ajout}`);
  console.log(`Arbre d'accessibilité : ${aria.identical ? 'identique' : 'différent (aria.diff)'}`);
  console.log(`Sorties : ${dir}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await lancer('verify', main);
