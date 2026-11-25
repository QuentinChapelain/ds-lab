// @ts-check
/**
 * Les écrans du parcours (D77) et leur gabarit, commun à tous les écrans à venir : les quatre temps en haut, le titre
 * et qui a la main, le contenu borné à la largeur d'une page, une barre en bas, fixée au bord de la fenêtre, avec une
 * seule action forte. Les écrans : le lancement (avant le projet), les pages à mesurer (un groupe par site), la mesure en
 * cours, la dette, la marque, l'écriture des tokens, les fondations, l'avant et après et la remise.
 * Sans script : retirer, ajouter et mesurer sont des formulaires envoyés au serveur du parcours (serveur.js). Valeurs :
 * les variables des jetons communs (jetons.js) ; le style écrit ici ne porte que des variables, des mots-clés, 0 et
 * 100 %, comme un module (D61). La page n'a pas de marque : l'anneau de focus prend le texte d'information, pas
 * border.focus, qui pointe sur la marque. Toute chaîne venue du projet ou de la saisie est échappée.
 */
import { esc, fr } from '../lib/format.js';
import { variablesDeLaPage } from './jetons.js';
import { echelleDeLaTroisieme } from './marque.js';
import { nomAffiche } from '../lib/echelles.js';
import { message } from './remise.js';

/** @typedef {import('./etat.js').Etat} Etat @typedef {import('./etat.js').EtatEtape} EtatEtape */
/** @typedef {{ site: string, message: string, saisie: string }} ErreurAjout  le refus d'une page ajoutée */

export const DEBUT_JETONS = '/* jetons : écrits depuis tokens/commun/ */';
export const FIN_JETONS = '/* fin des jetons */';

/** Les cinq propriétés d'un style de texte. @param {string} s */
export const style = (s) =>
  ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height'].map((p) => `${p}: var(--typography-${s}-${p});`).join(' ');

/** Le bloc des jetons, clair et sombre. */
export function blocJetons() {
  const v = variablesDeLaPage();
  /** @param {[string, string][]} l */
  const decl = (l) => l.map(([n, x]) => `${n}: ${x};`).join(' ');
  return `${DEBUT_JETONS}
:root { ${decl(v.clair)} color-scheme: light dark; }
@media (prefers-color-scheme: dark) { :root { ${decl(v.sombre)} } }
${FIN_JETONS}`;
}

