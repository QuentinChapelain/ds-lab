// @ts-check
/**
 * Le skill ds-lab, pour une équipe externe (D66, docs/attendus/etape-9-skill.md). Attendus écrits à la main avant le
 * code ; chaque compte est relu par le test dans docs/regles.md, jamais écrit ici :
 *   SK1 les fichiers générés de skill/ds-lab/ égalent la sortie du générateur, et le dossier n'en a pas d'autres que
 *       ceux-là et SKILL.md (DOC2) ;
 *   SK2 regles.md porte chaque règle et chaque défaut de docs/regles.md, une ligne chacun ; aucune proposition qui
 *       commence par « ds-lab » ; « Contrôle dans ce dépôt » vaut `verifier` (<contrôles cités>) si le contrôle de
 *       ds-lab commence par « Relit » et cite contraste, espacements, typo ou style, sinon « Non contrôlée ici » ; le
 *       compte de ces deux cas est écrit en tête de regles.md et de SKILL.md ;
 *   SK3 consignes.md porte chaque consigne, techniques/vuetify.md chaque ligne de docs/techniques/vuetify.md ;
 *   SK4 SKILL.md : nom et description en tête ; chaque fichier et chaque commande qu'il cite existent, chaque option
 *       de verifier qu'il cite est lue par verifier ; 500 mots au plus hors code, la mesure de DOC5 ;
 *   SK5 le retrait des choix de ds-lab : une proposition après « ; » ou « . », le renvoi « (de XX<n>) » gardé, un
 *       « ds-lab » au milieu d'une phrase gardé ; une cellule qui commence par « ds-lab » est une panne qui nomme
 *       le numéro ;
 *   SK6 SKILL.md porte la phrase de priorité, mot pour mot, à la fin de « Avant de commencer » : le clone l'emporte
 *       sur le guide ;
 *   SK7 SKILL.md dit la commande qui lit DS_LAB, mot pour mot, avant la première commande qui s'en sert (D70).
 *   SK8 la section « Conduire » (D72, D74) : sa première phrase dit quand elle joue (une adresse, un fichier de projet,
 *       le skill appelé sans autre demande), dans SKILL.md comme dans conduire.md ; elle cite contexte.md puis
 *       conduire.md ; contexte.md dit, pour chaque étape (Site, Constat, Marque, Décisions, Livraison, Suivi), ce que
 *       font l'outil et l'humain ; jamais « conforme » dit d'un site ou d'un produit ;
 *   SK9 conduire.md porte la voix en tête (la charte, les mots à éviter, trois exemples), sans rien à réciter : ni
 *       « mot pour mot », ni bloc recopié ; SKILL.md dit quoi faire sous un autre Node que le 24 ;
 *   SK10 contexte.md (D74) : 400 mots au plus, la mesure de SK4 ; ses parties dans l'ordre ; le lancement, seul texte
 *       dit tel quel, entre ses deux marques, deux messages au plus, le dernier demande l'adresse ; aucun texte entre
 *       guillemets ; aucun mot à éviter (mots de l'outil, « Bienvenue », « conforme » dit d'un site, l'interface).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fichiersDuSkill, sourcesDuSkill, sansChoixDeDsLab, SKILL } from '../src/report/skill.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const lire = (/** @type {string} */ f) => readFileSync(join(SKILL, f), 'utf8');
const REGLES = readFileSync(join(ROOT, 'docs', 'regles.md'), 'utf8');
const NON = 'Non contrôlée ici';

/** Lignes numérotées de docs/regles.md, par section. */
function sourceParSection() {
  /** @type {Record<string, string[][]>} */
  const out = {};
  let s = '';
  for (const l of REGLES.split('\n')) {
    if (l.startsWith('## ')) s = l.slice(3);
    if (/^\| [A-Z]+\d+ \|/.test(l)) (out[s] ??= []).push(l.split('|').slice(1, -1).map((c) => c.trim()));
  }
  return out;
}
/** Lignes numérotées d'un fichier généré : numéro → cellules. @param {string} md */
const lignesDe = (md) => new Map(md.split('\n').filter((l) => /^\| [A-Z]+\d+ \|/.test(l)).map((l) => { const c = l.split('|').slice(1, -1).map((x) => x.trim()); return [c[0], c]; }));

test('SK1 les fichiers du skill égalent la sortie du générateur', () => {
  const attendus = fichiersDuSkill(sourcesDuSkill());
  for (const [f, texte] of Object.entries(attendus)) assert.equal(lire(f), texte, `${f} : relancer npm run skill`);
  const presents = /** @type {string[]} */ (readdirSync(SKILL, { recursive: true })).filter((f) => statSync(join(SKILL, f)).isFile()).sort();
  assert.deepEqual(presents, Object.keys(attendus).sort());
});

