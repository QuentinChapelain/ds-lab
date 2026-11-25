// @ts-check
/**
 * npm run parcours -- <projet.json> [--servir] [--port <n>] [--attendre] [--valider-pages] [--ajouter-page <adresse>]
 *   [--retirer-page <chemin>] [--site <id>] (D72) : lit le projet, calcule l'état du parcours
 * depuis ses sorties, écrit parcours.html à côté de projet.json et, dans le terminal, où on en est, qui a la main, quoi
 * faire et la commande suivante ; dessous, les faits du moment, que l'IA dit avec ses mots (D74).
 * --servir sert la page et les écrans sur 127.0.0.1, au port 4311, ou à un port libre s'il est pris (D75), jusqu'à
 * Ctrl+C. Avant le projet, il sert le lancement, qui se recharge seul jusqu'à ce que projet.json existe (D77) ; l'écran
 * des pages retire et ajoute par des formulaires, et sert la vignette de chaque page ; « À installer » et chaque
 * page du site en direct, ses feuilles ajoutées posées (D87).
 * --attendre attend que la main quitte l'humain à l'étape en cours (le clic sur « Passer à ta marque », par exemple),
 * puis écrit l'état et sort en 0 : lancé en tâche de fond, sa fin prévient l'IA (D77).
 * Les pages passent par le chat (D89) : --valider-pages lance la mesure sur la liste de l'écran à cet instant ;
 * --ajouter-page et --retirer-page changent la liste, comme l'écran ; --site nomme le site quand le projet en a
 * plusieurs. Seulement tant que les pages attendent : une page refusée, une liste vide ou un autre moment sortent en 1.
 * Sortie 0 ; 2 sur un projet illisible ou une sortie illisible (D18). Une sortie absente n'est pas une panne : c'est un état.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { setTimeout as attendre } from 'node:timers/promises';
import { lancer } from './garde.js';
import { lireProjet } from '../parcours/projet.js';
import { calculerEtat, lignesTerminal } from '../parcours/etat.js';
import { pageDuParcours } from '../parcours/page.js';
import { ecranDeLancement, dessinDeVignette } from '../parcours/ecrans.js';
import { faitsDuMoment } from '../parcours/faits.js';
import { servir } from '../parcours/serveur.js';
import { ajouterPage, choisirCouleur, confirmerMarque, copierMessage, detteVue, echangerAccent, fondationsVues, retirerPage, rouvrirRevue, validerPages, validerRendu, vignettes } from '../parcours/pages.js';
import { ecranAInstaller } from '../parcours/ecrans.js';
import { aInstaller, feuillesEnDirect, pageEnDirect } from '../parcours/remise.js';

const USAGE = 'npm run parcours -- <projet.json> [--servir] [--port <n>] [--attendre] [--valider-pages] [--ajouter-page <adresse>] [--retirer-page <chemin>] [--site <id>]';

await lancer('parcours', async () => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      servir: { type: 'boolean', default: false },
      port: { type: 'string' },
      attendre: { type: 'boolean', default: false },
      'valider-pages': { type: 'boolean', default: false },
      'ajouter-page': { type: 'string' },
      'retirer-page': { type: 'string' },
      site: { type: 'string' },
    },
  });
  const geste = /** @type {const} */ (['valider-pages', 'ajouter-page', 'retirer-page']).filter((k) => values[k] !== undefined && values[k] !== false);
  if (positionals.length !== 1) throw new Error(`un fichier de projet et un seul (usage : ${USAGE})`);
  if (values.port !== undefined && !/^\d+$/.test(values.port)) throw new Error(`--port : un nombre est attendu (usage : ${USAGE})`);
  if (values.port !== undefined && !values.servir) throw new Error(`--port ne s'emploie qu'avec --servir (usage : ${USAGE})`);
  if (values.attendre && values.servir) throw new Error(`--attendre ne s'emploie pas avec --servir (usage : ${USAGE})`);
  if (geste.length > 1 || (geste.length && (values.servir || values.attendre)))
    throw new Error(`--valider-pages, --ajouter-page et --retirer-page s'emploient seuls, un à la fois (usage : ${USAGE})`);
  if (values.site !== undefined && !values['ajouter-page'] && !values['retirer-page']) throw new Error(`--site ne s'emploie qu'avec --ajouter-page ou --retirer-page (usage : ${USAGE})`);
  const fichier = positionals[0];
  /** Les faits du moment, précédés d'une ligne vide. @param {{ etat: import('../parcours/etat.js').Etat, projet: { sorties: string } }} r */
  const chat = (r) => {
    const l = faitsDuMoment(r.etat, { sorties: r.projet.sorties });
    return l.length ? ['', ...l] : [];
  };
  /**
   * Relit le projet, recalcule l'état, écrit la page ; rend l'état et la page.
   * @param {URLSearchParams} [q]  le refus d'une page ajoutée : site, erreur, saisie ; un écran fait à revoir (voir, D88),
   *   qui n'écrit pas la page
   */
  const ecrire = (q) => {
    const projet = lireProjet(fichier);
    const etat = calculerEtat(projet);
    const erreur = q?.get('erreur') ? { site: q.get('site') ?? '', message: q.get('erreur') ?? '', saisie: q.get('saisie') ?? '' } : null;
    const copie = q?.get('copie') === 'ok' ? 'ok' : q?.get('copie') === 'non' ? 'non' : null;
    const voir = q?.get('voir') ?? null;
    const html = voir ? pageDuParcours(calculerEtat(projet, { voir }), { voir }) : pageDuParcours(etat, { erreur, copie });
    const page = join(projet.dossier, 'parcours.html');
    if (!erreur && !copie && !voir) writeFileSync(page, html);
    return { projet, etat, html, page: relative(process.cwd(), page) };
  };

  if (geste.length) {
    const raison = await changerLesPages(fichier, values);
    if (raison) {
      console.log(raison);
      return 1;
    }
    const r = ecrire();
    for (const l of [...lignesTerminal(r.etat, { page: r.page }), ...chat(r)]) console.log(l);
    return 0;
  }

  if (values.attendre) {
    // La main est à l'humain tant que l'étape, sa main et son action ne changent pas.
    const signe = (/** @type {import('../parcours/etat.js').Etape} */ k) => `${k.cle}|${k.main}|${k.action}`;
    const depart = signe(ecrire().etat.courante);
    let r = ecrire();
    while (signe(r.etat.courante) === depart && r.etat.courante.main === 'designer') {
      await attendre(1000);
      r = ecrire();
    }
    for (const l of [...lignesTerminal(r.etat, { page: r.page }), ...chat(r)]) console.log(l);
    return 0;
  }

  // Avant le projet, seul --servir a un sens : il sert le lancement.
  const avant = !existsSync(fichier);
  const premier = avant && values.servir ? null : ecrire();
  if (!values.servir && premier) {
    for (const l of [...lignesTerminal(premier.etat, { page: premier.page }), ...chat(premier)]) console.log(l);
    return 0;
  }
  const v = vignettes();
  const s = await servir(
    {
      page: (q) => (existsSync(fichier) ? ecrire(q).html : ecranDeLancement()),
      sorties: () => lireProjet(fichier).sorties,
      marques: () => Object.fromEntries(lireProjet(fichier).sites.filter((x) => x.dossierMarque).map((x) => [x.id, /** @type {string} */ (x.dossierMarque)])),
      vignette: (site, chemin) =>
        v.capture(fichier, site, chemin).then(
          (png) => ({ type: 'image/png', corps: png }),
          () => ({ type: 'image/svg+xml', corps: dessinDeVignette() }),
        ),
      // « À installer » et la page en direct (D87) : rendus à la demande, depuis les sorties.
      autre: async (chemin, q, ici) => {
        if (!existsSync(fichier)) return null;
        if (chemin === '/a-installer') {
          const { etat } = ecrire();
          return etat.remise ? { type: 'text/html; charset=utf-8', corps: ecranAInstaller(etat, aInstaller(etat.remise)) } : null;
        }
        const m = /^\/direct\/([a-z0-9-]+)$/.exec(chemin);
        if (!m) return null;
        const projet = lireProjet(fichier);
        const site = projet.sites.find((x) => x.id === m[1]);
        const vue = calculerEtat(projet).avantApres;
        const p = q.get('page') ?? '';
        if (!site || !vue || !site.pages.includes(p)) return null;
        const adresse = new URL(p, site.origine).href;
        const r = await fetch(adresse, { signal: AbortSignal.timeout(10_000) });
        /** @param {string} c */
        const liens = (c) => (site.pages.includes(c) ? `${ici}/direct/${site.id}?page=${encodeURIComponent(c)}` : null);
        return { type: 'text/html; charset=utf-8', corps: pageEnDirect(await r.text(), r.url || adresse, { ...feuillesEnDirect(vue.dossierAjout), liens }) };
      },
      poster: async (chemin, c) => {
        if (chemin === '/pages/retirer') retirerPage(fichier, c.site ?? '', c.page ?? '');
        else if (chemin === '/pages/dette') detteVue(fichier);
        else if (chemin === '/pages/fondations') fondationsVues(fichier);
        else if (chemin === '/pages/rendu') validerRendu(fichier);
        else if (chemin === '/pages/revue') rouvrirRevue(fichier);
        else if (chemin === '/pages/copier') return new URLSearchParams({ copie: copierMessage(fichier) ? 'ok' : 'non' });
        else if (chemin === '/pages/marque') confirmerMarque(fichier);
        else if (chemin === '/pages/marque/echanger') echangerAccent(fichier);
        else if (chemin === '/pages/marque/couleur') {
          const raison = choisirCouleur(fichier, /** @type {any} */ (c.role), c.hex ?? '');
          if (raison) return new URLSearchParams({ site: c.role ?? '', erreur: raison, saisie: c.hex ?? '' });
        }
        else if (chemin === '/pages/ajouter') {
          const r = await ajouterPage(fichier, c.site ?? '', c.adresse ?? '');
          if ('raison' in r) return new URLSearchParams({ site: c.site ?? '', erreur: r.raison, saisie: c.adresse ?? '' });
        }
        return null;
      },
    },
    values.port === undefined ? { port: 4311, libre: true } : { port: Number(values.port) },
  );
  if (premier) for (const l of [...lignesTerminal(premier.etat, { page: premier.page, adresse: s.adresse }), ...chat(premier)]) console.log(l);
  else console.log(`Lancement servi sur ${s.adresse} ; le projet n'existe pas encore (${fichier}) : l'écran des pages paraît dès qu'il est écrit.`);
  console.log('Ctrl+C pour arrêter.');
  // Le Chromium des vignettes se ferme avec le serveur, sur Ctrl+C comme sur un arrêt demandé.
  for (const signal of /** @type {const} */ (['SIGINT', 'SIGTERM'])) process.on(signal, () => Promise.all([s.fermer(), v.fermer()]).then(() => process.exit(0)));
  return 0;
});

