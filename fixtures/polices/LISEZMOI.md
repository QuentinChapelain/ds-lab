# Polices d'essai

Quatre vraies polices sous licence libre (SIL Open Font License 1.1), pour éprouver la saisie d'une police des titres (étape 4, séance c). Chaque dossier porte sa licence, `OFL.txt`, recopiée du paquet d'origine.

Source : paquets Fontsource 5.3.0 (`@fontsource-variable/oswald`, `@fontsource-variable/eb-garamond`, `@fontsource-variable/cinzel`, `@fontsource/bebas-neue`), sous-ensemble latin, fichiers recopiés sans modification ; aucun paquet n'est une dépendance du dépôt.

| Police | Fichier | Rôle dans les essais |
|---|---|---|
| Oswald | `fixtures/polices/oswald/oswald-latin-wght-normal.woff2` | Étroite et haute : grande hauteur de capitale, axe de graisse 200 à 700 |
| EB Garamond | `fixtures/polices/eb-garamond/eb-garamond-latin-wght-normal.woff2` | Capitale basse, accents hauts, axe de graisse 400 à 800 |
| Cinzel | `fixtures/polices/cinzel/cinzel-latin-wght-normal.woff2` | Sans minuscules (capitales et petites capitales), axe de graisse 400 à 900 |
| Bebas Neue | `fixtures/polices/bebas-neue/bebas-neue-latin-400-normal.woff2` | Sans minuscules, une seule graisse (400) : cas de refus |
| Bebas Neue, WOFF | `fixtures/polices/bebas-neue/bebas-neue-latin-400-normal.woff` | Format autre que WOFF2 : cas de refus |

Mesures [F], en unités de la police (1 000 par em pour les quatre), lues avec fontTools 4.60.2, installé hors du dépôt :

```
python3 -m pip install --target local/outils/fonttools fonttools brotli
PYTHONPATH=local/outils/fonttools python3 -c "from fontTools.ttLib import TTFont; t = TTFont('<fichier>'); o = t['OS/2']; print(o.sCapHeight, o.sxHeight)"
```

| Police | Capitale | x | Ascendante, descendante (hhea) | Graisses | Licence (`name` 14) |
|---|---|---|---|---|---|
| Oswald | 810 | 578 | 1193, −289 | axe 200 à 700 | renseignée |
| EB Garamond | 650 | 400 | 1007, −298 | axe 400 à 800 | renseignée |
| Cinzel | 700 | 500 | 976, −372 | axe 400 à 900 | renseignée |
| Bebas Neue | 700 | 700 | 900, −300 | 400 seulement | renseignée |

Les quatre couvrent les signes français exigés ; le champ `name` 13 (description de licence) est vide dans les quatre, le 14 (adresse de la licence) est renseigné.
