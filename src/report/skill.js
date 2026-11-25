// @ts-check
/**
 * D66 : les textes du skill ds-lab (skill/ds-lab/), générés depuis docs/regles.md et docs/techniques/, pour une équipe
 * qui les lit dans son propre dépôt (DOC2 : ils ne vieillissent pas à part).
 *   regles.md             règles et défauts pour tous ; colonne « Contrôle dans ce dépôt » à la place du contrôle de
 *                         ds-lab : `verifier` (<contrôles>) si le contrôle de ds-lab commence par « Relit » et cite
 *                         npm run contraste, espacements, typo ou style, sinon « Non contrôlée ici » ;
 *   consignes.md          les consignes, sans l'endroit où ds-lab les lit ;
 *   techniques/<f>.md     une ligne par règle marquée, avec la même colonne ;
 *   SKILL.md              écrit à la main, sauf le bloc du compte, entre ses deux marques ;
 *   conduire.md           écrit à la main : la conduite d'un projet et la voix (D72, D74), que SKILL.md ne peut pas
 *                         porter sans dépasser sa page ;
 *   contexte.md           écrit à la main : ce que l'IA sait de ds-lab avant son premier message, le lancement, seul
 *                         texte dit tel quel, et ce que fait chaque étape (D74).
 * Les choix de ds-lab sont retirés : une proposition qui commence par « ds-lab », entre deux « ; » ou après un « . » ;
 * le renvoi « (de XX<n>) » qui la termine reste. Une cellule qui commence par « ds-lab » ne se détache pas : panne.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = fileURLToPath(new URL('../../', import.meta.url));
/** Dossier du skill dans le clone. */
export const SKILL = join(RACINE, 'skill', 'ds-lab');

/** Les sources du skill, lues dans le clone : docs/regles.md, docs/techniques/, skill/ds-lab/SKILL.md, conduire.md et contexte.md. */
export function sourcesDuSkill() {
  const dossier = join(RACINE, 'docs', 'techniques');
  return {
    regles: readFileSync(join(RACINE, 'docs', 'regles.md'), 'utf8'),
    techniques: Object.fromEntries(readdirSync(dossier).filter((f) => f.endsWith('.md')).sort().map((f) => [f, readFileSync(join(dossier, f), 'utf8')])),
    skill: readFileSync(join(SKILL, 'SKILL.md'), 'utf8'),
    conduire: readFileSync(join(SKILL, 'conduire.md'), 'utf8'),
    contexte: readFileSync(join(SKILL, 'contexte.md'), 'utf8'),
  };
}

const CONTROLES = ['contraste', 'espacements', 'typo', 'style'];
const NON = 'Non contrôlée ici';
const DEBUT = '<!-- compte : écrit par npm run skill, depuis docs/regles.md -->';
const FIN = '<!-- /compte -->';
const SOURCE = 'Généré par `npm run skill` depuis `docs/regles.md` du clone de ds-lab : ne pas le modifier à la main, le recopier quand le clone avance.';

/** @param {string} l */
const cellules = (l) => l.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim());

/**
 * Retire d'une cellule les propositions qui disent un choix de ds-lab.
 * @param {string} texte @param {string} numero pour le message de panne
 */
export function sansChoixDeDsLab(texte, numero) {
  if (/^ds-lab\b/.test(texte)) throw new Error(`skill : ${numero}, la cellule commence par « ds-lab » et ne se détache pas : écrire le choix de ds-lab dans une proposition à part, après « ; » ou « . »`);
  return texte.replace(/\s*[;.]\s+ds-lab\b.*?(?=\s;\s|$)/g, (m) => / \(de [A-Z]+\d+\)$/.exec(m)?.[0] ?? '');
}

/** @param {string} controle cellule Contrôle de ds-lab */
function iciDe(controle) {
  if (!controle.startsWith('Relit')) return NON;
  const cites = CONTROLES.filter((c) => controle.includes(`npm run ${c}`));
  return cites.length ? `\`verifier\` (${cites.join(', ')})` : NON;
}

/**
 * Lit les tables de docs/regles.md.
 * @param {string} md
 * @returns {{ sections: { titre: string, regles: { numero: string, cellules: string[], ici: string }[] }[], defauts: { numero: string, cellules: string[], ici: string }[], consignes: { numero: string, texte: string }[] }}
 */
function lireRegles(md) {
  /** @type {ReturnType<typeof lireRegles>} */
  const out = { sections: [], defauts: [], consignes: [] };
  let titre = '';
  for (const l of md.split('\n')) {
    if (l.startsWith('## ')) titre = l.slice(3).trim();
    const m = /^\| ([A-Z]+\d+) \|/.exec(l);
    if (!m) continue;
    const [numero, ...c] = cellules(l);
    if (titre === 'Défauts') {
      const [defaut, valeur, raison, decision, controle] = c;
      out.defauts.push({ numero, cellules: [defaut, valeur, raison, decision].map((x) => sansChoixDeDsLab(x, numero)), ici: iciDe(controle) });
    } else if (titre === 'Consignes') out.consignes.push({ numero, texte: sansChoixDeDsLab(c[0], numero) });
    else {
      const [regle, raison, seuil, controle, technique] = c;
      let s = out.sections.find((x) => x.titre === titre);
      if (!s) out.sections.push((s = { titre, regles: [] }));
      s.regles.push({ numero, cellules: [regle, raison, seuil, technique].map((x) => sansChoixDeDsLab(x, numero)), ici: iciDe(controle) });
    }
  }
  return out;
}

