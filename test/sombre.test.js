// @ts-check
/**
 * Étape 4b, lot 2 : mode sombre (docs/attendus/etape-4b-contextes.md, réponses 1 à 3).
 * Attendus, chiffres par culori (wcagContrast) :
 *   M1 miroir [H] : generateScale(nom, source, { fond: 'sombre' }) garde la source au pas 9 ; les pas 1 à 8 tiennent
 *      les cibles du clair contre le noir (1,02 1,05 1,11 1,19 1,29 1,45 1,9 3,2), à 1 % près ; école normale : pas 11
 *      et 12 à 5,6 et 13 contre le noir ; checkValise passe sur la même référence ;
 *      commande : node --input-type=module -e "import {generateScale} from './src/valise/generate.js';
 *        import {wcagContrast} from 'culori'; const g=generateScale('t','#c8553d',{fond:'sombre'});
 *        console.log(g.steps.map(h=>wcagContrast(h,'#000000').toFixed(2)))"
 *   M2 contraste entre deux pas d'une même échelle, de même école : le même en clair et en sombre, à l'arrondi près
 *      (le contraste de deux couleurs mesurées contre une même référence est le quotient de leurs contrastes à cette
 *      référence) ; neutre sombre depuis sa source miroir : école normale, pas 11 et 12 à 5,6 et 13 contre le noir ;
 *      texte.principal sur fond.app et texte.secondaire sur fond.app, clair et sombre, écart < 3 % ;
 *   M3 tokens/commun/mode.sombre.tokens.json = sombreTokens (pas de dérive) ; surface et sur-inverse au noir ;
 *   M4 le fichier des rôles est le même dans les deux modes ; en sombre, fond.surface = #000000, fond.app = pas 1 du
 *      neutre sombre ; en clair, fond.surface et texte.sur-inverse restent #ffffff ;
 *   M5 pour chaque marque fictive, les boutons (plein, plein survolé, texte sur le plein, du primaire, de l'accent et
 *      des quatre statuts) ont la même valeur dans les deux modes ; texte.marque.grand tient 3:1 sur les fonds
 *      sombres ;
 *   M6 fichiers sombres écrits = sortie de la saisie ; les 4 marques fictives passent le contraste en sombre.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wcagContrast } from 'culori';
import { generateScale, checkValise, sourceMiroir, TARGETS } from '../src/valise/generate.js';
import { scaleToDtcg, valiseFromTokens, sombreTokens } from '../src/tokens/primitives.js';
import { loadRoles, contratRoles, resolveRoles } from '../src/tokens/roles.js';
import { saisir, serialiser } from '../src/tokens/saisie.js';
import { COMMUN, RESOLVER, lireResolver, partager } from '../src/tokens/resolver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = ['orbe-cafe', 'atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie'];
/** @param {string} p */
const lire = (p) => JSON.parse(readFileSync(p, 'utf8'));
const noir = (/** @type {string} */ h) => wcagContrast(h, '#000000');

test('M1 miroir : pas 9 = source, cibles du clair contre le noir, checkValise sur la même référence', () => {
  const g = generateScale('terre', '#c8553d', { fond: 'sombre' });
  assert.equal(g.fond, 'sombre');
  assert.equal(g.school, 'normale');
  assert.equal(g.steps[8], '#c8553d');
  for (let i = 1; i <= 8; i++) assert.ok(Math.abs(noir(g.steps[i - 1]) / TARGETS[i] - 1) <= 0.01, `pas ${i} : ${noir(g.steps[i - 1])}`);
  for (const i of [11, 12]) assert.ok(Math.abs(noir(g.steps[i - 1]) / TARGETS[i] - 1) <= 0.01, `pas ${i} : ${noir(g.steps[i - 1])}`);
  const dtcg = scaleToDtcg(g, 'essai');
  assert.equal(dtcg.$extensions['ds-lab.valise'].fond, 'sombre');
  assert.deepEqual(checkValise(valiseFromTokens({ couleur: { terre: dtcg } })), []);
  assert.equal(scaleToDtcg(generateScale('terre', '#c8553d'), 'essai').$extensions['ds-lab.valise'].fond, undefined, 'le clair ne porte pas de fond');
});

test('M2 quotient : textes neutres sur fond.app, même contraste en clair et en sombre à 3 % près', () => {
  const t = generateScale('terre', '#c8553d');
  const u = generateScale('terre', '#c8553d', { fond: 'sombre' });
  assert.ok(Math.abs(wcagContrast(u.steps[11], u.steps[0]) / wcagContrast(t.steps[11], t.steps[0]) - 1) < 0.03);
  const source = sourceMiroir('#8a8478');
  assert.ok(Math.abs(noir(source) - wcagContrast('#8a8478', '#ffffff')) < 0.03, `source miroir ${source}`);
  const n = generateScale('neutre', source, { fond: 'sombre' });
  assert.equal(n.school, 'normale');
  /** @param {string} mode @param {string} role */
  const ratio = (mode, role) => {
    const s = loadRoles(join(ROOT, 'tokens', 'orbe-cafe'), { mode });
    const r = resolveRoles(s.semantique, s.primitives, s.marque);
    return wcagContrast(/** @type {any} */ (r.get(role)).hex, /** @type {any} */ (r.get('fond.app')).hex);
  };
  for (const role of ['texte.principal', 'texte.secondaire']) assert.ok(Math.abs(ratio('sombre', role) / ratio('clair', role) - 1) < 0.03, role);
});

