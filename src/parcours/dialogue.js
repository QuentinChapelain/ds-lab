// @ts-check
/**
 * Le dialogue du parcours (D73) : docs/dialogue-du-parcours.md, lu et contrôlé, et les moments que sert un état. Pour
 * chaque moment, l'ouverture, ses variantes et deux questions avec leur réponse ; l'IA qui conduit dit le texte servi
 * mot pour mot et ne choisit ni l'ordre ni les mots. Un moment joue s'il dit vrai aujourd'hui : avec son ouverture
 * (`oui`), avec son texte « en attendant son écran », ou pas du tout (`non`). Toute faute de forme est une panne qui
 * nomme le moment (D18).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** @typedef {import('./etat.js').Etat} Etat @typedef {import('./etat.js').Chiffres} Chiffres */
/**
 * @typedef {'oui' | 'en attendant' | 'non'} Joue
 * @typedef {{ question: string, reponse: string }} Echange
 * @typedef {{ nom: string, temps: string, joue: Joue, textes: Record<string, string[]>, questions: Echange[] }} Moment
 * @typedef {{ nom: string, messages: string[], bouton: string | null, questions: Echange[] }} Servi
 */

/** Le fichier du dialogue, dans le clone. */
const DIALOGUE = fileURLToPath(new URL('../../docs/dialogue-du-parcours.md', import.meta.url));

/** Les treize moments, dans l'ordre du parcours cible. */
export const MOMENTS = /** @type {const} */ ([
  'Lancer',
  'Les pages',
  'La dette',
  'La marque',
  'Les fondations',
  'Les composants à ta marque',
  'Le tri',
  'La revue',
  'Avant, après',
  'La remise',
  'Les composants à garder',
  'Le bilan',
  'Remplacer et tenir',
]);

/** Les textes d'un moment ; chacun a sa variante « …, plusieurs sites ». */
const TEXTES = ['Ouverture', 'En attendant son écran', 'Sans report', 'Bouton'];
const PLUSIEURS = ', plusieurs sites';
const TEMPS = ['Mesurer', 'Décider', 'Poser', 'Tenir'];
/** Les chiffres que le parcours sait remplir. */
const CHAMPS = /** @type {const} */ (['versions', 'decisions', 'reportes']);
/** Le titre qui clôt les moments : ce qui suit n'est pas lu. */
const RESERVE = 'En réserve';

/** Les messages entre guillemets d'une ligne. @param {string} v */
const messages = (v) => [...v.matchAll(/«\s*([^»]*?)\s*»/g)].map((m) => m[1]);

/**
 * Lit et contrôle le dialogue.
 * @param {string} [md] le texte du fichier ; par défaut, celui du clone
 * @returns {Moment[]}
 */
export function lireDialogue(md = readFileSync(DIALOGUE, 'utf8')) {
  const corps = md.split(`\n## ${RESERVE}\n`)[0];
  const blocs = corps.split(/^## /m).slice(1);
  const noms = blocs.map((b) => b.split('\n')[0].trim());
  if (noms.join('|') !== MOMENTS.join('|')) throw new Error(`dialogue : les treize moments sont attendus dans l'ordre (${MOMENTS.join(', ')}) ; lus : ${noms.join(', ')}`);
  return blocs.map((b, i) => {
    const nom = noms[i];
    /** @param {string} m */
    const faute = (m) => new Error(`dialogue : ${nom} : ${m}`);
    /** @type {Record<string, string>} */
    const champs = {};
    for (const l of b.split('\n')) {
      const m = /^- ([^:]+?) : (.*)$/.exec(l);
      if (!m) continue;
      const [, cle, valeur] = m;
      if (cle !== 'Temps' && cle !== 'Joue' && !TEXTES.some((t) => cle === t || cle === t + PLUSIEURS)) throw faute(`ligne inconnue « ${cle} » (Temps, Joue, ${TEXTES.join(', ')}, et leur variante « ${PLUSIEURS.slice(2)} »)`);
      if (cle in champs) throw faute(`ligne « ${cle} » en double`);
      champs[cle] = valeur;
    }
    if (!TEMPS.includes(champs.Temps)) throw faute(`Temps : ${TEMPS.join(', ')} attendu`);
    const joue = /** @type {Joue} */ (champs.Joue);
    if (!['oui', 'en attendant', 'non'].includes(joue)) throw faute('Joue : « oui », « en attendant » ou « non » attendu');
    /** @type {Record<string, string[]>} */
    const textes = {};
    for (const [cle, valeur] of Object.entries(champs)) {
      if (cle === 'Temps' || cle === 'Joue') continue;
      const ms = messages(valeur);
      if (!ms.length || ms.some((x) => !x)) throw faute(`${cle} : un message au moins, entre « et »`);
      for (const x of ms)
        for (const [, c] of x.matchAll(/\{([^}]*)\}/g)) if (!(/** @type {readonly string[]} */ (CHAMPS)).includes(c)) throw faute(`${cle} : chiffre inconnu {${c}} (${CHAMPS.map((x) => `{${x}}`).join(', ')})`);
      textes[cle] = ms;
    }
    if (!textes.Ouverture) throw faute('Ouverture absente');
    if (joue === 'en attendant' && !textes['En attendant son écran']) throw faute('« Joue : en attendant » demande une ligne « En attendant son écran »');
    const questions = b
      .split('\n')
      .filter((l) => /^\|/.test(l) && !/^\|\s*(?:Question|-+)\s*\|/.test(l))
      .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
    if (questions.length !== 2 || questions.some((q) => q.length !== 2 || !q[0] || !q[1])) throw faute('deux questions sont attendues, chacune avec sa réponse');
    return { nom, temps: champs.Temps, joue, textes, questions: questions.map(([question, reponse]) => ({ question, reponse })) };
  });
}

