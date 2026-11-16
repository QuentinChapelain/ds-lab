Nettoyage après la revue, lot 2 : bogues isolés et tests rouges. Ce message est l'attendu. Verse-le dans docs/attendus/revue-lot-2-bogues.md, confronte-le au code, propose un plan et attends.

CE QUI ENTRE
1. apply : un border écrit après border-radius ne couvre plus les rayons. Une seule table raccourci vers propriétés longues, lue par covers et par coverage.
2. Motif R9 : il cite le seuil de la paire, pas « 4,5:1 » en dur. La page de revue relit ce motif par sa phrase (src/report/review.js) : les deux restent d'accord.
3. Ligne « inchangé » qui reçoit une décision écrite : mapping l'applique, la migration la dit inchangée. Une seule règle pour les deux.
4. C14 : une couleur vue seulement en état forcé (survol) entre dans la table, marquée par son état. Décision de Quentin, à juger sur le résultat.
5. E5 : une valeur à égale distance de deux pas (14 px entre 12 et 16) est une « décision » pour le designer, avec les deux candidats. L'outil ne tranche plus vers la plus petite. Décision de Quentin.

QUESTIONS DE CONFRONTATION
A. Point 3 : la page de revue peut-elle produire une décision sur une ligne « inchangé » ? Si oui, laquelle des deux lectures est la bonne ? Si non, que devient une telle clé : appliquée, ou listée avec les orphelines ?
B. Point 4 : ce que coûte le passage des couleurs d'état dans les usages, ce que l'attendu C14 demande exactement, et ce que cela change à la table des trois pages en désordre (lignes en plus).
C. Point 5 : quels tests et quels attendus fixent aujourd'hui le départage vers la plus petite valeur, et combien de lignes changent de classe dans les fixtures.

CE QUI N'ENTRE PAS
Les copies de règles, les annotations, la marque en dur, la structure.

MÉTHODE
Comme aux lots 1a et 1b. C14 et E5 sont déjà rouges : ils servent de tests. Un attendu de fixture qui change se corrige dans son commit, daté dans son $comment, avec la raison.

DOCUMENTATION
docs/decisions.md pour les points 4 et 5 ; README si une classe ou une règle de la table change ; KNOWN_ISSUES.md.

RÉSULTAT ATTENDU
Les trois contrôles à 0 ; aucun vert perdu ; 0 rouge.

PLAN
D'abord ce que la confrontation change, avec A, B, C. Puis le plan. Attends ma réponse.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

1. apply : covers accepte tout border-* derrière border (src/apply/apply.js:152), coverage('border') ne pose aucun rayon [F] ; second cas, border-top couvre border-top-left-radius [F]. coverage n'a pas de table : une branche par raccourci.
2. R9 : « 4,5:1 » en dur dans src/reduce/propose.js:740 et :764 ; la revue relit le motif par deux expressions à « 4,5:1 » (src/report/review.js:276, :278) ; expected-marque.json fixe trois motifs à 4,5:1, paires de texte normal, inchangées.
3. A : la page de revue n'exporte jamais de clé pour une ligne « inchangé » (src/report/review.js:788-801) ; une clé l'atteint pourtant sans faute de frappe : ligne devenue « inchangé » entre deux réductions, repli d'une clé d'avant la coupure par relation, clé écrite à la main. mapping, outcomeOf et controlAfter appliquent la décision ; seule la migration la dit « inchangé » (src/report/migration.js:269).
4. B : sur toutes les pages fictives, deux valeurs n'existent qu'en état [F] : #24426f (survol, pages en désordre) et #005fcc (anneau de focus du navigateur, toutes les pages). Un fond survolé sous un texte plus clair est un plein ; sans cela #24426f tomberait dans la tranche des fonds. expected-desordre-valise.json fixe C14 « absent », avec un bloc ifRead écrit à la main (bleu-10, #27487a, proche, ΔE 2,4565). Les échantillons d'état ne sont pas tracés (src/browser/states.js lit les propriétés calculées, sans règle d'origine) : les tracer coûterait un appel CSS.getMatchedStylesForNode par échantillon et par état forcé dans collectStates (nœud et domaine CSS déjà ouverts), au plus 60 × 3 appels ; repli retenu : outline-style auto, écrit dans KNOWN_ISSUES.md.
5. C : C5 de dimensionRow (src/reduce/propose.js:211) ; attendus qui fixent le départage vers la plus petite : expected-candidats.json (fenêtre 10px et 2px, cartes d'égalité de la revue), expected-migration.json (égalités tranchées en silence : 14px marge proche, 3px rayon auto ; comptes de sections). Lignes qui changent de classe : 1 sur les pages en désordre avec cible.json (14px), 2 avec cible-valise.json (14px, 3px rayon) ; 0 ailleurs.

Réponses du propriétaire (16/11/2026) : A, la décision écrite l'emporte, la migration dit « décidée », une seule ligne changée ; B, une couleur d'état entre dans la table si le site l'a écrite, l'anneau de focus du navigateur reste dans « États non lus », nommé comme tel, critère par l'origine si les échantillons sont tracés, sinon repli outline-style auto écrit dans KNOWN_ISSUES.md ; C, toute égalité est une décision, sans exception, nouvelle valeur vide, les deux candidats « à égalité, écart n px », sans « le plus proche » ; attendus de fixtures modifiés dans le commit des tests rouges, datés. À la fin, une réduction des pages en désordre dans local/revue-lot-2/ pour juger sur image.
