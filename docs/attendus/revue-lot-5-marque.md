Nettoyage après la revue, lot 5 : marque en dur et copie figée. Ce message est l'attendu. Ouvre la branche revue-lot-5 depuis main (027c7f7), verse-le dans docs/attendus/revue-lot-5-marque.md, confronte-le au code, propose un plan et attends.

Avant tout : compte les lignes de ce message entre « Nettoyage » et FIN-DU-MESSAGE et dis le nombre. Il doit y en avoir 43 lignes non vides. Sinon, arrête-toi : le collage l'a abîmé.

CONTEXTE
Constat T6 de la passe 1b : « Orbe Café » en dur dans du code commun. Constat de la copie figée : KNOWN_ISSUES.md, section de la revue. Quentin refuse le sur-mesure par marque : une règle vaut pour toutes les marques ou n'existe pas.

CE QUI ENTRE
1. Marque par défaut : les commandes qui prennent Orbe Café quand aucune marque n'est donnée.
2. Planches : nom de la marque écrit dans les titres et les textes d'essai ; planche écrite dans tokens/orbe-cafe/ seulement.
3. Règle réservée à une marque : dans la saisie, memeDossier(dossier, ORBE), lirePropresOrbe, « échelle existante réservée à Orbe Café » ; même lecture dans calibrage.js.
4. reduce --tokens lit un resolver, pas seulement un fichier de jetons.
5. reduce --tokens refuse un fichier qui ne donne aucun jeton : sortie 1 ou 2 selon D18, message nommé.
6. Les tests ne lisent plus la copie figée fixtures/marque-demo/jetons/primitives.tokens.json si une source vraie existe.

HORS DU LOT
La structure de la saisie (lot 6). Les vignettes d'une carte décidée (lot 7).

RÈGLE DU LOT
Aucune branche de code ne dépend du nom d'une marque. Si une différence entre marques est réelle, elle vit dans les données de la marque, pas dans le code.

QUESTIONS DE CONFRONTATION
A. Liste chaque endroit de src/ où Orbe Café est nommé ou visé, rangé dans les cas 1, 2, 3, ou « commentaire seulement ».
B. Cas 3 : que fait exactement la règle réservée ? Quelle donnée d'Orbe Café la rend nécessaire ? Les trois autres marques (atelier-lavandine, ecume-et-sel, grenat-papeterie) pourraient-elles la suivre telle quelle ? Dis ce qui casserait.
C. Cas 1 : pour chaque commande, que se passe-t-il aujourd'hui sans marque, et que proposes-tu : marque obligatoire, ou défaut déclaré à un seul endroit ?
D. Cas 2 : les planches peuvent-elles être produites pour les quatre marques avec le même code ? Quels fichiers versionnés cela ajoute-t-il ?
E. Points 4 à 6 : que donne aujourd'hui reduce --tokens avec un resolver, avec un fichier vide, avec un fichier absent ? Quels tests lisent la copie figée, et lesquels passeraient à tort ?
F. Quelles sorties changent, avec avant et après.

MÉTHODE
Tests rouges d'abord, dont un test qui échoue si un nom de marque apparaît dans une condition de src/. Les quatre contrôles à 0 et aucun vert perdu avant chaque commit.

DOCUMENTATION
docs/decisions.md pour chaque choix de Quentin ; ARCHITECTURE ; README si une commande change ; KNOWN_ISSUES ; l'attendu avec ses écarts.

RÉSULTAT ATTENDU
Aucune condition sur un nom de marque dans src/ ; reduce --tokens lit un resolver et refuse un fichier sans jeton ; les quatre contrôles à 0 ; npm test entièrement vert ; la liste des sorties qui changent.

PLAN
D'abord la confrontation, avec A à F. Puis le plan. Attends ma réponse.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

