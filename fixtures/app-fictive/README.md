# Quai Nord

L'app de l'association des anciens : l'accueil, les événements, l'adhésion. Elle est servie sous trois marques, Écume et Sel, Grenat Papeterie et Maison Alberto, chacune en clair et en sombre ; on change de marque dans la barre du haut, ou par l'adresse (`?marque=ecume-et-sel&mode=sombre`).

```
npm ci
npm run dev       http://127.0.0.1:5173
npm run build     version construite, dans dist/
```

- `src/pages/` : une page par adresse, déclarée dans `src/router.js`.
- `src/plugins/vuetify.js` : les thèmes des trois marques.
- `src/data/` : les réponses figées de l'API (membres, événements).
- `tokens/<marque>/entree.json` : l'entrée de chaque marque, donnée par l'équipe de marque.
