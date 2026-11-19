// Preuve de la carte (D50). Sur chaque thème de chaque marque, sur la planche de la carte rendue par Storybook : chaque
// état a la surface, le contour, l'arrondi, la marge, les écarts, le titre, le texte et l'image des jetons, sans ombre ;
// la carte à lien, survolée ou au focus (forcés par le protocole DevTools), prend le contour fort et le titre souligné,
// et au focus l'anneau autour de toute la carte ; le rendu est le même en développement et en version construite. La
// planche de la version construite est enregistrée par thème dans local/champ-carte-captures/, hors dépôt. Sur le premier
// thème, clavier et lecteur d'écran : une tabulation par carte à lien, une par bouton d'une carte à actions, un lien nommé
// par le titre seul, l'anneau au focus clavier, un clic n'importe où sur la carte qui suit le lien, les niveaux de titre,
// les refus d'un usage hors du menu.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL, css, ecart, forcer, ouvrir, refus } from './commun.js';

const STORY = 'composants-carte--planche';
/** Planches enregistrées, hors dépôt. */
const CAPTURES = join(LOCAL, 'champ-carte-captures');
/** États que la preuve force, par sélecteur. */
const FORCES = { '[data-etat="lien-focus"] .ds-carte__lien': ['focus', 'focus-visible'], '.ds-carte[data-etat="lien-survol"]': ['hover'] };
/** États de la planche → [image, actions, lien, survol ou focus]. */
const ETATS = {
  simple: ['', false, false, ''],
  image: ['Deux collines sous un soleil', false, false, ''],
  'image-décorative': ['', false, false, ''],
  actions: [null, true, false, ''],
  lien: [null, false, true, ''],
  'lien-survol': [null, false, true, 'survol'],
  'lien-focus': ['Deux collines sous un soleil', false, true, 'focus'],
};

/** @param {number} n */
const px = (n) => `${Math.round(n * 1000) / 1000}px`;

/**
 * Mesures attendues de chaque carte de la planche, par état, au format de getComputedStyle.
 * @param {{ couleurs: Record<string, string>, variables: Record<string, string>, policeTexte: string[], policeTitre: string[] }} t
 */
function attenduCartes(t) {
  const v = t.variables;
  const c = (/** @type {string} */ k) => css(t.couleurs[k]);
  /** @type {Map<string, Record<string, any>>} */
  const out = new Map();
  for (const [etat, [alt, avecActions, lien, force]] of Object.entries(ETATS)) {
    const image = etat.startsWith('image') || etat === 'lien-focus';
    out.set(etat, {
      fond: c('surface'),
      bord: `${v['ds-epaisseur-contour']} ${css(v[force ? 'ds-contour' : 'ds-contour-carte'])}`,
      rayon: v['ds-arrondi-surface'],
      ombre: 'none',
      marge: v['ds-marge-interieure-composant'],
      titre: {
        balise: 'H3',
        police: t.policeTitre.join('|'),
        taille: v['ds-titre-carte-taille'],
        graisse: v['ds-titre-carte-graisse'],
        interligne: px(parseFloat(v['ds-titre-carte-taille']) * Number(v['ds-titre-carte-interligne'])),
        ajustement: `cap-height ${v['ds-titre-carte-hauteur-capitale']}`,
        couleur: c('on-surface'),
        souligne: force ? 'underline' : 'none',
      },
      texte: { police: t.policeTexte.join('|'), taille: v['ds-corps-taille'], graisse: v['ds-corps-graisse'], couleur: c('on-surface') },
      ecartTitreTexte: v['ds-ecart-dans-composant'],
      ecartActions: avecActions ? v['ds-ecart-entre-composants'] : null,
      image: image
        ? { alt, format: '16:9', cadrage: 'cover 50% 50%', coinsHauts: px(parseFloat(v['ds-arrondi-surface']) - parseFloat(v['ds-epaisseur-contour'])), coinsBas: '0px', ecartTitre: v['ds-marge-interieure-composant'] }
        : null,
      lien: lien
        ? { recouvre: `-${v['ds-epaisseur-contour']} ${v['ds-arrondi-surface']}`, anneau: force === 'focus' ? `solid ${v['ds-epaisseur-focus']} ${css(v['ds-focus'])} ${v['ds-decalage-focus']}` : 'none' }
        : null,
      focalisables: lien ? 1 : avecActions ? 2 : 0,
    });
  }
  return out;
}

