// @ts-check
/**
 * D71 : ce que le relevé d'un passage lit de plus dans ses traces, sans rien lancer. La session qui porte le brief, quand
 * le dossier du journal en a plusieurs ; les outils employés pour écrire, et les commandes du shell qui ont l'air
 * d'écrire (des signaux, à lire) ; les chemins de /tmp nommés ; les appels du carnet ; les heures du carnet face à la
 * session ; le journal du relecteur ; ce que la session a chargé, face à la pose.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';

/** @typedef {{ t: number, name: string, input: any }} Appel un appel d'outil du journal, à son heure */

/** Les lignes JSON d'un fichier, sans les illisibles. @param {string} fichier @returns {any[]} */
export function lignesJson(fichier) {
  return readFileSync(fichier, 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });
}

/** Le texte d'un message de l'humain (pas le résultat d'un outil), ou null. @param {any} m */
function texteHumain(m) {
  if (m.type !== 'user' || m.isMeta) return null;
  const c = m.message?.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c) && c.some((x) => x.type === 'text')) return c.filter((x) => x.type === 'text').map((x) => x.text).join('\n');
  return null;
}

/**
 * Les sessions du dossier du journal qui portent le brief : un message de l'humain contient sa première ligne. Aucune :
 * toutes, et c'est dit.
 * @param {string[]} journaux @param {string} brief le texte de brief.txt
 * @returns {{ retenues: string[], ecartees: { fichier: string, debut: string | null, fin: string | null }[], note: string | null }}
 */
export function sessionsDuBrief(journaux, brief) {
  const premiere = brief.split('\n').find((l) => l.trim())?.trim() ?? '';
  const porte = (/** @type {string} */ j) => Boolean(premiere) && lignesJson(j).some((m) => texteHumain(m)?.includes(premiere));
  const retenues = journaux.filter(porte);
  if (!retenues.length) return { retenues: journaux, ecartees: [], note: journaux.length ? 'aucune session ne porte la première ligne du brief : toutes sont prises' : null };
  const ecartees = journaux
    .filter((j) => !retenues.includes(j))
    .map((j) => {
      const t = lignesJson(j).flatMap((m) => (m.timestamp ? [m.timestamp] : [])).sort();
      return { fichier: basename(j), debut: t[0] ?? null, fin: t.at(-1) ?? null };
    });
  return { retenues, ecartees, note: null };
}

/** Les appels d'outils des journaux, dans l'ordre. @param {string[]} journaux @returns {Appel[]} */
export function appels(journaux) {
  return journaux
    .flatMap((j) => lignesJson(j))
    .filter((m) => m.type === 'assistant' && Array.isArray(m.message?.content))
    .flatMap((m) => m.message.content.filter((/** @type {any} */ c) => c.type === 'tool_use' && c.input).map((/** @type {any} */ c) => ({ t: Date.parse(m.timestamp ?? '') || 0, name: c.name, input: c.input })))
    .sort((a, b) => a.t - b.t);
}

/** Le document d'une commande (<<EOF … EOF) retiré : ce qu'il contient n'est pas la commande. @param {string} c */
const sansDocument = (c) => c.replace(/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?(\n\s*\2(?=\s|$)|$)/g, '$3\n');

