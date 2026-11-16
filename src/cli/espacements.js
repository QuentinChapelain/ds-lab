#!/usr/bin/env node
// @ts-check
/**
 * Contrôle des espacements par relation d'une marque.
 * Sort en 1 si les quatre ecart ne sont pas strictement croissants, ou si une valeur en étroit
 * (contexte étroit du resolver de la marque) n'est pas strictement supérieure à l'ecart précédent et au plus égale à sa valeur large ;
 * ou si une règle de proximité (REGLES : entre-composants ≥ 2 × dans-composant) n'est pas tenue ; sinon en 0.
 * Les autres rapports entre voisins sont affichés pour information ; ils ne changent pas le code de sortie.
 * Usage : npm run espacements [-- --marque <dossier>] [--semantique <fichier>] [--etroit <fichier>]
 *   D26 : --marque <dossier> contrôle cette marque ; sans l'option, chaque marque de tokens/.
 *   --semantique remplace semantique.tokens.json, --etroit le contexte étroit (largeur.etroit.tokens.json).
 * D18 : toute panne (option inconnue, fichier absent ou illisible) sort en 2, par la garde
 * commune (src/cli/garde.js).
 */
import { parseArgs } from 'node:util';
import { espacements } from '../tokens/espacements.js';
import { largeurs, enEtroit } from '../tokens/resolver.js';
import { lancer, parMarque } from './garde.js';
import { lireJson } from '../lib/fichiers.js';
import { fr } from '../lib/format.js';

await lancer('espacements', () => {
  const { values } = parseArgs({ options: { marque: { type: 'string' }, semantique: { type: 'string' }, etroit: { type: 'string' } } });
  return parMarque(values.marque, (dossier) => {
    const l = largeurs(dossier);
    const sem = values.semantique ? lireJson(values.semantique) : l.large.semantique;
    const contexte = values.etroit ? [lireJson(values.etroit)] : l.contexte;
    const r = espacements(sem, l.large.primitives, { ...l.etroit, semantique: enEtroit(sem, contexte) });

    const TIRET = { vide: '—' };
    const w = Math.max(...[...r.ecarts, ...r.horsControle].map((e) => e.role.length));
    const line = (/** @type {import('../tokens/espacements.js').Espace} */ e) => `  ${e.role.padEnd(w)}  ${String(e.px).padStart(2)} px  ${e.alias}`;

    console.log('ecart (strictement croissants, du plus proche au plus lointain)');
    for (const e of r.ecarts) console.log(line(e));
    console.log('\nvoisins (rapport affiché ; seuil seulement par une règle de proximité, plus bas)');
    for (const v of r.voisins) console.log(`  ${v.ok ? '✓' : '✗'} ${v.de} < ${v.vers} : ${v.a} → ${v.b} px, rapport ${fr(v.rapport, TIRET)}`);
    if (r.etroits.length) {
      console.log('\nen étroit (> ecart précédent, ≤ valeur large)');
      const ouiNon = (/** @type {boolean} */ b) => (b ? 'oui' : 'non');
      for (const t of r.etroits)
        console.log(`  ${t.ok ? '✓' : '✗'} ${t.role} sous ${t.sous} px${t.seuil ? ` ${t.seuil}` : ''} : ${t.px} px ${t.alias}${t.de ? ` ; > ${t.de} ${t.precedent} px : ${ouiNon(t.superieur)}` : ''} ; ≤ ${t.large} px : ${ouiNon(t.auPlusLarge)}`);
    }
    if (r.regles.length) {
      console.log('\nproximité (rapport minimal entre deux ecart)');
      for (const g of r.regles)
        console.log(`  ${g.ok ? '✓' : '✗'} ${g.vers} ≥ ${g.min} × ${g.de} : ${g.b} px pour ${g.a} px, rapport ${fr(g.rapport, TIRET)} ; ${g.raison} (${g.statut})`);
    }
    console.log('\nhors contrôle');
    for (const e of r.horsControle) console.log(line(e));

    console.log('\nprimitives sans rôle (affiché, non contrôlé)');
    console.log(`  ${r.sansRole.length ? r.sansRole.join(', ') : 'aucune'}`);

    const n = r.voisins.length;
    console.log(`\n${n} ${n > 1 ? 'paires' : 'paire'} de voisins, ${r.fails.length ? `${r.fails.length} en échec` : 'aucune en échec'}.`);
    const k = r.etroits.length;
    if (k) console.log(`${k} ${k > 1 ? 'valeurs' : 'valeur'} en étroit, ${r.etroitsFails.length ? `${r.etroitsFails.length} en échec` : 'aucune en échec'}.`);
    const q = r.regles.length;
    if (q) console.log(`${q} ${q > 1 ? 'règles' : 'règle'} de proximité, ${r.reglesFails.length ? `${r.reglesFails.length} en échec` : 'aucune en échec'}.`);
    return r.fails.length || r.etroitsFails.length || r.reglesFails.length ? 1 : 0;
  });
});
