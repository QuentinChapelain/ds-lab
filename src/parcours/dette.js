// @ts-check
/**
 * La dette d'un site (D78), calculée depuis ses sorties : les valeurs affichées (audit.json, rendu) et les composants
 * (constat.json). Chaque phrase est calculée ; une phrase que l'outil ne sait pas calculer ne s'écrit pas, le compte et
 * le dessin suffisent. Rien n'est saisi : mêmes sorties, même dette.
 */
import { toLab, deltaE } from '../lib/color.js';
import { fr } from '../lib/format.js';
import { isGrey } from '../brand/brand.js';
import { THRESHOLDS } from '../reduce/propose.js';

/**
 * @typedef {{ valeur: string, fois: number }} Valeur
 * @typedef {{ cle: 'colors' | 'fontSizes' | 'spacing' | 'radii', titre: string, compte: number, phrases: string[], valeurs: (Valeur & { hors?: boolean, gris?: boolean })[] }} Famille
 * @typedef {{ nom: string, versions: { nom: string, fois: number, capture: string | null, sansStyle: boolean }[], fois: number, phrases: string[] }} Type
 * @typedef {{ valeurs: { total: number, familles: Famille[] } | null, composants: { phrase: string, types: Type[], aussi: string[] } }} Dette
 */

/** « 3 » en lettres jusqu'à dix, au début d'une phrase. @param {number} n */
const enLettres = (n) => ['Aucune', 'Une', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix'][n] ?? String(n);

/** Accord en nombre. @param {number} n @param {string} un @param {string} plusieurs */
const nombre = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;

/** « a, b et c ». @param {string[]} l */
const liste = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} et ${l.at(-1)}`);


/**
 * Les valeurs d'interface d'une ou plusieurs familles de l'audit : le contenu (images, pictogrammes) mis à part.
 * @param {any} rendu  audit.rendered.families @param {string[]} familles
 * @returns {{ interface: Valeur[], contenu: number }}
 */
function valeursDe(rendu, familles) {
  /** @type {Map<string, number>} */
  const m = new Map();
  const contenu = new Set();
  for (const f of familles)
    for (const [cle, v] of Object.entries(rendu?.[f]?.values ?? {})) {
      const k = cle.split(' ')[0];
      const n = /** @type {any} */ (v).count - (/** @type {any} */ (v).content ?? 0);
      if (n > 0) m.set(k, (m.get(k) ?? 0) + n);
      else contenu.add(k);
    }
  for (const k of m.keys()) contenu.delete(k);
  return { interface: [...m].map(([valeur, fois]) => ({ valeur, fois })).sort((a, b) => b.fois - a.fois || (a.valeur < b.valeur ? -1 : 1)), contenu: contenu.size };
}

/** La valeur en px d'une longueur, ou null. @param {string} v */
const px = (v) => (/^-?[\d.]+px$/.test(v) ? Number.parseFloat(v) : null);

/** « Le code en écrit n. » quand le déclaré le dit. @param {any} declare @param {string} f */
const ecrit = (declare, f) => (typeof declare?.[f]?.distinct === 'number' ? [`Le code en écrit ${declare[f].distinct}.`] : []);

/**
 * Les quatre familles de valeurs.
 * @param {any} audit  audit.json
 * @returns {{ total: number, familles: Famille[] }}
 */
function valeurs(audit) {
  const rendu = audit.rendered?.families ?? {};
  const declare = audit.declared?.families ?? {};

  const c = valeursDe(rendu, ['colors']);
  const couleurs = c.interface.filter((x) => /^#[0-9a-f]{6}$/.test(x.valeur));
  const gris = couleurs.filter((x) => isGrey(x.valeur));
  const labs = couleurs.map((x) => toLab(x.valeur));
  // Presque identiques : une autre couleur du site à un écart invisible à l'œil (le seuil d'office de la réduction).
  const proches = couleurs.filter((_, i) => labs.some((l, j) => j !== i && deltaE(labs[i], l) <= THRESHOLDS.autoDeltaE)).length;
  const phrasesCouleurs = [
    `Dont ${nombre(gris.length, 'gris', 'gris')}${proches ? `, et ${proches} presque identiques à une autre` : ''}.`,
    ...ecrit(declare, 'colors'),
    ...(c.contenu ? [`${enLettres(c.contenu)} autre${c.contenu > 1 ? 's' : ''} ${c.contenu > 1 ? 'viennent' : 'vient'} du contenu (images, pictogrammes) : mise${c.contenu > 1 ? 's' : ''} de côté.`] : []),
  ];

  const t = valeursDe(rendu, ['fontSizes']);
  const tailles = t.interface.filter((x) => px(x.valeur) !== null).sort((a, b) => /** @type {number} */ (px(a.valeur)) - /** @type {number} */ (px(b.valeur)));
  const virgules = tailles.filter((x) => !Number.isInteger(px(x.valeur)));

  const e = valeursDe(rendu, ['margins', 'paddings', 'gaps']);
  const ecarts = e.interface.filter((x) => (px(x.valeur) ?? 0) > 0).sort((a, b) => /** @type {number} */ (px(a.valeur)) - /** @type {number} */ (px(b.valeur)));
  const horsGrille = ecarts.filter((x) => /** @type {number} */ (px(x.valeur)) % 4 !== 0);

  const r = valeursDe(rendu, ['radii']);
  const rayons = r.interface.filter((x) => x.valeur !== '0px');
  // Un rond : une longueur au-delà du seuil de pilule de la réduction, ou un pourcentage d'au moins 50.
  const ronds = rayons.filter((x) => (px(x.valeur) ?? 0) >= THRESHOLDS.pillPx || (/%$/.test(x.valeur) && Number.parseFloat(x.valeur) >= 50));
  rayons.sort((a, b) => (px(a.valeur) ?? Infinity) - (px(b.valeur) ?? Infinity) || (a.valeur < b.valeur ? -1 : 1));

  /** @type {Famille[]} */
  const familles = [
    {
      cle: 'colors',
      titre: 'Couleurs',
      compte: couleurs.length,
      phrases: phrasesCouleurs,
      valeurs: [...gris.map((x) => ({ ...x, gris: true })), ...couleurs.filter((x) => !isGrey(x.valeur))],
    },
    {
      cle: 'fontSizes',
      titre: 'Tailles de texte',
      compte: tailles.length,
      phrases: [...(virgules.length ? [`${enLettres(virgules.length)} ${virgules.length > 1 ? 'sont des valeurs' : 'est une valeur'} à virgule, en bleu.`] : []), ...ecrit(declare, 'fontSizes')],
      valeurs: tailles.map((x) => ({ ...x, hors: !Number.isInteger(px(x.valeur)) })),
    },
    {
      cle: 'spacing',
      titre: 'Espacements',
      compte: ecarts.length,
      phrases: [...(horsGrille.length ? [`${enLettres(horsGrille.length)} ${horsGrille.length > 1 ? 'sont' : 'est'} hors d’une grille de 4 px, en bleu.`] : []), 'Valeurs en pixels.'],
      valeurs: ecarts.map((x) => ({ ...x, hors: /** @type {number} */ (px(x.valeur)) % 4 !== 0 })),
    },
    {
      cle: 'radii',
      titre: 'Arrondis',
      compte: rayons.length,
      phrases: [
        ...(ronds.length > 1 ? [`${enLettres(ronds.length)} façons d’écrire un rond : ${liste(ronds.map((x) => (px(x.valeur) !== null ? fr(/** @type {number} */ (px(x.valeur)), { decimales: 2 }) : x.valeur.replace('%', ' %'))))}.`] : []),
        ...ecrit(declare, 'radii'),
      ],
      valeurs: rayons,
    },
  ];
  return { total: familles.reduce((n, f) => n + f.compte, 0), familles };
}

/** Le nom d'un type au début d'une carte. @param {string} n */
const majuscule = (n) => n.charAt(0).toUpperCase() + n.slice(1);

/**
 * Les composants : une carte par type qui a des versions, et ce qui reste à regarder.
 * @param {any} constat  constat.json
 * @param {number} pages
 */
function composants(constat, pages) {
  const ch = constat.chiffres ?? {};
  /** @type {Type[]} */
  const types = (constat.types ?? [])
    .filter((/** @type {any} */ t) => (t.versions ?? []).length)
    .map((/** @type {any} */ t) => {
      const versions = t.versions.map((/** @type {any} */ v) => ({ nom: String(v.nomCode ?? v.nom), fois: v.fois, capture: v.capture ?? null, sansStyle: v.origineCle === 'nu' }));
      const hauteurs = [...new Set(t.versions.flatMap((/** @type {any} */ v) => (v.apparences ?? []).map((/** @type {any} */ a) => Math.round(a.mesures?.hauteur ?? 0))).filter(Boolean))].sort((a, b) => a - b);
      const nus = versions.filter((/** @type {{ sansStyle: boolean }} */ v) => v.sansStyle).reduce((n, /** @type {{ fois: number }} */ v) => n + v.fois, 0);
      const phrases = [
        `${nombre(t.fois, 'emploi', 'emplois')} sur ${nombre(pages, 'page', 'pages')}.`,
        ...(hauteurs.length > 1 ? [`${enLettres(hauteurs.length)} hauteurs : ${liste(hauteurs.map(String))} px.`] : []),
        ...(nus ? [`${nus} ${nus > 1 ? 'n’ont' : 'n’a'} aucun style.`] : []),
      ];
      return { nom: majuscule(String(t.nom)), versions, fois: t.fois, phrases };
    });
  const frameworks = Object.keys(ch.frameworks ?? {}).length;
  const zone = constat.scores?.accessibilite?.echecs?.zone ?? 0;
  return {
    phrase: `${nombre(ch.versions ?? 0, 'version', 'versions')} pour ${nombre(ch.types ?? 0, 'type', 'types')} de composants, sur ${nombre(ch.elements ?? 0, 'élément relevé', 'éléments relevés')}.${frameworks ? '' : ' Aucun ne vient d’un framework.'}`,
    types,
    aussi: [
      ...(ch.nonIdentifies ? [`${nombre(ch.nonIdentifies, 'bloc répété', 'blocs répétés')} que l’outil ne sait pas nommer : à trier plus tard.`] : []),
      ...(zone ? [`${zone} ${zone > 1 ? 'éléments' : 'élément'} sur ${ch.elements ?? 0} ${zone > 1 ? 'ont' : 'a'} une zone de clic de moins de 24 px.`] : []),
    ],
  };
}

/**
 * La dette d'un site.
 * @param {{ constat: any, audit: any | null, pages: number }} o
 * @returns {Dette}
 */
export function detteDe({ constat, audit, pages }) {
  return { valeurs: audit ? valeurs(audit) : null, composants: composants(constat, pages) };
}
