// @ts-check
/**
 * Les écrans du parcours (D77), sans navigateur :
 *   EC1 le lancement : les quatre temps pas encore, quatre étapes, trois portes, l'adresse dans le chat, aucun bouton ; il
 *       se recharge seul ; aucune valeur visuelle en dur, aucun script ;
 *   EC2 les pages, un site : le nom de chaque page (ou son chemin), sa vignette, « Retirer », « Ajouter une page » en
 *       dernière ligne ; ni barre ni bouton de mesure (D89) ; jamais de rechargement seul ; le refus d'une page ajoutée,
 *       à côté du champ, avec la saisie gardée ; plusieurs sites : un groupe par site ;
 *   EC3 projet.json : une page avec son nom, retirer, ajouter après vérification (même site, elle répond, pas déjà là),
 *       sinon la raison en une phrase ; le reste du fichier intact ; la validation fait l'étape,
 *       et l'écran de la mesure en cours paraît (ce qui se passe, une barre de progression, rechargé seul) ;
 *   EC4 la commande : avant le projet, --servir sert le lancement ; les formulaires reviennent sur l'écran (303) ; le
 *       serveur n'a plus de passage à recevoir ; --passer pages lance la mesure sur la liste de l'écran à cet instant ;
 *   EC5 la dette (D78) : les pages mesurées nommées, le grand chiffre, quatre cartes de valeurs avec leur compte, leurs
 *       phrases calculées et leurs dessins (SVG : la valeur mesurée est une donnée du dessin, jamais du style), les
 *       composants par type avec leurs captures, « À regarder aussi », les deux liens, « Passer à ta marque » ; sans
 *       audit, les composants seuls ; le mot « constat » ne se montre pas ;
 *   EC6 « Passer à ta marque », dans le chat (--passer dette) : la dette vue, l'action de la marque reprend ; un
 *       second passage est refusé ;
 *   EC7 la marque (D80), lue dans la mesure par la règle : la primaire colore le plus d'éléments cliquables, l'accent est
 *       la couleur la plus employée d'une autre teinte, la troisième va sur l'échelle de la palette qui a sa teinte ; chaque couleur dit son code, d'où
 *       elle vient (« lue sur n éléments »), ses douze pas, son bouton ou son aplat et le verdict ; la police des titres ;
 *       « Confirmer la marque » ;
 *   EC8 confirmer, dans le chat (--passer marque) : l'entrée écrite et nommée dans le projet, la main à l'outil ; une
 *       marque refusée se dit sous la couleur en cause, en mots simples, et ne se confirme pas : --passer marque dit
 *       laquelle changer ;
 *   EC9 modifier : une couleur relevée prise d'un clic, un code tapé (court ou sans #), un code refusé dit à côté du
 *       champ, la valeur de l'autre couleur échangée, l'accent échangé avec la troisième ; le bloc se recalcule ;
 *   EC10 après « Confirmer la marque » (D83) : l'écran d'attente, rechargé seul, tant que la saisie, les planches, la
 *       feuille CSS et le thème ne sont pas écrits ; puis les fondations, calculées pour la marque du projet : ses douze
 *       pas, ses valeurs, ses rôles, ses relations d'espace, ses paires dans les quatre contextes, les liens vers ses
 *       planches, six preuves et les limites, « Pas encore », « Comparer mon site » ; rien à décider ; pour le chat, une
 *       phrase sans chiffre ;
 *   EC11 « Comparer mon site » (--passer fondations) : les fondations vues, la main à l'outil qui lance la réduction ; une
 *       preuve fausse pour la marque (sans feuille CSS) n'est pas rendue ;
 *   EC12 l'avant et après (D86), dès les feuilles vérifiées, avant la validation : un onglet par page nommée, la bascule
 *       Avant, Après sans script, la plus haute des deux images tient le cadre ; le compte des changements, ce qui n'est
 *       visible qu'au survol, quatre cartes et leur exemple (la couleur changée la plus employée, deux pastilles et leurs
 *       codes) ; « Valider le rendu », « Revenir sur une décision » ; une vérification d'avant ces feuilles, ou sans
 *       l'image d'avant, se refait ;
 *   EC13 « Valider le rendu » (--passer rendu) : le rendu validé ; « Revenir sur une décision » (--revenir) : le rendu n'est plus
 *       validé, la revue rouverte au designer jusqu'à un nouvel export, puis la réduction, les feuilles et la
 *       vérification se refont, et l'avant et après revient ;
 *   EC14 la remise (D87), tirée des sorties sans nouvelle mesure : trois étapes et leurs comptes (feuilles, lignes à
 *       coller par page, valeurs à reprendre par fichier, regroupées par sélecteur, les côtés réunis en raccourci),
 *       « À installer » sans mot de l'outil ni identifiant de ligne, le message ; un dossier `remise/` étranger n'est
 *       pas touché ; l'écran : trois cartes, le dossier, le message, « Copier le message », puis « Copié. » ; une copie
 *       impossible le dit ;
 *   EC15 la page en direct : une base sur la page du site, tokens.css en tête, chaque feuille ajoutée juste après le lien
 *       de sa feuille, avec son media ; un lien vers une autre page mesurée y mène en direct, une ancre reste une ancre ;
 *   EC16 le fil (D88) : les temps faits, ici (le nom de l'écran sous le temps) et pas encore ; un temps fait mène à son
 *       dernier écran à revoir, ou n'est pas un lien ; « ds-lab » mène au départ ; ni puce, ni pointillé, ni réglage du
 *       système sur aucun moment ; le bouton plein sur le rôle de ce qui se clique ; « d' » devant une voyelle ;
 *   EC17 revoir un écran fait (D88) : le départ, les pages, la dette, la marque, les fondations, la revue, l'avant et
 *       après, en lecture seule : le temps revu et ses autres écrans, ni formulaire ni rechargement, « Revenir où j'en
 *       suis » ; un écran qui ne se revoit pas rend le moment ; l'état et les fichiers ne changent pas ; le serveur
 *       refuse un envoi venu d'un écran revu ;
 *   EC18 les pages par le chat (D89) : --ajouter-page et --retirer-page changent la liste comme l'écran, --site nomme le
 *       site parmi plusieurs ; une page refusée, une liste vide, un autre moment : la raison en une ligne, sortie 1 ;
 *       les options mêlées : sortie 2 ;
 *   EC20 ni barre ni bouton de passage sur aucun écran (D92) : « Copier le message » sous le message, « ‹ La remise »
 *       sous le titre d'« À installer », « Revenir où j'en suis » sous le titre d'un écran revu ;
 *   EC19 regarder le site sans le montrer (D91) : la page donnée et celles du même site vers lesquelles elle mène,
 *       rendues sans fenêtre, leur titre et leurs composants comptés, les plus riches d'abord ; un site qui ne répond
 *       pas, sa raison en une ligne et la sortie 1 ; --regarder avec un projet : sortie 2.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireProjet } from '../src/parcours/projet.js';
import { calculerEtat } from '../src/parcours/etat.js';
import { pageDuParcours } from '../src/parcours/page.js';
import { ecranAInstaller, ecranDeLancement, FIN_JETONS } from '../src/parcours/ecrans.js';
import { ajouterPage, choisirCouleur, confirmerMarque, detteVue, echangerAccent, fondationsVues, retirerPage, rouvrirRevue, validerPages, validerRendu } from '../src/parcours/pages.js';
import { fondationsDe } from '../src/parcours/fondations.js';
import { aInstaller, ecrireRemise, message, pageEnDirect } from '../src/parcours/remise.js';
import { copierMessage } from '../src/parcours/pages.js';
import { faitsDuMoment } from '../src/parcours/faits.js';
import { servir } from '../src/parcours/serveur.js';
import { deNom } from '../src/lib/format.js';
import { lignesDuRegard, regarderSite } from '../src/parcours/regarder.js';
import { startFixtureServers } from './helpers/serveur.js';
import { request } from 'node:http';
import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FIX = join(ROOT, 'fixtures', 'parcours');
/** @param {string} m */
const etat = (m) => calculerEtat(lireProjet(join(FIX, m, 'projet.json')), { base: ROOT });
/** @param {string} m */
const copie = (m) => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'ds-lab-ecrans-')));
  cpSync(join(FIX, m), d, { recursive: true });
  return d;
};
/** Texte visible, balises ôtées. @param {string} html */
const texte = (html) => html.replace(/<style>.*?<\/style>/s, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
/** Les temps du fil, leur texte visible sans l'écran. @param {string} html */
const fil = (html) =>
  [.../** @type {RegExpExecArray} */ (/<nav class="fil"[^>]*>.*?<ol>(.*?)<\/ol><\/nav>/s.exec(html))[1].matchAll(/<li[^>]*>(.*?)<\/li>/g)].map((m) =>
    m[1].replace(/<small>.*?<\/small>/, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  );
/** Valeurs du style hors des jetons, ôtés variables, mots-clés, 0 et 100 %. @param {string} html */
const enDur = (html) => {
  const css = /** @type {RegExpExecArray} */ (/<style>(.*?)<\/style>/s.exec(html))[1];
  const reste = css.slice(css.indexOf(FIN_JETONS) + FIN_JETONS.length);
  return [...reste.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)]
    .map((m) => [m[1], m[2].replace(/var\(--[a-z0-9-]+\)/g, '').replace(/\b(?:0|100%)(?![\w.%])/g, '').replace(/\b[a-z]+(?:-[a-z]+)*\b/g, '').trim()])
    .filter(([, v]) => v);
};
/** Un faux fetch : chaque chemin, son statut et son type. @param {Record<string, [number, string, string]>} pages */
const faux = (pages) => /** @type {typeof fetch} */ (async (/** @type {any} */ u) => {
  const p = pages[new URL(String(u)).pathname] ?? [404, 'text/html', ''];
  return new Response(p[2], { status: p[0], headers: { 'content-type': p[1] } });
});

test('EC1 le lancement : quatre temps, quatre étapes, trois portes, l’adresse dans le chat ; il se recharge seul', () => {
  const h = ecranDeLancement();
  const t = texte(h);
  for (const s of ['Le parcours', 'Tu décides trois fois.', 'Porte 1 · la marque', 'Porte 2 · la revue', 'Porte 3 · avant, après', 'Elle se donne dans le chat, à gauche.'])
    assert.ok(t.includes(s), s);
  assert.deepEqual(fil(h), ['1 Mesurer', '2 Décider', '3 Vérifier', '4 Remettre']);
  assert.equal(h.match(/<li><span class="pt">/g)?.length, 4, 'quatre temps pas encore');
  assert.match(h, /<a class="accueil" href="\/" aria-label="ds-lab, retour au départ">/);
  assert.doesNotMatch(t, /Tenir|Poser|Rien à décider/);
  assert.equal(h.match(/<li class="etape">/g)?.length, 4);
  assert.doesNotMatch(h, /<button|<form|<script|\sstyle="/);
  assert.match(h, /<meta http-equiv="refresh" content="2">/);
  assert.deepEqual(enDur(h), []);
});

test('EC2 les pages : noms, vignettes, retirer, ajouter en dernière ligne ; ni barre ni mesure ; jamais de rechargement seul', () => {
  const h = pageDuParcours(etat('pages'));
  const t = texte(h);
  for (const s of ['Les pages à mesurer', 'La carte', 'Mon compte', '/desordre/gestion.html', 'Ajouter une page', 'Rien hors de cette liste n’est mesuré.', 'la mesure se lance dans le chat'])
    assert.ok(t.includes(s), s);
  assert.equal(h.match(/<img class="vignette papier" src="\/vignette\/orbe\?page=%2Fdesordre%2F[a-z]+\.html" alt="">/g)?.length, 3);
  assert.equal(h.match(/action="\/pages\/retirer"/g)?.length, 3);
  assert.match(h, /aria-label="Retirer La carte"/);
  // L'ajout est la dernière ligne de la liste ; ni barre, ni bouton de mesure.
  assert.match(h, /<li class="page"><form class="ajout" method="post" action="\/pages\/ajouter">.*<\/form><\/li>\n<\/ul>/);
  assert.doesNotMatch(h, /class="barre"|\/pages\/mesurer|class="principal"|Mesurer ces/);
  assert.doesNotMatch(h, /http-equiv="refresh"|<script|\sstyle="/);
  assert.deepEqual(enDur(h), []);
  assert.match(h, /<li class="ici" aria-current="step"><span class="pt">1<\/span><span class="nomme">Mesurer<small>Les pages<\/small><\/span>/);
  assert.doesNotMatch(t, /À toi de décider|Rien à décider/);
  // Sans page : la liste ne porte que l'ajout.
  assert.match(pageDuParcours(etat('lancement')), /<ul class="pages">\n\n<li class="page"><form class="ajout"/);
  // Le refus d'une page ajoutée, à côté du champ, la saisie gardée.
  const r = pageDuParcours(etat('pages'), { erreur: { site: 'orbe', message: 'Cette page ne répond pas (erreur 404).', saisie: '/perdue<b>' } });
  assert.match(r, /value="\/perdue&lt;b&gt;" aria-invalid="true" aria-describedby="erreur-orbe"/);
  assert.match(r, /<span class="erreur" id="erreur-orbe" role="status">Cette page ne répond pas \(erreur 404\)\.<\/span>/);
  // Plusieurs sites : un groupe par site, avec son nom et son hôte.
  const p = copie('plusieurs');
  const projet = JSON.parse(readFileSync(join(p, 'projet.json'), 'utf8'));
  projet.sites[0].name = 'Orbe Café';
  writeFileSync(join(p, 'projet.json'), JSON.stringify(projet));
  const e = calculerEtat(lireProjet(join(p, 'projet.json')), { base: p });
  e.moment = 'pages';
  const m = pageDuParcours(e);
  assert.equal(m.match(/<section class="site"/g)?.length, 3);
  assert.match(m, /<header><h2>Orbe Café<\/h2><small>127\.0\.0\.1:4173<\/small><\/header>/);
  assert.match(texte(m), /3 sites, un même produit\./);
});

test('EC3 projet.json : retirer, ajouter après vérification, valider ; le reste du fichier intact', async () => {
  const d = copie('pages');
  const f = join(d, 'projet.json');
  const avant = JSON.parse(readFileSync(f, 'utf8'));
  assert.deepEqual(lireProjet(f).sites[0].noms, { '/desordre/carte.html': 'La carte', '/desordre/compte.html': 'Mon compte' });
  retirerPage(f, 'orbe', '/desordre/compte.html');
  assert.deepEqual(JSON.parse(readFileSync(f, 'utf8')).sites[0].pages, [{ path: '/desordre/carte.html', name: 'La carte' }, '/desordre/gestion.html']);
  const chercher = faux({ '/index.html': [200, 'text/html; charset=utf-8', '<title> Accueil\n du café </title>'], '/image.png': [200, 'image/png', ''], '/perdue.html': [404, 'text/html', ''] });
  /** @param {string} s */
  const ajout = (s) => ajouterPage(f, 'orbe', s, { chercher });
  assert.deepEqual(await ajout(''), { ok: false, raison: 'Tape l’adresse d’une page de ce site.' });
  assert.deepEqual(await ajout('https://ailleurs.example/index.html'), { ok: false, raison: 'Cette page n’est pas sur 127.0.0.1:4173.' });
  assert.deepEqual(await ajout('/desordre/carte.html'), { ok: false, raison: 'Cette page est déjà dans la liste.' });
  assert.deepEqual(await ajout('perdue.html'), { ok: false, raison: 'Cette page n’existe pas sur ce site.' });
  assert.deepEqual(await ajout('/image.png'), { ok: false, raison: 'Cette adresse n’est pas une page.' });
  assert.deepEqual(await ajout('http://127.0.0.1:4173/index.html'), { ok: true, chemin: '/index.html' });
  const apres = JSON.parse(readFileSync(f, 'utf8'));
  assert.deepEqual(apres.sites[0].pages.at(-1), { path: '/index.html', name: 'Accueil du café' });
  assert.deepEqual({ ...apres, sites: [{ ...apres.sites[0], pages: avant.sites[0].pages }] }, avant);
  // Tant que la liste n'est pas validée, l'étape attend l'humain ; validée, la main passe à l'outil.
  assert.equal(calculerEtat(lireProjet(f), { base: d }).courante.cle, 'site');
  validerPages(f);
  const e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.etapes[0].etat, e.courante.cle, e.courante.main, e.moment], ['faite', 'constat', 'outil', 'mesure']);
  // Pendant la mesure : ce qui se passe, à quoi ça sert, un signe que ça tourne ; il se recharge seul.
  const m = pageDuParcours(e);
  assert.match(m, /<h1>Je mesure tes 3 pages<\/h1>/);
  assert.match(m, /<progress aria-label="Mesure en cours"><\/progress>/);
  assert.match(m, /<meta http-equiv="refresh" content="2">/);
  assert.doesNotMatch(texte(m), /[Cc]onstat/);
  assert.deepEqual(enDur(m), []);
  // Une page retirée après la validation la défait.
  retirerPage(f, 'orbe', '/index.html');
  assert.equal(calculerEtat(lireProjet(f), { base: d }).courante.cle, 'site');
});

/**
 * Lance la commande parcours, et rend son premier texte en sortie avec le processus.
 * @param {string[]} args
 */
function lancerParcours(args) {
  const p = spawn(process.execPath, [join(ROOT, 'src/cli/parcours.js'), ...args], { cwd: ROOT });
  let sortie = '';
  p.stdout.on('data', (c) => (sortie += c));
  return {
    p,
    /** @param {RegExp} motif */
    attendre: (motif) =>
      new Promise((ok, ko) => {
        const t = setInterval(() => {
          const m = motif.exec(sortie);
          if (m) clearInterval(t), ok(m);
        }, 50);
        p.on('exit', (code) => (clearInterval(t), motif.test(sortie) ? ok(motif.exec(sortie)) : ko(new Error(`sortie ${code} : ${sortie}`))));
      }),
    fin: () => new Promise((ok) => (p.exitCode !== null ? ok(p.exitCode) : p.on('exit', ok))),
  };
}

/** La commande parcours, jusqu'à sa fin. @param {string[]} args */
const parcours = (args) => spawnSync(process.execPath, [join(ROOT, 'src/cli/parcours.js'), ...args], { encoding: 'utf8' });

test('EC4 la commande : le lancement avant le projet, les formulaires, --passer pages', async () => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'ds-lab-ecrans-')));
  const f = join(d, 'projet.json');
  const s = lancerParcours([f, '--servir', '--port', '0']);
  try {
    const [, adresse] = /** @type {RegExpExecArray} */ (await s.attendre(/Lancement servi sur (http:\/\/127\.0\.0\.1:\d+\/)/));
    assert.match(await (await fetch(adresse)).text(), /<h1>Le parcours<\/h1>/);
    cpSync(join(FIX, 'pages'), d, { recursive: true });
    assert.match(await (await fetch(adresse)).text(), /<h1>Les pages à mesurer<\/h1>/);
    /** @param {string} chemin @param {Record<string, string>} c */
    const poster = (chemin, c) => fetch(adresse + chemin.slice(1), { method: 'POST', body: new URLSearchParams(c), redirect: 'manual' });
    const r1 = await poster('/pages/retirer', { site: 'orbe', page: '/desordre/gestion.html' });
    assert.deepEqual([r1.status, r1.headers.get('location')], [303, '/']);
    assert.doesNotMatch(await (await fetch(adresse)).text(), /gestion\.html/);
    const r2 = await poster('/pages/ajouter', { site: 'orbe', adresse: 'https://ailleurs.example/' });
    assert.equal(r2.status, 303);
    assert.match(await (await fetch(adresse + String(r2.headers.get('location')).slice(1))).text(), /Cette page n’est pas sur 127\.0\.0\.1:4173\./);
    // La mesure ne se lance plus depuis l'écran : l'ancien envoi ne valide rien.
    await poster('/pages/mesurer', {});
    assert.ok(!existsSync(join(d, 'sorties', 'pages.json')));
    const v = parcours([f, '--passer', 'pages']);
    assert.equal(v.status, 0, v.stderr);
    assert.match(v.stdout, /Écran : la mesure en cours/);
    assert.deepEqual(JSON.parse(readFileSync(join(d, 'sorties', 'pages.json'), 'utf8')), { orbe: ['/desordre/carte.html', '/desordre/compte.html'] });
    assert.match(await (await fetch(adresse)).text(), /<h1>Je mesure tes 2 pages<\/h1>/);
  } finally {
    s.p.kill();
  }
});

