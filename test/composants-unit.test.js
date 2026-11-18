// @ts-check
/**
 * Constat des composants, sans navigateur (D46, docs/attendus/audit-composants.md), sur des relevés écrits à la main.
 *
 * Attendus écrits à la main avant le code (18/11/2026) :
 *   K1 type par le rôle calculé : un bouton avec texte visible, un bouton à icône seule (nommé ou non), lien, champ de
 *      texte (textbox, searchbox), liste déroulante (combobox, listbox), case, radio, interrupteur, onglet, menu, fenêtre ;
 *      une pièce sans rôle prend le type de sa signature ;
 *   K2 origine : le framework de la signature ; sinon la première classe, « Fait maison » ; sinon la balise, « Sans style » ;
 *      nom stable « <type> / <origine> / <nom> » ;
 *   K3 deux jeux de mesures dans une version : une version, deux apparences, chacune comptée ;
 *   K4 gabarit : sur deux pages, un élément de même identité sur chacune est hors des chiffres, montré une fois ; sur une
 *      seule page, ou sur deux pages sur trois, il n'y a pas de gabarit ;
 *   K5 candidats : une classe répétée au moins deux fois ; une classe vue une fois n'en est pas ; un bloc contenu dans un
 *      candidat n'en est pas un ; un bloc du gabarit n'en est pas un ;
 *   K6 égalité de la plus répandue : les deux noms, sans choix ; l'effort est le total moins le plus grand compte ;
 *   K7 accessibilité de base : chaque critère compté à part ; une fenêtre n'est pas une commande ;
 *   K8 fichier de décisions mal formé : une erreur qui nomme la ligne ;
 *   K9 décisions : rattacher à un nouveau type, laisser, garder ; une cible absente est listée, pas appliquée ;
 *   K10 phrase : sans table, « Aucun framework reconnu. » ; accords au singulier ; plusieurs frameworks.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { construireConstat } from '../src/composants/constat.js';
import { validerDecisions } from '../src/composants/decisions.js';
import { idDe } from '../src/composants/pieces.js';

/** @param {number} [h] */
const mesures = (h = 36) => ({ hauteur: h, rayons: [4, 4, 4, 4], bordures: [0, 0, 0, 0], marges: [0, 16, 0, 16], taille: 14, graisse: 500 });

/** Relevé d'une ou plusieurs pages : chaque ligne reçoit son rang dans sa page. @param {any[][]} parPage @param {string[]} [frameworks] */
function releve(parPage, frameworks = []) {
  const lignes = parPage.flatMap((ls, page) =>
    ls.map((o, index) => ({
      sorte: 'role', role: 'button', nom: 'Ok', texte: true, clavier: true, zone: [40, 40], piece: null, balise: 'button', classes: [],
      mesures: mesures(), chemin: `main:1>button:${index + 1}`, selecteur: 'button', endroit: 'contenu', extrait: '<button>Ok</button>',
      ...o, page, index, id: idDe(page, index),
    })),
  );
  return {
    outil: { nom: 'ds-lab', version: '0' }, date: '2026-11-18 19:00', site: 'http://exemple.test', fenetre: { width: 1366, height: 900 },
    frameworks: frameworks.map((nom) => ({ nom, version: '1' })),
    pages: parPage.map((_, i) => ({ adresse: `http://exemple.test/p${i + 1}`, nom: `p${i + 1}`, statut: 200 })),
    lignes: /** @type {any[]} */ (lignes), captures: [],
  };
}
const vf = (/** @type {string} */ nom) => ({ nom, framework: 'Cadre' });
/** @param {any} c */
const parType = (c) => Object.fromEntries(c.types.map((/** @type {any} */ t) => [t.nom, t]));

test('K1 type par le rôle calculé, et par la signature sans rôle', () => {
  const c = construireConstat(releve([[
    { nom: 'Envoyer' }, { texte: false, nom: 'Fermer' }, { texte: false, nom: '' },
    { role: 'link' }, { role: 'textbox' }, { role: 'searchbox' }, { role: 'combobox' }, { role: 'listbox' },
    { role: 'checkbox' }, { role: 'radio' }, { role: 'switch' }, { role: 'tab' }, { role: 'menu' }, { role: 'dialog' }, { role: 'alertdialog' },
    { sorte: 'type', role: undefined, piece: { nom: 'x-puce', framework: 'Cadre', type: 'puce' } },
  ]], ['Cadre']));
  assert.deepEqual(Object.fromEntries(c.types.map((t) => [t.nom, t.fois])), {
    'bouton à icône seule': 2, 'champ de texte': 2, fenêtre: 2, 'liste déroulante': 2, 'bouton avec texte': 1, 'case à cocher': 1,
    interrupteur: 1, lien: 1, menu: 1, onglet: 1, puce: 1, radio: 1,
  });
});

