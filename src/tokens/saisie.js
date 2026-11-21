// @ts-check
/**
 * Saisie d'une marque (docs/attendus/etape-4-contrat-de-marque.md).
 *
 * Entrée (tokens/<marque>/entree.json) :
 *   name         texte, obligatoire ;
 *   primary      couleur #rrggbb (échelle générée par generateScale) ou { "scale": nom } (échelle existante, écrite à la
 *                main dans primitives.tokens.json du dossier de la marque, D25) ;
 *   accent       facultatif, même forme ; absent : repli sur le neutre (D05) ;
 *   fonts        { heading, body?: [familles] } ; heading : [familles], noms seulement, police « non contrôlée », ou
 *                { families: [...], files: [chemins] }, fichiers relatifs à l'entrée, lus par src/polices/ ;
 *                body facultatif : absent, la police du produit (tokens/commun/police.tokens.json) ;
 *   description  facultative, $description de marque.tokens.json.
 * Clés en anglais (D62) ; les messages restent en français et citent la clé.
 *
 * Motifs de refus : entrée invalide ; checkValise en échec sur les échelles générées ; paire de rôles en échec ;
 * police des titres donnée par ses fichiers qui échoue à un garde-fou (src/polices/garde-fous.js), ou dont
 * l'encre de deux lignes se touche sur un style de titre (controlerEncre, dans Chromium, lancé par la commande).
 * checkValise et le contraste sont contrôlés dans les deux modes ; chaque motif dit son mode en français, (clair) ou (sombre),
 * pour les contextes light et dark du resolver.
 * Les couches communes (neutres, statuts, rôles, paires) sont lues dans tokens/commun/ ; la saisie écrit aussi le resolver
 * de la marque (marque.resolver.json, src/tokens/resolver.js).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { lirePolice } from '../polices/lecture.js';
import { gardeFous } from '../polices/garde-fous.js';
import { mesurerEncre, lignesEncre, motifsEncre, PoliceRefusee } from '../polices/encre.js';
import { typo, SUR_POLICE_TITRE } from './typo.js';
import { generateScale, checkValise } from '../valise/generate.js';
import { scaleToDtcg, valiseFromTokens, OPTIONS_COULEUR_SOMBRE } from './primitives.js';
import { marqueTokens, marqueSombreTokens } from './pleins.js';
import { contratRoles, contrat, resolveRoles, rolesDuResolver } from './roles.js';
import { COMMUN, RESOLVER, modeleResolver, resoudre, partager, enLigne, enEtroit, seuilEtroit } from './resolver.js';
import { fr } from '../lib/format.js';

export { COMMUN };
const CLES = ['name', 'description', 'primary', 'accent', 'fonts'];
const STATUTS = ['error', 'success', 'warning', 'info'];
const HEX = /^#[0-9a-f]{6}$/i;
const LABELS = { primary: 'Primaire', accent: 'Accent' };

/** Échelles écrites à la main d'une marque, dans son dossier (D25). */
const PROPRES = 'primitives.tokens.json';
/** Mot français d'un contexte de mode, dans les motifs. */
const MOT = /** @type {const} */ ({ light: 'clair', dark: 'sombre' });

/**
 * Fonds clairs communs sur lesquels le texte de marque des grands titres doit tenir 3:1 :
 * hex de background.app, background.surface et background.subtle, résolus dans les couches communes.
 * @param {import('./roles.js').RoleSet} commun
 */
export function fondsClairs(commun) {
  const f = commun.semantique.background;
  const roles = resolveRoles({ background: { $type: 'color', app: f.app, surface: f.surface, subtle: f.subtle } }, commun.primitives);
  return ['background.app', 'background.surface', 'background.subtle'].map((r) => /** @type {any} */ (roles.get(r)).hex);
}

/**
 * Couches communes seules, sans marque, dans un contexte : le resolver d'une marque sans fichier de marque.
 * @param {{ mode?: string }} [opts] @returns {import('./roles.js').RoleSet}
 */
