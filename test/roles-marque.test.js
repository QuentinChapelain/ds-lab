// @ts-check
/**
 * Séance 3b : emplacements de marque (tokens/orbe-cafe/marque.tokens.json).
 *
 * M0 (15/11/2026) : les rôles qui citaient couleur.bleu.* et couleur.terre.* pointent vers marque.primaire.*
 * et marque.accent.* ; Orbe Café : primaire → bleu, accent → terre. Aucun rôle renommé, ajouté ni retiré.
 *
 * Règle des pleins en trois cas (décision du 15/11/2026), déclarée dans la couche marque, jamais dans les rôles ;
 * classe lue sur le pas 9 de l'échelle :
 *   sombre : blanc ≥ 5,5 sur le pas 9 [H] → plein = pas 9, texte blanc, survol = pas 9 + voile blanc 8 % ;
 *   clair  : sinon, clarté OKLCH ≥ 0,70 et teinte OKLCH dans [55°, 115°] (jaune ou orangé) [H]
 *            → plein = pas 9, texte = pas 12, survol = pas 10 ;
 *   moyen  : le reste → plein = pas 11, texte blanc, survol = pas 12.
 *   Emplacements : primaire, accent (12 pas + plein, plein-survol, sur-plein) ; erreur, succes, avertissement,
 *   info (plein, plein-survol, sur-plein). Le voile est la seule valeur calculée : couleur en DTCG, formule en
 *   $extensions["ds-lab.voile"] (base, blanc), recalculée ici avec culori (interpolate en sRGB, comme le navigateur).
 *
 * Attendu écrit à la main avant le code. Classes et OKLCH du pas 9 (culori, oklch()), commande :
 *   node local/scripts/criteres-pleins.mjs "$PWD" (essai du 15/11/2026, avant le code) :
 *   bleu 9 #2b4c7e L 0,417 h 258,5 blanc 8,61 → sombre ; terre 9 #c8553d L 0,593 h 33,4 blanc 4,35 → moyen ;
 *   erreur 9 #d93036 L 0,580 h 24,8 → moyen ; succes 9 #1f8a5b L 0,563 h 158,9 → moyen ;
 *   avertissement 9 #e5a000 L 0,753 h 77,8 blanc 2,24 → clair ; info 9 #0284c7 L 0,588 h 242,0 → moyen.
 * Hex des 42 rôles : relevés à a618e47 (commande de M0), puis, pour les pleins, d'après la règle ci-dessus
 * (node local/scripts/ratios-pleins.mjs : voile #3c5a88, terre 11 #b3422b, erreur 11 #cb1d2a, succes 11 #00774a,
 * info 11 #006da6, avertissement 12 #442d01).
 * Décision du 15/11/2026 : bordure.focus → marque.primaire.11 pour toutes les marques (bleu 11 #4c6994).
 * Étape 4a, lot 3 bis (15/11/2026, décisions sur image) : nouvelle règle pour le primaire et l'accent, lue sur
 *   l'échelle : blanc ≥ 5,5 sombre (voile) ; blanc ≥ 4,5 soutenu (pas 9, blanc, survol pas 10) ; pas 12 ≥ 7 sur le
 *   pas 9 et ≥ 4,5 sur le pas 10 clair ; sinon moyen. Statuts figés (STATUTS_FIGES), Orbe Café inchangé.
 *   Cas limites fictifs, échelles de generateScale, culori wcagContrast (commande : node --input-type=module -e) :
 *   #ffffff clair (pas 12 sur 9 : 13,01) ; #000000 sombre ; #ffe14d clair (9,96 / 8,47) ; #8a6a00 soutenu
 *   (blanc 5,07, 5,31 sur le pas 10) ; #4dd2ff clair (7,41 / 6,26) ; #9d5bd2 moyen (blanc 4,32, pas 12 sur 9 : 3,02).
 * Séance 3c, typo (15/11/2026) : la couche marque porte aussi marque.police (titre, texte ; $type fontFamily),
 * produite par marqueTokens (paramètre polices) ; les tests ci-dessous portent sur les six emplacements de couleur.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { interpolate, formatHex, rgb } from 'culori';
import { generateScale } from '../src/valise/generate.js';
import { loadRoles, resolveRoles, contratRoles } from '../src/tokens/roles.js';
import { fondsClairs } from '../src/tokens/saisie.js';
import { AJOUTS } from './helpers/lot5.js';
import { classePlein, voileBlanc, marqueTokens, SOMBRE_BLANC, BLANC_MIN, TEXTE_FONCE, TEXTE_FONCE_SURVOL, STATUTS_FIGES, VOILE_BLANC } from '../src/tokens/pleins.js';
import { charger, avecAplat, COMMUN, ORBE } from './helpers/jetons.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const load = charger;
const STEPS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const CASES = ['plein', 'plein-survol', 'sur-plein'];
const STATUTS = ['erreur', 'succes', 'avertissement', 'info'];
/** Polices d'Orbe Café (séance 3c, typo). */
const POLICES = { titre: ['Georgia', 'serif'], texte: ['Orbe Sans', 'Arial', 'sans-serif'] };
/** Emplacements de couleur seulement (sans marque.police). @param {any} m */
const couleurs = (m) => Object.entries(m).filter(([k, g]) => !k.startsWith('$') && g.$type !== 'fontFamily');

