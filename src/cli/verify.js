#!/usr/bin/env node
// @ts-check
/**
 * npm run verify -- <adresse> --reference <dossier> [--save] [options]
 * npm run verify -- <adresse> [<chemin>…] --reference <dossier> --ajout <dossier> [options]
 *
 * Vérifier qu'une page n'a pas bougé. Avec --save, capture la page (pleine page)
 * et son arbre d'accessibilité dans le dossier de référence. Sans --save, capture à nouveau
 * et compare : pourcentage de pixels différents, image des différences, arbre identique ou diff.
 * Les fichiers sont ceux de reduce --references : <page>.reference.png, <page>.reference.aria.yml.
 * Avec --ajout <dossier> (D37, D38) : chaque page est comparée avec les feuilles ajoutées écrites par npm run ajout,
 * tokens.css en tête, chaque feuille ajoutée juste après la sienne, à la fenêtre de la réduction (manifeste) ; pour
 * chaque ligne décidée tracée sur la page, la preuve dit « arrivée », « arrivée en partie (n éléments sur m) »,
 * « non arrivée » avec la règle qui gagne, ou « non vue sur cette page ». Le compte de pixels reste donné, il ne
 * décide pas.
 * D18 : sans --ajout, sort en 0, même quand des pixels diffèrent (la commande compare, elle ne juge pas) ; avec
 * --ajout, en 1 dès qu'une ligne écrite n'est pas arrivée sur une page, ou n'est vue sur aucune de ses pages
 * vérifiées (src/verify/arrivee.js, juger) ; en 2 sur une panne (option inconnue, référence absente, Chromium,
 * navigation), par la garde commune (src/cli/garde.js).
 */
import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveAddresses } from '../lib/addresses.js';
import { loadSources } from '../lib/sources.js';
import { stampOf, freeOutputDir } from '../report/json.js';
import { capturePage } from '../verify/capture.js';
import { referenceFiles, writeReference, verifyPage, pageName } from '../verify/reference.js';
import { juger } from '../verify/arrivee.js';
import { lancer } from './garde.js';

