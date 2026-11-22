// @ts-check
/**
 * Le relevé d'un passage (D68, docs/attendus/etape-10-exercices.md ; D69, docs/attendus/etape-10-inventorier.md), sur un
 * travail simulé posé sur le départ de Composer, sans git ni npm ci :
 *   RV1 comptes : chaque composant Ds… (balise, balise en tirets, rendu par h, :is), ce qu'un fichier modifié a de plus
 *       qu'au départ seulement, ni commentaire ni import ; les pièces de Vuetify qui ont un composant Ds…, leurs composés
 *       compris ; un v-btn qui mène ailleurs à part ; les balises nues, les exceptions de style, les feuilles .css ;
 *   RV2 composants créés, hors des pages ; composants, fiches et gabarit modifiés ; la page de l'adresse, d'après les
 *       routes, passe par le gabarit ou non ; un gabarit refait est signalé, ligne par ligne ;
 *   RV3 les cinq signaux de ce que le brief remet à plus tard ; aucun sur la page de référence, qui emploie les six
 *       composants moins le bouton à icône et passe par le gabarit ;
 *   RV4 la commande entière : un passage posé sans installation, un fichier neuf, un modifié, un supprimé ; --relever écrit
 *       pose.json, pose.md, le diff, les échecs de verifier à part et dit que les planches manquent ;
 *   RV5 un inventaire : une pièce trouvée par ses lignes, une manquée, jamais une que la description ne demande pas ; une
 *       ligne de question est marquée ; un composant et un chemin absents du départ ; les lignes hors de la liste ; un
 *       fichier touché en dehors ; rendu ailleurs, ou absent ;
 *   RV6 ce que la session a lu : outil de lecture, commande (dossier changé, DS_LAB, chemin absolu), recherche, skill,
 *       motif et dossier à part, copie de ds-lab ; ni fichier écrit, ni document d'une commande, ni appel compté deux fois.
 */
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exercices, fabriquer } from '../src/banc/departs.js';
import { enveloppes, relever, texteDuReleve } from '../src/banc/releve.js';
import { releverInventaire, texteDeLInventaire } from '../src/banc/inventaire.js';
import { lectures, texteDesLectures } from '../src/banc/lectures.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ENVELOPPES = enveloppes(join(ROOT, 'docs', 'composants'));
/** @type {string} */
let racine;
/** @type {string} */
let depart;

before(() => {
  racine = mkdtempSync(join(tmpdir(), 'ds-lab-releve-'));
  depart = join(racine, 'depart');
  fabriquer({ depot: ROOT, clone: ROOT, exercice: 'composer', app: depart });
});
after(() => rmSync(racine, { recursive: true, force: true }));

/** Pose un travail sur une copie du départ et le relève. @param {string} nom @param {Record<string, string | ((t: string) => string)>} travail */
function passage(nom, travail) {
  const app = join(racine, nom);
  cpSync(depart, app, { recursive: true });
  const touches = Object.entries(travail).map(([fichier, contenu]) => {
    const la = existsSync(join(depart, fichier));
    mkdirSync(dirname(join(app, fichier)), { recursive: true });
    writeFileSync(join(app, fichier), typeof contenu === 'function' ? contenu(readFileSync(join(depart, fichier), 'utf8')) : contenu);
    return { statut: la ? 'M' : 'A', fichier };
  });
  return relever({ app, touches, avant: (f) => readFileSync(join(depart, f), 'utf8'), enveloppes: ENVELOPPES, page: '/annuaire', signaux: exercices(ROOT).signaux });
}
const ROUTE = (/** @type {string} */ t) =>
  t.replace("import Adhesion", "import Annuaire from './pages/Annuaire.vue';\nimport Adhesion").replace('];', "  { path: '/annuaire', name: 'annuaire', component: Annuaire, meta: { titre: 'Annuaire' } },\n];");

