// @ts-check
/**
 * D66 : ce que verifier juge et écrit, pour un dossier de marques hors de ds-lab. Les échecs se regroupent par cause :
 * un bloc par cause, qui nomme le contrôle, la marque ou le fichier, ce qui est cassé, le compte et la règle de
 * docs/regles.md, puis un seul « À faire : … » (règle d'écriture 6) ; pour le style, la fin du message de
 * stylelint.config.mjs, qui le dit déjà (CP3).
 * Les calculs sont ceux des trois contrôles de la cible (loadRoles, contrat, espacements, typo), sans les relancer
 * en sous-processus. Une règle de typo qui n'a pas ici son numéro et son « À faire » est une panne : un échec ne
 * s'écrit jamais sans dire quoi faire. Avec --skill, la copie du skill est comparée à skill/ds-lab/ du clone.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SKILL } from './skill.js';
import { fr } from '../lib/format.js';
import { loadRoles, contrat, resolveRoles } from '../tokens/roles.js';
import { echellesPropres, echellesCommunesRedefinies, motifRedefinies } from '../tokens/saisie.js';
import { espacements } from '../tokens/espacements.js';
import { typo } from '../tokens/typo.js';
import { largeurs, enEtroit, nomDeMarque } from '../tokens/resolver.js';

const D2 = { decimales: 2, zeros: true };

/** Les quatre contextes du resolver, et leur nom dans une ligne. */
const CONTEXTES = /** @type {const} */ ([
  { mode: 'light', largeur: 'wide', nom: 'clair, large' },
  { mode: 'dark', largeur: 'wide', nom: 'sombre, large' },
  { mode: 'light', largeur: 'narrow', nom: 'clair, étroit' },
  { mode: 'dark', largeur: 'narrow', nom: 'sombre, étroit' },
]);

/** Contrôles, dans l'ordre du bilan. */
const FAMILLES = /** @type {const} */ (['contraste', 'espacements', 'typo', 'style', 'skill']);

const COMMUN = "les styles et les écarts viennent des couches communes de ds-lab : retirer du dossier de la marque ce qui les redéfinit, puis relancer la saisie";
const POLICE = "corriger fonts dans l'entrée de la marque, puis relancer la saisie ; ne pas redéfinir les styles de texte dans le dossier de la marque";

/** Numéro de docs/regles.md et « À faire » de chaque règle de npm run typo, par son identifiant. */
export const TYPO_A_FAIRE = /** @type {Record<string, { regle: string, aFaire: string }>} */ ({
  'multiple-4': { regle: 'DS7', aFaire: COMMUN },
  decroissants: { regle: 'DS8', aFaire: COMMUN },
  'etroit-large': { regle: 'DS6', aFaire: COMMUN },
  'corps-1-5': { regle: 'DS18', aFaire: COMMUN },
  'petits-1-3': { regle: 'DF5', aFaire: COMMUN },
  'corps-1rem': { regle: 'DF6', aFaire: COMMUN },
  'min-12': { regle: 'DF7', aFaire: COMMUN },
  police: { regle: 'DF4', aFaire: POLICE },
  'hauteur-capitale': { regle: 'DS11', aFaire: POLICE },
});

/**
 * Un échec, avant regroupement. Une paire de contraste garde de quoi trouver sa cause (les jetons primitifs de ses deux
 * rôles) ; tout autre échec porte sa clé de regroupement, son constat, sa règle et son « À faire ».
 * @typedef {{ devant: string, fond: string, ratio: number, min: number, regle: string, contexte: string,
 *   cibles: { role: string, jeton: string, hex: string, cote: 'devant' | 'fond' }[] }} Paire
 * @typedef {{ famille: typeof FAMILLES[number], cle: string, tete: string, constat: string, regle?: string, aFaire: string, paire?: Paire }} Echec
 * @typedef {{ famille: typeof FAMILLES[number], echecs: number, lignes: [string, string] }} Bloc
 */

/** « À faire » d'une paire sous son seuil. @param {string} entree */
const aFaireContraste = (entree) =>
  `relancer la saisie sur ${entree} ; si elle refuse la marque, changer la couleur qu'elle nomme. Ne pas corriger les jetons à la main`;

