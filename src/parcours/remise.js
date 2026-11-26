// @ts-check
/**
 * La remise (D87, D99, D100) : ce que le designer donne au développeur, tiré des sorties de la réduction, des feuilles
 * ajoutées et du dernier contrôle. Un dossier, `remise/` à côté du projet, réécrit à chaque validation du rendu :
 * `feuilles/` (tokens.css et les feuilles ajoutées, rangées par leur chemin sur le site), `guide.md` (le guide de
 * migration : la stratégie, puis quatre étapes, chacune avec ce que tu fais, pourquoi, ce que tu vérifies, comment
 * l'annuler et les lignes exactes), `composants/` (les fiches des composants relevés sur le site, et un exemple de
 * structure) et `message.txt` (le mot d'accompagnement, pour un humain). Les mots sont ceux du développeur : aucun mot
 * de l'outil, aucun identifiant de ligne, aucune durée. La page en direct : une page du site, servie avec tokens.css et
 * ses feuilles ajoutées posées, comme verify.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireJson } from '../lib/fichiers.js';
import { deNom, liste } from '../lib/format.js';

/** Le dossier de la remise, à côté du projet. */
const REMISE = 'remise';

/** La marque d'un dossier de remise écrit par l'outil : sans elle, `remise/` n'est jamais effacé. */
const MARQUE = 'remise.json';

/** Le guide de migration, dans le dossier de la remise. */
const GUIDE = 'guide.md';

/** Les fiches des composants de ds-lab, d'où la remise copie celles des types relevés sur le site. */
const FICHES = fileURLToPath(new URL('../../docs/composants/', import.meta.url));

/** La fiche de chaque type de composant que relève le site, quand ds-lab en a une (D100). */
const FICHE_DU_TYPE = /** @type {Record<string, string>} */ ({ Bouton: 'button.md', 'Champ de texte': 'text-input.md' });

/** Les types relevés au féminin, pour leur article. */
const FEMININS = new Set(['case à cocher', 'liste déroulante', 'fenêtre']);

/** Les intentions du bouton, celles de sa fiche (`variant`) : un composant expose une intention, jamais une couleur. */
export const INTENTIONS = ['primary', 'secondary', 'ghost', 'danger'];

/**
 * @typedef {{ selecteur: string, ligne: number, valeurs: { propriete: string, avant: string, apres: string }[] }} Regle
 * @typedef {{ feuille: string, ajout: string, injectee: boolean }} Ajout
 * @typedef {{ produit: string, dossier: string, tokens: string, ajouts: Ajout[],
 *   pages: { nom: string, chemin: string, apres: Ajout[] }[], fichiers: { feuille: string, regles: Regle[], valeurs: number }[],
 *   valeurs: number, lignes: number, nonEcrites: { selecteur: string, feuille: string, ligne: number, propriete: string }[] }} Remise
 * @typedef {{ pages: number, changements: number, arrivees: number, enEtat: string[], composants: { nom: string, versions: number, fois: number }[] }} Controle
 *   ce que le guide lit du dernier contrôle et du relevé des composants (le bilan de la remise)
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

/** Les types relevés qui ont une fiche, le bouton d'abord. @param {Controle} c */
const avecFiche = (c) => c.composants.filter((t) => FICHE_DU_TYPE[t.nom]).sort((a, b) => (a.nom === 'Bouton' ? -1 : b.nom === 'Bouton' ? 1 : 0));

/**
 * Le guide de migration (D100), sur la planche « 9 bis » : la stratégie d'abord, puis chaque étape avec les mêmes
 * rubriques (ce que tu fais, pourquoi, tu vérifies, pour annuler) et ses lignes exactes ; en fin, la liste des valeurs
 * à reprendre, fichier par fichier. Chaque chiffre vient des sorties ; aucune durée.
 * @param {Remise} r @param {Controle} c
 */
