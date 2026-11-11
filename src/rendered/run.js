// @ts-check
/**
 * Mesure du rendu d'une page déjà chargée : relevé, agrégation et, si demandé,
 * trace des contextes apparus sur cette page (tant qu'elle est ouverte).
 */
import { collectRendered } from '../browser/rendered.js';
import { traceSamples } from '../browser/trace.js';
import { collectStates } from '../browser/states.js';

/**
 * @param {import('playwright-core').Page} page
 * @param {ReturnType<typeof import('./aggregate.js').createRenderedAggregator>} aggregator
 * @param {{ trace?: boolean, states?: boolean, sources?: import('../lib/sources.js').CompiledSources | null,
 *   also?: ReturnType<typeof import('./aggregate.js').createRenderedAggregator>[] }} [opts]
 *   `also` : agrégats supplémentaires alimentés par le même relevé (ex. agrégat de la page seule)
 *   `states` : force hover, focus et active sur un échantillon d'éléments interactifs (R15)
 * @returns {Promise<{ url: string, iframes: number, traced: number, stateSamples: number }>}
 */
export async function measureRendered(page, aggregator, { trace = false, states = false, sources = null, also = [] } = {}) {
  const pc = await collectRendered(page);
  const created = aggregator.addPage(pc);
  for (const a of also) a.addPage(pc);
  let traced = 0;
  if (trace && created.length) {
    const results = await traceSamples(
      page,
      created.map((c) => ({ index: c.context.sample.index, property: c.context.property, pseudo: c.context.sample.pseudo })),
      { sources },
    );
    created.forEach((c, i) => {
      c.context.trace = results[i];
    });
    traced = results.length;
  }
  let stateSamples = 0;
  if (states) {
    const sc = await collectStates(page, pc);
    aggregator.addStates(sc);
    for (const a of also) a.addStates(sc);
    stateSamples = sc.samples.length;
  }
  return { url: pc.url, iframes: pc.iframes, traced, stateSamples };
}
