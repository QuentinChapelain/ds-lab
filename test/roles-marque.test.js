// @ts-check
/**
 * Emplacements de marque (tokens/orbe-cafe/marque.tokens.json).
 *
 * M0 (15/11/2026) : les rôles qui citaient color.blue.* et color.earth.* pointent vers brand.primary.*
 * et brand.accent.* ; Orbe Café : primary → blue, accent → earth. Aucun rôle renommé, ajouté ni retiré.
 *
 * Règle des pleins en trois cas (décision du 15/11/2026), déclarée dans la couche marque, jamais dans les rôles ;
 * classe lue sur le pas 9 de l'échelle :
 *   sombre : blanc ≥ 5,5 sur le pas 9 [H] → plein = pas 9, texte blanc, survol = pas 9 + voile blanc 8 % ;
 *   clair  : sinon, clarté OKLCH ≥ 0,70 et teinte OKLCH dans [55°, 115°] (jaune ou orangé) [H]
 *            → plein = pas 9, texte = pas 12, survol = pas 10 ;
 *   moyen  : le reste → plein = pas 11, texte blanc, survol = pas 12.
 *   Emplacements : primary, accent (12 pas + solid, solid-hover, on-solid) ; error, success, warning,
 *   info (solid, solid-hover, on-solid). Le voile est la seule valeur calculée : couleur en DTCG, formule en
 *   $extensions["ds-lab.voile"] (base, blanc), recalculée ici avec culori (interpolate en sRGB, comme le navigateur).
 * Correction du 18/11/2026 (D45, docs/attendus/finitions-bouton.md) : le survol de tous les pleins, statuts compris,
 *   est la clarté OKLCH du plein − 0,05 (teinte et chroma gardées, chroma réduite hors gamut sRGB), valeur calculée,
 *   formule en $extensions["ds-lab.survol"] (base, clarte), recalculée ici avec culori (oklch, toGamut). Orbe Café en
 *   clair : primaire #2b4c7e → #1e3e6f, accent #b3422b → #a2321b, erreur #cb1d2a → #b9001a, succès #00774a → #00683c,
 *   avertissement #e5a000 → #d49000, info #006da6 → #005e96 ; les six survols sont les valeurs calculées du fichier.
 *
 * Attendu écrit à la main avant le code. Classes et OKLCH du pas 9 (culori, oklch()), commande :
 *   node local/scripts/criteres-pleins.mjs "$PWD" (essai du 15/11/2026, avant le code) :
 *   bleu 9 #2b4c7e L 0,417 h 258,5 blanc 8,61 → sombre ; terre 9 #c8553d L 0,593 h 33,4 blanc 4,35 → moyen ;
 *   erreur 9 #d93036 L 0,580 h 24,8 → moyen ; succes 9 #1f8a5b L 0,563 h 158,9 → moyen ;
 *   avertissement 9 #e5a000 L 0,753 h 77,8 blanc 2,24 → clair ; info 9 #0284c7 L 0,588 h 242,0 → moyen.
 * Hex des 42 rôles : relevés à a618e47 (commande de M0), puis, pour les pleins, d'après la règle ci-dessus
 * (node local/scripts/ratios-pleins.mjs : voile #3c5a88, terre 11 #b3422b, erreur 11 #cb1d2a, succes 11 #00774a,
 * info 11 #006da6, avertissement 12 #442d01).
 * Décision du 15/11/2026 : border.focus → brand.primary.11 pour toutes les marques (bleu 11 #4c6994).
 * Nouvelle règle pour le primaire et l'accent, lue sur
 *   l'échelle : blanc ≥ 5,5 sombre (voile) ; blanc ≥ 4,5 soutenu (pas 9, blanc, survol pas 10) ; pas 12 ≥ 7 sur le
 *   pas 9 et ≥ 4,5 sur le pas 10 clair ; sinon moyen. Statuts figés (STATUTS_FIGES), Orbe Café inchangé.
 *   Cas limites fictifs, échelles de generateScale, culori wcagContrast (commande : node --input-type=module -e) :
 *   #ffffff clair (pas 12 sur 9 : 13,01) ; #000000 sombre ; #ffe14d clair (9,96 / 8,47) ; #8a6a00 soutenu
 *   (blanc 5,07, 5,31 sur le pas 10) ; #4dd2ff clair (7,41 / 6,26) ; #9d5bd2 moyen (blanc 4,32, pas 12 sur 9 : 3,02).
 * La couche marque porte aussi brand.font (heading, body ; $type fontFamily),
 * produite par marqueTokens (paramètre polices) ; les tests ci-dessous portent sur les six emplacements de couleur.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { formatHex, rgb, oklch, toGamut } from 'culori';
import { generateScale } from '../src/valise/generate.js';
import { loadRoles, resolveRoles, contratRoles } from '../src/tokens/roles.js';
import { fondsClairs } from '../src/tokens/saisie.js';
import { AJOUTS, AJOUTS_BOUTON, AJOUTS_AVATAR, N_PAIRES } from './helpers/roles-ajoutes.js';
import { classePlein, survolPlein, marqueTokens, SOMBRE_BLANC, BLANC_MIN, TEXTE_FONCE, TEXTE_FONCE_SURVOL, STATUTS_FIGES, SURVOL_CLARTE } from '../src/tokens/pleins.js';
import { charger, avecAplat, COMMUN, ORBE } from './helpers/jetons.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const load = charger;
const STEPS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const CASES = ['solid', 'solid-hover', 'on-solid'];
const STATUTS = ['error', 'success', 'warning', 'info'];
/** Polices d'Orbe Café. */
const POLICES = { titre: ['Georgia', 'serif'], texte: ['Orbe Sans', 'Arial', 'sans-serif'] };
/** Emplacements de couleur seulement (sans brand.font). @param {any} m */
const couleurs = (m) => Object.entries(m).filter(([k, g]) => !k.startsWith('$') && g.$type !== 'fontFamily');