const CSS = `
* { box-sizing: border-box; }
html { height: 100%; }
body { display: flex; flex-direction: column; min-height: 100%; margin: 0; background: var(--background-app); color: var(--text-default); ${style('body-medium')} }
main { display: flex; flex-direction: column; gap: var(--gap-between-groups); flex: auto; width: 100%; max-width: var(--width-page); margin: 0 auto; padding: var(--gap-between-groups) var(--padding-component); }
h1, h2, p, ul, ol { margin: 0; }
ul, ol { list-style: none; padding: 0; }
h1 { ${style('heading-1')} }
h2 { ${style('heading-3')} }
small { display: block; color: var(--text-secondary); ${style('body-small')} }
.temps { display: flex; gap: var(--gap-within-component); }
.temps li { flex: auto; flex-basis: 0; display: flex; flex-direction: column; padding: var(--gap-between-blocks) var(--padding-tag); border-radius: var(--border-radius-surface); background: var(--background-subtle); color: var(--text-secondary); ${style('label')} }
.temps li small { color: inherit; }
.temps .en-cours { background: var(--background-info-subtle); color: var(--text-info); }
.temps .faite { background: var(--background-inverse); color: var(--text-on-inverse); }
.tete { display: flex; flex-direction: column; gap: var(--gap-between-blocks); }
.ligne { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-between-blocks) var(--gap-between-components); }
.statut { padding: var(--gap-within-component) var(--padding-tag); border-radius: var(--border-radius-full); background: var(--background-info-subtle); color: var(--text-info); ${style('label')} }
.statut.neutre { background: var(--background-inverse); color: var(--text-on-inverse); }
.etapes, .groupes { display: flex; flex-direction: column; gap: var(--gap-between-components); }
.etape { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--gap-between-components); padding: var(--padding-component); border: var(--border-width-default) solid var(--border-subtle); border-radius: var(--border-radius-surface); background: var(--background-surface); }
.num { display: flex; flex: none; align-items: center; justify-content: center; width: var(--height-control-small); height: var(--height-control-small); border-radius: var(--border-radius-full); background: var(--background-inverse); color: var(--text-on-inverse); ${style('label')} }
.corps { display: flex; flex: auto; flex-direction: column; gap: var(--gap-within-component); }
.portes { display: flex; flex-wrap: wrap; gap: var(--gap-within-component); }
.porte { padding: 0 var(--padding-tag); border-radius: var(--border-radius-full); background: var(--background-info-subtle); color: var(--text-info); white-space: nowrap; ${style('label')} }
.encart { padding: var(--gap-between-blocks) var(--padding-component); border: var(--border-width-default) dashed var(--border-default); border-radius: var(--border-radius-surface); }
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
button.principal { background: var(--background-inverse); border-color: var(--background-inverse); color: var(--text-on-inverse); }
button:disabled { background: var(--background-subtle); border-color: var(--border-subtle); color: var(--text-secondary); cursor: default; }
button:focus-visible, input:focus-visible { outline: var(--border-width-focus) solid var(--text-info); outline-offset: var(--offset-focus); }
.ajout { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--gap-between-blocks); }
.ajout label { display: flex; flex: auto; flex-direction: column; gap: var(--gap-within-component); min-width: 0; ${style('label')} }
.ajout input { width: 100%; min-height: var(--height-control-medium); padding: 0 var(--padding-tag); border: var(--border-width-default) solid var(--border-default); border-radius: var(--border-radius-control); background: var(--background-surface); color: var(--text-default); ${style('body-medium')} }
.erreur { flex-basis: 100%; color: var(--text-error); ${style('label')} }
.barre { position: sticky; bottom: 0; border-top: var(--border-width-default) solid var(--border-subtle); background: var(--background-surface); }
.barre > div { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--gap-between-blocks) var(--gap-between-components); max-width: var(--width-page); min-height: var(--height-control-medium); margin: 0 auto; padding: var(--gap-between-blocks) var(--padding-component); }
.avance { display: flex; flex-direction: column; }
progress { width: 100%; }
.pastilles { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-between-blocks); }
.pastilles li { padding: 0 var(--padding-tag); border: var(--border-width-default) solid var(--border-subtle); border-radius: var(--border-radius-full); background: var(--background-surface); ${style('body-small')} }
.blocs { display: flex; flex-direction: column; gap: var(--gap-section); }
.bloc { display: flex; flex-direction: column; gap: var(--gap-between-components); }
.titre-bloc { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--gap-between-blocks) var(--gap-between-components); }
.titre-bloc a, .autres a { color: var(--text-info); ${style('label')} }
.fort { display: block; ${style('display-medium')} }
.cartes { display: flex; flex-wrap: wrap; gap: var(--gap-between-components); }
.carte { display: flex; flex: auto; flex-basis: var(--width-column); flex-direction: column; gap: var(--gap-between-blocks); min-width: 0; padding: var(--padding-component); border: var(--border-width-default) solid var(--border-subtle); border-radius: var(--border-radius-surface); background: var(--background-surface); }
.carte h3 { display: flex; align-items: baseline; justify-content: space-between; gap: var(--gap-between-blocks); margin: 0; ${style('label')} }
.carte h3 span { ${style('heading-3')} }
.dessins { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--gap-between-blocks) var(--padding-tag); }
.dessins li { display: flex; flex-direction: column; align-items: center; gap: var(--gap-within-component); }
.dessins small { color: var(--text-secondary); }
.dessins .hors small { color: var(--text-info); ${style('label')} }
.nuancier { display: flex; flex-wrap: wrap; gap: var(--gap-within-component); }
.nuancier rect { stroke: var(--border-subtle); }
.tailles text { fill: var(--text-default); }
.tailles .hors text { fill: var(--text-info); }
.ecarts rect { fill: var(--background-inverse); }
.ecarts .hors rect { fill: var(--text-info); }
.rayons path { fill: var(--background-subtle); stroke: var(--text-default); }
.versions { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--gap-between-components); }
.versions li { display: flex; flex-direction: column; align-items: flex-start; gap: var(--gap-within-component); max-width: 100%; }
.versions img { max-width: 100%; max-height: var(--avatar-size-large); width: auto; border: var(--border-width-default) solid var(--border-subtle); border-radius: var(--border-radius-control); background: var(--background-subtle); }
.aussi { display: flex; flex-direction: column; gap: var(--gap-within-component); padding-left: var(--gap-between-groups); list-style: disc; }
.couleur { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-between-blocks) var(--gap-between-components); }
.couleur code { ${style('heading-3')} }
.echelle { display: flex; flex-wrap: wrap; gap: var(--gap-within-component); }
.echelle li { display: flex; flex-direction: column; align-items: center; gap: var(--gap-within-component); }
.echelle rect { stroke: var(--border-subtle); }
.echelle .plein rect { stroke: var(--text-default); stroke-width: var(--border-width-focus); }
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
.chiffres li { display: flex; flex-direction: column; color: var(--text-secondary); ${style('label')} }
.chiffres .fort { color: var(--text-default); }
.relations { display: flex; flex-direction: column; gap: var(--gap-between-blocks); }
.relations li { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-within-component) var(--gap-between-blocks); }
.planches a { color: var(--text-info); ${style('label')} }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-between-blocks); }
button.discret { border-color: transparent; background: none; color: var(--text-info); }
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
.exemple { display: flex; flex-wrap: wrap; align-items: center; gap: var(--gap-within-component) var(--gap-between-blocks); }
.document { display: flex; flex-direction: column; gap: var(--gap-between-blocks); }
.document h2 { margin-top: var(--gap-between-components); }
.document h3 { margin: 0; ${style('label')} }
.document ul { display: flex; flex-direction: column; gap: var(--gap-within-component); padding-left: var(--gap-between-groups); list-style: disc; }
.document li, .document p { overflow-wrap: anywhere; }
.document pre { margin: 0; padding: var(--gap-between-blocks) var(--padding-tag); overflow-x: auto; border-radius: var(--border-radius-control); background: var(--background-subtle); }
.retour { color: var(--text-info); ${style('label')} }
.direct { margin-left: auto; color: var(--text-info); ${style('label')} }
.message { width: 100%; padding: var(--gap-between-blocks) var(--padding-tag); border: var(--border-width-default) solid var(--border-default); border-radius: var(--border-radius-control); background: var(--background-surface); color: var(--text-default); resize: vertical; ${style('body-medium')} }
.message:focus-visible { outline: var(--border-width-focus) solid var(--text-info); outline-offset: var(--offset-focus); }
.manque { display: flex; flex-direction: column; gap: var(--gap-within-component); padding-left: var(--gap-between-groups); list-style: disc; }
`;

/**
 * Le gabarit d'un écran.
 * @param {{ titre: string, onglet: string, statut: { texte: string, neutre?: boolean }, phrase: string, sousTete?: string,
 *   temps: { nom: string, etat: EtatEtape }[], corps: string, avance: [string, string], action?: string, rafraichir?: boolean, regles?: string }} o
 *   regles : des règles de style propres à l'écran, aux mêmes valeurs que le reste (variables, mots-clés)
 */
