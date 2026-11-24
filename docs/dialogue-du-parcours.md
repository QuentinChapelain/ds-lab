# Le dialogue du parcours

Ce que l'IA qui conduit dit à chaque moment du parcours (D73) : l'ouverture, deux questions proposées, leurs réponses. La commande `parcours` lit ce fichier et donne, avec l'étape en cours, le texte du moment ; l'IA ne choisit ni l'ordre ni les mots. Les ouvertures de « Lancer » et de « Les pages », dites avant qu'un projet existe, sont recopiées dans `skill/ds-lab/conduire.md` par `npm run skill`.

Sources : la voix du compagnon d'atelier (charte dans `skill/ds-lab/conduire.md`), les ouvertures de la maquette « Parcours cible » du 24/11/2026, les questions et les réponses du premier jet du dialogue, du même jour.

Le format est lu par `src/parcours/dialogue.js` ; une faute est une panne qui nomme le moment (sortie 2). Un titre par moment, les treize dans l'ordre, puis cinq sortes de lignes :

- `Temps` : Mesurer, Décider, Poser ou Tenir.
- `Joue` : `oui` (l'ouverture est servie), `en attendant` (le moment attend son écran : on sert « En attendant son écran ») ou `non` (rien n'est servi).
- `Ouverture`, `En attendant son écran`, `Sans report` (au bilan, quand aucun choix n'est mis de côté), `Bouton` (le bouton qui lance la suite) : un ou plusieurs messages, chacun entre guillemets. Chacune peut avoir sa variante `…, plusieurs sites`, servie à un projet de plusieurs sites.
- Un chiffre s'écrit `{versions}`, `{decisions}` ou `{reportes}` ; `parcours` le remplit depuis les sorties.
- Deux questions, ni plus ni moins, dans un tableau, chacune avec sa réponse.

Une ouverture servie tient la voix : trois phrases au plus par message, un chiffre au plus, aucun mot à éviter (`test/parcours.test.js`). L'ouverture d'un moment qui ne joue pas encore est la cible de son écran ; elle sera relue quand il jouera.

## Lancer

- Temps : Mesurer
- Joue : oui
- Ouverture : « Bienvenue à l’atelier. ds-lab fait passer un site sans système à un design system tenu, sans refaire le produit. Je mesure, tu décides trois fois, on pose le résultat à côté de l’ancien code. » « Donne-moi l’adresse d’un site, ou de plusieurs, et on commence. »

| Question | Réponse |
|---|---|
| C’est quoi, un design system ? | Des décisions qui portent un nom : couleurs, espacements, textes, composants, et les règles qui les tiennent. Au lieu d’écrire une couleur à deux cents endroits, on écrit son nom, et la valeur vit à un seul endroit. |
| Qu’est-ce que j’obtiens à la fin ? | Les fondations du système à ta marque, ton site qui les applique, une consigne pour nettoyer l’ancien code, puis des composants. Et un contrôle qui refuse ce qui sort du système. |

## Les pages

- Temps : Mesurer
- Joue : oui
- Ouverture : « J’ai regardé ton site. Voilà les pages qui me semblent les plus représentatives. Tu peux les changer si tu veux. »
- Ouverture, plusieurs sites : « J’ai regardé tes sites. Voilà, pour chacun, les pages qui me semblent les plus représentatives. Tu peux les changer si tu veux. »
- Bouton : « On garde ces pages »

| Question | Réponse |
|---|---|
| Pourquoi seulement quelques pages ? | Un site de quatre cents pages se lit par une page par modèle de page : les pages d’un même modèle partagent leur style. |
| Et les pages que je ne donne pas ? | Elles ne sont ni mesurées ni prouvées. Elles restent à vérifier par un humain, et le bilan le redit. |

## La dette

- Temps : Mesurer
- Joue : oui
- Ouverture : « Voilà, j’ai fait le tour de tes pages. Il y a du monde : {versions} versions de composants. Rien à décider ici, regarde à droite, puis on passe à ta marque. »
- Ouverture, plusieurs sites : « Voilà, j’ai fait le tour de tes pages. Il y a du monde : {versions} versions de composants. Rien à décider ici, regarde à droite, puis on passe à tes marques. »
- Bouton : « On passe à la marque »
- Bouton, plusieurs sites : « On passe aux marques »

| Question | Réponse |
|---|---|
| C’est quoi, une version de composant ? | Deux boutons qui n’ont ni la même hauteur ni le même arrondi sont deux versions du même type. Chaque version en trop est à maintenir à part. |
| Est-ce que c’est grave ? | L’outil ne juge pas, il compte. Ce constat sert à voir le même problème à plusieurs, et à mesurer le chemin parcouru à la fin. |

## La marque

- Temps : Décider
- Joue : en attendant
- Ouverture : « Maintenant ton identité. J’ai relevé une couleur, un accent et une police de titres sur tes pages. Dis-moi si c’est bien ça, ou corrige à droite. »
- En attendant son écran : « Ta marque, je la prends dans ton fichier : je ne sais pas encore la relever sur tes pages. Je la pose sur les fondations, puis je te montre. »
- En attendant son écran, plusieurs sites : « Tes marques, je les prends dans leurs fichiers : je ne sais pas encore les relever sur tes pages. Je les pose sur les fondations, puis je te montre. »

| Question | Réponse |
|---|---|
| C’est quoi, Diapason ? | C’est le design system que j’apporte, déjà fait. Tu donnes ta couleur, ton accent, ta police. Il fournit le reste, avec les mêmes règles pour chaque marque. |
| Pourquoi mon bouton n’a pas ma couleur exacte ? | Avec elle, le texte du bouton ne serait pas assez lisible. Le bouton prend un pas voisin de la même palette, et ta couleur exacte reste sur les aplats. |

## Les fondations

- Temps : Décider
- Joue : en attendant
- Ouverture : « Les fondations sont prêtes, à ta marque : les valeurs, les rôles, les règles. Elles ne sont pas encore sur ton site. On regarde les composants, puis on y compare tes pages. »
- En attendant son écran : « Les fondations sont prêtes, à ta marque : les valeurs, les rôles, les règles. Elles ne sont pas encore sur ton site. On y compare tes pages. »
- En attendant son écran, plusieurs sites : « Les fondations sont prêtes, à tes marques : les valeurs, les rôles, les règles. Elles ne sont pas encore sur tes sites. On y compare les pages de ton premier site. »

| Question | Réponse |
|---|---|
| C’est quoi, un jeton ? | Une décision qui porte un nom. Le nom s’écrit partout, la valeur vit à un seul endroit. |
| Pourquoi trois couches ? | Les valeurs disent ce qui existe, la marque dit quelle palette est la tienne, les rôles disent à quoi sert chaque valeur. Changer de marque ne touche qu’une couche ; les composants ne connaissent que les rôles. |

## Les composants à ta marque

- Temps : Décider
- Joue : non
- Ouverture : « Voilà les composants, à ta marque. Deux remplacent ce que ton site a déjà, les autres viennent en plus. » « Pour tes liens, je n’ai pas encore de composant. Je te le dis maintenant, on y reviendra. »

| Question | Réponse |
|---|---|
| C’est quoi, une enveloppe ? | Un composant du système qui contient celui du framework et ne laisse passer que ce que le système autorise. Le développeur choisit un rôle, jamais une couleur. |
| Pourquoi garder le framework ? | Il fait bien le comportement : clavier, focus, états. L’enveloppe y ajoute la marque et le contraste, et rend un changement de framework moins coûteux. |

## Le tri

- Temps : Décider
- Joue : en attendant
- Ouverture : « J’ai comparé tes pages aux fondations. La plupart des valeurs, je les ai rangées seul. » « Il reste des valeurs proches, à valider d’un geste à droite. Ensuite, {decisions} décisions où il faut ton œil. »
- En attendant son écran : « J’ai comparé tes pages aux fondations. La plupart des valeurs, je les ai rangées seul. Il reste {decisions} décisions où il faut ton œil. »
- En attendant son écran, plusieurs sites : « J’ai comparé les pages de ton premier site aux fondations. La plupart des valeurs, je les ai rangées seul. Il reste {decisions} décisions où il faut ton œil. »

| Question | Réponse |
|---|---|
| Comment l’outil décide-t-il seul ? | Une valeur déjà sur la cible ne bouge pas. Une valeur tout près d’une seule valeur de la cible la rejoint. Un contraste insuffisant est corrigé. |
| Pourquoi certaines me reviennent ? | Elles sont à égale distance de deux valeurs de la cible. Aucune règle ne sait trancher : c’est un choix de design. |

## La revue

- Temps : Décider
- Joue : oui
- Ouverture : « On les prend une par une. Tu regardes à droite, tu choisis. Si tu veux mon avis sur l’une d’elles, demande. »

| Question | Réponse |
|---|---|
| Sur quoi je me base pour choisir ? | Sur l’image : chaque version est montrée sur ta vraie page. On choisit ce qui se voit juste, pas un nombre. |
| Et si je garde la valeur actuelle ? | C’est permis. Elle reste hors du système : la consigne la marque « ne touche pas », et elle sera à tenir à la main. |

## Avant, après

- Temps : Poser
- Joue : en attendant
- Ouverture : « Voilà tes décisions, toutes ensemble, sur tes pages. C’est un aperçu : rien n’est encore installé. Bascule à droite et dis-moi si ça te va. »
- En attendant son écran : « Je pose tes décisions à côté de l’ancien code, puis je les vérifie sur chaque page. Rien n’est installé sur ton site. »
- En attendant son écran, plusieurs sites : « Je pose tes décisions à côté de l’ancien code, puis je les vérifie sur les pages de ton premier site. Rien n’est installé sur tes sites. »

| Question | Réponse |
|---|---|
| Pourquoi la différence est-elle discrète ? | L’outil corrige sans redessiner : des textes plus lisibles, des écarts réguliers, moins de valeurs. Un changement qui saute aux yeux serait une refonte. |
| Que veut dire « arrivé » ? | L’outil a vérifié, élément par élément, que chaque décision prend bien effet sur la page. Quand une ne passe pas, il dit ce qui la retient et quoi faire. |

## La remise

- Temps : Poser
- Joue : non
- Ouverture : « C’est prêt pour le développeur : deux choses à lui remettre. J’ai écrit le message qui va avec, tu le copies et tu l’envoies. » « Pendant qu’il installe, on s’occupe des composants. »

| Question | Réponse |
|---|---|
| C’est quoi, une feuille ajoutée ? | Une feuille de style chargée juste après l’ancienne. Elle porte tes décisions et recouvre les anciennes valeurs, sans rien écraser. |
| Pourquoi ne pas remplacer directement ? | Pour ne rien casser. On pose à côté, on vérifie, puis on nettoie écran par écran, quand l’équipe y touche. |

## Les composants à garder

- Temps : Poser
- Joue : non
- Ouverture : « Tu as cinq boutons différents sur tes pages. Je propose ce que devient chacun, avec ma raison. Corrige ce qui est faux. »

| Question | Réponse |
|---|---|
| C’est quoi, une enveloppe ? | Un composant du système qui contient celui du framework et ne laisse passer que ce que le système autorise. Le développeur choisit un rôle, jamais une couleur. |
| C’est quoi, le contrôle ? | Une vérification lancée à chaque envoi de code. Elle refuse une valeur écrite en dur ou un composant posé hors du système, et dit quoi faire. |

## Le bilan

- Temps : Tenir
- Joue : en attendant
- Ouverture : « J’ai refait le tour des mêmes pages, sur ton site cette fois. Elles suivent les fondations. » « Dans le code, il reste du ménage : je te montre où on en est. »
- En attendant son écran : « La livraison tient sur les pages qu’on a regardées, pas encore sur ton site. Il reste {reportes} choix mis de côté, on les reprend quand tu veux. Le reste revient au développeur, et je refais le tour après chaque changement. »
- En attendant son écran, plusieurs sites : « La livraison tient sur les pages qu’on a regardées, pas encore sur tes sites. Il reste {reportes} choix mis de côté, on les reprend quand tu veux. Le reste revient au développeur, et je refais le tour après chaque changement. »
- Sans report : « La livraison tient sur les pages qu’on a regardées, pas encore sur ton site. Rien n’est mis de côté : de mon côté, c’est terminé. Le reste revient au développeur, et je refais le tour après chaque changement. »
- Sans report, plusieurs sites : « La livraison tient sur les pages qu’on a regardées, pas encore sur tes sites. Rien n’est mis de côté : de mon côté, c’est terminé. Le reste revient au développeur, et je refais le tour après chaque changement. »

| Question | Réponse |
|---|---|
| Mon site est-il conforme ? | Un outil ne voit qu’une partie des critères, donc il ne le dit jamais. Il dit ce qui est traité, ce qui est préparé, et ce qui reste à vérifier par un humain. |
| Que reste-t-il à faire ? | Le nettoyage du code, les pages hors de l’échantillon, puis les composants. |

## Remplacer et tenir

- Temps : Tenir
- Joue : non
- Ouverture : « Le développeur remplace les anciennes versions, écran par écran. Je refais le tour quand tu veux, et je te dis où on en est. » « Pour les liens, ça attend : je n’ai pas encore le composant. »

| Question | Réponse |
|---|---|
| C’est quoi, le contrôle ? | Une vérification lancée à chaque envoi de code. Elle refuse une valeur écrite en dur ou un composant posé hors du système, et dit quoi faire. |
| Pourquoi garder le framework ? | Il fait bien le comportement : clavier, focus, états. L’enveloppe y ajoute la marque et le contraste, et rend un changement de framework moins coûteux. |

## En réserve

Hors du format, non lues par `parcours` : les questions du premier jet que les moments ne servent pas encore, gardées pour quand leur moment ou leur écran viendra.

| Moment | Question | Réponse | Pourquoi pas servie |
|---|---|---|---|
| Lancer | Est-ce que ça touche à mon site ? | Non. Pendant tout le parcours, les nouvelles valeurs sont posées dans le navigateur de l’outil, le temps des captures. C’est le développeur qui installe, à la fin. | Troisième question |
| Lancer | Combien de décisions pour moi ? | Trois portes : la marque, la revue, l’avant et après. Sur le site d’exemple, 90 valeurs comparées et 15 décisions. | Quatrième question ; deux chiffres |
| La dette | Pourquoi deux chiffres, écrit et affiché ? | Le code contient des valeurs qui ne s’affichent jamais. On migre ce qui s’affiche ; ce qui est écrit dit la taille du nettoyage à venir. | L’écran du constat ne montre pas ces deux chiffres : elle attend l’écran de la dette |
| La marque | Pourquoi douze pas ? | Une couleur seule ne suffit pas à faire une interface. Les pas 1 et 2 servent aux fonds, 3 à 5 aux composants, 6 à 8 aux bordures, 9 et 10 aux aplats, 11 et 12 aux textes. Le pas 9 est ta couleur exacte. | Plus d’un chiffre : à redire avant d’être servie |
| La marque | Et si ma marque est refusée ? | C’est rare : l’échelle absorbe la plupart des couleurs. Si elle ne peut pas se construire, je te dis pourquoi et quoi changer. On ne corrige jamais les jetons à la main : on change la couleur d’entrée. | Quatrième question |
| Les fondations | C’est quoi, le format DTCG ? | Le format standard des jetons de design, que les outils du marché savent lire. Tes fondations ne dépendent donc ni de ds-lab ni d’un framework. | Troisième question |
| Les fondations | C’est quoi, une paire ? | Un texte ou une bordure, et le fond où il se pose. Chaque paire a son seuil de contraste : 4,5 pour un texte, 3 pour une bordure ou un focus. Une marque n’entre que si toutes passent, en clair et en sombre. | Quatrième question ; deux chiffres |
| Le tri | Puis-je voir ce qu’il a réglé seul ? | Oui, tout est consultable, ligne par ligne, avec le même avant et après. | Troisième question |
| La revue | Qu’est-ce que tu recommandes ? | L’IA donne un avis et sa raison en une phrase, puis laisse choisir. Elle ne valide jamais à la place de l’humain. | Troisième question ; la règle est dans la voix |
| La revue | Puis-je revenir sur un choix ? | Oui, à tout moment avant la remise. | Quatrième question ; non vérifié dans le parcours |
| Avant, après | Puis-je voir le site en direct ? | Oui : une fenêtre du navigateur s’ouvre sur ton site, avec une barre avant et après. | Troisième question |
| La remise | La dette est-elle résorbée ? | Pas encore. Les pages affichent les bonnes valeurs, mais l’ancien code est toujours là. Elle se résorbe au nettoyage, et le bilan compte les deux. | Troisième question |
| Le bilan | Pourquoi remesurer ? | Un bilan calculé avant l’installation est une promesse. Celui-ci compare deux mesures faites sur le vrai site. | Faux tant que la mesure n’est pas branchée : elle attend l’écran du bilan |
