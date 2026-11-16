// @ts-check
/**
 * Contrôle d'encre de la police des titres, sur deux lignes.
 * Ce qui se voit sur deux lignes, c'est l'encre des capitales accentuées de la ligne 2 contre les descendantes de la
 * ligne 1. Mesure dans Chromium, sur le tracé réellement dessiné (D32) : chaque caractère du jeu (lettres, chiffres et
 * signes français) est dessiné à 1 000 px sur un canvas, ligne de base connue, et le plus haut et le plus bas de
 * l'encre sont lus dans ses pixels, comme la hauteur du H. Les bornes que rend measureText ne servent pas : sous
 * Linux, elles sont arrondies vers l'extérieur sur une grille de la taille. Une encre qui touche le bord du cadre de
 * mesure est une panne, pas une mesure. Le facteur de taille que donne la consigne (font-size-adjust: cap-height) se
 * calcule depuis le fichier, consigne × unités par em ÷ hauteur de capitale d'OS/2, sans navigateur (D32).
 * Puis, pour chaque style de titre en large et en étroit : taille utilisée, hauteur de capitale obtenue, encre de deux
 * lignes (pire capitale sur pire descendante) et écart avec la hauteur de ligne. Refus si l'écart est nul ou négatif.
 */
import { SIGNES } from './garde-fous.js';
import { lirePolice } from './lecture.js';

/** Caractères mesurés : lettres et chiffres ASCII, et les signes français exigés. */
export const JEU = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' + SIGNES;
const FAMILLE = 'ds-lab-encre';
/** Taille de mesure, en px : une ligne de pixels vaut 0,001 em. */
const TAILLE = 1000;

/**
 * D18 : fichier de police que le navigateur refuse de charger. C'est un refus (le client
 * doit changer son fichier) ; toute autre erreur de mesure est une panne.
 */
export class PoliceRefusee extends Error {}

/**
 * @typedef {{ haut: number, hautCar: string, bas: number, basCar: string, capitale: number, facteur: number }} MesureEncre
 *   en em de la taille demandée, sauf facteur (taille utilisée ÷ taille demandée)
 * @typedef {{ style: string, largeur: 'large' | 'étroit', taille: number, ligne: number, graisse: number, consigne: number }} StyleTitre
 * @typedef {StyleTitre & { utilisee: number, capitale: number, visee: number, encre: number, ecart: number, touche: boolean,
 *   hautCar: string, basCar: string, depassement: number | null }} LigneEncre
 */

/**
 * Mesure dans Chromium, une fois par graisse.
 * @param {{ octets: Buffer, graisses: { min: number, max: number } }[]} fichiers fichiers d'une même famille
 * @param {number[]} graisses graisses des styles de titre
 * @param {number} consigne rapport de hauteur de capitale (font-size-adjust: cap-height)
 * @param {{ cadre?: number }} [options] cadre : hauteur du cadre de mesure de part et d'autre de la ligne de base, en em
 * @returns {Promise<Record<number, MesureEncre>>}
 */
