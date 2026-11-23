#!/usr/bin/env node
// @ts-check
/**
 * D67, D71 : le relecteur. Appelé par trois hooks de Claude Code, il relit, par les contrôles de verifier
 * (src/report/verifier.js), les fichiers de son périmètre dont le contenu a changé, quel que soit l'outil qui les a écrits :
 *   - le périmètre : chaque fichier d'une marque saisie de <marques>/<marque>/, et chaque fichier qu'un motif de --style
 *     trouve ; une marque dont un fichier change est relue entière (contraste dans les quatre contextes, espacements,
 *     typo), un fichier de style par stylelint.config.mjs du clone (CP3) ;
 *   - SessionStart : prend les empreintes (SHA-1 du contenu) de départ de la session ; sur resume ou compact, garde
 *     celles qui existent ;
 *   - PostToolUse (Edit, Write, NotebookEdit, Bash, PowerShell) : relit ce qui a changé depuis l'appel précédent. Sans
 *     empreintes (session ouverte avant la pose), prend les siennes et relit le seul fichier de tool_input.file_path ;
 *   - Stop : relit ce qui a changé depuis le départ de la session ; sur un échec, l'agent ne finit pas. Une seule
 *     relance : quand l'arrêt suit déjà un Stop refusé (stop_hook_active), il laisse finir et dit les échecs à l'humain.
 * Sur un échec, la sortie d'erreur porte « relecteur : <fichiers> » et les blocs de verifier, code 2 : Claude Code la
 * montre à l'agent. Rien de changé, ou relu sans échec : aucune sortie, code 0. Une panne sort aussi en 2, avec son message.
 * La mémoire vit dans <dossier temporaire>/ds-lab-relecteur/<session>/, hors du dépôt : empreintes de départ, du dernier
 * appel, et journal.jsonl, une ligne par appel (heure, événement, outil, fichiers relus, échecs, code), que le banc relève.
 * Usage dans les hooks : node "$DS_LAB/src/cli/relecteur.js" --marques <dossier> --style <motif> [--style <motif>…]
 * Poser : node <clone>/src/cli/relecteur.js --poser --marques <dossier> --style <motif>…, dans le dépôt de l'équipe :
 *   écrit les trois hooks dans .claude/settings.json (fusionnés, sans rien perdre ; relancé, remplace ceux du relecteur),
 *   la section « Carnet » du CLAUDE.md (remplacée si elle existe) et carnet.md (gardé s'il existe).
 */
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, globSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lancer } from './garde.js';
import { RESOLVER } from '../tokens/resolver.js';
import { echecsDeMarque, echecsDeStyle, blocs } from '../report/verifier.js';

const CONFIG = fileURLToPath(new URL('../../stylelint.config.mjs', import.meta.url));
const USAGE = 'node "$DS_LAB/src/cli/relecteur.js" --marques <dossier> --style <motif> [--style <motif>…], ou --poser avec les mêmes options';
/** Les outils qui peuvent écrire, d'après la documentation de Claude Code (D71). */
const OUTILS = 'Edit|Write|NotebookEdit|Bash|PowerShell';

/** Le bloc du carnet, dans le CLAUDE.md du dépôt de l'équipe (texte retenu par Quentin, D71). */
const CARNET_BLOC = [
  '## Carnet',
  '',
  "Chaque fois que tu dois choisir quelque chose que la demande ne dit pas, écris-le au carnet avant de l'appliquer, par cette commande, qui date la ligne :",
  '',
  '`node "$DS_LAB/src/cli/carnet.js" --question "…" --choix "…" --fichier <fichier>`',
  '',
  "`--question` dit ce qui n'était pas dit, `--choix` ce que tu as décidé ; si tu l'as demandé à l'humain et qu'il a répondu, `--reponse` à la place de `--choix`. N'écris pas `carnet.md` toi-même.",
  '',
].join('\n');

/** Le carnet, posé vide. */
const CARNET = ['# Carnet des questions', '', '| Heure | Question | Réponse reçue, ou choix faute de réponse | Fichier |', '|---|---|---|---|', ''].join('\n');

/**
 * La commande des hooks : sans DS_LAB, une panne que l'agent lit (code 2), au lieu d'un module introuvable qu'il ne
 * verrait pas (code 1).
 * @param {string} marques @param {string[]} style
 */
function commandeDuHook(marques, style) {
  const options = [`--marques ${marques}`, ...style.map((s) => `--style "${s}"`)].join(' ');
  return `if [ -z "$DS_LAB" ]; then echo "relecteur : DS_LAB n'est pas posée : la poser sur le chemin du clone de ds-lab (env de .claude/settings.local.json, ou le shell)" >&2; exit 2; fi; node "$DS_LAB/src/cli/relecteur.js" ${options}`;
}

