// @ts-check
/**
 * Mesure du rendu d'une page déjà chargée : relevé, agrégation et, si demandé,
 * trace des contextes apparus sur cette page (tant qu'elle est ouverte).
 */
import { collectRendered } from '../browser/rendered.js';
import { traceSamples } from '../browser/trace.js';

/**
 * @param {import('playwright-core').Page} page
 * @param {ReturnType<typeof import('./aggregate.js').createRenderedAggregator>} aggregator
 * @param {{ trace?: boolean, sources?: import('../lib/sources.js').CompiledSources | null,
 *   also?: ReturnType<typeof import('./aggregate.js').createRenderedAggregator>[] }} [opts]
 *   `also` : agrégats supplémentaires alimentés par le même relevé (ex. agrégat de la page seule)
 * @returns {Promise<{ url: string, iframes: number, traced: number }>}
 */
export async function measureRendered(page, aggregator, { trace = false, sources = null, also = [] } = {}) {
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
  return { url: pc.url, iframes: pc.iframes, traced };
}