/**
 * Les échecs d'une marque : contraste dans les quatre contextes, échelle commune redéfinie (D25), espacements, typo.
 * @param {string} dossier dossier de la marque @param {string} [cwd] dossier depuis lequel s'écrivent les chemins
 * @returns {Echec[]}
 */
export function echecsDeMarque(dossier, cwd = process.cwd()) {
  const rel = relative(cwd, dossier).replace(/\/$/, '') || '.';
  const marque = `${nomDeMarque(dossier)} (${rel}/)`;
  const entree = existsSync(join(dossier, 'entree.json')) ? `${rel}/entree.json` : "l'entrée de la marque";
  /** @type {Echec[]} */
  const E = [];
  const redefinies = echellesCommunesRedefinies(echellesPropres(dossier));
  if (redefinies.length) {
    E.push({ famille: 'contraste', cle: `${marque}|D25`, tete: marque, constat: motifRedefinies(redefinies), regle: 'D25', aFaire: `renommer l'échelle dans le dossier de la marque, puis relancer la saisie sur ${entree}` });
  } else {
    for (const c of CONTEXTES) {
      const set = loadRoles(dossier, { mode: c.mode, largeur: c.largeur });
      const roles = resolveRoles(set.semantique, set.primitives, set.marque ?? {}, ...(set.echelles ?? []));
      /** @param {string} role @param {'devant' | 'fond'} cote */
      const cible = (role, cote) => {
        const r = /** @type {{ cible: string, hex: string }} */ (roles.get(role));
        return { role, jeton: r.cible, hex: r.hex, cote };
      };
      for (const p of contrat(set).roles.fails)
        E.push({
          famille: 'contraste',
          cle: marque,
          tete: marque,
          constat: '',
          aFaire: aFaireContraste(entree),
          paire: { devant: p.devant, fond: p.fond, ratio: p.ratio, min: p.min, regle: p.type === 'focus' ? 'DS2' : 'DS12', contexte: c.nom, cibles: [cible(p.devant, 'devant'), cible(p.fond, 'fond')] },
        });
    }
  }
  const l = largeurs(dossier);
  const etroit = { ...l.etroit, semantique: enEtroit(l.large.semantique, l.contexte) };
  const e = espacements(l.large.semantique, l.large.primitives, etroit);
  /** @param {string} regle @param {string} constat @param {string} aFaire @returns {Echec} */
  const autre = (regle, constat, aFaire) => ({ famille: 'espacements', cle: `${marque}|${regle}`, tete: marque, constat, regle, aFaire });
  for (const v of e.fails) E.push(autre('DS5', `${v.de} < ${v.vers}, ${v.a} → ${v.b} px`, COMMUN));
  for (const t of e.etroitsFails) E.push(autre('DS6', `${t.role}, ${t.px} px en étroit pour ${t.large} px en large`, COMMUN));
  for (const g of e.reglesFails) E.push(autre('DS4', `${g.vers} ≥ ${g.min} × ${g.de}, ${g.b} px pour ${g.a} px`, COMMUN));
  const t = typo(l.large.semantique, l.large.primitives, l.large.marque, etroit);
  for (const g of t.fails) {
    const x = TYPO_A_FAIRE[g.id];
    if (!x) throw new Error(`verifier : règle de typo ${g.id} sans numéro ni « À faire » (src/report/verifier.js)`);
    E.push({ ...autre(x.regle, `${g.titre} ; ${g.details.join(' ; ')}`, x.aFaire), famille: 'typo' });
  }
  return E;
}

/** « À faire » d'un avertissement de Stylelint sans la forme « constat : à faire » (exception sans raison, inutile). */
const A_FAIRE_EXCEPTION = "écrire la raison de l'exception après « -- », ou retirer le commentaire qui ne sert plus (CP3)";

/**
 * Les échecs de la garde du style, depuis le résultat de stylelint.lint : un par avertissement. Son message se coupe au
 * premier « : » : le constat, puis ce qu'il faut faire (CP3) ; la clé est le fichier et la règle de Stylelint.
 * @param {{ source?: string, warnings: { line: number, text: string, rule: string }[] }[]} resultats @param {string} [cwd]
 * @returns {Echec[]}
 */
