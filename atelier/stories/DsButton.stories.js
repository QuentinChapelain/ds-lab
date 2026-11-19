// Stories du bouton (D43) : la planche, que la preuve force état par état et enregistre ; la vitrine, toutes les marques
// en clair et en sombre côte à côte ; le bac à sable, réglable. Thèmes et icône d'essai viennent de commun.js : aucun
// nom de marque n'est écrit ici.
import { h, reactive, ref } from 'vue';
import { VThemeProvider } from 'vuetify/components';
import DsButton from '../composants/DsButton.vue';
import { ENTETE, Plus, THEMES } from './commun.js';

/** Variantes et tailles de la planche : intitulé et repère des états en français, valeur de la prop. */
const VARIANTES = /** @type {const} */ ([
  ['principal', 'primary'],
  ['secondaire', 'secondary'],
  ['discret', 'ghost'],
  ['danger', 'danger'],
  ['danger-discret', 'danger-ghost'],
]);
const TAILLES = /** @type {const} */ ([
  ['normale', 'medium'],
  ['petite', 'small'],
]);
/** États de la planche ; survol et focus y sont au repos, la preuve les force. */
const ETATS = ['repos', 'survol', 'focus', 'désactivé', 'chargement'];

/** Mise en page des planches de l'atelier, hors du design system. */
const GRILLE = 'display:grid;grid-template-columns:repeat(6,max-content);gap:16px 24px;align-items:center;padding:24px';

/**
 * Une rangée par variante et taille, une colonne par état.
 * @param {string[]} etats @param {{ icone?: boolean, sansIcone?: boolean }} [o]
 */
function grille(etats, o = {}) {
  const lignes = VARIANTES.flatMap(([variante, variant]) => TAILLES.map(([taille, size]) => ({ variante, variant, taille, size })));
  return h('div', { style: GRILLE.replace('repeat(6', `repeat(${etats.length + 1}`) }, [
    h('span'),
    ...etats.map((e) => h('span', { style: ENTETE }, e)),
    ...lignes.flatMap(({ variante, variant, taille, size }) => [
      h('span', { style: ENTETE }, `${variante}, ${taille}`),
      ...etats.map((etat) =>
        h(
          DsButton,
          {
            variant,
            size,
            prependIcon: o.sansIcone ? null : Plus,
            disabled: etat === 'désactivé',
            loading: etat === 'chargement',
            'data-etat': etat,
            'data-variante': variante,
            'data-taille': taille,
          },
          () => 'Ajouter',
        ),
      ),
    ]),
  ]);
}

export default { title: 'Composants/DsButton' };

/** Planche d'un thème, celui de la barre : chaque variante et taille dans chaque état, avec icône. */
export const Planche = {
  render: () => ({ setup: () => () => grille(ETATS) }),
};

/** Les dix thèmes côte à côte, au repos, désactivé et en chargement, avec et sans icône. */
export const Vitrine = {
  render: () => ({
    setup: () => () =>
      h(
        'div',
        THEMES.map((t) =>
          h(VThemeProvider, { theme: t.nom, withBackground: true }, () =>
            h('section', { 'data-theme': t.nom }, [
              h('h2', { style: 'font-size:16px;margin:0;padding:24px 24px 0' }, t.titre),
              grille(['repos', 'désactivé', 'chargement']),
              grille(['repos', 'désactivé', 'chargement'], { sansIcone: true }),
            ]),
          ),
        ),
      ),
  }),
};

/** Bac à sable : chaque prop, dans le thème de la barre. */
export const BacASable = {
  name: 'Bac à sable',
  args: { texte: 'Commander', variant: 'primary', size: 'medium', prependIcon: false, block: false, disabled: false, loading: false },
  argTypes: {
    variant: { control: 'select', options: VARIANTES.map(([, v]) => v) },
    size: { control: 'inline-radio', options: TAILLES.map(([, v]) => v) },
  },
  render: (/** @type {Record<string, any>} */ args) => ({
    setup: () => () =>
      h('div', { style: 'padding:24px' }, [
        h(DsButton, { variant: args.variant, size: args.size, prependIcon: args.prependIcon ? Plus : null, block: args.block, disabled: args.disabled, loading: args.loading }, () => args.texte),
      ]),
  }),
};

/**
 * Clavier : deux formulaires, un désactivé et un bouton qui passe en chargement quand on l'active. Le journal (clics
 * émis, envois de chaque formulaire) est écrit dans la page, où la preuve le lit.
 */
export const Clavier = {
  render: () => ({
    setup() {
      const journal = reactive({ clics: /** @type {string[]} */ ([]), envois: { attente: 0, actif: 0 } });
      const charge = ref(false);
      const clic = (/** @type {string} */ cas) => () => journal.clics.push(cas);
      /** @param {'attente' | 'actif'} nom */
      const envoi = (nom) => (/** @type {Event} */ e) => {
        e.preventDefault();
        journal.envois[nom]++;
      };
      return () =>
        h('div', { style: 'display:flex;flex-direction:column;gap:16px;padding:24px;align-items:flex-start' }, [
          h('form', { 'data-formulaire': 'attente', onSubmit: envoi('attente'), style: 'display:flex;gap:16px' }, [
            h('input', { 'aria-label': 'Champ du formulaire en attente', 'data-cas': 'champ-attente' }),
            h(DsButton, { type: 'submit', loading: true, 'data-cas': 'chargement', onClick: clic('chargement') }, () => 'Envoyer'),
          ]),
          h('form', { 'data-formulaire': 'actif', onSubmit: envoi('actif'), style: 'display:flex;gap:16px' }, [
            h('input', { 'aria-label': 'Champ du formulaire actif', 'data-cas': 'champ-actif' }),
            h(DsButton, { type: 'submit', prependIcon: Plus, 'data-cas': 'envoi', onClick: clic('envoi') }, () => 'Ajouter'),
          ]),
          h(DsButton, { variant: 'secondary', disabled: true, 'data-cas': 'desactive', onClick: clic('desactive') }, () => 'Supprimer'),
          h(DsButton, { loading: charge.value, 'data-cas': 'bascule', onClick: () => { journal.clics.push('bascule'); charge.value = true; } }, () => 'Commander'),
          h('output', { 'data-journal': '' }, JSON.stringify(journal)),
        ]);
    },
  }),
};

/** Pleine largeur : un bouton étiré sur son parent, un autre à sa largeur. */
export const Largeur = {
  render: () => ({
    setup: () => () =>
      h('div', { 'data-parent': '', style: 'width:480px;display:flex;flex-direction:column;gap:16px;padding:24px' }, [
        h('div', [h(DsButton, { block: true, 'data-cas': 'pleine' }, () => 'Commander')]),
        h('div', [h(DsButton, { 'data-cas': 'propre' }, () => 'Commander')]),
      ]),
  }),
};

/** Refus : désactivé sur un bouton d'envoi ; la story montre l'erreur, aucun bouton. */
export const RefusEnvoi = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsButton, { type: 'submit', disabled: true }, () => 'Envoyer')]) }),
};

/** Refus : attribut hors de la liste blanche ; la story montre l'erreur, aucun bouton. */
export const RefusAttribut = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsButton, { color: 'secondary' }, () => 'Envoyer')]) }),
};
