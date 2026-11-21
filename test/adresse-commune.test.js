// @ts-check
/**
 * Adresse stable des couches communes (D66, docs/attendus/etape-9-skill.md). Attendus écrits à la main avant le code :
 *   AD1 modeleResolver écrit « ds-lab:commun/<fichier> » pour chaque couche commune, et rien d'autre n'y remonte vers
 *       commun/ ; les fichiers de la marque restent nommés seuls ;
 *   AD2 pour toute marque de tokens/, dans les quatre contextes, l'arbre résolu égale celui du même resolver aux $ref
 *       relatifs d'avant (« ../commun/<fichier> ») ;
 *   AD3 une marque copiée seule hors du dépôt, sans commun/ à côté : contraste, espacements et typo sortent en 0 ;
 *   AD4 une adresse commune vers un fichier absent, ou qui sort du dossier : panne, sortie 2, message qui dit quoi faire ;
 *   AD5 une marque aux $ref relatifs d'avant, avec ses couches communes à côté, se lit encore : même sortie de contraste ;
 *   AD6 feuilleCss sur la marque copiée hors du dépôt égale jetons.css de la marque d'origine.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dossiersDeMarque, modeleResolver, resoudre, lireResolver, PREFIXE_COMMUN, COMMUN, RESOLVER } from '../src/tokens/resolver.js';
import { feuilleCss } from '../src/tokens/css.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = dossiersDeMarque();
const CONTEXTES = [
  { mode: 'light', width: 'wide' },
  { mode: 'dark', width: 'wide' },
  { mode: 'light', width: 'narrow' },
  { mode: 'dark', width: 'narrow' },
];
/** @param {string} cli @param {string[]} args @param {string} [cwd] */
const run = (cli, args, cwd = ROOT) => spawnSync(process.execPath, [join(ROOT, 'src', 'cli', `${cli}.js`), ...args], { cwd, encoding: 'utf8' });
/** @param {string} p */
const lire = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** Le resolver aux $ref relatifs d'avant l'adresse stable. @param {any} r */
const enRelatif = (r) => JSON.parse(JSON.stringify(r).replaceAll(`"${PREFIXE_COMMUN}`, '"../commun/'));

/** Copie les fichiers JSON d'une marque, seuls, dans un dossier neuf hors du dépôt. @param {string} dossier */
function copieSeule(dossier) {
  const d = join(mkdtempSync(join(tmpdir(), 'ds-lab-adresse-')), basename(dossier));
  mkdirSync(d);
  for (const f of readdirSync(dossier).filter((x) => x.endsWith('.json'))) copyFileSync(join(dossier, f), join(d, f));
  return d;
}