test('K2 origine et nom stable', () => {
  const c = construireConstat(releve([[{ piece: vf('x-btn'), classes: ['x-btn'] }, { classes: ['eq-btn', 'eq-btn--large'] }, {}]], ['Cadre']));
  assert.deepEqual(parType(c)['bouton avec texte'].versions.map((/** @type {any} */ v) => [v.nom, v.origine, v.nomCode]), [
    ['bouton avec texte / Cadre / x-btn', 'Cadre', 'x-btn'],
    ['bouton avec texte / Fait maison / eq-btn', 'Fait maison', 'eq-btn'],
    ['bouton avec texte / Sans style / button', 'Sans style', 'button'],
  ]);
});

test('K3 deux jeux de mesures : une version, deux apparences comptées', () => {
  const c = construireConstat(releve([[{ classes: ['b'] }, { classes: ['b'], mesures: mesures(28) }, { classes: ['b'] }]]));
  const v = parType(c)['bouton avec texte'].versions;
  assert.equal(v.length, 1);
  assert.deepEqual(v[0].apparences.map((/** @type {any} */ a) => [a.fois, a.mesures.hauteur]), [[2, 36], [1, 28]]);
});

test('K4 gabarit : hors des chiffres, montré une fois ; pas sur une page, ni sur deux pages sur trois', () => {
  const entete = { classes: ['b'], chemin: 'header:1>button:1', nom: 'Aide' };
  const deux = construireConstat(releve([[entete, { classes: ['b'], chemin: 'main:1>button:1' }], [entete]]));
  assert.equal(deux.chiffres.elements, 1);
  assert.equal(parType(deux)['bouton avec texte'].gabarit.elements, 1);
  assert.deepEqual(parType(deux)['bouton avec texte'].gabarit.versions[0].pages, ['p1', 'p2']);
  assert.equal(construireConstat(releve([[entete, entete]])).chiffres.elements, 2);
  const trois = construireConstat(releve([[entete], [entete], [{ classes: ['b'], chemin: 'main:1>button:1' }]]));
  assert.equal(trois.chiffres.elements, 3);
  assert.equal(parType(trois)['bouton avec texte'].gabarit.elements, 0);
});

test('K5 candidats : répétés, les plus extérieurs, hors du gabarit', () => {
  const bloc = (/** @type {string} */ cl, /** @type {string} */ chemin, /** @type {number[]} */ ancetres = []) => ({ sorte: 'bloc', role: undefined, classes: [cl], chemin, ancetres });
  const c = construireConstat(releve([
    [bloc('carte', 'main:1>div:1'), bloc('carte__titre', 'main:1>div:1>h3:1', [0]), bloc('carte', 'main:1>div:2'), bloc('carte__titre', 'main:1>div:2>h3:1', [2]), bloc('seul', 'main:1>p:1'), bloc('entete', 'header:1')],
    [bloc('entete', 'header:1')],
  ]));
  assert.deepEqual(c.nonIdentifies.map((b) => [b.bloc, b.fois, b.etat]), [['carte', 2, 'pas encore décidé']]);
  assert.equal(c.chiffres.nonIdentifies, 2);
});

test('K6 égalité : les deux noms, sans choix ; effort = total moins le plus grand compte', () => {
  const c = construireConstat(releve([[{ role: 'textbox', classes: ['a'] }, { role: 'textbox', classes: ['a'] }, { role: 'textbox', classes: ['b'] }, { role: 'textbox', classes: ['b'] }]]));
  const t = parType(c)['champ de texte'];
  assert.deepEqual(t.sourceUnique, { x: 2, y: 4, plusRepandues: ['champ de texte / Fait maison / a', 'champ de texte / Fait maison / b'] });
  assert.equal(c.scores.effort, 2);
});

test('K7 accessibilité de base : un compte par critère ; une fenêtre n\'est pas une commande', () => {
  const c = construireConstat(releve([[{ nom: '' }, { clavier: false }, { zone: [40, 23] }, { nom: '', clavier: false }, {}, { role: 'dialog', nom: '', clavier: false }]]));
  assert.deepEqual(c.scores.accessibilite, { x: 1, y: 5, echecs: { nom: 2, clavier: 2, zone: 1 } });
});

