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
 */
import { collectSheets } from '../browser/sheets.js';
import { winner, traceElements } from '../browser/trace.js';
import { scanInPage } from '../browser/simulate.js';
import { ligneDeCle } from '../lib/cles.js';

/**
 * @typedef {{ id: string, titre: string, famille?: string, cles: string[], ancienne: string, nouvelle: string, jeton: string | null, pages: string[], etats?: string[] }} LigneDecidee
 * @typedef {{ rows: string[], sheet: string, line: number, column: number | null, selector: string, property: string, value: string, pages: string[],
 *   ecrite: boolean, cause: string | null, important: boolean, injectee: boolean }} Declaration  déclaration décidée du manifeste
 * @typedef {{ simulation: Record<string, any> | null, lignes: LigneDecidee[], hors: { lignes: string[], cause: string | null, texte: string }[], declarations?: Declaration[] }} Manifeste
 * @typedef {{ ecrite: boolean | null, cause: string | null, injectee: boolean }} Annotation  ecrite null : hors de modifications.json
 * @typedef {{ categories: string[], texte: string, aFaire: string }} Canal
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
 * Avant la pose : opérations de la simulation, déclaration qui tenait chaque valeur, valeur visée ; hauteur de la page
 * intacte. Pose window.__dsSim (simulation installée, éteinte).
 * @param {import('playwright-core').Page} page @param {Manifeste} manifeste
 */
export async function releverAvant(page, manifeste) {
  const sim = /** @type {Record<string, any>} */ (manifeste.simulation);
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
      /** @type {Annotation} */
      const annotation = d ? { ecrite: d.ecrite, cause: d.cause, injectee: d.injectee } : { ecrite: null, cause: null, injectee: false };
      return { ligne: ligneDeCle(parCle, o.key), element: o.i, propriete: o.prop, valeur: o.value, declaration: identite(t, origine), annotation, ...valeurs[k] };
    }),
  };
}

/**
 * Feuilles de la page, pour nommer un canal : chemin d'une feuille liée, feuille ajoutée reconnue à son texte, bloc
 * <style> créé par un script, bloc <style> absent du HTML brut (inséré en HTML par un script), bloc de la page,
 * feuille construite.
 * @param {import('playwright-core').Page} page @param {Map<string, string>} ajouts  texte d'une feuille ajoutée → son chemin
 * @param {string | null} html  HTML brut de la page
 */
