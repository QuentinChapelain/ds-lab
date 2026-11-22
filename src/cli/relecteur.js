#!/usr/bin/env node
// @ts-check
/**
 * D67 : le relecteur. Appelé par un hook PostToolUse de Claude Code après chaque Edit ou Write, il relit le seul
 * fichier écrit, celui de tool_input.file_path, par les contrôles de verifier (src/report/verifier.js) :
 *   - un fichier de <marques>/<marque>/ d'une marque saisie : contraste dans les quatre contextes, espacements, typo ;
 *   - un fichier que l'un des motifs de --style trouve : son style, par stylelint.config.mjs du clone (CP3) ;
 *   - tout autre fichier : rien.
 * Sur un échec, la sortie d'erreur porte « relecteur : <fichier> » et les blocs de verifier, code 2 : Claude Code la
 * montre à l'agent. Sans échec, une ligne de contexte (additionalContext), code 0. Une panne sort aussi en 2, avec son
 * message : l'agent le lit. Les autres fichiers de l'app ne sont pas relus : leurs fautes ne reviennent pas à chaque
 * écriture ; verifier entier se lance à la main.
 * Usage dans le hook : node "$DS_LAB/src/cli/relecteur.js" --marques <dossier> --style <motif> [--style <motif>…]
 * Poser : node <clone>/src/cli/relecteur.js --poser --marques <dossier> --style <motif>…, dans le dépôt de l'équipe :
 *   écrit le hook dans .claude/settings.json (fusionné, sans rien perdre ; relancé, ne change rien), le bloc du
 *   carnet dans CLAUDE.md et carnet.md.
 */
import { parseArgs } from 'node:util';
import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';
import { lancer } from './garde.js';
import { RESOLVER } from '../tokens/resolver.js';
import { echecsDeMarque, echecsDeStyle, blocs } from '../report/verifier.js';

const CONFIG = fileURLToPath(new URL('../../stylelint.config.mjs', import.meta.url));
const USAGE = 'node "$DS_LAB/src/cli/relecteur.js" --marques <dossier> --style <motif> [--style <motif>…], ou --poser avec les mêmes options';

/** Le bloc du carnet, dans le CLAUDE.md du dépôt de l'équipe. */
const CARNET_BLOC = [
  '## Carnet',
  '',
  "Chaque question que tu poses à l'humain, ou que tu ne peux pas lui poser, s'écrit dans `carnet.md` : une ligne du tableau, avec l'heure, la question, la réponse reçue ou ce que tu as choisi faute de réponse, et le fichier concerné. Puis continue.",
  '',
].join('\n');

/** Le carnet, posé vide. */
const CARNET = ['# Carnet des questions', '', '| Heure | Question | Réponse reçue, ou choix faute de réponse | Fichier |', '|---|---|---|---|', ''].join('\n');

/**
 * La commande du hook : sans DS_LAB, une panne que l'agent lit (code 2), au lieu d'un module introuvable qu'il ne
 * verrait pas (code 1).
 * @param {string} marques @param {string[]} style
 */
function commandeDuHook(marques, style) {
  const options = [`--marques ${marques}`, ...style.map((s) => `--style "${s}"`)].join(' ');
  return `if [ -z "$DS_LAB" ]; then echo "relecteur : DS_LAB n'est pas posée : la poser sur le chemin du clone de ds-lab (env de .claude/settings.local.json, ou le shell)" >&2; exit 2; fi; node "$DS_LAB/src/cli/relecteur.js" ${options}`;
}

await lancer('relecteur', async () => {
  const { values } = parseArgs({ options: { marques: { type: 'string' }, style: { type: 'string', multiple: true }, poser: { type: 'boolean' } } });
  if (!values.marques) throw new Error(`--marques <dossier> attendu ; usage : ${USAGE}`);
  if (!values.style?.length) throw new Error(`--style <motif> attendu, par exemple --style "src/**/*.vue" ; usage : ${USAGE}`);
  if (values.poser) return poser(process.cwd(), values.marques, values.style);
  const texte = readFileSync(0, 'utf8');
  /** @type {any} */
  let entree;
  try {
    entree = JSON.parse(texte);
  } catch {
    throw new Error(`entrée de hook attendue sur l'entrée standard (Claude Code, PostToolUse, JSON) ; pour poser le hook : --poser ; usage : ${USAGE}`);
  }
  const fichier = entree?.tool_input?.file_path;
  if (typeof fichier !== 'string') return 0;
  const cwd = typeof entree.cwd === 'string' ? entree.cwd : process.cwd();
  const rel = relative(cwd, isAbsolute(fichier) ? fichier : resolve(cwd, fichier));
  if (rel.startsWith('..')) return 0;

  /** @type {import('../report/verifier.js').Echec[]} */
  const echecs = [];
  let juge = false;
  const dansMarques = relative(resolve(cwd, values.marques), resolve(cwd, rel)).split(sep);
  if (dansMarques.length > 1 && !dansMarques[0].startsWith('..')) {
    const dossier = join(resolve(cwd, values.marques), dansMarques[0]);
    if (existsSync(join(dossier, RESOLVER))) {
      juge = true;
      echecs.push(...echecsDeMarque(dossier, cwd));
    }
  }
  const styles = new Set(values.style.flatMap((m) => globSync(m, { cwd, exclude: (f) => f.includes('node_modules') }).map((f) => resolve(cwd, f))));
  if (styles.has(resolve(cwd, rel))) {
    juge = true;
    const { results } = await stylelint.lint({ files: [resolve(cwd, rel)], configFile: CONFIG });
    echecs.push(...echecsDeStyle(results, cwd));
  }
  if (!juge) return 0;
  if (echecs.length) {
    console.error([`relecteur : ${rel}`, ...blocs(echecs).flatMap((b) => b.lignes)].join('\n'));
    return 2;
  }
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: `relecteur : ${rel}, 0 échec` } }));
  return 0;
});

/**
 * Pose le relecteur et le carnet dans le dépôt de l'équipe.
 * @param {string} depot @param {string} marques @param {string[]} style
 */
function poser(depot, marques, style) {
  const chemin = join(depot, '.claude', 'settings.json');
  const reglages = existsSync(chemin) ? JSON.parse(readFileSync(chemin, 'utf8')) : {};
  const hook = { matcher: 'Edit|Write', hooks: [{ type: 'command', command: commandeDuHook(marques, style) }] };
  reglages.hooks ??= {};
  const autres = (reglages.hooks.PostToolUse ?? []).filter((/** @type {any} */ h) => !JSON.stringify(h).includes('src/cli/relecteur.js'));
  reglages.hooks.PostToolUse = [...autres, hook];
  mkdirSync(join(depot, '.claude'), { recursive: true });
  writeFileSync(chemin, `${JSON.stringify(reglages, null, 2)}\n`);
  const claude = join(depot, 'CLAUDE.md');
  const avant = existsSync(claude) ? readFileSync(claude, 'utf8') : '';
  if (!avant.includes(CARNET_BLOC)) writeFileSync(claude, avant ? `${avant.trimEnd()}\n\n${CARNET_BLOC}` : CARNET_BLOC);
  if (!existsSync(join(depot, 'carnet.md'))) writeFileSync(join(depot, 'carnet.md'), CARNET);
  console.log('relecteur : posé dans .claude/settings.json (hook PostToolUse sur Edit et Write) ; carnet dans CLAUDE.md et carnet.md');
  return 0;
}
