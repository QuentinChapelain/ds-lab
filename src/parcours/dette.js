// @ts-check
/**
 * La dette d'un site (D78, D94), calculée depuis ses sorties : les valeurs affichées (audit.json, rendu) et les
 * composants (constat.json). Une note par famille et par type, par une règle fixe, la même à chaque partie : l'écart
 * qui dit le mieux la dette, sinon l'étendue ; le reste se lit derrière « Voir toutes les valeurs ». Une note que
 * l'outil ne sait pas calculer ne s'écrit pas, le compte et le dessin suffisent. Rien n'est saisi : mêmes sorties,
 * même dette.
 */
import { enLettres, fr, liste } from '../lib/format.js';
import { isGrey } from '../brand/brand.js';
import { THRESHOLDS } from '../reduce/propose.js';
import { couleursProches } from '../report/html.js';

/**
 * @typedef {{ valeur: string, fois: number }} Valeur
 * @typedef {{ cle: 'colors' | 'fontSizes' | 'spacing' | 'radii', titre: string, compte: number, note: string | null, valeurs: (Valeur & { hors?: boolean, gris?: boolean })[] }} Famille
 * @typedef {{ nom: string, versions: { nom: string, fois: number, capture: string | null, imageTombee?: string, sansStyle: boolean }[], fois: number, hauteurs: number[], note: string }} Type
 * @typedef {{ valeurs: { total: number, familles: Famille[] } | null, composants: { types: Type[], aussi: string[] } }} Dette
 */

/** Accord en nombre. @param {number} n @param {string} un @param {string} plusieurs */
const nombre = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;


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

/**
 * Les couleurs affichées (D86) : celles que la réduction range, lues dans les usages de l'audit. Le relevé de l'audit
 * (ses familles) commence sous body, comme le script v1 (R1) : le fond de la page n'y est pas, ni une couleur vue
 * seulement au survol, au focus ou à l'appui. Les usages les portent ; le contenu (images, pictogrammes) reste à part.
 * Un audit sans usages : son relevé.
 * @param {any} audit  audit.json
 * @returns {{ interface: Valeur[], contenu: number }}
 */
function couleursDe(audit) {
  const usages = audit.rendered?.usages?.colors;
  if (!usages) return valeursDe(audit.rendered?.families ?? {}, ['colors']);
  /** @type {Valeur[]} */
  const vues = [];
  let contenu = 0;
  for (const [valeur, parUsage] of Object.entries(usages)) {
    const fois = Object.values(/** @type {Record<string, any>} */ (parUsage)).reduce((n, u) => n + u.count - (u.content ?? 0), 0);
    if (fois > 0) vues.push({ valeur, fois });
    else contenu++;
  }
  return { interface: vues.sort((a, b) => b.fois - a.fois || (a.valeur < b.valeur ? -1 : 1)), contenu };
}

/** La valeur en px d'une longueur, ou null. @param {string} v */
const px = (v) => (/^-?[\d.]+px$/.test(v) ? Number.parseFloat(v) : null);

/** « de 11 à 32 px » : l'étendue des valeurs en px, ou null. @param {Valeur[]} l */
function etendue(l) {
  const n = l.map((x) => px(x.valeur)).filter((x) => x !== null);
  if (n.length < 2) return null;
  const f = (/** @type {number} */ x) => fr(x, { decimales: 2 });
  return `de ${f(Math.min(...n))} à ${f(Math.max(...n))} px`;
}

/**
 * Les quatre familles de valeurs, chacune avec sa note : pour les couleurs, les presque identiques comptées comme le
 * rapport (`couleursProches`), sinon les gris ; pour les tailles, les valeurs à virgule ; pour les espacements, celles
 * hors d'une grille de 4 px ; pour les arrondis, les façons d'écrire un rond ; sinon l'étendue.
 * @param {any} audit  audit.json
 * @returns {{ total: number, familles: Famille[] }}
 */
