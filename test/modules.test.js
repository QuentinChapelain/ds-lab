// @ts-check
/**
 * Modules de l'atelier (atelier/modules/) : des assemblages de composants du design system pour un usage du produit,
 * sans pièce de Vuetify ni valeur visuelle propre. Attendu écrit à la main avant le code, le 20/11/2026
 * (docs/attendus/carte-membre-liste.md) :
 *   L1 aucun fichier de atelier/modules/ n'importe de vuetify, ni n'écrit une balise ou une classe v-… : un module
 *      n'emploie que des composants Ds… ;
 *   L2 le style d'un module ne porte que la mise en page : chaque valeur est une variable du thème (var(--v-ds-…)), un
 *      mot-clé, 0 ou 100 % ; ni couleur, ni police, ni dimension écrite ;
 *   L3 chaque .vue de atelier/modules/ passe par la fabrique et son menu ; les refus de MemberCard, mot pour mot : nom
 *      absent, vide ou fait d'espaces, nom sans lettre, lien absent, DsTag refusé avec son rang (ton inconnu, texte
 *      absent, élément qui n'est pas un objet, tags qui n'est pas une liste), aria-label et aria-labelledby, attribut
 *      on…, slot ; un membre complet, sans promo, sans photo et sans DsTag passe ;
 *   L4 les refus de MemberList, mot pour mot : members absent ou qui n'est pas une liste, un membre refusé par le menu de
 *      MemberCard avec son rang (nom absent, DsTag refusé, aria-label), un membre qui porte son headingLevel (la liste le
 *      donne), headingLevel hors de 2, 3 et 4, aria-label, attribut on…, slot ; une liste vide, une liste nommée par
 *      aria-labelledby, des membres avec id et data-* passent.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifierUsage } from '../atelier/composants/fabrique.js';
import MEMBRE from '../atelier/modules/MemberCard.menu.js';
import LISTE from '../atelier/modules/MemberList.menu.js';
import { partiesVue } from './helpers/atelier.js';
import { lex } from './helpers/commentaires.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MODULES = join(ROOT, 'atelier', 'modules');
const fichiers = readdirSync(MODULES).sort();

test('L1 aucun module n\'emploie une pièce de Vuetify', () => {
  assert.ok(fichiers.includes('MemberCard.vue') && fichiers.includes('MemberList.vue'), 'MemberCard.vue et MemberList.vue présents');
  for (const f of fichiers) {
    const src = readFileSync(join(MODULES, f), 'utf8');
    const code = f.endsWith('.vue') ? `${lex(partiesVue(src).script).code}\n${partiesVue(src).reste}` : lex(src).code;
    assert.doesNotMatch(code, /from ['"]vuetify/, `${f} importe de vuetify`);
    assert.doesNotMatch(code, /\bV[A-Z][A-Za-z]+\b/, `${f} nomme une pièce de Vuetify`);
    assert.doesNotMatch(code, /(^|[^\w-])v-[a-z]/m, `${f} écrit une balise ou une classe de Vuetify`);
  }
});

/** Déclarations du style d'un .vue, commentaires ôtés : [propriété, valeur]. @param {string} src */
const declarations = (src) =>
  [...partiesVue(src).reste.replace(/<script\b[^>]*>[^]*?<\/script>/g, '').matchAll(/<style\b[^>]*>([^]*?)<\/style>/g)].flatMap((m) =>
    [...m[1].matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)].map((d) => [d[1], d[2].trim()]),
  );