test('EC18 les pages par le chat : ajouter, retirer, plusieurs sites ; les refus en une ligne, sortie 1', async () => {
  /** @param {string} dossier @param {string[]} args */
  const lancer = (dossier, args) => spawnSync(process.execPath, [join(ROOT, 'src/cli/parcours.js'), join(dossier, 'projet.json'), ...args], { encoding: 'utf8' });
  const d = copie('pages');
  const pages = () => lireProjet(join(d, 'projet.json')).sites[0].pages;
  // Retirer : un chemin, ou l'adresse entière ; une page absente de la liste est refusée.
  assert.equal(lancer(d, ['--retirer-page', 'http://127.0.0.1:4173/desordre/gestion.html']).status, 0);
  assert.deepEqual(pages(), ['/desordre/carte.html', '/desordre/compte.html']);
  const absente = lancer(d, ['--retirer-page', '/desordre/gestion.html']);
  assert.deepEqual([absente.status, absente.stdout], [1, 'Cette page n’est pas dans la liste.\n']);
  // Ajouter : les vérifications de l'écran ; une page d'un autre site est refusée, sans rien changer.
  const ailleurs = lancer(d, ['--ajouter-page', 'https://ailleurs.example/']);
  assert.deepEqual([ailleurs.status, ailleurs.stdout], [1, 'Cette page n’est pas sur 127.0.0.1:4173.\n']);
  assert.deepEqual(pages(), ['/desordre/carte.html', '/desordre/compte.html']);
  // Liste vide : la mesure est refusée.
  lancer(d, ['--retirer-page', '/desordre/carte.html']);
  lancer(d, ['--retirer-page', '/desordre/compte.html']);
  const vide = lancer(d, ['--passer', 'pages']);
  assert.deepEqual([vide.status, vide.stdout], [1, 'Il faut une page au moins.\n']);
  assert.ok(!existsSync(join(d, 'sorties', 'pages.json')));
  // Hors du moment des pages : rien ne change.
  const m = copie('constat');
  const tard = lancer(m, ['--retirer-page', lireProjet(join(m, 'projet.json')).sites[0].pages[0]]);
  assert.deepEqual([tard.status, tard.stdout], [1, 'Les pages ne changent plus : la mesure est lancée ou faite.\n']);
  // Plusieurs sites : --site nomme le site.
  const p = copie('pages');
  const brut = JSON.parse(readFileSync(join(p, 'projet.json'), 'utf8'));
  brut.sites.push({ id: 'ecume', url: 'http://127.0.0.1:4173', pages: ['/annuaire/liste.html', '/annuaire/fiche.html'] });
  writeFileSync(join(p, 'projet.json'), JSON.stringify(brut));
  const [a, b] = lireProjet(join(p, 'projet.json')).sites;
  const sans = lancer(p, ['--retirer-page', b.pages[0]]);
  assert.equal(sans.status, 1);
  assert.match(sans.stdout, new RegExp(`^Plusieurs sites : nomme le site par --site \\(${a.id}, ${b.id}`));
  assert.equal(lancer(p, ['--site', b.id, '--retirer-page', b.pages[0]]).status, 0, 'le site nommé');
  assert.deepEqual(lireProjet(join(p, 'projet.json')).sites.find((x) => x.id === b.id)?.pages, b.pages.slice(1));
  assert.equal(lancer(p, ['--site', 'inconnu', '--retirer-page', '/x']).status, 1);
  // Les options mêlées sont une panne de la commande.
  for (const args of [['--passer', 'pages', '--retirer-page', '/x'], ['--passer', 'pages', '--revenir'], ['--passer', 'ailleurs'], ['--passer', 'pages', '--servir'], ['--attendre'], ['--site', b.id]])
    assert.equal(lancer(p, args).status, 2, args.join(' '));
});

