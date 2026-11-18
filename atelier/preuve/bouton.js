// Preuve du bouton (D43). Sur chaque thème de chaque marque, sur la planche du bouton rendue par Storybook : le bouton
// principal a le fond, le texte et les polices des jetons, Vuetify n'a calculé aucun texte, les variables des enveloppes
// (--v-ds-*) sont celles des jetons, chaque variante et taille a, dans chaque état, les couleurs, l'anneau et les
// dimensions des jetons (survol et focus forcés par le protocole DevTools), et le rendu est le même en développement et
// en version construite. La planche de la version construite est enregistrée par thème dans local/bouton-captures/, hors
// dépôt, pour être jugée sur image. Sur le premier thème, clavier et lecteur d'écran : ordre de tabulation, inactifs
// muets au clavier, à la souris et par envoi implicite, chargement qui garde le focus et s'annonce, anneau au focus
// clavier, arbre d'accessibilité, pleine largeur, refus d'un usage hors du menu. Le sélecteur de thème et le refus d'un
// thème inconnu sont jugés ici, sur la planche du bouton.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CADRE, LOCAL, TRANSPARENT, VARIABLES_VUETIFY, css, ecart, forcer, noms, ouvrir, refus } from './commun.js';

const STORY = 'composants-bouton--planche';
/** Planches enregistrées, hors dépôt. */
const CAPTURES = join(LOCAL, 'bouton-captures');
/** Le bouton principal de la planche, au repos, de taille normale. */
const PRINCIPAL = '.ds-bouton[data-variante="principal"][data-taille="normale"][data-etat="repos"]';
/** États que la preuve force sur les boutons de leur colonne. */
const FORCES = { survol: ['hover'], focus: ['focus', 'focus-visible'] };

/**
 * Mesures attendues de chaque bouton de la planche, par « variante|taille|état », au format de getComputedStyle.
 * Couleurs : clés de la table (fond et texte de chaque couleur) ; traits et dimensions : variables de la table.
 * @param {(k: string) => { fond: string, texte: string }} c couleur de la table, en r,g,b
 * @param {Record<string, string>} v variables de la table, au format de variable()
 * @param {string[]} police noms de la police du libellé (D44)
 */
function attenduBoutons(c, v, police) {
  /** Variante → [couleur au repos, couleur au survol, fond transparent au repos]. */
  const VARIANTES = {
    principal: ['primary', 'primary-darken-1', false],
    secondaire: ['surface', 'composant-survol', false],
    discret: ['interactif-discret', 'interactif-discret', true],
    danger: ['error', 'erreur-fort-survol', false],
    'danger-discret': ['erreur-discret', 'erreur-discret', true],
  };
  /** @type {Map<string, Record<string, string>>} */
  const out = new Map();
  for (const [variante, [repos, survol, discret]] of Object.entries(VARIANTES))
    for (const taille of ['normale', 'petite'])
      for (const etat of ['repos', 'survol', 'focus', 'désactivé', 'chargement']) {
        const desactive = etat === 'désactivé';
        const couleur = desactive ? 'desactive' : etat === 'survol' ? survol : repos;
        const transparent = discret && (etat !== 'survol');
        out.set(`${variante}|${taille}|${etat}`, {
          fond: transparent ? TRANSPARENT : css(c(couleur).fond),
          texte: css(c(couleur).texte),
          ...(variante === 'secondaire' ? { contour: `${v['ds-epaisseur-contour']} ${css(v[desactive ? 'ds-contour-desactive' : 'ds-contour'])}` } : {}),
          anneau: etat === 'focus' ? `solid ${v['ds-epaisseur-focus']} ${css(v['ds-focus'])} ${v['ds-decalage-focus']}` : 'none',
          hauteur: v[`ds-hauteur-controle-${taille}`],
          rayon: v['ds-arrondi-controle'],
          marge: v['ds-marge-interieure-composant'],
          taille: v['ds-libelle-taille'],
          graisse: v['ds-libelle-graisse'],
          police: police.join('|'),
          icone: v[`ds-taille-icone-${taille}`],
          ecart: v['ds-ecart-icone-texte'],
        });
      }
  return out;
}

