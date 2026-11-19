// Fiches des composants (D56) : une fiche Markdown par enveloppe, dans docs/composants/, dont l'en-tête et cinq blocs
// sont écrits depuis le menu, le composant, sa story et les jetons ; le reste est écrit à la main, et en partie
// contrôlé. L'index docs/composants/README.md est écrit en entier. Les contrastes viennent de la fonction même de
// npm run contraste (loadRoles, contratRoles), écrits comme elle les écrit.
//
// Un bloc : une ligne « <!-- genere:<bloc> : écrit par … --> », son contenu, une ligne « <!-- /genere:<bloc> --> ».
// Une marque absente, en double ou ouverte sans fin est une panne, comme une variable du thème inconnue de la table, une
// variable ds- écrite et inconnue, une règle sans message lisible ou un exemple hors grammaire : l'erreur nomme le
// fichier. Un écart (bloc à régénérer, section, ligne d'option, décision, dette, story, exemple refusé) est une ligne.
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
const COMMANDE = `npm --prefix ${ICI} run fiches`;

/** Fiche de chaque menu, par son nom : celui de sa preuve (atelier/preuve/<fiche>.js), dans l'ordre de l'index. */
export const FICHES = /** @type {const} */ ([
  ['DsButton', 'button'],
  ['DsIconButton', 'icon-button'],
  ['DsTextInput', 'text-input'],
  ['DsCard', 'card'],
  ['DsAvatar', 'avatar'],
  ['DsTag', 'tag'],
]);

/** Blocs générés d'une fiche, en plus de l'en-tête. */
export const BLOCS = ['titre', 'menu', 'refus', 'jetons', 'contrastes'];

/** Titres de niveau 2 d'une fiche, dans l'ordre. */
export const SECTIONS = ['Quand l\'utiliser', 'Menu', 'Refusé', 'Jetons', 'Accessibilité', 'En situation', 'Décisions et dette', 'Preuve'];

const MODES = ['clair', 'sombre'];
const D2 = { decimales: 2, zeros: true };
const TYPES = new Map([
  [String, 'texte'],
  [Boolean, 'booléen'],
  [Number, 'nombre'],
  [Object, 'objet'],
  [Function, 'fonction'],
  [Array, 'tableau'],
]);

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

// ─── Sources ────────────────────────────────────────────────────────────────

/**
 * Menus de atelier/composants/, dans l'ordre de FICHES. Un menu absent de la table, ou une fiche sans preuve, est une
 * panne.
 * @returns {Promise<{ nom: string, fiche: string, menu: any, texteMenu: string }[]>}
 */
export async function lireMenus() {
  const fichiers = readdirSync(join(RACINE, ICI, 'composants')).filter((f) => f.endsWith('.menu.js')).sort();
  const noms = fichiers.map((f) => f.replace(/\.menu\.js$/, ''));
  const horsTable = noms.filter((n) => !FICHES.some(([m]) => m === n));
  if (horsTable.length) throw new Error(`${ICI}/fiches/fiche.js : menu sans fiche dans la table : ${horsTable.join(', ')}`);
  const out = [];
  for (const [nom, fiche] of FICHES) {
    if (!noms.includes(nom)) throw new Error(`${ICI}/fiches/fiche.js : fiche sans menu : ${fiche} (${nom}.menu.js)`);
    if (!existsSync(join(RACINE, ICI, 'preuve', `${fiche}.js`))) throw new Error(`${ICI}/fiches/fiche.js : fiche sans preuve : ${ICI}/preuve/${fiche}.js`);
    const chemin = `${ICI}/composants/${nom}.menu.js`;
    const menu = (await import(pathToFileURL(join(RACINE, chemin)).href)).default;
    if (menu.nom !== nom) throw new Error(`${chemin} : nom ${menu.nom}, attendu ${nom}`);
    out.push({ nom, fiche, menu, texteMenu: lire(chemin) });
  }
  return out;
}

