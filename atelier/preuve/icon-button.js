// Preuve du bouton à icône seule (D52). Sur chaque thème de chaque marque, sur la planche rendue par Storybook : chaque
// variante et taille a, dans chaque état, une boîte carrée de la hauteur du contrôle, une icône de la taille des jetons
// et centrée, l'arrondi, les couleurs, le contour et l'anneau des jetons (survol et focus forcés par le protocole
// DevTools), ni ombre ni transition ; les deux lignes d'alignement (champ de recherche + bouton à icône, bouton + bouton
// à icône) ont le même haut et le même bas ; le rendu est le même en développement et en version construite. La planche
// et le survol des discrets vu de près sont enregistrés par thème dans local/icon-button-captures/, hors dépôt. Sur le
// premier thème : arbre d'accessibilité (nom = libellé, icône muette, désactivé lu), tabulation, inactif muet, envoi,
// anneau au focus clavier, refus d'un usage hors du menu.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL, TRANSPARENT, css, ecart, forcer, ouvrir, refus } from './commun.js';

const STORY = 'composants-dsiconbutton';
/** Planches enregistrées, hors dépôt. */
const CAPTURES = join(LOCAL, 'icon-button-captures');
/** États que la preuve force sur les boutons de leur colonne. */
const FORCES = { survol: ['hover'], focus: ['focus', 'focus-visible'] };

/** Taille de la planche → valeur de la prop size, qui nomme aussi les variables du thème. */
const TAILLES = /** @type {Record<string, string>} */ ({ normale: 'medium', petite: 'small' });

/**
 * Mesures attendues de chaque bouton de la planche, par « variante|taille|état », au format de getComputedStyle.
 * @param {(k: string) => { fond: string, texte: string }} c couleur de la table, en r,g,b
 * @param {Record<string, string>} v variables de la table
 */
function attenduBoutons(c, v) {
  /** Variante → [couleur au repos, couleur au survol, fond transparent hors survol] : celles du bouton (D43). */
  const VARIANTES = {
    discret: ['interactive-subtle', 'interactive-subtle', true],
    secondaire: ['surface', 'component-hover', false],
    principal: ['primary', 'primary-darken-1', false],
    'danger-discret': ['error-subtle', 'error-subtle', true],
  };
  /** @type {Map<string, Record<string, string>>} */
  const out = new Map();
  for (const [variante, [repos, survol, discret]] of Object.entries(VARIANTES))
    for (const taille of ['normale', 'petite'])
      for (const etat of ['repos', 'survol', 'focus', 'désactivé']) {
        const desactive = etat === 'désactivé';
        const couleur = desactive ? 'disabled' : etat === 'survol' ? survol : repos;
        const cote = v[`ds-height-control-${TAILLES[taille]}`];
        const icone = v[`ds-icon-size-${TAILLES[taille]}`];
        const marge = `${(parseFloat(cote) - parseFloat(icone)) / 2}px`;
        out.set(`${variante}|${taille}|${etat}`, {
          fond: discret && etat !== 'survol' ? TRANSPARENT : css(c(couleur).fond),
          icone: css(c(couleur).texte),
          ...(variante === 'secondaire' ? { contour: `${v['ds-border-width-default']} ${css(v[desactive ? 'ds-border-disabled' : 'ds-border'])}` } : {}),
          anneau: etat === 'focus' ? `solid ${v['ds-border-width-focus']} ${css(v['ds-focus'])} ${v['ds-offset-focus']}` : 'none',
          boite: `${cote}×${cote}`,
          rayon: v['ds-border-radius-control'],
          dessin: `${icone}×${icone}`,
          centre: `${marge} ${marge}`,
          ombre: 'none',
          transition: '0s',
        });
      }
  return out;
}

/**
 * Relevé de la planche dans l'aperçu : chaque bouton, états forcés, et les deux lignes d'alignement.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string} theme
 */
