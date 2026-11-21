---
name: DsAvatar
title: DsAvatar
file: atelier/composants/DsAvatar.vue
props: atelier/composants/DsAvatar.menu.js
wraps: VAvatar
decisions: [D54, D59, D51, D56, D57]
stories: atelier/stories/DsAvatar.stories.js
test: npm --prefix atelier run preuve -- avatar
---

<!-- genere:titre : écrit par npm --prefix atelier run fiches -->
# DsAvatar
<!-- /genere:titre -->

Un rond qui montre la photo d'une personne, ou ses initiales quand la photo manque.

## Quand l'utiliser

- Pour montrer qui est une personne, à côté de son nom : une carte membre, une liste, un commentaire.
- Quand le nom est écrit à côté : `decorative`, pour qu'il ne soit pas lu deux fois.
- Pour un groupe de personnes, un badge d'état ou une couleur par personne : à venir (B5).
- Pour mener vers un profil : le lien appartient à la pièce qui entoure l'avatar, jamais à l'avatar.

## Props

<!-- genere:props : écrit par npm --prefix atelier run fiches -->
| Prop | Type | Obligatoire | Défaut | Valeurs admises | Nom repris de |
|---|---|---|---|---|---|
| `name` | texte | oui | aucun | libre | usage courant |
| `image` | texte | non | aucun | libre | Vuetify |
| `decorative` | booléen | non | `false` | libre | usage courant |
| `size` | texte | non | `'medium'` | `'medium'`, `'large'` | Vuetify |

Événements émis : aucun. Slots : aucun.
<!-- /genere:props -->

- `name` : le nom de la personne ; il donne les initiales et le nom lu par le lecteur d'écran.
- `image` : l'adresse de la photo ; si elle manque ou ne se charge pas, les initiales restent.
- `decorative` : l'avatar se tait, quand le nom est déjà écrit à côté.
- `size` : `medium` par défaut, `large` pour une carte membre.

## Refusé

<!-- genere:refus : écrit par npm --prefix atelier run fiches -->
Attributs admis en plus des props : `id`, `aria-*`, `data-*`. Retirés : `aria-label`, `aria-labelledby`, `aria-hidden`. Attributs `on…` d'événement : refusés.

Tout autre usage lève une erreur, et rien n'est rendu. Messages, dans l'ordre où ils sont vérifiés :

- `DsAvatar : attribut refusé : <attributs>`
- `DsAvatar : name : obligatoire`
- `DsAvatar : size : valeur inconnue : <valeur> (medium, large)`
- `DsAvatar : name : sans lettre`
<!-- /genere:refus -->

Le nom lu vient de `name` et le silence de `decorative` : `aria-label`, `aria-labelledby` et `aria-hidden` posés à la main sont refusés. Un nom sans lettre est refusé.

## Anatomie et tokens

<!-- genere:tokens : écrit par npm --prefix atelier run fiches -->
Un token est le nom d'une valeur de design. Le composant n'a aucune valeur en dur : chaque marque donne la sienne, et changer un token change toutes ses instances.

| Partie | Token | Ce qu'il règle |
|---|---|---|
| Couleur | `background.brand.tint` | Fond teinté de la marque d'une pièce statique qui porte un texte court ou des initiales pour mettre en avant, posée sur la page ou sur une surface ; jamais un fond cliquable. |
| Couleur | `text.brand` | Texte de marque posé sur le fond teinté de la marque, comme les initiales de DsAvatar ou un DsTag mis en avant. |
| Forme | `border-radius.full` | Arrondi complet d'une forme ronde ou en pilule, comme un avatar ou une étiquette. |
| Forme | `avatar-size.medium` | Côté d'un avatar de taille normale. |
| Forme, size large | `avatar-size.large` | Côté d'un grand avatar, comme celui d'une carte membre. |
| Texte | `typography.initials.medium` | Initiales de l'avatar normal. |
| Texte, size large | `typography.initials.large` | Initiales du grand avatar. |
<!-- /genere:tokens -->

## Accessibilité

- L'avatar est lu une fois, par le nom de la personne, avec ou sans photo ; `decorative`, il se tait.
- Il ne se clique pas et n'arrête pas la touche Tab.
- Les initiales : première lettre du premier et du dernier mot, particule et élision sautées, accents gardés (« Hugo de Lassalle » : HL).
- Les initiales se lisent sur leur fond dans les dix thèmes :

<!-- genere:contrastes : écrit par npm --prefix atelier run fiches -->
| Devant | Fond | Plus bas des 10 thèmes | Seuil |
|---|---|---|---|
| `text.brand` | `background.brand.tint` | 10,07:1 (Atelier Lavandine, sombre) | 4,50:1 |
<!-- /genere:contrastes -->

## En situation

```vue
<script setup>
import DsAvatar from './composants/DsAvatar.vue';
const photo = 'portraits/camille-ferrand.jpg';
</script>

<template>
  <DsAvatar name="Camille Ferrand" :image="photo" />
</template>
```

Stories : [atelier/stories/DsAvatar.stories.js](../../atelier/stories/DsAvatar.stories.js), story « Planche » (chaque état aux deux tailles, et les cas des initiales) et story « Accessibilité ».

## Décisions et dette

- D54 : l'avatar, ses props, la règle des initiales, son nom lu. D51 : tout usage hors des props est refusé.
- B5 : l'avatar est fait ; restent le badge d'état, le groupe d'avatars.
- Une photo à fond transparent laisse voir les initiales dessous.
- Limites des initiales : un double nom espagnol donne la lettre du dernier mot ; un titre comme « Dr » compte comme un mot.
- D59 : le fond teinté de la marque, au pas 5 en sombre, se détache d'une surface ; en clair, le rond à initiales reste très pâle sur une surface.

## Test de rendu

`npm --prefix atelier run preuve -- avatar` vérifie, dans les dix thèmes, en développement et en version construite :

- le côté, le rond, le fond et les initiales de chaque état, aux deux tailles, initiales centrées ;
- la photo qui couvre le rond, et l'image en échec qui laisse les initiales ;
- sur le premier thème : l'avatar lu une fois par son nom, ou pas du tout s'il est décoratif, la touche Tab qui ne s'y arrête pas, et les refus.
