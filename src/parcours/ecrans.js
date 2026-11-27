// @ts-check
/**
 * Les écrans du parcours (D77) et leur gabarit, commun à tous les écrans (D88) : le fil en haut (« ds-lab », vers le
 * départ, puis les quatre temps, faits, ici ou pas encore), un titre et une phrase, le contenu borné à la largeur d'une
 * page ; ni barre ni bouton pour changer d'écran : le chat porte ce passage (D92). Sombre seul ; ce qui vient du site
 * (vignettes, captures, couleurs et exemples relevés) est sur papier, le mode clair des mêmes rôles. Les écrans : le
 * lancement (avant le projet, et le départ revu), les pages à mesurer (un groupe par site), la mesure en cours, la dette,
 * la marque, l'écriture des tokens, les fondations, les composants à ta marque et leurs fiches, la revue revue, l'avant
 * et après, la remise et le guide de migration.
 * Un temps fait se revoit (`/?voir=<écran>`) : l'écran en lecture seule, sans formulaire, avec « Revenir où j'en suis ».
 * Sans script : ce qui change l'écran (retirer, ajouter une page, changer une couleur, copier le message) est un
 * formulaire envoyé au serveur du parcours (serveur.js). Valeurs :
 * les variables des jetons communs (jetons.js) ; le style écrit ici ne porte que des variables, des mots-clés, 0 et
 * 100 %, comme un module (D61). La page n'a pas de marque : l'anneau de focus prend le texte d'information, pas
 * border.focus, qui pointe sur la marque. Toute chaîne venue du projet ou de la saisie est échappée.
 */
import { deNom, enLettres, esc, fr, liste as listeFr } from '../lib/format.js';
import { variablesDeLaPage } from './jetons.js';
import { echelleDeLaTroisieme } from './marque.js';
import { nomAffiche } from '../lib/echelles.js';
import { entrees, message } from './remise.js';
import { COMPOSANTS, INTENTIONS, composantDuType } from './diapason.js';

/** @typedef {import('./etat.js').Etat} Etat */
/** @typedef {{ site: string, message: string, saisie: string }} ErreurAjout  le refus d'une page ajoutée */

export const DEBUT_JETONS = '/* jetons : écrits depuis tokens/commun/ */';
export const FIN_JETONS = '/* fin des jetons */';

/** Les cinq propriétés d'un style de texte. @param {string} s */
export const style = (s) =>
  ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height'].map((p) => `${p}: var(--typography-${s}-${p});`).join(' ');

/**
 * Le bloc des jetons (D88) : la page en sombre seul, quel que soit le réglage du système ; le papier, ce qui vient du
 * site, prend les couleurs claires des mêmes rôles.
 */
export function blocJetons() {
  const v = variablesDeLaPage();
  const sombre = new Map(v.sombre);
  /** @param {[string, string][]} l */
  const decl = (l) => l.map(([n, x]) => `${n}: ${x};`).join(' ');
  return `${DEBUT_JETONS}
:root { ${decl(v.clair.map(([n, x]) => [n, sombre.get(n) ?? x]))} color-scheme: dark; }
.papier { ${decl(v.clair.filter(([n]) => sombre.has(n)))} color-scheme: light; }
${FIN_JETONS}`;
}

/** Le style du fil (D88), commun aux écrans et à la page du parcours. */
export const FIL_CSS = `
.fil { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-between-blocks) var(--gap-between-groups); padding-bottom: var(--gap-between-components); border-bottom: var(--border-width-default) solid var(--border-subtle); }
.fil .accueil { display: flex; align-items: center; gap: var(--gap-between-blocks); color: var(--text-default); text-decoration: none; white-space: nowrap; ${style('body-medium')} font-weight: bold; }
.fil .accueil:hover { text-decoration: underline; }
.signe rect { fill: var(--text-secondary); }
.signe .un { fill: var(--text-info); }
.signe .quatre { fill: var(--text-default); }
.fil ol { display: flex; flex: auto; flex-wrap: wrap; align-items: center; row-gap: var(--gap-between-blocks); min-width: 0; margin: 0; padding: 0; list-style: none; }
.fil li { display: flex; flex: auto; align-items: center; gap: var(--gap-between-blocks); color: var(--text-secondary); white-space: nowrap; ${style('label')} }
.fil li:last-child { flex: none; }
.fil .trait { flex: auto; min-width: var(--gap-between-blocks); height: var(--border-width-default); margin: 0 var(--gap-between-blocks); background: var(--border-default); }
.fil a { display: flex; align-items: center; gap: var(--gap-between-blocks); color: var(--text-default); text-decoration: none; }
.fil a:hover { text-decoration: underline; }
.fil a:focus-visible { outline: var(--border-width-focus) solid var(--text-info); outline-offset: var(--offset-focus); }
.pt { display: flex; flex: none; align-items: center; justify-content: center; width: var(--height-control-small); height: var(--height-control-small); border: var(--border-width-default) solid var(--border-default); border-radius: var(--border-radius-full); }
.fil .fait .pt { border-color: var(--background-inverse); background: var(--background-inverse); color: var(--text-on-inverse); }
.fil .ici { color: var(--text-default); }
.fil .ici .pt { border: var(--border-width-focus) solid var(--border-info); color: var(--text-info); }
.fil .nomme { display: flex; flex-direction: column; }
.fil .nomme small { color: var(--text-info); }
`;

