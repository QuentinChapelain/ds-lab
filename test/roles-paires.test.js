// @ts-check
/**
 * Séance 3a, T2 et T3 : paires de rôles déclarées (tokens/orbe-cafe/paires.json), contrat de rôles
 * ajouté au contrat par échelle (contractOf) sans le remplacer, et contrôle npm run contraste qui
 * échoue sous le seuil sans exception écrite.
 *
 * Attendu écrit à la main avant le code de src/tokens/roles.js. Ratios calculés avec culori seul,
 * alias résolus à la main dans les trois fichiers de jetons, commande (14/11/2026, à 3ec83b0) :
 *   node --input-type=module -e '
 *     import { wcagContrast } from "culori"; import { readFileSync } from "node:fs";
 *     const L=f=>JSON.parse(readFileSync("tokens/orbe-cafe/"+f,"utf8"));
 *     const P=L("primitives.tokens.json").couleur, S=L("statuts.tokens.json").couleur, sem=L("semantique.tokens.json"), pa=L("paires.json");
 *     const hex=role=>{let n=sem; for(const k of role.split(".")) n=n[k]; if(!("$value" in n)) n=n.$root;
 *       const [,sc,st]=/^\{couleur\.([^.]+)\.([^}]+)\}$/.exec(n.$value); return (P[sc]??S[sc])[st].$value.hex;};
 *     for (const p of pa.paires) console.log(p.devant, p.fond, wcagContrast(hex(p.devant),hex(p.fond)).toFixed(4));'
 * Hypothèse de l'attendu : texte.secondaire sous 4,5:1 sur fond.composant.appui → mesurée à 4,3327 [F].
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { contractOf } from '../src/valise/generate.js';
import { valiseFromTokens } from '../src/tokens/primitives.js';
import { loadRoles, resolveRoles, contratRoles, contrat } from '../src/tokens/roles.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const load = (/** @type {string} */ f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));

/** devant | fond | ratio culori (4 décimales) | seuil. */
const TABLE = `
texte.principal | fond.app | 12.6234 | 4.5
texte.principal | fond.discret | 12.2923 | 4.5
texte.principal | fond.composant | 11.6831 | 4.5
texte.principal | fond.composant.survol | 10.9644 | 4.5
texte.principal | fond.composant.appui | 10.0834 | 4.5
texte.secondaire | fond.app | 5.4241 | 4.5
texte.secondaire | fond.discret | 5.2818 | 4.5
texte.secondaire | fond.composant | 5.0200 | 4.5
texte.secondaire | fond.composant.survol | 4.7112 | 4.5
texte.secondaire | fond.composant.appui | 4.3327 | 4.5
texte.interactif | fond.app | 5.4037 | 4.5
texte.interactif | fond.discret | 5.2619 | 4.5
texte.interactif | fond.interactif.discret | 5.0335 | 4.5
texte.accent | fond.app | 5.4393 | 4.5
texte.accent | fond.discret | 5.2967 | 4.5
texte.erreur | fond.app | 5.4139 | 4.5
texte.erreur | fond.erreur.discret | 5.0556 | 4.5
texte.succes | fond.app | 5.4296 | 4.5
texte.succes | fond.succes.discret | 5.0174 | 4.5
texte.avertissement | fond.app | 5.4339 | 4.5
texte.avertissement | fond.avertissement.discret | 5.0476 | 4.5
texte.info | fond.app | 5.4289 | 4.5
texte.info | fond.info.discret | 5.0657 | 4.5
texte.sur-interactif | fond.interactif.fort | 8.6144 | 4.5
texte.sur-interactif | fond.interactif.fort.survol | 9.1534 | 4.5
texte.sur-accent | fond.accent.fort | 4.5155 | 4.5
texte.sur-erreur | fond.erreur.fort | 4.7443 | 4.5
texte.sur-succes | fond.succes.fort | 4.5012 | 4.5
texte.sur-avertissement | fond.avertissement.fort | 5.3075 | 4.5
texte.sur-info | fond.info.fort | 5.0967 | 4.5
bordure.forte | fond.app | 3.1030 | 3
bordure.forte | fond.discret | 3.0216 | 3
bordure.forte | fond.composant | 2.8718 | 3
bordure.erreur | fond.app | 3.0963 | 3
bordure.erreur | fond.erreur.discret | 2.8913 | 3
bordure.succes | fond.app | 3.0843 | 3
bordure.succes | fond.succes.discret | 2.8502 | 3
bordure.avertissement | fond.app | 3.0885 | 3
bordure.avertissement | fond.avertissement.discret | 2.8689 | 3
bordure.info | fond.app | 3.0936 | 3
bordure.info | fond.info.discret | 2.8866 | 3
bordure.focus | fond.app | 3.1053 | 3
bordure.focus | fond.discret | 3.0238 | 3
bordure.focus | fond.composant | 2.8740 | 3
`
  .trim()
  .split('\n')
  .map((l) => {
    const [devant, fond, ratio, min] = l.split(' | ');
    return { devant, fond, ratio: Number(ratio), min: Number(min) };
  });
