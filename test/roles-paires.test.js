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
 *
 * Décisions du 14/11/2026 (attendu complété à la main, ratios culori) :
 *   texte.secondaire sur fond.composant.appui : paire interdite, règle « sur fond.composant.appui, le texte
 *     passe en texte.principal » (texte.principal sur fond.composant.appui reste déclarée) ;
 *   bordure.forte sur fond.composant : paire interdite, règle « un champ se pose sur fond.app » ;
 *   les 4 paires bordure.<statut> sur fond.<statut>.discret sont retirées ;
 *   bordure.focus → bleu 9 : 8,3247 / 8,1063 / 7,7046 sur neutre 1, 2, 3 ;
 *   blanc sur terre 10, succes 10, info 10 : 5,1669 / 5,0674 / 4,6220 (attendus annoncés : 5,17, 5,07, 4,62) ;
 *     commande : wcagContrast('#ffffff', hex du pas 10), même lecture des fichiers que ci-dessus.
 *
 * Décisions après T5 (14/11/2026), ratios culori, commande : wcagContrast(hex devant, hex fond) sur les
 * pas lus dans primitives et statuts (couleur.blanc = #ffffff) :
 *   fond.surface (blanc) : texte.principal 13,0628, texte.secondaire 5,6129, texte.interactif 5,5917,
 *     texte.erreur 5,6023, texte.succes 5,6186, texte.avertissement 5,6230, texte.info 5,6178,
 *     bordure.forte 3,2110, bordure.focus 8,6144 ;
 *   texte.sur-inverse (blanc) sur fond.inverse (neutre 12) : 13,0628 ;
 *   interdite texte.secondaire sur fond.interactif.fort : 1,5348, règle « sur un plein, le texte est texte.sur-* » ;
 *   règle de bordure.forte sur fond.composant : « un champ se pose sur fond.surface ».
 *
 * Séance 3b (15/11/2026), règle des pleins en trois cas, ratios culori, commande : node local/scripts/ratios-pleins.mjs
 * (wcagContrast sur les pas lus dans primitives et statuts ; voile = interpolate([bleu 9, blanc], 'rgb')(0,08) = #3c5a88) :
 *   blanc sur bleu 9 + voile 8 % : 6,9765 ; blanc sur terre 11 : 5,6287 ; sur erreur 11 : 5,6023 ;
 *   sur succes 11 : 5,6186 ; sur info 11 : 5,6178 ; avertissement 12 sur avertissement 9 : 5,7721.
 * Décision du 15/11/2026 : bordure.focus → marque.primaire.11 (bleu 11 #4c6994) ; ratios culori
 *   (wcagContrast('#4c6994', fond)) : fond.app 5,4037, fond.surface 5,5917, fond.discret 5,2619, fond.composant 5,0011.
 * Décision du 15/11/2026 : interdite bordure.focus sur fond.interactif.fort (bleu 11 sur bleu 9 :
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
import { PAIRES_AJOUTEES, INTERDITES_AJOUTEES } from './helpers/roles-ajoutes.js';
import { charger, COMMUN, ORBE } from './helpers/jetons.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const load = charger;

/** devant | fond | ratio culori (4 décimales) | seuil. */
const TABLE = `
texte.principal | fond.app | 12.6234 | 4.5
texte.principal | fond.surface | 13.0628 | 4.5
texte.principal | fond.discret | 12.2923 | 4.5
texte.principal | fond.composant | 11.6831 | 4.5
texte.principal | fond.composant.survol | 10.9644 | 4.5
texte.principal | fond.composant.appui | 10.0834 | 4.5
texte.secondaire | fond.app | 5.4241 | 4.5
texte.secondaire | fond.surface | 5.6129 | 4.5
texte.secondaire | fond.discret | 5.2818 | 4.5
texte.secondaire | fond.composant | 5.0200 | 4.5
texte.secondaire | fond.composant.survol | 4.7112 | 4.5
texte.interactif | fond.app | 5.4037 | 4.5
texte.interactif | fond.surface | 5.5917 | 4.5
texte.interactif | fond.discret | 5.2619 | 4.5
texte.interactif | fond.interactif.discret | 5.0335 | 4.5
texte.accent | fond.app | 5.4393 | 4.5
texte.accent | fond.discret | 5.2967 | 4.5
texte.erreur | fond.app | 5.4139 | 4.5
texte.erreur | fond.surface | 5.6023 | 4.5
texte.erreur | fond.erreur.discret | 5.0556 | 4.5
texte.succes | fond.app | 5.4296 | 4.5
texte.succes | fond.surface | 5.6186 | 4.5
texte.succes | fond.succes.discret | 5.0174 | 4.5
texte.avertissement | fond.app | 5.4339 | 4.5
texte.avertissement | fond.surface | 5.6230 | 4.5
texte.avertissement | fond.avertissement.discret | 5.0476 | 4.5
texte.info | fond.app | 5.4289 | 4.5
texte.info | fond.surface | 5.6178 | 4.5
texte.info | fond.info.discret | 5.0657 | 4.5
texte.sur-interactif | fond.interactif.fort | 8.6144 | 4.5
texte.sur-interactif | fond.interactif.fort.survol | 6.9765 | 4.5
texte.sur-accent | fond.accent.fort | 5.6287 | 4.5
texte.sur-erreur | fond.erreur.fort | 5.6023 | 4.5
texte.sur-succes | fond.succes.fort | 5.6186 | 4.5
texte.sur-avertissement | fond.avertissement.fort | 5.7721 | 4.5
texte.sur-info | fond.info.fort | 5.6178 | 4.5
texte.sur-inverse | fond.inverse | 13.0628 | 4.5
bordure.forte | fond.app | 3.1030 | 3
bordure.forte | fond.surface | 3.2110 | 3
bordure.forte | fond.discret | 3.0216 | 3
bordure.erreur | fond.app | 3.0963 | 3
bordure.succes | fond.app | 3.0843 | 3
bordure.avertissement | fond.app | 3.0885 | 3
bordure.info | fond.app | 3.0936 | 3
bordure.focus | fond.app | 5.4037 | 3
bordure.focus | fond.surface | 5.5917 | 3
bordure.focus | fond.discret | 5.2619 | 3
bordure.focus | fond.composant | 5.0011 | 3
`
  .trim()
  .split('\n')
  .map((l) => {
    const [devant, fond, ratio, min] = l.split(' | ');
    return { devant, fond, ratio: Number(ratio), min: Number(min) };
  });
/** Paires interdites : devant | fond | ratio culori | règle. */
const INTERDITES = [
  { devant: 'texte.secondaire', fond: 'fond.composant.appui', ratio: 4.3327, regle: 'sur fond.composant.appui, le texte passe en texte.principal' },
  { devant: 'texte.secondaire', fond: 'fond.interactif.fort', ratio: 1.5348, regle: 'sur un plein, le texte est texte.sur-*' },
  { devant: 'bordure.forte', fond: 'fond.composant', ratio: 2.8718, regle: 'un champ se pose sur fond.surface' },
  { devant: 'bordure.focus', fond: 'fond.interactif.fort', ratio: 1.5406, regle: 'l’anneau de focus est décalé de 2 px et se pose sur le fond de la page, jamais sur le plein' },
];
const RETIREES = ['erreur', 'succes', 'avertissement', 'info'].map((s) => `bordure.${s}|fond.${s}.discret`);

const paires = load('paires.json');
const sem = load('semantique.tokens.json');

test('T2 paires.json : seuils 4,5 texte, 3 bordure et focus (et grand texte, lot 5) ; 48 paires en tête, sans doublon, dans l\'ordre', () => {
  assert.deepEqual(paires.seuils, { texte: 4.5, bordure: 3, focus: 3, 'grand-texte': 3 });
  assert.equal(paires.paires.length, 48 + PAIRES_AJOUTEES.length + 4, 'étape 4b, lot 3 : + 4 bordures de statut sur fond.surface');
  const keys = paires.paires.map((/** @type {any} */ p) => `${p.devant}|${p.fond}`);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(paires.paires.slice(0, 48).map((/** @type {any} */ p) => [p.devant, p.fond]), TABLE.map((t) => [t.devant, t.fond]));
  for (const r of RETIREES) assert.ok(!keys.includes(r), `retirée : ${r}`);
  assert.ok(keys.includes('texte.principal|fond.composant.appui'));
});

test('T2 paires.json : quatre paires interdites, chacune avec sa règle, absentes des paires', () => {
  assert.deepEqual(
    paires.interdites.slice(0, 4).map((/** @type {any} */ p) => ({ devant: p.devant, fond: p.fond, regle: p.regle })),
    INTERDITES.map(({ devant, fond, regle }) => ({ devant, fond, regle })),
  );
});

test('T2 rôles des paires : existent, texte devant un fond, type selon la propriété', () => {
  const roles = resolveRoles(sem, load('primitives.tokens.json'), load('statuts.tokens.json'), load('marque.tokens.json'));
  for (const p of [...paires.paires, ...paires.interdites]) {
    assert.ok(roles.has(p.devant), p.devant);
    assert.ok(roles.has(p.fond), p.fond);
    assert.match(p.fond, /^fond\./);
  }
  const type = (/** @type {string} */ d) => (d.startsWith('bordure.focus') ? 'focus' : d === 'texte.marque.grand' ? 'grand-texte' : d.split('.')[0]);
  for (const p of paires.paires) assert.equal(p.type, type(p.devant), `${p.devant} : type`);
});

test('T2 couverture : chaque texte et chaque bordure non décorative a une paire ; discrete et defaut n\'en ont pas', () => {
  const devants = new Set(paires.paires.map((/** @type {any} */ p) => p.devant));
  const roles = resolveRoles(sem, load('primitives.tokens.json'), load('statuts.tokens.json'), load('marque.tokens.json'));
  for (const r of roles.keys()) {
    if (r.startsWith('texte.')) assert.ok(devants.has(r), r);
    if (r.startsWith('bordure.') && !['bordure.discrete', 'bordure.defaut'].includes(r)) assert.ok(devants.has(r), r);
  }
  assert.ok(!devants.has('bordure.discrete') && !devants.has('bordure.defaut'));
});

test('T2 contratRoles : ratios égaux à culori (± 0,0001), seuil par type', () => {
  const c = contratRoles(loadRoles(DIR));
  assert.equal(c.pairs.length, TABLE.length + PAIRES_AJOUTEES.length + 4, 'étape 4b, lot 3 : + 4 bordures de statut sur fond.surface');
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
  const got = ['accent', 'erreur', 'succes', 'info', 'avertissement'].map((s) => c.pairs.find((/** @type {any} */ p) => p.devant === `texte.sur-${s}`));
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

test('T2 hypothèse : texte.secondaire sous 4,5:1 sur fond.composant.appui (4,3327), désormais interdite', () => {
  const p = contratRoles(loadRoles(DIR)).interdites.find((/** @type {any} */ x) => x.devant === 'texte.secondaire' && x.fond === 'fond.composant.appui');
  assert.ok(p && p.ratio < 4.5 && Math.abs(p.ratio - 4.3327) <= 1e-4);
});

/**
 * Revue de code du 15/11, lot 0 : le contrat par échelle d'Orbe Café, écrit à la main (avant : comparé à
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
  assert.deepEqual([...new Set(c.pairs.map((/** @type {any} */ p) => p.scale))], ['neutre', 'bleu', 'terre', 'sable', 'erreur', 'succes', 'avertissement', 'info']);
  assert.equal(c.pairs.length, 80);
  assert.deepEqual(c.fails, ['neutre : onSolid sur 10, 3,7832 < 4,5', 'terre : onSolid sur 10, 3,8055 < 4,5', 'succes : onSolid sur 10, 3,8503 < 4,5']);
  /** @param {string} scale @param {string} fg @param {string} bg */
  const ratio = (scale, fg, bg) => c.pairs.find((/** @type {any} */ p) => p.scale === scale && p.fg === fg && p.bg === bg)?.ratio;
  for (const [scale, fg, bg, want] of /** @type {const} */ ([['neutre', '11', '1', 5.424088602627833], ['bleu', 'onSolid', '9', 8.614442961097723], ['neutre', 'onSolid', '10', 3.7832254575552007]]))
    assert.ok(Math.abs(/** @type {number} */ (ratio(scale, fg, bg)) - want) <= 1e-4, `${scale} ${fg} sur ${bg} : ${ratio(scale, fg, bg)}`);
});

