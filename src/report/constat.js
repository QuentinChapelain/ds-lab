// @ts-check
/**
 * Sorties du constat des composants (D46) : constat.json, constat.md, constat.html, à côté du relevé brut (releve.json)
 * et des captures (captures/<id>.png).
 * La page HTML est un seul fichier, lisible sur un téléphone : les captures y sont en data:, aucun script, aucune requête ;
 * les explications (i) et « Voir le code » sont des <details>. Les étiquettes d'origine ont toutes le même style neutre.
 * Toute chaîne venue de la page auditée est échappée.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { esc, fr } from '../lib/format.js';
import { TEXTES } from './textes.js';

/** @typedef {ReturnType<typeof import('../composants/constat.js').construireConstat>} Constat */
/** @typedef {import('../composants/constat.js').VueVersion} VueVersion */
/** @typedef {import('../browser/composants.js').Mesures} Mesures */

/** @param {string} s */
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** @param {number} n */
const px = (n) => `${fr(n)} px`;
/** Quatre côtés écrits comme en CSS : une, deux ou quatre valeurs. @param {number[]} v */
const cotes = (v) => {
  if (v.every((x) => x === v[0])) return px(v[0]);
  if (v[0] === v[2] && v[1] === v[3]) return `${fr(v[0])} ${px(v[1])}`;
  return `${v.slice(0, 3).map((x) => fr(x)).join(' ')} ${px(v[3])}`;
};
/** @param {Mesures} m */
const texteMesures = (m) =>
  `hauteur ${px(m.hauteur)} · arrondi ${cotes(m.rayons)} · bordure ${cotes(m.bordures)} · marge intérieure ${cotes(m.marges)} · police ${px(m.taille)}, graisse ${m.graisse}`;
/** @param {{ x: number, y: number }} s */
const sur = (s) => `${s.x} sur ${s.y}`;
/** @param {number} n @param {string} un @param {string} plusieurs */
const accord = (n, un, plusieurs) => `${n} ${n < 2 ? un : plusieurs}`;
/** @param {Constat} c */
const frameworkDe = (c) => (c.frameworks.length ? c.frameworks.map((f) => `${f.nom} ${f.version}`).join(', ') : 'aucun reconnu');
/** @param {Constat['types'][number]} t */
const resume = (t) => {
  const egalite = t.sourceUnique.plusRepandues.length > 1 ? ` (à égalité : ${t.sourceUnique.plusRepandues.join(', ')})` : '';
  return `${accord(t.fois, 'fois', 'fois')} · ${accord(t.versions.length, 'version', 'versions')} · source unique ${sur(t.sourceUnique)}${egalite}`;
};

// ---------------------------------------------------------------------------------------------------------------- HTML

/** Bouton d'explication : le texte de l'attendu pour ce mot. @param {string} mot */
const info = (mot) => `<details class="i"><summary aria-label="Explication : ${esc(mot)}">i</summary><p>${esc(TEXTES.info[mot])}</p></details>`;
/** @param {string} balise @param {string} titre @param {string} mot */
const titreI = (balise, titre, mot) => `<div class="titre-i"><${balise}>${esc(titre)}</${balise}>${info(mot)}</div>`;

/**
 * @param {string | null} chemin @param {Map<string, Buffer>} images @param {string} alt @param {string} classe
 */
function image(chemin, images, alt, classe) {
  const png = chemin ? images.get(chemin) : undefined;
  const dedans = png ? `<img src="data:image/png;base64,${png.toString('base64')}" alt="${esc(alt)}">` : '<span class="sans-image">pas de capture</span>';
  return `<span class="${classe}">${dedans}</span>`;
}

/**
 * Accordéon « Voir le code » : nom dans le code, où, extrait, mesures par apparence, nom pour le fichier de décisions.
 * @param {{ code: VueVersion['code'], apparences: VueVersion['apparences'] }} v @param {string} nomStable @param {Map<string, Buffer>} images
 */