/** @typedef {Record<string, string>} Empreintes chemin dans le dépôt → SHA-1 du contenu */

/**
 * Les empreintes du périmètre : chaque fichier des marques saisies, chaque fichier des motifs de style.
 * @param {string} cwd @param {string} marques @param {string[]} style
 * @returns {{ empreintes: Empreintes, marqueDe: Map<string, string>, styles: Set<string> }}
 */
function perimetre(cwd, marques, style) {
  /** @type {Empreintes} */
  const empreintes = {};
  /** @type {Map<string, string>} fichier → dossier de sa marque */
  const marqueDe = new Map();
  const racine = resolve(cwd, marques);
  const dossiers = existsSync(racine) ? readdirSync(racine).map((d) => join(racine, d)).filter((d) => statSync(d).isDirectory() && existsSync(join(d, RESOLVER))) : [];
  for (const d of dossiers)
    for (const f of readdirSync(d, { recursive: true, encoding: 'utf8' })) {
      const chemin = join(d, f);
      if (statSync(chemin).isFile()) marqueDe.set(relative(cwd, chemin), d);
    }
  const styles = new Set(style.flatMap((m) => globSync(m, { cwd, exclude: (f) => f.includes('node_modules') })).map((f) => relative(cwd, resolve(cwd, f))));
  for (const f of new Set([...marqueDe.keys(), ...styles])) empreintes[f] = createHash('sha1').update(readFileSync(join(cwd, f))).digest('hex');
  return { empreintes, marqueDe, styles };
}

/** Les fichiers dont l'empreinte a changé ou qui sont neufs ; un fichier retiré n'est pas relu. @param {Empreintes} avant @param {Empreintes} apres */
const changes = (avant, apres) => Object.keys(apres).filter((f) => avant[f] !== apres[f]).sort();

/**
 * Relit des fichiers du périmètre : leurs marques entières, leur style.
 * @param {string} cwd @param {string[]} fichiers @param {{ marqueDe: Map<string, string>, styles: Set<string> }} p
 */
async function relireFichiers(cwd, fichiers, p) {
  /** @type {import('../report/verifier.js').Echec[]} */
  const echecs = [];
  for (const d of new Set(fichiers.flatMap((f) => (p.marqueDe.has(f) ? [/** @type {string} */ (p.marqueDe.get(f))] : [])))) echecs.push(...echecsDeMarque(d, cwd));
  const styles = fichiers.filter((f) => p.styles.has(f));
  if (styles.length) {
    // Stylelint ne se charge que si un fichier de style a changé : un appel sans écriture coûte le démarrage de Node.
    const { default: stylelint } = await import('stylelint');
    const { results } = await stylelint.lint({ files: styles.map((f) => join(cwd, f)), configFile: CONFIG });
    echecs.push(...echecsDeStyle(results, cwd));
  }
  return echecs;
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
    throw new Error(`entrée de hook attendue sur l'entrée standard (Claude Code, SessionStart, PostToolUse ou Stop, JSON) ; pour poser les hooks : --poser ; usage : ${USAGE}`);
  }
  const cwd = typeof entree?.cwd === 'string' ? entree.cwd : process.cwd();
  const evenement = typeof entree?.hook_event_name === 'string' ? entree.hook_event_name : 'PostToolUse';
  const session = String(entree?.session_id ?? 'sans-session').replace(/[^\w.-]/g, '-');
  const memoire = join(tmpdir(), 'ds-lab-relecteur', session);
  mkdirSync(memoire, { recursive: true });
  /** @param {string} nom @returns {Empreintes | null} */
  const lire = (nom) => (existsSync(join(memoire, nom)) ? JSON.parse(readFileSync(join(memoire, nom), 'utf8')) : null);
  /** @param {string} nom @param {Empreintes} e */
  const ecrire = (nom, e) => {
    writeFileSync(join(memoire, `${nom}.tmp`), JSON.stringify(e));
    renameSync(join(memoire, `${nom}.tmp`), join(memoire, nom));
  };
  /** @param {Record<string, unknown>} l */
  const noter = (l) => appendFileSync(join(memoire, 'journal.jsonl'), `${JSON.stringify({ heure: new Date().toISOString(), evenement, outil: entree?.tool_name ?? null, ...l })}\n`);

  const p = perimetre(cwd, values.marques, values.style);
  if (evenement === 'SessionStart') {
    const garder = ['resume', 'compact'].includes(entree?.source) && lire('depart.json');
    if (!garder) ecrire('depart.json', p.empreintes);
    ecrire('dernier.json', p.empreintes);
    noter({ source: entree?.source ?? null, fichiers: Object.keys(p.empreintes).length, relus: [], echecs: 0, code: 0 });
    return 0;
  }

  if (evenement === 'Stop') {
    const depart = lire('depart.json');
    const relus = depart ? changes(depart, p.empreintes) : [];
    const echecs = await relireFichiers(cwd, relus, p);
    const relance = entree?.stop_hook_active === true;
    if (!echecs.length) {
      noter({ relus, echecs: 0, code: 0, ...(depart ? {} : { note: 'aucune empreinte de départ' }) });
      return 0;
    }
    const lignes = blocs(echecs).flatMap((b) => b.lignes);
    if (relance) {
      // Une seule relance : l'agent a déjà été renvoyé une fois ; l'humain lit ce qui reste.
      noter({ relus, echecs: echecs.length, code: 0, relanceRefusee: true });
      console.log(JSON.stringify({ systemMessage: [`relecteur : fin du tour, ${echecs.length} échec(s) restent dans ${relus.join(', ')}`, ...lignes].join('\n') }));
      return 0;
    }
    noter({ relus, echecs: echecs.length, code: 2 });
    console.error([`relecteur : fin du tour, changés depuis le départ de la session : ${relus.join(', ')}`, ...lignes, 'Corrige ces échecs, puis finis.'].join('\n'));
    return 2;
  }

  const dernier = lire('dernier.json');
  ecrire('dernier.json', p.empreintes);
  /** @type {string[]} */
  let relus;
  if (dernier) relus = changes(dernier, p.empreintes);
  else {
    // Pas d'empreintes : la session a commencé avant la pose, ou sans SessionStart. Le fichier nommé par l'outil seul.
    const fichier = entree?.tool_input?.file_path;
    const rel = typeof fichier === 'string' ? relative(cwd, isAbsolute(fichier) ? fichier : resolve(cwd, fichier)) : null;
    relus = rel && !rel.startsWith('..') && rel in p.empreintes ? [rel] : [];
    if (!lire('depart.json')) ecrire('depart.json', p.empreintes);
  }
  const echecs = await relireFichiers(cwd, relus, p);
  noter({ relus, echecs: echecs.length, code: echecs.length ? 2 : 0, ...(dernier ? {} : { note: 'aucune empreinte : fichier de tool_input.file_path seul' }) });
  if (!echecs.length) return 0;
  console.error([`relecteur : ${relus.join(', ')}`, ...blocs(echecs).flatMap((b) => b.lignes)].join('\n'));
  return 2;
});

