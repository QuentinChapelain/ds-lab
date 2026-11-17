// @ts-check
/**
 * Feuilles ajoutées sur une feuille compressée (docs/attendus/feuille-ajoutee-reel.md, décisions de Quentin du
 * 17/11/2026). Page fixtures/marque-demo/compressee/compressee.html, réduite à 390×900 sur cible-valise.json :
 *   - styles/compressee.css, sur une seule ligne : .carte trois fois, !important collé à la valeur (.pied), raccourci
 *     dont la valeur contient un var() (.bord), sélecteurs que le navigateur réécrit (.liste>li, li:nth-child(even)),
 *     règle sous @media (max-width:500px) (.etroit, vue seulement en étroit) ;
 *   - styles/imprimable.css, liée avec media="screen, print" ;
 *   - styles/injectee.css, injectée par un script après le chargement.
 * Attendus écrits à la main avant le code (17/11/2026). Les identifiants de ligne sont ceux de la réduction ; les
 * colonnes sont celles de l'accolade ouvrante, base 1, relevées par
 *   LC_ALL=C grep -bo '[^{}]*{' compressee.css   (colonne = décalage + longueur de la correspondance)
 * soit .carte 29, .carte-titre 56, .carte 82, .pied 113, .bord 154, .liste>li 194, li:nth-child(even) 227,
 * .etroit 285 ; « .note { » et « .bandeau { » : colonnes 7 et 10, ligne 1.
 *   C1 modifications.json : fenêtre 390×900 et schéma http ; chaque entrée décidée porte sa colonne, ses pages et
 *      `important` (vrai pour .pied seulement) ; aucune valeur écrite ni valeur de repli ne contient !important ;
 *   C2 feuilles ajoutées, sans --origine ni fenêtre données : aucune règle ambiguë ni introuvable ; .pied écrite avec
 *      !important et « provisoire : !important d'origine » ; texte de compressee.ajout.css attendu à l'octet ;
 *   C3 pertes.md : .bord, quatre fois en cause « raccourci » ; une section pour l'!important d'origine, une pour la
 *      feuille injectée ; chargement : le media du lien, la feuille injectée et ce qu'il faut faire ;
 *   C4 preuve par décision, à la fenêtre de la réduction : chaque ligne écrite arrivée, la feuille injectée dite ;
 *      .bord non arrivée, la règle qui gagne nommée ; le compte de pixels reste donné.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { TOKENS } from './helpers/ajout.js';
import { runReduce } from '../src/reduce/run.js';
import { feuillesAjoutees, ecrireAjouts } from '../src/apply/ajout.js';
import { verifyPage } from '../src/verify/reference.js';
import { juger } from '../src/verify/arrivee.js';

const PAGE = '/compressee/compressee.html';
const C = '/compressee/styles/compressee.css';
const I = '/compressee/styles/imprimable.css';
const J = '/compressee/styles/injectee.css';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let mods;
/** @type {Awaited<ReturnType<typeof feuillesAjoutees>>} */
let ajout;
/** @type {Awaited<ReturnType<typeof verifyPage>>} */
let preuve;

before(async () => {
  servers = await startFixtureServers();
  const refs = await mkdtemp(join(tmpdir(), 'ds-lab-compressee-refs-'));
  const [run] = await runReduce({
    tokensPath: TOKENS,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: { width: 390, height: 900 },
    waitMs: 100,
    now: new Date(2026, 10, 17, 12, 0),
    referencesPath: refs,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-compressee-reduce-')),
    addresses: [servers.origin + PAGE],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
  });
  mods = JSON.parse(await readFile(/** @type {string} */ (run.files.find((f) => f.endsWith('modifications.json'))), 'utf8'));
  ajout = await feuillesAjoutees(mods, { waitMs: 100 });
  const sortie = await mkdtemp(join(tmpdir(), 'ds-lab-compressee-sortie-'));
  await ecrireAjouts(ajout, sortie);
  preuve = await verifyPage({ url: servers.origin + PAGE, referenceDir: refs, waitMs: 100, ajout: sortie });
});

after(async () => servers?.close());

