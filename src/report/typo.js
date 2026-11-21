// @ts-check
/**
 * Planche des styles de texte d'une marque (tokens/<marque>/typo.html). D27 : une
 * planche par marque, même code ; le nom de la marque, lu dans son resolver, est dans le titre et le texte d'essai du
 * spécimen ; les trois situations sont un contenu d'essai commun (D27).
 * Spécimen des onze styles (taille, ligne, rapport), puis trois situations : hero de page d'accueil,
 * page de contenu, écran dense. Toutes les valeurs viennent des jetons (typo, polices de marque,
 * espacements, couleurs) ; valeurs en étroit sous leur seuil ([H]). Aucun réglage : les décisions prises sur
 * la planche (15/11/2026) sont dans les jetons. gap et padding seulement, avec les rôles d'espacement ; la seule
 * déclaration margin est la remise à zéro. Page autonome, sans ressource externe ni script.
 */
import { largeurs, nomDeMarque } from '../tokens/resolver.js';
import { typo } from '../tokens/typo.js';
import { fr, esc, famille } from '../lib/format.js';
import { cssVar } from '../lib/nom-css.js';
import { espacements } from '../tokens/espacements.js';
import { resolveRoles, flattenTokens, resoudreAlias } from '../tokens/roles.js';

/** Classe CSS d'un style. @param {string} s */
const slug = (s) => s.replace(/\./g, '-');
/** Variables de la taille et de l'interligne d'un style, nommées comme les sous-variables de jetons.css. @param {string} style */
const taille = (style) => `${cssVar(`typography.${style}`)}-font-size`;
/** @param {string} style */
const interligne = (style) => `${cssVar(`typography.${style}`)}-line-height`;
/** Nombres de la typo : 4 décimales au plus. */
const D4 = { decimales: 4 };
/** @param {number} n */
const ligne = (n) => fr(n, { decimales: 2 });

/**
 * Élément de texte dans un style (input : sans contenu ni balise fermante).
 * @param {string} tag @param {string} style @param {string} contenu HTML déjà échappé @param {string} [attrs] @param {string} [cls] classes en plus
 */
const el = (tag, style, contenu, attrs = '', cls = '') => {
  const open = `<${tag} class="t-${slug(style)}${cls ? ` ${cls}` : ''}" data-style="${style}"${attrs}>`;
  return tag === 'input' ? open : `${open}${contenu}</${tag}>`;
};

/**
 * @param {ReturnType<typeof typo>} t
 * @param {ReturnType<typeof espacements>} e
 * @param {ReturnType<typeof resolveRoles>} roles
 * @param {{ polices: Record<string, string | string[]>, espacementLettres: Record<string, string>, nom: string }} extra  nom : nom de la marque
 * @returns {string}
 */
