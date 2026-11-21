// @ts-check
/**
 * Aucun nom de marque dans le code de src/ (docs/attendus/revue-lot-5-marque.md, Q6 : garde stricte).
 *
 * Attendus écrits à la main avant le code (16/11/2026) :
 *   G1 les marques sont lues dans leurs données : chaque dossier de tokens/ qui a un entree.json donne son nom (« Orbe Café »),
 *      son dossier (« orbe-cafe ») et le premier mot de son dossier (« orbe »), comparé sans casse ni accent à chaque partie
 *      d'identifiant ou de mot du code (ORBE, lirePropresOrbe, 'tokens/orbe-cafe/' en sont ; absorbed n'en est pas) ;
 *   G2 les commentaires sont exclus ; les chaînes et les gabarits sont du code ;
 *   G3 la lecture est lexicale, sans parseur : chaque fichier doit finir hors de toute chaîne, de tout gabarit et de tout
 *      commentaire, sinon la lecture s'est perdue et le test le dit ;
 *   G4 aucune occurrence dans src/ ;
 *   G5 aucune occurrence dans le code de l'atelier (D42) : les fichiers .js de atelier/, atelier/.storybook/ et
 *      atelier/stories/, hors de node_modules/ et de la version construite (attendu du 18/11/2026) ; puis, avec les
 *      composants (D43, docs/attendus/bouton.md), les .js et .vue de atelier/composants/ aussi : d'un .vue, le bloc
 *      script est lu comme du JavaScript, le gabarit et le style comme du texte, leurs commentaires exclus.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeAtelier, partiesVue } from './helpers/atelier.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TOKENS = join(ROOT, 'tokens');
const SRC = join(ROOT, 'src');

/** Sans casse ni accent. @param {string} s */
const plat = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * Code d'un fichier JavaScript sans ses commentaires, et l'état final de la lecture (« code » si elle ne s'est pas perdue).
 * Chaînes, gabarits (avec leurs ${…} imbriqués) et expressions régulières sont lus pour ne pas y prendre un // ou un /*.
 * @param {string} src
 */
export function sansCommentaires(src) {
  let out = '';
  /** @type {('code' | 'tpl')[]} */
  const pile = ['code'];
  /** @type {number[]} profondeur d'accolades de chaque ${…} ouvert */
  const accolades = [];
  let dernier = ''; // dernier caractère significatif du code, pour reconnaître une expression régulière
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const mode = pile[pile.length - 1];
    if (mode === 'tpl') {
      if (c === '\\') { out += src.slice(i, i + 2); i += 2; continue; }
      if (c === '`') { pile.pop(); out += c; i++; dernier = '`'; continue; }
      if (c === '$' && src[i + 1] === '{') { pile.push('code'); accolades.push(0); out += '${'; i += 2; dernier = '{'; continue; }
      out += c; i++; continue;
    }
    // Code.
    if (c === '/' && src[i + 1] === '/') { const f = src.indexOf('\n', i); i = f < 0 ? n : f; continue; }
    if (c === '/' && src[i + 1] === '*') {
      const f = src.indexOf('*/', i + 2);
      if (f < 0) return { code: out, fin: 'commentaire' };
      out += ' ' + src.slice(i, f + 2).replace(/[^\n]/g, ''); // les lignes gardent leur numéro
      i = f + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      if (src[j] !== c) return { code: out, fin: 'chaîne' };
      out += src.slice(i, j + 1); i = j + 1; dernier = c; continue;
    }
    if (c === '`') { pile.push('tpl'); out += c; i++; continue; }
    if (c === '/' && (dernier === '' || '(,=:[!&|?{};+-*%<>~^'.includes(dernier) || /\b(return|typeof|case|in|of)$/.test(out.trimEnd()))) {
      let j = i + 1;
      let classe = false;
      while (j < n && src[j] !== '\n' && (classe || src[j] !== '/')) {
        if (src[j] === '\\') j++;
        else if (src[j] === '[') classe = true;
        else if (src[j] === ']') classe = false;
        j++;
      }
      if (src[j] !== '/') return { code: out, fin: 'expression régulière' };
      out += src.slice(i, j + 1); i = j + 1; dernier = '/'; continue;
    }
    if (pile.length > 1 && c === '{') accolades[accolades.length - 1]++;
    if (pile.length > 1 && c === '}') {
      if (accolades[accolades.length - 1] === 0) { accolades.pop(); pile.pop(); out += c; i++; continue; }
      accolades[accolades.length - 1]--;
    }
    out += c;
    if (!/\s/.test(c)) dernier = c;
    i++;
  }
  return { code: out, fin: pile.length === 1 ? 'code' : 'gabarit' };
}