export function valeurs(audit) {
  const rendu = audit.rendered?.families ?? {};

  const c = couleursDe(audit);
  const couleurs = c.interface.filter((x) => /^#[0-9a-f]{6}$/.test(x.valeur));
  const gris = couleurs.filter((x) => isGrey(x.valeur));
  const proches = couleursProches(rendu.colors ?? {}).length;
  const noteCouleurs = proches ? `dont ${proches} presque identiques à une autre` : gris.length ? `dont ${nombre(gris.length, 'gris', 'gris')}` : null;

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
      note: noteCouleurs,
      valeurs: [...gris.map((x) => ({ ...x, gris: true })), ...couleurs.filter((x) => !isGrey(x.valeur))],
    },
    {
      cle: 'fontSizes',
      titre: 'Tailles de texte',
      compte: tailles.length,
      note: virgules.length ? `dont ${virgules.length} à virgule, en bleu` : etendue(tailles),
      valeurs: tailles.map((x) => ({ ...x, hors: !Number.isInteger(px(x.valeur)) })),
    },
    {
      cle: 'spacing',
      titre: 'Espacements',
      compte: ecarts.length,
      note: horsGrille.length ? `dont ${horsGrille.length} hors d’une grille de 4 px, en bleu` : etendue(ecarts),
      valeurs: ecarts.map((x) => ({ ...x, hors: /** @type {number} */ (px(x.valeur)) % 4 !== 0 })),
    },
    {
      cle: 'radii',
      titre: 'Arrondis',
      compte: rayons.length,
      note:
        ronds.length > 1
          ? `${enLettres(ronds.length).toLowerCase()} façons d’écrire un rond : ${liste(ronds.map((x) => (px(x.valeur) !== null ? fr(/** @type {number} */ (px(x.valeur)), { decimales: 2 }) : x.valeur.replace('%', ' %'))))}`
          : etendue(rayons),
      valeurs: rayons,
    },
  ];
  return { total: familles.reduce((n, f) => n + f.compte, 0), familles };
}

/** Le nom d'un type au début d'une ligne. @param {string} n */
const majuscule = (n) => n.charAt(0).toUpperCase() + n.slice(1);

/**
 * Les composants : une ligne par type qui a des versions, sa note (versions pour emplois, puis ceux sans aucun style,
 * sinon ses hauteurs), et ce qui reste à regarder.
 * @param {any} constat  constat.json
 */
function composants(constat) {
  const ch = constat.chiffres ?? {};
  /** @type {Type[]} */
  const types = (constat.types ?? [])
    .filter((/** @type {any} */ t) => (t.versions ?? []).length)
    .map((/** @type {any} */ t) => {
      const versions = t.versions.map((/** @type {any} */ v) => ({ nom: String(v.nomCode ?? v.nom), fois: v.fois, capture: v.capture ?? null, ...(v.imageTombee ? { imageTombee: String(v.imageTombee) } : {}), sansStyle: v.origineCle === 'nu' }));
      const hauteurs = [...new Set(t.versions.flatMap((/** @type {any} */ v) => (v.apparences ?? []).map((/** @type {any} */ a) => Math.round(a.mesures?.hauteur ?? 0))).filter(Boolean))].sort((a, b) => a - b);
      const nus = versions.filter((/** @type {{ sansStyle: boolean }} */ v) => v.sansStyle).reduce((n, /** @type {{ fois: number }} */ v) => n + v.fois, 0);
      const suite = nus
        ? `, dont ${nus} sans aucun style`
        : hauteurs.length > 1
          ? ` ; ${enLettres(hauteurs.length).toLowerCase()} hauteurs : ${liste(hauteurs.map(String))} px`
          : '';
      return { nom: majuscule(String(t.nom)), versions, fois: t.fois, hauteurs, note: `${nombre(versions.length, 'version', 'versions')} pour ${nombre(t.fois, 'emploi', 'emplois')}${suite}` };
    });
  const zone = constat.scores?.accessibilite?.echecs?.zone ?? 0;
  return {
    types,
    aussi: [
      ...(ch.nonIdentifies ? [`${nombre(ch.nonIdentifies, 'bloc répété', 'blocs répétés')} que l’outil ne sait pas nommer, à trier plus tard.`] : []),
      ...(zone ? [`${zone} ${zone > 1 ? 'éléments' : 'élément'} sur ${ch.elements ?? 0} ${zone > 1 ? 'ont' : 'a'} une zone de clic de moins de 24 px.`] : []),
    ],
  };
}

/**
 * La dette d'un site.
 * @param {{ constat: any, audit: any | null }} o
 * @returns {Dette}
 */
export function detteDe({ constat, audit }) {
  return { valeurs: audit ? valeurs(audit) : null, composants: composants(constat) };
}
