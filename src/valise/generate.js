// @ts-check
/**
 * Lot G : générateur de valise visé par contraste (règles G0 à G7 de l'attendu du lot G ;
 * G1, G5 et G7 corrigés le 13/11/2026). culori seul, sans leonardo ni chroma.js.
 *
 * Échelle de 12 pas : 1-2 fonds, 3-5 fonds de composants, 6-8 bordures, 9-10 pleins, 11-12 texte.
 *   G0  chaque pas : dichotomie sur la clarté OKLCH jusqu'au contraste visé sur blanc, teinte fixe,
 *       chroma en courbe (maximale à la clarté du pas 9, atténuée vers le blanc et le noir, jamais
 *       au-dessus de la source) ;
 *   G1  école selon le contraste k9 de la source sur blanc :
 *       normale      pas 9 = source ;
 *       foncée       k9 ≥ 5,6 : pas 9 = source, 10 à 12 vers le noir, k9 + (21 − k9) × 0,25 / 0,5 / 0,8,
 *                    signal « échelle comprimée » si k9 > 13 ;
 *       plein clair  k9 < 3,2 (pas 8) : pas 9 = source, onSolid foncé, 7 et 8 peuvent être plus foncés ;
 *       teinte seulement (option de cible) : la source donne teinte et chroma, l'échelle est générée
 *                    (pas 9 visé à PLEIN_TEINTE), la source va au pas texte de contraste le plus proche ;
 *   G2  gamut : chroma réduite à clarté et teinte constantes (clampChroma en OKLCH), jamais de canaux rabattus ;
 *   G2 bis teinte fixe ; décalage voulu (≤ 5°, vers le chaud aux pas clairs) en option, désactivé par défaut ;
 *   G3  pas 10 : k10 = min(k9 × 1,18 ; √(k9 × 5,6)) ; signal si 10 ↔ 11 < ΔE 2 ;
 *   G4  onSolid vérifié sur les pas 9 et 10, une valeur par pas si besoin ;
 *   G5  contrôles avant écriture (checkValise) : sinon la valise n'est pas écrite (writeValise) ;
 *   G7  contrat de paires écrit dans la valise.
 */
import { writeFile } from 'node:fs/promises';
import { oklch, rgb, formatHex, wcagContrast, clampChroma, differenceEuclidean } from 'culori';

/** Contraste visé sur blanc par pas (repris de la valise de A ; 9 et 10 selon l'école). */
export const TARGETS = /** @type {Record<number, number>} */ ({ 1: 1.02, 2: 1.05, 3: 1.11, 4: 1.19, 5: 1.29, 6: 1.45, 7: 1.9, 8: 3.2, 11: 5.6, 12: 13 });
/** G1 : seuils d'école. */
export const DARK_K = 5.6;
export const COMPRESSED_K = 13;
/** Teinte seulement : contraste visé du pas 9 généré (texte blanc lisible, ≥ 4,5). [H] */
export const PLEIN_TEINTE = 4.6;
/** G2 bis : écart de teinte permis, sans et avec décalage voulu ; teinte vers laquelle on décale. */
export const HUE_SPAN = 3;
export const HUE_SPAN_SHIFT = 5;
const WARM = 70;
/** Chroma en dessous de laquelle la teinte ne se mesure pas (seuil gris du lot M). */
export const HUED_CHROMA = 0.02;
/** G3 : écart minimal souhaité entre 10 et 11. */
const MIN_10_11 = 2;

const WHITE = '#ffffff';
const BLACK = '#000000';
const dEok = differenceEuclidean('oklab');
/** ΔE de la table (OKLab × 100). @param {string} a @param {string} b */
const dE = (a, b) => 100 * dEok(a, b);
/** @param {string} hex */
const kOf = (hex) => wcagContrast(hex, WHITE);
/** Écart angulaire signé b − a dans [−180, 180]. @param {number} a @param {number} b */
const dh = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;
/** @param {number} n */
const r4 = (n) => Math.round(n * 10000) / 10000;

/**
 * Paramètres de teinte et de chroma d'une échelle.
 * @param {string} source @param {{ hueShift?: number, l9?: number }} [opts]
 */
