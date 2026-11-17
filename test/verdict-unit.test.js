// @ts-check
/**
 * Verdict par ligne décidée (docs/attendus/verdict-par-decision.md, décisions de Quentin du 17/11/2026), sans
 * navigateur : juger (src/verify/arrivee.js) reçoit le manifeste des feuilles ajoutées et, par page vérifiée, les
 * opérations relevées (élément, propriété, déclaration qui tenait la valeur, valeurs avant et après la pose, valeur
 * visée, canal quand elle n'arrive pas). Attendus écrits à la main avant le code :
 *   V1 une ligne est « arrivée » si chacune de ses opérations l'est, « en partie » si certaines le sont, « non
 *      arrivée » si aucune, avec le compte en déclarations et en éléments ; une opération dont la valeur était déjà
 *      la valeur visée avant la pose ne compte jamais comme arrivée : « déjà en place », compté à part ;
 *   V2 sans opération : « non vérifiable (état) » pour une ligne vue seulement à un état forcé, « hors des pages
 *      vérifiées » si aucune de ses pages n'est vérifiée, « non vue » sinon ;
 *   V3 sortie 1 pour en partie, non arrivée, déjà en place et non vue ; 0 sinon ;
 *   V4 phrase finale : chaque état compté ; « Toutes les lignes décidées sont arrivées » seulement si chaque ligne
 *      l'est ; jamais « chaque ligne écrite est arrivée » ;
 *   V5 textes : la ligne, son état et ses comptes ; pour une ligne qui n'arrive pas entière, chaque déclaration par
 *      page, ce qu'elle est (écrite, non écrite et sa cause, hors de modifications.json), ce qui tient la valeur et
 *      ce qu'il faut faire ; les causes hors de modifications.json de la ligne.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { juger } from '../src/verify/arrivee.js';

/** @param {string} id @param {string[]} pages @param {Record<string, any>} [x] */
const ligne = (id, pages, x = {}) => ({ id, titre: `Titre ${id}`, cles: [`k|${id}`], ancienne: '4px', nouvelle: '8px', jeton: '--e-8', pages, ...x });
const ECRITE = { ecrite: true, cause: null, injectee: false };
const CANAL = { categories: ['raccourci'], texte: 'raccourci padding de /s/a.css:9:1 .d', aFaire: 'écrire padding-left à part dans la source, avec var(--e-8, 4px)' };
/** @param {string} l @param {number} element @param {string} declaration @param {string} avant @param {string} apres @param {Record<string, any>} [x] */
const op = (l, element, declaration, avant, apres, x = {}) => ({ ligne: l, element, propriete: 'padding-left', declaration, annotation: ECRITE, avant, apres, visee: '8px', canal: null, ...x });

const MANIFESTE = {
  lignes: [
    ligne('coul-01', ['/a']),
    ligne('esp-02', ['/a']),
    ligne('coul-03', ['/a']),
    ligne('coul-04', ['/a']),
    ligne('esp-05', ['/a']),
    ligne('esp-06', ['/b']),
    ligne('coul-07', [], { etats: ['survol'] }),
  ],
  hors: [{ lignes: ['coul-03'], cause: 'jeton absent', texte: 'coul-03 Titre coul-03 : jeton absent pour #abcdef ; …' }],
};
const RELEVES = [
  {
    page: '/a',
    hauteurs: { intacte: 900, avecFeuilles: 900 },
    ops: [
      op('coul-01', 0, '/s/a.css:1:1 .a', '4px', '8px'),
      op('esp-02', 1, '/s/a.css:3:1 .c', '4px', '8px'),
      op('esp-02', 2, '/s/a.css:9:1 .d', '4px', '4px', { annotation: { ecrite: false, cause: 'raccourci', injectee: false }, canal: CANAL }),
      op('coul-03', 3, '/s/a.css:12:1 .e', '4px', '4px', { annotation: { ecrite: null, cause: null, injectee: false }, canal: { categories: ['autre règle'], texte: '/s/a.css:12:1 .e', aFaire: 'faire gagner 8px contre /s/a.css:12:1 .e' } }),
      op('coul-04', 4, '/s/a.css:15:1 .f', '8px', '8px'),
    ],
  },
];

const etats = (/** @type {any} */ j) => Object.fromEntries(j.lignes.map((/** @type {any} */ l) => [l.id, l.etat]));

test('V1, V2 un état par ligne décidée, avec ses comptes', () => {
  const j = juger(MANIFESTE, RELEVES);
  assert.deepEqual(etats(j), {
    'coul-01': 'arrivée',
    'esp-02': 'en partie',
    'coul-03': 'non arrivée',
    'coul-04': 'déjà en place',
    'esp-05': 'non vue',
    'esp-06': 'hors des pages vérifiées',
    'coul-07': 'non vérifiable (état)',
  });
  const esp02 = j.lignes.find((/** @type {any} */ l) => l.id === 'esp-02');
  assert.deepEqual([esp02.declarations, esp02.elements, esp02.dejaEnPlace], [{ arrivees: 1, total: 2 }, { arrivees: 1, total: 2 }, 0]);
  const coul04 = j.lignes.find((/** @type {any} */ l) => l.id === 'coul-04');
  assert.deepEqual([coul04.declarations, coul04.elements, coul04.dejaEnPlace], [{ arrivees: 0, total: 0 }, { arrivees: 0, total: 0 }, 1]);
});

