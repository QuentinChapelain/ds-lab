// @ts-check
/**
 * Séance 3b, M0 : emplacements de marque. Les rôles qui citaient couleur.bleu.* et couleur.terre.*
 * pointent vers marque.primaire.* et marque.accent.* (tokens/orbe-cafe/marque.tokens.json) ;
 * pour Orbe Café, primaire → bleu, accent → terre, accent.sur-plein → blanc (décision de la 3a).
 * Aucun rôle renommé, ajouté ni retiré ; aucun ratio ne bouge.
 *
 * Attendu écrit à la main avant le code, relevé à a618e47 (15/11/2026) :
 *   hex des 42 rôles, résolus à la main dans primitives et statuts, commande :
 *     node --input-type=module -e 'import { readFileSync } from "node:fs";
 *       const L=f=>JSON.parse(readFileSync("tokens/orbe-cafe/"+f,"utf8"));
 *       const P=L("primitives.tokens.json").couleur, S=L("statuts.tokens.json").couleur, sem=L("semantique.tokens.json");
 *       … parcours de sem, alias {couleur.<échelle>.<pas>} ou {couleur.blanc} lu dans P ou S …'
 *   empreinte de la sortie de npm run contraste : npm run -s contraste | shasum -a 256 ;
 *   empreinte de roles.html : shasum -a 256 tokens/orbe-cafe/roles.html.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { generateScale } from '../src/valise/generate.js';
import { scaleToDtcg } from '../src/tokens/primitives.js';
import { loadRoles, resolveRoles, contratRoles } from '../src/tokens/roles.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const load = (/** @type {string} */ f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));
const sha = (/** @type {string | Buffer} */ s) => createHash('sha256').update(s).digest('hex');

const CONTRASTE_SHA256 = 'b1d321dae32dd1351b1a5f0dcea56c473cc63d65c5cf1924c4823e5a70423f33';
const PLANCHE_SHA256 = 'f2c77f6da1f7591537bbfe071e4bf1a5cba58cfe83a1d4e1efbe64e9258a131d';
const STEPS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'sur-plein'];

/** Rôles qui passent par la marque, et leur emplacement. */
const VIA_MARQUE = {
  'fond.interactif.discret': 'marque.primaire.3',
  'fond.interactif.fort': 'marque.primaire.9',
  'fond.interactif.fort.survol': 'marque.primaire.10',
  'fond.accent.fort': 'marque.accent.10',
  'texte.interactif': 'marque.primaire.11',
  'texte.accent': 'marque.accent.11',
  'texte.sur-interactif': 'marque.primaire.sur-plein',
  'texte.sur-accent': 'marque.accent.sur-plein',
  'bordure.focus': 'marque.primaire.9',
};

/** Hex des 42 rôles à a618e47. */
const HEX_A618E47 = new Map([
  ['fond.app', '#fbfbfb'],
  ['fond.discret', '#f8f8f7'],
  ['fond.surface', '#ffffff'],
  ['fond.inverse', '#363026'],
  ['fond.composant', '#f3f2f1'],
  ['fond.composant.survol', '#ecebe9'],
  ['fond.composant.appui', '#e3e2df'],
  ['fond.interactif.discret', '#f1f3f7'],
  ['fond.interactif.fort', '#2b4c7e'],
  ['fond.interactif.fort.survol', '#27487a'],
  ['fond.accent.fort', '#ba4834'],
  ['fond.erreur.discret', '#fff0ee'],
  ['fond.erreur.fort', '#d93036'],
  ['fond.succes.discret', '#ecf4ef'],
  ['fond.succes.fort', '#1a7e50'],
  ['fond.avertissement.discret', '#fef1de'],
  ['fond.avertissement.fort', '#e5a000'],
  ['fond.info.discret', '#e8f5ff'],
  ['fond.info.fort', '#017bba'],
  ['texte.principal', '#363026'],
  ['texte.secondaire', '#6d675b'],
  ['texte.interactif', '#4c6994'],
  ['texte.accent', '#b3422b'],
  ['texte.erreur', '#cb1d2a'],
  ['texte.succes', '#00774a'],
  ['texte.avertissement', '#8b5f00'],
  ['texte.info', '#006da6'],
  ['texte.sur-interactif', '#ffffff'],
  ['texte.sur-accent', '#ffffff'],
  ['texte.sur-erreur', '#ffffff'],
  ['texte.sur-succes', '#ffffff'],
  ['texte.sur-avertissement', '#4c3200'],
  ['texte.sur-info', '#ffffff'],
  ['texte.sur-inverse', '#ffffff'],
  ['bordure.discrete', '#d8d6d2'],
  ['bordure.defaut', '#bfbbb5'],
  ['bordure.forte', '#958f84'],
  ['bordure.focus', '#2b4c7e'],
  ['bordure.erreur', '#e76862'],
  ['bordure.succes', '#529f76'],
  ['bordure.avertissement', '#bf8501'],
  ['bordure.info', '#2f97da'],
]);

