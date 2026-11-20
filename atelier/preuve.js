// Preuve rejouable de l'atelier (D42) : chaque composant, sur chaque thème de chaque marque, a les couleurs, les traits,
// les dimensions et les polices des jetons, le même rendu en développement et en version construite, et, sur le premier
// thème, le clavier, l'arbre d'accessibilité et les refus que son attendu décrit. Une preuve par composant, rangée dans
// preuve/ (button.js, D43 ; text-input.js, D49 ; card.js, D50 ; icon-button.js, D52 ; avatar.js, D54 ; tag.js,
// D55), puis une par module (member-card.js), sur les outils communs de preuve/commun.js ; ce fichier les enchaîne.
// Sortie 0 si tout passe, 1 si une vérification échoue, 2 sur une panne (D18).
// Sans argument, tous les composants, dans l'ordre du tableau COMPOSANTS ; avec des noms (node preuve.js text-input card),
// ceux-là seuls, chacun avec les mêmes vérifications : la CI lance un composant par job. Un nom inconnu est une panne.
// La version construite doit exister (npm run build) ; le serveur de développement est lancé ici, sur 127.0.0.1, puis
// arrêté.
//
// La preuve emprunte à la racine du dépôt son lancement de Chromium (D34), le lecteur des jetons et la comparaison de
// pixels (pixelmatch, pngjs) : elle demande l'installation de la racine, comme les tests.
import { lancer } from '../src/cli/garde.js';
import { lancerChromium } from '../src/browser/lancement.js';
import { CADRE, attendus, servirConstruite, servirDeveloppement } from './preuve/commun.js';
import { preuveBouton } from './preuve/button.js';
import { preuveChamp } from './preuve/text-input.js';
import { preuveCarte } from './preuve/card.js';
import { preuveBoutonIcone } from './preuve/icon-button.js';
import { preuveAvatar } from './preuve/avatar.js';
import { preuveEtiquette } from './preuve/tag.js';
import { preuveMemberCard } from './preuve/member-card.js';

/** Les preuves, dans l'ordre où elles passent sans argument. */
const COMPOSANTS = /** @type {const} */ ([
  ['button', preuveBouton],
  ['text-input', preuveChamp],
  ['card', preuveCarte],
  ['icon-button', preuveBoutonIcone],
  ['avatar', preuveAvatar],
  ['tag', preuveEtiquette],
  ['member-card', preuveMemberCard],
]);

await lancer('preuve', async () => {
  const noms = process.argv.slice(2);
  const inconnu = noms.find((n) => !COMPOSANTS.some(([c]) => c === n));
  if (inconnu !== undefined) throw new Error(`composant inconnu : ${inconnu} (${COMPOSANTS.map(([c]) => c).join(', ')})`);
  const choisis = noms.length ? COMPOSANTS.filter(([c]) => noms.includes(c)) : COMPOSANTS;
  const themes = attendus();
  /** @type {string[]} */
  const echecs = [];
  const verifier = (/** @type {boolean} */ ok, /** @type {string} */ ligne) => {
    console.log(`${ok ? '✓' : '✗'} ${ligne}`);
    if (!ok) echecs.push(ligne);
  };
  const construite = await servirConstruite();
  const developpement = await servirDeveloppement();
  const navigateur = await lancerChromium();
  /** @type {string[]} */
  const captures = [];
  try {
    const contexte = await navigateur.newContext({ viewport: CADRE, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' });
    const p = { themes, navigateur, contexte, developpement, construite, verifier };
    for (const [, preuve] of choisis) captures.push(await preuve(p));
  } finally {
    await navigateur.close();
    developpement.arreter();
    await construite.arreter();
  }
  for (const c of new Set(captures)) console.log(`Planches enregistrées dans ${c}.`);
  console.log(`Composants : ${choisis.map(([c]) => c).join(', ')}.`);
  console.log(echecs.length ? `${echecs.length} vérification(s) en échec.` : `Toutes les vérifications passent : ${themes.length} thèmes.`);
  return echecs.length ? 1 : 0;
});
