# ds-lab

Laboratoire de design system multi-marque, de l'audit à la génération par IA. Marques fictives uniquement (la marque d'entraînement s'appelle Orbe Café).

## Le besoin

Une équipe hérite d'un produit sans design system : des centaines de valeurs écrites en dur, une marque par client, des textes qui échouent au contraste. Elle veut passer à un système sans tout redessiner et sans casser l'existant.

Une migration ne se fait pas à l'aveugle. Elle a trois phases, et la difficulté n'est pas au même endroit :

| Phase | Ce que c'est | Qui la fait |
|---|---|---|
| 1. Définir la cible | Le design system voulu : échelles, usages, ce qu'un client peut changer ; puis créer les jetons | Le designer. Aucune règle ne la remplace |
| 2. Faire la correspondance | Rattacher chaque valeur existante à la cible, selon son usage | Des règles pour ce qu'elles savent trancher, le designer pour le reste, en voyant l'effet |
| 3. Appliquer | Remplacer dans le CSS, puis vérifier | Le développeur et son agent. Mécanique, **une fois les phases 1 et 2 faites** |

`ds-lab` sert les trois : il mesure l'existant, vérifie la cible, range ce qu'une règle sait trancher, montre au designer en situation ce qui demande un jugement, et remet au développeur une consigne qu'un agent applique telle quelle, vérifiée avant et après.

