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
 * Avec --ajout <dossier> (D37, D38, D39) : chaque page est comparée avec les feuilles ajoutées écrites par npm run
 * ajout, tokens.css en tête, chaque feuille ajoutée juste après la sienne, à la fenêtre de la réduction (manifeste) ;
 * la hauteur de la page intacte (lue avant la pose, dans le même chargement), avec les feuilles et de la référence ;
 * puis le verdict par ligne décidée, sur les pages vérifiées : arrivée, en partie, non arrivée (chaque déclaration, ce
 * qui tient la valeur, ce qu'il faut faire), déjà en place, non vue, hors des pages vérifiées, non vérifiable (état),
 * et une phrase qui compte chaque état. Le compte de pixels reste donné, il ne décide pas. La page intacte est capturée
 * dans le même chargement, avant la pose (avant.png, à côté de actuel.png : l'avant et après du parcours, D86). Les
 * pages avec les feuilles sont relevées comme l'audit les relève, et réunies dans valeurs-apres.json, à la racine : ce
 * que la remise compte après (D99).
 * D18 : sans --ajout, sort en 0, même quand des pixels diffèrent (la commande compare, elle ne juge pas) ; avec
 * --ajout, en 0 si aucune ligne décidée n'est en partie, non arrivée, déjà en place ou non vue, en 1 sinon
 * (src/verify/arrivee.js, juger) ; en 2 sur une panne (option inconnue, référence absente, manifeste sans
 * simulation, Chromium, navigation), par la garde commune (src/cli/garde.js).
 */
import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveAddresses } from '../lib/addresses.js';
import { loadSources } from '../lib/sources.js';
import { stampOf, freeOutputDir } from '../report/json.js';
import { capturePage, lireAjouts } from '../verify/capture.js';
import { referenceFiles, writeReference, verifyPage, pageName, VALEURS_APRES } from '../verify/reference.js';
import { juger } from '../verify/arrivee.js';
import { createRenderedAggregator } from '../rendered/aggregate.js';
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
                             la réduction ; verdict par ligne décidée, hauteurs avant et après ; sans --save
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
  /** @type {import('../verify/arrivee.js').Releve[]} */
  const releves = [];
  // Les pages avec les feuilles, relevées comme l'audit les relève (D99).
  const apres = createRenderedAggregator();
  let relevees = 0;
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
    if (shot.avant) await writeFile(join(dir, 'avant.png'), shot.avant);
    await writeFile(join(dir, 'differences.png'), pixels.diffPng);
    await writeFile(join(dir, 'actuel.aria.yml'), shot.aria + '\n');
    if (!aria.identical) await writeFile(join(dir, 'aria.diff'), aria.diff + '\n');
    const { diffPng, ...counts } = pixels;
    await writeFile(
      join(dir, 'verification.json'),
      JSON.stringify(
        { url, reference: r.files, viewport: shot.viewport, thirdParty, ...(values.ajout ? { ajout: values.ajout, hauteurs: r.hauteurs, operations: r.releve?.ops ?? [] } : {}), pixels: counts, aria: { identical: aria.identical } },
        null,
        2,
      ) + '\n',
    );

    console.log(`${url}`);
    console.log(`Pixels différents : ${pixels.different} / ${pixels.total} (${pixels.percent.toFixed(4)} %)`);
    if (pixels.sizeMismatch) console.log(`Taille : référence ${pixels.sizeMismatch.reference.join('×')}, actuelle ${pixels.sizeMismatch.actual.join('×')}`);
    if (thirdParty.length) console.log(`Éléments tiers masqués : ${thirdParty.join(', ')}`);
    if (values.ajout) console.log(`Feuilles ajoutées : ${values.ajout} (fenêtre ${shot.viewport.width}×${shot.viewport.height})`);
    if (r.hauteurs) console.log(`Hauteur : page intacte ${r.hauteurs.intacte} px, avec les feuilles ${r.hauteurs.avecFeuilles} px, référence ${r.hauteurs.reference} px`);
    console.log(`Arbre d'accessibilité : ${aria.identical ? 'identique' : 'différent (aria.diff)'}`);
    if (r.releve) releves.push(r.releve);
    if (shot.rendu) {
      apres.addPage(shot.rendu.pc);
      if (shot.rendu.sc) apres.addStates(shot.rendu.sc);
      relevees++;
    }
    console.log(`Sorties : ${dir}`);
  }
  if (!values.ajout) return;
  const { manifeste } = await lireAjouts(String(values.ajout));
  const j = juger(manifeste, releves);
  await writeFile(join(racine, 'verdict.json'), JSON.stringify({ pages: releves.map((x) => x.page), ...j }, null, 2) + '\n');
  if (relevees === urls.length) {
    const rendu = apres.result();
    await writeFile(join(racine, VALEURS_APRES), JSON.stringify({ pages: relevees, rendered: { families: rendu.families, usages: { colors: /** @type {any} */ (rendu.usages).colors } } }) + '\n');
  }
  console.log(`Verdict par ligne décidée (pages vérifiées : ${releves.map((x) => x.page).join(', ')}) :`);
  for (const l of j.lignes) {
    console.log(`  ${l.texte}`);
    for (const d of l.details) console.log(`    ${d}`);
  }
  console.log(j.resume);
  return j.sortie;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await lancer('verify', main);
