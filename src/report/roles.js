// @ts-check
/**
 * Séance 3a, T4 : planche des paires de rôles (tokens/orbe-cafe/roles.html).
 * Une ligne par paire : fond, mot écrit, ratio, seuil, verdict ; groupée par propriété de l'élément devant.
 * Ratio tronqué à 2 décimales (jamais arrondi vers le seuil). Page autonome, sans ressource externe.
 */

/** @param {string} s */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => /** @type {Record<string, string>} */ ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/** @param {number} n */
const ratioFr = (n) => `${(Math.floor(n * 100) / 100).toFixed(2).replace('.', ',')}:1`;
/** @param {number} n */
const seuilFr = (n) => `${String(n).replace('.', ',')}:1`;
/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

const GROUPS = [
  { key: 'texte', title: 'Texte', intro: 'Texte posé sur un fond de rôle, seuil 4,5:1 (WCAG 2.1, 1.4.3).', word: 'Réserver une table' },
  {
    key: 'bordure',
    title: 'Bordure',
    intro: 'Bordure qui repère un composant ou un état, et anneau de focus, seuil 3:1 (WCAG 2.1, 1.4.11). bordure.discrete et bordure.defaut sont décoratives et n\'ont pas de paire.',
    word: 'Champ',
  },
];

/** @param {any} p @param {string} word */
function row(p, word) {
  const isText = p.devant.startsWith('texte.');
  const verdict = p.ok ? 'conforme' : p.exception ? 'exception' : 'échec';
  const cls = p.ok ? 'conforme' : p.exception ? 'exception' : 'echec';
  const style = isText ? `background:${p.hexFond};color:${p.hexDevant}` : `background:${p.hexFond};border-color:${p.hexDevant}`;
  return `        <tr data-devant="${esc(p.devant)}" data-fond="${esc(p.fond)}" class="${cls}">
          <td><span class="pastille" style="background:${p.hexFond}"></span><code>${esc(p.fond)}</code> <span class="hex">${p.hexFond}</span></td>
          <td><span class="echantillon ${isText ? 'texte' : 'bordure'}" style="${style}">${esc(word)}</span><code>${esc(p.devant)}</code> <span class="hex">${p.hexDevant}</span></td>
          <td class="num">${ratioFr(p.ratio)}</td>
          <td class="num">${seuilFr(p.min)}</td>
          <td><span class="verdict">${verdict}</span>${p.exception ? ` <span class="motif">${esc(p.exception)}</span>` : ''}</td>
        </tr>`;
}

/**
 * @param {{ pairs: any[], fails: any[], exceptions: any[] }} c contrat de rôles (contratRoles)
 * @returns {string}
 */
export function rolesHtml(c) {
  const sections = GROUPS.map((g) => {
    const pairs = c.pairs.filter((p) => p.devant.split('.')[0] === g.key);
    return `    <section data-propriete="${g.key}">
      <h2>${g.title} <span class="compte">${plural(pairs.length, 'paire', 'paires')}</span></h2>
      <p>${esc(g.intro)}</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Fond</th><th>Mot écrit</th><th>Ratio</th><th>Seuil</th><th>Verdict</th></tr></thead>
        <tbody>
${pairs.map((p) => row(p, g.word)).join('\n')}
        </tbody>
      </table></div>
    </section>`;
  }).join('\n');
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Rôles Orbe Café</title>
    <style>
      :root { --encre: #1f1c17; --gris: #6b665c; --trait: #dedbd5; --page: #ffffff; --echec: #b3261e; --exception: #8a5a00; --ok: #1e6b45; }
      body { margin: 0; padding: 24px 16px 48px; background: var(--page); color: var(--encre); font: 15px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
      main { max-width: 1040px; margin: 0 auto; }
      h1 { font-size: 24px; margin: 0 0 4px; }
      h2 { font-size: 18px; margin: 32px 0 4px; }
      .compte { font-weight: 400; color: var(--gris); font-size: 14px; }
      p { margin: 4px 0 12px; color: var(--gris); }
      .bilan { color: var(--encre); }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 8px; border-bottom: 1px solid var(--trait); vertical-align: middle; }
      th { font-size: 13px; color: var(--gris); font-weight: 600; }
      td.num { font-variant-numeric: tabular-nums; white-space: nowrap; }
      code { font: 13px ui-monospace, Menlo, monospace; }
      .hex { font: 12px ui-monospace, Menlo, monospace; color: var(--gris); }
      .pastille { display: inline-block; width: 18px; height: 18px; border: 1px solid var(--trait); border-radius: 4px; vertical-align: middle; margin-right: 8px; }
      .echantillon { display: inline-block; min-width: 132px; padding: 6px 10px; margin-right: 8px; border-radius: 6px; font-weight: 500; vertical-align: middle; }
      .echantillon.bordure { min-width: 96px; border: 2px solid; color: #363026; }
      .verdict { font-weight: 600; }
      tr.conforme .verdict { color: var(--ok); }
      tr.echec .verdict { color: var(--echec); }
      tr.exception .verdict { color: var(--exception); }
      .motif { color: var(--gris); font-size: 13px; }
      @media (max-width: 640px) { th:nth-child(1), td:nth-child(1) { display: none; } .echantillon { min-width: 0; } }
    </style>
  </head>
  <body>
    <main>
    <h1>Rôles de couleur, Orbe Café</h1>
    <p>Marque fictive. Paires déclarées dans paires.json, rôles dans semantique.tokens.json ; contraste WCAG 2.1, ratio tronqué à 2 décimales.</p>
    <p class="bilan">${plural(c.pairs.length, 'paire', 'paires')}, ${plural(c.fails.length, 'en échec', 'en échec')}, ${plural(c.exceptions.length, 'exception écrite', 'exceptions écrites')}.</p>
${sections}
    </main>
  </body>
</html>
`;
}
