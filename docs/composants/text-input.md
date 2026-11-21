---
name: DsTextInput
title: DsTextInput
file: atelier/composants/DsTextInput.vue
props: atelier/composants/DsTextInput.menu.js
wraps: VTextField
decisions: [D49, D51, D56, D57]
stories: atelier/stories/DsTextInput.stories.js
test: npm --prefix atelier run preuve -- text-input
---

<!-- genere:titre : écrit par npm --prefix atelier run fiches -->
# DsTextInput
<!-- /genere:titre -->

Un champ pour une saisie d'une ligne, avec son libellé au-dessus, une aide et un message d'erreur.

## Quand l'utiliser

- Pour un texte court : un nom, une adresse électronique, un mot de passe, une recherche.
- Pour un texte de plusieurs lignes : zone de texte, à venir.
- Pour choisir dans une liste : liste de choix, à venir (B1) ; pour cocher : case à cocher, à venir (B3).
- Pour un groupe de champs ou un résumé des erreurs d'un formulaire : à venir (B7).
- Le texte d'exemple (`placeholder`) ne remplace jamais le libellé ni l'aide (D49).

## Props

<!-- genere:props : écrit par npm --prefix atelier run fiches -->
| Prop | Type | Obligatoire | Défaut | Valeurs admises | Nom repris de |
|---|---|---|---|---|---|
| `label` | texte | oui | aucun | libre | Vuetify |
| `hint` | texte | non | aucun | libre | Vuetify |
| `errorMessage` | texte | non | aucun | libre | Vuetify |
| `required` | booléen | non | `false` | libre | HTML |
| `disabled` | booléen | non | `false` | libre | HTML |
| `type` | texte | non | `'text'` | `'text'`, `'email'`, `'search'`, `'password'` | HTML |
| `prependInnerIcon` | objet ou fonction | non | `null` | libre | Vuetify |
| `modelValue` | texte | non | `''` | libre | Vue |
| `name` | texte | non | aucun | libre | HTML |
| `autocomplete` | texte | non | aucun | libre | HTML |
| `placeholder` | texte | non | aucun | libre | HTML |

Événements émis : `update:modelValue`. Slots : aucun.
<!-- /genere:props -->

- `label` : ce qu'on demande, toujours visible au-dessus du champ.
- `hint` : une aide courte, sous le champ.
- `errorMessage` : le message d'erreur ; donné, il passe au-dessus de l'aide et le champ se dit en erreur. Le champ ne valide rien.
- `required` : ajoute « (obligatoire) » au libellé et le dit au lecteur d'écran.
- `disabled` : le champ sort de l'ordre de la touche Tab, et sa valeur ne part pas avec le formulaire.
- `type` : `text`, `email`, `search` ou `password`.
- `prependInnerIcon` : une icône muette avant le texte, comme une loupe.
- `modelValue` : la valeur, liée par `v-model`.
- `name` : le nom de la valeur dans le formulaire envoyé.
- `autocomplete` : ce que le navigateur peut proposer (`email`, `name`).
- `placeholder` : un exemple de saisie, en gris, qui disparaît dès qu'on tape.

## Refusé

<!-- genere:refus : écrit par npm --prefix atelier run fiches -->
Attributs admis en plus des props : `id`, `aria-*`, `data-*`. Retirés : `aria-describedby`, `aria-invalid`. Attributs `on…` d'événement : admis.

Tout autre usage lève une erreur, et rien n'est rendu. Messages, dans l'ordre où ils sont vérifiés :

- `DsTextInput : attribut refusé : <attributs>`
- `DsTextInput : label : obligatoire`
- `DsTextInput : type : valeur inconnue : <valeur> (text, email, search, password)`
<!-- /genere:refus -->

`aria-describedby` et `aria-invalid` sont posés par le composant d'après `hint` et `errorMessage` : donnés à la main, ils sont refusés.

## Anatomie et tokens

<!-- genere:tokens : écrit par npm --prefix atelier run fiches -->
Un token est le nom d'une valeur de design. Le composant n'a aucune valeur en dur : chaque marque donne la sienne, et changer un token change toutes ses instances.

