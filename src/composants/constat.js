// @ts-check
/**
 * Constat de l'audit des composants, sans navigateur (D46) : du relevé brut (releve.json) et des décisions du designer,
 * les chiffres, les types, leurs versions, le gabarit, les blocs non identifiés, les décisions sans cible et les limites.
 * Le constat ne juge rien : aucun verdict, aucune cible.
 *   - Un élément du gabarit (src/composants/pieces.js) n'entre dans aucun chiffre : il est montré une fois, sous son type.
 *   - Un bloc rattaché par le designer devient une version de son type, marquée rattachée à la main ; un bloc laissé reste
 *     dans les non identifiés.
 *   - La version la plus répandue d'un type peut être à égalité : l'outil ne choisit pas, il nomme les ex aequo.
 *   - Une décision qui vise une cible absente de l'audit n'est pas appliquée ; elle est listée.
 * Le guidage (D47, src/composants/guidage.js) ajoute ce qu'il reste à faire, les défauts et les différences de chaque
 * version ; il ne change aucun chiffre.
 */
import { occurrence, gabarit, identiteElement, apparenceDe, nomDeVersion } from './pieces.js';
import { candidats } from './blocs.js';
import { scores } from './scores.js';
import { TEXTES } from '../report/textes.js';
import { defauts, differences, mention, aFaireDuType, guidageGlobal, graphiques } from './guidage.js';

/**
 * @typedef {object} ReleveFichier
 * @property {{ nom: string, version: string }} outil
 * @property {string} date
 * @property {string} site
 * @property {{ width: number, height: number }} fenetre
 * @property {{ nom: string, version: string }[]} frameworks  tables de signatures données
 * @property {{ adresse: string, nom: string, statut: number | null, erreur?: string }[]} pages  pages demandées
 * @property {import('./pieces.js').Ligne[]} lignes  dans l'ordre des pages, puis du relevé
 * @property {string[]} captures  identifiants des lignes capturées (captures/<id>.png)
 * @property {string[]} [capturesRetrouvees]  lignes capturées sur un élément que la page avait remplacé, retrouvé par son
 *   chemin et son empreinte (D104)
 * @property {{ id: string, raison: string }[]} [capturesTombees]  lignes à capturer dont l'image n'a pas pu être prise (D104)
 * @property {number} [densite]  densité des captures (pixels de l'image par px CSS) ; absente : 1
 *
 * @typedef {{ fois: number, mesures: import('../browser/composants.js').Mesures, capture: string | null }} VueApparence
 * @typedef {object} VueVersion
 * @property {string} nom          nom stable, « <type> / <origine> / <nom> »
 * @property {string} origine      étiquette d'origine : le framework, ou l'une des deux étiquettes neutres
 * @property {'framework' | 'equipe' | 'nu'} origineCle  sorte d'origine, pour la couleur des graphiques (D48)
 * @property {string} nomCode      nom de la pièce dans le code : signature, première classe ou balise
 * @property {number} fois
 * @property {string[]} pages
 * @property {boolean} rattache
 * @property {string | null} capture
 * @property {string} [imageTombee]  pourquoi l'image de la première occurrence n'a pas pu être prise (D104)
 * @property {VueApparence[]} apparences
 * @property {{ classes: string[], endroit: string, selecteur: string, extrait: string }} code  première occurrence
 * @property {string[]} defauts   défauts d'accessibilité de base, en mots simples (D47)
 * @property {string | null} mention  « la plus répandue », « à égalité », ou rien (type à une version)
 * @property {string} differences  mesures qui distinguent cette version des autres du type (D47)
 */

/** Chemin de la capture d'une ligne, si elle a été prise. @param {string} id @param {Set<string>} captures */
const chemin = (id, captures) => (captures.has(id) ? `captures/${id}.png` : null);

