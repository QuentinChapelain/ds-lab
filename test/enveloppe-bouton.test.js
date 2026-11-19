// @ts-check
/**
 * Garde de l'enveloppe du bouton (D43, docs/attendus/bouton.md) : le bouton de Vuetify ne paraît que dans
 * atelier/composants/Bouton.vue.
 *
 * Attendus écrits à la main avant le code (18/11/2026) :
 *   E1 la détection prend VBtn (et ses composés VBtnGroup, VBtnToggle, un import vuetify/components/VBtn) et v-btn
 *      (balise, classe, sélecteur) ; elle ne prend ni un commentaire, ni ds-bouton, ni un mot qui contient v-btn sans
 *      le commencer (nav-btn) ;
 *   E2 dans le code de src/ et de l'atelier (.js et .vue, commentaires exclus), une seule occurrence de fichier :
 *      atelier/composants/Bouton.vue, qui importe bien VBtn ; le témoin (atelier/stories/Temoin.stories.js) n'existe
 *      plus ;
 *   E3 un composant .vue est découpé à lignes égales : script lu comme du JavaScript, gabarit et style à part, leurs
 *      commentaires HTML et CSS rendus à part ; une apostrophe du gabarit ne perd pas la lecture du script.
 *
 * Ajouts pour le champ de texte (19/11/2026, D49, docs/attendus/champ-carte.md) :
 *   E4 la détection du champ prend VTextField et ses pièces VField et VInput (et leurs composés, VFieldLabel…), un
 *      import vuetify/components/VTextField, et v-text-field, v-field, v-input (balise, classe, sélecteur) ; elle ne
 *      prend ni un commentaire, ni ds-champ, ni -webkit-input-placeholder, ni nav-field, ni VFieldset ;
 *   E5 dans le code de src/ et de l'atelier, une seule occurrence de fichier : atelier/composants/ChampTexte.vue, qui
 *      importe bien VTextField.
 *
 * Ajouts pour la carte (19/11/2026, D50, docs/attendus/champ-carte.md) :
 *   E6 la détection de la carte prend VCard et ses composés (VCardText, VCardActions…), un import
 *      vuetify/components/VCard, et v-card et ses classes (v-card-text, v-card__overlay…) ; elle ne prend ni un
 *      commentaire, ni ds-carte, ni nav-card, ni VCardinal ;
 *   E7 dans le code de src/ et de l'atelier, une seule occurrence de fichier : atelier/composants/Carte.vue, qui importe
 *      bien VCard.
 *
 * Ajout pour le bouton à icône seule (19/11/2026, D52, docs/attendus/bouton-icone.md) :
 *   E8 atelier/composants/BoutonIcone.vue rend l'enveloppe du bouton (import de ./Bouton.vue) et n'importe rien de
 *      Vuetify ; E2 reste vrai mot pour mot.
 *
 * Ajouts pour l'avatar (19/11/2026, D54, docs/attendus/avatar-etiquette.md) :
 *   E9 la détection de l'avatar prend VAvatar, un import vuetify/components/VAvatar, et v-avatar et ses classes
 *      (balise, classe, sélecteur, v-avatar__underlay) ; elle ne prend ni un commentaire, ni ds-avatar, ni nav-avatar ;
 *   E10 dans le code de src/ et de l'atelier, une seule occurrence de fichier : atelier/composants/Avatar.vue, qui
 *      importe bien VAvatar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeAtelier, partiesVue } from './helpers/atelier.js';
import { lex } from './helpers/commentaires.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ENVELOPPE = join('atelier', 'composants', 'Bouton.vue');

/** Bouton de Vuetify : le composant (et ses composés), la balise ou la classe. */
const VUETIFY_BOUTON = /\bVBtn|(?<![\w-])v-btn/;

