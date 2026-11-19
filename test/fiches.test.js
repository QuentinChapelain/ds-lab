// @ts-check
/**
 * Fiches des composants (D56, docs/attendus/fiches.md) : en-tête et blocs générés depuis le menu, le composant, sa story
 * et les jetons ; parties écrites contrôlées ; exemple lu par une grammaire fermée et vérifié par la fabrique ; index.
 *
 * Attendus écrits à la main avant le code (19/11/2026), recopiés de l'attendu :
 *   U1 en-tête de l'étiquette à l'octet ; celui du bouton à icône nomme la pièce du bouton (« VBtn (par Bouton) ») et
 *      ses décisions (D52, D51) ;
 *   U2 bloc menu de l'étiquette à l'octet ; niveau et emplacements de la carte, icône et événement du bouton ;
 *   U3 bloc refus de l'étiquette à l'octet ; pour les six menus, la liste des attributs admis confrontée à verifierUsage
 *      (id, aria-describedby ou un autre aria-* s'il est retiré, data-x passent ; chaque retiré lève ; onClick passe si et seulement si les écouteurs sont
 *      admis ; class lève) ; pour chacune des sept règles, le message tiré du texte de la fonction est celui que lève
 *      verifierUsage sur un cas qui la déclenche ; une règle sans message lisible est une panne ;
 *   U4 bloc jetons de l'étiquette à l'octet ; le bouton à icône a les jetons du bouton qu'il rend ; une variable du
 *      thème inconnue de la table, ou une variable ds- écrite et inconnue, est une panne ;
 *   U5 bloc contrastes de l'étiquette à l'octet (11,65 et 11,68 : culori 4.0.2, wcagContrast, sur les couleurs de
 *      tokens/<marque>/vuetify.json, commande dans l'attendu) ; la paire du texte désactivé du bouton porte « exception
 *      écrite » ; une couleur dont la paire manque à paires.json est une panne ;
 *   U6 une marque absente, en double ou ouverte sans fin est une panne nommée ; régénérer garde les parties écrites à
 *      l'octet, et une seconde passe ne change rien ;
 *   U7 chaque écart des parties écrites donne sa ligne, mot pour mot ;
 *   U8 exemples acceptés (l'étiquette en liste, un bouton à icône et écouteur, une carte et ses actions, un champ et
 *      v-model) et refusés avec le message de la fabrique ; syntaxes hors grammaire en panne ;
 *   U9 index de l'étiquette seule à l'octet ;
 *   U10 le contrôle sort en 0 sur le dépôt.
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
  blocContrastes,
  blocJetons,
  blocMenu,
  blocRefus,
  decouper,
  ecartsEcrits,
  entete,
  jetonsDe,
  lireComposant,
  lireMenus,
  lireStories,
  lireTable,
  messageDeRegle,
  mesurerThemes,
  pairesDe,
  regenerer,
  texteIndex,
} from '../atelier/fiches/fiche.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const lire = (/** @type {string} */ f) => readFileSync(join(ROOT, f), 'utf8');

const MENUS = await lireMenus();
const TABLE = lireTable();
const PAIRES = JSON.parse(lire('tokens/commun/paires.json'));
const THEMES = mesurerThemes();
const parNom = (/** @type {string} */ n) => /** @type {any} */ (MENUS.find((m) => m.nom === n));
const menuDe = (/** @type {string} */ f) => parNom(f).menu;
const FICHE = 'docs/composants/tag.md';

/** Tout ce que le script écrit pour une enveloppe. @param {string} nom */
function genere(nom) {
  const e = parNom(nom);
  const c = lireComposant(nom);
  const s = lireStories(nom);
  return {
    entete: entete(e, c, s),
    titre: `# ${s.titre}`,
    menu: blocMenu(e.menu, c),
    refus: blocRefus(e.menu, nom),
    jetons: blocJetons(jetonsDe(c, TABLE, nom)),
    contrastes: blocContrastes(pairesDe(c, TABLE, PAIRES, nom), THEMES, nom),
  };
}

const ctx = () => ({ table: TABLE, stories: lireStories('DsTag'), decisions: lire('docs/decisions.md'), dette: lire('KNOWN_ISSUES.md'), menuDe });

test('U1 en-tête de l\'étiquette, et du bouton à icône par le bouton', () => {
  assert.equal(
    genere('DsTag').entete,
    [
      '---',
      'nom: DsTag',
      'titre: DsTag',
      'fichier: atelier/composants/DsTag.vue',
      'menu: atelier/composants/DsTag.menu.js',
      'enveloppe: VChip',
      'decisions: [D55, D51]',
      'stories: atelier/stories/DsTag.stories.js',
      'preuve: npm --prefix atelier run preuve -- tag',
      '---',
    ].join('\n'),
  );
  const bi = genere('DsIconButton').entete;
  assert.match(bi, /^enveloppe: VBtn \(par DsButton\)$/m);
  assert.match(bi, /^decisions: \[D52, D51\]$/m);
  assert.match(bi, /^titre: DsIconButton$/m);
});

