// Preuve rejouable de l'atelier (D42) : chaque composant, sur chaque thème de chaque marque, a les couleurs, les traits,
// les dimensions et les polices des jetons, le même rendu en développement et en version construite, et, sur le premier
// thème, le clavier, l'arbre d'accessibilité et les refus que son attendu décrit. Une preuve par composant, rangée dans
// preuve/ (bouton.js, D43), sur les outils communs de preuve/commun.js ; ce fichier les enchaîne. Sortie 0 si tout
// passe, 1 si une vérification échoue, 2 sur une panne (D18).
// La version construite doit exister (npm run build) ; le serveur de développement est lancé ici, sur 127.0.0.1, puis
// arrêté.
//
// La preuve emprunte à la racine du dépôt son lancement de Chromium (D34), le lecteur des jetons et la comparaison de
// pixels (pixelmatch, pngjs) : elle demande l'installation de la racine, comme les tests.
import { lancer } from '../src/cli/garde.js';
import { lancerChromium } from '../src/browser/lancement.js';
import { CADRE, attendus, servirConstruite, servirDeveloppement } from './preuve/commun.js';
import { preuveBouton } from './preuve/bouton.js';

await lancer('preuve', async () => {
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
    captures.push(await preuveBouton(p));
  } finally {
    await navigateur.close();
    developpement.arreter();
    await construite.arreter();
  }
  for (const c of captures) console.log(`Planches enregistrées dans ${c}.`);
  console.log(echecs.length ? `${echecs.length} vérification(s) en échec.` : `Toutes les vérifications passent : ${themes.length} thèmes.`);
  return echecs.length ? 1 : 0;
});
