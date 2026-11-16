// @ts-check
/**
 * Lexeur minimal de JavaScript : sépare les commentaires du code, sans rien exécuter ni installer.
 * Il suit les chaînes ('…', "…"), les gabarits (`…`, avec ${…} imbriqués), les expressions régulières
 * (après un opérateur, une ouverture ou un mot-clé) et les commentaires (// et bloc).
 * Un commentaire écrit à l'intérieur d'une chaîne ou d'un gabarit (script ou CSS d'une page produite)
 * est du code : il sort tel quel dans la page.
 *
 * Le code rendu garde le même nombre de lignes : un commentaire de bloc est remplacé par ses sauts de
 * ligne, ou par une espace s'il tient sur une ligne ; un commentaire // est retiré jusqu'au saut de ligne.
 * Sert au test de garde (test/histoire.test.js) et à vérifier qu'un nettoyage de commentaires ne
 * touche pas au code.
 */

/**
 * @typedef {{ line: number, kind: 'line' | 'block', text: string }} Commentaire
 */

const AVANT_REGEX = /[(,=:[!&|?{};+\-*%<>~^]$/;
const MOTS_AVANT_REGEX = /\b(return|typeof|case|in|of|new|delete|void|throw|yield|await)$/;

/**
 * @param {string} src
 * @returns {{ comments: Commentaire[], code: string }}
 */
export function lex(src) {
  /** @type {Commentaire[]} */
  const comments = [];
  /** @type {string[]} */
  const code = [];
  /** Accolades ouvertes dans chaque ${…} en cours. @type {number[]} */
  const gabarits = [];
  let i = 0;
  let line = 1;
  let dernier = '';
  const regexPossible = () => !dernier || AVANT_REGEX.test(dernier) || MOTS_AVANT_REGEX.test(dernier);
  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '\n') {
      line++;
      code.push(c);
      i++;
      continue;
    }
    if (c === '/' && d === '/') {
      const j = src.indexOf('\n', i);
      const fin = j < 0 ? src.length : j;
      comments.push({ line, kind: 'line', text: src.slice(i, fin) });
      i = fin;
      continue;
    }
    if (c === '/' && d === '*') {
      const fin = src.indexOf('*/', i + 2) + 2;
      const text = src.slice(i, fin);
      comments.push({ line, kind: 'block', text });
      const sauts = (text.match(/\n/g) || []).length;
      line += sauts;
      code.push(sauts ? '\n'.repeat(sauts) : ' ');
      i = fin;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (src[j] !== c) {
        if (src[j] === '\\') j++;
        j++;
      }
      code.push(src.slice(i, j + 1));
      dernier = 'x';
      i = j + 1;
      continue;
    }
    if (c === '`' || (c === '}' && gabarits.length && gabarits[gabarits.length - 1] === 0)) {
      if (c === '}') gabarits.pop();
      let j = i + 1;
      let ouvre = false;
      for (;;) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === '`') {
          j++;
          break;
        }
        if (src[j] === '$' && src[j + 1] === '{') {
          j += 2;
          gabarits.push(0);
          ouvre = true;
          break;
        }
        if (src[j] === '\n') line++;
        j++;
      }
      code.push(src.slice(i, j));
      dernier = ouvre ? '{' : 'x';
      i = j;
      continue;
    }
    if (c === '{' && gabarits.length) gabarits[gabarits.length - 1]++;
    if (c === '}' && gabarits.length) gabarits[gabarits.length - 1]--;
    if (c === '/' && regexPossible()) {
      let j = i + 1;
      let classe = false;
      for (;;) {
        const x = src[j];
        if (x === '\\') {
          j += 2;
          continue;
        }
        if (x === '[') classe = true;
        else if (x === ']') classe = false;
        else if (x === '/' && !classe) break;
        j++;
      }
      j++;
      while (/[a-z]/i.test(src[j] || '')) j++;
      code.push(src.slice(i, j));
      dernier = 'x';
      i = j;
      continue;
    }
    code.push(c);
    if (!/\s/.test(c)) dernier = /[\w$]/.test(c) ? (/[\w$]$/.test(dernier) ? dernier + c : c) : c;
    i++;
  }
  return { comments, code: code.join('') };
}

/**
 * Titres de test (test, describe, it, avec ou sans .skip/.todo) d'un code déjà privé de ses commentaires.
 * @param {string} code
 * @returns {{ line: number, text: string }[]}
 */
export function titres(code) {
  /** @type {{ line: number, text: string }[]} */
  const out = [];
  for (const m of code.matchAll(/\b(?:test|describe|it)(?:\.\w+)?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    out.push({ line: code.slice(0, m.index).split('\n').length, text: m[2] });
  }
  return out;
}
