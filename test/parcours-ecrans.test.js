// @ts-check
/**
 * Les écrans du parcours (D77), sans navigateur :
 *   EC1 le lancement : les quatre temps à venir, quatre étapes, trois portes, l'adresse dans le chat, aucun bouton ; il
 *       se recharge seul ; aucune valeur visuelle en dur, aucun script ;
 *   EC2 les pages, un site : le nom de chaque page (ou son chemin), sa vignette, « Retirer », « Ajouter une page »,
 *       « Mesurer ces n pages » qui suit la liste, désactivé sans page ; jamais de rechargement seul ; le refus d'une
 *       page ajoutée, à côté du champ, avec la saisie gardée ; plusieurs sites : un groupe par site ;
 *   EC3 projet.json : une page avec son nom, retirer, ajouter après vérification (même site, elle répond, pas déjà là),
 *       sinon la raison en une phrase ; le reste du fichier intact ; la validation au clic sur « Mesurer » fait l'étape,
 *       et l'écran de la mesure en cours paraît (ce qui se passe, une barre de progression, rechargé seul) ;
 *   EC4 la commande : avant le projet, --servir sert le lancement ; les formulaires reviennent sur l'écran (303) ;
 *       --attendre finit quand l'humain lance la mesure ;
 *   EC5 la dette (D78) : les pages mesurées nommées, le grand chiffre, quatre cartes de valeurs avec leur compte, leurs
 *       phrases calculées et leurs dessins (SVG : la valeur mesurée est une donnée du dessin, jamais du style), les
 *       composants par type avec leurs captures, « À regarder aussi », les deux liens, « Passer à ta marque » ; sans
 *       audit, les composants seuls ; le mot « constat » ne se montre pas ;
 *   EC6 « Passer à ta marque » : la dette vue, l'action de la marque reprend, --attendre finit ;
 *   EC7 la marque (D80), lue dans la mesure par la règle : la primaire colore le plus d'éléments cliquables, l'accent est
 *       la couleur la plus employée d'une autre teinte, la troisième passe aux gris ; chaque couleur dit son code, d'où
 *       elle vient (« lue sur n éléments »), ses douze pas, son bouton ou son aplat et le verdict ; la police des titres ;
 *       « Confirmer la marque » ;
 *   EC8 confirmer : l'entrée écrite et nommée dans le projet, la main à l'outil, --attendre finit ; une marque refusée
 *       se dit sous la couleur en cause, en mots simples, et ne se confirme pas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireProjet } from '../src/parcours/projet.js';
import { calculerEtat } from '../src/parcours/etat.js';
import { pageDuParcours } from '../src/parcours/page.js';
import { ecranDeLancement, FIN_JETONS } from '../src/parcours/ecrans.js';
import { ajouterPage, confirmerMarque, detteVue, retirerPage, validerPages } from '../src/parcours/pages.js';

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
  for (const s of ['1 · Mesurer', '4 · Tenir', 'Le parcours', 'Rien à décider', 'Tu décides trois fois.', 'Porte 1 · la marque', 'Porte 2 · la revue', 'Porte 3 · avant, après', 'Elle se donne dans le chat, à gauche.', 'Donne l’adresse dans le chat.'])
    assert.ok(t.includes(s), s);
  assert.equal(h.match(/<li class="a-venir">/g)?.length, 4);
  assert.equal(h.match(/<li class="etape">/g)?.length, 4);
  assert.doesNotMatch(h, /<button|<form|<script|\sstyle="/);
  assert.match(h, /<meta http-equiv="refresh" content="2">/);
  assert.deepEqual(enDur(h), []);
});

test('EC2 les pages : noms, vignettes, retirer, ajouter, le compte de la mesure ; jamais de rechargement seul', () => {
  const h = pageDuParcours(etat('pages'));
  const t = texte(h);
  for (const s of ['Les pages à mesurer', 'À toi de décider', 'La carte', 'Mon compte', '/desordre/gestion.html', 'Ajouter une page', 'Rien hors de cette liste n’est mesuré.', 'Mesurer ces 3 pages ›'])
    assert.ok(t.includes(s), s);
  assert.equal(h.match(/<img class="vignette" src="\/vignette\/orbe\?page=%2Fdesordre%2F[a-z]+\.html" alt="">/g)?.length, 3);
  assert.equal(h.match(/action="\/pages\/retirer"/g)?.length, 3);
  assert.match(h, /aria-label="Retirer La carte"/);
  assert.match(h, /<form method="post" action="\/pages\/mesurer"><button type="submit" class="principal">Mesurer ces 3 pages ›<\/button><\/form>/);
  assert.doesNotMatch(h, /http-equiv="refresh"|<script|\sstyle="/);
  assert.deepEqual(enDur(h), []);
  assert.match(h, /<li class="en-cours">1 · Mesurer<small>en cours<\/small><\/li>/);
  // Sans page : rien à mesurer.
  assert.match(pageDuParcours(etat('lancement')), /<button type="submit" class="principal" disabled>Aucune page<\/button>/);
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

test('EC4 la commande : le lancement avant le projet, les formulaires, --attendre', async () => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'ds-lab-ecrans-')));
  const f = join(d, 'projet.json');
  const s = lancerParcours([f, '--servir', '--port', '0']);
  try {
    const [, adresse] = /** @type {RegExpExecArray} */ (await s.attendre(/Lancement servi sur (http:\/\/127\.0\.0\.1:\d+\/)/));
    assert.match(await (await fetch(adresse)).text(), /<h1>Le parcours<\/h1>/);
    cpSync(join(FIX, 'pages'), d, { recursive: true });
    assert.match(await (await fetch(adresse)).text(), /<h1>Les pages à mesurer<\/h1>/);
    const w = lancerParcours([f, '--attendre']);
    /** @param {string} chemin @param {Record<string, string>} c */
    const poster = (chemin, c) => fetch(adresse + chemin.slice(1), { method: 'POST', body: new URLSearchParams(c), redirect: 'manual' });
    const r1 = await poster('/pages/retirer', { site: 'orbe', page: '/desordre/gestion.html' });
    assert.deepEqual([r1.status, r1.headers.get('location')], [303, '/']);
    assert.match(await (await fetch(adresse)).text(), /Mesurer ces 2 pages ›/);
    const r2 = await poster('/pages/ajouter', { site: 'orbe', adresse: 'https://ailleurs.example/' });
    assert.equal(r2.status, 303);
    assert.match(await (await fetch(adresse + String(r2.headers.get('location')).slice(1))).text(), /Cette page n’est pas sur 127\.0\.0\.1:4173\./);
    assert.equal(w.p.exitCode, null, '--attendre attend encore');
    assert.equal((await poster('/pages/mesurer', {})).status, 303);
    assert.equal(await w.fin(), 0);
    assert.match(String(readFileSync(join(d, 'sorties', 'pages.json'))), /"orbe": \[/);
  } finally {
    s.p.kill();
  }
});

