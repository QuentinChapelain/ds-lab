// @ts-check
/**
 * Le parcours (D72, docs/attendus/parcours.md) : projet, état calculé depuis les sorties, page, terminal, serveur.
 *
 * Projets : fixtures/parcours/<moment>/, extraits de sorties réelles produites le 24/11/2026 sur Orbe Café et les
 * marques de tokens/ (fixtures/parcours/README.md). Valeurs attendues écrites à la main d'après ces sorties :
 *   constat d'Orbe Café (chiffres de constat.json) : 30 éléments, 3 types, 11 versions ; versions à garder 0 sur 3 ;
 *   Écume et Sel : 27, 7, 12, 0 sur 7 ; Brume : 7, 3, 5, 0 sur 3 ;
 *   table de « decisions » : 14 lignes de classe décision (2 + 6 + 1 + 5, comptées dans table.json), dont aucune dans la
 *   carte de plein, et une carte (plein|terre) : 15 ; tranchées par decisions.json (copie de decisions-valise.json) :
 *   8, comptées par les clés famille|valeur|usage, famille|valeur|usage sans relation et famille|valeur ;
 *   table du bilan, summary : couleurs 31 → 17, espacements 16 → 7, tailles de texte 13 → 8 ;
 *   verdict du bilan : 54 lignes, toutes « arrivée », 3 pages, sortie 0, dossier 2026-11-24T1336 ;
 *   saisie de Brume (#00ccff) : refusée, « checkValise (clair) : primary : doublon, pas 7 = pas 9 (#00ccff) ».
 *
 *   PC1 projet illisible : un message d'une ligne qui nomme la cause, sortie 2
 *   PC2 l'état des sept projets : temps, étape en cours, main, action, commande, faits, moment, écran, phrase
 *   PC3 règles d'étape construites en mémoire : décisions lues ou non, verdict en 1, entrée changée, le plus récent
 *   PC4 accord au nombre et mots : aucun « (s) », « 1 sites », « client », « plateforme » ni « conforme »
 *   PC5 la page : quatre temps, un moment de 60 mots au plus hors du cadre, un seul « Tout le parcours », fermé
 *   PC6 aucune valeur visuelle en dur : hors des jetons générés, des variables, des mots-clés, 0 et 100 %
 *   PC7 déterminisme, sans script ni attribut style, bloc sombre
 *   PC8 la commande : page écrite, terminal
 *   PC9 le serveur : page à jour, écrans montés, chemins hors racine refusés, 127.0.0.1 seulement
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireProjet } from '../src/parcours/projet.js';
import { calculerEtat, lignesTerminal, plusRecent } from '../src/parcours/etat.js';
import { pageDuParcours, DEBUT_JETONS, FIN_JETONS } from '../src/parcours/page.js';
import { servir } from '../src/parcours/serveur.js';
import { flattenTokens, resoudreAlias } from '../src/tokens/roles.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FIX = join(ROOT, 'fixtures', 'parcours');
const MOMENTS = ['lancement', 'constat', 'marque', 'decisions', 'livraison', 'bilan', 'plusieurs'];
/** @param {string} m */
const etat = (m) => calculerEtat(lireProjet(join(FIX, m, 'projet.json')), { base: ROOT });
/** @param {string} m */
const copie = (m) => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'ds-lab-parcours-')));
  cpSync(join(FIX, m), d, { recursive: true });
  return d;
};
/** @param {string[]} args @param {string} [cwd] */
const run = (args, cwd = ROOT) => spawnSync(process.execPath, [join(ROOT, 'src/cli/parcours.js'), ...args], { cwd, encoding: 'utf8' });
/** @param {any} contenu */
const projetEcrit = (contenu) => {
  const d = mkdtempSync(join(tmpdir(), 'ds-lab-parcours-'));
  writeFileSync(join(d, 'projet.json'), typeof contenu === 'string' ? contenu : JSON.stringify(contenu));
  return join(d, 'projet.json');
};
const SITE = { id: 'orbe', url: 'http://127.0.0.1:4173', pages: ['/a.html'] };

