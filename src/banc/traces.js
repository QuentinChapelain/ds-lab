// @ts-check
/**
 * D71 : ce que le relevé d'un passage lit de plus dans ses traces, sans rien lancer. La session qui porte le brief, quand
 * le dossier du journal en a plusieurs ; les outils employés pour écrire, et les commandes du shell qui ont l'air
 * d'écrire (des signaux, à lire) ; les chemins de /tmp nommés ; les appels du shell qui nomment le carnet ; les heures
 * du carnet face à la session et à ces appels ; le journal du relecteur et ses pannes, y compris celles que seul Claude
 * Code a vues ; les heures de la session, sans les notifications de tâches de fond ; ce que la session a chargé, face à
 * la pose.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';

/** @typedef {{ t: number, fin: number | null, name: string, input: any }} Appel un appel d'outil du journal : son heure, celle de son résultat */

/** Les lignes JSON d'un fichier, sans les illisibles. @param {string} fichier @returns {any[]} */
function lignesJson(fichier) {
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

/**
 * La notification d'une tâche de fond, que Claude Code range parmi les messages de l'humain : elle ne vient pas de lui.
 * @param {any} m
 */
function estNotification(m) {
  if (m.origin?.kind === 'task-notification') return true;
  const c = m.message?.content;
  const texte = typeof c === 'string' ? c : Array.isArray(c) ? c.find((x) => x.type === 'text')?.text : undefined;
  return typeof texte === 'string' && texte.trimStart().startsWith('<task-notification>');
}

/** Le texte d'un message de l'humain (ni le résultat d'un outil, ni une notification), ou null. @param {any} m */
function texteHumain(m) {
  if (m.type !== 'user' || m.isMeta || estNotification(m)) return null;
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

/** Les appels d'outils des journaux, dans l'ordre, avec l'heure de leur résultat. @param {string[]} journaux @returns {Appel[]} */
export function appels(journaux) {
  const messages = journaux.flatMap((j) => lignesJson(j));
  /** @type {Map<string, number>} identifiant de l'appel → heure de son résultat */
  const resultats = new Map();
  for (const m of messages)
    if (m.type === 'user' && Array.isArray(m.message?.content))
      for (const c of m.message.content) if (c.type === 'tool_result' && c.tool_use_id && Date.parse(m.timestamp ?? '')) resultats.set(c.tool_use_id, Date.parse(m.timestamp));
  return messages
    .filter((m) => m.type === 'assistant' && Array.isArray(m.message?.content))
    .flatMap((m) =>
      m.message.content
        .filter((/** @type {any} */ c) => c.type === 'tool_use' && c.input)
        .map((/** @type {any} */ c) => ({ t: Date.parse(m.timestamp ?? '') || 0, fin: resultats.get(c.id) ?? null, name: c.name, input: c.input })),
    )
    .sort((a, b) => a.t - b.t);
}

/** Le document d'une commande (<<EOF … EOF) retiré : ce qu'il contient n'est pas la commande. @param {string} c */
const sansDocument = (c) => c.replace(/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?(\n\s*\2(?=\s|$)|$)/g, '$3\n');

/** Un mot de commande sans ses guillemets. @param {string} m */
const nu = (m) => m.replace(/^['"]|['"]$/g, '');

/**
 * Les chaînes entre guillemets vidées, sauf celle qui suit un > : c'est sa cible. Un > dans un argument (une question du
 * carnet, une expression de sed) n'est pas une redirection.
 * @param {string} c
 */
const sansChaines = (c) => c.replace(/(>>?\s*)?('[^']*'|"(?:[^"\\]|\\.)*")/g, (tout, fleche) => (fleche ? tout : "''"));

/**
 * Les signaux d'écriture d'une commande du shell : redirection vers un fichier, tee, sed ou perl en place, cp, mv, un
 * interpréteur lancé (python, node, perl, ruby) avec un script qui ouvre en écriture, document compris ; rien du
 * document d'un cat ; ni une flèche (=>, ->) ni 2>&1. La cible lue, ou null :
 * à lire, pas un verdict.
 * @param {string} commande @returns {{ signe: string, cible: string | null }[]}
 */
function signauxDuShell(commande) {
  const c = sansDocument(commande);
  const nue = sansChaines(c);
  /** @type {{ signe: string, cible: string | null }[]} */
  const r = [];
  for (const m of nue.matchAll(/(?:^|[^\d&<>=-])(>>?)\s*([^\s;&|<>()]+)/g)) if (!/^&|^\/dev\//.test(m[2])) r.push({ signe: m[1], cible: nu(m[2]) });
  for (const m of nue.matchAll(/\btee\s+(?:-a\s+)?([^\s;&|<>()]+)/g)) r.push({ signe: 'tee', cible: nu(m[1]) });
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
  for (const m of nue.matchAll(/\b(cp|mv)\s+(?:-\w+\s+)*[^\s;&|<>()]+\s+([^\s;&|<>()]+)/g)) r.push({ signe: m[1], cible: nu(m[2]) });
  if (/\b(python3?|node|perl|ruby)\b/.test(c) && /open\([^)]*['"][wa]\+?['"]|write_text\(|writeFileSync\(|\.write\(/.test(commande)) r.push({ signe: 'script', cible: null });
  return r;
}

/** Sans résultat lu, un appel du carnet est tenu pour durer au plus ce temps. */
const SANS_RESULTAT_MS = 120_000;

/**
 * Les outils qui écrivent, d'après les appels : par outil, les fichiers des outils d'édition, les signaux du shell ; les
 * chemins de /tmp nommés ; les appels du shell qui nomment le carnet (un appel, même si une fonction ou une variable le
 * lance plusieurs fois), de la seconde de l'appel à celle de son résultat ; la première écriture vue de chaque nom de
 * fichier.
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
  /** @type {{ debut: number, fin: number }[]} */
  const appelsDuCarnet = [];
  const vue = (/** @type {string | null} */ f, /** @type {number} */ t) => {
    if (f && !(basename(f) in premiere)) premiere[basename(f)] = t;
  };
  for (const { t, fin, name, input } of a) {
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
      if (/carnet\.js/.test(commande)) appelsDuCarnet.push({ debut: Math.floor(t / 1000) * 1000, fin: (fin ?? t + SANS_RESULTAT_MS) + 1000 });
      for (const s of signauxDuShell(commande)) {
        shell.push({ heure, ...s, commande: commande.split('\n')[0].slice(0, 160) });
        vue(s.cible, t);
      }
    }
  }
  return { parOutil, edition, shell, tmp: [...tmp].sort(), carnet: appelsDuCarnet.length, appelsDuCarnet, premiere };
}

/**
 * Les lignes du carnet face à la session : leur heure, dans la session ou hors d'elle, pendant un appel du shell qui
 * nomme la commande ou hors de tout appel, avant ou après la première écriture vue du fichier qu'elles nomment.
 * @param {string} texte @param {{ debut: number, fin: number } | null} session @param {Record<string, number>} premiere
 * @param {{ debut: number, fin: number }[]} appelsDuCarnet
 */
export function heuresDuCarnet(texte, session, premiere, appelsDuCarnet) {
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
      dansUnAppel: datee ? appelsDuCarnet.some((x) => t >= x.debut && t <= x.fin) : null,
      avantLaPremiereEcriture: datee && ecrit !== undefined ? t <= ecrit : null,
    };
  });
}

/**
 * Le journal du relecteur : appels par événement, retours en échec, pannes, relances refusées, fichiers changés par outil.
 * @param {string[]} fichiers les journal.jsonl du relecteur
 */
export function journalDuRelecteur(fichiers) {
  const l = fichiers.flatMap((f) => lignesJson(f));
  /** @type {Record<string, { appels: number, echecs: number, pannes: number }>} */
  const par = {};
  for (const x of l) {
    par[x.evenement] ??= { appels: 0, echecs: 0, pannes: 0 };
    par[x.evenement].appels++;
    if (x.panne) par[x.evenement].pannes++;
    else if (x.code === 2) par[x.evenement].echecs++;
  }
  return {
    fichiers: fichiers.length,
    parEvenement: par,
    relancesRefusees: l.filter((x) => x.relanceRefusee).length,
    changes: l.filter((x) => x.evenement === 'PostToolUse' && x.relus?.length).map((x) => ({ heure: x.heure, outil: x.outil, relus: x.relus, echecs: x.echecs })),
  };
}

/**
 * Les pannes du relecteur que seul Claude Code a vues : un hook en erreur (hook_blocking_error) dont la commande lance
 * relecteur.js et dont le message n'a aucune ligne « ✗ » ; un échec de contrôle en a toujours une.
 * @param {string[]} journaux les sessions du brief
 * @returns {{ heure: string, hook: string, message: string }[]}
 */
export function pannesVuesParClaudeCode(journaux) {
  return journaux
    .flatMap((j) => lignesJson(j))
    .flatMap((m) => {
      const a = m.attachment;
      if (a?.type !== 'hook_blocking_error') return [];
      const commande = String(a.blockingError?.command ?? '');
      if (!commande.includes('relecteur.js')) return [];
      const brut = String(a.blockingError?.blockingError ?? '');
      const message = brut.startsWith(`[${commande}]: `) ? brut.slice(commande.length + 4) : brut;
      if (message.split('\n').some((l) => l.startsWith('✗ '))) return [];
      return [{ heure: m.timestamp ?? '', hook: String(a.hookName ?? a.hookEvent ?? ''), message: message.split('\n')[0] }];
    });
}

/**
 * Les heures d'un passage, lues dans les sessions qui portent le brief : du brief au dernier message de l'agent ; une
 * attente va d'un message de l'agent au message suivant de l'humain (un texte, pas le résultat d'un outil). Les demandes
 * de permission ne sont ni des questions ni des attentes : elles restent dans le travail. Un message de l'humain après le
 * dernier de l'agent (/exit) n'est pas une attente. La notification d'une tâche de fond n'est ni de l'humain ni de
 * l'agent : elle est comptée à part. Les sessions écartées sont nommées, avec leurs heures (D71).
 * @param {string[]} journaux @param {{ fichier: string, debut: string | null, fin: string | null }[]} ecartees
 * @returns {{ texte: string, session: { debut: number, fin: number } | null }}
 */
export function heures(journaux, ecartees) {
  /** @type {{ t: number, qui: 'humain' | 'agent' }[]} */
  const messages = [];
  let notifications = 0;
  for (const m of journaux.flatMap((j) => lignesJson(j))) {
    if (!m.timestamp || m.isMeta) continue;
    const contenu = m.message?.content;
    if (m.type === 'user' && (typeof contenu === 'string' || (Array.isArray(contenu) && contenu.some((c) => c.type === 'text')))) {
      if (estNotification(m)) notifications++;
      else messages.push({ t: Date.parse(m.timestamp), qui: 'humain' });
    } else if (m.type === 'assistant') messages.push({ t: Date.parse(m.timestamp), qui: 'agent' });
  }
  messages.sort((a, b) => a.t - b.t);
  const debut = messages.find((m) => m.qui === 'humain');
  const fin = messages.findLast((m) => m.qui === 'agent');
  const autres = ecartees.length ? [`- Sessions écartées, sans le brief : ${ecartees.map((s) => `${s.fichier} (${s.debut} → ${s.fin})`).join(', ')}`] : [];
  if (!debut || !fin) return { texte: ['Heures : journal vide ou absent.', ...autres, ''].join('\n'), session: null };
  let attente = 0;
  for (let i = 1; i < messages.length; i++) if (messages[i].qui === 'humain' && messages[i - 1].qui === 'agent' && messages[i].t > debut.t && messages[i].t <= fin.t) attente += messages[i].t - messages[i - 1].t;
  const min = (/** @type {number} */ ms) => `${Math.round(ms / 60000)} min`;
  const texte = [
    '# Heures',
    '',
    `- Brief : ${new Date(debut.t).toISOString()}`,
    `- Dernier message de l'agent : ${new Date(fin.t).toISOString()}`,
    `- En tout : ${min(fin.t - debut.t)}`,
    `- L'agent attend l'humain : ${min(attente)}`,
    `- L'agent travaille : ${min(fin.t - debut.t - attente)}`,
    `- Notifications de tâches de fond, qui ne viennent pas de l'humain : ${notifications}`,
    ...autres,
    '',
    'La fin du passage est le message où l’agent dit avoir fini : à vérifier dans le journal.',
    '',
  ].join('\n');
  return { texte, session: { debut: debut.t, fin: fin.t } };
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
 *   relecteur: ReturnType<typeof journalDuRelecteur> | null, relecteurLieu: string | null, pannes: ReturnType<typeof pannesVuesParClaudeCode>, tmp: string[] }} r
 */
export function texteDesEcritures(r) {
  const liste = (/** @type {string[]} */ l) => (l.length ? l.join(', ') : 'aucun');
  const e = r.ecritures;
  const comptes = Object.entries(e.parOutil).sort(([x], [y]) => x.localeCompare(y)).map(([k, n]) => `${k} : ${n}`);
  const oui = (/** @type {boolean | null} */ b, /** @type {string} */ v, /** @type {string} */ f) => (b === null ? 'à lire' : b ? v : f);
  const hors = (/** @type {ReturnType<typeof heuresDuCarnet>} */ c) => c.filter((l) => !l.dansUnAppel).length;
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
          ...Object.entries(r.relecteur.parEvenement).map(([k, v]) => `- ${k} : ${v.appels} appel(s), ${v.echecs} retour(s) en échec, ${v.pannes} panne(s)`),
          `- Relances refusées à la fin du tour : ${r.relecteur.relancesRefusees}`,
          `- Fichiers du périmètre changés, par appel : ${r.relecteur.changes.length ? '' : 'aucun'}`,
          ...r.relecteur.changes.map((x) => `  - ${x.heure} ${x.outil} : ${x.relus.join(', ')} (${x.echecs} échec(s))`),
        ]
      : ['Aucun journal du relecteur : bras A, ou relecteur qui n’a pas tourné.']),
    `- Pannes vues par Claude Code (hook en erreur sans bloc de verifier) : ${r.pannes.length}`,
    ...r.pannes.map((x) => `  - ${x.heure} ${x.hook} : ${x.message}`),
    '',
    '## Les heures du carnet',
    '',
    ...(r.carnet
      ? [
          `- Lignes : ${r.carnet.length} ; appels du shell qui nomment carnet.js : ${e.carnet} ; lignes datées pendant l’un d’eux : ${r.carnet.filter((l) => l.dansUnAppel).length}${hors(r.carnet) ? ` ; ${hors(r.carnet)} ligne(s) hors de tout appel de carnet.js, à lire` : ''}`,
          ...r.carnet.map(
            (l) =>
              `  - ${l.heure || '(sans heure)'} : ${l.datee ? `${oui(l.dansLaSession, 'dans la session', 'hors de la session')} ; ${oui(l.avantLaPremiereEcriture, 'avant', 'après')} la première écriture vue de ${l.fichier || '—'}${l.dansUnAppel ? '' : ' ; hors de tout appel de carnet.js'}` : 'heure non datée par la commande'}`,
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