/** Entrées décidées : [lignes, feuille, ligne, colonne, sélecteur, propriété, important]. */
const DECIDEES = [
  ['coul-04', C, 1, 113, '.pied', 'background-color', true],
  ['coul-04', C, 1, 227, 'li:nth-child(2n)', 'background-color', false],
  ['coul-07', C, 1, 82, '.carte', 'background-color', false],
  ['coul-06', C, 1, 154, '.bord', 'border-bottom-color', false],
  ['coul-06', C, 1, 154, '.bord', 'border-left-color', false],
  ['coul-06', C, 1, 154, '.bord', 'border-right-color', false],
  ['coul-06', C, 1, 154, '.bord', 'border-top-color', false],
  ['coul-01', C, 1, 194, '.liste > li', 'color', false],
  ['coul-03', C, 1, 29, '.carte', 'color', false],
  ['esp-03', C, 1, 56, '.carte-titre', 'margin-bottom', false],
  ['esp-04', C, 1, 285, '.etroit', 'padding-left', false],
  ['coul-05', I, 1, 7, '.note', 'color', false],
  ['coul-03', J, 1, 10, '.bandeau', 'color', false],
];

test('C1 modifications.json : fenêtre, schéma, colonne, pages et important de chaque entrée décidée', () => {
  assert.deepEqual(mods.viewport, { width: 390, height: 900 });
  assert.equal(mods.scheme, 'http');
  const decidees = mods.entries.filter((/** @type {any} */ e) => e.section !== 'RATTACHE');
  const vu = decidees.map((/** @type {any} */ e) => [e.rows.join(', '), e.sheet, e.line, e.column, e.selector, e.property, e.important]);
  assert.deepEqual(
    [...vu].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    [...DECIDEES].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  );
  for (const e of decidees) assert.deepEqual(e.pages, [PAGE], `${e.rows} ${e.selector}`);
  const pied = decidees.find((/** @type {any} */ e) => e.selector === '.pied');
  assert.equal(pied.written, '#eeeeee');
  assert.equal(pied.value, 'var(--couleur-neutre-4, #eeeeee)');
  for (const e of mods.entries) assert.ok(!/important/i.test(`${e.written} ${e.value}`), `${e.rows} ${e.selector} ${e.property} : ${e.written} → ${e.value}`);
});

const ATTENDU_C = `/* ds-lab : feuille ajoutée de ${C}, à charger juste après elle. Tirée de modifications.json (marque.resolver.json, 2026-11-17T1200). */

/* coul-03 ; ${C}:1:29 */
.carte {
  color: var(--couleur-neutre-12, #333333); /* coul-03 */
}

/* esp-03 ; ${C}:1:56 */
.carte-titre {
  margin-bottom: var(--espace-32, 30px); /* esp-03 */
}

/* coul-07 ; ${C}:1:82 */
.carte {
  background-color: var(--couleur-neutre-3, #f2f2f2); /* coul-07 */
}

/* coul-04 ; ${C}:1:113 */
.pied {
  background-color: var(--couleur-neutre-4, #eeeeee) !important; /* coul-04 ; provisoire : !important d'origine */
}

/* coul-01 ; ${C}:1:194 */
.liste>li {
  color: var(--couleur-neutre-11, #808080); /* coul-01 */
}

/* coul-04 ; ${C}:1:227 */
li:nth-child(even) {
  background-color: var(--couleur-neutre-4, #eeeeee); /* coul-04 */
}

/* esp-04 ; ${C}:1:285 */
@media (max-width:500px) {
  .etroit {
    padding-left: var(--espace-32, 36px); /* esp-04 */
  }
}
`;

test('C2 feuilles ajoutées : aucune règle ambiguë ni introuvable, !important d\'origine écrit et dit', () => {
  assert.deepEqual(
    ajout.feuilles.map((f) => f.ajout),
    ['/compressee/styles/compressee.ajout.css', '/compressee/styles/imprimable.ajout.css', '/compressee/styles/injectee.ajout.css'],
  );
  assert.equal(ajout.feuilles[0].texte, ATTENDU_C);
  assert.ok(ajout.feuilles[1].texte.includes('.note {\n  color: var(--couleur-neutre-12, #2d2d2d); /* coul-05 */\n}'), ajout.feuilles[1].texte);
  assert.ok(ajout.feuilles[2].texte.includes('.bandeau {\n  color: var(--couleur-neutre-12, #333333); /* coul-03 */\n}'), ajout.feuilles[2].texte);
  assert.deepEqual(
    ajout.nonEcrites.map((x) => [x.entry.selector, x.entry.property, x.categorie]),
    [
      ['.bord', 'border-bottom-color', 'raccourci'],
      ['.bord', 'border-left-color', 'raccourci'],
      ['.bord', 'border-right-color', 'raccourci'],
      ['.bord', 'border-top-color', 'raccourci'],
    ],
  );
  assert.deepEqual(ajout.compte, { ecrites: 9, nonEcrites: 4, important: 1, injectees: 1, rattachements: mods.entries.filter((/** @type {any} */ e) => e.section === 'RATTACHE').length, horsModifications: mods.brief.reste.length });
});

