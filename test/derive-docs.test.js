// @ts-check
/**
 * Dérive de la documentation : chaque commande « npm run … » (et « npm test ») et chaque chemin
 * de fichier cités dans CLAUDE.md, README.md, ARCHITECTURE.md, KNOWN_ISSUES.md et docs/**.md
 * existent vraiment ; une commande de l'atelier, « npm --prefix atelier run … », existe dans
 * atelier/package.json (D42). Les attendus (docs/attendus/) ne sont pas lus : ils décrivent le dépôt à leur date,
 * et un fichier renommé depuis y garde son ancien nom. Les décisions (docs/decisions.md) sont une histoire datée de même :
 * leurs commandes sont vérifiées, leurs chemins non (D57).
 *
 * Candidats chemins : le contenu de chaque code en ligne (`…`), la cible de chaque lien ](…)
 * (sans ancre), chaque import @… en début de ligne, et chaque mot d'un bloc de code ```. La cible d'un lien se lit
 * depuis le dossier du fichier qui la contient, comme sur GitHub (docs/composants/, D56) ; un code en ligne, un mot
 * d'un bloc de code et un import se lisent depuis la racine. Un lien qui sort du dépôt garde ses « .. », et manque.
 * Un candidat est un chemin s'il s'écrit en segments [lettres, chiffres, . _ - @] séparés par « / »
 * (un « / » final désigne un dossier), et s'il contient un « / » ou si son premier segment existe
 * à la racine du dépôt. Ainsi `revue.html`, sortie de l'outil, n'est pas un chemin ; `scr/x.js`
 * en est un, et manque. Exclus : local/ et .auth/ (jamais versionnés), adresses, espaces, < > *,
 * et les noms de paquets npm (`@portee/nom`) ; un import @… n'est reconnu qu'en début de ligne.
 * Un chemin existe s'il est dans le dépôt pour git : suivi, ou nouveau et non ignoré (git ls-files --cached --others
 * --exclude-standard). Un dossier ignoré présent sur le poste (node_modules/, version construite de l'atelier) n'existe
 * pas sur une machine neuve : il ne compte pas, sur le poste comme en CI.
 * Ce test ne lit jamais local/ ni .auth/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, posix, sep } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DOCS = ['CLAUDE.md', 'README.md', 'ARCHITECTURE.md', 'KNOWN_ISSUES.md'];
const NON_VERSIONNES = ['local', '.auth'];
const SEGMENTS = /^[\w.@-]+(\/[\w.@-]+)*\/?$/;

/**
 * Commandes npm citées : noms de scripts.
 * @param {string} text
 */
export function commandes(text) {
  const out = [...text.matchAll(/\bnpm run ([a-z][\w:-]*)/g)].map((m) => m[1]);
  if (/\bnpm test\b/.test(text)) out.push('test');
  return [...new Set(out)];
}

/**
 * Commandes de l'atelier citées : « npm --prefix atelier run <script> ».
 * @param {string} text
 */
export function commandesAtelier(text) {
  return [...new Set([...text.matchAll(/\bnpm --prefix atelier run ([a-z][\w:-]*)/g)].map((m) => m[1]))];
}

/**
 * Chemins cités dans un texte Markdown.
 * @param {string} text
 * @param {Set<string>} racine noms des entrées de la racine du dépôt
 * @param {string} [dossier] dossier du fichier, relatif à la racine, en « / » : '' pour un fichier de la racine
 */
export function chemins(text, racine, dossier = '') {
  /** @type {string[]} */
  const cands = [];
  const sansBlocs = text.replace(/^```[^\n]*\n([\s\S]*?)^```/gm, (_, bloc) => {
    cands.push(...bloc.split(/\s+/));
    return '';
  });
  for (const m of sansBlocs.matchAll(/`([^`\n]+)`/g)) cands.push(m[1]);
  for (const m of sansBlocs.matchAll(/\]\(([^)\s]+)\)/g)) {
    const cible = m[1].replace(/#.*$/, '');
    cands.push(!cible || cible.includes('://') ? cible : posix.normalize(posix.join(dossier, cible)));
  }
  for (const m of sansBlocs.matchAll(/^@(\S+)/gm)) cands.push(m[1]);
  const out = cands
    .map((c) => c.replace(/[.,;:]+$/, ''))
    .filter((c) => c && !c.includes('://') && SEGMENTS.test(c) && /[a-z]/i.test(c))
    .filter((c) => !c.startsWith('-') && !c.startsWith('@') && !NON_VERSIONNES.includes(c.split('/')[0]))
    .filter((c) => c.includes('/') || racine.has(c));
  return [...new Set(out)];
}

/** @param {string} dir */
const markdowns = (dir) =>
  readdirSync(join(ROOT, dir), { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(dir, f))
    .filter((f) => !f.startsWith(join('docs', 'attendus') + '/'));

test('l\'extracteur trouve les commandes et les chemins cités (attendu écrit à la main)', () => {
  const texte = [
    'Lancer npm run contraste, puis npm test ; npm run inexistante n\'existe pas.',
    'Voir `src/cli/typo.js` et [la carte](ARCHITECTURE.md#commandes), `revue.html`, `local/audits/x.json`,',
    '`scr/inexistant.js`, `--sources <fichier>`, `@projectwallace/css-analyzer`, `gap.section`, `$extensions["ds-lab.etroit"]`, [site](https://example.com/a/b).',
    '@docs/regles.md',
    '```',
    'tokens/orbe-cafe/  →  src/tokens/  npm run typo',
    '```',
  ].join('\n');
  const racine = new Set(['src', 'docs', 'tokens', 'ARCHITECTURE.md', 'README.md']);
  assert.deepEqual(commandes(texte).sort(), ['contraste', 'inexistante', 'test', 'typo']);
  assert.deepEqual(commandesAtelier('npm --prefix atelier ci, puis npm --prefix atelier run dev ; npm run build'), ['dev']);
  assert.deepEqual(chemins(texte, racine).sort(), [
    'ARCHITECTURE.md',
    'docs/regles.md',
    'scr/inexistant.js',
    'src/cli/typo.js',
    'src/tokens/',
    'tokens/orbe-cafe/',
  ]);
});