test('U2 bloc menu de l\'étiquette ; carte et bouton', () => {
  assert.equal(
    genere('DsTag').menu,
    [
      '| Option | Type | Obligatoire | Défaut | Valeurs admises |',
      '|---|---|---|---|---|',
      '| `text` | texte | oui | aucun | libre |',
      '| `tone` | texte | non | `\'neutral\'` | `\'neutral\'`, `\'brand\'` |',
      '',
      'Événements émis : aucun. Emplacements : aucun.',
    ].join('\n'),
  );
  const carte = genere('DsCard').menu;
  assert.match(carte, /^\| `headingLevel` \| nombre \| non \| `3` \| `2`, `3`, `4` \|$/m);
  assert.match(carte, /^Événements émis : aucun\. Emplacements : `default`, `actions`\.$/m);
  const bouton = genere('DsButton').menu;
  assert.match(bouton, /^\| `prependIcon` \| objet ou fonction \| non \| `null` \| libre \|$/m);
  assert.match(bouton, /^Événements émis : `click`\. Emplacements : `default`\.$/m);
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

test('U3 bloc refus de l\'étiquette ; attributs admis confrontés à la fabrique ; messages des règles', () => {
  assert.equal(
    genere('DsTag').refus,
    [
      'Attributs admis en plus des options : `id`, `aria-*`, `data-*`. Retirés : `aria-label`, `aria-labelledby`. Écouteurs : refusés.',
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
    assert.match(refus, menu.ecouteurs === false ? /Écouteurs : refusés\.$/m : /Écouteurs \(`on…`\) : admis\.$/m, nom);
    assert.match(refus, (menu.attributsRetires ?? []).length ? new RegExp(`Retirés : ${menu.attributsRetires.map((/** @type {string} */ r) => `\`${r}\``).join(', ')}\\.`) : /Retirés : aucun\./, nom);
  }
  // Sept règles, chacune avec un cas qui la déclenche et son message, écrits à la main.
  const bouton = { type: 'submit', disabled: true };
  const CAS = [
    ['DsButton', 'regles', 0, bouton, {}, 'disabled : refusé avec type=submit'],
    ['DsIconButton', 'regles', 0, { ...VALIDES.DsIconButton, ...bouton }, {}, 'disabled : refusé avec type=submit'],
    ['DsAvatar', 'regles', 0, { name: '   ' }, {}, 'name : obligatoire'],
    ['DsAvatar', 'regles', 1, { name: '123' }, {}, 'name : sans lettre'],
    ['DsCard', 'regles', 0, { title: 'T', image: 'a.jpg' }, {}, 'imageAlt : obligatoire avec image'],
    ['DsCard', 'regles', 1, { title: 'T', href: '/x' }, { actions: () => [] }, 'href : refusé avec le slot actions'],
    ['DsCard', 'reglesDuRendu', 0, { title: 'T' }, { actions: () => [{ type: 'a' }] }, 'slot actions : seuls DsButton et DsIconButton sont admis'],
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

test('U4 bloc jetons de l\'étiquette ; le bouton à icône prend ceux du bouton ; variable inconnue en panne', () => {
  assert.equal(
    genere('DsTag').jetons,
    [
      '| Jeton | Variables du thème |',
      '|---|---|',
      '| `fond.marque.discret` | `marque-discret` |',
      '| `texte.marque` | `on-marque-discret` |',
      '| `fond.composant` | `composant` |',
      '| `texte.principal` | `on-composant` |',
      '| `arrondi.pilule` | `ds-arrondi-pilule` |',
      '| `hauteur.etiquette` | `ds-hauteur-etiquette` |',
      '| `marge-interieure.etiquette` | `ds-marge-interieure-etiquette` |',
      '| `typo.corps.petit` | `ds-corps-petit-police`, `ds-corps-petit-taille`, `ds-corps-petit-graisse`, `ds-corps-petit-interligne` |',
    ].join('\n'),
  );
  const bi = genere('DsIconButton').jetons;
  assert.match(bi, /^\| `fond\.interactif\.fort` \| `primary` \|$/m);
  assert.match(bi, /^\| `bordure\.focus` \| `ds-focus` \|$/m);
  const vide = { theme: new Set(), ds: new Set(), emplacements: [] };
  assert.throws(() => jetonsDe({ ...vide, ds: new Set(['ds-inconnue']) }, TABLE, 'essai.vue'), { message: 'essai.vue : variable inconnue de la table : --v-ds-inconnue' });
  assert.throws(() => jetonsDe({ ...vide, theme: new Set(['inconnue']) }, TABLE, 'essai.vue'), { message: 'essai.vue : variable inconnue de la table : --v-theme-inconnue' });
  const texte = lire(FICHE).replace('- `ds-ecart-entre-etiquettes`', '- `ds-ecart-inconnu`');
  assert.throws(() => ecartsEcrits(texte, FICHE, parNom('DsTag'), ctx()), { message: `${FICHE} : variable inconnue de la table : ds-ecart-inconnu` });
});

test('U5 bloc contrastes de l\'étiquette ; exception écrite ; paire absente en panne', () => {
  assert.equal(
    genere('DsTag').contrastes,
    [
      '| Devant | Fond | Plus bas des 10 thèmes | Seuil |',
      '|---|---|---|---|',
      '| `texte.marque` | `fond.marque.discret` | 11,65:1 (Atelier Lavandine, clair) | 4,50:1 |',
      '| `texte.principal` | `fond.composant` | 11,68:1 (Atelier Lavandine, clair) | 4,50:1 |',
    ].join('\n'),
  );
  assert.match(genere('DsButton').contrastes, /^\| `texte\.desactive` \| `fond\.desactive` \| [\d,]+:1 \([^)]+\) \| 4,50:1, exception écrite \|$/m);
  const c = { theme: new Set(['composant']), ds: new Set(), emplacements: [] };
  assert.throws(() => pairesDe(c, TABLE, { paires: [] }, 'essai.vue'), { message: 'essai.vue : paire absente de tokens/commun/paires.json : texte.principal sur fond.composant' });
});

test('U6 marques en panne ; régénérer garde les parties écrites, deux fois de suite', () => {
  const texte = lire(FICHE);
  const ouv = '<!-- genere:menu : écrit par npm --prefix atelier run fiches -->';
  assert.throws(() => decouper(texte.replace(ouv, ''), 'x.md'), { message: 'x.md : marque genere:menu absente' });
  assert.throws(() => decouper(`${texte}\n${ouv}\n`, 'x.md'), { message: 'x.md : marque genere:menu en double' });
  assert.throws(() => decouper(texte.replace('<!-- /genere:menu -->', ''), 'x.md'), { message: 'x.md : marque genere:menu ouverte sans fin' });
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
  assert.deepEqual(ecarts(texte.replace(/^- `tone` : .*\n/m, '')), ['option sans sa ligne : tone']);
  assert.deepEqual(ecarts(texte.replace(/^(- `tone` : .*)$/m, '$1\n- `couleur` : une couleur.')), ['ligne d\'une option hors du menu : couleur']);
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

test('U8 exemples acceptés, refusés par la fabrique, ou hors grammaire', () => {
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
  // L'enveloppe passe avant son contenu : la carte est refusée avant le bouton de ses actions.
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

test('U9 index de l\'étiquette seule', () => {
  const phrase = 'Un mot court sur un fond teinté, pour classer un membre (ville, secteur) ou mettre une qualité en avant (« Mentor ») ; il ne se clique pas.';
  assert.equal(
    texteIndex([`| \`DsTag\` | [DsTag](tag.md) | ${phrase} |`]),
    [
      '<!-- genere:index : écrit par npm --prefix atelier run fiches -->',
      '# Fiches des composants',
      '',
      'Une fiche par enveloppe de l\'atelier : son rôle, son menu, ce qu\'elle refuse, ses jetons, son accessibilité, un exemple à copier. Les blocs `genere` de chaque fiche, et cette liste, sont écrits par `npm --prefix atelier run fiches` depuis les menus, les composants et les jetons ; `npm --prefix atelier run fiches -- --verifier` refuse une fiche qui ne leur correspond plus.',
      '',
      '| Composant | Fiche | Rôle |',
      '|---|---|---|',
      `| \`DsTag\` | [DsTag](tag.md) | ${phrase} |`,
      '<!-- /genere:index -->',
      '',
    ].join('\n'),
  );
  assert.ok(lire('docs/composants/README.md').includes(`| \`DsTag\` | [DsTag](tag.md) | ${phrase} |`));
});

test('U10 le contrôle des fiches sort en 0 sur le dépôt', () => {
  const sortie = execFileSync(process.execPath, [join(ROOT, 'atelier', 'fiches.js'), '--verifier'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(sortie, /^✓ docs\/composants\/tag\.md$/m);
  assert.match(sortie, /^✓ docs\/composants\/README\.md$/m);
  assert.doesNotMatch(sortie, /✗/);
});