test('PC1 projet illisible : un message d’une ligne qui nomme la cause, sortie 2', () => {
  /** @type {[any, RegExp][]} */
  const cas = [
    ['{', /JSON illisible/],
    [[], /un objet JSON est attendu/],
    [{ product: 'P', sites: [SITE], outputs: 's', site: 1 }, /clé inconnue site/],
    [{ sites: [SITE], outputs: 's' }, /clé product absente ou vide/],
    [{ product: 'P', sites: [], outputs: 's' }, /clé sites absente ou vide/],
    [{ product: 'P', sites: [SITE] }, /clé outputs absente ou vide/],
    [{ product: 'P', sites: [{ ...SITE, url: 'ftp://x' }], outputs: 's' }, /sites\[1\]\.url : adresse http ou https attendue/],
    [{ product: 'P', sites: [{ ...SITE, id: 'Orbe Café' }], outputs: 's' }, /sites\[1\]\.id : minuscules, chiffres et tirets attendus/],
    [{ product: 'P', sites: [{ ...SITE, pages: ['a.html'] }], outputs: 's' }, /sites\[1\]\.pages/],
    [{ product: 'P', sites: [SITE, SITE], outputs: 's' }, /id en double : orbe/],
  ];
  for (const [contenu, motif] of cas) assert.throws(() => lireProjet(projetEcrit(contenu)), motif, JSON.stringify(contenu));
  const r = run([projetEcrit({ product: 'P', sites: [SITE, SITE], outputs: 's' })]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^parcours : .*id en double : orbe\n$/);
  assert.equal(run([join(FIX, 'absent.json')]).status, 2);
  assert.equal(run([]).status, 2);
  assert.equal(run([join(FIX, 'bilan', 'projet.json'), '--port', '4400']).status, 2, '--port sans --servir');
  // Une sortie illisible est une panne qui la nomme.
  const d = copie('constat');
  writeFileSync(join(d, 'sorties/composants/orbe/127.0.0.1_4173/2026-11-24T1330/constat.json'), '{');
  const r2 = run([join(d, 'projet.json')]);
  assert.equal(r2.status, 2);
  assert.match(r2.stderr, /constat\.json : JSON illisible/);
});