export function chargerCommun({ mode } = {}) {
  const r = resoudre(modeleResolver({ nom: 'commun', marque: [], dossier: COMMUN }), COMMUN, mode ? { mode } : {});
  const { semantique, primitives, marque } = partager(r);
  return { primitives, semantique, paires: JSON.parse(readFileSync(join(COMMUN, 'paires.json'), 'utf8')), marque, echelles: [] };
}

/**
 * D25 : échelles écrites à la main dans le dossier d'une marque (primitives.tokens.json), ou null.
 * Seules ces échelles se nomment dans une entrée ({ "scale": nom }) ; la règle vaut pour toutes les marques.
 * @param {string} dossier @returns {any}
 */
export const echellesPropres = (dossier) => (existsSync(join(dossier, PROPRES)) ? JSON.parse(readFileSync(join(dossier, PROPRES), 'utf8')) : null);

/**
 * D25 : échelles de primitives.tokens.json d'une marque qui portent le nom d'une échelle commune
 * (primitives et statuts de tokens/commun/). Une marque ne redéfinit pas une échelle commune : le resolver la ferait passer
 * avant le mode sombre commun, la saisie après ; refus de la saisie, échec de npm run contraste.
 * @param {any} propres echellesPropres(dossier) @param {import('./roles.js').RoleSet} [commun] @returns {string[]}
 */
export function echellesCommunesRedefinies(propres, commun = chargerCommun()) {
  const communes = new Set(Object.keys(commun.primitives.color ?? {}).filter((k) => !k.startsWith('$')));
  return Object.keys(propres?.color ?? {}).filter((k) => !k.startsWith('$') && communes.has(k));
}

/** Motif de refus, ligne d'échec de contraste. @param {string[]} noms */
export const motifRedefinies = (noms) =>
  `${PROPRES} : échelle commune redéfinie, ${noms.join(', ')} (les échelles communes se lisent dans tokens/commun/ ; ${noms.length > 1 ? 'renomme-les' : 'renomme-la'} dans le dossier de la marque)`;

/**
 * D31 : contrôle final de la saisie, sur les fichiers écrits à côté avant remplacement (remplacer,
 * src/tokens/ecriture.js) : relus, résolus par le resolver écrit, dans les deux modes, avec les paires communes, comme
 * npm run contraste. Une paire en échec est une incohérence de l'outil (la marque l'avait passée en mémoire) : panne.
 * @param {string} dossier @param {Map<string, string>} lus texte relu de chaque fichier écrit, par nom
 * @returns {[string, ReturnType<typeof contrat>][]}
 */
export function controlerEcrits(dossier, lus) {
  /** @type {Record<string, any>} */
  const docs = Object.fromEntries([...lus].map(([nom, texte]) => [nom, JSON.parse(texte)]));
  const resolver = docs[RESOLVER];
  if (!resolver) throw new Error(`contrôle final : ${RESOLVER} absent des fichiers écrits`);
  const paires = JSON.parse(readFileSync(join(COMMUN, 'paires.json'), 'utf8'));
  return ['light', 'dark'].map((mode) => {
    const c = contrat(rolesDuResolver(enLigne(resolver, docs), dossier, { mode }, paires));
    if (c.roles.fails.length)
      throw new Error(`incohérence de l'outil : le contrôle final (${MOT[mode]}) trouve une paire en échec que la saisie avait acceptée ; rien n'est écrit dans ${dossier}`);
    return [mode, c];
  });
}

/**
 * Contexte étroit commun, lu par le resolver des couches communes (contexte et seuil),
 * pour typo(), qui l'exige.
 * @param {import('./roles.js').RoleSet} commun
 */
function etroitCommun(commun) {
  const r = resoudre(modeleResolver({ nom: 'commun', marque: [], dossier: COMMUN }), COMMUN, { width: 'narrow' });
  const contexte = r.sources.filter((x) => x.ensemble === 'width:narrow').map((x) => x.doc);
  return { semantique: enEtroit(commun.semantique, contexte), ...seuilEtroit(r) };
}

/**
 * Graisses demandées par les styles sur la police des titres (affichage, titres 1 à 3), lues dans les rôles.
 * @param {import('./roles.js').RoleSet} commun @returns {number[]}
 */
