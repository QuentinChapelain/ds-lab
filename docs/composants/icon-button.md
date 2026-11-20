---
name: DsIconButton
title: DsIconButton
file: atelier/composants/DsIconButton.vue
props: atelier/composants/DsIconButton.menu.js
wraps: VBtn (par DsButton)
decisions: [D52, D51, D56, D57]
stories: atelier/stories/DsIconButton.stories.js
test: npm --prefix atelier run preuve -- icon-button
---

<!-- genere:titre : écrit par npm --prefix atelier run fiches -->
# DsIconButton
<!-- /genere:titre -->

Un bouton carré, une icône sans texte, pour une action connue de tous : fermer, rechercher, modifier, supprimer.

## Quand l'utiliser

- Pour une action courante dont l'icône se comprend seule, dans une barre, une carte ou un champ de recherche.
- Pour une action qui a besoin d'un mot : `DsButton`, avec ou sans icône.
- Pour une icône qui informe sans agir : pas de bouton, une icône muette à côté d'un texte.
- Pour l'info-bulle qui redit le `label` au survol : à venir (B1).
- Pour un bouton qui reste enfoncé (« ajouter aux favoris ») : bouton bascule, à venir (D52).

## Props

<!-- genere:props : écrit par npm --prefix atelier run fiches -->
| Prop | Type | Obligatoire | Défaut | Valeurs admises | Nom repris de |
|---|---|---|---|---|---|
| `label` | texte | oui | aucun | libre | usage courant |
| `icon` | objet ou fonction | oui | aucun | libre | Vuetify |
| `variant` | texte | non | `'ghost'` | `'ghost'`, `'secondary'`, `'primary'`, `'danger-ghost'` | Vuetify |
| `size` | texte | non | `'medium'` | `'medium'`, `'small'` | Vuetify |
| `disabled` | booléen | non | `false` | libre | HTML |
| `type` | texte | non | `'button'` | `'button'`, `'submit'`, `'reset'` | HTML |

Événements émis : `click`. Slots : aucun.
<!-- /genere:props -->

