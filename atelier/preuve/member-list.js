// Preuve de MemberList, module de l'annuaire. Sur chaque thème de chaque marque, sur la liste des dix membres fictifs
// rendue par Storybook, la page à 1 280 px puis à 360 px de large : une colonne, dans l'ordre des données, à l'écart
// entre composants ; large, la liste prend la largeur de colonne ; étroite, toute la largeur de son parent ; rien ne
// déborde de la page ; aucune valeur en dur (écart et largeur égaux aux variables du thème) ; le rendu est le même en
// développement et en version construite. Les planches de la version construite sont enregistrées par thème et par
// largeur dans local/carte-membre-liste-captures/, hors dépôt. Sur le premier thème : une liste nommée par le titre de
// la page, de dix éléments, chacun un titre de niveau 3 qui porte un lien nommé par le nom seul, aucune image ; dix
// haltes de la touche Tab, une par membre, dans l'ordre ; la liste vide qui ne rend rien ; les refus.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ecart, ouvrir, refus } from './commun.js';
import { CAPTURES } from './member-card.js';

const STORY = 'modules-memberlist';
/** Largeurs de la page des planches, en px. */
const LARGEURS = [1280, 360];
/** Membres de la liste, dans l'ordre des données : cas, nom, lien. Écrit à la main d'après atelier/stories/membres.js. */
const MEMBRES = [
  ['photo', 'Camille Ferrand', '#membre-camille-ferrand'],
  ['photo-deux', 'Jean-Baptiste Morel', '#membre-jean-baptiste-morel'],
  ['sans-photo', "Inès d'Aubrac", '#membre-ines-d-aubrac'],
  ['photo-trois', 'Hugo de Lassalle', '#membre-hugo-de-lassalle'],
  ['photo-en-echec', 'Émile Brun', '#membre-emile-brun'],
  ['sans-tag', 'Noé', '#membre-noe'],
  ['sans-promo', 'Marie-Lou', '#membre-marie-lou'],
  ['nom-long', "Marie-Amélie de Lassalle-Vernadet d'Aubrac", '#membre-marie-amelie-de-lassalle-vernadet-d-aubrac'],
  ['huit-tags', 'Ana María Ruiz Soler', '#membre-ana-maria-ruiz-soler'],
  ['tag-long', 'Lucas Perrin', '#membre-lucas-perrin'],
];
/** Erreurs attendues des stories de refus. */
const REFUS = {
  'refus-sans-membres': 'MemberList : members : obligatoire',
  'refus-membre-sans-nom': 'MemberList : members : 3 : name : obligatoire',
  'refus-ton-du-membre': 'MemberList : members : 2 : tags : 1 : tone : valeur inconnue : accent (neutral, brand)',
  'refus-niveau-du-membre': 'MemberList : members : 2 : headingLevel : donné par la liste',
  'refus-niveau': 'MemberList : headingLevel : valeur inconnue : 5 (2, 3, 4)',
  'refus-nom-a-la-main': 'MemberList : attribut refusé : aria-label',
  'refus-ecouteur': 'MemberList : attribut refusé : onClick',
  'refus-slot': 'MemberList : slot refusé : default',
};

/**
 * Relevé de la liste dans l'aperçu, thème passé par son nom, page à la largeur donnée.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string} theme @param {number} largeur
 */
