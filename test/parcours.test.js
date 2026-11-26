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
 *   table du bilan, summary (après) : couleurs 17, espacements 7, tailles de texte 8, arrondis 5 ; avant, le compte
 *   de la dette sur l'audit du constat (D86) : 33, 16, 13, 8 ;
 *   verdict du bilan : 55 lignes, 54 « arrivée », 1 « non vérifiable (état) », 3 pages, sortie 0, dossier 2026-11-24T1336,
 *   rendu validé ;
 *   saisie de Brume (#00ccff) : refusée, « checkValise (clair) : primary : doublon, pas 7 = pas 9 (#00ccff) ».
 *
 *   PC1 projet illisible : un message d'une ligne qui nomme la cause, sortie 2
 *   PC2 l'état des huit projets : temps, étape en cours, main, action, commande, faits, moment, écran, phrase
 *   PC3 règles d'étape construites en mémoire : décisions lues ou non, verdict en 1, entrée changée, le plus récent
 *   PC4 accord au nombre et mots : aucun « (s) », « 1 sites », « client », « plateforme » ni « conforme »
 *   PC5 la page : quatre temps, un moment de 60 mots au plus hors du cadre, un seul « Tout le parcours », fermé
 *   PC6 aucune valeur visuelle en dur : hors des jetons générés, des variables, des mots-clés, 0 et 100 %
 *   PC7 déterminisme, sans script ni attribut style, sombre seul, le papier en clair (D88)
 *   PC8 la commande : page écrite, terminal
 *   PC9 le serveur : page à jour, écrans montés, chemins hors racine refusés, 127.0.0.1 seulement
 *
 * La conduite (D73, docs/attendus/parcours-conduite.md). Valeurs écrites à la main d'après les mêmes sorties :
 *   versions du constat : Orbe Café 11 ; à trois sites 11 + 12 + 5 = 28 ;
 *   choix reportés (versions à garder, y − x) : Orbe Café 3 − 0 = 3 ; à trois sites 3 + 7 + 3 = 13 ;
 *   décisions de « decisions » : 14 lignes hors carte et une carte, 15 ; 8 tranchées, 7 en attente ;
 *   décisions de « livraison » : 12 lignes hors carte, 2 lignes que la carte a rattachées et qui ont leur propre
 *   décision, une carte, 15, toutes tranchées (le parcours en disait 13).
 *
 *   PC10 à PC12 retirés avec le dialogue (D74) : numéros jamais repris
 *   PC13 un état honnête : « faite, n choix reportés »
 *   PC14 le fichier presque bon, nommé ; le chemin des sorties en entier
 *   PC15 un seul compte de décisions, cartes de plein comprises
 *   PC16 poser les feuilles ajoutées : la main à l'outil
 *
 * Les faits du moment (D74) et le serveur (D75). Valeurs écrites à la main d'après les mêmes sorties :
 *   durée : premier constat 2026-11-24T1330 ; dernière sortie horodatée de « decisions » 2026-11-24T1337 : 7 min ;
 *   un dossier de vérification au 2026-11-25T1535 : 26 h 05 après le premier constat, 1 565 min, dit « 1 j 2 h » ; verdict de « bilan » : 55 lignes, 3 pages.
 *
 *   PC17 les faits de chaque état : une ligne par fait, sans guillemets ni nom de fichier, un seul chiffre
 *   PC18 ce qui n'est pas arrivé, nommé par son titre, et le temps écoulé
 *   PC19 le port du serveur pris : un port libre, sauf s'il est demandé
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireProjet } from '../src/parcours/projet.js';
import { calculerEtat, etatDit, lignesTerminal, plusRecent } from '../src/parcours/etat.js';
import { dureeDite, dureeEcoulee, faitsDuMoment } from '../src/parcours/faits.js';
import { compterDecisions } from '../src/reduce/propose.js';
import { pageDuParcours, DEBUT_JETONS, FIN_JETONS } from '../src/parcours/page.js';
import { servir } from '../src/parcours/serveur.js';
import { flattenTokens, resoudreAlias } from '../src/tokens/roles.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FIX = join(ROOT, 'fixtures', 'parcours');
const MOMENTS = ['lancement', 'pages', 'constat', 'marque', 'decisions', 'livraison', 'bilan', 'plusieurs'];
/** Les moments de la page d'avant les écrans (D77) : tous, sauf ceux qui ont leur écran (les pages, la dette, le bilan). */
const PAGE = MOMENTS.filter((m) => m !== 'lancement' && m !== 'pages' && m !== 'constat' && m !== 'bilan');
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
/** Une copie où la dette a été vue (D78) : l'étape de la marque reprend son cours. @param {string} m */
const vue = (m) => {
  const d = copie(m);
  writeFileSync(join(d, 'sorties', 'dette.json'), '{ "vue": true }\n');
  return d;
};
/** L'état d'un dossier copié, commandes écrites depuis la racine. @param {string} d */
const etatDe = (d) => calculerEtat(lireProjet(join(d, 'projet.json')), { base: d });
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