/**
 * Les moments que sert un état, dans l'ordre où ils se disent. Un moment est servi quand la sortie de son étape
 * arrive ; deux peuvent l'être ensemble. Rien n'est servi quand l'outil enchaîne une commande ou qu'un refus se lit
 * dans l'action.
 * @param {Etat} e
 * @returns {string[]}
 */
export function momentsDeLEtat(e) {
  const k = e.courante;
  const marques = e.etapes.find((x) => x.cle === 'marques');
  switch (k.cle) {
    case 'site':
      return ['Les pages'];
    case 'marques':
      // Le constat vient d'arriver ; la marque se dit si l'outil la saisit lui-même (une entrée à saisir).
      return marques && !marques.sortie ? ['La dette', ...(k.main === 'outil' ? ['La marque'] : [])] : [];
    case 'decisions':
      if (!k.sortie) return ['Les fondations'];
      // Un fichier voisin se renomme d'abord ; toutes tranchées, l'outil relance la réduction.
      if (e.voisin || !e.chiffres.decisions || !e.chiffres.enAttente) return [];
      return e.chiffres.enAttente === e.chiffres.decisions ? ['Le tri', 'La revue'] : ['La revue'];
    case 'livraison':
      return k.sortie ? [] : ['Avant, après'];
    case 'suivi':
      return ['Le bilan'];
    default:
      return [];
  }
}

/**
 * Le texte d'un moment pour cet état : l'ouverture, ou le texte en attendant son écran ; sans report au bilan, la
 * variante « Sans report » ; à plusieurs sites, la variante « …, plusieurs sites » si elle existe. Chiffres remplis.
 * @param {Moment} m @param {Etat} e
 * @returns {Servi}
 */
export function servir(m, e) {
  /** @param {string} cle */
  const variante = (cle) => (!e.unSite && m.textes[cle + PLUSIEURS] ? m.textes[cle + PLUSIEURS] : m.textes[cle]);
  let cle = m.joue === 'en attendant' ? 'En attendant son écran' : 'Ouverture';
  if (m.textes['Sans report'] && !e.chiffres.reportes) cle = 'Sans report';
  const remplir = (/** @type {string} */ t) =>
    t.replace(/\{([a-z]+)\}/g, (_, c) => {
      const v = e.chiffres[/** @type {keyof Chiffres} */ (c)];
      if (v === null || v === undefined) throw new Error(`dialogue : ${m.nom} : {${c}} n'a pas de valeur dans cet état`);
      return String(v);
    });
  return { nom: m.nom, messages: variante(cle).map(remplir), bouton: m.textes.Bouton ? variante('Bouton')[0] : null, questions: m.questions };
}

/**
 * Le bloc « Pour le chat » de la commande parcours : pour chaque moment servi, son ouverture, son bouton et ses deux
 * questions avec leur réponse. Vide quand rien n'est servi.
 * @param {Etat} e @param {Moment[]} [dialogue]
 * @returns {string[]}
 */
export function lignesDuChat(e, dialogue = lireDialogue()) {
  const servis = momentsDeLEtat(e)
    .map((n) => /** @type {Moment} */ (dialogue.find((m) => m.nom === n)))
    .filter((m) => m.joue !== 'non')
    .map((m) => servir(m, e));
  if (!servis.length) return [];
  return [
    `Pour le chat : ${servis.map((s) => s.nom).join(', puis ')}. Dire chaque message mot pour mot ; proposer les questions et le bouton en boutons.`,
    ...servis.flatMap((s) => [
      `${s.nom}`,
      ...s.messages.map((x) => `  Message : « ${x} »`),
      ...(s.bouton ? [`  Bouton : « ${s.bouton} »`] : []),
      ...s.questions.flatMap((q) => [`  Question : « ${q.question} »`, `    Réponse : « ${q.reponse} »`]),
    ]),
  ];
}
