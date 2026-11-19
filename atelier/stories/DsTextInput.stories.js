// Stories du champ de texte (D49) : la planche, que la preuve force état par état et enregistre, avec la ligne
// d'alignement champ + bouton ; la vitrine, toutes les marques en clair et en sombre côte à côte ; le clavier ; le bac à
// sable ; les refus.
import { h, reactive } from 'vue';
import { VThemeProvider } from 'vuetify/components';
import DsTextInput from '../composants/DsTextInput.vue';
import DsButton from '../composants/DsButton.vue';
import { ENTETE, Loupe, THEMES } from './commun.js';

/** États de la planche ; survol et focus y sont au repos, la preuve les force. */
const ETATS = [
  ['repos', {}],
  ['survol', {}],
  ['focus', {}],
  ['rempli', { modelValue: 'Texte saisi' }],
  ['exemple', { type: 'email', placeholder: 'nom@exemple.fr' }],
  ['aide', { hint: 'Huit caractères au moins.' }],
  ['erreur', { errorMessage: 'Ce champ est vide.', hint: 'Huit caractères au moins.' }],
  ['erreur-focus', { errorMessage: 'Ce champ est vide.', hint: 'Huit caractères au moins.' }],
  ['obligatoire', { required: true }],
  ['désactivé', { disabled: true, modelValue: 'Texte saisi', hint: 'Champ fermé pendant la vérification.' }],
  ['icône', { type: 'search', prependInnerIcon: Loupe, placeholder: 'Rechercher' }],
];

/** @param {string[]} [garder] états montrés, tous par défaut */
function planche(garder) {
  return h(
    'div',
    { style: 'display:grid;grid-template-columns:repeat(4,240px);gap:24px;padding:24px;align-items:start' },
    ETATS.filter(([etat]) => !garder || garder.includes(etat)).map(([etat, o]) =>
      h('div', { style: 'display:flex;flex-direction:column;gap:8px' }, [
        h('span', { style: ENTETE }, etat),
        h(DsTextInput, { label: 'Libellé', ...o, 'data-etat': etat }),
      ]),
    ),
  );
}

/** Ligne d'alignement : un champ et un bouton de taille normale, alignés en bas. */
const alignement = () =>
  h('div', { 'data-cas': 'alignement', style: 'display:flex;gap:16px;align-items:flex-end;padding:0 24px 24px;width:560px' }, [
    h('div', { style: 'flex:1' }, [h(DsTextInput, { label: 'Rechercher un membre', type: 'search', prependInnerIcon: Loupe, 'data-cas': 'alignement-champ' })]),
    h(DsButton, { 'data-cas': 'alignement-bouton' }, () => 'Rechercher'),
  ]);

export default { title: 'Composants/DsTextInput' };

/** Planche d'un thème, celui de la barre : chaque état, puis la ligne d'alignement. */
export const Planche = {
  render: () => ({ setup: () => () => h('div', [planche(), alignement()]) }),
};

/** Les dix thèmes côte à côte : repos, erreur, désactivé, avec icône. */
export const Vitrine = {
  render: () => ({
    setup: () => () =>
      h(
        'div',
        THEMES.map((t) =>
          h(VThemeProvider, { theme: t.nom, withBackground: true }, () =>
            h('section', { 'data-theme': t.nom }, [h('h2', { style: 'font-size:16px;margin:0;padding:24px 24px 0' }, t.titre), planche(['repos', 'erreur', 'désactivé', 'icône'])]),
          ),
        ),
      ),
  }),
};

/** Bac à sable : chaque prop, dans le thème de la barre. */
export const BacASable = {
  name: 'Bac à sable',
  args: { label: 'Adresse électronique', hint: '', errorMessage: '', placeholder: '', required: false, disabled: false, type: 'text', prependInnerIcon: false },
  argTypes: { type: { control: 'select', options: ['text', 'email', 'search', 'password'] } },
  render: (/** @type {Record<string, any>} */ args) => ({
    setup() {
      const etat = reactive({ valeur: '' });
      return () =>
        h('div', { style: 'padding:24px;width:320px' }, [
          h(DsTextInput, {
            label: args.label,
            hint: args.hint || undefined,
            errorMessage: args.errorMessage || undefined,
            placeholder: args.placeholder || undefined,
            required: args.required,
            disabled: args.disabled,
            type: args.type,
            prependInnerIcon: args.prependInnerIcon ? Loupe : null,
            modelValue: etat.valeur,
            'onUpdate:modelValue': (/** @type {string} */ v) => (etat.valeur = v),
          }),
        ]);
    },
  }),
};

/**
 * Clavier : un formulaire de quatre champs, dont un désactivé, et un bouton d'envoi. Le journal (valeur tapée, noms
 * envoyés par le formulaire) est écrit dans la page, où la preuve le lit.
 */
export const Clavier = {
  render: () => ({
    setup() {
      const journal = reactive({ nom: '', envoi: /** @type {string[] | null} */ (null) });
      const envoyer = (/** @type {Event} */ e) => {
        e.preventDefault();
        journal.envoi = [...new FormData(/** @type {HTMLFormElement} */ (e.target)).keys()];
      };
      return () =>
        // novalidate : le message d'erreur est celui du champ ; la validation du navigateur bloquerait l'envoi.
        h('form', { novalidate: true, onSubmit: envoyer, style: 'display:flex;flex-direction:column;gap:16px;padding:24px;width:360px' }, [
          h(DsTextInput, { label: 'Nom', name: 'nom', required: true, hint: 'Tel qu\'il paraît sur la carte.', autocomplete: 'name', modelValue: journal.nom, 'onUpdate:modelValue': (/** @type {string} */ v) => (journal.nom = v), 'data-cas': 'nom' }),
          h(DsTextInput, { label: 'Adresse électronique', name: 'courriel', type: 'email', autocomplete: 'email', errorMessage: 'Adresse sans arobase.', hint: 'Par exemple nom@exemple.fr.', modelValue: 'nom.exemple.fr', 'data-cas': 'courriel' }),
          h(DsTextInput, { label: 'Identifiant', name: 'identifiant', disabled: true, hint: 'Attribué à l\'inscription.', modelValue: 'membre-0042', 'data-cas': 'identifiant' }),
          h(DsTextInput, { label: 'Rechercher', name: 'recherche', type: 'search', prependInnerIcon: Loupe, placeholder: 'Un nom, une ville', 'data-cas': 'recherche' }),
          h('div', [h(DsButton, { type: 'submit', 'data-cas': 'envoyer' }, () => 'Envoyer')]),
          h('output', { 'data-journal': '' }, JSON.stringify(journal)),
        ]);
    },
  }),
};

/** Refus : sans libellé ; la story montre l'erreur, aucun champ. */
export const RefusSansLibelle = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsTextInput, {})]) }),
};

/** Refus : type hors du menu. */
export const RefusType = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsTextInput, { label: 'Téléphone', type: 'tel' })]) }),
};

/** Refus : attribut hors de la liste blanche. */
export const RefusAttribut = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsTextInput, { label: 'Nom', variant: 'filled' })]) }),
};

/** Refus : aria-describedby posé à la main ; l'enveloppe le pose d'après l'aide et l'erreur. */
export const RefusDescription = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsTextInput, { label: 'Nom', 'aria-describedby': 'ailleurs' })]) }),
};