test('RV1 comptes des composants, des pièces de Vuetify, des balises nues, des exceptions et des feuilles', () => {
  assert.deepEqual(ENVELOPPES, { VAvatar: 'DsAvatar', VBtn: 'DsButton', VCard: 'DsCard', VChip: 'DsTag', VTextField: 'DsTextInput' });
  const r = passage('rv1', {
    'src/router.js': ROUTE,
    'src/pages/Annuaire.vue': `<script setup>
import { h } from 'vue';
import DsCard from '../components/ds/DsCard.vue';
import DsTag from '../components/ds/DsTag.vue';
// un <DsCard> cité dans un commentaire
const Puce = () => h(DsTag, { text: 'Lyon' });
</script>
<template>
  <!-- <DsCard title="masquée" /> -->
  <DsCard title="Une" /><ds-card title="Deux"><template #actions><DsButton>Écrire</DsButton></template></ds-card>
  <component :is="DsAvatar" name="Noé" />
  <v-card><v-card-text>x</v-card-text></v-card>
  <VTextField label="Nom" />
  <v-btn :to="{ path: '/', query: a > b }">Accueil</v-btn><v-btn href="/x">x</v-btn><v-btn @click="y">y</v-btn>
  <v-btn-toggle-x /><button>nu</button><input />
</template>
<style scoped>
.a {
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- raison. */
  padding: 12px;
}
</style>
`,
    'src/pages/Accueil.vue': (t) => t.replace('<SectionPage', '<DsCard title="De plus" />\n    <SectionPage'),
    'src/styles/annuaire.css': '.a { color: red; }\n',
  });
  assert.deepEqual(r.composants, { DsCard: 3, DsTag: 1, DsButton: 1, DsAvatar: 1 });
  assert.deepEqual(r.vuetifyAvecComposant, { 'VCard (DsCard)': 1, 'VCardText (DsCard)': 1, 'VTextField (DsTextInput)': 1, 'VBtn (DsButton)': 1, 'VBtnToggleX (DsButton)': 1 });
  assert.equal(r.boutonsQuiMenentAilleurs, 2);
  assert.deepEqual(r.balisesNues, { '<button>': 1, '<input>': 1 });
  assert.equal(r.exceptionsDeStyle, 1);
  assert.deepEqual(r.feuillesCss, ['src/styles/annuaire.css']);
  const texte = texteDuReleve(r);
  assert.match(texte, /^- Composants Ds… posés : DsAvatar : 1 ; DsButton : 1 ; DsCard : 3 ; DsTag : 1$/m);
  assert.match(texte, /^- Page \/annuaire : src\/pages\/Annuaire\.vue ; passe par le gabarit : non$/m);
});

test('RV2 composants créés ou modifiés, gabarit employé, modifié ou refait', () => {
  const gabarit = "<script setup>\nimport GabaritPage from '../gabarit/GabaritPage.vue';\n</script>\n<template>\n  <GabaritPage titre=\"Annuaire\">x</GabaritPage>\n</template>\n";
  const r = passage('rv2', {
    'src/router.js': (t) => ROUTE(t).replace("import Annuaire from './pages/Annuaire.vue';\n", '').replace('component: Annuaire', "component: () => import('./pages/Annuaire.vue')"),
    'src/pages/Annuaire.vue': gabarit,
    'src/components/LigneDeMembre.vue': '<template>\n  <div>x</div>\n</template>\n',
    'src/components/ds/DsCard.vue': (t) => `${t}\n`,
    'docs/composants/card.md': (t) => `${t}\n`,
    'src/gabarit/GabaritPage.vue': (t) => t.replace('<h1 class="titre">', '<h1 class="titre" id="t">'),
  });
  assert.deepEqual(r.composantsCrees, ['src/components/LigneDeMembre.vue']);
  assert.deepEqual(r.composantsModifies, ['src/components/ds/DsCard.vue', 'docs/composants/card.md']);
  assert.deepEqual(r.gabaritModifie, ['src/gabarit/GabaritPage.vue']);
  assert.deepEqual(r.page, { adresse: '/annuaire', fichier: 'src/pages/Annuaire.vue', passeParLeGabarit: true, gabaritRefait: [] });

  const refait = passage('rv2-refait', { 'src/router.js': ROUTE, 'src/pages/Annuaire.vue': '<template>\n  <v-main>\n    <h1>Annuaire</h1>\n  </v-main>\n  <footer>x</footer>\n</template>\n' });
  assert.equal(refait.page.passeParLeGabarit, false);
  assert.deepEqual(refait.page.gabaritRefait.map((x) => [x.ligne, x.texte]), [[2, '<v-main>'], [3, '<h1>Annuaire</h1>'], [5, '<footer>x</footer>']]);
  const sans = passage('rv2-sans', { 'src/pages/Annuaire.vue': gabarit });
  assert.deepEqual([sans.page.fichier, sans.page.passeParLeGabarit], [null, null], 'sans route, la page est à lire');
  assert.match(texteDuReleve(sans), /introuvable dans src\/router\.js ; passe par le gabarit : à lire$/m);
});

