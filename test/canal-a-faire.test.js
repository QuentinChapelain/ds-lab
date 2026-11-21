// @ts-check
/**
 * Ce que verify pose lui-même, et ce qu'il dit de faire (docs/attendus/verify-se-reconnait.md, décisions de Quentin du
 * 17/11/2026). Fonctions pures, sur des objets à la forme du protocole DevTools (CSS.getMatchedStylesForNode).
 * Attendus écrits à la main avant le code (17/11/2026) :
 *   V1 feuilles : tokens.css et chaque feuille ajoutée, posés par verify dans un <style> qu'il crée, sont reconnus à
 *      leur texte et rangés « posé par verify » ; un <style> créé par un script de la page reste « script » ;
 *   V2 une variable qui est le jeton de la ligne n'est jamais posée avec elle-même pour repli : posée par tokens.css,
 *      le canal dit « posé par verify » et ne demande rien au site ; posée nulle part, il demande de charger
 *      tokens.css ; posée par la page (homonyme), il demande d'y écrire la valeur du jeton, sans var() ;
 *   V3 bloc injecté par un script : « poser la feuille ajoutée après lui » seulement si une feuille ajoutée porte une
 *      règle de cet élément pour cette propriété ;
 *   V4 raccourci dont l'origine porte !important : l'« à faire » le dit, dans verify et dans le fichier des pertes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { feuilleDe, canalDe } from '../src/verify/arrivee.js';
import { aFaireRaccourci } from '../src/apply/ajout.js';

const TOKENS = ':root {\n  --color-neutral-12: #2f3136;\n}\n';
const AJOUT = '.x {\n  color: var(--color-neutral-12, #212121); /* coul-21 */\n}\n';
/** @type {Map<string, { nom: string, sorte: 'jetons' | 'ajout' }>} */
const POSES = new Map([
  [TOKENS, { nom: '/styles/tokens.css', sorte: 'jetons' }],
  [AJOUT, { nom: '/styles/site.ajout.css', sorte: 'ajout' }],
]);
const ORIGINE = 'http://exemple.test';

test('V1 tokens.css et les feuilles ajoutées sont reconnus, jamais rangés « script »', () => {
  const pose = (/** @type {string} */ text) => ({ href: null, inline: false, constructed: false, text });
  assert.deepEqual(feuilleDe(pose(TOKENS), POSES, null, ORIGINE), { chemin: null, ajout: '/styles/tokens.css', sorte: 'jetons' });
  assert.deepEqual(feuilleDe(pose(AJOUT), POSES, null, ORIGINE), { chemin: null, ajout: '/styles/site.ajout.css', sorte: 'ajout' });
  assert.deepEqual(feuilleDe(pose('.theme { color: red; }'), POSES, null, ORIGINE), { chemin: null, ajout: null, sorte: 'script' });
  assert.deepEqual(feuilleDe({ href: `${ORIGINE}/styles/site.css`, inline: false, constructed: false, text: 'p{}' }, POSES, null, ORIGINE), {
    chemin: '/styles/site.css',
    ajout: null,
    sorte: 'fichier',
  });
});