test('T3 aucun échec, aucune exception écrite', () => {
  const c = contratRoles(loadRoles(DIR));
  assert.deepEqual(c.fails, []);
  assert.deepEqual(c.exceptions, []);
});

test('T3 paire sous le seuil : échec sans exception ; exception écrite : listée à part ; exception vide refusée', () => {
  const set = structuredClone(loadRoles(DIR));
  const added = { devant: 'bordure.forte', fond: 'fond.composant.appui', type: 'bordure' };
  set.paires.paires.push(added);
  assert.deepEqual(contratRoles(set).fails.map((/** @type {any} */ f) => `${f.devant} sur ${f.fond}`), ['bordure.forte sur fond.composant.appui']);
  set.paires.paires[set.paires.paires.length - 1] = { ...added, exception: 'Champ toujours doublé de son libellé.' };
  const c = contratRoles(set);
  assert.deepEqual(c.fails, []);
  assert.deepEqual(c.exceptions.map((/** @type {any} */ f) => `${f.devant} sur ${f.fond}`), ['bordure.forte sur fond.composant.appui']);
  set.paires.paires[set.paires.paires.length - 1] = { ...added, exception: '  ' };
  assert.throws(() => contratRoles(set), /exception vide/);
});

test('T3 paire invalide : rôle inconnu, type inconnu, interdite déclarée, règle vide refusés', () => {
  const base = loadRoles(DIR);
  const a = structuredClone(base);
  a.paires.paires.push({ devant: 'texte.inconnu', fond: 'fond.app', type: 'texte' });
  assert.throws(() => contratRoles(a), /texte\.inconnu/);
  const b = structuredClone(base);
  b.paires.paires.push({ devant: 'texte.principal', fond: 'fond.app', type: 'ombre' });
  assert.throws(() => contratRoles(b), /ombre/);
  const c = structuredClone(base);
  c.paires.paires.push({ devant: 'texte.secondaire', fond: 'fond.composant.appui', type: 'texte' });
  assert.throws(() => contratRoles(c), /déclarée et interdite/);
  const d = structuredClone(base);
  d.paires.interdites[0].regle = ' ';
  assert.throws(() => contratRoles(d), /règle vide/);
});

test('T3 npm run contraste : sort en 0 sur les fichiers du dépôt ; en 1 avec une paire sous le seuil', () => {
  const cli = join(ROOT, 'src', 'cli', 'contraste.js');
  const ok = execFileSync(process.execPath, [cli], { cwd: ROOT, encoding: 'utf8' });
  assert.match(ok, /70 paires de rôles, 0 paire en échec, 0 exception écrite, 8 paires interdites\./);
  for (const p of INTERDITES) assert.ok(ok.includes(`${p.devant} sur ${p.fond}`) && ok.includes(p.regle), `interdite listée : ${p.devant}`);

  const tmp = mkdtempSync(join(tmpdir(), 'contraste-'));
  const pp = structuredClone(paires);
  pp.paires.push({ devant: 'bordure.forte', fond: 'fond.composant.appui', type: 'bordure' });
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
  assert.ok(out.includes('bordure.forte sur fond.composant.appui'));
});

test('T3 package.json : script contraste', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.contraste, 'node src/cli/contraste.js');
});