test('RV3 ce qui devait venir après est signalé ; rien sur la page de référence', () => {
  const r = passage('rv3', {
    'src/router.js': ROUTE,
    'src/pages/Annuaire.vue': `<template>
  <v-tabs />
  <a href="#x">Recherche avancée</a>
  <v-select label="x" />
  <span>Compact</span>
  <v-pagination />
  <!-- <v-pagination /> -->
</template>
`,
  });
  assert.deepEqual(r.plusTard.map((x) => [x.piece, x.ligne]), [
    ['navigation locale', 2],
    ['navigation locale', 3],
    ['recherche avancée', 3],
    ['tri ou filtre', 4],
    ["modes d'affichage", 5],
    ['pages de la liste', 6],
  ]);
  const couche = join(ROOT, 'fixtures', 'banc', 'etendre', 'couche');
  const fichiers = /** @type {string[]} */ (readdirSync(couche, { recursive: true })).filter((f) => statSync(join(couche, f)).isFile());
  const ref = passage('rv3-reference', Object.fromEntries(fichiers.map((f) => [f, readFileSync(join(couche, f), 'utf8')])));
  assert.deepEqual(ref.plusTard, []);
  assert.deepEqual(Object.keys(ref.composants).sort(), ['DsAvatar', 'DsButton', 'DsCard', 'DsTag', 'DsTextInput']);
  assert.deepEqual([ref.vuetifyAvecComposant, ref.balisesNues, ref.exceptionsDeStyle, ref.feuillesCss, ref.page.gabaritRefait], [{}, {}, 0, [], []]);
  assert.equal(ref.page.passeParLeGabarit, true);
});

test('RV4 --relever écrit ce que le passage a posé', () => {
  const args = ['--exercice', 'composer', '--dossier', join(racine, 'passages')];
  /** @param {string[]} a */
  const banc = (a) => spawnSync(process.execPath, [join(ROOT, 'src', 'cli', 'banc.js'), ...args, ...a], { cwd: ROOT, encoding: 'utf8' });
  const p = banc(['--bras', 'A', '--passage', '1', '--modele', 'essai', '--sans-installation']);
  assert.equal(p.status, 0, p.stderr);
  const app = join(racine, 'passages', 'composer', 'A-1', 'app');
  writeFileSync(join(app, 'src', 'router.js'), ROUTE(readFileSync(join(app, 'src', 'router.js'), 'utf8')));
  writeFileSync(join(app, 'src', 'pages', 'Annuaire.vue'), '<template>\n  <DsCard title="x" />\n</template>\n<style scoped>\n.é {\n  padding: 12px;\n}\n</style>\n');
  rmSync(join(app, 'src', 'data', 'evenements.js'));
  const sortie = join(racine, 'releve');
  const r = banc(['--relever', 'A-1', '--sortie', sortie]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `banc : passage composer/A-1 relevé dans ${sortie}\n`);
  const pose = JSON.parse(readFileSync(join(sortie, 'pose.json'), 'utf8'));
  assert.deepEqual([pose.composants, pose.page.fichier, pose.page.passeParLeGabarit], [{ DsCard: 1 }, 'src/pages/Annuaire.vue', false]);
  assert.match(readFileSync(join(sortie, 'pose.md'), 'utf8'), /^- Composants Ds… posés : DsCard : 1$/m);
  const verifier = readFileSync(join(sortie, 'verifier.txt'), 'utf8');
  assert.match(verifier, /^sortie 1$/m);
  assert.deepEqual(JSON.parse(verifier.slice(verifier.indexOf('\n{'))).echecs, { style: { neufs: 1, intouches: 0 } });
  assert.match(readFileSync(join(sortie, 'diff.patch'), 'utf8'), /deleted file mode[\s\S]*evenements|evenements[\s\S]*deleted file mode/);
  assert.match(readFileSync(join(sortie, 'notes.txt'), 'utf8'), /^planches : app non installée \(npm ci\), aucune planche$/m);
});

