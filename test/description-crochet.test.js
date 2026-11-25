// @ts-check
/**
 * Le crochet de la description (D87), sur deux listes écrites à la main :
 *   CR1 les 74 descriptions, toutes différentes, des 157 commandes de la partie du 25/11/2026 dans le dossier de jeu,
 *       en anglais, recopiées de sa transcription : le crochet les refuse toutes ;
 *   CR2 les mêmes, dites en français avec les mots de l'humain, et les exemples de la conduite : aucun refus à tort.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refusDeDescription } from '../src/parcours/description.js';

const ANGLAIS = [
  'Check whether the local site responds', 'Read the map page HTML and directory listing', 'Count interactive elements and links on each page',
  'Serve the guided journey in the background', 'Read the current journey state', 'Look for an installed Node 24 and version manager',
  'Read the journey state under Node 24', 'Serve the guided journey under Node 24', 'Measure the three pages', 'Read journey state and served address',
  'Read the site\'s stylesheets', 'Read remaining styles for buttons, accents and fonts', 'Find the screen links on the journey page',
  'Look at an example brand entry', 'Read the journey state', 'Re-read journey state and how it finds the brand', 'Find where project keys are validated',
  'Read project validation and brand handling', 'Capture the brand, draw its sheet, re-read state', 'Compare pages to the foundations, re-read state',
  'File the exported choices and re-read state', 'Apply the choices and re-read state', 'Write the added sheets and re-read state',
  'Verify the delivery on the pages, re-read state', 'Inspect the review table structure', 'Look at one colour row and the known issue',
  'List the colour decisions and their candidates', 'Print the decisions entries', 'Read the colour decisions text in the review',
  'Compare target scales with the clone\'s hand-written brand scales', 'Check step 9 of the target scales against the brand colours',
  'Give the brand its full scales and re-read state', 'Recapture the brand and re-read state', 'Read full journey state and options',
  'Reapply choices, rewrite sheets, verify again', 'Stop the local site server of this folder', 'Reset the play folder to its start',
  'Start the local site in the background', 'Wait for the site and list its pages', 'Check why the site start failed', 'Read the next command',
  'Measure the pages and re-read state', 'Capture the brand and read the next step', 'Find the latest review folder',
  'File the exported choices and read the next step', 'Apply the choices and write the added sheets', 'Find the line that could not be checked',
  'Stop the site and journey of this folder', 'Get the journey address and the wait option', 'Check the project still reads', 'Wait for the click on Mesurer',
  'Read the journey lines after the click', 'Measure the chosen pages and re-read state', 'Read the home page styles for brand colours',
  'Read the home theme in full', 'Serve the journey\'s opening screen', 'Get the journey address', 'Stop background tasks and reset the play folder',
  'Check the site\'s pages respond', 'Wait for the click on Passer à ta marque', 'Capture the brand and re-read state', 'Apply choices, write sheets, verify on the pages',
  'Wait for the click on Confirmer la marque', 'Capture the brand, compare pages, re-read state', 'Check the site and its pages respond',
  'Wait for the click on Comparer mon site', 'File the choices and apply them', 'Find the open decision in the review', 'Write the added sheets and read the next step',
  'Wait for the click on Valider le rendu', 'List the deliverable files for the developer', 'Find where the before/after screen is served',
  'Look for a standalone before/after page', 'Set aside the validation so the before/after screen returns',
];

const FRANCAIS = [
  'regarder si ton site répond', 'lire la page de la carte et la liste des pages', 'compter les éléments cliquables de chaque page',
  'ouvrir le parcours', 'lire où en est le parcours', 'chercher le bon Node', 'lire où en est le parcours', 'ouvrir le parcours', 'mesurer tes trois pages',
  'lire le parcours et son adresse', 'lire les feuilles de style de ton site', 'lire les styles des boutons et des couleurs', 'trouver les liens des écrans',
  'regarder un exemple de marque', 'lire où en est le parcours', 'relire le parcours', 'chercher où le projet est vérifié', 'lire la vérification du projet',
  'saisir ta marque et relire le parcours', 'comparer tes pages aux fondations', 'ranger tes choix et relire le parcours', 'appliquer tes choix',
  'écrire les feuilles ajoutées', 'vérifier les feuilles sur tes pages', 'regarder la table de la revue', 'regarder une couleur', 'lister les décisions de couleur',
  'afficher les décisions', 'lire les décisions de la revue', 'comparer les échelles', 'vérifier le pas 9', 'donner ses échelles à ta marque', 'saisir à nouveau ta marque',
  'lire tout le parcours', 'réappliquer tes choix et vérifier', 'arrêter ton site', 'repartir de zéro', 'servir ton site', 'attendre ton site', 'comprendre pourquoi le site ne démarre pas',
  'lire la suite', 'mesurer tes pages', 'saisir ta marque et lire la suite', 'trouver la dernière revue', 'ranger tes choix et lire la suite', 'appliquer tes choix et écrire les feuilles',
  'trouver ce qui n’a pas pu se vérifier', 'arrêter le site et le parcours', 'trouver l’adresse du parcours', 'vérifier que le projet se lit', 'attendre ton clic sur Mesurer',
  'lire le parcours après ton clic', 'mesurer les pages choisies', 'lire les couleurs de la page d’accueil', 'lire le thème', 'ouvrir l’écran de départ', 'trouver l’adresse du parcours',
  'arrêter et repartir de zéro', 'vérifier que tes pages répondent', 'attendre ton clic sur Passer à ta marque', 'saisir ta marque', 'appliquer, écrire, vérifier',
  'attendre ton clic sur Confirmer la marque', 'saisir ta marque et comparer tes pages', 'vérifier que ton site répond', 'attendre ton clic sur Comparer mon site',
  'ranger tes choix et les appliquer', 'trouver la décision ouverte', 'poser les feuilles et lire la suite', 'attendre ton clic sur Valider le rendu',
  'lister ce qu’on remet au développeur', 'trouver l’écran d’avant et après', 'chercher la page d’avant et après', 'rouvrir l’avant et après',
  // Les formes que la conduite cite, et des débuts de phrase qui croisent un verbe anglais.
  'mesurer tes pages', 'attendre ton clic', 'Compare les pages aux fondations', 'Capture la marque', 'File vers la revue', 'Stop au site, puis repartir',
  'Liste des pages', 'Lis le parcours', 'Écris les feuilles', 'Vérifie les pages',
];

test('CR1 les descriptions anglaises de la partie : toutes refusées', () => {
  const passees = ANGLAIS.filter((d) => !refusDeDescription(d));
  assert.equal(new Set(ANGLAIS).size, 74);
  assert.deepEqual(passees, []);
});

test('CR2 les mêmes en français, et les formes de la conduite : aucun refus à tort', () => {
  assert.deepEqual(FRANCAIS.filter((d) => refusDeDescription(d)), []);
});