async function releve(contexte, base, theme) {
  const { page, erreurs } = await ouvrir(contexte, base, `${STORY}--planche`, theme);
  await page.locator('.ds-button[data-etat]').first().waitFor({ timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  await forcer(page, Object.fromEntries(Object.entries(FORCES).map(([etat, classes]) => [`.ds-button[data-etat="${etat}"]`, classes])));
  const m = await page.evaluate(() => {
    /** Nombre au centième, en px. @param {number} n */
    const px = (n) => `${Math.round(n * 100) / 100}px`;
    /** @type {Record<string, Record<string, string>>} */
    const boutons = {};
    for (const e of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.ds-button[data-etat]'))) {
      const s = getComputedStyle(e);
      const b = e.getBoundingClientRect();
      const svg = e.querySelector('.ds-icon-button__icon > svg');
      const i = svg?.getBoundingClientRect();
      boutons[`${e.dataset.variante}|${e.dataset.taille}|${e.dataset.etat}`] = {
        fond: s.backgroundColor,
        icone: svg ? getComputedStyle(svg).color : 'absente',
        ...(e.dataset.variante === 'secondaire' ? { contour: `${s.borderTopWidth} ${s.borderTopColor}` } : {}),
        anneau: s.outlineStyle === 'none' ? 'none' : `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} ${s.outlineOffset}`,
        boite: `${px(b.width)}×${px(b.height)}`,
        rayon: s.borderTopLeftRadius,
        dessin: i ? `${px(i.width)}×${px(i.height)}` : 'absent',
        // Marges de l'icône dans la boîte, à gauche et en haut ; égales à celles de droite et du bas, à 0,5 px près.
        centre: i && Math.abs(i.left - b.left - (b.right - i.right)) <= 0.5 && Math.abs(i.top - b.top - (b.bottom - i.bottom)) <= 0.5 ? `${px(Math.round(i.left - b.left))} ${px(Math.round(i.top - b.top))}` : i ? `décentrée (${px(i.left - b.left)} ${px(b.right - i.right)} ${px(i.top - b.top)} ${px(b.bottom - i.bottom)})` : 'absente',
        ombre: s.boxShadow,
        transition: s.transitionDuration,
      };
    }
    /** Haut, bas et hauteur de la boîte d'un élément. @param {string} sel */
    const boite = (sel) => {
      const r = document.querySelector(sel)?.getBoundingClientRect();
      return r ? [r.top, r.bottom, r.height] : null;
    };
    return {
      boutons,
      recherche: { champ: boite('[data-cas="recherche-champ"] .ds-text-input__field > * > *'), bouton: boite('[data-cas="recherche-bouton"]') },
      bouton: { texte: boite('[data-cas="bouton-texte"]'), icone: boite('[data-cas="bouton-icone"]') },
    };
  });
  const image = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await page.close();
  return { ...m, image, erreurs };
}

/**
 * Survol des discrets vu de près, survol forcé, capturé pour l'arrêt des planches ; pas de mesure.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string} theme
 */
async function survolDePres(contexte, base, theme) {
  const { page } = await ouvrir(contexte, base, `${STORY}--survol-de-pres`, theme);
  await page.locator('.ds-button[data-etat]').first().waitFor({ timeout: 30_000 });
  await forcer(page, { '.ds-button[data-etat="survol"]': ['hover'] });
  const image = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await page.close();
  return image;
}

/** Ordre de tabulation attendu dans la story Clavier : le désactivé reste atteignable. */
const ORDRE_CLAVIER = ['champ', 'envoi', 'desactive', 'actif'];
/** Arbre d'accessibilité attendu : nom = libellé, aucun nœud de l'icône, aria-disabled lu comme désactivé. */
const ARBRE_CLAVIER = { envoi: '- button "Rechercher"', desactive: '- button "Supprimer" [disabled]', actif: '- button "Fermer"' };
/** Erreurs attendues des stories de refus. */
const REFUS = {
  'refus-sans-libelle': 'DsIconButton : label : obligatoire',
  'refus-sans-icone': 'DsIconButton : icon : obligatoire',
  'refus-variante': 'DsIconButton : variant : valeur inconnue : danger (ghost, secondary, primary, danger-ghost)',
  'refus-nom': 'DsIconButton : attribut refusé : aria-label',
  'refus-attribut': 'DsIconButton : attribut refusé : color',
  'refus-envoi': 'DsIconButton : disabled : refusé avec type=submit',
};

/**
 * Clavier et lecteur d'écran, sur un thème. Rend des [ok, ligne].
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {{ nom: string, variables: Record<string, string> }} t
 */
async function clavier(contexte, base, t) {
  /** @type {[boolean, string][]} */
  const out = [];
  const { page, erreurs } = await ouvrir(contexte, base, `${STORY}--clavier`, t.nom);
  await page.locator('.ds-button').first().waitFor();
  const bouton = (/** @type {string} */ cas) => page.locator(`[data-cas="${cas}"]`);
  const actif = () => page.evaluate(() => /** @type {HTMLElement | null} */ (document.activeElement)?.dataset?.cas ?? document.activeElement?.tagName ?? null);
  const journal = async () => JSON.parse((await page.locator('[data-journal]').textContent()) ?? '{}');

  // Arbre d'accessibilité : un bouton nommé par son libellé, sans nœud d'icône ; la zone de statut du bouton, vide.
  const arbres = Object.fromEntries(await Promise.all(Object.keys(ARBRE_CLAVIER).map(async (cas) => [cas, await bouton(cas).ariaSnapshot()])));
  const muettes = await page.locator('.ds-icon-button__icon[aria-hidden="true"]').count();
  const statuts = await page.locator('.ds-icon-button [role="status"]').evaluateAll((z) => z.map((e) => e.textContent).join(''));
  out.push([JSON.stringify(arbres) === JSON.stringify(ARBRE_CLAVIER) && muettes === 3 && statuts === '', `${t.nom}, arbre d'accessibilité : ${Object.values(arbres).join(' ; ')} ; ${muettes} icônes muettes sur 3 ; zones de statut ${statuts === '' ? 'vides' : `« ${statuts} »`}`]);

  // Tabulation, puis anneau au focus clavier.
  /** @type {(string | null)[]} */
  const ordre = [];
  for (let i = 0; i < ORDRE_CLAVIER.length; i++) {
    await page.keyboard.press('Tab');
    ordre.push(await actif());
  }
  out.push([JSON.stringify(ordre) === JSON.stringify(ORDRE_CLAVIER), `${t.nom}, tabulation : ${ordre.join(' → ')}`]);
  const anneau = await bouton('actif').evaluate((e) => {
    const s = getComputedStyle(e);
    return { visible: e.matches(':focus-visible'), anneau: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} ${s.outlineOffset}` };
  });
  const attendu = `solid ${t.variables['ds-border-width-focus']} ${css(t.variables['ds-focus'])} ${t.variables['ds-offset-focus']}`;
  out.push([anneau.visible && anneau.anneau === attendu, `${t.nom}, focus au clavier : ${anneau.anneau} (jetons ${attendu})`]);

  // Le désactivé ne réagit ni au clavier ni à la souris ; l'actif émet son clic ; le bouton d'envoi envoie le formulaire.
  await bouton('desactive').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  const d = await bouton('desactive').boundingBox();
  if (d) await page.mouse.click(d.x + d.width / 2, d.y + d.height / 2);
  await bouton('actif').focus();
  await page.keyboard.press('Enter');
  await bouton('envoi').focus();
  await page.keyboard.press('Space');
  const j = await journal();
  out.push([JSON.stringify(j) === JSON.stringify({ clics: ['actif', 'envoi'], envois: 1 }), `${t.nom}, désactivé muet au clavier et à la souris ; actif et envoi : ${JSON.stringify(j)}`]);
  out.push([erreurs.length === 0, `${t.nom}, story Clavier : ${erreurs.length} erreur(s)${erreurs.length ? ` (${erreurs.join(' ; ')})` : ''}`]);
  await page.close();

  // Refus : l'erreur qui nomme l'usage, et aucun bouton.
  for (const [story, message] of Object.entries(REFUS)) out.push(await refus(contexte, base, `${STORY}--${story}`, t.nom, message, '.ds-button', 'bouton'));
  return out;
}

/**
 * Une ligne d'alignement : deux boîtes de la hauteur du contrôle, même haut, même bas.
 * @param {(number[] | null)[]} boites @param {string} h hauteur attendue
 */
const aligne = (boites, h) => boites.every((b) => b !== null && `${b[2]}px` === h) && boites[0]?.[0] === boites[1]?.[0] && boites[0]?.[1] === boites[1]?.[1];
/** @param {(number[] | null)[]} boites */
const decrire = (boites) => boites.map((b) => (b ? `${b[2]} px (${b[0]} à ${b[1]})` : 'absente')).join(', ');

/**
 * Preuve du bouton à icône, sur tous les thèmes puis, par version (développement, construite), sur le premier.
 * @param {{ themes: any[], contexte: import('playwright-core').BrowserContext, developpement: { base: string },
 *   construite: { base: string }, verifier: (ok: boolean, ligne: string) => void }} p
 */
export async function preuveBoutonIcone({ themes, contexte, developpement, construite, verifier }) {
  mkdirSync(CAPTURES, { recursive: true });
  for (const t of themes) {
    const attendu = attenduBoutons((k) => ({ fond: t.couleurs[k], texte: t.couleurs[`on-${k}`] }), t.variables);
    const dev = await releve(contexte, developpement.base, t.nom);
    const bld = await releve(contexte, construite.base, t.nom);
    for (const [mode, r] of /** @type {const} */ ([['développement', dev], ['construite', bld]])) {
      const ecarts = [...attendu].flatMap(([cle, a]) => {
        const vu = r.boutons[cle];
        if (!vu) return [`${cle} absent`];
        return Object.entries(a).flatMap(([k, v]) => (vu[k] === v ? [] : [`${cle} ${k} ${vu[k]} (attendu ${v})`]));
      });
      const n = Object.keys(r.boutons).length;
      verifier(ecarts.length === 0 && n === attendu.size && r.erreurs.length === 0, `${t.nom}, ${mode}, planche du bouton à icône : ${n} boutons sur ${attendu.size}${ecarts.length ? `, ${ecarts.length} écart(s) : ${ecarts.slice(0, 4).join(' ; ')}` : ', boîte, icône, centrage, couleurs, contour et anneau égaux aux jetons dans chaque état'}${r.erreurs.length ? `, ${r.erreurs.join(' ; ')}` : ''}`);
    }
    const h = t.variables['ds-height-control-medium'];
    const recherche = [bld.recherche.champ, bld.recherche.bouton];
    const voisins = [bld.bouton.texte, bld.bouton.icone];
    verifier(aligne(recherche, h) && aligne(voisins, h), `${t.nom}, alignement : champ de recherche + bouton à icône ${decrire(recherche)} ; bouton + bouton à icône ${decrire(voisins)}`);
    writeFileSync(join(CAPTURES, `${t.nom}.png`), bld.image);
    writeFileSync(join(CAPTURES, `survol-${t.nom}.png`), await survolDePres(contexte, construite.base, t.nom));
    const px = ecart(dev.image, bld.image);
    verifier(px === 0, `${t.nom}, bouton à icône : développement et construite, ${px} pixel(s) différent(s)`);
  }
  for (const [mode, base] of [['développement', developpement.base], ['construite', construite.base]])
    for (const [ok, ligne] of await clavier(contexte, base, themes[0])) verifier(ok, `${mode}, ${ligne}`);
  return CAPTURES;
}
