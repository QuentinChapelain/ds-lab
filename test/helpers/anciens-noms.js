// @ts-check
/**
 * Lecture de docs/anciens-noms.json pour les tests : traduit un fichier de tokens écrit avec les anciens noms (copie
 * figée des primitives, couche marque d'avant le renommage) vers les noms d'aujourd'hui, ou l'inverse.
 * Clés : segment par segment, par la table des mots, sauf les chemins des exceptions. Textes ($value, $description) :
 * chaque nom complet ou préfixe de groupe d'au moins deux segments, entre limites de nom, et le groupe de tête devant
 * .* ou .<…> (brand.<emplacement>.*).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TABLE = JSON.parse(readFileSync(fileURLToPath(new URL('../../docs/anciens-noms.json', import.meta.url)), 'utf8'));

const esc = (/** @type {string} */ s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Traducteur dans un sens. @param {'avant' | 'apres'} vers nom d'arrivée : 'apres' traduit l'ancien en nouveau
 */
export function traducteur(vers) {
  /** @type {Record<string, string>} */
  const noms = {};
  for (const [a, b] of Object.entries(TABLE.tokens)) {
    const [x, y] = vers === 'apres' ? [a, b] : [b, a];
    noms[x] = y;
    const px = x.split('.'), py = y.split('.');
    for (let i = 2; i < px.length; i++) noms[px.slice(0, i).join('.')] ??= py.slice(0, i).join('.');
  }
  /** @type {Record<string, string>} */
  const mots = {};
  for (const [a, b] of Object.entries(TABLE.mots)) if (vers === 'apres') mots[a] = /** @type {string} */ (b);
  const exceptions = Object.fromEntries(Object.entries(TABLE.exceptions).map(([a, b]) => (vers === 'apres' ? [a, b] : [b, a])));
  /** Chemins et groupes, du départ à l'arrivée, pour les clés dans le sens retour (un mot anglais a parfois deux origines). */
  /** @type {Record<string, string>} */
  const groupes = {};
  for (const [a, b] of Object.entries(TABLE.tokens)) {
    const [x, y] = vers === 'apres' ? [a, b] : [b, a];
    const px = x.split('.'), py = y.split('.');
    for (let i = 1; i <= px.length; i++) groupes[px.slice(0, i).join('.')] ??= py.slice(0, i).join('.');
  }
  const re = new RegExp(`(?<![\\w.$-])(${Object.keys(noms).sort((a, b) => b.length - a.length).map(esc).join('|')})(?![\\w-]|\\.\\w)`, 'g');
  const tetes = Object.keys(groupes).filter((g) => !g.includes('.'));
  const reTete = new RegExp(`(?<![\\w.$-])(${tetes.sort((a, b) => b.length - a.length).map(esc).join('|')})\\.(?=\\*|<)`, 'g');
  const texte = (/** @type {string} */ s) => s.replace(re, (_, n) => noms[n]).replace(reTete, (_, n) => `${groupes[n]}.`);
  /** Segment d'un chemin. @param {string} k @param {string} chemin */
  const segment = (k, chemin) => {
    if (exceptions[chemin]) return /** @type {string} */ (exceptions[chemin].split('.').at(-1));
    if (/^\d+$/.test(k)) return k;
    if (vers !== 'apres') {
      const g = groupes[chemin];
      if (g === undefined) throw new Error(`chemin sans traduction : ${chemin}`);
      return /** @type {string} */ (g.split('.').at(-1));
    }
    const m = mots[k];
    if (m === undefined) throw new Error(`segment sans traduction : ${chemin}`);
    return m;
  };
  /** Textes seuls, clés gardées ($value, $extensions). @param {any} o @returns {any} */
  const valeurs = (o) =>
    typeof o === 'string' ? texte(o) : Array.isArray(o) ? o.map(valeurs) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, valeurs(v)])) : o;
  /** @param {any} o @param {string[]} p @returns {any} */
  const jetons = (o, p = []) => {
    if (typeof o === 'string') return texte(o);
    if (Array.isArray(o)) return o.map((x) => jetons(x, p));
    if (!o || typeof o !== 'object') return o;
    /** @type {Record<string, any>} */
    const out = {};
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith('$')) out[k] = valeurs(v);
      else out[segment(k, [...p, k].join('.'))] = jetons(v, [...p, k]);
    }
    return out;
  };
  return { texte, jetons };
}
