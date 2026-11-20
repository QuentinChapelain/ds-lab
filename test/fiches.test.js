// @ts-check
/**
 * Fiches des composants (D56, D57, docs/attendus/fiches.md) : en-tête et blocs générés depuis les props, le composant,
 * sa story, la table des noms et les tokens ; parties écrites contrôlées ; exemple lu par une grammaire fermée et vérifié
 * contre les props ; index et glossaire ; règles NM1 à NM3 et DOC1 à DOC5 (docs/regles.md).
 *
 * Attendus écrits à la main avant le code (19/11/2026), recopiés de l'attendu, à la forme de la suite (vocabulaire du
 * métier, noms anglais) :
 *   U1 en-tête du DsTag à l'octet ; celui du bouton à icône nomme la pièce du bouton (« VBtn (par DsButton) ») et ses
 *      décisions (D52, D51) ;
 *   U2 bloc props du DsTag à l'octet ; headingLevel et slots de la carte, prependIcon et événement du bouton ;
 *   U3 bloc refus du DsTag à l'octet ; pour les six composants, la liste des attributs admis confrontée à verifierUsage
 *      (id, aria-describedby ou un autre aria-* s'il est retiré, data-x passent ; chaque retiré lève ; onClick passe si
 *      et seulement si les attributs on… sont admis ; class lève) ; pour chacune des sept règles, le message tiré du texte
 *      de la fonction est celui que lève verifierUsage sur un cas qui la déclenche ; une règle sans message lisible est
 *      une panne ;
 *   U4 une variable du thème inconnue de la table, ou une variable ds- écrite et inconnue, est une panne ;
 *   U5 bloc contrastes du DsTag à l'octet (11,65 et 11,68 : culori 4.0.2, wcagContrast, sur les couleurs de
 *      tokens/<marque>/vuetify.json, commande dans l'attendu) ; la paire du texte désactivé du bouton porte « exception
 *      écrite » ; une couleur dont la paire manque à paires.json est une panne ;
 *   U6 une marque absente, en double ou ouverte sans fin est une panne nommée ; régénérer garde les parties écrites à
 *      l'octet, et une seconde passe ne change rien ;
 *   U7 chaque écart des parties écrites donne sa ligne, mot pour mot ;
 *   U8 exemples acceptés (l'étiquette en liste, un bouton à icône et son événement, une carte et son slot actions, un
 *      champ et v-model) et refusés avec le message des props ; syntaxes hors grammaire en panne ;
 *   U9 bloc de l'index du DsTag seul à l'octet ; le glossaire, écrit sous le bloc, est gardé ;
 *   U10 le contrôle sort en 0 sur le dépôt, les six fiches présentes ; une fiche qui manque est un écart (DOC1) ;
 *   U11 bloc tokens (anatomie) du DsTag à l'octet ; le bouton à icône n'a aucune ligne « variant danger » ; un token cité
 *      sans description, ou un token posé par le parent inconnu, est une panne ; une description citée qui porte un
 *      numéro de règle ou de décision, un nom de token, une mesure, un pas d'échelle ou plus d'une phrase est à réécrire ;
 *   U12 un mot refusé hors code donne son écart, en code rien ; une fiche de 501 mots écrits dépasse le plafond ; le
 *      glossaire contient chaque mot refusé ;
 *   U13 chaque écart de la table des noms, sur une table d'essai ; la table du dépôt n'en donne aucun.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { verifierUsage } from '../atelier/composants/fabrique.js';
import { HorsGrammaire, verifierExemple } from '../atelier/fiches/exemple.js';
import {
  MOTS_REFUSES,
  anatomie,
  blocContrastes,
  blocIndex,
  blocProps,
  blocRefus,
  blocTokens,
  decouper,
  ecartsDescriptions,
  ecartsEcrits,
  ecartsGlossaire,
  ecartsNoms,
  fichesAbsentes,
  entete,
  lireComposant,
  lireDescriptions,
  lireMenus,
  lireNoms,
  lireStories,
  lireTable,
  messageDeRegle,
  mesurerThemes,
  motsEcrits,
  motifsDescription,
  motsRefuses,
  pairesDe,
  regenerer,
  regenererIndex,
} from '../atelier/fiches/fiche.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const lire = (/** @type {string} */ f) => readFileSync(join(ROOT, f), 'utf8');