function hueModel(source, { hueShift = 0, l9 } = {}) {
  const o = oklch(source);
  const c9 = o.c ?? 0;
  const h9 = o.h ?? 0;
  const L9 = l9 ?? o.l;
  const shift = Math.max(-HUE_SPAN_SHIFT, Math.min(HUE_SPAN_SHIFT, hueShift));
  const toward = Math.sign(dh(h9, WARM)) || 1;
  return {
    c9,
    h9,
    L9,
    /** Chroma voulue à la clarté l : parabole, 1 à la clarté du pas 9, 0 au blanc et au noir. @param {number} l */
    chroma(l) {
      const t = l >= L9 ? (l - L9) / Math.max(1e-6, 1 - L9) : (L9 - l) / Math.max(1e-6, L9);
      return c9 * Math.max(0, 1 - t * t);
    },
    /** Teinte à la clarté l : fixe ; décalage voulu vers le chaud aux pas clairs, en option. @param {number} l */
    hue(l) {
      if (!shift || l <= L9) return h9;
      return h9 + toward * Math.abs(shift) * ((l - L9) / Math.max(1e-6, 1 - L9));
    },
  };
}

/**
 * G2 bis : passage à l'hexadécimal qui garde la teinte. Parmi les 8 arrondis voisins (plancher ou
 * plafond de chaque canal), celui dont la teinte s'écarte le moins de la teinte voulue, à contraste
 * tenu (± 0,5 %) et chroma jamais au-dessus de la source ; sinon le plus proche du contraste visé.
 * @param {any} color  OKLCH dans le gamut @param {number} target  contraste visé sur blanc
 * @param {number} hue  teinte voulue @param {number} cMax  chroma de la source
 */
