// Écrit fixtures/app-fictive/src/data/membres.js, la réponse figée de l'API que les trois départs du banc partagent
// (D68) : 295 membres, la personne de l'équipe, les trois personnes proposées, les trois qui animent. Personnes,
// entreprises et groupes inventés. Graine fixe, ni bibliothèque ni date : relancé, il écrit le même fichier à l'octet
// (test/app-fictive.test.js, AF5). Les dix premiers membres sont écrits à la main, ceux de l'atelier : ils portent les
// cas rares (sans photo, photo perdue, nom long, sans promo, sans groupe, sans ouverture, quatre ouvertures).
// Usage : node fixtures/banc/fabriquer-membres.js
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Le fichier écrit. */
export const FICHIER = fileURLToPath(new URL('../app-fictive/src/data/membres.js', import.meta.url));
const TOTAL = 295;
const GRAINE = 295;

const TETE = `// Réponse figée de l'API des membres (GET /api/membres), dans l'ordre où l'API les rend. Personnes, entreprises et
// groupes inventés ; les portraits sont dessinés, sans personne réelle. Un champ absent n'est pas connu.

/** @param {string} fond @param {string} visage @param {string} vetement @param {string} cheveux */
const portrait = (fond, visage, vetement, cheveux) =>
  \`data:image/svg+xml,\${encodeURIComponent(
    \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="\${fond}"/><circle cx="60" cy="50" r="22" fill="\${visage}"/><path d="M18 120 Q22 82 60 80 Q98 82 102 120z" fill="\${vetement}"/><path d="M36 52 Q34 24 60 24 Q86 24 84 52 Q80 34 60 34 Q40 34 36 52z" fill="\${cheveux}"/></svg>\`,
  )}\`;
const PORTRAIT_A = portrait('#7a9e9f', '#f1d9c4', '#3d5a6c', '#5b3a29');
const PORTRAIT_B = portrait('#c9b28f', '#e8c3a0', '#6b4f7a', '#2f2a26');
const PORTRAIT_C = portrait('#9fb39a', '#c99a77', '#8a3b3b', '#1f1b18');
/** Une photo que le serveur ne rend plus. */
const PHOTO_PERDUE = 'data:image/png;base64,AAAA';

/** @param {string} texte */
const slug = (texte) =>
  texte
    .normalize('NFD')
    .replace(/\\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** @param {string} nom */
const entreprise = (nom) => ({ nom, lien: \`/entreprises/\${slug(nom)}\` });

const brut = [
  { nom: 'Camille Ferrand', photo: PORTRAIT_A, poste: 'Responsable financière', entreprise: entreprise('Banque des Tilleuls'), ville: 'Lyon', groupe: 'Finance', promo: 'Promo 2015', ouvertures: ['Parler de son métier', 'Relire un CV'] },
  { nom: 'Jean-Baptiste Morel', photo: PORTRAIT_B, poste: 'Consultant en organisation', entreprise: entreprise('Cabinet Ardoise'), ville: 'Bordeaux', groupe: 'Conseil', promo: 'Promo 2012', ouvertures: ['Prendre un café'] },
  { nom: "Inès d'Aubrac", poste: 'Médecin du travail', entreprise: entreprise('Clinique du Val Clair'), ville: 'Nantes', groupe: 'Santé', promo: 'Promo 2018', ouvertures: ['Parler de son métier', 'Accueillir en stage'] },
  { nom: 'Hugo de Lassalle', photo: PORTRAIT_C, poste: 'Ingénieur méthodes', entreprise: entreprise('Forges de la Combe'), ville: 'Rennes', groupe: 'Industrie', promo: 'Promo 2009' },
  { nom: 'Émile Brun', photo: PHOTO_PERDUE, poste: 'Pharmacien', entreprise: entreprise('Officine des Halles'), ville: 'Lyon', groupe: 'Santé', promo: 'Promo 2021', ouvertures: ['Relire un CV'] },
  { nom: 'Noé', poste: 'Développeur', entreprise: entreprise('Atelier Numérique du Port'), ville: 'Marseille', promo: 'Promo 2017' },
  { nom: 'Marie-Lou', photo: PORTRAIT_A, poste: 'Analyste crédit', entreprise: entreprise('Banque des Tilleuls'), ville: 'Nantes', groupe: 'Finance', ouvertures: ['Parler de son métier'] },
  {
    nom: "Marie-Amélie de Lassalle-Vernadet d'Aubrac",
    photo: PORTRAIT_B,
    poste: 'Directrice de la stratégie et des partenariats institutionnels',
    entreprise: entreprise('Groupe Hautes-Rives et Associés'),
    ville: 'Bordeaux',
    groupe: 'Conseil',
    promo: 'Promo 2014',
    ouvertures: ['Parler de son métier', 'Relire un CV', 'Prendre un café', 'Accueillir en stage'],
  },
  { nom: 'Ana María Ruiz Soler', poste: 'Cheffe de projet', entreprise: entreprise('Coopérative Les Semailles'), ville: 'Lyon', groupe: 'Industrie', promo: 'Promo 2019', ouvertures: ['Prendre un café'] },
  { nom: 'Lucas Perrin', photo: PORTRAIT_C, poste: 'Ingénieur en systèmes embarqués et temps réel', entreprise: entreprise('Électronique de la Vilaine'), ville: 'Rennes', groupe: 'Industrie', promo: 'Promo 2016' },
`;