export function guide(r, c) {
  const bloc = (/** @type {string} */ langue, /** @type {string} */ s) => ['```' + langue, s, '```'];
  const rubrique = (/** @type {string} */ nom, /** @type {string} */ texte) => [`**${nom}** ${texte}`, ''];
  const page = (/** @type {Remise['pages'][number]} */ p) => [
    p.nom === p.chemin ? `#### \`${p.chemin}\`` : `#### ${p.nom} (\`${p.chemin}\`)`,
    '',
    ...(p.apres.length
      ? p.apres.flatMap((a) =>
          a.injectee
            ? [`La feuille \`${a.feuille}\` est chargée par un script : charge \`${a.ajout}\` depuis ce script, juste après elle.`, '']
            : [`Juste après \`${lien(a.feuille)}\` :`, '', ...bloc('html', lien(a.ajout)), ''],
        )
      : ['Rien à ajouter sur cette page.', '']),
  ];
  const fichier = (/** @type {Remise['fichiers'][number]} */ f) => [
    `- [ ] \`${f.feuille}\` (${nombre(f.valeurs, 'valeur', 'valeurs')})`,
    ...f.regles.map((g) => `  - \`${g.selecteur}\`, ligne ${g.ligne} : ${g.valeurs.map((v) => `\`${v.propriete}: ${v.avant}\` → \`${v.apres}\``).join(' ; ')}`),
  ];
  // L'exemple de la reprise de l'ancien code : la première règle de la liste, avant et après.
  const g = r.fichiers[0]?.regles[0];
  const exemple = g ? bloc('css', [`${g.selecteur} { ${g.valeurs.map((v) => `${v.propriete}: ${v.avant};`).join(' ')} }`, `${g.selecteur} { ${g.valeurs.map((v) => `${v.propriete}: ${v.apres};`).join(' ')} }`].join('\n')) : [];
  // Ce que le contrôle a vu : les changements sur l'image, et ceux qui se regardent à la main.
  const vus = c.changements - c.enEtat.length;
  const surPages = c.pages > 1 ? `Sur les ${c.pages} pages vérifiées` : 'Sur la page vérifiée';
  const aLaMain = c.enEtat.length ? ` ; ${c.enEtat.length > 1 ? `les ${c.enEtat.length} autres se regardent à la main, dans leur état` : 'le dernier se regarde à la main, dans son état'} : ${liste(c.enEtat)}` : '';
  const controle = c.changements ? ` ${surPages}, au contrôle du designer, ${vus} ${vus > 1 ? 'changements' : 'changement'} sur ${c.changements} se ${vus > 1 ? 'voient' : 'voit'} sur l’image${aLaMain}.` : '';
  const types = avecFiche(c);
  const premier = types[0];
  const sansFiche = c.composants.filter((t) => !FICHE_DU_TYPE[t.nom]);
  const nomDit = (/** @type {string} */ n) => {
    const m = n.charAt(0).toLowerCase() + n.slice(1);
    return /^[aeiouyé]/.test(m) ? `l’${m}` : FEMININS.has(m) ? `la ${m}` : `le ${m}`;
  };
  const majuscule = (/** @type {string} */ t) => t.charAt(0).toUpperCase() + t.slice(1);
  return [
    `# Guide de migration vers le design system ${deNom(r.produit)}`,
    '',
    'Pour le développeur. Il dit d’abord pourquoi on procède ainsi, puis ce que tu fais à chaque étape, comment tu le vérifies et comment tu l’annules.',
    '',
    '## La stratégie',
    '',
    'On ne réécrit pas le site. On pose le nouveau à côté de l’ancien, on vérifie, puis on retire l’ancien morceau par morceau. Le site reste en ligne et juste à chaque étape, et chacune se livre seule.',
    '',
    '1. Installer les variables du système. À l’écran : rien.',
    '2. Poser les décisions, par-dessus l’ancien code. À l’écran : le nouveau rendu.',
    '3. Reprendre l’ancien code, fichier par fichier. À l’écran : rien.',
    '4. Remplacer les composants en double. À l’écran : rien.',
    '',
    'Une fois les décisions posées, le site a son nouveau rendu : c’est ce que le designer a validé sur image. Les deux dernières étapes remboursent la dette de code. Elles peuvent s’étaler sans bloquer personne.',
    '',
    `Les fichiers sont dans \`feuilles/\`, rangés comme sur le site : \`feuilles${r.tokens}\` va à \`${r.tokens}\`.`,
    '',
    '## Les étapes',
    '',
    '### 1. Installer le système',
    '',
    ...rubrique('Ce que tu fais', `Tu déposes \`${r.tokens}\` sur le site, et tu le charges avant toutes les autres feuilles, sur chaque page.`),
    ...rubrique('Pourquoi', 'Cette feuille ne contient que des variables : les couleurs, les tailles, les espacements du système. Tant que rien ne les appelle, rien ne bouge.'),
    ...rubrique('Tu vérifies', 'Les pages sont identiques à avant. Dans l’inspecteur, les variables apparaissent sur la racine.'),
    ...rubrique('Pour annuler', 'Tu retires la ligne.'),
    ...bloc('html', lien(r.tokens)),
    '',
    '### 2. Poser les décisions',
    '',
    ...rubrique('Ce que tu fais', `Tu déposes ${r.ajouts.length > 1 ? `les ${r.ajouts.length} feuilles ajoutées` : 'la feuille ajoutée'}, et tu charges chacune juste après sa feuille d’origine, dans toute page qui charge celle-ci. Les lignes exactes, page par page, sont ci-dessous.`),
    ...rubrique('Pourquoi', 'Chaque feuille ajoutée reprend les mêmes sélecteurs que l’ancienne et y remet la bonne valeur, par une variable. Chargée après, elle gagne. L’ancien code n’est pas touché, donc rien ne peut casser ailleurs.'),
    ...rubrique('Tu vérifies', `Les pages ressemblent à l’« Après » validé.${controle}`),
    ...rubrique('Pour annuler', 'Tu retires les lignes, une feuille à la fois si besoin.'),
    ...r.pages.flatMap(page),
    ...(r.nonEcrites.length
      ? [
          `Pas dans les feuilles ajoutées, ${nombre(r.nonEcrites.length, 'valeur à changer', 'valeurs à changer')} directement dans le code, en reprenant l’ancien code :`,
          '',
          ...r.nonEcrites.map((x) => `- \`${x.selecteur}\` (\`${x.feuille}\`, ligne ${x.ligne}) : \`${x.propriete}\``),
          '',
        ]
      : []),
    '### 3. Reprendre l’ancien code',
    '',
    ...rubrique('Ce que tu fais', `Dans chaque ancienne feuille, tu remplaces la valeur écrite en dur par la variable. La liste est à la fin de ce guide : ${nombre(r.valeurs, 'valeur', 'valeurs')}, ${nombre(r.fichiers.length, 'fichier', 'fichiers')}, avec la ligne, la valeur et la variable.`),
    ...rubrique('Pourquoi', 'Tant que l’ancienne valeur reste dans le code, quelqu’un peut la recopier. Une fois remplacée, la feuille ajoutée ne sert plus pour ces lignes.'),
    ...rubrique('Comment', 'Un fichier, un commit. Quand un fichier est fini, tu supprimes sa feuille ajoutée, avec la ligne qui la charge. Un agent de code peut dérouler la liste : elle est faite pour.'),
    ...rubrique('Tu vérifies', 'Rien ne change à l’écran.'),
    ...rubrique('Pour annuler', 'Tu reviens sur le commit du fichier.'),
    ...exemple,
    '',
    '### 4. Remplacer les composants',
    '',
    ...rubrique('Ce que tu fais', `Tu écris chaque composant une seule fois, d’après sa fiche, puis tu remplaces ses versions en double.${premier ? ` Commence par ${nomDit(premier.nom)} : ${nombre(premier.versions, 'version', 'versions')} pour ${nombre(premier.fois, 'emploi', 'emplois')}.` : ''}`),
    ...rubrique('Pourquoi', `Les trois premières étapes alignent les valeurs. ${premier && premier.versions > 1 ? `Il reste ${premier.versions} façons d’écrire ${nomDit(premier.nom)} : c’est là que le désordre revient.` : 'Les composants écrits plusieurs fois sont l’endroit où le désordre revient.'}`),
    ...rubrique('La règle', `Un composant expose une intention, jamais une couleur : pour le bouton, ${liste(INTENTIONS.map((x) => `\`${x}\``))}. Il lit les variables du système, et rien d’autre.`),
    ...rubrique('La structure', `Un dossier par composant, avec sa fiche et son code dans ta technologie. Les fiches sont dans \`composants/\`, avec un exemple de structure.`),
    ...rubrique('Tu vérifies', premier ? `${premier.fois > 1 ? `Les ${premier.fois} emplois` : 'L’emploi'} de ${nomDit(premier.nom)} ${premier.fois > 1 ? 'passent' : 'passe'} par le même composant.`.replace(/de le /, 'du ') : 'Chaque emploi passe par son composant.'),
    ...(sansFiche.length
      ? rubrique('Pas encore', `${majuscule(liste(sansFiche.map((t) => nomDit(t.nom))))} ${sansFiche.length > 1 ? 'n’ont pas de fiche : leurs versions restent' : 'n’a pas de fiche : ses versions restent'}, avec les bonnes valeurs.`)
      : []),
    ...bloc('text', structure(types.map((t) => FICHE_DU_TYPE[t.nom]))),
    '',
    '## En cas de doute',
    '',
    ...rubrique('Une valeur t’étonne', 'La liste ci-dessous donne, pour chaque valeur, l’ancienne et la variable qui la remplace. Si une décision te paraît fausse, dis-le au designer : il peut y revenir, et les feuilles se régénèrent.'),
    '## La liste, fichier par fichier',
    '',
    ...r.fichiers.flatMap(fichier),
    '',
  ].join('\n');
}

