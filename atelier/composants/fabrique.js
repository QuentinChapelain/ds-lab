// Fabrique commune des enveloppes (D51) : chaque enveloppe déclare son menu (<Enveloppe>.menu.js) et son rendu ; la
// fabrique en tire le composant Vue et refuse tout usage hors du menu, avec le même motif de message partout. Aucun
// import de Vue ni de Vuetify : les tests de la racine la lisent sans navigateur (test/fabrique-enveloppes.test.js).
//
// Un menu : { nom, prefixe, options, evenements?, ecouteurs?, attributsRetires?, regles? }. Une option : { type, defaut?,
// valeurs?, genre? ('f' ou 'm', pour « inconnue » ou « inconnu »), obligatoire?, nom? (dans les messages, la clé à
// défaut) }. Une règle : (props, attrs, slots) → message, ou rien.

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
 * Refus d'un usage hors du menu : attributs d'abord, puis options dans l'ordre du menu, puis règles ; le premier échec
 * lève une erreur qui le nomme.
 * @param {any} menu @param {Record<string, any>} props @param {Record<string, unknown>} attrs @param {Record<string, unknown>} [slots]
 */
export function verifierUsage(menu, props, attrs, slots = {}) {
  const p = menu.prefixe;
  const refuses = Object.keys(attrs).filter((k) => !admis(menu, k));
  if (refuses.length) throw new Error(`${p} : attribut refusé : ${refuses.join(', ')}`);
  for (const [cle, o] of Object.entries(menu.options)) {
    const v = props[cle];
    const nom = o.nom ?? cle;
    if (o.obligatoire && (v === undefined || v === null || v === '')) throw new Error(`${p} : ${nom} obligatoire`);
    if (o.valeurs && !o.valeurs.includes(v)) throw new Error(`${p} : ${nom} ${o.genre === 'f' ? 'inconnue' : 'inconnu'} : ${v} (${o.valeurs.join(', ')})`);
  }
  for (const regle of menu.regles ?? []) {
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
 * au montage, avant le setup de l'enveloppe, puis à chaque rendu. Un refus lève : rien n'est rendu.
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
        verifierUsage(menu, props, ctx.attrs, ctx.slots);
        return rendu();
      };
    },
  };
}
