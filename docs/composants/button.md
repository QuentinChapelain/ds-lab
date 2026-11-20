---
name: DsButton
title: DsButton
file: atelier/composants/DsButton.vue
props: atelier/composants/DsButton.menu.js
wraps: VBtn
decisions: [D43, D51, D56, D57]
stories: atelier/stories/DsButton.stories.js
test: npm --prefix atelier run preuve -- button
---

<!-- genere:titre : écrit par npm --prefix atelier run fiches -->
# DsButton
<!-- /genere:titre -->

Un bouton qui lance une action sur la page : enregistrer, ajouter, supprimer ; il ne mène pas vers une autre page.

## Quand l'utiliser

- Pour l'action principale d'une vue : `variant` `primary`, un seul par vue (B8).
- Pour une action à côté de la principale : `secondary` ; pour une action discrète, dans une ligne ou une barre : `ghost`.
- Pour une action qui détruit (supprimer un membre) : `danger`, ou `danger-ghost` quand elle n'est pas l'action principale.
- Pour une action sans texte, avec une icône seule : `DsIconButton`.
- Pour aller vers une autre page : un lien, à venir (B9). Pour une carte qui se clique : `DsCard` avec `href`.
- Pour un bouton qui reste enfoncé (« ajouter aux favoris ») : bouton bascule, à venir (D52).

## Props

<!-- genere:props : écrit par npm --prefix atelier run fiches -->
| Prop | Type | Obligatoire | Défaut | Valeurs admises | Nom repris de |
|---|---|---|---|---|---|
| `variant` | texte | non | `'primary'` | `'primary'`, `'secondary'`, `'ghost'`, `'danger'`, `'danger-ghost'` | Vuetify |
| `size` | texte | non | `'medium'` | `'medium'`, `'small'` | Vuetify |
| `prependIcon` | objet ou fonction | non | `null` | libre | Vuetify |
| `block` | booléen | non | `false` | libre | Vuetify |
| `disabled` | booléen | non | `false` | libre | HTML |
| `loading` | booléen | non | `false` | libre | Vuetify |
| `type` | texte | non | `'button'` | `'button'`, `'submit'`, `'reset'` | HTML |

Événements émis : `click`. Slots : `default`.
<!-- /genere:props -->

- `variant` : le poids de l'action, du plus fort au plus discret ; `danger` et `danger-ghost` pour ce qui détruit.
- `size` : `medium` par défaut ; `small` dans une ligne serrée, comme une barre d'outils.
- `prependIcon` : une icône avant le texte, faite par `icone()` d'un chemin de Material Design Icons ; elle est muette.
- `block` : le bouton prend toute la largeur de son parent.
- `disabled` : l'action est indisponible ; le bouton reste atteignable au clavier, mais rien ne se passe.
- `loading` : l'action est en cours ; le bouton garde sa largeur, son nom et le focus, et une roue tourne.
- `type` : `button` par défaut ; `submit` envoie le formulaire qui l'entoure, `reset` le vide.

## Refusé

<!-- genere:refus : écrit par npm --prefix atelier run fiches -->
Attributs admis en plus des props : `id`, `aria-*`, `data-*`. Retirés : aucun. Attributs `on…` d'événement : admis.

Tout autre usage lève une erreur, et rien n'est rendu. Messages, dans l'ordre où ils sont vérifiés :

- `DsButton : attribut refusé : <attributs>`
- `DsButton : variant : valeur inconnue : <valeur> (primary, secondary, ghost, danger, danger-ghost)`
- `DsButton : size : valeur inconnue : <valeur> (medium, small)`
- `DsButton : type : valeur inconnue : <valeur> (button, submit, reset)`
- `DsButton : disabled : refusé avec type=submit`
<!-- /genere:refus -->

`disabled` sur un bouton d'envoi est refusé : un formulaire qu'on ne peut pas envoyer doit dire pourquoi, pas cacher son bouton.

## Anatomie et tokens

<!-- genere:tokens : écrit par npm --prefix atelier run fiches -->
Un token est le nom d'une valeur de design. Le composant n'a aucune valeur en dur : chaque marque donne la sienne, et changer un token change toutes ses instances.

