// @ts-check
/**
 * Verdict par ligne décidée (docs/attendus/verdict-par-decision.md, D39) : sur une page chargée, avant puis après la
 * pose des feuilles ajoutées, chaque ligne décidée de la réduction est-elle arrivée à l'écran, toutes ses
 * déclarations comprises, écrites ou non, dans modifications.json ou hors de lui ?
 *   - avant la pose (releverAvant) : la simulation de la réduction (carte du manifeste) est installée sans être
 *     allumée (scanInPage) ; ses opérations disent, élément par élément et propriété par propriété, ce que chaque ligne
 *     change et la valeur visée (lue sur une sonde) ; la trace dit quelle déclaration tenait la valeur (feuille,
 *     attribut style, bloc <style>…) ; les opérations des conflits sont gelées, comme dans la simulation ; la hauteur
 *     de la page intacte est lue ;
 *   - après la pose (releverApres) : la valeur calculée de chaque opération ; quand elle n'est pas la valeur visée,
 *     ce qui la tient à l'écran (canal : attribut style, bloc de style injecté par un script, variable, raccourci,
 *     autre règle) et ce qu'il faut faire ; la hauteur de la page avec les feuilles ;
 *   - juger : par ligne, sur les pages vérifiées, « arrivée » si chaque opération l'est, « en partie », « non
 *     arrivée », avec le compte en déclarations et en éléments ; « déjà en place » si la valeur visée était là avant
 *     la pose ; sans opération : « non vérifiable (état) » (vue seulement à un état forcé), « hors des pages
 *     vérifiées », « non vue ». Sortie 1 pour en partie, non arrivée, déjà en place, non vue ; 0 sinon.
 * La valeur décide (calculée = visée) ; la règle qui gagne ne sert qu'à nommer le canal.
 * docs/attendus/verify-se-reconnait.md, D40 : transitions et animations sont coupées de la première lecture à la
 * dernière valeur calculée (src/browser/immobile.js), sinon une valeur lue juste après la pose serait celle du départ
 * de la transition ; tokens.css et les feuilles ajoutées, que verify pose dans des <style> qu'il crée, sont reconnus à
 * leur texte et ne sont jamais nommés comme un canal du site ; une déclaration non arrivée a une seule cause, celle du
 * manifeste quand il la connaît (non écrite, hors de modifications.json), avec son « à faire », mot pour mot celui de
 * pertes.md ; sinon celle du canal mesuré ; ce qui la tient reste dit, comme un fait situé.
 */
import { collectSheets } from '../browser/sheets.js';
import { immobiliser, liberer } from '../browser/immobile.js';
import { winner, traceElements } from '../browser/trace.js';
import { scanInPage } from '../browser/simulate.js';
import { ligneDeCle } from '../lib/cles.js';

/**
 * @typedef {{ id: string, titre: string, famille?: string, cles: string[], ancienne: string, nouvelle: string, jeton: string | null, pages: string[], etats?: string[] }} LigneDecidee
 * @typedef {{ rows: string[], sheet: string, line: number, column: number | null, selector: string, property: string, value: string, pages: string[],
 *   ecrite: boolean, cause: string | null, aFaire?: string | null, important: boolean, injectee: boolean }} Declaration  déclaration décidée du manifeste
 * @typedef {{ feuille: string | null, ligne: number, selecteur: string, propriete: string }} DeclarationVisee  feuille null : bloc <style> ou autre origine
 * @typedef {{ lignes: string[], cause: string | null, texte: string, aFaire?: string, declaration?: DeclarationVisee }} Hors  ligne du reste de modifications.json
 * @typedef {{ simulation: Record<string, any> | null, lignes: LigneDecidee[], hors: Hors[], declarations?: Declaration[] }} Manifeste
 * @typedef {{ ecrite: boolean | null, cause: string | null, aFaire: string | null, injectee: boolean }} Annotation  ecrite null : hors de modifications.json ;
 *   cause et aFaire : ceux du manifeste, quand il les connaît
 * @typedef {{ cause: string, categories: string[], texte: string, aFaire: string }} Canal  cause : la seule cause de la déclaration ; texte : ce qui la tient
 * @typedef {{ chemin: string | null, ajout: string | null, sorte: 'fichier' | 'ajout' | 'jetons' | 'script' | 'inséré' | 'page' | 'construite' }} Feuille
 *   ajout : nom de ce que verify a posé (feuille ajoutée, tokens.css)
 * @typedef {{ nom: string, texte: string, sorte: 'ajout' | 'jetons' }} Pose  feuille que verify pose dans un <style> qu'il crée
 * @typedef {{ ligne: string | null, element: number, propriete: string, declaration: string, annotation: Annotation, avant: string, apres: string, visee: string,
 *   canal: Canal | null }} Operation
 * @typedef {{ page: string, hauteurs: { intacte: number, avecFeuilles: number }, ops: Operation[] }} Releve
 * @typedef {'arrivée' | 'en partie' | 'non arrivée' | 'déjà en place' | 'non vue' | 'hors des pages vérifiées' | 'non vérifiable (état)'} Etat
 * @typedef {{ id: string, titre: string, etat: Etat, declarations: { arrivees: number, total: number }, elements: { arrivees: number, total: number },
 *   dejaEnPlace: number, texte: string, details: string[] }} Verdict
 */