const CSS = `
* { box-sizing: border-box; }
html { height: 100%; }
body { display: flex; flex-direction: column; min-height: 100%; margin: 0; background: var(--background-app); color: var(--text-default); ${style('body-medium')} }
main { display: flex; flex-direction: column; gap: var(--gap-between-groups); flex: auto; width: 100%; max-width: var(--width-page); margin: 0 auto; padding: var(--gap-between-groups) var(--padding-component); }
h1, h2, h3, p, ul, ol { margin: 0; }
ul, ol { list-style: none; padding: 0; }
h1 { ${style('heading-1')} }
h2 { ${style('heading-3')} }
small { display: block; color: var(--text-secondary); ${style('body-small')} }
.papier { background: var(--background-app); color: var(--text-default); }
.tete { display: flex; flex-direction: column; gap: var(--gap-between-blocks); }
.revoir { display: flex; flex-wrap: wrap; gap: var(--gap-within-component) var(--gap-between-blocks); color: var(--text-secondary); ${style('label')} }
.revoir a { color: var(--text-info); }
.revoir [aria-current] { color: var(--text-default); }
.etapes, .groupes { display: flex; flex-direction: column; gap: var(--gap-between-components); }
.etape { display: flex; align-items: flex-start; gap: var(--gap-between-components); padding: var(--padding-component); border: var(--border-width-default) solid var(--border-subtle); border-radius: var(--border-radius-surface); background: var(--background-surface); }
.num { display: flex; flex: none; align-items: center; justify-content: center; width: var(--height-control-small); height: var(--height-control-small); border-radius: var(--border-radius-full); background: var(--background-inverse); color: var(--text-on-inverse); ${style('label')} }
.corps { display: flex; flex: auto; flex-direction: column; gap: var(--gap-within-component); }
.etape h3 { ${style('label')} }
.toi { color: var(--text-secondary); }
.picto { flex: none; color: var(--text-secondary); }
.ou { display: flex; flex-direction: column; gap: var(--gap-between-blocks); }
.ligne { display: flex; align-items: center; gap: var(--gap-between-components); padding: var(--gap-between-blocks) var(--padding-tag); border: var(--border-width-default) solid var(--border-subtle); border-radius: var(--border-radius-control); background: var(--background-surface); }
.etat { flex: none; color: var(--text-secondary); ${style('label')} }
.etat.en-cours { color: var(--text-info); }
.etat.fait { color: var(--text-default); }
.etat.refus { color: var(--text-error); }
.encart { padding: var(--gap-between-blocks) var(--padding-component); border-radius: var(--border-radius-surface); background: var(--background-subtle); }
.site { display: flex; flex-direction: column; gap: var(--gap-between-blocks); }
.site header { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--gap-within-component) var(--gap-between-blocks); }
.pages { display: flex; flex-direction: column; gap: var(--gap-between-blocks); }
.page { display: flex; align-items: center; gap: var(--gap-between-components); padding: var(--gap-between-blocks) var(--padding-tag); border: var(--border-width-default) solid var(--border-subtle); border-radius: var(--border-radius-control); background: var(--background-surface); }
.vignette { flex: none; width: var(--avatar-size-large); height: var(--avatar-size-medium); object-fit: cover; object-position: top; border: var(--border-width-default) solid var(--border-subtle); border-radius: var(--border-radius-control); background: var(--background-subtle); }
.nom { display: flex; flex: auto; flex-direction: column; min-width: 0; }
.nom small { overflow-wrap: anywhere; }
form { margin: 0; }
button, input { font: inherit; }
button { min-height: var(--height-control-medium); padding: 0 var(--padding-component); border: var(--border-width-default) solid var(--border-default); border-radius: var(--border-radius-control); background: var(--background-surface); color: var(--text-default); cursor: pointer; ${style('label')} }
button.retirer { min-height: var(--height-control-small); padding: 0 var(--padding-tag); }
button.principal { background: var(--background-interactive-strong); border-color: var(--background-interactive-strong); color: var(--text-on-interactive); }
button.principal:hover:enabled { background: var(--background-interactive-strong-hover); border-color: var(--background-interactive-strong-hover); }
button:disabled { background: var(--background-subtle); border-color: var(--border-subtle); color: var(--text-secondary); cursor: default; }
button:focus-visible, input:focus-visible { outline: var(--border-width-focus) solid var(--text-info); outline-offset: var(--offset-focus); }
.ajout { display: flex; flex: auto; flex-wrap: wrap; align-items: flex-end; gap: var(--gap-between-blocks); }
.ajout label { display: flex; flex: auto; flex-direction: column; gap: var(--gap-within-component); min-width: 0; ${style('label')} }
.ajout input { width: 100%; min-height: var(--height-control-medium); padding: 0 var(--padding-tag); border: var(--border-width-default) solid var(--border-default); border-radius: var(--border-radius-control); background: var(--background-surface); color: var(--text-default); ${style('body-medium')} }
.erreur { flex-basis: 100%; color: var(--text-error); ${style('label')} }
.revenir { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--gap-within-component) var(--gap-between-blocks); }
.blocs { display: flex; flex-direction: column; gap: var(--gap-section); }
.bloc { display: flex; flex-direction: column; gap: var(--gap-between-components); }
.titre-bloc { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--gap-between-blocks) var(--gap-between-components); }
.titre-bloc a, .autres a { color: var(--text-info); ${style('label')} }
.fort { display: block; ${style('display-medium')} }
.total { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--gap-between-components) var(--gap-between-groups); }
.total .cote { display: flex; flex-direction: column; color: var(--text-secondary); ${style('label')} }
.grand { color: var(--text-default); ${style('display-medium')} }
.parts { flex: auto; width: var(--width-column); max-width: 100%; border-collapse: collapse; table-layout: fixed; }
.parts td { padding: 0; vertical-align: top; }
.parts .longueurs td { height: var(--gap-between-blocks); border-left: var(--border-width-focus) solid var(--background-app); background: var(--text-default); }
.parts .longueurs td:first-child { border-left: 0; }
.parts tr + tr td { padding: var(--gap-between-blocks) var(--gap-within-component) 0 0; hyphens: auto; overflow-wrap: anywhere; color: var(--text-secondary); ${style('body-small')} }
.parts b { color: var(--text-default); }
.groupe { display: flex; flex-direction: column; gap: var(--gap-between-components); }
.rangs { display: grid; grid-template-columns: max-content auto; }
.rang { display: contents; }
.rang > * { padding: var(--gap-between-components) 0; border-top: var(--border-width-default) solid var(--border-subtle); }
.rang .cote { display: flex; flex-direction: column; gap: var(--gap-within-component); }
.rang .n { ${style('heading-1')} }
.rang h3 { ${style('body-medium')} font-weight: bold; }
.rang .cote small { width: 0; min-width: 100%; }
.rang .preuve { display: flex; flex-direction: column; justify-content: center; gap: var(--gap-within-component); min-width: 0; padding-left: var(--gap-between-groups); }
.ruban { overflow: hidden; border-radius: var(--border-radius-control); }
.ruban svg { display: block; width: 100%; height: var(--height-control-medium); }
.captures { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-between-components); }
.captures img { max-width: 100%; max-height: var(--avatar-size-large); width: auto; }
/* Le dessin d'une version dont l'image n'a pas pu être prise (D104) : un cadre et une ligne, aux couleurs des jetons. */
.sans-image { flex: none; width: var(--avatar-size-large); height: var(--height-control-medium); }
.sans-image .cadre { fill: var(--background-subtle); stroke: var(--border-subtle); }
.sans-image .ligne { fill: var(--text-secondary); }
.deux { display: flex; flex-wrap: wrap; gap: var(--gap-between-components); }
.deux > div { display: flex; flex: auto; flex-direction: column; gap: var(--gap-within-component); min-width: 0; }
/* Le composant garde sa taille : quand la largeur manque, il défile dans son papier, la page ne défile pas. */
.vitrine { overflow-x: auto; border-radius: var(--border-radius-control); }
.vitrine img { display: block; max-width: none; }
.versions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-between-components); }
.versions img { max-width: 100%; height: auto; }
.pas-encore { display: flex; width: 0; min-width: 100%; align-items: center; gap: var(--gap-within-component); color: var(--text-warning); ${style('label')} }
.pas-encore i { width: var(--gap-between-blocks); height: var(--gap-between-blocks); border-radius: var(--border-radius-full); background: currentcolor; }
.fiches { display: flex; flex-wrap: wrap; gap: var(--gap-within-component) var(--gap-between-components); ${style('label')} }
.fiches a { color: var(--text-info); }
.fiches [aria-current] { color: var(--text-default); }
.document .tableau { overflow-x: auto; }
.document table { border-collapse: collapse; ${style('body-small')} }
.document th, .document td { padding: var(--gap-within-component) var(--gap-between-blocks); border-bottom: var(--border-width-default) solid var(--border-subtle); text-align: left; vertical-align: top; }
.document th { color: var(--text-secondary); }
.pied { color: var(--text-secondary); ${style('body-small')} }
.dessins { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--gap-between-blocks) var(--padding-tag); }
.dessins li { display: flex; flex-direction: column; align-items: center; gap: var(--gap-within-component); }
.dessins small { color: var(--text-secondary); }
.dessins .hors small { color: var(--text-info); ${style('label')} }
.tailles text { fill: var(--text-default); }
.tailles .hors text { fill: var(--text-info); }
.ecarts rect { fill: var(--background-inverse); }
.ecarts .hors rect { fill: var(--text-info); }
.rayons path { fill: var(--background-subtle); stroke: var(--text-default); }
.marque .cote code { ${style('heading-3')} }
.marque .cote h2 { ${style('body-medium')} font-weight: bold; }
.marque .preuve { gap: var(--gap-between-blocks); }
.marque .diapason > * { padding-top: 0; border-top: 0; }
.marque .titre-rangs > * { padding: var(--gap-between-groups) 0 var(--gap-between-components); border-top: 0; }
.fondations .titre-rangs > * { padding: var(--gap-section) 0 var(--gap-between-components); border-top: 0; }
.fondations .titre-rangs:first-child > * { padding-top: 0; }
/* Le titre d'un groupe ne règle pas la largeur de la colonne : il déborde sur la cellule vide de sa ligne. */
.fondations .titre-rangs h2 { width: 0; min-width: 100%; white-space: nowrap; }
.specimen { display: block; }
.echantillons { max-width: 100%; }
.echantillons svg { max-width: 100%; height: auto; }
.pas { display: flex; flex-direction: column; gap: var(--gap-within-component); }
.repere { display: block; width: 100%; height: var(--gap-within-component); }
.repere rect { fill: var(--text-default); }
.ligne-modifier { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: var(--gap-between-blocks) var(--gap-between-components); }
.ligne-modifier .modifier[open] { flex-basis: 100%; }
.discret { color: var(--text-secondary); }
.troisieme { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-between-blocks) var(--gap-between-components); }
.verdict { display: inline-flex; align-items: center; gap: var(--gap-between-blocks); }
.verdict i { width: var(--gap-between-blocks); height: var(--gap-between-blocks); border-radius: var(--border-radius-full); background: currentcolor; }
.voir { color: var(--text-info); ${style('label')} }
.echantillons { display: flex; flex-wrap: wrap; gap: var(--gap-between-components); }
.refus { color: var(--text-error); ${style('label')} }
.accepte { color: var(--text-info); ${style('label')} }
details summary { cursor: pointer; color: var(--text-info); ${style('label')} }
.police text { fill: var(--text-default); }
.modifier { display: flex; flex-direction: column; gap: var(--gap-between-blocks); }
.choix { display: flex; flex-wrap: wrap; gap: var(--gap-within-component); }
.choix button { min-height: 0; padding: 0; border: 0; background: none; line-height: 0; }
.choix button[aria-pressed="true"] rect { stroke: var(--text-default); stroke-width: var(--border-width-focus); }
.chiffres { display: flex; flex-wrap: wrap; gap: var(--gap-between-blocks) var(--gap-between-groups); }
.chiffres li { display: flex; align-items: baseline; gap: var(--gap-within-component); color: var(--text-secondary); ${style('label')} }
.chiffres .fort { color: var(--text-default); ${style('heading-3')} }
.relations { display: flex; flex-direction: column; gap: var(--gap-between-blocks); }
.relations li { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-within-component) var(--gap-between-blocks); }
.planches { display: flex; flex-wrap: wrap; gap: var(--gap-between-blocks) var(--gap-between-components); }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-between-blocks); }
.comparer { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-between-blocks); }
.comparer input { position: absolute; opacity: 0; pointer-events: none; }
.comparer label { display: inline-flex; align-items: center; min-height: var(--height-control-medium); padding: 0 var(--padding-component); border: var(--border-width-default) solid var(--border-default); border-radius: var(--border-radius-control); background: var(--background-surface); cursor: pointer; ${style('label')} }
.comparer input:checked + label { background: var(--background-inverse); border-color: var(--background-inverse); color: var(--text-on-inverse); }
.comparer input:focus-visible + label { outline: var(--border-width-focus) solid var(--text-info); outline-offset: var(--offset-focus); }
.vues { flex-basis: 100%; }
.vue { display: none; flex-wrap: wrap; align-items: center; gap: var(--gap-between-blocks); }
.cadre { position: relative; flex-basis: 100%; overflow: hidden; border: var(--border-width-default) solid var(--border-subtle); border-radius: var(--border-radius-surface); background: var(--background-subtle); }
.cadre img { display: block; width: 100%; height: auto; }
.cadre .dessus { position: absolute; top: 0; left: 0; }
.voir-avant:checked ~ .cadre .apres, .voir-apres:checked ~ .cadre .avant { visibility: hidden; }
.sous-image { display: flex; flex-basis: 100%; flex-wrap: wrap; align-items: baseline; gap: var(--gap-within-component) var(--gap-between-components); }
.legende { color: var(--text-secondary); }
.voir-avant:checked ~ .sous-image .legende.apres, .voir-apres:checked ~ .sous-image .legende.avant { display: none; }
.devient { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-within-component) var(--gap-between-blocks); }
.endroits { display: flex; flex-direction: column; gap: var(--gap-within-component); }
.document { display: flex; flex-direction: column; gap: var(--gap-between-blocks); }
.document h2 { margin-top: var(--gap-between-components); }
.document h3 { margin-top: var(--gap-between-blocks); ${style('body-medium')} font-weight: bold; }
.document h4 { margin: 0; ${style('label')} }
.document ul { display: flex; flex-direction: column; gap: var(--gap-within-component); padding-left: var(--gap-between-groups); list-style: disc; }
.document li, .document p { overflow-wrap: anywhere; }
.document pre { margin: 0; padding: var(--gap-between-blocks) var(--padding-tag); overflow-x: auto; border-radius: var(--border-radius-control); background: var(--background-subtle); }
.retour { color: var(--text-info); ${style('label')} }
.direct { margin-left: auto; color: var(--text-info); ${style('label')} }
.mot { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--gap-between-components) var(--gap-between-groups); }
.copier { display: flex; flex-direction: column; gap: var(--gap-between-blocks); }
.mot .message { flex: auto; flex-basis: var(--width-column); }
.message { display: flex; flex-direction: column; gap: var(--gap-between-blocks); padding: var(--gap-between-blocks) var(--padding-tag); border: var(--border-width-default) solid var(--border-subtle); border-radius: var(--border-radius-control); background: var(--background-surface); }
.apport { display: flex; flex-wrap: wrap; gap: var(--gap-between-components) var(--gap-between-groups); }
.apport li { display: flex; flex: auto; flex-basis: 0; flex-direction: column; color: var(--text-secondary); ${style('label')} }
/* Le chiffre ne se coupe pas : un chiffre qui ne tient plus passe à la ligne avec sa phrase. */
.apport .grand { white-space: nowrap; }
.arbre { display: grid; grid-template-columns: max-content auto; gap: var(--gap-within-component) var(--gap-between-components); margin: 0; }
.arbre dd { margin: 0; overflow-wrap: anywhere; color: var(--text-secondary); }
.papier-bloc { padding: var(--gap-between-blocks) var(--padding-tag); border-radius: var(--border-radius-control); }
iframe.revue { flex: auto; width: 100%; border: 0; border-radius: var(--border-radius-surface); background: var(--background-surface); }
${FIL_CSS}`;

/** Les quatre temps du fil (D88). */
const TEMPS = /** @type {const} */ (['Mesurer', 'Décider', 'Vérifier', 'Remettre']);

/** Les écrans qui se revoient, leur temps et leur nom, dans l'ordre du parcours (D88). */
const REVUS = /** @type {const} */ ({
  pages: [0, 'Les pages'],
  dette: [1, 'La dette'],
  marque: [1, 'La marque'],
  fondations: [1, 'Les fondations'],
  composants: [1, 'Les composants'],
  revue: [1, 'La revue'],
  'avant-apres': [2, 'Avant, après'],
});

/** Le temps et le nom de l'écran de chaque moment qui a son écran. */
const ICI = /** @type {Record<string, [number, string]>} */ ({
  pages: [0, 'Les pages'],
  mesure: [0, 'La mesure'],
  dette: [1, 'La dette'],
  marque: [1, 'La marque'],
  jetons: [1, 'Les fondations'],
  fondations: [1, 'Les fondations'],
  composants: [1, 'Les composants'],
  'avant-apres': [2, 'Avant, après'],
  remise: [3, 'La remise'],
});