/**
 * L'exemple de structure : un dossier par composant, sa fiche et son code ; le premier dit ce qu'il porte.
 * @param {string[]} fiches  les fiches copiées, `button.md` d'abord
 */
function structure(fiches) {
  const noms = (fiches.length ? fiches : ['button.md']).map((f) => f.replace(/\.md$/, ''));
  const vue = (/** @type {string} */ n) => `${n.split('-').map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join('')}.vue`;
  return [
    'ds/',
    '  tokens.css',
    '  composants/',
    `    ${noms[0]}/`,
    '      fiche.md      les intentions, les tailles, les états',
    `      ${noms[0]}.css    ou ${vue(noms[0])}, selon ta technologie`,
    ...noms.slice(1).flatMap((n) => [`    ${n}/`, '      fiche.md']),
  ].join('\n');
}

/** Une fiche de ds-lab telle que le développeur la lit : sans son en-tête ni les marques de ce que l'outil génère. @param {string} texte */
const ficheLue = (texte) => texte.replace(/^---\n[\s\S]*?\n---\n+/, '').replace(/^<!-- .*? -->\n/gm, '');

/**
 * Le mot d'accompagnement (D99) : pour un humain, il dit l'idée et demande un avis. Il ne promet que ce que le dossier
 * porte ; aucune durée.
 * @param {Remise} r
 */
