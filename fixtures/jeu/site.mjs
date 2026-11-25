// Le site fictif d'Orbe Café, servi pour que ds-lab le mesure : les pages de $DS_LAB/fixtures/marque-demo/ sur
// http://127.0.0.1:4173, et la feuille tierce du bandeau de cookies sur une seconde origine, http://localhost:4174.
// Ports fixes : projet.json nomme cette adresse. Lancement : node site.mjs (en tâche de fond) ; Ctrl+C pour arrêter.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const DS_LAB = process.env.DS_LAB;
if (!DS_LAB) {
  console.error('site : DS_LAB n’est pas posée');
  process.exit(2);
}
const PRINCIPAL = 4173;
const DISTANT = 4174;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

/** @param {string} racine */
const servir = (racine) => async (req, res) => {
  const chemin = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  const f = normalize(join(racine, chemin.endsWith('/') ? `${chemin}index.html` : chemin));
  if (!f.startsWith(racine + sep)) return res.writeHead(404).end();
  try {
    let corps = await readFile(f);
    if (extname(f) === '.html') corps = Buffer.from(corps.toString('utf8').replaceAll('{{ORIGINE_DISTANTE}}', `http://localhost:${DISTANT}`));
    res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' }).end(corps);
  } catch {
    res.writeHead(404).end();
  }
};

const racine = join(DS_LAB, 'fixtures', 'marque-demo');
for (const [port, dossier] of [[PRINCIPAL, racine], [DISTANT, join(racine, 'distant')]]) {
  const s = createServer(servir(dossier));
  s.on('error', (e) => {
    console.error(`site : port ${port} : ${e.code === 'EADDRINUSE' ? 'déjà pris (le site tourne peut-être déjà)' : e.message}`);
    process.exit(2);
  });
  s.listen(port, '127.0.0.1');
}
console.log(`Site fictif d'Orbe Café : http://127.0.0.1:${PRINCIPAL}/ (feuille tierce sur http://localhost:${DISTANT}/)`);