test('V3, V4 sortie 1 et phrase finale qui compte chaque état', () => {
  const j = juger(MANIFESTE, RELEVES);
  assert.equal(j.sortie, 1);
  assert.equal(j.resume, 'Lignes décidées : 7 ; arrivées 1, en partie 1, non arrivées 1, déjà en place 1, non vues 1, hors des pages vérifiées 1, non vérifiables (état) 1.');
});

test('V3, V4 hors des pages vérifiées et non vérifiable (état) : sans effet sur la sortie, comptées', () => {
  const m = { lignes: MANIFESTE.lignes.filter((l) => ['coul-01', 'esp-06', 'coul-07'].includes(l.id)), hors: [] };
  const j = juger(m, RELEVES);
  assert.equal(j.sortie, 0);
  assert.equal(j.resume, 'Lignes décidées : 3 ; arrivées 1, en partie 0, non arrivées 0, déjà en place 0, non vues 0, hors des pages vérifiées 1, non vérifiables (état) 1.');
  assert.ok(!/arrivées? sont arrivées|écrite est arrivée/.test(j.resume));
});

test('V3, V4 déjà en place seule : sortie 1 ; toutes arrivées : la phrase le dit ; aucune ligne décidée', () => {
  assert.equal(juger({ lignes: [ligne('coul-04', ['/a'])], hors: [] }, RELEVES).sortie, 1);
  const tout = juger({ lignes: [ligne('coul-01', ['/a'])], hors: [] }, RELEVES);
  assert.deepEqual([tout.sortie, tout.resume], [0, 'Toutes les lignes décidées sont arrivées (1).']);
  const rien = juger({ lignes: [], hors: [] }, RELEVES);
  assert.deepEqual([rien.sortie, rien.resume], [0, 'Aucune ligne décidée.']);
});

test('V5 textes : ligne, déclarations, ce qui tient la valeur, ce qu\'il faut faire', () => {
  const j = juger(MANIFESTE, RELEVES);
  const t = Object.fromEntries(j.lignes.map((/** @type {any} */ l) => [l.id, l]));
  assert.equal(t['coul-01'].texte, 'coul-01 Titre coul-01 : arrivée (1 déclaration, 1 élément)');
  assert.equal(t['esp-02'].texte, 'esp-02 Titre esp-02 : en partie (1 déclaration sur 2, 1 élément sur 2)');
  assert.deepEqual(t['esp-02'].details, [
    '/a /s/a.css:3:1 .c { padding-left } : écrite ; arrivée (1 élément)',
    '/a /s/a.css:9:1 .d { padding-left } : non écrite (raccourci) ; non arrivée (0 élément sur 1) ; tient : raccourci padding de /s/a.css:9:1 .d ; à faire : écrire padding-left à part dans la source, avec var(--e-8, 4px)',
  ]);
  assert.equal(t['coul-03'].texte, 'coul-03 Titre coul-03 : non arrivée (0 déclaration sur 1, 0 élément sur 1) ; hors de modifications.json : jeton absent');
  assert.deepEqual(t['coul-03'].details, [
    '/a /s/a.css:12:1 .e { padding-left } : hors de modifications.json ; non arrivée (0 élément sur 1) ; tient : /s/a.css:12:1 .e ; à faire : faire gagner 8px contre /s/a.css:12:1 .e',
  ]);
  assert.equal(t['coul-04'].texte, 'coul-04 Titre coul-04 : déjà en place (1 élément : la valeur visée y était avant la pose)');
  assert.equal(t['esp-05'].texte, 'esp-05 Titre esp-05 : non vue (aucun élément sur /a)');
  assert.equal(t['esp-06'].texte, 'esp-06 Titre esp-06 : hors des pages vérifiées (/b)');
  assert.equal(t['coul-07'].texte, 'coul-07 Titre coul-07 : non vérifiable (état : survol)');
});

test('V1 une déclaration sur deux pages : arrivée seulement si elle l\'est sur chacune', () => {
  const m = { lignes: [ligne('esp-02', ['/a', '/b'])], hors: [] };
  const deux = [
    { page: '/a', hauteurs: { intacte: 1, avecFeuilles: 1 }, ops: [op('esp-02', 0, '/s/a.css:3:1 .c', '4px', '8px')] },
    { page: '/b', hauteurs: { intacte: 1, avecFeuilles: 1 }, ops: [op('esp-02', 0, '/s/a.css:3:1 .c', '4px', '4px', { canal: CANAL })] },
  ];
  const l = juger(m, deux).lignes[0];
  assert.deepEqual([l.etat, l.declarations, l.elements], ['en partie', { arrivees: 0, total: 1 }, { arrivees: 1, total: 2 }]);
});