test('PC2 l’état des sept projets, depuis leurs sorties', () => {
  /** @param {string} m */
  const resume = (m) => {
    const e = etat(m);
    return {
      temps: e.temps.map((t) => t.etat),
      courante: `${e.courante.temps} · ${e.courante.nom}`,
      main: e.courante.main,
      action: e.courante.action,
      moment: e.moment,
      ecran: e.ecran && { href: e.ecran.href, precedente: e.ecran.precedente },
      phrase: e.phrase,
    };
  };
  assert.deepEqual(resume('lancement'), {
    temps: ['en cours', 'à venir', 'à venir', 'à venir'],
    courante: 'Mesurer · Site',
    main: 'designer',
    action: 'choisir une page par modèle de page et l’écrire dans projet.json',
    moment: 'lancement',
    ecran: null,
    phrase: 'Un geste, quatre temps, trois portes.',
  });
  assert.deepEqual(resume('constat'), {
    temps: ['faite', 'en cours', 'à venir', 'à venir'],
    courante: 'Décider · Marque',
    main: 'outil',
    action: 'saisir la marque',
    moment: 'ecran',
    ecran: { href: '/sorties/composants/orbe/127.0.0.1_4173/2026-11-24T1330/constat.html', precedente: true },
    phrase: 'On mesure ce qui s’affiche vraiment, pas ce que le code contient.',
  });
  assert.equal(
    etat('constat').courante.commande,
    'npm run saisie -- fixtures/parcours/constat/marques/orbe/entree.json --verdict fixtures/parcours/constat/sorties/saisies/orbe.json && node src/cli/planche.js --marque fixtures/parcours/constat/marques/orbe',
  );
  assert.deepEqual(etat('constat').etapes[1].lignes, ['30 éléments, 3 types, 11 versions ; versions choisies : 0 sur 3']);
  assert.deepEqual(resume('marque'), {
    temps: ['faite', 'en cours', 'à venir', 'à venir'],
    courante: 'Décider · Décisions',
    main: 'outil',
    action: 'lancer la réduction',
    moment: 'ecran',
    ecran: { href: '/marques/orbe/roles.html', precedente: true },
    phrase: 'Une couleur de marque devient douze pas. Le pas 9 est la couleur exacte.',
  });
  assert.equal(
    etat('marque').courante.commande,
    'npm run reduce -- http://127.0.0.1:4173/desordre/carte.html /desordre/compte.html /desordre/gestion.html --target fixtures/marque-demo/cible-valise.json --tokens fixtures/parcours/marque/marques/orbe/marque.resolver.json --sources fixtures/marque-demo/sources.json --references fixtures/parcours/marque/sorties/references --out fixtures/parcours/marque/sorties/reductions',
  );
  assert.deepEqual(resume('decisions'), {
    temps: ['faite', 'en cours', 'à venir', 'à venir'],
    courante: 'Décider · Décisions',
    main: 'designer',
    action: 'trancher 7 décisions dans la revue, puis exporter decisions.json dans sorties',
    moment: 'ecran',
    ecran: { href: '/sorties/reductions/127.0.0.1_4173/2026-11-24T1337/revue.html', precedente: false },
    phrase: 'On choisit une relation, pas une valeur.',
  });
  assert.equal(etat('decisions').courante.fait, '8 décisions tranchées sur 15');
  assert.equal(etat('decisions').courante.commande, null);
  assert.deepEqual(resume('livraison'), {
    temps: ['faite', 'faite', 'en cours', 'à venir'],
    courante: 'Poser · Livraison',
    main: 'outil',
    action: 'prouver la livraison sur les pages',
    moment: 'sans-ecran',
    ecran: null,
    phrase: null,
  });
  assert.equal(etat('livraison').courante.fait, 'feuilles ajoutées, pas encore prouvées');
  assert.match(/** @type {string} */ (etat('livraison').courante.commande), /^npm run verify -- http:\/\/127\.0\.0\.1:4173\/desordre\/carte\.html .* --ajout fixtures\/parcours\/livraison\/sorties\/ajout --out fixtures\/parcours\/livraison\/sorties\/verify$/);
  const b = etat('bilan');
  assert.deepEqual(resume('bilan'), { temps: ['faite', 'faite', 'faite', 'en cours'], courante: 'Tenir · Suivi', main: 'outil', action: 'relancer le contrôle', moment: 'bilan', ecran: null, phrase: null });
  assert.deepEqual(b.bilan, {
    chiffres: ['31 → 17 couleurs', '16 → 7 espacements', '13 → 8 tailles de texte'],
    dernier: 'Dernier contrôle : 24/11/2026 à 13 h 36, 54 lignes arrivées sur 54.',
    complet: true,
    manque: [],
    humain: ['les pages hors de l’échantillon', 'l’installation dans le code du produit'],
  });
  assert.equal(b.etapes[4].fait, '54 lignes arrivées sur 54, 3 pages');
  const p = etat('plusieurs');
  assert.deepEqual(resume('plusieurs'), {
    temps: ['faite', 'en cours', 'à venir', 'à venir'],
    courante: 'Décider · Marques',
    main: 'designer',
    action: 'corriger l’entrée de Brume (checkValise (clair) : primary : doublon, pas 7 = pas 9 (#00ccff)), puis la saisir à nouveau',
    moment: 'ecran',
    ecran: { href: '/marques/orbe/roles.html', precedente: false },
    phrase: 'Une marque illisible n’entre pas, et le message dit pourquoi.',
  });
  assert.equal(p.sousTitre, '3 sites, 3 marques');
  assert.deepEqual(
    p.etapes.map((k) => k.fait),
    ['3 sites : 3, 2 et 2 pages', '3 sites mesurés sur 3', '2 acceptées, 1 refusée', null, null, null],
  );
  assert.deepEqual(p.etapes[2].lignes, ['orbe : Orbe Café, acceptée', 'ecume : Écume et Sel, acceptée', 'brume : Brume, refusée : checkValise (clair) : primary : doublon, pas 7 = pas 9 (#00ccff)']);
  assert.deepEqual(p.etapes[1].lignes, [
    'orbe : 30 éléments, 3 types, 11 versions ; versions choisies : 0 sur 3',
    'ecume : 27 éléments, 7 types, 12 versions ; versions choisies : 0 sur 7',
    'brume : 7 éléments, 3 types, 5 versions ; versions choisies : 0 sur 3',
  ]);
});

