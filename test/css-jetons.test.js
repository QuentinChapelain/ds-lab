// @ts-check
/**
 * Feuille CSS de chaque marque, écrite par Terrazzo (npm run css, src/tokens/css.js) et versionnée dans
 * tokens/<marque>/jetons.css (docs/attendus/etape-5e-css.md ; décisions de Quentin du 17/11/2026).
 *
 * Attendus écrits à la main avant le code (17/11/2026) :
 *   F1 fraîcheur : chaque marque de tokens/ (dossiersDeMarque) a son jetons.css, identique à l'octet à une génération neuve ;
 *   F2 forme : première ligne « /* Jetons de <nom>, écrits par npm run css depuis marque.resolver.json (Terrazzo). Ne pas
 *      modifier à la main. *\/ », <nom> lu dans le champ name du resolver ; puis trois blocs et rien d'autre, dans cet ordre :
 *      :root ; @media (prefers-color-scheme: dark) { :root } ; @media (width < <seuil>px) { :root }, le seuil lu dans
 *      $extensions["ds-lab.largeur"] du resolver (600 px pour les quatre marques) ;
 *   F3 seulement ce qui change : chaque variable d'un bloc @media est aussi dans :root, avec une autre valeur ;
 *      aucun raccourci font pour les styles de texte (il omet l'interlettrage) : un style donne ses cinq sous-variables
 *      -font-family, -font-size, -font-weight, -letter-spacing, -line-height, et pas de variable à son seul nom ;
 *   F4 accord : pour chaque marque et chaque combinaison (clair ou sombre, large ou étroit), les variables effectives de
 *      la feuille (:root, puis les blocs dont la condition vaut, var() résolus) sont exactement les jetons du lecteur
 *      (src/tokens/resolver.js, alias résolus par resoudreAlias), chemin du jeton, points remplacés par des tirets ;
 *      même valeur : couleur au hex du jeton, dimension valeur et unité, police comme liste de noms (guillemets
 *      ignorés), nombre et graisse tels quels ;
 *   F5 apply : chaque jeton que npm run apply sait écrire (couleur en hex, dimension en px, valeur littérale) est déclaré
 *      dans :root sous le nom cssVar et avec la valeur tokenValue de src/report/modifications.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import postcss from 'postcss';
import { dossiersDeMarque, nomDeMarque, lireResolver, seuilEtroit, RESOLVER } from '../src/tokens/resolver.js';
import { flattenTokens, tokenTypes, resoudreAlias } from '../src/tokens/roles.js';
import * as modifications from '../src/report/modifications.js';

const MARQUES = dossiersDeMarque();
const COMBINAISONS = [
  { mode: 'clair', largeur: 'large' },
  { mode: 'sombre', largeur: 'large' },
  { mode: 'clair', largeur: 'etroit' },
  { mode: 'sombre', largeur: 'etroit' },
];
const SOUS = { fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight', letterSpacing: 'letter-spacing', lineHeight: 'line-height' };
const TYPE_SOUS = { fontFamily: 'fontFamily', fontSize: 'dimension', letterSpacing: 'dimension', fontWeight: 'fontWeight', lineHeight: 'number' };

/** Module de la commande, chargé à la demande : son absence fait échouer chaque test qui le lit, et lui seul. */
const moduleCss = () => import(new URL('../src/tokens/css.js', import.meta.url).href);
/** @param {string} dossier */
const lireFeuille = (dossier) => {
  const f = join(dossier, 'jetons.css');
  assert.ok(existsSync(f), `${f} absent`);
  return readFileSync(f, 'utf8');
};
/** @param {string} id */
const nomVar = (id) => `--${id.replace(/\./g, '-')}`;

/**
 * Blocs de la feuille : condition (null pour :root) → déclarations, dans l'ordre.
 * @param {string} texte @returns {{ condition: string | null, decls: Map<string, string> }[]}
 */