test('PC2 l’état des huit projets, depuis leurs sorties', () => {
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
    action: 'retenir les pages qui portent le plus de composants',
    moment: 'pages',
    ecran: null,
    phrase: null,
  });
  assert.deepEqual(resume('pages'), {
    temps: ['en cours', 'à venir', 'à venir', 'à venir'],
    courante: 'Mesurer · Site',
    main: 'designer',
    action: 'garder ou changer les pages à l’écran, puis lancer la mesure',
    moment: 'pages',
    ecran: null,
    phrase: null,
  });
  // La mesure faite : la dette, à regarder ; la marque attend le clic sur « Définir ma marque » (D78).
  assert.deepEqual(resume('constat'), {
    temps: ['faite', 'en cours', 'à venir', 'à venir'],
    courante: 'Décider · Marque',
    main: 'designer',
    action: 'regarder la dette, puis passer à la marque',
    moment: 'dette',
    ecran: { href: '/sorties/composants/orbe/127.0.0.1_4173/2026-11-24T1330/constat.html', precedente: true },
    phrase: null,
  });
  assert.equal(etat('constat').courante.commande, null);
  const v = etatDe(vue('constat'));
  // La dette vue, la marque déjà écrite : la saisie, sous l'écran d'attente des fondations (D83).
  assert.deepEqual([v.courante.main, v.courante.action, v.moment, v.phrase], ['outil', 'saisir la marque', 'jetons', null]);
  assert.match(String(v.courante.commande), /^npm run saisie -- marques\/orbe\/entree\.json --verdict sorties\/saisies\/orbe\.json && node src\/cli\/planche\.js --marque marques\/orbe && npm run css -- --marque marques\/orbe && npm run vuetify -- --marque marques\/orbe$/);
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
    'npm run reduce -- http://127.0.0.1:4173/desordre/carte.html /desordre/compte.html /desordre/gestion.html --target fixtures/marque-demo/cible-valise.json --tokens fixtures/parcours/marque/marques/orbe/marque.resolver.json --brand-colors --sources fixtures/marque-demo/sources.json --references fixtures/parcours/marque/sorties/references --out fixtures/parcours/marque/sorties/reductions',
  );
  assert.deepEqual(resume('decisions'), {
    temps: ['faite', 'en cours', 'à venir', 'à venir'],
    courante: 'Décider · Décisions',
    main: 'designer',
    action: `trancher 7 décisions dans la revue, puis exporter ; le fichier glissé dans le chat se range sous decisions.json dans ${join(FIX, 'decisions', 'sorties')}`,
    moment: 'ecran',
    ecran: { href: '/sorties/reductions/127.0.0.1_4173/2026-11-24T1337/revue.html', precedente: false },
    phrase: 'On choisit une relation, pas une valeur.',
  });
  assert.equal(etat('decisions').courante.fait, '8 décisions tranchées sur 15');
  assert.equal(etat('decisions').courante.commande, null);
  assert.deepEqual(resume('livraison'), {
    temps: ['faite', 'faite', 'en cours', 'à venir'],
    courante: 'Vérifier · Livraison',
    main: 'outil',
    action: 'prouver la livraison sur les pages, avant et après',
    moment: 'sans-ecran',
    ecran: null,
    phrase: null,
  });
  assert.equal(etat('livraison').courante.fait, 'feuilles ajoutées, pas encore prouvées');
  assert.match(/** @type {string} */ (etat('livraison').courante.commande), /^npm run verify -- http:\/\/127\.0\.0\.1:4173\/desordre\/carte\.html .* --ajout fixtures\/parcours\/livraison\/sorties\/ajout\/2026-11-24T1335 --out fixtures\/parcours\/livraison\/sorties\/verify$/);
  const b = etat('bilan');
  assert.deepEqual(resume('bilan'), { temps: ['faite', 'faite', 'faite', 'en cours'], courante: 'Remettre · Remise', main: 'outil', action: 'relancer le contrôle', moment: 'remise', ecran: null, phrase: null });
  assert.deepEqual(b.bilan, {
    // Avant : le compte de la dette (D86), lu dans l'audit ; après : celui de la table.
    couleurs: { avant: 33, apres: 17, mesure: false },
    pages: 3,
    decisions: 15,
    changements: 55,
    arrivees: 54,
    enEtat: ['Fond · bouton « Commander à emporter » (au survol)'],
    composants: [],
    dernier: 'Dernier contrôle : 24/11/2026 à 13 h 36, 54 changements arrivés sur 55.',
    complet: true,
    manque: [],
    humain: ['les pages hors de l’échantillon'],
  });
  assert.equal(b.etapes[4].fait, '54 changements arrivés sur 55, 3 pages');
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
  assert.equal(e.courante.action, 'dire ce qui est vérifié et ce qui n’est pas arrivé, sans rien ouvrir : 3 changements ne sont pas arrivés');
  assert.equal(e.courante.fait, '52 changements arrivés sur 55, 3 pages');
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
  for (const m of PAGE) {
    const html = pageDuParcours(etat(m));
    const fil = /** @type {RegExpExecArray} */ (/<nav class="fil"[^>]*>.*?<ol>(.*?)<\/ol><\/nav>/s.exec(html))[1];
    assert.deepEqual(
      [...fil.matchAll(/<li[^>]*>(.*?)<\/li>/g)].map((x) => x[1].replace(/<small>.*?<\/small>/, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().replace(/^\d /, '')),
      ['Mesurer', 'Décider', 'Vérifier', 'Remettre'],
      m,
    );
    const b = /** @type {RegExpExecArray} */ (/<section class="moment"[^>]*>(.*?)<\/section>/s.exec(html))[1];
    assert.ok(mots(texteVisible(b)) <= 60, `${m} : ${mots(texteVisible(b))} mots`);
    assert.equal(html.match(/<details/g)?.length, 1, m);
    assert.match(html, /<details class="tout"><summary>Tout le parcours<\/summary>/);
    assert.ok(html.indexOf('class="fil"') < html.indexOf('class="moment"') && html.indexOf('class="moment"') < html.indexOf('<details'), m);
  }
  const p = pageDuParcours(etat('plusieurs'));
  assert.match(p, /<iframe src="\/marques\/orbe\/roles\.html" title="Planche des rôles : Orbe Café"><\/iframe>/);
  assert.match(p, /<a href="\/marques\/orbe\/roles\.html">Ouvrir seul<\/a>/);
  const c = pageDuParcours(etatDe(vue('constat')));
  assert.match(c, /<h1>Je prépare tes fondations<\/h1>/);
  // Le rendu validé : la remise (D87), ce qui reste à regarder ; aucun mot de l'outil.
  const bi = pageDuParcours(etat('bilan'));
  assert.match(bi, /<title>La remise · /);
  assert.ok(bi.includes('<li>Fond · bouton « Commander à emporter » (au survol)</li>'));
  assert.doesNotMatch(texteVisible(bi.replace(/<style>.*?<\/style>/s, '')), /seuils|couche visuelle|lignes? arrivée|rattachement|\bpertes?\b|\bgarde\b|coul-\d/);
  // Sans verdict en 0, la remise dit ce qui manque.
  const e = etat('bilan');
  if (e.bilan) e.bilan.complet = false;
  if (e.bilan) e.bilan.manque = ['un dernier contrôle sans ligne manquante'];
  const manque = pageDuParcours(e);
  assert.ok(manque.includes('<h3>Il manque</h3>') && manque.includes('<li>Un dernier contrôle sans ligne manquante</li>'), manque);
  assert.match(manque, /<h1>Le design system d’Annuaire des cafés est presque prêt\.<\/h1>/);
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
  // La page en sombre seul (D88) ; le papier, en clair.
  const [sombre, clair] = [/:root \{([^}]*)\}/.exec(bloc), /\.papier \{([^}]*)\}/.exec(bloc)].map((m) =>
    Object.fromEntries([...(/** @type {RegExpExecArray} */ (m))[1].matchAll(/(--[a-z0-9-]+): ([^;]+);/g)].map((x) => [x[1], x[2]])),
  );
  for (const v of new Set([...css.slice(css.indexOf(FIN_JETONS)).matchAll(/var\((--[a-z0-9-]+)\)/g)].map((x) => x[1]))) assert.ok(v in sombre, v);
  assert.deepEqual(Object.keys(clair).sort(), Object.keys(sombre).filter((n) => !/^--(gap|padding|width|border-radius|border-width|offset|height|avatar|typography)-/.test(n)).sort(), 'le papier : les couleurs seules');
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
  for (const r of ['background.app', 'background.inverse', 'background.info.subtle', 'text.default', 'text.info', 'text.on-inverse', 'border.info']) {
    const n = `--${r.replace(/\./g, '-')}`;
    assert.equal(clair[n], hex(mc, r), `${n} clair`);
    assert.equal(sombre[n], hex(ms, r), `${n} sombre`);
  }
  // Le plein de ce qui se clique : la page n'a pas de marque, il prend l'échelle d'information (D88).
  for (const [n, r] of [['--background-interactive-strong', 'color.info.9'], ['--background-interactive-strong-hover', 'color.info.10'], ['--text-on-interactive', 'color.info.on-solid']]) {
    assert.equal(sombre[n], hex(ms, r), `${n} sombre`);
    assert.equal(clair[n], hex(mc, r), `${n} clair`);
  }
  assert.equal(sombre['--gap-between-components'], '16px');
  assert.equal(sombre['--width-column'], '640px');
  assert.equal(sombre['--typography-body-medium-line-height'], '1.5');
  assert.equal(sombre['--typography-heading-1-font-family'], 'system-ui, sans-serif', 'la police du produit à la place de celle de la marque');
});