test('EC19 regarder le site sans le montrer : les pages du même site, leurs composants comptés, les plus riches d’abord', async () => {
  const srv = await startFixtureServers();
  try {
    const r = await regarderSite(`${srv.origin}/desordre/carte.html`);
    assert.ok(r.ok);
    assert.equal(r.origine, srv.origin);
    assert.deepEqual(r.pages.map((p) => [p.chemin, p.titre]), [
      ['/desordre/gestion.html', 'Orbe Café — gestion des commandes'],
      ['/desordre/compte.html', 'Orbe Café — mon compte'],
      ['/desordre/carte.html', 'Orbe Café — la carte'],
    ]);
    for (const p of r.pages) assert.equal(p.total, Object.values(p.composants).reduce((a, b) => a + b, 0));
    assert.ok(r.pages[0].total > r.pages[1].total && r.pages[1].total > r.pages[2].total);
    assert.ok(r.pages[1].composants.champs > 0 && r.pages[1].composants.formulaires > 0, 'le compte a son formulaire');
    const l = lignesDuRegard(r);
    assert.match(l[0], /: 3 pages regardées, sans fenêtre ; les plus riches en composants d'abord\.$/);
    assert.match(l[1], /^ {2}\/desordre\/gestion\.html {2}Orbe Café — gestion des commandes {2}\d+ composants : /);
    // Au plus tant de pages : le reste est compté, pas regardé.
    const un = await regarderSite(`${srv.origin}/desordre/carte.html`, { max: 1 });
    assert.ok(un.ok);
    assert.deepEqual([un.pages.length, un.nonVues], [1, 2]);
  } finally {
    await srv.close();
  }
  const ferme = spawnSync(process.execPath, [join(ROOT, 'src/cli/parcours.js'), '--regarder', 'http://127.0.0.1:9/'], { encoding: 'utf8' });
  assert.deepEqual([ferme.status, ferme.stdout], [1, '127.0.0.1:9 ne répond pas.\n']);
  const mele = spawnSync(process.execPath, [join(ROOT, 'src/cli/parcours.js'), join(FIX, 'pages', 'projet.json'), '--regarder', 'http://127.0.0.1:9/'], { encoding: 'utf8' });
  assert.equal(mele.status, 2);
});

test('EC5 la dette : les valeurs comptées, dites et dessinées ; les composants par type ; rien à décider', () => {
  const e = etat('constat');
  assert.equal(e.moment, 'dette');
  const h = pageDuParcours(e);
  const t = texte(h);
  for (const x of [
    'La dette d’Annuaire des cafés',
    '3 pages mesurées :',
    'Les valeurs',
    '70 valeurs différentes affichées sur ces pages',
    // 33, comme la réduction (D86) : les 31 du relevé, le fond de la page (#faf6ef, body) et #24426f, vu seulement au survol.
    'Couleurs 33',
    'Dont 21 gris, et 17 presque identiques à une autre. L’une ne se voit qu’au survol, au focus ou à l’appui. Le code en écrit 42. Six autres viennent du contenu (images, pictogrammes) : mises de côté.',
    'Tailles de texte 13',
    'Cinq sont des valeurs à virgule, en bleu. Le code en écrit 14.',
    'Espacements 16',
    'Huit sont hors d’une grille de 4 px, en bleu. Valeurs en pixels.',
    'Arrondis 8',
    'Trois façons d’écrire un rond : 50 %, 999 et 9999. Le code en écrit 9.',
    '11 versions pour 3 types de composants, sur 30 éléments relevés. Aucun ne vient d’un framework.',
    'Lien 4 versions',
    '18 emplois sur 3 pages. Quatre hauteurs : 16, 21, 24 et 31 px. 12 n’ont aucun style.',
    'Bouton avec texte 5 versions',
    'À regarder aussi',
    '39 blocs répétés que l’outil ne sait pas nommer : à trier plus tard.',
    '5 éléments sur 30 ont une zone de clic de moins de 24 px.',
  ])
    assert.ok(t.includes(x), x);
  assert.match(h, /<a href="\/sorties\/audit\/orbe\/127\.0\.0\.1_4173\/2026-11-24T1330\/rapport\.html">Voir toutes les valeurs<\/a>/);
  assert.match(h, /<a href="\/sorties\/composants\/orbe\/127\.0\.0\.1_4173\/2026-11-24T1330\/constat\.html">Voir tous les composants<\/a>/);
  assert.equal(h.match(/<img class="papier" src="\/sorties\/composants\/orbe\/127\.0\.0\.1_4173\/2026-11-24T1330\/captures\/p\d-e\d+\.png"/g)?.length, 11);
  assert.match(h, /<rect x="0\.5" y="0\.5" width="23" height="23" rx="4" fill="#999999"\/>/);
  assert.match(h, /<li class="hors"><svg [^>]*><title>10\.5px, 1 fois<\/title><text x="0" y="10\.5" font-size="10\.5"/);
  assert.doesNotMatch(h, /<form|Passer à ta marque/);
  assert.doesNotMatch(t, /[Cc]onstat/);
  assert.doesNotMatch(h, /<script|\sstyle="|http-equiv="refresh"/);
  assert.deepEqual(enDur(h), []);
  // Sans audit : les composants seuls, sans phrase ni chiffre inventés.
  const d = copie('constat');
  rmSync(join(d, 'sorties', 'audit'), { recursive: true });
  const sans = pageDuParcours(calculerEtat(lireProjet(join(d, 'projet.json')), { base: d }));
  assert.doesNotMatch(sans, /Les valeurs|Voir toutes les valeurs/);
  assert.match(texte(sans), /Les composants/);
});

test('EC6 « Passer à ta marque », dans le chat : la dette vue, la marque reprend son cours ; un second passage est refusé', () => {
  const d = copie('constat');
  const f = join(d, 'projet.json');
  // Pas avant son moment : la dette ne se passe pas depuis un autre écran.
  const tot = parcours([f, '--passer', 'marque']);
  assert.deepEqual([tot.status, tot.stdout], [1, 'Ce n’est pas le moment : l’écran du moment est la dette.\n']);
  const r = parcours([f, '--passer', 'dette']);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(d, 'sorties', 'dette.json')));
  const e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.moment, e.courante.action], ['jetons', 'saisir la marque']);
  // Un second « ok » ne saute pas un écran.
  assert.equal(parcours([f, '--passer', 'dette']).status, 1);
});