test('EC5 la dette : les valeurs comptées, dites et dessinées ; les composants par type ; rien à décider', () => {
  const e = etat('constat');
  assert.equal(e.moment, 'dette');
  const h = pageDuParcours(e);
  const t = texte(h);
  for (const x of [
    'La dette de Annuaire des cafés',
    'Rien à décider',
    '3 pages mesurées :',
    'Les valeurs',
    '68 valeurs différentes affichées sur ces pages',
    'Couleurs 31',
    'Dont 20 gris, et 16 presque identiques à une autre. Le code en écrit 42. Six autres viennent du contenu (images, pictogrammes) : mises de côté.',
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
    'Passer à ta marque ›',
  ])
    assert.ok(t.includes(x), x);
  assert.match(h, /<a href="\/sorties\/audit\/orbe\/127\.0\.0\.1_4173\/2026-11-24T1330\/rapport\.html">Voir toutes les valeurs<\/a>/);
  assert.match(h, /<a href="\/sorties\/composants\/orbe\/127\.0\.0\.1_4173\/2026-11-24T1330\/constat\.html">Voir tous les composants<\/a>/);
  assert.equal(h.match(/<img src="\/sorties\/composants\/orbe\/127\.0\.0\.1_4173\/2026-11-24T1330\/captures\/p\d-e\d+\.png"/g)?.length, 11);
  assert.match(h, /<rect x="0\.5" y="0\.5" width="23" height="23" rx="4" fill="#999999"\/>/);
  assert.match(h, /<li class="hors"><svg [^>]*><title>10\.5px, 1 fois<\/title><text x="0" y="10\.5" font-size="10\.5"/);
  assert.match(h, /<form method="post" action="\/pages\/dette"><button type="submit" class="principal">Passer à ta marque ›<\/button><\/form>/);
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

test('EC6 « Passer à ta marque » : la dette vue, la marque reprend son cours, --attendre finit', async () => {
  const d = copie('constat');
  const f = join(d, 'projet.json');
  const w = lancerParcours([f, '--attendre']);
  await new Promise((ok) => setTimeout(ok, 1500));
  assert.equal(w.p.exitCode, null, '--attendre attend encore');
  detteVue(f);
  assert.equal(await w.fin(), 0);
  const e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.moment, e.courante.action], ['ecran', 'saisir la marque']);
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
    'La marque de Annuaire des cafés',
    'À toi de décider',
    'C’est quoi Diapason ?',
    'Couleur primaire #2b4c7e Lue sur 19 éléments de tes pages, dont 15 qui se cliquent. C’est ce qui se clique.',
    'Ta couleur exacte est sur le bouton, avec un texte blanc. C’est le pas 9, encadré.',
    'Accent #f0c987 Lue sur 6 éléments de tes pages. Facultatif.',
    'Ta couleur exacte est sur les aplats, avec un texte foncé.',
    '#d0563f, lue sur 2 éléments. Une marque garde deux couleurs : celle-ci passera aux gris.',
    'Police des titres Orbe Sans Lue sur 17 titres de tes pages.',
    'Marque acceptée',
    'Confirmer la marque ›',
  ])
    assert.ok(t.includes(x), x);
  assert.equal(h.match(/<ul class="echelle" aria-label="Les douze pas">/g)?.length, 2);
  assert.match(h, /<li class="plein"><svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="4" fill="#2b4c7e"\/>/);
  assert.match(h, /<button type="submit" class="principal">Confirmer la marque ›<\/button>/);
  assert.doesNotMatch(t, /[Cc]onstat|checkValise|entrée|\.json/);
  assert.doesNotMatch(h, /<script|\sstyle="|http-equiv="refresh"/);
  assert.deepEqual(enDur(h), []);
});

