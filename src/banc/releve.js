// @ts-check
/**
 * D68 : ce qu'un passage a posé, lu dans les fichiers neufs ou modifiés depuis « départ », sans rien lancer. Composants
 * Ds… posés, pièces de Vuetify posées alors qu'un composant Ds… les enveloppe (la table vient de l'en-tête des fiches),
 * boutons et champs nus, composants créés, composants ou gabarit modifiés, exceptions de style, feuilles .css ; la page
 * passe-t-elle par le gabarit ; et les lignes qui ressemblent à une pièce que le brief remet à plus tard : des signaux à
 * lire, pas un verdict. Un compte est ce que le fichier a de plus qu'au départ.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';

/** @typedef {{ statut: string, fichier: string }} Touche un fichier touché : A, M ou D, et son chemin dans l'app */

/** Dossiers et fiches que l'équipe ne change pas pour composer une page. */
const COMPOSANTS = /^(src\/components\/ds|docs\/composants)\//;
const GABARIT = /^(src\/gabarit\/|docs\/gabarit\.md$)/;

/** Le texte sans ses commentaires, à lignes égales. @param {string} t */
const sansCommentaires = (t) =>
  t
    .replace(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .replace(/(^|\s)\/\/.*$/gm, '$1');

/** Nom en PascalCase d'une balise (ds-card, DsCard). @param {string} b */
const pascal = (b) => (b.includes('-') ? b.split('-').map((m) => m[0].toUpperCase() + m.slice(1)).join('') : b);

/** Les balises d'un fichier, avec leurs attributs, et les rendus par h(Nom, …). @param {string} texte */
function poses(texte) {
  const t = sansCommentaires(texte);
  return [
    ...[...t.matchAll(/<([A-Za-z][\w-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g)].map((m) => ({ nom: pascal(m[1]), attributs: m[2] })),
    ...[...t.matchAll(/\bh\(\s*([A-Z]\w*)\s*[,)]/g), ...t.matchAll(/:is="([A-Z]\w*)"/g)].map((m) => ({ nom: m[1], attributs: '' })),
  ];
}

/** Table pièce de Vuetify → composant qui l'enveloppe, lue dans l'en-tête des fiches. @param {string} fiches dossier des fiches */
export function enveloppes(fiches) {
  return Object.fromEntries(
    readdirSync(fiches)
      .filter((f) => f.endsWith('.md'))
      .flatMap((f) => {
        const t = readFileSync(join(fiches, f), 'utf8');
        const piece = t.match(/^wraps: (V[A-Z]\w*)$/m)?.[1];
        const nom = t.match(/^name: (\w+)$/m)?.[1];
        return piece && nom ? [[piece, nom]] : [];
      }),
  );
}

/** Le fichier de la page d'une adresse, d'après les routes ; null si on ne le trouve pas. @param {string} app @param {string} adresse */
function pageDe(app, adresse) {
  const routeur = join(app, 'src', 'router.js');
  if (!existsSync(routeur)) return null;
  const t = sansCommentaires(readFileSync(routeur, 'utf8'));
  const route = t.match(new RegExp(`path: ['"]${adresse}['"][\\s\\S]*?component: (?:\\(\\) => import\\(['"]([^'"]+)['"]\\)|(\\w+))`));
  const cible = route?.[1] ?? (route?.[2] ? t.match(new RegExp(`import ${route[2]} from ['"]([^'"]+)['"]`))?.[1] : undefined);
  const fichier = cible?.startsWith('.') ? posix.join('src', cible) : null;
  return fichier && existsSync(join(app, fichier)) ? fichier : null;
}

/** @param {Record<string, number>} o @param {string} k @param {number} n */
const ajouter = (o, k, n) => {
  if (n) o[k] = (o[k] ?? 0) + n;
};

/**
 * Le relevé d'un passage.
 * @param {{ app: string, touches: Touche[], avant: (fichier: string) => string, enveloppes: Record<string, string>, page: string,
 *   signaux: { plusTard: Record<string, string>, refait: string } }} o
 *   avant : le texte d'un fichier au départ, vide s'il n'y était pas ; page : l'adresse de la page demandée ; signaux : les
 *   motifs de fixtures/banc/exercices.json
 */
export function relever(o) {
  /** @type {Record<string, number>} */
  const composants = {};
  /** @type {Record<string, number>} */
  const vuetify = {};
  /** @type {Record<string, number>} */
  const nus = {};
  let boutonsLiens = 0;
  let exceptions = 0;
  /** @type {{ piece: string, fichier: string, ligne: number, texte: string }[]} */
  const plusTard = [];
  /** @type {{ fichier: string, ligne: number, texte: string }[]} */
  const refait = [];
  /** @param {string} nom */
  const enveloppe = (nom) => Object.entries(o.enveloppes).find(([v]) => nom === v || (nom.startsWith(v) && /[A-Z]/.test(nom[v.length])))?.[1];
  const motifs = Object.entries(o.signaux.plusTard).map(([piece, m]) => /** @type {const} */ ([piece, new RegExp(m)]));
  const motifRefait = new RegExp(o.signaux.refait);
  for (const { statut, fichier } of o.touches.filter((t) => t.statut !== 'D')) {
    const texte = /\.(vue|js|css)$/.test(fichier) ? readFileSync(join(o.app, fichier), 'utf8') : '';
    const avant = statut === 'A' ? '' : o.avant(fichier);
    exceptions += (texte.match(/stylelint-disable/g) ?? []).length - (avant.match(/stylelint-disable/g) ?? []).length;
    if (!/^src\/.*\.(vue|js)$/.test(fichier) || COMPOSANTS.test(fichier)) continue;
    for (const [t, signe] of /** @type {[string, 1 | -1][]} */ ([[texte, 1], [avant, -1]]))
      for (const p of poses(t)) {
        if (/^Ds[A-Z]/.test(p.nom)) ajouter(composants, p.nom, signe);
        const ds = enveloppe(p.nom);
        if (ds === 'DsButton' && /\s:?(to|href)=/.test(p.attributs)) boutonsLiens += signe;
        else if (ds) ajouter(vuetify, `${p.nom} (${ds})`, signe);
        if (p.nom === 'button' || p.nom === 'input') ajouter(nus, `<${p.nom}>`, signe);
      }
    const deja = new Set(sansCommentaires(avant).split('\n').map((l) => l.trim()));
    sansCommentaires(texte)
      .split('\n')
      .forEach((l, i) => {
        if (!l.trim() || deja.has(l.trim())) return;
        const lieu = { fichier, ligne: i + 1, texte: l.trim().slice(0, 160) };
        for (const [piece, motif] of motifs) if (motif.test(l)) plusTard.push({ piece, ...lieu });
        if (!GABARIT.test(fichier) && motifRefait.test(l)) refait.push(lieu);
      });
  }
  const fichierDeLaPage = pageDe(o.app, o.page);
  const texteDeLaPage = fichierDeLaPage ? sansCommentaires(readFileSync(join(o.app, fichierDeLaPage), 'utf8')) : '';
  return {
    composants,
    vuetifyAvecComposant: vuetify,
    boutonsQuiMenentAilleurs: boutonsLiens,
    balisesNues: nus,
    composantsCrees: o.touches.filter((t) => t.statut === 'A' && t.fichier.endsWith('.vue') && !t.fichier.startsWith('src/pages/')).map((t) => t.fichier),
    composantsModifies: o.touches.filter((t) => t.statut !== 'A' && COMPOSANTS.test(t.fichier)).map((t) => t.fichier),
    gabaritModifie: o.touches.filter((t) => GABARIT.test(t.fichier)).map((t) => t.fichier),
    page: {
      adresse: o.page,
      fichier: fichierDeLaPage,
      passeParLeGabarit: fichierDeLaPage ? /from ['"][^'"]*gabarit\/GabaritPage\.vue['"]/.test(texteDeLaPage) && poses(texteDeLaPage).some((p) => p.nom === 'GabaritPage') : null,
      gabaritRefait: refait,
    },
    exceptionsDeStyle: exceptions,
    feuillesCss: o.touches.filter((t) => t.fichier.endsWith('.css')).map((t) => t.fichier),
    plusTard,
  };
}

/** Le relevé, en Markdown. @param {ReturnType<typeof relever>} r */
export function texteDuReleve(r) {
  /** @param {Record<string, number>} o */
  const comptes = (o) => {
    const l = Object.entries(o).sort(([a], [b]) => a.localeCompare(b));
    return l.length ? l.map(([k, n]) => `${k} : ${n}`).join(' ; ') : 'aucun';
  };
  /** @param {string[]} l */
  const liste = (l) => (l.length ? l.join(', ') : 'aucun');
  /** @param {{ fichier: string, ligne: number, texte: string }} x */
  const lieu = (x) => `\`${x.fichier}:${x.ligne}\` ${x.texte}`;
  const passe = r.page.passeParLeGabarit;
  return [
    '# Ce que le passage a posé',
    '',
    'Fichiers neufs ou modifiés depuis « départ » ; un compte est ce qu’ils ont de plus qu’au départ.',
    '',
    `- Composants Ds… posés : ${comptes(r.composants)}`,
    `- Pièces de Vuetify posées alors qu’un composant Ds… existe : ${comptes(r.vuetifyAvecComposant)}`,
    `- Boutons de Vuetify qui mènent ailleurs (aucun composant Ds… ne le fait) : ${r.boutonsQuiMenentAilleurs}`,
    `- Balises nues : ${comptes(r.balisesNues)}`,
    `- Composants créés : ${liste(r.composantsCrees)}`,
    `- Composants du design system ou fiches modifiés : ${liste(r.composantsModifies)}`,
    `- Gabarit modifié : ${liste(r.gabaritModifie)}`,
    `- Page ${r.page.adresse} : ${r.page.fichier ?? 'introuvable dans src/router.js'} ; passe par le gabarit : ${passe === null ? 'à lire' : passe ? 'oui' : 'non'}`,
    `- Exceptions de style écrites : ${r.exceptionsDeStyle}`,
    `- Feuilles .css touchées, que verifier ne lit pas : ${liste(r.feuillesCss)}`,
    '',
    '## Le gabarit refait, à lire',
    '',
    ...(r.page.gabaritRefait.length ? r.page.gabaritRefait.map((x) => `- ${lieu(x)}`) : ['Rien.']),
    '',
    '## « Viendront après », à lire',
    '',
    ...(r.plusTard.length ? r.plusTard.map((x) => `- ${x.piece} : ${lieu(x)}`) : ['Rien.']),
    '',
  ].join('\n');
}
