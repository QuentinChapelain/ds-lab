// @ts-check
/**
 * Les faits du moment (D74) : ce que `parcours` écrit sous ses lignes pour l'IA qui conduit. Des faits, pas des
 * messages : ce qui vient d'être fait, le chiffre du moment, l'écran, la suite, qui a la main, ce qui n'est pas arrivé,
 * ce qui revient au développeur, les choix reportés, le temps écoulé. L'IA les dit avec ses mots ; aucun n'est entre
 * guillemets, aucun ne nomme un fichier. Une ligne vide n'est pas écrite.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** @typedef {import('./etat.js').Etat} Etat @typedef {import('./projet.js').Projet} Projet */

const HORODATAGE = /^(\d{4})-(\d\d)-(\d\d)T(\d\d)(\d\d)(?:-\d+)?$/;

/** Accord en nombre : 0 et 1 au singulier. @param {number} n @param {string} un @param {string} plusieurs */
const nombre = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;

/** Les horodatages, en minutes, des dossiers d'horodatage sous `dossier`, à la profondeur `profondeur`. @param {string} dossier @param {number} profondeur @returns {number[]} */
function horodatages(dossier, profondeur) {
  if (!existsSync(dossier)) return [];
  const entrees = readdirSync(dossier, { withFileTypes: true }).filter((e) => e.isDirectory());
  if (profondeur > 0) return entrees.flatMap((e) => horodatages(join(dossier, e.name), profondeur - 1));
  return entrees
    .map((e) => HORODATAGE.exec(e.name))
    .filter((m) => m !== null)
    .map((m) => Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) / 60000);
}

/** « 42 min », « 1 h 05 », « 1 j 2 h ». @param {number} minutes */
export function dureeDite(minutes) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
  return `${Math.floor(minutes / (24 * 60))} j ${Math.floor((minutes % (24 * 60)) / 60)} h`;
}

/**
 * Le temps écoulé entre le premier constat et la dernière sortie horodatée (constat, tri, vérification), à la minute,
 * par les noms des dossiers, jamais la date d'un fichier. Null sans constat. Les pauses sont comprises ; le choix des
 * pages, la saisie de la marque et la pose ne comptent que si une sortie horodatée vient après.
 * @param {string} sorties
 * @returns {number | null}
 */
export function dureeEcoulee(sorties) {
  const constats = horodatages(join(sorties, 'composants'), 2);
  if (!constats.length) return null;
  const toutes = [...constats, ...horodatages(join(sorties, 'reductions'), 1), ...horodatages(join(sorties, 'verify'), 1)];
  return Math.max(...toutes) - Math.min(...constats);
}

/** Le titre d'une ligne de la vérification, sans guillemets. @param {string} t */
const sansGuillemets = (t) => t.replace(/«\s*/g, '').replace(/\s*»/g, '');

/** Au plus tant de lignes non arrivées nommées ; les autres se comptent. */
const NOMMEES = 5;

/**
 * Les faits du moment, une ligne par fait, sous un titre ; vide quand l'outil enchaîne une commande sans rien de neuf.
 * @param {Etat} e
 * @param {{ sorties: string }} o  la racine des sorties du projet
 * @returns {string[]}
 */
