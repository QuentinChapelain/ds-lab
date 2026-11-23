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
 *       motif et dossier à part, copie de ds-lab ; ni fichier écrit, ni document d'une commande, ni appel compté deux fois ;
 *   RV7 le mode libre marqué : pièces du dossier provisoire, pièces créées ailleurs (une à côté de la page, un script qui
 *       rend, pas un script simple), pièces de Vuetify sans composant Ds… hors de ce dossier ; un rapport absent, partiel,
 *       complet, ailleurs ; la page de référence, écrite avant les modes, a deux pièces non marquées.
 * Et D71, docs/attendus/etape-10-relecteur-et-carnet.md :
 *   RV8 les composants Ds… du catalogue à part des autres, les pièces créées ;
 *   RV9 les traces : la session qui porte le brief, l'autre écartée ; les outils et les signaux d'écriture du shell, ni
 *       un document de commande ni une sortie vers /dev/null ; les chemins de /tmp ; les appels du carnet ; les heures du
 *       carnet face à la session et à la première écriture ; le journal du relecteur ; ce qu'une session a chargé, avec
 *       et sans humain ;
 *   RV10 la commande entière sur un passage du bras B : le relecteur joué par ses hooks, le carnet par sa commande, deux
 *       sessions dans un HOME à part ; ecritures.md, heures.md, charge.md, le TMPDIR copié, sortie.txt à 0 ; un relevé
 *       en panne écrit 2 et son message.
 */
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exercices, fabriquer } from '../src/banc/departs.js';
import { enveloppes, relever, texteDuReleve } from '../src/banc/releve.js';
import { releverInventaire, texteDeLInventaire } from '../src/banc/inventaire.js';
import { lectures, texteDesLectures } from '../src/banc/lectures.js';
import { appels, charge, ecritures, heuresDuCarnet, journalDuRelecteur, sessionsDuBrief } from '../src/banc/traces.js';

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