/** Le nom de l'écran d'une étape, quand le moment n'a pas d'écran à lui (la page du parcours). */
const PAR_ETAPE = /** @type {Record<string, string>} */ ({ site: 'Les pages', constat: 'La mesure', marques: 'La marque', decisions: 'La revue', livraison: 'La livraison', suivi: 'La remise' });

/** Le signe de ds-lab : quatre carrés, le premier bleu, le dernier arrondi. */
const SIGNE =
  '<svg class="signe" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect class="un" x="1" y="1" width="8" height="8" rx="2"/><rect x="11" y="1" width="8" height="8" rx="2"/><rect x="1" y="11" width="8" height="8" rx="2"/><rect class="quatre" x="11" y="11" width="8" height="8" rx="4"/></svg>';

/** La coche d'un temps fait. */
const COCHE =
  '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7"/></svg>';

/**
 * Le fil (D88) : « ds-lab » vers le départ, puis les quatre temps. Fait : pastille pleine, un lien pour revoir quand le
 * temps a un écran à revoir. Ici : pastille cerclée, le nom de l'écran sous le temps. Pas encore : pastille vide.
 * @param {{ ici: number, ecran: string, revoir: (string | null)[], depart: string }} f  ici : -1 avant le premier temps
 */
function filHtml(f) {
  const items = TEMPS.map((nom, i) => {
    const trait = i < TEMPS.length - 1 ? '<span class="trait" aria-hidden="true"></span>' : '';
    if (i < f.ici) {
      const h = f.revoir[i];
      return h
        ? `<li class="fait"><a href="${esc(h)}" aria-label="${esc(`${nom}, fait, revoir`)}"><span class="pt">${COCHE}</span>${esc(nom)}</a>${trait}</li>`
        : `<li class="fait"><span class="pt" role="img" aria-label="fait">${COCHE}</span>${esc(nom)}${trait}</li>`;
    }
    if (i === f.ici) return `<li class="ici" aria-current="step"><span class="pt">${i + 1}</span><span class="nomme">${esc(nom)}<small>${esc(f.ecran)}</small></span>${trait}</li>`;
    return `<li><span class="pt">${i + 1}</span>${esc(nom)}${trait}</li>`;
  });
  return `<nav class="fil" aria-label="Les étapes"><a class="accueil" href="${esc(f.depart)}" aria-label="ds-lab, retour au départ">${SIGNE}ds-lab</a><ol>${items.join('')}</ol></nav>`;
}

/**
 * Le fil d'un projet : le temps et l'écran du moment ; un lien vers le dernier écran de chaque temps fait.
 * @param {Etat} e @param {string} [ecran]  le nom de l'écran, quand ce n'est pas celui du moment
 */
export function filDe(e, ecran) {
  const [ici, nom] = ICI[e.moment] ?? [Math.max(0, TEMPS.indexOf(/** @type {any} */ (e.courante.temps))), PAR_ETAPE[e.courante.cle] ?? e.courante.nom];
  const revoir = TEMPS.map((_, i) => {
    const k = [...e.revoir].reverse().find((x) => REVUS[x][0] === i);
    return k ? `/?voir=${k}` : null;
  });
  return filHtml({ ici, ecran: ecran ?? nom, revoir, depart: '/?voir=depart' });
}

/**
 * Revoir un écran (D88) : le temps revu, et ses écrans à revoir, celui-ci sans lien.
 * @typedef {{ temps: string, ecrans: { nom: string, href: string | null }[] }} Lecture
 * @param {Etat} e @param {keyof typeof REVUS} cle
 * @returns {Lecture}
 */
export function lectureDe(e, cle) {
  const t = REVUS[cle][0];
  return { temps: TEMPS[t], ecrans: e.revoir.filter((k) => REVUS[k][0] === t).map((k) => ({ nom: REVUS[k][1], href: k === cle ? null : `/?voir=${k}` })) };
}

/**
 * Le gabarit d'un écran (D88) : le fil, un titre, une phrase ; en lecture seule, les écrans du temps revu, et
 * « Revenir où j'en suis » à la place de l'action.
 * Ni barre ni bouton pour changer d'écran (D92) : l'écran porte ce qui change l'écran, le chat ce qui change d'écran.
 * @param {{ titre: string, onglet: string, phrase: string, sousTete?: string, fil: string, corps: string,
 *   rafraichir?: boolean, regles?: string, lecture?: Lecture | null }} o
 *   regles : des règles de style propres à l'écran, aux mêmes valeurs que le reste (variables, mots-clés)
 */
function gabarit(o) {
  const l = o.lecture;
  const revoir = l
    ? `<p class="revoir">${esc(`Tu revois ${l.temps}${l.ecrans.length > 1 ? ' :' : '.'}`)}${l.ecrans.length > 1 ? l.ecrans.map((x) => (x.href ? `<a href="${esc(x.href)}">${esc(x.nom)}</a>` : `<span aria-current="page">${esc(x.nom)}</span>`)).join('') : ''}</p>`
    : '';
  const retour = l ? '<p class="revenir"><a class="retour" href="/">Revenir où j’en suis</a><small>Rien ne change ici : ce qui est fait reste fait.</small></p>' : '';
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${o.rafraichir && !l ? '<meta http-equiv="refresh" content="2">\n' : ''}<title>${esc(o.onglet)}</title>
<style>
${blocJetons()}${CSS}${o.regles ?? ''}</style>
</head>
<body>
<main>
${o.fil}
<div class="tete">${revoir}<h1>${esc(o.titre)}</h1><p>${esc(o.phrase)}</p>${retour}${o.sousTete ?? ''}</div>
${o.corps}
</main>
</body>
</html>
`;
}

/**
 * Les pictogrammes du départ (D93), dessinés pour ds-lab, au trait, en currentColor : une règle (mesurer), un
 * embranchement (décider), un œil (vérifier), un dossier (remettre).
 */
const PICTOS = [
  '<path d="M3 8h18v8H3z"/><path d="M7 8v3M11 8v4M15 8v3M19 8v4"/>',
  '<path d="M12 21v-7"/><path d="M12 14 6 8M12 14l6-6"/><path d="M6 8V4M18 8V4"/>',
  '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  '<path d="M3 6h7l2 2h9v11H3z"/><path d="M12 11v5M9.5 13.5 12 16l2.5-2.5"/>',
].map((d) => `<svg class="picto" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`);

/** Ce que fait chaque temps, et ce que tu y fais : là où l'humain décide (D93). */
const QUATRE = [
  ['Mesurer', 'Ce que tes pages affichent vraiment : les couleurs, les espacements, les tailles, les composants.', 'Tu choisis les pages.'],
  ['Décider', 'Ta marque, puis les cas qu’aucune règle ne sait trancher.', 'Tu confirmes ta marque, puis tu tranches ces cas un par un.'],
  ['Vérifier', 'Le résultat arrive à côté de l’ancien code, page par page, avant et après. Rien n’est écrasé.', 'Tu valides le rendu.'],
  ['Remettre', 'Un dossier et un message pour le développeur : quatre étapes, chacune vérifiable.', 'Tu donnes le dossier au développeur.'],
];

/**
 * Le départ (D93) : avant toute adresse, et donc avant le projet. La promesse en titre, quatre temps, ce que fait
 * l'outil et ce que tu fais ; l'adresse se demande dans le chat, l'écran ne la redit pas. Il se recharge seul jusqu'à ce
 * que le projet existe. Avec l'état d'un projet, c'est le départ revu (« ds-lab » dans le fil) : en lecture seule.
 * @param {Etat} [e]
 */
export function ecranDeLancement(e) {
  const etapes = QUATRE.map(
    ([nom, texte, toi], i) =>
      `<li class="etape"><span class="num" aria-hidden="true">${i + 1}</span><div class="corps"><h3>${esc(nom)}</h3><p>${esc(texte)}</p><small class="toi">${esc(toi)}</small></div>${PICTOS[i]}</li>`,
  ).join('\n');
  return gabarit({
    titre: 'D’un site existant à un design system, sans chantier interminable.',
    onglet: 'Le parcours',
    phrase: 'Quatre temps. Tu décides trois fois ; l’outil fait le reste et te montre ce qu’il a fait.',
    fil: e ? filDe(e) : filHtml({ ici: -1, ecran: '', revoir: [], depart: '/' }),
    lecture: e ? { temps: 'le départ', ecrans: [] } : null,
    corps: `<section class="bloc" aria-labelledby="t-parcours"><h2 id="t-parcours">Le parcours</h2>
<ol class="etapes">\n${etapes}\n</ol></section>
<p><small>Plus tard, une commande à part remesurera ton site, pour suivre la migration.</small></p>`,
    rafraichir: true,
  });
}

/**
 * « Où j'en suis » (D93) : une ligne par chose en cours de préparation, son nom, ce qu'elle est, son état.
 * @param {import('./etat.js').Ligne[]} lignes @param {string} [titre]  le nom d'un site, quand il y en a plusieurs
 */
const ouJenSuis = (lignes, titre) =>
  `${titre ? `<h3>${esc(titre)}</h3>` : ''}<ul class="ou">${lignes
    .map(
      (l) =>
        `<li class="ligne"><span class="nom"><strong>${esc(l.nom)}</strong><small>${esc(l.detail)}</small></span><span class="etat${l.etat === 'En cours' ? ' en-cours' : l.etat === 'Mesurée' || l.etat === 'Fait' ? ' fait' : /^Pas /.test(l.etat) ? ' refus' : ''}">${esc(l.etat)}</span></li>`,
    )
    .join('')}</ul>`;

/**
 * Le dessin d'une page, quand sa capture échoue : un titre, une ligne, trois blocs, aux couleurs des jetons communs.
 * @returns {string} une image SVG
 */
export function dessinDeVignette() {
  const v = Object.fromEntries(variablesDeLaPage().clair);
  const [fond, trait, titre] = [v['--background-subtle'], v['--border-subtle'], v['--text-secondary']];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 48"><rect width="72" height="48" fill="${fond}"/><rect x="6" y="6" width="30" height="5" rx="2" fill="${titre}"/><rect x="6" y="15" width="60" height="5" rx="2" fill="${trait}"/><rect x="6" y="24" width="18" height="18" rx="2" fill="${trait}"/><rect x="27" y="24" width="18" height="18" rx="2" fill="${trait}"/><rect x="48" y="24" width="18" height="18" rx="2" fill="${trait}"/></svg>`;
}

/**
 * Le dessin d'une version dont l'image n'a pas pu être prise, à la place de l'image (D104) ; le titre dit pourquoi.
 * @param {string} nom @param {{ nom: string, fois: number, imageTombee?: string }} x
 */
const sansImage = (nom, x) =>
  `<svg class="sans-image" viewBox="0 0 72 32" role="img" aria-label="${esc(`${nom}, ${x.nom} : image non prise`)}"><title>${esc(`${x.nom}, ${fois(x.fois)} ; image non prise : ${x.imageTombee}`)}</title><rect class="cadre" x="1" y="1" width="70" height="30" rx="6"/><rect class="ligne" x="16" y="13" width="40" height="6" rx="3"/></svg>`;

/**
 * La mesure en cours (D77, D93) : « Où j'en suis », une ligne par page (Mesurée, En cours, À faire, ou Pas mesurée),
 * puis le relevé des composants, lus dans le fichier d'avancement. Il se recharge seul, et passe seul à l'écran
 * suivant quand la mesure est faite ; arrêtée, il dit pourquoi et quoi faire (D104).
 * @param {Etat} e
 */
