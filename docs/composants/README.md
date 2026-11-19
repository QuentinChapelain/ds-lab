<!-- genere:index : écrit par npm --prefix atelier run fiches -->
# Fiches des composants

Une fiche par composant de l'atelier : à quoi il sert, ses props, ce qu'il refuse, ses tokens, son accessibilité, un exemple à copier. Les règles qu'ils suivent sont dans [docs/regles.md](../regles.md). Les blocs `genere` de chaque fiche, et cette liste, sont écrits par `npm --prefix atelier run fiches` depuis les props, les composants et les tokens ; `npm --prefix atelier run fiches -- --verifier` refuse une fiche qui ne leur correspond plus.

| Composant | Fiche | À quoi il sert |
|---|---|---|
| `DsTag` | [DsTag (étiquette)](tag.md) | Un mot court sur un fond teinté, pour classer un membre (ville, secteur) ou mettre une qualité en avant (« Mentor ») ; il ne se clique pas. |
<!-- /genere:index -->

## Glossaire

Les mots du métier, tels que les fiches les emploient, et le mot que ds-lab employait avant eux (D57).

| Mot | Ce qu'il veut dire | Ancien mot de ds-lab |
|---|---|---|
| token | Nom d'une valeur de design (couleur, taille, espace, rayon, graisse, interligne, durée), dont chaque marque donne la valeur | jeton |
| token sémantique | Token nommé d'après son usage (`texte.principal`, `fond.surface`), qui pointe vers une primitive | rôle |
| primitive | Valeur brute d'une échelle (`couleur.neutre.3`, `taille.24`), jamais employée seule par un composant (DS9) | primitive |
| composant | Pièce d'interface de ds-lab, posée sur une pièce de Vuetify qu'elle seule emploie (CP4) | enveloppe (wrapper) |
| prop | Réglage d'un composant (`tone`, `size`) | option |
| props | Liste de tous les réglages d'un composant, avec leurs valeurs admises | menu |
| slot | Contenu passé à un composant entre ses balises (`default`, `actions`) | emplacement |
| événement | Ce qu'un composant émet (`click`) ; un attribut `on…` l'écoute | écouteur |
| vérification des props | Ce qui refuse tout usage hors des props, avec un message, avant tout rendu (CP2) | fabrique |
| test de rendu | Vérification dans un navigateur, sur les dix thèmes, de ce que rend un composant | preuve |
| thème | Couleurs et variables d'une marque, en clair ou en sombre, données à Vuetify | thème |
| marque | Client fictif dont les tokens donnent les valeurs | marque |