test('AD1 le resolver écrit cite chaque couche commune par son adresse stable', () => {
  const r = modeleResolver({ nom: 'Essai', marque: ['echelles.tokens.json', 'marque.tokens.json'], sombre: ['marque.sombre.tokens.json'] });
  const refs = JSON.stringify(r).match(/"\$ref":"[^"#][^"]*"/g) ?? [];
  const communes = refs.filter((x) => x.includes(PREFIXE_COMMUN));
  assert.equal(communes.length, 7, refs.join('\n'));
  assert.deepEqual(refs.filter((x) => !x.includes(PREFIXE_COMMUN)).sort(), ['"$ref":"echelles.tokens.json"', '"$ref":"marque.sombre.tokens.json"', '"$ref":"marque.tokens.json"']);
  assert.ok(!JSON.stringify(r).includes('../'), 'aucun chemin ne remonte');
  for (const d of MARQUES) assert.ok(!readFileSync(join(d, RESOLVER), 'utf8').includes('../'), d);
});

test('AD2 pour toute marque, dans les quatre contextes, même arbre qu’avec les $ref relatifs', () => {
  assert.ok(MARQUES.length > 0);
  for (const d of MARQUES) {
    const r = lire(join(d, RESOLVER));
    for (const c of CONTEXTES) assert.deepEqual(resoudre(r, d, c).jetons, resoudre(enRelatif(r), d, c).jetons, `${basename(d)} ${JSON.stringify(c)}`);
  }
});

test('AD3 une marque copiée seule hors du dépôt passe les trois contrôles', () => {
  for (const d of MARQUES) {
    const copie = copieSeule(d);
    for (const cli of ['contraste', 'espacements', 'typo']) {
      const r = run(cli, ['--marque', copie], tmpdir());
      assert.equal(r.status, 0, `${cli} ${basename(d)} : ${r.stderr}${r.stdout.split('\n').filter((l) => l.includes('✗')).join('\n')}`);
    }
    rmSync(join(copie, '..'), { recursive: true, force: true });
  }
});

test('AD4 adresse commune absente ou hors du dossier : panne qui dit quoi faire', () => {
  const r = modeleResolver({ nom: 'Essai', marque: [] });
  const avec = (/** @type {string} */ ref) => ({ ...r, sets: { ...r.sets, roles: { sources: [{ $ref: ref }] } } });
  assert.throws(() => resoudre(avec(`${PREFIXE_COMMUN}absent.tokens.json`), tmpdir()), (e) => {
    assert.equal(/** @type {Error} */ (e).message, `resolver : ${PREFIXE_COMMUN}absent.tokens.json n'existe pas dans ${COMMUN} : mettre le clone de ds-lab à jour, ou relancer la saisie`);
    return true;
  });
  for (const ref of [`${PREFIXE_COMMUN}../package.json`, `${PREFIXE_COMMUN}`, `${PREFIXE_COMMUN}/etc/hosts`])
    assert.throws(() => resoudre(avec(ref), tmpdir()), /sort de tokens\/commun\/ : écrire ds-lab:commun\/<fichier>, un fichier de tokens\/commun\/ du clone/, ref);
  const copie = copieSeule(MARQUES[0]);
  writeFileSync(join(copie, RESOLVER), JSON.stringify(avec(`${PREFIXE_COMMUN}absent.tokens.json`)));
  const c = run('contraste', ['--marque', copie], tmpdir());
  assert.equal(c.status, 2, c.stdout);
  assert.match(c.stderr, /^contraste : resolver : ds-lab:commun\/absent\.tokens\.json n'existe pas dans .* : mettre le clone de ds-lab à jour, ou relancer la saisie\n$/);
  rmSync(join(copie, '..'), { recursive: true, force: true });
});

test('AD5 une marque aux $ref relatifs d’avant se lit encore', () => {
  for (const d of MARQUES) {
    const racine = mkdtempSync(join(tmpdir(), 'ds-lab-relatif-'));
    cpSync(COMMUN, join(racine, 'commun'), { recursive: true });
    const copie = join(racine, basename(d));
    cpSync(d, copie, { recursive: true });
    writeFileSync(join(copie, RESOLVER), JSON.stringify(enRelatif(lire(join(d, RESOLVER))), null, 2));
    assert.deepEqual(lireResolver(join(copie, RESOLVER)).jetons, lireResolver(join(d, RESOLVER)).jetons, basename(d));
    const avant = run('contraste', ['--marque', d]);
    const apres = run('contraste', ['--marque', copie]);
    assert.equal(apres.status, avant.status, basename(d));
    assert.equal(apres.stdout, avant.stdout, basename(d));
    rmSync(racine, { recursive: true, force: true });
  }
});

test('AD6 la feuille CSS d’une marque copiée hors du dépôt égale celle d’origine', async () => {
  for (const d of MARQUES) {
    const copie = copieSeule(d);
    const { texte, motifs } = await feuilleCss(copie);
    assert.deepEqual(motifs, [], basename(d));
    assert.equal(texte, readFileSync(join(d, 'jetons.css'), 'utf8'), basename(d));
    rmSync(join(copie, '..'), { recursive: true, force: true });
  }
});