const MENUS = await lireMenus();
const TABLE = lireTable();
const PAIRES = JSON.parse(lire('tokens/commun/paires.json'));
const THEMES = mesurerThemes();
const NOMS = lireNoms();
const DESCRIPTIONS = lireDescriptions();
const parNom = (/** @type {string} */ n) => /** @type {any} */ (MENUS.find((m) => m.nom === n));
const menuDe = (/** @type {string} */ f) => parNom(f).menu;
const FICHE = 'docs/composants/tag.md';

const PAR_NOM = new Map(MENUS.map((m) => [m.nom, m.menu]));

/** Tout ce que le script écrit pour un composant. @param {string} nom */
function genere(nom) {
  const e = parNom(nom);
  const c = lireComposant(nom);
  const s = lireStories(nom);
  return {
    entete: entete(e, c, s, NOMS),
    titre: `# ${nom} (${NOMS.composants[nom].fr})`,
    props: blocProps(e.menu, c, NOMS),
    refus: blocRefus(e.menu, nom),
    tokens: blocTokens(anatomie(c, e.menu, TABLE, DESCRIPTIONS, nom, PAR_NOM)),
    contrastes: blocContrastes(pairesDe(c, TABLE, PAIRES, nom), THEMES, nom),
  };
}

const ctx = () => ({ table: TABLE, stories: lireStories('DsTag'), decisions: lire('docs/decisions.md'), dette: lire('KNOWN_ISSUES.md'), descriptions: DESCRIPTIONS, menuDe });

test('U1 en-tête du DsTag, et du bouton à icône par le bouton', () => {
  assert.equal(
    genere('DsTag').entete,
    [
      '---',
      'name: DsTag',
      'title: DsTag (étiquette)',
      'file: atelier/composants/DsTag.vue',
      'props: atelier/composants/DsTag.menu.js',
      'wraps: VChip',
      'decisions: [D55, D51, D56, D57]',
      'stories: atelier/stories/DsTag.stories.js',
      'test: npm --prefix atelier run preuve -- tag',
      '---',
    ].join('\n'),
  );
  const bi = genere('DsIconButton').entete;
  assert.match(bi, /^wraps: VBtn \(par DsButton\)$/m);
  assert.match(bi, /^decisions: \[D52, D51, D56, D57\]$/m);
  assert.match(bi, /^title: DsIconButton \(bouton à icône\)$/m);
});

test('U2 bloc props du DsTag ; carte et bouton', () => {
  assert.equal(
    genere('DsTag').props,
    [
      '| Prop | Type | Obligatoire | Défaut | Valeurs admises | Nom repris de |',
      '|---|---|---|---|---|---|',
      '| `text` | texte | oui | aucun | libre | Vuetify |',
      '| `tone` | texte | non | `\'neutral\'` | `\'neutral\'`, `\'brand\'` | usage courant |',
      '',
      'Événements émis : aucun. Slots : aucun.',
    ].join('\n'),
  );
  const carte = genere('DsCard').props;
  assert.match(carte, /^\| `headingLevel` \| nombre \| non \| `3` \| `2`, `3`, `4` \| usage courant \|$/m);
  // Slot prepend de DsCard (docs/attendus/carte-membre-liste.md).
  assert.match(carte, /^Événements émis : aucun\. Slots : `default`, `actions`, `prepend`\.$/m);
  const bouton = genere('DsButton').props;
  assert.match(bouton, /^\| `prependIcon` \| objet ou fonction \| non \| `null` \| libre \| Vuetify \|$/m);
  assert.match(bouton, /^Événements émis : `click`\. Slots : `default`\.$/m);
});

/** Options valides d'une enveloppe, défauts du menu appliqués, comme Vue. @param {any} menu @param {Record<string, unknown>} props */
const avecDefauts = (menu, props) => ({ ...Object.fromEntries(Object.entries(menu.options).flatMap(([k, o]) => ('defaut' in /** @type {any} */ (o) ? [[k, /** @type {any} */ (o).defaut]] : []))), ...props });

/** Usage valide de chaque menu, écrit à la main. */
const VALIDES = /** @type {Record<string, Record<string, unknown>>} */ ({
  DsButton: {},
  DsIconButton: { label: 'Fermer', icon: () => null },
  DsTextInput: { label: 'Courriel' },
  DsCard: { title: 'Événement' },
  DsAvatar: { name: 'Camille Ferrand' },
  DsTag: { text: 'Lyon' },
});