function blocs(texte) {
  /** @type {{ condition: string | null, decls: Map<string, string> }[]} */
  const out = [];
  postcss.parse(texte).each((n) => {
    if (n.type === 'comment') return;
    if (n.type === 'rule') {
      assert.equal(n.selector, ':root');
      out.push({ condition: null, decls: declarations(n) });
    } else if (n.type === 'atrule' && n.name === 'media') {
      const regles = /** @type {postcss.Rule[]} */ (n.nodes.filter((x) => x.type === 'rule'));
      assert.deepEqual(regles.map((r) => r.selector), [':root'], `@media ${n.params} : une règle :root attendue`);
      out.push({ condition: n.params, decls: declarations(regles[0]) });
    } else assert.fail(`nœud inattendu : ${n.toString().slice(0, 80)}`);
  });
  return out;
}
/** @param {postcss.Rule} regle */
function declarations(regle) {
  /** @type {Map<string, string>} */
  const m = new Map();
  regle.walkDecls((d) => {
    assert.ok(!m.has(d.prop), `${d.prop} déclarée deux fois dans un bloc`);
    m.set(d.prop, d.value);
  });
  return m;
}

/**
 * Variables effectives d'une combinaison, var() résolus.
 * @param {ReturnType<typeof blocs>} bs @param {{ mode: string, largeur: string }} c @param {number} seuil
 */
function effectives(bs, c, seuil) {
  /** @type {Map<string, string>} */
  const vars = new Map();
  for (const b of bs) {
    if (b.condition === '(prefers-color-scheme: dark)' && c.mode !== 'sombre') continue;
    if (b.condition === `(width < ${seuil}px)` && c.largeur !== 'etroit') continue;
    for (const [k, v] of b.decls) vars.set(k, v);
  }
  /** @param {string} v @param {string[]} vus @returns {string} */
  const resoudre = (v, vus) =>
    v.replace(/var\((--[a-z0-9-]+)\)/g, (_, n) => {
      assert.ok(!vus.includes(n), `var() en boucle : ${[...vus, n].join(' → ')}`);
      assert.ok(vars.has(n), `var(${n}) sans déclaration`);
      return resoudre(/** @type {string} */ (vars.get(n)), [...vus, n]);
    });
  return new Map([...vars].map(([k, v]) => [k, resoudre(v, [k])]));
}

