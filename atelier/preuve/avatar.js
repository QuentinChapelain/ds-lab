// Preuve de l'avatar (D54). Sur chaque thème de chaque marque, sur la planche de l'avatar rendue par Storybook : chaque
// état, aux deux tailles, a le côté, le rond, le pastel et les initiales des jetons, centrées, sans ombre ni transition ;
// la photo couvre le rond ; l'image en échec laisse les initiales et aucune image ; les cas de la règle des initiales
// donnent leurs lettres ; le rendu est le même en développement et en version construite. La planche de la version
// construite est enregistrée par thème dans local/avatar-tag-captures/, hors dépôt. Sur le premier thème : arbre
// d'accessibilité (un seul nœud nommé, ou aucun si l'avatar est décoratif), tabulation qui ne s'arrête pas sur un avatar,
// refus d'un usage hors du menu.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL, css, ecart, ouvrir, refus } from './commun.js';

const STORY = 'composants-dsavatar';
/** Planches enregistrées, hors dépôt. */
export const CAPTURES = join(LOCAL, 'avatar-tag-captures');
/** États de chaque taille → image attendue (couvre, ou aucune). */
const ETATS = { photo: 'couvre', initiales: 'aucune', echec: 'aucune', decoratif: 'aucune' };
/** Cas de la règle des initiales de la planche → lettres attendues (docs/attendus/avatar-etiquette.md). */
const CAS = { 'deux-mots': 'CF', 'trait-union': 'JM', 'un-mot-trait-union': 'ML', 'un-mot': 'N', particule: 'HL', 'particule-tete': 'L', elision: 'IA', accent: 'ÉB' };

/** Taille de la planche → valeur de la prop size, qui nomme aussi les variables du thème. */
const TAILLES = /** @type {Record<string, string>} */ ({ normale: 'medium', grande: 'large' });

/** @param {number} n */
const px = (n) => `${Math.round(n * 10000) / 10000}px`;

/**
 * Mesures attendues de chaque avatar de la planche, au format de getComputedStyle.
 * @param {{ couleurs: Record<string, string>, variables: Record<string, string>, policeTexte: string[] }} t
 */
function attenduAvatars(t) {
  const v = t.variables;
  /** @type {Map<string, Record<string, any>>} */
  const out = new Map();
  for (const taille of ['normale', 'grande']) {
    const cote = v[`ds-avatar-size-${TAILLES[taille]}`];
    const s = `ds-initials-${TAILLES[taille]}`;
    for (const [etat, image] of Object.entries(ETATS))
      out.set(`${taille}-${etat}`, {
        boite: `${cote} × ${cote}`,
        rayon: v['ds-border-radius-full'],
        fond: css(t.couleurs.avatar),
        ombre: 'none',
        transition: '0s',
        initiales: {
          texte: 'CF',
          couleur: css(t.couleurs['on-avatar']),
          police: t.policeTexte.join('|'),
          taille: v[`${s}-font-size`],
          graisse: v[`${s}-font-weight`],
          interligne: px(parseFloat(v[`${s}-font-size`]) * Number(v[`${s}-line-height`])),
          muettes: true,
          centrees: true,
        },
        image,
      });
  }
  for (const [cas, lettres] of Object.entries(CAS)) out.set(cas, { lettres });
  return out;
}

/**
 * Relevé de la planche de l'avatar dans l'aperçu, thème passé par son nom.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string} theme
 */
