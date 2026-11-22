// Réponse figée de l'API des membres (GET /api/membres), dans l'ordre où l'API les rend. Personnes, entreprises et
// groupes inventés ; les portraits sont dessinés, sans personne réelle. Un champ absent n'est pas connu.

/** @param {string} fond @param {string} visage @param {string} vetement @param {string} cheveux */
const portrait = (fond, visage, vetement, cheveux) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${fond}"/><circle cx="60" cy="50" r="22" fill="${visage}"/><path d="M18 120 Q22 82 60 80 Q98 82 102 120z" fill="${vetement}"/><path d="M36 52 Q34 24 60 24 Q86 24 84 52 Q80 34 60 34 Q40 34 36 52z" fill="${cheveux}"/></svg>`,
  )}`;
const PORTRAIT_A = portrait('#7a9e9f', '#f1d9c4', '#3d5a6c', '#5b3a29');
const PORTRAIT_B = portrait('#c9b28f', '#e8c3a0', '#6b4f7a', '#2f2a26');
const PORTRAIT_C = portrait('#9fb39a', '#c99a77', '#8a3b3b', '#1f1b18');
/** Une photo que le serveur ne rend plus. */
const PHOTO_PERDUE = 'data:image/png;base64,AAAA';

/** @param {string} texte */
const slug = (texte) =>
  texte
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** @param {string} nom */
const entreprise = (nom) => ({ nom, lien: `/entreprises/${slug(nom)}` });

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
];

/** Les dix membres : chacun avec le lien de son profil et celui pour lui écrire. */
export const MEMBRES = brut.map((m) => ({ ...m, profil: `/membres/${slug(m.nom)}`, ecrire: `/messages/nouveau?a=${slug(m.nom)}` }));