test('PC3 règles d’étape : décisions non lues, verdict en 1, entrée changée, le plus récent par son nom', () => {
  // Décisions toutes tranchées dans decisions.json, que la table n'a pas lues : l'outil relance la réduction avec elles.
  const d = copie('decisions');
  const t = JSON.parse(readFileSync(join(d, 'sorties/reductions/127.0.0.1_4173/2026-11-24T1337/table.json'), 'utf8'));
  /** @type {Record<string, string>} */
  const toutes = { 'plein|terre': 'garder' };
  for (const [f, { rows }] of Object.entries(t.table.families)) for (const r of /** @type {any[]} */ (rows)) if (r.class === 'décision') toutes[`${f}|${r.old}${r.usage ? `|${r.usage}` : ''}${r.scope ? `|${r.scope}` : ''}`] = r.old;
  writeFileSync(join(d, 'sorties/decisions.json'), JSON.stringify(toutes));
  let e = calculerEtat(lireProjet(join(d, 'projet.json')), { base: d });
  assert.equal(e.courante.cle, 'decisions');
  assert.equal(e.courante.main, 'outil');
  assert.equal(e.courante.action, 'relancer la réduction avec les décisions');
  assert.match(/** @type {string} */ (e.courante.commande), / --decisions sorties\/decisions\.json --references sorties\/references --out sorties\/reductions$/);
  assert.equal(e.courante.fait, '15 décisions tranchées sur 15');
  // Verdict en 1 : la main au développeur, le nombre de lignes manquantes.
  const l = copie('bilan');
  const fv = join(l, 'sorties/verify/127.0.0.1_4173/2026-11-24T1336/verdict.json');
  const v = JSON.parse(readFileSync(fv, 'utf8'));
  v.lignes[0].etat = 'non arrivée';
  v.lignes[1].etat = 'en partie';
  v.sortie = 1;
  writeFileSync(fv, JSON.stringify(v));
  e = calculerEtat(lireProjet(join(l, 'projet.json')), { base: l });
  assert.equal(e.courante.cle, 'livraison');
  assert.equal(e.courante.main, 'développeur');
  assert.equal(e.courante.action, 'lire pertes.md et la sortie de verify : 2 lignes ne sont pas arrivées');
  assert.equal(e.courante.fait, '52 lignes arrivées sur 54, 3 pages');
  // Un dossier plus récent par son nom l'emporte, suffixe compris ; un dossier qui n'est pas un horodatage est ignoré.
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-parcours-'));
  for (const n of ['2026-11-24T1336', '2026-11-24T1336-2', '2026-11-24T1336-10', '2026-11-23T2359', 'zz']) mkdirSync(join(racine, n));
  assert.equal(plusRecent(racine)?.nom, '2026-11-24T1336-10');
  assert.equal(plusRecent(join(racine, 'absent')), null);
  // Entrée changée depuis la saisie : l'outil saisit à nouveau.
  const m = copie('marque');
  writeFileSync(join(m, 'marques/orbe/entree.json'), readFileSync(join(m, 'marques/orbe/entree.json'), 'utf8') + ' ');
  e = calculerEtat(lireProjet(join(m, 'projet.json')), { base: m });
  assert.equal(e.courante.cle, 'marques');
  assert.equal(e.courante.fait, 'Orbe Café, entrée changée depuis la saisie');
  assert.equal(e.courante.main, 'outil');
  // Sans cible : la main au designer, qui l'écrit dans projet.json.
  const sansCible = JSON.parse(readFileSync(join(m, 'projet.json'), 'utf8'));
  delete sansCible.target;
  writeFileSync(join(m, 'projet.json'), JSON.stringify(sansCible));
  writeFileSync(join(m, 'marques/orbe/entree.json'), readFileSync(join(FIX, 'marque/marques/orbe/entree.json')));
  e = calculerEtat(lireProjet(join(m, 'projet.json')), { base: m });
  assert.equal(e.courante.cle, 'decisions');
  assert.equal(e.courante.action, 'écrire la cible (target) dans projet.json');
  assert.equal(e.courante.commande, null);
});

