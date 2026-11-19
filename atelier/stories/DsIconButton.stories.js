// Stories du bouton à icône seule (D52) : la planche, que la preuve force état par état et enregistre, avec deux lignes
// d'alignement ; la vitrine, toutes les marques en clair et en sombre, sur la page et sur une surface ; le survol des
// discrets vu de près ; le clavier ; le bac à sable ; les refus. Le libellé nomme l'action, jamais l'icône.
import { h, reactive } from 'vue';
import { VThemeProvider } from 'vuetify/components';
import DsIconButton from '../composants/DsIconButton.vue';
import DsButton from '../composants/DsButton.vue';
import DsTextInput from '../composants/DsTextInput.vue';
import { Corbeille, Crayon, Croix, ENTETE, Loupe, Plus, THEMES } from './commun.js';

/** Variante, intitulée en français dans la planche → label, icône d'essai et valeur de la prop variant. */
const VARIANTES = {
  discret: ['Fermer', Croix, 'ghost'],
  secondaire: ['Modifier', Crayon, 'secondary'],
  principal: ['Ajouter', Plus, 'primary'],
  'danger-discret': ['Supprimer', Corbeille, 'danger-ghost'],
};
/** Tailles : intitulé et repère des états en français, valeur de la prop size. */
const TAILLES = /** @type {const} */ ([
  ['normale', 'medium'],
  ['petite', 'small'],
]);
/** États de la planche ; survol et focus y sont au repos, la preuve les force. */
const ETATS = ['repos', 'survol', 'focus', 'désactivé'];

/**
 * Une rangée par variante et taille, une colonne par état.
 * @param {string[]} etats @param {string[]} [variantes]
 */
function grille(etats, variantes = Object.keys(VARIANTES)) {
  const lignes = variantes.flatMap((variante) => TAILLES.map(([taille, size]) => ({ variante, taille, size })));
  return h('div', { style: `display:grid;grid-template-columns:repeat(${etats.length + 1},max-content);gap:16px 24px;align-items:center;padding:24px` }, [
    h('span'),
    ...etats.map((e) => h('span', { style: ENTETE }, e)),
    ...lignes.flatMap(({ variante, taille, size }) => {
      const [label, icon, variant] = VARIANTES[/** @type {keyof typeof VARIANTES} */ (variante)];
      return [
        h('span', { style: ENTETE }, `${variante}, ${taille}`),
        ...etats.map((etat) =>
          h(DsIconButton, { label, icon, variant, size, disabled: etat === 'désactivé', 'data-etat': etat, 'data-variante': variante, 'data-taille': taille }),
        ),
      ];
    }),
  ]);
}

/** Lignes d'alignement : un champ de recherche et un bouton à icône secondaire ; un bouton et un bouton à icône. */
const alignements = () =>
  h('div', { style: 'display:flex;flex-direction:column;gap:24px;padding:0 24px 24px;width:560px' }, [
    h('div', { 'data-cas': 'alignement-recherche', style: 'display:flex;gap:16px;align-items:flex-end' }, [
      h('div', { style: 'flex:1' }, [h(DsTextInput, { label: 'Rechercher un membre', type: 'search', 'data-cas': 'recherche-champ' })]),
      h(DsIconButton, { label: 'Rechercher', icon: Loupe, variant: 'secondary', 'data-cas': 'recherche-bouton' }),
    ]),
    h('div', { 'data-cas': 'alignement-bouton', style: 'display:flex;gap:16px;align-items:center' }, [
      h(DsButton, { variant: 'secondary', prependIcon: Crayon, 'data-cas': 'bouton-texte' }, () => 'Modifier'),
      h(DsIconButton, { label: 'Supprimer', icon: Corbeille, variant: 'danger-ghost', 'data-cas': 'bouton-icone' }),
    ]),
  ]);

export default { title: 'Composants/DsIconButton' };

/** Planche d'un thème, celui de la barre : chaque variante et taille dans chaque état, puis les lignes d'alignement. */
export const Planche = {
  render: () => ({ setup: () => () => h('div', [grille(ETATS), alignements()]) }),
};