test('PC7 déterminisme, sans script ni attribut style, sombre seul', () => {
  for (const m of MOMENTS) {
    const a = pageDuParcours(etat(m));
    assert.equal(a, pageDuParcours(etat(m)), m);
    assert.doesNotMatch(a, /<script|\sstyle="|<link|prefers-color-scheme/, m);
    assert.match(a, /color-scheme: dark; \}\n\.papier \{[^}]*color-scheme: light; \}/, m);
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
    'Pour le chat, des faits à dire avec tes mots, sans les recopier :',
    '  Refus : brume : Brume, refusée : checkValise (clair) : primary : doublon, pas 7 = pas 9 (#00ccff)',
    '  Ensuite : dire ce qui ne va pas avec les mots de l’humain, proposer une réparation, corriger l’entrée après son accord',
    '  Main : l’humain ; l’accompagner, il décide',
    '  Reporté : 13 choix',
    '  Durée : 8 min depuis la première mesure, pauses comprises',
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

test('PC13 un état honnête : « faite, n choix reportés »', () => {
  const l = etat('livraison');
  assert.equal(l.etapes[1].etat, 'faite');
  assert.equal(etatDit(l.etapes[1]), 'faite, 3 choix reportés');
  assert.equal(etatDit(l.etapes[0]), 'faite');
  assert.match(pageDuParcours(l), /<strong>Mesure<\/strong> · faite, 3 choix reportés · /);
  assert.equal(l.chiffres.reportes, 3);
  assert.equal(etat('plusieurs').chiffres.reportes, 13);
});

test('PC14 le fichier presque bon, nommé ; le chemin des sorties en entier', () => {
  for (const nom of ['decisions.json ', ' decisions.json', 'decisions (1).json']) {
    const d = copie('decisions');
    renameSync(join(d, 'sorties/decisions.json'), join(d, 'sorties', nom));
    const e = calculerEtat(lireProjet(join(d, 'projet.json')), { base: d });
    assert.equal(e.courante.action, `un fichier voisin, ${JSON.stringify(nom)}, est dans ${join(d, 'sorties')} : le renommer en decisions.json`, nom);
    assert.equal(e.voisin, nom);
    assert.ok(faitsDuMoment(e, { sorties: join(d, 'sorties') }).some((l) => /sous un autre nom : le ranger, sans le dire/.test(l)), nom);
  }
  const d = copie('decisions');
  rmSync(join(d, 'sorties/decisions.json'));
  const e = calculerEtat(lireProjet(join(d, 'projet.json')), { base: d });
  assert.equal(e.courante.action, `trancher 15 décisions dans la revue, puis exporter ; le fichier glissé dans le chat se range sous decisions.json dans ${join(d, 'sorties')}`);
  assert.equal(e.voisin, null);
});

test('PC15 un seul compte de décisions, cartes de plein comprises', () => {
  /** @param {string} m */
  const table = (m) => {
    const t = JSON.parse(readFileSync(join(FIX, m, 'sorties/reductions/127.0.0.1_4173', m === 'decisions' ? '2026-11-24T1337' : '2026-11-24T1335', 'table.json'), 'utf8'));
    return { families: t.table.families, pleins: t.table.pleins };
  };
  /** @param {string} m */
  const decisions = (m) => JSON.parse(readFileSync(join(FIX, m, 'sorties/decisions.json'), 'utf8'));
  assert.deepEqual(compterDecisions(table('decisions'), decisions('decisions')), { total: 15, enAttente: 7 });
  assert.deepEqual(compterDecisions(table('livraison'), decisions('livraison')), { total: 15, enAttente: 0 });
  assert.equal(etat('decisions').courante.fait, '8 décisions tranchées sur 15');
  assert.equal(etat('livraison').etapes[3].fait, '15 décisions tranchées sur 15');
  assert.equal(etat('bilan').etapes[3].fait, '15 décisions tranchées sur 15');
  assert.equal(etat('livraison').chiffres.decisions, 15);
});

test('PC16 poser les feuilles ajoutées : la main à l’outil', () => {
  const l = copie('livraison');
  rmSync(join(l, 'sorties/ajout'), { recursive: true });
  const e = calculerEtat(lireProjet(join(l, 'projet.json')), { base: l });
  assert.equal(e.courante.cle, 'livraison');
  assert.equal(e.courante.main, 'outil');
  assert.equal(e.courante.action, 'poser les feuilles ajoutées');
  assert.match(/** @type {string} */ (e.courante.commande), /^npm run ajout -- --modifications /);
});

/** Les faits d'un projet de fixtures, ou d'une copie. @param {string} d */
const faits = (d) => faitsDuMoment(calculerEtat(lireProjet(join(d, 'projet.json')), { base: d }), { sorties: join(d, 'sorties') });

test('PC17 les faits de chaque état : une ligne par fait, sans guillemets ni nom de fichier, un seul chiffre', () => {
  const tete = 'Pour le chat, des faits à dire avec tes mots, sans les recopier :';
  assert.deepEqual(faits(join(FIX, 'lancement')), [
    tete,
    '  Ensuite : regarder le site sans le montrer (parcours --regarder), retenir les pages qui portent le plus de composants, les écrire dans le projet avec leur nom ; une liste vidée à l’écran : dire d’ajouter une page, sans bouton',
    '  Main : l’humain ; l’accompagner, il décide',
  ]);
  assert.deepEqual(faits(join(FIX, 'pages')), [
    tete,
    '  Écran : les pages à mesurer',
    '  Ensuite : l’écran devant et vérifié, puis la boîte de fin de tour : on peut ajuster la liste à droite ; un seul bouton, Mesurer mes pages ; ok tapé vaut le clic ; sans boîte, une phrase, puis attendre ok ; Mesurer mes pages : parcours --passer pages',
    '  Main : l’humain ; l’accompagner, il décide',
  ]);
  assert.deepEqual(faits(join(FIX, 'constat')), [
    tete,
    '  Fait : la mesure des pages',
    '  Chiffre : 70 valeurs différentes affichées',
    '  Écran : la dette',
    '  Ensuite : l’écran devant et vérifié, puis la boîte de fin de tour : ce chiffre, la dette est à droite ; un seul bouton, Définir ma marque ; ok tapé vaut le clic ; sans boîte, une phrase, puis attendre ok ; Définir ma marque : parcours --passer dette',
    '  Main : l’humain ; l’accompagner, il décide',
    '  Reporté : 3 choix',
    '  Durée : 0 min depuis la première mesure, pauses comprises',
  ]);
  assert.deepEqual(faits(vue('constat')), [
    tete,
    '  Fait : la marque confirmée',
    '  Écran : l’écriture des tokens, qui passe seule aux fondations',
    '  Ensuite : saisir la marque, sans le dire, puis relire parcours',
    '  Main : l’outil ; enchaîner sans demander',
    '  Reporté : 3 choix',
    '  Durée : 0 min depuis la première mesure, pauses comprises',
  ]);
  assert.deepEqual(faits(join(FIX, 'decisions')), [
    tete,
    '  Fait : les pages comparées aux fondations ; le reste rangé seul',
    '  Chiffre : 7 décisions à prendre',
    '  Écran : la revue',
    '  Ensuite : trancher dans la revue ; une fois fini, exporter, puis glisser le fichier dans le chat, que l’IA range',
    '  Main : l’humain ; l’accompagner, il décide',
    '  Reporté : 3 choix',
    '  Durée : 7 min depuis la première mesure, pauses comprises',
  ]);
  assert.deepEqual(faits(join(FIX, 'plusieurs')).slice(1, 3), [
    '  Refus : brume : Brume, refusée : checkValise (clair) : primary : doublon, pas 7 = pas 9 (#00ccff)',
    '  Ensuite : dire ce qui ne va pas avec les mots de l’humain, proposer une réparation, corriger l’entrée après son accord',
  ]);
  // Sans entrée de marque : la marque se lit sur le site, et l'IA écrit l'entrée.
  const c = vue('constat');
  const p = JSON.parse(readFileSync(join(c, 'projet.json'), 'utf8'));
  delete p.sites[0].brand;
  writeFileSync(join(c, 'projet.json'), JSON.stringify(p));
  // La mesure a relevé des couleurs : l'écran de la marque (D80).
  assert.ok(faits(c).includes('  Écran : la marque'));
  // Sans audit, pas d'écran : la marque se lit sur le site, et l'IA écrit l'entrée.
  rmSync(join(c, 'sorties', 'audit'), { recursive: true });
  assert.ok(faits(c).includes('  Ensuite : lire la marque sur le site (couleur principale, accent, police des titres), la proposer en une phrase, écrire l’entrée après son accord'));
  for (const m of MOMENTS) {
    const l = faits(join(FIX, m));
    assert.equal(l[0], tete, m);
    assert.ok(l.filter((x) => x.startsWith('  Chiffre : ')).length <= 1, `${m} : plus d'un chiffre`);
    for (const x of l.slice(1)) {
      assert.match(x, /^  [A-ZÉ][\p{L} ]+ : \S/u, `${m} : ${x}`);
      assert.doesNotMatch(x, /[«»"]|\.json|\.md|\.html|mot pour mot|Message|Bouton/, `${m} : ${x}`);
    }
  }
  // La commande : les faits sous les lignes, après une ligne vide.
  const dd = copie('decisions');
  const r = run([join(dd, 'projet.json')], dd);
  assert.equal(r.status, 0, r.stderr);
  const sortie = r.stdout.split('\n');
  assert.equal(sortie[sortie.indexOf('') + 1], tete);
});

test('PC18 ce qui n’est pas arrivé, nommé par son titre, et le temps écoulé', () => {
  const b = copie('bilan');
  // La remise (D87) : une chose à dire, ce qui se remet ; ni les choix reportés ni le contrôle.
  assert.deepEqual(faits(b).slice(1), [
    '  Fait : le rendu validé ; la remise écrite, un dossier et un message',
    '  Écran : la remise',
    '  Ensuite : une phrase : voici ce qu’il remet au développeur, un dossier et un message, à droite ; il copie le message et le lui donne ; ni les choix reportés ni le contrôle : l’écran les porte ; ne rien ouvrir',
    '  Main : l’humain ; il remet le dossier au développeur',
    '  Durée : 6 min depuis la première mesure, pauses comprises',
  ]);
  const fv = join(b, 'sorties/verify/127.0.0.1_4173/2026-11-24T1336/verdict.json');
  const v = JSON.parse(readFileSync(fv, 'utf8'));
  v.lignes[0] = { ...v.lignes[0], titre: 'Fond · pied de page « Contact »', etat: 'non arrivée', elements: { arrivees: 0, total: 2 }, texte: 'x : non arrivée ; cause : jeton absent' };
  v.sortie = 1;
  writeFileSync(fv, JSON.stringify(v));
  const l = faits(b);
  assert.ok(l.includes('  Pas arrivé : Fond · pied de page Contact ; 2 éléments ; cause : jeton absent'), l.join('\n'));
  assert.ok(l.includes('  Main : l’humain ; il remet le dossier au développeur'), l.join('\n'));
  // Le temps écoulé : du premier constat à la dernière sortie horodatée, par les noms des dossiers.
  assert.equal(dureeEcoulee(join(FIX, 'decisions', 'sorties')), 7);
  assert.equal(dureeEcoulee(join(FIX, 'lancement', 'sorties')), null);
  mkdirSync(join(b, 'sorties/verify/127.0.0.1_4173/2026-11-25T1535'));
  assert.equal(dureeEcoulee(join(b, 'sorties')), 1565);
  assert.deepEqual([dureeDite(0), dureeDite(59), dureeDite(65), dureeDite(1565)], ['0 min', '59 min', '1 h 05', '1 j 2 h']);
});

test('PC19 le port du serveur pris : un port libre, sauf s’il est demandé', async () => {
  const sources = { page: () => 'p', sorties: () => tmpdir(), marques: () => ({}) };
  const premier = await servir(sources, { port: 0 });
  const port = Number(new URL(premier.adresse).port);
  try {
    const second = await servir(sources, { port, libre: true });
    assert.notEqual(second.adresse, premier.adresse);
    await second.fermer();
    await assert.rejects(servir(sources, { port }), new RegExp(`port ${port} pris : passer un autre --port, ou aucun`));
  } finally {
    await premier.fermer();
  }
});