/** @param {number} n @param {string} mot */
const nombre = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Hauteur du document (celle d'une capture pleine page). @param {import('playwright-core').Page} page */
async function hauteur(page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const m = /** @type {any} */ (await cdp.send('Page.getLayoutMetrics'));
    return Math.ceil((m.cssContentSize ?? m.contentSize).height);
  } finally {
    await cdp.detach().catch(() => {});
  }
}

/** Chemin d'une feuille : celui de l'adresse pour l'origine de la page, l'adresse sinon. @param {string} href @param {string} origine */
const cheminDe = (href, origine) => {
  const u = new URL(href);
  return u.origin === origine ? u.pathname : u.href;
};

/**
 * Déclaration qui tenait la valeur, d'après la trace : feuille, ligne et colonne, sélecteur ; attribut style ; bloc
 * <style> ; feuille du navigateur ; valeur initiale.
 * @param {import('../browser/trace.js').TraceResult} t @param {string} origine
 */
function identite(t, origine) {
  if (t.origin === 'feuille') {
    if (!t.href) return `<style> ${t.selector}`;
    return `${cheminDe(t.href, origine)}:${t.sheetLine ?? t.line}${t.column != null ? `:${t.column}` : ''} ${t.selector}`;
  }
  if (t.origin === 'attribut style') return 'attribut style';
  if (t.origin === 'navigateur') return `feuille du navigateur ${t.selector ?? ''}`.trim();
  if (t.origin === 'initiale') return 'valeur initiale';
  return 'non tracé';
}

/**
 * Causes d'une ligne entière du reste (sans déclaration visée), et les déclarations, d'après leur trace, qu'elles
 * expliquent.
 * @type {Record<string, (t: import('../browser/trace.js').TraceResult) => boolean>}
 */
const LIGNE_ENTIERE = {
  'jeton absent': () => true,
  'attribut style': (t) => t.origin === 'attribut style',
  'feuille du navigateur': (t) => t.origin === 'navigateur',
  'valeur initiale': (t) => t.origin === 'initiale',
  'aucune déclaration tracée': (t) => t.origin !== 'feuille',
};

/**
 * Ligne du reste de modifications.json qui dit la cause d'une déclaration hors de lui : celle qui vise cette
 * déclaration, sinon celle qui explique la ligne entière.
 * @param {Hors[]} hors @param {string | null} id  ligne décidée @param {import('../browser/trace.js').TraceResult} t
 * @param {string | null} chemin  chemin de la feuille, ou adresse pour une autre origine @param {number | null} ligne @param {string} prop
 */
function horsDe(hors, id, t, chemin, ligne, prop) {
  if (!id) return undefined;
  const miennes = hors.filter((h) => h.lignes.includes(id));
  const visee = miennes.find((h) => {
    const d = h.declaration;
    if (!d || t.origin !== 'feuille' || d.propriete !== prop || d.selecteur !== t.selector) return false;
    return d.feuille ? d.feuille === chemin && d.ligne === ligne : chemin === null || !chemin.startsWith('/');
  });
  return visee ?? miennes.find((h) => !h.declaration && !!h.cause && !!LIGNE_ENTIERE[h.cause]?.(t));
}