async function lecture(page, ajouts, html) {
  const cdp = await page.context().newCDPSession(page);
  const { sheets } = await collectSheets(page, { cdp });
  const origine = new URL(page.url()).origin;
  /** @typedef {{ chemin: string | null, ajout: string | null, sorte: 'fichier' | 'ajout' | 'script' | 'inséré' | 'page' | 'construite' }} Feuille */
  /** @type {Map<string, Feuille>} */
  const parId = new Map();
  for (const s of sheets) {
    /** @type {Feuille} */
    let f;
    if (s.href) f = { chemin: cheminDe(s.href, origine), ajout: null, sorte: 'fichier' };
    else if (s.constructed) f = { chemin: null, ajout: null, sorte: 'construite' };
    else if (ajouts.has(s.text)) f = { chemin: null, ajout: ajouts.get(s.text) ?? null, sorte: 'ajout' };
    // Un <style> créé par un script n'est pas « inline » pour Chromium ; un <style> inséré en HTML l'est, et ne se
    // reconnaît qu'à son absence du HTML brut.
    else if (!s.inline) f = { chemin: null, ajout: null, sorte: 'script' };
    else f = { chemin: null, ajout: null, sorte: html !== null && !html.includes(s.text) ? 'inséré' : 'page' };
    parId.set(s.styleSheetId, f);
  }
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
 * Ce qui tient la valeur d'une propriété à l'écran, en clair, et ce qu'il faut faire.
 * @param {any} m  styles appliqués à l'élément (CSS.getMatchedStylesForNode)
 * @param {string} prop @param {Awaited<ReturnType<typeof lecture>>['parId']} parId @param {string} cible  valeur à écrire (var(--jeton, repli))
 * @returns {Canal}
 */
function canalDe(m, prop, parId, cible) {
  /** Règle, en clair. @param {any} rule */
  const regle = (rule) => {
    const sel = rule?.selectorList?.text ?? '';
    if (rule?.origin === 'user-agent') return { texte: `feuille du navigateur ${sel}`, sorte: 'navigateur', sel };
    const f = parId.get(rule?.styleSheetId);
    const r = rule?.style?.range;
    const ou = r ? `:${r.startLine + 1}:${r.startColumn}` : '';
    if (!f) return { texte: `règle ${sel}`, sorte: 'inconnue', sel };
    if (f.sorte === 'ajout') return { texte: `feuille ajoutée ${f.ajout} ${sel}`, sorte: f.sorte, sel };
    if (f.sorte === 'script') return { texte: `bloc de style injecté par un script, ${sel}`, sorte: f.sorte, sel };
    if (f.sorte === 'inséré') return { texte: `bloc <style> inséré en HTML par un script (absent du HTML brut), ${sel}`, sorte: f.sorte, sel };
    if (f.sorte === 'construite') return { texte: `feuille construite par un script, ${sel}`, sorte: f.sorte, sel };
    if (f.sorte === 'page') return { texte: `bloc <style> de la page, ${sel}`, sorte: f.sorte, sel };
    return { texte: `${f.chemin}${ou} ${sel}`, sorte: f.sorte, sel };
  };
  /** Où une variable est posée : sur l'élément, sinon sur le parent le plus proche. @param {string} nom */
  const variable = (nom) => {
    const ici = winner(m, nom);
    if (ici) return ici.inline ? "par l'attribut style de l'élément" : `par ${regle(ici.rule).texte}`;
    for (const e of m.inherited ?? []) {
      const x = winner(e, nom);
      if (x) return x.inline ? "par l'attribut style d'un parent" : `par ${regle(x.rule).texte} (sur un parent)`;
    }
    return 'nulle part : la valeur de repli du var() donne la valeur';
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
  if (!w) return { categories: ['autre règle'], texte: 'valeur initiale (aucune règle)', aFaire: `donner ${cible} à ${prop} dans une feuille` };
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
      aFaire.push(`écrire ${cible} dans le bloc que le script injecte (${r.sel}), ou poser la feuille ajoutée après lui, depuis le même script`);
    }
  }
  if (parent) source += " (héritée par l'élément)";
  const d = couvrante(w.inline ? entree.inlineStyle : w.rule.style, prop, w.important);
  const raccourci = !!d && d.name !== prop;
  if (d && raccourci) {
    categories.push('raccourci');
    aFaire.push(`écrire ${prop} à part, après le raccourci ${d.name}, avec ${cible}`);
  }
  const vars = [...new Set([...(d?.value ?? '').matchAll(/var\(\s*(--[\w-]+)/g)].map((x) => x[1]))];
  /** @type {string[]} */
  const ouVars = [];
  for (const v of vars) {
    const ou = variable(v);
    ouVars.push(`variable ${v} posée ${ou}`);
    aFaire.push(ou.startsWith('nulle part') ? `poser ${v}: ${cible}, ou écrire ${prop} sans var()` : `poser ${v}: ${cible} là où elle est posée`);
  }
  if (vars.length) categories.push('variable');
  if (!categories.length) {
    categories.push('autre règle');
    aFaire.push(`faire gagner ${cible} contre ${source}`);
  }
  const tete = `${d && raccourci ? `raccourci ${d.name}: ${d.value} de ` : ''}${source}${w.important ? ' !important' : ''}`;
  return { categories, texte: [tete, ...ouVars].join(' ; '), aFaire: aFaire.join(' ; ') };
}

/**
 * Après la pose : valeur calculée de chaque opération, canal de celles qui n'arrivent pas, hauteur avec les feuilles.
 * @param {import('playwright-core').Page} page @param {Manifeste} manifeste
 * @param {Awaited<ReturnType<typeof releverAvant>>} avant @param {{ ajout: string, texte: string }[]} feuilles  feuilles ajoutées posées
 * @param {string | null} html  HTML brut de la page (bloc <style> inséré par un script)
 * @returns {Promise<Releve>}
 */
export async function releverApres(page, manifeste, avant, feuilles, html) {
  const apres = /** @type {string[]} */ (
    await page.evaluate(
      (xs) => xs.map(({ i, p }) => getComputedStyle(/** @type {any} */ (window).__dsSim.els[i]).getPropertyValue(p)),
      avant.ops.map((o) => ({ i: o.element, p: o.propriete })),
    )
  );
  const avecFeuilles = await hauteur(page);
  const lignes = new Map(manifeste.lignes.map((l) => [l.id, l]));
  const { cdp, parId, styles } = await lecture(page, new Map(feuilles.map((f) => [f.texte, f.ajout])), html);
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
        canal = canalDe(await styles(o.element), o.propriete, parId, cible);
      }
      ops.push({ ...reste, apres: apres[k], canal });
    }
    return { page: new URL(page.url()).pathname, hauteurs: { intacte: avant.intacte, avecFeuilles }, ops };
  } finally {
    await cdp.detach().catch(() => {});
  }
}

/**
 * Verdict par ligne décidée sur les pages vérifiées, phrase finale et sortie.
 * @param {Pick<Manifeste, 'lignes' | 'hors'>} manifeste @param {Releve[]} releves
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
    const causes = [...new Set((manifeste.hors ?? []).filter((h) => h.cause && h.lignes.includes(l.id)).map((h) => h.cause))];
    const horsTexte = causes.length ? ` ; hors de modifications.json : ${causes.join(', ')}` : '';
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
        const quoi = a.ecrite === null ? 'hors de modifications.json' : a.ecrite ? 'écrite' : `non écrite (${a.cause})`;
        const n = new Set(g.filter(arrive).map((x) => x.element)).size;
        const total = new Set(g.map((x) => x.element)).size;
        const etatDecl = n === total ? `arrivée (${nombre(total, 'élément')})` : `${n ? 'en partie' : 'non arrivée'} (${nombre(n, 'élément')} sur ${total})`;
        /** @type {Map<string, Canal>} */
        const canaux = new Map();
        for (const x of g) if (x.canal) canaux.set(x.canal.texte, x.canal);
        const tient = [...canaux.values()].map((c) => ` ; tient : ${c.texte} ; à faire : ${c.aFaire}`).join('');
        details.push(`${o.page} ${o.declaration} { ${o.propriete} } : ${quoi} ; ${etatDecl}${tient}`);
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
