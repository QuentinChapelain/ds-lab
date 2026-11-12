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

Sur les pages fictives d'Orbe Café, une fois la cible posée : 87 lignes, dont 34 déjà sur la cible. Sur les 53 qui changent, les règles en tranchent 27 (16 d'office, 10 corrections, 1 hors table) ; le designer valide les 15 proches et tranche les 11 décisions.

## Ce que fait l'outil

```
npm run audit  -- <adresse> [options]                        mesurer l'existant
npm run reduce -- <adresse> --target <cible.json> [options]  ranger, revoir, produire la consigne
npm run login                                                enregistrer une session (dans .auth/)
npm test
```

`npm run reduce` produit trois fichiers :

| Fichier | Pour qui | Contenu |
|---|---|---|
| `revue.html` | Le designer | Chaque changement en situation ; les décisions à prendre ; export de `decisions.json` |
| `migration.md` | Le développeur | La table, les décisions, les exceptions, puis une consigne pour un agent |
| `table.json` | L'outil | La proposition et la synthèse. Le tour suivant relit `decisions.json`, exporté depuis la revue et passé avec `--decisions` |

Le site audité n'est jamais modifié : les nouvelles valeurs sont posées dans le navigateur de l'outil, le temps des captures. Options utiles : `--tokens` (nommer les lignes par les jetons DTCG), `--decisions` (relire les choix du designer), `--live` (fenêtre avec une barre avant / après), `--viewport 390x844` (mobile).

## Le parcours d'une décision

1. **Audit** : ce qui s'affiche vraiment, par usage.
2. **Cible** : la valise et ses jetons.
3. **Table** : chaque valeur × usage rangée dans une classe (voir le glossaire).
4. **Revue** : le designer choisit, en voyant l'effet sur tous les éléments touchés.
5. **Consigne** : `migration.md`, avec les mêmes identifiants que la revue ; ce qui n'est pas choisi est marqué « ne touche pas ».
6. **Contrôle** : l'outil relancé sur le CSS modifié, sur les pages de la table et sur des pages témoins jamais vues.

## Glossaire

### Le système

| Terme | Définition |
|---|---|
| Design system | Les valeurs, composants et règles qu'un produit partage, écrits une fois et appliqués partout |
| Valeur en dur | Une couleur ou une taille écrite directement dans le CSS (`#595959`, `10px`) |
| Jeton (token) | Une valeur nommée, écrite une fois dans un format neutre (`espace.8`) ; la variable CSS ou Dart en est la traduction |
| DTCG | Le format standard des jetons (2025.10) |
| Primitive | Un jeton qui nomme une valeur : `couleur.bleu.11`, `espace.8` (dans la valise, le pas s'appelle `bleu-11`) |
| Rôle | Un jeton qui nomme un usage : `texte.secondaire`, `espace.entre-composants` |
| Échelle | Une suite ordonnée de valeurs pour une famille |
| Pas | Une position dans l'échelle. Pour une couleur, le pas dit l'usage : 1-2 fonds, 3-5 composants, 6-8 bordures, 9-10 pleins, 11-12 texte |
| Tranche | Les pas réservés à un usage (le texte prend 11 ou 12) |
| Plein | Un fond coloré qui porte un texte (bouton, étiquette) ; le texte posé dessus s'appelle onSolid |
| Valise | La cible générique : 12 pas, valeurs générées par contraste visé, règles d'usage. On change de marque en changeant les valeurs derrière les noms |
| Contrat de marque | Ce qu'un client peut changer, et ce que le système garantit |

### La méthode

| Terme | Définition |
|---|---|
| Audit | Mesurer l'existant. **Déclaré** : ce que contient le CSS. **Rendu** : ce qui s'affiche (souvent beaucoup moins) |
| Usage | Le rôle d'une valeur dans la page : texte, fond, bordure, marge, retrait, gouttière. L'usage choisit la tranche, pas la ressemblance |
| Relation | Ce que sépare un espace : dans le composant (un champ et son message) ou entre composants (deux champs) |
| Réduction | Ranger l'existant dans la cible, sans redessiner |
| Table | Une ligne par valeur × usage : nouvelle valeur, jeton, classe, origine dans le CSS |
| Classes | **inchangé** (déjà sur la cible) · **auto** (écart invisible, appliqué) · **proche** (écart faible, appliqué par défaut, refusable un par un) · **correction** (contraste réparé d'office, annulable) · **décision** (le designer tranche) · **hors table** (laissé tel quel, avec son motif) |
| Règles | Ce que le code décide seul (R1 à R9) : l'usage choisit la tranche, le contraste est vérifié, la mise en page et les éléments tiers sont exclus, une décision n'est jamais appliquée sans réponse |
| Contraste | Rapport de luminance entre un texte et son fond. Seuils retenus (WCAG 2.1 AA) : 4,5:1 pour le texte ; 3:1 pour le grand texte (24 px, ou 18,67 px en gras) et pour une bordure de champ |
| Marge, retrait, gouttière | Espace autour d'un élément, à l'intérieur de ses bords, entre les enfants d'un conteneur |

### L'outil

| Terme | Définition |
|---|---|
| Pages en désordre | Pages fictives écrites avec des défauts connus (`fixtures/marque-demo/desordre/`) |
| Piège | Un défaut observé sur un vrai site, reproduit sur une page fictive et écrit avant elle, pour prouver qu'une règle le corrige |
| Simulation | Les nouvelles valeurs posées dans le navigateur, le temps des captures |
| Revue | La page où le designer voit chaque changement et décide |
| Carte de décision | Dans la revue : une image, un sélecteur de versions, « Choisir cette version » |
| Version | La valeur actuelle ou un candidat, montrés au même endroit. « Le plus proche » n'est pas une recommandation |
| Identifiant et titre | `esp-17 Marge basse · champ « Nom » et 4 autres (champs, textes)`, le même dans la revue, `migration.md` et la fenêtre en direct |
| Fenêtre en direct | Le site avec une barre pour appliquer les changements une ligne ou une famille à la fois (`--live`) |
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
| `src/` | Audit, réduction, simulation, rapports |
| `tokens/orbe-cafe/` | Primitives DTCG de la marque fictive |
| `fixtures/marque-demo/` | Pages fictives, pièges, cibles, attendus |
| `test/` | Tests, dont `noms-interdits` qui refuse tout nom réel dans un fichier ou un message de commit |

Règles : marques fictives uniquement ; rien de `local/` ni de `.auth/` dans un fichier versionné ; attendu avant le code.

## Limites

- Validé sur des pages fictives et sur un vrai site en lecture seule, pas encore avec une équipe.
- La correspondance par usage ne sait pas encore exprimer la relation entre éléments (règle R10, en cours).
- Les pseudo-éléments (icônes) ne sont pas simulés ; le contraste du texte sur image est mesuré mais marqué à vérifier, car le fond réel est incertain.

Licence MIT.
