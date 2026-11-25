// @ts-check
/**
 * La marque d'un site, lue dans la mesure et montrée avant d'être confirmée (D80). Une règle, la même à chaque partie :
 *   la primaire est la couleur non grise qui colore le plus d'éléments cliquables (fonds de bouton, textes de lien) ;
 *   l'accent, la couleur non grise la plus employée, d'une autre teinte que la primaire ;
 *   la troisième, la suivante, d'une teinte encore différente : une marque garde deux couleurs ; elle ira sur l'échelle
 *   de la palette qui a sa teinte (le rouge, le vert), sinon aux gris (M8) ;
 *   la police des titres, la famille la plus portée par les titres.
 * À égalité, la valeur la plus petite dans l'ordre du code. L'aperçu passe par la saisie, sans rien écrire : les douze
 * pas, le bouton, l'aplat et le verdict sont ceux que la saisie écrira.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { converter } from 'culori';
import { isGrey } from '../brand/brand.js';
import { saisir } from '../tokens/saisie.js';
import { COMMUN } from '../tokens/resolver.js';

const toOklch = converter('oklch');

/** Écart de teinte au-delà duquel deux couleurs sont d'une autre teinte (le même que la réduction, J1 et M8). */
const AUTRE_TEINTE_DEG = 30;

/** @param {string} a @param {string} b */
const memeTeinte = (a, b) => {
  const d = Math.abs((toOklch(a)?.h ?? 0) - (toOklch(b)?.h ?? 0)) % 360;
  return Math.min(d, 360 - d) <= AUTRE_TEINTE_DEG;
};

/** Les échelles de la palette commune qu'une couleur du site peut rejoindre, chacune par son pas 9 (M8, `src/tokens/cible.js`). */
const PALETTE = (() => {
  const color = JSON.parse(readFileSync(join(COMMUN, 'primitives.tokens.json'), 'utf8')).color;
  return ['error', 'success'].map((nom) => ({ nom, hex: String(color[nom]['9'].$value.hex).toLowerCase() }));
})();

/**
 * L'échelle de la palette où ira une troisième couleur, celle qui a sa teinte ; null : elle ira aux gris (M8).
 * @param {string} hex
 */
export const echelleDeLaTroisieme = (hex) => PALETTE.find((p) => memeTeinte(hex, p.hex))?.nom ?? null;

/**
 * @typedef {{ hex: string, elements: number, cliquables: number }} Relevee  une couleur relevée sur les pages
 * @typedef {{ primary: string, accent: string | null, troisieme: string | null, police: string[] | null }} Choix
 * @typedef {{ choix: Choix, relevees: Relevee[], titres: number }} Lecture
 */

/**
 * Les couleurs non grises relevées sur les pages, avec leurs éléments, et la police des titres.
 * @param {any} audit  audit.json
 */
function relever(audit) {
  /** @type {Relevee[]} */
  const relevees = [];
  for (const [hex, usages] of Object.entries(audit.rendered?.usages?.colors ?? {})) {
    if (!/^#[0-9a-f]{6}$/.test(hex) || isGrey(hex)) continue;
    let elements = 0;
    let cliquables = 0;
    for (const [usage, u] of Object.entries(/** @type {Record<string, any>} */ (usages))) {
      elements += u.elements ?? 0;
      for (const k of Object.values(u.kinds ?? {})) {
        const role = /** @type {any} */ (k).first?.role;
        // Un fond de bouton ou de lien, un texte de lien : ce qui se clique porte la couleur.
        if ((usage === 'plein' || usage === 'fond') && (role === 'bouton' || role === 'lien')) cliquables += /** @type {any} */ (k).n ?? 0;
        if (usage === 'texte' && role === 'lien') cliquables += /** @type {any} */ (k).n ?? 0;
      }
    }
    if (elements) relevees.push({ hex, elements, cliquables });
  }
  relevees.sort((a, b) => b.elements - a.elements || (a.hex < b.hex ? -1 : 1));
  /** @type {Map<string, number>} */
  const familles = new Map();
  for (const [cle, v] of Object.entries(audit.rendered?.families?.fontFamilies?.values ?? {}))
    for (const c of /** @type {any} */ (v).contexts ?? []) if (c.role === 'titre') familles.set(cle, (familles.get(cle) ?? 0) + (c.count ?? 0));
  const [police, titres] = [...familles].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0] ?? [null, 0];
  return { relevees, police, titres };
}

