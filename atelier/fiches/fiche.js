// Fiches des composants (D56) et des modules : une fiche Markdown par composant, dans docs/composants/, et par module,
// dans docs/modules/, dont l'en-tête et cinq blocs sont écrits depuis les props, le .vue, sa story, la table des noms et
// les tokens ; le reste est écrit à la main, et en partie contrôlé. Chaque index (README.md) a son bloc écrit ici ; le
// glossaire, sous le bloc de l'index des composants, est écrit à la main. Les contrastes d'un composant viennent de la
// fonction même de npm run contraste (loadRoles, contratRoles), écrits comme elle les écrit ; un module n'a pas de
// couleur propre, ses blocs renvoient aux fiches de ce qu'il assemble. Les règles contrôlées ici sont dans
// docs/regles.md : NM1 à NM3 et NM5 (table des noms), DOC1 à DOC5.
//
// Un bloc : une ligne « <!-- genere:<bloc> : écrit par … --> », son contenu, une ligne « <!-- /genere:<bloc> --> ».
// Une marque absente, en double ou ouverte sans fin est une panne, comme une variable du thème inconnue de la table, un
// token sans description, une variable ds- écrite et inconnue, une règle sans message lisible ou un exemple hors
// grammaire : l'erreur nomme le fichier. Un écart (bloc à régénérer, section, ligne de prop, décision, dette, story,
// exemple refusé, mot refusé, fiche trop longue, nom hors de la table) est une ligne.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { contratRoles, loadRoles } from '../../src/tokens/roles.js';
import { dossiersDeMarque, nomDeMarque } from '../../src/tokens/resolver.js';
import { fr } from '../../src/lib/format.js';
import { HorsGrammaire, verifierExemple } from './exemple.js';

export const RACINE = fileURLToPath(new URL('../../', import.meta.url));
/** Dossier de l'atelier, lu et non écrit : son nom commence comme celui d'une marque, que le code ne nomme pas (G5). */
export const ICI = basename(fileURLToPath(new URL('../', import.meta.url)));
export const DOSSIER = 'docs/composants';
export const INDEX = `${DOSSIER}/README.md`;
export const DOSSIER_MODULES = 'docs/modules';
export const INDEX_MODULES = `${DOSSIER_MODULES}/README.md`;
export const NOMS = `${ICI}/composants/noms.json`;
const COMMANDE = `npm --prefix ${ICI} run fiches`;

/** Fiche de chaque composant, par son nom : celui de son test de rendu (atelier/preuve/<fiche>.js), dans l'ordre de l'index. */
export const FICHES = /** @type {const} */ ([
  ['DsButton', 'button'],
  ['DsIconButton', 'icon-button'],
  ['DsTextInput', 'text-input'],
  ['DsCard', 'card'],
  ['DsAvatar', 'avatar'],
  ['DsTag', 'tag'],
]);

/** Fiche de chaque module, par son nom : celui de son test de rendu, dans l'ordre de l'index. */
export const MODULES = /** @type {const} */ ([
  ['MemberCard', 'member-card'],
  ['MemberList', 'member-list'],
]);

/**
 * Les deux sortes de fiches : dossier des sources dans l'atelier, dossier des fiches, table des fiches, forme du nom
 * (NM2 : préfixe Ds ; NM5 : un domaine, puis la pièce de base, sans préfixe) et mot qui les nomme.
 */
