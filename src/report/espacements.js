// @ts-check
/**
 * Séance 3c : planche des espacements par relation d'une marque (tokens/<marque>/espacements.html). Revue de code, lot 5
 * (D27) : une planche par marque, même code ; le nom de la marque est lu dans son resolver.
 * Une page complète (formulaire avec un message d'erreur sur deux lignes, rangée de trois cartes,
 * plusieurs sections) bâtie sur les cinq rôles d'espacement, chacun coté et nommé une fois.
 * Le parent porte l'espace : gap et padding uniquement, la seule déclaration margin est la remise à zéro.
 * Toutes les valeurs viennent des jetons, valeur en étroit comprise (lot 4 : ecart.section, 48 px, et 32 px
 * sous 600 px dans le contexte étroit, seuil [H]). Couleurs : rôles de semantique.tokens.json ; les cotes ont leur propre
 * palette d'annotation, hors du design system. Page autonome, sans ressource externe ni script.
 */
import { largeurs, nomDeMarque } from '../tokens/resolver.js';
import { espacements } from '../tokens/espacements.js';
import { resolveRoles } from '../tokens/roles.js';
import { fr, esc } from '../lib/format.js';

/** Nombre absent : un tiret. */
const TIRET = { vide: '—' };
/** Nom de variable CSS d'un rôle. @param {string} role */
const cssVar = (role) => `--${role.replace(/\./g, '-')}`;

/** Palette d'annotation des cotes (hors design system). */
const COTE = /** @type {Record<string, string>} */ ({
  'ecart.dans-composant': '#c2255c',
  'ecart.entre-composants': '#1971c2',
  'ecart.entre-groupes': '#2b8a3e',
  'ecart.section': '#d9480f',
  'marge-interieure.composant': '#7048e8',
});

/**
 * Cote d'un écart : bande posée sous son hôte, de la hauteur de l'écart, avec le nom et la valeur.
 * @param {string} role @param {string} valeur texte de la valeur (large, et en étroit s'il y a lieu)
 */
const cote = (role, valeur) =>
  `<span class="cote" data-cote="${role}" aria-hidden="true" style="--c:${COTE[role]};height:var(${cssVar(role)})"><span class="etiquette">${role} · ${valeur}</span></span>`;

/**
 * @param {ReturnType<typeof espacements>} r
 * @param {ReturnType<typeof resolveRoles>} roles
 * @param {string} nom nom de la marque
 * @returns {string}
 */