/** Une copie du projet mesuré, la dette vue, sans entrée de marque : le moment de la marque. */
const aLaMarque = () => {
  const d = copie('constat');
  const f = join(d, 'projet.json');
  const p = JSON.parse(readFileSync(f, 'utf8'));
  delete p.sites[0].brand;
  writeFileSync(f, JSON.stringify(p, null, 2));
  rmSync(join(d, 'marques'), { recursive: true });
  detteVue(f);
  return { d, f };
};

test('EC7 la marque, lue dans la mesure : deux couleurs et la police, d’où elles viennent, ce que l’outil en fait', () => {
  const { d, f } = aLaMarque();
  const e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.moment, e.courante.main, e.courante.action], ['marque', 'designer', 'choisir la marque à l’écran, puis la confirmer']);
  assert.deepEqual(e.marque?.choix, { primary: '#2b4c7e', accent: '#f0c987', troisieme: '#d0563f', police: ['Orbe Sans', 'Arial', 'sans-serif'] });
  const h = pageDuParcours(e);
  const t = texte(h);
  for (const x of [
    'La marque d’Annuaire des cafés',
    'C’est quoi Diapason ?',
    'Couleur primaire #2b4c7e Lue sur 19 éléments de tes pages, dont 15 qui se cliquent. C’est ce qui se clique.',
    'Ta couleur exacte est sur le bouton, avec un texte blanc. C’est le pas 9, encadré.',
    'Accent #f0c987 Lue sur 6 éléments de tes pages. Facultatif.',
    'Ta couleur exacte est sur les aplats, avec un texte foncé.',
    '#d0563f, lue sur 2 éléments. Une marque garde deux couleurs : celle-ci ira sur red, l’échelle de la palette qui a sa teinte.',
    'Police des titres Orbe Sans Lue sur 17 titres de tes pages.',
    'Marque acceptée',
  ])
    assert.ok(t.includes(x), x);
  assert.equal(h.match(/<ul class="echelle" aria-label="Les douze pas">/g)?.length, 2);
  assert.match(h, /<li class="plein"><svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="4" fill="#2b4c7e"\/>/);
  assert.doesNotMatch(h, /Confirmer la marque|action="\/pages\/marque"/);
  assert.doesNotMatch(t, /[Cc]onstat|checkValise|entrée|\.json/);
  assert.doesNotMatch(h, /<script|\sstyle="|http-equiv="refresh"/);
  assert.deepEqual(enDur(h), []);
});