/** Pose un travail sur une copie du départ et le relève. @param {string} nom @param {Record<string, string | ((t: string) => string)>} travail @param {{ provisoire?: string, rapport?: { attendu: string, lieu: string | null }, catalogue?: string[] }} [plus] */
function passage(nom, travail, plus = {}) {
  const app = join(racine, nom);
  cpSync(depart, app, { recursive: true });
  const touches = Object.entries(travail).map(([fichier, contenu]) => {
    const la = existsSync(join(depart, fichier));
    mkdirSync(dirname(join(app, fichier)), { recursive: true });
    writeFileSync(join(app, fichier), typeof contenu === 'function' ? contenu(readFileSync(join(depart, fichier), 'utf8')) : contenu);
    return { statut: la ? 'M' : 'A', fichier };
  });
  return relever({ app, touches, avant: (f) => readFileSync(join(depart, f), 'utf8'), enveloppes: ENVELOPPES, page: '/annuaire', signaux: exercices(ROOT).signaux, ...plus });
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
  assert.match(texte, /^- Composants Ds… du catalogue posés : DsAvatar : 1 ; DsButton : 1 ; DsCard : 3 ; DsTag : 1$/m);
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
  mkdirSync(join(app, 'src', 'provisoire'));
  writeFileSync(join(app, 'src', 'provisoire', 'LignePersonne.vue'), '<template>\n  <v-list-item />\n</template>\n');
  writeFileSync(join(app, 'rapport.md'), '`LignePersonne`, faute de ligne de liste.\n');
  const sortie = join(racine, 'releve');
  const r = banc(['--relever', 'A-1', '--sortie', sortie]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, `banc : passage composer/A-1 relevé dans ${sortie}\n`);
  const pose = JSON.parse(readFileSync(join(sortie, 'pose.json'), 'utf8'));
  assert.deepEqual([pose.composants, pose.page.fichier, pose.page.passeParLeGabarit], [{ DsCard: 1 }, 'src/pages/Annuaire.vue', false]);
  assert.match(readFileSync(join(sortie, 'pose.md'), 'utf8'), /^- Composants Ds… du catalogue posés : DsCard : 1$/m);
  assert.deepEqual(pose.provisoire, { dossier: 'src/provisoire', fichiers: ['src/provisoire/LignePersonne.vue'], ailleurs: [] });
  assert.deepEqual(pose.rapport, { attendu: 'rapport.md', lieu: 'rapport.md', nommes: ['src/provisoire/LignePersonne.vue'], tus: [] });
  assert.equal(readFileSync(join(sortie, 'rapport.md'), 'utf8'), '`LignePersonne`, faute de ligne de liste.\n');
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

test('RV7 le mode libre marqué : pièces marquées ou non, pièces de Vuetify, rapport', () => {
  const plus = { provisoire: 'src/provisoire', rapport: { attendu: 'rapport.md', lieu: null } };
  const travail = {
    'src/router.js': ROUTE,
    'src/pages/Annuaire.vue': '<template>\n  <v-pagination /><VSelect label="x" /><v-select />\n  <v-btn>x</v-btn>\n</template>\n',
    'src/pages/annuaire/LigneDeMembre.vue': '<template>\n  <div>x</div>\n</template>\n',
    'src/provisoire/Pagination.vue': '<template>\n  <v-pagination />\n</template>\n',
    'src/provisoire/index.js': "export { default as Pagination } from './Pagination.vue';\n",
    'src/annuaire/puce.js': "import { h } from 'vue';\nexport const Puce = () => h('span', 'x');\n",
    'src/annuaire/recherche.js': '// un h( en commentaire\nexport const chercher = (l) => l;\n',
  };
  const r = passage('rv7', travail, plus);
  assert.deepEqual(r.provisoire, {
    dossier: 'src/provisoire',
    fichiers: ['src/provisoire/Pagination.vue', 'src/provisoire/index.js'],
    ailleurs: ['src/pages/annuaire/LigneDeMembre.vue', 'src/annuaire/puce.js'],
  });
  assert.deepEqual(r.composantsCrees, ['src/pages/annuaire/LigneDeMembre.vue', 'src/provisoire/Pagination.vue', 'src/annuaire/puce.js']);
  assert.deepEqual([r.vuetifySansComposant, r.vuetifyAvecComposant], [{ VPagination: 1, VSelect: 2 }, { 'VBtn (DsButton)': 1 }]);
  assert.deepEqual([r.rapport?.lieu, r.rapport?.nommes, r.rapport?.tus.length], [null, [], 5]);
  const md = texteDuReleve(r);
  assert.match(md, /^- Créés ailleurs, marquage manqué : src\/pages\/annuaire\/LigneDeMembre\.vue, src\/annuaire\/puce\.js$/m);
  assert.match(md, /^- Pièces de Vuetify sans composant Ds…, hors de src\/provisoire\/, ni du catalogue ni créées : VPagination : 1 ; VSelect : 2$/m);
  assert.match(md, /^- Rapport : aucun ; /m);

  const partiel = passage('rv7-partiel', { ...travail, 'rapport.md': 'J’ai créé `Pagination` et LigneDeMembreBis, et src/annuaire/recherche.js, avec un index.\n' }, { ...plus, rapport: { attendu: 'rapport.md', lieu: 'rapport.md' } });
  assert.deepEqual(partiel.rapport?.nommes, ['src/provisoire/Pagination.vue', 'src/annuaire/recherche.js']);
  assert.deepEqual(partiel.rapport?.tus, ['src/pages/annuaire/LigneDeMembre.vue', 'src/provisoire/index.js', 'src/annuaire/puce.js']);
  const complet = passage('rv7-complet', { ...travail, 'docs/rapport.md': 'Pagination, LigneDeMembre.vue, puce, recherche, src/provisoire/index.js.\n' }, { ...plus, rapport: { attendu: 'rapport.md', lieu: 'docs/rapport.md' } });
  assert.deepEqual(complet.rapport?.tus, []);
  assert.match(texteDuReleve(complet), /^- Rapport : docs\/rapport\.md \(attendu : rapport\.md, à la racine\) ; /m);

  const couche = join(ROOT, 'fixtures', 'banc', 'etendre', 'couche');
  const fichiers = /** @type {string[]} */ (readdirSync(couche, { recursive: true })).filter((f) => statSync(join(couche, f)).isFile());
  const ref = passage('rv7-reference', Object.fromEntries(fichiers.map((f) => [f, readFileSync(join(couche, f), 'utf8')])), plus);
  assert.deepEqual([ref.provisoire?.fichiers, ref.provisoire?.ailleurs.toSorted(), ref.vuetifySansComposant], [[], ['src/modules/MemberRow.vue', 'src/modules/MemberTagList.vue'], {}]);
  const sans = passage('rv7-sans', { 'src/pages/Annuaire.vue': '<template>\n  <p>x</p>\n</template>\n' });
  assert.deepEqual([sans.provisoire, sans.rapport], [null, null]);
  assert.doesNotMatch(texteDuReleve(sans), /marqu|Rapport/);
});

test('RV8 les composants Ds… du catalogue, à part des pièces créées', () => {
  const page = '<template>\n  <DsCard title="x">\n    <DsLinkButton href="/a" />\n    <ds-link-button href="/b" />\n  </DsCard>\n</template>\n';
  const r = passage('rv8', { 'src/router.js': ROUTE, 'src/pages/Annuaire.vue': page, 'src/provisoire/DsLinkButton.vue': '<template>\n  <a />\n</template>\n' }, { catalogue: ['DsButton', 'DsCard'] });
  assert.deepEqual([r.composants, r.autresDs], [{ DsCard: 1 }, { DsLinkButton: 2 }]);
  const texte = texteDuReleve(r);
  assert.match(texte, /^- Composants Ds… du catalogue posés : DsCard : 1$/m);
  assert.match(texte, /^- Autres Ds… posés \(pièces créées, absentes du catalogue\) : DsLinkButton : 2$/m);
});

/** Un journal simulé, une ligne par message. @param {string} fichier @param {object[]} messages */
const journal = (fichier, messages) => writeFileSync(fichier, `${messages.map((m) => JSON.stringify(m)).join('\n')}\n`);
const humain = (/** @type {string} */ t, /** @type {string} */ texte) => ({ type: 'user', timestamp: t, message: { content: texte } });
const outil = (/** @type {string} */ t, /** @type {string} */ name, /** @type {object} */ input) => ({ type: 'assistant', timestamp: t, message: { content: [{ type: 'tool_use', id: `${name}${t}`, name, input }] } });

test('RV9 les traces : session du brief, écritures, /tmp, carnet, relecteur, charge', () => {
  const d = mkdtempSync(join(tmpdir(), 'ds-lab-traces-'));
  const brief = '\nNous sommes dans le gabarit de Quai Nord.\n\nLa suite.\n';
  journal(join(d, 's0.jsonl'), [humain('2026-11-23T14:30:00.000Z', '/exit'), { type: 'assistant', timestamp: '2026-11-23T14:30:30.000Z', message: { content: [{ type: 'text', text: 'au revoir' }] } }]);
  journal(join(d, 's1.jsonl'), [
    humain('2026-11-23T14:31:00.000Z', '<pasted_content>\nNous sommes dans le gabarit de Quai Nord.\n</pasted_content>'),
    outil('2026-11-23T14:32:00.000Z', 'Bash', { command: "cat > src/pages/Annuaire.vue <<'EOF'\n<div v-if=\"a > b\" />\nEOF\nnpm run build 2>&1 | tail -3 > /dev/null" }),
    outil('2026-11-23T14:32:10.000Z', 'Bash', { command: "sed -i '' 's/a b/c d/' src/x.vue && grep -n x src/x.vue" }),
    outil('2026-11-23T14:32:20.000Z', 'Bash', { command: 'cp a.vue src/provisoire/b.vue' }),
    outil('2026-11-23T14:32:30.000Z', 'Bash', { command: "python3 -c \"open('x','w').write('y')\"" }),
    outil('2026-11-23T14:32:40.000Z', 'Edit', { file_path: '/app/rapport.md', old_string: 'a', new_string: 'b' }),
    outil('2026-11-23T14:32:50.000Z', 'Bash', { command: "cat > /tmp/shot.mjs <<'EOF'\nawait page.screenshot({ path: '/tmp/a.png' })\nEOF\nnode /tmp/shot.mjs" }),
    outil('2026-11-23T14:33:00.000Z', 'Bash', { command: 'echo x | tee -a log.txt' }),
    outil('2026-11-23T14:33:05.000Z', 'Bash', { command: "python3 - <<'PY'\nopen('src/y.vue', 'w').write('z')\nPY" }),
    outil('2026-11-23T14:33:06.000Z', 'Bash', { command: "cat > src/z.js <<'EOF'\nfs.writeFileSync(a, b); m.then((x) => console.log(x))\nEOF" }),
    outil('2026-11-23T14:31:30.000Z', 'Bash', { command: 'node "$DS_LAB/src/cli/carnet.js" --question q --choix c --fichier src/pages/Annuaire.vue' }),
    { type: 'assistant', timestamp: '2026-11-23T14:34:00.000Z', message: { content: [{ type: 'text', text: 'Fini.' }] } },
  ]);
  const s = sessionsDuBrief([join(d, 's0.jsonl'), join(d, 's1.jsonl')], brief);
  assert.deepEqual(s, { retenues: [join(d, 's1.jsonl')], ecartees: [{ fichier: 's0.jsonl', debut: '2026-11-23T14:30:00.000Z', fin: '2026-11-23T14:30:30.000Z' }], note: null });
  assert.equal(sessionsDuBrief([join(d, 's0.jsonl')], brief).note, 'aucune session ne porte la première ligne du brief : toutes sont prises');

  const e = ecritures(appels(s.retenues));
  assert.deepEqual(e.parOutil, { Bash: 9, Edit: 1 });
  assert.deepEqual(e.edition, [{ heure: '2026-11-23T14:32:40.000Z', outil: 'Edit', fichier: '/app/rapport.md' }]);
  assert.deepEqual(
    e.shell.map((x) => [x.signe, x.cible]),
    [['>', 'src/pages/Annuaire.vue'], ['sed -i', 'src/x.vue'], ['cp', 'src/provisoire/b.vue'], ['script', null], ['>', '/tmp/shot.mjs'], ['tee', 'log.txt'], ['script', null], ['>', 'src/z.js']],
  );
  assert.deepEqual(e.tmp, ['/tmp/a.png', '/tmp/shot.mjs']);
  assert.equal(e.carnet, 1);
  assert.equal(e.premiere['Annuaire.vue'], Date.parse('2026-11-23T14:32:00.000Z'));

  const carnet = `# Carnet\n\n| Heure | Question | Réponse | Fichier |\n|---|---|---|---|\n| 2026-11-23T15:31:40+01:00 | a \\| b | choix : c | src/pages/Annuaire.vue |\n| 2026-11-23T15:33:30+01:00 | q | choix : c | src/pages/Annuaire.vue |\n| 14:00 | q | c | f |\n| 2026-11-23T19:00:00+01:00 | q | choix : c | — |\n`;
  assert.deepEqual(heuresDuCarnet(carnet, { debut: Date.parse('2026-11-23T14:31:00.000Z'), fin: Date.parse('2026-11-23T14:34:00.000Z') }, e.premiere), [
    { heure: '2026-11-23T15:31:40+01:00', fichier: 'src/pages/Annuaire.vue', datee: true, dansLaSession: true, avantLaPremiereEcriture: true },
    { heure: '2026-11-23T15:33:30+01:00', fichier: 'src/pages/Annuaire.vue', datee: true, dansLaSession: true, avantLaPremiereEcriture: false },
    { heure: '14:00', fichier: 'f', datee: false, dansLaSession: null, avantLaPremiereEcriture: null },
    { heure: '2026-11-23T19:00:00+01:00', fichier: '—', datee: true, dansLaSession: false, avantLaPremiereEcriture: null },
  ]);

  const r = join(d, 'journal.jsonl');
  journal(r, [
    { heure: 'h1', evenement: 'SessionStart', outil: null, relus: [], echecs: 0, code: 0 },
    { heure: 'h2', evenement: 'PostToolUse', outil: 'Bash', relus: ['src/x.vue'], echecs: 1, code: 2 },
    { heure: 'h3', evenement: 'PostToolUse', outil: 'Read', relus: [], echecs: 0, code: 0 },
    { heure: 'h4', evenement: 'Stop', outil: null, relus: ['src/x.vue'], echecs: 1, code: 2 },
    { heure: 'h5', evenement: 'Stop', outil: null, relus: ['src/x.vue'], echecs: 1, code: 0, relanceRefusee: true },
  ]);
  assert.deepEqual(journalDuRelecteur([r]), {
    fichiers: 1,
    parEvenement: { SessionStart: { appels: 1, echecs: 0 }, PostToolUse: { appels: 2, echecs: 1 }, Stop: { appels: 2, echecs: 1 } },
    relancesRefusees: 1,
    changes: [{ heure: 'h2', outil: 'Bash', relus: ['src/x.vue'], echecs: 1 }],
  });

  journal(join(d, 'avec.jsonl'), [
    { type: 'attachment', attachment: { type: 'skill_listing', names: ['ds-lab', 'dataviz', 'claude-in-chrome'] } },
    { type: 'attachment', attachment: { type: 'mcp_instructions_delta', addedNames: ['claude-in-chrome', 'easel'] } },
    { type: 'attachment', attachment: { type: 'deferred_tools_delta', addedNames: ['EndConversation', 'mcp__claude-in-chrome__navigate'] } },
    { type: 'attachment', attachment: { type: 'agent_listing_delta', addedTypes: ['Explore'] } },
  ]);
  const avec = charge(join(d, 'absent.jsonl'), [join(d, 'avec.jsonl')]);
  assert.deepEqual('enPlusDeLaPose' in avec && avec.enPlusDeLaPose, { skills: ['dataviz', 'claude-in-chrome'], serveursMcp: ['claude-in-chrome', 'easel'], outilsMcp: ['mcp__claude-in-chrome__navigate'], plugins: [] });
  journal(join(d, 'session.jsonl'), [{ type: 'system', subtype: 'init', model: 'm', tools: ['Bash', 'Read'], mcp_servers: [], skills: ['ds-lab', 'dataviz'], plugins: [{ name: 'easel', path: '/x' }], agents: ['Explore'] }]);
  const seul = charge(join(d, 'session.jsonl'), [join(d, 'avec.jsonl')]);
  assert.deepEqual('enPlusDeLaPose' in seul && [seul.source, seul.enPlusDeLaPose], ['session.jsonl, message d’ouverture', { skills: ['dataviz'], serveursMcp: [], outilsMcp: [], plugins: ['easel'] }]);
  rmSync(d, { recursive: true, force: true });
});

test('RV10 le relevé d’un passage du bras B : relecteur, carnet, sessions, TMPDIR, code de sortie', () => {
  const passages = join(racine, 'rv10');
  const maison = join(racine, 'maison');
  /** @param {string[]} a @param {Record<string, string>} [env] */
  const banc = (a, env = {}) => spawnSync(process.execPath, [join(ROOT, 'src', 'cli', 'banc.js'), '--exercice', 'composer', '--dossier', passages, ...a], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ...env } });
  assert.equal(banc(['--bras', 'B', '--passage', '1', '--modele', 'essai', '--sans-installation']).status, 0);
  const dossier = join(passages, 'composer', 'B-1');
  const app = join(dossier, 'app');
  // L'environnement d'une session lancée par depart.txt : l'env des réglages, et TMPDIR posé par la commande.
  const env = { ...JSON.parse(readFileSync(join(app, '.claude', 'settings.local.json'), 'utf8')).env, TMPDIR: join(dossier, 'tmp') };
  const commande = JSON.parse(readFileSync(join(app, '.claude', 'settings.json'), 'utf8')).hooks.PostToolUse[0].hooks[0].command;
  /** Un hook du passage, tel que Claude Code le lance. @param {object} entree */
  const hook = (entree) => spawnSync('/bin/sh', ['-c', commande], { cwd: app, encoding: 'utf8', env: { ...process.env, ...env }, input: JSON.stringify({ session_id: 's1', cwd: app, ...entree }) });
  assert.equal(hook({ hook_event_name: 'SessionStart', source: 'startup' }).status, 0);
  const avant = Date.now();
  const c = spawnSync(process.execPath, [join(env.DS_LAB, 'src', 'cli', 'carnet.js'), '--question', 'Lien ou bouton ?', '--choix', 'un lien', '--fichier', 'src/components/Shell.vue'], { cwd: join(app, 'src'), encoding: 'utf8' });
  assert.equal(c.status, 0, c.stderr);
  mkdirSync(join(app, 'src', 'components'), { recursive: true });
  assert.equal(spawnSync('/bin/sh', ['-c', "cat > src/components/Shell.vue <<'FIN'\n<template><div class=\"b\" /></template>\n<style scoped>\n.b {\n  padding: 12px;\n}\n</style>\nFIN\n"], { cwd: app }).status, 0);
  assert.equal(hook({ hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command: 'cat > …' } }).status, 2);
  writeFileSync(join(env.TMPDIR, 'shot.mjs'), 'capture\n');

  const iso = (/** @type {number} */ ms) => new Date(avant + ms).toISOString();
  const journaux = join(maison, '.claude', 'projects', realpathSync(app).replace(/[^a-zA-Z0-9]/g, '-'));
  mkdirSync(journaux, { recursive: true });
  journal(join(journaux, 's0.jsonl'), [humain(iso(-600_000), '/exit')]);
  journal(join(journaux, 's1.jsonl'), [
    { type: 'attachment', attachment: { type: 'skill_listing', names: ['ds-lab', 'dataviz'] } },
    humain(iso(-120_000), readFileSync(join(dossier, 'brief.txt'), 'utf8')),
    outil(iso(-1_000), 'Bash', { command: 'cd src && node "$DS_LAB/src/cli/carnet.js" --question "Lien ou bouton ?" --choix "un lien" --fichier src/components/Shell.vue' }),
    outil(iso(60_000), 'Bash', { command: "cat > src/components/Shell.vue <<'FIN'\n…\nFIN" }),
    { type: 'assistant', timestamp: iso(120_000), message: { content: [{ type: 'text', text: 'Fini.' }] } },
  ]);
  const sortie = join(racine, 'releve-rv10');
  const r = banc(['--relever', 'B-1', '--sortie', sortie], { HOME: maison });
  assert.equal(r.status, 0, r.stderr);
  const lire = (/** @type {string} */ f) => readFileSync(join(sortie, f), 'utf8');
  assert.equal(lire('sortie.txt'), '0\n');
  const ec = lire('ecritures.md');
  assert.match(ec, /^- Sessions prises : s1\.jsonl$/m);
  assert.match(ec, /^- Sessions écartées, sans le brief : s0\.jsonl \(/m);
  assert.match(ec, /^Journal lu dans le TMPDIR du passage \(1 session\(s\)\)\.$/m);
  assert.match(ec, /^- SessionStart : 1 appel\(s\), 0 retour\(s\) en échec$/m);
  assert.match(ec, /^- PostToolUse : 1 appel\(s\), 1 retour\(s\) en échec$/m);
  assert.match(ec, /^ {2}- \S+ Bash : src\/components\/Shell\.vue \(1 échec\(s\)\)$/m);
  assert.match(ec, /^- Lignes : 1 ; appels de carnet\.js dans le journal : 1$/m);
  assert.match(ec, /^ {2}- \S+ : dans la session ; avant la première écriture vue de src\/components\/Shell\.vue$/m);
  assert.match(ec, /^- TMPDIR du passage, ce qu’il contient : ds-lab-relecteur\/s1\/depart\.json, ds-lab-relecteur\/s1\/dernier\.json, ds-lab-relecteur\/s1\/journal\.jsonl, shot\.mjs$/m);
  assert.equal(lire('tmp/shot.mjs'), 'capture\n');
  assert.match(lire('heures.md'), /^- Sessions écartées, sans le brief : s0\.jsonl \(/m);
  assert.match(lire('heures.md'), /^- En tout : 4 min$/m);
  assert.match(lire('charge.md'), /^- Skills : dataviz$/m);
  assert.match(lire('pose.md'), /^- Composants Ds… du catalogue posés : aucun$/m);

  assert.equal(banc(['--bras', 'B', '--passage', '2', '--modele', 'essai', '--sans-installation']).status, 0);
  rmSync(join(passages, 'composer', 'B-2', 'app', '.git'), { recursive: true, force: true });
  const panne = join(racine, 'releve-rv10-panne');
  const p = banc(['--relever', 'B-2', '--sortie', panne], { HOME: maison });
  assert.equal(p.status, 2);
  assert.match(readFileSync(join(panne, 'sortie.txt'), 'utf8'), /^2 : .+\n$/);
});

