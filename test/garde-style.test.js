// @ts-check
/**
 * Garde du style des composants et des modules (CP3, D65) : la configuration de `npm run style` (stylelint.config.mjs).
 * Attendu écrit à la main avant le code (docs/attendus/etape-9-regles.md) :
 *   O1 chaque déclaration du fichier piège est refusée, avec un message qui dit quoi faire : couleur en hexadécimal, par
 *      son nom, en rgba ou en hsl ; espace, taille de texte, graisse en mot ou en nombre, interligne, espacement des
 *      lettres, rayon, ombre, durée écrits en dur ; propriété personnalisée en dur ; variable d'un autre préfixe que
 *      --v-ds- ou --v-theme- ; une suppression sans raison, une suppression qui ne nomme pas sa règle ;
 *   O2 passent : une variable de la table, une couleur du thème, un calcul de variables, 0, 100 %, les mots-clés, et une
 *      suppression qui nomme sa règle et dit sa raison.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONFIG = join(ROOT, 'stylelint.config.mjs');

/** Avertissements de la garde pour un bloc de style d'un .vue. @param {string} style */
async function avertissements(style) {
  const { results } = await stylelint.lint({ code: `<template><p></p></template>\n<style scoped>\n${style}\n</style>\n`, codeFilename: join(ROOT, 'piege.vue'), configFile: CONFIG });
  const r = results[0];
  return [...r.warnings, ...(r.invalidOptionWarnings ?? []).map((w) => ({ text: w.text }))].map((w) => w.text);
}

const REFUSEES = [
  '.x { color: #333; }',
  '.x { color: red; }',
  '.x { background: rgba(0, 0, 0, .5); }',
  '.x { border-color: hsl(0 0% 50%); }',
  '.x { padding: 8px; }',
  '.x { margin: .5rem; }',
  '.x { gap: 4px; }',
  '.x { font-size: 14px; }',
  '.x { font-weight: bold; }',
  '.x { font-weight: 600; }',
  '.x { line-height: 1.5; }',
  '.x { letter-spacing: .5px; }',
  '.x { border-radius: 4px; }',
  '.x { box-shadow: 0 1px 2px #000; }',
  '.x { transition: color 200ms; }',
  '.x { animation-duration: 1s; }',
  '.x { --x: 3px; }',
  '.x { gap: var(--space-8); }',
  '/* stylelint-disable-next-line declaration-property-value-allowed-list */\n.x { padding: 8px; }',
  '/* stylelint-disable-next-line -- raison donnée, règle absente */\n.x { padding: 8px; }',
];

const ADMISES = [
  '.x { gap: var(--v-ds-gap-between-components); }',
  '.x { color: rgb(var(--v-theme-on-surface)); }',
  '.x { min-height: calc(var(--v-ds-x) * 2); }',
  '.x { margin: 0; }',
  '.x { width: 100%; }',
  '.x { transition: none; }',
  '.x { font-family: inherit; }',
  '.x {\n  /* stylelint-disable-next-line declaration-property-value-allowed-list -- texte caché aux yeux, motif standard */\n  width: 1px;\n}',
];

test('O1 la garde refuse chaque valeur en dur du fichier piège, et toute suppression sans règle ou sans raison', async () => {
  for (const style of REFUSEES) assert.notDeepEqual(await avertissements(style), [], style);
  const [texte] = await avertissements('.x { padding: 8px; }');
  assert.match(texte, /^Valeur brute « 8px » pour padding : prendre var\(--v-ds-…\) ou rgb\(var\(--v-theme-…\)\) ; sinon une exception avec sa raison/);
});

test('O2 passent les variables de la table et du thème, 0, 100 %, les mots-clés, une suppression avec sa règle et sa raison', async () => {
  for (const style of ADMISES) assert.deepEqual(await avertissements(style), [], style);
});
