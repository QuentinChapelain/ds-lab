Nettoyage après la revue, lot 1a : une panne n'est pas un refus (contrôles et saisie). Ce message est l'attendu. Verse-le dans docs/attendus/revue-lot-1a-pannes-controles.md, confronte-le au code, propose un plan et attends.

DÉCISION (à écrire dans docs/decisions.md, numéro suivant)
Trois issues, pour toute commande :
- 0 : tout passe ;
- 1 : l'entrée a été lue et jugée : une règle échoue, ou la marque est refusée avec son motif ;
- 2 : l'entrée n'a pas pu être jugée : fichier absent ou illisible, option inconnue, panne de l'outil. Message d'une ligne préfixé par le nom de la commande, sans pile.
Un refus dit ce que le client doit changer. Une panne dit que l'outil n'a pas pu répondre. Les deux ne se confondent jamais.

CE QUI ENTRE
1. npm run espacements et npm run typo : fichier absent, JSON illisible, dossier donné à la place d'un fichier : sortie 2.
2. Les trois contrôles : option inconnue : sortie 2 (contraste sort en 1 aujourd'hui, l'analyse des options est hors de son try).
3. npm run saisie :
   - fichier d'entrée absent ou JSON illisible : sortie 2, pas « marque refusée » ;
   - Chromium qui ne se lance pas pendant le contrôle d'encre : sortie 2 ;
   - une couche commune cassée (paire vers un rôle inexistant) : saisir() lève, la commande sort en 2 ;
   - un vrai refus (couleur illisible, échelle qui échoue, paire sous son seuil, police refusée) reste en 1 avec son motif.
   Dans tous les cas, l'invariant tient : rien n'est écrit.
4. Une garde commune pour le lancement des commandes (src/cli/), utilisée par celles de ce lot ; npm run marque et npm run verify, qui n'ont aucun catch, y passent aussi.
5. Règles « en étroit » de espacements et typo : si le contexte étroit manque, elles passent sans rien contrôler (constat écarté de la revue, [V]). Vérifie-le d'abord. S'il tient, le contexte devient obligatoire.

CE QUI N'ENTRE PAS
Audit, reduce, apply, lecture de marque d'un site, page de revue : lot 1b. Toute refonte de saisir() au-delà de la séparation refus et panne.

MÉTHODE
- Les tests d'abord, rouges, dans un commit à part : un cas par ligne ci-dessus, sans navigateur quand c'est possible. Montre le rouge.
- Puis le code, jusqu'au vert.
- Un test existant qui fixe l'ancien comportement se corrige avec la raison dans le message de commit.

DOCUMENTATION
docs/decisions.md ; la table des commandes de README et d'ARCHITECTURE (ce que veut dire 1 et 2) ; docs/contrat-de-marque.md si la colonne « refusé » en dépend ; KNOWN_ISSUES.md : retirer la ligne des codes de sortie, garder les autres.

RÉSULTAT ATTENDU
Les trois contrôles à 0 ; npm test : aucun vert perdu, 2 rouges (C14, E5) ; les nouveaux tests verts.

PLAN
Dis d'abord ce que la confrontation au code change à cet attendu. Puis le plan. Attends ma réponse.

FIN-DU-MESSAGE

## Écarts constatés à la confrontation

1. espacements et typo : fichier absent, JSON illisible, dossier : sortie 1 avec une pile Node [F] ; contraste sort déjà en 2 sur --paires ou --marque absent.
2. Option inconnue : les trois contrôles sortent en 1 avec une pile, parseArgs hors du try [F].
3. saisie : fichier absent ou JSON illisible donnent « marque refusée », sortie 1 [F] ; Chromium qui ne se lance pas devient le motif « contrôle d'encre impossible », sortie 1 (src/tokens/saisie.js:120-121) [F] ; ce try couvre aussi le chargement de la police du client. Le lancement s'empêche sans navigateur avec PLAYWRIGHT_BROWSERS_PATH=/nulle/part [F].
4. saisie : une couche commune cassée devient un motif dans saisir() (src/tokens/saisie.js:292-295) ; la commande lit toujours tokens/commun/ : le test casse une copie de src/ et tokens/ hors du dépôt.
5. saisie : après écriture, le contrôle contraste relancé peut tomber en panne une fois les fichiers en place ; l'invariant « rien n'est écrit » ne vaut qu'avant l'écriture.
6. « Paire sous son seuil » ne se provoque pas par la commande (les couleurs générées tiennent leurs paires) : testée au niveau de la fonction, seuil durci comme dans C4.
7. verify a déjà un catch (référence absente : 2), les autres erreurs sortent en 1 avec une pile ; verify sort en 0 quand des pixels diffèrent : il compare, il ne juge pas. marque n'a aucun catch.
8. Étroit : sans contexte, espacements() et typo() passent les règles en étroit sans rien contrôler [F] ; graissesTitres appelle typo() sans contexte et stylesTitres pose un faux seuil (sous: 0) ; un fichier --etroit {} ne change rien et passe, accepté.
9. Décision suivante : D18. La colonne « refusé » de docs/contrat-de-marque.md ne dépend d'aucune panne.

Réponses du propriétaire (16/11/2026) : encre, Chromium qui ne se lance pas = panne, police que le navigateur refuse de charger = refus, toute autre erreur de mesure = panne ; après écriture, rien n'est effacé, sortie 2 avec un message, et un contrôle final qui rend 1 est une incohérence de l'outil, sortie 2 ; le remède (écrire à côté, contrôler, remplacer) va au lot de la fusion unique ; --etroit {} accepté, seul le paramètre absent est une panne.