/** Table des couleurs et des variables du thème (tokens/commun/vuetify.json). */
export function lireTable() {
  const t = JSON.parse(lire('tokens/commun/vuetify.json'));
  const variables = Object.fromEntries(Object.entries(t.variables).filter(([k]) => !k.startsWith('$')));
  return { couleurs: /** @type {Record<string, { fond: string, texte: string }>} */ (t.couleurs), variables: /** @type {Record<string, any>} */ (variables) };
}

/**
 * Ce que dit le .vue d'une enveloppe : la pièce de Vuetify enveloppée, les variables du thème lues (les siennes et
 * celles des .vue qu'il importe), ses emplacements.
 * @param {string} nom
 * @returns {{ enveloppe: string, theme: Set<string>, ds: Set<string>, emplacements: string[] }}
 */
export function lireComposant(nom) {
  const chemin = `${ICI}/composants/${nom}.vue`;
  const t = sansCommentaires(lire(chemin));
  const theme = new Set([...t.matchAll(/--v-theme-([a-z0-9-]+)/g)].map((m) => m[1]));
  const ds = new Set([...t.matchAll(/--v-(ds-[a-z0-9-]+)/g)].map((m) => m[1]));
  const emplacements = [...new Set([...t.matchAll(/\bslots\.(\w+)/g)].map((m) => m[1]))];
  const vuetify = /import\s*\{\s*(V\w+)\s*\}\s*from\s*'vuetify\/components'/.exec(t);
  const importe = /import\s+\w+\s+from\s+'\.\/(\w+)\.vue'/.exec(t);
  let enveloppe = vuetify?.[1];
  if (importe) {
    const autre = lireComposant(importe[1]);
    for (const v of autre.theme) theme.add(v);
    for (const v of autre.ds) ds.add(v);
    enveloppe ??= `${autre.enveloppe} (par ${importe[1]})`;
  }
  if (!enveloppe) throw new Error(`${chemin} : aucune pièce de Vuetify ni enveloppe importée`);
  return { enveloppe, theme, ds, emplacements };
}

/**
 * Stories d'une enveloppe : son titre lisible et les noms de ses stories (exports et name).
 * @param {string} nom
 */
