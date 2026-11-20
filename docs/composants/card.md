---
name: DsCard
title: DsCard (carte)
file: atelier/composants/DsCard.vue
props: atelier/composants/DsCard.menu.js
wraps: VCard
decisions: [D50, D51, D56, D57]
stories: atelier/stories/DsCard.stories.js
test: npm --prefix atelier run preuve -- card
---

<!-- genere:titre : écrit par npm --prefix atelier run fiches -->
# DsCard (carte)
<!-- /genere:titre -->

Une surface qui groupe un titre, un texte, une image et des actions, ou qui mène tout entière vers une page.

## Quand l'utiliser

- Pour présenter un objet parmi d'autres, dans une rangée ou une grille : un événement, un club, une offre.
- Pour une carte qui mène vers une page : `href`, et le titre devient le lien.
- Pour une carte qui propose des actions : le slot `actions`, avec des `DsButton` et des `DsIconButton` ; jamais `href` et `actions` ensemble.
- Pour une ligne d'annuaire : `DsAvatar` en `prepend` (module `MemberCard`).
- Pour une grille et ses largeurs : à venir (B6).

## Props

<!-- genere:props : écrit par npm --prefix atelier run fiches -->
| Prop | Type | Obligatoire | Défaut | Valeurs admises | Nom repris de |
|---|---|---|---|---|---|
| `title` | texte | oui | aucun | libre | Vuetify |
| `subtitle` | texte | non | aucun | libre | Vuetify |
| `size` | texte | non | `'medium'` | `'medium'`, `'small'` | Vuetify |
| `headingLevel` | nombre | non | `3` | `2`, `3`, `4` | usage courant |
| `image` | texte | non | aucun | libre | Vuetify |
| `imageAlt` | texte | non | aucun | libre | HTML |
| `href` | texte | non | aucun | libre | HTML |

Événements émis : aucun. Slots : `default`, `actions`, `prepend`.
<!-- /genere:props -->

- `title` : le titre, un vrai titre de la page.
- `subtitle` : une ligne sous le titre, hors du nom du lien.
- `size` : `small`, titre de sous-groupe, pour une liste dense.
- `headingLevel` : son niveau, 2, 3 (par défaut) ou 4, selon la place de la carte dans la page ; l'apparence suit `size`.
- `image` : une image en tête, recadrée au format 16:9.
- `imageAlt` : le texte de remplacement de l'image, obligatoire avec `image` ; vide pour une image décorative.
- `href` : l'adresse vers laquelle mène toute la carte.
- Slot `prepend` : un `DsAvatar` à gauche ; la carte devient horizontale.

## Refusé

<!-- genere:refus : écrit par npm --prefix atelier run fiches -->
Attributs admis en plus des props : `id`, `aria-*`, `data-*`. Retirés : aucun. Attributs `on…` d'événement : refusés.

Tout autre usage lève une erreur, et rien n'est rendu. Messages, dans l'ordre où ils sont vérifiés :

- `DsCard : attribut refusé : <attributs>`
- `DsCard : title : obligatoire`
- `DsCard : size : valeur inconnue : <valeur> (medium, small)`
- `DsCard : headingLevel : valeur inconnue : <valeur> (2, 3, 4)`
- `DsCard : imageAlt : obligatoire avec image`
- `DsCard : href : refusé avec le slot actions`
- `DsCard : slot prepend : refusé avec image`
- `DsCard : slot actions : seuls DsButton et DsIconButton sont admis`, au rendu
- `DsCard : slot prepend : seul DsAvatar est admis`, au rendu
<!-- /genere:refus -->

Un attribut `on…` de clic est refusé : une carte qui se clique a un `href` (D50). Dans le slot `actions`, tout autre contenu qu'un `DsButton` ou un `DsIconButton` est refusé ; dans le slot `prepend`, tout sauf `DsAvatar`.

## Anatomie et tokens

<!-- genere:tokens : écrit par npm --prefix atelier run fiches -->
Un token est le nom d'une valeur de design. Le composant n'a aucune valeur en dur : chaque marque donne la sienne, et changer un token change toutes ses instances.

