// @ts-check
/**
 * D69 : ce qu'une session a lu, d'après son journal. Les fichiers nommés par un outil de lecture, une recherche ou une
 * commande, rangés par ce qu'ils sont dans l'app, et ceux de la copie de ds-lab ; les dossiers et les motifs, à part : on
 * ne sait pas ce qu'une commande en a montré. Un chemin nommé n'est pas un contenu lu : le relevé se lit.
 */
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';

/** @typedef {{ fichiers: Record<string, string[]>, dossiers: string[], skills: string[], appels: number }} Lectures */

/** Ce qu'est un fichier de l'app, par son chemin. */
const GROUPES = /** @type {[string, RegExp][]} */ ([
  ['skill', /^\.claude\/skills\//],
  ['fiches', /^docs\/composants\//],
  ['composants', /^src\/components\/ds\//],
  ['gabarit', /^(src\/gabarit\/|docs\/gabarit\.md$)/],
  ['pages', /^src\/pages\//],
  ['données', /^src\/data\//],
]);
/** Les groupes, dans l'ordre du relevé. */
const ORDRE = [...GROUPES.map(([g]) => g), 'reste de l’app', 'copie de ds-lab'];

/** Le document écrit dans une commande n'est pas une lecture. @param {string} c */
const sansDocument = (c) => c.replace(/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?(\n\s*\2(?=\s|$)|$)/g, '$3\n');

/** Les chemins d'une commande, avec le dossier où elle les lit. @param {string} commande @param {string} cwd */
function cheminsDeCommande(commande, cwd) {
  /** @type {{ brut: string, cwd: string }[]} */
  const r = [];
  let ici = cwd;
  const mots = sansDocument(commande).split(/[\s"'`;|&()<>=,]+/).filter(Boolean);
  mots.forEach((m, i) => {
    if (mots[i - 1] === 'cd') ici = resolve(ici, m);
    else if (m !== 'cd') r.push({ brut: m, cwd: ici });
  });
  return r;
}

/**
 * Ce qu'une session a lu.
 * @param {{ journaux: string[], app: string, copie: string, depart: string[] }} o
 *   journaux : les fichiers JSON Lines de la session ; depart : les fichiers de l'app au départ, en chemins relatifs
 * @returns {Lectures}
 */
export function lectures(o) {
  const connus = new Set(o.depart);
  const racines = (/** @type {string} */ d) => [...new Set([d, existsSync(d) ? realpathSync(d) : d])];
  /** @type {Record<string, Set<string>>} */
  const fichiers = Object.fromEntries(ORDRE.map((g) => [g, new Set()]));
  /** @type {Set<string>} */
  const dossiers = new Set();
  /** @type {Set<string>} */
  const skills = new Set();
  /** @type {Set<string>} */
  const vus = new Set();

  /** @param {string} brut @param {string} cwd */
  const noter = (brut, cwd) => {
    const c = brut.replace(/\$\{?DS_LAB\}?/g, o.copie).replace(/^~(?=\/|$)/, homedir());
    const absolu = isAbsolute(c) ? resolve(c) : resolve(cwd, c);
    const motif = /[*?[\]{}]/.test(c);
    /** @param {string} racine */
    const dans = (racine) => racines(racine).map((r) => relative(r, absolu)).find((x) => !x.startsWith('..') && !isAbsolute(x));
    const enCopie = dans(o.copie);
    if (enCopie !== undefined) {
      const chemin = join(o.copie, enCopie);
      if (motif || (existsSync(chemin) && statSync(chemin).isDirectory())) dossiers.add(`copie de ds-lab : ${enCopie || '.'}`);
      else if (existsSync(chemin)) fichiers['copie de ds-lab'].add(enCopie);
      return;
    }
    const enApp = dans(o.app);
    if (enApp === undefined) return;
    if (connus.has(enApp)) fichiers[GROUPES.find(([, r]) => r.test(enApp))?.[0] ?? 'reste de l’app'].add(enApp);
    else if (motif ? /\//.test(c) : enApp === '' || o.depart.some((f) => f.startsWith(`${enApp}/`))) dossiers.add(enApp || '.');
  };

  for (const j of o.journaux)
    for (const l of readFileSync(j, 'utf8').split('\n').filter(Boolean)) {
      let m;
      try {
        m = JSON.parse(l);
      } catch {
        continue;
      }
      if (m.type !== 'assistant' || !Array.isArray(m.message?.content)) continue;
      const cwd = m.cwd ?? o.app;
      for (const { type, id, name, input } of m.message.content) {
        if (type !== 'tool_use' || !input) continue;
        vus.add(id);
        if (name === 'Skill') skills.add(String(input.skill));
        else if (name === 'Read') noter(String(input.file_path), cwd);
        else if (name === 'Grep') noter(String(input.path ?? '.'), cwd);
        else if (name === 'Glob') noter(String(input.pattern), input.path ? resolve(cwd, input.path) : cwd);
        else if (name === 'Bash') for (const c of cheminsDeCommande(String(input.command), cwd)) noter(c.brut, c.cwd);
      }
    }
  return {
    fichiers: Object.fromEntries(ORDRE.map((g) => [g, [...fichiers[g]].sort()])),
    dossiers: [...dossiers].sort(),
    skills: [...skills].sort(),
    appels: vus.size,
  };
}

/** Les lectures, en Markdown. @param {Lectures} l */
export function texteDesLectures(l) {
  const liste = (/** @type {string[]} */ x) => (x.length ? x.join(', ') : 'aucun');
  return [
    '# Ce que la session a lu',
    '',
    l.appels ? `D’après ${l.appels} appels d’outils du journal : les chemins nommés, pas les contenus affichés. À lire.` : 'Aucun appel d’outil dans le journal : rien à dire.',
    '',
    `- Skills appelés : ${liste(l.skills)}`,
    ...Object.entries(l.fichiers).map(([g, f]) => `- ${g[0].toUpperCase()}${g.slice(1)} : ${liste(f)}`),
    `- Dossiers et motifs nommés, à lire : ${liste(l.dossiers)}`,
    '',
  ].join('\n');
}