test('C3 pertes.md : cinq causes distinctes, chargement avec le media et la feuille injectée', () => {
  const L = ajout.pertes.split('\n');
  const has = (/** @type {string} */ l) => assert.ok(L.includes(l), `${l}\n---\n${ajout.pertes}`);
  has(`- ${C.replace('.css', '.ajout.css')} juste après ${C}, dans toute page qui charge ${C}.`);
  has(`- ${I.replace('.css', '.ajout.css')} juste après ${I}, avec le même media (screen, print), dans toute page qui charge ${I}.`);
  has(`- ${J.replace('.css', '.ajout.css')} : ${J} est injectée par un script après le chargement (absente du HTML de ${PAGE}) ; le HTML ne peut pas la poser juste après elle : la charger depuis le même script, juste après l'injection.`);
  has("ÉCRITES AVEC !IMPORTANT D'ORIGINE (1)");
  has(`- coul-04 : ${C}:1:113 .pied { background-color } : écrite avec !important, comme la déclaration d'origine (provisoire). À faire : retirer !important de la source et de la feuille ajoutée quand le composant sera refait.`);
  has('ÉCRITES DANS UNE FEUILLE INJECTÉE PAR UN SCRIPT (1)');
  has(`- coul-03 : ${J}:1 .bandeau { color } : ${J} est injectée par un script. À faire : charger ${J.replace('.css', '.ajout.css')} depuis ce script, juste après elle.`);
  has('NON ÉCRITES (4)');
  for (const t of ['GARDE (0)', 'RACCOURCI (4)', 'RÈGLE INTROUVABLE (0)', "BATTUE PAR L'ORDRE (0)", 'CONTEXTE (0)', 'FEUILLE INTROUVABLE (0)']) has(`NON ÉCRITES, ${t}`);
  has(
    `- coul-06 : ${C}:1:154 .bord { border-top-color } : border-top-color introuvable dans border: 1px solid var(--trait). À faire : écrire border-top-color à part dans la source, avec le jeton --couleur-neutre-6 ; le raccourci tient sa valeur d'un var(), sa valeur de repli n'est pas connue.`,
  );
  assert.ok(!ajout.pertes.includes('ambiguë'), ajout.pertes);
});

test('C4 preuve par décision à la fenêtre de la réduction ; pixels donnés, sans décider', () => {
  const vu = preuve.decisions.map((d) => [d.rows.join(', '), d.selector, d.property, d.statut, d.n, d.m]);
  assert.deepEqual(
    [...vu].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    [
      ['coul-04', '.pied', 'background-color', 'arrivée', 1, 1],
      ['coul-04', 'li:nth-child(2n)', 'background-color', 'arrivée', 2, 2],
      ['coul-07', '.carte', 'background-color', 'arrivée', 1, 1],
      ['coul-06', '.bord', 'border-bottom-color', 'non arrivée', 0, 1],
      ['coul-06', '.bord', 'border-left-color', 'non arrivée', 0, 1],
      ['coul-06', '.bord', 'border-right-color', 'non arrivée', 0, 1],
      ['coul-06', '.bord', 'border-top-color', 'non arrivée', 0, 1],
      ['coul-01', '.liste > li', 'color', 'arrivée', 4, 4],
      ['coul-03', '.carte', 'color', 'arrivée', 1, 1],
      ['esp-03', '.carte-titre', 'margin-bottom', 'arrivée', 1, 1],
      ['esp-04', '.etroit', 'padding-left', 'arrivée', 1, 1],
      ['coul-05', '.note', 'color', 'arrivée', 1, 1],
      ['coul-03', '.bandeau', 'color', 'arrivée', 1, 1],
    ].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  );
  const bord = preuve.decisions.find((d) => d.property === 'border-top-color');
  assert.deepEqual(bord?.gagnantes, [`${C}:1:154 .bord`]);
  assert.equal(bord?.ecrite, false);
  const bandeau = preuve.decisions.find((d) => d.selector === '.bandeau');
  assert.ok(bandeau?.texte.endsWith('; feuille injectée par un script : posée après l\'injection'), bandeau?.texte);
  assert.deepEqual(juger([{ page: PAGE, decisions: preuve.decisions }]), { sortie: 0, motifs: [] });
  assert.equal(typeof preuve.pixels.different, 'number');
  assert.deepEqual(preuve.shot.viewport, { width: 390, height: 900 });
});