function gabarit(o) {
  const temps = o.temps
    .map((t, i) => `<li class="${t.etat === 'faite' ? 'faite' : t.etat === 'en cours' ? 'en-cours' : 'a-venir'}">${esc(`${i + 1} · ${t.nom}`)}<small>${esc(t.etat === 'faite' ? 'fait' : t.etat)}</small></li>`)
    .join('');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${o.rafraichir ? '<meta http-equiv="refresh" content="2">\n' : ''}<title>${esc(o.onglet)}</title>
<style>
${blocJetons()}${CSS}${o.regles ?? ''}</style>
</head>
<body>
<main>
<ul class="temps" aria-label="Les quatre temps">${temps}</ul>
<div class="tete"><div class="ligne"><h1>${esc(o.titre)}</h1><span class="statut${o.statut.neutre ? ' neutre' : ''}">${esc(o.statut.texte)}</span></div><p>${esc(o.phrase)}</p>${o.sousTete ?? ''}</div>
${o.corps}
</main>
<footer class="barre"><div><div class="avance"><strong>${esc(o.avance[0])}</strong><small>${esc(o.avance[1])}</small></div>${o.action ?? ''}</div></footer>
</body>
</html>
`;
}

/** Les quatre temps, tous à venir. */
const A_VENIR = ['Mesurer', 'Décider', 'Poser', 'Tenir'].map((nom) => ({ nom, etat: /** @type {EtatEtape} */ ('à venir') }));

/** Ce que fait chaque temps, et ses portes : là où l'humain décide. */
const QUATRE = [
  ['Mesurer', 'Ce que tes pages affichent vraiment : les couleurs, les espacements, les tailles, les composants.', []],
  ['Décider', 'Ta marque, puis les cas qu’aucune règle ne sait trancher.', ['Porte 1 · la marque', 'Porte 2 · la revue']],
  ['Poser', 'Le résultat arrive à côté de l’ancien code. Rien n’est écrasé.', ['Porte 3 · avant, après']],
  ['Tenir', 'On remesure le site réel, puis un contrôle refuse ce qui sort du système.', []],
];

/**
 * Le lancement : avant toute adresse, et donc avant le projet. Il se recharge seul jusqu'à ce que le projet existe.
 */
export function ecranDeLancement() {
  const etapes = QUATRE.map(
    ([nom, texte, portes], i) =>
      `<li class="etape"><span class="num" aria-hidden="true">${i + 1}</span><div class="corps"><h2>${esc(String(nom))}</h2><small>${esc(String(texte))}</small></div>${
        portes.length ? `<div class="portes">${/** @type {string[]} */ (portes).map((p) => `<span class="porte">${esc(p)}</span>`).join('')}</div>` : ''
      }</li>`,
  ).join('\n');
  return gabarit({
    titre: 'Le parcours',
    onglet: 'Le parcours',
    statut: { texte: 'Rien à décider', neutre: true },
    phrase: 'D’un site existant à un design system, sans chantier interminable. Quatre temps. Tu décides trois fois.',
    temps: A_VENIR,
    corps: `<ol class="etapes">\n${etapes}\n</ol>
<div class="encart"><strong>Pour commencer</strong> · l’adresse d’un site, ou de plusieurs<small>Elle se donne dans le chat, à gauche.</small></div>`,
    avance: ['Avant de commencer', 'Donne l’adresse dans le chat.'],
    rafraichir: true,
  });
}

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
 * La mesure en cours (D77) : ce qui se passe, à quoi ça sert, et un signe que ça tourne. Il se recharge seul, et passe
 * seul à l'écran suivant quand la mesure est faite. La barre de progression est celle du navigateur : aucun jeton de
 * mouvement n'existe encore (B2).
 * @param {Etat} e
 */
export function ecranDeMesure(e) {
  const n = e.sites.reduce((t, s) => t + s.pages.length, 0);
  const pages = n > 1 ? `tes ${n} pages` : 'ta page';
  return gabarit({
    titre: `Je mesure ${pages}`,
    onglet: `La mesure · ${e.produit}`,
    statut: { texte: 'Rien à décider', neutre: true },
    phrase: 'Ce que tes pages affichent vraiment : les couleurs, les tailles de texte, les espacements, les arrondis et les composants. C’est la dette de départ, ce qu’on va ranger ensemble.',
    temps: e.temps,
    corps: '<progress aria-label="Mesure en cours"></progress>',
    avance: ['Mesurer · en cours', 'L’écran passe seul à la suite.'],
    rafraichir: true,
  });
}

/** L'adresse d'une vignette. @param {string} id @param {string} chemin */
const hrefVignette = (id, chemin) => `/vignette/${encodeURIComponent(id)}?page=${encodeURIComponent(chemin)}`;

/**
 * Les pages à mesurer : un groupe par site, les pages retenues, retirer, ajouter, puis « Mesurer ces n pages ».
 * @param {Etat} e
 * @param {{ sites: import('./projet.js').Site[], erreur?: ErreurAjout | null }} o
 */
export function ecranDesPages(e, { sites, erreur = null }) {
  const unSite = sites.length === 1;
  const total = sites.reduce((n, s) => n + s.pages.length, 0);
  const vide = sites.some((s) => !s.pages.length);
  const hote = (/** @type {import('./projet.js').Site} */ s) => new URL(s.origine).host;
  const groupes = sites
    .map((s) => {
      const pages = s.pages
        .map((p) => {
          const nom = s.noms[p] ?? p;
          return `<li class="page"><img class="vignette" src="${esc(hrefVignette(s.id, p))}" alt=""><span class="nom"><strong>${esc(nom)}</strong><small>${esc(hote(s) + p)}</small></span><form method="post" action="/pages/retirer"><input type="hidden" name="site" value="${esc(s.id)}"><input type="hidden" name="page" value="${esc(p)}"><button type="submit" class="retirer" aria-label="${esc(`Retirer ${nom}`)}">Retirer</button></form></li>`;
        })
        .join('\n');
      const err = erreur?.site === s.id ? erreur : null;
      return `<section class="site" aria-label="${esc(s.nom ?? s.id)}">${unSite ? '' : `<header><h2>${esc(s.nom ?? s.id)}</h2><small>${esc(hote(s))}</small></header>`}
<ul class="pages">\n${pages}\n</ul>
<form class="ajout" method="post" action="/pages/ajouter"><input type="hidden" name="site" value="${esc(s.id)}"><label>Ajouter une page<input type="text" name="adresse" inputmode="url" autocomplete="off" placeholder="${esc(`${hote(s)}/…`)}" value="${esc(err?.saisie ?? '')}"${err ? ' aria-invalid="true" aria-describedby="erreur-' + esc(s.id) + '"' : ''}></label><button type="submit">Ajouter</button><span class="erreur" id="erreur-${esc(s.id)}" role="status">${esc(err?.message ?? '')}</span></form>
</section>`;
    })
    .join('\n');
  const libelle = vide ? (unSite ? 'Aucune page' : 'Une page au moins par site') : `Mesurer ${total > 1 ? `ces ${total} pages` : 'cette page'} ›`;
  return gabarit({
    titre: 'Les pages à mesurer',
    onglet: `Les pages à mesurer · ${e.produit}`,
    statut: { texte: 'À toi de décider' },
    phrase: unSite
      ? 'Les pages les plus représentatives de ton site, celles qui portent le plus de composants. Tu peux les changer.'
      : `${sites.length} sites, un même produit. Pour chacun, ses pages les plus représentatives. Quand deux sites ont les mêmes modèles de page, ce sont les mêmes qui sont retenus, pour comparer. Tu peux les changer.`,
    temps: e.temps,
    corps: `<div class="groupes">\n${groupes}\n</div>
<div class="encart"><strong>Rien hors de cette liste n’est mesuré.</strong><small>Une page oubliée garde sa dette, sans que personne la voie.</small></div>`,
    avance: ['Mesurer · les pages', unSite ? 'Garde ou change la liste, puis lance la mesure.' : 'Garde ou change les listes, puis lance la mesure.'],
    action: `<form method="post" action="/pages/mesurer"><button type="submit" class="principal"${vide ? ' disabled' : ''}>${esc(libelle)}</button></form>`,
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
  if (f.cle === 'colors') {
    /** @param {typeof f.valeurs} l @param {string} nom */
    const rang = (l, nom) =>
      l.length
        ? `<ul class="nuancier" aria-label="${esc(nom)}">${l.map((v) => `<li><svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-label="${esc(`${v.valeur}, ${fois(v.fois)}`)}">${titre(v)}<rect x="0.5" y="0.5" width="23" height="23" rx="4" fill="${esc(v.valeur)}"/></svg></li>`).join('')}</ul>`
        : '';
    const gris = f.valeurs.filter((v) => v.gris);
    const autres = f.valeurs.filter((v) => !v.gris);
    return rang(gris, `Les ${gris.length} gris`) + rang(autres, `Les ${autres.length} autres couleurs`);
  }
  /** @param {string} classe @param {(v: typeof f.valeurs[number]) => string} figure @param {(v: typeof f.valeurs[number]) => string} legende */
  const liste = (classe, figure, legende) =>
    `<ul class="dessins ${classe}">${f.valeurs.map((v) => `<li${v.hors ? ' class="hors"' : ''}>${figure(v)}<small>${esc(legende(v))}</small></li>`).join('')}</ul>`;
  if (f.cle === 'fontSizes')
    return liste(
      'tailles',
      (v) => {
        const t = /** @type {number} */ (px(v.valeur));
        return `<svg width="${Math.ceil(t * 1.4)}" height="${Math.ceil(t * 1.2)}" viewBox="0 0 ${Math.ceil(t * 1.4)} ${Math.ceil(t * 1.2)}" aria-hidden="true">${titre(v)}<text x="0" y="${t}" font-size="${t}" font-weight="600">Aa</text></svg>`;
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

/**
 * La dette (D78) : à regarder, rien à décider. Les valeurs, puis les composants ; en bas, « Passer à ta marque ».
 * @param {Etat} e
 */
export function ecranDeLaDette(e) {
  const d = /** @type {NonNullable<Etat['dette']>} */ (e.dette);
  const v = d.valeurs;
  const valeurs = v
    ? `<section class="bloc" aria-labelledby="t-valeurs"><div class="titre-bloc"><h2 id="t-valeurs">Les valeurs</h2>${d.valeursHref ? `<a href="${esc(d.valeursHref)}">Voir toutes les valeurs</a>` : ''}</div>
<p><span class="fort">${v.total}</span>valeurs différentes affichées sur ces pages : couleurs, tailles de texte, espacements, arrondis.</p>
<div class="cartes">
${v.familles.map((f) => `<div class="carte"><h3>${esc(f.titre)} <span>${f.compte}</span></h3>${f.phrases.length ? `<p>${esc(f.phrases.join(' '))}</p>` : ''}${dessin(f)}</div>`).join('\n')}
</div></section>`
    : '';
  const c = d.composants;
  const composants = `<section class="bloc" aria-labelledby="t-composants"><div class="titre-bloc"><h2 id="t-composants">Les composants</h2><a href="${esc(d.composantsHref)}">Voir tous les composants</a></div>
<p>${esc(c.phrase)}</p>
<div class="cartes">
${c.types
  .map(
    (t) =>
      `<div class="carte"><h3>${esc(t.nom)} <span>${t.versions.length > 1 ? `${t.versions.length} versions` : '1 version'}</span></h3><p>${esc(t.phrases.join(' '))}</p><ul class="versions">${t.versions
        .map((x) => `<li>${x.capture ? `<img src="${esc(`${d.captures}/${x.capture}`)}" alt="${esc(`${t.nom}, ${x.nom}`)}">` : ''}<small>${esc(`${x.nom}, ${fois(x.fois)}${x.sansStyle ? ', sans style' : ''}`)}</small></li>`)
        .join('')}</ul></div>`,
  )
  .join('\n')}
${c.aussi.length ? `<div class="carte"><h3>À regarder aussi</h3><ul class="aussi">${c.aussi.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
</div></section>`;
  const autres = d.autres.length
    ? `<p class="autres">Les autres sites, à part pour l’instant : ${d.autres.map((x) => `<a href="${esc(x.href)}">${esc(x.nom)}</a>`).join(', ')}.</p>`
    : '';
  const n = d.pages.length;
  return gabarit({
    titre: `La dette de ${e.produit}`,
    onglet: `La dette · ${e.produit}`,
    statut: { texte: 'Rien à décider', neutre: true },
    phrase: `${n > 1 ? `${n} pages mesurées` : '1 page mesurée'}${e.unSite ? '' : `, sur ${d.site.nom ?? d.site.id}`} :`,
    sousTete: `<ul class="pastilles">${d.pages.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`,
    temps: e.temps,
    corps: `<div class="blocs">\n${valeurs}\n${composants}\n${autres}</div>`,
    avance: ['Mesurer · fait', 'Regarde la dette, puis passe à ta marque.'],
    action: '<form method="post" action="/pages/dette"><button type="submit" class="principal">Passer à ta marque ›</button></form>',
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
<form method="post" action="/pages/marque/couleur"><input type="hidden" name="role" value="${role}"><small>Les couleurs lues sur tes pages :</small><ul class="choix">${choix}</ul></form>
<form class="ajout" method="post" action="/pages/marque/couleur"><input type="hidden" name="role" value="${role}"><label>Ou un code<input type="text" name="hex" autocomplete="off" placeholder="#2b4c7e" value="${esc(err?.saisie ?? '')}"${err ? ` aria-invalid="true" aria-describedby="erreur-${role}"` : ''}></label><button type="submit">Appliquer</button><span class="erreur" id="erreur-${role}" role="status">${esc(err?.message ?? '')}</span></form>
</details>`;
}

/**
 * Le bloc d'une couleur de la marque : sa pastille, son code, d'où elle vient, ce que l'outil en fait.
 * @param {{ titre: string, hex: string, relevee: import('./marque.js').Relevee | undefined, aide: string, echelle: import('./marque.js').Echelle | null,
 *   role: 'primary' | 'accent', motifs: string[], suite?: string, modifier: string }} o
 */
function blocCouleur(o) {
  const d = o.relevee;
  const lue = d
    ? `Lue sur ${d.elements > 1 ? `${d.elements} éléments` : '1 élément'} de tes pages${o.role === 'primary' && d.cliquables ? `, dont ${d.cliquables} qui se cliquent` : ''}.`
    : 'Pas lue sur tes pages.';
  const e = o.echelle;
  const pas = e
    ? `<ul class="echelle" aria-label="Les douze pas">${e.pas
        .map((h, i) => `<li${i + 1 === e.plein.pas ? ' class="plein"' : ''}><svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="4" fill="${esc(h)}"/></svg><small>${i + 1}</small></li>`)
        .join('')}</ul>`
    : '';
  const exacte = e && e.plein.fond === o.hex;
  const verdict = !e
    ? ''
    : o.role === 'primary'
      ? exacte
        ? `Ta couleur exacte est sur le bouton, avec un texte ${e.plein.blanc ? 'blanc' : 'foncé'}. C’est le pas 9, encadré.`
        : `Adaptée pour le bouton : avec un texte lisible, ta couleur exacte ne passerait pas. Le bouton prend le pas ${e.plein.pas}, encadré. Ta couleur exacte reste sur les aplats.`
      : exacte
        ? `Ta couleur exacte est sur les aplats, avec un texte ${e.plein.blanc ? 'blanc' : 'foncé'}.`
        : `Adaptée pour les aplats : ils prennent le pas ${e.plein.pas}, encadré.`;
  return `<div class="carte"><h3>${esc(o.titre)}</h3>
<div class="couleur">${pastille(o.hex)}<code>${esc(o.hex)}</code><small>${esc(lue)} ${esc(o.aide)}</small></div>
${pas}${e ? `<div class="echantillons">${echantillon(e.plein.fond, e.plein.texte, o.role === 'primary' ? 'Bouton' : 'Aplat')}</div><p>${esc(verdict)}</p>` : ''}
${o.motifs.map((m) => `<p class="refus">${esc(m)}</p>`).join('')}${o.modifier}${o.suite ?? ''}</div>`;
}

/**
 * La marque (D80) : la première des trois portes. Deux couleurs et la police des titres, lues sur les pages, avec ce
 * que l'outil en fait ; en bas, « Confirmer la marque », impossible si la marque est refusée.
 * @param {Etat} e
 * @param {{ erreur?: ErreurAjout | null }} [o]  le code tapé refusé : la couleur (site), la raison, la saisie
 */
export function ecranDeLaMarque(e, { erreur = null } = {}) {
  const m = /** @type {NonNullable<Etat['marque']>} */ (e.marque);
  const { choix, lecture, apercu } = m;
  const relevee = (/** @type {string | null} */ h) => lecture.relevees.find((r) => r.hex === h);
  const motifs = (/** @type {string} */ b) => apercu.motifs.filter((x) => x.bloc === b).map((x) => x.texte);
  const ira = choix.troisieme ? echelleDeLaTroisieme(choix.troisieme) : null;
  const troisieme = choix.troisieme
    ? `<div class="couleur">${pastille(choix.troisieme, 24)}<small>${esc(`${choix.troisieme}, lue sur ${relevee(choix.troisieme)?.elements ?? 0} éléments. Une marque garde deux couleurs : ${ira ? `celle-ci ira sur ${nomAffiche(ira)}, l’échelle de la palette qui a sa teinte.` : 'celle-ci passera aux gris.'}`)}</small><form method="post" action="/pages/marque/echanger"><button type="submit" class="retirer">Échanger avec l’accent</button></form></div>`
    : '';
  const police = choix.police
    ? `<div class="carte"><h3>Police des titres</h3><div class="couleur"><code>${esc(choix.police[0])}</code><small>${esc(`Lue sur ${lecture.titres} titres de tes pages.`)}</small></div>
<svg class="police" width="100%" height="48" role="img" aria-label="${esc(e.produit)}"><text x="0" y="36" font-size="32" font-weight="700" font-family="${esc(choix.police.join(', '))}">${esc(e.produit)}</text></svg>
<p>Le texte courant et les boutons gardent la police du produit. Non contrôlée : sans le fichier de la police, l’outil ne peut pas vérifier ses graisses ni ses accents.</p></div>`
    : '';
  const refusee = apercu.motifs.length > 0;
  const generale = motifs('marque');
  return gabarit({
    titre: `La marque de ${e.produit}`,
    onglet: `La marque · ${e.produit}`,
    statut: { texte: 'À toi de décider' },
    phrase: 'Trois choses à confirmer, lues sur ton site. Diapason apporte le reste.',
    sousTete:
      '<details><summary>C’est quoi Diapason ?</summary><p>Diapason est le design system que ds-lab t’apporte. Tu donnes ta couleur, ton accent et ta police de titres. Il fournit les espacements, les tailles de texte, les rôles et les règles, les mêmes pour chaque marque.</p></details>',
    temps: e.temps,
    corps: `<div class="cartes">
${blocCouleur({ titre: 'Couleur primaire', hex: choix.primary, relevee: relevee(choix.primary), aide: 'C’est ce qui se clique.', echelle: apercu.primary, role: 'primary', motifs: motifs('primary'), modifier: modifier('primary', choix.primary, lecture.relevees, erreur) })}
${choix.accent ? blocCouleur({ titre: 'Accent', hex: choix.accent, relevee: relevee(choix.accent), aide: 'Facultatif. Sans accent, le système prend un neutre.', echelle: apercu.accent, role: 'accent', motifs: motifs('accent'), suite: troisieme, modifier: modifier('accent', choix.accent, lecture.relevees, erreur) }) : ''}
${police}
</div>
${generale.map((x) => `<p class="refus">${esc(x)}</p>`).join('')}
<p class="${refusee ? 'refus' : 'accepte'}">${refusee ? 'Marque refusée : change la couleur dite plus haut.' : 'Marque acceptée : chaque texte tient son contraste sur son fond, en clair et en sombre.'}</p>`,
    avance: ['Décider · porte 1 sur 3', refusee ? 'Change la couleur refusée, puis confirme.' : 'Confirme la marque, ou change-la.'],
    action: `<form method="post" action="/pages/marque"><button type="submit" class="principal"${refusee ? ' disabled' : ''}>Confirmer la marque ›</button></form>`,
  });
}

/**
 * L'écriture des jetons, après « Confirmer la marque » (D83) : l'écran d'attente du gabarit. Il se recharge seul, et
 * passe seul aux fondations quand les jetons, les planches, la feuille CSS et le thème sont écrits.
 * @param {Etat} e
 */
export function ecranDesJetons(e) {
  return gabarit({
    titre: 'Je prépare tes fondations',
    onglet: `Les fondations · ${e.produit}`,
    statut: { texte: 'Rien à décider', neutre: true },
    phrase: 'À partir de ta marque : les douze pas de tes couleurs, les rôles, les contrôles, la feuille de variables et le thème. Rien ne touche ton site.',
    temps: e.temps,
    corps: '<progress aria-label="Écriture des tokens"></progress>',
    avance: ['Décider · après la porte 1', 'L’écran passe seul aux fondations.'],
    rafraichir: true,
  });
}

/** Un nombre et ce qu'il compte, en grand. @param {number} n @param {string} quoi */
const chiffre = (n, quoi) => `<li><span class="fort">${n}</span>${esc(quoi)}</li>`;

/** Une échelle de douze pas, dessinée. @param {string} nom @param {string[]} pas */
const douzePas = (nom, pas) =>
  `<div class="carte"><h3>${esc(nom)}</h3><ul class="echelle" aria-label="${esc(`${nom}, les douze pas`)}">${pas
    .map((h, i) => `<li><svg width="32" height="32" viewBox="0 0 32 32" role="img" aria-label="${esc(`Pas ${i + 1}, ${h}`)}"><rect x="1" y="1" width="30" height="30" rx="4" fill="${esc(h)}"/></svg><small>${i + 1}</small></li>`)
    .join('')}</ul></div>`;

/** Un écart dessiné, sa longueur en px. @param {number} l */
const barreEcart = (l) => `<svg width="${Math.max(l, 1)}" height="24" viewBox="0 0 ${Math.max(l, 1)} 24" aria-hidden="true"><rect width="${l}" height="24" rx="2"/></svg>`;

/**
 * Les fondations (D83) : à regarder, rien à décider. Ce qui vient d'être préparé à partir de la marque, les rôles, les
 * règles, ce que le développeur peut vérifier, et ce qui n'est pas encore fait. En bas, « Comparer mon site ».
 * @param {Etat} e
 */
export function ecranDesFondations(e) {
  const f = /** @type {NonNullable<Etat['fondations']>} */ (e.fondations);
  const n = f.espacements.length;
  const remplace = f.avant
    ? `<p>${esc(`Tes pages affichaient ${f.avant} valeurs différentes. Les voici remplacées par deux couleurs de douze pas, ${n} espacements, ${f.tailles.length} tailles de texte et ${f.rayons.length} arrondis.`)}</p>`
    : '';
  const valeurs = `<section class="bloc" aria-labelledby="t-valeurs"><h2 id="t-valeurs">1 · Les valeurs</h2>
<p>Tout ce qui existe. Rien d’autre ne peut être utilisé.</p>${remplace}
<div class="cartes">
${douzePas('Primaire, 12 pas', f.primaire)}
${f.accent ? douzePas('Accent, 12 pas', f.accent) : ''}
</div>
<div class="cartes">
<div class="carte"><h3>Espacements <span>${n}</span></h3><ul class="dessins ecarts">${f.espacements.map((l) => `<li>${barreEcart(l)}<small>${l}</small></li>`).join('')}</ul></div>
<div class="carte"><h3>Tailles de texte <span>${f.tailles.length}</span></h3><ul class="dessins tailles">${f.tailles
    .map((t) => `<li><svg width="${Math.ceil(t * 1.4)}" height="${Math.ceil(t * 1.2)}" viewBox="0 0 ${Math.ceil(t * 1.4)} ${Math.ceil(t * 1.2)}" aria-hidden="true"><text x="0" y="${t}" font-size="${t}" font-weight="600">Aa</text></svg><small>${t}</small></li>`)
    .join('')}</ul></div>
<div class="carte"><h3>Arrondis <span>${f.rayons.length}</span></h3><ul class="dessins rayons">${f.rayons
    .map((r) => {
      const v = Math.min(20, r.px);
      return `<li><svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M1 39 V${1 + v} A${v} ${v} 0 0 1 ${1 + v} 1 H39" stroke-width="2"/></svg><small>${esc(r.nom === 'full' ? 'rond' : String(r.px))}</small></li>`;
    })
    .join('')}</ul></div>
</div></section>`;
  const r = f.roles;
  const roles = `<section class="bloc" aria-labelledby="t-roles"><h2 id="t-roles">2 · Les rôles</h2>
<p>À quoi sert chaque valeur. Un composant ne connaît que le rôle, jamais la couleur.</p>
<ul class="chiffres">${chiffre(r.fonds, 'fonds')}${chiffre(r.textes, 'textes')}${chiffre(r.bordures, 'bordures')}${chiffre(r.styles, 'styles de texte')}${chiffre(r.ecarts, 'écarts')}</ul>
<div class="cartes"><div class="carte"><h3>Cinq relations d’espace</h3><p>On choisit un lien, pas un nombre.</p><ul class="relations ecarts">${f.relations
    .map((x) => `<li>${barreEcart(x.px)}<span>${esc(x.nom)}</span><small>${x.px} px</small></li>`)
    .join('')}</ul></div></div></section>`;
  const p = f.paires;
  const planches = f.planches.length
    ? `<p class="planches">${f.planches.map((x) => `<a href="${esc(f.planche + x.fichier)}">${esc(x.nom)}</a>`).join(' · ')}</p>`
    : '';
  const regles = `<section class="bloc" aria-labelledby="t-regles"><h2 id="t-regles">3 · Les règles</h2>
<p>Ce qui tient le tout, contrôlé par la machine.</p>
<ul class="chiffres">${chiffre(p.controlees, 'paires texte et fond contrôlées')}${chiffre(p.echec, 'en échec')}${chiffre(p.interdites, 'paires interdites')}${chiffre(f.regles, 'règles et valeurs par défaut, les mêmes pour chaque marque')}</ul>
${planches}</section>`;
  const art = `<section class="bloc" aria-labelledby="t-art"><h2 id="t-art">✓ · Dans les règles de l’art</h2>
<p>Ce que le développeur et un auditeur peuvent vérifier.</p>
<div class="cartes">${f.preuves.map((x) => `<div class="carte"><h3>${esc(x.titre)}</h3><p>${esc(x.texte)}</p></div>`).join('\n')}</div>
<p><small>${esc(`Limites connues : ${f.limites.join(' ; ')}.`)}</small></p></section>`;
  const pasEncore = `<div class="cartes">
<div class="encart"><strong>Pas encore</strong> · posées sur ton site<small>au temps 3, Poser</small></div>
<div class="encart"><strong>Pas encore</strong> · les composants remplacés dans ton code<small>au temps 4, Tenir</small></div>
</div>`;
  return gabarit({
    titre: `Les fondations de ${e.produit}`,
    onglet: `Les fondations · ${e.produit}`,
    statut: { texte: 'Rien à décider', neutre: true },
    phrase: 'Ce qui vient d’être préparé à partir de ta marque. Rien n’est encore posé sur ton site.',
    temps: e.temps,
    corps: `<div class="blocs">\n${valeurs}\n${roles}\n${regles}\n${art}\n${pasEncore}\n</div>`,
    avance: ['Décider · après la porte 1', 'Regarde tes fondations, puis compare ton site.'],
    action: '<form method="post" action="/pages/fondations"><button type="submit" class="principal">Comparer mon site ›</button></form>',
  });
}

/** Une valeur dite : « 3 px », « 50 % », une couleur telle quelle. @param {string} v */
const valeurDite = (v) => (px(v) !== null ? `${fr(/** @type {number} */ (px(v)), { decimales: 2 })} px` : v.replace('%', ' %'));

/**
 * L'avant et après (D86), la troisième porte : chaque page mesurée, telle qu'elle était et telle que les feuilles
 * ajoutées la rendent, au même endroit ; ce qui a changé, compté par famille, avec un exemple. Sans script : un onglet
 * par page et la bascule sont des boutons radio, l'image cachée garde sa place. La plus haute des deux images tient le
 * cadre, l'autre se pose dessus : rien ne saute. En bas, « Valider le rendu » ; à côté, « Revenir sur une décision ».
 * @param {Etat} e
 */
export function ecranAvantApres(e) {
  const a = /** @type {NonNullable<Etat['avantApres']>} */ (e.avantApres);
  const onglets = a.vues.map((v, i) => `<input type="radio" name="page" id="page-${i}" class="choix-page"${i === 0 ? ' checked' : ''}><label for="page-${i}">${esc(v.nom)}</label>`).join('\n');
  const vues = a.vues
    .map((v, i) => {
      const image = (/** @type {'avant' | 'apres'} */ q, /** @type {string} */ src, /** @type {string} */ dit) =>
        `<img class="${q} ${v.plusHaute === q ? 'fond' : 'dessus'}" src="${esc(src)}" alt="${esc(`${v.nom}, ${dit}`)}">`;
      return `<div class="vue vue-${i}" role="group" aria-label="${esc(v.nom)}">
<input type="radio" name="bascule-${i}" id="avant-${i}" class="voir-avant"><label for="avant-${i}">Avant</label>
<input type="radio" name="bascule-${i}" id="apres-${i}" class="voir-apres" checked><label for="apres-${i}">Après</label>
<a class="direct" href="${esc(v.direct)}">Ouvrir la page en direct</a>
<div class="cadre">${image('avant', v.avant, 'avant')}${image('apres', v.apres, 'après')}</div>
</div>`;
    })
    .join('\n');
  // Une règle par page : son onglet coché montre sa vue.
  const regles = a.vues.map((_, i) => `#page-${i}:checked ~ .vues > .vue-${i} { display: flex; }`).join('\n');
  const tous = a.arrivees === a.changements;
  const titre = `${nombre(a.changements, 'changement', 'changements')}, ${tous ? (a.changements > 1 ? 'tous arrivés' : 'arrivé') : `${a.arrivees} ${a.arrivees > 1 ? 'arrivés' : 'arrivé'}`}`;
  const manque = [
    ...(a.manquantes.length ? [`<p>Pas arrivé :</p><ul class="manque">${a.manquantes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`] : []),
    ...(a.enEtat.length ? [`<p>Visible seulement au survol, au focus ou à l’appui, à regarder à la main :</p><ul class="manque">${a.enEtat.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`] : []),
  ].join('\n');
  const cartes = a.familles
    .filter((f) => f.compte)
    .map((f) => {
      const x = f.exemple;
      const exemple = !x
        ? ''
        : f.cle === 'colors'
          ? `<p class="exemple">${pastille(x.ancienne, 24)}<code>${esc(x.ancienne)}</code><span aria-hidden="true">→</span>${pastille(x.nouvelle, 24)}<code>${esc(x.nouvelle)}</code></p>`
          : `<p class="exemple"><code>${esc(valeurDite(x.ancienne))}</code><span aria-hidden="true">→</span><code>${esc(valeurDite(x.nouvelle))}</code></p>`;
      return `<div class="carte"><h3>${esc(f.titre.charAt(0).toUpperCase() + f.titre.slice(1))} <span>${f.compte}</span></h3>${exemple}${x ? `<small>${esc(`dont ${x.ou}`)}</small>` : ''}</div>`;
    })
    .join('\n');
  const decisions = a.decisions ? `Tes ${nombre(a.decisions, 'décision', 'décisions')} et les réglages de l’outil, ensemble,` : 'Les réglages de l’outil,';
  return gabarit({
    titre: 'Avant, après',
    onglet: `Avant, après · ${e.produit}`,
    statut: { texte: 'À toi de décider' },
    phrase: `${decisions} sur ${a.pages > 1 ? `les ${a.pages} pages mesurées` : 'la page mesurée'}. C’est un aperçu : rien n’est encore installé sur ton site.`,
    temps: e.temps,
    corps: `<section class="comparer" aria-label="Comparer">
${onglets}
<div class="vues">
${vues}
</div>
</section>
<section class="bloc" aria-labelledby="t-changements"><h2 id="t-changements">${esc(titre)}</h2>
${manque}
<div class="cartes">
${cartes}
</div></section>`,
    avance: ['Poser · porte 3 sur 3', 'Regarde chaque page, puis valide le rendu.'],
    action: `<div class="actions"><form method="post" action="/pages/revue"><button type="submit" class="discret">Revenir sur une décision</button></form><form method="post" action="/pages/rendu"><button type="submit" class="principal">Valider le rendu ›</button></form></div>`,
    regles,
  });
}

/**
 * La remise (D87) : ce que le designer donne au développeur, en trois étapes numérotées avec leurs comptes, le
 * dossier et « À installer », le message à copier ; ce qui reste à regarder. « Copier le message » est un formulaire :
 * le serveur copie le message dans le presse-papiers du Mac, et l'écran dit « Copié. ».
 * @param {Etat} e
 * @param {{ copie?: 'ok' | 'non' | null }} [o]  le retour de « Copier le message »
 */
export function ecranDeLaRemise(e, { copie = null } = {}) {
  const r = /** @type {NonNullable<Etat['remise']>} */ (e.remise);
  const b = e.bilan;
  const etape = (/** @type {number} */ n, /** @type {string} */ titre, /** @type {string} */ fait, /** @type {string} */ ecran, /** @type {string} */ annuler) =>
    `<div class="carte"><h3>${n} · ${esc(titre)}</h3><p>${esc(fait)}</p><small>${esc(`À l’écran : ${ecran}. Pour annuler : ${annuler}.`)}</small></div>`;
  const etapes = `<div class="cartes">
${etape(1, 'Installer le système', `Charger tokens.css avant les autres feuilles : ${nombre(r.pages.length, 'ligne', 'lignes')} à coller, une par page.`, 'rien ne change', 'retirer la ligne')}
${etape(2, 'Poser les décisions', `Charger ${nombre(r.ajouts.length, 'feuille ajoutée', 'feuilles ajoutées')}, chacune juste après sa feuille d’origine : ${nombre(r.lignes - r.pages.length, 'ligne', 'lignes')} à coller.`, 'le site devient l’« Après » validé', 'retirer les lignes')}
${etape(3, 'Reprendre l’ancien code', `Remplacer ${nombre(r.valeurs, 'valeur écrite en dur', 'valeurs écrites en dur')} par leur variable, dans ${nombre(r.fichiers.length, 'fichier', 'fichiers')}, fichier par fichier.`, 'rien ne change', 'un commit par fichier')}
</div>`;
  const reste = [
    ...(r.nonEcrites.length ? [`${nombre(r.nonEcrites.length, 'valeur n’a', 'valeurs n’ont')} pas pu s’écrire dans les feuilles ajoutées : elles se changent dans le code, en reprenant l’ancien code.`] : []),
    ...(b ? (b.complet ? b.humain : b.manque.map((x) => `Il manque : ${x}.`)) : []),
    ...(e.chiffres.reportes ? [`${nombre(e.chiffres.reportes, 'choix reste reporté', 'choix restent reportés')} : les versions de composants à garder, pour plus tard.`] : []),
  ];
  const texte = message(r);
  const dit = copie === 'ok' ? '<span class="accepte" role="status">Copié.</span>' : copie === 'non' ? '<span class="refus" role="status">Copie impossible ici : sélectionne le message.</span>' : '';
  return gabarit({
    titre: 'La remise',
    onglet: `La remise · ${e.produit}`,
    statut: { texte: 'Rien à décider', neutre: true },
    phrase: 'Ce que tu donnes au développeur : un dossier et un message. Il s’en sert dans l’ordre des trois étapes.',
    temps: e.temps,
    corps: `<div class="blocs">
<section class="bloc" aria-labelledby="t-etapes"><h2 id="t-etapes">Trois étapes</h2>
${etapes}</section>
<section class="bloc" aria-labelledby="t-dossier"><div class="titre-bloc"><h2 id="t-dossier">Le dossier</h2><a href="/a-installer">Ouvrir « À installer »</a></div>
<p><code>${esc(r.dossier)}</code></p><small>Les feuilles, rangées comme sur le site, « À installer » et le message.</small></section>
<section class="bloc" aria-labelledby="t-message"><h2 id="t-message">Le message</h2>
<textarea class="message" readonly rows="6" aria-labelledby="t-message">${esc(texte)}</textarea></section>
${reste.length ? `<section class="bloc" aria-labelledby="t-reste"><h2 id="t-reste">À regarder par un humain</h2><ul class="manque">${reste.map((h) => `<li>${esc(h)}</li>`).join('')}</ul></section>` : ''}
${b ? `<p><small>${esc(b.dernier)}</small></p>` : ''}
</div>`,
    avance: ['Poser · la remise', 'Copie le message, puis donne le dossier au développeur.'],
    action: `<div class="actions">${dit}<form method="post" action="/pages/copier"><button type="submit" class="principal">Copier le message</button></form></div>`,
  });
}

/** Le code d'une ligne de « À installer », entre accents graves. @param {string} t */
const enLigne = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>');

/**
 * « À installer » (D87), lisible à l'écran : le Markdown de la remise, rendu par l'outil, qui sait ce qu'il écrit
 * (titres, paragraphes, blocs de code, listes à deux niveaux, code en ligne).
 * @param {Etat} e @param {string} md
 */
export function ecranAInstaller(e, md) {
  /** @type {string[]} */
  const h = [];
  let code = /** @type {string[] | null} */ (null);
  let liste = 0;
  const fermer = (/** @type {number} */ n) => {
    while (liste > n) (h.push('</ul>'), liste--);
  };
  for (const l of md.split('\n')) {
    if (code) {
      if (l === '```') (h.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`), (code = null));
      else code.push(l);
      continue;
    }
    if (l.startsWith('```')) (fermer(0), (code = []));
    else if (l.startsWith('# ') || !l.trim()) fermer(0);
    else if (l.startsWith('### ')) (fermer(0), h.push(`<h3>${enLigne(l.slice(4))}</h3>`));
    else if (l.startsWith('## ')) (fermer(0), h.push(`<h2>${enLigne(l.slice(3))}</h2>`));
    else if (/^ {0,2}- /.test(l)) {
      const n = l.startsWith('  ') ? 2 : 1;
      if (liste < n) (h.push('<ul>'), liste++);
      fermer(n);
      h.push(`<li>${enLigne(l.replace(/^ *- (\[ \] )?/, ''))}</li>`);
    } else (fermer(0), h.push(`<p>${enLigne(l)}</p>`));
  }
  fermer(0);
  return gabarit({
    titre: 'À installer',
    onglet: `À installer · ${e.produit}`,
    statut: { texte: 'Pour le développeur', neutre: true },
    phrase: 'Les trois étapes de la remise, telles que le développeur les lit.',
    temps: e.temps,
    corps: `<div class="document">\n${h.join('\n')}\n</div>`,
    avance: ['Poser · la remise', 'Ce fichier est dans le dossier de la remise.'],
    action: '<a class="retour" href="/">‹ La remise</a>',
  });
}