async function releve(contexte, base, theme, largeur) {
  const { page, erreurs } = await ouvrir(contexte, base, `${STORY}--liste`, theme);
  await page.setViewportSize({ width: largeur, height: 800 });
  await page.locator('.member-list').waitFor({ timeout: 30_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  const vu = await page.evaluate(() => {
    const px = (/** @type {number} */ n) => `${Math.round(n * 1000) / 1000}px`;
    const ul = /** @type {HTMLElement | null} */ (document.querySelector('.member-list'));
    if (!ul) return null;
    const parent = /** @type {HTMLElement} */ (ul.parentElement);
    const ps = getComputedStyle(parent);
    const items = [...ul.children].map((li) => li.getBoundingClientRect());
    const ecarts = items.slice(1).map((b, i) => px(b.top - items[i].bottom));
    const s = getComputedStyle(ul);
    return {
      role: ul.getAttribute('role'),
      largeur: px(ul.getBoundingClientRect().width),
      parent: px(parent.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight)),
      ecarts: [...new Set(ecarts)],
      colonne: items.every((b) => Math.abs(b.left - items[0].left) < 0.5 && Math.abs(b.width - items[0].width) < 0.5),
      cartes: items.every((b) => Math.abs(b.width - ul.getBoundingClientRect().width) < 0.5),
      ordre: [...ul.querySelectorAll(':scope > li > .ds-card')].map((c) => /** @type {HTMLElement} */ (c).dataset.cas),
      puces: s.listStyleType,
      marge: `${s.marginTop} ${s.paddingLeft}`,
      deborde: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  const image = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await page.close();
  return { vu, image, erreurs };
}

/**
 * Écarts entre le relevé et l'attendu d'une largeur de page.
 * @param {any} vu @param {Record<string, string>} v variables du thème @param {number} largeur
 */
function ecarts(vu, v, largeur) {
  if (!vu) return ['liste absente'];
  /** @type {string[]} */
  const e = [];
  // Large, la largeur de colonne ; étroite, toute la largeur du parent. Les planches visent les deux cas.
  const colonne = parseFloat(v['ds-largeur-colonne']) < parseFloat(vu.parent);
  const attendue = colonne ? v['ds-largeur-colonne'] : vu.parent;
  if (vu.largeur !== attendue) e.push(`largeur ${vu.largeur} (attendu ${attendue})`);
  if (colonne !== (largeur === LARGEURS[0])) e.push(`à ${largeur} px, parent de ${vu.parent}`);
  if (JSON.stringify(vu.ecarts) !== JSON.stringify([v['ds-ecart-entre-composants']])) e.push(`écarts ${vu.ecarts.join(', ')} (attendu ${v['ds-ecart-entre-composants']})`);
  if (!vu.colonne || !vu.cartes) e.push('pas une colonne de cartes pleine largeur');
  if (JSON.stringify(vu.ordre) !== JSON.stringify(MEMBRES.map(([c]) => c))) e.push(`ordre ${vu.ordre.join(', ')}`);
  if (vu.role !== 'list' || vu.puces !== 'none' || vu.marge !== '0px 0px') e.push(`liste ${vu.role}, puces ${vu.puces}, marge ${vu.marge}`);
  if (vu.deborde) e.push('la page défile en largeur');
  return e;
}

/**
 * Arbre d'accessibilité, clavier, liste vide et refus, sur un thème. Rend des [ok, ligne].
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {{ nom: string }} t
 */
async function clavier(contexte, base, t) {
  /** @type {[boolean, string][]} */
  const out = [];
  const { page, erreurs } = await ouvrir(contexte, base, `${STORY}--clavier`, t.nom);
  await page.locator('.member-list').waitFor();

  // Une liste nommée par le titre de la page, dix éléments ; dans chacun, un titre de niveau 3 qui porte un lien nommé
  // par le nom seul, aucune image.
  const liste = page.getByRole('list', { name: 'Annuaire', exact: true });
  const n = await liste.count();
  const items = await liste.locator(':scope > li').count();
  const lus = [];
  for (const [i, [, nom]] of MEMBRES.entries()) {
    const li = liste.locator(':scope > li').nth(i);
    const titre = li.getByRole('heading', { level: 3 });
    const lien = await titre.getByRole('link', { name: nom, exact: true }).count();
    const images = await li.getByRole('img').count();
    lus.push(`${(await titre.count()) === 1 && lien === 1 && images === 0 ? '✓' : '✗'} ${nom}`);
  }
  const arbre = await liste.ariaSnapshot();
  const ok = n === 1 && items === MEMBRES.length && lus.every((x) => x.startsWith('✓'));
  out.push([ok, `${t.nom}, arbre de MemberList : liste « Annuaire » ${n}, ${items} éléments ; ${lus.join(' ; ')}`]);
  writeFileSync(join(CAPTURES, 'member-list-arbre.txt'), `${arbre}\n`);

  // Dix haltes de Tab, une par membre, sur son lien, dans l'ordre ; puis le bouton d'après.
  await page.locator('[data-cas="avant"]').focus();
  /** @type {(string | null)[]} */
  const ordre = [];
  for (let i = 0; i <= MEMBRES.length; i++) {
    await page.keyboard.press('Tab');
    ordre.push(await page.evaluate(() => (document.activeElement?.matches('a') ? document.activeElement.getAttribute('href') : /** @type {HTMLElement | null} */ (document.activeElement?.closest('[data-cas]'))?.dataset.cas ?? null)));
  }
  const attendu = [...MEMBRES.map(([, , href]) => href), 'apres'];
  out.push([JSON.stringify(ordre) === JSON.stringify(attendu), `${t.nom}, tabulation de MemberList : ${ordre.join(' → ')}`]);
  writeFileSync(join(CAPTURES, 'member-list-tabulation.txt'), `${['avant', ...ordre].join('\n')}\n`);
  out.push([erreurs.length === 0, `${t.nom}, story Clavier de MemberList : ${erreurs.length} erreur(s)${erreurs.length ? ` (${erreurs.join(' ; ')})` : ''}`]);
  await page.close();

  // Liste vide : rien de rendu, aucune liste dans l'arbre.
  const vide = await ouvrir(contexte, base, `${STORY}--vide`, t.nom);
  await vide.page.locator('#titre-annuaire').waitFor();
  // Dans la page de la story : l'aperçu de Storybook porte ses propres listes, cachées.
  const ul = await vide.page.locator('main ul').count();
  const listes = await vide.page.locator('main').getByRole('list').count();
  out.push([ul === 0 && listes === 0 && vide.erreurs.length === 0, `${t.nom}, liste vide : ${ul} ul, ${listes} liste dans l'arbre, ${vide.erreurs.length} erreur(s)`]);
  await vide.page.close();

  for (const [story, message] of Object.entries(REFUS)) out.push(await refus(contexte, base, `${STORY}--${story}`, t.nom, message, '.ds-card', 'membre'));
  return out;
}

/**
 * Preuve de MemberList, sur tous les thèmes puis, par version (développement, construite), sur le premier.
 * @param {{ themes: any[], contexte: import('playwright-core').BrowserContext, developpement: { base: string },
 *   construite: { base: string }, verifier: (ok: boolean, ligne: string) => void }} p
 */
export async function preuveMemberList({ themes, contexte, developpement, construite, verifier }) {
  mkdirSync(CAPTURES, { recursive: true });
  for (const t of themes) {
    for (const largeur of LARGEURS) {
      const dev = await releve(contexte, developpement.base, t.nom, largeur);
      const bld = await releve(contexte, construite.base, t.nom, largeur);
      for (const [mode, r] of /** @type {const} */ ([['développement', dev], ['construite', bld]])) {
        const e = ecarts(r.vu, t.variables, largeur);
        verifier(e.length === 0 && r.erreurs.length === 0, `${t.nom}, ${mode}, MemberList à ${largeur} px : ${r.vu ? `largeur ${r.vu.largeur}` : 'absente'}${e.length ? `, ${e.length} écart(s) : ${e.join(' ; ')}` : ', une colonne de dix dans l\'ordre, écart et largeur égaux aux jetons, rien ne déborde'}${r.erreurs.length ? `, ${r.erreurs.join(' ; ')}` : ''}`);
      }
      writeFileSync(join(CAPTURES, `member-list-${largeur}-${t.nom}.png`), bld.image);
      const d = ecart(dev.image, bld.image);
      verifier(d === 0, `${t.nom}, MemberList à ${largeur} px : développement et construite, ${d} pixel(s) différent(s)`);
    }
  }
  for (const [mode, base] of [['développement', developpement.base], ['construite', construite.base]])
    for (const [ok, ligne] of await clavier(contexte, base, themes[0])) verifier(ok, `${mode}, ${ligne}`);
  return CAPTURES;
}