export function ecranDeMesure(e) {
  const n = e.sites.reduce((t, s) => t + s.pages.length, 0);
  const pages = n > 1 ? `tes ${n} pages` : 'ta page';
  // Une mesure arrêtée le dit, et dit quoi faire ; l'écran se recharge toujours, pour la mesure relancée (D104).
  const arret = e.mesure?.arret ?? null;
  return gabarit({
    titre: arret ? `La mesure de ${pages} s’est arrêtée` : `Je mesure ${pages}`,
    onglet: `La mesure · ${e.produit}`,
    phrase: arret
      ? `${arret} Dis-le dans le chat : on relance la mesure, ou on retire la page en cause.`
      : 'Les couleurs, les tailles de texte, les espacements, les arrondis et les composants. L’écran passe seul à la suite quand tout est mesuré.',
    fil: filDe(e),
    corps: `<section class="bloc" aria-labelledby="t-ou"><h2 id="t-ou">Où j’en suis</h2>
${(e.mesure?.sites ?? []).map((x) => ouJenSuis([...x.pages, x.composants], e.unSite ? undefined : x.nom)).join('\n')}</section>`,
    rafraichir: true,
  });
}

/** L'adresse d'une vignette. @param {string} id @param {string} chemin */
const hrefVignette = (id, chemin) => `/vignette/${encodeURIComponent(id)}?page=${encodeURIComponent(chemin)}`;

/**
 * Les pages à mesurer : un groupe par site, les pages retenues en lignes, retirer, et « Ajouter une page » en dernière
 * ligne. Ni barre ni bouton de mesure : la mesure se lance dans le chat (D89). Revues, les pages mesurées, sans retirer
 * ni ajouter.
 * @param {Etat} e
 * @param {{ sites: import('./projet.js').Site[], erreur?: ErreurAjout | null, lecture?: Lecture | null }} o
 */
export function ecranDesPages(e, { sites, erreur = null, lecture = null }) {
  const unSite = sites.length === 1;
  const hote = (/** @type {import('./projet.js').Site} */ s) => new URL(s.origine).host;
  const groupes = sites
    .map((s) => {
      const pages = s.pages
        .map((p) => {
          const nom = s.noms[p] ?? p;
          const retirer = lecture
            ? ''
            : `<form method="post" action="/pages/retirer"><input type="hidden" name="site" value="${esc(s.id)}"><input type="hidden" name="page" value="${esc(p)}"><button type="submit" class="retirer" aria-label="${esc(`Retirer ${nom}`)}">Retirer</button></form>`;
          return `<li class="page"><img class="vignette papier" src="${esc(hrefVignette(s.id, p))}" alt=""><span class="nom"><strong>${esc(nom)}</strong><small>${esc(hote(s) + p)}</small></span>${retirer}</li>`;
        })
        .join('\n');
      const err = erreur?.site === s.id ? erreur : null;
      return `<section class="site" aria-label="${esc(s.nom ?? s.id)}">${unSite ? '' : `<header><h2>${esc(s.nom ?? s.id)}</h2><small>${esc(hote(s))}</small></header>`}
<ul class="pages">\n${pages}${lecture ? '' : `\n<li class="page"><form class="ajout" method="post" action="/pages/ajouter"><input type="hidden" name="site" value="${esc(s.id)}"><label>Ajouter une page<input type="text" name="adresse" inputmode="url" autocomplete="off" placeholder="${esc(`${hote(s)}/…`)}" value="${esc(err?.saisie ?? '')}"${err ? ' aria-invalid="true" aria-describedby="erreur-' + esc(s.id) + '"' : ''}></label><button type="submit">Ajouter</button><span class="erreur" id="erreur-${esc(s.id)}" role="status">${esc(err?.message ?? '')}</span></form></li>`}\n</ul>
</section>`;
    })
    .join('\n');
  return gabarit({
    titre: lecture ? 'Les pages mesurées' : 'Les pages à mesurer',
    onglet: `Les pages à mesurer · ${e.produit}`,
    phrase: lecture
      ? 'Les pages que la mesure a lues. Rien hors de cette liste n’a été mesuré.'
      : unSite
      ? 'Les pages les plus représentatives de ton site, celles qui portent le plus de composants. Tu peux les changer ; la mesure se lance dans le chat.'
      : `${sites.length} sites, un même produit. Pour chacun, ses pages les plus représentatives. Quand deux sites ont les mêmes modèles de page, ce sont les mêmes qui sont retenus, pour comparer. Tu peux les changer ; la mesure se lance dans le chat.`,
    fil: filDe(e),
    lecture,
    corps: `<div class="groupes">\n${groupes}\n</div>
${lecture ? '' : `<div class="encart"><strong>Rien hors de cette liste n’est mesuré.</strong><small>Une page oubliée garde sa dette, sans que personne la voie.</small></div>`}`,
  });
}

/** La valeur en px d'une longueur, ou null. @param {string} v */
const px = (v) => (/^-?[\d.]+px$/.test(v) ? Number.parseFloat(v) : null);


/** Accord en nombre : 0 et 1 au singulier. @param {number} n @param {string} un @param {string} plusieurs */
const nombre = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;

/** « 3 fois ». @param {number} n */
const fois = (n) => `${n} fois`;

/**
 * Le dessin des valeurs d'une famille, en SVG : la valeur mesurée est une donnée du dessin (couleur, taille, largeur,
 * rayon), jamais une valeur de style ; les couleurs du dessin viennent des jetons, par les classes.
 * @param {import('./dette.js').Famille} f
 */
function dessin(f) {
  const titre = (/** @type {import('./dette.js').Valeur} */ v) => `<title>${esc(`${v.valeur}, ${fois(v.fois)}`)}</title>`;
  if (f.cle === 'colors')
    // Le ruban : une tranche par couleur, la largeur de la tranche dans le repère du dessin, étiré à la largeur de la ligne.
    return `<div class="ruban"><svg viewBox="0 0 ${f.valeurs.length} 1" preserveAspectRatio="none" shape-rendering="crispEdges" role="img" aria-label="${esc(`Les ${f.valeurs.length} couleurs relevées`)}">${f.valeurs
      .map((v, i) => `<rect x="${i}" y="0" width="1" height="1" fill="${esc(v.valeur)}">${titre(v)}</rect>`)
      .join('')}</svg></div>`;
  /** @param {string} classe @param {(v: typeof f.valeurs[number]) => string} figure @param {(v: typeof f.valeurs[number]) => string} legende */
  const liste = (classe, figure, legende) =>
    `<ul class="dessins ${classe}">${f.valeurs.map((v) => `<li${v.hors ? ' class="hors"' : ''}>${figure(v)}<small>${esc(legende(v))}</small></li>`).join('')}</ul>`;
  if (f.cle === 'fontSizes')
    return liste(
      'tailles',
      (v) => {
        const t = /** @type {number} */ (px(v.valeur));
        // Le même jour sous la ligne de base pour chaque taille : les « Aa » posés sur une même ligne.
        const [l, h] = [Math.ceil(t * 1.4), Math.ceil(t) + 3];
        return `<svg width="${l}" height="${h}" viewBox="0 0 ${l} ${h}" aria-hidden="true">${titre(v)}<text x="0" y="${t}" font-size="${t}" font-weight="600">Aa</text></svg>`;
      },
      (v) => fr(/** @type {number} */ (px(v.valeur)), { decimales: 2 }),
    );
  if (f.cle === 'spacing')
    return liste(
      'ecarts',
      (v) => {
        const l = /** @type {number} */ (px(v.valeur));
        return `<svg width="${l}" height="24" viewBox="0 0 ${l} 24" aria-hidden="true">${titre(v)}<rect width="${l}" height="24" rx="2"/></svg>`;
      },
      (v) => fr(/** @type {number} */ (px(v.valeur)), { decimales: 2 }),
    );
  return liste(
    'rayons',
    (v) => {
      // Un coin de 40 px : le rayon y est borné à la moitié, comme le ferait le navigateur.
      const n = px(v.valeur);
      const r = Math.min(20, n ?? (Number.parseFloat(v.valeur) / 100) * 40);
      return `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">${titre(v)}<path d="M1 39 V${1 + r} A${r} ${r} 0 0 1 ${1 + r} 1 H39" stroke-width="2"/></svg>`;
    },
    (v) => (px(v.valeur) !== null ? fr(/** @type {number} */ (px(v.valeur)), { decimales: 2 }) : v.valeur.replace('%', ' %')),
  );
}

/** Un nom de page dans une phrase : « La carte » devient « la carte », « API » reste. @param {string} n */
const dansLaPhrase = (n) => (/^\p{Lu}\p{Ll}/u.test(n) ? n.charAt(0).toLowerCase() + n.slice(1) : n);

/**
 * Une ligne de la dette (D94), et des fondations : à gauche, le chiffre en grand s'il y en a un, le nom et une seule
 * note discrète ; à droite, la preuve.
 * @param {number | string | null} n @param {string} nom @param {string | null} note @param {string} preuve
 * @param {string} [mention]  sous la note, déjà échappée
 */
const rang = (n, nom, note, preuve, mention = '') =>
  `<section class="rang"><div class="cote">${n === null ? '' : `<span class="n">${esc(String(n))}</span>`}<h3>${esc(nom)}</h3>${note ? `<small>${esc(note)}</small>` : ''}${mention}</div><div class="preuve">${preuve}</div></section>`;

/**
 * Le total partagé en parts, à la mesure de chaque famille : un tableau d'autant de colonnes égales que de valeurs,
 * chaque part couvre les colonnes de sa famille. La mesure est une donnée (colspan), jamais une valeur de style.
 * @param {import('./dette.js').Famille[]} familles @param {number} total
 */
function parts(familles, total) {
  const l = familles.filter((f) => f.compte > 0);
  return `<table class="parts" role="presentation"><colgroup><col span="${total}"></colgroup><tr class="longueurs">${l.map((f) => `<td colspan="${f.compte}"></td>`).join('')}</tr><tr>${l
    .map((f) => `<td colspan="${f.compte}"><b>${f.compte}</b> ${esc(f.titre.toLowerCase())}</td>`)
    .join('')}</tr></table>`;
}

/**
 * La dette (D78, D94) : à regarder, rien à décider. Le total, puis deux groupes de lignes, les valeurs et les
 * composants : le nom et son chiffre à gauche, la preuve à droite ; ce qui vient du site, les valeurs dessinées et les
 * captures, est sur papier. « Définir ma marque » se dit dans le chat (D92).
 * @param {Etat} e @param {{ lecture?: Lecture | null }} [o]
 */
