// @ts-check
/**
 * npm run css sur des marques d'essai, écrites dans un dossier temporaire : le resolver de la première marque de tokens/,
 * ses $ref récrits vers les fichiers d'origine, et ce que le cas demande (docs/attendus/etape-5e-css.md ; décisions de
 * Quentin du 17/11/2026).
 *
 * Attendus écrits à la main avant le code (17/11/2026) :
 *   K1 seuil : un seuil de 480 px dans $extensions["ds-lab.largeur"] donne le bloc @media (width < 480px), et aucun
 *      bloc en 600 px ;
 *   K2 sombre et étroit changent un même jeton (une couche sombre de plus qui donne ecart.section, que l'étroit
 *      commun change aussi) : feuilleCss rend le motif « sombre et étroit changent les mêmes jetons : ecart.section ; la
 *      feuille n'a pas de bloc pour les deux à la fois » et aucun texte ; la commande sort en 1, affiche
 *      « ✗ <motif> » et n'écrit rien ;
 *   K3 --marque <dossier> : seule cette marque, sortie 0, jetons.css écrit dans le dossier, égal au texte de feuilleCss ;
 *      la console dit « ✓ jetons.css écrite » ; relancée, « ✓ jetons.css inchangée » ;
 *   K4 pannes (D18), sortie 2, une ligne sur la sortie d'erreur, rien sur la sortie standard : option inconnue
 *      (« css : option inconnue --x ») ; dossier sans resolver (« css : <dossier>/marque.resolver.json : fichier absent »).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { feuilleCss } from '../src/tokens/css.js';
import { dossiersDeMarque, RESOLVER } from '../src/tokens/resolver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
/** @param {string[]} args */
const lancer = (args) => spawnSync(process.execPath, ['src/cli/css.js', ...args], { cwd: ROOT, encoding: 'utf8' });

/**
 * Marque d'essai : resolver de la première marque, $ref vers les fichiers d'origine.
 * @param {{ seuil?: number, sombreEnPlus?: any }} [opts] @returns {string} dossier, terminé par « / »
 */
function marqueEssai({ seuil, sombreEnPlus } = {}) {
  const base = dossiersDeMarque()[0];
  const r = JSON.parse(readFileSync(join(base, RESOLVER), 'utf8'));
  const dir = mkdtempSync(join(tmpdir(), 'ds-lab-css-'));
  /** @param {any[]} l */
  const reloc = (l) => l.map((s) => (typeof s?.$ref === 'string' && !s.$ref.startsWith('#') ? { $ref: relative(dir, join(base, s.$ref)) } : s));
  for (const s of Object.values(r.sets)) /** @type {any} */ (s).sources = reloc(/** @type {any} */ (s).sources);
  for (const m of Object.values(r.modifiers)) for (const c of Object.keys(/** @type {any} */ (m).contexts)) /** @type {any} */ (m).contexts[c] = reloc(/** @type {any} */ (m).contexts[c]);
  if (sombreEnPlus) {
    writeFileSync(join(dir, 'en-plus.sombre.tokens.json'), JSON.stringify(sombreEnPlus, null, 2));
    r.modifiers.mode.contexts.sombre.push({ $ref: 'en-plus.sombre.tokens.json' });
  }
  if (seuil) r.modifiers.largeur.$extensions['ds-lab.largeur'].etroit.sous.value = seuil;
  writeFileSync(join(dir, RESOLVER), JSON.stringify(r, null, 2));
  return `${dir}/`;
}

const MOTIF_K2 = "sombre et étroit changent les mêmes jetons : ecart.section ; la feuille n'a pas de bloc pour les deux à la fois";
const EN_PLUS = { ecart: { section: { $value: '{espace.64}', $description: 'Essai : la couche sombre change un écart.' } } };

test('K1 seuil lu dans le resolver : 480 px', async () => {
  const dir = marqueEssai({ seuil: 480 });
  try {
    const r = await feuilleCss(dir);
    assert.deepEqual(r.motifs, []);
    assert.ok(r.texte?.includes('@media (width < 480px) {'), 'bloc 480 px');
    assert.ok(!r.texte?.includes('600px'), 'aucun 600 px');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('K2 sombre et étroit changent un même jeton : motif, sortie 1, rien d\'écrit', async () => {
  const dir = marqueEssai({ sombreEnPlus: EN_PLUS });
  try {
    const r = await feuilleCss(dir);
    assert.deepEqual(r.motifs, [MOTIF_K2]);
    assert.equal(r.texte, null);
    const p = lancer(['--marque', dir]);
    assert.equal(p.status, 1, p.stderr);
    assert.equal(p.stdout, `✗ ${MOTIF_K2}\n`);
    assert.equal(p.stderr, '');
    assert.ok(!existsSync(join(dir, 'jetons.css')), 'rien d\'écrit');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('K3 --marque : cette marque seule, écrite puis inchangée', async () => {
  const dir = marqueEssai();
  try {
    const p = lancer(['--marque', dir]);
    assert.equal(p.status, 0, p.stderr);
    assert.equal(p.stdout, '✓ jetons.css écrite\n');
    assert.equal(readFileSync(join(dir, 'jetons.css'), 'utf8'), (await feuilleCss(dir)).texte);
    const q = lancer(['--marque', dir]);
    assert.equal(q.status, 0, q.stderr);
    assert.equal(q.stdout, '✓ jetons.css inchangée\n');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('K4 pannes : option inconnue, dossier sans resolver', () => {
  const p = lancer(['--x']);
  assert.equal(p.status, 2);
  assert.equal(p.stderr, 'css : option inconnue --x\n');
  assert.equal(p.stdout, '');
  const vide = mkdtempSync(join(tmpdir(), 'ds-lab-css-vide-'));
  try {
    const q = lancer(['--marque', vide]);
    assert.equal(q.status, 2);
    assert.equal(q.stderr, `css : ${join(vide, RESOLVER)} : fichier absent\n`);
    assert.equal(q.stdout, '');
  } finally {
    rmSync(vide, { recursive: true, force: true });
  }
});