test('une cible de lien se lit depuis le dossier du fichier, un code en ligne depuis la racine (attendu écrit à la main)', () => {
  const texte = [
    'Voir [le composant](../../atelier/composants/DsTag.vue), [la fiche](tag.md#props) et [dehors](../../../x).',
    'Le fichier `atelier/composants/DsTag.vue`, et la commande npm --prefix atelier run fiches.',
  ].join('\n');
  const racine = new Set(['atelier', 'docs']);
  assert.deepEqual(chemins(texte, racine, 'docs/composants').sort(), ['../x', 'atelier/composants/DsTag.vue', 'docs/composants/tag.md']);
  assert.deepEqual(chemins('[a](ARCHITECTURE.md#x) et `src/a.js`', new Set(['ARCHITECTURE.md', 'src'])).sort(), ['ARCHITECTURE.md', 'src/a.js']);
});

test('les documents du dépôt existent', () => {
  const manquants = [...DOCS, 'docs/regles.md', 'docs/decisions.md', 'docs/attendus/LISEZMOI.md'].filter((f) => !existsSync(join(ROOT, f)));
  assert.deepEqual(manquants, []);
});

test('chaque commande npm citée dans la documentation existe dans package.json', () => {
  const scripts = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts;
  /** @type {string[]} */
  const absentes = [];
  for (const f of [...DOCS, ...markdowns('docs')].filter((f) => existsSync(join(ROOT, f))))
    for (const c of commandes(readFileSync(join(ROOT, f), 'utf8'))) if (!(c in scripts)) absentes.push(`${f} : npm run ${c}`);
  assert.deepEqual(absentes, []);
});

test('chaque commande de l\'atelier citée dans la documentation existe dans atelier/package.json', () => {
  const scripts = JSON.parse(readFileSync(join(ROOT, 'atelier', 'package.json'), 'utf8')).scripts;
  /** @type {string[]} */
  const absentes = [];
  let vues = 0;
  for (const f of [...DOCS, ...markdowns('docs')].filter((f) => existsSync(join(ROOT, f))))
    for (const c of commandesAtelier(readFileSync(join(ROOT, f), 'utf8'))) {
      vues++;
      if (!(c in scripts)) absentes.push(`${f} : npm --prefix atelier run ${c}`);
    }
  assert.ok(vues > 0, 'aucune commande de l\'atelier citée');
  assert.deepEqual(absentes, []);
});

/** Fichiers du dépôt pour git, et leurs dossiers (avec « / » final). */
function depot() {
  const fichiers = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const dossiers = new Set(fichiers.flatMap((f) => f.split('/').slice(0, -1).map((_, i, a) => `${a.slice(0, i + 1).join('/')}/`)));
  return { fichiers: new Set(fichiers), dossiers };
}

test('chaque chemin cité dans la documentation existe dans le dépôt, hors décisions', () => {
  const racine = new Set(readdirSync(ROOT).filter((e) => !NON_VERSIONNES.includes(e) && e !== 'node_modules' && e !== '.git'));
  const { fichiers, dossiers } = depot();
  /** @type {string[]} */
  const absents = [];
  for (const f of [...DOCS, ...markdowns('docs')].filter((f) => existsSync(join(ROOT, f)) && f !== join('docs', 'decisions.md')))
    for (const c of chemins(readFileSync(join(ROOT, f), 'utf8'), racine, posix.dirname(f.split(sep).join('/')).replace(/^\.$/, ''))) {
      const ok = c.endsWith('/') ? dossiers.has(c) : fichiers.has(c) || dossiers.has(`${c}/`);
      if (!ok) absents.push(`${f} : ${c}`);
    }
  assert.deepEqual(absents, []);
});