const PIED = `];

/** Les 295 membres : chacun avec le lien de son profil et celui pour lui écrire. */
export const MEMBRES = brut.map((m) => ({ ...m, profil: \`/membres/\${slug(m.nom)}\`, ecrire: \`/messages/nouveau?a=\${slug(m.nom)}\` }));

/** Réponse figée de GET /api/coup-de-main : la personne de l'équipe qui met en relation. */
export const COUP_DE_MAIN = {
  nom: 'Solène Vasseur',
  role: 'Responsable du réseau',
  equipe: 'Équipe de Quai Nord',
  photo: PORTRAIT_C,
  misesEnRelation: 214,
  demander: '/coup-de-main/nouveau',
};

/** @param {string} nom */
const membre = (nom) => MEMBRES.find((m) => m.nom === nom);

/** Réponse figée de GET /api/proposes : trois membres choisis d'après le profil de la personne connectée, et pourquoi. */
export const PROPOSES = {
  raison: 'Vous pensez à changer de métier : ces trois personnes l’ont fait et ont accepté d’en parler.',
  personnes: [
    { membre: membre('Camille Ferrand'), question: 'Qu’est-ce qui vous a fait passer du conseil à la banque ?' },
    { membre: membre("Inès d'Aubrac"), question: 'À quoi ressemble une semaine de médecin du travail ?' },
    { membre: membre("Marie-Amélie de Lassalle-Vernadet d'Aubrac"), question: 'Que regardez-vous d’abord chez quelqu’un qui change de secteur ?' },
  ],
};

/** Réponse figée de GET /api/animation : les personnes qui animent le réseau. */
export const ANIMATION = [
  { prenom: 'Solène', nom: 'Vasseur', photo: PORTRAIT_C, role: 'Responsable du réseau' },
  { prenom: 'Karim', nom: 'Belhadj', photo: PORTRAIT_B, role: 'Rencontres et événements' },
  { prenom: 'Maud', nom: 'Le Goff', photo: PORTRAIT_A, role: 'Mentorat' },
];
`;

