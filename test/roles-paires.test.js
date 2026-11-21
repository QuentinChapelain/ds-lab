// @ts-check
/**
 * T2 et T3 : paires de rôles déclarées (tokens/orbe-cafe/paires.json), contrat de rôles
 * ajouté au contrat par échelle (contractOf) sans le remplacer, et contrôle npm run contraste qui
 * échoue sous le seuil sans exception écrite.
 *
 * Attendu écrit à la main avant le code de src/tokens/roles.js. Ratios calculés avec culori seul,
 * alias résolus à la main dans les trois fichiers de jetons, commande (14/11/2026, à 3ec83b0) :
 *   node --input-type=module -e '
 *     import { wcagContrast } from "culori"; import { readFileSync } from "node:fs";
 *     const L=f=>JSON.parse(readFileSync("tokens/orbe-cafe/"+f,"utf8"));
 *     const P=L("primitives.tokens.json").color, S=L("statuts.tokens.json").color, sem=L("semantique.tokens.json"), pa=L("paires.json");
 *     const hex=role=>{let n=sem; for(const k of role.split(".")) n=n[k]; if(!("$value" in n)) n=n.$root;
 *       const [,sc,st]=/^\{color\.([^.]+)\.([^}]+)\}$/.exec(n.$value); return (P[sc]??S[sc])[st].$value.hex;};
 *     for (const p of pa.pairs) console.log(p.foreground, p.background, wcagContrast(hex(p.foreground),hex(p.background)).toFixed(4));'
 * Hypothèse de l'attendu : text.secondary sous 4,5:1 sur background.component.pressed → mesurée à 4,3327 [F].
 *
 * Décisions du 14/11/2026 (attendu complété à la main, ratios culori) :
 *   text.secondary sur background.component.pressed : paire interdite, règle « sur background.component.pressed, le texte
 *     passe en text.default » (text.default sur background.component.pressed reste déclarée) ;
 *   border.strong sur background.component : paire interdite, règle « un champ se pose sur background.app » ;
 *   les 4 paires border.<statut> sur background.<statut>.subtle sont retirées ;
 *   border.focus → bleu 9 : 8,3247 / 8,1063 / 7,7046 sur neutre 1, 2, 3 ;
 *   blanc sur terre 10, succes 10, info 10 : 5,1669 / 5,0674 / 4,6220 (attendus annoncés : 5,17, 5,07, 4,62) ;
 *     commande : wcagContrast('#ffffff', hex du pas 10), même lecture des fichiers que ci-dessus.
 *
 * Décisions après T5 (14/11/2026), ratios culori, commande : wcagContrast(hex devant, hex fond) sur les
 * pas lus dans primitives et statuts (color.white = #ffffff) :
 *   background.surface (blanc) : text.default 13,0628, text.secondary 5,6129, text.interactive 5,5917,
 *     text.error 5,6023, text.success 5,6186, text.warning 5,6230, text.info 5,6178,
 *     border.strong 3,2110, border.focus 8,6144 ;
 *   text.on-inverse (blanc) sur background.inverse (neutre 12) : 13,0628 ;
 *   interdite text.secondary sur background.interactive.strong : 1,5348, règle « sur un plein, le texte est text.on-* » ;
 *   règle de border.strong sur background.component : « un champ se pose sur background.surface ».
 *
 * Règle des pleins en trois cas (15/11/2026), ratios culori, commande : node local/scripts/ratios-pleins.mjs
 * (wcagContrast sur les pas lus dans primitives et statuts ; voile = interpolate([bleu 9, blanc], 'rgb')(0,08) = #3c5a88) :
 *   blanc sur bleu 9 + voile 8 % : 6,9765 ; blanc sur terre 11 : 5,6287 ; sur erreur 11 : 5,6023 ;
 *   sur succes 11 : 5,6186 ; sur info 11 : 5,6178 ; avertissement 12 sur avertissement 9 : 5,7721.
 * D45 (18/11/2026) : survol du plein = clarté OKLCH du bleu 9 − 0,05 = #1e3e6f ; wcagContrast('#ffffff', '#1e3e6f') = 10,6394.
 * Décision du 15/11/2026 : border.focus → brand.primary.11 (bleu 11 #4c6994) ; ratios culori
 *   (wcagContrast('#4c6994', fond)) : background.app 5,4037, background.surface 5,5917, background.subtle 5,2619, background.component 5,0011.
 * Décision du 15/11/2026 : interdite border.focus sur background.interactive.strong (bleu 11 sur bleu 9 :
 *   wcagContrast('#4c6994', '#2b4c7e') = 1,5406), règle « l’anneau de focus est décalé de 2 px et se pose sur le fond de la page, jamais sur le plein ».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadRoles, resolveRoles, contratRoles, contrat } from '../src/tokens/roles.js';
import { PAIRES_AJOUTEES, INTERDITES_AJOUTEES, PAIRES_BOUTON, PAIRES_AVATAR, EXCEPTIONS_BOUTON, N_PAIRES } from './helpers/roles-ajoutes.js';
import { charger, COMMUN, ORBE } from './helpers/jetons.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const load = charger;

/** devant | fond | ratio culori (4 décimales) | seuil. */
const TABLE = `
text.default | background.app | 12.6234 | 4.5
text.default | background.surface | 13.0628 | 4.5
text.default | background.subtle | 12.2923 | 4.5
text.default | background.component | 11.6831 | 4.5
text.default | background.component.hover | 10.9644 | 4.5
text.default | background.component.pressed | 10.0834 | 4.5
text.secondary | background.app | 5.4241 | 4.5
text.secondary | background.surface | 5.6129 | 4.5
text.secondary | background.subtle | 5.2818 | 4.5
text.secondary | background.component | 5.0200 | 4.5
text.secondary | background.component.hover | 4.7112 | 4.5
text.interactive | background.app | 5.4037 | 4.5
text.interactive | background.surface | 5.5917 | 4.5
text.interactive | background.subtle | 5.2619 | 4.5
text.interactive | background.interactive.subtle | 5.0335 | 4.5
text.accent | background.app | 5.4393 | 4.5
text.accent | background.subtle | 5.2967 | 4.5
text.error | background.app | 5.4139 | 4.5
text.error | background.surface | 5.6023 | 4.5
text.error | background.error.subtle | 5.0556 | 4.5
text.success | background.app | 5.4296 | 4.5
text.success | background.surface | 5.6186 | 4.5
text.success | background.success.subtle | 5.0174 | 4.5
text.warning | background.app | 5.4339 | 4.5
text.warning | background.surface | 5.6230 | 4.5
text.warning | background.warning.subtle | 5.0476 | 4.5
text.info | background.app | 5.4289 | 4.5
text.info | background.surface | 5.6178 | 4.5
text.info | background.info.subtle | 5.0657 | 4.5
text.on-interactive | background.interactive.strong | 8.6144 | 4.5
text.on-interactive | background.interactive.strong.hover | 10.6394 | 4.5
text.on-accent | background.accent.strong | 5.6287 | 4.5
text.on-error | background.error.strong | 5.6023 | 4.5
text.on-success | background.success.strong | 5.6186 | 4.5
text.on-warning | background.warning.strong | 5.7721 | 4.5
text.on-info | background.info.strong | 5.6178 | 4.5
text.on-inverse | background.inverse | 13.0628 | 4.5
border.strong | background.app | 3.1030 | 3
border.strong | background.surface | 3.2110 | 3
border.strong | background.subtle | 3.0216 | 3
border.error | background.app | 3.0963 | 3
border.success | background.app | 3.0843 | 3
border.warning | background.app | 3.0885 | 3
border.info | background.app | 3.0936 | 3
border.focus | background.app | 5.4037 | 3
border.focus | background.surface | 5.5917 | 3
border.focus | background.subtle | 5.2619 | 3
border.focus | background.component | 5.0011 | 3
`
  .trim()
  .split('\n')
  .map((l) => {
    const [devant, fond, ratio, min] = l.split(' | ');
    return { devant, fond, ratio: Number(ratio), min: Number(min) };
  });