export function faitsDuMoment(e, { sorties }) {
  const k = e.courante;
  const i = e.etapes.indexOf(k);
  const avant = i > 0 ? e.etapes[i - 1] : null;
  /** @type {[string, string | null][]} */
  const f = [];
  const main =
    k.cle === 'suivi' ? 'personne : dire le bilan, puis attendre un changement du site'
    : k.main === 'outil' ? 'l’outil ; enchaîner sans demander' : k.main === 'développeur' ? 'le développeur ; ce qui lui revient se dit en deux lignes' : 'l’humain ; l’accompagner, il décide';
  switch (k.cle) {
    case 'site':
      if (k.action?.startsWith('retenir')) f.push(['Ensuite', 'regarder le site, retenir les pages qui portent le plus de composants, les écrire dans le projet avec leur nom']);
      else f.push(['Écran', 'les pages à mesurer'], ['Ensuite', 'dire en une phrase combien de pages sont retenues, sans les nommer, puis attendre le clic sur Mesurer (parcours --attendre, en tâche de fond)']);
      break;
    case 'constat':
      f.push(['Écran', 'la mesure en cours, qui passe seule à la suite'], ['Ensuite', 'mesurer les pages']);
      break;
    case 'marques': {
      if (k.action?.startsWith('regarder la dette')) {
        f.push(
          ['Fait', 'la mesure des pages'],
          ['Chiffre', e.chiffres.valeurs !== null ? nombre(e.chiffres.valeurs, 'valeur différente affichée', 'valeurs différentes affichées') : e.chiffres.versions === null ? null : nombre(e.chiffres.versions, 'version de composant', 'versions de composants')],
          ['Écran', 'la dette'],
          ['Ensuite', 'une phrase et ce chiffre, renvoyer à l’écran, puis attendre le clic sur Passer à ta marque (parcours --attendre, en tâche de fond) ; ne pas proposer la marque avant'],
        );
        break;
      }
      if (k.action?.startsWith('choisir la marque')) {
        f.push(
          ['Fait', 'la marque lue dans la mesure'],
          ['Écran', 'la marque'],
          ['Ensuite', 'une phrase : lue sur les pages, à droite, on peut la changer puis la confirmer ; ni liste ni code ; attendre le clic sur Confirmer la marque (parcours --attendre, en tâche de fond)'],
        );
        break;
      }
      // Après « Confirmer la marque » (D83) : l'écran d'attente, qui passe seul aux fondations.
      if (e.moment === 'jetons' && !k.refus) {
        f.push(['Fait', 'la marque confirmée'], ['Écran', 'l’écriture des jetons, qui passe seule aux fondations'], ['Ensuite', `${k.action}, sans le dire, puis relire parcours`]);
        break;
      }
      if (avant?.etat === 'faite' && !k.sortie) {
        f.push(['Fait', 'la mesure des pages'], ['Chiffre', e.chiffres.versions === null ? null : nombre(e.chiffres.versions, 'version de composant', 'versions de composants')], ['Écran', 'la dette']);
      }
      const marque = /** @type {string} */ (k.action);
      if (k.refus) f.push(['Refus', k.lignes.find((l) => /refusée/.test(l)) ?? k.fait], ['Ensuite', 'dire ce qui ne va pas avec les mots de l’humain, proposer une réparation, corriger l’entrée après son accord']);
      else if (/écrire l’entrée/.test(marque)) f.push(['Ensuite', 'lire la marque sur le site (couleur principale, accent, police des titres), la proposer en une phrase, écrire l’entrée après son accord']);
      else f.push(['Ensuite', 'poser la marque sur les fondations, puis montrer la planche']);
      break;
    }
    case 'decisions':
      if (e.moment === 'fondations') {
        f.push(
          ['Fait', 'la marque saisie, ses jetons et ses contrôles écrits'],
          ['Écran', 'les fondations'],
          ['Ensuite', 'une phrase : les fondations sont prêtes, à sa marque, et ne sont pas encore sur le site ; ni chiffre ni liste ; attendre le clic sur Comparer mon site (parcours --attendre, en tâche de fond)'],
        );
      } else if (!k.sortie) {
        f.push(['Fait', 'la marque, acceptée'], ['Écran', 'la planche de la marque'], ['Ensuite', 'comparer les pages aux fondations']);
      } else if (e.voisin) {
        f.push(['Ensuite', 'le fichier des choix est arrivé sous un autre nom : le ranger, sans le dire']);
      } else if (e.chiffres.enAttente) {
        f.push(
          ['Fait', 'les pages comparées aux fondations ; le reste rangé seul'],
          ['Chiffre', nombre(/** @type {number} */ (e.chiffres.enAttente), 'décision à prendre', 'décisions à prendre')],
          ['Écran', 'la revue'],
          ['Ensuite', 'trancher dans la revue ; une fois fini, exporter, puis glisser le fichier dans le chat, que l’IA range'],
        );
      } else {
        f.push(['Fait', 'toutes les décisions prises'], ['Ensuite', 'les appliquer']);
      }
      break;
    case 'livraison':
    case 'suivi': {
      const l = e.livraison;
      if (!l) {
        if (k.sortie) f.push(['Fait', 'les feuilles posées à côté de l’ancien code'], ['Ensuite', 'les vérifier sur les pages']);
        else f.push(['Fait', 'toutes les décisions prises'], ['Ensuite', 'poser les feuilles à côté de l’ancien code, puis les vérifier sur les pages']);
        break;
      }
      f.push(['Fait', `la vérification sur ${nombre(l.pages, 'page', 'pages')}`], ['Chiffre', `${nombre(l.arrivees, 'ligne arrivée', 'lignes arrivées')} sur ${l.total}`]);
      for (const x of l.manquantes.slice(0, NOMMEES)) f.push(['Pas arrivé', `${sansGuillemets(x.titre)} ; ${nombre(x.elements, 'élément', 'éléments')}${x.cause ? ` ; cause : ${x.cause}` : ''}`]);
      if (l.manquantes.length > NOMMEES) f.push(['Pas arrivé', `et ${nombre(l.manquantes.length - NOMMEES, 'autre ligne', 'autres lignes')}`]);
      f.push(['Au développeur', 'installer les feuilles ajoutées dans le code du produit ; vérifier les pages hors de l’échantillon']);
      if (k.cle === 'suivi') f.push(['Ensuite', 'relancer le contrôle après chaque changement du site']);
      break;
    }
  }
  f.push(['Main', main]);
  if (e.chiffres.reportes) f.push(['Reporté', nombre(e.chiffres.reportes, 'choix', 'choix')]);
  const duree = dureeEcoulee(sorties);
  if (duree !== null) f.push(['Durée', `${dureeDite(duree)} depuis la première mesure, pauses comprises`]);
  const lignes = f.filter(([, v]) => v).map(([cle, v]) => `  ${cle} : ${v}`);
  return lignes.length ? ['Pour le chat, des faits à dire avec tes mots, sans les recopier :', ...lignes] : [];
}
