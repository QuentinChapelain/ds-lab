// @ts-check
/**
 * Les cinq scores du constat (D46), chacun en « x sur y », sans note globale ; l'effort est un nombre.
 *   source unique : éléments sur la version la plus répandue de leur type, sur le total des éléments ;
 *   accessibilité de base : commandes qui ont un nom calculé, s'atteignent au clavier et ont une zone de clic d'au moins
 *     24 px de côté, sur le total des commandes ; les échecs sont comptés par critère ;
 *   versions à garder choisies : types dont la version à garder est choisie, sur le nombre de types ;
 *   fiabilité de l'audit : éléments identifiés, sur identifiés plus non identifiés ;
 *   effort : éléments qui ne sont pas sur la version à garder de leur type, à défaut pas sur la plus répandue.
 * Seuls les éléments comptés entrent : ni le gabarit ni les blocs non identifiés (sauf dans la fiabilité).
 */

/**
 * @typedef {{ x: number, y: number }} SurTotal
 * @typedef {{ sourceUnique: SurTotal, accessibilite: SurTotal & { echecs: { nom: number, clavier: number, zone: number } },
 *   versionsAGarder: SurTotal, fiabilite: SurTotal, effort: number }} Scores
 */

/**
 * @param {{ occurrences: import('./pieces.js').Occurrence[], plusGrand: number, garder: string | null }[]} types types comptés
 * @param {number} nonIdentifies occurrences des blocs non identifiés
 * @returns {Scores}
 */
export function scores(types, nonIdentifies) {
  let total = 0;
  let plusRepandus = 0;
  let effort = 0;
  let choisis = 0;
  let commandes = 0;
  let passent = 0;
  const echecs = { nom: 0, clavier: 0, zone: 0 };
  for (const t of types) {
    const n = t.occurrences.length;
    total += n;
    plusRepandus += t.plusGrand;
    if (t.garder) choisis++;
    effort += n - (t.garder ? t.occurrences.filter((o) => o.version === t.garder).length : t.plusGrand);
    for (const o of t.occurrences) {
      if (!o.acces) continue;
      commandes++;
      if (!o.acces.nom) echecs.nom++;
      if (!o.acces.clavier) echecs.clavier++;
      if (!o.acces.zone) echecs.zone++;
      if (o.acces.nom && o.acces.clavier && o.acces.zone) passent++;
    }
  }
  return {
    sourceUnique: { x: plusRepandus, y: total },
    accessibilite: { x: passent, y: commandes, echecs },
    versionsAGarder: { x: choisis, y: types.length },
    fiabilite: { x: total, y: total + nonIdentifies },
    effort,
  };
}
