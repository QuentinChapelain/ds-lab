// @ts-check
/**
 * Code de l'atelier, pour les gardes : la liste de ses fichiers, et le découpage d'un composant .vue.
 * Un .vue mêle du JavaScript (bloc script), du gabarit et du CSS : le lexeur de JavaScript se perdrait dans le texte
 * d'un gabarit (une apostrophe y ouvrirait une chaîne). Le script est donc rendu seul, à sa place, et le reste à part,
 * sans ses commentaires HTML et CSS, qui sont rendus à part ; les lignes gardent leur numéro.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** Dossiers de code de l'atelier, hors de node_modules/ et de la version construite. */
const DOSSIERS = ['.storybook', 'stories', 'composants', 'preuve', 'fiches'];

/** Fichiers de code de l'atelier, relatifs à la racine : les .js de sa racine, et les .js et .vue de ses dossiers de code. */
export function codeAtelier() {
  return [
    ...readdirSync(join(ROOT, 'atelier')).filter((f) => f.endsWith('.js')).map((f) => join('atelier', f)),
    ...DOSSIERS.flatMap((d) =>
      readdirSync(join(ROOT, 'atelier', d), { recursive: true, encoding: 'utf8' })
        .filter((f) => f.endsWith('.js') || f.endsWith('.vue'))
        .map((f) => join('atelier', d, f)),
    ),
  ].sort();
}

/** Texte remplacé par ses seuls sauts de ligne. @param {string} t */
const blanc = (t) => t.replace(/[^\n]/g, '');

/**
 * Parties d'un composant .vue, chacune de la longueur en lignes du fichier : script (le JavaScript des blocs script, le
 * reste blanchi), reste (gabarit et style, blocs script et commentaires blanchis) et les commentaires HTML et CSS.
 * @param {string} src
 * @returns {{ script: string, reste: string, commentaires: { line: number, text: string }[] }}
 */
export function partiesVue(src) {
  const BLOC = /(<script\b[^>]*>)([^]*?)(<\/script>)/g;
  let script = '';
  let reste = '';
  let i = 0;
  for (const m of src.matchAll(BLOC)) {
    const debut = /** @type {number} */ (m.index);
    const avant = src.slice(i, debut) + m[1];
    script += blanc(avant) + m[2];
    reste += avant + blanc(m[2]);
    script += blanc(m[3]);
    reste += m[3];
    i = debut + m[0].length;
  }
  script += blanc(src.slice(i));
  reste += src.slice(i);
  /** @type {{ line: number, text: string }[]} */
  const commentaires = [];
  reste = reste.replace(/<!--[^]*?-->|\/\*[^]*?\*\//g, (c, pos) => {
    commentaires.push({ line: reste.slice(0, pos).split('\n').length, text: c });
    return blanc(c);
  });
  return { script, reste, commentaires };
}