const FEMININS = ['Agathe', 'Aïssatou', 'Alix', 'Anaïs', 'Béatrice', 'Chloé', 'Clémence', 'Diane', 'Élodie', 'Fatou', 'Florence', 'Hélène', 'Imane', 'Jeanne', 'Joséphine', 'Leïla', 'Linh', 'Lucie', 'Margaux', 'Mathilde', 'Nadia', 'Océane', 'Pauline', 'Rosa', 'Salomé', 'Sarah', 'Sophie', 'Thaïs', 'Valentine', 'Yasmine'];
const MASCULINS = ['Adrien', 'Amadou', 'Antoine', 'Bastien', 'Cyril', 'Damien', 'Edgar', 'Étienne', 'Fabien', 'Gaspard', 'Gilles', 'Henri', 'Idriss', 'Joachim', 'Jules', 'Karim', 'Loïc', 'Malo', 'Marius', 'Mehdi', 'Nicolas', 'Octave', 'Paul-Émile', 'Raphaël', 'Rémi', 'Samuel', 'Théo', 'Tomas', 'Victor', 'Yann'];
const NOMS = ['Abadie', 'Alcaraz', 'Barrault', 'Beaulieu', 'Benali', 'Berthier', 'Bonnefoy', 'Bourgeon', 'Brisson', 'Carlier', 'Castaing', 'Chapuis', 'Cissé', 'Coudert', 'Darnaud', 'Delmotte', 'Diallo', 'Dubreuil', 'Esnault', 'Fauvel', 'Ferreira', 'Gaudin', 'Giraudet', 'Granier', 'Guillemot', 'Hadjadj', 'Hébrard', 'Jacquemin', 'Jourdain', 'Kerleroux', 'Lacombe', 'Lafont', 'Lemaître', 'Le Bihan', 'Lopez', 'Marchetti', 'Mercadier', 'Montagne', 'Nguyen', 'Noblet', 'Ollivier', 'Pasquier', 'Pelletan', 'Pinson', 'Quéméner', 'Rambaud', 'Rivoire', 'Rousselot', 'Sabatier', 'Salvador', 'Sauvage', 'Tanguy', 'Tessier', 'Traoré', 'Urvoy', 'Valadier', 'Verdier', 'Vidalenc', 'Weber', 'Zidi'];
const OUVERTURES = ['Parler de son métier', 'Relire un CV', 'Prendre un café', 'Accueillir en stage', 'Préparer un entretien', 'Partager une offre'];
/** Entreprise, groupe, villes, métiers au féminin puis au masculin. @type {[string, string, string[], [string, string][]][]} */
const ENTREPRISES = [
  ['Banque des Tilleuls', 'Finance', ['Lyon', 'Nantes', 'Lille'], [['Analyste crédit', 'Analyste crédit'], ['Conseillère en patrimoine', 'Conseiller en patrimoine'], ['Contrôleuse de gestion', 'Contrôleur de gestion']]],
  ['Assurances du Vieux Moulin', 'Finance', ['Nantes', 'Strasbourg'], [['Actuaire', 'Actuaire'], ['Gestionnaire de sinistres', 'Gestionnaire de sinistres'], ['Juriste', 'Juriste']]],
  ['Comptoir d’épargne de la Rade', 'Finance', ['Marseille', 'Toulouse'], [['Responsable d’agence', 'Responsable d’agence'], ['Auditrice interne', 'Auditeur interne']]],
  ['Cabinet Ardoise', 'Conseil', ['Bordeaux', 'Lyon'], [['Consultante en organisation', 'Consultant en organisation'], ['Cheffe de mission', 'Chef de mission']]],
  ['Groupe Hautes-Rives et Associés', 'Conseil', ['Bordeaux', 'Lille'], [['Consultante en stratégie', 'Consultant en stratégie'], ['Responsable des partenariats', 'Responsable des partenariats']]],
  ['Bureau Passerelle Nord', 'Conseil', ['Lille', 'Strasbourg'], [['Urbaniste', 'Urbaniste'], ['Ingénieure en mobilités', 'Ingénieur en mobilités']]],
  ['Clinique du Val Clair', 'Santé', ['Nantes', 'Rennes'], [['Infirmière', 'Infirmier'], ['Cadre de santé', 'Cadre de santé'], ['Kinésithérapeute', 'Kinésithérapeute']]],
  ['Officine des Halles', 'Santé', ['Lyon', 'Grenoble'], [['Pharmacienne', 'Pharmacien'], ['Préparatrice en pharmacie', 'Préparateur en pharmacie']]],
  ['Institut Sainte-Aure', 'Santé', ['Montpellier', 'Toulouse'], [['Biologiste', 'Biologiste'], ['Attachée de recherche clinique', 'Attaché de recherche clinique']]],
  ['Forges de la Combe', 'Industrie', ['Rennes', 'Grenoble'], [['Ingénieure méthodes', 'Ingénieur méthodes'], ['Responsable qualité', 'Responsable qualité']]],
  ['Électronique de la Vilaine', 'Industrie', ['Rennes', 'Toulouse'], [['Ingénieure en systèmes embarqués', 'Ingénieur en systèmes embarqués'], ['Acheteuse', 'Acheteur']]],
  ['Coopérative Les Semailles', 'Industrie', ['Lyon', 'Montpellier'], [['Cheffe de projet', 'Chef de projet'], ['Agronome', 'Agronome']]],
  ['Conserverie Quatre-Vents', 'Industrie', ['Nantes', 'Bordeaux'], [['Responsable logistique', 'Responsable logistique'], ['Cheffe de ligne', 'Chef de ligne']]],
  ['Verrerie de Montclar', 'Industrie', ['Strasbourg', 'Grenoble'], [['Designer produit', 'Designer produit'], ['Ingénieure matériaux', 'Ingénieur matériaux']]],
  ['Atelier Numérique du Port', 'Numérique', ['Marseille', 'Bordeaux'], [['Développeuse', 'Développeur'], ['Designer d’interface', 'Designer d’interface'], ['Cheffe de produit', 'Chef de produit']]],
  ['Studio Cerf-Volant', 'Numérique', ['Lille', 'Montpellier'], [['Intégratrice', 'Intégrateur'], ['Rédactrice d’interface', 'Rédacteur d’interface']]],
  ['Données de la Presqu’île', 'Numérique', ['Lyon', 'Toulouse'], [['Analyste de données', 'Analyste de données'], ['Ingénieure de données', 'Ingénieur de données']]],
  ['Éditions du Marque-Page', 'Culture', ['Bordeaux', 'Strasbourg'], [['Éditrice', 'Éditeur'], ['Correctrice', 'Correcteur']]],
  ['Théâtre du Quai Long', 'Culture', ['Marseille', 'Nantes'], [['Administratrice de production', 'Administrateur de production'], ['Régisseuse', 'Régisseur']]],
  ['Énergie des Crêtes', 'Énergie', ['Grenoble', 'Toulouse'], [['Ingénieure réseau', 'Ingénieur réseau'], ['Chargée d’affaires', 'Chargé d’affaires']]],
  ['Coopérative Marée Haute', 'Énergie', ['Rennes', 'Marseille'], [['Ingénieure en énergies marines', 'Ingénieur en énergies marines'], ['Responsable de site', 'Responsable de site']]],
];

