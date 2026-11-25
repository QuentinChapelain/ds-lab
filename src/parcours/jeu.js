// @ts-check
/**
 * Le dossier de jeu (D75) : un dossier permanent, branché sur le clone, où l'on joue le parcours. Le skill y est un lien
 * vers skill/ds-lab/ du clone et DS_LAB pointe sur le clone : on joue toujours la dernière version, sans copie à refaire.
 * Poser le dossier, c'est aussi repartir de zéro : tout ce qu'il contient est effacé, sauf les permissions déjà accordées
 * dans les réglages de Claude Code. Un dossier non vide qui n'a pas la marque d'un dossier de jeu n'est jamais touché.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** La marque d'un dossier de jeu : sans elle, un dossier non vide n'est pas effacé. */
export const MARQUE_JEU = '.dossier-de-jeu';

/** Les dossiers du système, derrière le Node du clone. */
const SYSTEME = ['/usr/bin', '/bin', '/usr/sbin', '/sbin'];

/**
 * Pose le dossier de jeu, ou le remet à son départ.
 * @param {string} dossier
 * @param {{ depot: string, node?: string }} o  depot : le clone ; node : le dossier du Node à mettre devant (défaut : celui qui lance)
 * @returns {{ dossier: string, remis: boolean }}  remis : le dossier existait déjà
 */
export function poserJeu(dossier, { depot, node = dirname(process.execPath) }) {
  const d = resolve(dossier);
  const clone = resolve(depot);
  if (d === clone || d.startsWith(`${clone}/`)) throw new Error(`le dossier de jeu ne peut pas être dans le clone (${clone})`);
  const contenu = existsSync(d) ? readdirSync(d) : [];
  if (contenu.length && !contenu.includes(MARQUE_JEU)) throw new Error(`${d} n'est pas vide et n'est pas un dossier de jeu : rien n'est effacé ; choisir un dossier vide ou absent`);
  const fReglages = join(d, '.claude', 'settings.local.json');
  /** @type {any} */
  const anciens = existsSync(fReglages) ? JSON.parse(readFileSync(fReglages, 'utf8')) : {};
  for (const f of contenu) rmSync(join(d, f), { recursive: true, force: true });

  const base = join(clone, 'fixtures', 'jeu');
  const demo = join(clone, 'fixtures', 'marque-demo');
  mkdirSync(join(d, '.claude', 'skills'), { recursive: true });
  for (const f of ['CLAUDE.md', 'site.mjs']) copyFileSync(join(base, f), join(d, f));
  copyFileSync(join(demo, 'cible-valise.json'), join(d, 'cible.json'));
  copyFileSync(join(demo, 'sources.json'), join(d, 'sources.json'));
  symlinkSync(join(clone, 'skill', 'ds-lab'), join(d, '.claude', 'skills', 'ds-lab'));
  // Le Node du clone devant : sous une autre version majeure, chaque commande sortirait en 2 (D40).
  const reglages = {
    ...anciens,
    env: { ...(anciens.env ?? {}), DS_LAB: clone, PATH: [node, ...SYSTEME].join(':') },
    permissions: { ...(anciens.permissions ?? {}), additionalDirectories: [clone] },
  };
  writeFileSync(fReglages, `${JSON.stringify(reglages, null, 2)}\n`);
  writeFileSync(join(d, MARQUE_JEU), 'Dossier de jeu de ds-lab : npm run jeu -- <ce dossier> le remet à son départ, en effaçant tout ce qu’il contient.\n');
  return { dossier: d, remis: contenu.length > 0 };
}