export const SORTES = /** @type {const} */ ({
  composants: { source: 'composants', docs: DOSSIER, index: INDEX, table: FICHES, forme: /^Ds[A-Z][A-Za-z0-9]*$/, mot: 'composant' },
  modules: { source: 'modules', docs: DOSSIER_MODULES, index: INDEX_MODULES, table: MODULES, forme: /^(?!Ds[A-Z])[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*$/, mot: 'module' },
});
/** @typedef {keyof typeof SORTES} Sorte */

/** Lien d'une fiche vers celle d'une pièce, composant ou module. @param {string} nom @param {Sorte} depuis */
function lienVers(nom, depuis) {
  const sorte = /** @type {Sorte} */ (MODULES.some(([m]) => m === nom) ? 'modules' : 'composants');
  const fiche = /** @type {readonly (readonly [string, string])[]} */ (SORTES[sorte].table).find(([m]) => m === nom)?.[1];
  if (!fiche) throw new Error(`${ICI}/fiches/fiche.js : pièce sans fiche : ${nom}`);
  return `[\`${nom}\`](${sorte === depuis ? '' : `../${SORTES[sorte].source}/`}${fiche}.md)`;
}

/** Blocs générés d'une fiche, en plus de l'en-tête. */
export const BLOCS = ['titre', 'props', 'refus', 'tokens', 'contrastes'];

/** Titres de niveau 2 d'une fiche, dans l'ordre. */
export const SECTIONS = ['Quand l\'utiliser', 'Props', 'Refusé', 'Anatomie et tokens', 'Accessibilité', 'En situation', 'Décisions et dette', 'Test de rendu'];

/** Mots propres à ds-lab, refusés dans le texte des fiches et de l'index, hors code et hors glossaire (DOC4). */
export const MOTS_REFUSES = ['jeton', 'menu', 'option', 'emplacement', 'écouteur', 'rôle', 'enveloppe', 'fabrique', 'preuve'];
const REFUSE = new RegExp(`(?<![\\p{L}])(${MOTS_REFUSES.map((m) => `${m}s?`).join('|')})(?![\\p{L}])`, 'iu');

/** Plafond de mots écrits d'une fiche (DOC5). */
export const PLAFOND = 500;

/** Sources admises d'un nom (NM3). */
const SOURCES = new Map([
  ['html', 'HTML'],
  ['vuetify', 'Vuetify'],
  ['vue', 'Vue'],
  ['courant', 'usage courant'],
]);

/** Phrase de tête de la section « Anatomie et tokens ». */
export const PHRASE_TOKENS = 'Un token est le nom d\'une valeur de design. Le composant n\'a aucune valeur en dur : chaque marque donne la sienne, et changer un token change toutes ses instances.';

/** Phrase de tête de la section « Anatomie et tokens » d'un module. */
export const PHRASE_TOKENS_MODULE = 'Un token est le nom d\'une valeur de design. Le module n\'a aucune valeur visuelle propre : ce qu\'il assemble porte les siennes, et il ne règle que la mise en page, par les tokens ci-dessous.';

/** Contextes de mode du resolver (D62), et le mot français écrit dans les fiches. */
const MODES = /** @type {const} */ ([['light', 'clair'], ['dark', 'sombre']]);
const D2 = { decimales: 2, zeros: true };
const TYPES = new Map([
  [String, 'texte'],
  [Boolean, 'booléen'],
  [Number, 'nombre'],
  [Object, 'objet'],
  [Function, 'fonction'],
  [Array, 'tableau'],
]);
const FAMILLES = ['Couleur', 'Forme', 'Texte'];
const ETATS = [
  ['', ''],
  [':hover', 'au survol'],
  [':focus-visible', 'au focus'],
];

/** @param {string} chemin relatif à la racine */
const lire = (chemin) => readFileSync(join(RACINE, chemin), 'utf8');

/** Texte sans commentaires de bloc, de ligne ni HTML. @param {string} t */
const sansCommentaires = (t) => t.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** @param {string} b */
export const ouverture = (b) => `<!-- genere:${b} : écrit par ${COMMANDE} -->`;
/** @param {string} b */
export const fermeture = (b) => `<!-- /genere:${b} -->`;

/** @param {unknown} v */
const litteral = (v) => (typeof v === 'string' ? `'${v}'` : String(v));
/** @param {string} s */
const code = (s) => `\`${s}\``;
/** Nom de composant en tirets, sans son préfixe : DsIconButton → icon-button. @param {string} nom */
const tirets = (nom) => nom.replace(/^Ds/, '').replace(/(?<=[a-z0-9])([A-Z])/g, '-$1').toLowerCase();

// ─── Sources ────────────────────────────────────────────────────────────────

/**
 * Menus de atelier/composants/ (ou de atelier/modules/), dans l'ordre de leur table. Un menu absent de la table, ou une
 * fiche sans test de rendu, est une panne.
 * @param {Sorte} [sorte]
 * @returns {Promise<{ nom: string, fiche: string, menu: any, texteMenu: string, sorte: Sorte }[]>}
 */
export async function lireMenus(sorte = 'composants') {
  const { source, table, mot } = SORTES[sorte];
  const fichiers = readdirSync(join(RACINE, ICI, source)).filter((f) => f.endsWith('.menu.js')).sort();
  const noms = fichiers.map((f) => f.replace(/\.menu\.js$/, ''));
  const horsTable = noms.filter((n) => !table.some(([m]) => m === n));
  if (horsTable.length) throw new Error(`${ICI}/fiches/fiche.js : ${mot} sans fiche dans la table : ${horsTable.join(', ')}`);
  const out = [];
  for (const [nom, fiche] of table) {
    if (!noms.includes(nom)) throw new Error(`${ICI}/fiches/fiche.js : fiche sans ${mot} : ${fiche} (${nom}.menu.js)`);
    if (!existsSync(join(RACINE, ICI, 'preuve', `${fiche}.js`))) throw new Error(`${ICI}/fiches/fiche.js : fiche sans test de rendu : ${ICI}/preuve/${fiche}.js`);
    const chemin = `${ICI}/${source}/${nom}.menu.js`;
    const menu = (await import(pathToFileURL(join(RACINE, chemin)).href)).default;
    if (menu.nom !== nom) throw new Error(`${chemin} : nom ${menu.nom}, attendu ${nom}`);
    out.push({ nom, fiche, menu, texteMenu: lire(chemin), sorte });
  }
  return out;
}

/** Table des couleurs et des variables du thème (tokens/commun/vuetify.json). */
export function lireTable() {
  const t = JSON.parse(lire('tokens/commun/vuetify.json'));
  const couleurs = Object.fromEntries(Object.entries(t.colors).filter(([k]) => !k.startsWith('$')).map(([k, c]) => [k, { fond: c.background, texte: c.text }]));
  const variables = Object.fromEntries(
    Object.entries(t.variables)
      .filter(([k]) => !k.startsWith('$'))
      .map(([k, v]) => [k, { jeton: v.token, ...(v.field ? { champ: v.field } : {}), ...(v.unpaired ? { sansPaire: v.unpaired } : {}) }]),
  );
  return { couleurs: /** @type {Record<string, { fond: string, texte: string }>} */ (couleurs), variables: /** @type {Record<string, any>} */ (variables) };
}

/** Table des noms (NM1 à NM3). */
export const lireNoms = () => JSON.parse(lire(NOMS));

/**
 * Descriptions des tokens communs : chemin → $description, le $root d'un groupe compris (DTCG 2025.10).
 * @returns {Map<string, string>}
 */
export function lireDescriptions() {
  /** @type {Map<string, string>} */
  const out = new Map();
  /** @param {any} n @param {string[]} p */
  const parcourir = (n, p) => {
    if (!n || typeof n !== 'object') return;
    const jeton = '$value' in n ? n : n.$root;
    if (jeton && typeof jeton.$description === 'string' && !out.has(p.join('.'))) out.set(p.join('.'), jeton.$description);
    for (const [k, v] of Object.entries(n)) if (!k.startsWith('$')) parcourir(v, [...p, k]);
  };
  for (const f of ['semantique.tokens.json', 'police.tokens.json']) parcourir(JSON.parse(lire(`tokens/commun/${f}`)), []);
  return out;
}

/**
 * Une feuille de style en règles : sélecteur (un par élément d'une liste) et variables du thème lues dans son corps.
 * Les @keyframes sont sautées ; les règles d'un @media sont lues comme les autres.
 * @param {string} css
 * @returns {{ selecteur: string, variables: string[] }[]}
 */
export function reglesCss(css) {
  const t = css.replace(/\/\*[\s\S]*?\*\//g, '');
  /** @type {{ selecteur: string, variables: string[] }[]} */
  const out = [];
  let i = 0;
  /** @param {number} fin */
  const lireBloc = (fin) => {
    while (i < fin) {
      const ouvre = t.indexOf('{', i);
      if (ouvre === -1 || ouvre >= fin) return;
      const tete = t.slice(i, ouvre).trim();
      let profondeur = 1;
      let j = ouvre + 1;
      while (j < t.length && profondeur) {
        if (t[j] === '{') profondeur++;
        else if (t[j] === '}') profondeur--;
        j++;
      }
      const corps = t.slice(ouvre + 1, j - 1);
      if (tete.startsWith('@media') || tete.startsWith('@supports')) {
        i = ouvre + 1;
        lireBloc(j - 1);
      } else if (!tete.startsWith('@')) {
        const variables = [...corps.matchAll(/--v-(theme-[a-z0-9-]+|ds-[a-z0-9-]+)/g)].map((m) => m[1]);
        if (variables.length) for (const s of tete.split(',')) out.push({ selecteur: s.trim(), variables });
      }
      i = j;
    }
  };
  lireBloc(t.length);
  return out;
}

/**
 * Ce que dit le .vue d'un composant : la pièce de Vuetify enveloppée, les variables du thème lues (les siennes et celles
 * des .vue qu'il importe), ses slots, ses règles CSS (avec le composant qui les porte) et le sens de ses classes de
 * modificateur, lu dans ses liaisons de classe : `ds-x--${props.P}` (une valeur de P) et 'ds-x--y': props.P (P présent).
 * @param {string} nom
 * @returns {{ enveloppe: string, theme: Set<string>, ds: Set<string>, emplacements: string[], regles: { source: string, selecteur: string, variables: string[] }[], modificateurs: Map<string, { base: string, valeurs: string[], presence: Map<string, string> }> }}
 */
export function lireComposant(nom) {
  const chemin = `${ICI}/composants/${nom}.vue`;
  const brut = lire(chemin);
  const t = sansCommentaires(brut);
  const theme = new Set([...t.matchAll(/--v-theme-([a-z0-9-]+)/g)].map((m) => m[1]));
  const ds = new Set([...t.matchAll(/--v-(ds-[a-z0-9-]+)/g)].map((m) => m[1]));
  const emplacements = [...new Set([...t.matchAll(/\bslots\.(\w+)/g)].map((m) => m[1]))];
  const vuetify = /import\s*\{\s*(V\w+)\s*\}\s*from\s*'vuetify\/components'/.exec(t);
  const importe = /import\s+\w+\s+from\s+'\.\/(\w+)\.vue'/.exec(t);
  const style = /<style>([\s\S]*?)<\/style>/.exec(brut)?.[1] ?? '';
  const regles = reglesCss(style).map((r) => ({ source: nom, ...r }));
  const base = `ds-${tirets(nom)}`;
  const valeurs = [...t.matchAll(new RegExp(`\`${base}--\\$\\{props\\.(\\w+)\\}\``, 'g'))].map((m) => m[1]);
  const presence = new Map([...t.matchAll(new RegExp(`'${base}--([a-z-]+)':\\s*!*props\\.(\\w+)`, 'g'))].map((m) => [m[1], m[2]]));
  const modificateurs = new Map([[nom, { base, valeurs, presence }]]);
  let enveloppe = vuetify?.[1];
  if (importe) {
    const autre = lireComposant(importe[1]);
    for (const v of autre.theme) theme.add(v);
    for (const v of autre.ds) ds.add(v);
    regles.push(...autre.regles);
    for (const [k, v] of autre.modificateurs) modificateurs.set(k, v);
    enveloppe ??= `${autre.enveloppe} (par ${importe[1]})`;
  }
  if (!enveloppe) throw new Error(`${chemin} : aucune pièce de Vuetify ni composant importé`);
  return { enveloppe, theme, ds, emplacements, regles, modificateurs };
}

/**
 * Ce que dit le .vue d'un module : les pièces qu'il assemble (composants et modules importés, dans l'ordre), les
 * variables du thème de son propre style, ses slots et ses règles CSS. Une pièce de Vuetify importée est une panne
 * (CP9).
 * @param {string} nom
 * @returns {{ assemble: string[], theme: Set<string>, ds: Set<string>, emplacements: string[], regles: { source: string, selecteur: string, variables: string[] }[], modificateurs: Map<string, { base: string, valeurs: string[], presence: Map<string, string> }> }}
 */
export function lireModule(nom) {
  const chemin = `${ICI}/modules/${nom}.vue`;
  const brut = lire(chemin);
  const t = sansCommentaires(brut);
  if (/from\s+'vuetify/.test(t)) throw new Error(`${chemin} : pièce de Vuetify dans un module`);
  const assemble = [...t.matchAll(/import\s+\w+\s+from\s+'\.{1,2}\/(?:composants\/)?(\w+)\.vue'/g)].map((m) => m[1]);
  if (!assemble.length) throw new Error(`${chemin} : aucun composant assemblé`);
  const style = /<style>([\s\S]*?)<\/style>/.exec(brut)?.[1] ?? '';
  return {
    assemble,
    theme: new Set([...style.matchAll(/--v-theme-([a-z0-9-]+)/g)].map((m) => m[1])),
    ds: new Set([...style.matchAll(/--v-(ds-[a-z0-9-]+)/g)].map((m) => m[1])),
    emplacements: [...new Set([...t.matchAll(/\bslots\.(\w+)/g)].map((m) => m[1]))],
    regles: reglesCss(style).map((r) => ({ source: nom, ...r })),
    modificateurs: new Map([[nom, { base: tirets(nom), valeurs: [], presence: new Map() }]]),
  };
}

/**
 * Stories d'un composant : ses noms de stories (exports et name).
 * @param {string} nom
 */
export function lireStories(nom) {
  const chemin = `${ICI}/stories/${nom}.stories.js`;
  const t = lire(chemin);
  if (!/export default \{ title: '[^']+'/.test(t)) throw new Error(`${chemin} : titre des stories introuvable`);
  const noms = new Set([...[...t.matchAll(/^export const (\w+)/gm)].map((m) => m[1]), ...[...t.matchAll(/^\s*name: '([^']+)'/gm)].map((m) => m[1])]);
  return { chemin, noms };
}

/**
 * Message d'une règle du menu : la chaîne qui suit le « ? » de sa fonction, une seule.
 * @param {Function} regle @param {string} quoi
 */
export function messageDeRegle(regle, quoi) {
  const m = [...String(regle).matchAll(/\?\s*(['"`])((?:(?!\1).)*)\1/g)];
  if (m.length !== 1) throw new Error(`${quoi} : règle sans message lisible : ${String(regle)}`);
  return m[0][2];
}

/**
 * Messages d'une règle : ceux qu'elle déclare (messages), quand elle délègue à une fonction dont le message n'est pas
 * lisible dans son texte ; sinon celui de sa fonction.
 * @param {Function & { messages?: string[] }} regle @param {string} quoi
 * @returns {string[]}
 */
export const messagesDeRegle = (regle, quoi) => (Array.isArray(regle.messages) ? regle.messages : [messageDeRegle(regle, quoi)]);

/** Décisions citées en tête du menu : la première parenthèse de numéros. @param {string} texteMenu @param {string} quoi */
function decisionsDuMenu(texteMenu, quoi) {
  const m = /\((D\d+(?:, D\d+)*)\)/.exec(texteMenu.split('\n')[0]);
  if (!m) throw new Error(`${quoi} : décisions absentes de la première ligne`);
  return m[1].split(', ');
}

// ─── Contrastes ─────────────────────────────────────────────────────────────

/**
 * Paires mesurées dans chaque thème (chaque marque de tokens/, en clair puis en sombre), par contratRoles : clé
 * « devant|fond » → mesures dans l'ordre des thèmes.
 * @returns {{ themes: string[], mesures: Map<string, { theme: string, ratio: number, min: number, exception?: string }[]> }}
 */
export function mesurerThemes() {
  /** @type {string[]} */
  const themes = [];
  /** @type {Map<string, any[]>} */
  const mesures = new Map();
  for (const dossier of dossiersDeMarque())
    for (const [mode, mot] of MODES) {
      const theme = `${nomDeMarque(dossier)}, ${mot}`;
      themes.push(theme);
      for (const p of contratRoles(loadRoles(dossier, { mode })).pairs) {
        const cle = `${p.devant}|${p.fond}`;
        if (!mesures.has(cle)) mesures.set(cle, []);
        mesures.get(cle)?.push({ theme, ratio: p.ratio, min: p.min, ...(p.exception ? { exception: p.exception } : {}) });
      }
    }
  return { themes, mesures };
}

// ─── Blocs ──────────────────────────────────────────────────────────────────

/**
 * En-tête : un composant nomme la pièce de Vuetify qu'il enveloppe (wraps), un module les pièces qu'il assemble.
 * @param {any} e entrée de lireMenus @param {any} composant @param {any} stories
 */
export function entete(e, composant, stories) {
  const source = SORTES[/** @type {Sorte} */ (e.sorte ?? 'composants')].source;
  const quoi = `${ICI}/${source}/${e.nom}.menu.js`;
  return [
    '---',
    `name: ${e.menu.nom}`,
    `title: ${e.nom}`,
    `file: ${ICI}/${source}/${e.nom}.vue`,
    `props: ${quoi}`,
    composant.assemble ? `assembles: [${composant.assemble.join(', ')}]` : `wraps: ${composant.enveloppe}`,
    `decisions: [${decisionsDuMenu(e.texteMenu, quoi).join(', ')}]`,
    `stories: ${stories.chemin}`,
    `test: npm --prefix ${ICI} run preuve -- ${e.fiche}`,
    '---',
  ].join('\n');
}

/** @param {any} menu @param {any} composant @param {any} noms */
export function blocProps(menu, composant, noms) {
  const lignes = ['| Prop | Type | Obligatoire | Défaut | Valeurs admises | Nom repris de |', '|---|---|---|---|---|---|'];
  for (const [cle, o] of Object.entries(menu.options)) {
    const type = [o.type].flat().map((t) => TYPES.get(t) ?? t.name).join(' ou ');
    const defaut = 'defaut' in o ? code(litteral(o.defaut)) : 'aucun';
    const valeurs = o.valeurs ? o.valeurs.map((/** @type {unknown} */ v) => code(litteral(v))).join(', ') : 'libre';
    const source = SOURCES.get((noms.composants?.[menu.nom] ?? noms.modules?.[menu.nom])?.props?.[cle]?.source) ?? 'inconnu';
    lignes.push(`| ${code(cle)} | ${type} | ${o.obligatoire ? 'oui' : 'non'} | ${defaut} | ${valeurs} | ${source} |`);
  }
  const liste = (/** @type {string[]} */ l) => (l.length ? l.map(code).join(', ') : 'aucun');
  lignes.push('', `Événements émis : ${liste(menu.evenements ?? [])}. Slots : ${liste(composant.emplacements)}.`);
  return lignes.join('\n');
}

/** @param {any} menu @param {string} quoi */
export function blocRefus(menu, quoi) {
  const p = menu.nom;
  const retires = menu.attributsRetires ?? [];
  const tete = `Attributs admis en plus des props : \`id\`, \`aria-*\`, \`data-*\`. Retirés : ${retires.length ? retires.map(code).join(', ') : 'aucun'}. Attributs \`on…\` d'événement : ${menu.ecouteurs === false ? 'refusés' : 'admis'}.`;
  /** @type {string[]} */
  const messages = [`${p} : attribut refusé : <attributs>`];
  /** @type {Map<string, string>} */
  const suffixes = new Map();
  for (const [cle, o] of Object.entries(menu.options)) {
    if (o.obligatoire) messages.push(`${p} : ${cle} : obligatoire`);
    if (o.valeurs) messages.push(`${p} : ${cle} : valeur inconnue : <valeur> (${o.valeurs.join(', ')})`);
  }
  for (const r of menu.regles ?? []) for (const m of messagesDeRegle(r, quoi)) messages.push(`${p} : ${m}`);
  for (const r of menu.reglesDuRendu ?? [])
    for (const m of messagesDeRegle(r, quoi)) {
      messages.push(`${p} : ${m}`);
      suffixes.set(`${p} : ${m}`, ', au rendu');
    }
  const uniques = [...new Set(messages)];
  return [tete, '', 'Tout autre usage lève une erreur, et rien n\'est rendu. Messages, dans l\'ordre où ils sont vérifiés :', '', ...uniques.map((m) => `- ${code(m)}${suffixes.get(m) ?? ''}`)].join('\n');
}

/**
 * Token d'une variable du thème : `theme-<couleur>` donne le fond, `theme-on-<couleur>` le texte, `ds-<clé>` le token
 * de la table. Une variable absente de la table est une panne.
 * @param {string} variable @param {any} table @param {string} quoi
 */
function tokenDe(variable, table, quoi) {
  if (variable.startsWith('theme-')) {
    const c = variable.slice(6);
    const base = c.startsWith('on-') ? c.slice(3) : c;
    if (!(base in table.couleurs)) throw new Error(`${quoi} : variable inconnue de la table : --v-${variable}`);
    return c.startsWith('on-') ? table.couleurs[base].texte : table.couleurs[base].fond;
  }
  if (!(variable in table.variables)) throw new Error(`${quoi} : variable inconnue de la table : --v-${variable}`);
  return table.variables[variable].jeton;
}

/** Rang de chaque token dans la table : couleurs (fond puis texte), puis variables. @param {any} table */
function rangsDesTokens(table) {
  /** @type {Map<string, number>} */
  const rangs = new Map();
  for (const { fond, texte } of Object.values(table.couleurs)) for (const j of [fond, texte]) if (!rangs.has(j)) rangs.set(j, rangs.size);
  for (const v of Object.values(table.variables)) if (!rangs.has(v.jeton)) rangs.set(v.jeton, rangs.size);
  return rangs;
}

/** Famille d'un token : Couleur, Texte ou Forme. @param {string} token */
const familleDe = (token) => (/^(text|background|border)\./.test(token) ? 'Couleur' : /^(typography|font)\./.test(token) ? 'Texte' : 'Forme');

/**
 * Précision d'une règle pour un composant : les props et valeurs que ses classes de modificateur désignent, puis l'état.
 * Une classe `ds-x--<valeur>` désigne une valeur de la prop liée par `ds-x--${props.P}` ; une classe 'ds-x--y' liée à
 * props.P désigne la présence de P ; une classe d'état de Vuetify (v-field--disabled) désigne une prop booléenne du menu.
 * Rend null si la règle vise une valeur ou une prop du composant qui la porte, absente du menu du composant lu (une
 * règle du danger plein du bouton, lue pour le bouton à icône, qui n'en a pas). Les classes dans :not() sont ignorées.
 * @param {{ source: string, selecteur: string }} regle @param {any} composant @param {any} menu
 * @param {Map<string, any>} menus props de chaque composant, par son nom
 * @returns {{ props: Map<string, string | null>, etat: number } | null}
 */
function precision(regle, composant, menu, menus) {
  const sel = regle.selecteur.replace(/:not\([^)]*\)/g, '');
  /** @type {Map<string, string | null>} */
  const props = new Map();
  for (const [source, m] of composant.modificateurs) {
    const menuSource = menus.get(source) ?? menu;
    for (const [, x] of sel.matchAll(new RegExp(`\\.${m.base}--([a-z0-9-]+)(?![a-z0-9-])`, 'g'))) {
      const presence = m.presence.get(x);
      if (presence) {
        if (!(presence in menu.options)) return null;
        props.set(presence, null);
        continue;
      }
      const p = m.valeurs.find((/** @type {string} */ q) => (menu.options[q]?.valeurs ?? []).includes(x));
      if (p) props.set(p, x);
      else if (m.valeurs.some((/** @type {string} */ q) => (menuSource.options[q]?.valeurs ?? []).includes(x))) return null;
    }
  }
  for (const [, x] of sel.matchAll(/\.v-[a-z-]+--([a-z]+)(?![a-z-])/g)) if (menu.options[x]?.type === Boolean) props.set(x, null);
  const etat = ETATS.reduce((k, [motif], i) => (motif && sel.includes(motif) ? i : k), 0);
  return { props, etat };
}

/**
 * Anatomie d'un composant : une ligne par partie et par token, avec ce qu'il règle ; dans une partie, le fond, puis le
 * texte, puis la bordure, puis l'ordre de la table. Un token cité sans description est une panne (DOC3).
 * @param {any} composant @param {any} menu @param {any} table @param {Map<string, string>} descriptions @param {string} quoi
 * @param {Map<string, any>} [menus] props de chaque composant, par son nom, pour les règles des composants importés
 * @returns {{ partie: string, token: string, regle: string }[]}
 */
export function anatomie(composant, menu, table, descriptions, quoi, menus = new Map()) {
  const rangs = rangsDesTokens(table);
  const options = Object.keys(menu.options);
  /** @type {Map<string, { partie: string, token: string, cle: number[] }>} */
  const lignes = new Map();
  for (const r of composant.regles) {
    const p = precision(r, composant, menu, menus);
    if (!p) continue;
    for (const v of r.variables) {
      const token = tokenDe(v, table, quoi);
      const famille = familleDe(token);
      const morceaux = [famille];
      /** @type {number[]} */
      const cle = [FAMILLES.indexOf(famille)];
      for (const o of options) {
        if (!p.props.has(o)) {
          cle.push(0);
          continue;
        }
        const val = p.props.get(o);
        morceaux.push(val === null || val === undefined ? o : `${o} ${val}`);
        cle.push(val === null || val === undefined ? 1 : 1 + menu.options[o].valeurs.indexOf(val));
      }
      if (p.etat) morceaux.push(ETATS[p.etat][1]);
      cle.push(p.etat, ['background.', 'text.', 'border.'].findIndex((f) => token.startsWith(f)), rangs.get(token) ?? 9999);
      const partie = morceaux.join(', ');
      const id = `${partie}|${token}`;
      if (!lignes.has(id)) lignes.set(id, { partie, token, cle });
    }
  }
  const tri = [...lignes.values()].sort((a, b) => {
    for (let k = 0; k < a.cle.length; k++) if (a.cle[k] !== b.cle[k]) return a.cle[k] - b.cle[k];
    return 0;
  });
  return tri.map(({ partie, token }) => {
    const regle = descriptions.get(token);
    if (!regle) throw new Error(`${quoi} : token sans description : ${token}`);
    return { partie, token, regle };
  });
}

/**
 * Ce qui, lu dans la description d'un token cité, la rend à réécrire (DOC3) : elle dit en une phrase ce que le token
 * règle et où il sert, sans numéro de règle ni de décision, sans nom d'un autre token, sans mesure, sans pas d'échelle.
 * Ce qui sert à l'équipe va dans $extensions["ds-lab.note"].
 * @param {string} d
 * @returns {string[]}
 */
export function motifsDescription(d) {
  /** @type {string[]} */
  const motifs = [];
  if (/\b(?:D|DS|NM|CP|DOC)\d+\b/.test(d)) motifs.push('numéro de règle ou de décision');
  if (/(?<![\w.])[a-z][a-z0-9-]*\.[a-z][a-z0-9.-]*[a-z0-9](?![\w-])/.test(d)) motifs.push('nom de token');
  if (/\d\s*px\b|\d+(?:,\d+)?:\d/.test(d)) motifs.push('mesure');
  if (/\bpas \d/.test(d)) motifs.push('pas d\'échelle');
  if (!/^[A-ZÀ-Ý«][^]*[.]$/u.test(d) || /[.!?] /.test(d.slice(0, -1))) motifs.push('pas une seule phrase');
  return motifs;
}

/** Écarts des descriptions des tokens cités par une fiche. @param {string[]} tokens @param {Map<string, string>} descriptions */
export function ecartsDescriptions(tokens, descriptions) {
  return [...new Set(tokens)].flatMap((tk) => {
    const m = motifsDescription(descriptions.get(tk) ?? '');
    return m.length ? [`description à réécrire : ${tk} (${m.join(', ')})`] : [];
  });
}

/**
 * Tokens d'une fiche ; un module dit d'abord ce qu'il assemble, chaque pièce vers sa fiche.
 * @param {{ partie: string, token: string, regle: string }[]} lignes @param {string[]} [assemble]
 */
export function blocTokens(lignes, assemble) {
  const tete = assemble ? [PHRASE_TOKENS_MODULE, '', `Assemble : ${assemble.map((n) => lienVers(n, 'modules')).join(', ')}.`] : [PHRASE_TOKENS];
  return [...tete, '', '| Partie | Token | Ce qu\'il règle |', '|---|---|---|', ...lignes.map((l) => `| ${l.partie} | ${code(l.token)} | ${l.regle.replace(/\|/g, '\\|')} |`)].join('\n');
}

/** Contrastes d'un module : aucune couleur propre, ceux des pièces assemblées. @param {string[]} assemble */
export const blocContrastesModule = (assemble) =>
  `Le module n'a aucune couleur propre : chaque texte se lit comme dans la fiche de sa pièce, ${assemble.map((n) => lienVers(n, 'modules')).join(', ')}.`;

/**
 * Paires de la pièce : celle de chaque couleur employée (fond ou texte), puis, pour chaque variable de texte ou de
 * bordure, les paires où son token est devant, sur un fond de la pièce, sur background.app ou sur background.surface.
 * @param {any} composant @param {any} table @param {any} paires @param {string} quoi
 * @returns {{ devant: string, fond: string }[]}
 */
export function pairesDe(composant, table, paires, quoi) {
  /** @type {{ devant: string, fond: string }[]} */
  const out = [];
  /** @param {string} devant @param {string} fond */
  const ajouter = (devant, fond) => {
    if (!out.some((p) => p.devant === devant && p.fond === fond)) out.push({ devant, fond });
  };
  for (const v of composant.theme) tokenDe(`theme-${v}`, table, quoi);
  for (const v of composant.ds) tokenDe(v, table, quoi);
  const fonds = new Set(['background.app', 'background.surface']);
  for (const [c, { fond, texte }] of Object.entries(table.couleurs)) {
    if (!composant.theme.has(c) && !composant.theme.has(`on-${c}`)) continue;
    fonds.add(fond);
    if (!paires.pairs.some((/** @type {any} */ p) => p.foreground === texte && p.background === fond)) throw new Error(`${quoi} : paire absente de tokens/commun/paires.json : ${texte} sur ${fond}`);
    ajouter(texte, fond);
  }
  for (const [k, v] of Object.entries(table.variables)) {
    if (!composant.ds.has(k) || !/^(text|border)\./.test(v.jeton)) continue;
    for (const p of paires.pairs) if (p.foreground === v.jeton && fonds.has(p.background)) ajouter(p.foreground, p.background);
  }
  return out;
}

/**
 * Le plus bas de chaque paire sur les thèmes, et son seuil, écrits comme npm run contraste les écrit.
 * @param {{ devant: string, fond: string }[]} paires @param {ReturnType<typeof mesurerThemes>} themes @param {string} quoi
 */
export function blocContrastes(paires, themes, quoi) {
  const lignes = ['| Devant | Fond | Plus bas des ' + themes.themes.length + ' thèmes | Seuil |', '|---|---|---|---|'];
  for (const { devant, fond } of paires) {
    const m = themes.mesures.get(`${devant}|${fond}`);
    if (!m?.length) throw new Error(`${quoi} : paire non mesurée : ${devant} sur ${fond}`);
    const bas = m.reduce((a, b) => (b.ratio < a.ratio ? b : a));
    lignes.push(`| ${code(devant)} | ${code(fond)} | ${fr(bas.ratio, D2)}:1 (${bas.theme}) | ${fr(bas.min, D2)}:1${m.some((x) => x.exception) ? ', exception écrite' : ''} |`);
  }
  return lignes.join('\n');
}

// ─── Table des noms (NM1 à NM3) ─────────────────────────────────────────────

/**
 * Écarts entre la table des noms et les composants (ou les modules) : nom absent, sans emploi, mal formé, source
 * inconnue.
 * @param {{ nom: string, menu: any }[]} menus @param {Map<string, string[]>} slots slots de chaque composant @param {any} noms
 * @param {Sorte} [sorte]
 * @returns {string[]}
 */
export function ecartsNoms(menus, slots, noms, sorte = 'composants') {
  /** @type {string[]} */
  const ecarts = [];
  const table = noms[sorte] ?? {};
  const { forme: formeDuNom, mot } = SORTES[sorte];
  /** @param {string} quoi @param {any} entree */
  const source = (quoi, entree) => {
    if (!SOURCES.has(entree?.source)) ecarts.push(`source inconnue : ${quoi} (${entree?.source ?? 'aucune'})`);
  };
  /** @param {string} quoi @param {string} nom @param {RegExp} forme */
  const forme = (quoi, nom, forme) => {
    if (!forme.test(nom)) ecarts.push(`nom mal formé : ${quoi}`);
  };
  /** @param {string} quoi @param {string[]} emplois @param {Record<string, any>} entrees @param {string} sorte @param {RegExp} motif */
  const confronter = (quoi, emplois, entrees, sorte, motif) => {
    for (const n of emplois) {
      forme(`${quoi}.${n}`, n, motif);
      if (!(n in entrees)) ecarts.push(`${sorte} absent${sorte === 'prop' || sorte === 'valeur' ? 'e' : ''} de la table : ${quoi}.${n}`);
      else source(`${quoi}.${n}`, entrees[n]);
    }
    for (const n of Object.keys(entrees)) if (!emplois.includes(n)) ecarts.push(`entrée sans emploi : ${quoi}.${n}`);
  };
  for (const { nom, menu } of menus) {
    forme(nom, nom, formeDuNom);
    const t = table[nom];
    if (!t) {
      ecarts.push(`${mot} absent de la table : ${nom}`);
      continue;
    }
    source(nom, t);
    confronter(nom, Object.keys(menu.options), t.props ?? {}, 'prop', /^[a-z][A-Za-z0-9]*$/);
    for (const [k, o] of Object.entries(menu.options)) {
      const textes = (/** @type {any} */ (o).valeurs ?? []).filter((/** @type {unknown} */ v) => typeof v === 'string');
      if (t.props?.[k] && (textes.length || t.props[k].valeurs)) confronter(`${nom}.${k}`, textes, t.props[k].valeurs ?? {}, 'valeur', /^[a-z][a-z0-9-]*$/);
    }
    confronter(nom, menu.evenements ?? [], t.evenements ?? {}, 'événement', /^[a-z]+(:[a-z][A-Za-z]*)?$/);
    confronter(nom, slots.get(nom) ?? [], t.slots ?? {}, 'slot', /^[a-z][a-z0-9-]*$/);
  }
  for (const n of Object.keys(table)) if (!menus.some((m) => m.nom === n)) ecarts.push(`entrée sans emploi : ${n}`);
  return ecarts;
}

// ─── Lecture d'une fiche ────────────────────────────────────────────────────

/**
 * Une fiche en morceaux : l'en-tête, et pour chaque bloc ses lignes d'ouverture et de fermeture. Une marque absente, en
 * double ou ouverte sans fin est une panne.
 * @param {string} texte @param {string} chemin @param {string[]} [blocs]
 */
export function decouper(texte, chemin, blocs = BLOCS) {
  const lignes = texte.split('\n');
  if (lignes[0] !== '---') throw new Error(`${chemin} : en-tête absent`);
  const finEntete = lignes.indexOf('---', 1);
  if (finEntete === -1) throw new Error(`${chemin} : en-tête ouvert sans fin`);
  return { lignes, finEntete, blocs: marques(lignes, chemin, blocs) };
}

/** Lignes d'ouverture et de fermeture de chaque bloc. @param {string[]} lignes @param {string} chemin @param {string[]} blocs */
function marques(lignes, chemin, blocs) {
  /** @type {Record<string, [number, number]>} */
  const out = {};
  for (const b of blocs) {
    const ouvertes = lignes.flatMap((l, i) => (l.startsWith(`<!-- genere:${b} `) ? [i] : []));
    const fermees = lignes.flatMap((l, i) => (l === fermeture(b) ? [i] : []));
    if (!ouvertes.length) throw new Error(`${chemin} : marque genere:${b} absente`);
    if (ouvertes.length > 1 || fermees.length > 1) throw new Error(`${chemin} : marque genere:${b} en double`);
    if (!fermees.length || fermees[0] < ouvertes[0]) throw new Error(`${chemin} : marque genere:${b} ouverte sans fin`);
    out[b] = [ouvertes[0], fermees[0]];
  }
  return out;
}

/**
 * La fiche régénérée : en-tête et blocs remplacés, parties écrites gardées à l'octet.
 * @param {string} texte @param {string} chemin @param {{ entete: string } & Record<string, string>} genere
 */
export function regenerer(texte, chemin, genere) {
  const { lignes, finEntete, blocs } = decouper(texte, chemin);
  /** @type {string[]} */
  const out = [genere.entete];
  let i = finEntete + 1;
  for (const b of [...BLOCS].sort((x, y) => blocs[x][0] - blocs[y][0])) {
    const [o, f] = blocs[b];
    out.push(...lignes.slice(i, o), ouverture(b), genere[b], fermeture(b));
    i = f + 1;
  }
  out.push(...lignes.slice(i));
  return out.join('\n');
}

/** Sections de niveau 2, hors blocs de code, avec leur première ligne. @param {string[]} lignes */
function sections(lignes) {
  /** @type {{ titre: string, debut: number }[]} */
  const out = [];
  let dansCode = false;
  lignes.forEach((l, i) => {
    if (l.startsWith('```')) dansCode = !dansCode;
    else if (!dansCode && l.startsWith('## ')) out.push({ titre: l, debut: i });
  });
  return out;
}

/**
 * Bornes d'une section, sans son titre : [première ligne, ligne après la dernière], ou null si elle manque.
 * @param {string[]} lignes @param {{ titre: string, debut: number }[]} s @param {string} titre
 * @returns {[number, number] | null}
 */
function bornes(lignes, s, titre) {
  const k = s.findIndex((x) => x.titre === `## ${titre}`);
  if (k === -1) return null;
  return [s[k].debut + 1, k + 1 < s.length ? s[k + 1].debut : lignes.length];
}

/** Lignes d'une section après une ligne donnée (la fin d'un bloc), ou toute la section. @param {string[]} lignes @param {[number, number] | null} b @param {number} [apres] */
const lignesDe = (lignes, b, apres = -1) => (b ? lignes.slice(Math.max(b[0], apres + 1), b[1]) : []);

/**
 * Phrase qui dit à quoi sert le composant : la première ligne non vide après le bloc titre ; null si elle manque ou
 * n'est pas une phrase d'une ligne finie par un point.
 * @param {string} texte @param {string} chemin
 */
export function phraseDeRole(texte, chemin) {
  const { lignes, blocs } = decouper(texte, chemin);
  let i = blocs.titre[1] + 1;
  while (i < lignes.length && !lignes[i].trim()) i++;
  const l = lignes[i] ?? '';
  if (!l.trim() || l.startsWith('#') || l.startsWith('<!--')) return { phrase: null, ecart: 'phrase de rôle absente' };
  if ((lignes[i + 1] ?? '').trim()) return { phrase: null, ecart: 'phrase de rôle sur plusieurs lignes' };
  if (!l.trimEnd().endsWith('.')) return { phrase: null, ecart: 'phrase de rôle sans point final' };
  return { phrase: l.trim(), ecart: null };
}

/**
 * Lignes de texte d'un document, avec leur numéro : hors en-tête, hors code (blocs et code en ligne retiré), hors
 * marques et hors section Glossaire.
 * @param {string} texte
 * @returns {{ n: number, texte: string }[]}
 */
function lignesDeTexte(texte) {
  const lignes = texte.split('\n');
  let i = 0;
  if (lignes[0] === '---') i = lignes.indexOf('---', 1) + 1;
  /** @type {{ n: number, texte: string }[]} */
  const out = [];
  let dansCode = false;
  let glossaire = false;
  for (; i < lignes.length; i++) {
    const l = lignes[i];
    if (l.startsWith('```')) {
      dansCode = !dansCode;
      continue;
    }
    if (dansCode || l.startsWith('<!--')) continue;
    if (l.startsWith('## ')) glossaire = l === '## Glossaire';
    if (glossaire) continue;
    out.push({ n: i + 1, texte: l.replace(/`[^`]*`/g, '') });
  }
  return out;
}

/** Mots refusés hors code et hors glossaire (DOC4). @param {string} texte @returns {string[]} */
export function motsRefuses(texte) {
  return lignesDeTexte(texte).flatMap(({ n, texte: l }) => {
    const m = REFUSE.exec(l);
    return m ? [`mot refusé : ${m[1].toLowerCase()} (ligne ${n})`] : [];
  });
}

/**
 * Mots écrits d'une fiche (DOC5) : hors en-tête, blocs générés, tableaux et code ; un mot est une suite de lettres, de
 * chiffres, d'apostrophes ou de tirets qui contient une lettre ou un chiffre.
 * @param {string} texte
 */
export function motsEcrits(texte) {
  const sansBlocs = texte.replace(/<!-- genere:(\w+) [^\n]*-->\n[\s\S]*?\n<!-- \/genere:\1 -->/g, '');
  const lignes = sansBlocs.split('\n');
  let i = lignes[0] === '---' ? lignes.indexOf('---', 1) + 1 : 0;
  let n = 0;
  let dansCode = false;
  for (; i < lignes.length; i++) {
    const l = lignes[i];
    if (l.startsWith('```')) {
      dansCode = !dansCode;
      continue;
    }
    if (dansCode || l.startsWith('|') || l.startsWith('<!--')) continue;
    n += (l.match(/[\p{L}\p{N}'’-]+/gu) ?? []).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
  }
  return n;
}

/**
 * Écarts des parties écrites d'une fiche. Une variable ds- ou un token posé par le parent inconnus sont une panne, comme
 * un exemple hors grammaire.
 * @param {string} texte @param {string} chemin @param {any} e entrée de lireMenus
 * @param {{ table: any, stories: any, decisions: string, dette: string, descriptions: Map<string, string>, menuDe: (f: string) => any }} ctx
 * @returns {string[]}
 */
export function ecartsEcrits(texte, chemin, e, ctx) {
  const { lignes, blocs } = decouper(texte, chemin);
  /** @type {string[]} */
  const ecarts = [];
  const s = sections(lignes);
  for (let k = 0; k < Math.max(SECTIONS.length, s.length); k++) {
    const attendu = SECTIONS[k] === undefined ? 'rien' : `## ${SECTIONS[k]}`;
    const trouve = s[k]?.titre ?? 'rien';
    if (attendu !== trouve) {
      ecarts.push(`sections : attendu « ${attendu} » en place ${k + 1}, trouvé « ${trouve} »`);
      break;
    }
  }
  const role = phraseDeRole(texte, chemin);
  if (role.ecart) ecarts.push(role.ecart);

  // Lignes de prop : dans la section Props, après le bloc.
  const options = Object.keys(e.menu.options);
  const ecrites = lignesDe(lignes, bornes(lignes, s, 'Props'), blocs.props[1]).flatMap((l) => /^- `([^`]+)` : /.exec(l)?.[1] ?? []);
  for (const o of options) if (!ecrites.includes(o)) ecarts.push(`prop sans sa ligne : ${o}`);
  for (const o of ecrites) if (!options.includes(o)) ecarts.push(`ligne d'une prop hors du composant : ${o}`);
  const communes = ecrites.filter((o) => options.includes(o));
  if (communes.length === options.length && communes.some((o, j) => o !== options[j])) ecarts.push('lignes de prop hors de l\'ordre des props');

  // Décisions et dette citées.
  for (const n of new Set([...texte.matchAll(/\bD(\d{2})\b/g)].map((m) => m[1]))) if (!new RegExp(`^### D${n}$`, 'm').test(ctx.decisions)) ecarts.push(`décision inconnue : D${n}`);
  for (const n of new Set([...texte.matchAll(/\bB(\d+)\b/g)].map((m) => m[1]))) if (!new RegExp(`^\\| B${n} \\|`, 'm').test(ctx.dette)) ecarts.push(`dette inconnue : B${n}`);

  // Tokens posés par le parent, et variables ds- écrites, hors du bloc.
  for (const l of lignesDe(lignes, bornes(lignes, s, 'Anatomie et tokens'), blocs.tokens[1])) {
    for (const m of l.matchAll(/`(ds-[a-z0-9-]+)`/g)) if (!(m[1] in ctx.table.variables)) throw new Error(`${chemin} : variable inconnue de la table : ${m[1]}`);
    const pose = /^- Posé par le parent : `([^`]+)` \(`(ds-[a-z0-9-]+)`\)/.exec(l);
    if (pose && !ctx.descriptions.has(pose[1])) throw new Error(`${chemin} : token sans description : ${pose[1]}`);
    if (pose && ctx.table.variables[pose[2]].jeton !== pose[1]) throw new Error(`${chemin} : ${pose[2]} ne porte pas ${pose[1]}`);
  }

  // En situation : stories citées, un seul exemple, accepté par les props.
  const situation = lignesDe(lignes, bornes(lignes, s, 'En situation'));
  for (const m of situation.join('\n').matchAll(/story « ([^»]+) »/g)) if (!ctx.stories.noms.has(m[1])) ecarts.push(`story inconnue : « ${m[1]} »`);
  const exemples = [...situation.join('\n').matchAll(/^```vue\n([\s\S]*?)\n```$/gm)];
  if (exemples.length !== 1) ecarts.push(`exemple : ${exemples.length} blocs vue, un attendu`);
  else
    try {
      verifierExemple(exemples[0][1], ctx.menuDe);
    } catch (err) {
      if (err instanceof HorsGrammaire) throw new Error(`${chemin} : ${err.message}`);
      ecarts.push(`exemple refusé : ${/** @type {Error} */ (err).message}`);
    }

  ecarts.push(...motsRefuses(texte));
  const mots = motsEcrits(texte);
  if (mots > PLAFOND) ecarts.push(`fiche trop longue : ${mots} mots écrits, ${PLAFOND} au plus`);
  return ecarts;
}

/** Écarts du glossaire de l'index : chaque mot refusé y paraît comme ancien mot. @param {string} texte */
export function ecartsGlossaire(texte) {
  const lignes = texte.split('\n');
  const debut = lignes.indexOf('## Glossaire');
  if (debut === -1) return ['glossaire absent'];
  const anciens = lignes
    .slice(debut + 1)
    .filter((l) => l.startsWith('|'))
    .map((l) => (l.split('|')[3] ?? '').toLowerCase());
  return MOTS_REFUSES.filter((m) => !anciens.some((a) => new RegExp(`(?<![\\p{L}])${m}s?(?![\\p{L}])`, 'u').test(a))).map((m) => `glossaire : ancien mot absent : ${m}`);
}

// ─── Les fiches du dépôt ────────────────────────────────────────────────────

/**
 * Chaque fiche présente des composants puis des modules, son texte régénéré et ses écarts, puis les deux index et la
 * table des noms.
 * @returns {Promise<{ fiches: { chemin: string, actuel: string, attendu: string, ecarts: string[] }[], index: { chemin: string, actuel: string | null, attendu: string, ecarts: string[] }[], horsTable: string[], absentes: string[], noms: string[] }>}
 */
export async function calculer() {
  const parSorte = { composants: await lireMenus('composants'), modules: await lireMenus('modules') };
  const table = lireTable();
  const noms = lireNoms();
  const descriptions = lireDescriptions();
  const paires = JSON.parse(lire('tokens/commun/paires.json'));
  const themes = mesurerThemes();
  const decisions = lire('docs/decisions.md');
  const dette = lire('KNOWN_ISSUES.md');
  const parFichier = new Map([...parSorte.composants, ...parSorte.modules].map((m) => [m.nom, m.menu]));
  /** @param {string} f */
  const menuDe = (f) => {
    const m = parFichier.get(f);
    if (!m) throw new HorsGrammaire(`exemple hors grammaire : pièce sans props : ${f}.vue`);
    return m;
  };
  const fiches = [];
  const index = [];
  /** @type {string[]} */
  const horsTable = [];
  /** @type {string[]} */
  const absentes = [];
  /** @type {string[]} */
  const ecartsDesNoms = [];
  for (const sorte of /** @type {Sorte[]} */ (['composants', 'modules'])) {
    const { docs, index: cheminIndex, table: liste } = SORTES[sorte];
    const menus = parSorte[sorte];
    const pieces = new Map(menus.map((m) => [m.nom, sorte === 'modules' ? lireModule(m.nom) : lireComposant(m.nom)]));
    ecartsDesNoms.push(...ecartsNoms(menus, new Map([...pieces].map(([n, c]) => [n, c.emplacements])), noms, sorte));
    const presentes = existsSync(join(RACINE, docs)) ? readdirSync(join(RACINE, docs)).filter((f) => f.endsWith('.md') && f !== 'README.md') : [];
    horsTable.push(...presentes.filter((f) => !liste.some(([, fiche]) => `${fiche}.md` === f)).map((f) => `${docs}/${f}`));
    absentes.push(...fichesAbsentes(menus, presentes));
    /** @type {string[]} */
    const lignesIndex = [];
    for (const e of menus) {
      const chemin = `${docs}/${e.fiche}.md`;
      if (!presentes.includes(`${e.fiche}.md`)) continue;
      const quoi = `${ICI}/${SORTES[sorte].source}/${e.nom}`;
      const piece = /** @type {any} */ (pieces.get(e.nom));
      const stories = lireStories(e.nom);
      const lignesTokens = anatomie(piece, e.menu, table, descriptions, `${quoi}.vue`, parFichier);
      const genere = {
        entete: entete(e, piece, stories),
        titre: `# ${e.nom}`,
        props: blocProps(e.menu, piece, noms),
        refus: blocRefus(e.menu, `${quoi}.menu.js`),
        tokens: blocTokens(lignesTokens, piece.assemble),
        contrastes: piece.assemble ? blocContrastesModule(piece.assemble) : blocContrastes(pairesDe(piece, table, paires, `${quoi}.vue`), themes, `${quoi}.vue`),
      };
      const actuel = lire(chemin);
      const attendu = regenerer(actuel, chemin, genere);
      const ecarts = [];
      const avant = decouper(actuel, chemin);
      if (avant.lignes.slice(0, avant.finEntete + 1).join('\n') !== genere.entete) ecarts.push(`en-tête à régénérer (${COMMANDE})`);
      for (const b of BLOCS) {
        const [o, f] = avant.blocs[b];
        if (avant.lignes[o] !== ouverture(b) || avant.lignes.slice(o + 1, f).join('\n') !== genere[/** @type {keyof typeof genere} */ (b)]) ecarts.push(`bloc ${b} à régénérer (${COMMANDE})`);
      }
      ecarts.push(...ecartsEcrits(actuel, chemin, e, { table, stories, decisions, dette, descriptions, menuDe }));
      const poses = [...actuel.matchAll(/^- Posé par le parent : `([^`]+)`/gm)].map((m) => m[1]);
      ecarts.push(...ecartsDescriptions([...lignesTokens.map((l) => l.token), ...poses], descriptions));
      fiches.push({ chemin, actuel, attendu, ecarts });
      lignesIndex.push(`| ${code(e.nom)} | [${e.nom}](${e.fiche}.md) | ${phraseDeRole(actuel, chemin).phrase ?? ''} |`);
    }
    const actuel = existsSync(join(RACINE, cheminIndex)) ? lire(cheminIndex) : null;
    const attendu = regenererIndex(actuel, blocIndex(lignesIndex, sorte), cheminIndex);
    // Le glossaire est celui de l'index des composants ; l'index des modules y renvoie.
    const ecarts = actuel === null ? ['index absent'] : [...motsRefuses(actuel), ...(sorte === 'composants' ? ecartsGlossaire(actuel) : [])];
    index.push({ chemin: cheminIndex, actuel, attendu, ecarts });
  }
  return { fiches, index, horsTable, absentes, noms: ecartsDesNoms };
}

/**
 * Fiches qui manquent : chaque composant et chaque module a la sienne (DOC1).
 * @param {{ fiche: string, sorte?: Sorte }[]} menus @param {string[]} presentes noms des fichiers du dossier des fiches
 */
export const fichesAbsentes = (menus, presentes) => menus.filter((m) => !presentes.includes(`${m.fiche}.md`)).map((m) => `${SORTES[m.sorte ?? 'composants'].docs}/${m.fiche}.md`);

/**
 * Bloc généré d'un index, marques comprises.
 * @param {string[]} lignes @param {Sorte} [sorte]
 */
export function blocIndex(lignes, sorte = 'composants') {
  const commande = `Les blocs \`genere\` de chaque fiche, et cette liste, sont écrits par \`${COMMANDE}\` depuis les props, les composants et les tokens ; \`${COMMANDE} -- --verifier\` refuse une fiche qui ne leur correspond plus.`;
  const tete =
    sorte === 'modules'
      ? [
          '# Fiches des modules',
          '',
          `Une fiche par module de l'${ICI} : un assemblage de composants pour un usage du produit, sans pièce de Vuetify ni valeur visuelle propre. Chaque fiche dit à quoi il sert, ses props, ce qu'il refuse, sa mise en page, son accessibilité, et donne un exemple à copier. Les fiches des composants et le glossaire sont dans [docs/composants/](../composants/README.md), les règles dans [docs/regles.md](../regles.md). ${commande}`,
          '',
          '| Module | Fiche | À quoi il sert |',
        ]
      : [
          '# Fiches des composants',
          '',
          `Une fiche par composant de l'${ICI} : à quoi il sert, ses props, ce qu'il refuse, ses tokens, son accessibilité, un exemple à copier. Les règles qu'ils suivent sont dans [docs/regles.md](../regles.md). ${commande}`,
          '',
          '| Composant | Fiche | À quoi il sert |',
        ];
  return [ouverture('index'), ...tete, '|---|---|---|', ...lignes, fermeture('index')].join('\n');
}

/**
 * Un index régénéré : son bloc remplacé, ce qui est écrit sous le bloc (le glossaire) gardé à l'octet ; un index absent
 * ne reçoit que son bloc.
 * @param {string | null} actuel @param {string} bloc @param {string} [chemin]
 */
export function regenererIndex(actuel, bloc, chemin = INDEX) {
  if (actuel === null) return `${bloc}\n`;
  const lignes = actuel.split('\n');
  const { index } = marques(lignes, chemin, ['index']);
  return [...lignes.slice(0, index[0]), bloc, ...lignes.slice(index[1] + 1)].join('\n');
}