/** Les dix thèmes côte à côte, au repos et désactivé, sur la page puis sur une surface. */
export const Vitrine = {
  render: () => ({
    setup: () => () =>
      h(
        'div',
        THEMES.map((t) =>
          h(VThemeProvider, { theme: t.nom, withBackground: true }, () =>
            h('section', { 'data-theme': t.nom, style: 'display:flex;align-items:flex-start' }, [
              h('div', [h('h2', { style: 'font-size:16px;margin:0;padding:24px 24px 0' }, `${t.titre}, sur la page`), grille(['repos', 'désactivé'])]),
              // Mise en page de l'atelier : une surface pour poser les boutons, hors du design system.
              h('div', { style: 'margin:24px;background:rgb(var(--v-theme-surface))' }, [
                h('h2', { style: 'font-size:16px;margin:0;padding:24px 24px 0' }, 'Sur une surface'),
                grille(['repos', 'désactivé']),
              ]),
            ]),
          ),
        ),
      ),
  }),
};

/** Survol des discrets vu de près : repos et survol (forcé par la preuve), agrandis trois fois, dans le thème de la barre. */
export const SurvolDePres = {
  name: 'Survol de près',
  render: () => ({ setup: () => () => h('div', { style: 'zoom:3;width:max-content' }, [grille(['repos', 'survol'], ['discret', 'danger-discret'])]) }),
};

/** Bac à sable : chaque prop, dans le thème de la barre. */
export const BacASable = {
  name: 'Bac à sable',
  args: { label: 'Fermer', variant: 'ghost', size: 'medium', disabled: false },
  argTypes: {
    variant: { control: 'select', options: Object.values(VARIANTES).map(([, , v]) => v) },
    size: { control: 'inline-radio', options: TAILLES.map(([, v]) => v) },
  },
  render: (/** @type {Record<string, any>} */ args) => ({
    setup: () => () =>
      h('div', { style: 'padding:24px' }, [
        h(DsIconButton, { label: args.label, icon: (Object.values(VARIANTES).find(([, , v]) => v === args.variant) ?? VARIANTES.discret)[1], variant: args.variant, size: args.size, disabled: args.disabled }),
      ]),
  }),
};

/**
 * Clavier : un formulaire de recherche envoyé par un bouton à icône, un bouton désactivé et un bouton actif. Le journal
 * (clics émis, envois) est écrit dans la page, où la preuve le lit.
 */
export const Clavier = {
  render: () => ({
    setup() {
      const journal = reactive({ clics: /** @type {string[]} */ ([]), envois: 0 });
      const clic = (/** @type {string} */ cas) => () => journal.clics.push(cas);
      const envoi = (/** @type {Event} */ e) => {
        e.preventDefault();
        journal.envois++;
      };
      return () =>
        h('div', { style: 'display:flex;flex-direction:column;gap:16px;padding:24px;align-items:flex-start' }, [
          h('form', { onSubmit: envoi, style: 'display:flex;gap:16px' }, [
            h('input', { 'aria-label': 'Recherche', 'data-cas': 'champ' }),
            h(DsIconButton, { label: 'Rechercher', icon: Loupe, variant: 'secondary', type: 'submit', 'data-cas': 'envoi', onClick: clic('envoi') }),
          ]),
          h('div', { style: 'display:flex;gap:16px' }, [
            h(DsIconButton, { label: 'Supprimer', icon: Corbeille, variant: 'danger-ghost', disabled: true, 'data-cas': 'desactive', onClick: clic('desactive') }),
            h(DsIconButton, { label: 'Fermer', icon: Croix, 'data-cas': 'actif', onClick: clic('actif') }),
          ]),
          h('output', { 'data-journal': '' }, JSON.stringify(journal)),
        ]);
    },
  }),
};

const seul = (/** @type {Record<string, any>} */ props) => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsIconButton, props)]) });

/** Refus : sans libellé ; la story montre l'erreur, aucun bouton. */
export const RefusSansLibelle = { render: () => seul({ icon: Croix }) };
/** Refus : sans icône. */
export const RefusSansIcone = { render: () => seul({ label: 'Fermer' }) };
/** Refus : variante hors du menu (le plein danger n'y est pas). */
export const RefusVariante = { render: () => seul({ label: 'Supprimer', icon: Corbeille, variant: 'danger' }) };
/** Refus : aria-label posé à la main ; le nom vient du libellé. */
export const RefusNom = { render: () => seul({ label: 'Fermer', icon: Croix, 'aria-label': 'Croix' }) };
/** Refus : attribut hors de la liste blanche. */
export const RefusAttribut = { render: () => seul({ label: 'Fermer', icon: Croix, color: 'secondary' }) };
/** Refus : désactivé sur un bouton d'envoi. */
export const RefusEnvoi = { render: () => seul({ label: 'Rechercher', icon: Loupe, type: 'submit', disabled: true }) };