/** Emplacement → [échelle, classe, plein, plein-survol (alias ou « voile »), sur-plein]. */
const EMPLACEMENTS = {
  primaire: ['bleu', 'sombre', '{couleur.bleu.9}', 'voile', '{couleur.blanc}'],
  accent: ['terre', 'moyen', '{couleur.terre.11}', '{couleur.terre.12}', '{couleur.blanc}'],
  erreur: ['erreur', 'moyen', '{couleur.erreur.11}', '{couleur.erreur.12}', '{couleur.blanc}'],
  succes: ['succes', 'moyen', '{couleur.succes.11}', '{couleur.succes.12}', '{couleur.blanc}'],
  avertissement: ['avertissement', 'clair', '{couleur.avertissement.9}', '{couleur.avertissement.10}', '{couleur.avertissement.12}'],
  info: ['info', 'moyen', '{couleur.info.11}', '{couleur.info.12}', '{couleur.blanc}'],
};

/** Rôles qui passent par la marque, et leur case. */
const VIA_MARQUE = {
  'fond.interactif.discret': 'marque.primaire.3',
  'fond.interactif.fort': 'marque.primaire.plein',
  'fond.interactif.fort.survol': 'marque.primaire.plein-survol',
  'fond.accent.fort': 'marque.accent.plein',
  'texte.interactif': 'marque.primaire.11',
  'texte.accent': 'marque.accent.11',
  'texte.sur-interactif': 'marque.primaire.sur-plein',
  'texte.sur-accent': 'marque.accent.sur-plein',
  'bordure.focus': 'marque.primaire.11',
  ...Object.fromEntries(STATUTS.flatMap((s) => [[`fond.${s}.fort`, `marque.${s}.plein`], [`texte.sur-${s}`, `marque.${s}.sur-plein`]])),
};

/** Hex attendus des 42 rôles. */
const HEX = new Map([
  ['fond.app', '#fbfbfb'],
  ['fond.discret', '#f8f8f7'],
  ['fond.surface', '#ffffff'],
  ['fond.inverse', '#363026'],
  ['fond.composant', '#f3f2f1'],
  ['fond.composant.survol', '#ecebe9'],
  ['fond.composant.appui', '#e3e2df'],
  ['fond.interactif.discret', '#f1f3f7'],
  ['fond.interactif.fort', '#2b4c7e'],
  ['fond.interactif.fort.survol', '#3c5a88'],
  ['fond.accent.fort', '#b3422b'],
  ['fond.erreur.discret', '#fff0ee'],
  ['fond.erreur.fort', '#cb1d2a'],
  ['fond.succes.discret', '#ecf4ef'],
  ['fond.succes.fort', '#00774a'],
  ['fond.avertissement.discret', '#fef1de'],
  ['fond.avertissement.fort', '#e5a000'],
  ['fond.info.discret', '#e8f5ff'],
  ['fond.info.fort', '#006da6'],
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
  ['texte.sur-avertissement', '#442d01'],
  ['texte.sur-info', '#ffffff'],
  ['texte.sur-inverse', '#ffffff'],
  ['bordure.discrete', '#d8d6d2'],
  ['bordure.defaut', '#bfbbb5'],
  ['bordure.forte', '#958f84'],
  ['bordure.focus', '#4c6994'],
  ['bordure.erreur', '#e76862'],
  ['bordure.succes', '#529f76'],
  ['bordure.avertissement', '#bf8501'],
  ['bordure.info', '#2f97da'],
]);

/** Fichier versionné, tel quel ; les rôles se résolvent avec les emplacements communs de l'aplat (étape 4b, lot 2 bis). */
const marque = JSON.parse(readFileSync(join(ORBE, 'marque.tokens.json'), 'utf8'));
const prim = load('primitives.tokens.json').couleur;
const stat = load('statuts.tokens.json').couleur;
const stepsOf = (/** @type {string} */ s) => STEPS.map((k) => (prim[s] ?? stat[s])[k].$value.hex);

