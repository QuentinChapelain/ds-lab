---
name: DsTag
title: DsTag
file: atelier/composants/DsTag.vue
props: atelier/composants/DsTag.menu.js
wraps: VChip
decisions: [D55, D59, D51, D56, D57]
stories: atelier/stories/DsTag.stories.js
test: npm --prefix atelier run preuve -- tag
---

<!-- genere:titre : écrit par npm --prefix atelier run fiches -->
# DsTag
<!-- /genere:titre -->

Un mot court sur un fond teinté, pour classer un membre (ville, secteur) ou mettre une qualité en avant (« Mentor ») ; il ne se clique pas.

## Quand l'utiliser

- Pour une information courte qui classe : une ville, un secteur, une promo. `tone` `neutral`.
- Pour mettre en avant ce qui compte le plus, comme « Mentor » : `tone` `brand`.
- Plusieurs étiquettes forment une liste : un `<ul>`, une étiquette par `<li>`.
- Pour lancer une action, prendre un `DsButton`. Pour aller vers une autre page, un lien : à venir (B9).
- Pour filtrer une liste, une puce de filtre : à venir (B5). Pour retirer une valeur, une puce supprimable : à venir (B5).
- Pour dire un statut (réussi, en erreur), rien encore : deux tons seulement, sans couleur par catégorie (D55).

## Props

<!-- genere:props : écrit par npm --prefix atelier run fiches -->
| Prop | Type | Obligatoire | Défaut | Valeurs admises | Nom repris de |
|---|---|---|---|---|---|
| `text` | texte | oui | aucun | libre | Vuetify |
| `tone` | texte | non | `'neutral'` | `'neutral'`, `'brand'` | usage courant |

Événements émis : aucun. Slots : aucun.
<!-- /genere:props -->

- `text` : le mot affiché, lu tel quel par un lecteur d'écran. Aucune limite de longueur : trop long pour la place, il est coupé par « … ».
- `tone` : `neutral` pour classer, `brand` pour mettre en avant.

## Refusé

<!-- genere:refus : écrit par npm --prefix atelier run fiches -->
Attributs admis en plus des props : `id`, `aria-*`, `data-*`. Retirés : `aria-label`, `aria-labelledby`. Attributs `on…` d'événement : refusés.

Tout autre usage lève une erreur, et rien n'est rendu. Messages, dans l'ordre où ils sont vérifiés :

- `DsTag : attribut refusé : <attributs>`
- `DsTag : text : obligatoire`
- `DsTag : tone : valeur inconnue : <valeur> (neutral, brand)`
<!-- /genere:refus -->

Une étiquette ne se ferme pas, ne filtre pas et ne mène nulle part : `closable`, `filter`, `link`, `href`, `to` et `tabindex` sont refusés, comme tout attribut hors de la liste.

## Anatomie et tokens

<!-- genere:tokens : écrit par npm --prefix atelier run fiches -->
Un token est le nom d'une valeur de design. Le composant n'a aucune valeur en dur : chaque marque donne la sienne, et changer un token change toutes ses instances.

| Partie | Token | Ce qu'il règle |
|---|---|---|
| Couleur, tone neutral | `background.tint` | Fond teinté d'une pièce statique qui porte un texte court pour classer, posée sur la page ou sur une surface ; jamais un fond cliquable. |
| Couleur, tone neutral | `text.default` | Texte courant et titres. |
| Couleur, tone brand | `background.brand.tint` | Fond teinté de la marque d'une pièce statique qui porte un texte court pour mettre en avant, posée sur la page ou sur une surface ; jamais un fond cliquable. |
| Couleur, tone brand | `text.brand` | Texte de marque posé sur un fond teinté de la marque, comme les initiales de DsAvatar ou un DsTag mis en avant. |
| Forme | `border-radius.full` | Arrondi complet d'une forme ronde ou en pilule, comme un avatar ou une étiquette. |
| Forme | `height.tag` | Hauteur d'une étiquette, sur une ligne. |
| Forme | `padding.tag` | Marge intérieure gauche et droite d'une étiquette, de part et d'autre de son texte. |
| Texte | `typography.body.small` | Texte de tableau ou d'étiquette, plus petit que le texte courant. |
<!-- /genere:tokens -->

- Posé par le parent : `gap.between-tags` (`ds-gap-between-tags`) : l'écart entre deux étiquettes d'une suite, en ligne comme entre deux lignes. L'étiquette n'a pas de marge.

## Accessibilité

- Aucun nom à donner : le texte se lit, en entier, même quand l'œil n'en voit que le début.
- Rien à atteindre au clavier : la touche Tab passe sans s'arrêter, et un clic n'y fait rien.
- En liste, un lecteur d'écran lit la suite comme une liste.
- Le texte se lit sur son fond dans les dix thèmes, au-dessus du seuil :

<!-- genere:contrastes : écrit par npm --prefix atelier run fiches -->
| Devant | Fond | Plus bas des 10 thèmes | Seuil |
|---|---|---|---|
| `text.brand` | `background.brand.tint` | 10,07:1 (Atelier Lavandine, sombre) | 4,50:1 |
| `text.default` | `background.tint` | 10,06:1 (Atelier Lavandine, sombre) | 4,50:1 |
<!-- /genere:contrastes -->

## En situation

```vue
<script setup>
import DsTag from './composants/DsTag.vue';
</script>

<template>
  <ul class="etiquettes">
    <li><DsTag text="Lyon" /></li>
    <li><DsTag text="Finance" /></li>
    <li><DsTag text="Mentor" tone="brand" /></li>
  </ul>
</template>
```

La liste se range en ligne, avec retour à la ligne (`display: flex`, `flex-wrap: wrap`), sans puces ni marges, et prend l'écart posé par le parent en `gap`.

Stories : [atelier/stories/DsTag.stories.js](../../atelier/stories/DsTag.stories.js), story « En situation » (une ligne d'annuaire) et story « Planche » (chaque cas).

## Décisions et dette

- D55 : l'étiquette, ses props, son rendu, la suite en liste. D51 : tout usage hors des props est refusé.
- B5 : l'étiquette est faite ; restent les puces de filtre et les puces supprimables.
- D59 : le fond teinté, au pas 5 en sombre, se détache d'une surface ; chez Écume et Sel en sombre, les deux tons ont chacun le leur.
- Un texte coupé reste entier pour un lecteur d'écran, mais l'œil n'en lit que le début ; pas encore d'info-bulle (B1).

## Test de rendu

`npm --prefix atelier run preuve -- tag` vérifie, dans les dix thèmes, en développement et en version construite :

- la hauteur, les marges, la pilule, le fond, le texte et son style, pour les deux tons, et rien qui change au survol ;
- l'écart de 8 px d'une rangée qui passe à la ligne, et le « … » d'un texte long, resté entier dans la page ;
- sur le premier thème : l'arbre d'accessibilité, la touche Tab qui ne s'arrête pas, et les quatre refus.