/** La raison d'une image non prise, s'il y en a une (D104). @param {string} id @param {ReleveFichier} releve */
const imageTombee = (id, releve) => {
  const t = releve.capturesTombees?.find((x) => x.id === id);
  return t ? { imageTombee: t.raison } : {};
};

/** @param {number} n @param {string} un @param {string} plusieurs */
const accord = (n, un, plusieurs) => `${n} ${n < 2 ? un : plusieurs}`;

/**
 * Vue d'une version, ou d'un bloc : première occurrence, apparences dans l'ordre où elles paraissent, pages.
 * @param {{ id: string, page: number, apparence: string, mesures: import('../browser/composants.js').Mesures, ligne: import('./pieces.js').Ligne }[]} occ
 * @param {ReleveFichier} releve @param {Set<string>} captures
 */
function vue(occ, releve, captures) {
  const premiere = occ[0];
  /** @type {Map<string, VueApparence>} */
  const apparences = new Map();
  for (const o of occ) {
    const a = apparences.get(o.apparence);
    if (a) a.fois++;
    else apparences.set(o.apparence, { fois: 1, mesures: o.mesures, capture: chemin(o.id, captures) });
  }
  return {
    fois: occ.length,
    pages: [...new Set(occ.map((o) => o.page))].sort((a, b) => a - b).map((p) => releve.pages[p].nom),
    capture: chemin(premiere.id, captures),
    ...imageTombee(premiere.id, releve),
    apparences: [...apparences.values()],
    code: { classes: premiere.ligne.classes, endroit: premiere.ligne.endroit, selecteur: premiere.ligne.selecteur, extrait: premiere.ligne.extrait },
  };
}

/**
 * @param {import('./pieces.js').Occurrence[]} occ  occurrences d'un type, dans l'ordre du relevé
 * @param {ReleveFichier} releve @param {Set<string>} captures
 * @returns {VueVersion[]}
 */
function versionsDe(occ, releve, captures) {
  /** @type {Map<string, import('./pieces.js').Occurrence[]>} */
  const parVersion = new Map();
  for (const o of occ) parVersion.set(o.version, [...(parVersion.get(o.version) ?? []), o]);
  const vs = [...parVersion]
    .map(([nom, os]) => ({ nom, origine: os[0].origine.libelle, origineCle: os[0].origine.cle, nomCode: os[0].origine.nom, rattache: os.some((o) => o.rattache), ...vue(os, releve, captures), defauts: defauts(os) }))
    .sort((a, b) => b.fois - a.fois || a.nom.localeCompare(b.nom, 'fr'));
  const diffs = differences(vs);
  return vs.map((v, i) => ({ ...v, mention: mention(vs, i), differences: diffs[i] }));
}

/** Ordre du relevé : page, puis rang. @param {{ page: number, ligne: { index: number } }} a @param {{ page: number, ligne: { index: number } }} b */
const ordre = (a, b) => a.page - b.page || a.ligne.index - b.ligne.index;

/**
 * @param {ReleveFichier} releve
 * @param {import('./decisions.js').Decisions} [decisions]
 * @param {{ nom?: string }} [opts]  nom : le nom du site affiché (sans lui : l'hôte de son adresse)
 */
