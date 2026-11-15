# Décisions

Quatorze décisions, chacune avec sa raison et sa conséquence. Aucune valeur n'est recopiée ici : elles se lisent dans `tokens/orbe-cafe/`.

### D01
- **Décision** : les rôles se nomment propriété.sens.emphase.état.
- **Raison** : la propriété d'abord dit où le rôle s'applique.
- **Conséquence** : un nouveau rôle suit ce schéma.

### D02
- **Décision** : un rôle qui porte la marque pointe vers un emplacement de la couche marque, jamais vers une teinte de marque ; les rôles neutres et de statut pointent directement vers leurs primitives, communes à toutes les marques.
- **Raison** : changer de marque sans réécrire les rôles.
- **Conséquence** : le fichier de rôles est le même pour toutes les marques.

### D03
- **Décision** : la paire texte sur fond est fixée et vérifiée à la saisie de la marque.
- **Raison** : pas de calcul par le navigateur.
- **Conséquence** : une marque qui échoue est refusée avant d'entrer.

### D04
- **Décision** : pleins du primaire et de l'accent, lus sur l'échelle, dans cet ordre. 1. Blanc ≥ 4,5 sur le pas 9 : couleur exacte, texte blanc ; survol par voile blanc de 8 % si le blanc atteint 5,5 (sombre), sinon par voile noir de 15 % (soutenu), valeur calculée et formule en `$extensions` dans les deux cas. 2. Sinon, pas 12 ≥ 7 sur le pas 9 et ≥ 4,5 sur le pas 10 : couleur exacte, texte au pas 12, survol au pas 10 (clair). 3. Sinon : pas 11, texte blanc, survol au pas 12 (moyen). Les quatre statuts gardent leur bouton d'avant l'étape 4, figé dans `src/tokens/pleins.js`. Aucun forçage de la couleur exacte.
- **Raison** : lisibilité jugée sur image le 15/11/2026 ; seuil 7 : un jaune saturé à 7,18, une turquoise à 7,19 et un vert à 7,22 jugés bons, 6,57 et 5,33 jugés mauvais. Survol soutenu : le pas 10 restait à ΔE 1,33 du repos, invisible ; le voile noir le met à ΔE 6,68 sur Atelier Lavandine. L'accessibilité est une obligation légale : pas d'option hors garantie.
- **Conséquence** : la couleur exacte du client est sur le bouton dès qu'un texte lisible s'y pose ; sinon le bouton prend le pas 11. Statuts figés pour que la couche marque d'Orbe Café reste identique ; le bouton d'avertissement garde un texte foncé à 5,77 (`KNOWN_ISSUES.md`).

### D05
- **Décision** : primaire = ce qui se clique ; accent = identité, rare, jamais porteur d'un sens ; sans accent saisi, repli sur un neutre.
- **Raison** : usage constaté dans les systèmes de référence.
- **Conséquence** : le bouton secondaire est neutre.

### D06
- **Décision** : une paire interdite porte sa règle de remplacement.
- **Raison** : c'est une décision de design, pas une exception.
- **Conséquence** : le contrôle l'affiche sans échouer.

### D07
- **Décision** : les bordures discrète et par défaut sont décoratives, jamais seules pour repérer un champ ou un état.
- **Raison** : elles sont sous 3:1.
- **Conséquence** : elles n'ont pas de paire.

### D08
- **Décision** : le rôle s'appelle marge-interieure et non retrait.
- **Raison** : « retrait » désigne l'alinéa en typographie.
- **Conséquence** : vocabulaire à garder.

### D09
- **Décision** : l'écart interne prend le plus petit pas non nul de l'échelle, et seul l'écart de section se réduit en étroit.
- **Raison** : majorité des systèmes de référence.
- **Conséquence** : voir DS4 et DS6 (`docs/regles.md`).

### D10
- **Décision** : onze styles de texte, un seul rôle d'affichage grand.
- **Raison** : contraintes du cas d'entraînement.
- **Conséquence** : ne pas ajouter un style jumeau d'un autre.

### D11
- **Décision** : le style mention est plus petit que corps.petit.
- **Raison** : le WCAG n'impose aucune taille minimale, et à taille égale les deux rôles étaient jumeaux.
- **Conséquence** : voir D10.

### D12
- **Décision** : les tailles de texte restent en px pour l'instant.
- **Raison** : l'outil de migration n'indexe pas le rem.
- **Conséquence** : voir `KNOWN_ISSUES.md`.

### D13
- **Décision** : une marque entre par un fichier d'entrée et `npm run saisie` ; une couleur saisie donne une échelle générée (pas 9 = couleur saisie), le nom d'une échelle existante est réservé à Orbe Café. Trois motifs de refus : entrée invalide, `checkValise` en échec sur une échelle générée, paire de rôles sous son seuil.
- **Raison** : D03, la paire est vérifiée à la saisie ; Orbe Café garde ses échelles écrites à la main.
- **Conséquence** : une marque refusée n'écrit rien. Primaire grise, primaire proche d'un statut et accent proche du primaire ne sont pas des refus : ils sont montrés dans la table de calibrage.

### D14
- **Décision** : deux niveaux d'aplat de marque, non cliquables : clair (`fond.marque.discret`, pas 3 du primaire ; `fond.accent.discret`, pas 3 de l'accent) et plein (`fond.marque.fort`, valeur du plein du primaire). Sur l'aplat plein, tout passe en retourné : texte `texte.sur-marque`, bouton inversé (`fond.interactif.inverse`, `texte.sur-interactif.inverse`, dont seul le texte change au survol), anneau `bordure.focus.inverse`. Titres de marque : `texte.marque.grand`, pour l'affichage et les titres 1 et 2 seulement, pas 9 du primaire s'il tient 3:1 sur les fonds clairs, sinon 10, sinon 11, choisi à la saisie.
- **Raison** : créer du relief dans une page avec la couleur du client ; sur l'aplat plein, l'anneau au pas 11 tombait entre 1,00 et 1,55:1 pour six marques sur huit.
- **Conséquence** : sur `fond.marque.fort`, `texte.marque.grand`, `texte.interactif`, le bouton principal et `bordure.focus` sont des paires interdites, chacune avec sa règle (D06). `fond.accent.fort` reste aux petites surfaces.