export function lireStories(nom) {
  const chemin = `${ICI}/stories/${nom}.stories.js`;
  const t = lire(chemin);
  const titre = /export default \{ title: '([^']+)'/.exec(t)?.[1];
  if (!titre) throw new Error(`${chemin} : titre des stories introuvable`);
  const noms = new Set([...[...t.matchAll(/^export const (\w+)/gm)].map((m) => m[1]), ...[...t.matchAll(/^\s*name: '([^']+)'/gm)].map((m) => m[1])]);
  return { chemin, titre: /** @type {string} */ (titre.split('/').pop()), noms };
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
    for (const mode of MODES) {
      const theme = `${nomDeMarque(dossier)}, ${mode}`;
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

/** @param {any} e entrée de lireMenus @param {any} composant @param {any} stories */
export function entete(e, composant, stories) {
  const quoi = `${ICI}/composants/${e.nom}.menu.js`;
  return [
    '---',
    `nom: ${e.menu.nom}`,
    `titre: ${stories.titre}`,
    `fichier: ${ICI}/composants/${e.nom}.vue`,
    `menu: ${quoi}`,
    `enveloppe: ${composant.enveloppe}`,
    `decisions: [${decisionsDuMenu(e.texteMenu, quoi).join(', ')}]`,
    `stories: ${stories.chemin}`,
    `preuve: npm --prefix ${ICI} run preuve -- ${e.fiche}`,
    '---',
  ].join('\n');
}

/** @param {any} menu @param {any} composant */
export function blocMenu(menu, composant) {
  const lignes = ['| Option | Type | Obligatoire | Défaut | Valeurs admises |', '|---|---|---|---|---|'];
  for (const [cle, o] of Object.entries(menu.options)) {
    const type = [o.type].flat().map((t) => TYPES.get(t) ?? t.name).join(' ou ');
    const defaut = 'defaut' in o ? code(litteral(o.defaut)) : 'aucun';
    const valeurs = o.valeurs ? o.valeurs.map((/** @type {unknown} */ v) => code(litteral(v))).join(', ') : 'libre';
    lignes.push(`| ${code(cle)} | ${type} | ${o.obligatoire ? 'oui' : 'non'} | ${defaut} | ${valeurs} |`);
  }
  const liste = (/** @type {string[]} */ l) => (l.length ? l.map(code).join(', ') : 'aucun');
  lignes.push('', `Événements émis : ${liste(menu.evenements ?? [])}. Emplacements : ${liste(composant.emplacements)}.`);
  return lignes.join('\n');
}

/** @param {any} menu @param {string} quoi */
export function blocRefus(menu, quoi) {
  const p = menu.nom;
  const retires = menu.attributsRetires ?? [];
  const tete = `Attributs admis en plus des options : \`id\`, \`aria-*\`, \`data-*\`. Retirés : ${retires.length ? retires.map(code).join(', ') : 'aucun'}. ${menu.ecouteurs === false ? 'Écouteurs : refusés.' : 'Écouteurs (`on…`) : admis.'}`;
  /** @type {string[]} */
  const messages = [`${p} : attribut refusé : <attributs>`];
  /** @type {Map<string, string>} */
  const suffixes = new Map();
  for (const [cle, o] of Object.entries(menu.options)) {
    if (o.obligatoire) messages.push(`${p} : ${cle} : obligatoire`);
    if (o.valeurs) messages.push(`${p} : ${cle} : valeur inconnue : <valeur> (${o.valeurs.join(', ')})`);
  }
  for (const r of menu.regles ?? []) messages.push(`${p} : ${messageDeRegle(r, quoi)}`);
  for (const r of menu.reglesDuRendu ?? []) {
    const m = `${p} : ${messageDeRegle(r, quoi)}`;
    messages.push(m);
    suffixes.set(m, ', au rendu');
  }
  const uniques = [...new Set(messages)];
  return [tete, '', 'Tout autre usage lève une erreur, et rien n\'est rendu. Messages, dans l\'ordre où ils sont vérifiés :', '', ...uniques.map((m) => `- ${code(m)}${suffixes.get(m) ?? ''}`)].join('\n');
}

/**
 * Jetons d'une enveloppe : jeton → variables du thème, couleurs d'abord (ordre de la table, fond puis texte), puis
 * variables (ordre de la table).
 * @param {any} composant @param {any} table @param {string} quoi
 * @returns {Map<string, string[]>}
 */
export function jetonsDe(composant, table, quoi) {
  for (const v of composant.theme) {
    const base = v.startsWith('on-') ? v.slice(3) : v;
    if (!(base in table.couleurs)) throw new Error(`${quoi} : variable inconnue de la table : --v-theme-${v}`);
  }
  for (const v of composant.ds) if (!(v in table.variables)) throw new Error(`${quoi} : variable inconnue de la table : --v-${v}`);
  /** @type {Map<string, string[]>} */
  const out = new Map();
  /** @param {string} jeton @param {string} variable */
  const ajouter = (jeton, variable) => {
    if (!out.has(jeton)) out.set(jeton, []);
    out.get(jeton)?.push(variable);
  };
  for (const [c, { fond, texte }] of Object.entries(table.couleurs)) {
    if (composant.theme.has(c)) ajouter(fond, c);
    if (composant.theme.has(`on-${c}`)) ajouter(texte, `on-${c}`);
  }
  for (const [k, v] of Object.entries(table.variables)) if (composant.ds.has(k)) ajouter(v.jeton, k);
  return out;
}

/** @param {Map<string, string[]>} jetons */
export function blocJetons(jetons) {
  return ['| Jeton | Variables du thème |', '|---|---|', ...[...jetons].map(([j, vs]) => `| ${code(j)} | ${vs.map(code).join(', ')} |`)].join('\n');
}

/**
 * Paires de la pièce : celle de chaque couleur employée (fond ou texte), puis, pour chaque variable de texte ou de
 * bordure, les paires où son jeton est devant, sur un fond de la pièce, sur fond.app ou sur fond.surface.
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
  const fonds = new Set(['fond.app', 'fond.surface']);
  for (const [c, { fond, texte }] of Object.entries(table.couleurs)) {
    if (!composant.theme.has(c) && !composant.theme.has(`on-${c}`)) continue;
    fonds.add(fond);
    if (!paires.paires.some((/** @type {any} */ p) => p.devant === texte && p.fond === fond)) throw new Error(`${quoi} : paire absente de tokens/commun/paires.json : ${texte} sur ${fond}`);
    ajouter(texte, fond);
  }
  for (const [k, v] of Object.entries(table.variables)) {
    if (!composant.ds.has(k) || !/^(texte|bordure)\./.test(v.jeton)) continue;
    for (const p of paires.paires) if (p.devant === v.jeton && fonds.has(p.fond)) ajouter(p.devant, p.fond);
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

// ─── Lecture d'une fiche ────────────────────────────────────────────────────

/**
 * Une fiche en morceaux : l'en-tête, et pour chaque bloc ses lignes d'ouverture et de fermeture. Une marque absente, en
 * double ou ouverte sans fin est une panne.
 * @param {string} texte @param {string} chemin
 */
export function decouper(texte, chemin) {
  const lignes = texte.split('\n');
  if (lignes[0] !== '---') throw new Error(`${chemin} : en-tête absent`);
  const finEntete = lignes.indexOf('---', 1);
  if (finEntete === -1) throw new Error(`${chemin} : en-tête ouvert sans fin`);
  /** @type {Record<string, [number, number]>} */
  const blocs = {};
  for (const b of BLOCS) {
    const ouvertes = lignes.flatMap((l, i) => (l.startsWith(`<!-- genere:${b} `) ? [i] : []));
    const fermees = lignes.flatMap((l, i) => (l === fermeture(b) ? [i] : []));
    if (!ouvertes.length) throw new Error(`${chemin} : marque genere:${b} absente`);
    if (ouvertes.length > 1 || fermees.length > 1) throw new Error(`${chemin} : marque genere:${b} en double`);
    if (!fermees.length || fermees[0] < ouvertes[0]) throw new Error(`${chemin} : marque genere:${b} ouverte sans fin`);
    blocs[b] = [ouvertes[0], fermees[0]];
  }
  return { lignes, finEntete, blocs };
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
  let code = false;
  lignes.forEach((l, i) => {
    if (l.startsWith('```')) code = !code;
    else if (!code && l.startsWith('## ')) out.push({ titre: l, debut: i });
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
 * Phrase de rôle d'une fiche : la première ligne non vide après le bloc titre ; null si elle manque ou n'est pas
 * une phrase d'une ligne finie par un point.
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
 * Écarts des parties écrites d'une fiche. Une variable ds- écrite et inconnue est une panne, comme un exemple hors
 * grammaire.
 * @param {string} texte @param {string} chemin @param {any} e entrée de lireMenus
 * @param {{ table: any, stories: any, decisions: string, dette: string, menuDe: (f: string) => any }} ctx
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

  // Lignes d'option : dans la section Menu, après le bloc.
  const options = Object.keys(e.menu.options);
  const ecrites = lignesDe(lignes, bornes(lignes, s, 'Menu'), blocs.menu[1]).flatMap((l) => /^- `([^`]+)` : /.exec(l)?.[1] ?? []);
  for (const o of options) if (!ecrites.includes(o)) ecarts.push(`option sans sa ligne : ${o}`);
  for (const o of ecrites) if (!options.includes(o)) ecarts.push(`ligne d'une option hors du menu : ${o}`);
  const communes = ecrites.filter((o) => options.includes(o));
  if (communes.length === options.length && communes.some((o, j) => o !== options[j])) ecarts.push('lignes d\'option hors de l\'ordre du menu');

  // Décisions et dette citées.
  for (const n of new Set([...texte.matchAll(/\bD(\d{2})\b/g)].map((m) => m[1]))) if (!new RegExp(`^### D${n}$`, 'm').test(ctx.decisions)) ecarts.push(`décision inconnue : D${n}`);
  for (const n of new Set([...texte.matchAll(/\bB(\d+)\b/g)].map((m) => m[1]))) if (!new RegExp(`^\\| B${n} \\|`, 'm').test(ctx.dette)) ecarts.push(`dette inconnue : B${n}`);

  // Jetons écrits, hors du bloc.
  for (const l of lignesDe(lignes, bornes(lignes, s, 'Jetons'), blocs.jetons[1]))
    for (const m of l.matchAll(/`(ds-[a-z0-9-]+)`/g)) if (!(m[1] in ctx.table.variables)) throw new Error(`${chemin} : variable inconnue de la table : ${m[1]}`);

  // En situation : stories citées, un seul exemple, accepté par la fabrique.
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
  return ecarts;
}

// ─── Les fiches du dépôt ────────────────────────────────────────────────────

/**
 * Chaque fiche présente, son texte régénéré et ses écarts, puis l'index.
 * @returns {Promise<{ fiches: { chemin: string, actuel: string, attendu: string, ecarts: string[] }[], index: { chemin: string, actuel: string | null, attendu: string }, horsTable: string[] }>}
 */
export async function calculer() {
  const menus = await lireMenus();
  const table = lireTable();
  const paires = JSON.parse(lire('tokens/commun/paires.json'));
  const themes = mesurerThemes();
  const decisions = lire('docs/decisions.md');
  const dette = lire('KNOWN_ISSUES.md');
  const parFichier = new Map(menus.map((m) => [m.nom, m.menu]));
  /** @param {string} f */
  const menuDe = (f) => {
    const m = parFichier.get(f);
    if (!m) throw new HorsGrammaire(`exemple hors grammaire : enveloppe sans menu : ./composants/${f}.vue`);
    return m;
  };
  const presentes = existsSync(join(RACINE, DOSSIER)) ? readdirSync(join(RACINE, DOSSIER)).filter((f) => f.endsWith('.md') && f !== 'README.md') : [];
  const horsTable = presentes.filter((f) => !FICHES.some(([, fiche]) => `${fiche}.md` === f)).map((f) => `${DOSSIER}/${f}`);
  const fiches = [];
  /** @type {string[]} */
  const lignesIndex = [];
  for (const e of menus) {
    const chemin = `${DOSSIER}/${e.fiche}.md`;
    if (!presentes.includes(`${e.fiche}.md`)) continue;
    const quoi = `${ICI}/composants/${e.nom}`;
    const composant = lireComposant(e.nom);
    const stories = lireStories(e.nom);
    const genere = {
      entete: entete(e, composant, stories),
      titre: `# ${stories.titre}`,
      menu: blocMenu(e.menu, composant),
      refus: blocRefus(e.menu, `${quoi}.menu.js`),
      jetons: blocJetons(jetonsDe(composant, table, `${quoi}.vue`)),
      contrastes: blocContrastes(pairesDe(composant, table, paires, `${quoi}.vue`), themes, `${quoi}.vue`),
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
    ecarts.push(...ecartsEcrits(actuel, chemin, e, { table, stories, decisions, dette, menuDe }));
    fiches.push({ chemin, actuel, attendu, ecarts });
    lignesIndex.push(`| ${code(e.nom)} | [${stories.titre}](${e.fiche}.md) | ${phraseDeRole(actuel, chemin).phrase ?? ''} |`);
  }
  const index = {
    chemin: INDEX,
    actuel: existsSync(join(RACINE, INDEX)) ? lire(INDEX) : null,
    attendu: texteIndex(lignesIndex),
  };
  return { fiches, index, horsTable };
}

/** Index des fiches, écrit en entier. @param {string[]} lignes */
export function texteIndex(lignes) {
  return [
    ouverture('index'),
    '# Fiches des composants',
    '',
    `Une fiche par enveloppe de l'${ICI} : son rôle, son menu, ce qu'elle refuse, ses jetons, son accessibilité, un exemple à copier. Les blocs \`genere\` de chaque fiche, et cette liste, sont écrits par \`${COMMANDE}\` depuis les menus, les composants et les jetons ; \`${COMMANDE} -- --verifier\` refuse une fiche qui ne leur correspond plus.`,
    '',
    '| Composant | Fiche | Rôle |',
    '|---|---|---|',
    ...lignes,
    fermeture('index'),
    '',
  ].join('\n');
}

