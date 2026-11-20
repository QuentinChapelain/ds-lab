<!-- genere:index : écrit par npm --prefix atelier run fiches -->
# Fiches des modules

Une fiche par module de l'atelier : un assemblage de composants pour un usage du produit, sans pièce de Vuetify ni valeur visuelle propre. Chaque fiche dit à quoi il sert, ses props, ce qu'il refuse, sa mise en page, son accessibilité, et donne un exemple à copier. Les fiches des composants et le glossaire sont dans [docs/composants/](../composants/README.md), les règles dans [docs/regles.md](../regles.md). Les blocs `genere` de chaque fiche, et cette liste, sont écrits par `npm --prefix atelier run fiches` depuis les props, les composants et les tokens ; `npm --prefix atelier run fiches -- --verifier` refuse une fiche qui ne leur correspond plus.

| Module | Fiche | À quoi il sert |
|---|---|---|
| `MemberCard` | [MemberCard](member-card.md) | Un membre d'un annuaire : sa photo ou ses initiales, son nom qui mène à son profil, sa promo et une suite de `DsTag`. |
| `MemberList` | [MemberList](member-list.md) | Une liste d'annuaire : une colonne de `MemberCard`, dans l'ordre des données. |
<!-- /genere:index -->
