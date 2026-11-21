// @ts-check
/**
 * Forme de docs/regles.md et des fichiers de technique (docs/techniques/), D65.
 * Attendu écrit à la main avant le code (docs/attendus/etape-9-regles.md) :
 *   Z1 chaque numéro est unique, de la forme DS, NM, CP, DOC, DF ou CS suivie d'un nombre ; chaque cellule Contrôle
 *      commence par Relit, Liste fixe, Recopié ou Absent ; les comptes de règles, de défauts et de consignes que D65
 *      écrit sont ceux des tables ;
 *   Z2 chaque règle marquée « Oui » dans la colonne Technique a sa ligne dans chaque fichier de docs/techniques/, et
 *      chaque ligne d'un fichier de technique porte le numéro d'une règle marquée « Oui » ;
 *   Z3 le contrôle refuse un fichier de technique sans la ligne de CP4, un numéro en double et une cellule Contrôle
 *      qui ne commence par aucun des quatre mots.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TECHNIQUES = join(ROOT, 'docs', 'techniques');
const NUMERO = /^(DS|NM|CP|DOC|DF|CS)\d+$/;
const MOTS = ['Relit', 'Liste fixe', 'Recopié', 'Absent'];
/** Case d'un énoncé, d'après le titre de la deuxième colonne de sa table. */
const CASES = /** @type {const} */ ({ Règle: 'règles', Défaut: 'défauts', Consigne: 'consignes' });

/**
 * Tables Markdown d'un texte : en-tête et lignes, cellules sans les bords.
 * @param {string} texte @returns {{ entete: string[], lignes: string[][] }[]}
 */
function tables(texte) {
  const cellules = (/** @type {string} */ l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  /** @type {{ entete: string[], lignes: string[][] }[]} */
  const out = [];
  let bloc = /** @type {string[]} */ ([]);
  for (const l of [...texte.split('\n'), '']) {
    if (l.trim().startsWith('|')) bloc.push(l);
    else {
      if (bloc.length > 2) out.push({ entete: cellules(bloc[0]), lignes: bloc.slice(2).map(cellules) });
      bloc = [];
    }
  }
  return out;
}

/**
 * Énoncés de docs/regles.md, par case : numéro, contrôle (cellule), technique (« Oui » ou non).
 * @param {string} texte
 */
function enonces(texte) {
  /** @type {{ numero: string, sorte: string, controle: string | null, technique: boolean }[]} */
  const out = [];
  for (const t of tables(texte)) {
    const sorte = CASES[/** @type {keyof typeof CASES} */ (t.entete[1])];
    if (!sorte) continue;
    const iControle = t.entete.indexOf('Contrôle');
    const iTechnique = t.entete.indexOf('Technique');
    for (const l of t.lignes)
      out.push({ numero: l[0], sorte, controle: iControle < 0 ? null : l[iControle], technique: iTechnique >= 0 && l[iTechnique] === 'Oui' });
  }
  return out;
}

/**
 * Écarts de forme ; chaque message dit quoi faire.
 * @param {string} regles texte de docs/regles.md @param {Record<string, string>} techniques fichier → texte
 * @returns {string[]}
 */
function ecarts(regles, techniques) {
  const e = enonces(regles);
  const out = [];
  const vus = new Set();
  for (const x of e) {
    if (!NUMERO.test(x.numero)) out.push(`numéro mal formé : ${x.numero} ; écrire DS, NM, CP, DOC, DF ou CS suivi d'un nombre`);
    if (vus.has(x.numero)) out.push(`numéro en double : ${x.numero} ; un numéro ne sert qu'une fois, une partie détachée prend DF<n> ou CS<n>`);
    vus.add(x.numero);
    if (x.controle !== null && !MOTS.some((m) => x.controle?.startsWith(m)))
      out.push(`contrôle sans son mot : ${x.numero} ; commencer la cellule par ${MOTS.join(', ')}`);
  }
  const avecTechnique = e.filter((x) => x.technique).map((x) => x.numero);
  for (const [fichier, texte] of Object.entries(techniques)) {
    const lignes = tables(texte).flatMap((t) => (t.entete[0] === 'Règle' ? t.lignes.map((l) => l[0]) : []));
    for (const n of avecTechnique)
      if (!lignes.includes(n)) out.push(`${fichier} : ligne absente pour ${n} ; écrire le comment de ${n} dans ce framework et son contrôle`);
    for (const n of lignes)
      if (!avecTechnique.includes(n)) out.push(`${fichier} : ${n} n'est pas marquée « Oui » dans docs/regles.md ; marquer la règle ou retirer la ligne`);
  }
  return out;
}

const REGLES = readFileSync(join(ROOT, 'docs', 'regles.md'), 'utf8');
const lireTechniques = () =>
  Object.fromEntries(readdirSync(TECHNIQUES).filter((f) => f.endsWith('.md')).map((f) => [f, readFileSync(join(TECHNIQUES, f), 'utf8')]));

test('Z1 numéros uniques et bien formés, contrôle dit par l\'un des quatre mots, comptes de D65', () => {
  assert.deepEqual(ecarts(REGLES, {}), []);
  const e = enonces(REGLES);
  const compte = (/** @type {string} */ s) => e.filter((x) => x.sorte === s).length;
  const decisions = readFileSync(join(ROOT, 'docs', 'decisions.md'), 'utf8');
  const d65 = decisions.slice(decisions.indexOf('### D65'));
  const m = d65.match(/(\d+) règles, (\d+) défauts et (\d+) consignes/);
  assert.ok(m, 'D65 écrit « <n> règles, <n> défauts et <n> consignes »');
  assert.deepEqual([compte('règles'), compte('défauts'), compte('consignes')], m.slice(1, 4).map(Number));
});

test('Z2 chaque règle marquée « Oui » a sa ligne dans chaque fichier de technique, et réciproquement', () => {
  const techniques = lireTechniques();
  assert.ok(Object.keys(techniques).includes('vuetify.md'), 'docs/techniques/vuetify.md présent');
  assert.ok(enonces(REGLES).some((x) => x.technique), 'au moins une règle marquée « Oui »');
  assert.deepEqual(ecarts(REGLES, techniques), []);
});

test('Z3 le contrôle refuse une ligne de technique absente, un numéro en double, un contrôle sans son mot', () => {
  const techniques = lireTechniques();
  const vuetify = techniques['vuetify.md'];
  const sansCP4 = vuetify.split('\n').filter((l) => !l.startsWith('| CP4 |')).join('\n');
  assert.ok(sansCP4 !== vuetify, 'la ligne de CP4 existe');
  assert.match(ecarts(REGLES, { 'vuetify.md': sansCP4 }).join('\n'), /^vuetify\.md : ligne absente pour CP4 ; /m);
  const double = REGLES.replace('| DS3 |', '| DS2 |');
  assert.match(ecarts(double, {}).join('\n'), /^numéro en double : DS2 ; /m);
  const sansMot = REGLES.replace(/(\| DS5 \|[^\n]*\| )Relit/, '$1Lu');
  assert.ok(sansMot !== REGLES, 'la cellule Contrôle de DS5 commence par Relit');
  assert.match(ecarts(sansMot, {}).join('\n'), /^contrôle sans son mot : DS5 ; /m);
});
