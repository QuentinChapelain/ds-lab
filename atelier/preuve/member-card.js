// Preuve de MemberCard, module de l'annuaire. Sur chaque thème de chaque marque, sur la planche des dix membres fictifs
// rendue par Storybook : DsAvatar à gauche, aligné en haut, au côté du grand DsAvatar ; le nom en titre 4, la promo en
// sous-titre ou rien ; la suite de DsTag en liste, à l'écart entre blocs de la promo (sans promo, à l'écart dans le
// composant du nom), à l'écart des DsTag, sans marge propre, chaque DsTag au fond teinté de son
// ton ; aucune valeur en dur (écarts, marges et listes égaux aux variables du thème) ; un nom long passé à la ligne, un
// DsTag long coupé par « … », huit DsTag sur plusieurs lignes, rien qui déborde de sa colonne de 400 px ; le rendu est
// le même en développement et en version construite. La planche de la version construite est enregistrée par thème
// dans local/carte-membre-liste-captures/, hors dépôt. Sur le premier thème : un titre de niveau 3 par membre, qui
// porte un lien nommé par le nom seul ; DsAvatar absent de l'arbre ; la promo lue ; la suite lue comme une liste ; une
// halte de la touche Tab par membre ; un clic sur DsAvatar ou sur un DsTag qui suit le lien ; les refus.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL, css, ecart, ouvrir, refus } from './commun.js';

const STORY = 'modules-membercard';
/** Planches enregistrées, hors dépôt. */
export const CAPTURES = join(LOCAL, 'carte-membre-liste-captures');
/** Cas de la planche → [promo, nombre de DsTag, tons des DsTag]. Écrit à la main d'après atelier/stories/membres.js. */
const CAS = {
  photo: ['Promo 2015', ['neutral', 'neutral', 'brand']],
  'photo-deux': ['Promo 2012', ['neutral', 'neutral']],
  'sans-photo': ['Promo 2018', ['neutral', 'neutral', 'brand', 'neutral']],
  'photo-trois': ['Promo 2009', ['neutral', 'neutral']],
  'photo-en-echec': ['Promo 2021', ['neutral', 'neutral']],
  'sans-tag': ['Promo 2017', []],
  'sans-promo': [null, ['neutral', 'neutral', 'brand']],
  'nom-long': ['Promo 2014', ['neutral', 'neutral']],
  'huit-tags': ['Promo 2019', Array(8).fill('neutral')],
  'tag-long': ['Promo 2016', ['neutral', 'neutral']],
};
/** Membres de la story Clavier, dans l'ordre : nom, lien. */
const CLAVIER = [
  ['photo', 'Camille Ferrand', '#membre-camille-ferrand'],
  ['photo-deux', 'Jean-Baptiste Morel', '#membre-jean-baptiste-morel'],
  ['sans-photo', "Inès d'Aubrac", '#membre-ines-d-aubrac'],
];
/** Erreurs attendues des stories de refus. */
const REFUS = {
  'refus-sans-nom': 'MemberCard : name : obligatoire',
  'refus-nom-vide': 'MemberCard : name : obligatoire',
  'refus-sans-lettre': 'MemberCard : name : sans lettre',
  'refus-sans-lien': 'MemberCard : href : obligatoire',
  'refus-ton': 'MemberCard : tags : 2 : tone : valeur inconnue : accent (neutral, brand)',
  'refus-tag-sans-texte': 'MemberCard : tags : 1 : text : obligatoire',
  'refus-nom-a-la-main': 'MemberCard : attribut refusé : aria-label',
  'refus-ecouteur': 'MemberCard : attribut refusé : onClick',
  'refus-slot': 'MemberCard : slot refusé : default',
};

/** @param {number} n */
const px = (n) => `${Math.round(n * 1000) / 1000}px`;

/**
 * Mesures attendues de chaque membre de la planche, au format de getComputedStyle.
 * @param {{ couleurs: Record<string, string>, variables: Record<string, string>, policeTexte: string[] }} t
 */