test('EC8 confirmer la marque, dans le chat : l’entrée écrite, la main à l’outil ; une marque refusée ne se confirme pas', () => {
  const { d, f } = aLaMarque();
  const ok = parcours([f, '--passer', 'marque']);
  assert.equal(ok.status, 0, ok.stderr);
  assert.deepEqual(JSON.parse(readFileSync(join(d, 'marques', 'orbe', 'entree.json'), 'utf8')), {
    name: 'Annuaire des cafés',
    primary: '#2b4c7e',
    accent: '#f0c987',
    fonts: { heading: ['Orbe Sans', 'Arial', 'sans-serif'] },
  });
  assert.equal(JSON.parse(readFileSync(f, 'utf8')).sites[0].brand, 'marques/orbe/entree.json');
  const e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.courante.main, e.courante.action, e.moment], ['outil', 'saisir la marque', 'jetons']);
  // Refusée : une primaire qui ne donne pas douze pas distincts.
  const r = aLaMarque();
  writeFileSync(join(r.d, 'sorties', 'marque.json'), JSON.stringify({ orbe: { primary: '#00ccff' } }));
  const h = pageDuParcours(calculerEtat(lireProjet(r.f), { base: r.d }));
  assert.match(texte(h), /Couleur primaire #00ccff .* Cette couleur ne donne pas douze nuances distinctes : ses tons clairs se confondent avec elle\. Essaie une couleur plus foncée\./);
  assert.match(texte(h), /Marque refusée : change la couleur dite plus haut\./);
  assert.throws(() => confirmerMarque(r.f), /une marque refusée ne se confirme pas/);
  // Dans le chat : pas de bouton ; la commande dit quelle couleur changer, les faits aussi.
  const non = parcours([r.f, '--passer', 'marque']);
  assert.deepEqual([non.status, non.stdout], [1, 'La marque est refusée : change la couleur primaire à l’écran, puis confirme.\n']);
  assert.ok(!existsSync(join(r.d, 'marques', 'orbe', 'entree.json')));
  const fa = faitsDuMoment(calculerEtat(lireProjet(r.f), { base: r.d }), { sorties: join(r.d, 'sorties') });
  assert.ok(fa.some((l) => /^ {2}Ensuite : la marque est refusée : .*changer la couleur primaire à droite, sans bouton/.test(l)), fa.join('\n'));
});

test('EC9 modifier la marque : une couleur relevée, un code tapé, l’échange avec la troisième ; le bloc se recalcule', () => {
  const { d, f } = aLaMarque();
  const choix = () => calculerEtat(lireProjet(f), { base: d }).marque?.choix;
  const h0 = pageDuParcours(calculerEtat(lireProjet(f), { base: d }));
  assert.match(h0, /<button type="submit" name="hex" value="#2b4c7e" aria-pressed="true" aria-label="Prendre #2b4c7e, lue sur 19 éléments"/);
  assert.match(h0, /<form method="post" action="\/pages\/marque\/echanger"><button type="submit" class="retirer">Échanger avec l’accent<\/button><\/form>/);
  echangerAccent(f);
  assert.deepEqual([choix()?.accent, choix()?.troisieme], ['#d0563f', '#f0c987']);
  // Le terracotta en accent : l'aplat prend un pas plus foncé, dit sous le bloc.
  assert.match(texte(pageDuParcours(calculerEtat(lireProjet(f), { base: d }))), /Accent #d0563f Lue sur 2 éléments de tes pages\..* Adaptée pour les aplats : ils prennent le pas 11, encadré\./);
  assert.equal(choisirCouleur(f, 'primary', 'F0C987'), null);
  assert.deepEqual(choix(), { primary: '#f0c987', accent: '#d0563f', troisieme: '#2b4c7e', police: ['Orbe Sans', 'Arial', 'sans-serif'] });
  // La valeur que porte déjà l'autre couleur s'échange avec elle.
  assert.equal(choisirCouleur(f, 'accent', '#f0c987'), null);
  assert.deepEqual([choix()?.primary, choix()?.accent], ['#d0563f', '#f0c987']);
  assert.equal(choisirCouleur(f, 'primary', '#abc'), null);
  assert.equal(choix()?.primary, '#aabbcc');
  assert.equal(choisirCouleur(f, 'accent', 'bleu'), 'Tape un code de couleur à six chiffres, comme #2b4c7e.');
  const r = pageDuParcours(calculerEtat(lireProjet(f), { base: d }), { erreur: { site: 'accent', message: 'Tape un code de couleur à six chiffres, comme #2b4c7e.', saisie: 'bleu' } });
  assert.match(r, /<details class="modifier" open><summary>Modifier<\/summary>/);
  assert.match(r, /value="bleu" aria-invalid="true" aria-describedby="erreur-accent"/);
  assert.deepEqual(enDur(r), []);
});

/** La marque confirmée, puis la commande que donne le parcours, lancée depuis la racine : le moment des fondations. */
const auxFondations = () => {
  const { d, f } = aLaMarque();
  confirmerMarque(f);
  const avant = calculerEtat(lireProjet(f), { base: ROOT });
  const r = spawnSync('sh', ['-c', /** @type {string} */ (avant.courante.commande)], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return { d, f, avant };
};

test('EC10 après « Confirmer la marque » : l’attente, puis les fondations calculées pour la marque du projet', () => {
  const { d, f, avant } = auxFondations();
  assert.equal(avant.moment, 'jetons');
  assert.match(/** @type {string} */ (avant.courante.commande), /npm run saisie -- .* && node src\/cli\/planche\.js --marque .* && npm run css -- --marque .* && npm run vuetify -- --marque /);
  const attente = pageDuParcours(avant);
  assert.ok(texte(attente).includes('Je prépare tes fondations'));
  assert.match(attente, /<meta http-equiv="refresh" content="2">/);
  assert.deepEqual(enDur(attente), []);
  const e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.moment, e.courante.cle, e.courante.main, e.courante.action, e.courante.commande], ['fondations', 'decisions', 'designer', 'regarder les fondations, puis comparer ton site', null]);
  const fo = /** @type {NonNullable<typeof e.fondations>} */ (e.fondations);
  assert.equal(fo.primaire[8], '#2b4c7e');
  assert.equal(fo.accent?.length, 12);
  assert.deepEqual([fo.espacements, fo.tailles, fo.rayons.map((x) => x.nom)], [[0, 4, 8, 12, 16, 24, 32, 48, 64], [12, 14, 16, 18, 20, 24, 30, 36, 48, 60], ['0', '2', '4', '8', '12', 'full']]);
  assert.deepEqual(fo.relations.map((x) => x.px), [4, 8, 16, 24, 48]);
  assert.deepEqual([fo.paires.echec, fo.paires.contextes, fo.avant], [0, 4, 70]);
  assert.ok(fo.paires.controlees > 60 && fo.paires.interdites > 0 && fo.regles > 30);
  assert.deepEqual(fo.preuves.map((x) => x.titre), ['Format standard', 'Trois couches', 'Accessibilité', 'Quatre contextes', 'Prêt pour le code', 'Règles sourcées']);
  const h = pageDuParcours(e);
  const t = texte(h);
  for (const x of [
    'Les fondations d’Annuaire des cafés',
    'Ce qui vient d’être préparé à partir de ta marque. Rien n’est encore posé sur ton site.',
    '1 · Les valeurs',
    'Tes pages affichaient 70 valeurs différentes.',
    'Primaire, 12 pas',
    'Accent, 12 pas',
    '2 · Les rôles',
    `${fo.roles.fonds} fonds`,
    'Cinq relations d’espace',
    'Entre deux sections 48 px',
    '3 · Les règles',
    `${fo.paires.controlees} paires texte et fond contrôlées`,
    '0 en échec',
    'La planche des rôles · des espacements · des textes',
    '✓ · Dans les règles de l’art',
    'Limites connues : pas encore de tokens d’ombre ni de superposition',
    'Pas encore · posées sur ton site au temps 3, Vérifier',
    'Pas encore · les composants remplacés dans ton code au temps 4, Remettre',
  ])
    assert.ok(t.includes(x), x);
  assert.match(h, /<a href="\/marques\/orbe\/roles\.html">La planche des rôles<\/a>/);
  assert.doesNotMatch(h, /<form|Comparer mon site/);
  assert.doesNotMatch(t, /[Cc]onstat|\.json|Voir les composants/);
  // Le chat : sans chiffre récité ; un seul bouton, Comparer mon site.
  const fa = faitsDuMoment(e, { sorties: join(d, 'sorties') });
  assert.ok(fa.includes('  Écran : les fondations'), fa.join('\n'));
  assert.ok(fa.some((l) => /^ {2}Ensuite : l’écran devant et vérifié, puis la boîte de fin de tour : les fondations sont prêtes, à sa marque, pas encore sur le site ; ni chiffre ni liste ; un seul bouton, Comparer mon site ; .* parcours --passer fondations$/.test(l)));
  assert.ok(!fa.some((l) => l.startsWith('  Chiffre')));
  assert.doesNotMatch(h, /<script|\sstyle="|http-equiv="refresh"/);
  assert.deepEqual(enDur(h), []);
});

test('EC11 « Comparer mon site », dans le chat : la main à l’outil ; une preuve fausse pour la marque n’est pas rendue', () => {
  const { d, f } = auxFondations();
  const r = parcours([f, '--passer', 'fondations']);
  assert.equal(r.status, 0, r.stderr);
  const e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.moment, e.courante.main, e.courante.action, e.fondations], ['ecran', 'outil', 'lancer la réduction', null]);
  assert.match(/** @type {string} */ (e.courante.commande), /^npm run reduce -- .* --brand-colors/);
  // Sans feuille CSS, la preuve « Prêt pour le code » se retire ; dans le parcours, la marque attend son écriture.
  const dossier = join(d, 'marques', 'orbe');
  rmSync(join(dossier, 'jetons.css'));
  assert.ok(!fondationsDe(dossier).preuves.some((x) => x.titre === 'Prêt pour le code'));
  rmSync(join(d, 'sorties', 'fondations.json'));
  const g = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([g.moment, g.courante.cle, g.courante.main], ['jetons', 'marques', 'outil']);
  assert.match(/** @type {string} */ (g.courante.commande), /npm run css -- --marque/);
  assert.ok(existsSync(join(dossier, 'vuetify.json')));
});

