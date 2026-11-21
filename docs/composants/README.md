<!-- genere:index : écrit par npm --prefix atelier run fiches -->
# Fiches des composants

Une fiche par composant de l'atelier : à quoi il sert, ses props, ce qu'il refuse, ses tokens, son accessibilité, un exemple à copier. Les règles qu'ils suivent sont dans [docs/regles.md](../regles.md). Les blocs `genere` de chaque fiche, et cette liste, sont écrits par `npm --prefix atelier run fiches` depuis les props, les composants et les tokens ; `npm --prefix atelier run fiches -- --verifier` refuse une fiche qui ne leur correspond plus.

| Composant | Fiche | À quoi il sert |
|---|---|---|
| `DsButton` | [DsButton](button.md) | Un bouton qui lance une action sur la page : enregistrer, ajouter, supprimer ; il ne mène pas vers une autre page. |
| `DsIconButton` | [DsIconButton](icon-button.md) | Un bouton carré, une icône sans texte, pour une action connue de tous : fermer, rechercher, modifier, supprimer. |
| `DsTextInput` | [DsTextInput](text-input.md) | Un champ pour une saisie d'une ligne, avec son libellé au-dessus, une aide et un message d'erreur. |
| `DsCard` | [DsCard](card.md) | Une surface qui groupe un titre, un texte, une image et des actions, ou qui mène tout entière vers une page. |
| `DsAvatar` | [DsAvatar](avatar.md) | Un rond qui montre la photo d'une personne, ou ses initiales quand la photo manque. |
| `DsTag` | [DsTag](tag.md) | Un mot court sur un fond teinté, pour classer un membre (ville, secteur) ou mettre une qualité en avant (« Mentor ») ; il ne se clique pas. |
<!-- /genere:index -->

## Glossaire

Les mots du métier, tels que les fiches les emploient, et le mot que ds-lab employait avant eux (D57).

| Mot | Ce qu'il veut dire | Ancien mot de ds-lab |
|---|---|---|
| token | Nom d'une valeur de design (couleur, taille, espace, rayon, graisse, interligne, durée), dont chaque marque donne la valeur | jeton |
| token sémantique | Token nommé d'après son usage (`text.default`, `background.surface`), qui pointe vers une primitive | rôle |
| primitive | Valeur brute d'une échelle (`color.neutral.3`, `size.24`), jamais employée seule par un composant (DS9) | primitive |
| composant | Pièce d'interface de ds-lab, posée sur une pièce de Vuetify qu'elle seule emploie (CP4) | enveloppe (wrapper) |
| module | Assemblage de composants pour un usage du produit (`MemberCard`), sans pièce de Vuetify ni valeur visuelle propre ; ailleurs, *pattern* | module |
| prop | Réglage d'un composant (`tone`, `size`) | option |
| props | Liste de tous les réglages d'un composant, avec leurs valeurs admises | menu |
| slot | Contenu passé à un composant entre ses balises (`default`, `actions`) | emplacement |
| événement | Ce qu'un composant émet (`click`) ; un attribut `on…` l'écoute | écouteur |
| vérification des props | Ce qui refuse tout usage hors des props, avec un message, avant tout rendu (CP2) | fabrique |
| test de rendu | Vérification dans un navigateur, sur les dix thèmes, de ce que rend un composant | preuve |
| thème | Couleurs et variables d'une marque, en clair ou en sombre, données à Vuetify | thème |
| marque | Client fictif dont les tokens donnent les valeurs | marque |
