// @ts-check
/**
 * Sorties du constat des composants (D46, D47) : constat.json, constat.md, constat.html, à côté du relevé brut
 * (releve.json) et des captures (captures/<id>.png).
 * La page HTML guide : ce qu'il reste à faire, puis les scores, les types à doublons, les types à une seule version
 * (repliés), les non identifiés, « Comment lire ce constat » (replié) et les limites. Quatre explications (i), sur les
 * scores. Un seul fichier, lisible sur un téléphone : les captures y sont en data:, à la taille réelle de l'élément
 * (réduites seulement si elles dépassent la colonne) ; aucun script, aucune requête ; clair et sombre selon le système,
 * couleurs prises dans les rôles neutres communs des jetons (`couleursDuConstat`), accent : `texte.info`. Les étiquettes
 * d'origine ont toutes le même style neutre. Toute chaîne venue de la page auditée est échappée.
 */
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { esc, famille } from '../lib/format.js';
import { flattenTokens, resoudreAlias } from '../tokens/roles.js';
import { COMMUN } from '../tokens/resolver.js';
import { accorde, cotes, px } from '../composants/guidage.js';
import { TEXTES } from './textes.js';

/** @typedef {ReturnType<typeof import('../composants/constat.js').construireConstat>} Constat */
/** @typedef {Constat['types'][number]} TypeDuConstat */
/** @typedef {import('../composants/constat.js').VueVersion} VueVersion */
/** @typedef {import('../browser/composants.js').Mesures} Mesures */

const G = TEXTES.guidage;
/** Titres des quatre scores, dans l'ordre des cartes. */
const SCORES = /** @type {const} */ ([
  ['Source unique', 'sourceUnique'],
  ['Accessibilité de base', 'accessibilite'],
  ['Versions choisies', 'versionsAGarder'],
  ['Éléments identifiés', 'fiabilite'],
]);

/** Variable CSS du constat → rôle neutre commun (D47). */
const ROLES_DU_CONSTAT = /** @type {Record<string, string>} */ ({
  fond: 'fond.app',
  'fond-discret': 'fond.discret',
  surface: 'fond.surface',
  texte: 'texte.principal',
  doux: 'texte.secondaire',
  trait: 'bordure.discrete',
  'trait-fort': 'bordure.defaut',
  accent: 'texte.info',
  'accent-fond': 'fond.info.discret',
  'accent-trait': 'bordure.info',
});

/**
 * Couleurs du constat en clair et en sombre, et la police du produit, lues dans les couches communes des jetons, sans
 * aucune marque (D26) : les rôles neutres et de statut ne pointent que vers des primitives communes (D02). Le sombre
 * ajoute le mode sombre commun avant les rôles ; le dernier jeton gagne, comme dans un resolver.
 */
function couleursDuConstat() {
  const lire = (/** @type {string} */ f) => JSON.parse(readFileSync(join(COMMUN, f), 'utf8'));
  /** @param {string[]} fichiers */
  const jeux = (fichiers) => {
    /** @type {Map<string, any>} */
    const m = new Map();
    for (const f of fichiers) flattenTokens(lire(f), [], m);
    return m;
  };
  /** @param {Map<string, any>} m @returns {Record<string, string>} */
  const resolus = (m) =>
    Object.fromEntries(
      Object.entries(ROLES_DU_CONSTAT).map(([v, role]) => {
        const t = m.get(role);
        if (!t) throw new Error(`constat : rôle ${role} absent des jetons communs`);
        return [v, String(resoudreAlias(m, t.$value, { depuis: role, chaine: [role] }).valeur.hex)];
      }),
    );
  return {
    clair: resolus(jeux(['primitives.tokens.json', 'statuts.tokens.json', 'semantique.tokens.json'])),
    sombre: resolus(jeux(['primitives.tokens.json', 'statuts.tokens.json', 'mode.sombre.tokens.json', 'semantique.tokens.json'])),
    police: famille(lire('police.tokens.json').police.produit.$value),
  };
}

/** @param {string} s */
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** @param {Mesures} m */
const texteMesures = (m) =>
  `hauteur ${px(m.hauteur)} · arrondi ${cotes(m.rayons)} · bordure ${cotes(m.bordures)} · marge intérieure ${cotes(m.marges)} · police ${px(m.taille)}, graisse ${m.graisse}`;