/**
 * Avant la pose : opérations de la simulation, déclaration qui tenait chaque valeur, valeur visée ; hauteur de la page
 * intacte. Pose window.__dsSim (simulation installée, éteinte) et coupe transitions et animations jusqu'à la fin de
 * releverApres.
 * @param {import('playwright-core').Page} page @param {Manifeste} manifeste
 */
export async function releverAvant(page, manifeste) {
  const sim = /** @type {Record<string, any>} */ (manifeste.simulation);
  await immobiliser(page);
  const intacte = await hauteur(page);
  await page.evaluate(scanInPage, sim);
  /** @type {{ i: number, prop: string, value: string, key: string }[]} */
  const brutes = await page.evaluate(() => /** @type {any} */ (window).__dsSim.ops.map((/** @type {any} */ o) => ({ i: o.i, prop: o.prop, value: o.value, key: o.key })));
  // Une propriété d'un élément prend la dernière opération posée (un texte, puis son couplage).
  /** @type {Map<string, (typeof brutes)[number]>} */
  const derniere = new Map();
  for (const o of brutes) {
    derniere.delete(`${o.i}|${o.prop}`);
    derniere.set(`${o.i}|${o.prop}`, o);
  }
  let ops = [...derniere.values()];
  let traces = await traceElements(page, ops.map((o) => ({ index: o.i, property: o.prop, pseudo: false })), { sources: null, lookup: (i) => `window.__dsSim.els[${Number(i)}]`, colonne: true });
  const origine = new URL(page.url()).origin;
  // Conflits : gelés là où l'élément tient sa valeur de la déclaration en conflit, comme dans la simulation.
  const conflits = /** @type {any[]} */ (sim.conflits ?? []);
  const gelees = ops.map((o, k) => {
    const t = traces[k];
    if (!t || t.origin !== 'feuille') return false;
    const chemin = t.href ? new URL(t.href).pathname : null;
    const autre = t.href ? new URL(t.href).origin !== origine : false;
    return conflits.some((c) => c.cles.includes(o.key) && c.feuille === chemin && !!c.autreOrigine === autre && c.ligne === (t.sheetLine ?? t.line) && c.selecteur === t.selector && c.propriete === o.prop);
  });
  traces = traces.filter((_, k) => !gelees[k]);
  ops = ops.filter((_, k) => !gelees[k]);
  const valeurs = await page.evaluate(
    (xs) =>
      xs.map(({ i, prop, value }) => {
        const d = document.createElement('div');
        d.style.setProperty(prop, value);
        document.body.append(d);
        const visee = getComputedStyle(d).getPropertyValue(prop);
        d.remove();
        return { visee, avant: getComputedStyle(/** @type {any} */ (window).__dsSim.els[i]).getPropertyValue(prop) };
      }),
    ops.map((o) => ({ i: o.i, prop: o.prop, value: o.value })),
  );
  /** @type {Map<string, string>} */
  const parCle = new Map(manifeste.lignes.flatMap((l) => l.cles.map((k) => /** @type {[string, string]} */ ([k, l.id]))));
  const decl = manifeste.declarations ?? [];
  return {
    intacte,
    ops: ops.map((o, k) => {
      const t = traces[k];
      const chemin = t.origin === 'feuille' && t.href ? cheminDe(t.href, origine) : null;
      const ligne = t.sheetLine ?? t.line;
      const d = chemin ? decl.find((x) => x.sheet === chemin && x.line === ligne && x.property === o.prop && (x.column == null || t.column == null || x.column === t.column)) : undefined;
      const id = ligneDeCle(parCle, o.key);
      const h = d ? undefined : horsDe(manifeste.hors ?? [], id, t, t.origin === 'feuille' && t.href ? cheminDe(t.href, origine) : null, ligne ?? null, o.prop);
      /** @type {Annotation} */
      const annotation = d
        ? { ecrite: d.ecrite, cause: d.cause, aFaire: d.aFaire ?? null, injectee: d.injectee }
        : { ecrite: null, cause: h?.cause ?? null, aFaire: h?.aFaire ?? null, injectee: false };
      return { ligne: id, element: o.i, propriete: o.prop, valeur: o.value, declaration: identite(t, origine), annotation, ...valeurs[k] };
    }),
  };
}