function attenduMembres(t) {
  const v = t.variables;
  const fond = { neutral: css(t.couleurs.tint), brand: css(t.couleurs['brand-tint']) };
  /** @type {Map<string, Record<string, any>>} */
  const out = new Map();
  for (const [cas, [promo, tons]] of Object.entries(CAS)) {
    out.set(cas, {
      largeur: '400px',
      avatar: { cote: `${v['ds-avatar-size-large']} ${v['ds-avatar-size-large']}`, gauche: v['ds-padding-component'], haut: v['ds-padding-component'], ecartColonne: v['ds-gap-between-components'], cache: 'true' },
      titre: { balise: 'H3', taille: v['ds-heading-4-font-size'], graisse: v['ds-heading-4-font-weight'], police: t.policeTexte.join('|') },
      promo,
      suite: tons.length
        ? { role: 'list', puces: 'none', marge: '0px', retrait: '0px', avant: promo ? v['ds-gap-between-blocks'] : v['ds-gap-within-component'], ecart: `${v['ds-gap-between-tags']} ${v['ds-gap-between-tags']}`, fonds: tons.map((x) => fond[/** @type {'neutral' | 'brand'} */ (x)]) }
        : null,
      deborde: false,
    });
  }
  return out;
}

/**
 * Relevé de la planche dans l'aperçu, thème passé par son nom.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string} theme
 */
