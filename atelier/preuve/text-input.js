// Preuve du champ de texte (D49). Sur chaque thème de chaque marque, sur la planche du champ rendue par Storybook :
// chaque état a le contour, le fond, la hauteur, l'arrondi, les marges, le texte, le texte d'exemple, le libellé,
// l'aide et l'erreur des jetons, sans opacité de Vuetify (survol et focus forcés par le protocole DevTools) ; la ligne
// champ + bouton aligne deux boîtes de 40 px ; le rendu est le même en développement et en version construite. La planche
// de la version construite est enregistrée par thème dans local/text-input-card-captures/, hors dépôt. Sur le premier thème,
// clavier et lecteur d'écran : ordre de tabulation (le désactivé est sauté), anneau au focus clavier sur un champ en
// erreur, nom, description, états invalide, requis et désactivé dans l'arbre d'accessibilité, aucune zone d'alerte,
// valeur tapée émise, valeur du désactivé non envoyée, refus d'un usage hors du menu.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCAL, css, ecart, forcer, ouvrir, refus } from './commun.js';

const STORY = 'composants-dstextinput--planche';
/** Planches enregistrées, hors dépôt. */
const CAPTURES = join(LOCAL, 'text-input-card-captures');
/**
 * Boîte dessinée du champ (contour, fond, anneau) : sous la racine du champ de l'enveloppe, l'enfant de son unique enfant
 * (vuetify 4.3.4, VInput puis VField) ; désignée par sa place, sans nommer de classe de Vuetify (garde E5).
 */
const BOITE = '.ds-text-input__field > * > *';
/** États que la preuve force, par sélecteur. */
const FORCES = { '[data-etat="focus"] input, [data-etat="erreur-focus"] input': ['focus', 'focus-visible'], [`[data-etat="survol"] ${BOITE}`]: ['hover'] };
const ETATS = ['repos', 'survol', 'focus', 'rempli', 'exemple', 'aide', 'erreur', 'erreur-focus', 'obligatoire', 'désactivé', 'icône'];

/**
 * Mesures attendues de chaque champ de la planche, par état, au format de getComputedStyle.
 * @param {{ couleurs: Record<string, string>, variables: Record<string, string>, policeTexte: string[], policeLibelle: string[] }} t
 */
function attenduChamps(t) {
  const v = t.variables;
  const c = (/** @type {string} */ k) => css(t.couleurs[k]);
  const anneau = `solid ${v['ds-border-width-focus']} ${css(v['ds-focus'])} ${v['ds-offset-focus']}`;
  const mention = { taille: v['ds-supporting-text-font-size'], graisse: v['ds-supporting-text-font-weight'], police: t.policeTexte.join('|') };
  /** @type {Map<string, Record<string, any>>} */
  const out = new Map();
  for (const etat of ETATS) {
    const erreur = etat.startsWith('erreur');
    const desactive = etat === 'désactivé';
    out.set(etat, {
      hauteur: v['ds-height-control-medium'],
      rayon: v['ds-border-radius-control'],
      bord: `${v['ds-border-width-default']} ${css(v[erreur ? 'ds-border-error' : desactive ? 'ds-border-disabled' : 'ds-border'])}`,
      fond: desactive ? c('disabled') : c('surface'),
      texte: desactive ? c('on-disabled') : c('on-surface'),
      police: t.policeTexte.join('|'),
      taille: v['ds-body-font-size'],
      graisse: v['ds-body-font-weight'],
      // Du bord intérieur au premier élément (texte, ou icône) à gauche, du texte au bord intérieur à droite.
      marge: `${v['ds-padding-component']}/${v['ds-padding-component']}`,
      anneau: etat === 'focus' || etat === 'erreur-focus' ? anneau : 'none',
      opacite: '1',
      natif: desactive ? 'disabled' : 'actif',
      libelle: { couleur: c('on-background'), taille: v['ds-label-font-size'], graisse: v['ds-label-font-weight'], police: t.policeLibelle.join('|') },
      ecartLibelle: v['ds-gap-within-component'],
      obligatoire: etat === 'obligatoire' ? { texte: ' (obligatoire)', couleur: css(v['ds-text-secondary']) } : null,
      erreur: erreur ? { couleur: css(v['ds-text-error']), ...mention, ecart: v['ds-gap-within-component'] } : null,
      aide: etat === 'aide' || desactive ? { couleur: css(v['ds-text-secondary']), ...mention, ecart: v['ds-gap-within-component'], masquee: false } : erreur ? { couleur: css(v['ds-text-secondary']), ...mention, masquee: true } : null,
      exemple: etat === 'exemple' || etat === 'icône' ? `${css(v['ds-text-secondary'])} 1` : null,
      icone: etat === 'icône' ? { taille: v['ds-icon-size-medium'], ecart: v['ds-gap-icon-text'], muette: true } : null,
    });
  }
  return out;
}