test('SK2 regles.md : chaque règle et défaut, sa colonne, le compte en tête', () => {
  const src = sourceParSection();
  const regles = Object.entries(src).filter(([s]) => s !== 'Défauts' && s !== 'Consignes').flatMap(([, l]) => l.map((c) => ({ numero: c[0], controle: c[4] })));
  const defauts = src['Défauts'].map((c) => ({ numero: c[0], controle: c[5] }));
  const tous = [...regles, ...defauts];
  const md = lire('regles.md');
  const gen = lignesDe(md);
  assert.deepEqual([...gen.keys()], tous.map((x) => x.numero));
  let ici = 0;
  for (const x of tous) {
    const cites = ['contraste', 'espacements', 'typo', 'style'].filter((c) => x.controle.includes(`npm run ${c}`));
    const attendu = x.controle.startsWith('Relit') && cites.length ? `\`verifier\` (${cites.join(', ')})` : NON;
    if (attendu !== NON) ici++;
    assert.equal(gen.get(x.numero)?.at(-1), attendu, x.numero);
  }
  assert.ok(ici > 0 && ici < tous.length);
  for (const f of ['regles.md', 'consignes.md', 'techniques/vuetify.md']) assert.doesNotMatch(lire(f), /[;.]\s+ds-lab\b/, f);
  const phrase = `Dans ce dépôt, \`verifier\` contrôle ${ici} des ${tous.length} règles et défauts ; ${tous.length - ici} ne sont pas contrôlés ici. Pour une règle « ${NON} », rien ne bloque : l'agent la tient en la lisant.`;
  assert.ok(md.includes(phrase), 'regles.md');
  assert.ok(lire('SKILL.md').includes(phrase), 'SKILL.md');
});

test('SK3 consignes et techniques : chaque ligne de leur source', () => {
  assert.deepEqual([...lignesDe(lire('consignes.md')).keys()], sourceParSection()['Consignes'].map((c) => c[0]));
  for (const f of readdirSync(join(ROOT, 'docs', 'techniques')).filter((x) => x.endsWith('.md'))) {
    const source = [...lignesDe(readFileSync(join(ROOT, 'docs', 'techniques', f), 'utf8')).keys()];
    assert.ok(source.length > 0, f);
    assert.deepEqual([...lignesDe(lire(`techniques/${f}`)).keys()], source, f);
  }
});

