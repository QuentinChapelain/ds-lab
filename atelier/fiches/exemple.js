// Lecteur de l'exemple d'une fiche (D56) : un bloc vue (script setup, puis gabarit), lu par une grammaire fermée, sans
// compilateur de Vue, puis vérifié par la fabrique (verifierUsage), enveloppes imbriquées comprises. Il prouve que
// l'exemple respecte le menu, pas qu'il se rend comme prévu : le rendu, c'est la preuve qui le juge. Une syntaxe hors de
// la grammaire est une panne qui la nomme (HorsGrammaire), jamais une réussite ; un usage que la fabrique refuse lève
// son message.
//
// Script : import <Nom> from './composants/<Fichier>.vue' ; import { a, b } from '<module>' ; const x = icone(y) ;
// const x = '<texte>'. Gabarit : balises des enveloppes importées, balises HTML en minuscules (contenu seul lu),
// <template #emplacement> dans une enveloppe, texte sans {{. Attributs : nom="texte", nom seul, :nom="littéral ou nom
// défini", @evenement="nom", v-model="nom". Comme Vue : un nom en tirets devient camelCase face aux options, @x donne
// l'écouteur onX, retiré des attributs si x est un événement du menu, les défauts du menu sont appliqués.
import { verifierUsage } from '../composants/fabrique.js';

/** Syntaxe hors de la grammaire de l'exemple. */
export class HorsGrammaire extends Error {}

/** @param {string} m */
const hors = (m) => new HorsGrammaire(`exemple hors grammaire : ${m}`);

const IDENT = /^[A-Za-z_$][\w$]*$/;

/** @param {string} s */
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/**
 * Bloc vue d'un exemple, en ses deux parties.
 * @param {string} source
 */
function parties(source) {
  const m = /^\s*<script setup>\n([\s\S]*?)\n<\/script>\s*<template>\n([\s\S]*)\n<\/template>\s*$/.exec(source);
  if (!m) throw hors('attendu un <script setup>, puis un <template>, et rien d\'autre');
  return { script: m[1], gabarit: m[2] };
}

/**
 * Lignes du script : enveloppes importées (nom local → fichier) et noms définis (nom → valeur).
 * @param {string} script
 */