1. Compte des lignes : l'attendu annonce 43 lignes non vides ; il en a 30 entre « Nettoyage » et FIN-DU-MESSAGE (31 avec cette ligne) [F]. Rien n'a été perdu au collage : le « 43 » était une erreur de Claude, qui n'avait pas compté, confirmée par Quentin le 16/11. Le travail, arrêté sur cet écart, a repris sur ces 30 lignes.
2. Point 1 : la marque par défaut ne vit pas seulement dans les commandes. `loadRoles` et `largeurs` prennent Orbe Café quand on ne leur donne pas de dossier (`src/tokens/roles.js:137`, `src/tokens/resolver.js:191`). `npm run espacements` et `npm run typo` n'ont pas d'option de marque. L'option `--marque` de `typo` attend un fichier de couche marque, celle de `contraste` un dossier : `typo --marque tokens/<autre>/marque.tokens.json` mêle la couche de l'autre marque aux primitives d'Orbe Café, et sort en 0 [F].
3. Point 3 : `calibrage.js` lit les échelles d'Orbe Café pour toutes les marques, pas seulement pour elle (`src/report/calibrage.js:66`) [F].
4. Point 3 : la règle réservée cache deux défauts [F]. (a) Si une entrée mêle une échelle générée et une échelle nommée, la saisie sort en panne : « alias sans cible : {couleur.terre.3} », car les échelles écrites à la main sont alors laissées de côté (`src/tokens/saisie.js:299`), et le resolver les omet aussi (`:320`). (b) Si elle nomme une échelle commune (`neutre`, `erreur`…), la saisie l'accepte et écrit son miroir sombre sous le même nom dans `echelles.sombre.tokens.json`. Ce fichier est lu après `tokens/commun/mode.sombre.tokens.json` : le miroir remplace donc l'échelle sombre commune pour cette marque.
5. Point 6 : la copie figée sert à deux choses. 15 fichiers de test la passent à `reduce` comme cible. `test/roles-statuts.test.js` la lit, dans 2 tests, comme référence de l'état d'avant l'étape 4b : un état passé, qui n'a pas d'autre source que l'historique git [F].

Réponses du propriétaire (16/11/2026) :
- Sans `--marque` (Q1) : toutes les marques de `tokens/` qui ont un `marque.resolver.json` ; sortie 1 si une échoue. `ORBE` et les défauts de `loadRoles` et `largeurs` sont retirés.
- `typo --marque <fichier>` devient `--couche-marque <fichier>` (Q2).
- Échelles nommées (Q3) : seulement celles du `primitives.tokens.json` du dossier de la marque, échelles communes exclues ; les deux défauts corrigés ; `echellesPropres(dossier)` lue par la saisie et le calibrage. La couche marque et le resolver d'Orbe Café restent identiques à l'octet.
- Texte d'essai (Q4) : « <nom> ouvre le mardi », le nom lu dans le resolver. Les situations de la planche typo restent un contenu d'essai commun, noté dans `KNOWN_ISSUES.md`.
- Tests navigateur des planches (Q5) : mesurés une fois sur les 4 marques. Si tout passe : une seule marque dans la suite, plus un test sans navigateur qui vérifie que les 12 planches versionnées égalent la sortie de leur fonction. Si un test casse pour une marque : arrêt, sans correction.
- Garde (Q6) : stricte, aucun nom de marque dans le code de `src/`.
- Commits enchaînés sans accord entre eux ; arrêt seulement sur le cas de Q5, ou si une sortie change hors du tableau F. Pas de fusion.

## Écarts constatés à l'exécution