/**
 * Sorte d'une feuille de la page, pour nommer un canal : chemin d'une feuille liée ; ce que verify a posé (tokens.css,
 * feuille ajoutée), reconnu à son texte ; feuille construite ; bloc <style> créé par un script ; bloc <style> absent
 * du HTML brut (inséré en HTML par un script) ; bloc de la page.
 * @param {{ href: string | null, inline: boolean, constructed: boolean, text: string }} s
 * @param {Map<string, { nom: string, sorte: 'ajout' | 'jetons' }>} poses  texte → ce que verify a posé
 * @param {string | null} html  HTML brut de la page @param {string} origine
 * @returns {Feuille}
 */
export function feuilleDe(s, poses, html, origine) {
  if (s.href) return { chemin: cheminDe(s.href, origine), ajout: null, sorte: 'fichier' };
  const p = poses.get(s.text);
  if (p) return { chemin: null, ajout: p.nom, sorte: p.sorte };
  if (s.constructed) return { chemin: null, ajout: null, sorte: 'construite' };
  // Un <style> créé par un script n'est pas « inline » pour Chromium ; un <style> inséré en HTML l'est, et ne se
  // reconnaît qu'à son absence du HTML brut.
  if (!s.inline) return { chemin: null, ajout: null, sorte: 'script' };
  return { chemin: null, ajout: null, sorte: html !== null && !html.includes(s.text) ? 'inséré' : 'page' };
}

/**
 * Feuilles de la page, rangées par feuilleDe.
 * @param {import('playwright-core').Page} page @param {Map<string, { nom: string, sorte: 'ajout' | 'jetons' }>} poses
 * @param {string | null} html  HTML brut de la page
 */
async function lecture(page, poses, html) {
  const cdp = await page.context().newCDPSession(page);
  const { sheets } = await collectSheets(page, { cdp });
  const origine = new URL(page.url()).origin;
  /** @type {Map<string, Feuille>} */
  const parId = new Map();
  for (const s of sheets) parId.set(s.styleSheetId, feuilleDe(s, poses, html, origine));
  await cdp.send('DOM.getDocument', { depth: 0 });
  /** @param {number} i */
  const styles = async (i) => {
    const { result } = /** @type {any} */ (await cdp.send('Runtime.evaluate', { expression: `window.__dsSim.els[${Number(i)}]` }));
    const { nodeId } = /** @type {any} */ (await cdp.send('DOM.requestNode', { objectId: result.objectId }));
    return /** @type {any} */ (await cdp.send('CSS.getMatchedStylesForNode', { nodeId }));
  };
  return { cdp, parId, styles };
}

/**
 * Le raccourci `nom` porte-t-il la propriété longue `prop` ? (Chromium ne donne pas toujours les propriétés longues
 * d'un raccourci dont la valeur contient un var().)
 * @param {string} nom @param {string} prop
 */
const couvre = (nom, prop) =>
  nom !== prop &&
  (prop.startsWith(`${nom}-`) ||
    (/^border-(color|style|width)$/.test(nom) && prop.startsWith('border-') && prop.endsWith(nom.slice(6))) ||
    (nom === 'border-radius' && /^border-.+-radius$/.test(prop)) ||
    (nom === 'gap' && /^(row|column)-gap$/.test(prop)) ||
    (nom === 'inset' && /^(top|right|bottom|left)$/.test(prop)));

/** `!important` collé ou non à la valeur, que Chromium laisse dans la valeur d'une feuille compressée. */
const IMPORTANT = /\s*!\s*important\s*$/i;

/**
 * Déclaration de la source qui donne `prop` dans un style CDP : la propriété elle-même ou le raccourci qui la porte,
 * la dernière l'emportant.
 * @param {any} style @param {string} prop @param {boolean} important
 * @returns {{ name: string, value: string } | null}
 */