export async function mesurerEncre(fichiers, graisses, consigne, { cadre = 1.5 } = {}) {
  const premiere = lirePolice(fichiers[0].octets);
  if (!premiere.lisible || !premiere.capitale) throw new Error('hauteur de capitale absente du fichier : facteur de taille incalculable');
  const facteur = (consigne * premiere.unitesParEm) / premiere.capitale;
  const { chromium } = await import('playwright-core');
  /** @type {import('playwright-core').Browser} */
  let navigateur;
  try {
    navigateur = await chromium.launch();
  } catch (e) {
    throw new Error(`Chromium ne se lance pas (${/** @type {Error} */ (e).message.split('\n')[0]})`);
  }
  try {
    const page = await navigateur.newPage();
    await page.setContent('<!doctype html><body></body>');
    const donnees = fichiers.map((f) => ({ b64: f.octets.toString('base64'), poids: f.graisses.min === f.graisses.max ? String(f.graisses.min) : `${f.graisses.min} ${f.graisses.max}` }));
    const r = await page.evaluate(
      async ({ donnees, graisses, facteur, cadre, TAILLE, JEU, FAMILLE }) => {
        for (const { b64, poids } of donnees) {
          const face = new FontFace(FAMILLE, Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), { weight: poids });
          try {
            await face.load();
          } catch (e) {
            return { refusee: String(/** @type {any} */ (e)?.message ?? e), mesures: null };
          }
          document.fonts.add(face);
        }
        /** @type {Record<number, any>} */
        const out = {};
        const haute = Math.round(cadre * TAILLE);
        // Marge autour des bornes horizontales du caractère : une encre qui la dépasse touche le bord, c'est une panne.
        const marge = Math.round(TAILLE / 20);
        const cv = document.createElement('canvas');
        const ctx = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d', { willReadFrequently: true }));
        const H = 2 * haute;
        /** @type {number} */
        let L = 0;
        // Les bornes horizontales de measureText ne servent qu'à placer le caractère dans le cadre ; la mesure est verticale.
        const largeur = (/** @type {TextMetrics} */ m) => Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + 2 * marge;
        /** Cadre d'une graisse : le plus large caractère du jeu. @param {string} police */
        const cadrer = (police) => {
          ctx.font = police;
          L = Math.max(...[...JEU, 'H'].map((ch) => largeur(ctx.measureText(ch))));
          cv.width = L;
          cv.height = H;
          ctx.font = police;
          ctx.textBaseline = 'alphabetic';
        };
        /** Encre d'un caractère, lue dans ses pixels, en px au-dessus et au-dessous de la ligne de base. @param {number} g @param {string} ch */
        const encre = (g, ch) => {
          // Seule la largeur du caractère est lue : la copie des pixels fait l'essentiel du coût.
          const m = ctx.measureText(ch);
          const l = Math.min(L, largeur(m));
          ctx.clearRect(0, 0, L, H);
          ctx.fillText(ch, marge + m.actualBoundingBoxLeft, haute);
          // Un pixel sur 32 bits : non nul dès qu'il porte de l'encre (fond transparent, encre noire).
          const px = new Uint32Array(ctx.getImageData(0, 0, l, H).data.buffer);
          const ligneEncree = (/** @type {number} */ y) => {
            for (let i = y * l, fin = i + l; i < fin; i++) if (px[i] !== 0) return true;
            return false;
          };
          let haut = 0;
          while (haut < H && !ligneEncree(haut)) haut++;
          if (haut === H) return null;
          let bas = H - 1;
          while (!ligneEncree(bas)) bas--;
          let bord = haut === 0 || bas === H - 1;
          for (let y = haut; y <= bas && !bord; y++) bord = px[y * l] !== 0 || px[y * l + l - 1] !== 0;
          if (bord) throw new Error(`encre au bord du cadre de mesure : ${ch} en ${g}`);
          return { haut: haute - haut, bas: bas + 1 - haute };
        };
        for (const g of graisses) {
          cadrer(`${g} ${TAILLE}px "${FAMILLE}"`);
          let haut = 0, hautCar = '', bas = 0, basCar = '';
          for (const ch of JEU) {
            const e = encre(g, ch);
            if (!e) continue;
            if (e.haut > haut) [haut, hautCar] = [e.haut, ch];
            if (e.bas > bas) [bas, basCar] = [e.bas, ch];
          }
          const capitale = encre(g, 'H')?.haut ?? 0;
          out[g] = { haut: haut / TAILLE, hautCar, bas: bas / TAILLE, basCar, capitale: capitale / TAILLE, facteur };
        }
        return { refusee: null, mesures: out };
      },
      { donnees, graisses, facteur, cadre, TAILLE, JEU, FAMILLE },
    );
    if (r.refusee !== null) throw new PoliceRefusee(`le navigateur refuse de charger le fichier (${r.refusee})`);
    return /** @type {Record<number, MesureEncre>} */ (r.mesures);
  } finally {
    await navigateur.close();
  }
}

/**
 * Encre de deux lignes, style par style.
 * @param {Record<number, MesureEncre>} mesures
 * @param {StyleTitre[]} styles
 * @param {{ ascendante: number, descendante: number, unitesParEm: number } | null} [metriques] hhea, pour le dépassement montré
 * @returns {LigneEncre[]}
 */
export function lignesEncre(mesures, styles, metriques = null) {
  return styles.map((s) => {
    const m = mesures[s.graisse];
    if (!m) throw new Error(`graisse ${s.graisse} non mesurée`);
    const utilisee = s.taille * m.facteur;
    const encre = (m.haut + m.bas) * utilisee;
    const ecart = s.ligne - encre;
    const depassement = metriques ? ((metriques.ascendante - metriques.descendante) / metriques.unitesParEm) * utilisee - s.ligne : null;
    return { ...s, utilisee, capitale: m.capitale * utilisee, visee: s.consigne * s.taille, encre, ecart, touche: ecart <= 0, hautCar: m.hautCar, basCar: m.basCar, depassement };
  });
}

/** Nombre à la française, une décimale. @param {number} n */
const fr1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',').replace(/^-0,0$/, '0,0');

/** Motifs de refus : un par style et largeur où l'encre de deux lignes se touche. @param {LigneEncre[]} lignes */
export const motifsEncre = (lignes) =>
  lignes
    .filter((l) => l.touche)
    .map((l) => `encre de deux lignes qui se touche : ${l.style} en ${l.largeur} (ligne ${fr1(l.ligne)} px, encre ${fr1(l.encre)} px, ${l.hautCar} sur ${l.basCar})`);

/** Table lisible, une ligne par style et largeur. @param {LigneEncre[]} lignes @returns {string[]} */
export function tableEncre(lignes) {
  return lignes.map((l) =>
    [
      `${l.style.padEnd(16)}${l.largeur.padEnd(7)}`,
      `taille ${fr1(l.taille)} → utilisée ${fr1(l.utilisee)} px`,
      `capitale ${fr1(l.capitale)} px (visée ${fr1(l.visee)})`,
      `ligne ${fr1(l.ligne)} px`,
      `encre ${fr1(l.encre)} px (${l.hautCar} sur ${l.basCar})`,
      `écart ${fr1(l.ecart)} px`,
      ...(l.depassement === null ? [] : [`ascendante + descendante ${l.depassement > 0 ? 'dépassent' : 'tiennent'} la ligne de ${fr1(Math.abs(l.depassement))} px`]),
    ].join('  '),
  );
}