export function message(r) {
  return [
    'Bonjour,',
    `On a préparé le design system ${deNom(r.produit)} à partir de nos pages actuelles. Je te transmets un dossier, « remise », avec un guide de migration.`,
    'L’idée : poser le nouveau à côté de l’ancien, sans rien casser, et avancer par étapes que tu peux livrer une à une. Le guide explique pourquoi on procède ainsi et comment faire, avec les lignes exactes à ajouter.',
    'Les deux premières étapes tiennent en quelques lignes et suffisent pour que le site prenne le nouveau rendu. Les deux suivantes nettoient l’ancien code et peuvent s’étaler.',
    'Dis-moi ce que tu en penses après lecture, et si l’ordre te convient. On regarde ensemble le résultat après chaque étape.',
  ].join('\n\n');
}

/**
 * Le dossier à remettre (D99), une ligne par entrée : son nom et ce qu'elle contient.
 * @param {Remise} r
 * @returns {[string, string][]}
 */
export const entrees = (r) => [
  ['feuilles/', `tokens.css et ${r.ajouts.length > 1 ? `les ${r.ajouts.length} feuilles ajoutées` : 'la feuille ajoutée'}`],
  [GUIDE, 'le guide de migration : la stratégie, puis chaque étape expliquée'],
  ['composants/', 'une fiche par composant, et un exemple de structure'],
  ['message.txt', 'le mot d’accompagnement ci-dessous'],
];

/**
 * Écrit le dossier de la remise, à côté du projet, pour une vérification validée. Un dossier `remise/` qui n'a pas
 * été écrit par l'outil n'est jamais touché.
 * @param {Remise} r @param {{ dossierAjout: string, verification: string, controle: Controle }} o
 */
export function ecrireRemise(r, { dossierAjout, verification, controle }) {
  if (existsSync(r.dossier) && !existsSync(join(r.dossier, MARQUE))) throw new Error(`${r.dossier} existe et n’a pas été écrit par l’outil : rien n’est écrit ; le renommer`);
  for (const d of ['feuilles', 'composants', 'a-installer.md']) rmSync(join(r.dossier, d), { recursive: true, force: true });
  for (const f of [r.tokens, ...r.ajouts.map((a) => a.ajout)]) {
    const cible = join(r.dossier, 'feuilles', f);
    mkdirSync(join(cible, '..'), { recursive: true });
    cpSync(join(dossierAjout, f), cible);
  }
  // Les fiches des types relevés, et l'exemple de structure (D100).
  const fiches = avecFiche(controle).map((t) => FICHE_DU_TYPE[t.nom]);
  mkdirSync(join(r.dossier, 'composants'), { recursive: true });
  for (const f of fiches) writeFileSync(join(r.dossier, 'composants', f), ficheLue(readFileSync(join(FICHES, f), 'utf8')));
  writeFileSync(join(r.dossier, 'composants', 'structure.md'), `# Un dossier par composant\n\n\`\`\`text\n${structure(fiches)}\n\`\`\`\n`);
  writeFileSync(join(r.dossier, GUIDE), guide(r, controle));
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
