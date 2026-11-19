// Composant d'icône tiré d'un chemin SVG tracé sur une grille de 24 × 24 : celui de Material Design Icons (@mdi/js, D52)
// ou tout autre. La couleur suit le texte (currentColor) ; la taille et le silence (aria-hidden) sont ceux de la boîte que
// pose l'enveloppe. Pas de VIcon : il demanderait un jeu d'icônes déclaré à Vuetify et imposerait sa propre taille.
import { h } from 'vue';

/**
 * @param {string} chemin attribut d du tracé, sur 24 × 24
 * @returns {() => import('vue').VNode} composant fonctionnel, à passer à l'option icone d'une enveloppe
 */
export const icone = (chemin) => () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', focusable: 'false' }, [h('path', { d: chemin })]);
