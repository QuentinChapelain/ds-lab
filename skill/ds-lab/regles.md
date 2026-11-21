# Règles du design system

Généré par `npm run skill` depuis `docs/regles.md` du clone de ds-lab : ne pas le modifier à la main, le recopier quand le clone avance.

Une règle est vraie ou fausse, un contrôle la tranche. Un défaut est une valeur posée, sans seuil sourcé : il bloque comme une règle et se change par une décision écrite. Une technique est le comment d'une règle dans un framework (`techniques/`). Une consigne se lit, rien ne la contrôle (`consignes.md`). Les renvois D<n> se lisent dans `docs/decisions.md` du clone.

Dans ce dépôt, `verifier` contrôle 16 des 43 règles et défauts ; 27 ne sont pas contrôlés ici. Pour une règle « Non contrôlée ici », rien ne bloque : l'agent la tient en la lisant.

## Design system

| | Règle | Raison | Seuil | Technique | Contrôle dans ce dépôt |
|---|---|---|---|---|---|
| DS1 | Sur un plein, texte foncé seulement s'il atteint 7:1 sur le plein (et 4,5:1 sur le survol) ; sinon texte blanc | En dessous, conforme au ratio, mais le texte vibre | Jugement sur image consigné (D04) | — | Non contrôlée ici |
| DS2 | L'anneau de focus se pose sur le fond de page, jamais sur le plein, et y tient son seuil ; son décalage est DF1 | Sur une marque moyenne, anneau et plein ont la même couleur | WCAG 1.4.11 (3:1) | — | `verifier` (contraste) |
| DS3 | Le parent porte l'espace, l'enfant n'a pas de marge | Pas de fusion de marges, responsive simple | — | — | Non contrôlée ici |
| DS5 | Les écarts sont strictement croissants | La hiérarchie se lit à la distance | — | — | `verifier` (espacements) |
| DS6 | En étroit, une valeur ne dépasse pas sa valeur large, et l'ordre des écarts et des titres tient ; ce qui change en étroit est DF2 | Une page étroite ne grossit rien, et sa hiérarchie se lit comme en large | — | — | `verifier` (espacements, typo) |
| DS8 | Affichage et titres strictement décroissants, en large et en étroit | Hiérarchie à toutes les largeurs | — | — | `verifier` (typo) |
| DS9 | Ne jamais prendre une primitive s'il existe un rôle pour la relation | Sinon les valeurs libres reviennent | — | — | Non contrôlée ici |
| DS10 | Un style de texte ne porte pas de couleur | Séparer forme et couleur | — | — | Non contrôlée ici |
| DS11 | Affichage et titres 1 à 3 portent une consigne commune de hauteur de capitale, la même pour toutes les polices ; aucun autre style n'en porte ; son rapport est DF3 | Une police de client change la hauteur visible des titres ; une règle unique, sans réglage par marque (D17) | — | — | `verifier` (typo) |
| DS12 | Chaque fond nomme son texte, et la paire tient son seuil dans tous les thèmes | Un texte lisible ne dépend pas de la marque (D03) | WCAG 1.4.3 et 1.4.11 (4,5:1, 3:1) ; exceptions avec leur raison dans `tokens/commun/paires.json` ; repli : la saisie refuse la marque | — | `verifier` (contraste) |
| DS13 | Le primaire, c'est ce qui se clique : aucun rôle d'interaction ne pointe sur l'accent ; l'accent est CS3 | Une couleur qui veut dire « cliquable » ne sert pas à décorer (D05) | — | — | Non contrôlée ici |
| DS14 | Une paire interdite porte sa règle de remplacement | Interdire sans dire quoi faire laisse le choix au hasard (D06) | — | — | `verifier` (contraste) |
| DS15 | Une bordure discrète ou par défaut est décorative, jamais seule pour repérer un champ ou un état | Elle n'atteint pas 3:1 (D07) | WCAG 1.4.11 | — | Non contrôlée ici |
| DS17 | En marque blanche, le libellé (boutons, champs, onglets) prend la police du produit, que la marque ne remplace pas ; titres et texte suivent DF4 | La lisibilité d'un formulaire ne dépend pas d'une police d'affiche (D16, D44) | — | — | `verifier` (typo) |
| DS18 | L'interligne du corps (grand et moyen) vaut au moins 1,5 | Les lignes d'un paragraphe ne se mêlent pas | WCAG 1.4.8, niveau AAA (technique suffisante C21) | — | `verifier` (typo) |