export function graissesTitres(commun) {
  const { styles } = typo(commun.semantique, commun.primitives, commun.marque, etroitCommun(commun));
  return [...new Set(styles.filter((s) => SUR_POLICE_TITRE.includes(s.style)).map((s) => s.graisse))].sort((a, b) => a - b);
}

/**
 * Styles sur la police des titres, en large et en étroit (contexte étroit commun), avec leur consigne.
 * @param {import('./roles.js').RoleSet} commun @returns {import('../polices/encre.js').StyleTitre[]}
 */
export function stylesTitres(commun) {
  const { styles } = typo(commun.semantique, commun.primitives, commun.marque, etroitCommun(commun));
  return styles
    .filter((s) => SUR_POLICE_TITRE.includes(s.style))
    .flatMap((s) =>
      /** @type {['large' | 'étroit', import('./typo.js').Mesure | null][]} */ ([['large', s.large], ['étroit', s.etroit]])
        .filter(([, m]) => m)
        .map(([largeur, m]) => {
          const x = /** @type {import('./typo.js').Mesure} */ (m);
          if (x.hauteurCapitale === null) throw new Error(`${s.style} en ${largeur} : consigne absente`);
          return { style: s.style, largeur, taille: x.taille, ligne: Math.round(x.ligne * 100) / 100, graisse: s.graisse, consigne: x.hauteurCapitale };
        }),
    );
}

/**
 * Contrôle d'encre d'une police des titres donnée par ses fichiers, dans Chromium.
 * À lancer après saisir(), quand la marque n'a pas d'autre motif : les garde-fous ont déjà vérifié le format, les
 * graisses et la hauteur de capitale.
 * @param {PoliceTitre} policeTitre
 * @param {{ dossier: string, commun?: import('./roles.js').RoleSet, styles?: import('../polices/encre.js').StyleTitre[] }} opts
 * @returns {Promise<{ lignes: import('../polices/encre.js').LigneEncre[], motifs: string[] }>}
 */
export async function controlerEncre(policeTitre, { dossier, commun = chargerCommun(), styles = stylesTitres(commun) }) {
  const lisibles = policeTitre.fichiers.flatMap((f) => (f.police.lisible ? [{ chemin: f.chemin, police: f.police }] : []));
  const premiere = lisibles[0]?.police;
  if (!premiere) return { lignes: [], motifs: ['police des titres : aucun fichier lisible pour le contrôle d\'encre'] };
  const consignes = [...new Set(styles.map((s) => s.consigne))];
  if (consignes.length !== 1) throw new Error(`consignes différentes : ${consignes.join(', ')}`);
  const graisses = [...new Set(styles.map((s) => s.graisse))].sort((a, b) => a - b);
  let mesures;
  try {
    mesures = await mesurerEncre(
      lisibles.map((f) => ({ octets: readFileSync(resolve(dossier, f.chemin)), graisses: f.police.graisses })),
      graisses,
      consignes[0],
    );
  } catch (e) {
    // D18 : un fichier que le navigateur refuse de charger est un refus ; Chromium qui ne se lance pas, ou toute autre
    // erreur de mesure, est une panne.
    if (e instanceof PoliceRefusee) return { lignes: [], motifs: [`police des titres : ${e.message}`] };
    throw e;
  }
  const lignes = lignesEncre(mesures, styles, premiere);
  return { lignes, motifs: motifsEncre(lignes).map((m) => `police des titres : ${m}`) };
}

/** Texte du fichier de jetons, tel qu'il est écrit sur le disque. @param {any} tokens */
export const serialiser = (tokens) => JSON.stringify(tokens, null, 2) + '\n';

/**
 * @typedef {{ scale: string, steps: string[] }} Source
 * @typedef {{ chemin: string, police: import('../polices/lecture.js').Police | import('../polices/lecture.js').Illisible }} FichierPolice
 * @typedef {{ familles: string[], controlee: boolean, fichiers: FichierPolice[] }} PoliceTitre
 * @typedef {{ motifs: string[], marque: any, echelles: any, echellesSombres: any, marqueSombre: any, resolver: any, commun: import('./roles.js').RoleSet, policeTitre: PoliceTitre | null,
 *   contrats: Record<string, ReturnType<typeof contratRoles>> | null }} Saisie
 */