/** Les fichiers du départ de Composer, en chemins relatifs. */
const fichiersDuDepart = () => /** @type {string[]} */ (readdirSync(depart, { recursive: true })).filter((f) => statSync(join(depart, f)).isFile());

test('RV5 un inventaire face à la liste de référence', () => {
  const { pieces } = JSON.parse(readFileSync(join(ROOT, 'fixtures', 'banc', exercices(ROOT).exercices.inventorier.reference ?? ''), 'utf8'));
  const texte = `# Inventaire de la page

| Pièce | Ce que l'app a |
|---|---|
| Aplat et titre | \`GabaritPage\`, dans \`src/gabarit/GabaritPage.vue\` |
| Photo de la personne | \`DsAvatar\` |
| Pagination | manque ; \`DsPagination\` n'existe pas |
| Carrousel | manque |

1. Les étiquettes : \`DsTag\`, fiche \`docs/composants/tag.md\`.
2. Le pied de formulaire : \`src/components/Pied.vue\`.

## Questions

- Où va la navigation locale ?
- Combien de visites par jour ?
`;
  const r = releverInventaire({
    texte,
    lieu: 'inventaire.md',
    rendu: 'inventaire.md',
    touches: [
      { statut: 'A', fichier: 'inventaire.md' },
      { statut: 'A', fichier: 'src/pages/Annuaire.vue' },
    ],
    depart: fichiersDuDepart(),
    pieces,
  });
  /** @param {string} id */
  const lignesDe = (id) => r.pieces.find((p) => p.id === id)?.lignes.map((l) => [l.ligne, l.question]);
  assert.deepEqual(lignesDe('P2'), [[5, false]]);
  assert.deepEqual(lignesDe('P9'), [[6, false]]);
  assert.deepEqual(lignesDe('P19'), [[7, false]]);
  assert.deepEqual(lignesDe('P13'), [[10, false]]);
  assert.deepEqual(lignesDe('P6'), [[15, true]], 'une pièce que seule une question nomme');
  assert.deepEqual(lignesDe('P5'), []);
  assert.deepEqual(r.touches, [{ statut: 'A', fichier: 'src/pages/Annuaire.vue' }]);
  assert.deepEqual(r.inconnus.map((x) => [x.nom, x.ligne]), [['DsPagination', 7], ['src/components/Pied.vue', 11]]);
  assert.deepEqual(r.horsListe.map((x) => x.ligne), [1, 8, 11], 'ni l’en-tête de tableau, ni le trait, ni la section des questions');
  const md = texteDeLInventaire(r);
  const manquees = md.slice(md.indexOf('## Manquées'), md.indexOf('## Nommées sans'));
  assert.match(manquees, /^- P5 Recherche avancée\. Attendu : manque$/m);
  for (const p of pieces.filter((/** @type {any} */ x) => !x.demande)) assert.ok(!manquees.includes(`- ${p.id} `), p.id);
  assert.match(md, /^ {2}- ligne 15 \(question\) : - Où va la navigation locale \?$/m);
  assert.match(md, /^- Fichiers touchés en dehors : A src\/pages\/Annuaire\.vue$/m);

  const ailleurs = texteDeLInventaire(releverInventaire({ texte, lieu: 'docs/inventaire.md', rendu: 'inventaire.md', touches: [], depart: [], pieces }));
  assert.match(ailleurs, /^- Fichier rendu : docs\/inventaire\.md \(attendu : inventaire\.md, à la racine\)$/m);
  const absent = releverInventaire({ texte: null, lieu: null, rendu: 'inventaire.md', touches: [], depart: [], pieces });
  assert.match(texteDeLInventaire(absent), /^- Fichier rendu : aucun$[\s\S]*^- Pièces demandées : 0 nommées sur 18$/m);
});

