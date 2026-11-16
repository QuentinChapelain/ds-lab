// @ts-check
/**
 * Revue de code, lot 6, point 3 (docs/attendus/revue-lot-6-structure.md, D31, D32) : une seule fusion de contexte de
 * marque dans la saisie, celle du resolver ; écrire à côté, contrôler, puis remplacer ; aucune échelle commune redéfinie
 * par une marque. Sans navigateur.
 *
 * Attendus écrits à la main :
 *   W1 une marque dont primitives.tokens.json porte une échelle du nom d'une échelle commune (neutre) est refusée par la
 *      saisie pour ce seul motif, qui nomme l'échelle : sortie 1, rien d'écrit. Avant le lot : 18 paires refusées en
 *      sombre, par la fusion à la main (essai C de la confrontation) ;
 *   W2 npm run contraste --marque sur un dossier dont primitives.tokens.json redéfinit neutre : sortie 1, ligne qui nomme
 *      l'échelle ; même définition que la saisie (echellesCommunesRedefinies) ;
 *   W3 panne pendant l'écriture (marque.resolver.json remplacé par un dossier) : sortie 2, aucun fichier du dossier changé,
 *      aucun fichier temporaire laissé ;
 *   W4 échelle générée devenue échelle nommée : sur une panne (echelles.sombre.tokens.json remplacé par un dossier),
 *      echelles.tokens.json reste en place ; sans panne, il est supprimé, au remplacement final ;
 *   W5 remplacer() : un renommage qui tombe au 3e fichier, ou un contrôle qui lève, laisse le dossier tel quel (fichiers
 *      d'origine, fichier à supprimer gardé, fichier nouveau absent, aucun temporaire) ; sans panne, le contrôle lit les
 *      textes relus sur le disque et sa valeur est rendue ;
 *   W6 plus de sous-processus dans la saisie : src/cli/saisie.js n'importe pas node:child_process.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saisir, serialiser } from '../src/tokens/saisie.js';
import { remplacer } from '../src/tokens/ecriture.js';
import { COMMUN } from '../src/tokens/resolver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const POLICES = { titre: ['Georgia', 'serif'] };
const tmp = () => mkdtempSync(join(tmpdir(), 'ds-lab-ecriture-'));
/** @param {string} cli @param {string[]} args */
const run = (cli, ...args) => spawnSync(process.execPath, [join(ROOT, 'src', 'cli', `${cli}.js`), ...args], { cwd: ROOT, encoding: 'utf8' });
/** Contenu de chaque fichier d'un dossier (un dossier vaut « <dossier> »). @param {string} d */
const instantane = (d) => Object.fromEntries(readdirSync(d).sort().map((f) => [f, statSync(join(d, f)).isDirectory() ? '<dossier>' : readFileSync(join(d, f), 'utf8')]));
/** @param {string} d @param {any} entree */
const ecrireEntree = (d, entree) => writeFileSync(join(d, 'entree.json'), JSON.stringify(entree));
/** Remplace un fichier par un dossier non vide : toute écriture à sa place tombe. @param {string} d @param {string} f */
const enDossier = (d, f) => {
  rmSync(join(d, f));
  mkdirSync(join(d, f));
  writeFileSync(join(d, f, 'garde'), '');
};
/** Échelles écrites à la main : bleu d'Orbe Café et neutre commun (valeur claire). */
const avecNeutre = () => {
  const d = tmp();
  const orbe = JSON.parse(readFileSync(join(ROOT, 'tokens', 'orbe-cafe', 'primitives.tokens.json'), 'utf8'));
  const commun = JSON.parse(readFileSync(join(COMMUN, 'primitives.tokens.json'), 'utf8'));
  writeFileSync(join(d, 'primitives.tokens.json'), serialiser({ couleur: { $type: 'color', bleu: orbe.couleur.bleu, neutre: commun.couleur.neutre } }));
  return d;
};
const REDEFINIE = /primitives\.tokens\.json : échelle commune redéfinie, neutre/;

test('W1 saisie : échelle commune redéfinie par la marque, refus nommé, rien d\'écrit', () => {
  const d = avecNeutre();
  const r = saisir({ nom: 'Essai', primaire: { echelle: 'bleu' }, polices: POLICES }, { dossier: d });
  assert.equal(r.motifs.length, 1, r.motifs.join('\n'));
  assert.match(r.motifs[0], REDEFINIE);
  ecrireEntree(d, { nom: 'Essai', primaire: { echelle: 'bleu' }, polices: POLICES });
  const p = run('saisie', join(d, 'entree.json'));
  assert.equal(p.status, 1, p.stderr);
  assert.match(p.stderr, /marque refusée : Essai/);
  assert.match(p.stderr, REDEFINIE);
  assert.deepEqual(readdirSync(d).sort(), ['entree.json', 'primitives.tokens.json']);
});

test('W2 contraste --marque : échelle commune redéfinie, sortie 1, ligne qui nomme l\'échelle', () => {
  const d = tmp();
  const orbe = JSON.parse(readFileSync(join(ROOT, 'tokens', 'orbe-cafe', 'primitives.tokens.json'), 'utf8'));
  writeFileSync(join(d, 'primitives.tokens.json'), serialiser({ couleur: { $type: 'color', bleu: orbe.couleur.bleu } }));
  ecrireEntree(d, { nom: 'Essai', primaire: { echelle: 'bleu' }, polices: POLICES });
  assert.equal(run('saisie', join(d, 'entree.json')).status, 0);
  assert.equal(run('contraste', '--marque', d).status, 0);
  const commun = JSON.parse(readFileSync(join(COMMUN, 'primitives.tokens.json'), 'utf8'));
  writeFileSync(join(d, 'primitives.tokens.json'), serialiser({ couleur: { $type: 'color', bleu: orbe.couleur.bleu, neutre: commun.couleur.neutre } }));
  for (const mode of ['clair', 'sombre']) {
    const p = run('contraste', '--marque', d, '--mode', mode);
    assert.equal(p.status, 1, `${mode} : ${p.stdout}${p.stderr}`);
    assert.match(p.stdout, REDEFINIE);
  }
});

