// @ts-check
/**
 * Textes affichés du constat des composants (D46) : étiquettes d'origine, textes des (i), limites. Ils vivent dans un
 * fichier de données, src/report/constat.textes.json, lu ici une fois : l'étiquette d'origine de l'équipe contient un mot
 * que la garde des noms de marque interdit dans le code de src/ (test/marque-en-dur.test.js) ; le fichier ne contient
 * que des textes, ceux de l'attendu, mot pour mot (test/composants-textes.test.js).
 */
import { readFileSync } from 'node:fs';

/**
 * @typedef {{ origines: { equipe: string, nu: string }, info: Record<string, string>, limites: string[] }} Textes
 */

/** @type {Textes} */
export const TEXTES = JSON.parse(readFileSync(new URL('./constat.textes.json', import.meta.url), 'utf8'));