/** Parties d'un mot du code : camelCase, MAJUSCULES, tirets et soulignés coupés. @param {string} mot */
const parties = (mot) => mot.split(/[-_]|(?<=\p{Ll})(?=\p{Lu})/u).filter(Boolean).map(plat);

/** Marques lues dans leurs données. */
function marques() {
  return readdirSync(TOKENS)
    .filter((d) => existsSync(join(TOKENS, d, 'entree.json')))
    .map((d) => ({ dossier: d, nom: JSON.parse(readFileSync(join(TOKENS, d, 'entree.json'), 'utf8')).name, mot: d.split('-')[0] }));
}

/** @param {string} dir @returns {string[]} */
const fichiers = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? fichiers(p) : p.endsWith('.js') ? [p] : [];
  });

/**
 * Occurrences d'un nom de marque dans un code sans commentaires.
 * @param {string} code @param {ReturnType<typeof marques>} ms
 */
export function occurrences(code, ms) {
  /** @type {{ ligne: number, marque: string, texte: string }[]} */
  const trouve = [];
  code.split('\n').forEach((l, k) => {
    const p = plat(l);
    for (const m of ms) {
      const dit = p.includes(plat(m.nom)) || p.includes(m.dossier) || (l.match(/[\p{L}\p{N}_$-]+/gu) ?? []).some((w) => parties(w).includes(m.mot));
      if (dit) trouve.push({ ligne: k + 1, marque: m.dossier, texte: l.trim().slice(0, 100) });
    }
  });
  return trouve;
}

test('G1 marques lues dans leurs données', () => {
  const ms = marques();
  assert.deepEqual(ms.map((m) => m.dossier).sort(), ['atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie', 'maison-alberto', 'orbe-cafe']);
  const orbe = /** @type {any} */ (ms.find((m) => m.dossier === 'orbe-cafe'));
  for (const s of ["const ORBE = 1;", 'lirePropresOrbe()', "x('tokens/orbe-cafe/')", "'Orbe Café torréfie'", 'ORBE_X'])
    assert.equal(occurrences(s, [orbe]).length, 1, s);
  for (const s of ['absorbed', 'x.absorbed && sorbet', 'carte du café']) assert.equal(occurrences(s, [orbe]).length, 0, s);
});

test('G2 commentaires exclus, chaînes, gabarits et expressions régulières lus', () => {
  const src = "const a = '//'; // ORBE\n/* Orbe Café */ const r = /'([^']+)'/; const t = `x ${`y ${a} //`} /*`; const u = 1 / 2; // fin";
  const { code, fin } = sansCommentaires(src);
  assert.equal(fin, 'code');
  assert.ok(!/ORBE|Orbe/.test(code), code);
  assert.ok(code.includes("'//'") && code.includes('/*`') && code.includes('1 / 2'), code);
});

test('G3 et G4 aucun nom de marque dans le code de src/', () => {
  const ms = marques();
  const perdus = [];
  const trouves = [];
  for (const f of fichiers(SRC)) {
    const { code, fin } = sansCommentaires(readFileSync(f, 'utf8'));
    if (fin !== 'code') perdus.push(`${relative(ROOT, f)} : lecture perdue (${fin})`);
    for (const o of occurrences(code, ms)) trouves.push(`${relative(ROOT, f)}:${o.ligne} (${o.marque}) ${o.texte}`);
  }
  assert.deepEqual(perdus, []);
  assert.deepEqual(trouves, []);
});

test('G5 aucun nom de marque dans le code de l\'atelier', () => {
  const ms = marques();
  const lus = codeAtelier();
  assert.ok(lus.some((f) => f.endsWith('preview.js')), 'la configuration de l\'atelier est lue');
  assert.ok(lus.some((f) => f.endsWith('.vue')), 'les composants .vue de l\'atelier sont lus');
  const perdus = [];
  const trouves = [];
  for (const f of lus) {
    const src = readFileSync(join(ROOT, f), 'utf8');
    const vue = f.endsWith('.vue') ? partiesVue(src) : null;
    const { code, fin } = sansCommentaires(vue ? vue.script : src);
    if (fin !== 'code') perdus.push(`${f} : lecture perdue (${fin})`);
    for (const texte of vue ? [code, vue.reste] : [code])
      for (const o of occurrences(texte, ms)) trouves.push(`${f}:${o.ligne} (${o.marque}) ${o.texte}`);
  }
  assert.deepEqual(perdus, []);
  assert.deepEqual(trouves, []);
});