test('Pleins : seuils de la règle (blanc 4,5 et 5,5 ; texte foncé 7 et 4,5 sur le survol ; voile 8 %)', () => {
  assert.equal(BLANC_MIN, 4.5);
  assert.equal(SOMBRE_BLANC, 5.5);
  assert.equal(TEXTE_FONCE, 7);
  assert.equal(TEXTE_FONCE_SURVOL, 4.5);
  assert.equal(VOILE_BLANC, 0.08);
});

test('Pleins : classe des six emplacements d\'Orbe Café (primaire et accent par la règle, statuts figés)', () => {
  for (const [slot, [scale, classe]] of Object.entries(EMPLACEMENTS)) {
    if (STATUTS.includes(slot)) assert.equal(STATUTS_FIGES[slot].classe, classe, slot);
    else assert.equal(classePlein(stepsOf(scale)), classe, scale);
  }
});

test('Pleins : cas limites fictifs', () => {
  const c = (/** @type {string} */ hex) => classePlein(generateScale('t', hex).steps);
  assert.equal(c('#ffffff'), 'clair', 'blanc : pas 12 à 13,01 sur le pas 9');
  assert.equal(c('#000000'), 'sombre');
  assert.equal(c('#ffe14d'), 'clair', 'jaune clair');
  assert.equal(c('#8a6a00'), 'soutenu', 'blanc entre 4,5 et 5,5');
  assert.equal(c('#4dd2ff'), 'clair', 'cyan clair : 7,41 sur le pas 9');
  assert.equal(c('#9d5bd2'), 'moyen', 'ni blanc 4,5 ni pas 12 à 7');
});

test('Pleins : voile blanc 8 % recalculé avec culori (sRGB)', () => {
  const want = formatHex(interpolate(['#2b4c7e', '#ffffff'], 'rgb')(0.08));
  assert.equal(want, '#3c5a88');
  assert.equal(voileBlanc('#2b4c7e', 0.08), want);
});

test('M0 marque.tokens.json : DTCG 2025.10, six emplacements', () => {
  assert.match(marque.$description, /DTCG 2025\.10/);
  assert.equal(marque.marque.$type, 'color');
  assert.deepEqual(couleurs(marque.marque).map(([k]) => k), Object.keys(EMPLACEMENTS));
  assert.deepEqual(Object.keys(marque.marque).filter((k) => !k.startsWith('$')), [...Object.keys(EMPLACEMENTS), 'police']);
  // Étape 4a, lot 5 : le primaire porte en dernier texte-grand.
  assert.deepEqual(Object.keys(marque.marque.primaire).filter((k) => !k.startsWith('$')), [...STEPS, ...CASES, 'texte-grand']);
  assert.deepEqual(Object.keys(marque.marque.accent).filter((k) => !k.startsWith('$')), [...STEPS, ...CASES]);
  for (const s of STATUTS) assert.deepEqual(Object.keys(marque.marque[s]).filter((k) => !k.startsWith('$')), CASES, s);
  for (const [slot, g] of Object.entries(marque.marque)) {
    if (slot.startsWith('$')) continue;
    assert.ok(g.$description, `${slot} : description`);
    for (const [k, t] of Object.entries(g)) if (!k.startsWith('$')) assert.ok(typeof t.$description === 'string' && t.$description, `${slot}.${k} : description`);
  }
});

test('M0 primaire → bleu, accent → terre : 12 pas en alias', () => {
  for (const k of STEPS) {
    assert.equal(marque.marque.primaire[k].$value, `{couleur.bleu.${k}}`, `primaire.${k}`);
    assert.equal(marque.marque.accent[k].$value, `{couleur.terre.${k}}`, `accent.${k}`);
  }
});

test('Pleins : classe, plein, survol et sur-plein de chaque emplacement', () => {
  for (const [slot, [scale, classe, plein, survol, sur]] of Object.entries(EMPLACEMENTS)) {
    const g = marque.marque[slot];
    assert.equal(g.$extensions?.['ds-lab.plein']?.classe, classe, `${slot} : classe`);
    assert.equal(g.plein.$value, plein, `${slot}.plein`);
    assert.equal(g['sur-plein'].$value, sur, `${slot}.sur-plein`);
    if (survol === 'voile') {
      const t = g['plein-survol'];
      assert.deepEqual({ base: t.$extensions?.['ds-lab.voile']?.base, blanc: t.$extensions?.['ds-lab.voile']?.blanc }, { base: `{couleur.${scale}.9}`, blanc: 0.08 }, `${slot} : formule`);
      const hex = formatHex(interpolate([stepsOf(scale)[8], '#ffffff'], 'rgb')(0.08));
      assert.equal(t.$value.hex, hex, `${slot} : voile recalculé`);
      assert.equal(t.$value.colorSpace, 'srgb');
      const c = /** @type {any} */ (rgb(hex));
      assert.deepEqual(t.$value.components, [c.r, c.g, c.b].map((x) => Math.round(x * 10000) / 10000));
    } else assert.equal(g['plein-survol'].$value, survol, `${slot}.plein-survol`);
  }
});

