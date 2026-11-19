<script>
// Enveloppe du champ de texte (D49) : seul endroit du dépôt où paraît le champ de Vuetify. Son menu
// (DsTextInput.menu.js) et la liste blanche d'attributs sont vérifiés par la fabrique commune (fabrique.js, D51) : tout le
// reste lève, et aucun champ n'est rendu. Couleurs, dimensions et texte viennent des variables du thème de la marque
// (tokens/<marque>/vuetify.json, D41) : aucune valeur n'est écrite ici.
//
// Ce que fait v-text-field, lu dans vuetify 4.3.4 : l'input porte toujours aria-labelledby="<id>-label", qui ne vise un
// élément qu'avec son libellé flottant ; ses messages sont un role="alert" rendu même vide, et un seul id les lie ;
// jamais d'aria-invalid ; disabled pose l'attribut natif et une opacité sur tout le champ ; le texte d'exemple et le
// contour sont dans la couleur du texte à une opacité réduite, le contour s'anime. L'enveloppe rend donc elle-même le
// libellé (un label dont l'id est celui qu'attend Vuetify), l'aide et l'erreur (hide-details), pose aria-invalid et
// aria-describedby, masque le contour de Vuetify et dessine le sien. Désactivé garde l'attribut natif, comme Vuetify :
// la valeur ne part pas avec le formulaire, le champ sort de l'ordre du focus et reste dans l'arbre d'accessibilité
// (D49, écart voulu avec le bouton).
import { h, useId } from 'vue';
import { VTextField } from 'vuetify/components';
import { definirEnveloppe } from './fabrique.js';
import MENU from './DsTextInput.menu.js';

/** Mention ajoutée au libellé d'un champ obligatoire. */
const OBLIGATOIRE = '(obligatoire)';

export default definirEnveloppe(MENU, (props, { attrs, emit }) => {
  const auto = useId();
  return () => {
    const { id: donne, ...reste } = attrs;
    const id = /** @type {string} */ (donne ?? `ds-text-input-${auto}`);
    // Données sur le bloc entier ; aria-* et écouteurs sur l'input, par Vuetify.
    const donnees = Object.fromEntries(Object.entries(reste).filter(([k]) => k.startsWith('data-')));
    const vers = Object.fromEntries(Object.entries(reste).filter(([k]) => !k.startsWith('data-')));
    const decrit = [props.errorMessage ? `${id}-erreur` : null, props.hint ? `${id}-aide` : null].filter(Boolean).join(' ');
    const libelle = h('label', { class: 'ds-text-input__label', for: id, id: `${id}-label` }, [
      props.label,
      props.required ? h('span', { class: 'ds-text-input__required' }, ` ${OBLIGATOIRE}`) : null,
    ]);
    const champ = h(
      VTextField,
      {
        ...vers,
        id,
        class: 'ds-text-input__field',
        modelValue: props.modelValue,
        'onUpdate:modelValue': (/** @type {string} */ v) => emit('update:modelValue', v),
        type: props.type,
        variant: 'outlined',
        hideDetails: true,
        disabled: props.disabled,
        placeholder: props.placeholder,
        name: props.name,
        autocomplete: props.autocomplete,
        'aria-describedby': decrit || undefined,
        'aria-invalid': props.errorMessage ? 'true' : undefined,
        'aria-required': props.required ? 'true' : undefined,
      },
      props.prependInnerIcon ? { 'prepend-inner': () => h('span', { class: 'ds-text-input__icon', 'aria-hidden': 'true' }, [h(props.prependInnerIcon)]) } : {},
    );
    return h(
      'div',
      { ...donnees, class: ['ds-text-input', { 'ds-text-input--error': !!props.errorMessage, 'ds-text-input--disabled': props.disabled, 'ds-text-input--icon': !!props.prependInnerIcon }] },
      [
        libelle,
        champ,
        props.errorMessage ? h('p', { class: 'ds-text-input__error', id: `${id}-erreur` }, props.errorMessage) : null,
        // Sous une erreur, l'aide quitte l'écran mais reste lue, après l'erreur.
        props.hint ? h('p', { class: ['ds-text-input__hint', { 'ds-text-input__hidden': !!props.errorMessage }], id: `${id}-aide` }, props.hint) : null,
      ],
    );
  };
});
</script>

