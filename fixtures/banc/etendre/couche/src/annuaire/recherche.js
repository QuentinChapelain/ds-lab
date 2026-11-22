// La recherche de l'annuaire : les membres qui contiennent chaque mot tapé, accents et casse ignorés.

/** @param {string} texte */
const simple = (texte) => texte.normalize('NFD').replace(/\p{M}/gu, '').replace(/[’']/g, ' ').toLowerCase();

/** Ce où l'on cherche. @param {any} m */
const texteDe = (m) => simple([m.nom, m.poste, m.entreprise.nom, m.ville, m.promo ?? '', ...(m.ouvertures ?? [])].join(' '));

/** @param {any[]} membres @param {string} demande */
export function chercher(membres, demande) {
  const mots = simple(demande).split(/\s+/).filter(Boolean);
  return membres.filter((m) => {
    const texte = texteDe(m);
    return mots.every((mot) => texte.includes(mot));
  });
}

/** Combien la liste en montre. */
export const MONTRES = 25;

/** Ce que dit la page du nombre de membres. @param {number} trouves @param {number} total @param {string} demande */
export function compte(trouves, total, demande) {
  if (trouves === 0) return `Aucun membre ne correspond à « ${demande.trim()} ».`;
  const recherche = demande.trim() !== '';
  if (trouves > MONTRES) return recherche ? `Les ${MONTRES} premiers sur ${trouves} membres trouvés.` : `Les ${MONTRES} premiers sur ${total} membres.`;
  return `${trouves} ${trouves > 1 ? 'membres' : 'membre'} sur ${total}.`;
}
