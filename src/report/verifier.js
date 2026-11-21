// @ts-check
/**
 * D66 : ce que verifier juge et écrit, pour un dossier de marques hors de ds-lab. Une ligne par échec, qui nomme le
 * contrôle, la marque ou le fichier, le contexte, le constat et la règle de docs/regles.md, et qui finit par
 * « À faire : … » (règle d'écriture 6) ; pour le style, le message de stylelint.config.mjs, qui le dit déjà (CP3).
 * Les calculs sont ceux des trois contrôles de la cible (loadRoles, contrat, espacements, typo), sans les relancer
 * en sous-processus. Une règle de typo qui n'a pas ici son numéro et son « À faire » est une panne : un échec ne
 * s'écrit jamais sans dire quoi faire. Avec --skill, la copie du skill est comparée à skill/ds-lab/ du clone.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SKILL } from './skill.js';
import { fr } from '../lib/format.js';
import { loadRoles, contrat } from '../tokens/roles.js';
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

/** @typedef {{ famille: typeof FAMILLES[number], texte: string }} Echec */

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
    E.push({ famille: 'contraste', texte: `✗ contraste · ${marque} : ${motifRedefinies(redefinies)} (D25). À faire : renommer l'échelle dans le dossier de la marque, puis relancer la saisie sur ${entree}.` });
  } else {
    for (const c of CONTEXTES) {
      const r = contrat(loadRoles(dossier, { mode: c.mode, largeur: c.largeur }));
      for (const p of r.roles.fails)
        E.push({
          famille: 'contraste',
          texte: `✗ contraste · ${marque} · ${c.nom} : ${p.devant} sur ${p.fond}, ${fr(p.ratio, D2)}:1 < ${fr(p.min, D2)}:1 (${p.type === 'focus' ? 'DS2' : 'DS12'}). À faire : relancer la saisie sur ${entree} ; si elle refuse la marque, changer la couleur qu'elle nomme. Ne pas corriger les jetons à la main.`,
        });
    }
  }
  const l = largeurs(dossier);
  const etroit = { ...l.etroit, semantique: enEtroit(l.large.semantique, l.contexte) };
  const e = espacements(l.large.semantique, l.large.primitives, etroit);
  for (const v of e.fails) E.push({ famille: 'espacements', texte: `✗ espacements · ${marque} : ${v.de} < ${v.vers}, ${v.a} → ${v.b} px (DS5). À faire : ${COMMUN}.` });
  for (const t of e.etroitsFails)
    E.push({ famille: 'espacements', texte: `✗ espacements · ${marque} · étroit : ${t.role}, ${t.px} px en étroit pour ${t.large} px en large (DS6). À faire : ${COMMUN}.` });
  for (const g of e.reglesFails)
    E.push({ famille: 'espacements', texte: `✗ espacements · ${marque} : ${g.vers} ≥ ${g.min} × ${g.de}, ${g.b} px pour ${g.a} px (DS4). À faire : ${COMMUN}.` });
  const t = typo(l.large.semantique, l.large.primitives, l.large.marque, etroit);
  for (const g of t.fails) {
    const x = TYPO_A_FAIRE[g.id];
    if (!x) throw new Error(`verifier : règle de typo ${g.id} sans numéro ni « À faire » (src/report/verifier.js)`);
    E.push({ famille: 'typo', texte: `✗ typo · ${marque} : ${g.titre} ; ${g.details.join(' ; ')} (${x.regle}). À faire : ${x.aFaire}.` });
  }
  return E;
}

/**
 * Les échecs de la garde du style, depuis le résultat de stylelint.lint : une ligne par avertissement, son message tel
 * quel (il dit quoi faire, CP3).
 * @param {{ source?: string, warnings: { line: number, text: string }[] }[]} resultats @param {string} [cwd]
 * @returns {Echec[]}
 */
export function echecsDeStyle(resultats, cwd = process.cwd()) {
  return resultats.flatMap((r) =>
    r.warnings.map((w) => ({ famille: /** @type {const} */ ('style'), texte: `✗ style · ${relative(cwd, r.source ?? '')}:${w.line} : ${w.text}` })),
  );
}

/**
 * D66 : la copie du skill dans le dépôt de l'équipe, comparée à skill/ds-lab/ du clone qui juge. Un fichier absent ou
 * différent est un échec : l'agent lirait des règles que la CI ne juge plus.
 * @param {string} copie dossier de la copie @param {string} [cwd]
 * @returns {Echec[]}
 */
export function echecsDeSkill(copie, cwd = process.cwd()) {
  if (!existsSync(copie) || !statSync(copie).isDirectory()) throw new Error(`--skill ${copie} : dossier introuvable ; nommer le dossier où le skill est copié, par exemple .claude/skills/ds-lab`);
  const rel = relative(cwd, copie).replace(/\/$/, '') || '.';
  const aFaire = `À faire : recopier skill/ds-lab/ du clone dans ${rel}/.`;
  return /** @type {string[]} */ (readdirSync(SKILL, { recursive: true }))
    .filter((f) => statSync(join(SKILL, f)).isFile())
    .sort()
    .flatMap((f) => {
      const ici = join(copie, f);
      if (!existsSync(ici)) return [{ famille: /** @type {const} */ ('skill'), texte: `✗ skill · ${rel}/${f} : absent de la copie. ${aFaire}` }];
      if (readFileSync(ici, 'utf8') !== readFileSync(join(SKILL, f), 'utf8'))
        return [{ famille: /** @type {const} */ ('skill'), texte: `✗ skill · ${rel}/${f} : diffère de skill/ds-lab/ du clone. ${aFaire}` }];
      return [];
    });
}

/** @param {number} n @param {string} un @param {string} plusieurs */
const compte = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;

/**
 * En-tête : les marques et les fichiers de style jugés.
 * @param {string} dossierMarques tel que donné @param {string[]} noms @param {number} fichiers
 */
export const entete = (dossierMarques, noms, fichiers) =>
  `verifier : ${compte(noms.length, 'marque', 'marques')} dans ${dossierMarques.replace(/\/?$/, '/')} (${noms.join(', ')}) ; ${compte(fichiers, 'fichier', 'fichiers')} de style`;

/**
 * Bilan, dernière ligne ; le skill n'y paraît que s'il a été jugé (--skill).
 * @param {Echec[]} echecs @param {{ skill?: boolean }} [opts]
 */
export function bilan(echecs, { skill = false } = {}) {
  if (!echecs.length) return `verifier : 0 échec (contraste en clair et en sombre, en large et en étroit ; espacements ; typo ; style${skill ? ' ; skill' : ''})`;
  const par = FAMILLES.filter((f) => skill || f !== 'skill').map((f) => `${f} ${echecs.filter((x) => x.famille === f).length}`).join(', ');
  return `verifier : ${compte(echecs.length, 'échec', 'échecs')} (${par})`;
}