| Partie | Token | Ce qu'il règle |
|---|---|---|
| Couleur | `fond.surface` | Fond d'une carte ou d'un champ, posé sur le fond de la page. |
| Couleur | `texte.principal` | Texte courant et titres. |
| Couleur | `texte.secondaire` | Texte d'appoint, comme une aide, une légende ou une date. |
| Couleur | `bordure.defaut` | Contour ordinaire d'une carte ou d'un séparateur, décoratif, jamais seule pour repérer un champ ou un état. |
| Couleur, au focus | `bordure.focus` | Anneau de focus clavier, autour du composant qui a le focus. |
| Couleur, href, au survol | `bordure.forte` | Contour qui suffit à repérer un champ ou une case à cocher. |
| Couleur, href, au focus | `bordure.forte` | Contour qui suffit à repérer un champ ou une case à cocher. |
| Forme | `epaisseur.contour` | Épaisseur du contour d'un contrôle, comme le bouton secondaire. |
| Forme | `marge-interieure.composant` | Marge intérieure d'un composant à bord visible, comme une carte, un encadré ou une zone de formulaire. |
| Forme | `arrondi.surface` | Arrondi d'une surface posée sur la page, comme une carte. |
| Forme | `ecart.dans-composant` | Écart entre les parties d'un même composant, comme une étiquette et son champ ou un champ et son message d'erreur. |
| Forme | `ecart.entre-composants` | Écart entre deux composants voisins d'un même groupe, comme deux champs d'un formulaire ou deux cartes d'une rangée, pour qu'on voie à quel champ appartient un libellé ou un message. |
| Forme | `ecart.entre-blocs` | Écart entre deux blocs d'information d'un même composant, comme l'en-tête d'une carte, titre et sous-titre, et son contenu. |
| Forme, au focus | `epaisseur.focus` | Épaisseur de l'anneau de focus clavier. |
| Forme, au focus | `decalage.focus` | Décalage de l'anneau de focus clavier hors du composant, pour qu'il se pose sur le fond de la page et jamais sur le plein. |
| Texte | `typo.corps.moyen` | Texte courant, comme le texte d'une carte ou la saisie d'un champ. |
| Texte | `typo.titre.3` | Titre de carte. |
| Texte | `police.titre.hauteur-capitale` | Hauteur des capitales des titres (affichage, titres 1 à 3), la même quelle que soit la police. |
| Texte | `typo.corps.petit` | Texte de tableau ou d'étiquette, plus petit que le texte courant. |
| Texte, size | `typo.titre.4` | Titre de sous-groupe, sur les écrans denses, comme le titre d'une DsCard en taille small. |
<!-- /genere:tokens -->

## Accessibilité

- Le titre est un vrai titre (`h2`, `h3` ou `h4`) : on le trouve en parcourant les titres de la page.
- Une carte à lien porte le lien dans son titre, étendu à toute la carte : une seule halte de la touche Tab, un lien nommé par le titre.
- Le texte d'une carte à lien ne contient ni lien ni bouton (D50).
- Au focus clavier, l'anneau entoure la carte ; au survol et au focus, son contour fonce et le titre se souligne.
- Chaque texte se lit sur la surface dans les dix thèmes :

<!-- genere:contrastes : écrit par npm --prefix atelier run fiches -->
| Devant | Fond | Plus bas des 10 thèmes | Seuil |
|---|---|---|---|
| `texte.principal` | `fond.surface` | 12,12:1 (Atelier Lavandine, sombre) | 4,50:1 |
| `bordure.focus` | `fond.app` | 5,40:1 (Orbe Café, clair) | 3,00:1 |
| `bordure.focus` | `fond.surface` | 5,59:1 (Orbe Café, clair) | 3,00:1 |
| `bordure.forte` | `fond.app` | 3,10:1 (Atelier Lavandine, clair) | 3,00:1 |
| `bordure.forte` | `fond.surface` | 3,10:1 (Atelier Lavandine, sombre) | 3,00:1 |
| `texte.secondaire` | `fond.app` | 5,42:1 (Atelier Lavandine, clair) | 4,50:1 |
| `texte.secondaire` | `fond.surface` | 5,22:1 (Atelier Lavandine, sombre) | 4,50:1 |
<!-- /genere:contrastes -->

## En situation

```vue
<script setup>
import DsCard from './composants/DsCard.vue';
</script>

<template>
  <DsCard title="Club de lecture" href="/club-de-lecture">
    Chaque jeudi soir, une heure pour échanger autour d'un livre choisi ensemble.
  </DsCard>
</template>
```

Stories : [atelier/stories/DsCard.stories.js](../../atelier/stories/DsCard.stories.js), story « Planche » (chaque état), story « Variantes », story « Niveaux » et story « Clavier ».

## Décisions et dette

- D50 : la carte, ses props, son lien étendu, ses actions. D52 : le bouton à icône admis dans les actions. D51 : tout usage hors des props est refusé.
- En étroit, le titre garde sa taille du large : le thème de Vuetify n'a qu'une valeur par marque (B6).
- Le texte d'une carte à lien ne prend ni clic ni sélection : prix du lien étendu.
- Pas d'ombre : aucun token d'élévation encore (B1).

## Test de rendu

`npm --prefix atelier run preuve -- card` vérifie, dans les dix thèmes, en développement et en version construite :

- le contour, le fond, les dimensions, les textes et l'image de chaque état de la planche ;
- deux rendus identiques au pixel ;
- le sous-titre, la taille `small` et la carte horizontale ;
- sur le premier thème : la touche Tab des cartes, l'anneau au focus, un clic dans une carte à lien ou sur son `DsAvatar`, les niveaux de titre et les refus.