/**
 * Couleur et opacité calculées du texte d'exemple de chaque champ, lues sur l'élément du navigateur qui le dessine
 * (racine fantôme de l'input, -webkit-input-placeholder) : getComputedStyle n'atteint pas ::placeholder.
 * @param {import('playwright-core').Page} page
 */
async function exemples(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  /** @type {Record<string, string>} */
  const out = {};
  for (const etat of ETATS) {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `.ds-text-input[data-etat="${etat}"] input` });
    if (!nodeId) continue;
    const { node } = await cdp.send('DOM.describeNode', { nodeId, depth: -1, pierce: true });
    /** @type {number[]} */
    const trouves = [];
    const parcourir = (/** @type {any} */ x) => {
      if ((x.attributes ?? []).includes('-webkit-input-placeholder')) trouves.push(x.backendNodeId);
      for (const k of [...(x.children ?? []), ...(x.shadowRoots ?? [])]) parcourir(k);
    };
    parcourir(node);
    if (!trouves.length) continue;
    const { nodeIds } = await cdp.send('DOM.pushNodesByBackendIdsToFrontend', { backendNodeIds: trouves });
    const { computedStyle } = await cdp.send('CSS.getComputedStyleForNode', { nodeId: nodeIds[0] });
    const p = (/** @type {string} */ n) => computedStyle.find((x) => x.name === n)?.value;
    out[etat] = `${p('color')} ${p('opacity')}`;
  }
  return out;
}

/**
 * Relevé de la planche du champ dans l'aperçu, thème passé par son nom.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string} theme
 */