/** Paires sous le seuil, aucune exception écrite (dans l'ordre de paires.json). */
const FAILS = [
  'texte.secondaire sur fond.composant.appui',
  'bordure.forte sur fond.composant',
  'bordure.erreur sur fond.erreur.discret',
  'bordure.succes sur fond.succes.discret',
  'bordure.avertissement sur fond.avertissement.discret',
  'bordure.info sur fond.info.discret',
  'bordure.focus sur fond.composant',
];

const paires = load('paires.json');
const sem = load('semantique.tokens.json');

test('T2 paires.json : seuils 4,5 texte, 3 bordure et focus ; 44 paires, sans doublon', () => {
  assert.deepEqual(paires.seuils, { texte: 4.5, bordure: 3, focus: 3 });
  assert.equal(paires.paires.length, 44);
  const keys = paires.paires.map((/** @type {any} */ p) => `${p.devant}|${p.fond}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(paires.paires.map((/** @type {any} */ p) => [p.devant, p.fond]), TABLE.map((t) => [t.devant, t.fond]));
});

test('T2 rôles des paires : existent, texte devant un fond, type selon la propriété', () => {
  const roles = resolveRoles(sem, load('primitives.tokens.json'), load('statuts.tokens.json'));
  for (const p of paires.paires) {
    assert.ok(roles.has(p.devant), p.devant);
    assert.ok(roles.has(p.fond), p.fond);
    assert.match(p.fond, /^fond\./);
    const want = p.devant === 'bordure.focus' ? 'focus' : p.devant.split('.')[0];
    assert.equal(p.type, want, `${p.devant} : type`);
  }
});

test('T2 couverture : chaque texte et chaque bordure non décorative a une paire ; discrete et defaut n\'en ont pas', () => {
  const devants = new Set(paires.paires.map((/** @type {any} */ p) => p.devant));
  const roles = resolveRoles(sem, load('primitives.tokens.json'), load('statuts.tokens.json'));
  for (const r of roles.keys()) {
    if (r.startsWith('texte.')) assert.ok(devants.has(r), r);
    if (r.startsWith('bordure.') && !['bordure.discrete', 'bordure.defaut'].includes(r)) assert.ok(devants.has(r), r);
  }
  assert.ok(!devants.has('bordure.discrete') && !devants.has('bordure.defaut'));
});

test('T2 contratRoles : ratios égaux à culori (± 0,0001), seuil par type', () => {
  const c = contratRoles(loadRoles(DIR));
  assert.equal(c.pairs.length, TABLE.length);
  c.pairs.forEach((/** @type {any} */ p, /** @type {number} */ i) => {
    assert.equal(p.devant, TABLE[i].devant);
    assert.equal(p.fond, TABLE[i].fond);
    assert.equal(p.min, TABLE[i].min, `${p.devant} sur ${p.fond} : seuil`);
    assert.ok(Math.abs(p.ratio - TABLE[i].ratio) <= 1e-4, `${p.devant} sur ${p.fond} : ${p.ratio}, culori ${TABLE[i].ratio}`);
    assert.equal(p.ok, TABLE[i].ratio >= TABLE[i].min);
    assert.match(p.hexDevant, /^#[0-9a-f]{6}$/);
    assert.match(p.hexFond, /^#[0-9a-f]{6}$/);
  });
});

test('T2 hypothèse : texte.secondaire sous 4,5:1 sur fond.composant.appui (4,3327)', () => {
  const p = contratRoles(loadRoles(DIR)).pairs.find((/** @type {any} */ x) => x.devant === 'texte.secondaire' && x.fond === 'fond.composant.appui');
  assert.ok(p && p.ratio < 4.5 && Math.abs(p.ratio - 4.3327) <= 1e-4);
});

test('T2 contrat : le contrat par échelle reste celui de contractOf, les rôles s\'y ajoutent', () => {
  const set = loadRoles(DIR);
  const c = contrat(set);
  assert.deepEqual(c.echelles, contractOf(valiseFromTokens(set.primitives, set.statuts)));
  assert.deepEqual(c.roles, contratRoles(set));
});

test('T3 échecs : les 7 paires sous le seuil, sans exception écrite', () => {
  const c = contratRoles(loadRoles(DIR));
  assert.deepEqual(c.fails.map((/** @type {any} */ f) => `${f.devant} sur ${f.fond}`), FAILS);
  assert.deepEqual(c.exceptions, []);
});

test('T3 exception écrite : la paire sort des échecs et reste listée ; exception vide refusée', () => {
  const set = loadRoles(DIR);
  const withEx = structuredClone(set);
  const target = withEx.paires.paires.find((/** @type {any} */ p) => p.devant === 'bordure.forte' && p.fond === 'fond.composant');
  target.exception = 'Champ toujours doublé de son libellé.';
  const c = contratRoles(withEx);
  assert.ok(!c.fails.some((/** @type {any} */ f) => f.devant === 'bordure.forte' && f.fond === 'fond.composant'));
  assert.deepEqual(c.exceptions.map((/** @type {any} */ f) => `${f.devant} sur ${f.fond}`), ['bordure.forte sur fond.composant']);
  assert.equal(c.fails.length, 6);
  target.exception = '  ';
  assert.throws(() => contratRoles(withEx), /exception vide/);
});

test('T3 paire invalide : rôle inconnu ou type inconnu refusés', () => {
  const set = structuredClone(loadRoles(DIR));
  set.paires.paires.push({ devant: 'texte.inconnu', fond: 'fond.app', type: 'texte' });
  assert.throws(() => contratRoles(set), /texte\.inconnu/);
  const set2 = structuredClone(loadRoles(DIR));
  set2.paires.paires.push({ devant: 'texte.principal', fond: 'fond.app', type: 'ombre' });
  assert.throws(() => contratRoles(set2), /ombre/);
});

test('T3 npm run contraste : sort en 1 et liste les 7 échecs ; sort en 0 quand chaque échec a son exception', () => {
  const cli = join(ROOT, 'src', 'cli', 'contraste.js');
  let code = 0;
  let out = '';
  try {
    execFileSync(process.execPath, [cli], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch (/** @type {any} */ e) {
    code = e.status;
    out = e.stdout;
  }
  assert.equal(code, 1);
  for (const f of FAILS) assert.ok(out.includes(f), `sortie : ${f}`);
  assert.match(out, /7 paires? en échec/);

  const tmp = mkdtempSync(join(tmpdir(), 'contraste-'));
  const pp = structuredClone(paires);
  for (const p of pp.paires) if (FAILS.includes(`${p.devant} sur ${p.fond}`)) p.exception = 'Exception de test.';
  writeFileSync(join(tmp, 'paires.json'), JSON.stringify(pp));
  const ok = execFileSync(process.execPath, [cli, '--paires', join(tmp, 'paires.json')], { cwd: ROOT, encoding: 'utf8' });
  assert.match(ok, /0 paire en échec/);
  assert.match(ok, /7 exceptions écrites/);
});

test('T3 package.json : script contraste', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.contraste, 'node src/cli/contraste.js');
});
