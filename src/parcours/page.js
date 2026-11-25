// @ts-check
/**
 * La page du parcours (D72) : le chat conduit, le panneau montre. Un fichier HTML autonome, sans script, clair et
 * sombre, lisible à 640 px. Trois parties : la barre des quatre temps ; le moment en cours, et lui seul (une phrase,
 * la ligne d'action, l'écran de l'étape embarqué s'il y en a un) ; le reste, replié dans « Tout le parcours ».
 * Valeurs : les variables des jetons communs (jetons.js) ; le style écrit ici ne porte que des variables, des
 * mots-clés, 0 et 100 %, comme un module (D61). Toute chaîne venue du projet ou des sorties est échappée.
 */
import { esc } from '../lib/format.js';
import { aLaMain, etatDit } from './etat.js';
import { blocJetons, ecranDesPages, ecranDeMesure, ecranDeLaDette, ecranDeLaMarque, ecranDesJetons, ecranDesFondations, ecranAvantApres, ecranDuRendu, style, DEBUT_JETONS, FIN_JETONS } from './ecrans.js';

export { DEBUT_JETONS, FIN_JETONS };

/** @typedef {import('./etat.js').Etat} Etat @typedef {import('./etat.js').Etape} Etape */


const CSS = `
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body { background: var(--background-app); color: var(--text-default); ${style('body-medium')} }
main { display: flex; flex-direction: column; gap: var(--gap-between-components); min-height: 100%; max-width: var(--width-column); margin: 0 auto; padding: var(--padding-component); }
h1, h2, h3, p, ul, ol { margin: 0; }
h1 { ${style('heading-1')} }
.sous-titre { color: var(--text-secondary); }
ol.barre { display: table; table-layout: fixed; width: 100%; padding: 0; list-style: none; border-spacing: var(--gap-within-component) 0; }
ol.barre li { display: table-cell; text-align: center; padding: var(--gap-between-blocks) var(--gap-within-component); border-radius: var(--border-radius-surface); ${style('label')} }
.faite { background: var(--background-inverse); color: var(--text-on-inverse); }
.en-cours { background: var(--background-info-subtle); color: var(--text-info); }
.a-venir { background: var(--background-subtle); color: var(--text-secondary); }
.moment { display: flex; flex-direction: column; gap: var(--gap-between-blocks); flex: auto; }
.phrase { ${style('heading-3')} }
.moment ul { padding-left: var(--gap-between-groups); }
a { color: var(--text-info); }
iframe { flex: auto; width: 100%; border: 0; border-radius: var(--border-radius-surface); background: var(--background-surface); }
.tout { ${style('body-small')} }
.tout summary { cursor: pointer; ${style('label')} }
.tout section { margin-top: var(--gap-between-components); }
.tout h3 { ${style('label')} }
.tout ul { list-style: none; padding: 0; }
.tout li { background: var(--background-surface); border-radius: var(--border-radius-surface); padding: var(--gap-between-blocks) var(--padding-component); margin-top: var(--gap-between-blocks); }
.doux { color: var(--text-secondary); }
`;

/** Classe d'un état. @param {string} e */
const classe = (e) => (e === 'faite' ? 'faite' : e === 'en cours' ? 'en-cours' : 'a-venir');

/** « fait » pour un temps, « faite » pour une étape. @param {string} e @param {boolean} masculin */
const dit = (e, masculin) => (e === 'faite' && masculin ? 'fait' : e);

/** @param {Etat} e */
function barre(e) {
  return `<ol class="barre" aria-label="Les quatre temps">${e.temps
    .map((t) => `<li class="${classe(t.etat)}" aria-label="${esc(`${t.nom} : ${dit(t.etat, true)}`)}" title="${esc(`${t.nom} : ${dit(t.etat, true)}`)}">${esc(t.nom)}</li>`)
    .join('')}</ol>`;
}

/** La ligne d'action du moment. @param {Etat} e */
function action(e) {
  const k = e.courante;
  const tete = `<p><strong>${esc(`${k.temps} · ${k.nom}`)}</strong> · la main est ${esc(aLaMain(k.main))}</p>`;
  if (e.ecran?.precedente) {
    const fait = e.etapes.find((x) => x.cle === e.ecran?.etape);
    return `${tete}\n<p>${esc(`Fait : ${fait?.nom}. Ensuite : ${k.nom}${k.action ? `, ${k.action}` : ''}.`)}</p>`;
  }
  return `${tete}${k.action ? `\n<p>${esc(`À faire : ${k.action}.`)}</p>` : ''}`;
}