Sur les pages fictives d'Orbe Café, une fois la cible posée (valise d'Orbe Café, réduction du 16/11/2026) : 90 lignes, dont 35 déjà sur la cible. Sur les 55 qui changent, les règles en tranchent 27 (15 d'office, 10 corrections, 2 hors table) ; le designer valide les 14 proches et tranche les 14 décisions.

## Ce que fait l'outil

```
npm run audit  -- <adresse> [options]                        mesurer l'existant
npm run reduce -- <adresse> --target <cible.json> [options]  ranger, revoir, produire la consigne
npm run marque -- <adresse> --prefix <préfixe> [options]     lire la marque d'un site avant la réduction (ne décide rien)
npm run composants -- <adresse> [<chemin>…] [--signatures <fichier>] [--decisions <fichier>] [--nom <texte>]   constat des pièces d'interface, au repos (ne juge rien) ; --releve <dossier> le refait sans navigateur
npm run login                                                enregistrer une session (dans .auth/)
npm run verify -- <adresse> [<chemin>…] --reference <dossier> [--save] [--sources <fichier>] [--ajout <dossier>]   vérifier qu'une page n'a pas bougé (pixels, arbre d'accessibilité) ; avec --sources, ses éléments tiers sont masqués, comme dans les références de reduce --sources ; avec --ajout, les feuilles ajoutées sont posées sur chaque page avant la capture, à la fenêtre de la réduction, et chaque ligne décidée est jugée arrivée ou non, avec le canal qui l'en empêche
npm run apply  -- --modifications <fichier> --racine <dossier> [--essai]   appliquer au CSS la part tranchée
npm run ajout  -- --modifications <fichier> --sortie <dossier> [--origine <adresse>]   poser la part tranchée à côté de l'ancien code : une feuille ajoutée par feuille modifiée
npm run demo   -- [--racine <dossier>]                       servir la marque fictive en local
npm run saisie     -- <entree.json>                          saisir une marque : échelles, couche marque, mode sombre, resolver, contraste dans les deux modes ; refus avec motif
npm run contraste   -- [--marque <dossier>] [--paires <fichier>] [--mode clair|sombre] [--largeur large|etroit]   contrôler les paires de rôles de couleur
npm run espacements -- [--marque <dossier>] [--semantique <fichier>] [--etroit <fichier>]   contrôler les espacements par relation
npm run typo        -- [--marque <dossier>] [--semantique <fichier>] [--primitives <fichier>] [--couche-marque <fichier>] [--etroit <fichier>]   contrôler les styles de texte
npm run css         -- [--marque <dossier>]                  écrire la feuille CSS complète de chaque marque (tokens/<marque>/jetons.css), par Terrazzo
npm run vuetify     -- [--marque <dossier>]                  écrire les thèmes Vuetify clair et sombre de chaque marque (tokens/<marque>/vuetify.json)
npm run types                                                vérifier les types JSDoc de src/ (non strict, sans rien émettre)
npm run knip                                                 chercher ce qui ne sert plus : fichiers, exports, dépendances
npm run dependances                                          chercher les cycles d'import et les modules orphelins de src/
npm test
```

`npm run reduce` produit trois fichiers, quatre avec `--tokens` :

| Fichier | Pour qui | Contenu |
|---|---|---|
| `revue.html` | Le designer | Chaque changement en situation ; les décisions à prendre ; export de `decisions.json` |
| `migration.md` | Le développeur | La table, les décisions, les exceptions, puis une consigne pour un agent |
| `table.json` | L'outil | La proposition et la synthèse. Le tour suivant relit `decisions.json`, exporté depuis la revue et passé avec `--decisions` |
| `modifications.json` | `npm run apply`, `npm run ajout` | Avec `--tokens` : chaque déclaration à modifier (feuille, ligne et colonne de la règle, sélecteur, propriété, valeur écrite attendue, nouvelle valeur, `!important` d'origine, pages), les commentaires à poser, le contenu de `tokens.css`, le schéma des adresses et la fenêtre de la réduction |

Le site audité n'est jamais modifié : les nouvelles valeurs sont posées dans le navigateur de l'outil, le temps des captures. Options utiles : `--tokens <fichier>` (nommer les lignes par les jetons DTCG : le resolver d'une marque, `tokens/orbe-cafe/marque.resolver.json`, ou un fichier de jetons ; un fichier qui ne donne aucun jeton sort en 2, D28), `--decisions` (relire les choix du designer), `--live` (fenêtre avec une barre avant / après), `--viewport 390x844` (mobile).

`npm run apply` modifie une copie du site, à la racine donnée : il remplace chaque déclaration de `modifications.json` si la valeur écrite est bien celle attendue (sinon, un écart), pose les commentaires et écrit `tokens.css`. Relancé sur une copie déjà migrée, il ne change aucune feuille. Il ne touche pas au HTML ; il écrit `reste.md`, la consigne de ce qui reste pour l'agent (lien vers `tokens.css`, attributs d'accessibilité, écarts). `--essai` n'écrit rien. Il sort en 0 si tout est appliqué ou déjà appliqué, en 1 s'il reste au moins un écart (`--essai` compris), en 2 sur une panne : feuille illisible ou CSS invalide, et rien n'est écrit (D18).

`npm run ajout` pose la même migration à côté de l'ancien code, sans toucher à aucune de ses feuilles (D37, D38, D39). Il lit `modifications.json`, et sur le site intact, servi à `--origine` (défaut : le schéma et l'hôte de la réduction), à la fenêtre de la réduction, les feuilles visées et les pages de la réduction. Il écrit dans `--sortie` une feuille ajoutée par feuille modifiée, `<feuille>.ajout.css`, à charger juste après elle, et `tokens.css` d'apply (variables utilisées, clair et large), à charger avant toutes les feuilles ; `jetons.css` n'est pas chargé avec elles, son bloc sombre changerait les pages. Seules les lignes décidées y entrent, chacune sous le sélecteur de la source, dans son contexte (`@media`, `@supports`, `@layer`), en propriété longue, l'identifiant de sa ligne en commentaire, comme dans la revue et la consigne : refaire un composant, c'est retirer ses lignes. Une règle est retrouvée par sa ligne et sa colonne : une feuille compressée, toute sur une ligne, se lit comme une autre. Aucune spécificité ajoutée ; armes égales : une déclaration d'origine en `!important` est écrite avec `!important`, son commentaire dit « provisoire : !important d'origine », et nulle part ailleurs. `pertes.md` compte à part les lignes écrites avec `!important` d'origine et celles d'une feuille injectée par un script (à charger depuis ce script, juste après elle), redit le `media` d'un lien, et range ce qui n'est pas écrit par cause, avec ce qu'il faudrait faire : garde d'apply (valeur écrite autre que l'attendue), raccourci (propriété longue illisible dans le raccourci, par exemple sous un `var()`), règle introuvable, déclaration battue par l'ordre à spécificité égale (une règle qui la suit dans la même feuille gagne sur un élément d'une page), contexte que la feuille ne sait pas redire, feuille introuvable ; puis les rattachements non faits et les lignes hors de `modifications.json`, rangées par leur cause (valeur en `var()`, raccourci en `var()`, mot-clé d'héritage, attribut style, bloc `<style>`, jeton absent…). `feuilles-ajoutees.json` nomme les feuilles, la fenêtre et chaque déclaration décidée, et recopie de `modifications.json` la simulation de la réduction, les lignes décidées et les lignes hors de `modifications.json`.

La preuve juge la décision du designer, pas ce que l'outil a réussi à écrire (D39). `npm run verify -- <adresse> [<chemin>…] --reference <dossier> --ajout <sortie>` rejoue sur chaque page intacte la simulation de la réduction, sans l'allumer : elle donne, pour chaque ligne décidée, les éléments, la propriété, la valeur visée et la déclaration qui tenait la valeur (écrite, non écrite, ou hors de `modifications.json`). Puis il pose les feuilles ajoutées, dans le même chargement, et lit la valeur à l'écran ; transitions et animations sont coupées le temps du relevé, sinon la valeur lue juste après la pose serait celle du départ d'une transition, l'ancienne, alors que la capture, prise animations finies, est juste (D40). Une ligne décidée est « arrivée » si toutes ses déclarations sont arrivées sur tous leurs éléments, sinon « en partie » ou « non arrivée », avec le compte en déclarations et en éléments ; pour chaque déclaration qui n'arrive pas, il dit une cause, ce qui tient la valeur (attribut style, bloc de style injecté par un script, variable, raccourci, autre règle) et ce qu'il faut faire. La cause est celle du manifeste quand il la connaît (déclaration non écrite, ligne hors de `modifications.json`), avec l'« à faire » de `pertes.md`, mot pour mot ; sinon celle qu'il mesure. La ligne de verdict finit par sa cause, ou par « causes : voir le détail » quand ses déclarations en ont plusieurs. Ce que verify pose lui-même, `tokens.css` et les feuilles ajoutées, il le reconnaît à son texte : ce n'est jamais un canal du site, une variable qu'il pose ne demande rien, et la variable du jeton n'est jamais à poser avec elle-même pour repli. Pour un bloc injecté par un script, il ne propose de poser une feuille ajoutée après lui que si elle porte une règle de l'élément pour la propriété ; pour un raccourci d'origine `!important`, il dit d'écrire la propriété longue avec `!important`, comme `pertes.md`. « Déjà en place » : la valeur visée était là avant la pose, ce n'est pas une preuve. Sans élément : « non vue » sur une page vérifiée, « hors des pages vérifiées », ou « non vérifiable (état) » pour une ligne vue seulement au survol, au focus ou à l'appui. Il donne la hauteur de la page intacte, celle de la page avec les feuilles et celle de la référence, et finit par une phrase qui compte les lignes par état. Il sort en 0 si aucune ligne n'est en partie, non arrivée, déjà en place ou non vue, en 1 sinon, en 2 sur une panne, dont un dossier tiré d'un `modifications.json` sans simulation (relancer reduce, puis ajout). Le compte de pixels contre la référence reste affiché, il ne décide pas. Sur les six réductions de fixtures, le rendu avec les feuilles ajoutées est identique au pixel à celui de la copie passée par apply, en clair comme en sombre ; la page de marque et le passage 2c sortent en 1, par leurs lignes hors de `modifications.json` (valeur en `var()`, jeton absent). `ajout` sort en 0 si chaque ligne décidée est écrite, 1 s'il en reste une non écrite ou une ligne hors de `modifications.json`, 2 sur une panne, rien d'écrit (D18).

Codes de sortie de la chaîne (D18) : `npm run audit` sort en 2 si une page n'a pas pu être mesurée (l'avertissement nomme l'étape : navigation, feuilles, mesure), si sa trace est en panne ou si le script v1 y échoue ; l'audit est alors écrit, incomplet ; si aucune page n'est mesurée, rien n'est écrit. `npm run reduce` s'arrête en 2 dès qu'une page tombe, ou si une couleur de marque de la cible est illisible ; il affiche les avertissements de navigation (statut HTTP, redirection, feuilles illisibles), les sélecteurs tiers invalides et les clés de `decisions.json` qui ne visent aucune ligne ni carte, sans s'arrêter. `npm run marque` affiche aussi les avertissements de navigation. L'audit signale, sans changer son code de sortie, une feuille importée qu'il ne peut pas ranger dans l'ordre de la cascade, faute de la rattacher à son import par son adresse (redirection) : « feuille importée hors de l'ordre de la cascade » (D33). Pour toutes les commandes, une erreur d'usage tient en une ligne préfixée par la commande, sortie 2, sans l'aide ; `-h` donne l'aide.

## Le parcours d'une décision

1. **Audit** : ce qui s'affiche vraiment, par usage.
2. **Cible** : la valise et ses jetons.
3. **Table** : chaque valeur × usage rangée dans une classe (voir le glossaire).
4. **Revue** : le designer choisit, en voyant l'effet sur tous les éléments touchés.
5. **Consigne** : `migration.md`, avec les mêmes identifiants que la revue ; ce qui n'est pas choisi est marqué « ne touche pas ».
6. **Contrôle** : l'outil relancé sur le CSS modifié, sur les pages de la table et sur des pages témoins jamais vues.

## Nommer les rôles

La cible est écrite en quatre couches de jetons DTCG. Les couches communes à toutes les marques sont dans `tokens/commun/` ; chaque marque a son dossier, `tokens/orbe-cafe/` pour Orbe Café :

| Couche | Fichier | Ce qu'elle nomme |
|---|---|---|
| Primitives | `tokens/commun/primitives.tokens.json` et `tokens/commun/statuts.tokens.json`, communes ; échelles de la marque à part (`tokens/orbe-cafe/primitives.tokens.json`, ou `echelles.tokens.json` générées) | Les valeurs : échelles de couleur, espaces, tailles de texte, graisses, rayons |
| Marque | `tokens/orbe-cafe/marque.tokens.json` | Les emplacements qu'un client remplit (primaire, accent, statuts, polices) et la règle des pleins |
| Rôles | `tokens/commun/semantique.tokens.json` | Les usages : couleurs de fond, de texte et de bordure, espacements par relation, styles de texte ; chacun en alias vers la marque ou une primitive |
| Paires | `tokens/commun/paires.json` | Les paires de rôles devant / fond et leur seuil de contraste, les exceptions écrites et les paires interdites |

Changer de marque, c'est changer la couche marque : les rôles restent les mêmes. Chaque marque a un resolver au format DTCG 2025.10, `marque.resolver.json`, qui réunit ses jeux de jetons et déclare deux contextes : le mode (clair, sombre) et la largeur (large, étroit). Un contexte échange des valeurs sous les rôles sans en changer un seul ; en étroit, seuls l'écart de section et les grands textes changent (`tokens/commun/largeur.etroit.tokens.json`). Les trois contrôles de la cible (contraste, espacements, typo) sortent chacun en 0 si tout passe, en 1 si une règle échoue, en 2 s'il n'a pas pu juger (fichier absent ou illisible, option inconnue, panne), avec un message d'une ligne (D18). Chacun prend `--marque <dossier>` ; sans l'option, il contrôle chaque marque de `tokens/`, un bloc par marque sous son en-tête « marque <nom> (tokens/<dossier>/) », et sort en 1 si une marque échoue (D26) :

- `npm run contraste` : chaque paire de rôles atteint son seuil WCAG 2.1, sauf exception écrite ; les paires interdites sont affichées. `--mode sombre` et `--largeur etroit` choisissent le contexte (clair et large par défaut).
- `npm run espacements` : écarts strictement croissants, valeurs en étroit, règles de proximité ; les primitives sans rôle sont affichées.
- `npm run typo` : règles des styles de texte (hauteurs de ligne, hiérarchie en large et en étroit, consigne de hauteur de capitale des titres) ; les primitives sans rôle sont affichées. `--couche-marque <fichier>` lit une couche marque donnée à part.

Trois planches par marque montrent la cible en situation, dans le dossier de la marque : `roles.html`, `espacements.html`, `typo.html` (pour Orbe Café, `tokens/orbe-cafe/roles.html`, `tokens/orbe-cafe/espacements.html`, `tokens/orbe-cafe/typo.html`). Même code pour toutes ; le nom de la marque est lu dans son resolver. Elles sont écrites par `node src/cli/planche.js [--marque <dossier>] [roles|espacements|typo]` : sans `--marque`, celles de chaque marque ; sans planche nommée, les trois (D27). Les règles et leurs raisons sont dans `docs/regles.md`, les décisions dans `docs/decisions.md`.

Chaque marque a aussi sa feuille CSS complète, `jetons.css` dans son dossier (`tokens/orbe-cafe/jetons.css` pour Orbe Café), écrite par `npm run css` avec Terrazzo, un outil du marché qui lit le resolver tel quel (D36). Toutes les variables en clair et en large dans `:root` ; dans `@media (prefers-color-scheme: dark)`, les seules variables que le sombre change ; dans `@media (width < 600px)`, les seules que l'étroit change, le seuil lu dans le resolver. Une variable porte le chemin de son jeton, points remplacés par des tirets, comme `tokens.css` de `npm run apply` ; une couleur s'écrit au hex du jeton, un alias en `var()` de sa cible, un style de texte en cinq variables (`-font-family`, `-font-size`, `-font-weight`, `-letter-spacing`, `-line-height`), et la description de chaque jeton en commentaire. Avant d'écrire, la commande compare, dans les quatre combinaisons, chaque jeton vu par Terrazzo à celui de notre lecteur ; une marque dont une valeur diffère, ou dont sombre et étroit changent un même jeton (la feuille n'a pas de bloc pour les deux à la fois), est refusée avec son motif : sortie 1, sa feuille n'est pas écrite. Sortie 2 sur une panne, rien d'écrit. `--marque <dossier>` traite une marque ; sans l'option, chacune.

Pour les composants, construits autour de Vuetify 4, chaque marque a aussi ses thèmes Vuetify, `vuetify.json` dans son dossier, écrits par `npm run vuetify` (D41) : `<dossier>-clair` et `<dossier>-sombre`, chacun avec ses couleurs et ses deux polices. Une seule table, commune à toutes les marques, dit quel rôle donne quelle couleur de Vuetify : `tokens/commun/vuetify.json`, écrite à la main, une raison par ligne. Elle couvre les 13 fonds que Vuetify définit par défaut ; chacun nomme aussi son texte, que le thème porte en `on-<couleur>` : Vuetify ne calcule aucun texte, et aucune couleur de Material ne reste. Chaque fond et son texte forment une paire de `paires.json`, donc contrôlée par `npm run contraste` ; une table qui en sort, qui nomme un rôle absent ou une clé en `on-` est une panne (sortie 2, rien d'écrit). `secondary` est l'accent : jamais une couleur de bouton (D05). Les polices passent par les variables du thème, que Vuetify lit en `--v-font-body` (texte, boutons) et `--v-font-heading` (titres). Quatre lignes sont des hypothèses, à juger sur les composants : `primary-darken-1`, `surface-variant`, `surface-bright`, `surface-light`.

## Saisir une marque

Une marque entre par un fichier, `tokens/orbe-cafe/entree.json` pour Orbe Café : un nom, une couleur primaire, un accent facultatif et la police des titres : ses noms de familles, et ses fichiers WOFF2 si le client les donne (`{ "familles": [...], "fichiers": [...] }`, chemins relatifs à l'entrée). Sans fichier, la police est acceptée par ses noms et la saisie l'affiche « non contrôlée » ; avec fichiers, elle lit ses mesures (unités par em, hauteur de capitale, hauteur d'x, ascendante, descendante), ses graisses, sa licence et sa couverture (`src/polices/`), puis mesure dans Chromium l'encre de deux lignes de chaque style de titre, en large et en étroit, avec la consigne de hauteur de capitale (D17) : taille utilisée, hauteur de capitale obtenue, encre (capitale accentuée de la ligne 2 sur descendante de la ligne 1) et écart avec la hauteur de ligne, affichés. La police du texte est celle du produit, commune à toutes les marques (`tokens/commun/police.tokens.json`, D16) ; une entrée peut la remplacer par `polices.texte`. `npm run saisie -- <entree.json>` génère les échelles (pas 9 = couleur saisie), écrit la couche marque et le resolver à côté de l'entrée : écrits d'abord sous un nom temporaire, contrôlés (contraste dans les deux modes, affiché comme par `npm run contraste`), puis mis à la place des anciens (D31).

| Sortie | Quand | Ce qui est écrit |
|---|---|---|
| 0 | Marque acceptée | `marque.tokens.json`, `marque.resolver.json`, et `echelles.tokens.json` si une échelle est générée |
| 1 | Marque refusée : entrée invalide, `checkValise` en échec sur une échelle générée, paire de rôles sous son seuil, en clair ou en sombre, ou police des titres refusée par un garde-fou (format WOFF2, graisses des titres, signes français, licence déclarée, hauteur de capitale) ou par son encre (deux lignes qui se touchent sur un style de titre), ou fichier de police que le navigateur refuse de charger, ou échelle de `primitives.tokens.json` qui porte le nom d'une échelle commune (D25) | Rien ; chaque motif est affiché avec son mode, `(clair)` ou `(sombre)` |
| 2 | Panne, la marque n'a pas pu être jugée (D18) : aucun fichier donné, fichier absent ou JSON illisible, couche commune cassée, Chromium qui ne se lance pas pendant le contrôle d'encre, encre qui touche le bord du cadre de mesure (D32) ; message d'une ligne | Rien : une panne pendant l'écriture, ou un contrôle final qui ne conclut pas ou trouve une paire en échec (incohérence de l'outil), laisse les fichiers d'avant tels quels (D31) |

Sans accent, l'accent se replie sur le neutre (D05). Les couches communes (neutres, statuts, rôles, paires, espaces, typo) sont lues dans `tokens/commun/`. Une entrée peut nommer une échelle existante (`{ "echelle": "bleu" }`) si elle est écrite à la main dans le dossier de sa marque, `primitives.tokens.json` (D25) ; Orbe Café seule en a un, sa couche marque est réécrite à l'identique ; une échelle commune (neutre, statuts) ne se nomme pas, et ce fichier ne peut pas en redéfinir une. Les règles et la raison sont dans D13 (`docs/decisions.md`) ; le contrat tient en une page, `docs/contrat-de-marque.md`.

La saisie écrit aussi le mode sombre de la marque : une échelle sombre pour le primaire et l'accent, générée depuis le même pas 9, et une couche marque sombre. En sombre, la page est un gris très foncé (`#121212`) et chaque surface posée au-dessus est plus claire ; les textes de couleur sont plus lumineux (pas 11 à 9:1 sur la page) ; le bouton prend la version lumineuse de la couleur du client (pas 11, texte au pas 1), l'aplat plein garde la couleur exacte. Neutres et statuts sombres sont communs (`tokens/commun/mode.sombre.tokens.json`, écrit par `node src/cli/sombre.js`). Les rôles ne changent pas d'un mode à l'autre ; les cibles sombres sont des hypothèses jugées sur image.

Quatre marques fictives sont saisies de la même façon, toutes acceptées :

| Marque | Primaire | Accent | Plein du primaire |
|---|---|---|---|
| Atelier Lavandine (`tokens/atelier-lavandine/`) | violet moyen | jaune | soutenu : couleur exacte, texte blanc |
| Écume et Sel (`tokens/ecume-et-sel/`) | cyan clair | orangé | clair : couleur exacte, texte au pas 12 |
| Grenat Papeterie (`tokens/grenat-papeterie/`) | grenat foncé | aucun, repli sur le neutre | sombre : couleur exacte |
| Maison Alberto (`tokens/maison-alberto/`) | or | fuchsia | moyen : pas 11, texte blanc ; sans police de texte, elle prend celle du produit (D16) |

Le survol de tous les pleins, statuts compris, suit une seule règle : la clarté OKLCH du plein baisse de 0,05 en clair et monte de 0,05 en sombre, teinte gardée (D45) ; le changement est léger, du même pas perçu pour toutes les marques, et le survol s'éloigne de la page. Le libellé (boutons, champs, onglets) prend toujours la police du produit, même quand la marque déclare une police de texte (D44).

Chaque marque a deux niveaux d'aplat non cliquables, clair (pas 3) et plein (valeur du bouton), et un texte de marque pour les grands titres, choisi à la saisie pour tenir 3:1 sur les fonds clairs. Sur l'aplat plein, texte, bouton et anneau de focus sont retournés (D14).

Calibrage de la règle des pleins : `node src/cli/calibrage.js --sortie <dossier> <entree.json>...` écrit `calibrage.html` et `calibrage.md`. La table a une colonne par marque : verdict de la saisie, classe selon le générateur, classe selon la règle des pleins, couleur exacte sur le bouton ou non, et trois indicateurs qui ne refusent rien (primaire grise, statut le plus proche, accent proche du primaire). Le balayage montre, pour des teintes de 30° à 140° et des clartés de 0,60 à 0,92, le bouton selon la règle (D04) et, pour une case moyenne, celui du cas clair avec son contraste. Il ne change aucun seuil. Avec des marques témoins, la sortie va dans `local/`.

## Constat des composants

`npm run composants` regarde les pages d'une même origine, au repos, et rend un constat de leurs pièces d'interface, pour un décideur, un designer et un développeur. Il ne juge rien : ni verdict, ni catalogue, ni comparaison à une cible (D46).

Pour chaque élément : son type, par le rôle que le navigateur calcule pour l'accessibilité (bouton avec texte, bouton à icône seule, lien, champ de texte, liste déroulante, case à cocher, radio, interrupteur, onglet, menu, fenêtre) ; pour une pièce sans rôle (carte, puce, avatar, badge), par la signature de son framework. Son origine : le framework, par une table de signatures facultative (`config/signatures/vuetify.json`, passée par `--signatures`) ; sinon « Fait maison », nommée par sa classe ; sinon « Sans style ». Son rendu : hauteur, arrondi, bordure, marge intérieure, taille et graisse de police, ni couleur ni largeur. Son poids : nombre de fois et pages. Une capture de la première occurrence de chaque version, et son code : classes, endroit, extrait HTML. Une version est un type, une origine et un nom ; ses apparences sont comptées sur sa ligne. Un élément présent à l'identique sur toutes les pages est du gabarit : montré une fois sous son type, il n'entre dans aucun chiffre. Les blocs répétés sans rôle ni signature (une classe vue au moins deux fois, avec une surface visible) sont listés à part, « Non identifiés ».

Cinq scores, chacun en « x sur y », sans note globale : source unique (éléments sur la version la plus répandue de leur type ; à égalité, l'outil nomme les deux et ne choisit pas), accessibilité de base (un nom lisible, l'atteinte au clavier, une zone de clic d'au moins 24 px de côté, l'élément ou son label), versions à garder choisies, fiabilité de l'audit, et l'effort, le nombre d'éléments à changer.

Le designer décide dans un fichier facultatif, écrit à la main et passé par `--decisions` : la version à garder d'un type, par son nom stable (`bouton avec texte / Vuetify / v-btn`, que le constat affiche dans « Voir le code »), et le sort d'un bloc non identifié, par sa classe : le laisser tel quel, ou le rattacher à un type, existant ou nouveau (`fixtures/marque-demo/decisions-composants.json`). Les décisions se réappliquent à l'audit suivant ; une ligne qui vise une cible absente n'est pas appliquée et le constat la liste.

| Fichier | Pour qui | Contenu |
|---|---|---|
| `constat.html` | Le décideur, le designer | Un seul fichier, lisible sur un téléphone, en clair et en sombre : l'en-tête, l'anneau des origines, ce qu'il reste à faire, quatre scores et leurs barres, le sommaire des versions type par type (une barre par type, un segment par version, lien vers sa fiche), les fiches des types, toutes repliées, les non identifiés, « Comment lire ce constat » et les limites ; chaque fiche montre ses versions à la taille réelle, leurs défauts d'accessibilité, ce qui les distingue et ce qu'il reste à faire (D47, D48) |
| `constat.md` | Le développeur | Les mêmes blocs, captures en lien, les lignes de l'anneau et la phrase longue (framework, faits autrement, blocs) ; aucun graphique |
| `constat.json` | L'outil | Tous les chiffres, versions et décisions, et de quoi redessiner les graphiques (`graphiques` : parts par origine, segments par type) |
| `releve.json` et le dossier des captures | L'outil | Le relevé brut : `--releve <dossier>` refait le constat sans navigateur, avec d'autres décisions |

Le constat guide (D47) : il dit d'abord ce qu'il reste à faire (choisir la version à garder d'un type à doublons, confirmer celle d'un type à une seule version, rattacher ou laisser un bloc), puis, sur chaque fiche, la ligne « À faire » et le nombre d'endroits à remplacer. Confirmer une version, c'est l'écrire comme version à garder dans le fichier de décisions. `--nom` donne le nom du site affiché (sans lui, l'hôte). Les couleurs de la page viennent des rôles neutres communs des jetons, et les captures sont prises à densité 2, nettes sur un téléphone.

Les graphiques (D48) sont du SVG écrit par le rendu, sans script ni dépendance. Chaque origine a sa couleur, prise dans les jetons communs, sans couleur de jugement : le framework en bleu d'information, « Fait maison » de la couleur du texte, « Sans style » en hachures ; un espace sépare deux segments, chaque segment a son texte de remplacement, et la légende est écrite. Un lien du sommaire ouvre la fiche visée dans Chromium ; ailleurs, il peut falloir l'ouvrir d'un toucher.

Les sorties vont dans `local/composants/<hôte>/<horodatage>/`. La commande sort en 0, ou en 2 sur une panne : fichier absent ou mal formé, page qui ne se charge pas (le constat est écrit sans elle). Sur les deux pages d'annuaire fictives (`fixtures/marque-demo/annuaire/`), avec la table de Vuetify : 27 éléments, 7 types, 12 versions ; 17 viennent de Vuetify, 10 sont faits autrement ; 3 blocs non identifiés ; source unique 20 sur 27, accessibilité de base 20 sur 23.

## Atelier des composants

Les composants sont des enveloppes autour de Vuetify 4 (Vue 3), montrées dans un atelier Storybook 10, dans `atelier/`, avec son propre `package.json` et son propre verrou : rien de ce qu'il installe n'entre à la racine (D42). Il y en a quatre : le bouton, `atelier/composants/Bouton.vue` (D43), le champ de texte, `atelier/composants/ChampTexte.vue` (D49), la carte, `atelier/composants/Carte.vue` (D50), et le bouton à icône seule, `atelier/composants/BoutonIcone.vue` (D52).

Chaque enveloppe déclare son menu dans un fichier à part (`atelier/composants/Bouton.menu.js`…) : ses options, leurs valeurs admises, ses règles. La fabrique commune (`atelier/composants/fabrique.js`, D51) en tire le composant et refuse tout usage hors du menu, avec le même message partout : « bouton : attribut refusé : color », « champ : libellé obligatoire », « carte : niveau inconnu : 5 (2, 3, 4) », « bouton à icône : libellé obligatoire ». En plus des options, seuls `id`, `aria-*` et `data-*` passent, et les écouteurs, sauf sur la carte ; un refus lève une erreur, et rien n'est rendu. Couleurs, dimensions et textes viennent des jetons de la marque, par les variables du thème : aucune valeur n'est écrite dans un composant, sauf la vitesse de la roue du bouton (`KNOWN_ISSUES.md`). Le bouton, le champ et la carte de Vuetify ne paraissent nulle part ailleurs (`test/enveloppe-bouton.test.js`).

Le bouton n'accepte que son menu : `variante` (principal, secondaire, discret, danger, danger-discret), `taille` (normale 40 px, petite 32 px), `icone` avant le texte, `pleineLargeur`, `desactive`, `chargement` et `type` (button par défaut). En plus, seuls `id`, `aria-*`, `data-*` et les écouteurs passent ; tout autre attribut, une valeur hors du menu, ou désactivé sur un bouton d'envoi lève une erreur, et aucun bouton n'est rendu. Désactivé et chargement posent `aria-disabled`, jamais l'attribut `disabled` : le bouton reste atteignable au clavier, et ni le clic ni l'envoi d'un formulaire n'ont lieu. En chargement, le bouton garde le focus, sa largeur et son nom, et une zone de statut dit « Chargement en cours ».

Le champ de texte a un libellé obligatoire, posé au-dessus du champ, une aide, une erreur, la mention « (obligatoire) », un type (`text`, `email`, `search` ou `password`), une icône avant le texte, un texte d'exemple, sa valeur (v-model), un nom et `autocomplete`. Aide et erreur sont liées au champ par `aria-describedby`, l'erreur d'abord ; sous une erreur, l'aide quitte l'écran mais reste lue ; le champ en erreur porte `aria-invalid`. Désactivé, il prend l'attribut natif : il sort de l'ordre de tabulation et sa valeur ne part pas avec le formulaire, à la différence du bouton (D49). Il mesure 40 px de haut, comme le bouton de taille normale, et prend au focus le même anneau.

La carte a un titre obligatoire, un vrai titre de niveau 2, 3 (par défaut) ou 4, un texte, une image au format 16:9 avec son texte de remplacement (vide pour une image décorative), des actions (des boutons et des boutons à icône de l'enveloppe, rien d'autre) ou un lien, jamais les deux. La carte à lien porte le lien dans son titre, étendu à toute la carte : une seule tabulation, un lien nommé par le titre ; au survol et au focus, son contour fonce et le titre se souligne ; au focus clavier, l'anneau entoure la carte.

Le bouton à icône seule a un libellé obligatoire, qui devient son nom pour les lecteurs d'écran et nomme l'action (« Fermer »), jamais l'icône, une icône obligatoire, une variante (discret par défaut, secondaire, principal, danger-discret), une taille (40 × 40 ou 32 × 32), désactivé et type. Un `aria-label` posé à la main est refusé. Il rend l'enveloppe du bouton, dont il garde les couleurs, le survol, l'anneau et le désactivé atteignable au clavier ; l'icône est muette. Pas encore d'info-bulle : elle viendra avec les jetons d'élévation, et reprendra le libellé.

Les icônes sont celles de Material Design Icons, en chemins SVG (`@mdi/js`, dans l'atelier seulement, D52). L'aide `atelier/composants/icone.js` fait d'un chemin un composant d'icône à passer à l'option `icone` d'une enveloppe : `icone(mdiClose)` ; tout autre chemin tracé sur 24 × 24 convient.

```
npm --prefix atelier ci             installer l'atelier (181 paquets, environ 200 Mo)
npm --prefix atelier run dev        serveur de développement, sur http://127.0.0.1:6006 seulement
npm --prefix atelier run build      version construite, dans le dossier storybook-static de l'atelier (non versionnée)
npm --prefix atelier run preuve     preuve, sur la version construite et un serveur de développement qu'elle lance et arrête
npm --prefix atelier run preuve -- champ   preuve d'un seul composant (bouton, champ, carte, bouton-icone), comme la CI
```

L'atelier lit les thèmes de chaque marque dans `tokens/<marque>/vuetify.json` (D41) : les relancer, c'est relancer `npm run vuetify` à la racine. Un sélecteur dans la barre de Storybook propose chaque marque, en clair et en sombre. Le thème est toujours passé par son nom, jamais par le défaut « system » de Vuetify, et un nom absent de la liste des marques (même `light` ou `dark`, que Vuetify connaît) remplace la story par l'erreur « thème inconnu : <nom> ». La police du texte et celle des titres sont celles de la marque. Télémétrie coupée (`--disable-telemetry` et `core.disableTelemetry`), recherche de mise à jour coupée (`--no-version-updates`) ; en développement, Storybook demande encore ses nouveautés à `storybook.js.org` à chaque ouverture (`KNOWN_ISSUES.md`).

Stories de chaque composant : la planche (le thème de la barre, chaque état ; pour le champ, la ligne d'alignement champ + bouton ; pour le bouton à icône, les lignes champ de recherche + bouton à icône et bouton + bouton à icône), la vitrine (les dix thèmes côte à côte), un bac à sable réglable, et celles que la preuve exerce (clavier, largeur du bouton, niveaux de titre de la carte, survol des discrets vu de près, refus).

La preuve (`atelier/preuve.js`, une partie par composant dans `atelier/preuve/`) rejoue l'attendu sur chaque thème de chaque marque, en développement et en version construite : sur la planche, le bouton principal a pour fond et pour texte les rôles que la table donne à `primary`, la page le fond de `background`, son libellé a la police du produit (D44), ses polices de texte et de titre sont celles de la marque ; la feuille de thème de Vuetify porte exactement les 36 couleurs de la table, fonds et textes, sans couleur de Material ni texte calculé, et ses 37 variables `ds-` égalent les jetons ; chacun des 50 boutons de la planche a, dans son état, les couleurs, l'anneau et les dimensions des jetons (survol et focus forcés) ; les deux rendus sont identiques au pixel (pixelmatch, seuil 0). La planche de chaque thème, en version construite, est enregistrée dans `local/bouton-captures/`, hors dépôt, pour être jugée sur image. Sur le premier thème, elle exerce le clavier : ordre de tabulation, désactivé et chargement muets au clavier, à la souris et par Entrée dans un champ, chargement qui garde le focus et s'annonce, anneau au focus clavier, arbre d'accessibilité, pleine largeur, refus d'un usage hors du menu. Pour le champ et la carte, chaque état de leur planche a, dans chaque thème, le contour, le fond, les dimensions, les textes et l'image des jetons, sans opacité de Vuetify ; la ligne champ + bouton aligne deux boîtes de 40 px ; leurs planches vont dans `local/champ-carte-captures/`. Sur le premier thème, elle lit l'arbre d'accessibilité des champs (nom, description, invalide, requis, désactivé), suit la tabulation des champs et des cartes, l'anneau au focus clavier, l'envoi d'un formulaire sans le champ désactivé, un clic dans une carte à lien, les niveaux de titre et chaque refus. Pour le bouton à icône, chacun des 32 boutons de la planche a, dans son état, une boîte carrée de la hauteur du contrôle, une icône de la taille des jetons et centrée, les couleurs, le contour et l'anneau des jetons ; les deux lignes d'alignement ont le même haut et le même bas ; ses planches et le survol des discrets vu de près vont dans `local/bouton-icone-captures/` ; sur le premier thème, l'arbre d'accessibilité (nom = libellé, icône muette, désactivé lu), la tabulation, le désactivé muet, l'envoi et chaque refus. Elle vérifie aussi qu'un nom inconnu, même `light`, est refusé, que le système en sombre ne change rien sans thème choisi, et que le sélecteur liste chaque thème et en pose un au clic, sans recharger la story. Les valeurs attendues sont relues dans les jetons par le lecteur du dépôt, pas dans les fichiers que l'atelier affiche. Elle emprunte à la racine le lancement de Chromium, `pixelmatch` et `pngjs` : elle demande l'installation de la racine. Sortie 0, 1 si une vérification échoue, 2 sur une panne (version construite absente, serveur qui ne répond pas).

## Glossaire

### Le système

| Terme | Définition |
|---|---|
| Design system | Les valeurs, composants et règles qu'un produit partage, écrits une fois et appliqués partout |
| Valeur en dur | Une couleur ou une taille écrite directement dans le CSS (`#595959`, `10px`) |
| Jeton (token) | Une valeur nommée, écrite une fois dans un format neutre (`espace.8`) ; la variable CSS ou Dart en est la traduction |
| DTCG | Le format standard des jetons (2025.10) |
| Primitive | Un jeton qui nomme une valeur : `couleur.bleu.11`, `espace.8` (dans la valise, le pas s'appelle `bleu-11`) |
| Rôle | Un jeton qui nomme un usage : `texte.secondaire`, `ecart.entre-composants` |
| Échelle | Une suite ordonnée de valeurs pour une famille |
| Pas | Une position dans l'échelle. Pour une couleur, le pas dit l'usage : 1-2 fonds, 3-5 composants, 6-8 bordures, 9-10 pleins, 11-12 texte |
| Tranche | Les pas réservés à un usage (le texte prend 11 ou 12) |
| Plein | Un fond coloré qui porte un texte (bouton, étiquette) ; le texte posé dessus s'appelle onSolid |
| Valise | La cible générique : 12 pas, valeurs générées par contraste visé, règles d'usage. On change de marque en changeant les valeurs derrière les noms |
| Contrat de marque | Ce qu'un client peut changer, et ce que le système garantit : [docs/contrat-de-marque.md](docs/contrat-de-marque.md) |

### La méthode

| Terme | Définition |
|---|---|
| Audit | Mesurer l'existant. **Déclaré** : ce que contient le CSS. **Rendu** : ce qui s'affiche (souvent beaucoup moins) |
| Usage | Le rôle d'une valeur dans la page : texte, fond, bordure, marge, retrait, gouttière. L'usage choisit la tranche, pas la ressemblance |
| Relation | Ce que sépare un espace : dans le composant (un champ et son message) ou entre composants (deux champs) |
| Réduction | Ranger l'existant dans la cible, sans redessiner |
| Table | Une ligne par valeur × usage : nouvelle valeur, jeton, classe, origine dans le CSS. Une couleur vue seulement au survol, au focus ou à l'appui, écrite par le site, a sa ligne, marquée par son état (D19) |
| Classes | **inchangé** (déjà sur la cible) · **auto** (écart invisible, appliqué) · **proche** (écart faible, appliqué par défaut, refusable un par un) · **correction** (contraste réparé d'office, annulable) · **décision** (le designer tranche ; toute valeur à égale distance de deux pas en est une, sans défaut, D20) · **hors table** (laissé tel quel, avec son motif) |
| Règles | Ce que le code décide seul (R1 à R9) : l'usage choisit la tranche, le contraste est vérifié, la mise en page et les éléments tiers sont exclus, une décision n'est jamais appliquée sans réponse. Table des identifiants cités par les sorties : `docs/identifiants.md` |
| Contraste | Rapport de luminance entre un texte et son fond. Seuils retenus (WCAG 2.1 AA) : 4,5:1 pour le texte ; 3:1 pour le grand texte (24 px, ou 18,67 px en gras) et pour une bordure de champ |
| Marge, retrait, gouttière | Espace autour d'un élément, à l'intérieur de ses bords, entre les enfants d'un conteneur |

### L'outil

| Terme | Définition |
|---|---|
| Version d'un composant | Une façon dont un type d'élément est codé : un type, une origine, un nom (`bouton avec texte / Vuetify / v-btn`) ; ses apparences sont ses jeux de mesures distincts (D46) |
| Signature | Une classe qui dit qu'une pièce vient d'un framework, dans une table de données (`config/signatures/`) |
| Gabarit | Un élément présent à l'identique sur toutes les pages vues : montré une fois, hors des chiffres |
| Bloc non identifié | Un bloc répété, sans rôle ni signature, que l'outil ne sait pas nommer ; le designer le laisse ou le rattache à un type |
| Pages en désordre | Pages fictives écrites avec des défauts connus (`fixtures/marque-demo/desordre/`) |
| Piège | Un défaut observé sur un vrai site, reproduit sur une page fictive et écrit avant elle, pour prouver qu'une règle le corrige |
| Simulation | Les nouvelles valeurs posées dans le navigateur, le temps des captures |
| Revue | La page où le designer voit chaque changement et décide |
| Carte de décision | Dans la revue : une image, un sélecteur de versions, « Choisir cette version » |
| Version | La valeur actuelle ou un candidat, montrés au même endroit. « Le plus proche » n'est pas une recommandation |
| Identifiant et titre | `esp-17 Marge basse · champ « Nom » et 4 autres (champs, textes)`, le même dans la revue, `migration.md` et la fenêtre en direct |
| Fenêtre en direct | Le site avec une barre pour appliquer les changements une ligne ou une famille à la fois (`--live`) |
| Rattacher | Remplacer une valeur déjà sur la cible par la variable de son jeton : rien ne change à l'écran, mais la valeur suit désormais le jeton |
| Repli | L'ancienne valeur, écrite en second dans `var(--jeton, ancienne valeur)` comme la source l'écrivait (rem, rgb()) : la page garde son rendu si `tokens.css` manque. Retiré en fin de migration |
| Consigne pour l'agent | La fin de `migration.md` : déclarer les variables CSS à partir des jetons (`tokens.css`), remplacer, ne pas toucher, vérifier |
| Pages témoins | Pages que les décisions n'ont pas vues, pour vérifier les effets de bord |
| Contrôle après modification | Relancer l'outil sur le CSS modifié et comparer au prévu |

### La façon de travailler

| Terme | Définition |
|---|---|
| Lot | Un ensemble de changements avec un seul objectif |
| Attendu | Ce qu'on doit voir, écrit et validé avant le code |
| Passage | Le designer utilise l'outil seul ; ce qui bloque devient le lot suivant |
| `local/` et `.auth/` | Données de vrais sites (`local/`) et sessions enregistrées (`.auth/`) : jamais versionnées |

## Dépôt

| Dossier | Contenu |
|---|---|
| `src/` | Audit, réduction, simulation, rapports, constat des composants |
| `tokens/commun/` | Couches communes à toutes les marques : primitives, statuts, mode sombre commun, police du produit, aplat plein, rôles, paires, contexte étroit ; table des thèmes Vuetify |
| `tokens/orbe-cafe/` | Jetons DTCG de la marque fictive (entrée, échelles, marque, resolver), les trois planches, la feuille CSS `jetons.css` et les thèmes Vuetify `vuetify.json` |
| `tokens/atelier-lavandine/`, `tokens/ecume-et-sel/`, `tokens/grenat-papeterie/`, `tokens/maison-alberto/` | Quatre marques fictives saisies par fichier, leurs trois planches, leur feuille CSS et leurs thèmes Vuetify |
| `docs/` | Règles du design system, décisions, contrat de marque, identifiants de règles (`docs/identifiants.md`) ; dans `docs/attendus/`, l'attendu de chaque lot, écrit avant le code et gardé à sa date |
| `fixtures/marque-demo/` | Pages fictives, pièges, cibles, attendus |
| `fixtures/polices/` | Quatre polices d'essai sous licence libre, chacune avec sa licence |
| `config/` | Exemple de fichier de sources, à copier dans `local/` ; tables de signatures de framework (`config/signatures/vuetify.json`) |
| `.github/workflows/` | La CI, `.github/workflows/ci.yml` |
| `test/` | Tests, dont `noms-interdits` qui refuse tout nom réel dans un fichier ou un message de commit |
| `atelier/` | Atelier des composants : Storybook 10, Vue 3 et Vuetify 4, son `package.json` et son verrou (D42) ; les composants dans `atelier/composants/`, le bouton d'abord (D43) |

Dépendances : `playwright-core` (navigateur), `postcss` et `@projectwallace/css-analyzer` (lecture du CSS), `culori` (conversions de couleurs et ΔE ; oracle des contrastes dans les tests), `pixelmatch` et `pngjs` (comparaison de captures), `@terrazzo/parser` et `@terrazzo/plugin-css` 2.10.0 (feuille CSS des jetons ; npm installe aussi `@terrazzo/cli`, qu'elles demandent sans qu'aucune commande le charge). Dépendances de développement, en version exacte : `typescript` 7.0.2 et `@types/node` 24.19.2 pour `npm run types`, `knip` 6.45.1 pour `npm run knip` (configuration `knip.json`), `dependency-cruiser` 18.7.2 pour `npm run dependances` (configuration `.dependency-cruiser.json`). L'atelier a les siennes, dans `atelier/package.json`, en version exacte : `storybook` et `@storybook/vue3-vite` 10.6.7, `vue` 3.5.45, `vuetify` 4.3.4, `vite` 8.3.8, `@vitejs/plugin-vue` 6.0.10 (composants `.vue`, D43).

Node : `.node-version` est la seule source de la version (24.22.3, Node 24 LTS, D40). Le poste de travail la lit par un gestionnaire de versions comme fnm, en entrant dans le dossier ; la CI la lit aussi ; `engines` demande `^24`. Chaque commande de l'outil compare la version majeure qui tourne à celle de `.node-version` : sous une autre, elle sort en 2 avant de lire son entrée, avec une ligne comme `contraste : Node 25.6.1, ds-lab demande Node 24 (.node-version : 24.22.3)`. Changer de Node, c'est changer `.node-version` (et `engines`, `@types/node`) dans un lot qui le dit.

Règles : marques fictives uniquement ; rien de `local/` ni de `.auth/` dans un fichier versionné ; attendu avant le code. Carte du code : [ARCHITECTURE.md](ARCHITECTURE.md).

## Intégration continue

À chaque push, sur toute branche, et à la demande, GitHub rejoue sur des machines neuves (ubuntu-24.04, Node de `.node-version`) ce qui est demandé avant un commit, en jobs parallèles (D53) : `rapides` (`npm ci`, `npm run types`, `npm run knip`, `npm run dependances`, les trois contrôles de la cible) ; `tests (1/3)` à `tests (3/3)`, `npm test` réparti en trois parts ; `atelier (<composant>)`, un job par composant : installation de l'atelier, version construite, preuve du composant ; puis `controles`, le verdict, qui échoue en nommant le job en échec. Les jobs qui lancent Chromium tournent dans l'image officielle de Playwright, à la version de `playwright-core`, épinglée par empreinte : aucun paquet système n'est téléchargé pendant la CI. Une étape par commande : l'étape rouge dit laquelle échoue. Les deux tests des noms interdits y sont sautés : leur liste vit dans `local/`, jamais versionné. La CI ne remplace pas le lancement sur sa machine avant un commit. Elle dure de 3 à 4 min ; chaque job et chaque étape qui varie a son délai, calculé sur les durées mesurées. Fichier : `.github/workflows/ci.yml`.

main est protégée (ruleset « main protégée ») : GitHub refuse tout push sur main dont le commit n'a pas le check `controles` vert, qui n'est pas en avance rapide (branche à jour) ou qui ferait un commit de fusion ; main ne peut pas être supprimée. Aucune pull request n'est demandée, personne n'y fait exception. Le chemin : pousser une branche, attendre la CI verte, `git push origin <branche>:main`, puis supprimer la branche. La CI de main, sur le même commit, n'est pas attendue : un rouge y est lu au lot suivant (D53).

## Limites

- Validé sur des pages fictives et sur un vrai site en lecture seule, pas encore avec une équipe.
- Le CSS migré garde un repli à retirer en fin de migration : `var(--jeton, ancienne valeur)` reste tant que toutes les pages ne sont pas passées aux jetons.
- Les pseudo-éléments (icônes) ne sont pas simulés ; le contraste du texte sur image est mesuré mais marqué à vérifier, car le fond réel est incertain.
- `npm run apply` vaut là où la feuille servie est le fichier source : une feuille compilée, minifiée ou assemblée par un outil de build n'a pas les lignes du fichier qu'on modifie.
- `verify --ajout` ne rejoue pas les états (survol, focus) : une ligne vue seulement à un état est « non vérifiable (état) ». Il nomme le canal d'après ce que Chromium dit de la règle qui gagne : un attribut style posé par un script ne se distingue pas d'un attribut du HTML. Il juge la cascade, transitions et animations coupées : une valeur qu'une animation tient à l'écran n'est pas jugée.
- `npm run ajout` ne juge l'ordre de la cascade que sur les pages de la réduction, à sa fenêtre ; une feuille ajoutée doit suivre sa feuille partout où celle-ci se charge, morceau chargé à la demande compris : une feuille injectée par un script est reconnue sur ces pages, et `verify --ajout` la pose après coup, comme le script devra le faire.
- Les contrastes ne sont pas mesurés sur les pages témoins : seules les pages de la table entrent dans les paires texte sur fond et dans la liste des paires sous le seuil.
- Le constat des composants regarde des pages au repos, à une seule largeur, et ne compte que les types vus ; il ne presse pas les flèches dans un groupe d'onglets ou de radios ; il donne la page affichée, pas le fichier du projet. Ses limites sont écrites dans chaque constat.
- La dette connue est tenue à jour dans [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

Licence MIT.