/**
 * Les pages par le chat (D89) : valider la liste, en ajouter une, en retirer une. Rend la raison d'un refus en une
 * phrase, ou null.
 * @param {string} fichier
 * @param {{ 'valider-pages'?: boolean, 'ajouter-page'?: string, 'retirer-page'?: string, site?: string }} v
 * @returns {Promise<string | null>}
 */
async function changerLesPages(fichier, v) {
  const projet = lireProjet(fichier);
  if (calculerEtat(projet).moment !== 'pages') return 'Les pages ne changent plus : la mesure est lancée ou faite.';
  if (v['valider-pages']) {
    if (projet.sites.some((s) => !s.pages.length)) return projet.sites.length > 1 ? 'Il faut une page au moins par site.' : 'Il faut une page au moins.';
    validerPages(fichier);
    return null;
  }
  if (v.site === undefined && projet.sites.length > 1) return `Plusieurs sites : nomme le site par --site (${projet.sites.map((s) => s.id).join(', ')}).`;
  const id = v.site ?? projet.sites[0].id;
  const s = projet.sites.find((x) => x.id === id);
  if (!s) return `Aucun site ${id} dans le projet (${projet.sites.map((x) => x.id).join(', ')}).`;
  if (v['ajouter-page'] !== undefined) {
    const r = await ajouterPage(fichier, id, v['ajouter-page']);
    return 'raison' in r ? r.raison : null;
  }
  // Une adresse entière se ramène à son chemin, comme la liste du projet.
  const saisie = /** @type {string} */ (v['retirer-page']).trim();
  const chemin = /^[a-z]+:\/\//i.test(saisie) ? ((u) => `${u.pathname}${u.search}`)(new URL(saisie)) : saisie;
  if (!s.pages.includes(chemin)) return 'Cette page n’est pas dans la liste.';
  retirerPage(fichier, id, chemin);
  return null;
}