function lireScript(script) {
  /** @type {Map<string, string>} */
  const enveloppes = new Map();
  /** @type {Map<string, unknown>} */
  const noms = new Map();
  for (const brute of script.split('\n')) {
    const l = brute.trim();
    if (!l) continue;
    let m;
    if ((m = /^import (\w+) from '\.\/composants\/(\w+)\.vue';$/.exec(l))) enveloppes.set(m[1], m[2]);
    else if ((m = /^import \{ ([\w$]+(?:, [\w$]+)*) \} from '[^']+';$/.exec(l))) for (const n of m[1].split(', ')) noms.set(n, () => null);
    else if ((m = /^const (\w+) = icone\((\w+)\);$/.exec(l))) {
      if (!noms.has(m[2])) throw hors(`nom non défini : ${m[2]}`);
      noms.set(m[1], () => null);
    } else if ((m = /^const (\w+) = '([^']*)';$/.exec(l))) noms.set(m[1], m[2]);
    else throw hors(`ligne de script : ${l}`);
  }
  return { enveloppes, noms };
}

/**
 * Nœuds du gabarit : { balise, attributs: [nom, valeur | undefined][], enfants } ou un texte.
 * @param {string} gabarit
 * @returns {any[]}
 */
function lireGabarit(gabarit) {
  /** @type {any[]} */
  const racine = [];
  /** @type {{ balise: string, enfants: any[] }[]} */
  const pile = [{ balise: '', enfants: racine }];
  let i = 0;
  while (i < gabarit.length) {
    const reste = gabarit.slice(i);
    if (reste.startsWith('<!--')) throw hors('commentaire');
    let m = /^<\/([A-Za-z][\w-]*)\s*>/.exec(reste);
    if (m) {
      const ouvert = pile.pop();
      if (!ouvert || ouvert.balise !== m[1] || !pile.length) throw hors(`fermeture inattendue : </${m[1]}>`);
      i += m[0].length;
      continue;
    }
    m = /^<([A-Za-z][\w-]*)((?:\s+[^\s=/>]+(?:="[^"]*")?)*)\s*(\/?)>/.exec(reste);
    if (m) {
      const attributs = [...m[2].matchAll(/([^\s=/>]+)(?:="([^"]*)")?/g)].map((a) => [a[1], a[2]]);
      const noeud = { balise: m[1], attributs, enfants: [] };
      pile[pile.length - 1].enfants.push(noeud);
      if (!m[3]) pile.push(noeud);
      i += m[0].length;
      continue;
    }
    if (reste.startsWith('<')) throw hors(`balise illisible : ${reste.split('\n')[0]}`);
    const fin = reste.indexOf('<');
    const texte = fin === -1 ? reste : reste.slice(0, fin);
    if (texte.includes('{{')) throw hors(`interpolation : ${texte.trim()}`);
    if (texte.trim()) pile[pile.length - 1].enfants.push(texte);
    i += texte.length;
  }
  if (pile.length !== 1) throw hors(`balise non fermée : <${pile[pile.length - 1].balise}>`);
  return racine;
}

/**
 * Valeur d'un :nom="…" : un littéral ou un nom défini par le script.
 * @param {string} expr @param {Map<string, unknown>} noms
 */
function valeur(expr, noms) {
  const e = expr.trim();
  if (/^-?\d+(\.\d+)?$/.test(e)) return Number(e);
  if (e === 'true') return true;
  if (e === 'false') return false;
  if (e === 'null') return null;
  const chaine = /^'([^']*)'$/.exec(e);
  if (chaine) return chaine[1];
  if (IDENT.test(e)) {
    if (!noms.has(e)) throw hors(`nom non défini : ${e}`);
    return noms.get(e);
  }
  throw hors(`expression : ${e}`);
}

/** @param {any} option */
const booleenne = (option) => [option?.type].flat().includes(Boolean);

/**
 * Options et attributs d'une enveloppe, comme Vue les lui donne.
 * @param {any} menu @param {[string, string | undefined][]} attributs @param {Map<string, unknown>} noms
 */
function usage(menu, attributs, noms) {
  /** @type {Record<string, unknown>} */
  const props = {};
  /** @type {Record<string, unknown>} */
  const attrs = {};
  const evenements = menu.evenements ?? [];
  /** @param {string} evt */
  const ecouteur = (evt) => {
    if (!evenements.includes(evt)) attrs[`on${evt[0].toUpperCase()}${camel(evt.slice(1))}`] = () => null;
  };
  /** @param {string} nom @param {unknown} v */
  const poser = (nom, v) => {
    const cle = camel(nom);
    if (cle in menu.options) props[cle] = v;
    else attrs[nom] = v;
  };
  for (const [nom, brut] of attributs) {
    if (nom === 'v-model') {
      if (brut === undefined || !IDENT.test(brut)) throw hors(`v-model="${brut ?? ''}"`);
      poser('modelValue', '');
      ecouteur('update:modelValue');
    } else if (nom.startsWith('@')) {
      if (brut === undefined || !IDENT.test(brut)) throw hors(`${nom}="${brut ?? ''}"`);
      ecouteur(nom.slice(1));
    } else if (nom.startsWith(':')) {
      if (brut === undefined) throw hors(`${nom} sans valeur`);
      poser(nom.slice(1), valeur(brut, noms));
    } else if (nom.startsWith('v-') || nom.startsWith('#')) throw hors(`directive : ${nom}`);
    else if (brut === undefined) poser(nom, booleenne(menu.options[camel(nom)]) ? true : '');
    else poser(nom, brut);
  }
  for (const [cle, option] of Object.entries(menu.options)) {
    if (cle in props) continue;
    if ('defaut' in option) props[cle] = option.defaut;
    else if (booleenne(option)) props[cle] = false;
  }
  return { props, attrs };
}

/**
 * Vérifie un exemple : lève HorsGrammaire sur une syntaxe hors de la grammaire, l'erreur de la fabrique sur un usage
 * refusé, et rend la liste des fichiers d'enveloppe employés.
 * @param {string} source contenu du bloc vue
 * @param {(fichier: string) => any} menuDe menu d'une enveloppe, par le nom de son fichier (sans .vue)
 * @returns {string[]}
 */
export function verifierExemple(source, menuDe) {
  const { script, gabarit } = parties(source);
  const { enveloppes, noms } = lireScript(script);
  /** @type {Set<string>} */
  const employes = new Set();

  /** Nœud vu par une règle du rendu : une enveloppe a pour type son composant (son nom), une balise sa chaîne. @param {any} n */
  const vu = (n) => (typeof n === 'string' ? n : enveloppes.has(n.balise) ? { type: { name: menuDe(/** @type {string} */ (enveloppes.get(n.balise))).nom } } : { type: n.balise });

  /** @param {any[]} noeuds */
  const parcourir = (noeuds) => {
    for (const n of noeuds) {
      if (typeof n === 'string') continue;
      if (n.balise === 'template') throw hors('<template> hors d\'une enveloppe');
      if (/^[a-z][a-z0-9]*$/.test(n.balise)) {
        parcourir(n.enfants);
        continue;
      }
      const fichier = enveloppes.get(n.balise);
      if (fichier === undefined) throw hors(`balise inconnue : ${n.balise}`);
      const menu = menuDe(fichier);
      employes.add(fichier);
      const { props, attrs } = usage(menu, n.attributs, noms);
      /** @type {Record<string, () => unknown[]>} */
      const slots = {};
      const parDefaut = [];
      /** @type {any[]} */
      const contenus = [];
      for (const e of n.enfants) {
        if (typeof e !== 'string' && e.balise === 'template') {
          const [cle] = e.attributs;
          if (e.attributs.length !== 1 || !cle[0].startsWith('#') || cle[1] !== undefined) throw hors('<template> sans un seul #emplacement');
          slots[cle[0].slice(1)] = () => e.enfants.map(vu);
          contenus.push(...e.enfants);
        } else parDefaut.push(e);
      }
      if (parDefaut.length) slots.default = () => parDefaut.map(vu);
      // Comme au montage : l'enveloppe est vérifiée avant ce qu'elle contient.
      verifierUsage(menu, props, attrs, slots, { rendu: true });
      parcourir([...contenus, ...parDefaut]);
    }
  };
  parcourir(lireGabarit(gabarit));
  return [...employes];
}