| Partie | Token | Ce qu'il règle |
|---|---|---|
| Couleur, au focus | `bordure.focus` | Anneau de focus clavier, autour du composant qui a le focus. |
| Couleur, disabled | `fond.desactive` | Fond d'un composant désactivé, quelle que soit sa variante (bouton plein ou secondaire). |
| Couleur, disabled | `texte.desactive` | Texte d'un composant désactivé, sur son fond ou sur la page. |
| Couleur, variant primary | `fond.interactif.fort` | Plein de l'action principale, comme le bouton qui valide. |
| Couleur, variant primary | `texte.sur-interactif` | Texte posé sur le plein de l'action principale, au repos comme au survol. |
| Couleur, variant primary, au survol | `fond.interactif.fort.survol` | Plein de l'action principale survolée. |
| Couleur, variant primary, au survol | `texte.sur-interactif` | Texte posé sur le plein de l'action principale, au repos comme au survol. |
| Couleur, variant secondary | `fond.surface` | Fond d'une carte ou d'un champ, posé sur le fond de la page. |
| Couleur, variant secondary | `texte.principal` | Texte courant et titres. |
| Couleur, variant secondary | `bordure.forte` | Contour qui suffit à repérer un champ ou une case à cocher. |
| Couleur, variant secondary, au survol | `fond.composant.survol` | Fond d'un composant survolé par le pointeur. |
| Couleur, variant secondary, au survol | `texte.principal` | Texte courant et titres. |
| Couleur, variant secondary, disabled | `bordure.discrete` | Séparateur léger entre deux zones, décoratif, jamais seule pour repérer un champ ou un état. |
| Couleur, variant ghost | `texte.interactif` | Texte d'un lien ou d'une action sans fond plein. |
| Couleur, variant ghost, au survol | `fond.interactif.discret` | Fond teinté d'un élément interactif peu appuyé, comme un bouton léger ou une ligne sélectionnée. |
| Couleur, variant danger | `fond.erreur.fort` | Plein qui signale une erreur ou une action destructrice. |
| Couleur, variant danger | `texte.sur-erreur` | Texte posé sur le plein d'erreur. |
| Couleur, variant danger, au survol | `fond.erreur.fort.survol` | Plein qui signale une erreur ou une action destructrice, survolé. |
| Couleur, variant danger, au survol | `texte.sur-erreur` | Texte posé sur le plein d'erreur. |
| Couleur, variant danger-ghost | `texte.erreur` | Texte d'un message d'erreur. |
| Couleur, variant danger-ghost, au survol | `fond.erreur.discret` | Fond léger d'un message ou d'un champ en erreur. |
| Forme | `arrondi.controle` | Arrondi d'un contrôle, comme un bouton ou un champ, le même à toutes les tailles. |
| Forme | `hauteur.controle.normale` | Hauteur d'un contrôle de taille normale, comme un bouton. |
| Forme | `taille-icone.normale` | Icône d'un contrôle de taille normale. |
| Forme | `ecart.icone-texte` | Écart entre l'icône et le texte d'un contrôle, comme un bouton ou un champ. |
| Forme | `marge-interieure.composant` | Marge intérieure d'un composant à bord visible, comme une carte, un encadré ou une zone de formulaire. |
| Forme, au focus | `epaisseur.focus` | Épaisseur de l'anneau de focus clavier. |
| Forme, au focus | `decalage.focus` | Décalage de l'anneau de focus clavier hors du composant, pour qu'il se pose sur le fond de la page et jamais sur le plein. |
| Forme, size small | `hauteur.controle.petite` | Hauteur d'un contrôle de petite taille, comme un bouton. |
| Forme, size small | `taille-icone.petite` | Icône d'un contrôle de petite taille. |
| Forme, variant secondary | `epaisseur.contour` | Épaisseur du contour d'un contrôle, comme le bouton secondaire. |
| Texte | `typo.libelle` | Libellé de champ, de bouton ou d'onglet, toujours dans la police du produit. |
<!-- /genere:tokens -->

## Accessibilité

- Le texte du slot `default` est le nom du bouton : un verbe qui dit l'action (« Ajouter un membre »).
- `disabled` et `loading` posent `aria-disabled`, jamais l'attribut natif : le bouton reste dans l'ordre de la touche Tab, et le lecteur d'écran le dit indisponible.
- En chargement, une zone de statut annonce « Chargement en cours ».
- Au focus clavier, un anneau se pose sur la page, décalé du bouton (DS2).
- Chaque texte se lit sur son fond dans les dix thèmes :

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
import DsButton from './composants/DsButton.vue';
import { mdiPlus } from '@mdi/js';
import { icone } from './composants/icone.js';
const Plus = icone(mdiPlus);
</script>

<template>
  <DsButton :prepend-icon="Plus" @click="ajouter">Ajouter un membre</DsButton>
</template>
```

Stories : [atelier/stories/DsButton.stories.js](../../atelier/stories/DsButton.stories.js), story « Planche », story « Clavier » et story « Largeur ».

## Décisions et dette

- D43 : le bouton, ses props, son désactivé atteignable, son chargement. D44 : son texte prend toujours la police du produit. D45 : le survol des pleins. D51 : tout usage hors des props est refusé.
- B8 : un seul bouton principal par vue, règle écrite ici, sans contrôle.
- La roue tourne d'un tour par seconde, valeur écrite dans le composant : aucun token de durée encore (B2).

## Test de rendu

`npm --prefix atelier run preuve -- button` vérifie, dans les dix thèmes, en développement et en version construite :

- les couleurs, l'anneau et les dimensions de chacun des 50 boutons de la planche, au repos, au survol, au focus, désactivés et en chargement ;
- la police du produit sur le texte, et deux rendus identiques au pixel ;
- sur le premier thème : l'ordre de la touche Tab, le désactivé et le chargement muets au clavier comme à la souris, l'annonce du chargement, la pleine largeur et les refus.
