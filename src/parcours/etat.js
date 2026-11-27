// @ts-check
/**
 * État d'un parcours (D72), calculé depuis les sorties du projet, jamais saisi : même projet, même état. Six étapes,
 * affichées en quatre temps. Chaque étape a son propre état d'après ses sorties ; l'étape en cours est la première qui
 * n'est pas faite, les suivantes sont à venir. « Le plus récent » est le dossier d'horodatage le plus grand, jamais la
 * date d'un fichier. Le constat se fait par site ; la réduction, la livraison et la preuve sur le premier site, car
 * l'outil réduit une origine à la fois.
 */
import { createHash } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { lireAvancement } from '../lib/avancement.js';
import { lireJson } from '../lib/fichiers.js';
import { deNom, liste } from '../lib/format.js';
import { compterDecisions } from '../reduce/propose.js';
import { RESOLVER } from '../tokens/resolver.js';
import { pageName, VALEURS_APRES } from '../verify/reference.js';
import { detteDe, valeurs as valeursDe } from './dette.js';
import { fondationsDe } from './fondations.js';
import { apercu, lireMarque } from './marque.js';
import { remiseDe } from './remise.js';
import { COMPOSANTS, captureDe, composantDuType } from './diapason.js';

/** Le choix de la marque à l'écran, quand l'humain l'a changé (D80) : dans les sorties. */
const MARQUE_CHOISIE = 'marque.json';

/** La dette vue : écrit à « Définir ma marque », dans le chat (D78, D92), dans les sorties. */
export const DETTE_VUE = 'dette.json';

/** Les fondations vues : écrit à « Voir mes composants », dans le chat (D83, D92, D101), dans les sorties. */
export const FONDATIONS_VUES = 'fondations.json';

/** Les composants à la marque vus : écrit à « Comparer mon site », dans le chat (D101), dans les sorties. */
export const COMPOSANTS_VUS = 'composants-vus.json';

/** Ce que la saisie écrit à côté des jetons de la marque, avant l'écran des fondations (D83) ; les captures des composants à la marque (D101). */
const ECRITS_DE_LA_MARQUE = ['roles.html', 'espacements.html', 'typo.html', 'jetons.css', 'vuetify.json', ...COMPOSANTS.map((c) => captureDe(c.cle))];

/** Les pages validées, par site (D77) : écrit quand la mesure est lancée dans le chat (D89), dans les sorties. */
export const PAGES_VALIDEES = 'pages.json';
/** L'avancement de la mesure (D93) : écrit par l'audit et le relevé des composants, page par page, dans les sorties. */
export const AVANCEMENT = 'avancement.json';

/** Le rendu validé (D86) : écrit à « Valider mon rendu », dans le chat (D92), avec la vérification regardée, dans les sorties. */
export const RENDU_VALIDE = 'avant-apres.json';

/** La revue rouverte (D86) : écrite à « Revenir sur une décision », dans le chat (D92), avec l'empreinte des choix d'alors. */
export const REVUE_ROUVERTE = 'revue.json';

/**
 * L'empreinte des choix exportés (decisions.json), ou null s'il n'y en a pas : la revue rouverte le reste tant
 * qu'un nouvel export ne l'a pas changée.
 * @param {string} sorties
 */
export function empreinteDesChoix(sorties) {
  const f = join(sorties, 'decisions.json');
  return existsSync(f) ? createHash('sha256').update(readFileSync(f)).digest('hex') : null;
}