export function construireConstat(releve, decisions = { garder: [], blocs: [] }, { nom } = {}) {
  const captures = new Set(releve.captures ?? []);
  const vues = releve.pages.map((p, i) => ({ ...p, i })).filter((p) => !p.erreur);
  const nbPages = vues.length;
  const premierePage = vues[0]?.i ?? 0;
  const lignes = releve.lignes;
  const occ = lignes.filter((l) => l.sorte !== 'bloc').map(occurrence);
  const duGabarit = gabarit(occ, nbPages, identiteElement);
  const cands = candidats(lignes.filter((l) => l.sorte === 'bloc'), nbPages);

  /** @type {{ ligne: 'garder' | 'blocs', texte: string }[]} */
  const sansCible = [];
  const sorts = new Map(decisions.blocs.map((b) => [b.bloc, b]));
  for (const b of decisions.blocs)
    if (!cands.some((c) => c.nom === b.bloc))
      sansCible.push({ ligne: 'blocs', texte: `bloc « ${b.bloc} » (${b.sort === 'rattacher' ? `rattacher à « ${b.type} »` : 'laisser'}) : aucun bloc non identifié de ce nom dans cet audit` });
  /** @type {import('./pieces.js').Occurrence[]} */
  const rattaches = [];
  const restants = [];
  for (const c of cands) {
    const d = sorts.get(c.nom);
    if (d?.sort === 'rattacher') {
      for (const l of c.lignes) {
        const origine = { cle: /** @type {const} */ ('equipe'), libelle: TEXTES.origines.equipe, nom: c.nom };
        const type = /** @type {string} */ (d.type);
        rattaches.push({ id: l.id, page: l.page, type, origine, version: nomDeVersion(type, origine), apparence: apparenceDe(l.mesures), mesures: l.mesures, interactif: false, acces: null, rattache: true, nom: '', ligne: l });
      }
    } else restants.push({ nom: c.nom, etat: d?.sort === 'laisser' ? TEXTES.etats.laisse : TEXTES.etats.aDecider, lignes: c.lignes });
  }

  const elements = [...occ.filter((o) => !duGabarit.has(o.id)), ...rattaches].sort(ordre);
  const gabaritVu = occ.filter((o) => duGabarit.has(o.id) && o.page === premierePage);
  /** @type {Map<string, { comptes: import('./pieces.js').Occurrence[], gabarit: import('./pieces.js').Occurrence[] }>} */
  const parType = new Map();
  for (const o of elements) (parType.get(o.type) ?? parType.set(o.type, { comptes: [], gabarit: [] }).get(o.type))?.comptes.push(o);
  for (const o of gabaritVu) (parType.get(o.type) ?? parType.set(o.type, { comptes: [], gabarit: [] }).get(o.type))?.gabarit.push(o);

  const garder = new Map(decisions.garder.map((g) => [g.type, g.version]));
  for (const g of decisions.garder) {
    const t = parType.get(g.type);
    if (!t || !t.comptes.length) sansCible.push({ ligne: 'garder', texte: `version à garder « ${g.version} » : aucun élément du type « ${g.type} » dans cet audit` });
    else if (!t.comptes.some((o) => o.version === g.version)) sansCible.push({ ligne: 'garder', texte: `version à garder « ${g.version} » : version absente de cet audit` });
  }

  const types = [...parType]
    .map(([nom, t]) => {
      const versions = versionsDe(t.comptes, releve, captures);
      const plusGrand = versions.length ? versions[0].fois : 0;
      const g = garder.get(nom);
      const garde = g && versions.some((v) => v.nom === g) ? g : null;
      return {
        nom,
        fois: t.comptes.length,
        sourceUnique: { x: plusGrand, y: t.comptes.length, plusRepandues: versions.filter((v) => v.fois === plusGrand).map((v) => v.nom) },
        versions,
        gabarit: { elements: t.gabarit.length, versions: versionsDe(t.gabarit, releve, captures).map((v) => ({ ...v, pages: vues.map((p) => p.nom) })) },
        garder: garde,
        ...aFaireDuType({ fois: t.comptes.length, versions, garder: garde }),
        occurrences: t.comptes,
        plusGrand,
      };
    })
    .sort((a, b) => b.fois - a.fois || a.nom.localeCompare(b.nom, 'fr'));
  const typesComptes = types.filter((t) => t.fois > 0);

  const nonIdentifies = restants.map((r) => {
    const occs = r.lignes.map((l) => ({ id: l.id, page: l.page, apparence: apparenceDe(l.mesures), mesures: l.mesures, ligne: l }));
    return { bloc: r.nom, etat: r.etat, ...vue(occs, releve, captures), aFaire: r.etat === TEXTES.etats.aDecider ? TEXTES.guidage.bloc.decider : TEXTES.guidage.bloc.laisse };
  });
  const nonIdentifiesFois = nonIdentifies.reduce((s, b) => s + b.fois, 0);
  const s = scores(typesComptes, nonIdentifiesFois);

  const versions = typesComptes.reduce((n, t) => n + t.versions.length, 0);
  /** @type {Map<string, number>} */
  const parFramework = new Map(releve.frameworks.map((f) => [f.nom, 0]));
  for (const o of elements) if (o.origine.cle === 'framework') parFramework.set(o.origine.libelle, (parFramework.get(o.origine.libelle) ?? 0) + 1);
  const duFramework = [...parFramework.values()].reduce((a, b) => a + b, 0);
  const autrement = elements.length - duFramework;
  const debut = `${accord(elements.length, 'élément relevé', 'éléments relevés')}, de ${accord(typesComptes.length, 'type', 'types')}, en ${accord(versions, 'version', 'versions')}.`;
  const frameworks = [...parFramework].map(([nom, n], i) => (i === 0 ? `${n} ${n < 2 ? 'vient' : 'viennent'} de ${nom}` : `${n} de ${nom}`));
  const milieu = releve.frameworks.length ? `${frameworks.join(', ')}, ${autrement} ${autrement < 2 ? 'est fait' : 'sont faits'} autrement.` : 'Aucun framework reconnu.';
  const fin = nonIdentifiesFois < 2 ? `${nonIdentifiesFois} bloc n'est pas identifié.` : `${nonIdentifiesFois} blocs ne sont pas identifiés.`;

  const largeur = `${releve.fenetre.width} × ${releve.fenetre.height} px`;
  const guide = guidageGlobal(typesComptes, elements.length, nonIdentifies);
  const sortie = types.map(({ occurrences, plusGrand, ...t }) => t);
  return {
    outil: releve.outil,
    date: releve.date,
    site: releve.site,
    nom: nom ?? new URL(releve.site).host,
    densite: releve.densite ?? 1,
    fenetre: largeur,
    frameworks: releve.frameworks,
    pages: releve.pages,
    phrase: `${debut} ${milieu} ${fin}`,
    phraseCourte: guide.phraseCourte,
    aFaire: guide.aFaire,
    chiffres: { elements: elements.length, types: typesComptes.length, versions, frameworks: Object.fromEntries(parFramework), autrement, nonIdentifies: nonIdentifiesFois },
    scores: s,
    types: sortie,
    graphiques: graphiques(sortie, releve.frameworks),
    nonIdentifies,
    decisionsSansCible: sansCible,
    limites: TEXTES.limites.map((/** @type {string} */ l) => l.replace('{largeur}', largeur).replace('{pages}', String(nbPages)).replace('{date}', releve.date)),
  };
}

/**
 * Lignes à capturer : la première occurrence de chaque version, de chaque apparence et de chaque bloc non identifié,
 * gabarit compris, sans décision ; une décision ne montre rien d'autre (un bloc rattaché garde ses captures).
 * @param {ReleveFichier} releve
 * @returns {string[]}
 */
export function aCapturer(releve) {
  const tout = { ...releve, captures: releve.lignes.map((l) => l.id) };
  const c = construireConstat(tout);
  /** @type {Set<string>} */
  const ids = new Set();
  /** @param {{ capture: string | null, apparences: VueApparence[] }} v */
  const ajouter = (v) => {
    for (const x of [v.capture, ...v.apparences.map((a) => a.capture)]) if (x) ids.add(x.replace(/^captures\/(.*)\.png$/, '$1'));
  };
  for (const t of c.types) for (const v of [...t.versions, ...t.gabarit.versions]) ajouter(v);
  for (const b of c.nonIdentifies) ajouter(b);
  return releve.lignes.map((l) => l.id).filter((id) => ids.has(id));
}

