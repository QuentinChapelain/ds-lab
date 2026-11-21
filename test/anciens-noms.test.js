// @ts-check
/**
 * Table des anciens noms (docs/anciens-noms.json, docs/attendus/noms-en-anglais.md) : les noms français des tokens et
 * des noms publics du thème, et leurs noms anglais. Les décisions et les attendus d'avant gardent les anciens noms ;
 * la table les relie. Attendus :
 *   N1 chaque nouveau nom existe : chemin de token dans une marque, variable dans jetons.css, variable ou couleur du
 *      thème dans vuetify.json ;
 *   N2 pas deux anciens noms pour un même nouveau, et aucun ancien nom n'est un nouveau nom ;
 *   N3 chaque chemin est la traduction mot à mot de l'ancien par la table des mots, sauf les exceptions ;
 *   N4 aucun ancien nom complet ne reste dans tokens/, src/, l'atelier, test/, README.md, ARCHITECTURE.md, CLAUDE.md,
 *      KNOWN_ISSUES.md et docs/ (hors attendus/, decisions.md et la table) ; les entrées de fixtures/ et la copie
 *      figée gardent les leurs ;
 *   N5 tokens/orbe-cafe/marque.tokens.json, traduit à rebours par la table (le nom d'échelle des descriptions
 *      compris), retrouve l'empreinte d'avant le renommage, c6717998… (test/saisie.test.js, S1).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { dossiersDeMarque } from '../src/tokens/resolver.js';
import { loadRoles, flattenTokens } from '../src/tokens/roles.js';
import { serialiser } from '../src/tokens/saisie.js';
import { TABLE, traducteur } from './helpers/anciens-noms.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const lire = (/** @type {string} */ f) => readFileSync(join(ROOT, f), 'utf8');
const esc = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MARQUES = dossiersDeMarque();

test('N1 chaque nouveau nom existe : token, variable CSS, variable et couleur du thème', () => {
  /** @type {Set<string>} */
  const chemins = new Set();
  /** @type {Set<string>} */
  const css = new Set();
  /** @type {Set<string>} */
  const variables = new Set();
  /** @type {Set<string>} */
  const couleurs = new Set();
  for (const d of MARQUES) {
    for (const mode of ['clair', 'sombre']) {
      const s = loadRoles(d, { mode });
      for (const f of [s.primitives, s.marque, s.semantique]) for (const k of flattenTokens(f).keys()) chemins.add(k);
    }
    for (const m of readFileSync(join(d, 'jetons.css'), 'utf8').matchAll(/(--[\w-]+):/g)) css.add(m[1]);
    for (const t of Object.values(JSON.parse(readFileSync(join(d, 'vuetify.json'), 'utf8')).themes)) {
      for (const k of Object.keys(/** @type {any} */ (t).variables)) variables.add(k);
      for (const k of Object.keys(/** @type {any} */ (t).colors)) couleurs.add(k);
    }
  }
  for (const n of Object.values(TABLE.tokens)) {
    assert.ok(chemins.has(n), `token : ${n}`);
    const v = `--${n.replace(/\./g, '-')}`;
    assert.ok(css.has(v) || css.has(`${v}-font-family`), `variable CSS : ${v}`);
  }
  for (const n of Object.values(TABLE.variablesDuTheme)) assert.ok(variables.has(n), `variable du thème : ${n}`);
  for (const n of Object.values(TABLE.couleursDuTheme)) assert.ok(couleurs.has(n) && couleurs.has(`on-${n}`), `couleur du thème : ${n}`);
});

test('N2 un nouveau nom par ancien nom ; aucun ancien nom n\'est un nouveau nom', () => {
  for (const partie of ['tokens', 'variablesDuTheme', 'couleursDuTheme']) {
    const nouveaux = Object.values(TABLE[partie]);
    assert.equal(new Set(nouveaux).size, nouveaux.length, `${partie} : deux anciens noms pour un nouveau`);
  }
  const nouveaux = new Set(Object.values(TABLE.tokens));
  for (const a of Object.keys(TABLE.tokens)) assert.ok(!nouveaux.has(a), `ancien = nouveau : ${a}`);
});

test('N3 chaque chemin traduit mot à mot, sauf les exceptions', () => {
  for (const [a, n] of Object.entries(TABLE.tokens)) {
    const attendu = TABLE.exceptions[a] ?? a.split('.').map((s) => (/^\d+$/.test(s) ? s : TABLE.mots[s])).join('.');
    assert.equal(n, attendu, a);
  }
});

test('N4 aucun ancien nom complet ne reste, hors attendus, décisions, table et entrées des fixtures', () => {
  const anciens = Object.keys(TABLE.tokens);
  const noms = new RegExp(`(?<![\\w.$-])(${anciens.map(esc).sort((a, b) => b.length - a.length).join('|')})(?![\\w-]|\\.\\w)`);
  const vars = new RegExp(`--(${anciens.map((a) => esc(a.replace(/\./g, '-'))).sort((a, b) => b.length - a.length).join('|')})(?![\\w-])`);
  const theme = new RegExp(`(?<![\\w-])(${Object.keys(TABLE.variablesDuTheme).filter((k) => k !== TABLE.variablesDuTheme[k]).map(esc).join('|')})(?![\\w-])`);
  const couleurs = new RegExp(`--v-theme-(on-)?(${Object.keys(TABLE.couleursDuTheme).map(esc).join('|')})(?![\\w-])`);
  const suivis = execFileSync('git', ['ls-files', 'tokens', 'src', 'atelier', 'test', 'docs', 'README.md', 'ARCHITECTURE.md', 'CLAUDE.md', 'KNOWN_ISSUES.md'], { cwd: ROOT, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter((f) => !/^docs\/attendus\/|^docs\/decisions\.md$|^docs\/anciens-noms\.json$|^atelier\/storybook-static\/|^test\/anciens-noms\.test\.js$|\.(png|woff2|ico|jpe?g)$/.test(f));
  /** @type {string[]} */
  const restes = [];
  for (const f of suivis) {
    const s = lire(f);
    for (const re of [noms, vars, theme, couleurs]) {
      const m = re.exec(s);
      if (m) restes.push(`${f} : ${m[0]}`);
    }
  }
  assert.deepEqual(restes, []);
});

test('N5 Orbe Café, traduit à rebours, retrouve l\'empreinte d\'avant le renommage', () => {
  const m = JSON.parse(lire('tokens/orbe-cafe/marque.tokens.json'));
  // Seul ajout depuis l'empreinte, l'emplacement text-large (test/saisie.test.js, S1).
  delete m.brand.primary['text-large'];
  /** Le nom de l'échelle, dans les descriptions, suit l'échelle : retraduit lui aussi. */
  const echelles = Object.fromEntries(Object.entries(TABLE.mots).filter(([a]) => ['bleu', 'terre', 'erreur', 'succes', 'avertissement'].includes(a)).map(([a, b]) => [b, a]));
  const texte = serialiser(traducteur('avant').jetons(m)).replace(/échelle (blue|earth|error|success|warning)\b/g, (_, e) => `échelle ${echelles[e]}`);
  assert.equal(createHash('sha256').update(texte).digest('hex'), 'c6717998900ac0add8cc9114c2cd7eca7e1a091f50984d81b0ff250ad9a8b537');
});