/** Suite de nombres de [0, 1[ tirée d'une graine (mulberry32). @param {number} graine */
function suite(graine) {
  let a = graine;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Texte JavaScript entre apostrophes ; aucune chaîne tirée ne contient d'apostrophe droite. @param {string} s */
const citer = (s) => `'${s}'`;

/** Le texte du fichier. */
export function texteMembres() {
  const hasard = suite(GRAINE);
  /** @template T @param {T[]} l @returns {T} */
  const un = (l) => l[Math.floor(hasard() * l.length)];
  const pris = new Set([...TETE.matchAll(/\bnom: (['"])(.+?)\1/g)].map((m) => m[2]));
  const nombreEnTete = pris.size;
  const reserves = ['Solène Vasseur', 'Karim Belhadj', 'Maud Le Goff'];
  /** @type {string[]} */
  const lignes = [];
  while (lignes.length < TOTAL - nombreEnTete) {
    const f = hasard() < 0.5;
    const nom = `${un(f ? FEMININS : MASCULINS)} ${un(NOMS)}`;
    const [societe, groupe, villes, metiers] = un(ENTREPRISES);
    const poste = un(metiers)[f ? 0 : 1];
    const ville = un(villes);
    const photo = hasard();
    const aGroupe = hasard() < 0.9;
    const promo = hasard() < 0.92 ? `Promo ${2005 + Math.floor(hasard() * 20)}` : null;
    const combien = hasard() < 0.25 ? 0 : 1 + Math.floor(hasard() * 3);
    const ouvertures = OUVERTURES.filter(() => hasard() < 0.5).slice(0, combien);
    if (pris.has(nom) || reserves.includes(nom)) continue;
    pris.add(nom);
    const champs = [
      `nom: ${citer(nom)}`,
      ...(photo < 0.6 ? [`photo: PORTRAIT_${'ABC'[Math.floor(photo * 5)]}`] : photo < 0.64 ? ['photo: PHOTO_PERDUE'] : []),
      `poste: ${citer(poste)}`,
      `entreprise: entreprise(${citer(societe)})`,
      `ville: ${citer(ville)}`,
      ...(aGroupe ? [`groupe: ${citer(groupe)}`] : []),
      ...(promo ? [`promo: ${citer(promo)}`] : []),
      ...(ouvertures.length ? [`ouvertures: [${ouvertures.map(citer).join(', ')}]`] : []),
    ];
    lignes.push(`  { ${champs.join(', ')} },\n`);
  }
  return `${TETE}${lignes.join('')}${PIED}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const texte = texteMembres();
  const inchange = readFileSync(FICHIER, 'utf8') === texte;
  if (!inchange) writeFileSync(FICHIER, texte);
  console.log(`membres : ${TOTAL}, ${inchange ? 'fichier inchangé' : 'fichier écrit'}`);
}
