// @ts-check
/**
 * Étape 4c, lot 3 : contrôle d'encre de la police des titres, sur deux lignes.
 * Ce qui se voit sur deux lignes, c'est l'encre des capitales accentuées de la ligne 2 contre les descendantes de la
 * ligne 1. Mesure dans Chromium (canvas, actualBoundingBox à 1 000 px, sur les lettres, chiffres et signes français) :
 * le plus haut et le plus bas de l'encre, la hauteur du H, et le facteur de taille que donne la consigne
 * (font-size-adjust: cap-height), lu comme un rapport de largeurs avec et sans consigne. Le canvas de Chromium borne
 * l'encre par les points de contrôle des courbes, pas par le contour exact : le contrôle est un peu prudent [F].
 * Puis, pour chaque style de titre en large et en étroit : taille utilisée, hauteur de capitale obtenue, encre de deux
 * lignes (pire capitale sur pire descendante) et écart avec la hauteur de ligne. Refus si l'écart est nul ou négatif.
 */
import { SIGNES } from './garde-fous.js';

/** Caractères mesurés : lettres et chiffres ASCII, et les signes français exigés. */
export const JEU = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' + SIGNES;
const FAMILLE = 'ds-lab-encre';

/**
 * Revue de code du 15/11, lot 1a (D18) : fichier de police que le navigateur refuse de charger. C'est un refus (le client
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
 * @returns {Promise<Record<number, MesureEncre>>}
 */
export async function mesurerEncre(fichiers, graisses, consigne) {
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
      async ({ donnees, graisses, consigne, JEU, FAMILLE }) => {
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
        for (const g of graisses) {
          const ctx = /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
          ctx.font = `${g} 1000px "${FAMILLE}"`;
          let haut = 0, hautCar = '', bas = 0, basCar = '';
          for (const ch of JEU) {
            const m = ctx.measureText(ch);
            if (m.actualBoundingBoxAscent > haut) [haut, hautCar] = [m.actualBoundingBoxAscent, ch];
            if (m.actualBoundingBoxDescent > bas) [bas, basCar] = [m.actualBoundingBoxDescent, ch];
          }
          const capitale = ctx.measureText('H').actualBoundingBoxAscent;
          const largeur = (/** @type {boolean} */ avec) => {
            const s = document.createElement('span');
            s.textContent = 'HHHHHHHHHH';
            s.style.cssText = `font: ${g} 100px "${FAMILLE}"; white-space: nowrap;${avec ? ` font-size-adjust: cap-height ${consigne};` : ''}`;
            document.body.append(s);
            const l = s.getBoundingClientRect().width;
            s.remove();
            return l;
          };
          out[g] = { haut: haut / 1000, hautCar, bas: bas / 1000, basCar, capitale: capitale / 1000, facteur: largeur(true) / largeur(false) };
        }
        return { refusee: null, mesures: out };
      },
      { donnees, graisses, consigne, JEU, FAMILLE },
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