/** Emplacement → [échelle, classe, plein, plein-survol (hex calculé, D45), sur-plein]. */
const EMPLACEMENTS = {
  primary: ['blue', 'sombre', '{color.blue.9}', '#1e3e6f', '{color.white}'],
  accent: ['earth', 'moyen', '{color.earth.11}', '#a2321b', '{color.white}'],
  error: ['error', 'moyen', '{color.error.11}', '#b9001a', '{color.white}'],
  success: ['success', 'moyen', '{color.success.11}', '#00683c', '{color.white}'],
  warning: ['warning', 'clair', '{color.warning.9}', '#d49000', '{color.warning.12}'],
  info: ['info', 'moyen', '{color.info.11}', '#005e96', '{color.white}'],
};
/** Survol d'un plein en clair recalculé ici (culori, sans le code) : clarté OKLCH − 0,05, gamut sRGB. @param {string} hex */
const survolAttendu = (hex) => { const c = /** @type {any} */ (oklch(hex)); return formatHex(toGamut('rgb', 'oklch')({ ...c, l: c.l - 0.05 })); };

/** Rôles qui passent par la marque, et leur case. */
const VIA_MARQUE = {
  'background.interactive.subtle': 'brand.primary.3',
  'background.interactive.strong': 'brand.primary.solid',
  'background.interactive.strong.hover': 'brand.primary.solid-hover',
  'background.accent.strong': 'brand.accent.solid',
  'text.interactive': 'brand.primary.11',
  'text.accent': 'brand.accent.11',
  'text.on-interactive': 'brand.primary.on-solid',
  'text.on-accent': 'brand.accent.on-solid',
  'border.focus': 'brand.primary.11',
  ...Object.fromEntries(STATUTS.flatMap((s) => [[`background.${s}.strong`, `brand.${s}.solid`], [`text.on-${s}`, `brand.${s}.on-solid`]])),
};

/** Hex attendus des 42 rôles. */
const HEX = new Map([
  ['background.app', '#fbfbfb'],
  ['background.subtle', '#f8f8f7'],
  ['background.surface', '#ffffff'],
  ['background.inverse', '#363026'],
  ['background.component', '#f3f2f1'],
  ['background.component.hover', '#ecebe9'],
  ['background.component.pressed', '#e3e2df'],
  ['background.interactive.subtle', '#f1f3f7'],
  ['background.interactive.strong', '#2b4c7e'],
  ['background.interactive.strong.hover', '#1e3e6f'],
  ['background.accent.strong', '#b3422b'],
  ['background.error.subtle', '#fff0ee'],
  ['background.error.strong', '#cb1d2a'],
  ['background.success.subtle', '#ecf4ef'],
  ['background.success.strong', '#00774a'],
  ['background.warning.subtle', '#fef1de'],
  ['background.warning.strong', '#e5a000'],
  ['background.info.subtle', '#e8f5ff'],
  ['background.info.strong', '#006da6'],
  ['text.default', '#363026'],
  ['text.secondary', '#6d675b'],
  ['text.interactive', '#4c6994'],
  ['text.accent', '#b3422b'],
  ['text.error', '#cb1d2a'],
  ['text.success', '#00774a'],
  ['text.warning', '#8b5f00'],
  ['text.info', '#006da6'],
  ['text.on-interactive', '#ffffff'],
  ['text.on-accent', '#ffffff'],
  ['text.on-error', '#ffffff'],
  ['text.on-success', '#ffffff'],
  ['text.on-warning', '#442d01'],
  ['text.on-info', '#ffffff'],
  ['text.on-inverse', '#ffffff'],
  ['border.subtle', '#d8d6d2'],
  ['border.default', '#bfbbb5'],
  ['border.strong', '#958f84'],
  ['border.focus', '#4c6994'],
  ['border.error', '#e76862'],
  ['border.success', '#529f76'],
  ['border.warning', '#bf8501'],
  ['border.info', '#2f97da'],
]);

