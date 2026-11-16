// @ts-check
/**
 * Étape 4, séance a, lot 3 : calibrage de la règle des pleins (docs/attendus/etape-4-contrat-de-marque.md) ;
 * lot 3 bis : relancé sur la règle décidée sur image (src/tokens/pleins.js).
 * Table des marques, une colonne par marque, et balayage des teintes près des seuils du cas clair.
 * Ne décide rien et ne change aucun seuil : la table et les planches servent la décision, sur image.
 *
 * Par marque : verdict de la saisie (motifs), couleur saisie, classe selon le générateur (école de generateScale,
 * recalculée sur le pas 9), classe selon la règle des pleins (classePlein), couleur exacte sur le bouton ou non,
 * et trois indicateurs qui ne sont pas des refus (D13) : primaire grise, statut le plus proche, accent proche du primaire.
 */
import { oklch, wcagContrast, formatHex, clampChroma, differenceEuclidean } from 'culori';
import { generateScale, HUED_CHROMA } from '../valise/generate.js';
import { classePlein, voileBlanc, voileNoir, SOMBRE_BLANC, BLANC_MIN, TEXTE_FONCE, TEXTE_FONCE_SURVOL } from '../tokens/pleins.js';
import { saisir, chargerCommun, lirePropresOrbe } from '../tokens/saisie.js';
import { fr, esc } from '../lib/format.js';

const WHITE = '#ffffff';
const STATUTS = ['erreur', 'succes', 'avertissement', 'info'];
const dEok = differenceEuclidean('oklab');
/** ΔE OKLab × 100. @param {string} a @param {string} b */
const dE = (a, b) => 100 * dEok(a, b);

/**
 * @typedef {import('../tokens/pleins.js').Classe} Classe
 * @typedef {{ plein: string, survol: string, texte: string, pas: number }} Bouton
 */

/** Bouton d'une échelle selon une classe de plein (D04). @param {string[]} steps @param {Classe} classe @returns {Bouton} */
export function bouton(steps, classe) {
  if (classe === 'sombre') return { plein: steps[8], survol: voileBlanc(steps[8]), texte: WHITE, pas: 9 };
  if (classe === 'soutenu') return { plein: steps[8], survol: voileNoir(steps[8]), texte: WHITE, pas: 9 };
  if (classe === 'moyen') return { plein: steps[10], survol: steps[11], texte: WHITE, pas: 11 };
  return { plein: steps[8], survol: steps[9], texte: steps[11], pas: 9 };
}

/** Une échelle (12 pas) lue sur la règle et le générateur. @param {string[]} steps */
function lecture(steps) {
  const hex = steps[8];
  const o = oklch(hex);
  const g = generateScale('x', hex);
  const classe = classePlein(steps);
  const b = bouton(steps, classe);
  return {
    hex,
    blanc: wcagContrast(WHITE, hex),
    l: o?.l ?? 0,
    chroma: o?.c ?? 0,
    h: o?.h,
    ecole: g.school,
    texteGenerateur: g.onSolid === WHITE ? 'blanc' : 'foncé',
    classe,
    exacte: b.plein === hex,
    pasBouton: b.pas,
    bouton: b,
  };
}

/**
 * Une colonne de la table : la marque passée par la saisie (mêmes motifs que npm run saisie), puis lue.
 * @param {{ dossier: string, entree: any }} m @param {import('../tokens/roles.js').RoleSet} [commun]
 */
export function colonne({ dossier, entree }, commun = chargerCommun()) {
  const r = saisir(entree, { dossier, commun });
  const existantes = { ...commun.primitives.couleur, ...commun.statuts.couleur, ...lirePropresOrbe().couleur };
  const pasDe = (/** @type {string} */ s) => Array.from({ length: 12 }, (_, i) => existantes[s][String(i + 1)].$value.hex);
  /** @param {any} v @returns {string[] | null} */
  const steps = (v) => {
    if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) return generateScale('x', v.toLowerCase()).steps;
    if (v?.echelle && existantes[v.echelle]?.['12']) return pasDe(v.echelle);
    return null;
  };
  const sp = steps(entree?.primaire);
  const sa = steps(entree?.accent);
  const primaire = sp ? lecture(sp) : null;
  const accent = sa ? lecture(sa) : null;
  const statutProche = primaire
    ? STATUTS.map((s) => ({ nom: s, dE: dE(primaire.hex, pasDe(s)[8]) })).sort((a, b) => a.dE - b.dE)[0]
    : null;
  return {
    nom: typeof entree?.nom === 'string' ? entree.nom : dossier,
    motifs: r.motifs,
    primaire,
    accent,
    grise: primaire ? primaire.chroma < HUED_CHROMA : null,
    statutProche,
    accentProche: primaire && accent ? dE(primaire.hex, accent.hex) : null,
  };
}

