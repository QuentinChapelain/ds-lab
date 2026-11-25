// @ts-check
/**
 * La remise (D87) : ce que le designer donne au développeur, tiré des sorties de la réduction et des feuilles
 * ajoutées, sans nouvelle mesure. Un dossier, `remise/` à côté du projet, réécrit à chaque validation du rendu :
 * `feuilles/` (tokens.css et les feuilles ajoutées, rangées par leur chemin sur le site), `a-installer.md` (trois
 * étapes : installer le système, poser les décisions, reprendre l'ancien code) et `message.txt` (à copier pour le
 * développeur ou son agent de code). Les mots sont ceux du développeur : aucun mot de l'outil, aucun identifiant de
 * ligne. La page en direct : une page du site, servie avec tokens.css et ses feuilles ajoutées posées, comme verify.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lireJson } from '../lib/fichiers.js';

/** Le dossier de la remise, à côté du projet. */
const REMISE = 'remise';

/** La marque d'un dossier de remise écrit par l'outil : sans elle, `remise/` n'est jamais effacé. */
const MARQUE = 'remise.json';

/**
 * @typedef {{ selecteur: string, ligne: number, valeurs: { propriete: string, avant: string, apres: string }[] }} Regle
 * @typedef {{ feuille: string, ajout: string, injectee: boolean }} Ajout
 * @typedef {{ produit: string, dossier: string, tokens: string, ajouts: Ajout[],
 *   pages: { nom: string, chemin: string, apres: Ajout[] }[], fichiers: { feuille: string, regles: Regle[], valeurs: number }[],
 *   valeurs: number, lignes: number, nonEcrites: { selecteur: string, feuille: string, ligne: number, propriete: string }[] }} Remise
 */

/**
 * Les données de la remise.
 * @param {{ produit: string, dossierProjet: string, site: import('./projet.js').Site, dossierAjout: string, modifications: string }} o
 *   dossierAjout : les feuilles ajoutées de la réduction ; modifications : son modifications.json
 * @returns {Remise}
 */
export function remiseDe({ produit, dossierProjet, site, dossierAjout, modifications }) {
  const m = lireJson(join(dossierAjout, 'feuilles-ajoutees.json'));
  const mods = lireJson(modifications);
  /** @type {any[]} */
  const declarations = m.declarations ?? [];
  /** @type {Ajout[]} */
  const ajouts = (m.feuilles ?? []).map((/** @type {any} */ f) => ({ feuille: String(f.feuille), ajout: String(f.ajout), injectee: !!f.injectee }));
  // Une feuille ajoutée sur une page : celle-ci porte une de ses déclarations.
  const pages = site.pages.map((p) => ({
    nom: site.noms[p] ?? p,
    chemin: p,
    apres: ajouts.filter((a) => declarations.some((d) => d.sheet === a.feuille && (d.pages ?? []).includes(p))),
  }));
  /** @type {Map<string, Map<string, Regle>>} */
  const parFeuille = new Map();
  for (const e of /** @type {any[]} */ (mods.entries ?? [])) {
    const f = parFeuille.get(e.sheet) ?? new Map();
    parFeuille.set(e.sheet, f);
    const cle = `${e.line}\n${e.selector}`;
    const r = f.get(cle) ?? { selecteur: String(e.selector), ligne: Number(e.line), valeurs: [] };
    f.set(cle, r);
    if (!r.valeurs.some((v) => v.propriete === e.property)) r.valeurs.push({ propriete: String(e.property), avant: String(e.written), apres: String(e.value) });
  }
  for (const f of parFeuille.values()) for (const r of f.values()) r.valeurs = enRaccourcis(r.valeurs);
  const fichiers = [...parFeuille]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([feuille, regles]) => {
      const l = [...regles.values()].sort((a, b) => a.ligne - b.ligne || (a.selecteur < b.selecteur ? -1 : 1));
      return { feuille, regles: l, valeurs: l.reduce((n, r) => n + r.valeurs.length, 0) };
    });
  return {
    produit,
    dossier: join(dossierProjet, REMISE),
    tokens: String(m.tokensCss ?? ''),
    ajouts,
    pages,
    fichiers,
    valeurs: fichiers.reduce((n, f) => n + f.valeurs, 0),
    lignes: pages.reduce((n, p) => n + 1 + p.apres.length, 0),
    nonEcrites: declarations
      .filter((d) => !d.ecrite)
      .map((d) => ({ selecteur: String(d.selector), feuille: String(d.sheet), ligne: Number(d.line), propriete: String(d.property) })),
  };
}

