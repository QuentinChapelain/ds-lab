# Le dossier de jeu

La base du dossier où l'on joue le parcours (D75) : `npm run jeu -- <dossier>` y pose ces fichiers, ceux de `fixtures/marque-demo/` qu'elle nomme, le skill du clone par un lien et les réglages de Claude Code.

| Fichier | Rôle |
|---|---|
| `CLAUDE.md` | Ce que l'IA sait du dossier : le site fictif, le projet à écrire, comment repartir de zéro |
| `site.mjs` | Sert les pages de `fixtures/marque-demo/` sur `127.0.0.1:4173`, et la feuille tierce sur `localhost:4174` ; ports fixes, car le projet nomme l'adresse |

Posés par la commande, depuis `fixtures/marque-demo/` : `cible.json` (copie de `cible-valise.json`) et `sources.json`.

Pas d'entrée de marque : l'IA la lit sur le site et l'écrit (`conduire.md`, la marque).