export function espacementsHtml(r, roles, nom) {
  const hex = (/** @type {string} */ role) => {
    const v = roles.get(role);
    if (!v) throw new Error(`rôle de couleur absent : ${role}`);
    return v.hex;
  };
  const tous = [...r.ecarts, ...r.horsControle];
  const px = Object.fromEntries(tous.map((e) => [e.role, e.px]));
  const etroit = new Map(r.etroits.map((t) => [t.role, t]));
  /** Valeur affichée d'un rôle : large, et en étroit sous son seuil s'il en a une. @param {string} role */
  const valeur = (role) => {
    const t = etroit.get(role);
    if (!t) return `${px[role]} px`;
    return `<span class="dessus-${t.sous}">${px[role]} px</span><span class="sous-${t.sous}">${t.px} px en étroit, sous ${t.sous} px ${esc(t.seuil)}</span>`;
  };
  const seuils = [...new Set(r.etroits.map((t) => t.sous))];

  const legende = tous
    .map(
      (e) => `          <li>
            <span class="barre-case"><span class="barre" style="--c:${COTE[e.role]};width:var(${cssVar(e.role)})"></span></span>
            <div class="legende-texte">
              <code>${e.role}</code>
              <span class="valeur">${e.px} px · ${esc(e.alias)}${etroit.has(e.role) ? ` ; en étroit, sous ${etroit.get(e.role)?.sous} px ${esc(etroit.get(e.role)?.seuil ?? '')} : ${etroit.get(e.role)?.px} px · ${esc(etroit.get(e.role)?.alias ?? '')}` : ''}</span>
              <span class="usage">${esc(e.description)}</span>
            </div>
          </li>`,
    )
    .join('\n');
  const nFails = r.fails.length + r.etroitsFails.length + r.reglesFails.length;
  const bilan = nFails
    ? `<strong>${nFails} contrôle${nFails > 1 ? 's' : ''} en échec</strong> : voir <code>npm run espacements</code>.`
    : `Strictement croissants, valeurs en étroit comprises ; ${r.regles.map((g) => `${esc(g.vers)} ≥ ${g.min} × ${esc(g.de)}, ${esc(g.raison)} (${esc(g.statut)})`).join(' ; ')} ; contrôlé par <code>npm run espacements</code>.`;
  const vars = tous.map((e) => `${cssVar(e.role)}: ${e.px}px;`).join(' ');
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Espacements ${esc(nom)}</title>
    <style>
      :root { ${vars} }
${seuils
  .map((n) => {
    const decl = r.etroits.filter((t) => t.sous === n).map((t) => `${cssVar(t.role)}: ${t.px}px;`).join(' ');
    return `      .sous-${n} { display: none; }
      @media (max-width: ${n - 0.02}px) { :root { ${decl} } }
      @media (max-width: ${n - 0.02}px) { .sous-${n} { display: inline; } .dessus-${n} { display: none; } }
`;
  })
  .join('')}
      /* Le parent porte l'espace : gap et padding ; aucun enfant n'a de marge. */
      * { margin: 0; box-sizing: border-box; }
      body {
        display: grid; grid-template-columns: minmax(0, 1040px); justify-content: center;
        padding: 32px 16px 64px; /* gouttière de page, hors des cinq rôles */
        background: ${hex('fond.app')}; color: ${hex('texte.principal')};
        font: 15px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
      }
      main { display: flex; flex-direction: column; gap: var(${cssVar('ecart.section')}); }
      main > header, main > section { position: relative; display: flex; flex-direction: column; gap: var(${cssVar('ecart.entre-groupes')}); }
      .entete { position: relative; display: flex; flex-direction: column; gap: var(${cssVar('ecart.dans-composant')}); }
      h1 { font-size: 26px; line-height: 1.2; }
      h2 { font-size: 19px; line-height: 1.3; }
      h3 { font-size: 16px; line-height: 1.3; }
      .entete p, .usage, .carte p { color: ${hex('texte.secondaire')}; }
      code { font: 13px ui-monospace, Menlo, monospace; overflow-wrap: anywhere; }

      .legende { list-style: none; padding: 0; display: grid; gap: var(${cssVar('ecart.entre-composants')}); }
      .legende li { display: flex; align-items: flex-start; gap: 12px; }
      .barre-case { flex: none; display: flex; width: 48px; }
      .barre { flex: none; height: 24px; min-width: 2px; background: color-mix(in srgb, var(--c) 30%, transparent); box-shadow: inset 0 0 0 1px var(--c); }
      .legende-texte { display: flex; flex-direction: column; gap: var(${cssVar('ecart.dans-composant')}); min-width: 0; }
      .valeur { font-variant-numeric: tabular-nums; }
      .usage { font-size: 14px; }
      .rapports { font-variant-numeric: tabular-nums; }


      .formulaire { max-width: 560px; display: flex; flex-direction: column; gap: var(${cssVar('ecart.entre-groupes')}); padding: var(${cssVar('marge-interieure.composant')}); background: ${hex('fond.surface')}; border: 1px solid ${hex('bordure.discrete')}; border-radius: 8px; }
      .champs { display: flex; flex-direction: column; gap: var(${cssVar('ecart.entre-composants')}); }
      .champ { position: relative; display: flex; flex-direction: column; gap: var(${cssVar('ecart.dans-composant')}); }
      .champ label { position: relative; font-weight: 600; font-size: 14px; }
      .champ input { font: inherit; width: 100%; min-height: 40px; padding: 8px 12px; color: ${hex('texte.principal')}; background: ${hex('fond.surface')}; border: 1px solid ${hex('bordure.forte')}; border-radius: 6px; }
      .champ.erreur input { border: 2px solid ${hex('bordure.erreur')}; }
      .champ input:focus-visible, .actions button:focus-visible { outline: 2px solid ${hex('bordure.focus')}; outline-offset: 2px; }
      .message-erreur { color: ${hex('texte.erreur')}; font-size: 14px; line-height: 20px; }
      .actions { display: flex; flex-wrap: wrap; gap: var(${cssVar('ecart.entre-composants')}); }
      .actions button { font: inherit; font-weight: 600; padding: 10px 16px; border-radius: 6px; border: 1px solid transparent; cursor: pointer; }
      .actions .principal { background: ${hex('fond.interactif.fort')}; color: ${hex('texte.sur-interactif')}; }
      .actions .secondaire { background: ${hex('fond.surface')}; color: ${hex('texte.interactif')}; border-color: ${hex('bordure.forte')}; }

      .cartes { display: flex; flex-wrap: wrap; gap: var(${cssVar('ecart.entre-composants')}); }
      .carte { flex: 1 1 260px; position: relative; display: flex; flex-direction: column; gap: var(${cssVar('ecart.dans-composant')}); padding: var(${cssVar('marge-interieure.composant')}); background: ${hex('fond.surface')}; border: 1px solid ${hex('bordure.discrete')}; border-radius: 8px; }
      .carte .meta { color: ${hex('texte.interactif')}; font-weight: 600; font-size: 14px; }

      .horaires { list-style: none; padding: 0; display: flex; flex-direction: column; gap: var(${cssVar('ecart.entre-composants')}); max-width: 560px; }
      .horaires li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(${cssVar('ecart.dans-composant')}); padding-bottom: 8px; border-bottom: 1px solid ${hex('bordure.discrete')}; }

      /* Cotes : bande posée sous son hôte, sur l'écart qu'elle nomme ; cadre pour la marge intérieure. */
      .cote { position: absolute; left: 0; right: 0; top: 100%; z-index: 1; pointer-events: none; display: flex; align-items: center; justify-content: flex-end; background: color-mix(in srgb, var(--c) 22%, transparent); box-shadow: inset 0 1px 0 var(--c), inset 0 -1px 0 var(--c); }
      .cote-cadre { position: absolute; inset: 0; z-index: 1; pointer-events: none; border: var(${cssVar('marge-interieure.composant')}) solid color-mix(in srgb, var(--c) 22%, transparent); outline: 1px dashed var(--c); outline-offset: -1px; border-radius: 7px; }
      .etiquette { position: relative; flex: none; font: 600 11px/14px ui-monospace, Menlo, monospace; padding: 1px 6px; color: #1f1c17; background: #ffffff; border: 1px solid var(--c); border-radius: 3px; white-space: nowrap; }
      .cote-cadre .etiquette { position: absolute; left: 0; top: calc(var(${cssVar('marge-interieure.composant')}) / -2); transform: translateY(-50%); }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div class="entete">
          <h1>Espacements par relation, ${esc(nom)}</h1>
          <p>Marque fictive. Cinq rôles dans semantique.tokens.json, alias vers espace.* ; le parent porte l'espace (gap et padding), aucun enfant n'a de marge. Chaque rôle est coté une fois sur la page, d'une bande à sa couleur.</p>
        </div>
      </header>

      <section aria-labelledby="titre-legende">
        <div class="entete">
          <h2 id="titre-legende">Les cinq espaces</h2>
          <p class="rapports">${r.ecarts.map((e) => e.px).join(' → ')} px ; rapports entre voisins ${r.voisins.map((v) => fr(v.rapport, TIRET)).join(' ; ')} (affichés, non contrôlés). ${bilan}</p>
        </div>
        <ul class="legende">
${legende}
        </ul>
      </section>

      <section aria-labelledby="titre-reservation">
        <div class="entete">
          <h2 id="titre-reservation">Réserver une table</h2>
          <p>Une table au comptoir, sous la verrière ou au salon, du mardi au dimanche.</p>
        </div>
        <form class="formulaire" novalidate>
          <div class="champs">
            <div class="champ">
              <label for="nom">Nom</label>
              <input id="nom" name="nom" type="text" value="Camille Arnaud" autocomplete="off">
              ${cote('ecart.entre-composants', `${px['ecart.entre-composants']} px`)}
            </div>
            <div class="champ erreur">
              <label for="courriel">Adresse e-mail${cote('ecart.dans-composant', valeur('ecart.dans-composant'))}</label>
              <input id="courriel" name="courriel" type="email" value="camille.arnaud" autocomplete="off" aria-invalid="true" aria-describedby="courriel-erreur">
              <p class="message-erreur" id="courriel-erreur">Il manque la partie après @.<br>Exemple : prenom@domaine.fr</p>
            </div>
            <div class="champ">
              <label for="couverts">Nombre de couverts</label>
              <input id="couverts" name="couverts" type="text" inputmode="numeric" value="2" autocomplete="off">
            </div>
          </div>
          <div class="actions">
            <button type="button" class="principal">Réserver</button>
            <button type="button" class="secondaire">Annuler</button>
          </div>
        </form>
        ${cote('ecart.section', valeur('ecart.section'))}
      </section>

      <section aria-labelledby="titre-salles">
        <div class="entete">
          <h2 id="titre-salles">Trois salles</h2>
          <p>Chacune a son rythme ; la carte et les horaires sont les mêmes partout.</p>
          ${cote('ecart.entre-groupes', `${px['ecart.entre-groupes']} px`)}
        </div>
        <div class="cartes">
          <article class="carte">
            <h3>Le comptoir</h3>
            <p>Huit tabourets face aux machines, pour un café serré ou un déjeuner rapide.</p>
            <p class="meta">8 places</p>
            <span class="cote-cadre" data-cote="marge-interieure.composant" aria-hidden="true" style="--c:${COTE['marge-interieure.composant']}"><span class="etiquette">marge-interieure.composant · ${px['marge-interieure.composant']} px</span></span>
          </article>
          <article class="carte">
            <h3>La verrière</h3>
            <p>Lumière du jour et grandes tables, pour venir à plusieurs le week-end.</p>
            <p class="meta">24 places</p>
          </article>
          <article class="carte">
            <h3>Le salon</h3>
            <p>Fauteuils et lampes basses, pour lire ou travailler au calme.</p>
            <p class="meta">12 places</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="titre-horaires">
        <div class="entete">
          <h2 id="titre-horaires">Horaires</h2>
          <p>Cuisine ouverte jusqu'à une heure avant la fermeture.</p>
        </div>
        <ul class="horaires">
          <li><span>Mardi au vendredi</span><span>8 h – 19 h</span></li>
          <li><span>Samedi et dimanche</span><span>9 h – 20 h</span></li>
          <li><span>Lundi</span><span>fermé</span></li>
        </ul>
      </section>
    </main>
  </body>
</html>
`;
}

/**
 * Planche d'un dossier de marque : lit les tokens et rend la page.
 * @param {string} dir dossier tokens/<marque>/
 * @returns {string}
 */
export function planche(dir) {
  const { large, etroit } = largeurs(dir);
  const roles = resolveRoles(large.semantique, large.primitives, large.marque);
  return espacementsHtml(espacements(large.semantique, large.primitives, etroit), roles, nomDeMarque(dir));
}