export function echecsDeStyle(resultats, cwd = process.cwd()) {
  return resultats.flatMap((r) => {
    const fichier = relative(cwd, r.source ?? '');
    return r.warnings.map((w) => {
      const texte = w.text.replace(` (${w.rule})`, '');
      const i = texte.indexOf(' : ');
      const [constat, aFaire] = i < 0 ? [texte, A_FAIRE_EXCEPTION] : [texte.slice(0, i), texte.slice(i + 3).replace(/\.$/, '')];
      return { famille: /** @type {const} */ ('style'), cle: `${fichier}|${w.rule}`, tete: fichier, constat: `ligne ${w.line} : ${constat}`, regle: w.rule, aFaire };
    });
  });
}

/**
 * D66 : la copie du skill dans le dépôt de l'équipe, comparée à skill/ds-lab/ du clone qui juge. Un fichier absent ou
 * différent est un échec : l'agent lirait des règles que la CI ne juge plus. Tous ont une même cause, la copie.
 * @param {string} copie dossier de la copie @param {string} [cwd]
 * @returns {Echec[]}
 */
export function echecsDeSkill(copie, cwd = process.cwd()) {
  if (!existsSync(copie) || !statSync(copie).isDirectory()) throw new Error(`--skill ${copie} : dossier introuvable ; nommer le dossier où le skill est copié, par exemple .claude/skills/ds-lab`);
  const rel = `${relative(cwd, copie).replace(/\/$/, '') || '.'}/`;
  /** @param {string} constat @returns {Echec} */
  const echec = (constat) => ({ famille: 'skill', cle: rel, tete: rel, constat, aFaire: `recopier skill/ds-lab/ du clone dans ${rel}` });
  return /** @type {string[]} */ (readdirSync(SKILL, { recursive: true }))
    .filter((f) => statSync(join(SKILL, f)).isFile())
    .sort()
    .flatMap((f) => {
      const ici = join(copie, f);
      if (!existsSync(ici)) return [echec(`${f} absent de la copie`)];
      if (readFileSync(ici, 'utf8') !== readFileSync(join(SKILL, f), 'utf8')) return [echec(`${f} diffère de skill/ds-lab/ du clone`)];
      return [];
    });
}

/** Règles et leur compte, la plus fréquente d'abord. @param {string[]} regles */
const parRegle = (regles) =>
  [...Map.groupBy(regles, (r) => r)]
    .map(([r, l]) => [r, l.length])
    .sort((a, b) => /** @type {number} */ (b[1]) - /** @type {number} */ (a[1]) || String(a[0]).localeCompare(String(b[0])))
    .map(([r, n]) => `${r} : ${n}`)
    .join(', ');

/**
 * Les paires de contraste d'une marque, rangées par cause : le jeton primitif par lequel passe le plus de paires est
 * pris en premier, avec toutes ses paires, puis on recommence sur le reste ; à égalité, l'ordre alphabétique.
 * @param {Echec[]} echecs les paires d'une seule marque @returns {Echec[][]}
 */