test('L2 le style d\'un module ne porte que la mise en page, par les variables du thème', () => {
  const vues = fichiers.filter((f) => f.endsWith('.vue'));
  assert.ok(vues.length > 0);
  for (const f of vues) {
    const decl = declarations(readFileSync(join(MODULES, f), 'utf8'));
    assert.ok(decl.length > 0, `${f} : style lu`);
    for (const [prop, valeur] of decl) {
      const reste = valeur.replace(/var\(--v-ds-[a-z0-9-]+\)/g, '').replace(/\b(?:0|100%)(?![\w.%])/g, '').replace(/\b[a-z]+(?:-[a-z]+)*\b/g, '').trim();
      assert.equal(reste, '', `${f} : ${prop}: ${valeur}`);
      assert.doesNotMatch(prop, /^(color|background|font|border|box-shadow|letter-spacing|line-height)/, `${f} : ${prop}, propriété visuelle`);
    }
  }
  // Le contrôle refuse bien une valeur écrite, une couleur et une variable de Vuetify.
  for (const faux of ['gap: 8px;', 'color: #333;', 'gap: var(--v-theme-surface);', 'margin: 0.5rem;'])
    assert.throws(() => {
      for (const [, valeur] of declarations(`<style>\n.x { ${faux} }\n</style>`)) {
        const reste = valeur.replace(/var\(--v-ds-[a-z0-9-]+\)/g, '').replace(/\b(?:0|100%)(?![\w.%])/g, '').replace(/\b[a-z]+(?:-[a-z]+)*\b/g, '').trim();
        assert.equal(reste, '');
      }
    }, faux);
});