/**
 * Relevé de la planche de la carte dans l'aperçu, thème passé par son nom.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string} theme
 */
async function releve(contexte, base, theme) {
  const { page, erreurs } = await ouvrir(contexte, base, STORY, theme);
  await page.locator('.ds-carte').first().waitFor({ timeout: 30_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  await forcer(page, FORCES);
  const cartes = await page.evaluate(() => {
    const noms = (/** @type {string} */ s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1')).join('|');
    const px = (/** @type {number} */ n) => `${Math.round(n * 1000) / 1000}px`;
    /** @type {Record<string, any>} */
    const out = {};
    for (const e of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.ds-carte[data-etat]'))) {
      const s = getComputedStyle(e);
      const contenu = /** @type {HTMLElement} */ (e.querySelector('.ds-carte__contenu'));
      const titre = /** @type {HTMLElement} */ (e.querySelector('.ds-carte__titre'));
      const texte = /** @type {HTMLElement} */ (e.querySelector('.ds-carte__texte'));
      const corps = /** @type {HTMLElement} */ (e.querySelector('.ds-carte__corps'));
      const actions = /** @type {HTMLElement | null} */ (e.querySelector('.ds-carte__actions'));
      const img = /** @type {HTMLImageElement | null} */ (e.querySelector('.ds-carte__media'));
      const lien = /** @type {HTMLElement | null} */ (e.querySelector('.ds-carte__lien'));
      const ts = getComputedStyle(titre);
      const xs = getComputedStyle(texte);
      const cs = getComputedStyle(contenu);
      const r = (/** @type {Element} */ x) => x.getBoundingClientRect();
      const marges = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft];
      let image = null;
      if (img) {
        const is = getComputedStyle(img);
        const ir = r(img);
        // 16:9 à l'arrondi du rendu près : la hauteur vaut largeur × 9 ÷ 16, au millième de px.
        const format = Math.abs(ir.height - (ir.width * 9) / 16) < 0.01 && Math.abs(ir.width - r(e).width + 2 * parseFloat(s.borderLeftWidth)) < 0.01 ? '16:9' : `${ir.width}×${ir.height}`;
        image = { alt: img.getAttribute('alt'), format, cadrage: `${is.objectFit} ${is.objectPosition}`, coinsHauts: is.borderTopLeftRadius === is.borderTopRightRadius ? is.borderTopLeftRadius : `${is.borderTopLeftRadius}/${is.borderTopRightRadius}`, coinsBas: is.borderBottomLeftRadius === is.borderBottomRightRadius ? is.borderBottomLeftRadius : `${is.borderBottomLeftRadius}/${is.borderBottomRightRadius}`, ecartTitre: px(r(titre).top - ir.bottom) };
      }
      let l = null;
      if (lien) {
        const a = getComputedStyle(lien, '::after');
        const recouvre = a.top === a.right && a.top === a.bottom && a.top === a.left ? a.top : `${a.top} ${a.right} ${a.bottom} ${a.left}`;
        l = { recouvre: `${recouvre} ${a.borderTopLeftRadius}`, anneau: a.outlineStyle === 'none' ? 'none' : `${a.outlineStyle} ${a.outlineWidth} ${a.outlineColor} ${a.outlineOffset}` };
      }
      out[/** @type {string} */ (e.dataset.etat)] = {
        fond: s.backgroundColor,
        bord: `${s.borderTopWidth} ${s.borderTopColor}`,
        rayon: s.borderTopLeftRadius,
        ombre: s.boxShadow,
        marge: marges.every((m) => m === marges[0]) ? marges[0] : marges.join(' '),
        titre: {
          balise: titre.tagName,
          police: noms(ts.fontFamily),
          taille: ts.fontSize,
          graisse: ts.fontWeight,
          interligne: ts.lineHeight,
          ajustement: ts.fontSizeAdjust,
          couleur: ts.color,
          souligne: getComputedStyle(lien ?? titre).textDecorationLine,
        },
        texte: { police: noms(xs.fontFamily), taille: xs.fontSize, graisse: xs.fontWeight, couleur: xs.color },
        ecartTitreTexte: px(r(texte).top - r(titre).bottom),
        ecartActions: actions ? px(r(actions).top - r(corps).bottom) : null,
        image,
        lien: l,
        focalisables: e.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
      };
    }
    return out;
  });
  const image = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await page.close();
  return { cartes, image, erreurs };
}

/** Ordre de tabulation attendu dans la story Clavier : une fois la carte à lien, une fois par bouton. */
const ORDRE_CLAVIER = ['lien-a', 'actions', 'actions', 'lien-c'];
/** Erreurs attendues des stories de refus. */
const REFUS = {
  'refus-sans-titre': 'carte : titre obligatoire',
  'refus-niveau': 'carte : niveau inconnu : 5 (2, 3, 4)',
  'refus-image': 'carte : texte alternatif obligatoire avec une image',
  'refus-lien-et-actions': 'carte : lien et actions ensemble refusés',
  'refus-actions': 'carte : actions : seuls Bouton et BoutonIcone sont admis',
  'refus-ecouteur': 'carte : attribut refusé : onClick',
};

/**
 * Clavier et lecteur d'écran, sur un thème. Rend des [ok, ligne].
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {{ nom: string, variables: Record<string, string> }} t
 */
async function clavier(contexte, base, t) {
  /** @type {[boolean, string][]} */
  const out = [];
  const v = t.variables;
  const { page, erreurs } = await ouvrir(contexte, base, 'composants-carte--clavier', t.nom);
  await page.locator('.ds-carte').first().waitFor();
  const cas = () => page.evaluate(() => /** @type {HTMLElement | null} */ (document.activeElement?.closest('[data-cas]'))?.dataset.cas ?? document.activeElement?.tagName ?? null);

  // Liens nommés par le titre seul ; image nommée par son texte de remplacement.
  const liens = await page.getByRole('link').evaluateAll((ls) => ls.map((l) => l.textContent));
  const nommes = (await page.getByRole('link', { name: 'Club de lecture', exact: true }).count()) + (await page.getByRole('link', { name: 'Réunion du mois', exact: true }).count());
  const image = await page.getByRole('img', { name: 'Deux collines sous un soleil', exact: true }).count();
  out.push([liens.length === 2 && nommes === 2 && image === 1, `${t.nom}, liens des cartes : ${liens.length}, nommés par le titre seul : ${nommes} (${liens.join(' ; ')}), image nommée : ${image}`]);

  /** @type {(string | null)[]} */
  const ordre = [];
  for (let i = 0; i < ORDRE_CLAVIER.length; i++) {
    await page.keyboard.press('Tab');
    ordre.push(await cas());
  }
  out.push([JSON.stringify(ordre) === JSON.stringify(ORDRE_CLAVIER), `${t.nom}, tabulation des cartes : ${ordre.join(' → ')}`]);

  // Anneau au focus clavier, contour fort et titre souligné sur la carte à lien : retour à la première par Maj+Tab.
  for (let i = 0; i < ORDRE_CLAVIER.length - 1; i++) await page.keyboard.press('Shift+Tab');
  const focus = await page.locator('[data-cas="lien-a"]').evaluate((e) => {
    const a = /** @type {HTMLElement} */ (e.querySelector('.ds-carte__lien'));
    const p = getComputedStyle(a, '::after');
    return { visible: a.matches(':focus-visible'), anneau: `${p.outlineStyle} ${p.outlineWidth} ${p.outlineColor} ${p.outlineOffset}`, bord: getComputedStyle(e).borderTopColor, souligne: getComputedStyle(a).textDecorationLine };
  });
  const attendu = `solid ${v['ds-epaisseur-focus']} ${css(v['ds-focus'])} ${v['ds-decalage-focus']}`;
  out.push([focus.visible && focus.anneau === attendu && focus.bord === css(v['ds-contour']) && focus.souligne === 'underline', `${t.nom}, focus clavier de la carte à lien : ${focus.anneau} (jetons ${attendu}), contour ${focus.bord}, titre ${focus.souligne}`]);

  // Un clic dans le texte, loin du titre, suit le lien.
  const boite = await page.locator('[data-cas="lien-a"] .ds-carte__texte').boundingBox();
  if (boite) await page.mouse.click(boite.x + boite.width - 4, boite.y + boite.height - 4);
  const ancre = await page.evaluate(() => location.hash);
  out.push([ancre === '#lien-a', `${t.nom}, clic dans le texte de la carte à lien : ${ancre || 'aucun lien suivi'}`]);
  out.push([erreurs.length === 0, `${t.nom}, story Clavier de la carte : ${erreurs.length} erreur(s)${erreurs.length ? ` (${erreurs.join(' ; ')})` : ''}`]);
  await page.close();

  // Niveaux de titre : la balise suit l'option, l'apparence ne change pas.
  const n = await ouvrir(contexte, base, 'composants-carte--niveaux', t.nom);
  await n.page.locator('.ds-carte').first().waitFor();
  const niveaux = await n.page.evaluate(() =>
    ['niveau-2', 'niveau-3', 'niveau-4'].map((k) => {
      const x = /** @type {HTMLElement} */ (document.querySelector(`[data-cas="${k}"] .ds-carte__titre`));
      const s = getComputedStyle(x);
      return `${x.tagName} ${s.fontSize} ${s.fontWeight} ${s.lineHeight}`;
    }),
  );
  const memes = niveaux.every((x) => x.slice(3) === niveaux[0].slice(3));
  out.push([niveaux.map((x) => x.slice(0, 2)).join(' ') === 'H2 H3 H4' && memes && n.erreurs.length === 0, `${t.nom}, niveaux de titre : ${niveaux.join(' ; ')}`]);
  await n.page.close();

  for (const [story, message] of Object.entries(REFUS)) out.push(await refus(contexte, base, `composants-carte--${story}`, t.nom, message, '.ds-carte', 'carte'));
  return out;
}

/**
 * Écarts entre le relevé et l'attendu, état par état.
 * @param {Map<string, Record<string, any>>} attendu @param {Record<string, any>} vu
 */
function ecarts(attendu, vu) {
  return [...attendu].flatMap(([etat, a]) => {
    const m = vu[etat];
    if (!m) return [`${etat} absent`];
    return Object.entries(a).flatMap(([k, x]) => (JSON.stringify(m[k]) === JSON.stringify(x) ? [] : [`${etat} ${k} ${JSON.stringify(m[k])} (attendu ${JSON.stringify(x)})`]));
  });
}

/**
 * Preuve de la carte, sur tous les thèmes puis, par version (développement, construite), sur le premier.
 * @param {{ themes: any[], contexte: import('playwright-core').BrowserContext, developpement: { base: string },
 *   construite: { base: string }, verifier: (ok: boolean, ligne: string) => void }} p
 */
export async function preuveCarte({ themes, contexte, developpement, construite, verifier }) {
  for (const t of themes) {
    const attendu = attenduCartes(t);
    const dev = await releve(contexte, developpement.base, t.nom);
    const bld = await releve(contexte, construite.base, t.nom);
    for (const [mode, r] of /** @type {const} */ ([['développement', dev], ['construite', bld]])) {
      const e = ecarts(attendu, r.cartes);
      const n = Object.keys(r.cartes).length;
      verifier(e.length === 0 && n === attendu.size && r.erreurs.length === 0, `${t.nom}, ${mode}, planche de la carte : ${n} cartes sur ${attendu.size}${e.length ? `, ${e.length} écart(s) : ${e.slice(0, 4).join(' ; ')}` : ', surface, contour, dimensions, titre, texte, image et lien égaux aux jetons dans chaque état'}${r.erreurs.length ? `, ${r.erreurs.join(' ; ')}` : ''}`);
    }
    mkdirSync(CAPTURES, { recursive: true });
    writeFileSync(join(CAPTURES, `carte-${t.nom}.png`), bld.image);
    const d = ecart(dev.image, bld.image);
    verifier(d === 0, `${t.nom}, carte : développement et construite, ${d} pixel(s) différent(s)`);
  }
  for (const [mode, base] of [['développement', developpement.base], ['construite', construite.base]])
    for (const [ok, ligne] of await clavier(contexte, base, themes[0])) verifier(ok, `${mode}, ${ligne}`);
  return CAPTURES;
}