/** Clartés et teintes du balayage. */
export const CLARTES = Array.from({ length: 9 }, (_, i) => Math.round((0.6 + i * 0.04) * 100) / 100);
export const TEINTES = Array.from({ length: 23 }, (_, i) => 30 + i * 5);

/**
 * Balayage des teintes près des seuils du cas clair : deux planches (chroma la plus forte du gamut sRGB, chroma 0,10).
 * Chaque case : couleur saisie, classe de la règle, bouton selon la règle, et pour une case moyenne le bouton du cas
 * clair (couleur exacte, texte au pas 12) avec ses contrastes ; verdict de la saisie.
 */
export function balayage() {
  const commun = chargerCommun();
  const polices = { titre: ['serif'], texte: ['sans-serif'] };
  return [
    { titre: 'Chroma la plus forte dans le gamut sRGB', c: 0.4 },
    { titre: 'Chroma 0,10 (ramenée au gamut sRGB si besoin)', c: 0.1 },
  ].map(({ titre, c }) => ({
    titre,
    cases: CLARTES.flatMap((l) =>
      TEINTES.map((h) => {
        const hex = formatHex(clampChroma({ mode: 'oklch', l, c, h }, 'oklch'));
        const steps = generateScale('x', hex).steps;
        const classe = classePlein(steps);
        const regle = bouton(steps, classe);
        /** @type {Classe | null} */
        const autreClasse = classe === 'moyen' ? 'clair' : null;
        const a = autreClasse ? bouton(steps, autreClasse) : null;
        const autre = a && autreClasse
          ? { classe: autreClasse, ...a, ratioPlein: wcagContrast(a.texte, a.plein), ratioSurvol: wcagContrast(a.texte, a.survol) }
          : null;
        const motifs = saisir({ nom: 'balayage', primaire: hex, polices }, { dossier: '/balayage', commun }).motifs;
        return { l, h, hex, classe, exacte: regle.plein === hex, regle, autre, motifs };
      }),
    ),
  }));
}

/** @param {string} bg @param {string} fg @param {string} txt @param {string} [title] */
const pastille = (bg, fg, txt, title = '') => `<span class="b" style="background:${bg};color:${fg}"${title ? ` title="${esc(title)}"` : ''}>${esc(txt)}</span>`;
/** La règle en une phrase. */
const REGLE = `blanc ≥ ${fr(BLANC_MIN, { decimales: 1, zeros: true })} sur le pas 9 : couleur exacte, texte blanc (survol par voile blanc si blanc ≥ ${fr(SOMBRE_BLANC, { decimales: 1, zeros: true })}, sinon par voile noir de 15 %) ; sinon, pas 12 ≥ ${TEXTE_FONCE} sur le pas 9 et ≥ ${fr(TEXTE_FONCE_SURVOL, { decimales: 1, zeros: true })} sur le pas 10 : couleur exacte, texte au pas 12 ; sinon pas 11, texte blanc. Primaire et accent seulement ; statuts figés.`;
const LETTRE = /** @type {Record<string, string>} */ ({ sombre: 'S', soutenu: 'T', clair: 'C', moyen: 'M' });
const ouiNon = (/** @type {boolean | null} */ v) => (v === null ? '—' : v ? 'oui' : 'non');