/** Un mot de commande sans ses guillemets. @param {string} m */
const nu = (m) => m.replace(/^['"]|['"]$/g, '');

/**
 * Les signaux d'écriture d'une commande du shell : redirection vers un fichier, tee, sed ou perl en place, cp, mv, un
 * interpréteur lancé (python, node, perl, ruby) avec un script qui ouvre en écriture, document compris ; rien du
 * document d'un cat ; ni une flèche (=>, ->) ni 2>&1. La cible lue, ou null :
 * à lire, pas un verdict.
 * @param {string} commande @returns {{ signe: string, cible: string | null }[]}
 */
function signauxDuShell(commande) {
  const c = sansDocument(commande);
  /** @type {{ signe: string, cible: string | null }[]} */
  const r = [];
  for (const m of c.matchAll(/(?:^|[^\d&<>=-])(>>?)\s*([^\s;&|<>()]+)/g)) if (!/^&|^\/dev\//.test(m[2])) r.push({ signe: m[1], cible: nu(m[2]) });
  for (const m of c.matchAll(/\btee\s+(?:-a\s+)?([^\s;&|<>()]+)/g)) r.push({ signe: 'tee', cible: nu(m[1]) });
  for (const m of c.matchAll(/\b(sed|perl)\s+(?:-\w*\s+)*-i\b/g)) {
    // Le dernier mot avant la fin de la commande, guillemets compris : l'expression peut porter des espaces.
    /** @type {string[]} */
    const mots = [];
    for (const [mot] of c.slice((m.index ?? 0) + m[0].length).matchAll(/(?:'[^']*'|"[^"]*"|[^\s;&|'"])+|[;&|\n]/g)) {
      if (/^[;&|\n]$/.test(mot)) break;
      mots.push(mot);
    }
    r.push({ signe: `${m[1]} -i`, cible: mots.length > 1 ? nu(/** @type {string} */ (mots.at(-1))) : null });
  }
  for (const m of c.matchAll(/\b(cp|mv)\s+(?:-\w+\s+)*[^\s;&|<>()]+\s+([^\s;&|<>()]+)/g)) r.push({ signe: m[1], cible: nu(m[2]) });
  if (/\b(python3?|node|perl|ruby)\b/.test(c) && /open\([^)]*['"][wa]\+?['"]|write_text\(|writeFileSync\(|\.write\(/.test(commande)) r.push({ signe: 'script', cible: null });
  return r;
}

/**
 * Les outils qui écrivent, d'après les appels : par outil, les fichiers des outils d'édition, les signaux du shell ; les
 * chemins de /tmp nommés ; les appels du carnet ; la première écriture vue de chaque nom de fichier.
 * @param {Appel[]} a
 */
export function ecritures(a) {
  /** @type {Record<string, number>} */
  const parOutil = {};
  /** @type {{ heure: string, outil: string, fichier: string }[]} */
  const edition = [];
  /** @type {{ heure: string, signe: string, cible: string | null, commande: string }[]} */
  const shell = [];
  /** @type {Set<string>} */
  const tmp = new Set();
  /** @type {Record<string, number>} nom de fichier → première écriture vue */
  const premiere = {};
  let carnet = 0;
  const vue = (/** @type {string | null} */ f, /** @type {number} */ t) => {
    if (f && !(basename(f) in premiere)) premiere[basename(f)] = t;
  };
  for (const { t, name, input } of a) {
    parOutil[name] = (parOutil[name] ?? 0) + 1;
    const heure = t ? new Date(t).toISOString() : '';
    const texte = JSON.stringify(input);
    for (const m of texte.matchAll(/(?:\/private)?\/tmp\/[^\s'"`;|&()<>,\\]+/g)) tmp.add(m[0]);
    if (['Edit', 'Write', 'NotebookEdit'].includes(name)) {
      const fichier = String(input.file_path ?? input.notebook_path ?? '');
      edition.push({ heure, outil: name, fichier });
      vue(fichier, t);
    } else if (name === 'Bash' || name === 'PowerShell') {
      const commande = String(input.command ?? '');
      carnet += (commande.match(/carnet\.js/g) ?? []).length;
      for (const s of signauxDuShell(commande)) {
        shell.push({ heure, ...s, commande: commande.split('\n')[0].slice(0, 160) });
        vue(s.cible, t);
      }
    }
  }
  return { parOutil, edition, shell, tmp: [...tmp].sort(), carnet, premiere };
}

/**
 * Les lignes du carnet face à la session : leur heure, dans la session ou hors d'elle, avant ou après la première
 * écriture vue du fichier qu'elles nomment ; les appels de la commande face au nombre de lignes.
 * @param {string} texte @param {{ debut: number, fin: number } | null} session @param {Record<string, number>} premiere
 */
export function heuresDuCarnet(texte, session, premiere) {
  const lignes = texte
    .split('\n')
    .filter((l) => l.startsWith('|') && !/^\|\s*-/.test(l) && !/^\|\s*Heure\s*\|/.test(l))
    .map((l) => l.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim()));
  return lignes.map(([heure = '', , , fichier = '']) => {
    const datee = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/.test(heure);
    const t = datee ? Date.parse(heure) : NaN;
    const ecrit = fichier && fichier !== '—' ? premiere[basename(fichier)] : undefined;
    return {
      heure,
      fichier,
      datee,
      dansLaSession: datee && session ? t >= session.debut && t <= session.fin : null,
      avantLaPremiereEcriture: datee && ecrit !== undefined ? t <= ecrit : null,
    };
  });
}

/**
 * Le journal du relecteur : appels par événement, retours en échec, relances refusées, fichiers changés par outil.
 * @param {string[]} fichiers les journal.jsonl du relecteur
 */
export function journalDuRelecteur(fichiers) {
  const l = fichiers.flatMap((f) => lignesJson(f));
  /** @type {Record<string, { appels: number, echecs: number }>} */
  const par = {};
  for (const x of l) {
    par[x.evenement] ??= { appels: 0, echecs: 0 };
    par[x.evenement].appels++;
    if (x.code === 2) par[x.evenement].echecs++;
  }
  return {
    fichiers: fichiers.length,
    parEvenement: par,
    relancesRefusees: l.filter((x) => x.relanceRefusee).length,
    changes: l.filter((x) => x.evenement === 'PostToolUse' && x.relus?.length).map((x) => ({ heure: x.heure, outil: x.outil, relus: x.relus, echecs: x.echecs })),
  };
}

/**
 * Ce que la session a chargé : le message d'ouverture d'un passage sans humain, sinon les attachements du journal de
 * Claude Code ; et ce qu'elle a de plus que la pose (le skill ds-lab, aucun serveur MCP).
 * @param {string} flux session.jsonl @param {string[]} journaux
 */
export function charge(flux, journaux) {
  const init = existsSync(flux) ? lignesJson(flux).find((m) => m?.type === 'system' && m?.subtype === 'init') : undefined;
  /** @type {{ source: string, skills: string[], serveursMcp: string[], outils: string[], outilsDifferes: string[], plugins: string[], agents: string[], model?: string, claude_code_version?: string, permissionMode?: string } | null} */
  let c = null;
  if (init) {
    const { model, tools = [], mcp_servers = [], skills = [], plugins = [], agents = [], permissionMode, claude_code_version } = init;
    c = {
      source: 'session.jsonl, message d’ouverture',
      model,
      claude_code_version,
      permissionMode,
      skills,
      serveursMcp: mcp_servers.map((/** @type {any} */ s) => (typeof s === 'string' ? s : s.name)),
      outils: tools,
      outilsDifferes: [],
      plugins: plugins.map((/** @type {any} */ p) => (typeof p === 'string' ? p : p.name)),
      agents,
    };
  } else if (journaux.length) {
    const a = journaux.flatMap((j) => lignesJson(j)).flatMap((m) => (m.attachment ? [m.attachment] : []));
    const noms = (/** @type {string} */ type, /** @type {string} */ champ) => [...new Set(a.filter((x) => x.type === type).flatMap((x) => x[champ] ?? []))];
    c = {
      source: 'journal de Claude Code, attachements',
      skills: noms('skill_listing', 'names'),
      serveursMcp: noms('mcp_instructions_delta', 'addedNames'),
      outils: [],
      outilsDifferes: noms('deferred_tools_delta', 'addedNames'),
      plugins: [],
      agents: noms('agent_listing_delta', 'addedTypes'),
    };
  }
  if (!c) return { note: 'ni message d’ouverture ni journal : rien à dire' };
  const mcp = [...c.outils, ...c.outilsDifferes].filter((o) => o.startsWith('mcp__'));
  return { ...c, enPlusDeLaPose: { skills: c.skills.filter((s) => s !== 'ds-lab'), serveursMcp: c.serveursMcp, outilsMcp: mcp, plugins: c.plugins } };
}

/**
 * Le texte de ecritures.md.
 * @param {{ sessions: ReturnType<typeof sessionsDuBrief>, ecritures: ReturnType<typeof ecritures>, carnet: ReturnType<typeof heuresDuCarnet> | null,
 *   relecteur: ReturnType<typeof journalDuRelecteur> | null, relecteurLieu: string | null, tmp: string[] }} r
 */
export function texteDesEcritures(r) {
  const liste = (/** @type {string[]} */ l) => (l.length ? l.join(', ') : 'aucun');
  const e = r.ecritures;
  const comptes = Object.entries(e.parOutil).sort(([x], [y]) => x.localeCompare(y)).map(([k, n]) => `${k} : ${n}`);
  const oui = (/** @type {boolean | null} */ b, /** @type {string} */ v, /** @type {string} */ f) => (b === null ? 'à lire' : b ? v : f);
  return [
    '# Ce que la session a écrit, et comment',
    '',
    'D’après les appels d’outils du journal. Les commandes du shell qui ont l’air d’écrire sont des signaux : à lire, pas un verdict.',
    '',
    `- Sessions prises : ${liste(r.sessions.retenues.map((f) => basename(f)))}${r.sessions.note ? ` (${r.sessions.note})` : ''}`,
    `- Sessions écartées, sans le brief : ${liste(r.sessions.ecartees.map((s) => `${s.fichier} (${s.debut} → ${s.fin})`))}`,
    `- Appels par outil : ${liste(comptes)}`,
    `- Outils d’édition (Edit, Write, NotebookEdit) : ${e.edition.length}`,
    ...e.edition.map((x) => `  - ${x.heure} ${x.outil} \`${x.fichier}\``),
    `- Signaux d’écriture du shell : ${e.shell.length}`,
    ...e.shell.map((x) => `  - ${x.heure} ${x.signe} → ${x.cible ? `\`${x.cible}\`` : 'cible à lire'} : \`${x.commande}\``),
    `- Chemins de /tmp nommés, hors du TMPDIR du passage : ${liste(e.tmp.map((t) => `\`${t}\``))}`,
    `- TMPDIR du passage, ce qu’il contient : ${liste(r.tmp)}`,
    '',
    '## Le relecteur',
    '',
    ...(r.relecteur
      ? [
          `Journal lu dans ${r.relecteurLieu} (${r.relecteur.fichiers} session(s)).`,
          '',
          ...Object.entries(r.relecteur.parEvenement).map(([k, v]) => `- ${k} : ${v.appels} appel(s), ${v.echecs} retour(s) en échec`),
          `- Relances refusées à la fin du tour : ${r.relecteur.relancesRefusees}`,
          `- Fichiers du périmètre changés, par appel : ${r.relecteur.changes.length ? '' : 'aucun'}`,
          ...r.relecteur.changes.map((x) => `  - ${x.heure} ${x.outil} : ${x.relus.join(', ')} (${x.echecs} échec(s))`),
        ]
      : ['Aucun journal du relecteur : bras A, ou relecteur qui n’a pas tourné.']),
    '',
    '## Les heures du carnet',
    '',
    ...(r.carnet
      ? [
          `- Lignes : ${r.carnet.length} ; appels de carnet.js dans le journal : ${e.carnet}${r.carnet.length > e.carnet ? ` ; ${r.carnet.length - e.carnet} ligne(s) de plus que d’appels, écrites à la main` : ''}`,
          ...r.carnet.map(
            (l) =>
              `  - ${l.heure || '(sans heure)'} : ${l.datee ? `${oui(l.dansLaSession, 'dans la session', 'hors de la session')} ; ${oui(l.avantLaPremiereEcriture, 'avant', 'après')} la première écriture vue de ${l.fichier || '—'}` : 'heure non datée par la commande'}`,
          ),
        ]
      : ['Pas de carnet.']),
    '',
  ].join('\n');
}

/** Le texte de charge.md. @param {ReturnType<typeof charge>} c */
export function texteDeLaCharge(c) {
  if (!('skills' in c)) return `# Ce que la session a chargé\n\n${c.note}\n`;
  const liste = (/** @type {string[]} */ l) => (l.length ? l.join(', ') : 'aucun');
  return [
    '# Ce que la session a chargé',
    '',
    `Lu dans : ${c.source}. La pose met le skill ds-lab, et aucun serveur MCP.`,
    '',
    `- Skills (${c.skills.length}) : ${liste(c.skills)}`,
    `- Serveurs MCP : ${liste(c.serveursMcp)}`,
    `- Plugins : ${liste(c.plugins)}`,
    `- Types d’agents : ${liste(c.agents)}`,
    `- Outils différés : ${c.outilsDifferes.length}`,
    '',
    '## En plus de la pose',
    '',
    `- Skills : ${liste(c.enPlusDeLaPose.skills)}`,
    `- Serveurs MCP : ${liste(c.enPlusDeLaPose.serveursMcp)}`,
    `- Outils de serveurs MCP : ${c.enPlusDeLaPose.outilsMcp.length}`,
    `- Plugins : ${liste(c.enPlusDeLaPose.plugins)}`,
    '',
  ].join('\n');
}
