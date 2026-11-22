// @ts-check
/**
 * D69 : le relevé d'un passage d'Inventorier. Le fichier rendu, ce qui a été touché en dehors de lui, et les pièces qu'il
 * nomme face à une liste de référence : les lignes qui nomment chaque pièce, les pièces demandées que rien ne nomme, les
 * composants et les chemins cités qui n'existent pas, les lignes qui ne correspondent à aucune pièce. Une comparaison à
 * lire, pas un verdict : une pièce se reconnaît à des mots.
 */
import { posix } from 'node:path';

/** @typedef {{ id: string, piece: string, demande: boolean, attendu: 'a' | 'manque', avec: string[], note: string, motif: string }} Piece */
/** @typedef {{ ligne: number, texte: string, question: boolean }} Ligne */

/** Les lignes d'un texte Markdown, sans les vides, les traits ni les en-têtes de tableau ; celles d'une section de questions sont marquées. @param {string} texte */
function lignes(texte) {
  const brut = texte.normalize('NFC').split('\n');
  const trait = (/** @type {string | undefined} */ l) => /^\s*\|?[\s:|-]*---[\s:|-]*$/.test(l ?? '');
  /** @type {(Ligne & { forme: boolean })[]} */
  const r = [];
  let niveau = 0;
  brut.forEach((l, i) => {
    const titre = l.match(/^(#+)\s/);
    if (titre && (!niveau || titre[1].length <= niveau)) niveau = /question/i.test(l) ? titre[1].length : 0;
    if (!l.trim() || trait(l) || (/^\s*\|/.test(l) && trait(brut[i + 1]))) return;
    r.push({ ligne: i + 1, texte: l.trim(), question: niveau > 0, forme: /^\s*(#|[-*+]\s|\d+[.)]\s|\|)/.test(l) });
  });
  return r;
}

/**
 * @param {{ texte: string | null, lieu: string | null, rendu: string, touches: { statut: string, fichier: string }[],
 *   depart: string[], pieces: Piece[] }} o
 *   texte : celui du fichier rendu, ou null ; lieu : son chemin dans l'app, ou null ; depart : les fichiers de l'app au départ
 */
export function releverInventaire(o) {
  const l = lignes(o.texte ?? '');
  const sortie = (/** @type {Ligne} */ x) => ({ ligne: x.ligne, texte: x.texte.slice(0, 200), question: x.question });
  const motifs = o.pieces.map((p) => new RegExp(p.motif, 'iu'));
  const composants = new Set(o.depart.map((f) => f.match(/^src\/components\/ds\/(Ds\w+)\.vue$/)?.[1]).filter(Boolean));
  const existe = (/** @type {string} */ c) => o.depart.some((f) => f === c || f.startsWith(`${c}/`));
  /** @type {{ nom: string, ligne: number, texte: string, question: boolean }[]} */
  const inconnus = [];
  for (const x of l) {
    const noms = [...x.texte.matchAll(/\bDs[A-Z]\w*/g)].map((m) => m[0]).filter((n) => !composants.has(n));
    const chemins = [...x.texte.matchAll(/(?<![\w./-])(?:src|docs|tokens|\.claude)\/[\w./-]*/g)]
      .map((m) => posix.normalize(m[0]).replace(/[/.]+$/, ''))
      .filter((c) => c !== o.lieu && !existe(c));
    for (const nom of new Set([...noms, ...chemins])) inconnus.push({ nom, ...sortie(x) });
  }
  return {
    rendu: { attendu: o.rendu, lieu: o.lieu },
    touches: o.touches.filter((t) => t.fichier !== o.lieu),
    pieces: o.pieces.map(({ motif: _, ...p }, i) => ({ ...p, lignes: l.filter((x) => motifs[i].test(x.texte)).map(sortie) })),
    inconnus,
    horsListe: l.filter((x) => x.forme && !x.question && !motifs.some((m) => m.test(x.texte))).map(sortie),
  };
}

/** Le relevé, en Markdown. @param {ReturnType<typeof releverInventaire>} r */
export function texteDeLInventaire(r) {
  const cite = (/** @type {{ ligne: number, texte: string, question: boolean }} */ x) => `  - ligne ${x.ligne}${x.question ? ' (question)' : ''} : ${x.texte}`;
  /** @param {(typeof r.pieces)[number]} p */
  const attendu = (p) => [p.attendu === 'manque' ? 'manque' : p.avec.length && `l’app a ${p.avec.join(', ')}`, p.note].filter(Boolean).join(' ; ');
  const demandees = r.pieces.filter((p) => p.demande);
  const manquees = demandees.filter((p) => !p.lignes.length);
  /** @param {(typeof r.pieces)[number][]} l */
  const bloc = (l) => (l.length ? l.flatMap((p) => [`- ${p.id} ${p.piece}. Attendu : ${attendu(p)}`, ...p.lignes.map(cite)]) : ['Aucune.']);
  return [
    '# L’inventaire',
    '',
    'Une comparaison à lire, pas un verdict : une pièce se reconnaît à des mots.',
    '',
    `- Fichier rendu : ${r.rendu.lieu ?? 'aucun'}${r.rendu.lieu && r.rendu.lieu !== r.rendu.attendu ? ` (attendu : ${r.rendu.attendu}, à la racine)` : ''}`,
    `- Fichiers touchés en dehors : ${r.touches.length ? r.touches.map((t) => `${t.statut} ${t.fichier}`).join(', ') : 'aucun'}`,
    `- Pièces demandées : ${demandees.length - manquees.length} nommées sur ${demandees.length}`,
    '',
    '## Trouvées',
    '',
    ...bloc(demandees.filter((p) => p.lignes.length)),
    '',
    '## Manquées',
    '',
    'Aucune ligne ne les nomme avec les mots de la liste : lire aussi les lignes hors de la liste.',
    '',
    ...bloc(manquees),
    '',
    '## Nommées sans être demandées par la description, et à leur place',
    '',
    ...bloc(r.pieces.filter((p) => !p.demande && p.lignes.length)),
    '',
    '## Cités, et absents de l’app au départ',
    '',
    'Inventé, cité comme un manque, ou à créer : à lire.',
    '',
    ...(r.inconnus.length ? r.inconnus.map((x) => `- ${x.nom}, ligne ${x.ligne} : ${x.texte}`) : ['Aucun.']),
    '',
    '## Lignes hors de la liste',
    '',
    ...(r.horsListe.length ? r.horsListe.map((x) => `- ligne ${x.ligne} : ${x.texte}`) : ['Aucune.']),
    '',
  ].join('\n');
}
