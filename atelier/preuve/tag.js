// Preuve de l'étiquette (D55). Sur chaque thème de chaque marque, sur la planche de l'étiquette rendue par Storybook :
// chaque ton a la hauteur, la marge, la pilule, le fond, le texte et le style des jetons, sans ombre, transition, curseur
// de lien, tabindex ni rôle ; survolée (forcée par le protocole DevTools), elle ne change pas ; la rangée passe à la
// ligne avec l'écart des étiquettes, en ligne comme entre deux lignes ; le texte long est coupé par « … » à la largeur du
// parent, entier dans la page ; le rendu est le même en développement et en version construite. Les planches de la
// version construite (planche et ligne en situation) sont enregistrées par thème dans local/avatar-tag-captures/,
// hors dépôt. Sur le premier thème : arbre d'accessibilité de la ligne en situation, tabulation qui ne s'arrête sur
// aucune étiquette, un clic sans ondulation ni effet, refus d'un usage hors du menu.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { css, ecart, forcer, ouvrir, refus } from './commun.js';
import { CAPTURES } from './avatar.js';

const STORY = 'composants-dstag';
const LONGUE = 'Ingénierie des systèmes embarqués et temps réel';
/** États de la planche → ton. */
const ETATS = { neutre: 'neutre', marque: 'marque', 'neutre-survol': 'neutre', 'marque-survol': 'marque' };
/** Couleur du thème de chaque ton. */
const COULEUR = { neutre: 'composant', marque: 'marque-discret' };

/** @param {number} n */
const px = (n) => `${Math.round(n * 10000) / 10000}px`;

/**
 * Mesures attendues de la planche, au format de getComputedStyle.
 * @param {{ couleurs: Record<string, string>, variables: Record<string, string>, policeTexte: string[] }} t
 */
function attenduPlanche(t) {
  const v = t.variables;
  /** @type {Map<string, Record<string, any>>} */
  const out = new Map();
  for (const [etat, ton] of Object.entries(ETATS)) {
    const c = COULEUR[/** @type {keyof typeof COULEUR} */ (ton)];
    out.set(etat, {
      hauteur: v['ds-hauteur-etiquette'],
      marges: `${v['ds-marge-interieure-etiquette']} ${v['ds-marge-interieure-etiquette']}`,
      rayon: v['ds-arrondi-pilule'],
      fond: css(t.couleurs[c]),
      couleur: css(t.couleurs[`on-${c}`]),
      police: t.policeTexte.join('|'),
      taille: v['ds-corps-petit-taille'],
      graisse: v['ds-corps-petit-graisse'],
      interligne: px(parseFloat(v['ds-corps-petit-taille']) * Number(v['ds-corps-petit-interligne'])),
      ombre: 'none',
      transition: '0s',
      curseur: 'auto',
      statique: 'ni tabindex, ni rôle, ni voile, sous-couche masquée',
    });
  }
  const e = v['ds-ecart-entre-etiquettes'];
  out.set('rangee', { ecartEnLigne: e, ecartEntreLignes: e, lignes: 'au moins 2' });
  out.set('longue', { largeur: 'au plus celle du parent', coupe: 'ellipsis', texte: LONGUE });
  return out;
}

/**
 * Relevé de la planche de l'étiquette dans l'aperçu, thème passé par son nom.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string} theme
 */
