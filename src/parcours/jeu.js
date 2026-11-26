// @ts-check
/**
 * Le dossier de jeu (D75) et le dossier de projet (D102) : un dossier permanent, branché sur le clone, où l'on joue le
 * parcours. Le skill y est un lien vers skill/ds-lab/ du clone et DS_LAB pointe sur le clone : on joue toujours la
 * dernière version, sans copie à refaire. Poser le dossier, c'est aussi repartir de zéro : tout ce qu'il contient est
 * effacé, sauf les permissions déjà accordées dans les réglages de Claude Code. Ses réglages posent aussi un crochet qui
 * refuse une commande décrite en anglais (D87). Un dossier non vide qui n'a pas la marque de sa sorte n'est jamais
 * touché. Le dossier de jeu porte le site fictif ; le dossier de projet, neutre, attend l'adresse d'un site.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** La marque d'un dossier de jeu : sans elle, un dossier non vide n'est pas effacé. */
export const MARQUE_JEU = '.dossier-de-jeu';
/** La marque d'un dossier de projet, la même garde. */
export const MARQUE_PROJET = '.dossier-de-projet';

/** Les dossiers du système, derrière le Node du clone. */
const SYSTEME = ['/usr/bin', '/bin', '/usr/sbin', '/sbin'];

/**
 * Pose le dossier de jeu, ou le remet à son départ.
 * @param {string} dossier
 * @param {{ depot: string, node?: string }} o  depot : le clone ; node : le dossier du Node à mettre devant (défaut : celui qui lance)
 * @returns {{ dossier: string, remis: boolean }}  remis : le dossier existait déjà
 */
export function poserJeu(dossier, o) {
  return poser(dossier, o, {
    sorte: 'dossier de jeu',
    marque: MARQUE_JEU,
    texte: 'Dossier de jeu de ds-lab : npm run jeu -- <ce dossier> le remet à son départ, en effaçant tout ce qu’il contient.\n',
    fichiers: (clone) => {
      const base = join(clone, 'fixtures', 'jeu');
      const demo = join(clone, 'fixtures', 'marque-demo');
      return [
        [join(base, 'CLAUDE.md'), 'CLAUDE.md'],
        [join(base, 'site.mjs'), 'site.mjs'],
        [join(demo, 'cible-valise.json'), 'cible.json'],
        [join(demo, 'sources.json'), 'sources.json'],
      ];
    },
  });
}

/**
 * Pose le dossier de projet, neutre, ou le remet à son départ (D102) : le guide du dossier et la cible générique, sans
 * site ni sources. L'adresse du site se donne dans le chat.
 * @param {string} dossier
 * @param {{ depot: string, node?: string }} o
 * @returns {{ dossier: string, remis: boolean }}
 */
export function poserProjet(dossier, o) {
  return poser(dossier, o, {
    sorte: 'dossier de projet',
    marque: MARQUE_PROJET,
    texte: 'Dossier de projet de ds-lab : npm run projet -- <ce dossier> le remet à son départ, en effaçant tout ce qu’il contient.\n',
    fichiers: (clone) => {
      const base = join(clone, 'fixtures', 'projet');
      return [
        [join(base, 'CLAUDE.md'), 'CLAUDE.md'],
        [join(base, 'cible.json'), 'cible.json'],
      ];
    },
  });
}

/**
 * @param {string} dossier
 * @param {{ depot: string, node?: string }} o
 * @param {{ sorte: string, marque: string, texte: string, fichiers: (clone: string) => [string, string][] }} s
 * @returns {{ dossier: string, remis: boolean }}
 */
function poser(dossier, { depot, node = dirname(process.execPath) }, { sorte, marque, texte, fichiers }) {
  const d = resolve(dossier);
  const clone = resolve(depot);
  if (d === clone || d.startsWith(`${clone}/`)) throw new Error(`le ${sorte} ne peut pas être dans le clone (${clone})`);
  const contenu = existsSync(d) ? readdirSync(d) : [];
  if (contenu.length && !contenu.includes(marque)) throw new Error(`${d} n'est pas vide et n'est pas un ${sorte} : rien n'est effacé ; choisir un dossier vide ou absent`);
  const fReglages = join(d, '.claude', 'settings.local.json');
  /** @type {any} */
  const anciens = existsSync(fReglages) ? JSON.parse(readFileSync(fReglages, 'utf8')) : {};
  for (const f of contenu) rmSync(join(d, f), { recursive: true, force: true });

  mkdirSync(join(d, '.claude', 'skills'), { recursive: true });
  for (const [de, vers] of fichiers(clone)) copyFileSync(de, join(d, vers));
  symlinkSync(join(clone, 'skill', 'ds-lab'), join(d, '.claude', 'skills', 'ds-lab'));
  // Le Node du clone devant : sous une autre version majeure, chaque commande sortirait en 2 (D40).
  const reglages = {
    ...anciens,
    env: { ...(anciens.env ?? {}), DS_LAB: clone, PATH: [node, ...SYSTEME].join(':') },
    permissions: { ...(anciens.permissions ?? {}), additionalDirectories: [clone] },
    // La description de chaque commande, en français (D87) : un crochet refuse celle qui commence en anglais.
    hooks: {
      ...(anciens.hooks ?? {}),
      PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: `"${join(node, 'node')}" "${join(clone, 'src', 'cli', 'description.js')}"` }] }],
    },
  };
  writeFileSync(fReglages, `${JSON.stringify(reglages, null, 2)}\n`);
  writeFileSync(join(d, marque), texte);
  return { dossier: d, remis: contenu.length > 0 };
}