function voirLeCode(v, nomStable, images) {
  const apparences = v.apparences
    .map((a) => `<li>${image(a.capture, images, 'apparence', 'mini')}<span>${accord(a.fois, 'fois', 'fois')} : ${esc(texteMesures(a.mesures))}</span></li>`)
    .join('');
  return `<details class="code"><summary>Voir le code</summary><dl>
<dt>Nom dans le code</dt><dd><code>${esc(v.code.classes.join(' ') || '(aucune classe)')}</code></dd>
<dt>Où</dt><dd>${esc(v.code.endroit || 'page')} · <code>${esc(v.code.selecteur)}</code></dd>
<dt>Extrait</dt><dd><pre><code>${esc(v.code.extrait)}</code></pre></dd>
<dt>Mesures</dt><dd><ul class="apparences">${apparences}</ul></dd>
<dt>Nom pour le fichier de décisions</dt><dd><code>${esc(nomStable)}</code></dd>
</dl></details>`;
}

/** @param {VueVersion} v @param {Map<string, Buffer>} images */
function ligneVersion(v, images) {
  const marques = [v.rattache ? '<span class="marque">rattaché à la main</span>' : '', v.apparences.length > 1 ? `<span>${v.apparences.length} apparences</span>` : ''].join('');
  return `<li class="version"><div class="ligne">${image(v.capture, images, v.nom, 'vignette')}<div class="infos">
<span class="origine">${esc(v.origine)}</span> <span class="nom">${esc(v.nomCode)}</span>
<span>${accord(v.fois, 'fois', 'fois')}</span><span class="pages">${esc(v.pages.join(', '))}</span>${marques}</div></div>
${voirLeCode(v, v.nom, images)}</li>`;
}

const STYLE = `
:root { --texte: #1d1d1f; --doux: #5c5c63; --trait: #d2d2d7; --fond: #ffffff; --carte: #f5f5f7; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--fond); color: var(--texte); font: 16px/1.45 system-ui, -apple-system, sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 16px; }
h1 { font-size: 24px; margin: 0 0 8px; }
h2 { font-size: 19px; margin: 0; }
h3 { font-size: 16px; margin: 0; }
section { margin: 24px 0; }
dl.entete { display: grid; grid-template-columns: max-content 1fr; gap: 2px 12px; margin: 0; }
dl.entete dt { color: var(--doux); }
dl.entete dd { margin: 0; overflow-wrap: anywhere; }
.phrase { font-size: 18px; margin: 16px 0; }
.titre-i { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.titre-i.en-ligne { display: inline-flex; }
details.i summary { list-style: none; cursor: pointer; width: 24px; height: 24px; border: 1px solid var(--doux); border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center; font: italic 600 14px/1 Georgia, serif; color: var(--doux); }
details.i summary::-webkit-details-marker { display: none; }
details.i[open] { flex-basis: 100%; }
details.i p { margin: 6px 0 0; color: var(--doux); font-size: 15px; }
.cartes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.carte-score, .effort { background: var(--carte); border-radius: 8px; padding: 12px; min-width: 0; }
.effort { margin-top: 12px; }
.valeur { font-size: 26px; font-weight: 600; margin: 4px 0 0; }
.carte-score h2, .effort h2 { font-size: 15px; font-weight: 600; }
.resume { color: var(--doux); margin: 4px 0 8px; }
.colonnes { display: flex; gap: 16px; color: var(--doux); font-size: 14px; margin: 8px 0 4px; }
ul.versions { list-style: none; padding: 0; margin: 0; }
li.version { border-top: 1px solid var(--trait); padding: 10px 0; }
.ligne { display: flex; gap: 12px; align-items: flex-start; }
.vignette { flex: 0 0 112px; width: 112px; }
.vignette img, .mini img { display: block; max-width: 100%; max-height: 96px; height: auto; }
.mini img { max-height: 48px; }
.sans-image { display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 48px; border: 1px dashed var(--trait); color: var(--doux); font-size: 13px; }
.infos { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; min-width: 0; }
.origine { border: 1px solid var(--trait); border-radius: 4px; padding: 0 6px; font-size: 14px; }
.nom { font-weight: 600; overflow-wrap: anywhere; }
.pages, .marque { color: var(--doux); }
details.code { margin-top: 6px; }
details.code summary { cursor: pointer; color: var(--doux); min-height: 24px; }
details.code dl { margin: 8px 0 0; }
details.code dt { color: var(--doux); font-size: 14px; margin-top: 6px; }
details.code dd { margin: 0; overflow-wrap: anywhere; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; background: var(--carte); padding: 8px; border-radius: 6px; margin: 4px 0; font-size: 13px; }
ul.apparences { list-style: none; padding: 0; margin: 0; }
ul.apparences li { display: flex; gap: 8px; align-items: center; margin: 4px 0; }
.mini { flex: 0 0 56px; width: 56px; }
.gabarit { color: var(--doux); margin: 12px 0 4px; }
.garder { margin: 10px 0 0; }
ul.limites { padding-left: 20px; }
code { font-size: 14px; overflow-wrap: anywhere; }
`;

