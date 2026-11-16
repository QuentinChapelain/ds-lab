Étape 5, lot 5c : deux outils d'analyse dans la CI. Ce message fait 45 lignes, de cette ligne à FIN-DU-MESSAGE comprises ; compte-les avec un outil avant de commencer, et arrête-toi si le compte diffère.

L'attendu est ce message : verse-le dans docs/attendus/etape-5c-outils.md, confronte-le au dépôt, réponds aux questions Q1 à Q5 avec des mesures, puis propose ton plan. Ne modifie rien d'autre avant mon accord.

## Départ

- main après la fusion des lots 5a et 5b (372470e), CI verte. Branche : etape-5c.
- Dette inscrite : exports jamais importés (91 au recompte du lot 4, méthode non écrite) ; « pas de lint » ; TypeScript 7 sans API JavaScript, à vérifier pour Knip et dependency-cruiser.
- Veille du 16/11/2026 : Knip 6 lit le code avec oxc et n'a plus de dépendance à TypeScript ; dependency-cruiser n'annonce TypeScript 7 qu'à partir de la 7.1, mais son analyseur par défaut pour du JavaScript est acorn [H : il tourne sans TypeScript sur ce dépôt].

## But

Deux questions que personne ne relit à la main, posées par la CI à chaque push : qu'est-ce qui ne sert plus (fichiers, exports, dépendances), et qui importe qui (cycles, modules orphelins). Les deux outils sont réutilisés, pas réécrits.

## Ce qui entre