## Nommage

| | Règle | Raison | Seuil | Technique | Contrôle dans ce dépôt |
|---|---|---|---|---|---|
| NM1 | L'interface publique est en anglais : noms de composants, props, valeurs, événements, slots, classes CSS `ds-`, noms des tokens, variables CSS et du thème, couleurs du thème ; le texte est CS4 | Un utilisateur externe et un agent lisent les noms des grands design systems | — | Oui | Non contrôlée ici |
| NM2 | Un composant prend le nom le plus courant parmi ceux qui désignent sa fonction dans les design systems de référence (Component Gallery) ; d'après la fonction, pas la forme ; singulier, PascalCase, sans abréviation, préfixé ; une famille partage son dernier mot (`DsIconButton` est un `DsButton`) | Un nom courant se devine ; un nom en deux mots ne heurte aucun élément HTML (guide de style de Vue, règle « multi-word component names ») ; « parmi ceux qui désignent sa fonction » écarte un nom courant qui désigne aussi une autre pièce | Component Gallery, relevé du 19/11/2026 (D57) | — | Non contrôlée ici |
| NM3 | Une prop prend le nom du même concept dans le HTML (`disabled`, `required`, `href`), sinon dans le framework des composants, sinon le nom courant ; ses valeurs disent l'usage, jamais une mesure (`small`, pas `32`) | Un utilisateur du HTML ou du framework ne réapprend rien ; une valeur vague ne s'explique pas | — | Oui | Non contrôlée ici |
| NM4 | Un token est nommé d'après son usage, `propriété.sens.emphase.état`, jamais d'après une teinte ni un pas ; il nomme un rôle, pas un objet, et un token qui règle une seule pièce porte son nom de code (`avatar-size`, `background.avatar`) | Changer de couleur ne doit pas renommer un token (D01) ; le nom de code dit qui lit le token (D63) | — | — | Non contrôlée ici |
| NM5 | Un module prend un nom de domaine suivi de sa pièce de base, sans préfixe (`MemberCard` est une `DsCard`, `MemberList` une liste) ; ses props reprennent le nom de la prop du composant assemblé quand le concept est le même (`href`, `image`, `headingLevel`) | `Ds` dit « pièce du design system » ; un module appartient au produit, et son nom dit ce qu'il assemble (D61) | — | — | Non contrôlée ici |

## Composants

| | Règle | Raison | Seuil | Technique | Contrôle dans ce dépôt |
|---|---|---|---|---|---|
| CP1 | Un composant est statique ou interactif, jamais les deux : un composant sans événement refuse tout attribut `on…` | Une pièce qui « se clique un peu » n'a ni rôle ni focus (D50, D55) | — | Oui | Non contrôlée ici |
| CP2 | Tout usage hors des props est refusé, avec un message qui nomme le composant et la prop, et rien n'est rendu | Une erreur visible tout de suite vaut mieux qu'un rendu faux (D51) | — | — | Non contrôlée ici |
| CP3 | Aucune valeur visuelle en dur dans un composant : couleur, taille, espace, rayon, ombre, graisse, interligne, durée | Chaque marque donne ses valeurs ; changer un token change toutes ses instances. DS9 refuse la primitive, CP3 la valeur nue | — | Oui | `verifier` (style) |
| CP4 | Une pièce du framework ne paraît que dans le composant qui l'enveloppe | Le composant est le seul endroit à changer (D41, D43) | — | Oui | Non contrôlée ici |
| CP5 | Le nom accessible vient d'une prop obligatoire ; un `aria-label` posé à la main est refusé quand le composant le pose | Un bouton à icône sans nom est muet (D52, D54) | — | — | Non contrôlée ici |
| CP6 | Ce qui mène ailleurs est un lien (`href`) ; ce qui agit est un bouton ; dans une page, CS5 | Le clavier et le lecteur d'écran savent ce que sont un lien et un bouton (D50) | — | — | Non contrôlée ici |
| CP7 | Un composant refuse un usage, jamais une donnée : pas de limite de longueur sur un texte venu des données ; trop long, il est coupé par « … » et reste entier dans la page | Un refus ferait disparaître une donnée (D55) | — | — | Non contrôlée ici |
| CP9 | Un module n'emploie aucune pièce du framework : seulement des composants `Ds…` et d'autres modules | Le composant reste le seul endroit à changer (CP4, D61) | — | Oui | Non contrôlée ici |
| CP10 | Le style d'un module ne porte que la mise en page : variables du thème, mots-clés, 0 et 100 %, sans calcul ni valeur nue | Ses pièces portent les valeurs visuelles ; un module qui en écrit une la sort des tokens (D61) | — | Oui | Non contrôlée ici |