test('K8 fichier de décisions mal formé : la ligne est nommée', () => {
  const erreur = (/** @type {any} */ d, /** @type {RegExp} */ motif) => assert.throws(() => validerDecisions(d, 'd.json'), (e) => /** @type {Error} */ (e).message.startsWith('d.json : ') && motif.test(/** @type {Error} */ (e).message));
  erreur([], /un objet est attendu/);
  erreur({ autre: 1 }, /clé inconnue « autre »/);
  erreur({ garder: {} }, /« garder » doit être une liste/);
  erreur({ garder: [{ type: 'lien' }] }, /garder, ligne 1 : « type » et « version »/);
  erreur({ garder: [{ type: 'lien', version: 'onglet / Cadre / x' }] }, /garder, ligne 1 : la version « onglet \/ Cadre \/ x » n'est pas du type « lien »/);
  erreur({ garder: [{ type: 'lien', version: 'lien / A / a' }, { type: 'lien', version: 'lien / B / b' }] }, /garder, ligne 2 : deux versions à garder/);
  erreur({ blocs: [{ bloc: 'x', sort: 'jeter' }] }, /blocs, ligne 1 : sort « jeter » inconnu/);
  erreur({ blocs: [{ bloc: 'x', sort: 'rattacher' }] }, /blocs, ligne 1 : un bloc rattaché nomme son type/);
  erreur({ blocs: [{ bloc: 'x', sort: 'laisser' }, { bloc: 'x', sort: 'laisser' }] }, /blocs, ligne 2 : deux sorts pour le bloc « x »/);
  assert.deepEqual(validerDecisions({ $comment: 'ok' }), { garder: [], blocs: [] });
});

test('K9 décisions : rattacher à un nouveau type, laisser, garder ; cibles absentes listées', () => {
  const bloc = (/** @type {string} */ cl, /** @type {number} */ i) => ({ sorte: 'bloc', role: undefined, classes: [cl], chemin: `main:1>div:${i}` });
  const r = releve([[{ classes: ['a'] }, { classes: ['b'] }, { classes: ['b'] }, bloc('bandeau', 1), bloc('bandeau', 2), bloc('pave', 3), bloc('pave', 4)]]);
  const d = validerDecisions({
    garder: [{ type: 'bouton avec texte', version: 'bouton avec texte / Fait maison / a' }, { type: 'lien', version: 'lien / Cadre / x' }],
    blocs: [{ bloc: 'bandeau', sort: 'rattacher', type: 'bandeau d’annonce' }, { bloc: 'pave', sort: 'laisser' }, { bloc: 'absent', sort: 'laisser' }],
  });
  const c = construireConstat(r, d);
  const t = parType(c);
  assert.equal(t['bandeau d’annonce'].fois, 2);
  assert.deepEqual(t['bandeau d’annonce'].versions.map((/** @type {any} */ v) => [v.nom, v.rattache]), [['bandeau d’annonce / Fait maison / bandeau', true]]);
  assert.deepEqual(c.nonIdentifies.map((b) => [b.bloc, b.etat]), [['pave', 'laissé tel quel']]);
  assert.equal(t['bouton avec texte'].garder, 'bouton avec texte / Fait maison / a');
  assert.equal(c.scores.effort, 2);
  assert.deepEqual(c.scores.versionsAGarder, { x: 1, y: 2 });
  assert.deepEqual(c.decisionsSansCible.map((x) => x.ligne), ['blocs', 'garder']);
  assert.match(c.decisionsSansCible[1].texte, /aucun élément du type « lien »/);
});

test('K10 phrase : sans table, accords au singulier, plusieurs frameworks', () => {
  assert.equal(construireConstat(releve([[{ classes: ['a'] }]])).phrase, '1 élément relevé, de 1 type, en 1 version. Aucun framework reconnu. 0 bloc n\'est pas identifié.');
  const c = construireConstat(releve([[{ piece: vf('x') }, { piece: { nom: 'y', framework: 'Autre' } }, { piece: { nom: 'y', framework: 'Autre' } }, {}]], ['Cadre', 'Autre']));
  assert.equal(c.phrase, '4 éléments relevés, de 1 type, en 3 versions. 1 vient de Cadre, 2 de Autre, 1 est fait autrement. 0 bloc n\'est pas identifié.');
});