/** @param {{ x: number, y: number }} s */
const sur = (s) => `${s.x} sur ${s.y}`;
/** @param {Constat} c */
const frameworkDe = (c) => (c.frameworks.length ? c.frameworks.map((f) => `${f.nom} ${f.version}`).join(', ') : 'aucun framework reconnu');
/** En-tête : nom du site, nombre de pages vues, framework. @param {Constat} c */
const enTete = (c) => {
  const vues = c.pages.filter((p) => !p.erreur).length;
  const tombees = c.pages.length - vues;
  return `${c.nom} · ${vues} page${vues < 2 ? '' : 's'}${tombees ? ` (${tombees} non vue${tombees < 2 ? '' : 's'})` : ''} · ${frameworkDe(c)}`;
};
/** @param {TypeDuConstat} t */
const resumeDuType = (t) => G.type.resume.replace('{fois}', accorde(G.type.fois, t.fois)).replace('{versions}', accorde(G.type.versions, t.versions.length));
/** Lignes « à faire » non nulles : [nombre, texte, ancre]. @param {Constat} c @returns {[number, string, string][]} */
const lignesAFaire = (c) =>
  /** @type {[number, string, string][]} */ ([
    [c.aFaire.doublons, accorde(G.aFaire.doublons, c.aFaire.doublons), 'doublons'],
    [c.aFaire.confirmer, accorde(G.aFaire.confirmer, c.aFaire.confirmer), 'une-version'],
    [c.aFaire.blocs, accorde(G.aFaire.blocs, c.aFaire.blocs), 'non-identifies'],
  ]).filter(([n]) => n > 0);

/**
 * Ordre guidé des types (D47) : à plusieurs versions d'abord, ceux qui restent à choisir avant ceux qui sont choisis,
 * par éléments à remplacer, puis par nom ; à une seule version ensuite, ceux à confirmer d'abord, par nombre, puis par
 * nom. Un type présent seulement dans le gabarit vient à la fin des types à une version.
 * @param {Constat} c
 */
export function ordreGuide(c) {
  const parNom = (/** @type {TypeDuConstat} */ a, /** @type {TypeDuConstat} */ b) => a.nom.localeCompare(b.nom, 'fr');
  const choisi = (/** @type {TypeDuConstat} */ t) => (t.garder ? 1 : 0);
  const doublons = c.types.filter((t) => t.plusieurs).sort((a, b) => choisi(a) - choisi(b) || b.remplacer - a.remplacer || parNom(a, b));
  const uneVersion = c.types.filter((t) => !t.plusieurs && t.fois > 0).sort((a, b) => choisi(a) - choisi(b) || b.fois - a.fois || parNom(a, b));
  const gabaritSeul = c.types.filter((t) => t.fois === 0).sort(parNom);
  return { doublons, uneVersion: [...uneVersion, ...gabaritSeul] };
}

// ---------------------------------------------------------------------------------------------------------------- HTML

/** Largeur et hauteur d'une image PNG, lues dans son en-tête IHDR. @param {Buffer} png */
const taillePng = (png) => [png.readUInt32BE(16), png.readUInt32BE(20)];

/**
 * Capture à la taille réelle de l'élément : width et height en px CSS (taille de l'image divisée par la densité).
 * @param {string | null} chemin @param {Map<string, Buffer>} images @param {number} densite @param {string} alt @param {string} classe
 */
function image(chemin, images, densite, alt, classe) {
  const png = chemin ? images.get(chemin) : undefined;
  if (!png) return `<div class="${classe}"><span class="sans-image">pas de capture</span></div>`;
  const [l, h] = taillePng(png).map((x) => Math.round(x / densite));
  return `<div class="${classe}"><img src="data:image/png;base64,${png.toString('base64')}" width="${l}" height="${h}" alt="${esc(alt)}"></div>`;
}

/** Carte de score : le titre et son (i) sur la même ligne, l'explication dessous. @param {string} titre @param {string} valeur */
const carteScore = (titre, valeur) =>
  `<div class="carte-score"><details class="i"><summary><h3>${esc(titre)}</h3><span class="bouton-i" aria-hidden="true">i</span><span class="cache">, explication</span></summary><p>${esc(TEXTES.scores[titre])}</p></details><p class="valeur">${esc(valeur)}</p></div>`;

/**
 * Une version : vignette pleine largeur, origine, nom court, nombre, mention ; défauts ; différences.
 * @param {VueVersion} v @param {Map<string, Buffer>} images @param {number} densite
 */
