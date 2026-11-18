// @ts-check
/**
 * Guidage du constat des composants (D47, docs/attendus/forme-constat.md), sans navigateur, sur des relevés écrits à la
 * main. Aucun chiffre du constat ne change : le guidage s'ajoute.
 *
 * Attendus écrits à la main avant le code (18/11/2026) :
 *   F1 phrase courte : « N éléments, de T types. Pour D types, le site a plusieurs versions du même élément. » ; avec D à 0,
 *      « Chaque type n'a qu'une version. » ; au singulier, « 1 élément, de 1 type » ;
 *   F2 à faire : doublons sans version à garder, types à une version sans version à garder (un type à une version n'est pas
 *      choisi d'office), blocs pas encore décidés (un bloc laissé ne compte pas) ;
 *   F3 éléments à remplacer et « À faire » d'un type, dans les quatre cas, singulier compris ; un nom court ambigu porte son
 *      origine ;
 *   F4 défauts d'une version, dans l'ordre nom, clavier, zone de clic, avec « k sur x : » si tous ne sont pas touchés ;
 *   F5 différences : les familles égales entre versions sont omises ; deux apparences s'écrivent « 36 ou 28 px » ; une
 *      valeur nulle prend son mot (« sans bordure », « arrondi 0 ») ; rien pour un type à une version ;
 *   F6 ordre guidé : doublons à choisir par éléments à remplacer puis par nom, puis les choisis ; types à une version, à
 *      confirmer d'abord, par nombre puis par nom.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construireConstat } from '../src/composants/constat.js';
import { validerDecisions } from '../src/composants/decisions.js';
import { idDe } from '../src/composants/pieces.js';
import { ordreGuide } from '../src/report/constat.js';

/** @param {Partial<Record<string, any>>} [m] */
const mesures = (m = {}) => ({ hauteur: 36, rayons: [4, 4, 4, 4], bordures: [0, 0, 0, 0], marges: [0, 16, 0, 16], taille: 14, graisse: 500, ...m });

/** @param {any[][]} parPage */
function releve(parPage) {
  const lignes = parPage.flatMap((ls, page) =>
    ls.map((o, index) => ({
      sorte: 'role', role: 'button', nom: 'Ok', texte: true, clavier: true, zone: [40, 40], piece: null, balise: 'button', classes: ['a'],
      mesures: mesures(), chemin: `main:1>button:${index + 1}`, selecteur: 'button', endroit: 'contenu', extrait: '<button>Ok</button>',
      ...o, page, index, id: idDe(page, index),
    })),
  );
  return {
    outil: { nom: 'ds-lab', version: '0' }, date: '2026-11-18 21:30', site: 'http://exemple.test', fenetre: { width: 1366, height: 900 }, frameworks: [],
    pages: parPage.map((_, i) => ({ adresse: `http://exemple.test/p${i + 1}`, nom: `p${i + 1}`, statut: 200 })), lignes: /** @type {any[]} */ (lignes), captures: [],
  };
}
/** @param {any} c @param {string} nom */
const type = (c, nom) => c.types.find((/** @type {any} */ t) => t.nom === nom);
const bloc = (/** @type {string} */ cl, /** @type {number} */ i) => ({ sorte: 'bloc', role: undefined, classes: [cl], chemin: `main:1>div:${i}` });

test('F1 phrase courte', () => {
  assert.equal(construireConstat(releve([[{}]])).phraseCourte, "1 élément, de 1 type. Chaque type n'a qu'une version.");
  const c = construireConstat(releve([[{ classes: ['a'] }, { classes: ['b'] }, { role: 'link', classes: ['x'] }, { role: 'link', classes: ['y'] }, { role: 'tab' }]]));
  assert.equal(c.phraseCourte, '5 éléments, de 3 types. Pour 2 types, le site a plusieurs versions du même élément.');
  assert.equal(construireConstat(releve([[{ classes: ['a'] }, { classes: ['b'] }]])).phraseCourte, '2 éléments, de 1 type. Pour 1 type, le site a plusieurs versions du même élément.');
});

test('F2 à faire : un type à une version n’est pas choisi d’office ; un bloc laissé est décidé', () => {
  const r = releve([[{ classes: ['a'] }, { classes: ['b'] }, { role: 'link' }, { role: 'tab' }, bloc('pave', 1), bloc('pave', 2), bloc('bande', 3), bloc('bande', 4)]]);
  assert.deepEqual(construireConstat(r).aFaire, { doublons: 1, confirmer: 2, blocs: 2 });
  const d = validerDecisions({ garder: [{ type: 'lien', version: 'lien / Fait maison / a' }], blocs: [{ bloc: 'pave', sort: 'laisser' }] });
  assert.deepEqual(construireConstat(r, d).aFaire, { doublons: 1, confirmer: 1, blocs: 1 });
});