test('W3 panne pendant l\'écriture : sortie 2, dossier inchangé, aucun temporaire', () => {
  const d = tmp();
  ecrireEntree(d, { nom: 'Essai', primaire: '#2b4c7e', accent: '#c8553d', polices: POLICES });
  assert.equal(run('saisie', join(d, 'entree.json')).status, 0);
  const autre = { nom: 'Essai', primaire: '#c8553d', accent: '#2b4c7e', polices: POLICES };
  assert.deepEqual(saisir(autre, { dossier: d }).motifs, [], 'entrée acceptée : la panne vient de l\'écriture');
  ecrireEntree(d, autre);
  enDossier(d, 'marque.resolver.json');
  const avant = instantane(d);
  const p = run('saisie', join(d, 'entree.json'));
  assert.equal(p.status, 2, p.stdout + p.stderr);
  assert.match(p.stderr, /^saisie : /);
  assert.doesNotMatch(p.stderr, /marque refusée/);
  assert.deepEqual(instantane(d), avant);
});

test('W4 échelle générée devenue nommée : echelles.tokens.json supprimé au remplacement final seulement', () => {
  const d = tmp();
  const orbe = JSON.parse(readFileSync(join(ROOT, 'tokens', 'orbe-cafe', 'primitives.tokens.json'), 'utf8'));
  writeFileSync(join(d, 'primitives.tokens.json'), serialiser({ couleur: { $type: 'color', bleu: orbe.couleur.bleu } }));
  ecrireEntree(d, { nom: 'Essai', primaire: '#2b4c7e', polices: POLICES });
  assert.equal(run('saisie', join(d, 'entree.json')).status, 0);
  assert.ok(readdirSync(d).includes('echelles.tokens.json'));
  ecrireEntree(d, { nom: 'Essai', primaire: { echelle: 'bleu' }, polices: POLICES });
  const sombre = readFileSync(join(d, 'echelles.sombre.tokens.json'));
  enDossier(d, 'echelles.sombre.tokens.json');
  const avant = instantane(d);
  const p = run('saisie', join(d, 'entree.json'));
  assert.equal(p.status, 2, p.stdout + p.stderr);
  assert.deepEqual(instantane(d), avant, 'echelles.tokens.json gardé');
  rmSync(join(d, 'echelles.sombre.tokens.json'), { recursive: true });
  writeFileSync(join(d, 'echelles.sombre.tokens.json'), sombre);
  const q = run('saisie', join(d, 'entree.json'));
  assert.equal(q.status, 0, q.stderr);
  assert.ok(!readdirSync(d).includes('echelles.tokens.json'), 'supprimé au remplacement');
  assert.deepEqual(readdirSync(d).filter((f) => f.startsWith('.')), []);
});

test('W5 remplacer : renommage qui tombe, contrôle qui lève, puis sans panne', () => {
  const prepare = () => {
    const d = tmp();
    writeFileSync(join(d, 'a.json'), 'a0');
    writeFileSync(join(d, 'b.json'), 'b0');
    writeFileSync(join(d, 'd.json'), 'd0');
    return d;
  };
  const fichiers = /** @type {[string, string][]} */ ([['a.json', 'a1'], ['b.json', 'b1'], ['c.json', 'c1']]);
  const origine = { 'a.json': 'a0', 'b.json': 'b0', 'd.json': 'd0' };
  const d1 = prepare();
  let n = 0;
  /** @param {string} x @param {string} y */
  const renommer = (x, y) => {
    if (++n === 3) throw new Error('renommage refusé (essai)');
    renameSync(x, y);
  };
  assert.throws(() => remplacer(d1, fichiers, { supprimer: ['d.json'], fs: { renameSync: renommer } }), /renommage refusé \(essai\)/);
  assert.deepEqual(instantane(d1), origine);
  const d2 = prepare();
  assert.throws(
    () =>
      remplacer(d2, fichiers, {
        supprimer: ['d.json'],
        controler: () => {
          throw new Error('contrôle en échec (essai)');
        },
      }),
    /contrôle en échec \(essai\)/,
  );
  assert.deepEqual(instantane(d2), origine);
  const d3 = prepare();
  /** @type {Map<string, string> | null} */
  let lus = null;
  const v = remplacer(d3, fichiers, {
    supprimer: ['d.json'],
    controler: (/** @type {Map<string, string>} */ m) => {
      lus = m;
      return 'contrôlé';
    },
  });
  assert.equal(v, 'contrôlé');
  assert.deepEqual(Object.fromEntries(/** @type {any} */ (lus)), { 'a.json': 'a1', 'b.json': 'b1', 'c.json': 'c1' });
  assert.deepEqual(instantane(d3), { 'a.json': 'a1', 'b.json': 'b1', 'c.json': 'c1' });
});

test('W6 la saisie ne lance plus de sous-processus', () => {
  assert.doesNotMatch(readFileSync(join(ROOT, 'src', 'cli', 'saisie.js'), 'utf8'), /child_process/);
});