/** La largeur et la hauteur d'une image PNG, lues dans son en-tête (IHDR, octets 16 à 23). @param {string} f */
function taillePng(f) {
  const b = Buffer.alloc(24);
  const d = openSync(f, 'r');
  try {
    readSync(d, b, 0, 24, 0);
  } finally {
    closeSync(d);
  }
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

/**
 * Les pages validées, ou null si l'humain n'a pas encore lancé la mesure.
 * @param {string} sorties
 * @returns {Record<string, string[]> | null}
 */
function pagesValidees(sorties) {
  const f = join(sorties, PAGES_VALIDEES);
  return existsSync(f) ? lireJson(f) : null;
}

/**
 * @typedef {import('./projet.js').Projet} Projet
 * @typedef {import('./projet.js').Site} Site
 * @typedef {'faite' | 'en cours' | 'à venir'} EtatEtape
 * @typedef {'designer' | 'développeur' | 'outil'} Main
 * @typedef {'site' | 'constat' | 'marques' | 'decisions' | 'livraison' | 'suivi'} CleEtape
 * @typedef {{ href: string, titre: string }} Ecran
 * @typedef {{ cle: CleEtape, nom: string, temps: string, acteurs: string, faite: boolean, etat: EtatEtape, sortie: boolean,
 *   main: Main | null, action: string | null, commande: string | null, fait: string | null, lignes: string[],
 *   ecran: Ecran | null, sansEcran: string | null, ouvre: string, refus?: boolean, reportes: number }} Etape
 * @typedef {{ couleurs: { avant: number, apres: number, mesure: boolean } | null, pages: number, decisions: number, changements: number, arrivees: number,
 *   enEtat: string[], composants: { nom: string, versions: number, fois: number }[], dernier: string, complet: boolean, manque: string[], humain: string[] }} Bilan
 *   à la remise : les couleurs des pages avant, et après (mesurées sur les pages avec les feuilles, sinon le compte de la
 *   réduction) ; les changements du dernier contrôle ; les types de composants relevés, ceux qui ont des versions
 * @typedef {{ versions: number | null, valeurs: number | null, decisions: number | null, enAttente: number | null, reportes: number }} Chiffres  ce que citent les faits du moment
 * @typedef {import('./dette.js').Dette & { site: Site, pages: string[], valeursHref: string | null, composantsHref: string, captures: string,
 *   autres: { id: string, nom: string, href: string }[] }} Dette  la dette du premier site mesuré, au moment de la dette
 * @typedef {{ produit: string, sites: Site[], sousTitre: string | null, unSite: boolean, etapes: Etape[], temps: { nom: string, etat: EtatEtape, etapes: CleEtape[] }[],
 *   courante: Etape, moment: 'pages' | 'mesure' | 'dette' | 'marque' | 'jetons' | 'fondations' | 'composants' | 'avant-apres' | 'ecran' | 'sans-ecran' | 'remise', dette: Dette | null,
 *   marque: { site: Site, lecture: import('./marque.js').Lecture, choix: import('./marque.js').Choix, apercu: import('./marque.js').Apercu, planche: string | null } | null, ecran: (Ecran & { etape: CleEtape, precedente: boolean }) | null,
 *   fondations: Fondations | null, composants: Composants | null, avantApres: AvantApres | null, remise: import('./remise.js').Remise | null, phrase: string | null, bilan: Bilan | null, chiffres: Chiffres, voisin: string | null, livraison: Livraison | null,
 *   revoir: Revu[], revue: string | null, mesure: Mesure | null, preparation: Ligne[] | null }} Etat  revoir : les écrans faits qui se revoient ; revue : l'adresse de la revue ;
 *   mesure : où en est la mesure, au moment de la mesure ; preparation : où en est l'écriture des tokens, au moment des jetons (D93)
 * @typedef {{ nom: string, detail: string, etat: string }} Ligne  une ligne de « Où j'en suis » : Mesurée, En cours, À faire, Pas mesurée ; Fait, Pas fait
 * @typedef {{ sites: { id: string, nom: string, pages: Ligne[], composants: Ligne }[], arret: string | null }} Mesure  arret : la mesure
 *   arrêtée, dite en une phrase : un relevé pas fait, sans constat (D104)
 * @typedef {import('./fondations.js').Fondations & { site: Site, avant: number | null, planche: string }} Fondations  au moment des fondations : la marque du
 *   premier site, les valeurs de ses pages (avant) et l'adresse servie de ses planches
 * @typedef {{ src: string, largeur: number, hauteur: number }} Image  une capture servie, et sa taille affichée
 * @typedef {import('./dette.js').Type['versions']} Versions
 * @typedef {{ captures: string, tailles: Record<string, [number, number]>, remplace: { cle: string, nom: string, phrase: string | null, versions: Versions, fois: number, hauteurs: number[], image: Image | null }[],
 *   pasEncore: { nom: string, versions: Versions, fois: number }[], autres: { cle: string, nom: string, image: Image | null }[] }} Composants  au moment des
 *   composants (D101) : ceux de Diapason que les pages emploient, avec les versions qu'ils remplacent et leur capture à la marque ; les types
 *   relevés sans composant ; les autres composants
 * @typedef {{ pages: number, arrivees: number, total: number, manquantes: { titre: string, elements: number, cause: string | null }[] }} Livraison  la dernière vérification
 * @typedef {{ verification: string, dossierAjout: string, vues: { nom: string, avant: string, apres: string, plusHaute: 'avant' | 'apres', direct: string }[], pages: number, decisions: number,
 *   changements: number, arrivees: number, manquantes: string[], enEtat: string[],
 *   familles: { cle: string, titre: string, compte: number, exemple: { ancienne: string, nouvelle: string, ou: string } | null }[] }} AvantApres  au moment de
 *   l'avant et après : les images de chaque page, et ce qui a changé ; chaque vue a l'adresse de sa page en direct
 */

/** Les quatre temps et leurs étapes (présentation de l'outil, D72, D88) : la livraison se vérifie, avant et après ; le suivi est la remise. */
const TEMPS = /** @type {const} */ ([
  ['Mesurer', ['site', 'constat']],
  ['Décider', ['marques', 'decisions']],
  ['Vérifier', ['livraison']],
  ['Remettre', ['suivi']],
]);

/**
 * Les écrans qui se revoient (D88), dans l'ordre du parcours.
 * @typedef {'pages' | 'dette' | 'marque' | 'fondations' | 'composants' | 'revue' | 'avant-apres'} Revu
 */

/** Une phrase par moment, ce qu'il faut en comprendre (D72). */
const PHRASES = {
  constat: 'On mesure ce qui s’affiche vraiment, pas ce que le code contient.',
  marque: 'Une couleur de marque devient douze pas. Le pas 9 est la couleur exacte.',
  refus: 'Une marque illisible n’entre pas, et le message dit pourquoi.',
  revue: 'On choisit une relation, pas une valeur.',
};

/** Accord en nombre : 0 et 1 au singulier. @param {number} n @param {string} un @param {string} plusieurs */
const nombre = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;


/** « dans le site a », « dans les sites a et b ». @param {{ id: string }[]} l */
const lesSites = (l) => (l.length > 1 ? `dans les sites ${liste(l.map((s) => s.id))}` : `dans le site ${l[0]?.id}`);

const HORODATAGE = /^(\d{4})-(\d\d)-(\d\d)T(\d\d)(\d\d)(?:-(\d+))?$/;

/**
 * Le dossier d'horodatage le plus récent sous `dossier`, par son nom ; null s'il n'y en a pas.
 * @param {string} dossier
 */
export function plusRecent(dossier) {
  if (!existsSync(dossier)) return null;
  const noms = readdirSync(dossier, { withFileTypes: true })
    .filter((e) => e.isDirectory() && HORODATAGE.test(e.name))
    .map((e) => e.name);
  if (!noms.length) return null;
  const cle = (/** @type {string} */ n) => {
    const m = /** @type {RegExpExecArray} */ (HORODATAGE.exec(n));
    return [m.slice(1, 6).join(''), Number(m[6] ?? 1)];
  };
  noms.sort((a, b) => {
    const [x, i] = cle(a);
    const [y, j] = cle(b);
    return x < y ? -1 : x > y ? 1 : Number(i) - Number(j);
  });
  return { nom: /** @type {string} */ (noms.at(-1)), chemin: join(dossier, /** @type {string} */ (noms.at(-1))) };
}

/** « 2026-11-24T1334 » → « 24/11/2026 à 13 h 34 ». @param {string} nom */
const dateDe = (nom) => {
  const m = /** @type {RegExpExecArray} */ (HORODATAGE.exec(nom));
  return `${m[3]}/${m[2]}/${m[1]} à ${Number(m[4])} h ${m[5]}`;
};

/** Mot d'un argument du shell, entre apostrophes s'il le faut. @param {string} s */
const q = (s) => (/^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`);

/** Le nom d'un fichier ramené à sa forme simple : sans espace autour, sans casse, sans « (1) » avant l'extension. @param {string} n */
const simple = (n) => n.normalize('NFC').trim().toLowerCase().replace(/\s*\(\d+\)(?=\.[a-z]+$)/, '');

/**
 * Un fichier du dossier qui n'a pas le nom attendu, mais lui ressemble (D73) : espace autour du nom, autre casse,
 * « (1) » d'un second enregistrement. Null s'il n'y en a pas, ou si le fichier attendu existe.
 * @param {string} dossier @param {string} nom
 */
function voisin(dossier, nom) {
  if (!existsSync(dossier) || existsSync(join(dossier, nom))) return null;
  return readdirSync(dossier).find((f) => f !== nom && simple(f) === nom) ?? null;
}

/** « faite », ou « faite, 3 choix reportés » quand des choix restent ouverts (D73). @param {Etape} k */
export const etatDit = (k) => (k.etat === 'faite' && k.reportes ? `faite, ${nombre(k.reportes, 'choix reporté', 'choix reportés')}` : k.etat);

/** @param {Record<string, unknown>} o */
const trie = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));

/**
 * Calcule l'état du parcours.
 * @param {Projet} projet
 * @param {{ base?: string, voir?: string | null }} [opts]  base : dossier depuis lequel les commandes proposées sont lancées
 *   (défaut : le dossier courant) ; voir : un écran fait à revoir (D88), dont les données sont calculées même hors de
 *   son moment, sans rien changer d'autre à l'état
 * @returns {Etat}
 */
export function calculerEtat(projet, { base = process.cwd(), voir = null } = {}) {
  const { sites, sorties } = projet;
  const unSite = sites.length === 1;
  const premier = sites[0];
  /** Chemin d'un fichier pour une commande. @param {string} p */
  const c = (p) => q(relative(base, p) || '.');
  /** Adresse d'un fichier de sortie, sous le serveur. @param {string} p */
  const href = (p) => `/sorties/${relative(sorties, p).split(/[\\/]/).map(encodeURIComponent).join('/')}`;
  /** Adresses d'une commande sur un site : la première page en entier, les autres en chemin. @param {Site} s */
  const adresses = (s) => [q(s.origine + (s.pages[0] ?? '/')), ...s.pages.slice(1).map(q)].join(' ');
  const decisionsComposants = join(sorties, 'decisions-composants.json');
  const fichierDecisions = join(sorties, 'decisions.json');

  // Site : les pages sont retenues par l’IA, puis validées quand la mesure est lancée dans le chat (D89). Une mesure déjà
  // faite vaut validation.
  const sansPages = sites.filter((s) => !s.pages.length);
  const validees = pagesValidees(sorties);
  const memes = !!validees && sites.every((s) => JSON.stringify(validees[s.id] ?? []) === JSON.stringify(s.pages));
  const dejaMesure = sites.some((s) => plusRecent(join(sorties, 'composants', s.id, s.hote)));
  const comptes = sites.map((s) => s.pages.length);
  const pages = (/** @type {number} */ n) => (n ? nombre(n, 'page', 'pages') : 'aucune page');
  /** @type {Etape} */
  const site = {
    cle: 'site',
    nom: unSite ? 'Site' : 'Sites',
    temps: 'Mesurer',
    acteurs: 'le designer',
    faite: !sansPages.length && (memes || dejaMesure),
    etat: 'à venir',
    sortie: false,
    main: 'designer',
    action: sansPages.length
      ? unSite
        ? 'retenir les pages qui portent le plus de composants'
        : `retenir les pages qui portent le plus de composants ${lesSites(sansPages)}`
      : 'garder ou changer les pages à l’écran, puis lancer la mesure',
    commande: null,
    fait: unSite ? pages(comptes[0]) : comptes.every((n) => n === comptes[0]) ? `${sites.length} sites, ${pages(comptes[0])} chacun` : `${sites.length} sites : ${liste(comptes.map(String))} pages`,
    lignes: [],
    ecran: null,
    sansEcran: null,
    ouvre: '',
    reportes: 0,
  };

  // Constat, un par site.
  const constats = sites.map((s) => {
    const d = plusRecent(join(sorties, 'composants', s.id, s.hote));
    const f = d && join(d.chemin, 'constat.json');
    if (!d || !f || !existsSync(f)) return { site: s, constat: null, html: null };
    const html = join(d.chemin, 'constat.html');
    return { site: s, constat: lireJson(f), html: existsSync(html) ? html : null };
  });
  /** @param {any} k */
  const chiffres = (k) => `${nombre(k.chiffres.elements, 'élément', 'éléments')}, ${nombre(k.chiffres.types, 'type', 'types')}, ${nombre(k.chiffres.versions, 'version', 'versions')}`;
  /** @param {any} k */
  const choisies = (k) => `versions choisies : ${k.scores.versionsAGarder.x} sur ${k.scores.versionsAGarder.y}`;
  const sansConstat = constats.filter((x) => !x.constat);
  const aConstat = constats.filter((x) => x.constat);
  const premierEcran = constats.find((x) => x.html);
  const aMesurer = sansConstat[0]?.site;
  // Les choix que le parcours n'attend pas : les versions à garder de chaque type, choisies plus tard (D73).
  const versionsReportees = aConstat.reduce((n, x) => n + Math.max(0, (x.constat.scores?.versionsAGarder?.y ?? 0) - (x.constat.scores?.versionsAGarder?.x ?? 0)), 0);
  /** @type {Etape} */
  const constat = {
    cle: 'constat',
    nom: 'Mesure',
    temps: 'Mesurer',
    acteurs: 'l’outil',
    faite: !sansConstat.length,
    etat: 'à venir',
    sortie: aConstat.length > 0,
    main: 'outil',
    action: aMesurer ? (unSite ? 'lancer la mesure' : `lancer la mesure du site ${aMesurer.id}`) : null,
    // L'audit d'abord, page par page, puis le relevé des composants : l'ordre des lignes de « Où j'en suis » (D93).
    commande: aMesurer
      ? `npm run audit -- ${adresses(aMesurer)}${projet.sources ? ` --sources ${c(projet.sources)}` : ''} --out ${c(join(sorties, 'audit', aMesurer.id))} --avancement ${c(join(sorties, AVANCEMENT))} && npm run composants -- ${adresses(aMesurer)} --out ${c(join(sorties, 'composants', aMesurer.id))} --nom ${q(projet.produit)}${projet.signatures ? ` --signatures ${c(projet.signatures)}` : ''}${existsSync(decisionsComposants) ? ` --decisions ${c(decisionsComposants)}` : ''} --avancement ${c(join(sorties, AVANCEMENT))}`
      : null,
    fait: unSite ? (constats[0].constat ? chiffres(constats[0].constat) : null) : `${nombre(aConstat.length, 'site mesuré', 'sites mesurés')} sur ${sites.length}`,
    lignes: constats.map((x) =>
      x.constat ? `${unSite ? '' : `${x.site.id} : `}${chiffres(x.constat)} ; ${choisies(x.constat)}` : `${x.site.id} : pas encore mesuré`,
    ),
    ecran: premierEcran?.html ? { href: href(premierEcran.html), titre: unSite ? 'La dette' : `La dette du site ${premierEcran.site.id}` } : null,
    sansEcran: null,
    ouvre: unSite ? 'S’ouvre quand le site a ses pages.' : 'S’ouvre quand chaque site a ses pages.',
    reportes: versionsReportees,
  };

  // Marques, une par site.
  const marques = sites.map((s) => {
    if (!s.entree) return { site: s, statut: 'sans entrée', nom: s.id, motifs: [], planche: null };
    if (!existsSync(s.entree)) return { site: s, statut: 'entrée absente', nom: s.id, motifs: [], planche: null };
    const fv = join(sorties, 'saisies', `${s.id}.json`);
    const v = existsSync(fv) ? lireJson(fv) : null;
    const nom = typeof v?.name === 'string' ? v.name : s.id;
    const planche = s.dossierMarque && existsSync(join(s.dossierMarque, 'roles.html')) ? `/marques/${s.id}/roles.html` : null;
    if (!v) return { site: s, statut: 'à saisir', nom, motifs: [], planche: null };
    const empreinte = createHash('sha256').update(readFileSync(s.entree)).digest('hex');
    if (v.entree !== empreinte) return { site: s, statut: 'entrée changée', nom, motifs: [], planche: null };
    return { site: s, statut: v.verdict === 'acceptée' ? 'acceptée' : 'refusée', nom, motifs: Array.isArray(v.motifs) ? v.motifs : [], planche: v.verdict === 'acceptée' ? planche : null };
  });
  /** @param {(typeof marques)[number]} m */
  const texteMarque = (m) =>
    m.statut === 'acceptée' ? `${m.nom}, acceptée`
    : m.statut === 'refusée' ? `${m.nom}, refusée : ${m.motifs[0] ?? 'motif absent du verdict'}`
    : m.statut === 'à saisir' ? `${m.nom}, à saisir`
    : m.statut === 'entrée changée' ? `${m.nom}, entrée changée depuis la saisie`
    : m.statut === 'entrée absente' ? `entrée absente : ${relative(projet.dossier, /** @type {string} */ (m.site.entree))}`
    : 'pas de marque : écrire brand dans projet.json';
  const aFaire = marques.find((m) => m.statut !== 'acceptée');
  // Après la saisie, les planches, la feuille CSS et le thème de la marque (D83).
  const ecrireDeLaMarque = (/** @type {string} */ d) => `node src/cli/planche.js --marque ${c(d)} && npm run css -- --marque ${c(d)} && npm run vuetify -- --marque ${c(d)} && npm run captures -- --marque ${c(d)}`;
  const statuts = ['acceptée', 'refusée', 'à saisir', 'entrée changée', 'entrée absente', 'sans entrée'];
  const pluriels = { acceptée: 'acceptées', refusée: 'refusées', 'à saisir': 'à saisir', 'entrée changée': 'entrées changées', 'entrée absente': 'entrées absentes', 'sans entrée': 'sans entrée' };
  const planche = marques.find((m) => m.planche);
  /** @type {Etape} */
  const etapeMarques = {
    cle: 'marques',
    nom: unSite ? 'Marque' : 'Marques',
    temps: 'Décider',
    acteurs: 'le designer, puis l’outil',
    faite: !aFaire,
    etat: 'à venir',
    sortie: marques.some((m) => m.statut === 'acceptée' || m.statut === 'refusée' || m.statut === 'entrée changée'),
    main: aFaire && (aFaire.statut === 'à saisir' || aFaire.statut === 'entrée changée') ? 'outil' : 'designer',
    action: !aFaire
      ? null
      : aFaire.statut === 'refusée'
        ? `corriger l’entrée ${deNom(aFaire.nom)} (${aFaire.motifs[0] ?? 'motif absent du verdict'}), puis la saisir à nouveau`
        : aFaire.statut === 'à saisir' || aFaire.statut === 'entrée changée'
          ? unSite ? 'saisir la marque' : `saisir la marque du site ${aFaire.site.id}`
          : aFaire.statut === 'entrée absente'
            ? `écrire l’entrée de la marque : ${relative(projet.dossier, /** @type {string} */ (aFaire.site.entree))}`
            : unSite ? 'écrire l’entrée de la marque et la nommer dans projet.json (brand)' : `écrire l’entrée de la marque du site ${aFaire.site.id} et la nommer dans projet.json (brand)`,
    commande:
      aFaire && (aFaire.statut === 'à saisir' || aFaire.statut === 'entrée changée')
        ? `npm run saisie -- ${c(/** @type {string} */ (aFaire.site.entree))} --verdict ${c(join(sorties, 'saisies', `${aFaire.site.id}.json`))} && ${ecrireDeLaMarque(/** @type {string} */ (aFaire.site.dossierMarque))}`
        : null,
    fait: unSite
      ? texteMarque(marques[0])
      : statuts
          .map((st) => /** @type {[string, number]} */ ([st, marques.filter((m) => m.statut === st).length]))
          .filter(([, n]) => n)
          .map(([st, n]) => `${n} ${n > 1 ? pluriels[/** @type {keyof typeof pluriels} */ (st)] : st}`)
          .join(', '),
    lignes: unSite ? [] : marques.map((m) => `${m.site.id} : ${texteMarque(m)}`),
    ecran: planche?.planche ? { href: planche.planche, titre: unSite ? 'Planche des rôles' : `Planche des rôles : ${planche.nom}` } : null,
    sansEcran: null,
    ouvre: 'S’ouvre quand la mesure est faite.',
    refus: marques.some((m) => m.statut === 'refusée'),
    reportes: 0,
  };

  // Décisions, sur le premier site.
  const red = plusRecent(join(sorties, 'reductions', premier.hote));
  const fTable = red && join(red.chemin, 'table.json');
  const table = fTable && existsSync(fTable) ? lireJson(fTable) : null;
  const decisions = existsSync(fichierDecisions) ? lireJson(fichierDecisions) : (table?.decisions ?? {});
  // Le même compte que la sortie de reduce (D73).
  const { total, enAttente } = table ? compterDecisions({ families: table.table?.families ?? {}, pleins: table.table?.pleins ?? [] }, decisions) : { total: 0, enAttente: 0 };
  const voisinDecisions = table && enAttente ? voisin(sorties, 'decisions.json') : null;
  const nonLues = !!table && existsSync(fichierDecisions) && trie(table.decisions ?? {}) !== trie(decisions);
  const sansModifs = !!red && !existsSync(join(red.chemin, 'modifications.json'));
  const resolver = premier.dossierMarque ? join(premier.dossierMarque, RESOLVER) : null;
  const reduire = (/** @type {boolean} */ avecDecisions) =>
    resolver && projet.cible
      ? `npm run reduce -- ${adresses(premier)} --target ${c(projet.cible)} --tokens ${c(resolver)} --brand-colors${projet.sources ? ` --sources ${c(projet.sources)}` : ''}${avecDecisions ? ` --decisions ${c(fichierDecisions)}` : ''} --references ${c(join(sorties, 'references'))} --out ${c(join(sorties, 'reductions'))}`
      : null;
  const revue = red && existsSync(join(red.chemin, 'revue.html')) ? join(red.chemin, 'revue.html') : null;
  /** @type {Etape} */
  const etapeDecisions = {
    cle: 'decisions',
    nom: 'Décisions',
    temps: 'Décider',
    acteurs: 'le designer',
    faite: !!table && !enAttente && !nonLues && !sansModifs,
    etat: 'à venir',
    sortie: !!table,
    main: !table ? (projet.cible ? 'outil' : 'designer') : enAttente ? 'designer' : 'outil',
    action: !table
      ? projet.cible ? 'lancer la réduction' : 'écrire la cible (target) dans projet.json'
      : voisinDecisions
        ? `un fichier voisin, ${JSON.stringify(voisinDecisions)}, est dans ${sorties} : le renommer en decisions.json`
        : enAttente
          ? `trancher ${nombre(enAttente, 'décision', 'décisions')} dans la revue, puis exporter ; le fichier glissé dans le chat se range sous decisions.json dans ${sorties}`
          : 'relancer la réduction avec les décisions',
    commande: !table ? reduire(false) : enAttente ? null : reduire(existsSync(fichierDecisions)),
    fait: table ? (total ? `${nombre(total - enAttente, 'décision tranchée', 'décisions tranchées')} sur ${total}` : 'aucune décision à prendre') : null,
    lignes: [],
    ecran: revue ? { href: href(revue), titre: 'Revue' } : null,
    sansEcran: null,
    ouvre: unSite ? 'S’ouvre quand la marque est acceptée.' : 'S’ouvre quand chaque marque est acceptée.',
    reportes: 0,
  };

  // La revue rouverte (D86) : « Revenir sur une décision » rend la revue au designer, jusqu'à un nouvel export.
  const fRevue = join(sorties, REVUE_ROUVERTE);
  const rouverte = !!table && existsSync(fRevue) && lireJson(fRevue).decisions === empreinteDesChoix(sorties);
  if (rouverte)
    Object.assign(etapeDecisions, {
      faite: false,
      main: 'designer',
      action: `revenir sur une décision dans la revue, puis exporter ; le fichier glissé dans le chat se range sous decisions.json dans ${sorties}`,
      commande: null,
    });

  // Livraison et suivi, sur le premier site. Les feuilles ajoutées sont rangées sous le nom de la réduction dont elles
  // viennent ; une vérification ne vaut que pour ces feuilles-là, avec l'avant et l'après de chaque page (D86).
  const dossierAjout = join(sorties, 'ajout', ...(red ? [red.nom] : []));
  const aManifeste = !!red && existsSync(join(dossierAjout, 'feuilles-ajoutees.json'));
  const ver = plusRecent(join(sorties, 'verify', premier.hote));
  const fVerdict = ver && join(ver.chemin, 'verdict.json');
  /** Le dossier d'une page vérifiée : un par page, sauf pour une page seule. @param {string} p */
  const dossierDePage = (p) => (premier.pages.length > 1 ? join(/** @type {{ chemin: string }} */ (ver).chemin, pageName(new URL(p, premier.origine).href)) : /** @type {{ chemin: string }} */ (ver).chemin);
  const vues = ver && aManifeste
    ? premier.pages.map((p) => {
        const d = dossierDePage(p);
        const fv = join(d, 'verification.json');
        const ajout = existsSync(fv) ? lireJson(fv).ajout : null;
        const [avant, apres] = [join(d, 'avant.png'), join(d, 'actuel.png')];
        return existsSync(avant) && existsSync(apres) && typeof ajout === 'string' && basename(ajout) === red?.nom
          ? { nom: premier.noms[p] ?? p, avant: href(avant), apres: href(apres), direct: `/direct/${encodeURIComponent(premier.id)}?page=${encodeURIComponent(p)}`, plusHaute: /** @type {'avant' | 'apres'} */ (taillePng(avant)[1] >= taillePng(apres)[1] ? 'avant' : 'apres') }
          : null;
      })
    : [];
  const verifie = !!fVerdict && existsSync(fVerdict) && vues.length > 0 && vues.every(Boolean);
  const verdict = verifie ? lireJson(/** @type {string} */ (fVerdict)) : null;
  const fValide = join(sorties, RENDU_VALIDE);
  const valide = !!verdict && existsSync(fValide) && lireJson(fValide).verification === ver?.nom;
  const lignesVerdict = /** @type {any[]} */ (verdict?.lignes ?? []);
  const arrivees = lignesVerdict.filter((l) => l.etat === 'arrivée').length;
  const prouver = `npm run verify -- ${adresses(premier)} --reference ${c(join(sorties, 'references'))}${projet.sources ? ` --sources ${c(projet.sources)}` : ''} --ajout ${c(dossierAjout)} --out ${c(join(sorties, 'verify'))}`;
  const arriveesSur = `${nombre(arrivees, 'changement arrivé', 'changements arrivés')} sur ${lignesVerdict.length}`;
  /** @type {Etape} */
  const livraison = {
    cle: 'livraison',
    nom: 'Livraison',
    temps: 'Vérifier',
    acteurs: 'le designer, puis le développeur',
    faite: aManifeste && verdict?.sortie === 0 && valide,
    etat: 'à venir',
    sortie: aManifeste,
    // Poser les feuilles ajoutées n'écrit que dans les sorties : la main est à l'outil ; le designer regarde l'avant et
    // après ; le développeur a la main sur l'installation (D73, D86).
    main: !aManifeste || !verdict ? 'outil' : !valide ? 'designer' : 'développeur',
    action: !aManifeste
      ? 'poser les feuilles ajoutées'
      : !verdict
        ? 'prouver la livraison sur les pages, avant et après'
        : !valide
          ? 'regarder l’avant et après, puis valider le rendu'
          : `dire ce qui est vérifié et ce qui n’est pas arrivé, sans rien ouvrir : ${nombre(lignesVerdict.length - arrivees, 'changement n’est pas arrivé', 'changements ne sont pas arrivés')}`,
    commande: !aManifeste ? (red ? `npm run ajout -- --modifications ${c(join(red.chemin, 'modifications.json'))} --sortie ${c(dossierAjout)}` : null) : !verdict ? prouver : null,
    fait: verdict ? `${arriveesSur}, ${nombre(verdict.pages?.length ?? 0, 'page', 'pages')}` : aManifeste ? 'feuilles ajoutées, pas encore prouvées' : null,
    lignes: [],
    ecran: null,
    sansEcran: null,
    ouvre: 'S’ouvre quand les décisions sont prises.',
    reportes: 0,
  };
  /** @type {Etape} */
  const suivi = {
    cle: 'suivi',
    nom: 'Remise',
    temps: 'Remettre',
    acteurs: 'l’outil',
    faite: false,
    etat: 'à venir',
    sortie: false,
    main: 'outil',
    action: 'relancer le contrôle',
    commande: prouver,
    fait: verdict && ver ? `dernier contrôle : ${dateDe(ver.nom)}, ${arriveesSur}` : null,
    lignes: [],
    ecran: null,
    sansEcran: null,
    ouvre: 'S’ouvre quand le rendu est validé.',
    reportes: 0,
  };

  // La dette (D78) : la mesure faite, l’écran attend « Définir ma marque », dans le chat, avant la marque.
  const enDette = constat.faite && !etapeMarques.sortie && !existsSync(join(sorties, DETTE_VUE));
  if (enDette) Object.assign(etapeMarques, { main: 'designer', action: 'regarder la dette, puis passer à la marque', commande: null });
  /** La dette du premier site mesuré. @returns {Etat['dette']} */
  const detteDuSite = () => {
    if (!premierEcran?.constat) return null;
    const s = premierEcran.site;
    const a = plusRecent(join(sorties, 'audit', s.id, s.hote));
    const fa = a && join(a.chemin, 'audit.json');
    const rapport = a && join(a.chemin, 'rapport.html');
    const dossier = /** @type {string} */ (premierEcran.html).replace(/[\\/][^\\/]+$/, '');
    return {
      site: s,
      pages: s.pages.map((p) => s.noms[p] ?? p),
      ...detteDe({ constat: premierEcran.constat, audit: fa && existsSync(fa) ? lireJson(fa) : null }),
      valeursHref: rapport && existsSync(rapport) ? href(rapport) : null,
      composantsHref: href(/** @type {string} */ (premierEcran.html)),
      captures: href(dossier),
      autres: constats.filter((x) => x.site !== s && x.html).map((x) => ({ id: x.site.id, nom: x.site.nom ?? x.site.id, href: href(/** @type {string} */ (x.html)) })),
    };
  };
  let dette = enDette ? detteDuSite() : null;
  // La marque (D80) : la dette vue, le premier site sans entrée de marque la choisit à l'écran, lue dans la mesure.
  /** La marque d'un site, lue dans sa mesure, avec le choix fait à l'écran. @param {Site} s @returns {Etat['marque']} */
  const marqueDu = (s) => {
    const a = plusRecent(join(sorties, 'audit', s.id, s.hote));
    const fa = a && join(a.chemin, 'audit.json');
    const lecture = fa && existsSync(fa) ? lireMarque(lireJson(fa)) : null;
    if (!lecture) return null;
    const fc = join(sorties, MARQUE_CHOISIE);
    const choix = existsSync(fc) ? { ...lecture.choix, ...(lireJson(fc)[s.id] ?? {}) } : lecture.choix;
    // La planche des rôles n'existe qu'une fois les fondations écrites (D96).
    return { site: s, lecture, choix, apercu: apercu(projet.produit, choix), planche: marques.find((m) => m.site === s)?.planche ?? null };
  };
  /** @type {Etat['marque']} */
  let marque = null;
  const sansEntree = marques.find((m) => m.statut === 'sans entrée' || m.statut === 'entrée absente');
  if (constat.faite && !enDette && sansEntree) {
    marque = marqueDu(sansEntree.site);
    if (marque) Object.assign(etapeMarques, { main: 'designer', action: 'choisir la marque à l’écran, puis la confirmer', commande: null });
  }
  // Les fondations (D83), sur le chemin des écrans (la dette vue) : la marque acceptée, ce qu'elle écrit à côté de ses
  // jetons doit l'être aussi ; puis l’écran attend « Comparer mon site », dans le chat, avant la réduction.
  const parEcran = existsSync(join(sorties, DETTE_VUE));
  const dossierPremier = premier.dossierMarque;
  const ecrits = !!dossierPremier && ECRITS_DE_LA_MARQUE.every((f) => existsSync(join(dossierPremier, f)));
  if (parEcran && etapeMarques.faite && !ecrits && dossierPremier)
    Object.assign(etapeMarques, { faite: false, main: 'outil', action: 'écrire les planches, la feuille CSS, le thème et les composants de la marque', commande: ecrireDeLaMarque(dossierPremier) });
  /** Les fondations de la marque du premier site. @returns {Etat['fondations']} */
  const fondationsDuSite = () => {
    const a = plusRecent(join(sorties, 'audit', premier.id, premier.hote));
    const fa = a && join(a.chemin, 'audit.json');
    return {
      ...fondationsDe(/** @type {string} */ (dossierPremier)),
      site: premier,
      avant: fa && existsSync(fa) ? valeursDe(lireJson(fa)).total : null,
      planche: `/marques/${encodeURIComponent(premier.id)}/`,
    };
  };
  /** @type {Etat['fondations']} */
  let fondations = null;
  if (parEcran && etapeMarques.faite && ecrits && !table && !existsSync(join(sorties, FONDATIONS_VUES))) {
    fondations = fondationsDuSite();
    Object.assign(etapeDecisions, { main: 'designer', action: 'regarder les fondations, puis voir tes composants', commande: null });
  }
  // Les composants à la marque (D101) : les fondations vues, l'écran attend « Comparer mon site », dans le chat, avant la réduction.
  /** Les composants de Diapason à la marque du premier site, et ce qu'ils remplacent sur ses pages. @returns {Etat['composants']} */
  const composantsDuSite = () => {
    const d = detteDuSite();
    if (!d || !dossierPremier) return null;
    const dossier = dossierPremier;
    /** @param {string} cle */
    const image = (cle) => {
      const f = join(dossier, captureDe(cle));
      if (!existsSync(f)) return null;
      // Capturée au double des pixels : affichée à sa taille.
      const [l, h] = taillePng(f);
      return { src: `/marques/${encodeURIComponent(premier.id)}/${captureDe(cle)}`, largeur: Math.round(l / 2), hauteur: Math.round(h / 2) };
    };
    /** @type {NonNullable<Etat['composants']>['remplace']} */
    const remplace = [];
    for (const t of d.composants.types) {
      const c = composantDuType(t.nom);
      if (!c) continue;
      const deja = remplace.find((x) => x.cle === c.cle);
      if (deja) Object.assign(deja, { versions: [...deja.versions, ...t.versions], fois: deja.fois + t.fois, hauteurs: [...new Set([...deja.hauteurs, ...t.hauteurs])].sort((a, b) => a - b) });
      else remplace.push({ cle: c.cle, nom: c.nom, phrase: c.phrase, versions: t.versions, fois: t.fois, hauteurs: t.hauteurs, image: image(c.cle) });
    }
    remplace.sort((a, b) => COMPOSANTS.findIndex((c) => c.cle === a.cle) - COMPOSANTS.findIndex((c) => c.cle === b.cle));
    // Les captures du site, prises au double des pixels par le relevé : affichées à leur taille, comme le composant.
    const releve = /** @type {string} */ (premierEcran?.html).replace(/[\\/][^\\/]+$/, '');
    /** @type {Record<string, [number, number]>} */
    const tailles = {};
    for (const v of d.composants.types.flatMap((t) => t.versions))
      if (v.capture && existsSync(join(releve, v.capture))) tailles[v.capture] = /** @type {[number, number]} */ (taillePng(join(releve, v.capture)).map((x) => Math.round(x / 2)));
    return {
      captures: d.captures,
      tailles,
      remplace,
      pasEncore: d.composants.types.filter((t) => !composantDuType(t.nom)).map((t) => ({ nom: t.nom, versions: t.versions, fois: t.fois })),
      autres: COMPOSANTS.filter((c) => !remplace.some((x) => x.cle === c.cle)).map((c) => ({ cle: c.cle, nom: c.nom, image: image(c.cle) })),
    };
  };
  /** @type {Etat['composants']} */
  let composants = null;
  if (parEcran && etapeMarques.faite && ecrits && !table && existsSync(join(sorties, FONDATIONS_VUES)) && !existsSync(join(sorties, COMPOSANTS_VUS))) {
    composants = composantsDuSite();
    if (composants) Object.assign(etapeDecisions, { main: 'designer', action: 'regarder tes composants à ta marque, puis comparer ton site', commande: null });
  }
  const etapes = [site, constat, etapeMarques, etapeDecisions, livraison, suivi];
  const reportes = etapes.reduce((n, e) => n + e.reportes, 0);
  const i = etapes.findIndex((e) => !e.faite);
  etapes.forEach((e, k) => (e.etat = k === i ? 'en cours' : e.faite ? 'faite' : 'à venir'));
  const courante = etapes[i];
  const temps = TEMPS.map(([nom, cles]) => {
    const es = etapes.filter((e) => /** @type {readonly string[]} */ (cles).includes(e.cle));
    return { nom, etapes: /** @type {CleEtape[]} */ ([...cles]), etat: /** @type {EtatEtape} */ (es.every((e) => e.etat === 'faite') ? 'faite' : es.some((e) => e.etat === 'en cours') ? 'en cours' : 'à venir') };
  });

  // Le moment : le dernier résultat reste à l'écran jusqu'à ce que l'étape suivante ait produit une sortie.
  /** @type {Etat['ecran']} */
  let ecran = null;
  if (courante.ecran && courante.sortie) ecran = { ...courante.ecran, etape: courante.cle, precedente: false };
  else if (!courante.sortie && i > 0 && etapes[i - 1].ecran) ecran = { .../** @type {Ecran} */ (etapes[i - 1].ecran), etape: etapes[i - 1].cle, precedente: true };
  // Pendant la mesure, un écran d'attente (D77) : les pages sont validées, aucune n'est encore mesurée.
  // La saisie en cours après « Confirmer ma marque » : l'écran d'attente, jusqu'aux fondations (D83).
  const moment =
    courante.cle === 'site' ? 'pages'
    : courante.cle === 'constat' && !constat.sortie ? 'mesure'
    : courante.cle === 'marques' && enDette ? 'dette'
    : courante.cle === 'marques' && marque ? 'marque'
    : courante.cle === 'marques' && parEcran && courante.main === 'outil' ? 'jetons'
    : courante.cle === 'decisions' && fondations ? 'fondations'
    : courante.cle === 'decisions' && composants ? 'composants'
    : courante.cle === 'livraison' && verdict && !valide ? 'avant-apres'
    : (courante.cle === 'livraison' || courante.cle === 'suivi') && valide ? 'remise'
    : ecran ? 'ecran'
    : 'sans-ecran';
  const refus = etapeMarques.refus && (ecran?.etape === 'marques' || (!ecran && courante.cle === 'marques'));
  const phrase =
    moment === 'pages' || moment === 'mesure' || moment === 'dette' || moment === 'marque' || moment === 'jetons' || moment === 'fondations' || moment === 'composants' || moment === 'avant-apres' || moment === 'remise' ? null
    : refus ? PHRASES.refus
    : ecran?.etape === 'constat' ? PHRASES.constat
    : ecran?.etape === 'marques' ? PHRASES.marque
    : ecran?.etape === 'decisions' ? PHRASES.revue
    : null;

  /** @type {Bilan | null} */
  let bilan = null;
  if (moment === 'remise') {
    // Avant : le compte de la dette, le même calcul (D86) ; après : le même calcul sur les pages avec les feuilles,
    // relevées par le contrôle (D99), sinon le compte de la réduction.
    const a = plusRecent(join(sorties, 'audit', premier.id, premier.hote));
    const fa = a && join(a.chemin, 'audit.json');
    const couleursDe = (/** @type {string} */ fichier) => valeursDe(lireJson(fichier)).familles.find((x) => x.cle === 'colors')?.compte;
    const avant = fa && existsSync(fa) ? couleursDe(fa) : undefined;
    const fApres = ver && join(ver.chemin, VALEURS_APRES);
    const mesuree = fApres && existsSync(fApres) ? couleursDe(fApres) : undefined;
    const calculee = table?.table?.families?.colors?.summary?.after;
    const apres = mesuree ?? calculee;
    const enEtat = lignesVerdict.filter((l) => l.etat === 'non vérifiable (état)').map((l) => String(l.titre ?? l.id));
    const complet = marques.every((m) => m.statut === 'acceptée') && verdict?.sortie === 0;
    const constatDuSite = aConstat.find((x) => x.site === premier)?.constat;
    bilan = {
      couleurs: avant !== undefined && typeof apres === 'number' ? { avant, apres, mesure: mesuree !== undefined } : null,
      pages: premier.pages.length,
      decisions: total - enAttente,
      changements: lignesVerdict.filter((l) => l.etat !== 'hors des pages vérifiées').length,
      arrivees,
      enEtat,
      composants: constatDuSite ? detteDe({ constat: constatDuSite, audit: null }).composants.types.map((t) => ({ nom: t.nom, versions: t.versions.length, fois: t.fois })) : [],
      dernier: `Dernier contrôle : ${ver ? dateDe(ver.nom) : 'aucun'}, ${arriveesSur}.`,
      complet,
      manque: [
        ...marques.filter((m) => m.statut !== 'acceptée').map((m) => `la marque du site ${m.site.id}, acceptée`),
        ...(verdict?.sortie === 0 ? [] : ['un dernier contrôle sans ligne manquante']),
      ],
      humain: [
        unSite ? 'les pages hors de l’échantillon' : 'les pages hors des échantillons',
        ...(unSite ? [] : [`${lesSites(sites.slice(1)).replace(/^dans /, '')}, sans preuve`]),
      ],
    };
  }

  // L'avant et après (D86) : les pages vérifiées, et ce qui a changé, compté par famille sur les lignes du verdict.
  /** @type {AvantApres | null} */
  let avantApres = null;
  if ((moment === 'avant-apres' || (voir === 'avant-apres' && valide)) && verdict && ver) {
    const parId = new Map(/** @type {any[]} */ (lireJson(join(dossierAjout, 'feuilles-ajoutees.json')).lignes ?? []).map((l) => [l.id, l]));
    const changements = lignesVerdict.filter((l) => l.etat !== 'hors des pages vérifiées');
    /** Ce que la ligne touche : son titre, sans la famille. @param {any} l */
    const ou = (l) => String(l.titre ?? l.id).replace(/^[^·]*·\s*/, '');
    avantApres = {
      verification: ver.nom,
      dossierAjout,
      vues: /** @type {AvantApres['vues']} */ (vues),
      pages: premier.pages.length,
      decisions: total,
      changements: changements.length,
      arrivees,
      manquantes: changements.filter((l) => ['non arrivée', 'en partie', 'non vue', 'déjà en place'].includes(l.etat)).map((l) => String(l.titre ?? l.id)),
      enEtat: changements.filter((l) => l.etat === 'non vérifiable (état)').map((l) => String(l.titre ?? l.id)),
      familles: /** @type {const} */ ([
        ['colors', 'couleurs'],
        ['spacing', 'espacements'],
        ['fontSizes', 'tailles de texte'],
        ['radii', 'arrondis'],
      ]).map(([cle, titre]) => {
        const ls = changements.filter((l) => parId.get(l.id)?.famille === cle);
        // L'exemple : le changement qui touche le plus d'éléments.
        const ex = [...ls].sort((x, y) => (y.elements?.total ?? 0) - (x.elements?.total ?? 0))[0];
        const m = ex && parId.get(ex.id);
        return { cle, titre, compte: ls.length, exemple: m ? { ancienne: String(m.ancienne), nouvelle: String(m.nouvelle), ou: ou(ex) } : null };
      }),
    };
  }

  // Les écrans faits qui se revoient (D88), et, pour l'écran à revoir, ses données hors de son moment.
  const vueMarque = parEcran && etapeMarques.faite && marques[0].statut === 'acceptée' ? marqueDu(premier) : null;
  /** @type {Revu[]} */
  const revoir = /** @type {Revu[]} */ (
    /** @type {[Revu, boolean][]} */ ([
      ['pages', site.faite],
      ['dette', parEcran && !!premierEcran?.constat],
      ['marque', !!vueMarque],
      ['fondations', parEcran && ecrits && existsSync(join(sorties, FONDATIONS_VUES))],
      // Un projet passé à la réduction avant cet écran (D101) le revoit aussi.
      ['composants', parEcran && ecrits && existsSync(join(sorties, FONDATIONS_VUES)) && (existsSync(join(sorties, COMPOSANTS_VUS)) || !!table)],
      ['revue', !!revue && !!table],
      ['avant-apres', valide],
    ])
      .filter(([, oui]) => oui)
      .map(([k]) => k)
  );
  if (voir === 'dette' && !dette && revoir.includes('dette')) dette = detteDuSite();
  if (voir === 'marque' && !marque && vueMarque) marque = vueMarque;
  if (voir === 'fondations' && !fondations && revoir.includes('fondations')) fondations = fondationsDuSite();
  if (voir === 'composants' && !composants && revoir.includes('composants')) composants = composantsDuSite();

  // Où j'en suis (D93) : la mesure, page par page, puis le relevé des composants ; l'écriture des tokens, étape par
  // étape, chaque fichier fait s'il est plus récent que l'entrée de la marque.
  /** @type {Etat['mesure']} */
  let mesure = null;
  if (moment === 'mesure') {
    const a = lireAvancement(join(sorties, AVANCEMENT));
    const PAGE = { mesurée: 'Mesurée', 'en cours': 'En cours', 'pas mesurée': 'Pas mesurée' };
    const RELEVE = { fait: 'Fait', 'en cours': 'En cours', 'pas fait': 'Pas fait' };
    mesure = {
      sites: constats.map(({ site: s, constat: fait }) => ({
        id: s.id,
        nom: s.nom ?? s.id,
        pages: s.pages.map((p) => ({ nom: s.noms[p] ?? p, detail: new URL(p, s.origine).host + p, etat: fait ? 'Mesurée' : PAGE[a.pages[new URL(p, s.origine).href]] ?? 'À faire' })),
        composants: { nom: 'Le relevé des composants', detail: 'Les boutons, les champs, les liens et leurs versions.', etat: fait ? 'Fait' : RELEVE[a.releves[resolve(join(sorties, 'composants', s.id))]] ?? 'À faire' },
      })),
      arret: null,
    };
    // Un relevé pas fait, sans constat : la mesure s'est arrêtée, l'écran et le chat le disent (D104).
    const arrete = constats.find(({ site: s, constat: fait }) => !fait && a.releves[resolve(join(sorties, 'composants', s.id))] === 'pas fait');
    if (arrete) {
      const raison = a.raisons[resolve(join(sorties, 'composants', arrete.site.id))];
      mesure.arret = `Le relevé des composants${unSite ? '' : ` du site ${arrete.site.nom ?? arrete.site.id}`} s’est arrêté${raison ? ` : ${raison}` : ''}.`;
    }
  }
  /** @type {Etat['preparation']} */
  let preparation = null;
  if (moment === 'jetons' && premier.entree && existsSync(premier.entree)) {
    const depuis = statSync(premier.entree).mtimeMs;
    const fait = (/** @type {string[]} */ fichiers) => fichiers.every((f) => existsSync(f) && statSync(f).mtimeMs >= depuis);
    const d = /** @type {string} */ (premier.dossierMarque);
    const etapesTokens = [
      ['Les tokens de ta marque', 'Les douze pas de tes couleurs, les rôles et leurs contrôles.', [join(sorties, 'saisies', `${premier.id}.json`)]],
      ['Les planches', 'Les rôles, les espacements et les textes, à regarder.', ['roles.html', 'espacements.html', 'typo.html'].map((f) => join(d, f))],
      ['La feuille de variables', 'Les tokens, en variables CSS.', [join(d, 'jetons.css')]],
      ['Le thème', 'Le thème Vuetify de ta marque.', [join(d, 'vuetify.json')]],
      ['Tes composants', 'Les composants de Diapason, capturés aux couleurs de ta marque.', COMPOSANTS.map((x) => join(d, captureDe(x.cle)))],
    ];
    const faits = etapesTokens.map(([, , f]) => fait(/** @type {string[]} */ (f)));
    const premiere = faits.indexOf(false);
    preparation = etapesTokens.map(([nom, detail], i) => ({ nom: String(nom), detail: String(detail), etat: faits[i] ? 'Fait' : i === premiere ? 'En cours' : 'À faire' }));
  }

  return {
    produit: projet.produit,
    sites,
    mesure,
    preparation,
    revoir,
    revue: revue ? href(revue) : null,
    sousTitre: unSite ? null : `${sites.length} sites, ${nombre(sites.length, 'marque', 'marques')}`,
    unSite,
    etapes,
    temps,
    courante,
    moment,
    ecran,
    phrase,
    bilan,
    chiffres: {
      versions: aConstat.length ? aConstat.reduce((n, x) => n + (x.constat.chiffres?.versions ?? 0), 0) : null,
      valeurs: dette?.valeurs?.total ?? null,
      decisions: table ? total : null,
      enAttente: table ? enAttente : null,
      reportes,
    },
    voisin: voisinDecisions,
    dette,
    marque,
    fondations,
    composants,
    avantApres,
    remise:
      moment === 'remise' && red
        ? remiseDe({ produit: projet.produit, dossierProjet: projet.dossier, site: premier, dossierAjout, modifications: join(red.chemin, 'modifications.json') })
        : null,
    livraison: verdict
      ? {
          pages: verdict.pages?.length ?? 0,
          arrivees,
          total: lignesVerdict.length,
          manquantes: lignesVerdict
            .filter((l) => l.etat === 'non arrivée' || l.etat === 'en partie' || l.etat === 'non vue')
            .map((l) => ({ titre: String(l.titre ?? l.id ?? ''), elements: l.elements?.total ?? 0, cause: /cause : ([^;]+)/.exec(String(l.texte ?? ''))?.[1].trim() ?? null })),
        }
      : null,
  };
}

/** « au designer », « au développeur », « à l'outil ». @param {Main | null} m */
export const aLaMain = (m) => (m === 'outil' ? 'à l’outil' : m === 'développeur' ? 'au développeur' : 'au designer');

/**
 * Les lignes du terminal : au plus six.
 * @param {Etat} e @param {{ page: string, adresse?: string }} o
 */
export function lignesTerminal(e, o) {
  const k = e.courante;
  return [
    `${e.produit}${e.sousTitre ? ` · ${e.sousTitre}` : ''}`,
    `En cours : ${k.temps} · ${k.nom}`,
    `La main est ${aLaMain(k.main)}.`,
    ...(k.action ? [`À faire : ${k.action}.`] : []),
    ...(k.commande ? [`Commande suivante : ${k.commande}`] : []),
    o.adresse ? `Page servie sur ${o.adresse} ; écrite : ${o.page}` : `Page : ${o.page} ; à servir avec --servir`,
  ];
}