/** Une copie du bilan dont le rendu n'est pas encore validé : l'avant et après. */
const avantApres = () => {
  const d = copie('bilan');
  rmSync(join(d, 'sorties', 'avant-apres.json'));
  return { d, f: join(d, 'projet.json') };
};

test('EC12 l’avant et après : un onglet par page, la bascule sans script, le compte et quatre cartes', () => {
  const { d, f } = avantApres();
  const e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.moment, e.courante.cle, e.courante.main, e.courante.action, e.courante.commande], ['avant-apres', 'livraison', 'designer', 'regarder l’avant et après, puis valider le rendu', null]);
  const h = pageDuParcours(e);
  const t = texte(h);
  for (const x of [
    'Avant, après',
    'Tes 15 décisions et les réglages de l’outil, ensemble, sur les 3 pages mesurées. C’est un aperçu : rien n’est encore installé sur ton site.',
    // Le verdict : 55 lignes, 54 arrivées, une seulement au survol.
    '55 changements, 54 arrivés',
    'Visible seulement au survol, au focus ou à l’appui, à regarder à la main : Fond · bouton « Commander à emporter » (au survol)',
    // Par famille, les lignes du manifeste : 33 couleurs, 11 espacements, 7 tailles, 4 arrondis.
    'Couleurs 33', 'Espacements 11', 'Tailles de texte 7', 'Arrondis 4',
    // L'exemple : la ligne qui touche le plus d'éléments (54 pour #999999 → #958f84).
    '#999999 → #958f84', 'dont texte « N° » et 53 autres (textes, blocs)',
    '15 px → 16 px',
  ])
    assert.ok(t.includes(x), x);
  // Les pages sans nom : leur chemin ; un onglet, une vue et une règle par page ; la première cochée.
  assert.equal(h.match(/<input type="radio" name="page" id="page-\d" class="choix-page"/g)?.length, 3);
  assert.match(h, /<input type="radio" name="page" id="page-0" class="choix-page" checked><label for="page-0">\/desordre\/carte\.html<\/label>/);
  assert.match(h, /#page-2:checked ~ \.vues > \.vue-2 \{ display: flex; \}/);
  // Après, coché par défaut ; la plus haute tient le cadre (carte : avant 12 px, après 10 ; gestion : 9 et 11).
  assert.match(h, /<input type="radio" name="bascule-0" id="apres-0" class="voir-apres" checked>/);
  assert.match(h, /<img class="avant fond" src="\/sorties\/verify\/127\.0\.0\.1_4173\/2026-11-24T1336\/carte\/avant\.png" alt="\/desordre\/carte\.html, avant"><img class="apres dessus" src="\/sorties\/verify\/127\.0\.0\.1_4173\/2026-11-24T1336\/carte\/actuel\.png"/);
  assert.match(h, /<img class="avant dessus" src="[^"]*gestion\/avant\.png"[^>]*><img class="apres fond"/);
  assert.match(h, /<rect x="0\.5" y="0\.5" width="23" height="23" rx="6" fill="#999999"/);
  assert.doesNotMatch(h, /<form|Valider le rendu|Revenir sur une décision/);
  assert.doesNotMatch(t, /[Ll]ignes?\b|seuils/);
  assert.doesNotMatch(h, /<script|\sstyle="|http-equiv="refresh"/);
  assert.deepEqual(enDur(h), []);
  // Pour le chat : une phrase, sans chiffre ni développeur.
  const l = faitsDuMoment(e, { sorties: join(d, 'sorties') });
  assert.ok(l.includes('  Écran : l’avant et après'));
  assert.ok(l.some((x) => /un seul bouton, Valider le rendu ; .*parcours --passer rendu ; revenir sur une décision se dit dans le texte et se tape : parcours --revenir$/.test(x)), l.join('\n'));
  assert.ok(!l.some((x) => /^  (Chiffre|Au développeur|Pas arrivé) :/.test(x)), l.join('\n'));
  // Sans l'image d'avant, ou pour d'autres feuilles que celles de la réduction : la vérification se refait.
  const v = join(d, 'sorties/verify/127.0.0.1_4173/2026-11-24T1336');
  rmSync(join(v, 'compte', 'avant.png'));
  let g = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([g.moment, g.courante.main, g.courante.action], ['sans-ecran', 'outil', 'prouver la livraison sur les pages, avant et après']);
  assert.match(/** @type {string} */ (g.courante.commande), / --ajout sorties\/ajout\/2026-11-24T1335 --out sorties\/verify$/);
  cpSync(join(v, 'carte', 'avant.png'), join(v, 'compte', 'avant.png'));
  writeFileSync(join(v, 'carte', 'verification.json'), JSON.stringify({ ajout: 'sorties/ajout' }));
  g = calculerEtat(lireProjet(f), { base: d });
  assert.equal(g.courante.action, 'prouver la livraison sur les pages, avant et après');
});

