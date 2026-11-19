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
const FICHE = 'docs/composants/etiquette.md';

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

const ctx = () => ({ table: TABLE, stories: lireStories('Etiquette'), decisions: lire('docs/decisions.md'), dette: lire('KNOWN_ISSUES.md'), menuDe });

test('U1 en-tête de l\'étiquette, et du bouton à icône par le bouton', () => {
  assert.equal(
    genere('Etiquette').entete,
    [
      '---',
      'nom: Etiquette',
      'titre: Étiquette',
      'fichier: atelier/composants/Etiquette.vue',
      'menu: atelier/composants/Etiquette.menu.js',
      'enveloppe: VChip',
      'decisions: [D55, D51]',
      'stories: atelier/stories/Etiquette.stories.js',
      'preuve: npm --prefix atelier run preuve -- etiquette',
      '---',
    ].join('\n'),
  );
  const bi = genere('BoutonIcone').entete;
  assert.match(bi, /^enveloppe: VBtn \(par Bouton\)$/m);
  assert.match(bi, /^decisions: \[D52, D51\]$/m);
  assert.match(bi, /^titre: Bouton à icône$/m);
});

test('U2 bloc menu de l\'étiquette ; carte et bouton', () => {
  assert.equal(
    genere('Etiquette').menu,
    [
      '| Option | Type | Obligatoire | Défaut | Valeurs admises |',
      '|---|---|---|---|---|',
      '| `texte` | texte | oui | aucun | libre |',
      '| `ton` | texte | non | `\'neutre\'` | `\'neutre\'`, `\'marque\'` |',
      '',
      'Événements émis : aucun. Emplacements : aucun.',
    ].join('\n'),
  );
  const carte = genere('Carte').menu;
  assert.match(carte, /^\| `niveau` \| nombre \| non \| `3` \| `2`, `3`, `4` \|$/m);
  assert.match(carte, /^Événements émis : aucun\. Emplacements : `default`, `actions`\.$/m);
  const bouton = genere('Bouton').menu;
  assert.match(bouton, /^\| `icone` \| objet ou fonction \| non \| `null` \| libre \|$/m);
  assert.match(bouton, /^Événements émis : `click`\. Emplacements : `default`\.$/m);
});

/** Options valides d'une enveloppe, défauts du menu appliqués, comme Vue. @param {any} menu @param {Record<string, unknown>} props */
const avecDefauts = (menu, props) => ({ ...Object.fromEntries(Object.entries(menu.options).flatMap(([k, o]) => ('defaut' in /** @type {any} */ (o) ? [[k, /** @type {any} */ (o).defaut]] : []))), ...props });

/** Usage valide de chaque menu, écrit à la main. */
const VALIDES = /** @type {Record<string, Record<string, unknown>>} */ ({
  Bouton: {},
  BoutonIcone: { libelle: 'Fermer', icone: () => null },
  ChampTexte: { libelle: 'Courriel' },
  Carte: { titre: 'Événement' },
  Avatar: { nom: 'Camille Ferrand' },
  Etiquette: { texte: 'Lyon' },
});

