// @ts-check
/**
 * Les écrans du parcours (D77) et leur gabarit, commun à tous les écrans à venir : les quatre temps en haut, le titre
 * et qui a la main, le contenu borné à la largeur d'une page, une barre en bas, fixée au bord de la fenêtre, avec une
 * seule action forte. Deux écrans : le lancement (avant le projet) et les pages à mesurer (un groupe par site).
 * Sans script : retirer, ajouter et mesurer sont des formulaires envoyés au serveur du parcours (serveur.js). Valeurs :
 * les variables des jetons communs (jetons.js) ; le style écrit ici ne porte que des variables, des mots-clés, 0 et
 * 100 %, comme un module (D61). La page n'a pas de marque : l'anneau de focus prend le texte d'information, pas
 * border.focus, qui pointe sur la marque. Toute chaîne venue du projet ou de la saisie est échappée.
 */
import { esc } from '../lib/format.js';
import { variablesDeLaPage } from './jetons.js';

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
`;

/**
 * Le gabarit d'un écran.
 * @param {{ titre: string, onglet: string, statut: { texte: string, neutre?: boolean }, phrase: string,
 *   temps: { nom: string, etat: EtatEtape }[], corps: string, avance: [string, string], action?: string, rafraichir?: boolean }} o
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
${blocJetons()}${CSS}</style>
</head>
<body>
<main>
<ul class="temps" aria-label="Les quatre temps">${temps}</ul>
<div class="tete"><div class="ligne"><h1>${esc(o.titre)}</h1><span class="statut${o.statut.neutre ? ' neutre' : ''}">${esc(o.statut.texte)}</span></div><p>${esc(o.phrase)}</p></div>
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
