#!/usr/bin/env node
// @ts-check
/**
 * npm run marque -- <adresse> [<chemins…>] --prefix <préfixe> [options]
 *
 * Lot M, M0 : lecture rapide de la marque, avant la réduction. Sort les variables du
 * back-office posées sur <html> (préfixe réglable), les couleurs fortes du rendu et leurs
 * contradictions avec les feuilles. Sert à écrire le bloc brand de la cible ; ne décide rien.
 */
import { parseArgs } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveAddresses, groupByHost } from '../lib/addresses.js';
import { stampOf, freeOutputDir } from '../report/json.js';
import { readBrand } from '../brand/read.js';

const USAGE = `Usage : npm run marque -- <adresse> [<chemins…>] --prefix <préfixe> [options]
  --prefix <préfixe>         début du nom des variables posées par le back-office sur <html> (défaut : --, toutes)
  --storage-state <fichier>  session enregistrée par npm run login
  --viewport <LxH>           fenêtre (défaut : 1366x900)
  --out <dossier>            racine des sorties (défaut : local/marques)
  -h, --help                 cette aide`;

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      prefix: { type: 'string', default: '--' },
      'storage-state': { type: 'string' },
      viewport: { type: 'string', default: '1366x900' },
      out: { type: 'string', default: 'local/marques' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) return console.log(USAGE);
  const vp = /^(\d+)x(\d+)$/.exec(String(values.viewport));
  if (!positionals.length || !vp) {
    console.error(`Erreur : ${!positionals.length ? 'au moins une adresse est attendue' : `--viewport : format LxH attendu (reçu « ${values.viewport} »)`}\n\n${USAGE}`);
    process.exit(2);
  }
  for (const [host, urls] of groupByHost(resolveAddresses(positionals))) {
    const r = await readBrand({ addresses: urls, viewport: { width: Number(vp[1]), height: Number(vp[2]) }, prefix: String(values.prefix), storageState: values['storage-state'] });
    const dir = await freeOutputDir(String(values.out), host, stampOf(new Date()));
    await mkdir(dir, { recursive: true });
    const file = join(dir, 'marque.json');
    await writeFile(file, JSON.stringify({ host, pages: urls, prefix: values.prefix, ...r }, null, 2) + '\n');
    console.log(`\n${host} : ${file}`);
    console.log('Variables du back-office :');
    for (const v of r.variables) console.log(`  ${v.name} = ${v.value}`);
    console.log('Couleurs fortes (occurrences) :');
    for (const s of r.strong.slice(0, 12)) console.log(`  ${s.value} (${s.count})`);
    console.log(`Contradictions : ${r.contradictions.length}`);
    for (const c of r.contradictions) console.log(`  ${c.variable} : back-office ${c.backOffice}, feuille ${c.sheet} (${c.where.join(', ')})`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