/** @param {ReturnType<typeof colonne>[]} cols */
function lignes(cols) {
  /** @param {(c: ReturnType<typeof colonne>) => string} f */
  const map = (f) => cols.map(f);
  const p = (/** @type {ReturnType<typeof colonne>} */ c) => c.primaire;
  return [
    ['Saisie [F]', map((c) => (c.motifs.length ? `refusée : ${c.motifs.join(' ; ')}` : 'acceptée'))],
    ['Couleur saisie (pas 9) [F]', map((c) => p(c)?.hex ?? '—')],
    ['Blanc sur la couleur [F]', map((c) => (p(c) ? `${fr(/** @type {any} */ (p(c)).blanc, { decimales: 2, zeros: true })}:1` : '—'))],
    ['OKLCH : L, C, h [F]', map((c) => (p(c) ? `${fr(/** @type {any} */ (p(c)).l, { decimales: 3, zeros: true })} ; ${fr(/** @type {any} */ (p(c)).chroma, { decimales: 3, zeros: true })} ; ${p(c)?.h === undefined ? '—' : fr(/** @type {number} */ (p(c)?.h), { decimales: 1, zeros: true }) + '°'}` : '—'))],
    ['Classe selon le générateur (école) [F]', map((c) => (p(c) ? `${p(c)?.ecole}, texte ${p(c)?.texteGenerateur} sur le pas 9` : '—'))],
    ['Classe selon la règle des pleins [F]', map((c) => p(c)?.classe ?? '—')],
    ['Couleur exacte sur le bouton [F]', map((c) => (p(c) ? `${ouiNon(/** @type {any} */ (p(c)).exacte)} (pas ${p(c)?.pasBouton})` : '—'))],
    ['Accent : couleur, école, règle [F]', map((c) => (c.accent ? `${c.accent.hex}, ${c.accent.ecole}, ${c.accent.classe}` : 'aucun, repli sur le neutre'))],
    ['Primaire grise (C < 0,02) [F]', map((c) => ouiNon(c.grise))],
    ['Statut le plus proche, ΔE OKLab [F]', map((c) => (c.statutProche ? `${c.statutProche.nom}, ${fr(c.statutProche.dE, { decimales: 1, zeros: true })}` : '—'))],
    ['Accent proche du primaire, ΔE OKLab [F]', map((c) => (c.accentProche === null ? '—' : fr(c.accentProche, { decimales: 1, zeros: true })))],
  ];
}

/**
 * Table des marques en Markdown, une colonne par marque ; résumé du balayage si donné.
 * @param {ReturnType<typeof colonne>[]} cols @param {ReturnType<typeof balayage>} [planches]
 */
export function calibrageMd(cols, planches = []) {
  const out = [
    '# Calibrage des pleins : table des marques',
    '',
    `Règle en vigueur (décidée sur image le 15/11/2026) : ${REGLE}`,
    '',
    `| | ${cols.map((c) => c.nom).join(' | ')} |`,
    `|---|${cols.map(() => '---').join('|')}|`,
    ...lignes(cols).map(([k, v]) => `| ${k} | ${/** @type {string[]} */ (v).map((x) => x.replace(/\|/g, '\\|')).join(' | ')} |`),
    '',
  ];
  if (planches.length) out.push('## Balayage', '', `Teintes ${TEINTES[0]}° à ${TEINTES.at(-1)}°, clartés ${fr(CLARTES[0], { decimales: 2, zeros: true })} à ${fr(/** @type {number} */ (CLARTES.at(-1)), { decimales: 2, zeros: true })}.`, '');
  for (const pl of planches) {
    const n = (/** @type {(x: any) => boolean} */ f) => pl.cases.filter(f).length;
    const refus = pl.cases.filter((x) => x.motifs.length);
    out.push(
      `- ${pl.titre} [F] : ${pl.cases.length} cases ; sombre ${n((x) => x.classe === 'sombre')}, soutenu ${n((x) => x.classe === 'soutenu')}, clair ${n((x) => x.classe === 'clair')}, moyen ${n((x) => x.classe === 'moyen')} ; ` +
        `gardent la couleur exacte : ${n((x) => x.exacte)}, dont acceptées à la saisie : ${n((x) => x.exacte && !x.motifs.length)} ; ` +
        `refusées à la saisie : ${refus.length} (clair : ${refus.filter((x) => x.classe === 'clair').map((x) => `${fr(x.l, { decimales: 2, zeros: true })}/${x.h}°`).join(', ') || 'aucune'} ; moyen : ${refus.filter((x) => x.classe === 'moyen').map((x) => `${fr(x.l, { decimales: 2, zeros: true })}/${x.h}°`).join(', ') || 'aucune'}).`,
    );
  }
  if (planches.length) out.push('');
  return out.join('\n');
}

/**
 * Planche HTML autonome : table des marques (avec boutons rendus) et balayage.
 * @param {ReturnType<typeof colonne>[]} cols @param {ReturnType<typeof balayage>} planches
 */