async function releve(contexte, base, theme) {
  const { page, erreurs } = await ouvrir(contexte, base, `${STORY}--planche`, theme);
  await page.locator('.ds-avatar').first().waitFor({ timeout: 30_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  // L'image en échec est retirée par l'enveloppe ; la photo est décodée avant la mesure.
  await page.waitForFunction(() => document.querySelectorAll('[data-etat$="-echec"] img').length === 0, null, { timeout: 5_000 }).catch(() => {});
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  const avatars = await page.evaluate(() => {
    const noms = (/** @type {string} */ s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1')).join('|');
    const r = (/** @type {Element} */ x) => x.getBoundingClientRect();
    /** @type {Record<string, any>} */
    const out = {};
    for (const e of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.ds-avatar[data-etat]'))) {
      const s = getComputedStyle(e);
      const i = /** @type {HTMLElement} */ (e.querySelector('.ds-avatar__initials'));
      const is = getComputedStyle(i);
      const img = /** @type {HTMLImageElement | null} */ (e.querySelector('img'));
      const re = r(e);
      const ri = r(i);
      let image = 'aucune';
      if (img) {
        const m = r(img);
        const g = getComputedStyle(img);
        image = m.left === re.left && m.top === re.top && m.width === re.width && m.height === re.height && g.objectFit === 'cover' && img.complete && img.naturalWidth > 0 ? 'couvre' : `${m.width}×${m.height} ${g.objectFit}`;
      }
      out[/** @type {string} */ (e.dataset.etat)] = {
        boite: `${re.width}px × ${re.height}px`,
        rayon: s.borderTopLeftRadius,
        fond: s.backgroundColor,
        ombre: s.boxShadow,
        transition: s.transitionDuration,
        initiales: {
          texte: i.textContent,
          couleur: is.color,
          police: noms(is.fontFamily),
          taille: is.fontSize,
          graisse: is.fontWeight,
          interligne: is.lineHeight,
          muettes: i.getAttribute('aria-hidden') === 'true',
          centrees: Math.abs(ri.left + ri.width / 2 - (re.left + re.width / 2)) <= 0.5 && Math.abs(ri.top + ri.height / 2 - (re.top + re.height / 2)) <= 0.5,
        },
        image,
      };
    }
    for (const e of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.ds-avatar[data-cas]'))) out[/** @type {string} */ (e.dataset.cas)] = { lettres: e.querySelector('.ds-avatar__initials')?.textContent };
    return out;
  });
  const image = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await page.close();
  return { avatars, image, erreurs };
}

/** Arbre d'accessibilité attendu de chaque avatar de la story Accessibilité : un seul nœud nommé, ou rien. */
const ARBRE = { photo: '- img "Camille Ferrand"', initiales: '- img "Camille Ferrand"', echec: '- img "Camille Ferrand"', decoratif: '' };
/** Erreurs attendues des stories de refus. */
const REFUS = {
  'refus-sans-nom': 'DsAvatar : name : obligatoire',
  'refus-nom-vide': 'DsAvatar : name : obligatoire',
  'refus-sans-lettre': 'DsAvatar : name : sans lettre',
  'refus-taille': 'DsAvatar : size : valeur inconnue : petite (medium, large)',
  'refus-nom-a-la-main': 'DsAvatar : attribut refusé : aria-label',
};

/**
 * Lecteur d'écran et clavier, sur un thème. Rend des [ok, ligne].
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {{ nom: string }} t
 */
async function accessibilite(contexte, base, t) {
  /** @type {[boolean, string][]} */
  const out = [];
  const { page, erreurs } = await ouvrir(contexte, base, `${STORY}--accessibilite`, t.nom);
  await page.locator('.ds-avatar').first().waitFor();
  await page.waitForFunction(() => document.querySelectorAll('[data-cas="echec"] img').length === 0, null, { timeout: 5_000 }).catch(() => {});
  const arbres = Object.fromEntries(await Promise.all(Object.keys(ARBRE).map(async (cas) => [cas, await page.locator(`[data-cas="${cas}"]`).ariaSnapshot()])));
  out.push([JSON.stringify(arbres) === JSON.stringify(ARBRE), `${t.nom}, arbre d'accessibilité de l'avatar : ${Object.entries(arbres).map(([k, a]) => `${k} ${a || 'aucun nœud'}`).join(' ; ')}`]);

  const cas = () => page.evaluate(() => /** @type {HTMLElement | null} */ (document.activeElement?.closest('[data-cas]'))?.dataset.cas ?? document.activeElement?.tagName ?? null);
  /** @type {(string | null)[]} */
  const ordre = [];
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('Tab');
    ordre.push(await cas());
  }
  out.push([JSON.stringify(ordre) === JSON.stringify(['avant', 'apres']), `${t.nom}, tabulation autour des avatars : ${ordre.join(' → ')}`]);
  out.push([erreurs.length === 0, `${t.nom}, story Accessibilité de l'avatar : ${erreurs.length} erreur(s)${erreurs.length ? ` (${erreurs.join(' ; ')})` : ''}`]);
  await page.close();

  for (const [story, message] of Object.entries(REFUS)) out.push(await refus(contexte, base, `${STORY}--${story}`, t.nom, message, '.ds-avatar', 'avatar'));
  return out;
}

/**
 * Écarts entre le relevé et l'attendu, avatar par avatar.
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
 * Preuve de l'avatar, sur tous les thèmes puis, par version (développement, construite), sur le premier.
 * @param {{ themes: any[], contexte: import('playwright-core').BrowserContext, developpement: { base: string },
 *   construite: { base: string }, verifier: (ok: boolean, ligne: string) => void }} p
 */
export async function preuveAvatar({ themes, contexte, developpement, construite, verifier }) {
  for (const t of themes) {
    const attendu = attenduAvatars(t);
    const dev = await releve(contexte, developpement.base, t.nom);
    const bld = await releve(contexte, construite.base, t.nom);
    for (const [mode, r] of /** @type {const} */ ([['développement', dev], ['construite', bld]])) {
      const e = ecarts(attendu, r.avatars);
      const n = Object.keys(r.avatars).length;
      verifier(e.length === 0 && n === attendu.size && r.erreurs.length === 0, `${t.nom}, ${mode}, planche de l'avatar : ${n} avatars sur ${attendu.size}${e.length ? `, ${e.length} écart(s) : ${e.slice(0, 4).join(' ; ')}` : ', côté, rond, pastel, initiales, photo et image en échec égaux aux jetons, lettres des cas justes'}${r.erreurs.length ? `, ${r.erreurs.join(' ; ')}` : ''}`);
    }
    mkdirSync(CAPTURES, { recursive: true });
    writeFileSync(join(CAPTURES, `avatar-${t.nom}.png`), bld.image);
    const d = ecart(dev.image, bld.image);
    verifier(d === 0, `${t.nom}, avatar : développement et construite, ${d} pixel(s) différent(s)`);
  }
  for (const [mode, base] of [['développement', developpement.base], ['construite', construite.base]])
    for (const [ok, ligne] of await accessibilite(contexte, base, themes[0])) verifier(ok, `${mode}, ${ligne}`);
  return CAPTURES;
}