function typoHtml(t, e, roles, extra) {
  const hex = (/** @type {string} */ role) => {
    const v = roles.get(role);
    if (!v) throw new Error(`rôle de couleur absent : ${role}`);
    return v.hex;
  };
  const byName = new Map(t.styles.map((s) => [s.style, s]));
  const get = (/** @type {string} */ name) => {
    const s = byName.get(name);
    if (!s) throw new Error(`style absent : ${name}`);
    return s;
  };

  // Variables : polices, tailles et interlignes des styles, espacements ; valeurs en étroit par seuil.
  const espaces = [...e.ecarts, ...e.horsControle];
  const varsRacine = [
    ...Object.entries(extra.polices).map(([k, v]) => `${cssVar(k)}: ${famille(v)};`),
    ...t.styles.flatMap((s) => [`${taille(s.style)}: ${s.large.taille}px;`, `${interligne(s.style)}: ${s.large.interligne};`]),
    ...espaces.map((x) => `${cssVar(x.role)}: ${x.px}px;`),
  ];
  /** @type {Map<number, string[]>} */
  const etroits = new Map();
  for (const s of t.styles)
    if (s.etroit && s.sous !== null)
      etroits.set(s.sous, [...(etroits.get(s.sous) ?? []), `${taille(s.style)}: ${s.etroit.taille}px;`, `${interligne(s.style)}: ${s.etroit.interligne};`]);
  for (const x of e.etroits) etroits.set(x.sous, [...(etroits.get(x.sous) ?? []), `${cssVar(x.role)}: ${x.px}px;`]);
  const classes = t.styles
    .map((s) => {
      const police = String(s.police).replace(/^\{(.*)\}$/, '$1');
      return `      .t-${slug(s.style)} { font-family: var(${cssVar(police)}); font-size: var(${taille(s.style)}); line-height: var(${interligne(s.style)}); font-weight: ${s.graisse}; letter-spacing: ${extra.espacementLettres[s.style] ?? '0px'};${s.hauteurCapitale !== null ? ` font-size-adjust: cap-height ${s.hauteurCapitale};` : ''} }`;
    })
    .join('\n');

  const specimen = t.styles
    .map((s) => {
      const meta = [
        `<code>${s.style}</code>`,
        `${fr(s.large.taille, D4)} / ${ligne(s.large.ligne)} px`,
        `rapport ${fr(s.large.interligne, D4)}`,
        ...(s.etroit ? [`étroit ${fr(s.etroit.taille, D4)} / ${ligne(s.etroit.ligne)} px`, `rapport ${fr(s.etroit.interligne, D4)}`] : []),
        String(s.graisse),
        esc(String(s.police).replace(/^\{(.*)\}$/, '$1')),
        ...(s.hauteurCapitale !== null ? [`capitale ${fr(s.hauteurCapitale, D4)} × taille`] : []),
      ].join(' · ');
      return `          <li data-specimen="${s.style}">
            <p class="meta">${meta}</p>
            ${el('p', s.style, `${esc(extra.nom)} ouvre le mardi`)}
          </li>`;
    })
    .join('\n');

  const nFails = t.fails.length;
  const bilan = nFails ? `${nFails} règle${nFails > 1 ? 's' : ''} en échec : voir npm run typo.` : `${t.regles.length} règles tenues, contrôlées par npm run typo.`;

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Typographie ${esc(extra.nom)}</title>
    <style>
      :root { ${varsRacine.join(' ')} }
${[...etroits.entries()].map(([n, decl]) => `      @media (max-width: ${n - 0.02}px) { :root { ${decl.join(' ')} } }`).join('\n')}

      /* Styles de texte : un par jeton composite du groupe typography. */
${classes}

      /* Le parent porte l'espace : gap et padding, avec les rôles d'espacement ; aucun enfant n'a de marge. */
      * { margin: 0; box-sizing: border-box; }
      body {
        display: grid; grid-template-columns: minmax(0, 1040px); justify-content: center;
        padding: 32px 16px 64px; /* gouttière de page, hors des rôles */
        background: ${hex('background.app')}; color: ${hex('text.default')};
      }
      main { display: flex; flex-direction: column; gap: var(--gap-section); }
      main > header, main > section { display: flex; flex-direction: column; gap: var(--gap-between-groups); }
      .entete { display: flex; flex-direction: column; gap: var(--gap-within-component); }
      .secondaire, .t-supporting-text { color: ${hex('text.secondary')}; }
      .meta { font: 13px/20px ui-monospace, Menlo, monospace; color: ${hex('text.secondary')}; overflow-wrap: anywhere; }
      code { font: inherit; }


      .specimen { list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(--gap-between-components); }
      .specimen li { display: flex; flex-direction: column; gap: var(--gap-within-component); padding-bottom: var(--gap-between-components); border-bottom: 1px solid ${hex('border.subtle')}; overflow-wrap: anywhere; }

      .cadre { display: flex; flex-direction: column; gap: var(--gap-between-groups); padding: var(--padding-component); background: ${hex('background.surface')}; border: 1px solid ${hex('border.subtle')}; border-radius: 8px; }
      .hero { padding-block: var(--gap-section); }
      .hero-texte { display: flex; flex-direction: column; gap: var(--gap-between-components); }
      #hero-titre { max-width: 8.5em; }
      .hero .chapo { max-width: 36em; color: ${hex('text.secondary')}; }
      .actions { display: flex; flex-wrap: wrap; gap: var(--gap-between-components); }
      .actions button { padding: var(--gap-within-component) var(--padding-component); min-height: 40px; border-radius: 6px; border: 1px solid transparent; cursor: pointer; background: ${hex('background.interactive.strong')}; color: ${hex('text.on-interactive')}; }
      .actions button:focus-visible, .champ input:focus-visible { outline: 2px solid ${hex('border.focus')}; outline-offset: 2px; }

      .article { max-width: 40rem; }
      .bloc { display: flex; flex-direction: column; gap: var(--gap-between-components); }
      .bloc-titre { display: flex; flex-direction: column; gap: var(--gap-between-components); }

      .dense-entete { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: var(--gap-between-components); }
      .champ { display: flex; flex-direction: column; gap: var(--gap-within-component); min-width: 0; flex: 0 1 280px; }
      .champ input { width: 100%; min-height: 40px; padding: var(--gap-within-component) var(--gap-between-components); color: ${hex('text.default')}; background: ${hex('background.surface')}; border: 1px solid ${hex('border.strong')}; border-radius: 6px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; vertical-align: top; padding: var(--gap-within-component) var(--gap-between-components) var(--gap-within-component) 0; border-bottom: 1px solid ${hex('border.subtle')}; }
      td.num, th.num { text-align: right; padding-right: 0; font-variant-numeric: tabular-nums; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div class="entete">
          ${el('h1', 'heading.1', `Typographie, ${esc(extra.nom)}`)}
          ${el('p', 'body.medium', "Marque fictive. Onze styles de texte, un jeton composite chacun (groupe typography de semantique.tokens.json) : police de la marque, taille, graisse et interligne sans unité, hauteur de ligne visée multiple de 4 px. Sous 600 px de large [H], affichage et titres 1 à 3 prennent leur valeur en étroit.", '', 'secondaire')}
          ${el('p', 'supporting-text', esc(bilan))}
        </div>
      </header>

      <section aria-labelledby="titre-specimen">
        <div class="entete">
          ${el('h2', 'heading.2', 'Spécimen', ' id="titre-specimen"')}
          ${el('p', 'supporting-text', 'Taille / ligne en px et rapport (ligne ÷ taille), en large puis en étroit ; graisse ; police.')}
        </div>
        <ol class="specimen">
${specimen}
        </ol>
      </section>

      <section data-situation="hero" aria-labelledby="titre-hero">
        ${el('h2', 'heading.2', "Hero d'une page d'accueil", ' id="titre-hero"')}
        <div class="cadre hero">
          <div class="hero-texte">
            ${el('p', 'display.large', "Prenez le temps d'un café", ' id="hero-titre"')}
            ${el('p', 'body.large', 'Trois salles, un torréfacteur sur place et une carte qui change avec les arrivages, du mardi au dimanche.', '', 'chapo')}
          </div>
          <div class="actions">
            ${el('button', 'label', 'Réserver une table', ' type="button"')}
          </div>
        </div>
      </section>

      <section data-situation="contenu" aria-labelledby="titre-contenu">
        ${el('h2', 'heading.2', 'Page de contenu', ' id="titre-contenu"')}
        <article class="cadre article">
          <div class="bloc-titre">
            ${el('h3', 'heading.1', 'Du grain à la tasse : comment nous choisissons, torréfions et servons chaque café de notre carte', ' id="titre-long"')}
            ${el('p', 'body.large', 'Chaque mardi, la machine tourne avant l\'ouverture ; voici ce qui se passe entre le sac de café vert et la tasse posée sur le comptoir.', '', 'secondaire')}
          </div>
          <div class="bloc">
            ${el('h4', 'heading.2', "D'où viennent nos grains")}
            ${el('p', 'body.medium', "Nous achetons à quatre coopératives, par petits lots, et nous goûtons chaque lot avant de le commander. Un lot qui ne passe pas la dégustation ne passe pas la porte, même s'il est déjà payé.")}
            ${el('p', 'body.medium', 'Les sacs arrivent au fil des saisons ; la carte suit, et un café peut disparaître pendant plusieurs mois.')}
          </div>
          <div class="bloc">
            ${el('h5', 'heading.3', 'La torréfaction du mardi')}
            ${el('p', 'body.medium', 'Douze minutes en moyenne, une courbe notée pour chaque lot, et trois jours de repos avant la première tasse.')}
            ${el('p', 'supporting-text', 'Mis à jour le 15 novembre 2026.')}
          </div>
        </article>
      </section>

      <section data-situation="dense" aria-labelledby="titre-dense">
        ${el('h2', 'heading.2', 'Écran dense', ' id="titre-dense"')}
        <div class="cadre">
          <div class="dense-entete">
            ${el('h3', 'heading.4', 'Commandes du jour')}
            <div class="champ">
              ${el('label', 'label', 'Table', ' for="filtre-table"')}
              ${el('input', 'body.medium', '', ' id="filtre-table" type="text" value="T3" autocomplete="off" aria-describedby="filtre-aide"')}
              ${el('p', 'supporting-text', 'Numéro de table, ou vide pour tout voir.', ' id="filtre-aide"')}
            </div>
          </div>
          <table class="t-body-small" data-style="body.small">
            <thead><tr>${el('th', 'label', 'Heure', ' scope="col"')}${el('th', 'label', 'Table', ' scope="col"')}${el('th', 'label', 'Commande', ' scope="col"')}${el('th', 'label', 'Montant', ' scope="col"', 'num')}</tr></thead>
            <tbody>
              <tr><td>8 h 05</td><td>T3</td><td>2 allongés, 1 tartine beurre</td><td class="num">7,40 €</td></tr>
              <tr><td>8 h 12</td><td>T3</td><td>1 filtre du moment</td><td class="num">4,20 €</td></tr>
              <tr><td>8 h 31</td><td>T3</td><td>1 cappuccino, 1 brioche, 1 jus pressé</td><td class="num">11,90 €</td></tr>
            </tbody>
          </table>
          ${el('p', 'supporting-text', 'Montants TTC ; la liste se met à jour à chaque commande validée en caisse.')}
        </div>
      </section>
    </main>
  </body>
</html>
`;
}

/**
 * Planche d'un dossier de marque : lit les jetons et rend la page.
 * @param {string} dir dossier tokens/<marque>/
 * @returns {string}
 */
export function planche(dir) {
  const { large, etroit } = largeurs(dir);
  const { semantique: sem, primitives: prims, marque } = large;
  const roles = resolveRoles(sem, prims, marque);
  const police = marque.brand?.font ?? {};
  /** @type {Record<string, string | string[]>} */
  const polices = {};
  // Titre puis texte, quel que soit l'ordre de fusion (la police du produit vient du commun, avant la couche marque).
  // Une police peut être un alias (la police du texte du commun pointe vers font.product) : résolue ici.
  const jetons = new Map([...flattenTokens(prims), ...flattenTokens(marque)]);
  /** @param {string} chemin */
  const famillePolice = (chemin) => resoudreAlias(jetons, /** @type {any} */ (jetons.get(chemin)).$value, { depuis: chemin, chaine: [chemin] }).valeur;
  for (const k of ['heading', 'body', ...Object.keys(police).filter((x) => !['heading', 'body'].includes(x))]) if (!k.startsWith('$') && police[k]) polices[`brand.font.${k}`] = famillePolice(`brand.font.${k}`);
  // Police du produit, que le libellé prend toujours (D44).
  if (jetons.has('font.product')) polices['font.product'] = famillePolice('font.product');
  /** @type {Record<string, string>} */
  const espacementLettres = {};
  for (const [path, tok] of flattenTokens(sem.typography ?? {})) {
    const ls = tok.$value?.letterSpacing;
    if (ls && typeof ls === 'object') espacementLettres[path] = `${ls.value}${ls.unit}`;
  }
  return typoHtml(typo(sem, prims, marque, etroit), espacements(sem, prims, etroit), roles, { polices, espacementLettres, nom: nomDeMarque(dir) });
}
