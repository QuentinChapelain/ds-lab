// @ts-check
/** D67, D68 : outils du banc d'essai. Lancer une commande qui doit réussir, copier un dossier tel que git le voit. */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Une commande qui doit réussir ; sinon une panne qui la nomme, avec la fin de sa sortie d'erreur.
 * @param {string} cmd @param {string[]} args @param {{ cwd: string, env?: Record<string, string>, input?: Buffer }} o
 */
export function executer(cmd, args, o) {
  const r = spawnSync(cmd, args, { cwd: o.cwd, env: { ...process.env, ...o.env }, input: o.input, encoding: 'buffer', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} : sortie ${r.status ?? r.signal} dans ${o.cwd} ; ${String(r.stderr ?? '').trim().split('\n').at(-1) ?? ''}`);
  return String(r.stdout);
}

/**
 * Copie les fichiers d'un dossier tels que git les voit dans l'arbre de travail (suivis, ou nouveaux et non ignorés),
 * sauf ceux que le filtre refuse ; ni .git, ni node_modules, ni ce que .gitignore écarte.
 * @param {string} source @param {string} cible @param {(f: string) => boolean} garder
 */
export function copierArbre(source, cible, garder) {
  const fichiers = executer('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '.'], { cwd: source }).split('\0');
  for (const f of fichiers.filter((x) => x && garder(x) && existsSync(join(source, x)))) {
    mkdirSync(dirname(join(cible, f)), { recursive: true });
    cpSync(join(source, f), join(cible, f));
  }
}
