# Dans le dépôt d'une autre équipe

Une équipe garde ses marques et ses composants dans son propre dépôt ; ds-lab lui donne un skill et ses contrôles, sans modèle de dépôt à copier (D66).

1. Cloner ds-lab où l'on veut et lancer `npm ci` dedans ; le chemin du clone va dans `DS_LAB`, que seules les commandes du skill lisent.
2. Copier `skill/ds-lab/` dans son dépôt, en `<dépôt>/.claude/skills/ds-lab/` : `SKILL.md`, `conduire.md` (la conduite d'un projet et sa voix, D72) et `contexte.md` (ce que l'IA sait de ds-lab avant son premier message, le lancement, D74), écrits à la main, et trois textes générés par `npm run skill` depuis `docs/regles.md` et `docs/techniques/` : les règles et les défauts, avec pour chacun s'il est contrôlé dans ce dépôt, les consignes, la technique de Vuetify. Les choix propres à ds-lab en sont retirés.
3. Saisir chaque marque (`node "$DS_LAB/src/cli/saisie.js" tokens/<marque>/entree.json`), puis son thème (`node "$DS_LAB/src/cli/vuetify.js" --marque tokens/<marque>`). Le resolver écrit cite les couches communes par `ds-lab:commun/<fichier>`, lu dans le clone qui lit : rien n'y dépend de l'endroit du clone.
4. Vérifier, en local et dans sa CI : `node "$DS_LAB/src/cli/verifier.js" --marques tokens --style "src/**/*.vue" --skill .claude/skills/ds-lab`. Il juge le contraste de chaque marque dans les quatre contextes, les espacements, la typo, le style des composants (CP3) et la copie du skill. Il regroupe les échecs par cause et écrit un bloc par cause : ce qui est cassé, le compte, la règle, puis un seul « À faire ». Une couleur cassée dans une marque fait un seul bloc, quel que soit le nombre de paires et de contextes qu'elle touche ; ici, une marque fictive, Ruche Basse, dans `tokens/<marque>/` :

```
verifier : 2 marques dans tokens/ (Phare Gris, Ruche Basse) ; 3 fichiers de style
✗ contraste · Ruche Basse (tokens/<marque>/) : color.primary.11 (#f2e6c4), lu par text.interactive, border.focus, text.on-interactive.inverse, background.interactive.strong, background.brand.strong ; 16 paires sous leur seuil dans 2 contextes sur 4 (clair, large ; clair, étroit), soit 32 échecs, la plus basse à 1,11:1 (DS12 : 18, DS2 : 14).
  À faire : relancer la saisie sur tokens/<marque>/entree.json ; si elle refuse la marque, changer la couleur qu'elle nomme. Ne pas corriger les jetons à la main.
✗ style · src/components/<Composant>.vue : ligne 7 : Valeur brute « 12px » pour padding (declaration-property-value-allowed-list).
  À faire : prendre var(--v-ds-…) ou rgb(var(--v-theme-…)) ; sinon une exception avec sa raison (CP3).
verifier : 33 échecs en 2 blocs (contraste 32, espacements 0, typo 0, style 1, skill 0)
```

La cause d'un échec de contraste est le jeton primitif par lequel passe le plus de paires en échec de la marque ; celle d'un échec d'espacement ou de typo, sa règle ; celle d'une valeur de style, son fichier et sa règle de Stylelint ; celle d'une copie du skill qui vieillit, la copie (D67).

Limites : les couches communes sont celles du clone qui lit, et la CI de l'équipe fixe son commit ; un outil DTCG tiers ne suit pas l'adresse `ds-lab:` ; le skill est en français ; les règles que `verifier` ne contrôle pas, 27 aujourd'hui (le compte est dans `skill/ds-lab/regles.md`), s'y lisent sans bloquer.
