// @ts-check
/**
 * Le relevé d'un passage (D68, docs/attendus/etape-10-exercices.md), sur un travail simulé posé sur le départ de Composer,
 * sans git ni npm ci :
 *   RV1 comptes : chaque composant Ds… (balise, balise en tirets, rendu par h, :is), ce qu'un fichier modifié a de plus
 *       qu'au départ seulement, ni commentaire ni import ; les pièces de Vuetify qui ont un composant Ds…, leurs composés
 *       compris ; un v-btn qui mène ailleurs à part ; les balises nues, les exceptions de style, les feuilles .css ;
 *   RV2 composants créés, hors des pages ; composants, fiches et gabarit modifiés ; la page de l'adresse, d'après les
 *       routes, passe par le gabarit ou non ; un gabarit refait est signalé, ligne par ligne ;
 *   RV3 les cinq signaux de ce que le brief remet à plus tard ; aucun sur la page de référence, qui emploie les six
 *       composants moins le bouton à icône et passe par le gabarit ;
 *   RV4 la commande entière : un passage posé sans installation, un fichier neuf, un modifié, un supprimé ; --relever écrit
 *       pose.json, pose.md, le diff, les échecs de verifier à part et dit que les planches manquent.
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