/** Fichier versionné, tel quel ; les rôles se résolvent avec les emplacements communs de l'aplat. */
const marque = JSON.parse(readFileSync(join(ORBE, 'marque.tokens.json'), 'utf8'));
const prim = load('primitives.tokens.json').color;
const stat = load('statuts.tokens.json').color;
const stepsOf = (/** @type {string} */ s) => STEPS.map((k) => (prim[s] ?? stat[s])[k].$value.hex);

test('Pleins : seuils de la règle (blanc 4,5 et 5,5 ; texte foncé 7 et 4,5 ; survol à 0,05 de clarté)', () => {
  assert.equal(BLANC_MIN, 4.5);
  assert.equal(SOMBRE_BLANC, 5.5);
  assert.equal(TEXTE_FONCE, 7);
  assert.equal(TEXTE_FONCE_SURVOL, 4.5);
  assert.equal(SURVOL_CLARTE, 0.05);
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

test('Pleins : survol recalculé avec culori (clarté OKLCH − 0,05 en clair, + 0,05 en sombre)', () => {
  assert.equal(survolAttendu('#2b4c7e'), '#1e3e6f');
  assert.equal(survolPlein('#2b4c7e', 'clair'), '#1e3e6f');
  assert.equal(survolPlein('#86b6fe', 'sombre'), '#97c6ff', 'bleu 11 sombre d\'Orbe Café (attendu)');
  assert.equal(survolPlein('#cb1d2a', 'clair'), '#b9001a', 'chroma réduite : la teinte gardée sortirait du gamut');
});

test('M0 marque.tokens.json : DTCG 2025.10, six emplacements', () => {
  assert.match(marque.$description, /DTCG 2025\.10/);
  assert.equal(marque.brand.$type, 'color');
  assert.deepEqual(couleurs(marque.brand).map(([k]) => k), Object.keys(EMPLACEMENTS));
  assert.deepEqual(Object.keys(marque.brand).filter((k) => !k.startsWith('$')), [...Object.keys(EMPLACEMENTS), 'font']);
  // Le primaire porte en dernier texte-grand.
  assert.deepEqual(Object.keys(marque.brand.primary).filter((k) => !k.startsWith('$')), [...STEPS, ...CASES, 'text-large']);
  assert.deepEqual(Object.keys(marque.brand.accent).filter((k) => !k.startsWith('$')), [...STEPS, ...CASES]);
  for (const s of STATUTS) assert.deepEqual(Object.keys(marque.brand[s]).filter((k) => !k.startsWith('$')), CASES, s);
  for (const [slot, g] of Object.entries(marque.brand)) {
    if (slot.startsWith('$')) continue;
    assert.ok(g.$description, `${slot} : description`);
    for (const [k, t] of Object.entries(g)) if (!k.startsWith('$')) assert.ok(typeof t.$description === 'string' && t.$description, `${slot}.${k} : description`);
  }
});

test('M0 primaire → bleu, accent → terre : 12 pas en alias', () => {
  for (const k of STEPS) {
    assert.equal(marque.brand.primary[k].$value, `{color.blue.${k}}`, `primary.${k}`);
    assert.equal(marque.brand.accent[k].$value, `{color.earth.${k}}`, `accent.${k}`);
  }
});

test('Pleins : classe, plein, survol et sur-plein de chaque emplacement', () => {
  for (const [slot, [scale, classe, plein, survol, sur]] of Object.entries(EMPLACEMENTS)) {
    const g = marque.brand[slot];
    assert.equal(g.$extensions?.['ds-lab.plein']?.classe, classe, `${slot} : classe`);
    assert.equal(g.solid.$value, plein, `${slot}.solid`);
    assert.equal(g['on-solid'].$value, sur, `${slot}.on-solid`);
    const t = g['solid-hover'];
    const x = t.$extensions?.['ds-lab.survol'];
    assert.deepEqual({ base: x?.base, clarte: x?.clarte, espace: x?.espace }, { base: plein, clarte: -0.05, espace: 'oklch' }, `${slot} : formule`);
    const pas = Number(/\.(\d+)\}$/.exec(plein)?.[1]);
    assert.equal(survolAttendu(stepsOf(scale)[pas - 1]), survol, `${slot} : survol recalculé`);
    assert.equal(t.$value.hex, survol, `${slot}.solid-hover`);
    assert.equal(t.$value.colorSpace, 'srgb');
    const c = /** @type {any} */ (rgb(survol));
    assert.deepEqual(t.$value.components, [c.r, c.g, c.b].map((v) => Math.round(v * 10000) / 10000));
  }
});

test('Pleins : seules valeurs calculées du fichier, les six survols', () => {
  const computed = [];
  for (const [slot, g] of couleurs(marque.brand)) {
    for (const [k, t] of Object.entries(g)) if (!k.startsWith('$') && typeof t.$value !== 'string') computed.push(`${slot}.${k}`);
  }
  assert.deepEqual(computed, Object.keys(EMPLACEMENTS).map((e) => `${e}.solid-hover`));
});

test('Pleins : le fichier versionné est celui que produit marqueTokens', () => {
  const statuts = Object.fromEntries(STATUTS.map((s) => [s, { scale: s, steps: stepsOf(s) }]));
  const want = marqueTokens({ primaire: { scale: 'blue', steps: stepsOf('blue') }, accent: { scale: 'earth', steps: stepsOf('earth') }, statuts, polices: POLICES, fonds: fondsClairs(loadRoles(DIR)), description: marque.$description });
  assert.deepEqual(marque, want);
});

test('M0 rôles : les pleins et les couleurs de marque passent par brand.* ; aucun ne cite blue, earth ni un plein de statut', () => {
  const s = readFileSync(join(COMMUN, 'semantique.tokens.json'), 'utf8');
  assert.doesNotMatch(s, /\{color\.(blue|earth)\./);
  // text.<statut> vise le pas 11 de son statut (rôle de texte) : seuls 9, 10, 12 et on-solid sont des pleins.
  assert.doesNotMatch(s, /\{color\.(error|success|warning|info)\.(9|10|12|on-solid)\}/);
  const sem = load('semantique.tokens.json');
  /** @param {string} role */
  const tokenOf = (role) => {
    let n = sem;
    for (const k of role.split('.')) n = n[k];
    return '$value' in n ? n : n.$root;
  };
  for (const [role, slot] of Object.entries(VIA_MARQUE)) assert.equal(tokenOf(role).$value, `{${slot}}`, role);
});

test('Pleins : les 42 rôles se résolvent vers les hex attendus, plus les ajouts (helpers/roles-ajoutes.js)', () => {
  const roles = resolveRoles(load('semantique.tokens.json'), load('primitives.tokens.json'), load('statuts.tokens.json'), avecAplat(marque));
  const all = new Map([...HEX, ...Object.entries({ ...AJOUTS, ...AJOUTS_BOUTON, ...AJOUTS_AVATAR }).map(([r, [, hex]]) => /** @type {[string, string]} */ ([r, hex]))]);
  assert.deepEqual([...roles.keys()].sort(), [...all.keys()].sort());
  for (const [role, hex] of all) assert.equal(roles.get(role)?.hex, hex, role);
});

test('M0 une autre marque se branche sans toucher aux rôles (témoin fictif, sombre)', () => {
  const g = generateScale('temoin', '#4a2a80');
  assert.equal(classePlein(g.steps), 'sombre');
  const statuts = Object.fromEntries(STATUTS.map((s) => [s, { scale: s, steps: stepsOf(s) }]));
  const m = marqueTokens({ primaire: { scale: 'temoin', steps: g.steps }, accent: { scale: 'temoin', steps: g.steps }, statuts, fonds: fondsClairs(loadRoles(DIR)), description: 'témoin fictif' });
  const echelle = { color: { $type: 'color', temoin: Object.fromEntries(g.steps.map((hex, i) => [String(i + 1), { $value: { colorSpace: 'srgb', components: [0, 0, 0], hex } }])) } };
  const set = { ...loadRoles(DIR), marque: avecAplat(m), echelles: [echelle] };
  const roles = resolveRoles(set.semantique, set.primitives, set.marque, ...set.echelles);
  assert.equal(roles.get('background.interactive.strong')?.hex, g.steps[8]);
  assert.equal(roles.get('background.interactive.strong.hover')?.hex, survolAttendu(g.steps[8]));
  assert.equal(roles.get('text.on-interactive')?.hex, '#ffffff');
  assert.equal(roles.get('text.default')?.hex, HEX.get('text.default'));
  assert.equal(contratRoles(set).pairs.length, N_PAIRES, '+ 4 bordures de statut sur background.surface, + les paires du bouton');
});