test('RV6 ce que la session a lu', () => {
  const app = join(racine, 'rv6', 'app');
  const copie = join(racine, 'rv6', 'ds-lab');
  cpSync(depart, app, { recursive: true });
  mkdirSync(join(copie, 'docs'), { recursive: true });
  writeFileSync(join(copie, 'docs', 'regles.md'), 'x\n');
  let n = 0;
  /** @param {string} name @param {any} input @param {string} [id] */
  const appel = (name, input, id = `t${n++}`) => JSON.stringify({ type: 'assistant', cwd: app, message: { content: [{ type: 'text', text: 'src/pages/Adhesion.vue' }, { type: 'tool_use', id, name, input }] } });
  const journal = join(racine, 'rv6', 'session.jsonl');
  writeFileSync(
    journal,
    [
      appel('Skill', { skill: 'ds-lab' }),
      appel('Read', { file_path: join(app, 'docs/composants/card.md') }, 'double'),
      appel('Read', { file_path: join(app, 'docs/composants/card.md') }, 'double'),
      appel('Bash', { command: 'cd src && cat components/ds/DsCard.vue gabarit/GabaritPage.vue; sed -n 1,20p ../src/data/membres.js' }),
      appel('Bash', { command: 'cat "$DS_LAB/docs/regles.md"; ls docs/composants/*.md src/pages ~/ailleurs/*.md' }),
      appel('Bash', { command: "cat > inventaire.md <<'FIN'\n- src/pages/Accueil.vue\nFIN\ncat README.md" }),
      appel('Grep', { pattern: 'x', path: 'src/pages/Evenements.vue' }),
      appel('Glob', { pattern: 'src/**/*.vue' }),
      appel('Write', { file_path: join(app, 'src/plugins/vuetify.js'), content: '' }),
      'ligne illisible',
      JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', content: 'src/App.vue' }] } }),
    ].join('\n'),
  );
  const l = lectures({ journaux: [journal], app, copie, depart: fichiersDuDepart() });
  assert.deepEqual(l, {
    fichiers: {
      skill: [],
      fiches: ['docs/composants/card.md'],
      composants: ['src/components/ds/DsCard.vue'],
      gabarit: ['src/gabarit/GabaritPage.vue'],
      pages: ['src/pages/Evenements.vue'],
      données: ['src/data/membres.js'],
      'reste de l’app': ['README.md'],
      'copie de ds-lab': ['docs/regles.md'],
    },
    dossiers: ['docs/composants/*.md', 'src/**/*.vue', 'src/pages'],
    skills: ['ds-lab'],
    appels: 8,
  });
  assert.match(texteDesLectures(l), /^- Skills appelés : ds-lab$[\s\S]*^- Fiches : docs\/composants\/card\.md$[\s\S]*^- Dossiers et motifs nommés, à lire : docs\/composants\/\*\.md, /m);
  assert.match(texteDesLectures(lectures({ journaux: [], app, copie, depart: [] })), /^Aucun appel d’outil dans le journal : rien à dire\.$/m);
});