/**
 * Page HTML du constat. `images` : chaque capture par son chemin (captures/<id>.png).
 * @param {Constat} c @param {Map<string, Buffer>} images
 */
function htmlConstat(c, images) {
  const s = c.scores;
  const echecs = s.accessibilite.echecs;
  const cartes = [
    `<div class="carte-score">${titreI('h2', 'Source unique', 'Source unique')}<p class="valeur">${sur(s.sourceUnique)}</p></div>`,
    `<div class="carte-score">${titreI('h2', 'Accessibilité de base', 'Accessibilité de base')}<p class="valeur">${sur(s.accessibilite)}</p>
<details class="code"><summary>Voir le détail</summary><p>${accord(echecs.nom, 'élément', 'éléments')} sans nom accessible · ${accord(echecs.clavier, 'élément', 'éléments')} hors d'atteinte au clavier · ${accord(echecs.zone, 'élément', 'éléments')} avec une zone de clic sous 24 px</p></details></div>`,
    `<div class="carte-score">${titreI('h2', 'Versions à garder choisies', 'Versions à garder choisies')}<p class="valeur">${sur(s.versionsAGarder)}</p></div>`,
    `<div class="carte-score">${titreI('h2', "Fiabilité de l'audit", "Fiabilité de l'audit")}<p class="valeur">${sur(s.fiabilite)}</p></div>`,
  ].join('\n');
  const types = c.types
    .map((t) => {
      const gabarit = t.gabarit.elements
        ? `<p class="gabarit">Gabarit : ${accord(t.gabarit.elements, 'élément', 'éléments')}, sur toutes les pages, hors des chiffres</p><ul class="versions">${t.gabarit.versions.map((v) => ligneVersion(v, images)).join('\n')}</ul>`
        : '';
      const garder = t.garder ? `<code>${esc(t.garder)}</code>` : 'pas encore choisie';
      return `<section class="type">${titreI('h2', majuscule(t.nom), "Type d'élément")}
<p class="resume">${esc(resume(t))}</p>
<div class="colonnes">${titreI('span', 'Version', 'Version')}${titreI('span', 'Origine', 'Origine')}</div>
<ul class="versions">${t.versions.map((v) => ligneVersion(v, images)).join('\n')}</ul>
${gabarit}
<div class="garder">${titreI('h3', 'Version à garder', 'Version à garder')}<p>${garder}</p></div>
</section>`;
    })
    .join('\n');
  const blocs = c.nonIdentifies.length
    ? `<ul class="versions">${c.nonIdentifies
        .map(
          (b) => `<li class="version"><div class="ligne">${image(b.capture, images, b.bloc, 'vignette')}<div class="infos">
<span class="nom">${esc(b.bloc)}</span><span>${accord(b.fois, 'fois', 'fois')}</span><span class="pages">${esc(b.pages.join(', '))}</span><span class="marque">${esc(b.etat)}</span></div></div>
${voirLeCode(b, b.bloc, images)}</li>`,
        )
        .join('\n')}</ul>`
    : '<p>Aucun bloc non identifié.</p>';
  const sansCible = c.decisionsSansCible.length
    ? `<section><h2>Décisions sans cible</h2><ul>${c.decisionsSansCible.map((d) => `<li>${esc(d.texte)}</li>`).join('')}</ul></section>`
    : '';
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Constat des composants · ${esc(new URL(c.site).host)}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<header>
<h1>Constat des composants</h1>
<dl class="entete">
<dt>Site</dt><dd>${esc(c.site)}</dd>
<dt>Pages</dt><dd>${esc(c.pages.map((p) => (p.erreur ? `${p.nom} (non vue)` : p.nom)).join(', '))}</dd>
<dt>Framework</dt><dd>${esc(frameworkDe(c))}</dd>
<dt>Fenêtre</dt><dd>${esc(c.fenetre)}</dd>
<dt>Date</dt><dd>${esc(c.date)}</dd>
</dl>
</header>
<p class="phrase">${esc(c.phrase)}</p>
<section class="scores" aria-label="Scores">
<div class="cartes">
${cartes}
</div>
<div class="effort">${titreI('h2', 'Effort', 'Effort')}<p class="valeur">${s.effort}</p><p>${accord(s.effort, 'élément', 'éléments')} hors de la version à garder de leur type, ou, sans elle, de la plus répandue</p></div>
</section>
${types}
<section class="non-identifies">${titreI('h2', 'Non identifiés', 'Non identifiés')}
${blocs}
</section>
${sansCible}
<section><h2>Limites de cet audit</h2><ul class="limites">${c.limites.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></section>
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
  const l = [
    '# Constat des composants',
    '',
    `- Site : ${c.site}`,
    `- Pages : ${c.pages.map((p) => (p.erreur ? `${p.nom} (non vue : ${p.erreur})` : `${p.nom} (${p.adresse})`)).join(', ')}`,
    `- Framework : ${frameworkDe(c)}`,
    `- Fenêtre : ${c.fenetre}`,
    `- Date : ${c.date}`,
    '',
    c.phrase,
    '',
    '## Scores',
    '',
    '| Score | Valeur |',
    '|---|---|',
    `| Source unique | ${sur(s.sourceUnique)} |`,
    `| Accessibilité de base | ${sur(s.accessibilite)} (sans nom accessible : ${s.accessibilite.echecs.nom} ; hors d'atteinte au clavier : ${s.accessibilite.echecs.clavier} ; zone de clic sous 24 px : ${s.accessibilite.echecs.zone}) |`,
    `| Versions à garder choisies | ${sur(s.versionsAGarder)} |`,
    `| Fiabilité de l'audit | ${sur(s.fiabilite)} |`,
    `| Effort | ${s.effort} |`,
    '',
  ];
  /** @param {VueVersion[]} vs */
  const tableVersions = (vs) => [
    '| Capture | Origine | Nom | Fois | Pages | Apparences | Nom pour le fichier de décisions |',
    '|---|---|---|---|---|---|---|',
    ...vs.map((v) => `| ${imageMd(v.capture, v.nom)} | ${cellule(v.origine)} | ${cellule(v.nomCode)}${v.rattache ? ' (rattaché à la main)' : ''} | ${v.fois} | ${cellule(v.pages.join(', '))} | ${v.apparences.map((a) => `${a.fois} : ${texteMesures(a.mesures)}`).join(' ; ')} | \`${cellule(v.nom)}\` |`),
  ];
  for (const t of c.types) {
    l.push(`## ${majuscule(t.nom)}`, '', resume(t), '', ...tableVersions(t.versions), '');
    if (t.gabarit.elements) l.push(`Gabarit : ${accord(t.gabarit.elements, 'élément', 'éléments')}, sur toutes les pages, hors des chiffres`, '', ...tableVersions(t.gabarit.versions), '');
    for (const v of [...t.versions, ...t.gabarit.versions]) l.push(`- \`${v.nom}\` : ${v.code.endroit || 'page'}, \`${v.code.selecteur}\` ; \`${v.code.extrait.replace(/`/g, "'")}\``);
    l.push('', `Version à garder : ${t.garder ? `\`${t.garder}\`` : 'pas encore choisie'}`, '');
  }
  l.push('## Non identifiés', '');
  if (!c.nonIdentifies.length) l.push('Aucun bloc non identifié.', '');
  else {
    l.push('| Capture | Nom | Fois | Pages | État |', '|---|---|---|---|---|');
    for (const b of c.nonIdentifies) l.push(`| ${imageMd(b.capture, b.bloc)} | \`${cellule(b.bloc)}\` | ${b.fois} | ${cellule(b.pages.join(', '))} | ${b.etat} |`);
    l.push('');
    for (const b of c.nonIdentifies) l.push(`- \`${b.bloc}\` : ${b.code.endroit || 'page'}, \`${b.code.selecteur}\` ; ${b.apparences.map((a) => texteMesures(a.mesures)).join(' ; ')}`);
    l.push('');
  }
  if (c.decisionsSansCible.length) l.push('## Décisions sans cible', '', ...c.decisionsSansCible.map((d) => `- ${d.texte}`), '');
  l.push('## Limites de cet audit', '', ...c.limites.map((x) => `- ${x}`), '');
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