/** Champ de Vuetify : le composant et ses pièces (et leurs composés), la balise ou la classe. */
const VUETIFY_CHAMP = /\bV(?:TextField|Field|Input)(?![a-z])|(?<![\w-])v-(?:text-field|field|input)(?![a-z])/;
const ENVELOPPE_CHAMP = join('atelier', 'composants', 'ChampTexte.vue');
/** Carte de Vuetify : le composant et ses composés, la balise ou la classe. */
const VUETIFY_CARTE = /\bVCard(?![a-z])|(?<![\w-])v-card(?![a-z])/;
const ENVELOPPE_CARTE = join('atelier', 'composants', 'Carte.vue');
/** Avatar de Vuetify : le composant, la balise ou la classe. */
const VUETIFY_AVATAR = /\bVAvatar(?![a-z])|(?<![\w-])v-avatar(?![a-z])/;
const ENVELOPPE_AVATAR = join('atelier', 'composants', 'Avatar.vue');

/** Code sans commentaires d'un fichier, .js ou .vue, relatif à la racine. @param {string} f */
function code(f) {
  const src = readFileSync(join(ROOT, f), 'utf8');
  if (!f.endsWith('.vue')) return lex(src).code;
  const v = partiesVue(src);
  return `${lex(v.script).code}\n${v.reste}`;
}

test('E1 détection du bouton de Vuetify', () => {
  for (const s of ["import { VBtn } from 'vuetify/components';", "import { VBtnToggle } from 'vuetify/components';", "import x from 'vuetify/components/VBtn';", '<v-btn>Ok</v-btn>', "document.querySelector('.v-btn__prepend')", 'h(VBtn)'])
    assert.ok(VUETIFY_BOUTON.test(s), s);
  for (const s of ['// v-btn dans un commentaire', 'h(Bouton)', "'.ds-bouton'", "'nav-btn'"])
    assert.ok(!VUETIFY_BOUTON.test(lex(s).code), s);
});