function quantize(color, target, hue, cMax) {
  const c = rgb(color);
  const ch = [c.r, c.g, c.b].map((x) => Math.min(255, Math.max(0, x * 255)));
  /** @param {number[][]} lists */
  const combos = (lists) => lists[0].flatMap((r) => lists[1].flatMap((g) => lists[2].map((b) => '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join(''))));
  const cands = combos(ch.map((x) => [...new Set([Math.floor(x), Math.min(255, Math.ceil(x))])]));
  const scored = [...new Set(cands)].map((hex) => {
    const o = oklch(hex);
    return { hex, err: Math.abs(kOf(hex) - target) / target, dh: (o.c ?? 0) < 1e-4 ? 0 : Math.abs(dh(hue, o.h ?? hue)), over: (o.c ?? 0) > cMax + 1e-4 };
  });
  const ok = scored.filter((x) => x.err <= 0.005 && !x.over).sort((a, b) => a.dh - b.dh || a.err - b.err);
  return (ok[0] ?? scored.sort((a, b) => a.err - b.err)[0]).hex;
}

/**
 * G0 et G2 : couleur de la teinte voulue au contraste visé sur blanc (dichotomie sur la clarté).
 * @param {ReturnType<typeof hueModel>} m @param {number} target
 */
function atContrast(m, target) {
  /** @param {number} l */
  const color = (l) => clampChroma({ mode: 'oklch', l, c: m.chroma(l), h: m.hue(l) }, 'oklch');
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 48; i++) {
    const l = (lo + hi) / 2;
    if (kOf(formatHex(color(l))) > target) lo = l;
    else hi = l;
  }
  const l = (lo + hi) / 2;
  return quantize(color(l), target, m.hue(l), m.c9);
}

/**
 * G4 : texte foncé posé sur des pleins — la teinte de l'échelle, assombrie jusqu'au plus clair qui
 * passe 4,5 sur tous ces fonds ; le noir sinon.
 * @param {ReturnType<typeof hueModel>} m @param {string[]} bgs
 */
function darkOnSolid(m, bgs) {
  /** @param {number} l */
  const make = (l) => formatHex(clampChroma({ mode: 'oklch', l, c: m.chroma(l), h: m.h9 }, 'oklch'));
  /** @param {string} t */
  const passes = (t) => bgs.every((bg) => wcagContrast(t, bg) >= 4.5);
  let lo = 0;
  let hi = Math.min(...bgs.map((bg) => oklch(bg).l));
  for (let i = 0; i < 48; i++) {
    const l = (lo + hi) / 2;
    if (passes(make(l))) lo = l;
    else hi = l;
  }
  const out = make(lo);
  return passes(out) ? out : BLACK;
}
/** G4 : contraste sur blanc le plus haut d'un plein où un texte noir passe encore 4,5 (21 / 4,5). */
export const DARK_TEXT_MAX_K = 21 / 4.5;
/** G4 : écart minimal pour qu'un pas 10 plus foncé se distingue du 9 (sinon il passe plus clair). */
const MIN_9_10 = 2;

/**
 * Une échelle de 12 pas.
 * @param {string} name @param {string} source
 * @param {{ school?: 'teinte', hueShift?: number }} [opts]
 * @returns {{ name: string, source: string, school: 'normale' | 'foncée' | 'plein clair' | 'teinte seulement', steps: string[], onSolid: string, step10: 'plus foncé' | 'plus clair', signals: string[], hueShift: number }}
 */
export function generateScale(name, source, opts = {}) {
  const src = formatHex(source);
  const k9 = kOf(src);
  const hueShift = opts.hueShift ?? 0;
  /** @type {string[]} */
  const signals = [];
  /** @type {'normale' | 'foncée' | 'plein clair' | 'teinte seulement'} */
  let school = opts.school === 'teinte' ? 'teinte seulement' : k9 >= DARK_K ? 'foncée' : k9 < TARGETS[8] ? 'plein clair' : 'normale';
  /** @type {Record<number, number>} */
  const want = { ...TARGETS };
  let m;
  /** @type {Record<number, string>} */
  const fixed = {};
  if (school === 'teinte seulement') {
    // Pas 9 généré : on cherche d'abord sa clarté à pleine chroma, puis la courbe se centre dessus.
    const flat = hueModel(src, { hueShift: 0 });
    const probe = atContrast({ ...flat, chroma: () => flat.c9 }, PLEIN_TEINTE);
    m = hueModel(src, { hueShift, l9: oklch(probe).l });
    want[9] = PLEIN_TEINTE;
    want[10] = Math.min(PLEIN_TEINTE * 1.18, Math.sqrt(PLEIN_TEINTE * TARGETS[11]));
    const textStep = Math.abs(k9 - TARGETS[11]) <= Math.abs(k9 - TARGETS[12]) ? 11 : 12;
    fixed[textStep] = src;
    signals.push('teinte seulement');
  } else {
    m = hueModel(src, { hueShift });
    fixed[9] = src;
    if (school === 'foncée') {
      [0.25, 0.5, 0.8].forEach((x, i) => (want[10 + i] = k9 + (21 - k9) * x));
      if (k9 > COMPRESSED_K) signals.push('échelle comprimée');
    } else {
      want[10] = Math.min(k9 * 1.18, Math.sqrt(k9 * TARGETS[11]));
      if (school === 'plein clair') signals.push('plein clair');
    }
  }
  /** @type {string[]} */
  const steps = [];
  for (let i = 0; i < 12; i++) if (i !== 9) steps[i] = fixed[i + 1] ?? atContrast(m, want[i + 1]);
  // G4 corrigé : un seul onSolid pour 9 et 10. Texte blanc : le pas 10 suit sa cible (plus foncé).
  // Texte foncé : le pas 10 plus foncé s'arrête où ce texte reste lisible (21 / 4,5) ; s'il ne se
  // distingue plus du 9 (ΔE < 2), il passe un cran plus clair (k9 / 1,18).
  /** @type {'plus foncé' | 'plus clair'} */
  let step10 = 'plus foncé';
  let onSolid;
  if (wcagContrast(WHITE, steps[8]) >= 4.5) {
    steps[9] = fixed[10] ?? atContrast(m, want[10]);
    onSolid = WHITE;
  } else {
    // Marge de 1 % sous la limite du texte noir, pour l'arrondi à l'hexadécimal.
    const darker = fixed[10] ?? atContrast(m, Math.min(want[10], DARK_TEXT_MAX_K * 0.99));
    const readable = wcagContrast(darkOnSolid(m, [steps[8], darker]), darker) >= 4.5;
    if (readable && kOf(darker) > kOf(steps[8]) && dE(darker, steps[8]) >= MIN_9_10) steps[9] = darker;
    else {
      steps[9] = atContrast(m, kOf(steps[8]) / 1.18);
      step10 = 'plus clair';
      signals.push('pas 10 plus clair que le 9');
    }
    onSolid = darkOnSolid(m, [steps[8], steps[9]]);
  }
  if (school !== 'foncée' && dE(steps[9], steps[10]) < MIN_10_11) signals.push('10 ↔ 11 < ΔE 2');
  if (hueShift) signals.push('décalage de teinte');
  return { name, source: src, school, steps, onSolid, step10, signals, hueShift };
}

/** Pas de l'échelle `scale` dans une valise, indexés de 1 à 12. @param {any} valise @param {string} scale */
function stepsOf(valise, scale) {
  /** @type {Record<number, string>} */
  const out = {};
  for (const c of valise.colors ?? []) {
    const mm = /^(.+)-(\d+)$/.exec(c.name ?? '');
    if (mm && mm[1] === scale) out[Number(mm[2])] = c.value.toLowerCase();
  }
  return out;
}
/** @param {any} valise */
const scalesOf = (valise) => [...new Set((valise.colors ?? []).map((/** @type {any} */ c) => /^(.+)-\d+$/.exec(c.name ?? '')?.[1]).filter(Boolean))];
/** @param {any} valise @param {string} scale @param {9 | 10} step */
const onSolidAt = (valise, scale, step) => {
  const v = valise.onSolid?.[scale];
  return typeof v === 'string' ? v : v?.[step];
};

/**
 * G7 : contrat de paires d'une valise. Échelle comprimée : les notes disent ce qui ne tient pas
 * (pas 9 à 12 peu distincts).
 * @param {any} valise
 */
export function contractOf(valise) {
  const pairs = [];
  /** @type {string[]} */
  const notes = [];
  const list = [
    ...['11', '12'].flatMap((fg) => ['1', '2'].map((bg) => ({ fg, bg, min: 4.5 }))),
    ...['3', '4', '5'].map((bg) => ({ fg: '12', bg, min: 4.5 })),
    { fg: 'onSolid', bg: '9', min: 4.5 },
    { fg: 'onSolid', bg: '10', min: 4.5 },
    { fg: '8', bg: '1', min: 3 },
  ];
  for (const scale of scalesOf(valise)) {
    const st = stepsOf(valise, scale);
    for (const p of list) {
      const fg = p.fg === 'onSolid' ? onSolidAt(valise, scale, /** @type {9 | 10} */ (Number(p.bg))) : st[Number(p.fg)];
      const bg = st[Number(p.bg)];
      if (!fg || !bg) {
        pairs.push({ scale, ...p, ratio: 0, ok: false });
        continue;
      }
      const ratio = r4(wcagContrast(fg, bg));
      pairs.push({ scale, ...p, ratio, ok: ratio >= p.min });
    }
    if ((valise.signals?.[scale] ?? []).includes('échelle comprimée')) {
      const gaps = [9, 10, 11].map((i) => dE(st[i], st[i + 1]).toFixed(2).replace('.', ','));
      notes.push(`${scale} : échelle comprimée, pas 9 à 12 à ΔE ${gaps.join(' / ')} entre voisins, peu distincts ; le contraste tient, la nuance ne tient pas`);
    }
    if ((valise.signals?.[scale] ?? []).includes('plein clair')) notes.push(`${scale} : plein clair, les pas 7 et 8 sont plus foncés que le pas 9`);
  }
  const fails = pairs.filter((p) => !p.ok).map((p) => `${p.scale} : ${p.fg} sur ${p.bg}, ${String(p.ratio).replace('.', ',')} < ${String(p.min).replace('.', ',')}`);
  return { pairs, fails, notes };
}

/**
 * Valise complète : blanc, échelles, onSolid (G4), dimensions, signaux, contrat (G7).
 * @param {{ scales: { name: string, source: string, school?: 'teinte', hueShift?: number }[], dims: { radii: number[], spacing: number[], fontSizes: number[] }, $comment?: string, brand?: any }} spec
 */
export function generateValise(spec) {
  const generated = spec.scales.map((s) => generateScale(s.name, s.source, { school: s.school, hueShift: s.hueShift }));
  /** @type {any} */
  const valise = {
    ...(spec.$comment ? { $comment: spec.$comment } : {}),
    ...(spec.brand ? { brand: spec.brand } : {}),
    generator: {
      name: 'ds-lab, générateur visé par contraste (lot G)',
      targets: TARGETS,
      schools: Object.fromEntries(generated.map((g) => [g.name, g.school])),
      sources: Object.fromEntries(generated.map((g) => [g.name, g.source])),
      hueShift: Object.fromEntries(generated.filter((g) => g.hueShift).map((g) => [g.name, g.hueShift])),
      step10: Object.fromEntries(generated.map((g) => [g.name, g.step10])),
    },
    signals: Object.fromEntries(generated.filter((g) => g.signals.length).map((g) => [g.name, g.signals])),
    onSolid: Object.fromEntries(generated.map((g) => [g.name, g.onSolid])),
    radii: spec.dims.radii,
    spacing: spec.dims.spacing,
    fontSizes: spec.dims.fontSizes,
    colors: [{ name: 'blanc', value: WHITE }, ...generated.flatMap((g) => g.steps.map((value, i) => ({ name: `${g.name}-${i + 1}`, value })))],
  };
  valise.contract = contractOf(valise);
  return valise;
}

/**
 * G5 : contrôles avant écriture. Liste vide = la valise peut être écrite.
 * @param {any} valise
 * @returns {string[]}
 */
export function checkValise(valise) {
  /** @type {string[]} */
  const fails = [];
  for (const scale of scalesOf(valise)) {
    const st = stepsOf(valise, scale);
    // G5 corrigé : aucun doublon à l'intérieur d'une échelle (deux échelles peuvent partager une valeur).
    /** @type {Map<string, number>} */
    const seen = new Map();
    for (const [i, v] of Object.entries(st)) {
      if (seen.has(v)) fails.push(`${scale} : doublon, pas ${seen.get(v)} = pas ${i} (${v})`);
      else seen.set(v, Number(i));
    }
    const school = valise.generator?.schools?.[scale] ?? 'normale';
    const lighter10 = valise.generator?.step10?.[scale] === 'plus clair';
    // Contraste croissant 1 → 12 ; plein clair : 1 → 8 et 10 → 12, seul le pas 9 exempté ;
    // pas 10 plus clair (G4) : 1 → 9 et 10 → 12, le pas 10 restant au-dessus du 8.
    const runs = school === 'plein clair' ? [[1, 8], [10, 12]] : lighter10 ? [[1, 9], [10, 12]] : [[1, 12]];
    if (lighter10 && school !== 'plein clair' && !(kOf(st[10]) > kOf(st[8]))) fails.push(`${scale} : contraste non croissant (pas 8 → 10)`);
    for (const [a, b] of runs)
      for (let i = a; i < b; i++) if (!(kOf(st[i + 1]) > kOf(st[i]))) fails.push(`${scale} : contraste non croissant (pas ${i} → ${i + 1})`);
    // Teinte (G2 bis) sur les pas mesurables, si la source n'est pas grise.
    const src = valise.generator?.sources?.[scale] ?? st[9];
    if ((oklch(src).c ?? 0) >= HUED_CHROMA) {
      const hs = Object.values(st)
        .map((v) => oklch(v))
        .filter((o) => (o.c ?? 0) >= HUED_CHROMA)
        .map((o) => o.h ?? 0);
      const span = Math.max(0, ...hs.flatMap((a) => hs.map((b) => Math.abs(dh(a, b)))));
      const max = valise.generator?.hueShift?.[scale] ? HUE_SPAN_SHIFT : HUE_SPAN;
      if (span > max + 1e-9) fails.push(`${scale} : teinte, écart de ${span.toFixed(2)}° (au plus ${max}°)`);
    }
    // onSolid (G4) sur 9 et 10.
    for (const step of /** @type {(9 | 10)[]} */ ([9, 10])) {
      const os = onSolidAt(valise, scale, step);
      const ratio = os && st[step] ? wcagContrast(os, st[step]) : 0;
      if (ratio < 4.5) fails.push(`${scale} : onSolid sur le pas ${step}, ${ratio.toFixed(2)} < 4,5`);
    }
  }
  // Contrat (G7), recalculé.
  for (const f of contractOf(valise).fails) fails.push(`contrat : ${f}`);
  return fails;
}

/**
 * G5 : écrit la valise seulement si elle passe tous les contrôles.
 * @param {string} path @param {any} valise
 */
export async function writeValise(path, valise) {
  const fails = checkValise(valise);
  if (fails.length) throw new Error(`valise non écrite (G5) : ${fails.join(' ; ')}`);
  await writeFile(path, JSON.stringify(valise, null, 2) + '\n');
}
