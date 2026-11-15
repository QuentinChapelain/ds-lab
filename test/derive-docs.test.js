// @ts-check
/**
 * Dérive de la documentation : chaque commande « npm run … » (et « npm test ») et chaque chemin
 * de fichier cités dans CLAUDE.md, README.md, ARCHITECTURE.md, KNOWN_ISSUES.md et docs/**.md
 * existent vraiment.
 *
 * Candidats chemins : le contenu de chaque code en ligne (`…`), la cible de chaque lien ](…)
 * (sans ancre), chaque import @… en début de ligne, et chaque mot d'un bloc de code ```.
 * Un candidat est un chemin s'il s'écrit en segments [lettres, chiffres, . _ - @] séparés par « / »
 * (un « / » final désigne un dossier), et s'il contient un « / » ou si son premier segment existe
 * à la racine du dépôt. Ainsi `revue.html`, sortie de l'outil, n'est pas un chemin ; `scr/x.js`
 * en est un, et manque. Exclus : local/ et .auth/ (jamais versionnés), adresses, espaces, < > *,
 * et les noms de paquets npm (`@portee/nom`) ; un import @… n'est reconnu qu'en début de ligne.
 * Ce test ne lit jamais local/ ni .auth/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

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
 * Chemins cités dans un texte Markdown.
 * @param {string} text
 * @param {Set<string>} racine noms des entrées de la racine du dépôt
 */
export function chemins(text, racine) {
  /** @type {string[]} */
  const cands = [];
  const sansBlocs = text.replace(/^```[^\n]*\n([\s\S]*?)^```/gm, (_, bloc) => {
    cands.push(...bloc.split(/\s+/));
    return '';
  });
  for (const m of sansBlocs.matchAll(/`([^`\n]+)`/g)) cands.push(m[1]);
  for (const m of sansBlocs.matchAll(/\]\(([^)\s]+)\)/g)) cands.push(m[1].replace(/#.*$/, ''));
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
    .map((f) => join(dir, f));

test('l\'extracteur trouve les commandes et les chemins cités (attendu écrit à la main)', () => {
  const texte = [
    'Lancer npm run contraste, puis npm test ; npm run inexistante n\'existe pas.',
    'Voir `src/cli/typo.js` et [la carte](ARCHITECTURE.md#commandes), `revue.html`, `local/audits/x.json`,',
    '`scr/inexistant.js`, `--sources <fichier>`, `@projectwallace/css-analyzer`, `ecart.section`, `$extensions["ds-lab.etroit"]`, [site](https://example.com/a/b).',
    '@docs/regles.md',
    '```',
    'tokens/orbe-cafe/  →  src/tokens/  npm run typo',
    '```',
  ].join('\n');
  const racine = new Set(['src', 'docs', 'tokens', 'ARCHITECTURE.md', 'README.md']);
  assert.deepEqual(commandes(texte).sort(), ['contraste', 'inexistante', 'test', 'typo']);
  assert.deepEqual(chemins(texte, racine).sort(), [
    'ARCHITECTURE.md',
    'docs/regles.md',
    'scr/inexistant.js',
    'src/cli/typo.js',
    'src/tokens/',
    'tokens/orbe-cafe/',
  ]);
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

test('chaque chemin cité dans la documentation existe dans le dépôt', () => {
  const racine = new Set(readdirSync(ROOT).filter((e) => !NON_VERSIONNES.includes(e) && e !== 'node_modules' && e !== '.git'));
  /** @type {string[]} */
  const absents = [];
  for (const f of [...DOCS, ...markdowns('docs')].filter((f) => existsSync(join(ROOT, f))))
    for (const c of chemins(readFileSync(join(ROOT, f), 'utf8'), racine)) {
      const p = join(ROOT, c);
      const ok = c.endsWith('/') ? existsSync(p) && statSync(p).isDirectory() : existsSync(p);
      if (!ok) absents.push(`${f} : ${c}`);
    }
  assert.deepEqual(absents, []);
});
