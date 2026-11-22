# Quai Nord

L'app de l'association des anciens : l'accueil, les événements, l'adhésion. Elle est servie sous trois marques, Écume et Sel, Grenat Papeterie et Maison Alberto, chacune en clair et en sombre ; on change de marque dans la barre du haut, ou par l'adresse (`?marque=ecume-et-sel&mode=sombre`).

```
npm ci
npm run dev       http://127.0.0.1:5173
npm run build     version construite, dans dist/
```

- `src/pages/` : une page par adresse, déclarée dans `src/router.js`.
- `src/gabarit/` : le gabarit de toutes les pages ; son mode d'emploi est `docs/gabarit.md`.
- `src/components/ds/` : les composants du design system, copiés de ds-lab.
- `docs/composants/` : leurs fiches.
- `src/plugins/vuetify.js` : les thèmes des trois marques, lus dans `tokens/`.
- `src/data/` : les réponses figées de l'API (membres, événements).
- `tokens/<marque>/` : l'entrée de chaque marque, donnée par l'équipe de marque, et ce que ds-lab en a tiré.