/** Comptes des énoncés contrôlés ici et non, règles et défauts ensemble. @param {ReturnType<typeof lireRegles>} r */
function comptes(r) {
  const tous = [...r.sections.flatMap((s) => s.regles), ...r.defauts];
  const ici = tous.filter((x) => x.ici !== NON).length;
  return { tous: tous.length, ici, non: tous.length - ici };
}

/** La phrase du compte, la même dans SKILL.md et dans regles.md. @param {ReturnType<typeof comptes>} c */
const phrase = (c) =>
  `Dans ce dépôt, \`verifier\` contrôle ${c.ici} des ${c.tous} règles et défauts ; ${c.non} ne sont pas contrôlés ici. Pour une règle « ${NON} », rien ne bloque : l'agent la tient en la lisant.`;

/** @param {string[]} c */
const ligne = (c) => `| ${c.join(' | ')} |`;

/**
 * Les fichiers du skill.
 * @param {{ regles: string, techniques: Record<string, string>, skill: string, conduire?: string, contexte?: string }} sources
 *   docs/regles.md, les fichiers de docs/techniques/ par nom, SKILL.md, conduire.md et contexte.md, écrits à la main
 * @returns {Record<string, string>} chemin dans skill/ds-lab/ → texte
 */
export function fichiersDuSkill({ regles, techniques, skill, conduire, contexte }) {
  const r = lireRegles(regles);
  const c = comptes(r);
  const ici = new Map([...r.sections.flatMap((s) => s.regles), ...r.defauts].map((x) => [x.numero, x.ici]));
  const R = [
    '# Règles du design system',
    '',
    SOURCE,
    '',
    "Une règle est vraie ou fausse, un contrôle la tranche. Un défaut est une valeur posée, sans seuil sourcé : il bloque comme une règle et se change par une décision écrite. Une technique est le comment d'une règle dans un framework (`techniques/`). Une consigne se lit, rien ne la contrôle (`consignes.md`). Les renvois D<n> se lisent dans `docs/decisions.md` du clone.",
    '',
    phrase(c),
  ];
  for (const s of r.sections) {
    R.push('', `## ${s.titre}`, '', '| | Règle | Raison | Seuil | Technique | Contrôle dans ce dépôt |', '|---|---|---|---|---|---|');
    for (const x of s.regles) R.push(ligne([x.numero, ...x.cellules, x.ici]));
  }
  R.push('', '## Défauts', '', '| | Défaut | Valeur | Raison | Décision | Contrôle dans ce dépôt |', '|---|---|---|---|---|---|');
  for (const x of r.defauts) R.push(ligne([x.numero, ...x.cellules, x.ici]));

  const C = ['# Consignes', '', SOURCE, '', "Une consigne se lit : rien ne la contrôle, elle ne bloque pas. L'agent la suit en écrivant.", '', '| | Consigne |', '|---|---|'];
  for (const x of r.consignes) C.push(ligne([x.numero, x.texte]));

  /** @type {Record<string, string>} */
  const out = { 'regles.md': `${R.join('\n')}\n`, 'consignes.md': `${C.join('\n')}\n` };
  for (const [nom, md] of Object.entries(techniques)) {
    const titre = md.split('\n').find((l) => l.startsWith('# ')) ?? `# Techniques : ${nom}`;
    const T = [
      titre,
      '',
      SOURCE.replace('`docs/regles.md`', `\`docs/techniques/${nom}\``),
      '',
      'Le comment, dans ce framework, de chaque règle marquée « Oui » dans la colonne Technique de `regles.md`. Les chemins cités sont ceux du clone : ses composants `Ds…` sont un exemple et un gabarit.',
      '',
      '| Règle | Comment | Contrôle dans ce dépôt |',
      '|---|---|---|',
    ];
    for (const l of md.split('\n')) {
      const m = /^\| ([A-Z]+\d+) \|/.exec(l);
      if (!m) continue;
      const [numero, comment] = cellules(l);
      T.push(ligne([numero, sansChoixDeDsLab(comment, numero), ici.get(numero) ?? NON]));
    }
    out[`techniques/${nom}`] = `${T.join('\n')}\n`;
  }
  const i = skill.indexOf(DEBUT);
  const j = skill.indexOf(FIN);
  if (i < 0 || j < i) throw new Error(`skill : SKILL.md sans le bloc du compte ; écrire ${DEBUT} puis ${FIN} à l'endroit du compte`);
  out['SKILL.md'] = `${skill.slice(0, i + DEBUT.length)}\n${phrase(c)}\n${skill.slice(j)}`;
  if (conduire !== undefined) out['conduire.md'] = conduire;
  if (contexte !== undefined) out['contexte.md'] = contexte;
  return out;
}