export function ecranDeLaDette(e, { lecture = null } = {}) {
  const d = /** @type {NonNullable<Etat['dette']>} */ (e.dette);
  const v = d.valeurs;
  const total = v
    ? `<div class="total"><p class="cote"><span class="grand">${v.total}</span>valeurs différentes</p>${v.total ? parts(v.familles, v.total) : ''}</div>`
    : '';
  const valeurs = v
    ? `<section class="groupe" aria-labelledby="t-valeurs"><div class="titre-bloc"><h2 id="t-valeurs">Les valeurs</h2>${d.valeursHref ? `<a href="${esc(d.valeursHref)}">Voir toutes les valeurs</a>` : ''}</div>
<div class="rangs">
${v.familles.map((f) => rang(f.compte, f.titre, f.note, f.valeurs.length ? (f.cle === 'colors' ? dessin(f) : `<div class="papier papier-bloc">${dessin(f)}</div>`) : '')).join('\n')}
</div></section>`
    : '';
  const c = d.composants;
  const captures = (/** @type {import('./dette.js').Type} */ t) => {
    const l = t.versions.filter((x) => x.capture || x.imageTombee);
    return l.length
      ? `<div class="papier papier-bloc captures">${l.map((x) => (x.capture ? `<img src="${esc(`${d.captures}/${x.capture}`)}" alt="${esc(`${t.nom}, ${x.nom}`)}" title="${esc(`${x.nom}, ${fois(x.fois)}${x.sansStyle ? ', sans style' : ''}`)}">` : sansImage(t.nom, x))).join('')}</div>`
      : '';
  };
  const composants = `<section class="groupe" aria-labelledby="t-composants"><div class="titre-bloc"><h2 id="t-composants">Les composants</h2><a href="${esc(d.composantsHref)}">Voir tous les composants</a></div>
<div class="rangs">
${c.types.map((t) => rang(t.versions.length, t.nom, t.note, captures(t))).join('\n')}
</div>
${c.aussi.length ? `<p class="pied">À regarder aussi : ${esc(c.aussi.join(' '))}</p>` : ''}</section>`;
  const autres = d.autres.length
    ? `<p class="autres">Les autres sites, à part pour l’instant : ${d.autres.map((x) => `<a href="${esc(x.href)}">${esc(x.nom)}</a>`).join(', ')}.</p>`
    : '';
  const n = d.pages.length;
  return gabarit({
    titre: `La dette ${deNom(e.produit)}`,
    onglet: `La dette · ${e.produit}`,
    phrase: `Mesurée sur ${n > 1 ? `${n} pages` : '1 page'}${e.unSite ? '' : ` ${deNom(d.site.nom ?? d.site.id)}`} : ${listeFr(d.pages.map(dansLaPhrase))}.`,
    fil: filDe(e),
    lecture,
    corps: `<div class="blocs">\n${total}\n${valeurs}\n${composants}\n${autres}</div>`,
  });
}

/** Une pastille de couleur. @param {string} hex @param {number} [cote] */
const pastille = (hex, cote = 40) =>
  `<svg width="${cote}" height="${cote}" viewBox="0 0 ${cote} ${cote}" aria-hidden="true"><rect x="0.5" y="0.5" width="${cote - 1}" height="${cote - 1}" rx="6" fill="${esc(hex)}" stroke="currentColor" stroke-opacity="0.2"/></svg>`;

/** Un échantillon : un fond, un texte, un libellé. @param {string} fond @param {string} texte @param {string} libelle */
const echantillon = (fond, texte, libelle) =>
  `<svg width="200" height="44" viewBox="0 0 200 44" role="img" aria-label="${esc(libelle)}"><rect width="200" height="44" rx="8" fill="${esc(fond)}"/><text x="100" y="28" text-anchor="middle" font-size="16" font-weight="600" fill="${esc(texte)}">${esc(libelle)}</text></svg>`;

/**
 * « Modifier » une couleur (D80), sans script : une couleur relevée sur les pages, d'un clic, ou un code tapé. Ouvert
 * quand le code tapé est refusé, la saisie gardée et la raison à côté du champ.
 * @param {'primary' | 'accent'} role @param {string} hex @param {import('./marque.js').Relevee[]} relevees @param {ErreurAjout | null} erreur
 */
function modifier(role, hex, relevees, erreur) {
  const err = erreur?.site === role ? erreur : null;
  const choix = relevees
    .map(
      (r) =>
        `<li><button type="submit" name="hex" value="${esc(r.hex)}" aria-pressed="${r.hex === hex}" aria-label="${esc(`Prendre ${r.hex}, lue sur ${r.elements} élément${r.elements > 1 ? 's' : ''}`)}" title="${esc(`${r.hex}, lue sur ${r.elements} élément${r.elements > 1 ? 's' : ''}`)}">${pastille(r.hex, 32)}</button></li>`,
    )
    .join('');
  return `<details class="modifier"${err ? ' open' : ''}><summary>Modifier</summary>
<form method="post" action="/pages/marque/couleur"><input type="hidden" name="role" value="${role}"><small>Les couleurs lues sur tes pages :</small><ul class="choix papier papier-bloc">${choix}</ul></form>
<form class="ajout" method="post" action="/pages/marque/couleur"><input type="hidden" name="role" value="${role}"><label>Ou un code<input type="text" name="hex" autocomplete="off" placeholder="#2b4c7e" value="${esc(err?.saisie ?? '')}"${err ? ` aria-invalid="true" aria-describedby="erreur-${role}"` : ''}></label><button type="submit">Appliquer</button><span class="erreur" id="erreur-${role}" role="status">${esc(err?.message ?? '')}</span></form>
</details>`;
}

/**
 * Les douze pas en ruban continu, du plus clair au plus foncé, et le pas plein marqué d'un trait sous sa tranche. Les
 * couleurs et la place du trait sont des données du dessin ; la couleur du trait vient des jetons, par la classe.
 * @param {import('./marque.js').Echelle} e
 */
const rubanDesPas = (e) =>
  `<div class="pas"><div class="ruban"><svg viewBox="0 0 12 1" preserveAspectRatio="none" shape-rendering="crispEdges" role="img" aria-label="${esc(`Les douze pas, du plus clair au plus foncé ; le pas ${e.plein.pas} est le plein`)}">${e.pas
    .map((h, i) => `<rect x="${i}" y="0" width="1" height="1" fill="${esc(h)}"><title>${esc(`Pas ${i + 1}, ${h}`)}</title></rect>`)
    .join('')}</svg></div><svg class="repere" viewBox="0 0 12 1" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true"><rect x="${e.plein.pas - 1}" y="0" width="1" height="1"/></svg></div>`;

/**
 * Une ligne de la marque (D96) : à gauche, ce qu'on regarde ; à droite, ce que l'outil en fait.
 * @param {string} cote @param {string} preuve @param {string} [classe]
 */
const ligneDeMarque = (cote, preuve, classe = 'rang') => `<section class="${classe}"><div class="cote">${cote}</div><div class="preuve">${preuve}</div></section>`;

/**
 * La ligne d'une couleur de la marque (D96) : à gauche, la pastille, le code, le nom ; à droite, une seule note, le
 * ruban des douze pas, l'échantillon sur papier et « Modifier », puis le verdict en une phrase. Adaptée, le papier
 * montre ta couleur à côté du bouton, et le trait du ruban dit le pas qu'il prend.
 * @param {{ titre: string, hex: string, relevee: import('./marque.js').Relevee | undefined, aide: string, echelle: import('./marque.js').Echelle | null,
 *   role: 'primary' | 'accent', motifs: string[], suite?: string, modifier: string }} o
 */
function ligneCouleur(o) {
  const d = o.relevee;
  const lue = d
    ? `Lue sur ${d.elements > 1 ? `${d.elements} éléments` : '1 élément'} de tes pages${o.role === 'primary' && d.cliquables ? `, dont ${d.cliquables} qui se cliquent` : ''}.`
    : 'Pas lue sur tes pages.';
  const e = o.echelle;
  const exacte = e && e.plein.fond === o.hex;
  const nom = o.role === 'primary' ? 'Bouton' : 'Aplat';
  const verdict = !e
    ? ''
    : exacte
      ? `Ta couleur exacte est sur ${o.role === 'primary' ? 'le bouton' : 'les aplats'}, avec un texte ${e.plein.blanc ? 'blanc' : 'foncé'}.`
      : `Adaptée : avec un texte lisible, ta couleur ne passerait pas ; ${o.role === 'primary' ? 'le bouton prend' : 'les aplats prennent'} le pas ${e.plein.pas}, marqué.`;
  const papier = e
    ? `<span class="papier papier-bloc echantillons">${exacte ? '' : `<svg width="44" height="44" viewBox="0 0 44 44" role="img" aria-label="${esc(`Ta couleur, ${o.hex}`)}"><rect width="44" height="44" rx="8" fill="${esc(o.hex)}"/></svg>`}${echantillon(e.plein.fond, e.plein.texte, nom)}</span>`
    : '';
  const cote = `${pastille(o.hex)}<code>${esc(o.hex)}</code><h3>${esc(o.titre)}</h3>`;
  const preuve = `<p>${esc(`${lue} ${o.aide}`)}</p>
${e ? rubanDesPas(e) : ''}
<div class="ligne-modifier">${papier}${o.modifier}</div>
${verdict ? `<p class="discret">${esc(verdict)}</p>` : ''}${o.motifs.map((m) => `<p class="refus">${esc(m)}</p>`).join('')}${o.suite ?? ''}`;
  return ligneDeMarque(cote, preuve);
}

/**
 * La marque (D80, D96) : la première des trois portes, sur le dessin des lignes de la dette. Diapason en tête, puis
 * « Ta marque » : une ligne par chose à confirmer (deux couleurs, la police des titres), et le verdict. « Confirmer ma
 * marque » se dit dans le chat, impossible si la marque est refusée (D92).
 * @param {Etat} e
 * @param {{ erreur?: ErreurAjout | null, lecture?: Lecture | null }} [o]  le code tapé refusé : la couleur (site), la raison,
 *   la saisie ; revue, la marque confirmée, sans rien à modifier
 */
export function ecranDeLaMarque(e, { erreur = null, lecture = null } = {}) {
  const m = /** @type {NonNullable<Etat['marque']>} */ (e.marque);
  const { choix, lecture: lue, apercu } = m;
  const relevee = (/** @type {string | null} */ h) => lue.relevees.find((r) => r.hex === h);
  const motifs = (/** @type {string} */ b) => apercu.motifs.filter((x) => x.bloc === b).map((x) => x.texte);
  const ira = choix.troisieme ? echelleDeLaTroisieme(choix.troisieme) : null;
  const troisieme = choix.troisieme && !lecture
    ? `<div class="troisieme"><p class="discret">${esc(`Une troisième couleur, ${choix.troisieme}, ${ira ? `ira sur ${nomAffiche(ira)}, l’échelle de la palette qui a sa teinte` : 'passera aux gris'} : une marque garde deux couleurs.`)}</p><form method="post" action="/pages/marque/echanger"><button type="submit" class="retirer">Échanger avec l’accent</button></form></div>`
    : '';
  // La planche de la marque n'existe qu'une fois les fondations écrites : avant, la ligne de Diapason n'a pas de lien.
  const planche = m.planche ? `<a class="voir" href="${esc(m.planche)}">Voir la planche de Diapason</a>` : '';
  const diapason = ligneDeMarque(
    '<h2>Diapason</h2>',
    `<p>C’est le design system que ds-lab t’apporte. Tu donnes ta couleur, ton accent et ta police de titres. Il fournit les espacements, les tailles de texte, les rôles de chaque couleur et les règles de contraste, les mêmes pour chaque marque.</p>${planche}`,
    'rang diapason',
  );
  const police = choix.police
    ? ligneDeMarque(
        `<code>${esc(choix.police[0])}</code><h3>Police des titres</h3>`,
        `<span class="papier papier-bloc specimen"><svg class="police" width="100%" height="48" role="img" aria-label="${esc(e.produit)}"><text x="0" y="36" font-size="32" font-weight="700" font-family="${esc(choix.police.join(', '))}">${esc(e.produit)}</text></svg></span>
<p class="discret">${esc(`Lue sur ${lue.titres} titres. Le texte courant et les boutons gardent la police du produit. Non contrôlée : sans le fichier de la police, l’outil ne peut pas vérifier ses graisses ni ses accents.`)}</p>`,
      )
    : '';
  const refusee = apercu.motifs.length > 0;
  const generale = motifs('marque');
  const verdict = ligneDeMarque(
    `<span class="etat verdict ${refusee ? 'refus' : 'fait'}"><i></i>${refusee ? 'Marque refusée' : 'Marque acceptée'}</span>`,
    refusee
      ? `${generale.map((x) => `<p class="refus">${esc(x)}</p>`).join('')}${apercu.motifs.length > generale.length ? '<p>Change la couleur dite plus haut.</p>' : ''}`
      : '<p>Chaque texte tient son contraste sur son fond, en clair et en sombre.</p>',
  );
  return gabarit({
    titre: `La marque ${deNom(e.produit)}`,
    onglet: `La marque · ${e.produit}`,
    phrase: lecture ? 'Ta marque, telle que tu l’as confirmée. Diapason apporte le reste.' : 'Trois choses à confirmer, lues sur ton site. Diapason apporte le reste.',
    fil: filDe(e),
    lecture,
    // Une seule grille, pour que la ligne de Diapason et celles de la marque partagent leur colonne de gauche.
    corps: `<div class="rangs marque">
${diapason}
<div class="rang titre-rangs"><h2>Ta marque</h2><span></span></div>
${ligneCouleur({ titre: 'Couleur primaire', hex: choix.primary, relevee: relevee(choix.primary), aide: 'C’est ce qui se clique.', echelle: apercu.primary, role: 'primary', motifs: motifs('primary'), modifier: lecture ? '' : modifier('primary', choix.primary, lue.relevees, erreur) })}
${choix.accent ? ligneCouleur({ titre: 'Accent', hex: choix.accent, relevee: relevee(choix.accent), aide: 'Facultatif : sans accent, le système prend un neutre.', echelle: apercu.accent, role: 'accent', motifs: motifs('accent'), suite: troisieme, modifier: lecture ? '' : modifier('accent', choix.accent, lue.relevees, erreur) }) : ''}
${police}
${verdict}
</div>`,
  });
}