test('E2 le bouton de Vuetify ne paraît que dans l\'enveloppe', () => {
  const src = readdirSync(join(ROOT, 'src'), { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.js')).map((f) => join('src', f));
  const fichiers = [...src, ...codeAtelier()];
  assert.ok(fichiers.includes(ENVELOPPE), 'l\'enveloppe est lue');
  assert.deepEqual(fichiers.filter((f) => VUETIFY_BOUTON.test(code(f))), [ENVELOPPE]);
  assert.match(code(ENVELOPPE), /import \{ VBtn \} from 'vuetify\/components';/);
  assert.equal(existsSync(join(ROOT, 'atelier', 'stories', 'Temoin.stories.js')), false, 'témoin retiré');
});

test('E3 découpage d\'un composant .vue, lignes gardées', () => {
  const src = [
    '<template>',
    "  <p>L'apostrophe</p> <!-- note -->",
    '</template>',
    '<script>',
    "const a = 'x'; // fin",
    '</script>',
    '<style>',
    '.a { color: red; } /* trait */',
    '</style>',
  ].join('\n');
  const v = partiesVue(src);
  assert.equal(v.script.split('\n').length, 9);
  assert.equal(v.reste.split('\n').length, 9);
  assert.equal(v.script.split('\n')[4], "const a = 'x'; // fin");
  assert.equal(v.script.split('\n')[1], '');
  assert.deepEqual(lex(v.script).comments.map((c) => [c.line, c.text.trim()]), [[5, '// fin']]);
  assert.ok(v.reste.includes("<p>L'apostrophe</p>") && !v.reste.includes('const a') && !v.reste.includes('note') && !v.reste.includes('trait'));
  assert.deepEqual(v.commentaires.map((c) => [c.line, c.text]), [[2, '<!-- note -->'], [8, '/* trait */']]);
});

/** Fichiers de code lus par les gardes : src/ (.js) et l'atelier (.js et .vue). */
const fichiersDeCode = () => [...readdirSync(join(ROOT, 'src'), { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.js')).map((f) => join('src', f)), ...codeAtelier()];

test('E4 détection du champ de Vuetify', () => {
  for (const s of ["import { VTextField } from 'vuetify/components';", "import { VField, VFieldLabel } from 'vuetify/components';", "import x from 'vuetify/components/VTextField';", 'h(VInput)', '<v-text-field label="x" />', "document.querySelector('.v-field__outline')", "'.v-input--disabled'"])
    assert.ok(VUETIFY_CHAMP.test(s), s);
  for (const s of ['// v-field dans un commentaire', "'.ds-champ__champ > * > *'", "'-webkit-input-placeholder'", "'nav-field'", 'h(VFieldset)', 'h(ChampTexte)'])
    assert.ok(!VUETIFY_CHAMP.test(lex(s).code), s);
});

test('E5 le champ de Vuetify ne paraît que dans son enveloppe', () => {
  const fichiers = fichiersDeCode();
  assert.ok(fichiers.includes(ENVELOPPE_CHAMP), 'l\'enveloppe est lue');
  assert.deepEqual(fichiers.filter((f) => VUETIFY_CHAMP.test(code(f))), [ENVELOPPE_CHAMP]);
  assert.match(code(ENVELOPPE_CHAMP), /import \{ VTextField \} from 'vuetify\/components';/);
});

test('E6 détection de la carte de Vuetify', () => {
  for (const s of ["import { VCard } from 'vuetify/components';", "import { VCardText, VCardActions } from 'vuetify/components';", "import x from 'vuetify/components/VCard';", '<v-card>x</v-card>', '<v-card-text>x</v-card-text>', "'.v-card__overlay'"])
    assert.ok(VUETIFY_CARTE.test(s), s);
  for (const s of ['// v-card dans un commentaire', "'.ds-carte__lien'", "'nav-card'", 'h(VCardinal)', 'h(Carte)'])
    assert.ok(!VUETIFY_CARTE.test(lex(s).code), s);
});

test('E7 la carte de Vuetify ne paraît que dans son enveloppe', () => {
  const fichiers = fichiersDeCode();
  assert.ok(fichiers.includes(ENVELOPPE_CARTE), 'l\'enveloppe est lue');
  assert.deepEqual(fichiers.filter((f) => VUETIFY_CARTE.test(code(f))), [ENVELOPPE_CARTE]);
  assert.match(code(ENVELOPPE_CARTE), /import \{ VCard \} from 'vuetify\/components';/);
});

test('E8 le bouton à icône passe par l\'enveloppe du bouton', () => {
  const f = join('atelier', 'composants', 'BoutonIcone.vue');
  assert.ok(fichiersDeCode().includes(f), 'le bouton à icône est lu');
  assert.match(code(f), /import Bouton from '\.\/Bouton\.vue';/);
  assert.doesNotMatch(code(f), /from 'vuetify/);
});

test('E9 détection de l\'avatar de Vuetify', () => {
  for (const s of ["import { VAvatar } from 'vuetify/components';", "import x from 'vuetify/components/VAvatar';", '<v-avatar>CF</v-avatar>', "'.v-avatar__underlay'", 'h(VAvatar)'])
    assert.ok(VUETIFY_AVATAR.test(s), s);
  for (const s of ['// v-avatar dans un commentaire', "'.ds-avatar__initiales'", "'nav-avatar'", 'h(Avatar)'])
    assert.ok(!VUETIFY_AVATAR.test(lex(s).code), s);
});

test('E10 l\'avatar de Vuetify ne paraît que dans son enveloppe', () => {
  const fichiers = fichiersDeCode();
  assert.ok(fichiers.includes(ENVELOPPE_AVATAR), 'l\'enveloppe est lue');
  assert.deepEqual(fichiers.filter((f) => VUETIFY_AVATAR.test(code(f))), [ENVELOPPE_AVATAR]);
  assert.match(code(ENVELOPPE_AVATAR), /import \{ VAvatar \} from 'vuetify\/components';/);
});