test('U3 bloc refus du DsTag ; attributs admis confrontés à verifierUsage ; messages des règles', () => {
  assert.equal(
    genere('DsTag').refus,
    [
      'Attributs admis en plus des props : `id`, `aria-*`, `data-*`. Retirés : `aria-label`, `aria-labelledby`. Attributs `on…` d\'événement : refusés.',
      '',
      'Tout autre usage lève une erreur, et rien n\'est rendu. Messages, dans l\'ordre où ils sont vérifiés :',
      '',
      '- `DsTag : attribut refusé : <attributs>`',
      '- `DsTag : text : obligatoire`',
      '- `DsTag : tone : valeur inconnue : <valeur> (neutral, brand)`',
    ].join('\n'),
  );
  for (const { nom, menu } of MENUS) {
    const props = avecDefauts(menu, VALIDES[nom]);
    const essai = (/** @type {Record<string, unknown>} */ attrs) => () => verifierUsage(menu, props, attrs);
    // Le champ retire aria-describedby, qu'il pose lui-même : un autre aria-* passe alors.
    const aria = (menu.attributsRetires ?? []).includes('aria-describedby') ? 'aria-details' : 'aria-describedby';
    assert.doesNotThrow(essai({ id: 'a', [aria]: 'b', 'data-x': '1' }), nom);
    for (const r of menu.attributsRetires ?? []) assert.throws(essai({ [r]: 'x' }), { message: `${menu.nom} : attribut refusé : ${r}` }, nom);
    if (menu.ecouteurs === false) assert.throws(essai({ onClick: () => null }), { message: `${menu.nom} : attribut refusé : onClick` }, nom);
    else assert.doesNotThrow(essai({ onClick: () => null }), nom);
    assert.throws(essai({ class: 'x' }), { message: `${menu.nom} : attribut refusé : class` }, nom);
    const refus = genere(nom).refus;
    assert.match(refus, menu.ecouteurs === false ? /Attributs `on…` d'événement : refusés\.$/m : /Attributs `on…` d'événement : admis\.$/m, nom);
    assert.match(refus, (menu.attributsRetires ?? []).length ? new RegExp(`Retirés : ${menu.attributsRetires.map((/** @type {string} */ r) => `\`${r}\``).join(', ')}\\.`) : /Retirés : aucun\./, nom);
  }
  // Neuf règles, chacune avec un cas qui la déclenche et son message, écrits à la main ; les deux du slot prepend de
  // DsCard d'après docs/attendus/carte-membre-liste.md.
  const bouton = { type: 'submit', disabled: true };
  const CAS = [
    ['DsButton', 'regles', 0, bouton, {}, 'disabled : refusé avec type=submit'],
    ['DsIconButton', 'regles', 0, { ...VALIDES.DsIconButton, ...bouton }, {}, 'disabled : refusé avec type=submit'],
    ['DsAvatar', 'regles', 0, { name: '   ' }, {}, 'name : obligatoire'],
    ['DsAvatar', 'regles', 1, { name: '123' }, {}, 'name : sans lettre'],
    ['DsCard', 'regles', 0, { title: 'T', image: 'a.jpg' }, {}, 'imageAlt : obligatoire avec image'],
    ['DsCard', 'regles', 1, { title: 'T', href: '/x' }, { actions: () => [] }, 'href : refusé avec le slot actions'],
    ['DsCard', 'regles', 2, { title: 'T', image: 'a.jpg', imageAlt: '' }, { prepend: () => [] }, 'slot prepend : refusé avec image'],
    ['DsCard', 'reglesDuRendu', 0, { title: 'T' }, { actions: () => [{ type: 'a' }] }, 'slot actions : seuls DsButton et DsIconButton sont admis'],
    ['DsCard', 'reglesDuRendu', 1, { title: 'T' }, { prepend: () => [{ type: 'a' }] }, 'slot prepend : seul DsAvatar est admis'],
  ];
  let regles = 0;
  for (const { menu } of MENUS) regles += (menu.regles ?? []).length + (menu.reglesDuRendu ?? []).length;
  assert.equal(regles, CAS.length);
  for (const [nom, sorte, i, props, slots, message] of CAS) {
    const { menu } = parNom(/** @type {string} */ (nom));
    assert.equal(messageDeRegle(menu[sorte][i], nom), message);
    assert.throws(() => verifierUsage(menu, avecDefauts(menu, /** @type {any} */ (props)), {}, /** @type {any} */ (slots), { rendu: true }), { message: `${menu.nom} : ${message}` });
  }
  assert.match(genere('DsCard').refus, /^- `DsCard : slot actions : seuls DsButton et DsIconButton sont admis`, au rendu$/m);
  assert.equal((genere('DsAvatar').refus.match(/DsAvatar : name : obligatoire/g) ?? []).length, 1);
  assert.throws(() => messageDeRegle((/** @type {any} */ p) => (p.a ? 'x' : p.b ? 'y' : null), 'essai'), /essai : règle sans message lisible/);
  assert.throws(() => messageDeRegle(() => null, 'essai'), /essai : règle sans message lisible/);
});

test('U4 variable du thème inconnue, variable ds- écrite inconnue : pannes', () => {
  const vide = { theme: new Set(), ds: new Set(), emplacements: [] };
  assert.throws(() => pairesDe({ ...vide, ds: new Set(['ds-inconnue']) }, TABLE, PAIRES, 'essai.vue'), { message: 'essai.vue : variable inconnue de la table : --v-ds-inconnue' });
  assert.throws(() => pairesDe({ ...vide, theme: new Set(['inconnue']) }, TABLE, PAIRES, 'essai.vue'), { message: 'essai.vue : variable inconnue de la table : --v-theme-inconnue' });
  const texte = lire(FICHE).replace('(`ds-ecart-entre-etiquettes`)', '(`ds-ecart-inconnu`)');
  assert.throws(() => ecartsEcrits(texte, FICHE, parNom('DsTag'), ctx()), { message: `${FICHE} : variable inconnue de la table : ds-ecart-inconnu` });
});

test('U5 bloc contrastes du DsTag ; exception écrite ; paire absente en panne', () => {
  assert.equal(
    genere('DsTag').contrastes,
    [
      '| Devant | Fond | Plus bas des 10 thèmes | Seuil |',
      '|---|---|---|---|',
      // Fonds teintés (docs/attendus/carte-membre-liste.md) : le plus bas passe en sombre, au pas 5.
      '| `texte.marque` | `fond.marque.teinte` | 10,07:1 (Atelier Lavandine, sombre) | 4,50:1 |',
      '| `texte.principal` | `fond.teinte` | 10,06:1 (Atelier Lavandine, sombre) | 4,50:1 |',
    ].join('\n'),
  );
  assert.match(genere('DsButton').contrastes, /^\| `texte\.desactive` \| `fond\.desactive` \| [\d,]+:1 \([^)]+\) \| 4,50:1, exception écrite \|$/m);
  const c = { theme: new Set(['teinte']), ds: new Set(), emplacements: [] };
  assert.throws(() => pairesDe(c, TABLE, { paires: [] }, 'essai.vue'), { message: 'essai.vue : paire absente de tokens/commun/paires.json : texte.principal sur fond.teinte' });
});

test('U6 marques en panne ; régénérer garde les parties écrites, deux fois de suite', () => {
  const texte = lire(FICHE);
  const ouv = '<!-- genere:props : écrit par npm --prefix atelier run fiches -->';
  assert.throws(() => decouper(texte.replace(ouv, ''), 'x.md'), { message: 'x.md : marque genere:props absente' });
  assert.throws(() => decouper(`${texte}\n${ouv}\n`, 'x.md'), { message: 'x.md : marque genere:props en double' });
  assert.throws(() => decouper(texte.replace('<!-- /genere:props -->', ''), 'x.md'), { message: 'x.md : marque genere:props ouverte sans fin' });
  assert.throws(() => decouper(texte.replace(/^---\n[\s\S]*?\n---\n/, ''), 'x.md'), { message: 'x.md : en-tête absent' });
  const g = genere('DsTag');
  assert.equal(regenerer(texte, FICHE, g), texte, 'la fiche du dépôt est à jour');
  // Blocs vidés et en-tête réduit : la régénération rend la fiche à l'octet.
  const vide = texte.replace(/^---\n[\s\S]*?\n---$/m, '---\n---').replace(/(<!-- genere:(\w+) [^\n]*-->)\n[\s\S]*?\n(<!-- \/genere:\2 -->)/g, '$1\n$3');
  assert.notEqual(vide, texte);
  const une = regenerer(vide, FICHE, g);
  assert.equal(une, texte);
  assert.equal(regenerer(une, FICHE, g), une);
});

test('U7 écarts des parties écrites, mot pour mot', () => {
  const texte = lire(FICHE);
  const e = parNom('DsTag');
  const ecarts = (/** @type {string} */ t) => ecartsEcrits(t, FICHE, e, ctx());
  assert.deepEqual(ecarts(texte), []);
  assert.deepEqual(ecarts(texte.replace('## Refusé', '## Refus')), ['sections : attendu « ## Refusé » en place 3, trouvé « ## Refus »']);
  assert.deepEqual(ecarts(texte.replace(/^Un mot court.*$/m, '')), ['phrase de rôle absente']);
  assert.deepEqual(ecarts(texte.replace(/^(Un mot court.*)pas\.$/m, '$1pas')), ['phrase de rôle sans point final']);
  assert.deepEqual(ecarts(texte.replace(/^- `tone` : .*\n/m, '')), ['prop sans sa ligne : tone']);
  assert.deepEqual(ecarts(texte.replace(/^(- `tone` : .*)$/m, '$1\n- `couleur` : une couleur.')), ['ligne d\'une prop hors du composant : couleur']);
  assert.deepEqual(ecarts(texte.replace('- D55 : l\'étiquette', '- D99 : l\'étiquette')), ['décision inconnue : D99']);
  assert.deepEqual(ecarts(texte.replace('- B5 : l\'étiquette', '- B99 : l\'étiquette')), ['dette inconnue : B99']);
  assert.deepEqual(ecarts(texte.replace('story « Planche »', 'story « Planche bis »')), ['story inconnue : « Planche bis »']);
  assert.deepEqual(ecarts(texte.replace('<DsTag text="Lyon" />', '<DsTag text="Lyon" closable />')), ['exemple refusé : DsTag : attribut refusé : closable']);
  assert.deepEqual(ecarts(texte.replace('```vue', '```js')), ['exemple : 0 blocs vue, un attendu']);
});

/** Bloc vue d'essai. @param {string} script @param {string} gabarit */
const vue = (script, gabarit) => `<script setup>\n${script}\n</script>\n\n<template>\n${gabarit}\n</template>`;
const IMPORTS = [
  "import DsTag from './composants/DsTag.vue';",
  "import DsButton from './composants/DsButton.vue';",
  "import DsIconButton from './composants/DsIconButton.vue';",
  "import DsCard from './composants/DsCard.vue';",
  "import DsTextInput from './composants/DsTextInput.vue';",
  "import { mdiPencil } from '@mdi/js';",
  "import { icone } from './composants/icone.js';",
  'const Crayon = icone(mdiPencil);',
].join('\n');
const exemple = (/** @type {string} */ gabarit) => () => verifierExemple(vue(IMPORTS, gabarit), menuDe);

test('U8 exemples acceptés, refusés par les props, ou hors grammaire', () => {
  const fiche = lire(FICHE);
  const bloc = /** @type {RegExpExecArray} */ (/^```vue\n([\s\S]*?)\n```$/m.exec(fiche))[1];
  assert.deepEqual(verifierExemple(bloc, menuDe), ['DsTag']);
  assert.doesNotThrow(exemple('  <DsIconButton label="Modifier" :icon="Crayon" @click="modifier" />'));
  assert.doesNotThrow(exemple('  <DsButton variant="secondary" :prepend-icon="Crayon" @click="modifier">Modifier</DsButton>'));
  assert.doesNotThrow(exemple('  <DsCard title="Atelier du jeudi" :heading-level="2">\n    Un texte.\n    <template #actions><DsButton variant="secondary">S\'inscrire</DsButton></template>\n  </DsCard>'));
  assert.doesNotThrow(exemple('  <DsTextInput v-model="courriel" label="Courriel" type="email" autocomplete="email" />'));

  const refus = (/** @type {string} */ g, /** @type {string} */ message) => assert.throws(exemple(g), (/** @type {any} */ err) => !(err instanceof HorsGrammaire) && err.message === message, message);
  refus('  <DsTag text="Lyon" closable />', 'DsTag : attribut refusé : closable');
  refus('  <DsTag text="Lyon" @click="ouvrir" />', 'DsTag : attribut refusé : onClick');
  refus('  <DsCard title="T" heading-level="2" />', 'DsCard : headingLevel : valeur inconnue : 2 (2, 3, 4)');
  refus('  <DsCard title="T" href="/x"><template #actions><DsButton>Voir</DsButton></template></DsCard>', 'DsCard : href : refusé avec le slot actions');
  refus('  <DsCard title="T"><template #actions><a href="/x">Voir</a></template></DsCard>', 'DsCard : slot actions : seuls DsButton et DsIconButton sont admis');
  refus('  <DsButton type="submit" disabled>Envoyer</DsButton>', 'DsButton : disabled : refusé avec type=submit');
  // Le composant passe avant son contenu : la carte est refusée avant le bouton de son slot actions.
  refus('  <DsCard title="T" heading-level="5"><template #actions><DsButton variant="x">V</DsButton></template></DsCard>', 'DsCard : headingLevel : valeur inconnue : 5 (2, 3, 4)');

  const hors = (/** @type {() => unknown} */ f, /** @type {RegExp} */ motif) => assert.throws(f, (/** @type {any} */ err) => err instanceof HorsGrammaire && motif.test(err.message), String(motif));
  hors(exemple('  <DsTag text="Lyon" />{{ x }}'), /^exemple hors grammaire : interpolation : \{\{ x \}\}$/);
  hors(exemple('  <DsTag v-if="vu" text="Lyon" />'), /^exemple hors grammaire : directive : v-if$/);
  hors(exemple('  <DsCard title="T" :heading-level="a + b" />'), /^exemple hors grammaire : expression : a \+ b$/);
  hors(exemple('  <DsIconButton label="Modifier" :icon="Gomme" />'), /^exemple hors grammaire : nom non défini : Gomme$/);
  hors(exemple('  <Inconnue />'), /^exemple hors grammaire : balise inconnue : Inconnue$/);
  hors(() => verifierExemple('<template>\n  <DsTag text="Lyon" />\n</template>', menuDe), /^exemple hors grammaire : attendu un <script setup>/);
  hors(() => verifierExemple(vue("import DsTag from './composants/DsTag.vue';\nlet x = 1;", '  <DsTag text="Lyon" />'), menuDe), /^exemple hors grammaire : ligne de script : let x = 1;$/);
});

test('U9 bloc de l\'index du DsTag seul ; le glossaire sous le bloc est gardé', () => {
  const phrase = 'Un mot court sur un fond teinté, pour classer un membre (ville, secteur) ou mettre une qualité en avant (« Mentor ») ; il ne se clique pas.';
  const ligne = `| \`DsTag\` | [DsTag (étiquette)](tag.md) | ${phrase} |`;
  const bloc = blocIndex([ligne]);
  assert.equal(
    bloc,
    [
      '<!-- genere:index : écrit par npm --prefix atelier run fiches -->',
      '# Fiches des composants',
      '',
      'Une fiche par composant de l\'atelier : à quoi il sert, ses props, ce qu\'il refuse, ses tokens, son accessibilité, un exemple à copier. Les règles qu\'ils suivent sont dans [docs/regles.md](../regles.md). Les blocs `genere` de chaque fiche, et cette liste, sont écrits par `npm --prefix atelier run fiches` depuis les props, les composants et les tokens ; `npm --prefix atelier run fiches -- --verifier` refuse une fiche qui ne leur correspond plus.',
      '',
      '| Composant | Fiche | À quoi il sert |',
      '|---|---|---|',
      ligne,
      '<!-- /genere:index -->',
    ].join('\n'),
  );
  const index = lire('docs/composants/README.md');
  assert.ok(index.includes(ligne));
  // Le bloc du dépôt, six fiches : le régénérer garde le glossaire à l'octet et rend une ligne changée.
  const blocDuDepot = index.slice(0, index.indexOf('<!-- /genere:index -->') + '<!-- /genere:index -->'.length);
  assert.equal(regenererIndex(index, blocDuDepot), index, 'l\'index du dépôt est à jour, glossaire compris');
  assert.equal(regenererIndex(index.replace(ligne, '| vieux |'), blocDuDepot), index);
  assert.ok(regenererIndex(index, bloc).endsWith(index.slice(index.indexOf('<!-- /genere:index -->') + '<!-- /genere:index -->'.length)), 'glossaire gardé');
  assert.equal(regenererIndex(null, bloc), `${bloc}\n`);
});

test('U10 le contrôle des fiches sort en 0 sur le dépôt', () => {
  const sortie = execFileSync(process.execPath, [join(ROOT, 'atelier', 'fiches.js'), '--verifier'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(sortie, /^✓ docs\/composants\/tag\.md$/m);
  assert.match(sortie, /^✓ docs\/composants\/README\.md$/m);
  assert.match(sortie, /^✓ atelier\/composants\/noms\.json$/m);
  for (const f of ['button', 'icon-button', 'text-input', 'card', 'avatar', 'tag']) assert.match(sortie, new RegExp(`^✓ docs/composants/${f}\\.md$`, 'm'), f);
  // Une fiche par composant (DOC1) : la fiche d'un composant qui manque est un écart.
  assert.deepEqual(fichesAbsentes(MENUS, ['button.md', 'card.md']), ['icon-button', 'text-input', 'avatar', 'tag'].map((f) => `docs/composants/${f}.md`));
  assert.deepEqual(fichesAbsentes(MENUS, MENUS.map((m) => `${m.fiche}.md`)), []);
  assert.doesNotMatch(sortie, /✗/);
});

test('U11 anatomie du DsTag ; le bouton à icône sans danger plein ; tokens sans description en panne ; descriptions lisibles', () => {
  assert.equal(
    genere('DsTag').tokens,
    [
      'Un token est le nom d\'une valeur de design. Le composant n\'a aucune valeur en dur : chaque marque donne la sienne, et changer un token change toutes ses instances.',
      '',
      '| Partie | Token | Ce qu\'il règle |',
      '|---|---|---|',
      '| Couleur, tone neutral | `fond.teinte` | Fond teinté d\'une pièce statique qui porte un texte court pour classer, posée sur la page ou sur une surface ; jamais un fond cliquable. |',
      '| Couleur, tone neutral | `texte.principal` | Texte courant et titres. |',
      '| Couleur, tone brand | `fond.marque.teinte` | Fond teinté de la marque d\'une pièce statique qui porte un texte court ou des initiales pour mettre en avant, posée sur la page ou sur une surface ; jamais un fond cliquable. |',
      '| Couleur, tone brand | `texte.marque` | Texte de marque posé sur l\'aplat clair de la marque, comme les initiales d\'un avatar ou une étiquette mise en avant. |',
      '| Forme | `arrondi.pilule` | Arrondi complet d\'une forme ronde ou en pilule, comme un avatar ou une étiquette. |',
      '| Forme | `hauteur.etiquette` | Hauteur d\'une étiquette, sur une ligne. |',
      '| Forme | `marge-interieure.etiquette` | Marge intérieure gauche et droite d\'une étiquette, de part et d\'autre de son texte. |',
      '| Texte | `typo.corps.petit` | Texte de tableau ou d\'étiquette, plus petit que le texte courant. |',
    ].join('\n'),
  );
  const bi = genere('DsIconButton').tokens;
  assert.doesNotMatch(bi, /variant danger(?!-)/);
  assert.match(bi, /^\| Couleur, variant danger-ghost \| `texte\.erreur` \|/m);
  assert.doesNotMatch(bi, /block|loading/);
  assert.match(genere('DsButton').tokens, /^\| Couleur, variant danger \| `fond\.erreur\.fort` \|/m);
  assert.match(genere('DsTextInput').tokens, /^\| Couleur, errorMessage \| `bordure\.erreur` \|/m);
  const c = lireComposant('DsTag');
  const sans = new Map([...DESCRIPTIONS].filter(([k]) => k !== 'hauteur.etiquette'));
  assert.throws(() => anatomie(c, PAR_NOM.get('DsTag'), TABLE, sans, 'essai.vue', PAR_NOM), { message: 'essai.vue : token sans description : hauteur.etiquette' });
  // DOC3 par lecture : une phrase, sans numéro de règle ni de décision, sans nom de token, sans mesure, sans pas.
  assert.deepEqual(motifsDescription('Texte de marque posé sur fond.marque.discret ; pas 12 du primaire (D05).'), ['numéro de règle ou de décision', 'nom de token', 'pas d\'échelle']);
  assert.deepEqual(motifsDescription('Anneau de focus clavier (3:1).'), ['mesure']);
  assert.deepEqual(motifsDescription('Texte de tableau ; ligne visée 20 px.'), ['mesure']);
  assert.deepEqual(motifsDescription('Deux phrases. Une de trop.'), ['pas une seule phrase']);
  assert.deepEqual(motifsDescription('Texte courant et titres.'), []);
  assert.deepEqual(ecartsDescriptions(['texte.principal', 'hauteur.etiquette'], new Map([['texte.principal', 'Texte courant et titres.'], ['hauteur.etiquette', 'Hauteur de 24 px.']])), ['description à réécrire : hauteur.etiquette (mesure)']);
  const pose = lire(FICHE).replace('`ecart.entre-etiquettes` (`ds-ecart-entre-etiquettes`)', '`ecart.inconnu` (`ds-ecart-entre-etiquettes`)');
  assert.throws(() => ecartsEcrits(pose, FICHE, parNom('DsTag'), ctx()), { message: `${FICHE} : token sans description : ecart.inconnu` });
});

test('U12 mots refusés hors code, plafond de mots, glossaire', () => {
  const essai = ['---', 'name: X', '---', '', 'Le test de rendu remplace la preuve.', '', 'La commande `npm --prefix atelier run preuve` reste en code.', '', '```', 'preuve', '```'].join('\n');
  assert.deepEqual(motsRefuses(essai), ['mot refusé : preuve (ligne 5)']);
  assert.deepEqual(motsRefuses(`${essai}\n\n## Glossaire\n\n| test de rendu | … | preuve |`), ['mot refusé : preuve (ligne 5)']);
  assert.deepEqual(motsRefuses('Des Jetons et un écouteur.'), ['mot refusé : jetons (ligne 1)']);
  assert.deepEqual(motsRefuses('Un tokenisé, une optionnelle.'), [], 'mots entiers seulement');
  const longue = lire(FICHE).replace('## Test de rendu', `${'mot '.repeat(600)}\n\n## Test de rendu`);
  const n = motsEcrits(longue);
  assert.ok(n > 500);
  assert.ok(ecartsEcrits(longue, FICHE, parNom('DsTag'), ctx()).includes(`fiche trop longue : ${n} mots écrits, 500 au plus`));
  assert.ok(motsEcrits(lire(FICHE)) <= 500);
  assert.equal(motsEcrits(['---', 'a: b c d', '---', '', '| un | deux |', '', 'trois quatre - cinq', '```', 'six', '```'].join('\n')), 3);
  const index = lire('docs/composants/README.md');
  assert.deepEqual(ecartsGlossaire(index), []);
  for (const m of MOTS_REFUSES) assert.match(index.slice(index.indexOf('## Glossaire')), new RegExp(m));
  assert.deepEqual(ecartsGlossaire(index.replace('| emplacement |', '| place |')), ['glossaire : ancien mot absent : emplacement']);
  assert.deepEqual(ecartsGlossaire('# Fiches'), ['glossaire absent']);
});

test('U13 table des noms : écarts sur une table d\'essai, aucun sur le dépôt', () => {
  const slots = new Map(MENUS.map((m) => [m.nom, lireComposant(m.nom).emplacements]));
  assert.deepEqual(ecartsNoms(MENUS, slots, NOMS), []);
  const tag = MENUS.filter((m) => m.nom === 'DsTag');
  const table = (/** @type {any} */ props, /** @type {any} */ autres = {}) => ({ composants: { DsTag: { source: 'courant', props, evenements: {}, slots: {}, ...autres } } });
  const tone = { source: 'courant', valeurs: { neutral: { source: 'courant' }, brand: { source: 'courant' } } };
  assert.deepEqual(ecartsNoms(tag, new Map([['DsTag', []]]), table({ text: { source: 'vuetify' }, tone })), []);
  assert.deepEqual(ecartsNoms(tag, new Map([['DsTag', []]]), table({ tone })), ['prop absente de la table : DsTag.text']);
  assert.deepEqual(ecartsNoms(tag, new Map([['DsTag', []]]), table({ text: { source: 'vuetify' }, tone: { source: 'courant', valeurs: { neutral: { source: 'courant' } } } })), ['valeur absente de la table : DsTag.tone.brand']);
  assert.deepEqual(ecartsNoms(tag, new Map([['DsTag', []]]), table({ text: { source: 'vuetify' }, tone, size: { source: 'vuetify' } })), ['entrée sans emploi : DsTag.size']);
  assert.deepEqual(ecartsNoms(tag, new Map([['DsTag', []]]), table({ text: { source: 'wikipedia' }, tone })), ['source inconnue : DsTag.text (wikipedia)']);
  const mal = [{ nom: 'DsTag', menu: { ...tag[0].menu, options: { ...tag[0].menu.options, Tone: { type: String } } } }];
  assert.deepEqual(ecartsNoms(mal, new Map([['DsTag', []]]), table({ text: { source: 'vuetify' }, tone, Tone: { source: 'courant' } })), ['nom mal formé : DsTag.Tone']);
  assert.deepEqual(ecartsNoms(tag, new Map([['DsTag', ['default']]]), table({ text: { source: 'vuetify' }, tone })), ['slot absent de la table : DsTag.default']);
  assert.deepEqual(ecartsNoms(tag, new Map([['DsTag', []]]), { composants: {} }), ['composant absent de la table : DsTag']);
});