test('M3 commun sombre : fichier = sombreTokens, checkValise passe, surface et sur-inverse au noir', () => {
  const ecrit = readFileSync(join(COMMUN, 'mode.sombre.tokens.json'), 'utf8');
  const attendu = sombreTokens(lire(join(COMMUN, 'primitives.tokens.json')), lire(join(COMMUN, 'statuts.tokens.json')));
  assert.equal(ecrit, JSON.stringify(attendu, null, 2) + '\n');
  assert.deepEqual(checkValise(valiseFromTokens(attendu)), []);
  assert.equal(attendu.couleur.surface.$value.hex, '#000000');
  assert.equal(attendu.couleur['sur-inverse'].$value.hex, '#000000');
  assert.deepEqual(Object.keys(attendu.couleur).filter((k) => !k.startsWith('$')), ['surface', 'sur-inverse', 'neutre', 'erreur', 'succes', 'avertissement', 'info']);
});

test('M4 rôles identiques dans les deux modes ; surface et texte sur inverse : blanc en clair, noir en sombre', () => {
  const chemin = join(ROOT, 'tokens', 'orbe-cafe', RESOLVER);
  const sem = lire(join(COMMUN, 'semantique.tokens.json'));
  assert.equal(sem.fond.surface.$value, '{couleur.surface}');
  assert.equal(sem.texte['sur-inverse'].$value, '{couleur.sur-inverse}');
  const { $description, ...roles } = sem;
  for (const mode of ['clair', 'sombre']) assert.deepEqual(partager(lireResolver(chemin, { mode })).semantique, roles, mode);
  const hex = (/** @type {string} */ mode, /** @type {string} */ role) => {
    const s = loadRoles(join(ROOT, 'tokens', 'orbe-cafe'), { mode });
    return /** @type {any} */ (resolveRoles(s.semantique, s.primitives, s.marque).get(role)).hex;
  };
  assert.equal(hex('clair', 'fond.surface'), '#ffffff');
  assert.equal(hex('clair', 'texte.sur-inverse'), '#ffffff');
  assert.equal(hex('sombre', 'fond.surface'), '#000000');
  assert.equal(hex('sombre', 'texte.sur-inverse'), '#000000');
  assert.equal(hex('sombre', 'fond.app'), lire(join(COMMUN, 'mode.sombre.tokens.json')).couleur.neutre['1'].$value.hex);
});

test('M5 mêmes boutons dans les deux modes ; texte.marque.grand à 3:1 sur les fonds sombres', () => {
  const boutons = ['primaire', 'accent', 'erreur', 'succes', 'avertissement', 'info'].flatMap((e) => ['plein', 'plein-survol', 'sur-plein'].map((k) => `marque.${e}.${k}`));
  for (const m of MARQUES) {
    /** @param {string} mode */
    const resolus = (mode) => {
      const s = loadRoles(join(ROOT, 'tokens', m), { mode });
      const probe = { couleur: { $type: 'color', ...Object.fromEntries(boutons.map((b, i) => [`b${i}`, { $value: `{${b}}` }])) } };
      const r = resolveRoles(probe, s.primitives, s.marque);
      return boutons.map((_, i) => /** @type {any} */ (r.get(`couleur.b${i}`)).hex);
    };
    assert.deepEqual(resolus('sombre'), resolus('clair'), m);
    const s = loadRoles(join(ROOT, 'tokens', m), { mode: 'sombre' });
    const r = resolveRoles(s.semantique, s.primitives, s.marque);
    const grand = /** @type {any} */ (r.get('texte.marque.grand')).hex;
    for (const f of ['fond.app', 'fond.surface', 'fond.discret', 'fond.marque.discret']) assert.ok(wcagContrast(grand, /** @type {any} */ (r.get(f)).hex) >= 3, `${m} : ${f}`);
  }
});

test('M6 fichiers sombres = sortie de la saisie ; les 4 marques fictives passent le contraste en sombre', () => {
  for (const m of MARQUES) {
    const dossier = join(ROOT, 'tokens', m);
    const r = saisir(lire(join(dossier, 'entree.json')), { dossier });
    assert.deepEqual(r.motifs, [], m);
    assert.equal(serialiser(r.echellesSombres), readFileSync(join(dossier, 'echelles.sombre.tokens.json'), 'utf8'), m);
    assert.equal(serialiser(r.marqueSombre), readFileSync(join(dossier, 'marque.sombre.tokens.json'), 'utf8'), m);
    assert.deepEqual(contratRoles(loadRoles(dossier, { mode: 'sombre' })).fails, [], m);
  }
});