/** Les propriétés longues qu'un raccourci réunit, dans son ordre. */
const RACCOURCIS = /** @type {[string, string[]][]} */ ([
  ['padding', ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']],
  ['margin', ['margin-top', 'margin-right', 'margin-bottom', 'margin-left']],
  ['border-color', ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color']],
  ['border-radius', ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius']],
  ['gap', ['row-gap', 'column-gap']],
]);

/** Quatre côtés écrits au plus court : « 8px 16px » pour haut et bas, droite et gauche. @param {string[]} v */
const auPlusCourt = (v) => {
  if (v.length === 2) return v[0] === v[1] ? [v[0]] : v;
  const [h, d, b, g] = v;
  if (d === g) return h === b ? (h === d ? [h] : [h, d]) : [h, d, b];
  return v;
};

/**
 * Les propriétés longues d'une règle réunies en raccourci quand toutes y sont : le code source écrit `padding`, pas
 * `padding-top`. Une valeur de raccourci est une suite de valeurs : `8px 16px` devient `var(--space-8, 8px)
 * var(--space-16, 16px)`. [H] La source écrit le raccourci ; sinon, les propriétés longues se lisent pareil.
 * @param {{ propriete: string, avant: string, apres: string }[]} valeurs
 */
function enRaccourcis(valeurs) {
  let l = valeurs;
  for (const [nom, longues] of RACCOURCIS) {
    const parts = longues.map((p) => l.find((v) => v.propriete === p));
    if (parts.some((x) => !x)) continue;
    const v = /** @type {{ propriete: string, avant: string, apres: string }[]} */ (parts);
    const i = l.indexOf(v[0]);
    l = l.filter((x) => !v.includes(x));
    // Les côtés se réduisent ensemble : sur les nouvelles valeurs, qui peuvent différer là où les anciennes coïncident.
    const paires = v.map((x) => `${x.avant}\n${x.apres}`);
    const court = auPlusCourt(paires);
    l.splice(Math.min(i, l.length), 0, { propriete: nom, avant: court.map((x) => x.split('\n')[0]).join(' '), apres: court.map((x) => x.split('\n')[1]).join(' ') });
  }
  return l.sort((a, b) => (a.propriete < b.propriete ? -1 : 1));
}

/** La ligne qui charge une feuille. @param {string} chemin */
const lien = (chemin) => `<link rel="stylesheet" href="${chemin}">`;

/** Accord en nombre : 0 et 1 au singulier. @param {number} n @param {string} un @param {string} plusieurs */
const nombre = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;

/**
 * « À installer » : trois étapes, dans l'ordre, pour le développeur ou son agent de code.
 * @param {Remise} r
 */
export function aInstaller(r) {
  const bloc = (/** @type {string} */ s) => ['```html', s, '```'];
  const page = (/** @type {Remise['pages'][number]} */ p) => [
    p.nom === p.chemin ? `### \`${p.chemin}\`` : `### ${p.nom} (\`${p.chemin}\`)`,
    '',
    ...(p.apres.length
      ? p.apres.flatMap((a) =>
          a.injectee
            ? [`La feuille \`${a.feuille}\` est chargée par un script : charge \`${a.ajout}\` depuis ce script, juste après elle.`, '']
            : [`Juste après \`${lien(a.feuille)}\` :`, '', ...bloc(lien(a.ajout)), ''],
        )
      : ['Rien à ajouter sur cette page.', '']),
  ];
  const fichier = (/** @type {Remise['fichiers'][number]} */ f) => [
    `- [ ] \`${f.feuille}\` (${nombre(f.valeurs, 'valeur', 'valeurs')})`,
    ...f.regles.map((g) => `  - \`${g.selecteur}\`, ligne ${g.ligne} : ${g.valeurs.map((v) => `\`${v.propriete}: ${v.avant}\` → \`${v.apres}\``).join(' ; ')}`),
  ];
  return [
    `# À installer : ${r.produit}`,
    '',
    'Le rendu validé à l’écran « Avant, après », en trois étapes. Fais-les dans l’ordre. Chacune se livre seule, se vérifie et s’annule.',
    '',
    `Les fichiers sont dans \`feuilles/\`, rangés comme sur le site : \`feuilles${r.tokens}\` va à \`${r.tokens}\`.`,
    '',
    '## 1. Installer le système',
    '',
    `Dépose \`${r.tokens}\` sur le site, puis ajoute cette ligne avant toutes les autres feuilles de style, dans chaque page :`,
    '',
    ...bloc(lien(r.tokens)),
    '',
    'À regarder ensuite : rien ne change à l’écran.',
    '',
    'Pour annuler : retire la ligne.',
    '',
    '## 2. Poser les décisions',
    '',
    `Dépose les ${nombre(r.ajouts.length, 'feuille ajoutée', 'feuilles ajoutées')}. Chacune se charge juste après sa feuille d’origine, dans toute page qui charge celle-ci. Sur les pages vérifiées :`,
    '',
    ...r.pages.flatMap(page),
    'À regarder ensuite : chaque page ressemble à l’« Après » validé.',
    '',
    'Pour annuler : retire ces lignes.',
    '',
    ...(r.nonEcrites.length
      ? [
          `Pas dans les feuilles ajoutées, ${nombre(r.nonEcrites.length, 'valeur à changer', 'valeurs à changer')} directement dans le code, en reprenant l’ancien code :`,
          '',
          ...r.nonEcrites.map((x) => `- \`${x.selecteur}\` (\`${x.feuille}\`, ligne ${x.ligne}) : \`${x.propriete}\``),
          '',
        ]
      : []),
    '## 3. Reprendre l’ancien code',
    '',
    'Fichier par fichier, remplace chaque valeur écrite en dur par sa variable. Quand tout un fichier est repris, sa feuille ajoutée ne sert plus : retire-la, avec la ligne qui la charge. Un commit par fichier.',
    '',
    'À regarder ensuite : rien ne change à l’écran.',
    '',
    'Pour annuler : défais le commit du fichier.',
    '',
    ...r.fichiers.flatMap(fichier),
    '',
  ].join('\n');
}

/**
 * Le message à copier, pour le développeur ou son agent de code.
 * @param {Remise} r
 */
export function message(r) {
  return `Voici la remise de ds-lab pour ${r.produit}, dans le dossier ${r.dossier}. Ouvre a-installer.md : trois étapes, à faire dans l’ordre. Commence par la 1, installer le système, puis la 2, poser les décisions. Préviens-moi quand elles sont installées : je vérifierai les pages. La 3, reprendre l’ancien code fichier par fichier, vient ensuite, un commit par fichier.`;
}

/**
 * Écrit le dossier de la remise, à côté du projet, pour une vérification validée. Un dossier `remise/` qui n'a pas
 * été écrit par l'outil n'est jamais touché.
 * @param {Remise} r @param {{ dossierAjout: string, verification: string }} o
 */
export function ecrireRemise(r, { dossierAjout, verification }) {
  if (existsSync(r.dossier) && !existsSync(join(r.dossier, MARQUE))) throw new Error(`${r.dossier} existe et n’a pas été écrit par l’outil : rien n’est écrit ; le renommer`);
  rmSync(join(r.dossier, 'feuilles'), { recursive: true, force: true });
  for (const f of [r.tokens, ...r.ajouts.map((a) => a.ajout)]) {
    const cible = join(r.dossier, 'feuilles', f);
    mkdirSync(join(cible, '..'), { recursive: true });
    cpSync(join(dossierAjout, f), cible);
  }
  writeFileSync(join(r.dossier, 'a-installer.md'), aInstaller(r));
  writeFileSync(join(r.dossier, 'message.txt'), `${message(r)}\n`);
  writeFileSync(join(r.dossier, MARQUE), `${JSON.stringify({ verification }, null, 2)}\n`);
}

/** Échappe un texte pour un attribut. @param {string} s */
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * La page en direct : le HTML d'une page du site, avec une base sur son adresse (images, feuilles et liens se
 * chargent depuis le site), tokens.css en tête et chaque feuille ajoutée juste après le lien de sa feuille, avec son
 * media, comme verify les pose. Une feuille chargée par un script n'a pas de lien : la sienne n'est pas posée. Un
 * lien vers une autre page mesurée y mène en direct.
 * @param {string} html @param {string} adresse  l'adresse de la page sur le site
 * @param {{ tokens: string | null, ajouts: { feuille: string, texte: string }[], liens?: (chemin: string) => string | null }} feuilles
 *   liens : l'adresse en direct d'une autre page mesurée, ou null
 */
export function pageEnDirect(html, adresse, { tokens, ajouts, liens }) {
  const origine = new URL(adresse).origin;
  // Un lien vers une autre page mesurée reste en direct ; les autres mènent au site.
  const avecLiens = liens
    ? html.replace(/(<a\b[^>]*\bhref\s*=\s*["'])([^"']+)(["'])/gi, (t, a, h, z) => {
        if (h.startsWith('#')) return t;
        const u = new URL(h, adresse);
        const vers = u.origin === origine ? liens(u.pathname) : null;
        return vers ? `${a}${attr(vers + u.hash)}${z}` : t;
      })
    : html;
  const avecAjouts = avecLiens.replace(/<link\b[^>]*>/gi, (l) => {
    if (!/\brel\s*=\s*["']?[^"'>]*\bstylesheet\b/i.test(l)) return l;
    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(l)?.[1];
    if (!href) return l;
    const u = new URL(href, adresse);
    const a = u.origin === origine ? ajouts.find((x) => x.feuille === u.pathname) : undefined;
    if (!a) return l;
    const media = /\bmedia\s*=\s*["']([^"']+)["']/i.exec(l)?.[1];
    return `${l}<style data-ds-lab-ajout${media ? ` media="${attr(media)}"` : ''}>${a.texte}</style>`;
  });
  const tete = `<base href="${attr(adresse)}">${tokens !== null ? `<style data-ds-lab-ajout>${tokens}</style>` : ''}`;
  return /<head\b[^>]*>/i.test(avecAjouts) ? avecAjouts.replace(/<head\b[^>]*>/i, (h) => `${h}${tete}`) : `${tete}${avecAjouts}`;
}

/**
 * Les feuilles à poser dans la page en direct, lues dans le dossier des feuilles ajoutées.
 * @param {string} dossierAjout
 */
export function feuillesEnDirect(dossierAjout) {
  const m = lireJson(join(dossierAjout, 'feuilles-ajoutees.json'));
  return {
    tokens: m.tokensCss ? readFileSync(join(dossierAjout, m.tokensCss), 'utf8') : null,
    ajouts: (m.feuilles ?? []).map((/** @type {any} */ f) => ({ feuille: String(f.feuille), texte: readFileSync(join(dossierAjout, f.ajout), 'utf8') })),
  };
}