test('PC4 accord au nombre et mots : ni « (s) », ni « 1 sites », ni client, plateforme ou conforme', () => {
  for (const m of MOMENTS) {
    const e = etat(m);
    const textes = [pageDuParcours(e), lignesTerminal(e, { page: 'parcours.html' }).join('\n')];
    for (const t of textes) {
      assert.doesNotMatch(t, /\(s\)|\b1 sites\b|\b1 marques\b|\b1 pages\b|client|plateforme|conforme/i, m);
    }
    if (e.unSite) {
      assert.doesNotMatch(textes[0], /\bsites\b|Marques|Sites/, m);
      assert.equal(e.sousTitre, null);
    }
  }
  assert.match(lignesTerminal(etat('plusieurs'), { page: 'p.html' })[0], /^Annuaire des cafés · 3 sites, 3 marques$/);
  assert.equal(lignesTerminal(etat('bilan'), { page: 'p.html' })[0], 'Annuaire des cafés');
});

/** Texte visible d'une partie de la page, balises ôtées, cadre exclu. @param {string} html */
const texteVisible = (html) => html.replace(/<iframe[^>]*><\/iframe>/g, '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/g, ' ');
/** @param {string} t */
const mots = (t) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

test('PC5 la page : quatre temps, un moment de 60 mots au plus hors du cadre, un seul « Tout le parcours », fermé', () => {
  for (const m of MOMENTS) {
    const html = pageDuParcours(etat(m));
    const barre = /** @type {RegExpExecArray} */ (/<ol class="barre"[^>]*>(.*?)<\/ol>/s.exec(html))[1];
    assert.deepEqual([...barre.matchAll(/<li [^>]*>([^<]*)<\/li>/g)].map((x) => x[1]), ['Mesurer', 'Décider', 'Poser', 'Tenir'], m);
    const b = /** @type {RegExpExecArray} */ (/<section class="moment"[^>]*>(.*?)<\/section>/s.exec(html))[1];
    assert.ok(mots(texteVisible(b)) <= 60, `${m} : ${mots(texteVisible(b))} mots`);
    assert.equal(html.match(/<details/g)?.length, 1, m);
    assert.match(html, /<details class="tout"><summary>Tout le parcours<\/summary>/);
    assert.ok(html.indexOf('class="barre"') < html.indexOf('class="moment"') && html.indexOf('class="moment"') < html.indexOf('<details'), m);
  }
  const p = pageDuParcours(etat('plusieurs'));
  assert.match(p, /<iframe src="\/marques\/orbe\/roles\.html" title="Planche des rôles : Orbe Café"><\/iframe>/);
  assert.match(p, /<a href="\/marques\/orbe\/roles\.html">Ouvrir seul<\/a>/);
  const c = pageDuParcours(etat('constat'));
  assert.match(c, /Fait : Constat\. Ensuite : Marque, saisir la marque\./);
  const l = pageDuParcours(etat('lancement'));
  for (const s of ['Un geste, quatre temps, trois portes.', 'Mesurer, Décider, Poser, Tenir.', 'Le site n’est jamais modifié.', 'Vous décidez sur image.', 'Chaque changement est prouvé.', 'On prend un échantillon de pages, une par modèle de page.']) assert.ok(l.includes(s), s);
  const bi = pageDuParcours(etat('bilan'));
  assert.ok(bi.includes('La couche visuelle tient ses seuils. Voici ce qui reste à faire vérifier par un humain.'));
  assert.ok(bi.includes('31 → 17 couleurs ; 16 → 7 espacements ; 13 → 8 tailles de texte.'));
  // Sans verdict en 0, le bilan dit ce qui manque, jamais sa phrase.
  const e = etat('bilan');
  if (e.bilan) e.bilan.complet = false;
  if (e.bilan) e.bilan.manque = ['un dernier contrôle sans ligne manquante'];
  assert.ok(!pageDuParcours(e).includes('tient ses seuils'));
});

/** Déclarations hors des jetons générés : [propriété, valeur]. @param {string} html */
function declarations(html) {
  const css = /** @type {RegExpExecArray} */ (/<style>(.*?)<\/style>/s.exec(html))[1];
  const reste = css.slice(css.indexOf(FIN_JETONS) + FIN_JETONS.length);
  return [...reste.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)].map((m) => [m[1], m[2].trim()]);
}
/** @param {string} valeur */
const horsRegle = (valeur) => valeur.replace(/var\(--[a-z0-9-]+\)/g, '').replace(/\b(?:0|100%)(?![\w.%])/g, '').replace(/\b[a-z]+(?:-[a-z]+)*\b/g, '').trim();

