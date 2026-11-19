---
nom: DsTag
titre: DsTag
fichier: atelier/composants/DsTag.vue
menu: atelier/composants/DsTag.menu.js
enveloppe: VChip
decisions: [D55, D51]
stories: atelier/stories/DsTag.stories.js
preuve: npm --prefix atelier run preuve -- tag
---

<!-- genere:titre : écrit par npm --prefix atelier run fiches -->
# DsTag
<!-- /genere:titre -->

Un mot court sur un fond teinté, pour classer un membre (ville, secteur) ou mettre une qualité en avant (« Mentor ») ; il ne se clique pas.

## Quand l'utiliser

- Pour une information courte qui classe : une ville, un secteur, une promo. Ton `neutral`.
- Pour mettre en avant ce qui compte le plus, comme « Mentor » : ton `brand`.
- Plusieurs étiquettes forment une liste : un `<ul>`, une étiquette par `<li>`.
- Pour lancer une action, prendre un `DsButton`. Pour aller vers une autre page, un lien : à venir (B9).
- Pour filtrer une liste, une puce de filtre : à venir (B5). Pour retirer une valeur, une puce supprimable : à venir (B5).
- Pour dire un statut (réussi, en erreur), rien encore : l'étiquette n'a que deux tons, sans couleur par catégorie (D55).

## Menu

<!-- genere:menu : écrit par npm --prefix atelier run fiches -->
| Option | Type | Obligatoire | Défaut | Valeurs admises |
|---|---|---|---|---|
| `text` | texte | oui | aucun | libre |
| `tone` | texte | non | `'neutral'` | `'neutral'`, `'brand'` |

Événements émis : aucun. Emplacements : aucun.
<!-- /genere:menu -->

- `text` : le mot affiché, lu tel quel par un lecteur d'écran. Aucune limite de longueur : trop long pour la place, il est coupé par « … ».
- `tone` : `neutral` pour classer, `brand` pour mettre en avant.

## Refusé

<!-- genere:refus : écrit par npm --prefix atelier run fiches -->
Attributs admis en plus des options : `id`, `aria-*`, `data-*`. Retirés : `aria-label`, `aria-labelledby`. Écouteurs : refusés.

Tout autre usage lève une erreur, et rien n'est rendu. Messages, dans l'ordre où ils sont vérifiés :

- `DsTag : attribut refusé : <attributs>`
- `DsTag : text : obligatoire`
- `DsTag : tone : valeur inconnue : <valeur> (neutral, brand)`
<!-- /genere:refus -->

Une étiquette ne se ferme pas, ne filtre pas et ne mène nulle part : `closable`, `filter`, `link`, `href`, `to` et `tabindex` sont refusés, comme tout attribut hors de la liste.

## Jetons

<!-- genere:jetons : écrit par npm --prefix atelier run fiches -->
| Jeton | Variables du thème |
|---|---|
| `fond.marque.discret` | `marque-discret` |
| `texte.marque` | `on-marque-discret` |
| `fond.composant` | `composant` |
| `texte.principal` | `on-composant` |
| `arrondi.pilule` | `ds-arrondi-pilule` |
| `hauteur.etiquette` | `ds-hauteur-etiquette` |
| `marge-interieure.etiquette` | `ds-marge-interieure-etiquette` |
| `typo.corps.petit` | `ds-corps-petit-police`, `ds-corps-petit-taille`, `ds-corps-petit-graisse`, `ds-corps-petit-interligne` |
<!-- /genere:jetons -->

- `ds-ecart-entre-etiquettes` (`ecart.entre-etiquettes`, 8 px) : l'écart entre deux étiquettes d'une suite, en ligne et entre deux lignes. C'est le parent qui le pose ; l'étiquette n'a pas de marge.

## Accessibilité

- Aucun nom à donner : le texte se lit, en entier, même quand l'œil n'en voit que le début.
- Aucun rôle et aucun arrêt au clavier : la touche Tab passe sans s'y arrêter, et un clic n'y fait rien.
- En liste, un lecteur d'écran lit la suite comme une liste.
- Le texte se lit sur son fond dans les dix thèmes, au-dessus du seuil :

<!-- genere:contrastes : écrit par npm --prefix atelier run fiches -->
| Devant | Fond | Plus bas des 10 thèmes | Seuil |
|---|---|---|---|
| `texte.marque` | `fond.marque.discret` | 11,65:1 (Atelier Lavandine, clair) | 4,50:1 |
| `texte.principal` | `fond.composant` | 11,68:1 (Atelier Lavandine, clair) | 4,50:1 |
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

La liste se range en ligne, avec retour à la ligne : `display: flex`, `flex-wrap: wrap`, et l'écart `var(--v-ds-ecart-entre-etiquettes)` en `gap`, sans puces ni marges.

Stories : [atelier/stories/DsTag.stories.js](../../atelier/stories/DsTag.stories.js), story « En situation » (grand avatar, nom, promo et étiquettes), et story « Planche » (les deux tons, une rangée, un texte long).

## Décisions et dette

- D55 : l'étiquette, son menu, son rendu, la suite en liste. D51 : la fabrique, qui refuse tout usage hors du menu.
- B5 : l'étiquette est faite ; restent les puces de filtre et les puces supprimables.
- À reprendre sur la carte membre (D55) : en sombre, l'étiquette disparaît presque sur une surface (1,03 entre les deux fonds) ; chez Écume et Sel en sombre, les deux tons ont le même fond.
- La puce de Vuetify range le texte dans un `div`, dans un `span` : sans effet vu. Poser l'étiquette dans une ligne ou dans un `<li>` (D55).
- Un texte coupé reste entier pour un lecteur d'écran, mais l'œil n'en lit que le début ; pas encore d'info-bulle (B1).

## Preuve

`npm --prefix atelier run preuve -- tag` vérifie, dans les dix thèmes, en développement et en version construite :

- la hauteur, les marges, la pilule, le fond, le texte et son style, pour les deux tons, et rien qui change au survol ;
- l'écart de 8 px d'une rangée qui passe à la ligne, et le « … » d'un texte long, resté entier dans la page ;
- sur le premier thème : l'arbre d'accessibilité, la touche Tab qui ne s'arrête pas, et les quatre refus.