function ligneVersion(v, images, densite) {
  const infos = [
    `<span class="origine">${esc(v.origine)}</span>`,
    `<span class="nom">${esc(v.nomCode)}</span>`,
    `<span>${esc(accorde(G.type.fois, v.fois))}</span>`,
    v.mention ? `<span class="mention">${esc(v.mention)}</span>` : '',
    v.rattache ? `<span class="mention">${esc(G.type.rattache)}</span>` : '',
  ].join('');
  const defauts = v.defauts?.length ? `<ul class="defauts">${v.defauts.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : '';
  const diffs = v.differences ? `<p class="differences">${esc(v.differences)}</p>` : '';
  return `<li class="version">${image(v.capture, images, densite, v.nomCode, 'vignette')}<p class="infos">${infos}</p>${defauts}${diffs}</li>`;
}

/**
 * Un seul « Voir le code » pour toutes les versions d'un type : nom à recopier, nom dans le code, endroit, pages,
 * extrait, mesures complètes par apparence.
 * @param {{ nom: string, fois: number, pages: string[], code: VueVersion['code'], apparences: VueVersion['apparences'] }[]} vs
 * @param {Map<string, Buffer>} images @param {number} densite
 */
function voirLeCode(vs, images, densite) {
  const blocs = vs
    .map((v) => {
      const apparences = v.apparences
        .map((a) => `<li>${image(a.capture, images, densite, 'apparence', 'mini')}<span>${esc(accorde(G.type.fois, a.fois))} : ${esc(texteMesures(a.mesures))}</span></li>`)
        .join('');
      return `<div class="code-version"><p class="nom-long"><code>${esc(v.nom)}</code></p><dl>
<dt>Nom dans le code</dt><dd><code>${esc(v.code.classes.join(' ') || '(aucune classe)')}</code></dd>
<dt>Où</dt><dd>${esc(v.code.endroit || 'page')} · <code>${esc(v.code.selecteur)}</code> · ${esc(v.pages.join(', '))}</dd>
<dt>Extrait</dt><dd><pre><code>${esc(v.code.extrait)}</code></pre></dd>
<dt>Mesures</dt><dd><ul class="apparences">${apparences}</ul></dd>
</dl></div>`;
    })
    .join('\n');
  return `<details class="code"><summary>${esc(G.type.voirLeCode)}</summary>${blocs}</details>`;
}

/** @param {string} texte */
const encadreAFaire = (texte) => `<div class="a-faire-fiche"><p class="etiquette">${esc(G.type.aFaire)}</p><p>${esc(texte)}</p></div>`;

/** Fiche d'un type. @param {TypeDuConstat} t @param {Map<string, Buffer>} images @param {number} densite */
function ficheType(t, images, densite) {
  const gabarit = t.gabarit.elements
    ? `<p class="gabarit">${esc(accorde(G.type.gabarit, t.gabarit.elements))}</p><ul class="versions">${t.gabarit.versions.map((v) => ligneVersion({ ...v, mention: null, differences: '', defauts: [] }, images, densite)).join('')}</ul>`
    : '';
  return `<article class="fiche"><h3>${esc(majuscule(t.nom))}</h3><p class="resume">${esc(resumeDuType(t))}</p>
<ul class="versions">${t.versions.map((v) => ligneVersion(v, images, densite)).join('\n')}</ul>
${gabarit}${voirLeCode([...t.versions, ...t.gabarit.versions], images, densite)}
${t.fois ? encadreAFaire(t.aFaire) : ''}</article>`;
}

const STYLE = (/** @type {ReturnType<typeof couleursDuConstat>} */ k) => {
  const vars = (/** @type {Record<string, string>} */ c) => Object.entries(c).map(([n, v]) => `--${n}: ${v};`).join(' ');
  return `
:root { ${vars(k.clair)} --vignette: ${k.clair['fond-discret']}; color-scheme: light dark; }
@media (prefers-color-scheme: dark) { :root { ${vars(k.sombre)} } }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--fond); color: var(--texte); font: 16px/1.5 ${k.police}; }
main { max-width: 760px; margin: 0 auto; padding: 16px; }
h1 { font-size: 24px; line-height: 1.25; margin: 8px 0 4px; }
h2 { font-size: 20px; line-height: 1.3; margin: 0 0 12px; }
h3 { font-size: 17px; line-height: 1.3; margin: 0; }
p { margin: 0; }
a { color: inherit; }
.sous-titre, .resume, .differences, .gabarit, .doux { color: var(--doux); }
.phrase { font-size: 18px; margin: 16px 0 20px; }
.partie { margin: 32px 0; }
.a-faire { border: 1px solid var(--accent-trait); background: var(--accent-fond); border-radius: 12px; padding: 16px; }
.a-faire ul { list-style: none; padding: 0; margin: 0; }
.a-faire li + li { margin-top: 8px; }
.a-faire a { text-decoration: none; display: block; min-height: 24px; }
.a-faire a:hover, .a-faire a:focus-visible { text-decoration: underline; }
.nombre { color: var(--accent); font-weight: 700; font-size: 20px; margin-right: 4px; }
.cartes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.carte-score { background: var(--surface); border: 1px solid var(--trait); border-radius: 12px; padding: 12px; min-width: 0; }
details.i summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 8px; justify-content: space-between; min-height: 24px; }
details.i summary::-webkit-details-marker { display: none; }
details.i h3 { font-size: 15px; font-weight: 600; }
.bouton-i { flex: 0 0 24px; width: 24px; height: 24px; border: 1px solid var(--trait-fort); border-radius: 50%; display: inline-flex; align-items: center;
  justify-content: center; font: italic 600 14px/1 Georgia, serif; color: var(--doux); }
