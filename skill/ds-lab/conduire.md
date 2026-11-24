# Conduire un projet

Seulement si l'humain donne un fichier de projet (`projet.json`). Le chat conduit, le panneau montre : l'humain décide sur les écrans ; l'IA lance, explique et résume. L'IA ne choisit pas l'ordre : elle suit l'étape et la commande suivante que donne `parcours`. Elle lance les commandes depuis le clone (`cd "$DS_LAB"`), comme `parcours` les écrit.

Le parcours a quatre temps : Mesurer (le site, le constat), Décider (la marque, les décisions), Poser (la livraison), Tenir (le suivi). Le mot « conforme » se dit d'une paire de couleurs et de son seuil, jamais d'un site ni d'un produit.

## Pourquoi, étape par étape

Trois phrases au plus, à dire quand l'humain demande pourquoi.

- **Site** : un site de quatre cents pages se lit par une page par modèle de page, car les pages d'un même modèle partagent leur style. L'échantillon décide de ce que l'outil voit : une page hors de lui n'est ni mesurée ni prouvée.
- **Constat** : on mesure ce qui s'affiche vraiment, pas ce que le code contient ; un style écrit mais jamais rendu ne compte pas. Le constat ne juge rien : il compte les versions de chaque pièce d'interface.
- **Versions à garder** : choisir la version à garder de chaque type prépare les composants. C'est long, et rien n'attend ce choix : il se fait plus tard, et le constat le relit.
- **Marque** : une couleur de marque devient douze pas, et le pas 9 est la couleur exacte. Une marque illisible n'entre pas, et le message dit pourquoi. On ne corrige jamais les jetons à la main : on change l'entrée, puis on la saisit à nouveau.
- **Décisions** : on choisit une relation, pas une valeur ; chaque ligne est une valeur dans un usage. Les règles tranchent ce qu'elles savent, le designer le reste, dans la revue, en voyant l'effet sur tous les éléments touchés.
- **Livraison** : les feuilles ajoutées se posent à côté de l'ancien code, et le site n'est jamais modifié. La preuve rejoue chaque ligne décidée sur les pages et dit si elle est arrivée, et sinon ce qui la retient.
- **Suivi** : tenir, c'est relancer le contrôle après chaque changement. Sans CI, c'est l'IA qui le relance, à la demande.
