// @ts-check
/**
 * Nom de la variable CSS d'un jeton, écrit une seule fois pour tout src/ : le chemin du jeton, points remplacés par des
 * tirets, précédé de -- (background.surface → --background-surface). Lu par la feuille des jetons (Terrazzo), la
 * consigne et les modifications, et les planches des espacements et des styles de texte.
 */

/** Variable CSS d'un jeton DTCG. @param {string} token */
export const cssVar = (token) => `--${token.replace(/\./g, '-')}`;

/** Lecture de la variable d'un jeton, l'ancienne valeur en repli. @param {string} token @param {string} old */
export const cssVarFallback = (token, old) => `var(${cssVar(token)}, ${old})`;