| Partie | Token | Ce qu'il règle |
|---|---|---|
| Couleur | `background.surface` | Fond d'une carte ou d'un champ, posé sur le fond de la page. |
| Couleur | `text.default` | Texte courant et titres. |
| Couleur | `text.error` | Texte d'un message d'erreur. |
| Couleur | `text.secondary` | Texte d'appoint, comme une aide, une légende ou une date. |
| Couleur | `border.strong` | Contour qui suffit à repérer un champ ou une case à cocher. |
| Couleur, au focus | `border.focus` | Anneau de focus clavier, autour du composant qui a le focus. |
| Couleur, disabled | `background.disabled` | Fond d'un composant désactivé, quelle que soit sa variante (bouton plein ou secondaire). |
| Couleur, disabled | `text.disabled` | Texte d'un composant désactivé, sur son fond ou sur la page. |
| Couleur, disabled | `border.subtle` | Séparateur léger entre deux zones, décoratif, jamais seule pour repérer un champ ou un état. |
| Couleur, errorMessage | `border.error` | Contour d'un champ en erreur ; sur un fond de statut, décorative : le texte porte le sens. |
| Forme | `border-radius.control` | Arrondi d'un contrôle, comme un bouton ou un champ, le même à toutes les tailles. |
| Forme | `height.control.medium` | Hauteur d'un contrôle de taille normale, comme un bouton. |
| Forme | `border-width.default` | Épaisseur du contour d'un contrôle, comme le bouton secondaire. |
| Forme | `icon-size.medium` | Icône d'un contrôle de taille normale. |
| Forme | `gap.icon-text` | Écart entre l'icône et le texte d'un contrôle, comme un bouton ou un champ. |
| Forme | `padding.component` | Marge intérieure d'un composant à bord visible, comme une carte, un encadré ou une zone de formulaire. |
| Forme | `gap.within-component` | Écart entre les parties d'un même composant, comme une étiquette et son champ ou un champ et son message d'erreur. |
| Forme, au focus | `border-width.focus` | Épaisseur de l'anneau de focus clavier. |
| Forme, au focus | `offset.focus` | Décalage de l'anneau de focus clavier hors du composant, pour qu'il se pose sur le fond de la page et jamais sur le plein. |
| Texte | `typography.label` | Libellé de champ, de bouton ou d'onglet, toujours dans la police du produit. |
| Texte | `typography.body.medium` | Texte courant, comme le texte d'une carte ou la saisie d'un champ. |
| Texte | `typography.supporting-text` | Aide, message d'erreur ou légende, sous un champ. |
<!-- /genere:tokens -->

## Accessibilité

- Le libellé est lié au champ : un clic sur lui y met le focus.
- L'aide et l'erreur sont lues après le nom, l'erreur d'abord ; sous une erreur, l'aide quitte l'écran mais reste lue.
- Au focus clavier, le même anneau que le bouton.
- Chaque texte se lit sur la page et sur la surface dans les dix thèmes :

<!-- genere:contrastes : écrit par npm --prefix atelier run fiches -->
| Devant | Fond | Plus bas des 10 thèmes | Seuil |
|---|---|---|---|
| `text.default` | `background.app` | 12,62:1 (Atelier Lavandine, clair) | 4,50:1 |
| `text.default` | `background.surface` | 12,12:1 (Atelier Lavandine, sombre) | 4,50:1 |
| `text.disabled` | `background.disabled` | 3,32:1 (Atelier Lavandine, clair) | 4,50:1, exception écrite |
| `border.focus` | `background.app` | 5,40:1 (Orbe Café, clair) | 3,00:1 |
| `border.focus` | `background.surface` | 5,59:1 (Orbe Café, clair) | 3,00:1 |
| `border.strong` | `background.app` | 3,10:1 (Atelier Lavandine, clair) | 3,00:1 |
| `border.strong` | `background.surface` | 3,10:1 (Atelier Lavandine, sombre) | 3,00:1 |
| `text.secondary` | `background.app` | 5,42:1 (Atelier Lavandine, clair) | 4,50:1 |
| `text.secondary` | `background.surface` | 5,22:1 (Atelier Lavandine, sombre) | 4,50:1 |
| `text.error` | `background.app` | 5,41:1 (Atelier Lavandine, clair) | 4,50:1 |
| `text.error` | `background.surface` | 5,60:1 (Atelier Lavandine, clair) | 4,50:1 |
| `border.error` | `background.app` | 3,10:1 (Atelier Lavandine, clair) | 3,00:1 |
| `border.error` | `background.surface` | 3,11:1 (Atelier Lavandine, sombre) | 3,00:1 |
<!-- /genere:contrastes -->

## En situation

```vue
<script setup>
import DsTextInput from './composants/DsTextInput.vue';
</script>

<template>
  <DsTextInput v-model="courriel" label="Adresse électronique" type="email" autocomplete="email" hint="Pour vous écrire en cas de besoin." required />
</template>
```

Stories : [atelier/stories/DsTextInput.stories.js](../../atelier/stories/DsTextInput.stories.js), story « Planche » (chaque état, et la ligne champ et bouton) et story « Clavier ».

## Décisions et dette

- D49 : le champ, ses props, son libellé au-dessus, son désactivé natif. D51 : tout usage hors des props est refusé.
- B7 : ni groupe de champs, ni résumé d'erreurs ; B11 : la règle du texte d'exemple, écrite ici.
- En clair, le bord d'erreur est pâle et se voit à peine sous l'anneau de focus.
- Le composant montre l'erreur qu'on lui donne ; il ne dit rien d'une validation du navigateur.

## Test de rendu

`npm --prefix atelier run preuve -- text-input` vérifie, dans les dix thèmes, en développement et en version construite :

- le contour, le fond, les dimensions et les textes de chaque état de la planche, sans opacité de Vuetify ;
- deux boîtes de 40 px alignées dans la ligne champ et bouton ;
- sur le premier thème : le nom, la description, l'erreur, l'obligatoire et le désactivé lus par l'arbre d'accessibilité, la touche Tab, l'anneau, l'envoi sans le champ désactivé et les refus.