async function releve(contexte, base, theme) {
  const { page, erreurs } = await ouvrir(contexte, base, `${STORY}--planche`, theme);
  await page.locator('.ds-card').first().waitFor({ timeout: 30_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  const vus = await page.evaluate(() => {
    const noms = (/** @type {string} */ s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1')).join('|');
    const px = (/** @type {number} */ n) => `${Math.round(n * 1000) / 1000}px`;
    const r = (/** @type {Element} */ x) => x.getBoundingClientRect();
    /** @type {Record<string, any>} */
    const out = {};
    /** @type {Record<string, any>} */
    const formes = {};
    for (const e of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.ds-card[data-cas]'))) {
      const s = getComputedStyle(e);
      const bord = parseFloat(s.borderLeftWidth);
      const c = r(e);
      const av = /** @type {HTMLElement} */ (e.querySelector('.ds-card__prepend .ds-avatar'));
      const col = /** @type {HTMLElement} */ (e.querySelector('.ds-card__column'));
      const titre = /** @type {HTMLElement} */ (e.querySelector('.ds-card__title'));
      const ts = getComputedStyle(titre);
      const st = e.querySelector('.ds-card__subtitle');
      const ul = /** @type {HTMLElement | null} */ (e.querySelector('ul'));
      let suite = null;
      if (ul) {
        const us = getComputedStyle(ul);
        suite = { role: ul.getAttribute('role'), puces: us.listStyleType, marge: us.marginTop, retrait: us.paddingLeft, avant: px(r(ul).top - r(st ?? titre).bottom), ecart: `${us.rowGap} ${us.columnGap}`, fonds: [...ul.querySelectorAll('.ds-tag')].map((x) => getComputedStyle(x).backgroundColor) };
      }
      const a = r(av);
      // Rien ne déborde : chaque élément visible de la carte reste dans sa boîte, au demi-pixel près. La barre de
      // chargement de VCard, de hauteur nulle et animée hors de la carte, ne se voit pas : elle ne compte pas.
      const deborde = [...e.querySelectorAll('*')].some((x) => {
        const b = r(x);
        return b.width > 0 && b.height > 0 && (b.right > c.right + 0.5 || b.left < c.left - 0.5);
      });
      const cas = /** @type {string} */ (e.dataset.cas);
      out[cas] = {
        largeur: px(c.width),
        avatar: { cote: `${px(a.width)} ${px(a.height)}`, gauche: px(a.left - c.left - bord), haut: px(a.top - c.top - bord), ecartColonne: px(r(col).left - a.right), cache: av.getAttribute('aria-hidden') },
        titre: { balise: titre.tagName, taille: ts.fontSize, graisse: ts.fontWeight, police: noms(ts.fontFamily) },
        promo: st ? st.textContent : null,
        suite,
        deborde,
      };
      // Formes propres à certains cas : lignes du titre et de la suite, DsTag coupé.
      const lignes = (/** @type {Element[]} */ xs) => new Set(xs.map((x) => Math.round(r(x).top))).size;
      const texteLong = /** @type {HTMLElement | null} */ (e.querySelector('.ds-tag__text'));
      formes[cas] = {
        lignesTitre: Math.round(r(titre).height / parseFloat(ts.lineHeight)),
        lignesSuite: ul ? lignes([...ul.querySelectorAll('li')]) : 0,
        coupe: texteLong ? texteLong.scrollWidth > texteLong.clientWidth : false,
      };
    }
    return { out, formes };
  });
  const image = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await page.close();
  return { membres: vus.out, formes: vus.formes, image, erreurs };
}

/**
 * Écarts entre le relevé et l'attendu, membre par membre.
 * @param {Map<string, Record<string, any>>} attendu @param {Record<string, any>} vu
 */
function ecarts(attendu, vu) {
  return [...attendu].flatMap(([cas, a]) => {
    const m = vu[cas];
    if (!m) return [`${cas} absent`];
    return Object.entries(a).flatMap(([k, x]) => (JSON.stringify(m[k]) === JSON.stringify(x) ? [] : [`${cas} ${k} ${JSON.stringify(m[k])} (attendu ${JSON.stringify(x)})`]));
  });
}

/**
 * Formes attendues : nom long sur deux lignes au moins, les autres sur une ; huit DsTag sur deux lignes au moins ; le
 * DsTag long coupé.
 * @param {Record<string, any>} f
 */
function ecartsDeForme(f) {
  /** @type {string[]} */
  const e = [];
  for (const [cas, x] of Object.entries(f)) {
    if (cas === 'nom-long' ? x.lignesTitre < 2 : x.lignesTitre !== 1) e.push(`${cas} : titre sur ${x.lignesTitre} ligne(s)`);
  }
  if (!(f['huit-tags']?.lignesSuite >= 2)) e.push(`huit-tags : suite sur ${f['huit-tags']?.lignesSuite} ligne(s)`);
  if (!f['tag-long']?.coupe) e.push('tag-long : DsTag long non coupé');
  return e;
}

/**
 * Clavier, arbre d'accessibilité, clic et refus, sur un thème. Rend des [ok, ligne].
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {{ nom: string }} t
 */
async function clavier(contexte, base, t) {
  /** @type {[boolean, string][]} */
  const out = [];
  const { page, erreurs } = await ouvrir(contexte, base, `${STORY}--clavier`, t.nom);
  await page.locator('.ds-card').first().waitFor();
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));

  // Un titre de niveau 3 par membre, qui porte un lien nommé par le nom seul ; DsAvatar se tait ; promo et suite lues.
  for (const [cas, nom] of CLAVIER) {
    const carte = page.locator(`[data-cas="${cas}"]`);
    const titres = await carte.getByRole('heading', { level: 3 }).count();
    const lien = await carte.getByRole('heading', { level: 3 }).getByRole('link', { name: nom, exact: true }).count();
    const liens = await carte.getByRole('link').count();
    const images = await carte.getByRole('img').count();
    const arbre = await carte.ariaSnapshot();
    const liste = await carte.getByRole('list').count();
    const items = await carte.getByRole('list').getByRole('listitem').count();
    const ok = titres === 1 && lien === 1 && liens === 1 && images === 0 && liste === 1 && items >= 2 && /Promo \d{4}/.test(arbre);
    out.push([ok, `${t.nom}, arbre de ${cas} : titre 3 ${titres}, lien nommé « ${nom} » ${lien} sur ${liens}, image ${images}, liste ${liste} de ${items}, ${arbre.replace(/\n/g, ' / ')}`]);
  }

  // Une halte de Tab par membre, sur son lien, dans l'ordre ; puis le bouton d'après.
  await page.locator('[data-cas="avant"]').focus();
  /** @type {(string | null)[]} */
  const ordre = [];
  for (let i = 0; i <= CLAVIER.length; i++) {
    await page.keyboard.press('Tab');
    ordre.push(await page.evaluate(() => (document.activeElement?.matches('a') ? document.activeElement.getAttribute('href') : /** @type {HTMLElement | null} */ (document.activeElement?.closest('[data-cas]'))?.dataset.cas ?? null)));
  }
  const attendu = [...CLAVIER.map(([, , href]) => href), 'apres'];
  out.push([JSON.stringify(ordre) === JSON.stringify(attendu), `${t.nom}, tabulation des membres : ${ordre.join(' → ')}`]);

  // Un clic sur DsAvatar, puis sur un DsTag, suit le lien du membre.
  for (const [quoi, sel, cas] of /** @type {const} */ ([['DsAvatar', '.ds-avatar', 1], ['DsTag', '.ds-tag', 2]])) {
    const [c, , href] = CLAVIER[cas];
    const b = await page.locator(`[data-cas="${c}"] ${sel}`).first().boundingBox();
    if (b) await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    const suivi = await page.evaluate(() => location.hash);
    out.push([suivi === href, `${t.nom}, clic sur ${quoi} de ${c} : ${suivi || 'aucun lien suivi'}`]);
  }
  out.push([erreurs.length === 0, `${t.nom}, story Clavier de MemberCard : ${erreurs.length} erreur(s)${erreurs.length ? ` (${erreurs.join(' ; ')})` : ''}`]);
  await page.close();

  for (const [story, message] of Object.entries(REFUS)) out.push(await refus(contexte, base, `${STORY}--${story}`, t.nom, message, '.ds-card', 'membre'));
  return out;
}

/**
 * Preuve de MemberCard, sur tous les thèmes puis, par version (développement, construite), sur le premier.
 * @param {{ themes: any[], contexte: import('playwright-core').BrowserContext, developpement: { base: string },
 *   construite: { base: string }, verifier: (ok: boolean, ligne: string) => void }} p
 */
export async function preuveMemberCard({ themes, contexte, developpement, construite, verifier }) {
  for (const t of themes) {
    const attendu = attenduMembres(t);
    const dev = await releve(contexte, developpement.base, t.nom);
    const bld = await releve(contexte, construite.base, t.nom);
    for (const [mode, r] of /** @type {const} */ ([['développement', dev], ['construite', bld]])) {
      const e = [...ecarts(attendu, r.membres), ...ecartsDeForme(r.formes)];
      const n = Object.keys(r.membres).length;
      verifier(e.length === 0 && n === attendu.size && r.erreurs.length === 0, `${t.nom}, ${mode}, planche de MemberCard : ${n} membres sur ${attendu.size}${e.length ? `, ${e.length} écart(s) : ${e.slice(0, 4).join(' ; ')}` : ', DsAvatar, titre, promo et suite de DsTag égaux aux jetons, nom long à la ligne, DsTag long coupé, rien ne déborde'}${r.erreurs.length ? `, ${r.erreurs.join(' ; ')}` : ''}`);
    }
    mkdirSync(CAPTURES, { recursive: true });
    writeFileSync(join(CAPTURES, `member-card-${t.nom}.png`), bld.image);
    const d = ecart(dev.image, bld.image);
    verifier(d === 0, `${t.nom}, MemberCard : développement et construite, ${d} pixel(s) différent(s)`);
  }
  for (const [mode, base] of [['développement', developpement.base], ['construite', construite.base]])
    for (const [ok, ligne] of await clavier(contexte, base, themes[0])) verifier(ok, `${mode}, ${ligne}`);
  return CAPTURES;
}