/** Paires interdites : devant | fond | ratio culori | règle. */
const INTERDITES = [
  { devant: 'text.secondary', fond: 'background.component.pressed', ratio: 4.3327, regle: 'sur background.component.pressed, le texte passe en text.default' },
  { devant: 'text.secondary', fond: 'background.interactive.strong', ratio: 1.5348, regle: 'sur un plein, le texte est text.on-*' },
  { devant: 'border.strong', fond: 'background.component', ratio: 2.8718, regle: 'un champ se pose sur background.surface' },
  { devant: 'border.focus', fond: 'background.interactive.strong', ratio: 1.5406, regle: 'l’anneau de focus est décalé de 2 px et se pose sur le fond de la page, jamais sur le plein' },
];
const RETIREES = ['error', 'success', 'warning', 'info'].map((s) => `border.${s}|background.${s}.subtle`);

const paires = load('paires.json');
const sem = load('semantique.tokens.json');

test('T2 paires.json : seuils 4,5 texte, 3 bordure et focus (et grand texte) ; 48 paires en tête, sans doublon, dans l\'ordre', () => {
  assert.deepEqual(paires.thresholds, { text: 4.5, border: 3, focus: 3, 'large-text': 3 });
  assert.equal(paires.pairs.length, 48 + PAIRES_AJOUTEES.length + 4 + PAIRES_BOUTON.length + PAIRES_AVATAR.length, '+ 4 bordures de statut sur background.surface, + les paires du bouton, de l\'avatar et de l\'étiquette');
  const keys = paires.pairs.map((/** @type {any} */ p) => `${p.foreground}|${p.background}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(paires.pairs.slice(0, 48).map((/** @type {any} */ p) => [p.foreground, p.background]), TABLE.map((t) => [t.devant, t.fond]));
  for (const r of RETIREES) assert.ok(!keys.includes(r), `retirée : ${r}`);
  assert.ok(keys.includes('text.default|background.component.pressed'));
});

test('T2 paires.json : quatre paires interdites, chacune avec sa règle, absentes des paires', () => {
  assert.deepEqual(
    paires.forbidden.slice(0, 4).map((/** @type {any} */ p) => ({ devant: p.foreground, fond: p.background, regle: p.rule })),
    INTERDITES.map(({ devant, fond, regle }) => ({ devant, fond, regle })),
  );
});

test('T2 rôles des paires : existent, texte devant un fond, type selon la propriété', () => {
  const roles = resolveRoles(sem, load('primitives.tokens.json'), load('statuts.tokens.json'), load('marque.tokens.json'));
  for (const p of [...paires.pairs, ...paires.forbidden]) {
    assert.ok(roles.has(p.foreground), p.foreground);
    assert.ok(roles.has(p.background), p.background);
    assert.match(p.background, /^background\./);
  }
  const type = (/** @type {string} */ d) => (d.startsWith('border.focus') ? 'focus' : d === 'text.brand.large' ? 'large-text' : d.split('.')[0]);
  for (const p of paires.pairs) assert.equal(p.type, type(p.foreground), `${p.foreground} : type`);
});

test('T2 couverture : chaque texte et chaque bordure non décorative a une paire ; subtle et default n\'en ont pas', () => {
  const devants = new Set(paires.pairs.map((/** @type {any} */ p) => p.foreground));
  const roles = resolveRoles(sem, load('primitives.tokens.json'), load('statuts.tokens.json'), load('marque.tokens.json'));
  for (const r of roles.keys()) {
    if (r.startsWith('text.')) assert.ok(devants.has(r), r);
    if (r.startsWith('border.') && !['border.subtle', 'border.default'].includes(r)) assert.ok(devants.has(r), r);
  }
  assert.ok(!devants.has('border.subtle') && !devants.has('border.default'));
});

test('T2 contratRoles : ratios égaux à culori (± 0,0001), seuil par type', () => {
  const c = contratRoles(loadRoles(DIR));
  assert.equal(c.pairs.length, TABLE.length + PAIRES_AJOUTEES.length + 4 + PAIRES_BOUTON.length + PAIRES_AVATAR.length, '+ 4 bordures de statut sur background.surface, + les paires du bouton, de l\'avatar et de l\'étiquette');
  c.pairs.slice(0, TABLE.length).forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    assert.equal(p.devant, TABLE[i].devant);
    assert.equal(p.fond, TABLE[i].fond);
    assert.equal(p.min, TABLE[i].min, `${p.devant} sur ${p.fond} : seuil`);
    assert.ok(Math.abs(p.ratio - TABLE[i].ratio) <= 1e-4, `${p.devant} sur ${p.fond} : ${p.ratio}, culori ${TABLE[i].ratio}`);
    assert.equal(p.ok, TABLE[i].ratio >= TABLE[i].min);
    assert.match(p.hexDevant, /^#[0-9a-f]{6}$/);
    assert.match(p.hexFond, /^#[0-9a-f]{6}$/);
  });
});

test('T2 pleins moyens au pas 11, texte blanc : accent 5,63, erreur 5,60, succès 5,62, info 5,62 ; avertissement clair, texte pas 12 : 5,77', () => {
  const c = contratRoles(loadRoles(DIR));
  const got = ['accent', 'error', 'success', 'info', 'warning'].map((s) => c.pairs.find((/** @type {any} */ p) => p.devant === `text.on-${s}`));
  assert.deepEqual(got.map((p) => p.hexDevant), ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#442d01']);
  assert.deepEqual(got.map((p) => p.ratio.toFixed(2)), ['5.63', '5.60', '5.62', '5.62', '5.77']);
});

test('T2 interdites mesurées et listées à part, hors échecs', () => {
  const c = contratRoles(loadRoles(DIR));
  assert.equal(c.interdites.length, INTERDITES.length + INTERDITES_AJOUTEES.length);
  c.interdites.slice(0, INTERDITES.length).forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    assert.equal(p.devant, INTERDITES[i].devant);
    assert.equal(p.fond, INTERDITES[i].fond);
    assert.equal(p.regle, INTERDITES[i].regle);
    assert.ok(Math.abs(p.ratio - INTERDITES[i].ratio) <= 1e-4, `${p.devant} sur ${p.fond} : ${p.ratio}`);
  });
});

test('T2 hypothèse : text.secondary sous 4,5:1 sur background.component.pressed (4,3327), désormais interdite', () => {
  const p = contratRoles(loadRoles(DIR)).interdites.find((/** @type {any} */ x) => x.devant === 'text.secondary' && x.fond === 'background.component.pressed');
  assert.ok(p && p.ratio < 4.5 && Math.abs(p.ratio - 4.3327) <= 1e-4);
});

/**
 * Le contrat par échelle d'Orbe Café, écrit à la main (avant : comparé à
 * contractOf(valiseFromTokens({ couleur: ordreEchelles(…) })), recopie de src/tokens/roles.js).
 * Ordre : neutre, échelles de la marque (bleu, terre, sable, dans l'ordre de tokens/orbe-cafe/primitives.tokens.json),
 * statuts (erreur, succès, avertissement, info) ; 10 paires par échelle. Rapports recalculés avec culori sur les
 * valeurs des jetons (neutre 1 #fbfbfb, 10 #7d776c, 11 #6d675b, sur-plein #201d17 ; bleu 9 #2b4c7e, sur-plein #ffffff) :
 *   node -e 'import("culori").then(({wcagContrast:w})=>console.log(w("#6d675b","#fbfbfb"),w("#ffffff","#2b4c7e"),w("#201d17","#7d776c")))'
 *   → 5.424088602627833 8.614442961097723 3.7832254575552007
 */
test('T2 contrat : par échelle (ordre, 80 paires, trois échecs, trois rapports écrits à la main), les rôles s\'y ajoutent', () => {
  const set = loadRoles(DIR);
  const tout = contrat(set);
  assert.deepEqual(tout.roles, contratRoles(set));
  const c = tout.echelles;
  assert.deepEqual([...new Set(c.pairs.map((/** @type {any} */ p) => p.scale))], ['neutral', 'blue', 'earth', 'sand', 'error', 'success', 'warning', 'info']);
  assert.equal(c.pairs.length, 80);
  assert.deepEqual(c.fails, ['neutral : onSolid sur 10, 3,7832 < 4,5', 'earth : onSolid sur 10, 3,8055 < 4,5', 'success : onSolid sur 10, 3,8503 < 4,5']);
  /** @param {string} scale @param {string} fg @param {string} bg */
  const ratio = (scale, fg, bg) => c.pairs.find((/** @type {any} */ p) => p.scale === scale && p.fg === fg && p.bg === bg)?.ratio;
  for (const [scale, fg, bg, want] of /** @type {const} */ ([['neutral', '11', '1', 5.424088602627833], ['blue', 'onSolid', '9', 8.614442961097723], ['neutral', 'onSolid', '10', 3.7832254575552007]]))
    assert.ok(Math.abs(/** @type {number} */ (ratio(scale, fg, bg)) - want) <= 1e-4, `${scale} ${fg} sur ${bg} : ${ratio(scale, fg, bg)}`);
});

test('T3 aucun échec ; seules exceptions écrites, les deux paires du désactivé', () => {
  const c = contratRoles(loadRoles(DIR));
  assert.deepEqual(c.fails, []);
  assert.deepEqual(c.exceptions.map((/** @type {any} */ f) => `${f.devant} sur ${f.fond}`), EXCEPTIONS_BOUTON);
});

test('T3 paire sous le seuil : échec sans exception ; exception écrite : listée à part ; exception vide refusée', () => {
  const set = structuredClone(loadRoles(DIR));
  const added = { foreground: 'border.strong', background: 'background.component.pressed', type: 'border' };
  set.paires.pairs.push(added);
  assert.deepEqual(contratRoles(set).fails.map((/** @type {any} */ f) => `${f.devant} sur ${f.fond}`), ['border.strong sur background.component.pressed']);
  set.paires.pairs[set.paires.pairs.length - 1] = { ...added, exception: 'Champ toujours doublé de son libellé.' };
  const c = contratRoles(set);
  assert.deepEqual(c.fails, []);
  assert.deepEqual(c.exceptions.map((/** @type {any} */ f) => `${f.devant} sur ${f.fond}`), [...EXCEPTIONS_BOUTON, 'border.strong sur background.component.pressed']);
  set.paires.pairs[set.paires.pairs.length - 1] = { ...added, exception: '  ' };
  assert.throws(() => contratRoles(set), /exception vide/);
});

test('T3 paire invalide : rôle inconnu, type inconnu, interdite déclarée, règle vide refusés', () => {
  const base = loadRoles(DIR);
  const a = structuredClone(base);
  a.paires.pairs.push({ foreground: 'text.inconnu', background: 'background.app', type: 'text' });
  assert.throws(() => contratRoles(a), /text\.inconnu/);
  const b = structuredClone(base);
  b.paires.pairs.push({ foreground: 'text.default', background: 'background.app', type: 'ombre' });
  assert.throws(() => contratRoles(b), /ombre/);
  const c = structuredClone(base);
  c.paires.pairs.push({ foreground: 'text.secondary', background: 'background.component.pressed', type: 'text' });
  assert.throws(() => contratRoles(c), /déclarée et interdite/);
  const d = structuredClone(base);
  d.paires.forbidden[0].rule = ' ';
  assert.throws(() => contratRoles(d), /règle vide/);
});

test('T3 npm run contraste : sort en 0 sur les fichiers du dépôt ; en 1 avec une paire sous le seuil', () => {
  const cli = join(ROOT, 'src', 'cli', 'contraste.js');
  const ok = execFileSync(process.execPath, [cli], { cwd: ROOT, encoding: 'utf8' });
  assert.match(ok, new RegExp(`${N_PAIRES} paires de rôles, 0 paire en échec, ${EXCEPTIONS_BOUTON.length} exceptions écrites, 8 paires interdites\\.`));
  for (const p of INTERDITES) assert.ok(ok.includes(`${p.devant} sur ${p.fond}`) && ok.includes(p.regle), `interdite listée : ${p.devant}`);

  const tmp = mkdtempSync(join(tmpdir(), 'contraste-'));
  const pp = structuredClone(paires);
  pp.pairs.push({ foreground: 'border.strong', background: 'background.component.pressed', type: 'border' });
  writeFileSync(join(tmp, 'paires.json'), JSON.stringify(pp));
  let code = 0;
  let out = '';
  try {
    execFileSync(process.execPath, [cli, '--paires', join(tmp, 'paires.json')], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch (/** @type {any} */ e) {
    code = e.status;
    out = e.stdout;
  }
  assert.equal(code, 1);
  assert.match(out, /1 paire en échec/);
  assert.ok(out.includes('border.strong sur background.component.pressed'));
});

test('T3 package.json : script contraste', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.contraste, 'node src/cli/contraste.js');
});
