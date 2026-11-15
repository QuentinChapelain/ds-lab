# Décisions

Douze décisions, chacune avec sa raison et sa conséquence. Aucune valeur n'est recopiée ici : elles se lisent dans `tokens/orbe-cafe/`.

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
- **Décision** : pleins en trois cas. Sombre : couleur exacte, texte blanc, survol par voile blanc. Moyen : pas 11, texte blanc, survol au pas 12. Clair : couleur exacte, texte au pas 12, survol au pas 10.
- **Raison** : lisibilité jugée sur image ; seuils du cas clair encore à calibrer.
- **Conséquence** : sur une marque moyenne, le bouton ne porte pas la couleur exacte du client.

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
