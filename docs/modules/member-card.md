---
name: MemberCard
title: MemberCard
file: atelier/modules/MemberCard.vue
props: atelier/modules/MemberCard.menu.js
assembles: [DsCard, DsAvatar, DsTag]
decisions: [D61, D51, D56, D57]
stories: atelier/stories/MemberCard.stories.js
test: npm --prefix atelier run preuve -- member-card
---

<!-- genere:titre : écrit par npm --prefix atelier run fiches -->
# MemberCard
<!-- /genere:titre -->

Un membre d'un annuaire : sa photo ou ses initiales, son nom qui mène à son profil, sa promo et une suite de `DsTag`.

## Quand l'utiliser

- Pour un membre d'un annuaire : en colonne, par `MemberList` ; seul dans une page, avec le niveau de titre de sa place.
- Pas pour un profil complet : la carte y mène, elle ne le remplace pas.

## Props

<!-- genere:props : écrit par npm --prefix atelier run fiches -->
| Prop | Type | Obligatoire | Défaut | Valeurs admises | Nom repris de |
|---|---|---|---|---|---|
| `name` | texte | oui | aucun | libre | usage courant |
| `href` | texte | oui | aucun | libre | HTML |
| `image` | texte | non | aucun | libre | Vuetify |
| `cohort` | texte | non | aucun | libre | usage courant |
| `tags` | tableau | non | aucun | libre | usage courant |
| `headingLevel` | nombre | non | `3` | `2`, `3`, `4` | usage courant |

Événements émis : aucun. Slots : aucun.
<!-- /genere:props -->

- `name` : le nom, en entier ; il nomme le lien et donne les initiales.
- `href` : le profil ; toute la carte y mène.
- `image` : la photo ; absente ou en échec, les initiales.
- `cohort` : la promo, sous le nom.
- `tags` : la suite de `DsTag`, chacun `{ text, tone }`.
- `headingLevel` : le niveau du nom ; l'apparence ne change pas.

## Refusé

<!-- genere:refus : écrit par npm --prefix atelier run fiches -->
Attributs admis en plus des props : `id`, `aria-*`, `data-*`. Retirés : `aria-label`, `aria-labelledby`. Attributs `on…` d'événement : refusés.

Tout autre usage lève une erreur, et rien n'est rendu. Messages, dans l'ordre où ils sont vérifiés :

- `MemberCard : attribut refusé : <attributs>`
- `MemberCard : name : obligatoire`
- `MemberCard : href : obligatoire`
- `MemberCard : headingLevel : valeur inconnue : <valeur> (2, 3, 4)`
- `MemberCard : name : sans lettre`
- `MemberCard : tags : liste attendue`
- `MemberCard : tags : <rang> : <refus de DsTag>`
- `MemberCard : slot refusé : <slots>`
<!-- /genere:refus -->

Le nom nomme le lien : `aria-label` et `aria-labelledby` sont refusés. Un `DsTag` refusé l'est ici, avec son rang. Aucune longueur n'est refusée : un nom long passe à la ligne, un `DsTag` long est coupé par « … ».

## Anatomie et tokens

<!-- genere:tokens : écrit par npm --prefix atelier run fiches -->
Un token est le nom d'une valeur de design. Le module n'a aucune valeur visuelle propre : ce qu'il assemble porte les siennes, et il ne règle que la mise en page, par les tokens ci-dessous.

Assemble : [`DsCard`](../composants/card.md), [`DsAvatar`](../composants/avatar.md), [`DsTag`](../composants/tag.md).

| Partie | Token | Ce qu'il règle |
|---|---|---|
| Forme | `gap.between-tags` | Écart entre deux étiquettes d'une suite, en ligne comme entre deux lignes. |
<!-- /genere:tokens -->

- `DsCard` `small` à lien, horizontale : `DsAvatar` `large` et décoratif dans le slot `prepend`, la promo en sous-titre.

## Accessibilité

- Le nom est un titre qui porte le lien : une halte de la touche Tab, un lien nommé par le nom seul.
- `DsAvatar` est absent de l'arbre d'accessibilité.
- La suite de `DsTag` est une liste (`role="list"`, que Safari retire sans puces), chaque texte lu en entier.

<!-- genere:contrastes : écrit par npm --prefix atelier run fiches -->
Le module n'a aucune couleur propre : chaque texte se lit comme dans la fiche de sa pièce, [`DsCard`](../composants/card.md), [`DsAvatar`](../composants/avatar.md), [`DsTag`](../composants/tag.md).
<!-- /genere:contrastes -->

## En situation

```vue
<script setup>
import MemberCard from './modules/MemberCard.vue';

const tags = [{ text: 'Lyon' }, { text: 'Finance' }, { text: 'Mentor', tone: 'brand' }];
</script>

<template>
  <MemberCard name="Camille Ferrand" href="/membres/camille-ferrand" cohort="Promo 2014" :tags="tags" />
</template>
```

Stories : [atelier/stories/MemberCard.stories.js](../../atelier/stories/MemberCard.stories.js), story « Planche », story « Vitrine », story « Clavier » et story « Bac à sable ».

## Décisions et dette

- D61 : les modules, leurs règles, leur fiche. D51 : tout usage hors des props est refusé.
- Sans promo, la suite de `DsTag` est plus près du nom.
- La suite de `DsTag` est écrite aussi dans les stories de `DsTag`, faute de composant de groupe.
- On ne copie pas une promo ou un `DsTag` à la souris : le texte d'une carte à lien ne se sélectionne pas.
- `DsAvatar` à initiales est très pâle sur une surface en clair.

## Test de rendu

`npm --prefix atelier run preuve -- member-card` vérifie, dans les dix thèmes, en développement et en version construite :

- la place de `DsAvatar`, du nom, de la promo et de la suite, chaque écart égal à sa variable du thème ;
- un nom long à la ligne, un `DsTag` long coupé, rien qui déborde ; deux rendus identiques au pixel ;
- sur le premier thème : l'arbre d'accessibilité, la touche Tab, un clic sur `DsAvatar` et sur un `DsTag`, les refus.
