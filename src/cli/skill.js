#!/usr/bin/env node
// @ts-check
/**
 * D66 : écrit les textes du skill ds-lab dans skill/ds-lab/, depuis docs/regles.md et docs/techniques/
 * (src/report/skill.js) : regles.md, consignes.md, techniques/<framework>.md, et le bloc du compte de SKILL.md.
 * Usage : npm run skill. Sortie 0, ou 2 sur une panne (D18). test/skill.test.js (SK1) refuse un texte qui ne
 * correspond plus à sa source.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { lancer } from './garde.js';
import { sourcesDuSkill, fichiersDuSkill, SKILL } from '../report/skill.js';

await lancer('skill', () => {
  for (const [chemin, texte] of Object.entries(fichiersDuSkill(sourcesDuSkill()))) {
    mkdirSync(dirname(join(SKILL, chemin)), { recursive: true });
    writeFileSync(join(SKILL, chemin), texte);
    console.log(`écrit skill/ds-lab/${chemin}`);
  }
});