/**
 * L'écriture des jetons, après « Confirmer ma marque » (D83) : l'écran d'attente du gabarit, et « Où j'en suis », une
 * ligne par étape (les tokens, les planches, la feuille de variables, le thème), faite quand son fichier est plus
 * récent que l'entrée de la marque (D93). Il se recharge seul, et passe seul aux fondations quand tout est écrit.
 * @param {Etat} e
 */
export function ecranDesJetons(e) {
  return gabarit({
    titre: 'Je prépare tes fondations',
    onglet: `Les fondations · ${e.produit}`,
    phrase: 'À partir de ta marque : les douze pas de tes couleurs, les rôles, les contrôles, la feuille de variables et le thème. Rien ne touche ton site.',
    fil: filDe(e),
    corps: `<section class="bloc" aria-labelledby="t-ou"><h2 id="t-ou">Où j’en suis</h2>
${ouJenSuis(e.preparation ?? [{ nom: 'Tes fondations', detail: 'Les tokens, les planches, la feuille de variables et le thème.', etat: 'En cours' }])}</section>`,
    rafraichir: true,
  });
}

/** Un nombre et ce qu'il compte. @param {number} n @param {string} quoi */
const chiffre = (n, quoi) => `<li><span class="fort">${n}</span>${esc(quoi)}</li>`;

/** Les douze pas d'une échelle en ruban continu, du plus clair au plus foncé. @param {string} nom @param {string[]} pas */
const ruban = (nom, pas) =>
  `<div class="ruban"><svg viewBox="0 0 12 1" preserveAspectRatio="none" shape-rendering="crispEdges" role="img" aria-label="${esc(`${nom}, les douze pas, du plus clair au plus foncé`)}">${pas
    .map((h, i) => `<rect x="${i}" y="0" width="1" height="1" fill="${esc(h)}"><title>${esc(`Pas ${i + 1}, ${h}`)}</title></rect>`)
    .join('')}</svg></div>`;

/** Un écart dessiné, sa longueur en px. @param {number} l */
const barreEcart = (l) => `<svg width="${Math.max(l, 1)}" height="24" viewBox="0 0 ${Math.max(l, 1)} 24" aria-hidden="true"><rect width="${l}" height="24" rx="2"/></svg>`;

/** « de 0 à 64 px ». @param {number[]} l */
const etendue = (l) => (l.length ? `de ${Math.min(...l)} à ${Math.max(...l)} px` : null);

/**
 * Les fondations (D83, D97) : à regarder, rien à décider. Les mêmes lignes que la dette, pour que l'œil compare : les
 * valeurs, les rôles, les règles, ce qu'un développeur peut vérifier. Ce sont des valeurs du système, pas du site : pas
 * de papier. « Comparer mon site » se dit dans le chat (D92).
 * @param {Etat} e @param {{ lecture?: Lecture | null }} [o]
 */
export function ecranDesFondations(e, { lecture = null } = {}) {
  const f = /** @type {NonNullable<Etat['fondations']>} */ (e.fondations);
  // Une seule grille pour les quatre groupes : la colonne de gauche a la même largeur de haut en bas.
  /** @param {string} id @param {string} titre @param {string[]} lignes */
  const groupe = (id, titre, lignes) => `<div class="rang titre-rangs"><h2 id="t-${id}">${esc(titre)}</h2><span></span></div>\n${lignes.join('\n')}`;
  const tailles = `<ul class="dessins tailles">${f.tailles
    .map((t) => {
      // Le même jour sous la ligne de base pour chaque taille : les « Aa » posés sur une même ligne.
      const [l, h] = [Math.ceil(t * 1.4), Math.ceil(t) + 3];
      return `<li><svg width="${l}" height="${h}" viewBox="0 0 ${l} ${h}" aria-hidden="true"><text x="0" y="${t}" font-size="${t}" font-weight="600">Aa</text></svg><small>${t}</small></li>`;
    })
    .join('')}</ul>`;
  const coins = `<ul class="dessins rayons">${f.rayons
    .map((r) => {
      const v = Math.min(20, r.px);
      return `<li><svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M1 39 V${1 + v} A${v} ${v} 0 0 1 ${1 + v} 1 H39" stroke-width="2"/></svg><small>${esc(r.nom === 'full' ? 'rond' : String(r.px))}</small></li>`;
    })
    .join('')}</ul>`;
  const douze = 'douze pas, du plus clair au plus foncé';
  const valeurs = groupe('valeurs', 'Les valeurs', [
    rang(12, 'Primaire', douze, ruban('Primaire', f.primaire)),
    ...(f.accent ? [rang(12, 'Accent', douze, ruban('Accent', f.accent))] : []),
    rang(f.espacements.length, 'Espacements', etendue(f.espacements), `<ul class="dessins ecarts">${f.espacements.map((l) => `<li>${barreEcart(l)}<small>${l}</small></li>`).join('')}</ul>`),
    rang(f.tailles.length, 'Tailles de texte', etendue(f.tailles), tailles),
    rang(f.rayons.length, 'Arrondis', null, coins),
  ]);
  const r = f.roles;
  const roles = groupe('roles', 'Les rôles', [
    rang(null, 'Par famille', 'un composant ne connaît que le rôle, jamais la couleur', `<ul class="chiffres">${chiffre(r.fonds, 'fonds')}${chiffre(r.textes, 'textes')}${chiffre(r.bordures, 'bordures')}${chiffre(r.styles, 'styles de texte')}${chiffre(r.ecarts, 'écarts')}</ul>`),
    rang(f.relations.length, 'Relations d’espace', 'on choisit un lien, pas un nombre', `<ul class="relations ecarts">${f.relations.map((x) => `<li>${barreEcart(x.px)}<span>${esc(x.nom)}</span><small>${x.px} px</small></li>`).join('')}</ul>`),
  ]);
  const p = f.paires;
  const planches = f.planches.length ? `<p class="planches">${f.planches.map((x) => `<a class="voir" href="${esc(f.planche + x.fichier)}">${esc(x.nom)}</a>`).join(' ')}</p>` : '';
  const regles = groupe('regles', 'Les règles', [
    rang(p.controlees, 'Paires contrôlées', 'texte et fond', `<ul class="chiffres">${chiffre(p.echec, 'en échec')}${chiffre(p.interdites, 'paires interdites')}</ul>`),
    rang(f.regles, 'Règles et valeurs par défaut', 'les mêmes pour chaque marque', planches),
  ]);
  const verifier = groupe('verifier', 'Ce qu’un développeur peut vérifier', f.preuves.map((x) => rang(null, x.titre, null, `<p>${esc(x.texte)}</p>`)));
  const remplace = f.avant ? `Tes pages affichaient ${f.avant} valeurs. Voici ce qui les remplace, préparé à partir de ta marque.` : 'Voici ce qui remplacera les valeurs de tes pages, préparé à partir de ta marque.';
  return gabarit({
    titre: `Les fondations ${deNom(e.produit)}`,
    onglet: `Les fondations · ${e.produit}`,
    phrase: lecture ? remplace : `${remplace} Rien n’est encore posé sur ton site.`,
    fil: filDe(e),
    lecture,
    corps: `<div class="blocs">\n<div class="rangs fondations">\n${valeurs}\n${roles}\n${regles}\n${verifier}\n</div>\n<p class="pied">${esc(`Limites connues : ${f.limites.join(' ; ')}.`)}</p>\n</div>`,
  });
}

/** Le pluriel des types relevés que Diapason n'a pas encore, pour leur phrase. */
const PLURIELS = /** @type {Record<string, string>} */ ({
  lien: 'liens',
  'case à cocher': 'cases à cocher',
  'liste déroulante': 'listes déroulantes',
  radio: 'boutons radio',
  interrupteur: 'interrupteurs',
  onglet: 'onglets',
  menu: 'menus',
  fenêtre: 'fenêtres',
});

/** Une capture à la marque, sur papier, à sa taille ; rien si elle manque. @param {import('./etat.js').Image | null} i @param {string} alt */
const vitrine = (i, alt) => (i ? `<div class="papier vitrine"><img src="${esc(i.src)}" width="${i.largeur}" height="${i.hauteur}" alt="${esc(alt)}"></div>` : '');

/**
 * Les composants à ta marque (D101) : à regarder, rien à décider. Ceux de Diapason que tes pages emploient, une ligne
 * chacun : les versions d'aujourd'hui (les captures de la dette, sur papier) et le vrai composant, capturé dans
 * l'atelier avec le thème de la marque ; les types relevés que Diapason n'a pas encore ; puis les autres composants.
 * « 5 → 1 » est la cible : la phrase dit ce que fera le développeur, le pied que rien n'est remplacé à cette étape.
 * « Comparer mon site » se dit dans le chat (D92).
 * @param {Etat} e @param {{ lecture?: Lecture | null }} [o]
 */
export function ecranDesComposants(e, { lecture = null } = {}) {
  const c = /** @type {NonNullable<Etat['composants']>} */ (e.composants);
  /** @param {import('./etat.js').Versions} versions @param {string} nom */
  const site = (versions, nom) => {
    const l = versions.filter((x) => x.capture || x.imageTombee);
    return l.length
      ? `<div class="papier papier-bloc versions">${l
          .map((x) => {
            if (!x.capture) return sansImage(nom, x);
            const t = c.tailles[/** @type {string} */ (x.capture)];
            return `<img src="${esc(`${c.captures}/${x.capture}`)}"${t ? ` width="${t[0]}" height="${t[1]}"` : ''} alt="${esc(`${nom}, ${x.nom}`)}" title="${esc(`${x.nom}, ${fois(x.fois)}${x.sansStyle ? ', sans style' : ''}`)}">`;
          })
          .join('')}</div>`
      : '';
  };
  /** @param {import('./etat.js').Versions} versions */
  const sansStyle = (versions) => versions.filter((x) => x.sansStyle).reduce((n, x) => n + x.fois, 0);
  const remplace = c.remplace.map((x) => {
    const phrase =
      x.cle === 'button'
        ? `Un seul bouton, ${enLettres(INTENTIONS.length).toLowerCase()} intentions (${INTENTIONS.map(([, mot]) => mot).join(', ')}) et deux tailles.${x.hauteurs.length > 2 ? ` Une fois écrit par ton développeur, tes ${enLettres(x.hauteurs.length).toLowerCase()} hauteurs d’aujourd’hui n’en font plus que deux.` : ''}`
        : x.phrase;
    const preuve = `<div class="deux"><div><small>Sur ton site aujourd’hui</small>${site(x.versions, x.nom)}</div><div><small>Avec Diapason, à ta marque</small>${vitrine(x.image, `${x.nom}, à ta marque`)}</div></div>${phrase ? `<p class="discret">${esc(phrase)}</p>` : ''}`;
    return rang(`${x.versions.length} → 1`, x.nom, `${nombre(x.fois, 'emploi', 'emplois')} sur tes pages`, preuve);
  });
  const pasEncore = c.pasEncore.map((t) => {
    const nus = sansStyle(t.versions);
    const type = t.nom.charAt(0).toLowerCase() + t.nom.slice(1);
    const pluriel = PLURIELS[type];
    const n = t.versions.length;
    const formes = !pluriel ? `Ses ${nombre(n, 'forme', 'formes')} restent` : n > 1 ? `Tes ${pluriel} gardent leurs ${enLettres(n).toLowerCase()} formes` : `Tes ${pluriel} gardent leur forme`;
    const phrase = `Diapason n’a pas encore de composant ${deNom(type)}. ${formes}, avec les couleurs de ta marque.`;
    return rang(n, t.nom, `${nombre(t.fois, 'emploi', 'emplois')}${nus ? `, dont ${nus} sans style` : ''}`, `${site(t.versions, t.nom)}<p class="discret">${esc(phrase)}</p>`, '<span class="pas-encore"><i></i>Pas encore dans Diapason</span>');
  });
  /** @param {string} id @param {string} titre @param {string[]} lignes @param {string} [lien] */
  const groupe = (id, titre, lignes, lien = '') =>
    lignes.length ? `<section class="groupe" aria-labelledby="t-${id}"><div class="titre-bloc"><h2 id="t-${id}">${esc(titre)}</h2>${lien}</div>\n<div class="rangs">\n${lignes.join('\n')}\n</div></section>` : '';
  const fiches = '<a href="/fiches">Voir les fiches</a>';
  const autres = c.autres.map((x) => rang(null, x.nom, null, vitrine(x.image, `${x.nom}, à ta marque`)));
  return gabarit({
    titre: 'Tes composants, à ta marque',
    onglet: `Les composants · ${e.produit}`,
    phrase: `Les ${enLettres(COMPOSANTS.length).toLowerCase()} composants de Diapason, aux couleurs ${deNom(e.produit)}. Pour ceux que tes pages utilisent déjà, tu vois ce qu’ils remplacent.`,
    fil: filDe(e, 'Les composants'),
    lecture,
    corps: `<div class="blocs">
