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
import { esc, fr } from '../lib/format.js';
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
`;

/**
 * Le gabarit d'un écran.
 * @param {{ titre: string, onglet: string, statut: { texte: string, neutre?: boolean }, phrase: string, sousTete?: string,
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