/** Les lignes d'une étape par site, à plusieurs sites. @param {Etat} e */
function lignesDuMoment(e) {
  const k = e.ecran && !e.ecran.precedente ? e.etapes.find((x) => x.cle === e.ecran?.etape) : e.courante;
  if (e.unSite || !k || (k.cle !== 'marques' && k.cle !== 'constat') || !k.lignes.length) return '';
  const courtes = k.cle === 'marques' ? k.lignes.map((l) => l.replace(/, refusée : .*$/, ', refusée')) : k.lignes;
  return `<ul>${courtes.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
}

/** La partie B : le moment en cours, et lui seul. @param {Etat} e */
function moment(e) {
  /** @type {string[]} */
  const b = [];
  if (e.phrase) b.push(`<p class="phrase">${esc(e.phrase)}</p>`);
  b.push(lignesDuMoment(e));
  b.push(action(e));
  if (e.ecran) {
    b.push(`<p><a href="${esc(e.ecran.href)}">Ouvrir seul</a></p>`);
    b.push(`<iframe src="${esc(e.ecran.href)}" title="${esc(e.ecran.titre)}"></iframe>`);
  } else if (e.courante.fait && e.courante.cle !== 'marques') b.push(`<p>${esc(e.courante.fait)}</p>`);
  return `<section class="moment" aria-label="Le moment en cours">\n${b.filter(Boolean).join('\n')}\n</section>`;
}

/** Une étape dans « Tout le parcours ». @param {Etape} k */
function etape(k) {
  /** @type {string[]} */
  const p = [`<p><strong>${esc(k.nom)}</strong> · ${esc(etatDit(k))} · ${esc(k.acteurs)}</p>`];
  if (k.fait && !k.lignes.length) p.push(`<p>${esc(k.fait)}</p>`);
  for (const l of k.lignes) p.push(`<p>${esc(l)}</p>`);
  if (k.etat === 'à venir' && !k.faite) p.push(`<p class="doux">${esc(k.ouvre)}</p>`);
  if (k.ecran) p.push(`<p><a href="${esc(k.ecran.href)}">${esc(k.ecran.titre)}</a></p>`);
  else if (k.sansEcran) p.push(`<p class="doux">${esc(k.sansEcran)}</p>`);
  return `<li>${p.join('')}</li>`;
}

/** La partie C : tout le parcours, replié. @param {Etat} e */
function tout(e) {
  return `<details class="tout"><summary>Tout le parcours</summary>\n${e.temps
    .map((t) => `<section><h3>${esc(`${t.nom} · ${dit(t.etat, true)}`)}</h3><ul>${e.etapes.filter((k) => t.etapes.includes(k.cle)).map(etape).join('')}</ul></section>`)
    .join('\n')}\n</details>`;
}

/**
 * La page du parcours ; au moment des pages, l'écran des pages (D77).
 * @param {Etat} e
 * @param {{ erreur?: import('./ecrans.js').ErreurAjout | null }} [o]  le refus d'une page ajoutée, à dire à côté du champ
 */
export function pageDuParcours(e, { erreur = null } = {}) {
  if (e.moment === 'pages') return ecranDesPages(e, { sites: e.sites, erreur });
  if (e.moment === 'mesure') return ecranDeMesure(e);
  if (e.moment === 'dette' && e.dette) return ecranDeLaDette(e);
  if (e.moment === 'marque' && e.marque) return ecranDeLaMarque(e, { erreur });
  if (e.moment === 'jetons') return ecranDesJetons(e);
  if (e.moment === 'fondations' && e.fondations) return ecranDesFondations(e);
  if (e.moment === 'avant-apres' && e.avantApres) return ecranAvantApres(e);
  if (e.moment === 'bilan' && e.bilan) return ecranDuRendu(e);
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(`Parcours · ${e.produit}`)}</title>
<style>
${blocJetons()}${CSS}</style>
</head>
<body>
<main>
<header><h1>${esc(e.produit)}</h1>${e.sousTitre ? `<p class="sous-titre">${esc(e.sousTitre)}</p>` : ''}</header>
${barre(e)}
${moment(e)}
${tout(e)}
</main>
</body>
</html>
`;
}