function couvrante(style, prop, important) {
  const list = (style?.cssProperties ?? []).filter((/** @type {any} */ p) => p.range && !p.disabled && p.parsedOk !== false);
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    if ((!!p.important || IMPORTANT.test(p.value ?? '')) !== important) continue;
    if (p.name === prop || p.longhandProperties?.some((/** @type {any} */ l) => l.name === prop) || couvre(p.name, prop))
      return { name: p.name, value: String(p.value ?? '').replace(IMPORTANT, '') };
  }
  return null;
}

/**
 * Ce qui tient la valeur d'une propriété à l'écran, en clair, et ce qu'il faut faire. Ce que verify a posé (tokens.css,
 * feuille ajoutée) n'est jamais un canal du site : une variable qu'il pose ne demande rien ; la variable qui est le
 * jeton de la ligne n'est jamais posée avec elle-même pour repli.
 * @param {any} m  styles appliqués à l'élément (CSS.getMatchedStylesForNode)
 * @param {string} prop @param {Map<string, Feuille>} parId
 * @param {{ cible: string, jeton: string | null, nouvelle: string }} ligne
 *   cible : valeur à écrire (var(--jeton, repli)) ; jeton : variable du jeton de la ligne ; nouvelle : sa valeur
 * @returns {Canal}
 */
