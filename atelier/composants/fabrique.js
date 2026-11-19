// Fabrique commune des enveloppes (D51) : chaque enveloppe déclare son menu (<Enveloppe>.menu.js) et son rendu ; la
// fabrique en tire le composant Vue et refuse tout usage hors du menu, avec le même motif de message partout. Aucun
// import de Vue ni de Vuetify : les tests de la racine la lisent sans navigateur (test/fabrique-enveloppes.test.js).
//
// Un menu : { nom, options, evenements?, ecouteurs?, attributsRetires?, regles?, reglesDuRendu? }. Une option : { type,
// defaut?, valeurs?, obligatoire? }. Une règle : (props, attrs, slots) → message, ou rien. Une règle du rendu lit le
// contenu d'un slot : elle n'est vérifiée qu'au rendu, seul moment où Vue admet qu'on appelle un slot. Un message a
// toujours la forme « <Composant> : <prop ou attribut> : <motif> », avec les noms du code (NM1, D57).

/**
 * Attribut admis en plus des props : id, aria-*, data-*, et les écouteurs si le menu ne les retire pas ; jamais un
 * attribut que le menu retire.
 * @param {any} menu @param {string} cle
 */
function admis(menu, cle) {
  if ((menu.attributsRetires ?? []).includes(cle)) return false;
  return cle === 'id' || /^aria-/.test(cle) || /^data-/.test(cle) || (menu.ecouteurs !== false && /^on[A-Z]/.test(cle));
}

/**
 * Refus d'un usage hors du menu : attributs d'abord, puis options dans l'ordre du menu, puis règles, puis, au rendu, les
 * règles du rendu ; le premier échec lève une erreur qui le nomme.
 * @param {any} menu @param {Record<string, any>} props @param {Record<string, unknown>} attrs @param {Record<string, any>} [slots]
 * @param {{ rendu?: boolean }} [o]
 */
export function verifierUsage(menu, props, attrs, slots = {}, o = {}) {
  const p = menu.nom;
  const refuses = Object.keys(attrs).filter((k) => !admis(menu, k));
  if (refuses.length) throw new Error(`${p} : attribut refusé : ${refuses.join(', ')}`);
  for (const [cle, option] of Object.entries(menu.options)) {
    const v = props[cle];
    if (option.obligatoire && (v === undefined || v === null || v === '')) throw new Error(`${p} : ${cle} : obligatoire`);
    if (option.valeurs && !option.valeurs.includes(v)) throw new Error(`${p} : ${cle} : valeur inconnue : ${v} (${option.valeurs.join(', ')})`);
  }
  for (const regle of [...(menu.regles ?? []), ...(o.rendu ? (menu.reglesDuRendu ?? []) : [])]) {
    const message = regle(props, attrs, slots);
    if (message) throw new Error(`${p} : ${message}`);
  }
}

/** Props de Vue tirées du menu : type, et défaut s'il en a un. @param {any} menu */
export function propsDuMenu(menu) {
  return Object.fromEntries(Object.entries(menu.options).map(([cle, o]) => [cle, 'defaut' in o ? { type: o.type, default: o.defaut } : { type: o.type }]));
}

/**
 * Composant Vue d'une enveloppe : nom, props et événements tirés du menu, attributs jamais hérités ; l'usage est vérifié
 * au montage, avant le setup de l'enveloppe, puis à chaque rendu, règles du rendu comprises. Un refus lève : rien n'est
 * rendu.
 * @param {any} menu @param {(props: any, ctx: any) => () => unknown} setup setup de l'enveloppe, qui rend sa fonction de rendu
 */
export function definirEnveloppe(menu, setup) {
  return {
    name: menu.nom,
    inheritAttrs: false,
    props: propsDuMenu(menu),
    emits: menu.evenements ?? [],
    /** @param {any} props @param {any} ctx */
    setup(props, ctx) {
      verifierUsage(menu, props, ctx.attrs, ctx.slots);
      const rendu = setup(props, ctx);
      return () => {
        verifierUsage(menu, props, ctx.attrs, ctx.slots, { rendu: true });
        return rendu();
      };
    },
  };
}