const USAGE = `Usage : npm run verify -- <adresse> --reference <dossier> [--save] [options]
        npm run verify -- <adresse> [<chemin>…] --reference <dossier> --ajout <dossier> [options]
  --reference <dossier>      dossier des références : <page>.reference.png, <page>.reference.aria.yml
                             (ceux de npm run reduce -- … --references <dossier>)
  --save                     enregistre la référence au lieu de comparer
  --storage-state <fichier>  session enregistrée par npm run login
  --sources <fichier>        fichier de sources : ses éléments tiers (thirdParty) sont masqués dans la
                             capture, comme dans les références de reduce --sources
  --ajout <dossier>          dossier écrit par npm run ajout : ses feuilles ajoutées sont posées sur chaque page
                             avant la capture (tokens.css en tête, chacune juste après sa feuille), à la fenêtre de
                             la réduction ; chaque ligne décidée est dite arrivée ou non ; sans --save
  --viewport <LxH>           fenêtre (défaut : 1366x900) ; sans --ajout
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
      viewport: { type: 'string' },
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
  const vp = /^(\d+)x(\d+)$/.exec(String(values.viewport ?? '1366x900'));
  const problem =
    values.ajout && values.viewport ? "--viewport ne s'emploie pas avec --ajout : la fenêtre est celle de la réduction"
    : values.ajout && values.save ? "--ajout ne s'emploie pas avec --save : une référence se prend sur la simulation de reduce"
    : values.ajout && !positionals.length ? 'une adresse au moins est attendue'
    : !values.ajout && positionals.length !== 1 ? 'une adresse et une seule est attendue'
    : !values.reference ? '--reference est attendu'
    : !vp ? `--viewport : format LxH attendu (reçu « ${values.viewport} »)`
    : null;
  // D18 : une erreur d'usage est une panne d'une ligne, sans l'aide (-h la donne).
  if (problem || !vp || !values.reference) throw new Error(problem ?? 'usage');
  const urls = resolveAddresses(positionals);
  const refDir = String(values.reference);
  // Avec --ajout, la fenêtre est celle du manifeste (capturePage) ; sinon celle de --viewport.
  const viewport = values.ajout ? undefined : { width: Number(vp[1]), height: Number(vp[2]) };
  const storageState = values['storage-state'];
  // J5 : mêmes éléments tiers masqués que dans les références de reduce --sources.
  const thirdParty = values.sources ? (await loadSources({ path: values.sources })).sources?.thirdParty ?? [] : [];

  if (values.save) {
    const files = await writeReference(refDir, urls[0], await capturePage({ url: urls[0], viewport, storageState, thirdParty }));
    console.log(`Référence enregistrée : ${files.png}, ${files.aria}`);
    return;
  }

  const racine = await freeOutputDir(String(values.out), new URL(urls[0]).host, stampOf(new Date()));
  /** @type {{ page: string, decisions: import('../verify/arrivee.js').Decision[] }[]} */
  const verifiees = [];
  for (const url of urls) {
    let r;
    try {
      r = await verifyPage({ url, referenceDir: refDir, viewport, storageState, thirdParty, ajout: values.ajout });
    } catch (e) {
      if (/** @type {any} */ (e).code !== 'ENOENT') throw e;
      const f = referenceFiles(refDir, url);
      throw new Error(`référence absente (${f.png}, ${f.aria}) ; la créer avec --save ou reduce --references`);
    }
    const { shot, pixels, aria } = r;
    // Plusieurs pages : un dossier par page.
    const dir = urls.length > 1 ? join(racine, pageName(url)) : racine;
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'actuel.png'), shot.png);
    await writeFile(join(dir, 'differences.png'), pixels.diffPng);
    await writeFile(join(dir, 'actuel.aria.yml'), shot.aria + '\n');
    if (!aria.identical) await writeFile(join(dir, 'aria.diff'), aria.diff + '\n');
    const { diffPng, ...counts } = pixels;
    await writeFile(
      join(dir, 'verification.json'),
      JSON.stringify(
        { url, reference: r.files, viewport: shot.viewport, thirdParty, ...(values.ajout ? { ajout: values.ajout } : {}), pixels: counts, aria: { identical: aria.identical }, ...(values.ajout ? { decisions: r.decisions } : {}) },
        null,
        2,
      ) + '\n',
    );

    console.log(`${url}`);
    console.log(`Pixels différents : ${pixels.different} / ${pixels.total} (${pixels.percent.toFixed(4)} %)`);
    if (pixels.sizeMismatch) console.log(`Taille : référence ${pixels.sizeMismatch.reference.join('×')}, actuelle ${pixels.sizeMismatch.actual.join('×')}`);
    if (thirdParty.length) console.log(`Éléments tiers masqués : ${thirdParty.join(', ')}`);
    if (values.ajout) console.log(`Feuilles ajoutées : ${values.ajout} (fenêtre ${shot.viewport.width}×${shot.viewport.height})`);
    console.log(`Arbre d'accessibilité : ${aria.identical ? 'identique' : 'différent (aria.diff)'}`);
    if (values.ajout) {
      console.log(`Preuve par décision (${r.decisions.length} ligne(s) décidée(s) tracée(s) sur la page) :`);
      for (const d of r.decisions) console.log(`  ${d.texte}`);
      verifiees.push({ page: new URL(url).pathname, decisions: r.decisions });
    }
    console.log(`Sorties : ${dir}`);
  }
  if (!values.ajout) return;
  const j = juger(verifiees);
  if (!j.sortie) console.log('Chaque ligne écrite est arrivée sur les pages vérifiées.');
  else {
    console.log(`Lignes écrites non arrivées ou non vérifiées (${j.motifs.length}) :`);
    for (const m of j.motifs) console.log(`  ${m}`);
  }
  return j.sortie;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await lancer('verify', main);
