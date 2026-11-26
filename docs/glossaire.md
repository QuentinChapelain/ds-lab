# Glossaire

## Le système

| Terme | Définition |
|---|---|
| Design system | Les valeurs, composants et règles qu'un produit partage, écrits une fois et appliqués partout |
| Valeur en dur | Une couleur ou une taille écrite directement dans le CSS (`#595959`, `10px`) |
| Jeton (token) | Une valeur nommée, écrite une fois dans un format neutre (`space.8`) ; la variable CSS en est la traduction |
| DTCG | Le format standard des jetons (2025.10) |
| Primitive | Un jeton qui nomme une valeur : `color.blue.11`, `space.8` (dans la valise, le pas s'appelle `bleu-11`) |
| Rôle | Un jeton qui nomme un usage : `text.secondary`, `gap.between-components` |
| Module | Un assemblage de composants pour un usage du produit (`MemberCard`), sans pièce de Vuetify ni valeur visuelle propre ; ailleurs, *pattern* |
| Échelle | Une suite ordonnée de valeurs pour une famille |
| Pas | Une position dans l'échelle. Pour une couleur, le pas dit l'usage : 1-2 fonds, 3-5 composants, 6-8 bordures, 9-10 pleins, 11-12 texte |
| Tranche | Les pas réservés à un usage (le texte prend 11 ou 12) |
| Plein | Un fond coloré qui porte un texte (bouton, étiquette) ; le texte posé dessus s'appelle onSolid |
| Valise | La cible générique : 12 pas, valeurs générées par contraste visé, règles d'usage. On change de marque en changeant les valeurs derrière les noms |
| Produit | Ce qu'on migre : le même code, les mêmes modèles de page ; un par projet du parcours |
| Site | Une adresse où le produit tourne ; un projet en a un ou plusieurs |
| Marque | L'identité posée sur un site : couleur, accent, police des titres ; une par site |
| Contrat de marque | Ce qu'un client peut changer, et ce que le système garantit : [docs/contrat-de-marque.md](contrat-de-marque.md) |

## La méthode

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

## L'outil

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

## La façon de travailler

| Terme | Définition |
|---|---|
| Temps | L'un des quatre moments du parcours : Mesurer, Décider, Vérifier, Remettre ; chacun range une ou deux étapes |
| Porte | Là où l'humain décide, sur un écran. Trois : la marque, la revue, et pour tenir la planche et la CI, sans écran aujourd'hui |
| Lot | Un ensemble de changements avec un seul objectif |
| Attendu | Ce qu'on doit voir, écrit et validé avant le code |
| Passage | Le designer utilise l'outil seul ; ce qui bloque devient le lot suivant |
| `local/` et `.auth/` | Données de vrais sites (`local/`) et sessions enregistrées (`.auth/`) : jamais versionnées |