test('EC8 confirmer la marque : l’entrée écrite, la main à l’outil ; une marque refusée ne se confirme pas', async () => {
  const { d, f } = aLaMarque();
  const w = lancerParcours([f, '--attendre']);
  await new Promise((ok) => setTimeout(ok, 1500));
  assert.equal(w.p.exitCode, null, '--attendre attend encore');
  confirmerMarque(f);
  assert.equal(await w.fin(), 0);
  assert.deepEqual(JSON.parse(readFileSync(join(d, 'marques', 'orbe', 'entree.json'), 'utf8')), {
    name: 'Annuaire des cafés',
    primary: '#2b4c7e',
    accent: '#f0c987',
    fonts: { heading: ['Orbe Sans', 'Arial', 'sans-serif'] },
  });
  assert.equal(JSON.parse(readFileSync(f, 'utf8')).sites[0].brand, 'marques/orbe/entree.json');
  const e = calculerEtat(lireProjet(f), { base: d });
  assert.deepEqual([e.courante.main, e.courante.action, e.moment], ['outil', 'saisir la marque', 'ecran']);
  // Refusée : une primaire qui ne donne pas douze pas distincts.
  const r = aLaMarque();
  writeFileSync(join(r.d, 'sorties', 'marque.json'), JSON.stringify({ orbe: { primary: '#00ccff' } }));
  const h = pageDuParcours(calculerEtat(lireProjet(r.f), { base: r.d }));
  assert.match(texte(h), /Couleur primaire #00ccff .* Cette couleur ne donne pas douze nuances distinctes : ses tons clairs se confondent avec elle\. Essaie une couleur plus foncée\./);
  assert.match(texte(h), /Marque refusée : change la couleur dite plus haut\./);
  assert.match(h, /<button type="submit" class="principal" disabled>Confirmer la marque ›<\/button>/);
  assert.throws(() => confirmerMarque(r.f), /une marque refusée ne se confirme pas/);
});