/** Déclarations d'un style. @param {[string, string, boolean?, string[]?][]} props */
const style = (props) => ({
  cssProperties: props.map(([name, value, important, longues]) => ({
    name,
    value: important ? `${value} !important` : value,
    important: !!important,
    range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
    ...(longues ? { longhandProperties: longues.map((l) => ({ name: l, value: '' })) } : {}),
  })),
  range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
});
/** Règle appliquée. @param {string} id @param {string} sel @param {[string, string, boolean?, string[]?][]} props */
const regle = (id, sel, props) => ({ rule: { origin: 'regular', styleSheetId: id, selectorList: { text: sel }, style: style(props) } });
const PAR_ID = new Map([
  ['T', { chemin: null, ajout: '/styles/tokens.css', sorte: 'jetons' }],
  ['A', { chemin: null, ajout: '/styles/site.ajout.css', sorte: 'ajout' }],
  ['S', { chemin: null, ajout: null, sorte: 'script' }],
  ['F', { chemin: '/styles/site.css', ajout: null, sorte: 'fichier' }],
]);
const LIGNE = { cible: 'var(--color-neutral-12, #212121)', jeton: '--color-neutral-12', nouvelle: '#2f3136' };
const SOI = /--color-neutral-12: var\(--color-neutral-12/;

test('V2 variable du jeton posée par tokens.css : « posé par verify », rien à poser sur le site', () => {
  const m = {
    matchedCSSRules: [regle('A', '.x', [['color', 'var(--color-neutral-12, #212121)']])],
    inherited: [{ matchedCSSRules: [regle('T', ':root', [['--color-neutral-12', '#2f3136']])] }],
  };
  const c = canalDe(m, 'color', PAR_ID, LIGNE);
  assert.ok(c.categories.includes('posé par verify'), JSON.stringify(c));
  assert.match(c.texte, /tokens\.css/);
  assert.doesNotMatch(c.texte, /injecté/);
  assert.doesNotMatch(c.aFaire, SOI);
  assert.doesNotMatch(c.aFaire, /^poser /);
});

test('V2 variable du jeton posée nulle part : charger tokens.css, sans var() d\'elle-même', () => {
  const m = { matchedCSSRules: [regle('A', '.x', [['color', 'var(--color-neutral-12, #212121)']])], inherited: [] };
  const c = canalDe(m, 'color', PAR_ID, LIGNE);
  assert.doesNotMatch(c.aFaire, SOI);
  assert.match(c.aFaire, /charger tokens\.css/);
});

test('V2 variable du jeton posée par la page (homonyme) : y écrire la valeur du jeton', () => {
  const m = {
    matchedCSSRules: [regle('A', '.x', [['color', 'var(--color-neutral-12, #212121)']])],
    inherited: [{ matchedCSSRules: [regle('F', '.zone', [['--color-neutral-12', '#212121']])] }],
  };
  const c = canalDe(m, 'color', PAR_ID, LIGNE);
  assert.doesNotMatch(c.aFaire, SOI);
  assert.match(c.aFaire, /poser --color-neutral-12: #2f3136 là où elle est posée/);
  assert.match(c.texte, /\/styles\/site\.css/);
});

test('V3 bloc injecté : la feuille ajoutée n\'est proposée que si elle porte une règle de l\'élément pour la propriété', () => {
  const LIGNE_OR = { cible: 'var(--couleur-or-10, #a77850)', jeton: '--couleur-or-10', nouvelle: '#9a6c44' };
  const seul = { matchedCSSRules: [regle('S', '.primary', [['background-color', '#a77850', true]])], inherited: [] };
  const a = canalDe(seul, 'background-color', PAR_ID, LIGNE_OR);
  assert.deepEqual(a.categories, ['bloc de style injecté par un script']);
  assert.doesNotMatch(a.aFaire, /feuille ajoutée/);
  assert.match(a.aFaire, /var\(--couleur-or-10, #a77850\)/);
  const avec = {
    matchedCSSRules: [regle('A', '.primary', [['background-color', 'var(--couleur-or-10, #a77850)', true]]), regle('S', '.primary', [['background-color', '#a77850', true]])],
    inherited: [],
  };
  assert.match(canalDe(avec, 'background-color', PAR_ID, LIGNE_OR).aFaire, /poser la feuille ajoutée \/styles\/site\.ajout\.css après lui/);
});

test('V4 raccourci d\'origine !important : l\'« à faire » le dit', () => {
  const LIGNE_GRIS = { cible: 'var(--color-neutral-10, #808080)', jeton: '--color-neutral-10', nouvelle: '#7b7e85' };
  const m = {
    matchedCSSRules: [regle('F', '.carre', [['border', 'thin solid var(--color)', true, ['border-top-color']]])],
    inlineStyle: style([['--color', '#808080']]),
    inherited: [],
  };
  const c = canalDe(m, 'border-top-color', PAR_ID, LIGNE_GRIS);
  assert.ok(c.categories.includes('raccourci'), JSON.stringify(c));
  assert.match(c.aFaire, /écrire border-top-color à part, avec !important, après le raccourci border \(qui porte !important\)/);
  assert.match(
    aFaireRaccourci({ propriete: 'border-top-color', source: 'thin solid var(--color)', valeur: 'var(--color-neutral-10, #808080)', jeton: '--color-neutral-10', important: true }),
    /le raccourci porte !important : écrire border-top-color avec !important/,
  );
  assert.doesNotMatch(aFaireRaccourci({ propriete: 'border-top-color', source: 'thin solid var(--color)', valeur: 'var(--color-neutral-10, #808080)', jeton: '--color-neutral-10', important: false }), /important/);
});