async function releve(contexte, base, theme) {
  const { page, erreurs } = await ouvrir(contexte, base, STORY, theme);
  await page.locator('.ds-text-input').first().waitFor({ timeout: 30_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await forcer(page, FORCES);
  const champs = await page.evaluate((BOITE) => {
    const noms = (/** @type {string} */ s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1')).join('|');
    const px = (/** @type {number} */ n) => `${Math.round(n * 100) / 100}px`;
    /** @type {Record<string, any>} */
    const out = {};
    for (const e of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.ds-text-input[data-etat]'))) {
      const f = /** @type {HTMLElement} */ (e.querySelector(BOITE));
      const i = /** @type {HTMLInputElement} */ (e.querySelector('input'));
      const l = /** @type {HTMLElement} */ (e.querySelector('.ds-text-input__label'));
      const fs = getComputedStyle(f);
      const is = getComputedStyle(i);
      const ls = getComputedStyle(l);
      const fr = f.getBoundingClientRect();
      const ir = i.getBoundingClientRect();
      const bord = parseFloat(fs.borderLeftWidth);
      const debutTexte = ir.left + parseFloat(is.paddingLeft);
      const finTexte = ir.right - parseFloat(is.paddingRight);
      const icone = /** @type {HTMLElement | null} */ (e.querySelector('.ds-text-input__icon'));
      const premier = icone ? icone.getBoundingClientRect().left : debutTexte;
      let opacite = 1;
      for (let x = /** @type {HTMLElement | null} */ (i); x && x !== e.parentElement; x = x.parentElement) opacite *= Number(getComputedStyle(x).opacity);
      const message = (/** @type {string} */ sel, /** @type {boolean} */ avecEcart) => {
        const m = /** @type {HTMLElement | null} */ (e.querySelector(sel));
        if (!m) return null;
        const s = getComputedStyle(m);
        const masquee = m.getBoundingClientRect().width <= 1 && s.clipPath === 'inset(50%)';
        return { couleur: s.color, taille: s.fontSize, graisse: s.fontWeight, police: noms(s.fontFamily), ...(masquee ? {} : avecEcart ? { ecart: px(m.getBoundingClientRect().top - fr.bottom) } : {}), masquee };
      };
      const erreur = message('.ds-text-input__error', true);
      if (erreur) delete erreur.masquee;
      const obligatoire = /** @type {HTMLElement | null} */ (e.querySelector('.ds-text-input__required'));
      out[/** @type {string} */ (e.dataset.etat)] = {
        hauteur: px(fr.height),
        rayon: fs.borderTopLeftRadius,
        bord: `${fs.borderTopWidth} ${fs.borderTopColor}`,
        fond: fs.backgroundColor,
        texte: is.color,
        police: noms(is.fontFamily),
        taille: is.fontSize,
        graisse: is.fontWeight,
        marge: `${px(premier - fr.left - bord)}/${px(fr.right - bord - finTexte)}`,
        anneau: fs.outlineStyle === 'none' ? 'none' : `${fs.outlineStyle} ${fs.outlineWidth} ${fs.outlineColor} ${fs.outlineOffset}`,
        opacite: String(opacite),
        natif: i.disabled ? 'disabled' : 'actif',
        libelle: { couleur: ls.color, taille: ls.fontSize, graisse: ls.fontWeight, police: noms(ls.fontFamily) },
        ecartLibelle: px(fr.top - l.getBoundingClientRect().bottom),
        obligatoire: obligatoire ? { texte: obligatoire.textContent, couleur: getComputedStyle(obligatoire).color } : null,
        erreur,
        aide: message('.ds-text-input__hint', !e.querySelector('.ds-text-input__error')),
        icone: icone ? { taille: getComputedStyle(icone).width, ecart: px(debutTexte - icone.getBoundingClientRect().right), muette: icone.getAttribute('aria-hidden') === 'true' } : null,
      };
    }
    const champ = document.querySelector(`[data-cas="alignement-champ"] ${BOITE}`)?.getBoundingClientRect();
    const bouton = document.querySelector('[data-cas="alignement-bouton"]')?.getBoundingClientRect();
    return { out, alignement: champ && bouton ? { champ: [champ.top, champ.bottom, champ.height], bouton: [bouton.top, bouton.bottom, bouton.height] } : null };
  }, BOITE);
  const ex = await exemples(page);
  for (const [etat, m] of Object.entries(champs.out)) m.exemple = ex[etat] ?? null;
  const image = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await page.close();
  return { champs: champs.out, alignement: champs.alignement, image, erreurs };
}

/** Ordre de tabulation attendu dans la story Clavier : le champ désactivé est sauté. */
const ORDRE_CLAVIER = ['nom', 'courriel', 'recherche', 'envoyer'];
/** Arbre d'accessibilité attendu de chaque champ de la story Clavier. */
const ARBRE_CLAVIER = {
  nom: { role: 'textbox', nom: 'Nom (obligatoire)', description: 'Tel qu\'il paraît sur la carte.', invalide: false, requis: true, desactive: false },
  courriel: { role: 'textbox', nom: 'Adresse électronique', description: 'Adresse sans arobase. Par exemple nom@exemple.fr.', invalide: true, requis: false, desactive: false },
  identifiant: { role: 'textbox', nom: 'Identifiant', description: 'Attribué à l\'inscription.', invalide: false, requis: false, desactive: true },
  recherche: { role: 'searchbox', nom: 'Rechercher', description: '', invalide: false, requis: false, desactive: false },
};
/** Erreurs attendues des stories de refus. */
const REFUS = {
  'refus-sans-libelle': 'DsTextInput : label : obligatoire',
  'refus-type': 'DsTextInput : type : valeur inconnue : tel (text, email, search, password)',
  'refus-attribut': 'DsTextInput : attribut refusé : variant',
  'refus-description': 'DsTextInput : attribut refusé : aria-describedby',
};

/**
 * Nœud de l'arbre d'accessibilité de l'input d'un champ : rôle, nom, description, invalide, requis, désactivé.
 * @param {import('playwright-core').Page} page @param {string} cas
 */
async function arbre(page, cas) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('Accessibility.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-cas="${cas}"] input` });
  const { nodes } = /** @type {any} */ (await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false }));
  const n = nodes[0];
  const prop = (/** @type {string} */ k) => n.properties?.find((/** @type {any} */ p) => p.name === k)?.value?.value;
  await cdp.detach();
  return { role: n.role?.value, nom: n.name?.value ?? '', description: n.description?.value ?? '', invalide: prop('invalid') === 'true', requis: prop('required') === true, desactive: prop('disabled') === true };
}

/**
 * Clavier et lecteur d'écran, sur un thème. Rend des [ok, ligne].
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {{ nom: string, variables: Record<string, string> }} t
 */
async function clavier(contexte, base, t) {
  /** @type {[boolean, string][]} */
  const out = [];
  const { page, erreurs } = await ouvrir(contexte, base, 'composants-dstextinput--clavier', t.nom);
  await page.locator('.ds-text-input').first().waitFor();
  const cas = () => page.evaluate(() => /** @type {HTMLElement | null} */ (document.activeElement?.closest('[data-cas]'))?.dataset.cas ?? document.activeElement?.tagName ?? null);
  const journal = async () => JSON.parse((await page.locator('[data-journal]').textContent()) ?? '{}');

  const arbres = Object.fromEntries(await Promise.all(Object.keys(ARBRE_CLAVIER).map(async (k) => [k, await arbre(page, k)])));
  out.push([JSON.stringify(arbres) === JSON.stringify(ARBRE_CLAVIER), `${t.nom}, arbre d'accessibilité des champs : ${Object.entries(arbres).map(([k, a]) => `${k} ${a.role} « ${a.nom} », « ${a.description} »${a.invalide ? ', invalide' : ''}${a.requis ? ', requis' : ''}${a.desactive ? ', désactivé' : ''}`).join(' ; ')}`]);
  const alertes = await page.locator('[role="alert"]').count();
  const icone = await page.locator('[data-cas="recherche"] .ds-text-input__icon[aria-hidden="true"]').count();
  const natif = await page.locator('[data-cas="identifiant"] input[disabled]').count();
  const auto = await page.locator('[data-cas="nom"] input').getAttribute('autocomplete');
  out.push([alertes === 0 && icone === 1 && natif === 1 && auto === 'name', `${t.nom}, ${alertes} zone d'alerte, icône muette ${icone === 1 ? 'oui' : 'non'}, désactivé natif ${natif === 1 ? 'oui' : 'non'}, autocomplete « ${auto} »`]);

  /** @type {(string | null)[]} */
  const ordre = [];
  for (let i = 0; i < ORDRE_CLAVIER.length; i++) {
    await page.keyboard.press('Tab');
    ordre.push(await cas());
  }
  out.push([JSON.stringify(ordre) === JSON.stringify(ORDRE_CLAVIER), `${t.nom}, tabulation des champs : ${ordre.join(' → ')}`]);

  // Anneau au focus clavier sur le champ en erreur : l'anneau des jetons, et le contour d'erreur reste.
  await page.locator('[data-cas="nom"] input').focus();
  await page.keyboard.press('Tab');
  const focus = await page.locator(`[data-cas="courriel"] ${BOITE}`).evaluate((e) => {
    const s = getComputedStyle(e);
    return { anneau: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} ${s.outlineOffset}`, bord: s.borderTopColor };
  });
  const v = t.variables;
  const attendu = `solid ${v['ds-border-width-focus']} ${css(v['ds-focus'])} ${v['ds-offset-focus']}`;
  out.push([focus.anneau === attendu && focus.bord === css(v['ds-border-error']), `${t.nom}, focus clavier du champ en erreur : ${focus.anneau} (jetons ${attendu}), contour ${focus.bord}`]);

  // Valeur tapée émise, puis envoi par Entrée : le désactivé ne part pas.
  await page.locator('[data-cas="nom"] input').focus();
  await page.keyboard.type('Ada');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => JSON.parse(document.querySelector('[data-journal]')?.textContent ?? '{}').envoi !== null, null, { timeout: 5_000 }).catch(() => {});
  const j = await journal();
  out.push([j.nom === 'Ada' && JSON.stringify(j.envoi) === JSON.stringify(['nom', 'courriel', 'recherche']), `${t.nom}, valeur tapée « ${j.nom} », envoyé : ${JSON.stringify(j.envoi)}`]);
  out.push([erreurs.length === 0, `${t.nom}, story Clavier du champ : ${erreurs.length} erreur(s)${erreurs.length ? ` (${erreurs.join(' ; ')})` : ''}`]);
  await page.close();

  for (const [story, message] of Object.entries(REFUS)) out.push(await refus(contexte, base, `composants-dstextinput--${story}`, t.nom, message, '.ds-text-input', 'champ'));
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
 * Preuve du champ, sur tous les thèmes puis, par version (développement, construite), sur le premier.
 * @param {{ themes: any[], contexte: import('playwright-core').BrowserContext, developpement: { base: string },
 *   construite: { base: string }, verifier: (ok: boolean, ligne: string) => void }} p
 */
export async function preuveChamp({ themes, contexte, developpement, construite, verifier }) {
  for (const t of themes) {
    const attendu = attenduChamps(t);
    const dev = await releve(contexte, developpement.base, t.nom);
    const bld = await releve(contexte, construite.base, t.nom);
    for (const [mode, r] of /** @type {const} */ ([['développement', dev], ['construite', bld]])) {
      const e = ecarts(attendu, r.champs);
      const n = Object.keys(r.champs).length;
      verifier(e.length === 0 && n === attendu.size && r.erreurs.length === 0, `${t.nom}, ${mode}, planche du champ : ${n} champs sur ${attendu.size}${e.length ? `, ${e.length} écart(s) : ${e.slice(0, 4).join(' ; ')}` : ', contour, fond, dimensions, textes et messages égaux aux jetons dans chaque état'}${r.erreurs.length ? `, ${r.erreurs.join(' ; ')}` : ''}`);
    }
    const a = bld.alignement;
    const h = t.variables['ds-height-control-medium'];
    const aligne = a !== null && `${a.champ[2]}px` === h && `${a.bouton[2]}px` === h && a.champ[0] === a.bouton[0] && a.champ[1] === a.bouton[1];
    verifier(aligne, `${t.nom}, champ + bouton normal : ${a ? `champ ${a.champ[2]} px (${a.champ[0]} à ${a.champ[1]}), bouton ${a.bouton[2]} px (${a.bouton[0]} à ${a.bouton[1]})` : 'ligne absente'}`);
    mkdirSync(CAPTURES, { recursive: true });
    writeFileSync(join(CAPTURES, `champ-${t.nom}.png`), bld.image);
    const px = ecart(dev.image, bld.image);
    verifier(px === 0, `${t.nom}, champ : développement et construite, ${px} pixel(s) différent(s)`);
  }
  for (const [mode, base] of [['développement', developpement.base], ['construite', construite.base]])
    for (const [ok, ligne] of await clavier(contexte, base, themes[0])) verifier(ok, `${mode}, ${ligne}`);
  return CAPTURES;
}
