// @ts-check
/**
 * La description d'une commande, dans le dossier de jeu (D87) : l'app l'affiche à l'humain, et l'agent l'écrit en
 * anglais par habitude (« Write the added sheets and read the next step », mot pour mot dans la partie du
 * 25/11/2026). Un crochet de Claude Code, posé par `npm run jeu`, refuse une description qui commence par un verbe
 * anglais d'une courte liste, et dit de la réécrire en français. Étroit à dessein : un refus à tort bloque une
 * commande. Quatre verbes s'écrivent aussi en français (compare, capture, file, stop) : ceux-là ne sont refusés
 * qu'avec un mot-outil anglais dans la phrase.
 */

/** Les verbes anglais qui ouvrent une description, et ne sont pas des mots français. */
const VERBES = new Set([
  'read', 're-read', 'write', 'run', 'rerun', 'check', 'list', 'find', 'get', 'serve', 'start', 'wait', 'measure',
  'apply', 'reapply', 'verify', 'look', 'inspect', 'print', 'give', 'reset', 'count', 'show', 'open', 'fetch',
  'install', 'create', 'update', 'remove', 'delete', 'recapture', 'locate', 'set', 'view', 'search', 'kill', 'launch',
]);

/** Les verbes qui s'écrivent aussi en français. */
const AMBIGUS = new Set(['compare', 'capture', 'file', 'stop']);

/** Des mots-outils anglais qui ne sont pas français. */
const ANGLAIS = /\b(the|and|to|of|with|for|whether|its|their|this|that|from|into|by|what|which|why|how|then|them|it|is|are)\b/i;

/** Le refus : ce qu’il faut faire. */
const REFUS =
  'Décris cette commande en français, avec les mots de l’humain (« ranger tes choix et les appliquer ») : sa description s’affiche dans l’app. Relance-la, la même, avec sa description en français.';

/**
 * Le refus d'une description, ou null.
 * @param {string} description
 * @returns {string | null}
 */
export function refusDeDescription(description) {
  const premier = description.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z-]/g, '') ?? '';
  if (VERBES.has(premier)) return REFUS;
  if (AMBIGUS.has(premier) && ANGLAIS.test(description)) return REFUS;
  return null;
}
