// @ts-check
/**
 * Rapport Markdown court, à partir de l'objet écrit dans audit.json.
 * Chaque affirmation porte une étiquette : [F] mesuré, [H] hypothèse, [V] à vérifier.
 */
import { V1_DIFFERENCES, V1_SAME, LIMITS, STORAGE_STATE_LIMIT } from './differences.js';

export const FAMILY_LABELS = /** @type {Record<string, string>} */ ({
  colors: 'Couleurs',
  fontFamilies: 'Polices',
  fontSizes: 'Tailles de police',
  fontWeights: 'Graisses',
  lineHeights: 'Interlignages',
  letterSpacings: 'Espacement des lettres',
  margins: 'Marges',
  paddings: 'Retraits',
  gaps: 'Gap',
  borderWidths: 'Épaisseurs de bordure',
  radii: 'Rayons',
  shadows: 'Ombres',
  opacities: 'Opacités',
  durations: 'Durées',
  timingFunctions: 'Courbes',
  breakpoints: 'Points de rupture',
});

/** @param {unknown} s */
const cell = (s) => String(s ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ');
/** @param {string[]} head @param {unknown[][]} rows */
const table = (head, rows) =>
  [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n');
/** @param {string} url */
const shortUrl = (url) => {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
};
/**
 * @param {Record<string, { count: number }>} values
 * @param {number} n
 */
const top = (values, n = 8) => {
  // Tri explicite : un objet JS range les clés numériques (« 400 ») par ordre croissant.
  const list = Object.entries(values ?? {})
    .sort((a, b) => b[1].count - a[1].count || (a[0] < b[0] ? -1 : 1))
    .slice(0, n);
  return list.length ? list.map(([k, v]) => `\`${k}\` ×${v.count}`).join(' · ') : '—';
};

/**
 * @param {any} audit  contenu de audit.json
 * @returns {string}
 */
export function renderReport(audit) {
  const { meta, pages, warnings, declared, rendered } = audit;
  const D = declared.families;
  const R = rendered.families;
  /** @type {string[]} */
  const out = [];
  const push = (/** @type {string} */ s = '') => out.push(s);

  push(`# Audit CSS — ${meta.host} — ${meta.stamp}`);
  push();
  push(
    `Outil ${audit.tool.version}, Chromium ${meta.browser}, fenêtre ${meta.viewport.width}×${meta.viewport.height}, attente : load + networkidle (${meta.networkIdleTimeoutMs / 1000} s max) + ${meta.waitMs} ms. ` +
      `Session : ${meta.storageState ?? 'aucune'}. Sources : ${meta.sources ?? 'attribution par origine'}. Trace du rendu : ${meta.traceRendered ? 'oui' : 'non'}. États forcés : ${meta.states === false ? 'non' : 'oui'}.`,
  );
  push();
  push('Les chiffres des tableaux sont mesurés [F], sauf mention contraire.');

  // --- Avertissements
  push();
  push('## Avertissements');
  push();
  if (warnings.length) for (const w of warnings) push(`- ${w.text} ${w.tag}`);
  else push('- Aucun. [F]');

  // --- Pages
  push();
  push('## Pages');
  push();
  push(
    table(
      ['Adresse', 'Statut', 'networkidle', 'rootPx', 'iframes', 'Éléments', 'Porteurs de texte', 'Erreur'],
      pages.map((/** @type {any} */ p) => [
        shortUrl(p.url) + (p.finalUrl && p.finalUrl !== p.url ? ` → ${shortUrl(p.finalUrl)}` : ''),
        p.status,
        p.networkIdle === undefined ? '—' : p.networkIdle ? 'atteint' : 'non (10 s)',
        p.rootPx,
        p.iframes,
        rendered.byPage[p.finalUrl ?? p.url]?.elements ?? '—',
        rendered.byPage[p.finalUrl ?? p.url]?.textBearing ?? '—',
        p.error ?? '',
      ]),
    ),
  );

  // --- Synthèse
  push();
  push('## Synthèse par famille');
  push();
  push(
    table(
      ['Famille', 'Déclaré (occ.)', 'Déclaré (distinctes)', 'Non normalisables', 'Rendu (occ.)', 'Rendu (distinctes)'],
      Object.keys(FAMILY_LABELS).map((f) => [
        FAMILY_LABELS[f],
        D[f]?.total ?? 0,
        D[f]?.distinct ?? 0,
        D[f]?.nonNormalizable ?? 0,
        R[f] ? R[f].total : '—',
        R[f] ? R[f].distinct : '—',
      ]),
    ),
  );
  push();
  push(
    `Propriétés personnalisées déclarées : ${declared.customProperties} ; éléments rendus : ${rendered.elements}, pseudo-éléments : ${rendered.pseudoElements}, exclus (invisibles ou à opacity 0) : ${rendered.excluded}${rendered.thirdParty ? `, tiers écartés : ${rendered.thirdParty.elements}` : ''}. [F]`,
  );

  // --- Couleurs
  const colorLine = (/** @type {any} */ c) =>
    `${c.distinct} distinctes, ${c.opaque} opaques${c.opaqueOnce !== undefined ? ` (dont ${c.opaqueOnce} à une seule occurrence)` : ''}, ${c.translucent} avec transparence ; ${c.groupsDE2.length} groupes à ΔE 2, ${c.groupsDE5.length} à ΔE 5.`;
  push();
  push('## Couleurs');
  push();
  push(`- Déclaré : ${colorLine(D.colors)} ${D.colors.varReferences} déclarations de couleur passent par var() ; ${D.colors.outOfGamut} hors gamut sRGB. [F]`);
  push(`- Rendu : ${colorLine(R.colors)} [F]`);
  const groups = (/** @type {any[]} */ gs) =>
    gs
      .filter((g) => g.members.length > 1)
      .slice(0, 8)
      .map((g) => `\`${g.rep}\` ← ${g.members.filter((/** @type {string} */ m) => m !== g.rep).map((/** @type {string} */ m) => `\`${m}\``).join(', ')} (×${g.n})`)
      .join(' ; ') || '—';
  push(`- Groupes ΔE 5 du déclaré : ${groups(D.colors.groupsDE5)}. [F]`);
  if (R.colors.distinctWithoutPseudo !== undefined) {
    push(
      `- Rendu hors pseudo-éléments : ${R.colors.distinctWithoutPseudo} couleurs (${R.colors.distinct} avec), ${R.fontSizes.distinctWithoutPseudo} tailles de police (${R.fontSizes.distinct} avec). [F]`,
    );
  }
  if (D.colors.groupsCompleteDE5) {
    const maxD = (/** @type {any[]} */ gs) => Math.max(0, ...gs.map((g) => g.diameter)).toFixed(2);
    push(
      `- Regroupement à liaison complète (toutes les couleurs d’un groupe à moins du seuil les unes des autres ; indépendant des fréquences) : déclaré ${D.colors.groupsCompleteDE2.length} groupes à ΔE 2, ${D.colors.groupsCompleteDE5.length} à ΔE 5 (diamètre maximal ${maxD(D.colors.groupsCompleteDE5)}) ; rendu ${R.colors.groupsCompleteDE2.length} et ${R.colors.groupsCompleteDE5.length}. Les groupes gloutons ci-dessus restent la base de comparaison avec la v1 ; leur nombre dépend de l’ordre des fréquences. [F]`,
    );
  }
  if (declared.fontFaces) push(`- Règles @font-face : ${declared.fontFaces.total}, comptées à part des polices et des graisses déclarées. [F]`);
  const tg = rendered.textGreys;
  if (tg) {
    const list = Object.entries(tg.values).map(([k, v]) => `\`${k}\` ×${/** @type {any} */ (v).count}`).join(' · ') || '—';
    push(
      `- Gris de texte (couleurs rendues employées au moins une fois en color sur un porteur de texte, chroma OKLab √(a² + b²) < 0,02, transparence comprise ; blanc à part) : ${tg.distinct} — ${list}. Blanc #ffffff en couleur de texte : ${tg.white} occurrence(s). [F]`,
    );
    const dark = Object.entries(tg.values).filter(([, v]) => /** @type {any} */ (v).onDark > 0);
    push(
      `- Gris de texte sur fond sombre (contraste avec le fond effectif supérieur au contraste avec le blanc : textes inversés) : ${
        dark.length
          ? dark
              .map(([k, v]) => {
                const x = /** @type {any} */ (v);
                const bgs = Object.entries(x.darkBackgrounds).sort((a, b) => /** @type {number} */ (b[1]) - /** @type {number} */ (a[1])).slice(0, 3).map(([bg]) => `\`${bg}\``).join(', ');
                return `\`${k}\` ${x.onDark}/${x.count} (fonds ${bgs})`;
              })
              .join(' · ')
          : 'aucun'
      }. [F]`,
    );
  }
  push();
  push(
    table(
      ['Source', 'Feuilles', 'Couleurs distinctes', 'Occurrences'],
      [...new Set(declared.sheets.map((/** @type {any} */ s) => s.source))].map((src) => [
        src,
        declared.sheets.filter((/** @type {any} */ s) => s.source === src).length,
        D.colors.bySource[src]?.distinct ?? 0,
        D.colors.bySource[src]?.occurrences ?? 0,
      ]),
    ),
  );

  // --- Valeurs les plus fréquentes
  push();
  push('## Valeurs les plus fréquentes');
  push();
  for (const f of Object.keys(FAMILY_LABELS)) {
    push(`- **${FAMILY_LABELS[f]}** — déclaré : ${top(D[f]?.values)}${R[f] ? ` ; rendu : ${top(R[f].values)}` : ''}. [F]`);
  }
  const v1Sizes = Object.entries(R.fontSizes.v1Keys ?? {})
    .sort((a, b) => /** @type {number} */ (b[1]) - /** @type {number} */ (a[1]))
    .slice(0, 8)
    .map(([k, n]) => `\`${k}\` ×${n}`)
    .join(' · ');
  push(`- **Tailles de police rendues, clé v1 (arrondi au pixel)** : ${v1Sizes || '—'}. [F]`);
  if (D.breakpoints.mediaOther) push(`- @media sans largeur : ${D.breakpoints.mediaOther}. [F]`);

  // --- Contraste
  const pairs = rendered.contrast.pairs;
  const below = pairs.filter((/** @type {any} */ p) => p.belowAA > 0 || p.flag);
  push();
  push('## Contraste (WCAG 2.1)');
  push();
  push(
    `${rendered.contrast.occurrences} porteurs de texte mesurés, ${pairs.length} paires texte-fond, ${pairs.reduce((/** @type {number} */ t, /** @type {any} */ p) => t + p.belowAA, 0)} occurrences sous AA, ${pairs.filter((/** @type {any} */ p) => p.flag).length} paire(s) marquée(s) [V]${rendered.contrast.unmeasured ? `, ${rendered.contrast.unmeasured} textes transparents non mesurés` : ''}. [F]`,
  );
  if (below.length) {
    push();
    push(
      table(
        ['Texte', 'Fond', 'Ratio', 'Occ.', 'Sous AA', 'Sous AAA', 'Incertain', 'Exemples'],
        below.slice(0, 15).map((/** @type {any} */ p) => [
          `\`${p.text}\``,
          `\`${p.bg}\``,
          p.ratio.toFixed(2),
          p.n,
          p.belowAA,
          p.belowAAA,
          p.flag ? `[V] ${Object.entries(p.uncertain.reasons).filter(([, n]) => n).map(([k, n]) => `${k} ×${n}`).join(', ')}` : '',
          p.selectors.join(', '),
        ]),
      ),
    );
  }

  const iconN = pairs.reduce((/** @type {number} */ t, /** @type {any} */ p) => t + (p.nIcon ?? 0), 0);
  if (iconN) {
    push();
    push(`Dont ${iconN} icône(s) de police d’icônes, jugées au seuil des éléments graphiques (3:1, WCAG 2.1 critère 1.4.11). [F]`);
  }

  // --- Tiers
  const T = rendered.thirdParty;
  if (T && T.elements) {
    push();
    push('## Composants tiers écartés');
    push();
    push(
      `${T.elements} éléments écartés du rendu par les sélecteurs thirdParty du fichier de sources : ${Object.entries(T.selectors).slice(0, 15).map(([s, n]) => `\`${s}\` ×${n}`).join(' · ')}. La liste des sélecteurs est un choix de l’auditeur. [H]`,
    );
  }

  // --- États
  const S = rendered.states;
  if (S && meta.states !== false) {
    push();
    push('## États (hover, focus, active)');
    push();
    push(
      `${S.sampled} éléments interactifs testés sur ${S.candidates} couples (rôle, sélecteur)${S.capped ? ', échantillon plafonné' : ''}. Couleurs qu’un élément n’a pas au repos : ${Object.keys(S.colors).length}, dont ${S.onlyInStates.length} absentes de tout le rendu au repos. [F]`,
    );
    const rows = Object.entries(S.colors).slice(0, 30);
    if (rows.length) {
      push();
      push(
        table(
          ['Couleur', 'Absente au repos', 'État', 'Propriété', 'Rôle', 'Occ.', 'Exemples'],
          rows.flatMap(([hex, v]) =>
            /** @type {any} */ (v).contexts.map((/** @type {any} */ c) => [`\`${hex}\``, /** @type {any} */ (v).newToRender ? 'oui' : 'non', c.state, c.property, c.role, c.count, c.selectors.join(', ')]),
          ),
        ),
      );
    }
  }

  // --- Trace
  if (meta.traceRendered) {
    /** @type {Record<string, number>} */
    const bySource = {};
    for (const f of Object.values(R))
      for (const v of Object.values(/** @type {any} */ (f).values ?? {}))
        for (const c of /** @type {any} */ (v).contexts ?? []) {
          if (!c.trace) continue;
          const k = c.trace.origin === 'feuille' ? `feuille ${c.trace.source}` : c.trace.origin;
          bySource[k] = (bySource[k] ?? 0) + c.count;
        }
    push();
    push('## Origine des valeurs rendues (--trace-rendered)');
    push();
    push(
      'Occurrences rendues par origine de la règle gagnante, tracée sur un élément par contexte [F] ; l’extension à toutes les occurrences du contexte est une approximation [H].',
    );
    push();
    push(table(['Origine', 'Occurrences'], Object.entries(bySource).sort((a, b) => b[1] - a[1])));
  }

  // --- Feuilles
  push();
  push('## Feuilles');
  push();
  push(
    table(
      ['#', 'Source', 'Adresse', 'Pages', 'Ko', 'Règles', 'Autre origine', 'Lecture'],
      declared.sheets.map((/** @type {any} */ s) => [
        s.id,
        s.source,
        s.href ?? (s.inline ? '<style>' : s.constructed ? 'feuille construite' : '<style> ajouté par JS'),
        s.pages.length,
        (s.bytes / 1024).toFixed(1),
        s.rules,
        s.crossOrigin ? 'oui' : '',
        s.parseError ? `erreur : ${s.parseError}` : s.via,
      ]),
    ),
  );

  // --- Comparaison v1
  if (audit.v1) {
    push();
    push('## Comparaison avec le script v1');
    push();
    push(
      `Script v1 exécuté tel quel sur chaque page (dsAudit([]), page courante seulement) ; résultat brut dans v1.json. Les écarts renvoient à la section suivante [F] ; l’attribution d’un écart chiffré à un point précis reste une hypothèse tant qu’elle n’est pas mesurée [H].`,
    );
    for (const p of audit.v1.pages) {
      push();
      push(`### ${shortUrl(p.url)}`);
      push();
      if (p.error) push(`Échec du script v1 : ${p.error} [F]`);
      else push(table(['Mesure', 'v1', 'Outil', 'Écart', 'Écarts de méthode'], p.rows.map((/** @type {any} */ r) => [r.mesure, r.v1, r.outil, r.ecart, r.ecarts])));
    }
  }

  // --- Écarts de méthode
  push();
  push('## Écarts de méthode avec la v1');
  push();
  push(table(['n°', 'Point', 'v1', 'Outil', 'Effet sur les chiffres', 'Étiquette'], V1_DIFFERENCES.map((d) => [d.n, d.point, d.v1, d.outil, d.effet, d.tag])));
  push();
  push(V1_SAME);

  // --- Limites
  push();
  push('## Limites');
  push();
  for (const l of LIMITS) push(`- ${l.text} ${l.tag}`);
  if (meta.storageState) push(`- ${STORAGE_STATE_LIMIT.text} ${STORAGE_STATE_LIMIT.tag}`);
  push();
  return out.join('\n');
}