test('EC13 « Valider le rendu » et « Revenir sur une décision », dans le chat', () => {
  const { d, f } = avantApres();
  const v = parcours([f, '--passer', 'rendu']);
  assert.equal(v.status, 0, v.stderr);
  assert.deepEqual(JSON.parse(readFileSync(join(d, 'sorties', 'avant-apres.json'), 'utf8')), { verification: '2026-11-24T1336' });
  let e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.moment, e.courante.cle], ['remise', 'suivi']);
  assert.match(pageDuParcours(e), /<h1>La remise<\/h1>/);
  // La remise écrite à côté du projet (D87) : les feuilles, « À installer », le message.
  for (const x of ['remise/a-installer.md', 'remise/message.txt', 'remise/remise.json', 'remise/feuilles/desordre/styles/tokens.css', 'remise/feuilles/desordre/styles/recente.ajout.css'])
    assert.ok(existsSync(join(d, x)), x);
  // Revenir : seulement à l'avant et après ; la revue rouverte au designer, le rendu plus validé.
  assert.equal(parcours([f, '--revenir']).status, 1, 'à la remise, rien à revenir');
  const { d: d2, f: f2 } = avantApres();
  assert.equal(parcours([f2, '--revenir']).status, 0);
  assert.ok(existsSync(join(d2, 'sorties', 'revue.json')));
  rouvrirRevue(f);
  assert.ok(!existsSync(join(d, 'sorties', 'avant-apres.json')));
  e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.moment, e.courante.cle, e.courante.main, e.ecran?.href], ['ecran', 'decisions', 'designer', '/sorties/reductions/127.0.0.1_4173/2026-11-24T1335/revue.html']);
  assert.match(String(e.courante.action), /^revenir sur une décision dans la revue, puis exporter/);
  assert.ok(faitsDuMoment(e, { sorties: join(d, 'sorties') }).includes('  Écran : la revue'));
  // Un nouvel export : l'outil relance la réduction avec lui.
  const choix = JSON.parse(readFileSync(join(d, 'sorties', 'decisions.json'), 'utf8'));
  writeFileSync(join(d, 'sorties', 'decisions.json'), JSON.stringify({ ...choix, 'plein|terre': 'remplacer' }));
  e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.courante.cle, e.courante.main, e.courante.action], ['decisions', 'outil', 'relancer la réduction avec les décisions']);
  // La réduction refaite : ses feuilles à poser, rangées sous son nom ; la vérification d'avant ne vaut plus.
  const r = join(d, 'sorties/reductions/127.0.0.1_4173');
  cpSync(join(r, '2026-11-24T1335'), join(r, '2026-11-24T1340'), { recursive: true });
  const t = JSON.parse(readFileSync(join(r, '2026-11-24T1340', 'table.json'), 'utf8'));
  t.decisions = JSON.parse(readFileSync(join(d, 'sorties', 'decisions.json'), 'utf8'));
  writeFileSync(join(r, '2026-11-24T1340', 'table.json'), JSON.stringify(t));
  e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.courante.cle, e.courante.action], ['livraison', 'poser les feuilles ajoutées']);
  assert.match(/** @type {string} */ (e.courante.commande), / --sortie sorties\/ajout\/2026-11-24T1340$/);
});