details.i p { margin-top: 6px; color: var(--doux); font-size: 14px; }
.valeur { font-size: 26px; font-weight: 700; margin-top: 4px; }
.effort { margin-top: 12px; }
.fiche { background: var(--surface); border: 1px solid var(--trait); border-radius: 12px; padding: 16px; margin: 0 0 16px; min-width: 0; }
.resume { margin: 2px 0 12px; }
ul.versions { list-style: none; padding: 0; margin: 0; }
li.version + li.version { margin-top: 20px; }
.vignette { background: var(--vignette); border-radius: 8px; padding: 12px; overflow: hidden; }
.vignette img { display: block; max-width: 100%; height: auto; }
.sans-image { color: var(--doux); font-size: 14px; }
.infos { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; margin-top: 8px; }
.origine { border: 1px solid var(--trait-fort); border-radius: 4px; padding: 0 6px; font-size: 14px; }
.nom { font-weight: 600; overflow-wrap: anywhere; }
.mention { color: var(--doux); }
ul.defauts { margin: 6px 0 0; padding-left: 20px; }
.differences { margin-top: 4px; font-size: 15px; }
.gabarit { margin: 16px 0 8px; }
details.code { margin-top: 16px; }
details.code > summary { cursor: pointer; color: var(--doux); min-height: 24px; }
.code-version { border-top: 1px solid var(--trait); padding-top: 10px; margin-top: 10px; }
.nom-long code { font-weight: 600; }
details.code dl { margin: 6px 0 0; }
details.code dt { color: var(--doux); font-size: 14px; margin-top: 6px; }
details.code dd { margin: 0; overflow-wrap: anywhere; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; background: var(--fond-discret); padding: 8px; border-radius: 6px; margin: 4px 0; font-size: 13px; }
ul.apparences { list-style: none; padding: 0; margin: 0; }
ul.apparences li { display: flex; gap: 8px; align-items: center; margin: 6px 0; }
.mini { flex: 0 0 auto; max-width: 120px; background: var(--vignette); border-radius: 6px; padding: 4px; }
.mini img { display: block; max-width: 100%; height: auto; }
.a-faire-fiche { margin-top: 16px; border: 1px solid var(--accent-trait); background: var(--accent-fond); border-radius: 8px; padding: 10px 12px; }
.a-faire-fiche .etiquette { color: var(--accent); font-weight: 700; font-size: 14px; }
details.replie { margin: 0 0 12px; }
details.replie > summary { cursor: pointer; background: var(--surface); border: 1px solid var(--trait); border-radius: 12px; padding: 12px 16px; min-height: 24px; }
details.replie[open] > summary { margin-bottom: 8px; }
details.lire > summary { cursor: pointer; }
details.lire > summary h2 { display: inline; }
details.lire dt { font-weight: 600; margin-top: 10px; }
details.lire dd { margin: 2px 0 0; color: var(--doux); }
ul.limites { padding-left: 20px; color: var(--doux); }
code { font-size: 14px; overflow-wrap: anywhere; }
.cache { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;
};

/**
 * Page HTML du constat. `images` : chaque capture par son chemin (captures/<id>.png).
 * @param {Constat} c @param {Map<string, Buffer>} images
 */
