// @ts-check
/**
 * Étape 4c, lot 1 : conteneur WOFF2 (W3C, WOFF File Format 2.0), lecteur maison sans dépendance.
 * Rend les tables non transformées (head, hhea, OS/2, name, cmap, fvar…) ; glyf, loca et hmtx, transformées, ne sont pas
 * reconstruites : la saisie n'en a pas besoin (l'encre des lettres est mesurée dans le navigateur, src/polices/encre.js).
 * Décompression Brotli de Node (node:zlib).
 */
import { brotliDecompressSync } from 'node:zlib';

/** Signatures des quatre premiers octets. */
const SIGNATURES = /** @type {const} */ ({ wOF2: 'WOFF2', wOFF: 'WOFF', OTTO: 'OpenType', true: 'TrueType', ttcf: 'collection' });

/** Format d'un fichier de police, lu sur ses quatre premiers octets. @param {Buffer} buf @returns {string} */
export function formatPolice(buf) {
  if (buf.length < 4) return 'inconnu';
  if (buf.readUInt32BE(0) === 0x00010000) return 'TrueType';
  const tag = buf.toString('latin1', 0, 4);
  return SIGNATURES[/** @type {keyof typeof SIGNATURES} */ (tag)] ?? 'inconnu';
}

/** Les 63 étiquettes connues de WOFF2, dans l'ordre de la spécification (indice = 6 bits bas du drapeau). */
const ETIQUETTES = (
  'cmap head hhea hmtx maxp name OS/2 post cvt_ fpgm glyf loca prep CFF_ VORG EBDT EBLC gasp hdmx kern LTSH PCLT VDMX vhea vmtx ' +
  'BASE GDEF GPOS GSUB EBSC JSTF MATH CBDT CBLC COLR CPAL SVG_ sbix acnt avar bdat bloc bsln cvar fdsc feat fmtx fvar gvar hsty ' +
  'just lcar mort morx opbd prop trak Zapf Silf Glat Gloc Feat Sill'
)
  .split(' ')
  .map((t) => t.replace('_', ' '));

/**
 * Tables d'un WOFF2, décompressées. Les tables transformées sont rendues telles quelles, marquées `transformee`.
 * @param {Buffer} buf
 * @returns {Map<string, { donnees: Buffer, transformee: boolean }>}
 */
export function tablesWoff2(buf) {
  if (formatPolice(buf) !== 'WOFF2') throw new Error('WOFF2 attendu');
  const flavor = buf.toString('latin1', 4, 8);
  if (flavor === 'ttcf') throw new Error('collection WOFF2 non lue');
  const numTables = buf.readUInt16BE(12);
  const totalCompressedSize = buf.readUInt32BE(20);
  let o = 48;
  /** UIntBase128 : 1 à 5 octets, 7 bits par octet, bit haut = suite. */
  const base128 = () => {
    let v = 0;
    for (let i = 0; i < 5; i++) {
      const b = buf[o++];
      if (i === 0 && b === 0x80) throw new Error('UIntBase128 invalide');
      v = v * 128 + (b & 0x7f);
      if (!(b & 0x80)) return v;
    }
    throw new Error('UIntBase128 trop long');
  };
  /** @type {{ tag: string, longueur: number, transformee: boolean }[]} */
  const dir = [];
  for (let i = 0; i < numTables; i++) {
    const flags = buf[o++];
    const idx = flags & 0x3f;
    let tag;
    if (idx === 63) {
      tag = buf.toString('latin1', o, o + 4);
      o += 4;
    } else tag = ETIQUETTES[idx];
    const version = flags >> 6;
    const origLength = base128();
    const glyfLoca = tag === 'glyf' || tag === 'loca';
    const transformee = glyfLoca ? version !== 3 : version !== 0;
    const longueur = transformee ? base128() : origLength;
    dir.push({ tag, longueur, transformee });
  }
  const flux = brotliDecompressSync(buf.subarray(o, o + totalCompressedSize));
  const tables = new Map();
  let p = 0;
  for (const t of dir) {
    tables.set(t.tag, { donnees: flux.subarray(p, p + t.longueur), transformee: t.transformee });
    p += t.longueur;
  }
  return tables;
}