function causes(echecs) {
  /** @type {Echec[][]} */
  const out = [];
  let reste = echecs;
  while (reste.length) {
    /** @type {Map<string, number>} */
    const n = new Map();
    for (const e of reste) for (const j of new Set(e.paire?.cibles.map((c) => c.jeton))) n.set(j, (n.get(j) ?? 0) + 1);
    const [jeton] = [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    out.push(reste.filter((e) => e.paire?.cibles.some((c) => c.jeton === jeton)).map((e) => ({ ...e, cle: jeton })));
    reste = reste.filter((e) => !e.paire?.cibles.some((c) => c.jeton === jeton));
  }
  return out;
}

/** @param {number} n @param {string} un @param {string} plusieurs */
const compte = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;

/**
 * Le bloc d'une cause de contraste : le jeton, les rôles qui le lisent (en devant, puis en fond, dans l'ordre des
 * paires), les paires distinctes, les contextes, le nombre d'échecs, la plus basse, les règles avec leur compte.
 * @param {Echec[]} groupe @returns {[string, string]}
 */
function constatContraste(groupe) {
  const jeton = groupe[0].cle;
  const paires = groupe.map((e) => /** @type {Paire} */ (e.paire));
  const lus = paires.flatMap((p) => p.cibles.filter((c) => c.jeton === jeton));
  const roles = [...new Set([...lus.filter((c) => c.cote === 'devant'), ...lus.filter((c) => c.cote === 'fond')].map((c) => c.role))];
  const hex = [...new Set(lus.map((c) => c.hex))].join(', ');
  const distinctes = [...new Map(paires.map((p) => [`${p.devant}|${p.fond}`, p]))].map(([, p]) => p);
  const contextes = CONTEXTES.map((c) => c.nom).filter((n) => paires.some((p) => p.contexte === n));
  const basse = paires.reduce((a, b) => (b.ratio < a.ratio ? b : a));
  const lesPaires =
    distinctes.length === 1
      ? `1 paire sous son seuil, ${distinctes[0].devant} sur ${distinctes[0].fond} (${fr(distinctes[0].min, D2)}:1),`
      : `${distinctes.length} paires sous leur seuil`;
  return [
    `✗ contraste · ${groupe[0].tete} : ${jeton} (${hex}), lu par ${roles.join(', ')} ; ${lesPaires} dans ${compte(contextes.length, 'contexte', 'contextes')} sur 4 (${contextes.join(' ; ')}), soit ${compte(paires.length, 'échec', 'échecs')}, la plus basse à ${fr(basse.ratio, D2)}:1 (${parRegle(paires.map((p) => p.regle))}).`,
    `  À faire : ${groupe[0].aFaire}.`,
  ];
}

/**
 * Les échecs regroupés par cause, dans l'ordre de leur première apparition : un bloc de deux lignes, le constat puis un
 * seul « À faire » (règle d'écriture 6). Contraste : par marque et par jeton primitif (causes) ; espacements et typo :
 * par marque et par règle ; style : par fichier et par règle de Stylelint ; skill : la copie.
 * @param {Echec[]} echecs @returns {Bloc[]}
 */
export function blocs(echecs) {
  /** @type {Echec[][]} */
  const groupes = [];
  for (const [, g] of Map.groupBy(echecs, (e) => `${e.famille}|${e.cle}`)) {
    if (g[0].paire) groupes.push(...causes(g));
    else groupes.push(g);
  }
  return groupes.map((g) => ({
    famille: g[0].famille,
    echecs: g.length,
    lignes: g[0].paire
      ? constatContraste(g)
      : [`✗ ${g[0].famille} · ${g[0].tete} : ${g.map((e) => e.constat).join(' ; ')}${g[0].regle ? ` (${g[0].regle})` : ''}.`, `  À faire : ${[...new Set(g.map((e) => e.aFaire))].join(' ; ')}.`],
  }));
}

/**
 * En-tête : les marques et les fichiers de style jugés.
 * @param {string} dossierMarques tel que donné @param {string[]} noms @param {number} fichiers
 */
export const entete = (dossierMarques, noms, fichiers) =>
  `verifier : ${compte(noms.length, 'marque', 'marques')} dans ${dossierMarques.replace(/\/?$/, '/')} (${noms.join(', ')}) ; ${compte(fichiers, 'fichier', 'fichiers')} de style`;

/**
 * Bilan, dernière ligne : le compte des échecs, des blocs et de chaque contrôle ; le skill n'y paraît que s'il a été
 * jugé (--skill).
 * @param {Echec[]} echecs @param {{ skill?: boolean }} [opts]
 */
export function bilan(echecs, { skill = false } = {}) {
  if (!echecs.length) return `verifier : 0 échec (contraste en clair et en sombre, en large et en étroit ; espacements ; typo ; style${skill ? ' ; skill' : ''})`;
  const par = FAMILLES.filter((f) => skill || f !== 'skill').map((f) => `${f} ${echecs.filter((x) => x.famille === f).length}`).join(', ');
  return `verifier : ${compte(echecs.length, 'échec', 'échecs')} en ${compte(blocs(echecs).length, 'bloc', 'blocs')} (${par})`;
}