1. Knip 6 en dépendance de développement, version exacte ; une configuration à la racine ; une commande npm run knip qui sort en 0 quand rien ne traîne.
2. dependency-cruiser en dépendance de développement, version exacte ; une configuration à la racine ; une commande npm run dependances. Règles : aucun cycle, aucun module orphelin dans src/. Les règles de couches restent dans test/couches.test.js, seules : une règle n'a qu'une définition.
3. Deux étapes de plus dans .github/workflows/ci.yml, après npm run types, une par commande.
4. Ce que Knip trouve est traité, pas masqué : un export inutile perd le mot export, un fichier ou une dépendance morte est retiré. Une exception se nomme dans la configuration avec sa raison (fonction de page sérialisée, constante lue par un test).
5. Documentation : README, ARCHITECTURE.md (commandes, dépendances, invariants), CLAUDE.md (les deux commandes rejoignent la règle d'avant commit), KNOWN_ISSUES.md (la ligne des exports et celle de TypeScript 7 sont fermées ou réécrites selon le résultat).

## Règle du lot

- Aucune sortie de l'outil ne change : captures avant et après des réductions de fixtures, de la saisie des quatre marques et des trois contrôles, identiques à l'octet (l'ordre des feuilles de l'audit neutralisé, dette connue).
- npm test ne perd aucun vert ; les trois contrôles et npm run types restent à 0 ; la CI est verte à la fin.
- Point d'arrêt : si un outil demande TypeScript 5 ou 6, ou une dépendance de plus que lui-même, arrête-toi et dis laquelle.
- Point d'arrêt : si retirer un export, un fichier ou une dépendance change un comportement ou casse un test, arrête-toi sur celui-là.
- Point d'arrêt : si Knip signale plus de 150 éléments ou si dependency-cruiser trouve un cycle, rends les comptes et attends : la correction devient un lot à part.

## Questions de confrontation

Q1. Dernières versions de knip et de dependency-cruiser au registre npm, leur date, leurs dépendances de pair, et le nombre de paquets que chacune ajoute au verrou. L'une demande-t-elle le paquet typescript à l'exécution sur ce dépôt ?
Q2. Knip lancé sans rien corriger, avec pour entrées les fichiers de src/cli/, les tests et test/helpers/demo.js : comptes par catégorie (fichiers, exports, types, dépendances, dépendances non listées). Compare aux 91 exports de la dette.
Q3. Parmi les exports signalés, lesquels sont des fonctions de page sérialisées ou des constantes qu'un test lit autrement que par un import ? Comment les reconnais-tu ?
Q4. dependency-cruiser lancé sans rien corriger : cycles, orphelins. Voit-il les couches comme test/couches.test.js les voit ?
Q5. Durée de chaque commande sur le Mac.

## Commits

(0) attendu ; (1) outils, configurations et commandes, CI rouge si quelque chose traîne ; (2) corrections ; (3) CI et documentation. Pousse après chaque commit. Ne fusionne pas : Claude vérifie d'abord.

Accord de Quentin, porté par ce message : deux dépendances de développement, knip et dependency-cruiser, en version exacte.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

- Compte du message : 45 lignes (`wc -l`) [F]. Mesures faites sur une copie du dépôt à 372470e, hors du dépôt, avec knip 6.45.1 et dependency-cruiser 18.8.0 (17.4.3 pour la ligne de commande sous Node 25).
- Q1 [F] : knip 6.45.1 (11/11/2026) et dependency-cruiser 18.8.0 (16/11/2026), sans dépendance de pair. Au verrou : knip ajoute 62 entrées (18 paquets installés et 44 binaires d'oxc propres à chaque système), dependency-cruiser 43 ; 104 à eux deux, un paquet étant partagé. Aucun ne charge le code de TypeScript : tous deux ne lisent que `typescript/package.json`, knip pour rattacher le binaire `tsc` du script `types`, dependency-cruiser pour lire la version et écarter la 7.0. Sans le paquet, dependency-cruiser rend le même graphe, knip ne signale que `tsc` non listé.
- Node 25 : dependency-cruiser demande `node ^22||^24||>=26` depuis la 18.0.0, et sa ligne de commande refuse de démarrer sous une autre version (garde dans la ligne de commande, sans option pour la passer) [F]. Le Mac tournait sous Node 25.6.1, en fin de vie depuis le 01/06/2026 selon le calendrier de Node [F].
- Q2 [F] : knip, entrées `src/cli/*.js`, `test/**/*.test.js` et `test/helpers/demo.js` : 0 fichier, 72 exports dans 24 fichiers, 0 type, 0 dépendance, 0 dépendance non listée (seul dependency-cruiser, qu'aucun script n'appelait encore). La même configuration trouve les mêmes 72 noms à la fin du lot 4 (027c7f7), un seul ayant changé de fichier depuis (`tokenValue`) : l'écart avec les 91 de la dette vient de l'ancienne méthode, pas du code. Knip ne suit pas les `@typedef` JSDoc [H] : le 0 des types ne mesure rien.
- Q3 [F] : quatre fonctions de page sérialisées parmi les 72 (`collectInPage`, `toolbarInPage`, `versionInPage`, `touchedInPage`), reconnues à leur passage dans `page.evaluate(…)` ou dans `${f.toString()}`. Retirer `export` ne change pas le texte qu'en donne `toString()`. Aucune constante n'est lue par un test autrement que par un import : les noms trouvés dans `test/` sont des homonymes (constantes locales, prose, clés JSON), aucun test ne lit ces noms dans le texte de `src/` ni dans un type `import('…').X`, et les deux imports par espace de noms (`P`, `resolver`) ne parcourent pas le module. Chacun des 72 est employé dans son propre fichier : aucun ne devient du code mort.
- Q4 [F] : aucun cycle, aucun orphelin, aucun import non résolu (183 modules, 1 022 liens). Sur `src/`, les 182 liens sont ceux que lit `test/couches.test.js`. Côté tests, dependency-cruiser voit en plus 14 imports dynamiques (aucun vers `src/cli/`) ; l'expression régulière de `test/couches.test.js` voit un faux lien, tiré d'un commentaire de `test/roles-statuts.test.js:11`.
- Q5 [F], sur le Mac, sous Node 25 : knip 0,31 à 0,34 s (1,1 s au premier lancement par npx) ; dependency-cruiser 18.8.0 par son API 0,29 à 0,32 s ; 17.4.3 en ligne de commande 0,52 à 0,79 s ; `npm run types` 0,32 s pour comparer.
- `engines` du dépôt dit `>=22` ; knip demande `>=22.12.0`, `watskeburt` (dépendance de dependency-cruiser) `^22.13` : dette, sans changement.
- Commits : les deux étapes de la CI entrent dès le commit (1), pour que la CI soit rouge tant que les exports traînent ; le commit (3) ne garde que le commentaire de `ci.yml` et la documentation.

### Décisions de Quentin (17/11/2026)

- Le Mac passe à Node 24 LTS, dernière version (24.22.3, 10/11/2026), pour ds-lab seulement ; dependency-cruiser 18.7.2 (02/11/2026), pas la 18.8.0 publiée quelques heures avant ; knip 6.45.1.
- Aucune exception pour knip : les 72 `export` sont retirés.
- Dette inscrite sans correction : le faux lien de l'expression régulière de `test/couches.test.js`, l'écart entre `engines` et `watskeburt`, le suivi des `@typedef` par knip.

### Changement de Node sur le Mac

- Avant : Node 25.6.1 installé par Homebrew, seul et global, sans gestionnaire de versions [F]. `brew install node@24` écarté : il installe 15 dépendances partagées avec le Node 25 (simdjson, libuv, c-ares, brotli, icu4c) ; leur mise à jour peut casser le Node 25, que Homebrew passerait alors en 26 pour tous les projets [H].
- Fait : fnm 1.39.0 par Homebrew (une formule, sans dépendance) ; Node 24.22.3 installé par fnm, `fnm default system` ; dans `~/.zshrc`, un crochet de changement de dossier qui prend la version de `.node-version` dans ds-lab et le Node du système partout ailleurs ; `.node-version` (24.22.3) entre dans le dépôt. Un premier essai avec `fnm env --use-on-cd` était trop large : il changeait aussi le Node d'autres projets du Mac (l'un passé en 24, un autre en échec sur son `.nvmrc`) ; remplacé [F].
- Vérifié [F] : Node 24.22.3 et npm 11.19.1 dans ds-lab et ses sous-dossiers, Node 25.6.1 dans les autres projets. Sous Node 24 : `npm ci` sans changement du verrou, `npm run types` et les trois contrôles à 0, `npm test` 822 tests, 822 verts (les deux tests des noms interdits tournent, la liste étant sur le Mac). Aucun test ne casse sous 24.
- La CI reste sous Node 22, borne basse de `engines`.