test('F3 éléments à remplacer et « À faire » d’un type, quatre cas', () => {
  const r = releve([[{ classes: ['a'] }, { classes: ['a'] }, { classes: ['b'] }, { role: 'tab' }, { role: 'link', piece: { nom: 'x', framework: 'Cadre' } }, { role: 'link', classes: ['x'] }, { role: 'link', classes: ['x'] }]]);
  const c = construireConstat(r);
  assert.deepEqual([type(c, 'bouton avec texte').remplacer, type(c, 'bouton avec texte').aFaire], [1, "Choisir la version à garder. Si c'est la plus répandue, 1 endroit sera à remplacer."]);
  assert.equal(type(c, 'onglet').aFaire, 'Confirmer cette version comme version à garder.');
  const d = validerDecisions({ garder: [{ type: 'bouton avec texte', version: 'bouton avec texte / Fait maison / b' }, { type: 'onglet', version: 'onglet / Fait maison / a' }, { type: 'lien', version: 'lien / Cadre / x' }] });
  const g = construireConstat(r, d);
  assert.deepEqual([type(g, 'bouton avec texte').remplacer, type(g, 'bouton avec texte').aFaire], [2, 'Version à garder : b. 2 endroits à remplacer.']);
  assert.equal(type(g, 'onglet').aFaire, 'Version à garder : a. Rien à remplacer.');
  assert.equal(type(g, 'lien').aFaire, 'Version à garder : x (Cadre). 2 endroits à remplacer.');
});

test('F4 défauts d’une version', () => {
  const c = construireConstat(releve([[{ classes: ['a'], nom: '', zone: [40, 20] }, { classes: ['a'], clavier: false, zone: [40, 20] }, { classes: ['b'] }]]));
  const [a, b] = type(c, 'bouton avec texte').versions;
  assert.deepEqual(a.defauts, ["1 sur 2 : sans nom pour les lecteurs d'écran", "1 sur 2 : hors d'atteinte au clavier", 'zone de clic trop petite']);
  assert.deepEqual(b.defauts, []);
  assert.deepEqual([a.mention, b.mention], ['la plus répandue', null]);
});

test('F5 différences entre les versions d’un type', () => {
  const c = construireConstat(releve([[
    { classes: ['a'] }, { classes: ['a'] }, { classes: ['a'], mesures: mesures({ hauteur: 28, marges: [0, 12, 0, 12] }) },
    { classes: ['b'], mesures: mesures({ bordures: [1, 1, 1, 1], rayons: [0, 0, 0, 0], marges: [0, 0, 0, 0] }) },
    { role: 'tab' },
  ]]));
  assert.deepEqual(type(c, 'bouton avec texte').versions.map((/** @type {any} */ v) => v.differences), [
    'hauteur 36 ou 28 px · sans bordure · arrondi 4 px · marge intérieure 0 16 ou 0 12 px',
    'hauteur 36 px · bordure 1 px · arrondi 0 · sans marge intérieure',
  ]);
  assert.equal(type(c, 'onglet').versions[0].differences, '');
});

test('F6 ordre guidé des types', () => {
  const r = releve([[
    { classes: ['a'] }, { classes: ['a'] }, { classes: ['b'] }, { classes: ['c'] },
    { role: 'textbox', classes: ['a'] }, { role: 'textbox', classes: ['b'] },
    { role: 'link', classes: ['a'] }, { role: 'link', classes: ['b'] },
    { role: 'tab' }, { role: 'tab' }, { role: 'checkbox' }, { role: 'switch' }, { role: 'switch' },
  ]]);
  const d = validerDecisions({ garder: [{ type: 'champ de texte', version: 'champ de texte / Fait maison / a' }, { type: 'onglet', version: 'onglet / Fait maison / a' }] });
  const o = ordreGuide(construireConstat(r, d));
  assert.deepEqual(o.doublons.map((t) => t.nom), ['bouton avec texte', 'lien', 'champ de texte']);
  assert.deepEqual(o.uneVersion.map((t) => t.nom), ['interrupteur', 'case à cocher', 'onglet']);
});