test('PC6 aucune valeur visuelle en dur : hors des jetons générés, des variables, des mots-clés, 0 et 100 %', () => {
  const html = pageDuParcours(etat('plusieurs'));
  assert.ok(html.includes(DEBUT_JETONS) && html.includes(FIN_JETONS));
  const decl = declarations(html);
  assert.ok(decl.length > 30);
  for (const [p, v] of decl) assert.equal(horsRegle(v), '', `${p}: ${v}`);
  // Vu rouge : une valeur écrite est refusée.
  for (const faux of ['12px', '#ff0000', '1.5', 'calc(100% - 8px)']) assert.notEqual(horsRegle(faux), '', faux);
  // Chaque variable employée est déclarée ; chaque variable déclarée vaut son jeton, relu dans tokens/commun/.
  const css = /** @type {RegExpExecArray} */ (/<style>(.*?)<\/style>/s.exec(html))[1];
  const bloc = css.slice(css.indexOf(DEBUT_JETONS), css.indexOf(FIN_JETONS));
  const [clair, sombre] = [/:root \{([^}]*)\}/.exec(bloc), /prefers-color-scheme: dark\) \{ :root \{([^}]*)\}/.exec(bloc)].map((m) =>
    Object.fromEntries([...(/** @type {RegExpExecArray} */ (m))[1].matchAll(/(--[a-z0-9-]+): ([^;]+);/g)].map((x) => [x[1], x[2]])),
  );
  for (const v of new Set([...css.slice(css.indexOf(FIN_JETONS)).matchAll(/var\((--[a-z0-9-]+)\)/g)].map((x) => x[1]))) assert.ok(v in clair, v);
  /** @param {string[]} fichiers */
  const jetons = (fichiers) => {
    /** @type {Map<string, any>} */
    const m = new Map();
    for (const f of fichiers) flattenTokens(JSON.parse(readFileSync(join(ROOT, 'tokens/commun', f), 'utf8')), [], m);
    return m;
  };
  const base = ['primitives.tokens.json', 'statuts.tokens.json', 'police.tokens.json'];
  const mc = jetons([...base, 'semantique.tokens.json']);
  const ms = jetons([...base, 'mode.sombre.tokens.json', 'semantique.tokens.json']);
  /** @param {Map<string, any>} m @param {string} r */
  const hex = (m, r) => resoudreAlias(m, m.get(r).$value, { depuis: r, chaine: [r] }).valeur.hex;
  for (const r of ['background.app', 'background.inverse', 'background.info.subtle', 'text.default', 'text.info', 'text.on-inverse']) {
    const n = `--${r.replace(/\./g, '-')}`;
    assert.equal(clair[n], hex(mc, r), `${n} clair`);
    assert.equal(sombre[n], hex(ms, r), `${n} sombre`);
  }
  assert.equal(clair['--gap-between-components'], '16px');
  assert.equal(clair['--width-column'], '640px');
  assert.equal(clair['--typography-body-medium-line-height'], '1.5');
  assert.equal(clair['--typography-heading-1-font-family'], 'system-ui, sans-serif', 'la police du produit à la place de celle de la marque');
});