function htmlConstat(c, images) {
  const d = c.densite;
  const s = c.scores;
  const { doublons, uneVersion } = ordreGuide(c);
  const lignes = lignesAFaire(c);
  const aFaire = lignes.length
    ? `<ul>${lignes.map(([n, texte, ancre]) => `<li><a href="#${ancre}">${esc(texte).replace(new RegExp(`^${n}`), `<span class="nombre">${n}</span>`)}</a></li>`).join('')}</ul>`
    : `<p>${esc(G.aFaire.rien)}</p>`;
  const cartes = SCORES.map(([titre, cle]) => carteScore(titre, sur(s[cle]))).join('\n');
  const partieDoublons = doublons.length ? `<section class="partie" id="doublons"><h2>${esc(G.sections.doublons)}</h2>\n${doublons.map((t) => ficheType(t, images, d)).join('\n')}</section>` : '';
  const partieUne = uneVersion.length
    ? `<section class="partie" id="une-version"><h2>${esc(G.sections.uneVersion)}</h2>\n${uneVersion
        .map((t) => `<details class="replie"><summary>${esc([majuscule(t.nom), accorde(G.type.fois, t.fois), t.versions[0]?.origine ?? ''].filter(Boolean).join(' · '))}</summary>${ficheType(t, images, d)}</details>`)
        .join('\n')}</section>`
    : '';
  const partieBlocs = c.nonIdentifies.length
    ? `<section class="partie" id="non-identifies"><h2>${esc(G.sections.nonIdentifies)}</h2>\n${c.nonIdentifies
        .map(
          (b) => `<article class="fiche"><h3>${esc(b.bloc)}</h3><p class="resume">${esc(accorde(G.type.fois, b.fois))} · ${esc(b.pages.join(', '))}</p>
${image(b.capture, images, d, b.bloc, 'vignette')}
${voirLeCode([{ nom: b.bloc, fois: b.fois, pages: b.pages, code: b.code, apparences: b.apparences }], images, d)}
${encadreAFaire(b.aFaire)}</article>`,
        )
        .join('\n')}</section>`
    : '';
  const sansCible = c.decisionsSansCible.length
    ? `<section class="partie"><h2>${esc(G.sections.sansCible)}</h2><ul>${c.decisionsSansCible.map((x) => `<li>${esc(x.texte)}</li>`).join('')}</ul></section>`
    : '';
  const lire = `<details class="lire partie"><summary><h2>${esc(G.sections.lire)}</h2></summary><dl>${Object.entries(TEXTES.definitions)
    .map(([mot, texte]) => `<dt>${esc(mot)}</dt><dd>${esc(/** @type {string} */ (texte))}</dd>`)
    .join('')}</dl></details>`;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Constat des composants · ${esc(c.nom)}</title>
<style>${STYLE(couleursDuConstat())}</style>
</head>
<body>
<main>
<header class="entete"><h1>Constat des composants</h1><p class="sous-titre">${esc(enTete(c))}</p></header>
<p class="phrase">${esc(c.phraseCourte)}</p>
<section class="a-faire" aria-labelledby="titre-a-faire"><h2 id="titre-a-faire">${esc(G.aFaire.titre)}</h2>${aFaire}</section>
<section class="partie scores" aria-label="Scores"><div class="cartes">
${cartes}
</div><p class="effort">${esc(accorde(G.effort, s.effort))}</p></section>
${partieDoublons}
${partieUne}
${partieBlocs}
${sansCible}
${lire}
<section class="partie"><h2>${esc(G.sections.limites)}</h2><ul class="limites">${c.limites.map((/** @type {string} */ l) => `<li>${esc(l)}</li>`).join('')}</ul></section>
</main>
</body>
</html>
`;
}

// ------------------------------------------------------------------------------------------------------------ Markdown

/** @param {string} s */
const cellule = (s) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
/** @param {string | null} chemin @param {string} alt */
const imageMd = (chemin, alt) => (chemin ? `![${cellule(alt)}](${chemin})` : 'pas de capture');

/** @param {Constat} c */
function markdownConstat(c) {
  const s = c.scores;
  const { doublons, uneVersion } = ordreGuide(c);
  const lignes = lignesAFaire(c);
  const l = ['# Constat des composants', '', enTete(c), '', c.phraseCourte, '', c.phrase, '', `## ${G.aFaire.titre}`, ''];
  if (lignes.length) l.push(...lignes.map(([, texte]) => `- ${texte}`), '');
  else l.push(G.aFaire.rien, '');
  l.push('## Scores', '', '| Score | Valeur |', '|---|---|', ...SCORES.map(([titre, cle]) => `| ${titre} | ${sur(s[cle])} |`), '', accorde(G.effort, s.effort), '');
  /** @param {VueVersion[]} vs */
  const tableVersions = (vs) => [
    '| Capture | Origine | Nom | Fois | Mention | Défauts | Différences |',
    '|---|---|---|---|---|---|---|',
    ...vs.map((v) => `| ${imageMd(v.capture, v.nomCode)} | ${cellule(v.origine)} | ${cellule(v.nomCode)}${v.rattache ? ` (${G.type.rattache})` : ''} | ${v.fois} | ${v.mention ?? ''} | ${cellule((v.defauts ?? []).join(' ; '))} | ${cellule(v.differences ?? '')} |`),
  ];
  /** @param {{ nom: string, pages: string[], code: VueVersion['code'], apparences: VueVersion['apparences'] }[]} vs */
  const code = (vs) => vs.map((v) => `- \`${v.nom}\` : ${v.code.endroit || 'page'}, \`${v.code.selecteur}\`, ${v.pages.join(', ')} ; \`${v.code.extrait.replace(/`/g, "'")}\` ; ${v.apparences.map((a) => `${a.fois} : ${texteMesures(a.mesures)}`).join(' ; ')}`);
  /** @param {TypeDuConstat} t */
  const fiche = (t) => {
    l.push(`### ${majuscule(t.nom)}`, '', resumeDuType(t), '', ...tableVersions(t.versions), '');
    if (t.gabarit.elements) l.push(accorde(G.type.gabarit, t.gabarit.elements), '', ...tableVersions(t.gabarit.versions), '');
    l.push(`${G.type.voirLeCode} :`, '', ...code([...t.versions, ...t.gabarit.versions]), '');
    if (t.fois) l.push(`**${G.type.aFaire}** : ${t.aFaire}`, '');
  };
  if (doublons.length) {
    l.push(`## ${G.sections.doublons}`, '');
    doublons.forEach(fiche);
  }
  if (uneVersion.length) {
    l.push(`## ${G.sections.uneVersion}`, '');
    uneVersion.forEach(fiche);
  }
  if (c.nonIdentifies.length) {
    l.push(`## ${G.sections.nonIdentifies}`, '', '| Capture | Nom | Fois | Pages | État |', '|---|---|---|---|---|');
    for (const b of c.nonIdentifies) l.push(`| ${imageMd(b.capture, b.bloc)} | \`${cellule(b.bloc)}\` | ${b.fois} | ${cellule(b.pages.join(', '))} | ${b.etat} |`);
    l.push('', ...code(c.nonIdentifies.map((b) => ({ nom: b.bloc, pages: b.pages, code: b.code, apparences: b.apparences }))), '');
    for (const b of c.nonIdentifies) l.push(`**${G.type.aFaire}** (\`${b.bloc}\`) : ${b.aFaire}`, '');
  }
  if (c.decisionsSansCible.length) l.push(`## ${G.sections.sansCible}`, '', ...c.decisionsSansCible.map((x) => `- ${x.texte}`), '');
  l.push(`## ${G.sections.lire}`, '', ...Object.entries(TEXTES.definitions).map(([mot, texte]) => `- **${mot}** : ${texte}`), '');
  l.push(`## ${G.sections.limites}`, '', ...c.limites.map((/** @type {string} */ x) => `- ${x}`), '');
  return l.join('\n');
}

// ------------------------------------------------------------------------------------------------------------ Écriture

/**
 * Écrit le relevé, le constat et les captures dans `dir`. Rend les fichiers écrits.
 * @param {string} dir @param {import('../composants/constat.js').ReleveFichier} releve @param {Constat} constat
 * @param {Map<string, Buffer>} images captures par chemin (captures/<id>.png)
 */
export async function ecrireConstat(dir, releve, constat, images) {
  await mkdir(join(dir, 'captures'), { recursive: true });
  const fichiers = [join(dir, 'releve.json'), join(dir, 'constat.json'), join(dir, 'constat.md'), join(dir, 'constat.html')];
  await writeFile(fichiers[0], JSON.stringify(releve, null, 2) + '\n');
  await writeFile(fichiers[1], JSON.stringify(constat, null, 2) + '\n');
  await writeFile(fichiers[2], markdownConstat(constat));
  await writeFile(fichiers[3], htmlConstat(constat, images));
  for (const [chemin, png] of [...images].sort(([a], [b]) => a.localeCompare(b))) await writeFile(join(dir, chemin), png);
  return fichiers;
}