test('EC14 la remise : trois étapes et leurs comptes, « À installer », le message ; l’écran et « Copier le message »', () => {
  const d = copie('bilan');
  const f = join(d, 'projet.json');
  const e = calculerEtat(lireProjet(f), { base: d });
  const r = /** @type {NonNullable<typeof e.remise>} */ (e.remise);
  // Le manifeste de la partie du 25/11 : 4 feuilles ajoutées ; la carte en charge 2, le compte 2, la gestion 2.
  assert.deepEqual([r.ajouts.length, r.pages.map((p) => p.apres.length), r.lignes, r.fichiers.length], [4, [2, 2, 2], 9, 4]);
  assert.equal(r.dossier, join(d, 'remise'));
  const md = aInstaller(r);
  for (const x of ['# À installer : Annuaire des cafés', '## 1. Installer le système', '## 2. Poser les décisions', '## 3. Reprendre l’ancien code', '<link rel="stylesheet" href="/desordre/styles/tokens.css">', '### `/desordre/carte.html`', 'Juste après `<link rel="stylesheet" href="/desordre/styles/recente.css">` :', '<link rel="stylesheet" href="/desordre/styles/recente.ajout.css">'])
    assert.ok(md.includes(x), x);
  // Une case par fichier, les valeurs regroupées par sélecteur ; les quatre côtés réunis en raccourci.
  assert.equal(md.match(/^- \[ \] `\/desordre\/styles\/[a-z]+\.css` \(\d+ valeurs\)$/gm)?.length, 4);
  assert.match(md, /^ {2}- `\.bouton-principal, \.bouton-secondaire`, ligne 104 : .*`padding: 8px 16px` → `var\(--space-8, 8px\) var\(--space-16, 16px\)`/m);
  // Deux côtés seulement (haut et bas) restent en propriétés longues.
  assert.match(md, /`\.commande`, ligne 136 : .*`padding-bottom: 12px` → `var\(--space-12, 12px\)` ; `padding-top: 12px`/);
  assert.doesNotMatch(md, /border-top-left-radius/);
  assert.doesNotMatch(md, /rattach|perte|\bgarde\b|^\s*-? ?`?(coul|esp|tail|arr)-\d/im);
  assert.match(message(r), /^Voici la remise de ds-lab pour Annuaire des cafés, dans le dossier .*\/remise\. Ouvre a-installer\.md/);
  // Un dossier remise/ que l'outil n'a pas écrit n'est pas touché.
  writeFileSync(join(d, 'remise'), '');
  rmSync(join(d, 'remise'));
  cpSync(join(FIX, 'pages'), join(d, 'remise'), { recursive: true });
  assert.throws(() => ecrireRemise(r, { dossierAjout: join(d, 'sorties/ajout/2026-11-24T1335'), verification: 'x' }), /n’a pas été écrit par l’outil/);
  rmSync(join(d, 'remise'), { recursive: true });
  // L'écran : trois cartes et leurs comptes, le dossier, le message, la copie.
  const h = pageDuParcours(e);
  const t = texte(h);
  for (const x of ['La remise', 'Trois étapes', '1 · Installer le système', '3 lignes à coller, une par page', '4 feuilles ajoutées', '6 lignes à coller', `dans 4 fichiers`, 'Ouvrir « À installer »', 'Copier le message', '3 choix restent reportés'])
    assert.ok(t.includes(x), x);
  assert.match(h, /<textarea class="message" readonly rows="6" aria-labelledby="t-message">Voici la remise/);
  // « Copier le message », sous le message, dans sa section.
  assert.match(h, /<\/textarea>\n<div class="actions"><form method="post" action="\/pages\/copier"><button type="submit" class="principal">Copier le message<\/button><\/form><\/div><\/section>/);
  assert.doesNotMatch(h, /Copié\./);
  assert.match(pageDuParcours(e, { copie: 'ok' }), /<span class="accepte" role="status">Copié\.<\/span>/);
  assert.match(pageDuParcours(e, { copie: 'non' }), /Copie impossible ici : sélectionne le message\./);
  assert.deepEqual(enDur(h), []);
  /** @type {string[]} */
  const copies = [];
  assert.equal(copierMessage(f, { copier: (x) => void copies.push(x) }), true);
  assert.equal(copies[0], message(r));
  assert.equal(copierMessage(f, { copier: () => { throw new Error('pas de presse-papiers'); } }), false);
});

test('EC15 la page en direct : base, tokens en tête, chaque feuille ajoutée après la sienne ; les liens restent en direct', () => {
  const html = '<!doctype html><html><head><title>x</title><link rel="stylesheet" href="/s/a.css" media="screen"><link rel="stylesheet" href="https://ailleurs.example/s/a.css"><link rel="icon" href="/i.png"></head><body><a href="/p/2.html#haut">2</a><a href="#bas">bas</a><a href="https://ailleurs.example/p/2.html">x</a></body></html>';
  const p = pageEnDirect(html, 'http://127.0.0.1:4173/p/1.html', { tokens: ':root{--x:1px}', ajouts: [{ feuille: '/s/a.css', texte: 'b{c:d}' }], liens: (c) => (c === '/p/2.html' ? 'http://127.0.0.1:9/direct/orbe?page=%2Fp%2F2.html' : null) });
  assert.ok(p.startsWith('<!doctype html><html><head><base href="http://127.0.0.1:4173/p/1.html"><style data-ds-lab-ajout>:root{--x:1px}</style><title>'), p);
  assert.ok(p.includes('<link rel="stylesheet" href="/s/a.css" media="screen"><style data-ds-lab-ajout media="screen">b{c:d}</style><link rel="stylesheet" href="https://ailleurs.example/s/a.css"><link rel="icon"'), p);
  assert.ok(p.includes('<a href="http://127.0.0.1:9/direct/orbe?page=%2Fp%2F2.html#haut">2</a><a href="#bas">bas</a><a href="https://ailleurs.example/p/2.html">'), p);
});

/** Chaque fichier d'un dossier et l'empreinte de son contenu. @param {string} d @returns {Record<string, string>} */
const instantane = (d) =>
  Object.fromEntries(
    /** @type {string[]} */ (readdirSync(d, { recursive: true, encoding: 'utf8' }))
      .filter((x) => {
        try {
          return readFileSync(join(d, x)) && true;
        } catch {
          return false;
        }
      })
      .sort()
      .map((x) => [x, createHash('sha256').update(readFileSync(join(d, x))).digest('hex')]),
  );

test('EC16 le fil : fait, ici, pas encore ; un temps fait mène à son dernier écran ; « ds-lab » au départ ; ni puce ni pointillé ; l’élision', () => {
  const b = pageDuParcours(etat('bilan'));
  assert.deepEqual(fil(b), ['Mesurer', 'Décider', 'Vérifier', '4 Remettre']);
  for (const [nom, k] of [['Mesurer', 'pages'], ['Décider', 'revue'], ['Vérifier', 'avant-apres']]) assert.ok(b.includes(`<li class="fait"><a href="/?voir=${k}" aria-label="${nom}, fait, revoir">`), nom);
  assert.match(b, /<li class="ici" aria-current="step"><span class="pt">4<\/span><span class="nomme">Remettre<small>La remise<\/small><\/span><\/li>/);
  assert.match(b, /<a class="accueil" href="\/\?voir=depart" aria-label="ds-lab, retour au départ">/);
  const d = pageDuParcours(etat('constat'));
  assert.deepEqual(fil(d), ['Mesurer', '2 Décider', '3 Vérifier', '4 Remettre']);
  assert.match(d, /<span class="nomme">Décider<small>La dette<\/small>/);
  // Un temps fait sans écran à revoir : la pastille pleine, sans lien.
  const e = etat('constat');
  e.revoir = [];
  assert.match(pageDuParcours(e), /<li class="fait"><span class="pt" role="img" aria-label="fait">/);
  for (const m of ['lancement', 'pages', 'constat', 'marque', 'decisions', 'livraison', 'bilan', 'plusieurs']) {
    const h = pageDuParcours(etat(m));
    assert.doesNotMatch(texte(h), /À toi de décider|Rien à décider|Poser ·|temps 3, Poser|Tenir/, m);
    assert.doesNotMatch(h, /dashed|class="statut|prefers-color-scheme/, m);
    assert.equal(h.match(/<nav class="fil"/g)?.length, 1, m);
  }
  // Le bouton plein : ce qui se clique.
  assert.match(b, /button\.principal \{ background: var\(--background-interactive-strong\); border-color: var\(--background-interactive-strong\); color: var\(--text-on-interactive\); \}/);
  assert.deepEqual(['Orbe Café', 'Écume', 'Diapason', 'Hôtel du Nord'].map(deNom), ['d’Orbe Café', 'd’Écume', 'de Diapason', 'de Hôtel du Nord']);
});

/** Un envoi de formulaire au serveur, avec son adresse d'origine. @param {string} adresse @param {string} referer */
const envoyer = (adresse, referer) =>
  new Promise((ok, ko) => {
    const u = new URL('/pages/marque/echanger', adresse);
    const r = request({ host: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { referer, 'content-type': 'application/x-www-form-urlencoded', 'content-length': 0 } }, (res) => {
      res.resume();
      ok(res.statusCode);
    });
    r.on('error', ko);
    r.end();
  });

test('EC17 revoir un écran fait : en lecture seule, sans formulaire ni rechargement, rien d’écrit ; un envoi depuis un écran revu est refusé', async () => {
  const p = copie('bilan');
  const f = join(p, 'projet.json');
  const avant = instantane(p);
  const voir = (/** @type {string} */ v, /** @type {string} */ dossier = p, /** @type {string} */ fichier = f) =>
    pageDuParcours(calculerEtat(lireProjet(fichier), { base: dossier, voir: v }), { voir: v });
  for (const [v, titre, revois] of [
    ['pages', 'Les pages mesurées', 'Tu revois Mesurer.'],
    ['revue', 'La revue', 'Tu revois Décider.'],
    ['avant-apres', 'Avant, après', 'Tu revois Vérifier.'],
    ['depart', 'Le parcours', 'Tu revois le départ.'],
  ]) {
    const h = voir(v);
    assert.ok(h.includes(`<h1>${titre}</h1>`), v);
    assert.ok(texte(h).includes(revois), v);
    assert.doesNotMatch(h, /<form|http-equiv="refresh"/, v);
    assert.match(h, /<p class="revenir"><a class="retour" href="\/">Revenir où j’en suis<\/a>/, v);
    assert.doesNotMatch(h, /class="barre"/, v);
    assert.deepEqual(enDur(h), [], v);
  }
  assert.match(voir('revue'), /<iframe class="revue" src="\/sorties\/reductions\/[^"]+\/revue\.html" title="La revue"><\/iframe>/);
  assert.match(voir('avant-apres'), /<div class="cadre papier">/);
  // Un écran qui ne se revoit pas : le moment, tel quel.
  assert.match(voir('dette'), /<h1>La remise<\/h1>/);
  assert.deepEqual(instantane(p), avant, 'aucun fichier ne change');

  // Par les écrans : la dette, la marque et les fondations, revues ; l'état ne change pas.
  const { d, f: g } = auxFondations();
  fondationsVues(g);
  const e = calculerEtat(lireProjet(g), { base: d });
  assert.deepEqual(e.revoir, ['pages', 'dette', 'marque', 'fondations']);
  for (const [v, titre] of [['dette', 'La dette d’Annuaire des cafés'], ['marque', 'La marque d’Annuaire des cafés'], ['fondations', 'Les fondations d’Annuaire des cafés']]) {
    const vu = calculerEtat(lireProjet(g), { base: d, voir: v });
    assert.deepEqual([vu.moment, vu.courante], [e.moment, e.courante], v);
    const h = voir(v, d, g);
    assert.ok(h.includes(`<h1>${titre}</h1>`), v);
    assert.doesNotMatch(h, /<form|<details class="modifier"|Pas encore/, v);
    const autres = ['dette', 'marque', 'fondations'].filter((x) => x !== v);
    for (const x of autres) assert.ok(h.includes(`<a href="/?voir=${x}">`), `${v} → ${x}`);
    assert.match(h, /<span aria-current="page">/, v);
    assert.deepEqual(enDur(h), [], v);
  }

  // Le serveur : un envoi depuis un écran revu ne passe pas.
  let appels = 0;
  const s = await servir({ page: () => '', sorties: () => p, marques: () => ({}), poster: async () => (appels++, null) }, { port: 0 });
  try {
    assert.equal(await envoyer(s.adresse, `${s.adresse}?voir=marque`), 409);
    assert.equal(appels, 0);
    assert.equal(await envoyer(s.adresse, s.adresse), 303);
    assert.equal(appels, 1);
  } finally {
    await s.fermer();
  }
});

test('EC20 ni barre ni bouton de passage sur aucun écran ; ce qui change l’écran reste, « ‹ La remise » sous le titre', () => {
  const ecrans = {
    lancement: ecranDeLancement(),
    pages: pageDuParcours(etat('pages')),
    mesure: pageDuParcours((() => {
      const d = copie('pages');
      validerPages(join(d, 'projet.json'));
      return calculerEtat(lireProjet(join(d, 'projet.json')), { base: d });
    })()),
    dette: pageDuParcours(etat('constat')),
    marque: pageDuParcours((({ d, f }) => calculerEtat(lireProjet(f), { base: d }))(aLaMarque())),
    fondations: pageDuParcours((({ d, f }) => calculerEtat(lireProjet(f), { base: d }))(auxFondations())),
    avantApres: pageDuParcours((({ d, f }) => calculerEtat(lireProjet(f), { base: d }))(avantApres())),
    remise: pageDuParcours(etat('bilan')),
  };
  for (const [nom, h] of Object.entries(ecrans)) {
    assert.doesNotMatch(h, /class="barre"|<footer|class="avance"|›<\/button>/, nom);
    assert.doesNotMatch(h, /action="\/pages\/(?:mesurer|dette|marque"|fondations|rendu|revue)/, nom);
  }
  // Ce qui change l'écran reste : retirer, ajouter, changer une couleur, copier le message.
  assert.match(ecrans.pages, /action="\/pages\/retirer"/);
  assert.match(ecrans.marque, /action="\/pages\/marque\/couleur"/);
  assert.match(ecrans.remise, /action="\/pages\/copier"/);
  // « À installer » : le retour à la remise sous le titre.
  const e = etat('bilan');
  const h = ecranAInstaller(e, '# À installer\n\n## Étape 1\n\nUne ligne.');
  assert.match(h, /<h1>À installer<\/h1><p>[^<]*<\/p><p><a class="retour" href="\/">‹ La remise<\/a><\/p><\/div>/);
  assert.doesNotMatch(h, /class="barre"/);
});