${groupe('remplacent', 'Ce qu’ils remplacent', [...remplace, ...pasEncore], fiches)}
${groupe('autres', 'Les autres composants de Diapason', autres, c.remplace.length || c.pasEncore.length ? '' : fiches)}
<p class="pied">Rien n’est remplacé sur ton site à cette étape. À la remise, ton développeur reçoit la fiche de chaque composant que tes pages emploient, pour le refaire chez lui.</p>
</div>`,
  });
}

/** Une valeur dite : « 3 px », « 50 % », une couleur telle quelle. @param {string} v */
const valeurDite = (v) => (px(v) !== null ? `${fr(/** @type {number} */ (px(v)), { decimales: 2 })} px` : v.replace('%', ' %'));

/**
 * L'avant et après (D86, D98), la troisième porte : chaque page mesurée, telle qu'elle était et telle que les feuilles
 * ajoutées la rendent, au même endroit, et sous l'image sa légende et la page en direct ; puis le total et un groupe de
 * lignes, « Ce qui change », comme la dette : ce qui n'est pas arrivé en tête, une ligne par famille et son exemple (le
 * changement qui touche le plus d'éléments), ce qui se regarde à la main en pied. Sans script : un onglet par page et
 * la bascule sont des boutons radio, l'image cachée garde sa place, et la légende suit la bascule. La plus haute des
 * deux images tient le cadre, l'autre se pose dessus : rien ne saute. « Valider mon rendu » et « Revenir sur une
 * décision » se disent dans le chat (D92). Les images viennent du site : sur papier.
 * @param {Etat} e @param {{ lecture?: Lecture | null }} [o]
 */
export function ecranAvantApres(e, { lecture = null } = {}) {
  const a = /** @type {NonNullable<Etat['avantApres']>} */ (e.avantApres);
  const onglets = a.vues.map((v, i) => `<input type="radio" name="page" id="page-${i}" class="choix-page"${i === 0 ? ' checked' : ''}><label for="page-${i}">${esc(v.nom)}</label>`).join('\n');
  const vues = a.vues
    .map((v, i) => {
      const image = (/** @type {'avant' | 'apres'} */ q, /** @type {string} */ src, /** @type {string} */ dit) =>
        `<img class="${q} ${v.plusHaute === q ? 'fond' : 'dessus'}" src="${esc(src)}" alt="${esc(`${v.nom}, ${dit}`)}">`;
      return `<div class="vue vue-${i}" role="group" aria-label="${esc(v.nom)}">
<input type="radio" name="bascule-${i}" id="avant-${i}" class="voir-avant"><label for="avant-${i}">Avant</label>
<input type="radio" name="bascule-${i}" id="apres-${i}" class="voir-apres" checked><label for="apres-${i}">Après</label>
<div class="cadre papier">${image('avant', v.avant, 'avant')}${image('apres', v.apres, 'après')}</div>
<p class="sous-image"><small class="legende avant">Image prise sur ta page, sans les nouvelles feuilles.</small><small class="legende apres">Image prise sur ta page, avec les nouvelles feuilles.</small><a class="direct" href="${esc(v.direct)}">Ouvrir la page en direct</a></p>
</div>`;
    })
    .join('\n');
  // Une règle par page : son onglet coché montre sa vue.
  const regles = a.vues.map((_, i) => `#page-${i}:checked ~ .vues > .vue-${i} { display: flex; }`).join('\n');
  const total = `<div class="total"><p class="cote"><span class="grand">${a.changements}</span>${a.changements > 1 ? 'changements' : 'changement'}</p><ul class="chiffres">${chiffre(a.arrivees, `${a.arrivees > 1 ? 'arrivés' : 'arrivé'}, vérifiés sur l’image`)}${a.manquantes.length ? chiffre(a.manquantes.length, a.manquantes.length > 1 ? 'pas arrivés' : 'pas arrivé') : ''}${a.enEtat.length ? chiffre(a.enEtat.length, 'à regarder à la main') : ''}</ul></div>`;
  const endroits = (/** @type {string[]} */ l) => `<ul class="endroits">${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const manque = a.manquantes.length ? [rang(a.manquantes.length, a.manquantes.length > 1 ? 'Pas arrivés' : 'Pas arrivé', 'à regarder sur l’image', endroits(a.manquantes))] : [];
  // L'exemple de chaque famille, dit une fois sous le premier.
  let dit = false;
  const familles = a.familles
    .filter((f) => f.compte)
    .map((f) => {
      const x = f.exemple;
      const valeur = (/** @type {string} */ v) => (f.cle === 'colors' ? `${pastille(v, 24)}<code>${esc(v)}</code>` : `<span>${esc(valeurDite(v))}</span>`);
      const regle = x && !dit ? '<small class="discret">Le changement qui touche le plus d’éléments.</small>' : '';
      if (x) dit = true;
      return rang(f.compte, f.titre.charAt(0).toUpperCase() + f.titre.slice(1), null, x ? `<p class="devient">${valeur(x.ancienne)}<span class="discret">devient</span>${valeur(x.nouvelle)}</p>${regle}` : '');
    });
  // À regarder à la main : les états où le changement se voit, lus dans le titre de chaque ligne.
  const etats = ['au survol', 'au focus', 'à l’appui'].filter((s) => a.enEtat.some((x) => x.includes(`(${s})`)));
  const lesEtats = etats.length ? etats : ['au survol', 'au focus', 'à l’appui'];
  const ouEtats = lesEtats.length > 1 ? `${lesEtats.slice(0, -1).join(', ')} ou ${lesEtats.at(-1)}` : lesEtats[0];
  const pronom = a.enEtat.length > 1 ? 'les' : 'le';
  const main = a.enEtat.length
    ? [rang(a.enEtat.length, 'À regarder à la main', `visible seulement ${ouEtats}`, `${endroits(a.enEtat)}<p>Ouvre la page en direct, sous l’image, pour ${pronom} ${etats.length === 1 && etats[0] === 'au survol' ? 'survoler' : 'voir dans cet état'}.</p>`)]
    : [];
  const decisions = a.decisions ? `Tes ${nombre(a.decisions, 'décision', 'décisions')} et les réglages de l’outil, ensemble,` : 'Les réglages de l’outil,';
  return gabarit({
    titre: 'Avant, après',
    onglet: `Avant, après · ${e.produit}`,
    phrase: `${decisions} sur ${a.pages > 1 ? `les ${a.pages} pages mesurées` : 'la page mesurée'}. ${lecture ? 'Le rendu que tu as validé.' : 'C’est un aperçu : rien n’est encore installé sur ton site.'}`,
    fil: filDe(e),
    lecture,
    corps: `<div class="blocs">