/**
 * La section « Carnet » remplacée par le bloc, ou ajoutée à la fin : jusqu'au titre de niveau 2 suivant.
 * @param {string} texte
 */
function avecLeCarnet(texte) {
  const lignes = texte.split('\n');
  const debut = lignes.findIndex((l) => l === '## Carnet');
  if (debut < 0) return texte ? `${texte.trimEnd()}\n\n${CARNET_BLOC}` : CARNET_BLOC;
  const fin = lignes.findIndex((l, i) => i > debut && l.startsWith('## '));
  const apres = fin < 0 ? '' : `\n${lignes.slice(fin).join('\n')}`;
  const avant = debut ? `${lignes.slice(0, debut).join('\n')}\n` : '';
  return `${avant}${CARNET_BLOC}${apres}`;
}

/**
 * Pose le relecteur et le carnet dans le dépôt de l'équipe.
 * @param {string} depot @param {string} marques @param {string[]} style
 */
function poser(depot, marques, style) {
  const chemin = join(depot, '.claude', 'settings.json');
  const reglages = existsSync(chemin) ? JSON.parse(readFileSync(chemin, 'utf8')) : {};
  const commande = [{ type: 'command', command: commandeDuHook(marques, style) }];
  reglages.hooks ??= {};
  /** @type {[string, object][]} */
  const hooks = [
    ['SessionStart', { hooks: commande }],
    ['PostToolUse', { matcher: OUTILS, hooks: commande }],
    ['Stop', { hooks: commande }],
  ];
  for (const [evenement, hook] of hooks) {
    const autres = (reglages.hooks[evenement] ?? []).filter((/** @type {any} */ h) => !JSON.stringify(h).includes('src/cli/relecteur.js'));
    reglages.hooks[evenement] = [...autres, hook];
  }
  mkdirSync(join(depot, '.claude'), { recursive: true });
  writeFileSync(chemin, `${JSON.stringify(reglages, null, 2)}\n`);
  const claude = join(depot, 'CLAUDE.md');
  const avant = existsSync(claude) ? readFileSync(claude, 'utf8') : '';
  const apres = avecLeCarnet(avant);
  if (apres !== avant) writeFileSync(claude, apres);
  if (!existsSync(join(depot, 'carnet.md'))) writeFileSync(join(depot, 'carnet.md'), CARNET);
  console.log(`relecteur : posé dans .claude/settings.json (hooks SessionStart, PostToolUse sur ${OUTILS.split('|').join(', ')}, Stop) ; carnet dans CLAUDE.md et carnet.md`);
  return 0;
}
