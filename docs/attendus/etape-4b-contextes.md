# Attendu : étape 4, séance b, contextes

Question : comment une même marque tient-elle en clair et en sombre, en large et en étroit, sans changer un seul rôle ?

Principe : les rôles (semantique.tokens.json) ne changent pas. Un contexte échange les valeurs sous les rôles. Deux contextes : mode (clair, sombre) et largeur (large, étroit). La marque reste un dossier par marque.

Lots, dans l'ordre :
1. Rangement, sans changement de valeur. Les couches communes à toutes les marques (neutres, statuts, rôles, paires, espaces, typographie) sortent de tokens/orbe-cafe/ vers un dossier commun. Un fichier resolver au format DTCG 2025.10 déclare les jeux et deux modificateurs, mode et largeur. Les valeurs en étroit quittent $extensions["ds-lab.etroit"] pour le contexte étroit. Les sorties de npm run contraste, espacements et typo sont identiques avant et après.
2. Mode sombre. Neutres sombres communs à toutes les marques, dessinés une fois. Échelle de marque générée pour le sombre à partir de la même couleur saisie, pas 9 inchangé. Statuts en sombre. La règle des pleins (D04) ne change pas ; ce qui se relit en sombre : texte.marque.grand, les aplats discrets, le focus, les textes interactifs.
3. Contrôle. npm run contraste accepte un mode et une largeur ; la saisie contrôle les deux modes ; une marque est acceptée si elle passe dans les deux. Table des 8 marques par mode.
4. Pour Quentin : local/lot-4b/sombre.png, 420 px de large, pour chaque marque fictive le même bandeau qu'aplats.png et un petit formulaire (titre, champ, message d'erreur, bouton), en clair puis en sombre.

Questions ouvertes, à trancher avec toi avant le code : lire le resolver par un petit lecteur maison ou par une dépendance (@terrazzo/parser) ; comment générer les neutres et les échelles sombres avec le générateur actuel ; où vit le dossier commun.

Hors périmètre : police du client, rem (séance c) ; composants.

Fini quand : les sorties du lot 1 sont identiques ; les 4 marques fictives passent le contraste dans les deux modes, les 4 témoins aussi en local ; les trois contrôles et le test de dérive passent. Limite : 2 heures.

## Précisions après confrontation

Validées par Quentin le 15/11/2026 (16 h 14).

Constats de la confrontation :

- [F] `fond.surface`, `texte.sur-inverse` et le texte des boutons (`marque.*.sur-plein`) pointent vers `couleur.blanc`, pas vers une échelle : échanger `couleur.blanc` en sombre efface le texte blanc des boutons ; `fond.inverse` (neutre 12) deviendrait clair sous un texte blanc.
- [F] D04 relue sur une échelle sombre casse la classe moyen : le plein prend le pas 11, couleur de texte claire en sombre (accent d'Orbe Café, boutons erreur, succès, info).
- [F] Le générateur et `checkValise` mesurent tout contre le blanc : une échelle sombre échouerait tel quel.
- [F] Orbe Café nomme ses échelles (bleu, terre) au lieu de saisir une couleur ; neutres, erreur et succès sont écrits à la main : « la même couleur saisie » se lit « le pas 9 de l'échelle ».
- [F] `primitives.tokens.json` mêle le commun (neutre, erreur, succès, espace, taille-texte, graisse, rayon) et Orbe Café (bleu, terre, sable). Les rayons vont au commun.
- [F] Dans un resolver, le dernier jeton gagne en entier : le contexte étroit d'un style de texte répète tout le composite ; le seuil de largeur n'a de place standard que dans `$extensions` du modificateur.
- [F] `texte.marque.grand` est choisi à la saisie contre les fonds clairs : la couche marque change avec le mode, chaque marque a ses fichiers sombres.
- [F] La largeur ne change aucune couleur.

Réponses :

1. Deux primitives communes, surface et texte sur inverse, aux valeurs identiques en clair ; `fond.surface` et `texte.sur-inverse` y pointent. Le fichier des rôles est le même dans les deux modes.
2. En sombre, mêmes boutons qu'en clair : plein, survol et texte sur le plein fixés par la classe lue sur l'échelle claire, statuts compris. D04 le dit en une phrase.
3. [H] Générateur en miroir : même dichotomie, mêmes cibles, pas 9 = la source, `checkValise` sur la même référence. Les neutres sombres sont générés une fois, dans le commun.
4. Lecteur de resolver maison, sans dépendance.
5. Couches communes dans tokens/commun/ ; un `marque.resolver.json` par marque, écrit par la saisie ; les planches d'Orbe Café restent dans son dossier.
6. Seuil de largeur dans `$extensions["ds-lab.largeur"]` du modificateur ; le contexte étroit répète le composite entier.
7. « Fini quand » : contraste dans les deux modes ; la largeur reste contrôlée par espacements et typo. Si la limite de 2 heures est atteinte, le lot 3 se réduit au contrôle des 4 marques fictives dans les deux modes ; la table des 8 tombe.

Rythme : lots 1 et 2, puis l'image du lot 4, un commit par lot, sans attendre entre les commits ; arrêt à l'image. Arrêt plus tôt si une sortie du lot 1 diffère, si une marque fictive est refusée en sombre, ou s'il faut toucher une valeur claire existante.

Lecture retenue :

- Le début de la réponse 7 est perdu au collage ; l'ordre 1, 2, 4, 3 se lit dans le rythme.
- [H] Référence sombre : le noir pur, miroir exact du blanc. Le contraste entre deux couleurs mesurées contre une même référence est le quotient de leurs contrastes à cette référence, vrai pour le blanc comme pour le noir : avec les mêmes cibles, chaque paire entre pas d'une échelle garde en sombre le ratio qu'elle a en clair, aux arrondis près. Le fond de page sombre ne peut pas servir de référence : il sort lui-même du générateur. Conséquences à juger sur image : fond de page sombre presque noir (pas 1 à 1,02 du noir) et surface sombre au noir pur, comme la surface claire est au blanc pur.