<section class="comparer" aria-label="Comparer">
${onglets}
<div class="vues">
${vues}
</div>
</section>
${total}
<section class="groupe" aria-labelledby="t-change"><div class="titre-bloc"><h2 id="t-change">Ce qui change</h2></div>
<div class="rangs">
${[...manque, ...familles, ...main].join('\n')}
</div></section>
</div>`,
    regles,
  });
}

/**
 * La revue revue (D88) : la revue des décisions, telle que la réduction l'a écrite, dans le gabarit. Rien ne s'y
 * enregistre : un export n'est rangé que par le chat.
 * @param {Etat} e @param {string} href  l'adresse de la revue
 */
export function ecranDeLaRevue(e, href) {
  return gabarit({
    titre: 'La revue',
    onglet: `La revue · ${e.produit}`,
    phrase: 'Les décisions que tu as tranchées, avec les cas qu’aucune règle ne sait trancher.',
    fil: filDe(e),
    lecture: lectureDe(e, 'revue'),
    corps: `<iframe class="revue" src="${esc(href)}" title="La revue"></iframe>`,
  });
}

/**
 * La remise (D87, D99), sur la planche « 9 · La remise » : la réussite et l'apport mesuré, puis ce que fait le
 * développeur, dans l'ordre ; le dossier à remettre ; le mot d'accompagnement ; ce qui reste. Aucune durée. « Copier le
 * message » est un formulaire : le serveur copie le message dans le presse-papiers du Mac, et l'écran dit « Copié. ».
 * @param {Etat} e
 * @param {{ copie?: 'ok' | 'non' | null }} [o]  le retour de « Copier le message »
 */
export function ecranDeLaRemise(e, { copie = null } = {}) {
  const r = /** @type {NonNullable<Etat['remise']>} */ (e.remise);
  const b = /** @type {NonNullable<Etat['bilan']>} */ (e.bilan);
  // Un groupe, sa grille : le titre et son lien passent à la ligne quand la largeur manque.
  /** @param {string} id @param {string} titre @param {string} corps @param {string} [lien] */
  const groupe = (id, titre, corps, lien = '') =>
    `<section class="groupe" aria-labelledby="t-${id}"><div class="titre-bloc"><h2 id="t-${id}">${esc(titre)}</h2>${lien}</div>\n${corps}</section>`;
  const rangs = (/** @type {string[]} */ l) => `<div class="rangs">\n${l.join('\n')}\n</div>`;
  const guide = '<a class="voir" href="/guide">Lire le guide de migration</a>';
  // L'apport : des chiffres lus dans les sorties, jamais repris de la planche ; un chiffre absent ne s'écrit pas.
  const surPages = b.pages > 1 ? `sur tes ${enLettres(b.pages).toLowerCase()} pages` : 'sur ta page';
  const c = b.couleurs;
  const apport = [
    ...(c ? [[`${c.avant} → ${c.apres}`, c.mesure ? `couleurs ${surPages}` : `couleurs ${surPages}, d’après le calcul : le prochain contrôle les comptera`]] : []),
    [String(b.changements), `${b.changements > 1 ? 'changements posés' : 'changement posé'}, sans toucher à l’ancien code`],
    ['4', 'étapes pour ton développeur, chacune livrable seule'],
  ];
  const estBouton = (/** @type {{ nom: string }} */ t) => composantDuType(t.nom)?.cle === 'button';
  const bouton = b.composants.find(estBouton) ?? b.composants[0];
  const dabord = bouton ? ` ${estBouton(bouton) ? 'Le bouton' : bouton.nom} d’abord : ${nombre(bouton.versions, 'version', 'versions')} pour ${nombre(bouton.fois, 'emploi', 'emplois')}.` : '';
  const etape = (/** @type {number} */ n, /** @type {string} */ titre, /** @type {string} */ fait, /** @type {string} */ ecran) => rang(n, titre, null, `<p>${fait}</p><p class="discret">${esc(ecran)}</p>`);
  const etapes = groupe('etapes', 'Ce que fait ton développeur, dans l’ordre', rangs([
    etape(1, 'Installer le système', 'Il charge <strong>tokens.css</strong> avant les autres feuilles.', 'Rien ne change à l’écran.'),
    etape(2, 'Poser tes décisions', esc(`Il charge ${r.ajouts.length > 1 ? `${r.ajouts.length} feuilles ajoutées, chacune juste après sa feuille d’origine` : 'une feuille ajoutée, juste après sa feuille d’origine'}.`), 'Le site devient l’« Après » que tu viens de valider. L’ancien code n’est pas touché.'),
    etape(3, 'Reprendre l’ancien code', esc(`Il remplace ${nombre(r.valeurs, 'valeur écrite', 'valeurs écrites')} en dur par les variables, fichier par fichier.`), 'Rien ne change à l’écran. Cette étape peut s’étaler, un fichier à la fois.'),
    etape(4, 'Remplacer les composants', esc(`Il refait chaque composant une fois, d’après sa fiche, puis remplace les versions en double.${dabord}`), 'Au rythme de l’équipe, un composant à la fois.'),
  ]), guide);
  const arbre = `<dl class="arbre">${entrees(r).map(([nom, quoi]) => `<dt><code>${esc(nom)}</code></dt><dd>${esc(quoi)}</dd>`).join('')}</dl><p>${guide}</p>`;
  const dossier = groupe('dossier', 'Le dossier à remettre', rangs([`<section class="rang"><div class="cote"><h3><code>remise/</code></h3></div><div class="preuve">${arbre}</div></section>`]));
  const dit = copie === 'ok' ? '<span class="accepte" role="status">Copié.</span>' : copie === 'non' ? '<span class="refus" role="status">Copie impossible ici : sélectionne le message.</span>' : '';
  // Le bouton à gauche du mot ; quand la largeur manque, le mot passe dessous.
  const mot = groupe(
    'message',
    'Le mot d’accompagnement',
    `<div class="mot"><div class="copier"><form method="post" action="/pages/copier"><button type="submit" class="principal">Copier le message</button></form>${dit}</div><div class="message" aria-labelledby="t-message">${message(r)
      .split('\n\n')
      .map((p) => `<p>${esc(p)}</p>`)
      .join('')}</div></div>`,
  );
  const endroits = (/** @type {string[]} */ l) => `<ul class="endroits">${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const reste = [
    ...(b.complet ? [] : [rang(null, 'Il manque', null, endroits(b.manque.map((x) => x.charAt(0).toUpperCase() + x.slice(1))))]),
    ...(b.enEtat.length ? [rang(b.enEtat.length, 'À regarder à la main', 'visible seulement dans un état', endroits(b.enEtat))] : []),
    ...(r.nonEcrites.length ? [rang(r.nonEcrites.length, 'Hors des feuilles ajoutées', null, `<p>${esc(`${r.nonEcrites.length > 1 ? 'Ces valeurs se changent' : 'Cette valeur se change'} dans le code, en reprenant l’ancien code.`)}</p>`)] : []),
    ...(e.chiffres.reportes ? [rang(e.chiffres.reportes, 'Choix reportés', null, '<p class="discret">Les versions de composants à garder, pour plus tard.</p>')] : []),
    rang(null, 'Hors du contrôle', null, endroits(b.humain.map((x) => x.charAt(0).toUpperCase() + x.slice(1)))),
  ];
  const decisions = b.decisions ? `Tu as pris ${nombre(b.decisions, 'décision', 'décisions')}. L’outil a fait le reste` : 'L’outil a tout fait';
  return gabarit({
    titre: `Le design system ${deNom(e.produit)} est ${b.complet ? 'prêt' : 'presque prêt'}.`,
    onglet: `La remise · ${e.produit}`,
    phrase: `${decisions}, et tu as vérifié le résultat sur tes pages. ${b.complet ? 'Il ne reste qu’à le remettre.' : 'Avant de le remettre, regarde ce qui manque, en bas.'}`,
    fil: filDe(e),
    corps: `<div class="blocs">
<ul class="apport">${apport.map(([n, quoi]) => `<li><span class="grand">${esc(n)}</span>${esc(quoi)}</li>`).join('')}</ul>
${etapes}
${dossier}
${mot}
${groupe('reste', 'Ce qui reste', rangs(reste))}
<p class="pied">${esc(b.dernier)}</p>
</div>`,
  });
}

/** Le code d'une ligne du guide, entre accents graves ; une rubrique, entre astérisques doubles ; un lien, son texte seul. @param {string} t */
const enLigne = (t) =>
  esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

/**
 * Un document Markdown que l'outil écrit ou fournit (le guide, D100 ; une fiche, D101), rendu par l'outil, qui sait ce
 * qu'il contient : titres, paragraphes, rubriques, blocs de code, listes à deux niveaux, tableaux, code en ligne ; le
 * titre de premier niveau est celui de l'écran.
 * @param {string} md
 */
function documentHtml(md) {
  /** @type {string[]} */
  const h = [];
  let code = /** @type {string[] | null} */ (null);
  let tableau = /** @type {string[][] | null} */ (null);
  let liste = 0;
  const fermer = (/** @type {number} */ n) => {
    while (liste > n) (h.push('</ul>'), liste--);
  };
  const cellules = (/** @type {string} */ l) => l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((x) => x.trim());
  const finTableau = () => {
    if (!tableau) return;
    const [tete, ...corps] = tableau;
    h.push(`<div class="tableau"><table><thead><tr>${tete.map((x) => `<th>${enLigne(x)}</th>`).join('')}</tr></thead><tbody>${corps.map((r) => `<tr>${r.map((x) => `<td>${enLigne(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
    tableau = null;
  };
  for (const l of md.split('\n')) {
    if (code) {
      if (l === '```') (h.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`), (code = null));
      else code.push(l);
      continue;
    }
    if (l.startsWith('|')) {
      fermer(0);
      if (!/^\|[\s|:-]+\|$/.test(l)) (tableau ??= []).push(cellules(l));
      continue;
    }
    finTableau();
    if (l.startsWith('```')) (fermer(0), (code = []));
    else if (l.startsWith('# ') || !l.trim()) fermer(0);
    else if (l.startsWith('#### ')) (fermer(0), h.push(`<h4>${enLigne(l.slice(5))}</h4>`));
    else if (l.startsWith('### ')) (fermer(0), h.push(`<h3>${enLigne(l.slice(4))}</h3>`));
    else if (l.startsWith('## ')) (fermer(0), h.push(`<h2>${enLigne(l.slice(3))}</h2>`));
    else if (/^ {0,2}- /.test(l)) {
      const n = l.startsWith('  ') ? 2 : 1;
      if (liste < n) (h.push('<ul>'), liste++);
      fermer(n);
      h.push(`<li>${enLigne(l.replace(/^ *- (\[ \] )?/, ''))}</li>`);
    } else (fermer(0), h.push(`<p>${enLigne(l)}</p>`));
  }
  finTableau();
  fermer(0);
  return `<div class="document">\n${h.join('\n')}\n</div>`;
}

/**
 * Le guide de migration (D87, D100), lisible à l'écran, tel que le développeur le lira.
 * @param {Etat} e @param {string} md
 */
export function ecranDuGuide(e, md) {
  return gabarit({
    titre: 'Le guide de migration',
    onglet: `Le guide de migration · ${e.produit}`,
    phrase: 'Tel que le développeur le lira dans le dossier de la remise, sous le nom guide.md.',
    fil: filDe(e, 'Le guide de migration'),
    sousTete: '<p><a class="retour" href="/">‹ La remise</a></p>',
    corps: documentHtml(md),
  });
}

/**
 * Les fiches des composants de Diapason (D101), lues dans le clone et rendues comme le guide : la fiche demandée, les
 * autres en liens, et « ‹ Les composants », vers l'écran du moment ou l'écran revu.
 * @param {Etat} e @param {string} cle @param {string} md  la fiche, sans son en-tête
 */
export function ecranDesFiches(e, cle, md) {
  const c = /** @type {import('./diapason.js').Composant} */ (COMPOSANTS.find((x) => x.cle === cle));
  const retour = e.moment !== 'composants' && e.revoir.includes('composants') ? '/?voir=composants' : '/';
  const titre = /^# (.+)$/m.exec(md)?.[1] ?? c.nom;
  const liens = `<p class="fiches">${COMPOSANTS.map((x) => (x.cle === cle ? `<span aria-current="page">${esc(x.nom)}</span>` : `<a href="/fiches/${esc(x.cle)}">${esc(x.nom)}</a>`)).join('')}</p>`;
  return gabarit({
    titre,
    onglet: `${titre} · ${e.produit}`,
    phrase: `La fiche du composant « ${c.nom.toLowerCase()} », telle que ds-lab l’écrit : quand l’utiliser, ses props, ses tokens, son accessibilité.`,
    fil: filDe(e, 'Les composants'),
    sousTete: `<p><a class="retour" href="${retour}">‹ Les composants</a></p>${liens}`,
    corps: documentHtml(md),
  });
}