<style>
/* Règles hors couche : elles passent devant celles de Vuetify, rangées dans ses couches, sans !important. */
.ds-text-input {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-ecart-dans-composant);
}
.ds-text-input__label {
  font-family: var(--v-ds-libelle-police);
  font-size: var(--v-ds-libelle-taille);
  font-weight: var(--v-ds-libelle-graisse);
  line-height: var(--v-ds-libelle-interligne);
  color: rgb(var(--v-theme-on-background));
}
.ds-text-input__required {
  color: rgb(var(--v-ds-texte-secondaire));
}

/* Le champ : contour, hauteur, marges et texte par jeton ; ni contour, ni voile, ni animation de Vuetify. */
.ds-text-input .v-field {
  --v-input-control-height: calc(var(--v-ds-hauteur-controle-normale) - 2 * var(--v-ds-epaisseur-contour));
  --v-field-padding-start: var(--v-ds-marge-interieure-composant);
  --v-field-padding-end: var(--v-ds-marge-interieure-composant);
  --v-field-padding-top: 0px;
  --v-field-padding-bottom: 0px;
  --v-input-padding-top: 0px;
  box-sizing: border-box;
  height: var(--v-ds-hauteur-controle-normale);
  border: var(--v-ds-epaisseur-contour) solid rgb(var(--v-ds-contour));
  border-radius: var(--v-ds-arrondi-controle);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-family: var(--v-ds-corps-police);
  font-size: var(--v-ds-corps-taille);
  font-weight: var(--v-ds-corps-graisse);
  line-height: var(--v-ds-corps-interligne);
  letter-spacing: 0;
  transition: none;
}
.ds-text-input .v-field__outline,
.ds-text-input .v-field__overlay,
.ds-text-input .v-field__loader {
  display: none;
}
/* Sans emplacement par défaut, l'input est lui-même .v-field__input (VTextField.js). */
.ds-text-input input.v-field__input {
  opacity: 1;
  font: inherit;
  color: inherit;
  letter-spacing: 0;
}
.ds-text-input input.v-field__input::placeholder {
  color: rgb(var(--v-ds-texte-secondaire));
  opacity: 1;
}
/* Effacement hors menu : la croix native d'un champ de recherche n'est pas rendue. */
.ds-text-input input[type='search']::-webkit-search-cancel-button {
  appearance: none;
  display: none;
}

/* Icône avant le texte, muette ; l'écart jusqu'au texte est la marge de début de l'input. */
.ds-text-input .v-field.v-field--prepended {
  --v-field-padding-start: var(--v-ds-ecart-icone-texte);
  padding-inline-start: var(--v-ds-marge-interieure-composant);
}
.ds-text-input .v-field__prepend-inner {
  padding-inline-end: 0;
  color: rgb(var(--v-theme-on-surface));
}
.ds-text-input__icon,
.ds-text-input__icon > svg {
  display: block;
  width: var(--v-ds-taille-icone-normale);
  height: var(--v-ds-taille-icone-normale);
}

/* Focus : l'anneau du bouton, décalé sur le fond (DS2) ; le contour, d'erreur compris, reste visible. */
.ds-text-input .v-field:has(input:focus-visible) {
  outline: var(--v-ds-epaisseur-focus) solid rgb(var(--v-ds-focus));
  outline-offset: var(--v-ds-decalage-focus);
}

/* Erreur : le contour prend la couleur d'erreur, au repos comme au focus. */
.ds-text-input--error .v-field {
  border-color: rgb(var(--v-ds-contour-erreur));
}

/* Désactivé : apparence par jetons, sans l'opacité de Vuetify. */
.ds-text-input .v-field.v-field--disabled {
  opacity: 1;
  background: rgb(var(--v-theme-desactive));
  color: rgb(var(--v-theme-on-desactive));
  border-color: rgb(var(--v-ds-contour-desactive));
}
.ds-text-input .v-field--disabled .v-field__prepend-inner {
  color: rgb(var(--v-theme-on-desactive));
}

/* Aide et erreur, sous le champ ; le parent porte l'écart (DS3). */
.ds-text-input__hint,
.ds-text-input__error {
  margin: 0;
  font-family: var(--v-ds-mention-police);
  font-size: var(--v-ds-mention-taille);
  font-weight: var(--v-ds-mention-graisse);
  line-height: var(--v-ds-mention-interligne);
}
.ds-text-input__hint {
  color: rgb(var(--v-ds-texte-secondaire));
}
.ds-text-input__error {
  color: rgb(var(--v-ds-texte-erreur));
}
/* Aide sous une erreur : hors de la vue et du flux, toujours lue. */
.ds-text-input__hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