- `label` : le nom de l'action, lu par le lecteur d'écran ; il nomme l'action (« Fermer »), jamais le dessin (« Croix »).
- `icon` : l'icône, faite par `icone()` d'un chemin de Material Design Icons ; elle est muette.
- `variant` : `ghost` par défaut ; `secondary`, `primary`, et `danger-ghost` pour ce qui détruit. Pas de `danger` plein.
- `size` : `medium` (le carré a la hauteur d'un bouton normal) ou `small`.
- `disabled` : l'action est indisponible ; le bouton reste atteignable au clavier.
- `type` : `button` par défaut, `submit` pour envoyer un formulaire, comme une recherche.

## Refusé

<!-- genere:refus : écrit par npm --prefix atelier run fiches -->
Attributs admis en plus des props : `id`, `aria-*`, `data-*`. Retirés : `aria-label`, `aria-labelledby`. Attributs `on…` d'événement : admis.

Tout autre usage lève une erreur, et rien n'est rendu. Messages, dans l'ordre où ils sont vérifiés :

- `DsIconButton : attribut refusé : <attributs>`
- `DsIconButton : label : obligatoire`
- `DsIconButton : icon : obligatoire`
- `DsIconButton : variant : valeur inconnue : <valeur> (ghost, secondary, primary, danger-ghost)`
- `DsIconButton : size : valeur inconnue : <valeur> (medium, small)`
- `DsIconButton : type : valeur inconnue : <valeur> (button, submit, reset)`
- `DsIconButton : disabled : refusé avec type=submit`
<!-- /genere:refus -->

Le nom vient du `label` : `aria-label` et `aria-labelledby` posés à la main sont refusés.

## Anatomie et tokens

<!-- genere:tokens : écrit par npm --prefix atelier run fiches -->
Un token est le nom d'une valeur de design. Le composant n'a aucune valeur en dur : chaque marque donne la sienne, et changer un token change toutes ses instances.

| Partie | Token | Ce qu'il règle |
|---|---|---|
| Couleur, au focus | `bordure.focus` | Anneau de focus clavier, autour du composant qui a le focus. |
| Couleur, disabled | `fond.desactive` | Fond d'un composant désactivé, quelle que soit sa variante (bouton plein ou secondaire). |
| Couleur, disabled | `texte.desactive` | Texte d'un composant désactivé, sur son fond ou sur la page. |
| Couleur, variant ghost | `texte.interactif` | Texte d'un lien ou d'une action sans fond plein. |
| Couleur, variant ghost, au survol | `fond.interactif.discret` | Fond teinté d'un élément interactif peu appuyé, comme un bouton léger ou une ligne sélectionnée. |
| Couleur, variant secondary | `fond.surface` | Fond d'une carte ou d'un champ, posé sur le fond de la page. |
| Couleur, variant secondary | `texte.principal` | Texte courant et titres. |
| Couleur, variant secondary | `bordure.forte` | Contour qui suffit à repérer un champ ou une case à cocher. |
| Couleur, variant secondary, au survol | `fond.composant.survol` | Fond d'un composant survolé par le pointeur. |
| Couleur, variant secondary, au survol | `texte.principal` | Texte courant et titres. |
| Couleur, variant secondary, disabled | `bordure.discrete` | Séparateur léger entre deux zones, décoratif, jamais seule pour repérer un champ ou un état. |
| Couleur, variant primary | `fond.interactif.fort` | Plein de l'action principale, comme le bouton qui valide. |
| Couleur, variant primary | `texte.sur-interactif` | Texte posé sur le plein de l'action principale, au repos comme au survol. |
| Couleur, variant primary, au survol | `fond.interactif.fort.survol` | Plein de l'action principale survolée. |
| Couleur, variant primary, au survol | `texte.sur-interactif` | Texte posé sur le plein de l'action principale, au repos comme au survol. |
| Couleur, variant danger-ghost | `texte.erreur` | Texte d'un message d'erreur. |
| Couleur, variant danger-ghost, au survol | `fond.erreur.discret` | Fond léger d'un message ou d'un champ en erreur. |
| Forme | `arrondi.controle` | Arrondi d'un contrôle, comme un bouton ou un champ, le même à toutes les tailles. |
| Forme | `hauteur.controle.normale` | Hauteur d'un contrôle de taille normale, comme un bouton. |
| Forme | `taille-icone.normale` | Icône d'un contrôle de taille normale. |
| Forme | `ecart.icone-texte` | Écart entre l'icône et le texte d'un contrôle, comme un bouton ou un champ. |
| Forme | `marge-interieure.composant` | Marge intérieure d'un composant à bord visible, comme une carte, un encadré ou une zone de formulaire. |
| Forme, au focus | `epaisseur.focus` | Épaisseur de l'anneau de focus clavier. |
| Forme, au focus | `decalage.focus` | Décalage de l'anneau de focus clavier hors du composant, pour qu'il se pose sur le fond de la page et jamais sur le plein. |
| Forme, size medium | `hauteur.controle.normale` | Hauteur d'un contrôle de taille normale, comme un bouton. |
| Forme, size small | `hauteur.controle.petite` | Hauteur d'un contrôle de petite taille, comme un bouton. |
| Forme, size small | `taille-icone.petite` | Icône d'un contrôle de petite taille. |
| Forme, variant secondary | `epaisseur.contour` | Épaisseur du contour d'un contrôle, comme le bouton secondaire. |
| Texte | `typo.libelle` | Libellé de champ, de bouton ou d'onglet, toujours dans la police du produit. |
<!-- /genere:tokens -->

## Accessibilité

- Le `label` devient le nom du bouton ; l'icône est muette.
- Il garde tout le comportement du `DsButton` qu'il rend : `disabled` atteignable au clavier, anneau de focus sur la page.
- Sans info-bulle, le nom ne se voit pas : l'icône doit se comprendre seule.
- L'icône se lit sur son fond dans les dix thèmes :

<!-- genere:contrastes : écrit par npm --prefix atelier run fiches -->
| Devant | Fond | Plus bas des 10 thèmes | Seuil |
|---|---|---|---|
| `texte.principal` | `fond.surface` | 12,12:1 (Atelier Lavandine, sombre) | 4,50:1 |
| `texte.sur-interactif` | `fond.interactif.fort` | 5,01:1 (Atelier Lavandine, clair) | 4,50:1 |
| `texte.sur-interactif` | `fond.interactif.fort.survol` | 6,26:1 (Atelier Lavandine, clair) | 4,50:1 |
| `texte.sur-erreur` | `fond.erreur.fort` | 5,60:1 (Atelier Lavandine, clair) | 4,50:1 |
| `texte.sur-erreur` | `fond.erreur.fort.survol` | 6,82:1 (Atelier Lavandine, clair) | 4,50:1 |
| `texte.principal` | `fond.composant.survol` | 10,96:1 (Atelier Lavandine, clair) | 4,50:1 |
| `texte.interactif` | `fond.interactif.discret` | 5,03:1 (Écume et Sel, clair) | 4,50:1 |
| `texte.erreur` | `fond.erreur.discret` | 5,06:1 (Atelier Lavandine, clair) | 4,50:1 |
| `texte.desactive` | `fond.desactive` | 3,32:1 (Atelier Lavandine, clair) | 4,50:1, exception écrite |
| `bordure.focus` | `fond.app` | 5,40:1 (Orbe Café, clair) | 3,00:1 |
| `bordure.focus` | `fond.surface` | 5,59:1 (Orbe Café, clair) | 3,00:1 |
| `bordure.forte` | `fond.app` | 3,10:1 (Atelier Lavandine, clair) | 3,00:1 |
| `bordure.forte` | `fond.surface` | 3,10:1 (Atelier Lavandine, sombre) | 3,00:1 |
<!-- /genere:contrastes -->

## En situation

```vue
<script setup>
import DsIconButton from './composants/DsIconButton.vue';
import { mdiClose } from '@mdi/js';
import { icone } from './composants/icone.js';
const Croix = icone(mdiClose);
</script>

<template>
  <DsIconButton label="Fermer" :icon="Croix" @click="fermer" />
</template>
```

Stories : [atelier/stories/DsIconButton.stories.js](../../atelier/stories/DsIconButton.stories.js), story « Planche » (chaque variante, chaque taille, chaque état, et deux lignes d'alignement), story « Survol de près » et story « Clavier ».

## Décisions et dette

- D52 : le bouton à icône seule, ses props, et Material Design Icons. D51 : tout usage hors des props est refusé.
- Il rend un `DsButton` et en lit les classes : les renommer le casse, et seul le test de rendu le voit.
- Le survol des variantes `ghost` se voit à peine contre la page ; c'est le seul signe du survol, avec le curseur.
- Pas d'info-bulle (B1), pas de bouton bascule.

## Test de rendu

`npm --prefix atelier run preuve -- icon-button` vérifie, dans les dix thèmes, en développement et en version construite :

- pour chacun des 32 boutons de la planche : un carré de la hauteur du contrôle, une icône centrée de la taille du token, les couleurs, le contour et l'anneau ;
- le même haut et le même bas dans les deux lignes d'alignement ;
- sur le premier thème : le nom égal au `label`, l'icône muette, la touche Tab, le désactivé muet, l'envoi et les refus.
