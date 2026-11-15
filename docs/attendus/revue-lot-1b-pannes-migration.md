Nettoyage après la revue, lot 1b : une panne n'est pas un résultat (audit, reduce, apply, lecture de marque). Ce message est l'attendu. Verse-le dans docs/attendus/revue-lot-1b-pannes-migration.md, confronte-le au code, propose un plan et attends.

RÈGLE
D18, déjà écrite. Ce lot l'applique à la chaîne de migration.

CE QUI ENTRE
1. Audit : une panne pendant la mesure d'une page n'est plus rangée en « échec du chargement ». L'avertissement nomme l'étape tombée : navigation, feuilles, mesure, script v1. Une page n'entre dans le rendu que si toutes ses étapes ont abouti, pour que rendu et déclaré comptent les mêmes pages.
2. Avertissements de navigation : statut HTTP d'erreur, redirection, feuilles illisibles. Une seule fonction, partagée par l'audit, reduce et la lecture de marque ; reduce et marque les affichent au lieu de les jeter.
3. Clés de decisions.json qui ne visent aucune ligne ni carte : elles ne sont plus ignorées en silence.
4. Couleur de marque illisible dans la cible : resolveBrand lève en nommant l'emplacement, la commande sort en 2. Elle ne devient plus un gris rangé sur neutre.
5. Boucle de stabilisation de propose : si elle n'a pas convergé après ses 10 tours, elle le dit.
6. Garde commune (src/cli/garde.js) pour audit, reduce, apply et login.
7. Constats écartés de la revue, [V] : vérifie chacun d'abord, garde ceux qui tiennent, dis lesquels tombent.
   - src/browser/trace.js:175 : un élément détaché fait échouer toute la trace ;
   - src/browser/simulate.js:57 et :1021 : un sélecteur tiers invalide est signalé par l'audit, pas par reduce ;
   - src/apply/apply.js:223 : toute erreur de lecture d'une feuille devient « feuille introuvable » ;
   - src/cli/reduce.js:361 : la navigation de --live échoue sans message.

QUESTIONS DE CONFRONTATION (réponds par les faits du code, puis propose)
A. Clés orphelines : d'où vient une clé de decisions.json, et une clé peut-elle devenir orpheline sans faute de frappe, par exemple quand le site a changé entre deux réductions ? Selon la réponse : arrêt en sortie 2 qui liste les clés, ou poursuite avec les clés listées au journal et dans migration.md.
B. Audit : quel code de sortie quand certaines pages tombent et d'autres non, et quand aucune n'a pu être mesurée ?
C. Boucle non stabilisée : motif posé sur les lignes en cause, ou arrêt ? Existe-t-il une entrée qui la fait osciller ?

CE QUI N'ENTRE PAS
Le raccourci border dans apply, le motif « 4,5:1 » en dur, la divergence « inchangé » avec décision, C14 et E5 : lot 2. Les catch de la page de revue : lot du script de revue.

MÉTHODE
Comme au lot 1a : tests rouges d'abord dans leur commit, sans navigateur quand c'est possible, puis le code, puis la documentation. Un test qui exige Chromium est permis s'il n'y a pas d'autre moyen ; dis-le.

DOCUMENTATION
README et ARCHITECTURE si une commande change de sortie ; D18 complétée ; KNOWN_ISSUES.md : retirer les lignes corrigées de la section « Revue de code du 15/11 ».

RÉSULTAT ATTENDU
Les trois contrôles à 0 ; aucun vert perdu ; 2 rouges (C14, E5) ; nouveaux tests verts.

(Le message d'origine a été coupé au collage après « tests rouges d'abord dans » ; la fin ci-dessus vient du message suivant, versée telle quelle.)

## Écarts constatés à la confrontation

1. Audit : un seul catch pour navigation, feuilles et mesure, rangé en « échec du chargement » (src/audit/run.js:144, pageWarnings) ; measureRendered verse la page dans le rendu dès le relevé (src/rendered/run.js:21), avant trace et états : une étape tombée après laisse la page dans le rendu et hors du déclaré [F]. Le script v1 a déjà son avertissement.
2. Navigation : statut, redirection et networkidle ne sont lus que par l'audit ; reduce (six gotoAndSettle) et src/brand/read.js jettent le résultat de navigation et les avertissements de collectSheets [F].
3. Clés orphelines : une clé vient du data-key d'une carte de la page de revue (rowKey ou plein|<échelle>) ; elle devient orpheline sans faute de frappe quand le site, les pages, la fenêtre ou la cible changent, ou quand une ligne coupée par relation ne l'est plus [F].
4. resolveBrand : #12345, rouge, bleuté → scale neutre, règle M1 [F] ; un seul appelant (propose.js:1074).
5. Boucle de propose : rien après 10 tours [F] ; aucune entrée oscillante connue, mécanisme possible (fond appliqué ou non selon le texte, texte selon le fond appliqué) [H].
6. audit, reduce, apply : erreur inattendue en sortie 1, apply avec la pile ; login : goto(…).catch(() => {}) comme --live.
7. Constats [V] : trace.js:175 tombe tel qu'écrit (sondé : un élément détaché ne fait rien échouer) mais il est rangé « initiale » au lieu de « non tracé » ; simulate.js:57 et :1021 tiennent (reduce calcule rendered.thirdParty.invalid sans le lire) ; apply.js:223 tient (catch nu), et un CSS invalide fait tomber tout apply (postcss.parse) ; reduce.js:361 tient.
8. Tests qui fixent l'ancien texte : test/report-unit.test.js:88 (« échec du chargement ») ; test/lot-k-pleins.test.js:310-311 fixent la ligne « Décisions lues » (sans clé orpheline, inchangée).

Réponses du propriétaire (16/11/2026) : A, la réduction continue, clés listées au journal, dans migration.md sous « Décisions lues » s'il y en a, et dans migration.json ; B, pages tombées : audit écrit, sortie 2, « n pages sur m non mesurées : audit écrit, incomplet » ; aucune page : sortie 2, rien d'écrit ; reduce s'arrête dès qu'une page tombe, sortie 2 ; C, motif « non stabilisé après 10 tours », lignes en « décision », journal, pas de test sans entrée qui oscille ; trace en panne : échantillons « non tracé », avertissement « trace », page gardée, audit incomplet, sortie 2 ; apply : 0 tout appliqué ou déjà appliqué, 1 au moins un écart (reste.md), 2 panne, --essai compris. Constats : trace.js gardé sous sa nouvelle forme, les trois autres gardés ; CSS invalide dans apply : sortie 2, message qui nomme la feuille. Un test pour la sortie 1 d'apply.
