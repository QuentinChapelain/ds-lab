#!/usr/bin/env node
// @ts-check
/**
 * Séance 3c, typo : contrôle des styles de texte d'une marque.
 * Sort en 1 si l'une des neuf règles n'est pas tenue, sinon en 0. Le rapport de chaque style et les primitives
 * sans rôle sont affichés pour information ; ils ne changent pas le code de sortie.
 * Usage : npm run typo [-- --marque <dossier>] [--semantique <fichier>] [--primitives <fichier>] [--couche-marque <fichier>]
 *   [--etroit <fichier>]
 * Revue de code, lot 5 (D26) : --marque <dossier> contrôle cette marque ; sans l'option, chaque marque de tokens/. La couche
 * marque donnée à part passe par --couche-marque <fichier> (l'ancien --marque <fichier>).
 * Revue de code du 15/11, lot 1a (D18) : toute panne (option inconnue, fichier absent ou illisible) sort en 2, par la garde
 * commune (src/cli/garde.js).
 */
import { parseArgs } from 'node:util';
import { typo } from '../tokens/typo.js';
import { fr } from '../lib/format.js';
import { largeurs, enEtroit } from '../tokens/resolver.js';
import { lancer, lireJson, parMarque } from './garde.js';

await lancer('typo', () => {
  const { values } = parseArgs({ options: { marque: { type: 'string' }, semantique: { type: 'string' }, primitives: { type: 'string' }, 'couche-marque': { type: 'string' }, etroit: { type: 'string' } } });
  return parMarque(values.marque, (dossier) => {
    const l = largeurs(dossier);
    const sem = values.semantique ? lireJson(values.semantique) : l.large.semantique;
    const contexte = values.etroit ? [lireJson(values.etroit)] : l.contexte;
    const r = typo(
      sem,
      // Étape 4c : la consigne de hauteur de capitale (groupe police, tokens/commun/police.tokens.json) vient du resolver
      // quand le fichier de primitives donné ne la porte pas.
      values.primitives ? { police: l.large.primitives.police, ...lireJson(values.primitives) } : l.large.primitives,
      values['couche-marque'] ? lireJson(values['couche-marque']) : l.large.marque,
      { ...l.etroit, semantique: enEtroit(sem, contexte) },
    );

    const D4 = { decimales: 4 };
    const ligne = (/** @type {number} */ n) => fr(n, { decimales: 2 });
    const cols = r.styles.map((s) => [
      s.style,
      `${fr(s.large.taille, D4)} / ${ligne(s.large.ligne)} px`,
      `rapport ${fr(s.large.interligne, D4)}`,
      s.etroit ? `étroit ${fr(s.etroit.taille, D4)} / ${ligne(s.etroit.ligne)} px` : '',
      s.etroit ? `rapport ${fr(s.etroit.interligne, D4)}` : '',
      String(s.graisse),
      String(s.police).replace(/^\{marque\.(.*)\}$/, '$1'),
      s.hauteurCapitale !== null ? `capitale ${fr(s.hauteurCapitale, D4)} × taille` : '',
    ]);
    const w = cols[0].map((_, i) => Math.max(...cols.map((c) => c[i].length)));
    const sous = r.styles.find((s) => s.sous !== null);
    console.log(`styles (taille / ligne en px, rapport sans seuil${sous ? ` ; en étroit sous ${sous.sous} px ${sous.seuil}`.trimEnd() : ''} ; graisse ; police ; consigne de hauteur de capitale)`);
    for (const c of cols) console.log(`  ${c.map((x, i) => x.padEnd(w[i])).join('  ').trimEnd()}`);

    console.log('\nrègles');
    for (const g of r.regles) {
      console.log(`  ${g.ok ? '✓' : '✗'} ${g.titre}`);
      for (const d of g.details) console.log(`      ${d}`);
    }

    console.log('\nprimitives sans rôle (affiché, non contrôlé)');
    console.log(`  ${r.sansRole.length ? r.sansRole.join(', ') : 'aucune'}`);

    const n = r.regles.length;
    console.log(`\n${n} règles, ${r.fails.length ? `${r.fails.length} en échec` : 'aucune en échec'}.`);
    return r.fails.length ? 1 : 0;
  });
});
