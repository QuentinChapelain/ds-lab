// @ts-check
/**
 * Applique modifications.json (écrit par reduce) aux feuilles d'une copie du site.
 *
 * S2. Chaque entrée vise une déclaration : feuille (chemin d'URL sous la racine), ligne de la règle
 *     (ligne de son accolade ouvrante, comme la trace), sélecteur, propriété (côté ou coin : un
 *     composant d'un raccourci). Garde : si le composant trouvé n'est pas la valeur écrite attendue,
 *     l'entrée n'est pas appliquée et sort en écart ; s'il vaut déjà la nouvelle valeur, elle est
 *     « déjà appliquée ». Un composant partagé par des propriétés aux issues différentes (ou par une
 *     propriété sans entrée) sort en écart : le raccourci n'est pas coupé.
 * S3. Relance sur une copie migrée : les commentaires posés décalent les lignes ; la ligne d'origine
 *     d'une règle se retrouve en retranchant les lignes de ces commentaires (ceux de ce fichier de
 *     modifications) qui la précèdent.
 * S4. Le HTML n'est jamais touché ; reste.md dit ce qui reste à faire à la main.
 */
import postcss from 'postcss';
import { norm, components, coverage, rulesOf, localiser, composantDe } from './localisation.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, relative, isAbsolute } from 'node:path';

/**
 * Applique un fichier de modifications à une copie.
 * @param {any} mods  contenu de modifications.json
 * @param {{ root: string, dryRun?: boolean, restePath?: string }} o
 */