const marque = load('marque.tokens.json');

test('M0 marque.tokens.json : DTCG 2025.10, primaire et accent, 12 pas et sur-plein chacun', () => {
  assert.match(marque.$description, /DTCG 2025\.10/);
  assert.equal(marque.marque.$type, 'color');
  for (const slot of ['primaire', 'accent']) {
    assert.deepEqual(Object.keys(marque.marque[slot]).filter((k) => !k.startsWith('$')), STEPS, slot);
    assert.ok(marque.marque[slot].$description, `${slot} : description`);
    for (const k of STEPS) assert.ok(typeof marque.marque[slot][k].$description === 'string' && marque.marque[slot][k].$description, `${slot}.${k} : description`);
  }
});

test('M0 Orbe Café : primaire → bleu, accent → terre, accent.sur-plein → blanc ; alias seulement', () => {
  for (const k of STEPS) {
    assert.equal(marque.marque.primaire[k].$value, `{couleur.bleu.${k}}`, `primaire.${k}`);
    assert.equal(marque.marque.accent[k].$value, k === 'sur-plein' ? '{couleur.blanc}' : `{couleur.terre.${k}}`, `accent.${k}`);
  }
  assert.doesNotMatch(JSON.stringify(marque), /#[0-9a-fA-F]{3,8}\b|"components"/);
});

test('M0 les rôles de marque pointent vers marque.* ; aucun rôle ne cite couleur.bleu ni couleur.terre', () => {
  const s = readFileSync(join(DIR, 'semantique.tokens.json'), 'utf8');
  assert.doesNotMatch(s, /\{couleur\.(bleu|terre)\./);
  const sem = load('semantique.tokens.json');
  /** @param {string} role */
  const tokenOf = (role) => {
    let n = sem;
    for (const k of role.split('.')) n = n[k];
    return '$value' in n ? n : n.$root;
  };
  for (const [role, slot] of Object.entries(VIA_MARQUE)) assert.equal(tokenOf(role).$value, `{${slot}}`, role);
});

test('M0 les 42 rôles se résolvent vers les hex de a618e47', () => {
  const roles = resolveRoles(load('semantique.tokens.json'), load('primitives.tokens.json'), load('statuts.tokens.json'), marque);
  assert.deepEqual([...roles.keys()].sort(), [...HEX_A618E47.keys()].sort());
  for (const [role, hex] of HEX_A618E47) assert.equal(roles.get(role)?.hex, hex, role);
});

test('M0 loadRoles lit la marque ; une autre marque et une échelle ajoutée se branchent sans toucher aux rôles', () => {
  assert.deepEqual(loadRoles(DIR).marque, marque);
  // Témoin fictif : une seule source, primaire = accent, sur-plein blanc.
  const tmp = mkdtempSync(join(tmpdir(), 'marque-'));
  const g = generateScale('temoin', '#6a3fb0');
  writeFileSync(join(tmp, 'echelle.tokens.json'), JSON.stringify({ couleur: { $type: 'color', temoin: scaleToDtcg(g, 'Témoin fictif') } }));
  const slot = Object.fromEntries(STEPS.map((k) => [k, { $value: k === 'sur-plein' ? '{couleur.blanc}' : `{couleur.temoin.${k}}`, $description: 'témoin' }]));
  writeFileSync(join(tmp, 'marque.tokens.json'), JSON.stringify({ marque: { $type: 'color', primaire: slot, accent: slot } }));
  const set = loadRoles(DIR, { marque: join(tmp, 'marque.tokens.json'), echelles: [join(tmp, 'echelle.tokens.json')] });
  const roles = resolveRoles(set.semantique, set.primitives, set.statuts, set.marque, ...set.echelles);
  assert.equal(roles.get('fond.interactif.fort')?.hex, g.steps[8]);
  assert.equal(roles.get('fond.accent.fort')?.hex, g.steps[9]);
  assert.equal(roles.get('texte.accent')?.hex, g.steps[10]);
  assert.equal(roles.get('texte.sur-interactif')?.hex, '#ffffff');
  assert.equal(roles.get('texte.principal')?.hex, HEX_A618E47.get('texte.principal'));
  assert.equal(contratRoles(set).pairs.length, 48);
});

test('M0 sortie de npm run contraste identique à a618e47', () => {
  const out = execFileSync(process.execPath, [join(ROOT, 'src', 'cli', 'contraste.js')], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(sha(out), CONTRASTE_SHA256);
});

test('M0 planche identique à a618e47', () => {
  assert.equal(sha(readFileSync(join(DIR, 'roles.html'))), PLANCHE_SHA256);
});
