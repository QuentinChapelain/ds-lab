// @ts-check
/**
 * Lot J, bloc 1 (J8, J6) : captures des cartes. Attendus écrits avant le code :
 * J8. Un élément hors de la page (rectangle entièrement hors du document, ex. lien d'évitement en
 *     position fixe à top:-100px, ramené à top:8px au focus) n'est pas capturé : la capture prend le
 *     premier élément touché qui est dans la page ; s'il n'y en a aucun, la carte dit « hors de la
 *     page, visible seulement au focus : pas de capture », sans image. Pas de capture au focus.
 * J6. Une carte dont toutes les versions donnent la même image dit « sans effet visible sur les
 *     captures » (ex. un fond entièrement recouvert par son enfant). Une carte dont les images
 *     diffèrent ne le dit pas.
 * Page fictive (cible-valise d'Orbe Café) : lien d'évitement (bordure #333333, texte #201d17), fond
 * #e9e4dc recouvert d'un enfant blanc de même taille, texte #201d17 visible dans cet enfant.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';

const PAGE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>J8 J6</title>
<style>html,body{margin:0;background:#ffffff;font:16px/1.4 Arial,sans-serif;color:#201d17}
.evite{position:fixed;top:-100px;left:8px;padding:12px 16px;border:2px solid #333333;background:#ffffff;color:#201d17}
.evite:focus{top:8px}
.dessous{position:absolute;top:40px;left:40px;width:200px;height:60px;background-color:#e9e4dc}
.dessus{width:200px;height:60px;background-color:#ffffff;color:#201d17}
</style></head>
<body><a class="evite" href="#contenu">Aller au contenu</a><div class="dessous"><div class="dessus" id="contenu">Contenu</div></div></body></html>`;
const OFF = 'hors de la page, visible seulement au focus : pas de capture';
const SAME = 'sans effet visible sur les captures';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let run;
let html = '';

before(async () => {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-j1-'));
  await mkdir(join(root, 'j'));
  await writeFile(join(root, 'j', 'p.html'), PAGE);
  servers = await startFixtureServers({ root });
  [run] = await runReduce({
    addresses: [`${servers.origin}/j/p.html`],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    tokensPath: new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname,
    viewport: { width: 400, height: 600 },
    waitMs: 50,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-lot-j1-out-')),
  });
  html = await readFile(run.files[1], 'utf8');
});

after(async () => servers?.close());

/** @param {string} old @param {string} usage */
const row = (old, usage) => run.table.families.colors.rows.find((/** @type {any} */ r) => r.old === old && r.usage === usage);
/** Article de la revue dont data-key vaut key. @param {string} key */
const article = (key) => {
  const i = html.indexOf(`data-key="${key}"`);
  if (i < 0) return '';
  return html.slice(html.lastIndexOf('<article', i), html.indexOf('</article>', i));
};

test('J8 : bordure du lien d’évitement, seul élément touché, hors de la page : mention, aucune image', () => {
  const r = row('#333333', 'bordure');
  assert.equal(r?.class, 'décision');
  assert.equal(r.capture?.offPage, true);
  assert.ok(r.capture.versions.every((/** @type {any} */ v) => !v.shot), 'aucune capture');
  const a = article('colors|#333333|bordure');
  assert.ok(a.includes(OFF), a.slice(0, 400));
  assert.ok(!a.includes('<img'), 'aucune image');
  assert.ok(!a.includes(SAME), 'pas de « sans effet » sans capture');
  assert.ok(a.includes('Choisir cette version'), 'la carte reste à trancher');
});

test('J8 : texte #201d17 : la capture prend l’élément dans la page, pas le lien d’évitement', () => {
  const r = row('#201d17', 'texte');
  assert.ok(r?.capture && !r.capture.offPage);
  assert.ok(r.capture.clip.y >= 24 && r.capture.clip.height > 8, JSON.stringify(r.capture.clip));
  const a = article('colors|#201d17|texte');
  assert.ok(!a.includes(OFF));
  assert.ok(!a.includes(SAME), 'les versions du texte visible diffèrent');
  assert.ok(!(r.capture.others ?? []).some((/** @type {any} */ o) => o.offPage), 'pas de vignette hors de la page');
});

test('J6 : fond recouvert par son enfant : versions identiques, mention « sans effet visible »', () => {
  const r = row('#e9e4dc', 'fond');
  assert.ok(r?.capture?.versions?.length >= 2);
  assert.ok(r.capture.versions.every((/** @type {any} */ v) => v.shot.png === r.capture.versions[0].shot.png), 'images identiques');
  assert.ok(article('colors|#e9e4dc|fond').includes(SAME));
});