/**
 * Saisie d'une marque, sans rien écrire. Une marque est acceptée si `motifs` est vide.
 * @param {any} entree contenu de entree.json
 * La saisie génère aussi le mode sombre de la marque (échelles en miroir depuis le pas 9, couche marque
 * sombre) ; checkValise en échec sur une échelle sombre est un motif de refus.
 * @param {{ dossier: string, commun?: import('./roles.js').RoleSet, communSombre?: import('./roles.js').RoleSet }} opts dossier de la
 *   marque ; couches communes, en clair et en sombre
 * @returns {Saisie}
 */
export function saisir(entree, { dossier, commun = chargerCommun(), communSombre = chargerCommun({ mode: 'dark' }) }) {
  /** @type {string[]} */
  const motifs = [];
  const invalide = (/** @type {string} */ m) => motifs.push(`entrée invalide : ${m}`);
  const vide = { motifs, marque: null, echelles: null, echellesSombres: null, marqueSombre: null, resolver: null, commun, policeTitre: null, contrats: null };
  if (!entree || typeof entree !== 'object' || Array.isArray(entree)) {
    invalide('objet JSON attendu');
    return vide;
  }
  for (const k of Object.keys(entree)) if (!CLES.includes(k)) invalide(`clé inconnue ${k}`);
  if (!(typeof entree.name === 'string' && entree.name.trim())) invalide('clé name absente');
  if (entree.primary === undefined) invalide('clé primary absente');
  if (entree.fonts === undefined) invalide('clé fonts absente');
  if ('description' in entree && typeof entree.description !== 'string') invalide('description, texte attendu');

  const propres = echellesPropres(dossier);
  // D25 : une marque ne redéfinit aucune échelle commune.
  const redefinies = echellesCommunesRedefinies(propres, commun);
  if (redefinies.length) {
    motifs.push(motifRedefinies(redefinies));
    return vide;
  }
  /** @type {Record<string, any>} */
  const nommables = propres?.color ?? {};
  /** @type {Record<string, ReturnType<typeof generateScale>>} */
  const generees = {};
  /** @param {'primary' | 'accent'} slot @returns {Source | undefined} */
  const source = (slot) => {
    const v = entree[slot];
    if (v === undefined) return undefined;
    if (typeof v === 'string' && HEX.test(v)) {
      generees[slot] = generateScale(slot, v.toLowerCase());
      return { scale: slot, steps: generees[slot].steps };
    }
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 1 && typeof v.scale === 'string') {
      if (!propres) return void invalide(`${slot}, échelle existante : aucune échelle écrite à la main dans le dossier de la marque (${PROPRES})`);
      const g = v.scale.startsWith('$') ? null : nommables[v.scale];
      if (!g?.['1'] || !g?.['12']) return void invalide(`${slot}, échelle inconnue ${v.scale}`);
      return { scale: v.scale, steps: Array.from({ length: 12 }, (_, i) => g[String(i + 1)].$value.hex) };
    }
    return void invalide(`${slot}, couleur #rrggbb ou { "scale": nom } attendue`);
  };
  const primaire = source('primary');
  const accent = source('accent');
  /** @type {{ titre: string[], texte?: string[], fichiersTitre?: string[] } | undefined} */
  let polices;
  /** @type {PoliceTitre | null} */
  let policeTitre = null;
  if (entree.fonts !== undefined) {
    const p = entree.fonts;
    const familles = (/** @type {any} */ l) => Array.isArray(l) && l.length > 0 && l.every((x) => typeof x === 'string' && x.trim());
    if (!p || typeof p !== 'object' || Array.isArray(p)) invalide('fonts, { "heading": [...] } attendu, "body" facultatif');
    else {
      for (const k of Object.keys(p)) if (k !== 'heading' && k !== 'body') invalide(`clé inconnue fonts.${k}`);
      // La police des titres s'entre par ses noms (non contrôlée) ou par ses noms et ses fichiers.
      const t = p.heading;
      if (t && typeof t === 'object' && !Array.isArray(t)) {
        const avant = motifs.length;
        for (const k of Object.keys(t)) if (k !== 'families' && k !== 'files') invalide(`clé inconnue fonts.heading.${k}`);
        if (!familles(t.families)) invalide('fonts.heading.families, liste de noms de familles attendue');
        if (!familles(t.files)) invalide('fonts.heading.files, liste de chemins attendue');
        else
          for (const chemin of t.files)
            if (!existsSync(resolve(dossier, chemin))) invalide(`fonts.heading, fichier introuvable : ${chemin}`);
        if (motifs.length === avant) {
          /** @type {FichierPolice[]} */
          const fichiers = [];
          for (const chemin of t.files)
            try {
              fichiers.push({ chemin, police: lirePolice(readFileSync(resolve(dossier, chemin))) });
            } catch (e) {
              motifs.push(`police des titres illisible : ${chemin} (${/** @type {Error} */ (e).message})`);
            }
          policeTitre = { familles: t.families, controlee: true, fichiers };
          for (const m of gardeFous(fichiers, graissesTitres(commun))) motifs.push(`police des titres : ${m}`);
        }
      } else if (!familles(t)) invalide('fonts.heading, liste de noms de familles attendue');
      else policeTitre = { familles: t, controlee: false, fichiers: [] };
      if ('body' in p && !familles(p.body)) invalide('fonts.body, liste de noms de familles attendue');
      if (policeTitre && (!('body' in p) || familles(p.body)))
        polices = {
          titre: policeTitre.familles,
          ...('body' in p ? { texte: p.body } : {}),
          ...(policeTitre.controlee ? { fichiersTitre: policeTitre.fichiers.map((f) => f.chemin) } : {}),
        };
    }
  }
  if (motifs.length || !primaire || !polices) return { ...vide, policeTitre };

  /** @param {string} s @returns {Source} */
  const commune = (s) => ({ scale: s, steps: Array.from({ length: 12 }, (_, i) => commun.primitives.color[s][String(i + 1)].$value.hex) });
  /** Pas d'une échelle commune en mode sombre. @param {string} s */
  const communeSombre = (s) => Array.from({ length: 12 }, (_, i) => communSombre.primitives.color[s][String(i + 1)].$value.hex);
  const noms = Object.keys(generees);
  /** @type {any} */
  let echelles = null;
  if (noms.length) {
    /** @type {Record<string, any>} */
    const couleur = { $type: 'color', $description: `Échelles générées de ${entree.name} (generateScale, src/valise/generate.js), pas 9 = couleur saisie.` };
    for (const n of noms) couleur[n] = scaleToDtcg(generees[n], `${LABELS[/** @type {'primary' | 'accent'} */ (n)]} de ${entree.name}`);
    echelles = {
      $description: `Échelles de ${entree.name}, écrites par la saisie depuis entree.json. Format DTCG 2025.10. Lues avec les couches communes de tokens/commun/.`,
      color: couleur,
    };
    for (const f of checkValise(valiseFromTokens(echelles))) motifs.push(`checkValise (clair) : ${f}`);
  }
  const marque = marqueTokens({
    primaire,
    accent: accent ?? commune('neutral'),
    statuts: Object.fromEntries(STATUTS.map((s) => [s, commune(s)])),
    polices,
    fonds: fondsClairs(commun),
    description:
      entree.description ??
      `Emplacements de marque de ${entree.name}, écrits par la saisie depuis entree.json. Format DTCG 2025.10. Les rôles de semantique.tokens.json pointent vers brand.<emplacement>.* ; chaque emplacement pointe vers une échelle (${noms.length ? 'générées dans echelles.tokens.json, ' : ''}communes dans tokens/commun/), et ses pleins suivent la règle en trois cas (sombre, moyen, clair) lue sur le pas 9.${accent ? '' : ' Sans accent saisi : repli sur le neutre (D05).'}`,
  });
  // Mode sombre : échelles en miroir du primaire et de l'accent, depuis leur pas 9, sous le même nom.
  /** @type {Record<string, any>} */
  const couleurSombre = {
    $type: 'color',
    $description: `Échelles de ${entree.name} en mode sombre (generateScale, fond sombre [H]), pas 9 = pas 9 clair ; même nom que l'échelle claire, qu'elles remplacent dans le contexte sombre.`,
  };
  /** @type {Record<string, string[]>} */
  const sombres = {};
  for (const [slot, src] of /** @type {const} */ ([['primary', primaire], ['accent', accent]])) {
    if (!src) continue;
    const g = generateScale(src.scale, src.steps[8], OPTIONS_COULEUR_SOMBRE);
    sombres[slot] = g.steps;
    couleurSombre[src.scale] = scaleToDtcg(g, `${LABELS[slot]} de ${entree.name}`);
  }
  const echellesSombres = {
    $description: `Échelles de ${entree.name} en mode sombre, écrites par la saisie depuis entree.json. Format DTCG 2025.10. Lues dans le contexte sombre de marque.resolver.json, après tokens/commun/mode.sombre.tokens.json.`,
    color: couleurSombre,
  };
  for (const f of checkValise(valiseFromTokens(echellesSombres))) motifs.push(`checkValise (sombre) : ${f}`);
  const marqueSombre = marqueSombreTokens({
    marque,
    clairs: {
      primary: primaire.steps,
      accent: (accent ?? commune('neutral')).steps,
      ...Object.fromEntries(STATUTS.map((s) => [s, commune(s).steps])),
    },
    echelles: { primary: primaire.scale, ...Object.fromEntries(STATUTS.map((s) => [s, s])) },
    // Pas sombres des emplacements à bouton, pour leur survol (D45) : primaire généré ici, statuts communs.
    sombres: { primary: sombres.primary, ...Object.fromEntries(STATUTS.map((s) => [s, communeSombre(s)])) },
    primaireSombre: { scale: primaire.scale, steps: sombres.primary },
    fonds: fondsClairs(communSombre),
    description: `Couche marque de ${entree.name} en mode sombre, écrite par la saisie. Format DTCG 2025.10. Posée sur marque.tokens.json dans le contexte sombre : les boutons prennent la version lumineuse de la couleur (pas 11 de l'échelle sombre, survol calculé, D04 et D45), l'aplat plein garde ses valeurs claires, le texte de marque des grands titres est choisi sur l'échelle sombre.`,
  });
  const resolver = modeleResolver({
    nom: entree.name,
    dossier,
    marque: [...(propres ? [PROPRES] : []), ...(echelles ? ['echelles.tokens.json'] : []), 'marque.tokens.json'],
    sombre: ['echelles.sombre.tokens.json', 'marque.sombre.tokens.json'],
  });
  // Contraste dans les deux modes : chaque motif dit son mode. D31 : la fusion est celle du
  // resolver de la marque (rolesDuResolver, comme les contrôles), ses fichiers donnés en ligne, avant toute écriture.
  const docs = { [PROPRES]: propres, 'echelles.tokens.json': echelles, 'marque.tokens.json': marque, 'echelles.sombre.tokens.json': echellesSombres, 'marque.sombre.tokens.json': marqueSombre };
  /** @type {Record<string, ReturnType<typeof contratRoles>>} */
  const contrats = {};
  // D18 : une paire sous son seuil est un refus ; un contrat qui ne se calcule pas (paire
  // vers un rôle inconnu, type inconnu : couche commune cassée) est une panne, qui lève.
  for (const [mode, paires] of /** @type {const} */ ([['light', commun.paires], ['dark', communSombre.paires]])) {
    /** @type {ReturnType<typeof contratRoles>} */
    let c;
    try {
      c = contratRoles(rolesDuResolver(enLigne(resolver, docs), dossier, { mode }, paires));
    } catch (e) {
      throw new Error(`contraste (${MOT[mode]}) : ${/** @type {Error} */ (e).message}`);
    }
    contrats[mode] = c;
    for (const p of c.fails) motifs.push(`contraste (${MOT[mode]}) : ${p.devant} sur ${p.fond}, ${fr(p.ratio, { decimales: 2, zeros: true })}:1 < ${fr(p.min)}:1`);
  }
  return { motifs, marque, echelles, echellesSombres, marqueSombre, resolver, commun, policeTitre, contrats };
}
