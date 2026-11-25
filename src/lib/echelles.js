// @ts-check
/**
 * Le nom d'une échelle à l'écran, en anglais comme les jetons (NM1). Les échelles communes se nomment par leur teinte,
 * pas par l'état qu'elles servent aussi : une couleur du site rangée sur le rouge n'en devient pas une erreur. Les
 * échelles de la marque gardent leur nom. Le jeton, lui, garde le sien (`color.error`) jusqu'au renommage des échelles.
 */

/** Échelle de la valise → nom affiché. */
const PAR_TEINTE = /** @type {Record<string, string>} */ ({ neutre: 'neutral', neutral: 'neutral', blanc: 'white', error: 'red', success: 'green', warning: 'amber', info: 'blue' });

/** Nom d'un pas ou d'une échelle à l'écran : « red-9 », « neutral », « primary-on-solid ». @param {string} name */
export const nomAffiche = (name) => {
  const m = /** @type {RegExpExecArray} */ (/^(.+?)(-\d+|-sur-plein)?$/.exec(name));
  return `${PAR_TEINTE[m[1]] ?? m[1]}${m[2] === '-sur-plein' ? '-on-solid' : m[2] ?? ''}`;
};