## Documentation

| | Règle | Raison | Seuil | Technique | Contrôle dans ce dépôt |
|---|---|---|---|---|---|
| DOC1 | Chaque composant a sa fiche (`docs/composants/`), et chaque module la sienne (`docs/modules/`), aux mêmes sections | Un humain et un agent savent où chercher | — | — | Non contrôlée ici |
| DOC2 | Ce qui se déduit du code est généré, jamais recopié | Une copie vieillit sans le dire | — | — | Non contrôlée ici |
| DOC3 | Chaque token cité par une fiche dit en une phrase ce qu'il règle et où il sert (`$description`) : ni pas d'échelle, ni numéro de règle ou de décision, ni nom d'un autre token, ni mesure. Ce qui sert à l'équipe (raison, décision, mesure) va dans `$extensions["ds-lab.note"]` | Le lecteur sait à quoi sert un token sans ouvrir la source ; l'équipe ne perd rien | — | — | Non contrôlée ici |
| DOC4 | Vocabulaire du métier (token, prop, slot, événement) ; chaque mot propre à ds-lab est au glossaire (`docs/composants/README.md`) | Le lecteur externe parle la langue des design systems | — | — | Non contrôlée ici |

## Défauts

| | Défaut | Valeur | Raison | Décision | Contrôle dans ce dépôt |
|---|---|---|---|---|---|
| DS4 | L'écart entre composants vaut au moins le double de l'écart interne | 2 × | On doit voir à quel champ appartient un message ; régularité observée dans les systèmes lus, pas une norme | D65 | `verifier` (espacements) |
| DS7 | Une hauteur de ligne est un multiple de la grille ; la méthode est CS1 | 4 px | Grille | D65 | `verifier` (typo) |
| DOC5 | Une fiche se lit en deux minutes : 500 mots écrits au plus, hors en-tête, tableaux, code et blocs générés | 500 mots | Elle est lue sur un téléphone | D57 | Non contrôlée ici |
| DF1 | L'anneau de focus est décalé hors du composant (de DS2) | 2 px | Il se pose sur le fond, pas sur le plein | D65 | Non contrôlée ici |
| DF2 | Seuls l'écart de section et les grands textes (affichage, titres 1 à 3) changent en étroit (de DS6) | Sous 600 px [H] | Pratique observée dans les systèmes de référence | D65 | Non contrôlée ici |
| DF3 | Rapport de la consigne de hauteur de capitale (de DS11) | 0,7 × la taille [H] | Hypothèse, à juger sur image | D17 | Non contrôlée ici |
| DF4 | Les titres (affichage, titres 1 à 3) prennent la police du client ; le titre 4, le corps et la mention celle du produit, sauf si l'entrée en déclare une (de DS17) | `font.product` | Le client ne change pas la police du texte ; le système garde la capacité de la changer | D16, D44 | `verifier` (typo) |
| DF5 | Interligne des petits styles (corps petit, libellé, texte d'aide) | Au moins 1,3 | Valeur posée, sans norme | D65 | `verifier` (typo) |
| DF6 | Taille du corps moyen | Au moins 1 rem (16 px) | Taille de texte par défaut des navigateurs | D65 | `verifier` (typo) |
| DF7 | Aucune taille de texte sous ce seuil, en large et en étroit | 12 px | Valeur posée, sans norme | D65 | `verifier` (typo) |
