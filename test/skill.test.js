// @ts-check
/**
 * Le skill ds-lab, pour une équipe externe (D66, docs/attendus/etape-9-skill.md). Attendus écrits à la main avant le
 * code ; chaque compte est relu par le test dans docs/regles.md, jamais écrit ici :
 *   SK1 les fichiers générés de skill/ds-lab/ égalent la sortie du générateur, et le dossier n'en a pas d'autres que
 *       ceux-là et SKILL.md (DOC2) ;
 *   SK2 regles.md porte chaque règle et chaque défaut de docs/regles.md, une ligne chacun ; aucune proposition qui
 *       commence par « ds-lab » ; « Contrôle dans ce dépôt » vaut `verifier` (<contrôles cités>) si le contrôle de
 *       ds-lab commence par « Relit » et cite contraste, espacements, typo ou style, sinon « Non contrôlée ici » ; le
 *       compte de ces deux cas est écrit en tête de regles.md et de SKILL.md ;
 *   SK3 consignes.md porte chaque consigne, techniques/vuetify.md chaque ligne de docs/techniques/vuetify.md ;
 *   SK4 SKILL.md : nom et description en tête ; chaque fichier et chaque commande qu'il cite existent, chaque option
 *       de verifier qu'il cite est lue par verifier ; 500 mots au plus hors code, la mesure de DOC5 ;
 *   SK5 le retrait des choix de ds-lab : une proposition après « ; » ou « . », le renvoi « (de XX<n>) » gardé, un
 *       « ds-lab » au milieu d'une phrase gardé ; une cellule qui commence par « ds-lab » est une panne qui nomme
 *       le numéro.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fichiersDuSkill, sourcesDuSkill, sansChoixDeDsLab, SKILL } from '../src/report/skill.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const lire = (/** @type {string} */ f) => readFileSync(join(SKILL, f), 'utf8');
const REGLES = readFileSync(join(ROOT, 'docs', 'regles.md'), 'utf8');
const NON = 'Non contrôlée ici';

/** Lignes numérotées de docs/regles.md, par section. */
function sourceParSection() {
  /** @type {Record<string, string[][]>} */
  const out = {};
  let s = '';
  for (const l of REGLES.split('\n')) {
    if (l.startsWith('## ')) s = l.slice(3);
    if (/^\| [A-Z]+\d+ \|/.test(l)) (out[s] ??= []).push(l.split('|').slice(1, -1).map((c) => c.trim()));
  }
  return out;
}
/** Lignes numérotées d'un fichier généré : numéro → cellules. @param {string} md */
const lignesDe = (md) => new Map(md.split('\n').filter((l) => /^\| [A-Z]+\d+ \|/.test(l)).map((l) => { const c = l.split('|').slice(1, -1).map((x) => x.trim()); return [c[0], c]; }));

test('SK1 les fichiers du skill égalent la sortie du générateur', () => {
  const attendus = fichiersDuSkill(sourcesDuSkill());
  for (const [f, texte] of Object.entries(attendus)) assert.equal(lire(f), texte, `${f} : relancer npm run skill`);
  const presents = /** @type {string[]} */ (readdirSync(SKILL, { recursive: true })).filter((f) => statSync(join(SKILL, f)).isFile()).sort();
  assert.deepEqual(presents, Object.keys(attendus).sort());
});