export function calibrageHtml(cols, planches) {
  const tete = `<tr><th></th>${cols.map((c) => `<th>${esc(c.nom)}</th>`).join('')}</tr>`;
  const corps = lignes(cols)
    .map(([k, v]) => `<tr><th>${esc(/** @type {string} */ (k))}</th>${/** @type {string[]} */ (v).map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`)
    .join('\n');
  const rendu = `<tr><th>Bouton selon la règle : repos, survol</th>${cols
    .map((c) => {
      const b = c.primaire?.bouton;
      return `<td>${b ? `${pastille(b.plein, b.texte, 'Commander')} ${pastille(b.survol, b.texte, 'Commander')}` : '—'}</td>`;
    })
    .join('')}</tr>
<tr><th>Couleur saisie, seule</th>${cols.map((c) => `<td>${c.primaire ? `<span class="sw" style="background:${c.primaire.hex}"></span>` : '—'}</td>`).join('')}</tr>`;
  const grille = (/** @type {ReturnType<typeof balayage>[number]} */ pl) => {
    const head = `<tr><th>L \\ h</th>${TEINTES.map((h) => `<th>${h}°</th>`).join('')}</tr>`;
    const rows = CLARTES.map((l) => {
      const cells = TEINTES.map((h) => {
        const x = /** @type {any} */ (pl.cases.find((k) => k.l === l && k.h === h));
        const a = x.autre;
        const ratio = a ? a.ratioPlein : null;
        const titre = `${x.hex} · règle : ${x.classe}, bouton pas ${x.regle.pas}${x.exacte ? ' (couleur exacte)' : ''}${a ? ` · autre cas : ${a.classe}, texte ${fr(a.ratioPlein, { decimales: 2, zeros: true })} sur le plein, ${fr(a.ratioSurvol, { decimales: 2, zeros: true })} sur le survol` : ''}${x.motifs.length ? ` · saisie refusée : ${x.motifs.join(' ; ')}` : ''}`;
        return `<td class="c${x.exacte ? ' exacte' : ''}${x.motifs.length ? ' refus' : ''}" title="${esc(titre)}"><span class="sw2" style="background:${x.hex}"></span>${pastille(x.regle.plein, x.regle.texte, 'Aa')}${a ? `${pastille(a.plein, a.texte, 'Aa')}<small class="${/** @type {number} */ (ratio) < TEXTE_FONCE ? 'ko' : ''}">${fr(/** @type {number} */ (ratio), { decimales: 1, zeros: true })}</small>` : '<small>—</small>'}<small>${LETTRE[x.classe]}${x.motifs.length ? ' ✗' : ''}</small></td>`;
      }).join('');
      return `<tr><th>${fr(l, { decimales: 2, zeros: true })}</th>${cells}</tr>`;
    }).join('\n');
    return `<h3>${esc(pl.titre)}</h3><div class="scroll"><table class="grille">${head}\n${rows}</table></div>`;
  };
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Calibrage des pleins</title>
<style>
:root{--fond:#fbfbfb;--texte:#363026;--ligne:#d8d6d2;--seuil:#2b4c7e;--ko:#cb1d2a}
body{background:var(--fond);color:var(--texte);font:14px/1.5 system-ui,sans-serif;margin:0;padding:24px 16px;max-width:1500px}
h1{font-size:24px;margin:0 0 8px}h2{font-size:18px;margin:32px 0 8px}h3{font-size:15px;margin:24px 0 8px}
p{max-width:75ch}.scroll{overflow-x:auto}
table{border-collapse:collapse}th,td{border:1px solid var(--ligne);padding:6px 8px;text-align:left;vertical-align:top}
.marques th:first-child{max-width:220px}.marques td{min-width:130px}
.b{display:inline-block;padding:4px 8px;border-radius:6px;font-weight:600;margin:1px}
.sw{display:inline-block;width:72px;height:28px;border-radius:6px}
.grille td.c{padding:3px;text-align:center;font-size:11px;min-width:54px}
.grille .b{padding:2px 5px;font-size:12px;display:block;margin:2px 0}
.sw2{display:block;height:8px;border-radius:2px}
.grille small{display:block;line-height:1.2}.grille small.ko{color:var(--ko);font-weight:700}
.grille td.exacte{outline:3px solid var(--seuil);outline-offset:-3px}
.grille td.refus{background:#fff0ee}
</style></head><body>
<h1>Calibrage des pleins</h1>
<p>Étape 4, séance a, lot 3 bis. Règle en vigueur, décidée sur image le 15/11/2026 : ${esc(REGLE)}</p>
<h2>Table des marques</h2>
<div class="scroll"><table class="marques">${tete}
${corps}
${rendu}</table></div>
<h2>Balayage des teintes</h2>
<p>Chaque case : en haut la couleur saisie ; puis le bouton selon la règle ; pour une case moyenne, le bouton du cas clair (couleur exacte, texte au pas 12) avec le contraste de ce texte sur le plein, en rouge sous ${TEXTE_FONCE} ; enfin la classe (S sombre, T soutenu, C clair, M moyen) et ✗ si la saisie refuse la couleur (fond rosé). Encadré : la couleur exacte est sur le bouton. Le détail est dans l'infobulle de chaque case.</p>
${planches.map(grille).join('\n')}
</body></html>
`;
}
