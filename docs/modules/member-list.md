---
name: MemberList
title: MemberList
file: atelier/modules/MemberList.vue
props: atelier/modules/MemberList.menu.js
assembles: [MemberCard]
decisions: [D61, D51, D56, D57]
stories: atelier/stories/MemberList.stories.js
test: npm --prefix atelier run preuve -- member-list
---

<!-- genere:titre : écrit par npm --prefix atelier run fiches -->
# MemberList
<!-- /genere:titre -->

Une liste d'annuaire : une colonne de `MemberCard`, dans l'ordre des données.

## Quand l'utiliser

- Pour un annuaire ou des résultats de recherche : toute page qui liste des membres.
- Nommée par le titre de la page : `aria-labelledby` vers ce titre.
- Le niveau des noms suit ce titre : `headingLevel` vaut un de plus que lui.
- Pour une grille de membres sur plusieurs colonnes : à venir (B6).
- Sans membre, rien n'est rendu : la page écrit son propre message ; un état vide et un chargement sont à venir (B7).

## Props

<!-- genere:props : écrit par npm --prefix atelier run fiches -->
| Prop | Type | Obligatoire | Défaut | Valeurs admises | Nom repris de |
|---|---|---|---|---|---|
| `members` | tableau | oui | aucun | libre | usage courant |
| `headingLevel` | nombre | non | `3` | `2`, `3`, `4` | usage courant |

Événements émis : aucun. Slots : aucun.
<!-- /genere:props -->

- `members` : les membres, chacun avec les props de `MemberCard` sauf `headingLevel` ; leur ordre est gardé.
- `headingLevel` : le niveau du nom de chaque membre, 2, 3 (par défaut) ou 4.

## Refusé

<!-- genere:refus : écrit par npm --prefix atelier run fiches -->
Attributs admis en plus des props : `id`, `aria-*`, `data-*`. Retirés : `aria-label`. Attributs `on…` d'événement : refusés.

Tout autre usage lève une erreur, et rien n'est rendu. Messages, dans l'ordre où ils sont vérifiés :

- `MemberList : attribut refusé : <attributs>`
- `MemberList : members : obligatoire`
- `MemberList : headingLevel : valeur inconnue : <valeur> (2, 3, 4)`
- `MemberList : members : liste attendue`
- `MemberList : members : <rang> : headingLevel : donné par la liste`
- `MemberList : members : <rang> : <refus de MemberCard>`
- `MemberList : slot refusé : <slots>`
<!-- /genere:refus -->

Chaque membre est vérifié comme une `MemberCard`, et l'erreur donne son rang : `MemberList : members : 3 : name : obligatoire`. Un membre qui porte son propre `headingLevel` est refusé : le niveau est celui de la liste. La liste se nomme par `aria-labelledby` ; `aria-label`, un attribut `on…` et tout slot sont refusés.

## Anatomie et tokens

<!-- genere:tokens : écrit par npm --prefix atelier run fiches -->
Un token est le nom d'une valeur de design. Le module n'a aucune valeur visuelle propre : ce qu'il assemble porte les siennes, et il ne règle que la mise en page, par les tokens ci-dessous.

Assemble : [`MemberCard`](member-card.md).

| Partie | Token | Ce qu'il règle |
|---|---|---|
| Forme | `ecart.entre-composants` | Écart entre deux composants voisins d'un même groupe, comme deux champs d'un formulaire ou deux cartes d'une rangée, pour qu'on voie à quel champ appartient un libellé ou un message. |
| Forme | `largeur.colonne` | Largeur maximale d'une colonne de contenu, comme une liste d'annuaire ; sur un écran plus étroit, la colonne prend toute la largeur de son parent. |
<!-- /genere:tokens -->

- Une liste (`ul`), une `MemberCard` par élément, en colonne.
- Toute la largeur de son parent, jusqu'à la largeur d'une colonne de contenu.

## Accessibilité

- Une liste nommée par le titre de la page, d'autant d'éléments que de membres (`role="list"`, que Safari retire à une liste sans puces).
- Une halte de la touche Tab par membre, dans l'ordre des données.
- Le reste est celui de `MemberCard`.

<!-- genere:contrastes : écrit par npm --prefix atelier run fiches -->
Le module n'a aucune couleur propre : chaque texte se lit comme dans la fiche de sa pièce, [`MemberCard`](member-card.md).
<!-- /genere:contrastes -->

## En situation

```vue
<script setup>
import MemberList from './modules/MemberList.vue';

const camille = { name: 'Camille Ferrand', href: '/membres/camille-ferrand', cohort: 'Promo 2014', tags: [{ text: 'Lyon' }, { text: 'Mentor', tone: 'brand' }] };
const noe = { name: 'Noé', href: '/membres/noe', cohort: 'Promo 2019' };
const members = [camille, noe];
</script>

<template>
  <h2 id="titre-annuaire">Annuaire</h2>
  <MemberList :members="members" aria-labelledby="titre-annuaire" />
</template>
```

Stories : [atelier/stories/MemberList.stories.js](../../atelier/stories/MemberList.stories.js), story « Liste » (les dix membres fictifs), story « Vide », story « Clavier » et story « Bac à sable ».

## Décisions et dette

- D61 : les modules, leurs règles, leur fiche. D51 : tout usage hors des props est refusé.
- Ni grille ni largeur de conteneur au-delà de la colonne (B6).
- Ni état vide ni chargement (B7).

## Test de rendu

`npm --prefix atelier run preuve -- member-list` vérifie, dans les dix thèmes, en développement et en version construite, à 1 280 et à 360 px de large :

- la largeur de la liste : celle d'une colonne de contenu, ou celle de son parent s'il est plus étroit ;
- l'écart entre les `MemberCard`, égal à sa variable du thème, et l'ordre des données ;
- aucun défilement en largeur ;
- deux rendus identiques au pixel ;
- sur le premier thème : l'arbre d'accessibilité, une halte de la touche Tab par membre, la liste vide, les refus.