export async function applyModifications(mods, { root, dryRun = false, restePath }) {
  /** @type {{ entry: any, status: 'appliquée' | 'déjà appliquée' | 'écart', reason?: string, at?: string }[]} */
  const results = mods.entries.map((/** @type {any} */ entry) => ({ entry, status: 'écart' }));
  /** @type {{ comment: any, status: 'posé' | 'déjà posé' | 'écart', reason?: string, at?: string }[]} */
  const comments = (mods.comments ?? []).map((/** @type {any} */ comment) => ({ comment, status: 'écart' }));
  /** @type {string[]} */
  const written = [];
  const sheets = [...new Set([...mods.entries.map((/** @type {any} */ e) => e.sheet), ...(mods.comments ?? []).map((/** @type {any} */ c) => c.sheet)])].sort();
  // D18 : toutes les feuilles sont lues et analysées avant la première écriture. Une
  // feuille absente de la copie est un écart (l'entrée ne s'applique pas ici) ; une feuille illisible ou un CSS
  // invalide est une panne, qui nomme la feuille, et rien n'est écrit.
  /** @type {Map<string, { file: string, text: string, css: any } | null>} */
  const lues = new Map();
  for (const sheet of sheets) {
    const file = join(root, sheet);
    /** @type {string} */
    let text;
    try {
      text = await readFile(file, 'utf8');
    } catch (e) {
      if (/** @type {any} */ (e).code !== 'ENOENT') throw new Error(`${sheet} : feuille illisible (${/** @type {Error} */ (e).message.split('\n')[0]})`);
      lues.set(sheet, null);
      continue;
    }
    try {
      lues.set(sheet, { file, text, css: postcss.parse(text, { from: file }) });
    } catch (e) {
      const err = /** @type {any} */ (e);
      throw new Error(`${sheet} : CSS illisible (${err.line ? `ligne ${err.line} : ` : ''}${err.reason ?? String(err.message).split('\n')[0]})`);
    }
  }
  for (const sheet of sheets) {
    const mine = results.filter((x) => x.entry.sheet === sheet);
    const notes = comments.filter((x) => x.comment.sheet === sheet);
    const lue = lues.get(sheet);
    if (!lue) {
      for (const x of [...mine, ...notes]) x.reason = `feuille introuvable sous la racine (${sheet})`;
      continue;
    }
    const { file, text, css } = lue;
    const rules = rulesOf(css, new Set(notes.map((x) => x.comment.text)));
    /** @param {any} t */
    const locate = (t) => {
      const loc = localiser(rules, t);
      return 'error' in loc ? { error: loc.error } : { decl: loc.decl, at: `${sheet}:${loc.line}` };
    };
    // 1. Tout est localisé avant toute écriture : les positions sont celles du fichier lu.
    /** @type {Map<any, { decl: any, items: { x: any, index: number }[] }>} */
    const byDecl = new Map();
    for (const x of mine) {
      const loc = locate(x.entry);
      if (loc.error) {
        x.reason = loc.error;
        continue;
      }
      x.at = loc.at;
      const decl = loc.decl;
      const cd = composantDe(decl, x.entry.property);
      if ('reason' in cd) {
        x.reason = cd.reason;
        continue;
      }
      const index = cd.index;
      const g = byDecl.get(decl) ?? { decl, items: [] };
      g.items.push({ x, index });
      byDecl.set(decl, g);
    }
    // 2. Par déclaration et par composant : garde, puis remplacement.
    for (const { decl, items } of byDecl.values()) {
      const prop = decl.prop.toLowerCase();
      const c = items.some((i) => i.index >= 0) ? components(decl.value) : null;
      const cov = c ? coverage(prop, c.parts) : null;
      /** @type {Map<number, { x: any, index: number }[]>} */
      const byIndex = new Map();
      for (const it of items) byIndex.set(it.index, [...(byIndex.get(it.index) ?? []), it]);
      /** @type {{ start: number, end: number, text: string }[]} */
      const edits = [];
      for (const [index, group] of byIndex) {
        const current = index < 0 ? decl.value : /** @type {any} */ (c).parts[index].text;
        const values = new Set(group.map((it) => norm(it.x.entry.value)));
        const props = group.map((it) => it.x.entry.property);
        if (values.size > 1) {
          for (const it of group) it.x.reason = `composant partagé par ${[...new Set(props)].join(', ')}, issues différentes (${[...new Set(group.map((y) => y.x.entry.value))].join(' / ')}) : le raccourci ${prop}: ${decl.value} n'est pas coupé`;
          continue;
        }
        if (index >= 0 && cov && typeof cov !== 'string') {
          const without = [...cov].filter(([p, i]) => i === index && !props.includes(p)).map(([p]) => p);
          if (without.length) {
            for (const it of group) it.x.reason = `composant partagé avec ${without.join(', ')}, sans entrée : le raccourci ${prop}: ${decl.value} n'est pas coupé`;
            continue;
          }
        }
        const e = group[0].x.entry;
        if (norm(current) === norm(e.value)) {
          for (const it of group) it.x.status = 'déjà appliquée';
          continue;
        }
        if (norm(current) !== norm(e.written)) {
          for (const it of group) it.x.reason = `valeur écrite attendue ${e.written}, trouvée ${current}`;
          continue;
        }
        for (const it of group) it.x.status = 'appliquée';
        if (index < 0) edits.push({ start: 0, end: decl.value.length, text: e.value });
        else {
          const p = /** @type {any} */ (c).parts[index];
          edits.push({ start: p.start, end: p.end, text: e.value });
        }
      }
      if (edits.length) {
        let v = decl.value;
        for (const ed of edits.sort((a, b) => b.start - a.start)) v = v.slice(0, ed.start) + ed.text + v.slice(ed.end);
        decl.value = v;
      }
    }
    // 3. Commentaires au-dessus de leur déclaration, une fois.
    for (const x of notes) {
      const loc = locate(x.comment);
      if (loc.error) {
        x.reason = loc.error;
        continue;
      }
      x.at = loc.at;
      const decl = loc.decl;
      /** @type {string[]} */
      const above = [];
      for (let n = decl.prev(); n && n.type === 'comment'; n = n.prev()) above.push(n.text);
      if (above.includes(x.comment.text)) {
        x.status = 'déjà posé';
        continue;
      }
      decl.before(postcss.comment({ text: x.comment.text, raws: { before: decl.raws.before, left: ' ', right: ' ' } }));
      x.status = 'posé';
    }
    const out = css.toString();
    if (out !== text) {
      if (!dryRun) await writeFile(file, out);
      written.push(sheet.replace(/^\//, ''));
    }
  }
  // tokens.css : écrit tel que reduce l'a préparé.
  if (mods.tokensCss) {
    const file = join(root, mods.tokensCss.path);
    let prev = null;
    try {
      prev = await readFile(file, 'utf8');
    } catch {}
    if (prev !== mods.tokensCss.content) {
      if (!dryRun) {
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, mods.tokensCss.content);
      }
      written.push(mods.tokensCss.path.replace(/^\//, ''));
    }
  }
  const reste = renderReste(mods, results, comments);
  const resteFile = restePath ?? join(root, 'reste.md');
  if (!dryRun) {
    await writeFile(resteFile, reste);
    const rel = relative(root, resteFile);
    written.push(rel && !rel.startsWith('..') && !isAbsolute(rel) ? rel : resteFile);
  }
  return { results, comments, written, reste, resteFile };
}

/** @param {string} s */
const dash = (s) => (s.startsWith('- ') ? s : `- ${s}`);

/**
 * S4 : reste.md, la consigne réduite à ce que le script n'a pas fait.
 * @param {any} mods @param {any[]} results @param {any[]} comments
 */
function renderReste(mods, results, comments) {
  const b = mods.brief ?? {};
  const n = (/** @type {string} */ s) => results.filter((x) => x.status === s).length;
  const posed = comments.filter((x) => x.status === 'posé').length;
  const already = comments.filter((x) => x.status === 'déjà posé').length;
  const gaps = results.filter((x) => x.status === 'écart');
  const badNotes = comments.filter((x) => x.status === 'écart');
  const tokens = mods.tokensCss?.path ?? 'tokens.css';
  const L = [];
  L.push('CONTEXTE');
  L.push(
    `Le script a appliqué ${n('appliquée')} entrées sur ${results.length} (npm run apply ; ${n('déjà appliquée')} déjà appliquées, ${gaps.length} écarts), posé ${posed} commentaires (${already} déjà posés) et écrit ${tokens}. Il n'a pas touché au HTML.`,
  );
  L.push("Ce qui suit est ce qu'il reste à faire à la main. Ne reviens pas sur ce que le script a écrit : valeurs en var(--…, …) et commentaires /* ds-lab : … */.");
  L.push("Écris chaque jeton sous la forme var(--chemin-du-jeton, ancienne valeur) : points du chemin remplacés par des tirets ; en repli, l'ancienne valeur telle que la source l'écrit.");
  L.push('');
  const items = [];
  items.push(
    `Charge ${tokens} (écrit par le script) avant toutes les autres feuilles, dans toute page qui charge une feuille modifiée (${(b.sheets ?? []).join(', ') || '—'}) : ${(b.pages ?? []).join(', ') || '—'}, et toute autre page qui charge ces feuilles.`,
  );
  items.push(...(b.changeAussi ?? []));
  items.push(...(b.reste ?? []));
  for (const x of gaps) {
    const e = x.entry;
    items.push(`Écart : ${x.at ?? `${e.sheet}:${e.line}`} ${e.selector} { ${e.property} } (${e.rows.join(', ')}) : ${x.reason}. Si c'est bien cette déclaration, écris ${e.value} pour ${e.property} à la main ; sinon, laisse-la et signale-le.`);
  }
  for (const x of badNotes) {
    const c = x.comment;
    items.push(`Écart : ${c.sheet}:${c.line} ${c.selector} { ${c.property} } (${c.rows.join(', ')}) : ${x.reason}. Pose à la main /* ${c.text} */ au-dessus de la déclaration.`);
  }
  L.push(`RESTE (${items.length})`);
  items.forEach((t, i) => L.push(`${i + 1}. ${t}`));
  L.push('');
  L.push('NE TOUCHE PAS');
  for (const t of b.neTouchePas ?? []) L.push(dash(t));
  L.push('');
  L.push('SIGNALE SANS MODIFIER');
  for (const t of b.signale ?? []) L.push(dash(t));
  L.push('');
  L.push('VÉRIFICATION');
  for (const t of b.verification ?? []) L.push(t);
  return L.join('\n') + '\n';
}
