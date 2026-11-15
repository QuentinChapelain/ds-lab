// @ts-check
/**
 * Séance 3c, typo : planche des styles de texte d'Orbe Café (tokens/orbe-cafe/typo.html).
 * Spécimen des onze styles (taille, ligne, rapport), puis trois situations : hero de page d'accueil,
 * page de contenu, écran dense. Toutes les valeurs viennent des jetons (typo, polices de marque,
 * espacements, couleurs) ; valeurs en étroit sous leur seuil ([H]). Aucun réglage : les décisions prises sur
 * la planche (15/11/2026) sont dans les jetons. gap et padding seulement, avec les rôles d'espacement ; la seule
 * déclaration margin est la remise à zéro. Page autonome, sans ressource externe ni script.
 */
import { largeurs } from '../tokens/resolver.js';
import { typo, fr } from '../tokens/typo.js';
import { espacements } from '../tokens/espacements.js';
import { resolveRoles, flattenTokens } from '../tokens/roles.js';

/** @param {string} s */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => /** @type {Record<string, string>} */ ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/** Nom CSS d'un style ou d'un rôle. @param {string} s */
const slug = (s) => s.replace(/\./g, '-');
/** @param {number} n */
const ligne = (n) => fr(Math.round(n * 100) / 100);
/** Liste de polices DTCG → valeur CSS. @param {string | string[]} v */
const famille = (v) => (Array.isArray(v) ? v : [v]).map((f) => (/[\s"]/.test(f) ? `"${f.replace(/"/g, '\\"')}"` : f)).join(', ');

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
 * @param {{ polices: Record<string, string | string[]>, espacementLettres: Record<string, string> }} extra
 * @returns {string}
 */
export function typoHtml(t, e, roles, extra) {
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
    ...Object.entries(extra.polices).map(([k, v]) => `--police-${k}: ${famille(v)};`),
    ...t.styles.flatMap((s) => [`--${slug(s.style)}-taille: ${s.large.taille}px;`, `--${slug(s.style)}-interligne: ${s.large.interligne};`]),
    ...espaces.map((x) => `--${slug(x.role)}: ${x.px}px;`),
  ];
  /** @type {Map<number, string[]>} */
  const etroits = new Map();
  for (const s of t.styles)
    if (s.etroit && s.sous !== null)
      etroits.set(s.sous, [...(etroits.get(s.sous) ?? []), `--${slug(s.style)}-taille: ${s.etroit.taille}px;`, `--${slug(s.style)}-interligne: ${s.etroit.interligne};`]);
  for (const x of e.etroits) etroits.set(x.sous, [...(etroits.get(x.sous) ?? []), `--${slug(x.role)}: ${x.px}px;`]);
  const classes = t.styles
    .map((s) => {
      const police = String(s.police).replace(/^\{marque\.police\.(.*)\}$/, '$1');
      return `      .t-${slug(s.style)} { font-family: var(--police-${police}); font-size: var(--${slug(s.style)}-taille); line-height: var(--${slug(s.style)}-interligne); font-weight: ${s.graisse}; letter-spacing: ${extra.espacementLettres[s.style] ?? '0px'}; }`;
    })
    .join('\n');

  const specimen = t.styles
    .map((s) => {
      const meta = [
        `<code>${s.style}</code>`,
        `${fr(s.large.taille)} / ${ligne(s.large.ligne)} px`,
        `rapport ${fr(s.large.interligne)}`,
        ...(s.etroit ? [`étroit ${fr(s.etroit.taille)} / ${ligne(s.etroit.ligne)} px`, `rapport ${fr(s.etroit.interligne)}`] : []),
        String(s.graisse),
        esc(String(s.police).replace(/^\{marque\.(.*)\}$/, '$1')),
      ].join(' · ');
      return `          <li data-specimen="${s.style}">
            <p class="meta">${meta}</p>
            ${el('p', s.style, 'Orbe Café torréfie le mardi')}
          </li>`;
    })
    .join('\n');

  const nFails = t.fails.length;
  const bilan = nFails ? `${nFails} règle${nFails > 1 ? 's' : ''} en échec : voir npm run typo.` : '8 règles tenues, contrôlées par npm run typo.';

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Typographie Orbe Café</title>
    <style>
      :root { ${varsRacine.join(' ')} }
${[...etroits.entries()].map(([n, decl]) => `      @media (max-width: ${n - 0.02}px) { :root { ${decl.join(' ')} } }`).join('\n')}

      /* Styles de texte : un par jeton composite du groupe typo. */
${classes}

      /* Le parent porte l'espace : gap et padding, avec les rôles d'espacement ; aucun enfant n'a de marge. */
      * { margin: 0; box-sizing: border-box; }
      body {
        display: grid; grid-template-columns: minmax(0, 1040px); justify-content: center;
        padding: 32px 16px 64px; /* gouttière de page, hors des rôles */
        background: ${hex('fond.app')}; color: ${hex('texte.principal')};
      }
      main { display: flex; flex-direction: column; gap: var(--ecart-section); }
      main > header, main > section { display: flex; flex-direction: column; gap: var(--ecart-entre-groupes); }
      .entete { display: flex; flex-direction: column; gap: var(--ecart-dans-composant); }
      .secondaire, .t-mention { color: ${hex('texte.secondaire')}; }
      .meta { font: 13px/20px ui-monospace, Menlo, monospace; color: ${hex('texte.secondaire')}; overflow-wrap: anywhere; }
      code { font: inherit; }


      .specimen { list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(--ecart-entre-composants); }
      .specimen li { display: flex; flex-direction: column; gap: var(--ecart-dans-composant); padding-bottom: var(--ecart-entre-composants); border-bottom: 1px solid ${hex('bordure.discrete')}; overflow-wrap: anywhere; }

      .cadre { display: flex; flex-direction: column; gap: var(--ecart-entre-groupes); padding: var(--marge-interieure-composant); background: ${hex('fond.surface')}; border: 1px solid ${hex('bordure.discrete')}; border-radius: 8px; }
      .hero { padding-block: var(--ecart-section); }
      .hero-texte { display: flex; flex-direction: column; gap: var(--ecart-entre-composants); }
      #hero-titre { max-width: 8.5em; }
      .hero .chapo { max-width: 36em; color: ${hex('texte.secondaire')}; }
      .actions { display: flex; flex-wrap: wrap; gap: var(--ecart-entre-composants); }
      .actions button { padding: var(--ecart-dans-composant) var(--marge-interieure-composant); min-height: 40px; border-radius: 6px; border: 1px solid transparent; cursor: pointer; background: ${hex('fond.interactif.fort')}; color: ${hex('texte.sur-interactif')}; }
      .actions button:focus-visible, .champ input:focus-visible { outline: 2px solid ${hex('bordure.focus')}; outline-offset: 2px; }

      .article { max-width: 40rem; }
      .bloc { display: flex; flex-direction: column; gap: var(--ecart-entre-composants); }
      .bloc-titre { display: flex; flex-direction: column; gap: var(--ecart-entre-composants); }

      .dense-entete { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: var(--ecart-entre-composants); }
      .champ { display: flex; flex-direction: column; gap: var(--ecart-dans-composant); min-width: 0; flex: 0 1 280px; }
      .champ input { width: 100%; min-height: 40px; padding: var(--ecart-dans-composant) var(--ecart-entre-composants); color: ${hex('texte.principal')}; background: ${hex('fond.surface')}; border: 1px solid ${hex('bordure.forte')}; border-radius: 6px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; vertical-align: top; padding: var(--ecart-dans-composant) var(--ecart-entre-composants) var(--ecart-dans-composant) 0; border-bottom: 1px solid ${hex('bordure.discrete')}; }
      td.num, th.num { text-align: right; padding-right: 0; font-variant-numeric: tabular-nums; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div class="entete">
          ${el('h1', 'titre.1', 'Typographie, Orbe Café')}
          ${el('p', 'corps.moyen', "Marque fictive. Onze styles de texte, un jeton composite chacun (groupe typo de semantique.tokens.json) : police de la marque, taille, graisse et interligne sans unité, hauteur de ligne visée multiple de 4 px. Sous 600 px de large [H], affichage et titres 1 à 3 prennent leur valeur en étroit.", '', 'secondaire')}
          ${el('p', 'mention', esc(bilan))}
        </div>
      </header>

      <section aria-labelledby="titre-specimen">
        <div class="entete">
          ${el('h2', 'titre.2', 'Spécimen', ' id="titre-specimen"')}
          ${el('p', 'mention', 'Taille / ligne en px et rapport (ligne ÷ taille), en large puis en étroit ; graisse ; police.')}
        </div>
        <ol class="specimen">
${specimen}
        </ol>
      </section>

      <section data-situation="hero" aria-labelledby="titre-hero">
        ${el('h2', 'titre.2', "Hero d'une page d'accueil", ' id="titre-hero"')}
        <div class="cadre hero">
          <div class="hero-texte">
            ${el('p', 'affichage.grand', "Prenez le temps d'un café", ' id="hero-titre"')}
            ${el('p', 'corps.grand', 'Trois salles, un torréfacteur sur place et une carte qui change avec les arrivages, du mardi au dimanche.', '', 'chapo')}
          </div>
          <div class="actions">
            ${el('button', 'libelle', 'Réserver une table', ' type="button"')}
          </div>
        </div>
      </section>

      <section data-situation="contenu" aria-labelledby="titre-contenu">
        ${el('h2', 'titre.2', 'Page de contenu', ' id="titre-contenu"')}
        <article class="cadre article">
          <div class="bloc-titre">
            ${el('h3', 'titre.1', 'Du grain à la tasse : comment nous choisissons, torréfions et servons chaque café de la maison', ' id="titre-long"')}
            ${el('p', 'corps.grand', 'Chaque mardi, la machine tourne avant l\'ouverture ; voici ce qui se passe entre le sac de café vert et la tasse posée sur le comptoir.', '', 'secondaire')}
          </div>
          <div class="bloc">
            ${el('h4', 'titre.2', "D'où viennent nos grains")}
            ${el('p', 'corps.moyen', "Nous achetons à quatre coopératives, par petits lots, et nous goûtons chaque lot avant de le commander. Un lot qui ne passe pas la dégustation ne passe pas la porte, même s'il est déjà payé.")}
            ${el('p', 'corps.moyen', 'Les sacs arrivent au fil des saisons ; la carte suit, et un café peut disparaître pendant plusieurs mois.')}
          </div>
          <div class="bloc">
            ${el('h5', 'titre.3', 'La torréfaction du mardi')}
            ${el('p', 'corps.moyen', 'Douze minutes en moyenne, une courbe notée pour chaque lot, et trois jours de repos avant la première tasse.')}
            ${el('p', 'mention', 'Mis à jour le 15 novembre 2026.')}
          </div>
        </article>
      </section>

      <section data-situation="dense" aria-labelledby="titre-dense">
        ${el('h2', 'titre.2', 'Écran dense', ' id="titre-dense"')}
        <div class="cadre">
          <div class="dense-entete">
            ${el('h3', 'titre.4', 'Commandes du jour')}
            <div class="champ">
              ${el('label', 'libelle', 'Table', ' for="filtre-table"')}
              ${el('input', 'corps.moyen', '', ' id="filtre-table" type="text" value="T3" autocomplete="off" aria-describedby="filtre-aide"')}
              ${el('p', 'mention', 'Numéro de table, ou vide pour tout voir.', ' id="filtre-aide"')}
            </div>
          </div>
          <table class="t-corps-petit" data-style="corps.petit">
            <thead><tr>${el('th', 'libelle', 'Heure', ' scope="col"')}${el('th', 'libelle', 'Table', ' scope="col"')}${el('th', 'libelle', 'Commande', ' scope="col"')}${el('th', 'libelle', 'Montant', ' scope="col"', 'num')}</tr></thead>
            <tbody>
              <tr><td>8 h 05</td><td>T3</td><td>2 allongés, 1 tartine beurre</td><td class="num">7,40 €</td></tr>
              <tr><td>8 h 12</td><td>T3</td><td>1 filtre du moment</td><td class="num">4,20 €</td></tr>
              <tr><td>8 h 31</td><td>T3</td><td>1 cappuccino, 1 brioche, 1 jus pressé</td><td class="num">11,90 €</td></tr>
            </tbody>
          </table>
          ${el('p', 'mention', 'Montants TTC ; la liste se met à jour à chaque commande validée en caisse.')}
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
  const police = marque.marque?.police ?? {};
  /** @type {Record<string, string | string[]>} */
  const polices = {};
  for (const k of Object.keys(police)) if (!k.startsWith('$')) polices[k] = police[k].$value;
  /** @type {Record<string, string>} */
  const espacementLettres = {};
  for (const [path, tok] of flattenTokens(sem.typo ?? {})) {
    const ls = tok.$value?.letterSpacing;
    if (ls && typeof ls === 'object') espacementLettres[path] = `${ls.value}${ls.unit}`;
  }
  return typoHtml(typo(sem, prims, marque, etroit), espacements(sem, prims, etroit), roles, { polices, espacementLettres });
}