test('SK2 regles.md : chaque règle et défaut, sa colonne, le compte en tête', () => {
  const src = sourceParSection();
  const regles = Object.entries(src).filter(([s]) => s !== 'Défauts' && s !== 'Consignes').flatMap(([, l]) => l.map((c) => ({ numero: c[0], controle: c[4] })));
  const defauts = src['Défauts'].map((c) => ({ numero: c[0], controle: c[5] }));
  const tous = [...regles, ...defauts];
  const md = lire('regles.md');
  const gen = lignesDe(md);
  assert.deepEqual([...gen.keys()], tous.map((x) => x.numero));
  let ici = 0;
  for (const x of tous) {
    const cites = ['contraste', 'espacements', 'typo', 'style'].filter((c) => x.controle.includes(`npm run ${c}`));
    const attendu = x.controle.startsWith('Relit') && cites.length ? `\`verifier\` (${cites.join(', ')})` : NON;
    if (attendu !== NON) ici++;
    assert.equal(gen.get(x.numero)?.at(-1), attendu, x.numero);
  }
  assert.ok(ici > 0 && ici < tous.length);
  for (const f of ['regles.md', 'consignes.md', 'techniques/vuetify.md']) assert.doesNotMatch(lire(f), /[;.]\s+ds-lab\b/, f);
  const phrase = `Dans ce dépôt, \`verifier\` contrôle ${ici} des ${tous.length} règles et défauts ; ${tous.length - ici} ne sont pas contrôlés ici. Pour une règle « ${NON} », rien ne bloque : l'agent la tient en la lisant.`;
  assert.ok(md.includes(phrase), 'regles.md');
  assert.ok(lire('SKILL.md').includes(phrase), 'SKILL.md');
});

test('SK3 consignes et techniques : chaque ligne de leur source', () => {
  assert.deepEqual([...lignesDe(lire('consignes.md')).keys()], sourceParSection()['Consignes'].map((c) => c[0]));
  for (const f of readdirSync(join(ROOT, 'docs', 'techniques')).filter((x) => x.endsWith('.md'))) {
    const source = [...lignesDe(readFileSync(join(ROOT, 'docs', 'techniques', f), 'utf8')).keys()];
    assert.ok(source.length > 0, f);
    assert.deepEqual([...lignesDe(lire(`techniques/${f}`)).keys()], source, f);
  }
});

test('SK4 SKILL.md : en-tête, fichiers et commandes qui existent, une page', () => {
  const md = lire('SKILL.md');
  assert.match(md, /^---\nname: ds-lab\ndescription: .{40,}\n---\n/);
  const chemins = [...md.matchAll(/\$DS_LAB\/([\w./-]+)/g)].map((m) => m[1]);
  assert.ok(chemins.length >= 3, 'commandes citées');
  for (const c of chemins) assert.ok(existsSync(join(ROOT, c)), c);
  const verifier = readFileSync(join(ROOT, 'src', 'cli', 'verifier.js'), 'utf8');
  for (const l of md.split('\n').filter((x) => x.includes('verifier.js')))
    for (const [, o] of l.matchAll(/--([a-z-]+)/g)) assert.ok(verifier.includes(`${o}: { type:`), `option --${o}`);
  for (const f of ['regles.md', 'consignes.md', 'techniques/vuetify.md']) assert.ok(md.includes(`\`${f}\``) && existsSync(join(SKILL, f)), f);
  for (const f of ['docs/contrat-de-marque.md', 'atelier/composants/']) assert.ok(md.includes(f) && existsSync(join(ROOT, f)), f);
  const corps = md.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/`[^`]*`/g, '');
  assert.ok(corps.split(/\s+/).filter((m) => /\p{L}/u.test(m)).length <= 500, 'plus de 500 mots');
});

test('SK5 retrait des choix de ds-lab', () => {
  assert.equal(sansChoixDeDsLab('a ; ds-lab y ajoute b ; c', 'X1'), 'a ; c');
  assert.equal(sansChoixDeDsLab('a (b). ds-lab : le préfixe vaut `Ds`', 'X1'), 'a (b)');
  assert.equal(sansChoixDeDsLab("a ; ds-lab écrit en français, c'est son choix (de NM1)", 'X1'), 'a (de NM1)');
  assert.equal(sansChoixDeDsLab('chaque mot propre à ds-lab est au glossaire', 'X1'), 'chaque mot propre à ds-lab est au glossaire');
  assert.throws(() => sansChoixDeDsLab('ds-lab : tout', 'NM9'), /^Error: skill : NM9, la cellule commence par « ds-lab » et ne se détache pas : écrire le choix de ds-lab dans une proposition à part, après « ; » ou « \. »$/);
});