test('U3 bloc refus de l\'étiquette ; attributs admis confrontés à la fabrique ; messages des règles', () => {
  assert.equal(
    genere('Etiquette').refus,
    [
      'Attributs admis en plus des options : `id`, `aria-*`, `data-*`. Retirés : `aria-label`, `aria-labelledby`. Écouteurs : refusés.',
      '',
      'Tout autre usage lève une erreur, et rien n\'est rendu. Messages, dans l\'ordre où ils sont vérifiés :',
      '',
      '- `étiquette : attribut refusé : <attributs>`',
      '- `étiquette : texte obligatoire`',
      '- `étiquette : ton inconnu : <valeur> (neutre, marque)`',
    ].join('\n'),
  );
  for (const { nom, menu } of MENUS) {
    const props = avecDefauts(menu, VALIDES[nom]);
    const essai = (/** @type {Record<string, unknown>} */ attrs) => () => verifierUsage(menu, props, attrs);
    // Le champ retire aria-describedby, qu'il pose lui-même : un autre aria-* passe alors.
    const aria = (menu.attributsRetires ?? []).includes('aria-describedby') ? 'aria-details' : 'aria-describedby';
    assert.doesNotThrow(essai({ id: 'a', [aria]: 'b', 'data-x': '1' }), nom);
    for (const r of menu.attributsRetires ?? []) assert.throws(essai({ [r]: 'x' }), { message: `${menu.prefixe} : attribut refusé : ${r}` }, nom);
    if (menu.ecouteurs === false) assert.throws(essai({ onClick: () => null }), { message: `${menu.prefixe} : attribut refusé : onClick` }, nom);
    else assert.doesNotThrow(essai({ onClick: () => null }), nom);
    assert.throws(essai({ class: 'x' }), { message: `${menu.prefixe} : attribut refusé : class` }, nom);
    const refus = genere(nom).refus;
    assert.match(refus, menu.ecouteurs === false ? /Écouteurs : refusés\.$/m : /Écouteurs \(`on…`\) : admis\.$/m, nom);
    assert.match(refus, (menu.attributsRetires ?? []).length ? new RegExp(`Retirés : ${menu.attributsRetires.map((/** @type {string} */ r) => `\`${r}\``).join(', ')}\\.`) : /Retirés : aucun\./, nom);
  }
  // Sept règles, chacune avec un cas qui la déclenche et son message, écrits à la main.
  const bouton = { type: 'submit', desactive: true };
  const CAS = [
    ['Bouton', 'regles', 0, bouton, {}, 'désactivé refusé sur type=submit'],
    ['BoutonIcone', 'regles', 0, { ...VALIDES.BoutonIcone, ...bouton }, {}, 'désactivé refusé sur type=submit'],
    ['Avatar', 'regles', 0, { nom: '   ' }, {}, 'nom obligatoire'],
    ['Avatar', 'regles', 1, { nom: '123' }, {}, 'nom sans lettre'],
    ['Carte', 'regles', 0, { titre: 'T', media: 'a.jpg' }, {}, 'texte alternatif obligatoire avec une image'],
    ['Carte', 'regles', 1, { titre: 'T', lien: '/x' }, { actions: () => [] }, 'lien et actions ensemble refusés'],
    ['Carte', 'reglesDuRendu', 0, { titre: 'T' }, { actions: () => [{ type: 'a' }] }, 'actions : seuls Bouton et BoutonIcone sont admis'],
  ];
  let regles = 0;
  for (const { menu } of MENUS) regles += (menu.regles ?? []).length + (menu.reglesDuRendu ?? []).length;
  assert.equal(regles, CAS.length);
  for (const [nom, sorte, i, props, slots, message] of CAS) {
    const { menu } = parNom(/** @type {string} */ (nom));
    assert.equal(messageDeRegle(menu[sorte][i], nom), message);
    assert.throws(() => verifierUsage(menu, avecDefauts(menu, /** @type {any} */ (props)), {}, /** @type {any} */ (slots), { rendu: true }), { message: `${menu.prefixe} : ${message}` });
  }
  assert.match(genere('Carte').refus, /^- `carte : actions : seuls Bouton et BoutonIcone sont admis`, au rendu$/m);
  assert.equal((genere('Avatar').refus.match(/avatar : nom obligatoire/g) ?? []).length, 1);
  assert.throws(() => messageDeRegle((/** @type {any} */ p) => (p.a ? 'x' : p.b ? 'y' : null), 'essai'), /essai : règle sans message lisible/);
  assert.throws(() => messageDeRegle(() => null, 'essai'), /essai : règle sans message lisible/);
});

test('U4 bloc jetons de l\'étiquette ; le bouton à icône prend ceux du bouton ; variable inconnue en panne', () => {
  assert.equal(
    genere('Etiquette').jetons,
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
  const bi = genere('BoutonIcone').jetons;
  assert.match(bi, /^\| `fond\.interactif\.fort` \| `primary` \|$/m);
  assert.match(bi, /^\| `bordure\.focus` \| `ds-focus` \|$/m);
  const vide = { theme: new Set(), ds: new Set(), emplacements: [] };
  assert.throws(() => jetonsDe({ ...vide, ds: new Set(['ds-inconnue']) }, TABLE, 'essai.vue'), { message: 'essai.vue : variable inconnue de la table : --v-ds-inconnue' });
  assert.throws(() => jetonsDe({ ...vide, theme: new Set(['inconnue']) }, TABLE, 'essai.vue'), { message: 'essai.vue : variable inconnue de la table : --v-theme-inconnue' });
  const texte = lire(FICHE).replace('- `ds-ecart-entre-etiquettes`', '- `ds-ecart-inconnu`');
  assert.throws(() => ecartsEcrits(texte, FICHE, parNom('Etiquette'), ctx()), { message: `${FICHE} : variable inconnue de la table : ds-ecart-inconnu` });
});

test('U5 bloc contrastes de l\'étiquette ; exception écrite ; paire absente en panne', () => {
  assert.equal(
    genere('Etiquette').contrastes,
    [
      '| Devant | Fond | Plus bas des 10 thèmes | Seuil |',
      '|---|---|---|---|',
      '| `texte.marque` | `fond.marque.discret` | 11,65:1 (Atelier Lavandine, clair) | 4,50:1 |',
      '| `texte.principal` | `fond.composant` | 11,68:1 (Atelier Lavandine, clair) | 4,50:1 |',
    ].join('\n'),
  );
  assert.match(genere('Bouton').contrastes, /^\| `texte\.desactive` \| `fond\.desactive` \| [\d,]+:1 \([^)]+\) \| 4,50:1, exception écrite \|$/m);
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
  const g = genere('Etiquette');
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
  const e = parNom('Etiquette');
  const ecarts = (/** @type {string} */ t) => ecartsEcrits(t, FICHE, e, ctx());
  assert.deepEqual(ecarts(texte), []);
  assert.deepEqual(ecarts(texte.replace('## Refusé', '## Refus')), ['sections : attendu « ## Refusé » en place 3, trouvé « ## Refus »']);
  assert.deepEqual(ecarts(texte.replace(/^Un mot court.*$/m, '')), ['phrase de rôle absente']);
  assert.deepEqual(ecarts(texte.replace(/^(Un mot court.*)pas\.$/m, '$1pas')), ['phrase de rôle sans point final']);
  assert.deepEqual(ecarts(texte.replace(/^- `ton` : .*\n/m, '')), ['option sans sa ligne : ton']);
  assert.deepEqual(ecarts(texte.replace(/^(- `ton` : .*)$/m, '$1\n- `couleur` : une couleur.')), ['ligne d\'une option hors du menu : couleur']);
  assert.deepEqual(ecarts(texte.replace('- D55 : l\'étiquette', '- D99 : l\'étiquette')), ['décision inconnue : D99']);
  assert.deepEqual(ecarts(texte.replace('- B5 : l\'étiquette', '- B99 : l\'étiquette')), ['dette inconnue : B99']);
  assert.deepEqual(ecarts(texte.replace('story « Planche »', 'story « Planche bis »')), ['story inconnue : « Planche bis »']);
  assert.deepEqual(ecarts(texte.replace('<Etiquette texte="Lyon" />', '<Etiquette texte="Lyon" closable />')), ['exemple refusé : étiquette : attribut refusé : closable']);
  assert.deepEqual(ecarts(texte.replace('```vue', '```js')), ['exemple : 0 blocs vue, un attendu']);
});

/** Bloc vue d'essai. @param {string} script @param {string} gabarit */
const vue = (script, gabarit) => `<script setup>\n${script}\n</script>\n\n<template>\n${gabarit}\n</template>`;
const IMPORTS = [
  "import Etiquette from './composants/Etiquette.vue';",
  "import Bouton from './composants/Bouton.vue';",
  "import BoutonIcone from './composants/BoutonIcone.vue';",
  "import Carte from './composants/Carte.vue';",
  "import ChampTexte from './composants/ChampTexte.vue';",
  "import { mdiPencil } from '@mdi/js';",
  "import { icone } from './composants/icone.js';",
  'const Crayon = icone(mdiPencil);',
].join('\n');
const exemple = (/** @type {string} */ gabarit) => () => verifierExemple(vue(IMPORTS, gabarit), menuDe);

test('U8 exemples acceptés, refusés par la fabrique, ou hors grammaire', () => {
  const fiche = lire(FICHE);
  const bloc = /** @type {RegExpExecArray} */ (/^```vue\n([\s\S]*?)\n```$/m.exec(fiche))[1];
  assert.deepEqual(verifierExemple(bloc, menuDe), ['Etiquette']);
  assert.doesNotThrow(exemple('  <BoutonIcone libelle="Modifier" :icone="Crayon" @click="modifier" />'));
  assert.doesNotThrow(exemple('  <Bouton variante="secondaire" :icone="Crayon" @click="modifier">Modifier</Bouton>'));
  assert.doesNotThrow(exemple('  <Carte titre="Atelier du jeudi" :niveau="2">\n    Un texte.\n    <template #actions><Bouton variante="secondaire">S\'inscrire</Bouton></template>\n  </Carte>'));
  assert.doesNotThrow(exemple('  <ChampTexte v-model="courriel" libelle="Courriel" type="email" autocomplete="email" />'));

  const refus = (/** @type {string} */ g, /** @type {string} */ message) => assert.throws(exemple(g), (/** @type {any} */ err) => !(err instanceof HorsGrammaire) && err.message === message, message);
  refus('  <Etiquette texte="Lyon" closable />', 'étiquette : attribut refusé : closable');
  refus('  <Etiquette texte="Lyon" @click="ouvrir" />', 'étiquette : attribut refusé : onClick');
  refus('  <Carte titre="T" niveau="2" />', 'carte : niveau inconnu : 2 (2, 3, 4)');
  refus('  <Carte titre="T" lien="/x"><template #actions><Bouton>Voir</Bouton></template></Carte>', 'carte : lien et actions ensemble refusés');
  refus('  <Carte titre="T"><template #actions><a href="/x">Voir</a></template></Carte>', 'carte : actions : seuls Bouton et BoutonIcone sont admis');
  refus('  <Bouton type="submit" desactive>Envoyer</Bouton>', 'bouton : désactivé refusé sur type=submit');
  // L'enveloppe passe avant son contenu : la carte est refusée avant le bouton de ses actions.
  refus('  <Carte titre="T" niveau="5"><template #actions><Bouton variante="x">V</Bouton></template></Carte>', 'carte : niveau inconnu : 5 (2, 3, 4)');

  const hors = (/** @type {() => unknown} */ f, /** @type {RegExp} */ motif) => assert.throws(f, (/** @type {any} */ err) => err instanceof HorsGrammaire && motif.test(err.message), String(motif));
  hors(exemple('  <Etiquette texte="Lyon" />{{ x }}'), /^exemple hors grammaire : interpolation : \{\{ x \}\}$/);
  hors(exemple('  <Etiquette v-if="vu" texte="Lyon" />'), /^exemple hors grammaire : directive : v-if$/);
  hors(exemple('  <Carte titre="T" :niveau="a + b" />'), /^exemple hors grammaire : expression : a \+ b$/);
  hors(exemple('  <BoutonIcone libelle="Modifier" :icone="Gomme" />'), /^exemple hors grammaire : nom non défini : Gomme$/);
  hors(exemple('  <Inconnue />'), /^exemple hors grammaire : balise inconnue : Inconnue$/);
  hors(() => verifierExemple('<template>\n  <Etiquette texte="Lyon" />\n</template>', menuDe), /^exemple hors grammaire : attendu un <script setup>/);
  hors(() => verifierExemple(vue("import Etiquette from './composants/Etiquette.vue';\nlet x = 1;", '  <Etiquette texte="Lyon" />'), menuDe), /^exemple hors grammaire : ligne de script : let x = 1;$/);
});

test('U9 index de l\'étiquette seule', () => {
  const phrase = 'Un mot court sur un fond teinté, pour classer un membre (ville, secteur) ou mettre une qualité en avant (« Mentor ») ; il ne se clique pas.';
  assert.equal(
    texteIndex([`| \`Etiquette\` | [Étiquette](etiquette.md) | ${phrase} |`]),
    [
      '<!-- genere:index : écrit par npm --prefix atelier run fiches -->',
      '# Fiches des composants',
      '',
      'Une fiche par enveloppe de l\'atelier : son rôle, son menu, ce qu\'elle refuse, ses jetons, son accessibilité, un exemple à copier. Les blocs `genere` de chaque fiche, et cette liste, sont écrits par `npm --prefix atelier run fiches` depuis les menus, les composants et les jetons ; `npm --prefix atelier run fiches -- --verifier` refuse une fiche qui ne leur correspond plus.',
      '',
      '| Composant | Fiche | Rôle |',
      '|---|---|---|',
      `| \`Etiquette\` | [Étiquette](etiquette.md) | ${phrase} |`,
      '<!-- /genere:index -->',
      '',
    ].join('\n'),
  );
  assert.ok(lire('docs/composants/README.md').includes(`| \`Etiquette\` | [Étiquette](etiquette.md) | ${phrase} |`));
});

test('U10 le contrôle des fiches sort en 0 sur le dépôt', () => {
  const sortie = execFileSync(process.execPath, [join(ROOT, 'atelier', 'fiches.js'), '--verifier'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(sortie, /^✓ docs\/composants\/etiquette\.md$/m);
  assert.match(sortie, /^✓ docs\/composants\/README\.md$/m);
  assert.doesNotMatch(sortie, /✗/);
});