/** Noms d'une liste de polices écrite en CSS, guillemets ôtés (aucun nom des jetons ne contient de virgule). @param {string} s */
const policesCss = (s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1'));
/** Noms d'une valeur DTCG fontFamily : liste, ou un seul nom. @param {string | string[]} v */
const policesDtcg = (v) => (Array.isArray(v) ? v : [v]);

/**
 * Valeur CSS attendue d'une valeur DTCG résolue, et comparaison avec la valeur écrite.
 * @param {string | undefined} type @param {any} v @param {string | undefined} ecrit
 */
function egal(type, v, ecrit) {
  if (ecrit === undefined) return false;
  if (type === 'fontFamily') return policesCss(ecrit).join('|') === policesDtcg(v).join('|');
  if (type === 'color') return ecrit === v.hex;
  if (type === 'dimension') return ecrit === `${v.value}${v.unit}`;
  return ecrit === String(v);
}

test('F1 fraîcheur : jetons.css de chaque marque identique à une génération neuve', async () => {
  const { feuilleCss } = await moduleCss();
  assert.equal(MARQUES.length, 4);
  for (const d of MARQUES) {
    const r = await feuilleCss(d);
    assert.deepEqual(r.motifs, [], d);
    assert.equal(lireFeuille(d), r.texte, `${d}jetons.css : relancer npm run css`);
  }
});

test('F2 forme : en-tête en français, trois blocs, seuil lu dans le resolver', () => {
  for (const d of MARQUES) {
    const texte = lireFeuille(d);
    assert.equal(texte.split('\n')[0], `/* Jetons de ${nomDeMarque(d)}, écrits par npm run css depuis marque.resolver.json (Terrazzo). Ne pas modifier à la main. */`, d);
    const seuil = seuilEtroit(lireResolver(join(d, RESOLVER))).sous;
    assert.equal(seuil, 600, d);
    assert.deepEqual(blocs(texte).map((b) => b.condition), [null, '(prefers-color-scheme: dark)', `(width < ${seuil}px)`], d);
  }
});

test('F3 seulement ce qui change ; styles de texte sans raccourci font', () => {
  for (const d of MARQUES) {
    const [racine, ...autres] = blocs(lireFeuille(d));
    for (const b of autres)
      for (const [k, v] of b.decls) {
        assert.ok(racine.decls.has(k), `${d} ${b.condition} ${k} absente de :root`);
        assert.notEqual(v, racine.decls.get(k), `${d} ${b.condition} ${k} redéclarée sans changer`);
      }
    const plats = flattenTokens(lireResolver(join(d, RESOLVER)).jetons);
    const types = tokenTypes(lireResolver(join(d, RESOLVER)).jetons);
    const styles = [...plats.keys()].filter((k) => types.get(k) === 'typography');
    assert.ok(styles.length >= 11, `${d} : styles de texte`);
    for (const s of styles) {
      assert.ok(!racine.decls.has(nomVar(s)), `${d} : raccourci ${nomVar(s)}`);
      for (const sous of Object.values(SOUS)) assert.ok(racine.decls.has(`${nomVar(s)}-${sous}`), `${d} : ${nomVar(s)}-${sous} absente`);
    }
  }
});

test('F4 accord : variables de la feuille et jetons du lecteur, chaque marque, chaque combinaison', () => {
  /** @type {string[]} */
  const ecarts = [];
  for (const d of MARQUES) {
    const chemin = join(d, RESOLVER);
    const bs = blocs(lireFeuille(d));
    const seuil = seuilEtroit(lireResolver(chemin)).sous;
    for (const c of COMBINAISONS) {
      const ici = `${d} ${c.mode}/${c.largeur}`;
      const eff = effectives(bs, c, seuil);
      const jetons = lireResolver(chemin, c).jetons;
      const plats = flattenTokens(jetons);
      const types = tokenTypes(jetons);
      /** @type {Set<string>} */
      const attendus = new Set();
      for (const id of [...plats.keys()].filter((k) => !k.endsWith('.$root'))) {
        const t = types.get(id);
        const v = resoudreAlias(plats, plats.get(id).$value, { depuis: id, chaine: [id] }).valeur;
        if (t === 'typography') {
          for (const [champ, x] of Object.entries(v)) {
            const n = `${nomVar(id)}-${SOUS[/** @type {keyof typeof SOUS} */ (champ)]}`;
            attendus.add(n);
            const vx = resoudreAlias(plats, x, { depuis: id, chaine: [id] }).valeur;
            if (!egal(TYPE_SOUS[/** @type {keyof typeof TYPE_SOUS} */ (champ)], vx, eff.get(n))) ecarts.push(`${ici} ${n} : feuille ${eff.get(n)}, lecteur ${JSON.stringify(vx)}`);
          }
          continue;
        }
        attendus.add(nomVar(id));
        if (!egal(t, v, eff.get(nomVar(id)))) ecarts.push(`${ici} ${nomVar(id)} : feuille ${eff.get(nomVar(id))}, lecteur ${JSON.stringify(v)}`);
      }
      for (const k of eff.keys()) if (!attendus.has(k)) ecarts.push(`${ici} ${k} : dans la feuille, pas chez le lecteur`);
      for (const k of attendus) if (!eff.has(k)) ecarts.push(`${ici} ${k} : chez le lecteur, pas dans la feuille`);
    }
  }
  assert.deepEqual(ecarts, []);
});

test('F5 apply : mêmes noms et mêmes valeurs que tokens.css', () => {
  const { cssVar, tokenValue } = /** @type {any} */ (modifications);
  assert.equal(typeof cssVar, 'function', 'cssVar exportée par src/report/modifications.js');
  assert.equal(typeof tokenValue, 'function', 'tokenValue exportée par src/report/modifications.js');
  for (const d of MARQUES) {
    const racine = blocs(lireFeuille(d))[0].decls;
    const jetons = lireResolver(join(d, RESOLVER)).jetons;
    const types = tokenTypes(jetons);
    let n = 0;
    for (const [id, j] of flattenTokens(jetons)) {
      if (id.endsWith('.$root')) continue;
      const t = types.get(id);
      const litteral = (t === 'color' && j.$value?.hex) || (t === 'dimension' && j.$value?.unit === 'px');
      if (!litteral) continue;
      n++;
      assert.equal(racine.get(cssVar(id)), tokenValue(jetons, id), `${d} ${id}`);
    }
    assert.ok(n > 150, `${d} : ${n} jetons littéraux`);
  }
});