test('L3 chaque module passe par la fabrique et son menu', () => {
  const vues = fichiers.filter((f) => f.endsWith('.vue'));
  for (const v of vues) {
    const script = lex(partiesVue(readFileSync(join(MODULES, v), 'utf8')).script).code;
    assert.match(script, /from '\.\.\/composants\/fabrique\.js';/, `${v} importe la fabrique`);
    assert.match(script, /export default definirEnveloppe\(/, `${v} est rendu par definirEnveloppe`);
    assert.match(script, new RegExp(`from '\\./${v.replace('.vue', '.menu.js')}';`), `${v} importe son menu`);
    assert.doesNotMatch(script, /\b(props|inheritAttrs|emits)\s*:/, `${v} ne déclare ni props, ni inheritAttrs, ni emits`);
  }
  assert.deepEqual(fichiers.filter((f) => f.endsWith('.menu.js')), vues.map((v) => v.replace('.vue', '.menu.js')));
});

test('L3 refus de MemberCard, mot pour mot', () => {
  /** @param {Record<string, any>} props @param {Record<string, unknown>} [attrs] @param {Record<string, any>} [slots] */
  const leve = (props, attrs = {}, slots = {}) => {
    try {
      verifierUsage(MEMBRE, { headingLevel: 3, ...props }, attrs, slots, { rendu: true });
      return null;
    } catch (e) {
      return /** @type {Error} */ (e).message;
    }
  };
  const m = { name: 'Camille Ferrand', href: '#membre-camille-ferrand', image: 'portrait.svg', cohort: 'Promo 2015', tags: [{ text: 'Lyon', tone: 'neutral' }, { text: 'Mentor', tone: 'brand' }] };
  assert.equal(leve(m), null);
  assert.equal(leve({ name: 'Noé', href: '#membre-noe' }), null, 'sans promo, sans photo, sans DsTag');
  assert.equal(leve({ ...m, tags: [] }), null, 'suite vide');
  assert.equal(leve({ ...m, tags: [{ text: 'Lyon' }] }), null, 'ton neutre par défaut');
  assert.equal(leve({ ...m, name: undefined }), 'MemberCard : name : obligatoire');
  assert.equal(leve({ ...m, name: '' }), 'MemberCard : name : obligatoire');
  assert.equal(leve({ ...m, name: '   ' }), 'MemberCard : name : obligatoire');
  assert.equal(leve({ ...m, name: '123' }), 'MemberCard : name : sans lettre');
  assert.equal(leve({ ...m, href: undefined }), 'MemberCard : href : obligatoire');
  assert.equal(leve({ ...m, headingLevel: 5 }), 'MemberCard : headingLevel : valeur inconnue : 5 (2, 3, 4)');
  assert.equal(leve({ ...m, tags: [{ text: 'Lyon' }, { text: 'Mentor', tone: 'accent' }] }), 'MemberCard : tags : 2 : tone : valeur inconnue : accent (neutral, brand)');
  assert.equal(leve({ ...m, tags: [{ tone: 'brand' }] }), 'MemberCard : tags : 1 : text : obligatoire');
  assert.equal(leve({ ...m, tags: ['Lyon'] }), 'MemberCard : tags : 1 : text : obligatoire');
  assert.equal(leve({ ...m, tags: 'Lyon' }), 'MemberCard : tags : liste attendue');
  assert.equal(leve(m, { 'aria-label': 'Profil' }), 'MemberCard : attribut refusé : aria-label');
  assert.equal(leve(m, { 'aria-labelledby': 'x' }), 'MemberCard : attribut refusé : aria-labelledby');
  assert.equal(leve(m, { onClick: () => {} }), 'MemberCard : attribut refusé : onClick');
  assert.equal(leve(m, { id: 'membre', 'data-cas': 'x', 'aria-describedby': 'aide' }), null, 'id, data-* et aria-describedby passent');
  assert.equal(leve(m, {}, { default: () => 'Texte' }), 'MemberCard : slot refusé : default');
  assert.equal(MEMBRE.ecouteurs, false);
});

test('L4 refus de MemberList, mot pour mot', () => {
  /** @param {Record<string, any>} props @param {Record<string, unknown>} [attrs] @param {Record<string, any>} [slots] */
  const leve = (props, attrs = {}, slots = {}) => {
    try {
      verifierUsage(LISTE, { headingLevel: 3, ...props }, attrs, slots, { rendu: true });
      return null;
    } catch (e) {
      return /** @type {Error} */ (e).message;
    }
  };
  const a = { name: 'Camille Ferrand', href: '#membre-camille-ferrand', cohort: 'Promo 2015', tags: [{ text: 'Lyon' }] };
  const b = { name: 'Noé', href: '#membre-noe' };
  const c = { name: "Inès d'Aubrac", href: '#membre-ines-d-aubrac', tags: [{ text: 'Mentor', tone: 'brand' }] };
  assert.equal(leve({ members: [a, b, c] }), null);
  assert.equal(leve({ members: [] }), null, 'liste vide : rien de rendu, aucun refus');
  assert.equal(leve({ members: [a, b], headingLevel: 2 }), null);
  assert.equal(leve({ members: [a, b] }, { 'aria-labelledby': 'titre-annuaire', id: 'annuaire', 'data-cas': 'liste' }), null, 'aria-labelledby, id et data-* passent');
  assert.equal(leve({ members: [{ ...a, id: 'camille', 'data-cas': 'photo' }] }), null, 'un membre avec id et data-*');
  assert.equal(leve({}), 'MemberList : members : obligatoire');
  assert.equal(leve({ members: 'Camille' }), 'MemberList : members : liste attendue');
  assert.equal(leve({ members: [a, b, { ...c, name: undefined }] }), 'MemberList : members : 3 : name : obligatoire');
  assert.equal(leve({ members: [a, { ...b, tags: [{ text: 'Lyon', tone: 'accent' }] }] }), 'MemberList : members : 2 : tags : 1 : tone : valeur inconnue : accent (neutral, brand)');
  assert.equal(leve({ members: [a, { ...b, 'aria-label': 'Profil' }] }), 'MemberList : members : 2 : attribut refusé : aria-label');
  assert.equal(leve({ members: ['Noé'] }), 'MemberList : members : 1 : name : obligatoire');
  assert.equal(leve({ members: [a, { ...b, headingLevel: 2 }] }), 'MemberList : members : 2 : headingLevel : donné par la liste');
  assert.equal(leve({ members: [a], headingLevel: 5 }), 'MemberList : headingLevel : valeur inconnue : 5 (2, 3, 4)');
  assert.equal(leve({ members: [a] }, { 'aria-label': 'Annuaire' }), 'MemberList : attribut refusé : aria-label');
  assert.equal(leve({ members: [a] }, { onClick: () => {} }), 'MemberList : attribut refusé : onClick');
  assert.equal(leve({ members: [a] }, {}, { default: () => 'Texte' }), 'MemberList : slot refusé : default');
  assert.equal(LISTE.ecouteurs, false);
});