/** « orbe sans, arial, sans-serif » → ["Orbe Sans", "Arial", "sans-serif"] : les noms propres en capitales. @param {string} p */
const familles = (p) =>
  p
    .split(',')
    .map((x) => x.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)
    .map((x) => (/^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+)$/.test(x) ? x : x.replace(/\b\p{L}/gu, (l) => l.toUpperCase())));

/**
 * La marque lue sur les pages, par la règle.
 * @param {any} audit
 * @returns {Lecture | null}  null si aucune couleur non grise n'est relevée
 */
export function lireMarque(audit) {
  const { relevees, police, titres } = relever(audit);
  if (!relevees.length) return null;
  const primaire = [...relevees].sort((a, b) => b.cliquables - a.cliquables || b.elements - a.elements || (a.hex < b.hex ? -1 : 1))[0];
  const accent = relevees.find((r) => !memeTeinte(r.hex, primaire.hex)) ?? null;
  const troisieme = accent ? (relevees.find((r) => !memeTeinte(r.hex, primaire.hex) && !memeTeinte(r.hex, accent.hex)) ?? null) : null;
  return {
    choix: { primary: primaire.hex, accent: accent?.hex ?? null, troisieme: troisieme?.hex ?? null, police: police ? familles(police) : null },
    relevees,
    titres,
  };
}

/** L'entrée de la marque, au format du contrat (docs/contrat-de-marque.md). @param {string} nom @param {Choix} c */
export const entreeDe = (nom, c) => ({
  name: nom,
  primary: c.primary,
  ...(c.accent ? { accent: c.accent } : {}),
  fonts: { heading: c.police ?? ['system-ui', 'sans-serif'] },
});

/**
 * @typedef {{ pas: string[], plein: { fond: string, texte: string, pas: number, blanc: boolean } }} Echelle
 * @typedef {{ primary: Echelle | null, accent: Echelle | null, motifs: { bloc: 'primary' | 'accent' | 'marque', texte: string }[] }} Apercu
 */

/**
 * Ce que l'outil fait de la marque : les douze pas, le plein et son texte, et le refus dit avec les mots de l'humain.
 * Rien n'est écrit.
 * @param {string} nom @param {Choix} c
 * @returns {Apercu}
 */
export function apercu(nom, c) {
  const s = saisir(entreeDe(nom, c), { dossier: process.cwd() });
  const couleurs = s.echelles?.color ?? {};
  /** @param {string} v */
  const hex = (v) => {
    const m = /^\{color\.([a-z]+)\.(\d+)\}$/.exec(v);
    if (m) return String(couleurs[m[1]]?.[m[2]]?.$value?.hex ?? '');
    return v === '{color.white}' ? '#ffffff' : '';
  };
  /** @param {'primary' | 'accent'} slot @returns {Echelle | null} */
  const echelle = (slot) => {
    const g = couleurs[slot];
    const b = s.marque?.brand?.[slot];
    if (!g?.['1'] || !b?.solid) return null;
    const fond = String(b.solid.$value);
    return {
      pas: Array.from({ length: 12 }, (_, i) => String(g[String(i + 1)].$value.hex)),
      plein: { fond: hex(fond), texte: hex(String(b['on-solid']?.$value ?? '')), pas: Number(/\.(\d+)\}$/.exec(fond)?.[1] ?? 9), blanc: b['on-solid']?.$value === '{color.white}' },
    };
  };
  /** @type {Apercu['motifs']} */
  const motifs = [];
  for (const m of s.motifs) {
    const bloc = /\bprimary\b/.test(m) ? 'primary' : /\baccent\b/.test(m) ? 'accent' : 'marque';
    const texte = /^checkValise/.test(m)
      ? 'Cette couleur ne donne pas douze nuances distinctes : ses tons clairs se confondent avec elle. Essaie une couleur plus foncée.'
      : /^contraste/.test(m)
        ? 'Un texte ne se lit pas assez sur cette couleur. Essaie une couleur plus foncée, ou plus claire.'
        : 'Cette marque ne passe pas encore : une de ses valeurs ne se lit pas.';
    if (!motifs.some((x) => x.bloc === bloc && x.texte === texte)) motifs.push({ bloc, texte });
  }
  return { primary: echelle('primary'), accent: c.accent ? echelle('accent') : null, motifs };
}
