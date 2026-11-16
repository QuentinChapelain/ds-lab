// @ts-check
/**
 * Mesure du rendu d'une page déjà chargée : relevé, agrégation et, si demandé,
 * trace des contextes apparus sur cette page (tant qu'elle est ouverte).
 * Revue de code du 15/11, lot 1b : en deux temps. relever() lit la page (relevé, états forcés) sans rien verser ;
 * verser() ajoute la page à l'agrégat une fois toutes ses étapes réussies, puis la trace annote les contextes apparus ;
 * une trace en panne ne retire pas la page : ses échantillons restent « non tracé », et l'erreur est rendue.
 */
import { collectRendered } from '../browser/rendered.js';
import { traceSamples } from '../browser/trace.js';
import { collectStates } from '../browser/states.js';

/** Échantillon d'une trace qui n'a pas abouti. */
const NON_TRACE = { origin: 'non tracé', source: null, selector: null, href: null, line: null, inherited: false, important: false };

/**
 * Premier temps : la page lue, rien n'est versé.
 * @param {import('playwright-core').Page} page
 * @param {{ states?: boolean, thirdParty?: string[] }} [opts]
 * @returns {Promise<{ pc: import('../browser/rendered.js').PageCollection, sc: import('../browser/states.js').StateCollection | null }>}
 */
export async function relever(page, { states = false, thirdParty = [] } = {}) {
  const pc = await collectRendered(page, { thirdParty });
  const sc = states ? await collectStates(page, pc) : null;
  return { pc, sc };
}

/**
 * Second temps : la page versée dans l'agrégat (et les agrégats `also`), puis, si demandé, la trace des contextes apparus
 * sur cette page, tant qu'elle est ouverte. Une trace en panne laisse ses échantillons « non tracé » et rend l'erreur.
 * @param {import('playwright-core').Page} page
 * @param {ReturnType<typeof import('./aggregate.js').createRenderedAggregator>} aggregator
 * @param {Awaited<ReturnType<typeof relever>>} lu
 * @param {{ trace?: boolean, sources?: import('../lib/sources.js').CompiledSources | null,
 *   also?: ReturnType<typeof import('./aggregate.js').createRenderedAggregator>[] }} [opts]
 * @returns {Promise<{ url: string, iframes: number, traced: number, stateSamples: number, traceError: string | null }>}
 */
export async function verser(page, aggregator, { pc, sc }, { trace = false, sources = null, also = [] } = {}) {
  const created = aggregator.addPage(pc);
  for (const a of also) a.addPage(pc);
  if (sc) {
    aggregator.addStates(sc);
    for (const a of also) a.addStates(sc);
  }
  let traced = 0;
  /** @type {string | null} */
  let traceError = null;
  if (trace && created.length) {
    try {
      const results = await traceSamples(
        page,
        created.map((c) => ({ index: c.context.sample.index, property: c.context.property, pseudo: c.context.sample.pseudo })),
        { sources },
      );
      created.forEach((c, i) => {
        c.context.trace = results[i];
      });
      traced = results.length;
    } catch (e) {
      traceError = /** @type {Error} */ (e).message.split('\n')[0];
      for (const c of created) c.context.trace = { ...NON_TRACE };
    }
  }
  return { url: pc.url, iframes: pc.iframes, traced, stateSamples: sc?.samples.length ?? 0, traceError };
}

/**
 * Les deux temps de suite, pour qui n'a pas d'autre étape entre la mesure et le versement.
 * @param {import('playwright-core').Page} page
 * @param {ReturnType<typeof import('./aggregate.js').createRenderedAggregator>} aggregator
 * @param {{ trace?: boolean, states?: boolean, thirdParty?: string[], sources?: import('../lib/sources.js').CompiledSources | null,
 *   also?: ReturnType<typeof import('./aggregate.js').createRenderedAggregator>[] }} [opts]
 *   `also` : agrégats supplémentaires alimentés par le même relevé (ex. agrégat de la page seule)
 *   `states` : force hover, focus et active sur un échantillon d'éléments interactifs (R15)
 * @returns {Promise<{ url: string, iframes: number, traced: number, stateSamples: number, traceError: string | null }>}
 */
export async function measureRendered(page, aggregator, { trace = false, states = false, thirdParty = [], sources = null, also = [] } = {}) {
  return verser(page, aggregator, await relever(page, { states, thirdParty }), { trace, sources, also });
}