test('SK4 SKILL.md : en-tête, fichiers et commandes qui existent, une page', () => {
  const md = lire('SKILL.md');
  assert.match(md, /^---\nname: ds-lab\ndescription: .{40,}\n---\n/);
  const chemins = [...md.matchAll(/\$DS_LAB\/([\w./-]+)/g)].map((m) => m[1]);
  assert.ok(chemins.length >= 3, 'commandes citées');
  for (const c of chemins) assert.ok(existsSync(join(ROOT, c)), c);
  const verifier = readFileSync(join(ROOT, 'src', 'cli', 'verifier.js'), 'utf8');
  for (const l of md.split('\n').filter((x) => x.includes('verifier.js')))
    for (const [, o] of l.matchAll(/--([a-z-]+)/g)) assert.ok(verifier.includes(`${o}: { type:`), `option --${o}`);
  for (const f of ['regles.md', 'consignes.md', 'techniques/vuetify.md']) assert.ok(md.includes(`\`${f}\``) && existsSync(join(SKILL, f)), f);
  for (const f of ['docs/contrat-de-marque.md', 'atelier/composants/']) assert.ok(md.includes(f) && existsSync(join(ROOT, f)), f);
  const corps = md.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/`[^`]*`/g, '');
  assert.ok(corps.split(/\s+/).filter((m) => /\p{L}/u.test(m)).length <= 500, 'plus de 500 mots');
});

test('SK5 retrait des choix de ds-lab', () => {
  assert.equal(sansChoixDeDsLab('a ; ds-lab y ajoute b ; c', 'X1'), 'a ; c');
  assert.equal(sansChoixDeDsLab('a (b). ds-lab : le préfixe vaut `Ds`', 'X1'), 'a (b)');
  assert.equal(sansChoixDeDsLab("a ; ds-lab écrit en français, c'est son choix (de NM1)", 'X1'), 'a (de NM1)');
  assert.equal(sansChoixDeDsLab('chaque mot propre à ds-lab est au glossaire', 'X1'), 'chaque mot propre à ds-lab est au glossaire');
  assert.throws(() => sansChoixDeDsLab('ds-lab : tout', 'NM9'), /^Error: skill : NM9, la cellule commence par « ds-lab » et ne se détache pas : écrire le choix de ds-lab dans une proposition à part, après « ; » ou « \. »$/);
});

test('SK6 la phrase de priorité, à la fin de « Avant de commencer »', () => {
  const md = lire('SKILL.md');
  const section = md.slice(md.indexOf('## Avant de commencer'), md.indexOf('## Quatre mots'));
  const phrase = "Le code fait foi sur ce guide : si une commande, un fichier ou une règle du clone contredit ce guide, suivre le clone et signaler l'écart à l'humain.";
  assert.equal(section.trimEnd().split('\n').at(-1), phrase);
});

test('SK7 la commande qui lit DS_LAB, avant celles qui s’en servent', () => {
  const md = lire('SKILL.md');
  const ou = md.indexOf("`printenv DS_LAB` donne le chemin du clone ; s'il ne rend rien, demander à l'humain.");
  assert.ok(ou > 0 && ou < md.indexOf('$DS_LAB/'));
  assert.doesNotMatch(md, /n'est pas posée/, 'une condition que le modèle croit sans la lire');
});

test('SK8 la section « Conduire » : quand elle joue, la fiche puis la conduite, ce que fait chaque étape', () => {
  const md = lire('SKILL.md');
  const section = md.slice(md.indexOf('## Conduire'), md.indexOf('## Dans la CI'));
  const SEUL = "Seulement si l'humain donne une adresse, ou plusieurs, un fichier de projet (`projet.json`), ou appelle le skill sans autre demande.";
  assert.ok(section.split('\n')[2].startsWith(SEUL), section);
  assert.ok(section.indexOf('`contexte.md`') > 0 && section.indexOf('`contexte.md`') < section.indexOf('`conduire.md`'), 'contexte.md, puis conduire.md');
  const c = lire('conduire.md');
  assert.ok(c.split('\n')[2].startsWith(SEUL));
  const x = lire('contexte.md');
  const etapes = x.slice(x.indexOf('## Les étapes')).split('\n').filter((l) => /^\| [^-|]/.test(l)).slice(1).map((l) => l.split('|').slice(1, -1).map((y) => y.trim()));
  assert.deepEqual(etapes.map((e) => e[0]), ['Site', 'Constat', 'Marque', 'Décisions', 'Livraison', 'Suivi']);
  for (const e of etapes) assert.ok(e.length === 3 && e[1] && e[2], e[0]);
  for (const t of [section, c, x]) assert.doesNotMatch(t, /\b(?:site|produit)s? conformes?\b|\bconformes? (?:le |la )?(?:site|produit)/i);
});

test('SK9 conduire.md : la voix en tête, rien à réciter ; Node dans SKILL.md', () => {
  const c = lire('conduire.md');
  const titres = [...c.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.equal(titres[0], 'La voix');
  const voix = c.slice(c.indexOf('## La voix'), c.indexOf(`## ${titres[1]}`));
  for (const t of ['| Règle | Détail |', '| À éviter | Pourquoi |', '| Moment | À éviter | À suivre |']) assert.ok(voix.includes(t), t);
  assert.equal(voix.split('\n').filter((l) => /^\| (?:Fin de la mesure|Une décision|Une limite) \|/.test(l)).length, 3);
  assert.doesNotMatch(c, /mot pour mot|<!--|verbes d'atelier/i, 'un texte à réciter, ou le décor retiré');
  const avant = lire('SKILL.md').slice(0, lire('SKILL.md').indexOf('## Quatre mots'));
  assert.match(avant, /Node 24 : .*Chercher alors un Node 24 installé/);
});

test('SK10 contexte.md : une page, ses parties, le lancement seul texte fixe, aucun mot à éviter', () => {
  const x = lire('contexte.md');
  const corps = x.replace(/`[^`]*`/g, '');
  assert.ok(corps.split(/\s+/).filter((m) => /\p{L}/u.test(m)).length <= 400, 'plus de 400 mots');
  const titres = [...x.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(titres, ['Le lancement', "Ce qu'est ds-lab", "L'objectif", "Comment il s'y prend", 'Quatre temps, trois portes', 'Les étapes', "Ce qu'il ne fait pas aujourd'hui", 'Les mots']);
  const m = /<!-- lancement -->\n([\s\S]*?)\n<!-- \/lancement -->/.exec(x);
  assert.ok(m, 'le lancement entre ses deux marques');
  const messages = m[1].split(/\n\s*\n/).map((y) => y.trim()).filter(Boolean);
  assert.ok(messages.length >= 1 && messages.length <= 2, 'deux messages au plus');
  assert.match(messages.at(-1), /adresse/, "le dernier message demande l'adresse");
  assert.match(messages[0], /^ds-lab /);
  assert.equal((x.match(/<!--/g) ?? []).length, 2, 'un seul bloc');
  assert.doesNotMatch(x, /[«»]/, 'un texte entre guillemets');
  assert.doesNotMatch(x, /\b(?:réduction|proches?|d'office|rattachement|resolver|manifeste|verdict|bienvenue|other|formulaire)\b|Autre »/i, 'un mot à éviter');
});