/**
 * Force un état CSS (survol, focus) sur les boutons de sa colonne de la planche.
 * @param {import('playwright-core').Page} page
 */
const forcerEtats = (page) => forcer(page, Object.fromEntries(Object.entries(FORCES).map(([etat, classes]) => [`.ds-bouton[data-etat="${etat}"]`, classes])));

/**
 * Relevé de la planche du bouton dans l'aperçu, thème passé par son nom.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string | null} theme
 */
async function releve(contexte, base, theme) {
  const page = await contexte.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  await page.goto(`${base}/iframe.html?id=${STORY}&viewMode=story${theme === null ? '' : `&globals=theme:${theme}`}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('.ds-bouton') || document.body.classList.contains('sb-show-errordisplay'), null, { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  const m = await page.evaluate((PRINCIPAL) => {
    const hex = (/** @type {string} */ c) => '#' + (c.match(/\d+/g) ?? []).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
    const app = document.querySelector('.v-application');
    const b = document.querySelector(PRINCIPAL);
    const classe = app ? [...app.classList].find((c) => c.startsWith('v-theme--')) ?? null : null;
    /** Couleurs écrites par Vuetify pour le thème posé : --v-theme-<clé>, hors multiplicateurs d'opacité. */
    const couleurs = {};
    /** Variables du bouton écrites par Vuetify pour le thème posé : --v-ds-<clé>. */
    const variables = {};
    const feuille = /** @type {HTMLStyleElement | null} */ (document.getElementById('vuetify-theme-stylesheet'));
    const parcourir = (/** @type {CSSRuleList} */ regles) => {
      for (const r of regles) {
        if ('cssRules' in r && !(r instanceof CSSStyleRule)) parcourir(/** @type {CSSGroupingRule} */ (r).cssRules);
        else if (r instanceof CSSStyleRule && classe && r.selectorText === `.${classe}`)
          for (const p of r.style)
            if (p.startsWith('--v-theme-') && !p.endsWith('-overlay-multiplier')) couleurs[p.slice('--v-theme-'.length)] = r.style.getPropertyValue(p).replace(/\s/g, '');
            else if (p.startsWith('--v-ds-')) variables[p.slice('--v-'.length)] = r.style.getPropertyValue(p).replace(/\s/g, '');
      }
    };
    if (feuille?.sheet) parcourir(feuille.sheet.cssRules);
    return {
      classe,
      erreur: document.body.classList.contains('sb-show-errordisplay') ? (document.querySelector('#error-message')?.textContent ?? '').trim() : null,
      fond: b ? hex(getComputedStyle(b).backgroundColor) : null,
      texte: b ? hex(getComputedStyle(b).color) : null,
      police: b ? getComputedStyle(b).fontFamily : null,
      page: app ? hex(getComputedStyle(app).backgroundColor) : null,
      titre: app ? getComputedStyle(app).getPropertyValue('--v-font-heading').trim() : null,
      corps: app ? getComputedStyle(app).getPropertyValue('--v-font-body').trim() : null,
      etire: b ? b.getBoundingClientRect().width >= /** @type {HTMLElement} */ (b.parentElement).getBoundingClientRect().width : null,
      couleurs,
      variables,
    };
  }, PRINCIPAL);
  /** @type {Record<string, Record<string, string>>} */
  let boutons = {};
  if (m.erreur === null) {
    await forcerEtats(page);
    boutons = await page.evaluate(() => {
      /** @type {Record<string, Record<string, string>>} */
      const out = {};
      for (const e of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.ds-bouton[data-etat]'))) {
        const s = getComputedStyle(e);
        const icone = e.querySelector('.ds-bouton__icone');
        const texte = e.querySelector('.ds-bouton__texte');
        out[`${e.dataset.variante}|${e.dataset.taille}|${e.dataset.etat}`] = {
          fond: s.backgroundColor,
          texte: s.color,
          ...(e.dataset.variante === 'secondaire' ? { contour: `${s.borderTopWidth} ${s.borderTopColor}` } : {}),
          anneau: s.outlineStyle === 'none' ? 'none' : `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} ${s.outlineOffset}`,
          hauteur: s.height,
          rayon: s.borderTopLeftRadius,
          marge: s.paddingLeft === s.paddingRight ? s.paddingLeft : `${s.paddingLeft}/${s.paddingRight}`,
          taille: s.fontSize,
          graisse: s.fontWeight,
          police: s.fontFamily.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1')).join('|'),
          icone: icone ? getComputedStyle(icone).width : 'absente',
          // Écart mesuré à l'écran, du bord droit de l'icône au bord gauche du texte.
          ecart: icone && texte ? `${Math.round((texte.getBoundingClientRect().left - icone.getBoundingClientRect().right) * 100) / 100}px` : 'absent',
        };
      }
      return out;
    });
  }
  // Roues de chargement arrêtées (animations disabled), pour que deux captures du même état coïncident.
  const image = m.erreur === null ? await page.screenshot({ fullPage: true, animations: 'disabled' }) : null;
  await page.close();
  const couleurs = Object.fromEntries(Object.entries(m.couleurs).filter(([k]) => !VARIABLES_VUETIFY.includes(k)).sort(([a], [b]) => (a < b ? -1 : 1)));
  const variables = Object.fromEntries(Object.entries(m.variables).sort(([a], [b]) => (a < b ? -1 : 1)));
  return { ...m, couleurs, variables, boutons, image, erreurs };
}

/**
 * Le sélecteur de la barre : ses entrées, et un changement de thème par un clic, sans recharger la story.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {{ nom: string, titre: string }[]} themes
 */
async function selecteur(contexte, base, themes) {
  const page = await contexte.newPage();
  await page.setViewportSize({ width: 1000, height: 700 });
  await page.goto(`${base}/?path=/story/${STORY}`, { waitUntil: 'networkidle' });
  const apercu = page.frameLocator('#storybook-preview-iframe');
  await apercu.locator('.ds-bouton').first().waitFor();
  await page.getByRole('button', { name: 'Thème Vuetify : marque et mode' }).click();
  const entrees = (await page.getByRole('option').allTextContents()).map((t) => t.trim());
  const cible = themes[themes.length - 1];
  await page.getByRole('option', { name: cible.titre, exact: true }).click();
  await apercu.locator(`.v-application.v-theme--${cible.nom}`).waitFor({ timeout: 10_000 }).catch(() => {});
  const classe = await apercu.locator('.v-application').getAttribute('class');
  await page.close();
  return { entrees, cible: cible.nom, atteint: (classe ?? '').split(/\s+/).includes(`v-theme--${cible.nom}`) };
}

/** Ordre de tabulation attendu dans la story Clavier : désactivé et chargement restent atteignables. */
const ORDRE_CLAVIER = ['champ-attente', 'chargement', 'champ-actif', 'envoi', 'desactive', 'bascule'];
/** Arbre d'accessibilité attendu de chaque bouton de la story Clavier : aria-disabled lu comme désactivé, icône muette. */
const ARBRE_CLAVIER = { chargement: '- button "Envoyer" [disabled]', envoi: '- button "Ajouter"', desactive: '- button "Supprimer" [disabled]', bascule: '- button "Commander"' };
const ANNONCE = 'Chargement en cours';
/** Erreurs attendues des stories de refus. */
const REFUS = { 'refus-envoi': 'bouton : désactivé refusé sur type=submit', 'refus-attribut': 'bouton : attribut refusé : color' };

/**
 * Clavier et lecteur d'écran, sur un thème : ordre de tabulation, activation au clavier et à la souris, envoi implicite
 * d'un formulaire, chargement qui garde le focus et s'annonce, anneau au focus clavier, arbre d'accessibilité, pleine
 * largeur, refus. Rend des [ok, ligne].
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {{ nom: string, variables: Record<string, string> }} t
 */
async function clavier(contexte, base, t) {
  /** @type {[boolean, string][]} */
  const out = [];
  const { page, erreurs } = await ouvrir(contexte, base, 'composants-bouton--clavier', t.nom);
  await page.locator('.ds-bouton').first().waitFor();
  const bouton = (/** @type {string} */ cas) => page.locator(`[data-cas="${cas}"]`);
  const actif = () => page.evaluate(() => /** @type {HTMLElement | null} */ (document.activeElement)?.dataset?.cas ?? document.activeElement?.tagName ?? null);
  const journal = async () => JSON.parse((await page.locator('[data-journal]').textContent()) ?? '{}');
  const attr = (/** @type {string} */ cas, /** @type {string} */ a) => bouton(cas).getAttribute(a);

  // Arbre d'accessibilité, avant toute action ; aucune roue n'y paraît.
  const arbres = Object.fromEntries(await Promise.all(Object.keys(ARBRE_CLAVIER).map(async (cas) => [cas, await bouton(cas).ariaSnapshot()])));
  const progres = await page.locator('[role="progressbar"]').count();
  out.push([JSON.stringify(arbres) === JSON.stringify(ARBRE_CLAVIER) && progres === 0, `${t.nom}, arbre d'accessibilité : ${Object.values(arbres).join(' ; ')} ; ${progres} progressbar`]);
  const statut = await bouton('chargement').evaluate((e) => [e.nextElementSibling?.getAttribute('role'), e.nextElementSibling?.textContent]);
  out.push([statut[0] === 'status' && statut[1] === ANNONCE, `${t.nom}, chargement annoncé : zone ${statut[0]}, « ${statut[1]} »`]);
  const natifs = await page.locator('.ds-bouton[disabled]').count();
  out.push([natifs === 0 && (await attr('desactive', 'aria-disabled')) === 'true' && (await attr('chargement', 'aria-disabled')) === 'true' && (await attr('chargement', 'aria-busy')) === 'true', `${t.nom}, désactivé et chargement : aria-disabled, aria-busy en chargement, ${natifs} attribut disabled natif`]);

  // Ordre de tabulation, puis anneau au focus clavier.
  /** @type {(string | null)[]} */
  const ordre = [];
  for (let i = 0; i < ORDRE_CLAVIER.length; i++) {
    await page.keyboard.press('Tab');
    ordre.push(await actif());
  }
  out.push([JSON.stringify(ordre) === JSON.stringify(ORDRE_CLAVIER), `${t.nom}, tabulation : ${ordre.join(' → ')}`]);
  const anneau = await bouton('bascule').evaluate((e) => {
    const s = getComputedStyle(e);
    return { visible: e.matches(':focus-visible'), anneau: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} ${s.outlineOffset}` };
  });
  const attendu = `solid ${t.variables['ds-epaisseur-focus']} rgb(${t.variables['ds-focus'].split(',').join(', ')}) ${t.variables['ds-decalage-focus']}`;
  out.push([anneau.visible && anneau.anneau === attendu, `${t.nom}, focus au clavier : ${anneau.anneau} (jetons ${attendu})`]);

  // Inactifs : ni clic émis ni envoi, au clavier, à la souris et par envoi implicite (Entrée dans un champ).
  await bouton('champ-attente').focus();
  await page.keyboard.press('Enter');
  for (const cas of ['chargement', 'desactive']) {
    await bouton(cas).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    const b = await bouton(cas).boundingBox();
    if (b) await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  }
  // Témoin : le formulaire actif s'envoie, par Entrée dans son champ, et son bouton émet le clic.
  await bouton('champ-actif').focus();
  await page.keyboard.press('Enter');
  const j1 = await journal();
  out.push([JSON.stringify(j1) === JSON.stringify({ clics: ['envoi'], envois: { attente: 0, actif: 1 } }), `${t.nom}, inactifs muets au clavier et à la souris, envoi implicite bloqué ; le formulaire actif s'envoie : ${JSON.stringify(j1)}`]);

  // Activation qui met en chargement : le focus reste, la largeur et le nom aussi, le chargement s'annonce ; une
  // seconde activation n'émet rien.
  await bouton('bascule').focus();
  const avant = await bouton('bascule').evaluate((e) => e.getBoundingClientRect().width);
  await page.keyboard.press('Enter');
  await page.locator('[data-cas="bascule"][aria-busy="true"]').waitFor({ timeout: 5_000 }).catch(() => {});
  await page.keyboard.press('Enter');
  const apres = await bouton('bascule').evaluate((e) => ({ largeur: e.getBoundingClientRect().width, statut: e.nextElementSibling?.textContent }));
  const focus = await actif();
  const nom = await bouton('bascule').ariaSnapshot();
  const j2 = await journal();
  const ok = focus === 'bascule' && apres.largeur === avant && apres.statut === ANNONCE && nom === '- button "Commander" [disabled]' && (await attr('bascule', 'aria-busy')) === 'true' && j2.clics.filter((/** @type {string} */ c) => c === 'bascule').length === 1;
  const activations = j2.clics.filter((/** @type {string} */ c) => c === 'bascule').length;
  out.push([ok, `${t.nom}, activé puis en chargement : focus sur ${focus}, largeur ${avant} → ${apres.largeur}, « ${apres.statut} », ${nom}, ${activations} clic émis pour deux Entrée`]);
  out.push([erreurs.length === 0, `${t.nom}, story Clavier : ${erreurs.length} erreur(s)${erreurs.length ? ` (${erreurs.join(' ; ')})` : ''}`]);
  await page.close();

  // Pleine largeur : le bouton prend la largeur de son parent ; sans l'option, la sienne.
  const l = await ouvrir(contexte, base, 'composants-bouton--largeur', t.nom);
  await l.page.locator('.ds-bouton').first().waitFor();
  const largeurs = await l.page.evaluate(() => {
    const pleine = /** @type {HTMLElement} */ (document.querySelector('[data-cas="pleine"]'));
    const propre = /** @type {HTMLElement} */ (document.querySelector('[data-cas="propre"]'));
    return { parent: /** @type {HTMLElement} */ (pleine.parentElement).getBoundingClientRect().width, pleine: pleine.getBoundingClientRect().width, propre: propre.getBoundingClientRect().width };
  });
  out.push([largeurs.pleine === largeurs.parent && largeurs.propre < largeurs.parent, `${t.nom}, pleine largeur : ${largeurs.pleine} sur ${largeurs.parent} ; sans l'option ${largeurs.propre}`]);
  await l.page.close();

  // Refus : l'erreur qui nomme l'usage, et aucun bouton.
  for (const [story, message] of Object.entries(REFUS)) out.push(await refus(contexte, base, `composants-bouton--${story}`, t.nom, message, '.ds-bouton', 'bouton'));
  return out;
}

/**
 * Preuve du bouton, sur tous les thèmes puis, par version (développement, construite), sur le premier.
 * @param {{ themes: any[], navigateur: import('playwright-core').Browser, contexte: import('playwright-core').BrowserContext,
 *   developpement: { base: string }, construite: { base: string }, verifier: (ok: boolean, ligne: string) => void }} p
 */
export async function preuveBouton({ themes, navigateur, contexte, developpement, construite, verifier }) {
  // Premier chargement du serveur de développement : Vite prépare ses dépendances et peut recharger la page.
  await releve(contexte, developpement.base, themes[0].nom);
  for (const t of themes) {
    const boutons = attenduBoutons((k) => ({ fond: t.couleurs[k], texte: t.couleurs[`on-${k}`] }), t.variables, t.policeLibelle);
    const dev = await releve(contexte, developpement.base, t.nom);
    const bld = await releve(contexte, construite.base, t.nom);
    for (const [mode, r] of [['développement', dev], ['construite', bld]]) {
      const ok =
        r.erreur === null &&
        r.classe === `v-theme--${t.nom}` &&
        r.fond === t.fond &&
        r.texte === t.texte &&
        r.page === t.page &&
        noms(r.police ?? '').join('|') === t.policeLibelle.join('|') &&
        noms(r.corps ?? '').join('|') === t.policeTexte.join('|') &&
        noms(r.titre ?? '').join('|') === t.policeTitre.join('|') &&
        r.etire === false &&
        JSON.stringify(r.couleurs) === JSON.stringify(t.couleurs) &&
        JSON.stringify(r.variables) === JSON.stringify(t.variables) &&
        r.erreurs.length === 0;
      verifier(ok, `${t.nom}, ${mode}, bouton principal : fond ${r.fond} (jeton ${t.fond}), texte ${r.texte} (jeton ${t.texte}), page ${r.page}, libellé ${r.police}, texte ${r.corps}, titres ${r.titre}, ${Object.keys(r.couleurs).length} couleurs du thème${JSON.stringify(r.couleurs) === JSON.stringify(t.couleurs) ? ' égales à la table' : ' différentes de la table'}, ${Object.keys(r.variables).length} variables ds-${JSON.stringify(r.variables) === JSON.stringify(t.variables) ? ' égales aux jetons' : ` différentes des jetons (${JSON.stringify(r.variables)})`}${r.etire ? ', bouton étiré' : ''}${r.erreur ? `, erreur ${r.erreur}` : ''}${r.erreurs.length ? `, ${r.erreurs.join(' ; ')}` : ''}`);
    }
    for (const [mode, r] of [['développement', dev], ['construite', bld]]) {
      const ecarts = [...boutons].flatMap(([cle, attendu]) => {
        const vu = r.boutons[cle];
        if (!vu) return [`${cle} absent`];
        return Object.entries(attendu).flatMap(([k, v]) => (vu[k] === v ? [] : [`${cle} ${k} ${vu[k]} (attendu ${v})`]));
      });
      const n = Object.keys(r.boutons).length;
      verifier(ecarts.length === 0 && n === boutons.size, `${t.nom}, ${mode}, planche : ${n} boutons sur ${boutons.size}${ecarts.length ? `, ${ecarts.length} écart(s) : ${ecarts.slice(0, 6).join(' ; ')}` : ', couleurs, anneau et dimensions égaux aux jetons dans chaque état'}`);
    }
    if (bld.image) {
      mkdirSync(CAPTURES, { recursive: true });
      writeFileSync(join(CAPTURES, `${t.nom}.png`), bld.image);
    }
    const px = dev.image && bld.image ? ecart(dev.image, bld.image) : Infinity;
    verifier(px === 0, `${t.nom} : développement et construite, ${px} pixel(s) différent(s)`);
  }
  for (const [mode, base] of [['développement', developpement.base], ['construite', construite.base]]) {
    for (const nom of ['inexistant', 'light']) {
      const r = await releve(contexte, base, nom);
      verifier(r.erreur === `thème inconnu : ${nom}` && r.fond === null, `${mode} : « ${nom} » refusé (${r.erreur ?? 'aucune erreur'})`);
    }
    for (const schema of /** @type {const} */ (['light', 'dark'])) {
      const c = await navigateur.newContext({ viewport: CADRE, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: schema });
      const r = await releve(c, base, null);
      await c.close();
      verifier(r.classe === `v-theme--${themes[0].nom}`, `${mode}, système ${schema === 'dark' ? 'sombre' : 'clair'}, sans thème : ${r.classe} (premier thème nommé, jamais « system »)`);
    }
    for (const [ok, ligne] of await clavier(contexte, base, themes[0])) verifier(ok, `${mode}, ${ligne}`);
    const s = await selecteur(contexte, base, themes);
    verifier(JSON.stringify(s.entrees) === JSON.stringify(themes.map((t) => t.titre)), `${mode} : sélecteur, ${s.entrees.length} entrées dans l'ordre des marques`);
    verifier(s.atteint, `${mode} : clic sur « ${themes[themes.length - 1].titre} », thème posé sans recharger la story`);
  }
  return CAPTURES;
}