test('Pleins : seule valeur calculée du fichier, le voile', () => {
  const computed = [];
  for (const [slot, g] of couleurs(marque.marque)) {
    for (const [k, t] of Object.entries(g)) if (!k.startsWith('$') && typeof t.$value !== 'string') computed.push(`${slot}.${k}`);
  }
  assert.deepEqual(computed, ['primaire.plein-survol']);
});

test('Pleins : le fichier versionné est celui que produit marqueTokens', () => {
  const statuts = Object.fromEntries(STATUTS.map((s) => [s, { scale: s, steps: stepsOf(s) }]));
  const want = marqueTokens({ primaire: { scale: 'bleu', steps: stepsOf('bleu') }, accent: { scale: 'terre', steps: stepsOf('terre') }, statuts, polices: POLICES, fonds: fondsClairs(loadRoles(DIR)), description: marque.$description });
  assert.deepEqual(marque, want);
});

test('M0 rôles : les pleins et les couleurs de marque passent par marque.* ; aucun ne cite bleu, terre ni un plein de statut', () => {
  const s = readFileSync(join(COMMUN, 'semantique.tokens.json'), 'utf8');
  assert.doesNotMatch(s, /\{couleur\.(bleu|terre)\./);
  // texte.<statut> vise le pas 11 de son statut (rôle de texte) : seuls 9, 10, 12 et sur-plein sont des pleins.
  assert.doesNotMatch(s, /\{couleur\.(erreur|succes|avertissement|info)\.(9|10|12|sur-plein)\}/);
  const sem = load('semantique.tokens.json');
  /** @param {string} role */
  const tokenOf = (role) => {
    let n = sem;
    for (const k of role.split('.')) n = n[k];
    return '$value' in n ? n : n.$root;
  };
  for (const [role, slot] of Object.entries(VIA_MARQUE)) assert.equal(tokenOf(role).$value, `{${slot}}`, role);
});

test('Pleins : les 42 rôles se résolvent vers les hex attendus, plus les 9 du lot 5 (étape 4a)', () => {
  const roles = resolveRoles(load('semantique.tokens.json'), load('primitives.tokens.json'), load('statuts.tokens.json'), avecAplat(marque));
  const all = new Map([...HEX, ...Object.entries(AJOUTS).map(([r, [, hex]]) => /** @type {[string, string]} */ ([r, hex]))]);
  assert.deepEqual([...roles.keys()].sort(), [...all.keys()].sort());
  for (const [role, hex] of all) assert.equal(roles.get(role)?.hex, hex, role);
});

test('M0 une autre marque se branche sans toucher aux rôles (témoin fictif, sombre)', () => {
  const g = generateScale('temoin', '#4a2a80');
  assert.equal(classePlein(g.steps), 'sombre');
  const statuts = Object.fromEntries(STATUTS.map((s) => [s, { scale: s, steps: stepsOf(s) }]));
  const m = marqueTokens({ primaire: { scale: 'temoin', steps: g.steps }, accent: { scale: 'temoin', steps: g.steps }, statuts, fonds: fondsClairs(loadRoles(DIR)), description: 'témoin fictif' });
  const echelle = { couleur: { $type: 'color', temoin: Object.fromEntries(g.steps.map((hex, i) => [String(i + 1), { $value: { colorSpace: 'srgb', components: [0, 0, 0], hex } }])) } };
  const set = { ...loadRoles(DIR), marque: avecAplat(m), echelles: [echelle] };
  const roles = resolveRoles(set.semantique, set.primitives, set.statuts, set.marque, ...set.echelles);
  assert.equal(roles.get('fond.interactif.fort')?.hex, g.steps[8]);
  assert.equal(roles.get('fond.interactif.fort.survol')?.hex, voileBlanc(g.steps[8], 0.08));
  assert.equal(roles.get('texte.sur-interactif')?.hex, '#ffffff');
  assert.equal(roles.get('texte.principal')?.hex, HEX.get('texte.principal'));
  assert.equal(contratRoles(set).pairs.length, 70, 'étape 4b, lot 3 : + 4 bordures de statut sur fond.surface');
});