1. Mesure Q5 : les tests navigateur des trois planches, lancés une fois sur les quatre marques (copies temporaires des trois fichiers de test, effacées ensuite) [F] :

   | Marque | rôles (8 tests) | espacements (9) | typo (9) | hero sur deux lignes, 420 et 1200 px |
   |---|---|---|---|---|
   | Orbe Café | 8/8 | 9/9 | 9/9 | passe |
   | Atelier Lavandine | 7/8 | 9/9 | 9/9 | passe |
   | Écume et Sel | 7/8 | 9/9 | 9/9 | passe |
   | Grenat Papeterie | 7/8 | 9/9 | 9/9 | passe |

   Le test qui casse est « T4 colonnes : fond, mot écrit, ratio, seuil, verdict » (`test/roles-planche.test.js`), sur `texte.secondaire` sur `fond.interactif.fort` : la planche affiche 1,12:1 (Atelier Lavandine), 3,60:1 (Écume et Sel), 1,78:1 (Grenat Papeterie), le test attend 1,53:1. Cause : la référence `INTERDITES` du test porte, écrits à la main, les ratios des quatre paires interdites d'Orbe Café ; le ratio d'un plein dépend du primaire de la marque. La planche est juste : dans le même test, chaque ratio comparé au contrat de sa marque passe. `bordure.focus` sur `fond.interactif.fort` ne tiendrait pas non plus (1,12 et 3,58 contre 1,54). Le travail s'est arrêté sur ce point, sans correction.

   Décision de Quentin (16/11/2026) : ce n'est pas un test qui casse pour une marque ; la planche est juste pour les quatre, c'est la référence du test qui vaut pour une seule. L'étape 5 se termine comme décidé : une marque dans la suite navigateur, plus le test sans navigateur des 12 planches (`test/planches-marques.test.js`). La constante reste, comme référence écrite à la main, mais dit sa marque : `INTERDITES_ORBE_CAFE`, et un commentaire d'une ligne (ratios d'Orbe Café, à ne pas lire comme une règle commune). Aucun autre changement à ce test.
2. Étape 2 : les tests de `reduce` basculés sur le resolver, lancés sur le code d'avant le lot (027c7f7), donnent 10 échecs dans `test/e2e-migration.test.js` et 2 dans `test/migration-unit.test.js` : la copie figée les faisait passer [F].
3. La garde lit les marques dans `tokens/*/entree.json` (nom, dossier, premier mot du dossier). Au départ, elle trouvait 22 occurrences, exactement le tableau A ; il en restait 8 après les étapes 3 et 4, celles des planches, et aucune après l'étape 5 [F].

## Sorties qui changent

Mesurées avant et après, sur le code d'avant le lot (027c7f7) et sur la branche [F]. Aucune sortie n'a changé hors de cette table.

| Sortie | Avant | Après |
|---|---|---|
| `reduce --tokens tokens/orbe-cafe/marque.resolver.json` | 0 jeton à l'index, sortie 0 | 133 entrées (108 couleurs, 25 dimensions) |
| `reduce --tokens` sur `{}` ou sur les rôles seuls | sortie 0, Chromium lancé | sortie 2, « reduce : --tokens <chemin> : aucun jeton lu (couleur en hex, dimension en px) ; un fichier .tokens.json ou un resolver DTCG 2025.10 attendu » |
| `reduce --tokens` sur un fichier absent, vide | « reduce : ENOENT… », « reduce : Unexpected end of JSON input » | « reduce : <chemin> : fichier absent », « reduce : <chemin> : JSON illisible (Unexpected end of JSON input) » |
| 5 réductions de fixtures : `table.json`, `revue.html` | — | identiques à l'octet |
| 5 réductions de fixtures : `migration.md`, `modifications.json` | fichier de jetons `primitives.tokens.json` | `marque.resolver.json` ; rien d'autre |
| `contraste`, `espacements`, `typo` sans `--marque` | Orbe Café seule | un bloc par marque, 4, sous « marque <nom> (tokens/<dossier>/) » ; `contraste` : 70 paires et 0 échec par marque |
| les mêmes avec `--marque tokens/orbe-cafe/` | — | identiques à la sortie d'avant sans option |
| `contraste --marque <dossier>`, trois autres marques | — | identiques |
| `contraste --mode sombre` sans `--marque` | ligne de mode en tête | ligne de mode sous chaque en-tête |
| `typo --marque <fichier>` | sortie 0, couche d'une autre marque sur les primitives d'Orbe Café | sortie 2 ; `--couche-marque <fichier>` donne l'ancienne sortie |
| saisie, échelle nommée sans `primitives.tokens.json` | « réservée à Orbe Café » | « échelle existante : aucune échelle écrite à la main dans le dossier de la marque (primitives.tokens.json) » |
| saisie, échelle commune nommée (Orbe Café) | acceptée, miroir sombre écrit | « échelle inconnue <nom> » |
| saisie, couleur et échelle nommée mêlées | panne, « alias sans cible : {couleur.terre.3} » | acceptée |
| saisie des 4 marques ; calibrage de leurs 4 entrées | — | identiques à l'octet |
| `tokens/orbe-cafe/typo.html` | « Orbe Café torréfie le mardi » × 11 | « Orbe Café ouvre le mardi » × 11 ; rien d'autre |
| `tokens/orbe-cafe/roles.html`, `tokens/orbe-cafe/espacements.html` | — | identiques à l'octet |
| planches des trois autres marques | absentes | 9 fichiers nouveaux |