test('PC7 déterminisme, sans script ni attribut style, bloc sombre', () => {
  for (const m of MOMENTS) {
    const a = pageDuParcours(etat(m));
    assert.equal(a, pageDuParcours(etat(m)), m);
    assert.doesNotMatch(a, /<script|\sstyle="|<link/, m);
    assert.match(a, /@media \(prefers-color-scheme: dark\)/, m);
  }
});

test('PC8 la commande parcours : page écrite à côté du projet, terminal', () => {
  const d = copie('plusieurs');
  const r = run([join(d, 'projet.json')], d);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.stdout.split('\n'), [
    'Annuaire des cafés · 3 sites, 3 marques',
    'En cours : Décider · Marques',
    'La main est au designer.',
    'À faire : corriger l’entrée de Brume (checkValise (clair) : primary : doublon, pas 7 = pas 9 (#00ccff)), puis la saisir à nouveau.',
    'Page : parcours.html ; à servir avec --servir',
    '',
  ]);
  assert.ok(existsSync(join(d, 'parcours.html')));
  const l = copie('livraison');
  const r2 = run([join(l, 'projet.json')], l);
  assert.equal(r2.stdout.split('\n')[4].startsWith('Commande suivante : npm run verify -- http://127.0.0.1:4173/desordre/carte.html /desordre/compte.html /desordre/gestion.html --reference sorties/references --sources '), true, r2.stdout);
});

test('PC9 le serveur : page à jour, écrans montés, chemins hors racine refusés, 127.0.0.1 seulement', async () => {
  const d = copie('plusieurs');
  const f = join(d, 'projet.json');
  const s = await servir(
    {
      page: () => pageDuParcours(calculerEtat(lireProjet(f), { base: d })),
      sorties: () => lireProjet(f).sorties,
      marques: () => Object.fromEntries(lireProjet(f).sites.map((x) => [x.id, /** @type {string} */ (x.dossierMarque)])),
    },
    { port: 0 },
  );
  try {
    assert.match(s.adresse, /^http:\/\/127\.0\.0\.1:\d+\/$/);
    /** @param {string} p */
    const get = (p) =>
      new Promise((ok, ko) => {
        // Chemin envoyé tel quel, sans la normalisation de fetch (qui résout « %2e%2e »).
        const req = request(s.adresse, { path: p }, (r) => {
          let texte = '';
          r.setEncoding('utf8').on('data', (x) => (texte += x)).on('end', () => ok({ code: r.statusCode, texte }));
        });
        req.on('error', ko).end();
      });
    assert.match(/** @type {any} */ (await get('/')).texte, /Décider · Marques/);
    assert.equal(/** @type {any} */ (await get('/sorties/composants/orbe/127.0.0.1_4173/2026-11-24T1330/constat.html')).code, 200);
    assert.equal(/** @type {any} */ (await get('/marques/orbe/roles.html')).code, 200);
    for (const p of ['/projet.json', '/sorties/../projet.json', '/sorties/%2e%2e/projet.json', '/marques/orbe/%2e%2e/%2e%2e/projet.json', '/marques/inconnu/roles.html', '/sorties/absent.json'])
      assert.equal(/** @type {any} */ (await get(p)).code, 404, p);
    // La page suit le disque : la marque refusée corrigée et saisie, l'état change au rechargement.
    const v = JSON.parse(readFileSync(join(d, 'sorties/saisies/brume.json'), 'utf8'));
    writeFileSync(join(d, 'sorties/saisies/brume.json'), JSON.stringify({ ...v, verdict: 'acceptée', motifs: [] }));
    assert.match(/** @type {any} */ (await get('/')).texte, /Décider · Décisions/);
  } finally {
    await s.fermer();
  }
});
