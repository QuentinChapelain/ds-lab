// @ts-check
/**
 * Textes affichés du constat des composants (D46, D47) : étiquettes d'origine, états des blocs, explications des quatre
 * scores, définitions, guidage, limites. Ils vivent dans un fichier de données, src/report/constat.textes.json, lu ici
 * une fois : l'étiquette d'origine de l'équipe contient un mot que la garde des noms de marque interdit dans le code de
 * src/ (test/marque-en-dur.test.js) ; le fichier ne contient que des textes, ceux des attendus, mot pour mot
 * (test/composants-textes.test.js). Une forme en deux textes est le singulier puis le pluriel ; {n} y est le nombre.
 */
import { readFileSync } from 'node:fs';

/** @type {any} */
export const TEXTES = JSON.parse(readFileSync(new URL('./constat.textes.json', import.meta.url), 'utf8'));
