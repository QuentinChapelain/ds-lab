// Membres fictifs de l'annuaire, lus par les stories des modules et par leur test de rendu : dix personnes inventées,
// des portraits dessinés (trois dessins, sans personne réelle), une photo en échec, des villes et des secteurs génériques,
// des liens en ancre seulement. Chaque cas que le module doit tenir a son membre : sans photo, photo en échec, nom long,
// nom d'un mot, sans promo, sans DsTag, huit DsTag, un DsTag long, des DsTag de marque.
import { ECHEC, PORTRAIT } from './commun.js';

/** @param {string} fond @param {string} visage @param {string} vetement @param {string} cheveux */
const portrait = (fond, visage, vetement, cheveux) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${fond}"/><circle cx="60" cy="50" r="22" fill="${visage}"/><path d="M18 120 Q22 82 60 80 Q98 82 102 120z" fill="${vetement}"/><path d="M36 52 Q34 24 60 24 Q86 24 84 52 Q80 34 60 34 Q40 34 36 52z" fill="${cheveux}"/></svg>`,
  )}`;
/** Deux autres portraits d'essai, dessinés comme le premier. */
const PORTRAIT_B = portrait('#c9b28f', '#e8c3a0', '#6b4f7a', '#2f2a26');
const PORTRAIT_C = portrait('#9fb39a', '#c99a77', '#8a3b3b', '#1f1b18');

/** Texte d'un DsTag trop long pour sa place : coupé par « … ». */
export const LONGUE = 'Ingénierie des systèmes embarqués et temps réel';

/** @param {string} nom */
const ancre = (nom) =>
  `#membre-${nom
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
/** @param {string} text @param {'neutral' | 'brand'} [tone] */
const tag = (text, tone = 'neutral') => ({ text, tone });

/**
 * Les dix membres, chacun avec le cas qu'il porte (cas), nommé pour les planches et le test de rendu.
 * @type {{ cas: string, name: string, href: string, image?: string, cohort?: string, tags: { text: string, tone: 'neutral' | 'brand' }[] }[]}
 */
export const MEMBRES = [
  { cas: 'photo', name: 'Camille Ferrand', image: PORTRAIT, cohort: 'Promo 2015', tags: [tag('Lyon'), tag('Finance'), tag('Mentor', 'brand')] },
  { cas: 'photo-deux', name: 'Jean-Baptiste Morel', image: PORTRAIT_B, cohort: 'Promo 2012', tags: [tag('Bordeaux'), tag('Conseil')] },
  { cas: 'sans-photo', name: "Inès d'Aubrac", cohort: 'Promo 2018', tags: [tag('Nantes'), tag('Santé'), tag('Bénévole', 'brand'), tag('Industrie')] },
  { cas: 'photo-trois', name: 'Hugo de Lassalle', image: PORTRAIT_C, cohort: 'Promo 2009', tags: [tag('Rennes'), tag('Industrie')] },
  { cas: 'photo-en-echec', name: 'Émile Brun', image: ECHEC, cohort: 'Promo 2021', tags: [tag('Lyon'), tag('Santé')] },
  { cas: 'sans-tag', name: 'Noé', cohort: 'Promo 2017', tags: [] },
  { cas: 'sans-promo', name: 'Marie-Lou', image: PORTRAIT, tags: [tag('Nantes'), tag('Finance'), tag('Mentor', 'brand')] },
  { cas: 'nom-long', name: "Marie-Amélie de Lassalle-Vernadet d'Aubrac", image: PORTRAIT_B, cohort: 'Promo 2014', tags: [tag('Bordeaux'), tag('Conseil')] },
  {
    cas: 'huit-tags',
    name: 'Ana María Ruiz Soler',
    cohort: 'Promo 2019',
    tags: ['Lyon', 'Finance', 'Bordeaux', 'Santé', 'Conseil', 'Nantes', 'Industrie', 'Rennes'].map((t) => tag(t)),
  },
  { cas: 'tag-long', name: 'Lucas Perrin', image: PORTRAIT_C, cohort: 'Promo 2016', tags: [tag(LONGUE), tag('Rennes')] },
].map((m) => ({ ...m, href: ancre(m.name) }));

/** Props d'un membre, sans son cas. @param {(typeof MEMBRES)[number]} m */
export const props = ({ cas: _cas, ...p }) => p;