async function releve(contexte, base, theme) {
  const { page, erreurs } = await ouvrir(contexte, base, `${STORY}--planche`, theme);
  await page.locator('.ds-tag').first().waitFor({ timeout: 30_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await forcer(page, { '.ds-tag[data-etat$="-survol"]': ['hover'] });
  const mesures = await page.evaluate(() => {
    const noms = (/** @type {string} */ s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1')).join('|');
    const px = (/** @type {number} */ n) => `${Math.round(n * 1000) / 1000}px`;
    /** @type {Record<string, any>} */
    const out = {};
    for (const e of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.ds-tag[data-etat]'))) {
      const s = getComputedStyle(e);
      // Sous-couche et voile de Vuetify, désignés par leur place : tout enfant de la racine qui ne porte pas le texte.
      const autres = [...e.children].filter((x) => !x.querySelector('.ds-tag__text') && getComputedStyle(x).display !== 'none');
      const statique = !e.hasAttribute('tabindex') && !e.hasAttribute('role') && autres.length === 0;
      out[/** @type {string} */ (e.dataset.etat)] = {
        hauteur: s.height,
        marges: `${s.paddingLeft} ${s.paddingRight}`,
        rayon: s.borderTopLeftRadius,
        fond: s.backgroundColor,
        couleur: s.color,
        police: noms(s.fontFamily),
        taille: s.fontSize,
        graisse: s.fontWeight,
        interligne: s.lineHeight,
        ombre: s.boxShadow,
        transition: s.transitionDuration,
        curseur: s.cursor,
        statique: statique ? 'ni tabindex, ni rôle, ni voile, sous-couche masquée' : `tabindex ${e.getAttribute('tabindex')}, rôle ${e.getAttribute('role')}`,
      };
    }
    // Rangée : les étiquettes, rangées en lignes par leur bord haut ; écarts en ligne et entre deux lignes.
    const boites = [...document.querySelectorAll('[data-cas="rangee"] .ds-tag')].map((x) => x.getBoundingClientRect());
    /** @type {DOMRect[][]} */
    const lignes = [];
    for (const b of boites) {
      const l = lignes.find((x) => Math.abs(x[0].top - b.top) < 0.5);
      if (l) l.push(b);
      else lignes.push([b]);
    }
    const enLigne = [...new Set(lignes.flatMap((l) => l.slice(1).map((b, i) => px(b.left - l[i].right))))];
    const entre = [...new Set(lignes.slice(1).map((l, i) => px(l[0].top - lignes[i][0].bottom)))];
    out.rangee = { ecartEnLigne: enLigne.join(' '), ecartEntreLignes: entre.join(' '), lignes: lignes.length >= 2 ? 'au moins 2' : `${lignes.length}` };
    const boite = /** @type {HTMLElement} */ (document.querySelector('[data-cas="longue"]'));
    const longue = /** @type {HTMLElement} */ (boite.querySelector('.ds-tag'));
    const texte = /** @type {HTMLElement} */ (longue.querySelector('.ds-tag__text'));
    out.longue = {
      largeur: longue.getBoundingClientRect().width <= boite.getBoundingClientRect().width ? 'au plus celle du parent' : `${longue.getBoundingClientRect().width}px`,
      coupe: texte.scrollWidth > texte.clientWidth ? getComputedStyle(texte).textOverflow : 'non coupé',
      texte: texte.textContent,
    };
    return out;
  });
  const image = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await page.close();
  return { mesures, image, erreurs };
}

/** Capture de la ligne en situation, sur la page et sur une surface. @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string} theme */
async function situation(contexte, base, theme) {
  const { page, erreurs } = await ouvrir(contexte, base, `${STORY}--en-situation`, theme);
  await page.locator('.ds-tag').first().waitFor({ timeout: 30_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  const image = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await page.close();
  return { image, erreurs };
}

/** Arbre d'accessibilité attendu de la ligne en situation : l'avatar décoratif se tait, chaque étiquette se lit en entier. */
const ARBRE = `- paragraph: Camille Ferrand
- paragraph: Promo 2015
- list:
  - listitem: Lyon
  - listitem: Finance
  - listitem: Mentor
  - listitem: ${LONGUE}`;
/** Erreurs attendues des stories de refus. */
const REFUS = {
  'refus-sans-texte': 'DsTag : text : obligatoire',
  'refus-ton': 'DsTag : tone : valeur inconnue : accent (neutral, brand)',
  'refus-fermeture': 'DsTag : attribut refusé : closable',
  'refus-lien': 'DsTag : attribut refusé : href',
};

/**
 * Lecteur d'écran, clavier et clic, sur un thème. Rend des [ok, ligne].
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {{ nom: string }} t
 */
async function accessibilite(contexte, base, t) {
  /** @type {[boolean, string][]} */
  const out = [];
  const { page, erreurs } = await ouvrir(contexte, base, `${STORY}--en-situation`, t.nom);
  await page.locator('.ds-tag').first().waitFor();
  const arbre = await page.locator('[data-cas="situation"]').first().ariaSnapshot();
  out.push([arbre === ARBRE, `${t.nom}, arbre d'accessibilité de la ligne en situation : ${arbre.replace(/\n/g, ' / ')}`]);

  const cas = () => page.evaluate(() => /** @type {HTMLElement | null} */ (document.activeElement?.closest('[data-cas]'))?.dataset.cas ?? document.activeElement?.tagName ?? null);
  /** @type {(string | null)[]} */
  const ordre = [];
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('Tab');
    ordre.push(await cas());
  }
  const focalisables = await page.locator('[data-cas="situation"] :is(a[href], button, input, [tabindex])').count();
  out.push([JSON.stringify(ordre) === JSON.stringify(['avant', 'apres']) && focalisables === 0, `${t.nom}, tabulation autour de la ligne en situation : ${ordre.join(' → ')}, ${focalisables} élément(s) focalisable(s) dans la ligne`]);

  // Un clic sur une étiquette : aucun élément ajouté (ni ondulation ni voile), aucun lien suivi.
  const etiquette = page.locator('[data-cas="situation"] .ds-tag').first();
  const avant = await etiquette.evaluate((e) => e.querySelectorAll('*').length);
  await etiquette.hover();
  await page.mouse.down();
  const pendant = await etiquette.evaluate((e) => e.querySelectorAll('*').length);
  await page.mouse.up();
  const ancre = await page.evaluate(() => location.hash);
  out.push([pendant === avant && ancre === '', `${t.nom}, clic sur une étiquette : ${avant} éléments avant, ${pendant} pendant l'appui, ${ancre || 'aucun lien suivi'}`]);
  out.push([erreurs.length === 0, `${t.nom}, story En situation : ${erreurs.length} erreur(s)${erreurs.length ? ` (${erreurs.join(' ; ')})` : ''}`]);
  await page.close();

  for (const [story, message] of Object.entries(REFUS)) out.push(await refus(contexte, base, `${STORY}--${story}`, t.nom, message, '.ds-tag', 'étiquette'));
  return out;
}

/**
 * Écarts entre le relevé et l'attendu.
 * @param {Map<string, Record<string, any>>} attendu @param {Record<string, any>} vu
 */
function ecarts(attendu, vu) {
  return [...attendu].flatMap(([k, a]) => {
    const m = vu[k];
    if (!m) return [`${k} absent`];
    return Object.entries(a).flatMap(([c, x]) => (JSON.stringify(m[c]) === JSON.stringify(x) ? [] : [`${k} ${c} ${JSON.stringify(m[c])} (attendu ${JSON.stringify(x)})`]));
  });
}

/**
 * Preuve de l'étiquette, sur tous les thèmes puis, par version (développement, construite), sur le premier.
 * @param {{ themes: any[], contexte: import('playwright-core').BrowserContext, developpement: { base: string },
 *   construite: { base: string }, verifier: (ok: boolean, ligne: string) => void }} p
 */
export async function preuveEtiquette({ themes, contexte, developpement, construite, verifier }) {
  for (const t of themes) {
    const attendu = attenduPlanche(t);
    const dev = await releve(contexte, developpement.base, t.nom);
    const bld = await releve(contexte, construite.base, t.nom);
    for (const [mode, r] of /** @type {const} */ ([['développement', dev], ['construite', bld]])) {
      const e = ecarts(attendu, r.mesures);
      verifier(e.length === 0 && r.erreurs.length === 0, `${t.nom}, ${mode}, planche de l'étiquette : ${e.length ? `${e.length} écart(s) : ${e.slice(0, 4).join(' ; ')}` : 'deux tons, au repos et survolés, rangée et texte long égaux aux jetons'}${r.erreurs.length ? `, ${r.erreurs.join(' ; ')}` : ''}`);
    }
    mkdirSync(CAPTURES, { recursive: true });
    writeFileSync(join(CAPTURES, `etiquette-${t.nom}.png`), bld.image);
    const d = ecart(dev.image, bld.image);
    verifier(d === 0, `${t.nom}, étiquette : développement et construite, ${d} pixel(s) différent(s)`);
    const s = await situation(contexte, construite.base, t.nom);
    writeFileSync(join(CAPTURES, `situation-${t.nom}.png`), s.image);
    verifier(s.erreurs.length === 0, `${t.nom}, ligne en situation : ${s.erreurs.length} erreur(s)${s.erreurs.length ? ` (${s.erreurs.join(' ; ')})` : ''}`);
  }
  for (const [mode, base] of [['développement', developpement.base], ['construite', construite.base]])
    for (const [ok, ligne] of await accessibilite(contexte, base, themes[0])) verifier(ok, `${mode}, ${ligne}`);
  return CAPTURES;
}
