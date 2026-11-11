// @ts-check
/**
 * Lecture des adresses passées à `npm run audit -- <adresses>`.
 * La première doit être une URL complète (http ou https) ; les suivantes
 * peuvent être complètes ou relatives à la première (`/fr/agenda`, `agenda`, `?p=2`).
 */

/**
 * @param {string[]} inputs
 * @returns {string[]} URL complètes, dédoublonnées, dans l'ordre d'arrivée.
 */
export function resolveAddresses(inputs) {
  const list = inputs.map((s) => String(s).trim()).filter(Boolean);
  if (!list.length) throw new Error('adresses : au moins une adresse est attendue');
  const base = parseAbsolute(list[0]);
  if (!base) throw new Error(`adresses : la première adresse doit être une URL complète http(s) (reçu « ${list[0]} »)`);
  /** @type {string[]} */
  const out = [];
  for (const s of list) {
    let u;
    try {
      u = new URL(s, base);
    } catch {
      throw new Error(`adresses : adresse illisible « ${s} »`);
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new Error(`adresses : protocole non pris en charge « ${u.protocol} » dans « ${s} »`);
    }
    u.hash = '';
    const href = u.href;
    if (!out.includes(href)) out.push(href);
  }
  return out;
}

/**
 * Regroupe des URL par hôte (`host`, port compris), dans l'ordre d'arrivée.
 * @param {string[]} urls
 * @returns {Map<string, string[]>}
 */
export function groupByHost(urls) {
  /** @type {Map<string, string[]>} */
  const groups = new Map();
  for (const href of urls) {
    const host = new URL(href).host;
    const g = groups.get(host);
    if (g) g.push(href);
    else groups.set(host, [href]);
  }
  return groups;
}

/**
 * Nom de dossier sûr pour un hôte : `127.0.0.1:4173` → `127.0.0.1_4173`.
 * @param {string} host
 */
export function hostDirName(host) {
  return host.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
}

/**
 * @param {string} s
 * @returns {URL | null}
 */
function parseAbsolute(s) {
  if (!/^https?:\/\//i.test(s)) return null;
  try {
    return new URL(s);
  } catch {
    return null;
  }
}