export function canalDe(m, prop, parId, { cible, jeton, nouvelle }) {
  /** Règle, en clair. @param {any} rule */
  const regle = (rule) => {
    const sel = rule?.selectorList?.text ?? '';
    if (rule?.origin === 'user-agent') return { texte: `feuille du navigateur ${sel}`, sorte: 'navigateur', sel };
    const f = parId.get(rule?.styleSheetId);
    const r = rule?.style?.range;
    const ou = r ? `:${r.startLine + 1}:${r.startColumn}` : '';
    if (!f) return { texte: `règle ${sel}`, sorte: 'inconnue', sel };
    if (f.sorte === 'ajout') return { texte: `feuille ajoutée ${f.ajout} ${sel}`, sorte: f.sorte, sel };
    if (f.sorte === 'jetons') return { texte: `${f.ajout} (jetons posés par verify), ${sel}`, sorte: f.sorte, sel };
    if (f.sorte === 'script') return { texte: `bloc de style injecté par un script, ${sel}`, sorte: f.sorte, sel };
    if (f.sorte === 'inséré') return { texte: `bloc <style> inséré en HTML par un script (absent du HTML brut), ${sel}`, sorte: f.sorte, sel };
    if (f.sorte === 'construite') return { texte: `feuille construite par un script, ${sel}`, sorte: f.sorte, sel };
    if (f.sorte === 'page') return { texte: `bloc <style> de la page, ${sel}`, sorte: f.sorte, sel };
    return { texte: `${f.chemin}${ou} ${sel}`, sorte: f.sorte, sel };
  };
  /** Règle de ce que verify a posé. @param {any} rule */
  const deVerify = (rule) => ['ajout', 'jetons'].includes(regle(rule).sorte);
  /**
   * Où une variable est posée : sur l'élément, sinon sur le parent le plus proche ; par verify ou non.
   * @param {string} nom @returns {{ ou: string, verify: boolean, nullePart: boolean }}
   */
  const variable = (nom) => {
    const ici = winner(m, nom);
    if (ici) return { ou: ici.inline ? "par l'attribut style de l'élément" : `par ${regle(ici.rule).texte}`, verify: !ici.inline && deVerify(ici.rule), nullePart: false };
    for (const e of m.inherited ?? []) {
      const x = winner(e, nom);
      if (x) return { ou: x.inline ? "par l'attribut style d'un parent" : `par ${regle(x.rule).texte} (sur un parent)`, verify: !x.inline && deVerify(x.rule), nullePart: false };
    }
    return { ou: 'nulle part : la valeur de repli du var() donne la valeur', verify: false, nullePart: true };
  };
  let entree = m;
  let w = winner(m, prop);
  let parent = false;
  if (!w)
    for (const e of m.inherited ?? []) {
      const x = winner(e, prop);
      if (x) {
        w = x;
        entree = e;
        parent = true;
        break;
      }
    }
  if (!w) return { cause: 'autre règle', categories: ['autre règle'], texte: 'valeur initiale (aucune règle)', aFaire: `donner ${cible} à ${prop} dans une feuille` };
  /** Feuille ajoutée qui porte une règle de cet élément pour `prop`, ou null. */
  const porteuse = () => {
    for (const r of entree.matchedCSSRules ?? []) {
      const f = parId.get(r.rule?.styleSheetId);
      if (f?.sorte === 'ajout' && (couvrante(r.rule.style, prop, true) || couvrante(r.rule.style, prop, false))) return f.ajout;
    }
    return null;
  };
  const qui = parent ? "d'un parent" : "de l'élément";
  /** @type {string[]} */
  const categories = [];
  /** @type {string[]} */
  const aFaire = [];
  let source;
  if (w.inline) {
    source = `attribut style ${qui}`;
    categories.push('attribut style');
    aFaire.push(`retirer ${prop} de l'attribut style ${qui}, pour que la feuille ajoutée la donne, ou y écrire ${cible}`);
  } else {
    const r = regle(w.rule);
    source = r.texte;
    if (r.sorte === 'script' || r.sorte === 'inséré' || r.sorte === 'construite') {
      categories.push('bloc de style injecté par un script');
      const f = porteuse();
      aFaire.push(`écrire ${cible} dans le bloc que le script injecte (${r.sel})${f ? `, ou poser la feuille ajoutée ${f} après lui, depuis le même script` : ''}`);
    }
  }
  if (parent) source += " (héritée par l'élément)";
  const d = couvrante(w.inline ? entree.inlineStyle : w.rule.style, prop, w.important);
  const raccourci = !!d && d.name !== prop;
  if (d && raccourci) {
    categories.push('raccourci');
    aFaire.push(
      w.important ? `écrire ${prop} à part, avec !important, après le raccourci ${d.name} (qui porte !important), avec ${cible}` : `écrire ${prop} à part, après le raccourci ${d.name}, avec ${cible}`,
    );
  }
  const vars = [...new Set([...(d?.value ?? '').matchAll(/var\(\s*(--[\w-]+)/g)].map((x) => x[1]))];
  /** @type {string[]} */
  const ouVars = [];
  let duSite = false;
  for (const v of vars) {
    const x = variable(v);
    ouVars.push(`variable ${v} posée ${x.ou}`);
    if (x.verify) continue;
    duSite = true;
    if (x.nullePart) aFaire.push(v === jeton ? `charger tokens.css avant les autres feuilles : il pose ${v}` : `poser ${v}: ${cible}, ou écrire ${prop} sans var()`);
    else aFaire.push(`poser ${v}: ${v === jeton ? nouvelle : cible} là où elle est posée`);
  }
  if (duSite) categories.push('variable');
  if (!categories.length) {
    if (!w.inline && deVerify(w.rule)) {
      categories.push('posé par verify');
      aFaire.push('rien à poser sur le site : la règle et ses variables sont posées par verify ; la valeur lue diffère pourtant, à vérifier');
    } else {
      categories.push('autre règle');
      aFaire.push(`faire gagner ${cible} contre ${source}`);
    }
  }
  const tete = `${d && raccourci ? `raccourci ${d.name}: ${d.value} de ` : ''}${source}${w.important ? ' !important' : ''}`;
  return { cause: categories[0], categories, texte: [tete, ...ouVars].join(' ; '), aFaire: aFaire.join(' ; ') };
}

/**
 * Après la pose : valeur calculée de chaque opération, hauteur avec les feuilles, puis transitions et animations
 * rendues ; canal de celles qui n'arrivent pas, avec la cause et l'« à faire » du manifeste quand il les connaît.
 * @param {import('playwright-core').Page} page @param {Manifeste} manifeste
 * @param {Awaited<ReturnType<typeof releverAvant>>} avant @param {Pose[]} poses  ce que verify a posé (feuilles ajoutées, tokens.css)
 * @param {string | null} html  HTML brut de la page (bloc <style> inséré par un script)
 * @returns {Promise<Releve>}
 */
export async function releverApres(page, manifeste, avant, poses, html) {
  const apres = /** @type {string[]} */ (
    await page.evaluate(
      (xs) => xs.map(({ i, p }) => getComputedStyle(/** @type {any} */ (window).__dsSim.els[i]).getPropertyValue(p)),
      avant.ops.map((o) => ({ i: o.element, p: o.propriete })),
    )
  );
  const avecFeuilles = await hauteur(page);
  await liberer(page);
  const lignes = new Map(manifeste.lignes.map((l) => [l.id, l]));
  const { cdp, parId, styles } = await lecture(page, new Map(poses.map((p) => [p.texte, { nom: p.nom, sorte: p.sorte }])), html);
  try {
    /** @type {Operation[]} */
    const ops = [];
    for (const [k, o] of avant.ops.entries()) {
      const { valeur, ...reste } = o;
      /** @type {Canal | null} */
      let canal = null;
      if (apres[k] !== o.visee && o.avant !== o.visee) {
        const l = o.ligne ? lignes.get(o.ligne) : undefined;
        const cible = l?.jeton ? `var(${l.jeton}, ${l.ancienne})` : (l?.nouvelle ?? valeur);
        canal = canalDe(await styles(o.element), o.propriete, parId, { cible, jeton: l?.jeton ?? null, nouvelle: l?.nouvelle ?? valeur });
        // Une seule cause : celle du manifeste quand il la connaît, avec son « à faire » (pertes.md).
        if (o.annotation.cause) canal = { ...canal, cause: o.annotation.cause, aFaire: o.annotation.aFaire ?? canal.aFaire };
      }
      ops.push({ ...reste, apres: apres[k], canal });
    }
    return { page: new URL(page.url()).pathname, hauteurs: { intacte: avant.intacte, avecFeuilles }, ops };
  } finally {
    await cdp.detach().catch(() => {});
  }
}

/**
 * Verdict par ligne décidée sur les pages vérifiées, phrase finale et sortie. La ligne de verdict dit la cause de ses
 * déclarations non arrivées si elles n'en ont qu'une, renvoie au détail sinon ; chaque détail dit une cause.
 * @param {Pick<Manifeste, 'lignes'>} manifeste @param {Releve[]} releves
 * @returns {{ lignes: Verdict[], resume: string, sortie: 0 | 1 }}
 */
export function juger(manifeste, releves) {
  const verifiees = releves.map((r) => r.page);
  /** @type {Verdict[]} */
  const lignes = [];
  for (const l of manifeste.lignes ?? []) {
    const ops = releves.flatMap((r) => r.ops.filter((o) => o.ligne === l.id).map((o) => ({ ...o, page: r.page })));
    const deja = ops.filter((o) => o.avant === o.visee);
    const vrais = ops.filter((o) => o.avant !== o.visee);
    const arrive = (/** @type {Operation} */ o) => o.apres === o.visee;
    /** Groupes d'opérations, dans l'ordre. @param {(o: (typeof vrais)[number]) => string} cle */
    const grouper = (cle) => {
      /** @type {Map<string, typeof vrais>} */
      const g = new Map();
      for (const o of vrais) g.set(cle(o), [...(g.get(cle(o)) ?? []), o]);
      return [...g.values()];
    };
    const parDecl = grouper((o) => `${o.declaration}|${o.propriete}`);
    const parElement = grouper((o) => `${o.page}#${o.element}`);
    const declarations = { arrivees: parDecl.filter((g) => g.every(arrive)).length, total: parDecl.length };
    const elements = { arrivees: parElement.filter((g) => g.every(arrive)).length, total: parElement.length };
    const dejaEnPlace = new Set(deja.map((o) => `${o.page}#${o.element}`)).size;
    const surPages = l.pages.filter((p) => verifiees.includes(p));
    /** @type {Etat} */
    const etat = vrais.length
      ? vrais.every(arrive)
        ? 'arrivée'
        : vrais.some(arrive)
          ? 'en partie'
          : 'non arrivée'
      : deja.length
        ? 'déjà en place'
        : l.etats?.length
          ? 'non vérifiable (état)'
          : l.pages.length && !surPages.length
            ? 'hors des pages vérifiées'
            : 'non vue';
    const tete = `${l.id} ${l.titre} : `;
    const injectee = vrais.some((o) => o.annotation.injectee) ? " ; feuille injectée par un script : posée après l'injection" : '';
    const surDeja = dejaEnPlace && vrais.length ? ` ; déjà en place sur ${nombre(dejaEnPlace, 'élément')}` : '';
    const causes = [...new Set(vrais.filter((o) => !arrive(o) && o.canal).map((o) => /** @type {Canal} */ (o.canal).cause))];
    const horsTexte = causes.length === 1 ? ` ; cause : ${causes[0]}` : causes.length > 1 ? ' ; causes : voir le détail' : '';
    const texte =
      etat === 'arrivée'
        ? `${tete}arrivée (${nombre(declarations.total, 'déclaration')}, ${nombre(elements.total, 'élément')})${surDeja}${injectee}`
        : etat === 'en partie' || etat === 'non arrivée'
          ? `${tete}${etat} (${nombre(declarations.arrivees, 'déclaration')} sur ${declarations.total}, ${nombre(elements.arrivees, 'élément')} sur ${elements.total})${surDeja}${injectee}${horsTexte}`
          : etat === 'déjà en place'
            ? `${tete}déjà en place (${nombre(dejaEnPlace, 'élément')} : la valeur visée y était avant la pose)`
            : etat === 'non vérifiable (état)'
              ? `${tete}non vérifiable (état : ${(l.etats ?? []).join(', ')})`
              : etat === 'hors des pages vérifiées'
                ? `${tete}hors des pages vérifiées (${l.pages.join(', ')})`
                : `${tete}non vue (aucun élément sur ${(surPages.length ? surPages : verifiees).join(', ')})`;
    /** @type {string[]} */
    const details = [];
    if (etat === 'en partie' || etat === 'non arrivée') {
      /** @type {Map<string, typeof vrais>} */
      const parPage = new Map();
      for (const o of vrais) {
        const k = `${o.page}\n${o.declaration}\n${o.propriete}`;
        parPage.set(k, [...(parPage.get(k) ?? []), o]);
      }
      for (const g of parPage.values()) {
        const o = g[0];
        const a = o.annotation;
        const quoi = a.ecrite === null ? 'hors de modifications.json' : a.ecrite ? 'écrite' : 'non écrite';
        const n = new Set(g.filter(arrive).map((x) => x.element)).size;
        const total = new Set(g.map((x) => x.element)).size;
        const etatDecl = n === total ? `arrivée (${nombre(total, 'élément')})` : `${n ? 'en partie' : 'non arrivée'} (${nombre(n, 'élément')} sur ${total})`;
        // Une ligne de détail par canal : une cause, ce qui la tient, ce qu'il faut faire.
        /** @type {Map<string, Canal>} */
        const canaux = new Map();
        for (const x of g) if (x.canal) canaux.set(`${x.canal.cause}\n${x.canal.texte}\n${x.canal.aFaire}`, x.canal);
        const tete = `${o.page} ${o.declaration} { ${o.propriete} } : ${quoi} ; ${etatDecl}`;
        if (!canaux.size) details.push(tete);
        for (const c of canaux.values()) details.push(`${tete} ; cause : ${c.cause} ; tient : ${c.texte} ; à faire : ${c.aFaire}`);
      }
    }
    lignes.push({ id: l.id, titre: l.titre, etat, declarations, elements, dejaEnPlace, texte, details });
  }
  /** @param {Etat} e */
  const n = (e) => lignes.filter((l) => l.etat === e).length;
  const resume = !lignes.length
    ? 'Aucune ligne décidée.'
    : n('arrivée') === lignes.length
      ? `Toutes les lignes décidées sont arrivées (${lignes.length}).`
      : `Lignes décidées : ${lignes.length} ; arrivées ${n('arrivée')}, en partie ${n('en partie')}, non arrivées ${n('non arrivée')}, déjà en place ${n('déjà en place')}, non vues ${n('non vue')}, hors des pages vérifiées ${n('hors des pages vérifiées')}, non vérifiables (état) ${n('non vérifiable (état)')}.`;
  /** @type {Etat[]} */
  const echec = ['en partie', 'non arrivée', 'déjà en place', 'non vue'];
  return { lignes, resume, sortie: lignes.some((l) => echec.includes(l.etat)) ? 1 : 0 };
}
