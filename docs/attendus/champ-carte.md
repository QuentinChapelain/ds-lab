# Attendu : champ de texte et carte (deux enveloppes, fabrique commune)

Message de Claude (`2026-11-19-01-de-claude-lot-champ-carte.md`) et ses deux compléments (`2026-11-19-01b-de-claude-trous-du-ds.md`, `2026-11-19-01c-de-claude-fabrique-commune.md`), mot pour mot, sauf les données d'un site réel retirées à la recopie (signalées entre crochets) ; puis les réponses au plan (`2026-11-19-03-de-claude-reponses-plan-champ-carte.md`), mot pour mot. Plan : `2026-11-19-02-de-claude-code-plan-champ-carte.md` et `2026-11-19-02b-de-claude-code-plan-fabrique-commune.md`, dans la boîte aux lettres, hors dépôt. Go de Quentin le 19/11/2026, 0 h 33.

## Message

### Lot « champ-carte » (étape 6) : demande de plan

De : Claude, pour Claude Code, terminal de ds-lab. 19/11/2026, 0 h 12.
PLAN SEULEMENT : aucun fichier modifié, aucun commit. Quentin donne le go en collant le message qui renvoie à ce fichier.

#### 0. Contrôle

`git status` propre ; HEAD attendu `70b92d7` = `origin/main` ; CI de `main` verte (exécution 44412028700). Crée la branche `champ-carte`. Une seule branche de travail à la fois.

#### 1. Deux enveloppes, sur le modèle du bouton (D43 à D45)

Même règles : Vue 3, Vuetify 4.3.4 dessous, menu seul, liste blanche d'attributs (id, aria-*, data-*, écouteurs), tout le reste lève et rien n'est rendu. Aucune valeur écrite dans l'enveloppe : tout vient des jetons et du thème Vuetify de la marque.

##### Champ de texte (`ChampTexte.vue`)

| Option | Valeurs | Règle |
|---|---|---|
| libellé | texte | Obligatoire, sinon erreur. Rendu par un `<label for>` au-dessus du champ, pas par le libellé flottant de Vuetify |
| aide | texte | Sous le champ, relié par `aria-describedby` |
| erreur | texte | Remplace l'aide visuellement ; `aria-invalid="true"` ; relié par `aria-describedby` ; bordure et texte en rôle erreur |
| obligatoire | booléen | `aria-required` ; marque visible dans le libellé (propose le texte) |
| désactivé | booléen | Dis ce que Vuetify fait (attribut natif ou non) et propose, comme pour le bouton |
| type | texte, e-mail, recherche, mot de passe | Tout autre type lève |
| icône avant | option | Décorative (`aria-hidden`), `taille-icone.normale` |

Variante Vuetify : `outlined`. Hauteur : `hauteur.controle.normale` (40 px), une seule. Arrondi : `arrondi.controle`. Hors menu : compteur, effacement, préfixe, suffixe, autres variantes, densités.

##### Carte (`Carte.vue`)

| Option | Valeurs | Règle |
|---|---|---|
| titre | texte | Obligatoire. Vrai titre `h2`, `h3` ou `h4` |
| niveau | 2, 3, 4 | 3 par défaut ; autre valeur lève |
| texte | emplacement | |
| média | option | Texte alternatif obligatoire ; vide accepté seulement s'il est donné explicitement (image décorative) |
| actions | emplacement | Boutons de l'enveloppe Bouton |
| lien | adresse | Le titre devient le lien, étendu à toute la carte (stretched link, pseudo-élément) ; focus visible sur toute la carte ; **lien et actions ensemble lèvent** |

Surface : `fond.surface`, bordure `epaisseur.contour`, sans ombre (variante Vuetify `outlined` ou `flat`, dis laquelle et pourquoi). Marge intérieure : `marge-interieure.composant`. Rôle d'arrondi de surface à créer sur `rayon.12` (propose le nom). Survol de la carte à lien : propose, sans ombre.

#### 2. Ce que je veux lu dans le code de Vuetify 4.3.4, pas supposé

- `VTextField` : comment il relie libellé, messages et erreur (`aria-describedby`, `aria-invalid`) ; ce qu'il fait de `disabled` ; si on peut garder ses messages ou s'il faut les rendre nous-mêmes.
- `VCard` : ce qu'il rend avec `href`/`to` (tout en `<a>` ?) ; pourquoi on ne doit pas lui passer le lien.
Marque [H] ce que tu supposes.

#### 3. Jetons et contrastes

- Bord du champ au repos : 3:1 contre `fond.surface` et `fond.app`, dans les 10 thèmes (WCAG 1.4.11). Mesure `bordure.defaut` et `bordure.forte` ; si aucun ne passe partout, propose un rôle `bordure.champ`.
- Bord de la carte : décoratif, pas d'exigence de contraste ; dis lequel tu prends.
- Texte d'exemple : 4,5:1 (`texte.secondaire`) ; texte d'erreur : `texte.erreur` à 4,5:1.
- Dis quels rôles manquent et lesquels existent déjà. Tableau des ratios mesurés dans l'attendu.

#### 4. Garde, preuve, vitrine

- Garde : aucun `VTextField` / `v-text-field` ni `VCard` / `v-card` hors des enveloppes, comme E1 pour le bouton.
- Tests : chaque refus du menu ; liens `aria-*` présents dans le rendu ; lien + actions refusé ; titre au bon niveau.
- Clavier et lecteur d'écran : focus visible du champ et de la carte à lien ; une seule tabulation par carte à lien.
- Vitrine Storybook : champ (repos, focus, rempli, aide, erreur, obligatoire, désactivé, avec icône) ; carte (simple, avec média, avec actions, à lien au repos, survol, focus) ; 5 marques fictives, clair et sombre ; une ligne « champ + bouton normal » pour vérifier l'alignement des 40 px.
- Planche PNG par thème dans `local/champ-carte-captures/`, hors dépôt.
- Décisions D49 (champ) et D50 (carte) ; attendu `docs/attendus/champ-carte.md`.

#### 5. Ce que j'attends dans ta réponse

Pour chaque point : fichiers touchés, tests ajoutés, découpage en commits, et les questions de design à poser à Quentin (en mots simples, avec une recommandation). Écris le plan dans `local/boite-aux-lettres/2026-11-19-02-de-claude-code-plan-champ-carte.md`, en plus du terminal.

## Complément : trous du design system

### Complément au lot « champ-carte » : trous du design system

De : Claude, pour Claude Code. 19/11/2026, 0 h 20. Complète le fichier 01, ne le remplace pas.
Quentin veut qu'on identifie les trous du design system à l'occasion de ce lot. Voici ma liste, lue sur les jetons et KNOWN_ISSUES ; **confirme ou infirme chaque ligne dans ton plan (fichier 02), et ajoute ceux que tu trouves en implémentant.**

#### A. À combler dans ce lot (le champ ou la carte en ont besoin)

| # | Trou | Constat | Proposition à confirmer |
|---|---|---|---|
| A1 | Arrondi des surfaces | Seul `arrondi.controle` (8) existe ; `rayon.12` et `rayon.pilule` sans rôle [F] | Rôle d'arrondi de surface sur `rayon.12` |
| A2 | Bord d'un champ à 3:1 | `bordure.defaut` (pas 7) passe-t-il 3:1 contre `fond.surface` et `fond.app` ? [V] | Mesurer ; rôle `bordure.champ` si besoin |
| A3 | Écart interne d'une carte | `espace.12` sans rôle (KNOWN_ISSUES) ; seuls `ecart.dans-composant` (4) et `entre-composants` (16) | Dire si la carte en a besoin |
| A4 | Texte d'exemple | Aucun rôle dédié ; `texte.secondaire` à 4,5:1 ? [V] | Réutiliser ou créer, avec le ratio |
| A5 | Survol d'une carte à lien | Pas d'ombre dans le système [F] ; `fond.composant.survol` ou bordure | Proposer, sans ombre |

#### B. Pas dans ce lot : à noter dans KNOWN_ISSUES, avec le moment où ça mordra

| # | Trou | Mordra à |
|---|---|---|
| B1 | Aucun jeton d'élévation, de superposition (z-index) ni de voile | Menu déroulant et fenêtre [numéros de pièces de l'inventaire hors dépôt, retirés à la recopie] |
| B2 | Aucun jeton de mouvement (durées, courbes) ; le bouton gère `prefers-reduced-motion` à la main [F] | Menu, fenêtre, focus animé |
| B3 | Pas d'état « sélectionné » ni « coché » en rôle | Onglet, case à cocher [numéros de pièces retirés à la recopie] |
| B4 | Pas de police d'icônes choisie [constat sur un site réel, retiré à la recopie] | Bouton à icône seule (prochain lot) |
| B5 | Avatar [compte relevé sur un site réel, retiré à la recopie ; la plus grosse dette] et étiquette sans enveloppe | Carte membre, étape 8 |
| B6 | Pas de grille ni de largeurs de conteneur ; seuil étroit 600 px [H] | Liste d'annuaire, étape 8 |
| B7 | Motifs de formulaire absents : groupe de champs, résumé d'erreurs, état vide, chargement d'une liste | Étape 8 |
| B8 | Aucune règle d'usage écrite (« un seul bouton principal par vue », quand une carte est un lien) | Étape 7, fiches |

Ne traite pas le bloc B dans ce lot : liste-le seulement, avec ton avis.

## Complément : fabrique commune des enveloppes

### Complément au lot « champ-carte » : fabrique commune des enveloppes

De : Claude, pour Claude Code. 19/11/2026, 0 h 19. Complète les fichiers 01 et 01b.

Demande de Quentin : que chaque nouvelle enveloppe coûte moins que le bouton. Ajoute au plan un module partagé par les enveloppes (Bouton, ChampTexte, Carte, puis les suivantes) qui porte :

- la liste blanche d'attributs (id, aria-*, data-*, écouteurs) et le refus qui lève ;
- la vérification d'une option contre ses valeurs admises, avec le même message d'erreur partout ;
- si c'est simple, les tests génériques de refus, rejoués sur chaque enveloppe.

Chaque enveloppe ne déclare plus que son menu. Le bouton y passe dans ce lot, sans changer son comportement : ses tests actuels doivent passer tels quels. Dis dans le plan le commit où tu le fais et ce que ça retire de `Bouton.vue`.

Relève aussi le temps réel du lot (heure de début, heure de chaque arrêt), pour comparer au prévu.

## Réponses au plan

### Réponses au plan : champ-carte

De : Claude, pour Claude Code, terminal de ds-lab. 19/11/2026, 0 h 32.
Réponse à `2026-11-19-02-de-claude-code-plan-champ-carte.md` et `2026-11-19-02b-de-claude-code-plan-fabrique-commune.md`. Le plan est accepté avec les réponses ci-dessous. Quentin donne le go en collant le message qui renvoie à ce fichier. Découpage en 7 commits du 02b.

#### Questions techniques, tranchées par Claude

| Q | Réponse |
|---|---|
| Q1 | **Non à ta recommandation.** Désactivé = attribut natif `disabled` (comportement de Vuetify) : la valeur d'un champ désactivé ne doit pas partir avec le formulaire. Le champ reste dans l'arbre d'accessibilité (lu en navigation) ; l'aide reste liée. Le bouton ne change pas. Écris l'écart avec le bouton dans D49, et la raison |
| Q2 | Oui : `aria-describedby` = erreur puis aide ; l'aide masquée à l'écran reste lue |
| Q5 | Oui pour les quatre : `modelValue`, `nom`, `autocomplete`, `exemple`. Règle D49 : l'exemple ne remplace jamais le libellé ni l'aide |
| Q6 | Oui : `VField` et `VInput` dans la détection |
| Q8 | `arrondi.surface` → `{rayon.12}` |
| Q10 | 28 px partout dans ce lot ; l'étroit en dette avec B6 |
| Q12 | Refusé, comme proposé |
| Q13 | D51 à part |
| `aria-describedby` / `aria-invalid` posés à la main | Oui, ils lèvent |

#### Questions de design, tranchées par Quentin sur image (0 h 31)

| Q | Réponse |
|---|---|
| Q3 | « (obligatoire) » après le libellé, en `texte.secondaire` |
| Q4 | L'anneau du bouton, décalé ; le contour d'erreur reste visible au focus |
| Q7 | Survol : contour `bordure.defaut` → `bordure.forte` et titre souligné ; même rendu au focus, plus l'anneau |
| Q9 | **Non à ta recommandation : format fixe 16:9, image recadrée au centre** (`object-fit: cover`), pleine largeur en haut, sans marge. Une grille de cartes garde une même hauteur d'image. Coins hauts arrondis comme tu le proposes |
| Q11 | Titre en `texte.principal`, souligné au survol et au focus |

#### Rappels

- Trous du bloc B et ajouts B9 à B11 : dans KNOWN_ISSUES au commit 7, avec ton avis.
- Relevé du temps dans `local/champ-carte-temps.md`, recopié à chaque arrêt.
- Arrêts : commit 1 (attendu), puis commit 6 (planches PNG de `local/champ-carte-captures/`, avec une planche par thème, clair et sombre, et la ligne d'alignement champ + bouton). Compte rendu de chaque arrêt dans la boîte : `2026-11-19-04-…` puis suivants.
- Rien sur `main`. Branche `champ-carte` poussée pour la CI avant l'arrêt des planches.

## Valeurs attendues, écrites à la main le 19/11/2026

Ce que le code devra donner, d'après le plan (`2026-11-19-02-…`, `2026-11-19-02b-…`) et les réponses ci-dessus. Les couleurs et les dimensions sont lues dans les jetons par un résolveur écrit à part, sans rien importer de `src/`. Les rapports sont calculés par culori 4.0.2 (`wcagContrast`). Le script et la commande sont en fin de section.

### Lu dans le code de Vuetify 4.3.4 [F]

Fichiers lus : `VTextField.js`, `VInput.js`, `VField.js`, `VField.css`, `VCard.js`, `VCard.css`, `VCardActions.js`, `VImg.js` (`lib/components/`), `composables/router.js`, `util/helpers.js`.

**`VTextField` :**
- **Libellé.** L'`<input>` porte toujours `aria-labelledby="<id>-label"`. L'élément `<id>-label` n'existe qu'avec la prop `label` (libellé flottant).
- **Messages.** Avec des messages, `aria-describedby="<id>-messages"` vise un `<div role="alert" aria-live="polite">`, rendu même vide sauf avec `hide-details`.
- **Erreur.** Jamais d'`aria-invalid`. La prop `error` peint le contour et le libellé de la couleur de thème `error`, qui est `fond.erreur.fort`.
- **Désactivé.** `disabled` pose l'attribut natif sur l'`<input>`, et l'opacité `--v-disabled-opacity` sur tout le champ.
- **Texte d'exemple.** Il est dans la couleur du texte, à l'opacité `--v-disabled-opacity`.
- **Contour en `outlined`.** Il est porté par `.v-field__outline` : 1 px de la couleur du texte à 38 %, plus opaque au survol, 2 px au focus, transition de 250 ms.
- **Hauteur.** `--v-input-control-height: 56px` en densité par défaut.
- **Ordre des attributs.** Les attributs de l'appelant passent après ceux de Vuetify (`mergeProps(…, slotProps, inputAttrs)`). `filterInputAttrs` laisse `class`, `style`, `id` et `data-*` à la racine, le reste va à l'`<input>`.

**`VCard` :**
- **Lien.** Avec `href` ou `to`, toute la carte est un `<a>`.
- **Clic.** Un écouteur de clic la rend « cliquable » (`isClickable = isLink || hasEvent(attrs, 'click')`) : voile, ondulation, `v-card--link`, sans rôle ni focus.
- **Titre.** `VCardTitle` est un `<div>`.
- **Actions.** `VCardActions` impose à ses `VBtn` `variant: 'text'` et `slim: true`.
- **Variantes.** `flat` donne le fond `surface` sans ombre. `outlined` donne un fond transparent et un contour `currentColor`. `elevated`, le défaut, a une ombre.

**`VImg` :**
- Elle enveloppe l'image dans un `div role="img" aria-label=<alt>`, avec un chargement différé et un fondu.

### Jetons

**Rôle ajouté** (`tokens/commun/semantique.tokens.json`) :

| Rôle | Alias | Valeur |
|---|---|---|
| `arrondi.surface` | `{rayon.12}` | 12 px, la même dans les dix thèmes |

**Rien d'autre :** aucun rôle de couleur, aucune primitive, aucune paire de `paires.json`.

**Descriptions corrigées :**
- **`bordure.defaut`**
  - avant : « Contour ordinaire d'une carte ou d'un champ, décoratif, jamais seule pour repérer un champ ou un état. »
  - après : « Contour ordinaire d'une carte ou d'un séparateur, décoratif ; jamais seul pour repérer un champ ou un état (sous 3:1 : un champ prend bordure.forte). »
- **`fond.composant`**
  - avant : « Fond d'un composant au repos, comme un champ, une carte ou un bouton secondaire. »
  - après : « Fond d'un composant au repos, plus soutenu que la surface ; un champ, une carte et le bouton secondaire se posent sur fond.surface. »

**Variables ajoutées à la table Vuetify** (`tokens/commun/vuetify.json`, section `variables`). Il y en a 20, et la table passe de 17 à 37. Le plan en annonçait 19 ; la vingtième est un ajout de cet attendu, à valider (voir « Ajouts trouvés »).

| Variable | Jeton | Champ | Valeur |
|---|---|---|---|
| `ds-texte-secondaire` | `texte.secondaire` | | couleur ; texte d'exemple, aide, « (obligatoire) » |
| `ds-texte-erreur` | `texte.erreur` | | couleur ; message d'erreur |
| `ds-contour-erreur` | `bordure.erreur` | | couleur ; contour d'un champ en erreur |
| `ds-contour-carte` | `bordure.defaut` | | couleur ; `sansPaire` : « bordure décorative, sans paire (D07) » |
| `ds-arrondi-surface` | `arrondi.surface` | | 12px |
| `ds-ecart-dans-composant` | `ecart.dans-composant` | | 4px |
| `ds-ecart-entre-composants` | `ecart.entre-composants` | | 16px |
| `ds-corps-police`, `-taille`, `-graisse`, `-interligne` | `typo.corps.moyen` | `fontFamily`, `fontSize`, `fontWeight`, `lineHeight` | police du texte de la marque ; 16px ; 400 ; 1.5 |
| `ds-mention-police`, `-taille`, `-graisse`, `-interligne` | `typo.mention` | idem | police du texte de la marque ; 12px ; 400 ; 1.3333 |
| `ds-titre-carte-police`, `-taille`, `-graisse`, `-interligne` | `typo.titre.3` | idem | police des titres de la marque ; 20px ; 600 ; 1.4 |
| `ds-titre-carte-hauteur-capitale` | `police.titre.hauteur-capitale` | | 0.7 (`font-size-adjust: cap-height`, DS11) |

`ds-contour` (`bordure.forte`) sert aussi au champ : sa description devient « Contour du bouton secondaire et du champ (3:1 sur la page et sur la surface) ».

**Fichiers régénérés :** `tokens/<marque>/vuetify.json` (`npm run vuetify`), et ce que `npm run css` change pour `arrondi.surface` (liste exacte au commit).

### Couleurs et rapports [F]

Les neutres et les statuts sont communs : chaque valeur ci-dessous est la même dans les cinq marques, par mode. Le script l'a vérifié : un seul jeu de valeurs par mode sur les cinq marques.

| Paire | Clair | Sombre | Seuil | Attendu |
|---|---|---|---|---|
| `bordure.forte` sur `fond.surface` | `#958f84` / `#ffffff` 3,21 | `#6a665c` / `#181818` 3,10 | 3 | passe : contour du champ |
| `bordure.forte` sur `fond.app` | `#958f84` / `#fbfbfb` 3,10 | `#6a665c` / `#121212` 3,27 | 3 | passe |
| `bordure.defaut` sur `fond.surface` | `#bfbbb5` / `#ffffff` 1,91 | `#45423b` / `#181818` 1,77 | 3 | échoue : jamais pour un champ |
| `bordure.defaut` sur `fond.app` | `#bfbbb5` / `#fbfbfb` 1,85 | `#45423b` / `#121212` 1,87 | — | contour de la carte, décoratif |
| `bordure.erreur` sur `fond.surface` | `#e76862` / `#ffffff` 3,20 | `#c6232c` / `#181818` 3,11 | 3 | passe |
| `bordure.erreur` sur `fond.app` | `#e76862` / `#fbfbfb` 3,10 | `#c6232c` / `#121212` 3,28 | 3 | passe |
| `texte.secondaire` sur `fond.surface` | `#6d675b` / `#ffffff` 5,61 | `#8f8b81` / `#181818` 5,22 | 4,5 | passe : texte d'exemple |
| `texte.secondaire` sur `fond.app` | `#6d675b` / `#fbfbfb` 5,42 | `#8f8b81` / `#121212` 5,51 | 4,5 | passe : aide, « (obligatoire) » |
| `texte.erreur` sur `fond.surface` | `#cb1d2a` / `#ffffff` 5,60 | `#ff978f` / `#181818` 8,52 | 4,5 | passe |
| `texte.erreur` sur `fond.app` | `#cb1d2a` / `#fbfbfb` 5,41 | `#ff978f` / `#121212` 8,99 | 4,5 | passe |
| `texte.principal` sur `fond.surface` | `#363026` / `#ffffff` 13,06 | `#d8d5ce` / `#181818` 12,12 | 4,5 | passe : texte saisi, titre et texte de carte |
| `texte.principal` sur `fond.app` | `#363026` / `#fbfbfb` 12,62 | `#d8d5ce` / `#121212` 12,78 | 4,5 | passe : libellé |
| `texte.desactive` sur `fond.desactive` | `#8a8478` / `#f3f2f1` 3,32 | `#7d786c` / `#1b1b1b` 3,92 | — | exception écrite (WCAG 1.4.3) |
| `bordure.discrete` sur `fond.app` | `#d8d6d2` / `#fbfbfb` 1,40 | `#303030` / `#121212` 1,42 | — | contour du champ désactivé, décoratif |
| `fond.surface` sur `fond.app` | 1,03 | 1,06 | — | pour mémoire |
| `bordure.defaut` contre `bordure.forte` | 1,68 | 1,75 | — | pour mémoire : survol de la carte à lien |

L'anneau de focus (`bordure.focus`) dépend de la marque. Il se pose sur la page (DS2), autour du champ et de la carte à lien :

| Thème | Couleur | sur `fond.surface` | sur `fond.app` |
|---|---|---|---|
| atelier-lavandine-clair | `#8247ce` | 5,61 | 5,42 |
| atelier-lavandine-sombre | `#c4a4fe` | 8,53 | 9,00 |
| ecume-et-sel-clair | `#21708b` | 5,59 | 5,40 |
| ecume-et-sel-sombre | `#c9efff` | 14,61 | 15,41 |
| grenat-papeterie-clair | `#4f0020` | 15,52 | 15,00 |
| grenat-papeterie-sombre | `#fc96ae` | 8,55 | 9,02 |
| maison-alberto-clair | `#836304` | 5,60 | 5,41 |
| maison-alberto-sombre | `#ffd060` | 12,21 | 12,88 |
| orbe-cafe-clair | `#4c6994` | 5,59 | 5,40 |
| orbe-cafe-sombre | `#86b6fe` | 8,57 | 9,04 |

Seuils : le plus bas des contours qui repèrent est à 3,10 (`bordure.forte` sur la page en clair, `bordure.erreur` sur la page en clair, `bordure.forte` sur la surface en sombre). Le plus bas des textes actifs est à 5,22 (`texte.secondaire` sur la surface en sombre). L'anneau est à 5,40 au plus bas (Écume et Sel et Orbe Café, en clair, sur la page).

### Comportement attendu

**Fabrique commune** (`atelier/composants/fabrique.js`, sans import de Vue ni de Vuetify) :
- **Menus.** Un menu par enveloppe, dans `atelier/composants/<Enveloppe>.menu.js`. Chaque `.vue` est `definirEnveloppe(MENU, setup)` et ne déclare lui-même ni `props`, ni `inheritAttrs`, ni `emits`.
- **Ordre des refus.** Les attributs d'abord : « <composant> : attribut refusé : a, b », dans l'ordre des attributs. Puis les options, dans l'ordre du menu :
  - « <composant> : <option> obligatoire » ;
  - « <composant> : <option> inconnu(e) : <valeur> (<valeurs>) », accordé au genre du nom, à égalité stricte.
  Puis les règles de l'enveloppe, préfixées « <composant> : ». Seul le premier échec est levé, et rien n'est rendu.
- **Moment de la vérification.** Au montage, avant le `setup` de l'enveloppe, puis à chaque rendu.

**Bouton, inchangé.** Ses messages, à l'octet :
- « bouton : attribut refusé : color » ;
- « bouton : variante inconnue : rose (principal, secondaire, discret, danger, danger-discret) » ;
- « bouton : taille inconnue : grande (normale, petite) » ;
- « bouton : type inconnu : image (button, submit, reset) » ;
- « bouton : désactivé refusé sur type=submit ».

`propsDuMenu` appliqué à son menu égale son bloc `props` d'aujourd'hui. Pour chaque option, type et défaut :

| Option | Type | Défaut |
|---|---|---|
| `variante` | String | `'principal'` |
| `taille` | String | `'normale'` |
| `icone` | [Object, Function] | null |
| `pleineLargeur` | Boolean | false |
| `desactive` | Boolean | false |
| `chargement` | Boolean | false |
| `type` | String | `'button'` |

`emits` vaut `['click']`. E1 à E3, B1 à B4, les tests du thème Vuetify et les 84 vérifications de la preuve passent sans modification.

**Champ** (`ChampTexte.vue`, préfixe « champ ») :
- **Options :**
  - `libelle`, obligatoire ;
  - `aide`, `erreur`, `obligatoire`, `desactive` ;
  - `type` : `text` par défaut, `email`, `search` ou `password` ;
  - `icone`, `modelValue`, `nom`, `autocomplete`, `exemple`.
- **Messages :**
  - « champ : libellé obligatoire » ;
  - « champ : type inconnu : <v> (text, email, search, password) » ;
  - « champ : attribut refusé : <a> », y compris pour un `aria-describedby` ou un `aria-invalid` posé à la main.
- **Libellé.** `<label for="<id>" id="<id>-label">` au-dessus du champ, en `typo.libelle` et `texte.principal`. Le nom accessible du champ est le libellé. Avec `obligatoire`, « (obligatoire) » suit le libellé, en `texte.secondaire`, et l'`<input>` porte `aria-required="true"`.
- **Aide et erreur.**
  - `aria-describedby` vaut `<id>-erreur <id>-aide` ; `<id>-aide` seul s'il n'y a pas d'erreur ; il est absent s'il n'y a ni l'une ni l'autre.
  - Avec une erreur : `aria-invalid="true"` ; contour `bordure.erreur` ; message en `typo.mention` et `texte.erreur` ; l'aide est masquée à l'écran mais reste lue.
  - Aucun `role="alert"`. Vuetify ne rend pas ses détails (`hide-details`).
- **Désactivé.**
  - Attribut natif `disabled` : hors de l'ordre du focus, valeur non envoyée avec le formulaire. C'est un écart voulu avec le bouton (D49).
  - Le champ reste dans l'arbre d'accessibilité, désactivé, et l'aide reste liée.
  - Apparence par jetons : fond `fond.desactive`, texte `texte.desactive`, contour `bordure.discrete`, sans l'opacité de Vuetify.
- **Rendu par jetons :**
  - hauteur 40 px (`hauteur.controle.normale`) et arrondi 8 px (`arrondi.controle`) ;
  - fond `fond.surface` ;
  - contour 1 px (`epaisseur.contour`) en `bordure.forte` ;
  - texte saisi en `typo.corps.moyen` et `texte.principal` ;
  - texte d'exemple en `texte.secondaire`, opacité 1 ;
  - marge intérieure de 16 px à gauche et à droite ;
  - écart de 4 px entre le libellé et le champ, et entre le champ et le message ;
  - icône de 20 px, muette, à 8 px du texte ;
  - largeur égale à celle du parent.
- **États.**
  - Le survol ne change rien.
  - Le focus est l'anneau du bouton (`bordure.focus`, 2 px, décalé de 2 px), et le contour d'erreur reste visible au focus.
  - Aucune transition. Pas de croix d'effacement native sur `type="search"`.
- **Texte d'exemple.** Il ne remplace jamais le libellé ni l'aide (règle D49).

**Carte** (`Carte.vue`, préfixe « carte ») :
- **Options :**
  - `titre`, obligatoire ;
  - `niveau` : 2, 3 par défaut, ou 4 ;
  - `media` et `texteAlternatif` ;
  - `lien` ;
  - emplacements `default` (texte) et `actions`.
- **Liste blanche.** `id`, `aria-*`, `data-*`, sans écouteurs.
- **Messages :**
  - « carte : titre obligatoire » ;
  - « carte : niveau inconnu : <v> (2, 3, 4) », la chaîne `"3"` comprise ;
  - « carte : texte alternatif obligatoire avec une image » ;
  - « carte : lien et actions ensemble refusés » ;
  - « carte : actions : seul Bouton est admis » ;
  - « carte : attribut refusé : onClick ».
- **Rendu.** `VCard` en variante `flat`, sans `href`, `to`, ondulation ni `VCardActions`.
  - surface `fond.surface` ;
  - contour 1 px en `bordure.defaut` ;
  - arrondi 12 px (`arrondi.surface`) ;
  - marge intérieure de 16 px ;
  - aucune ombre ;
  - titre `<h2>`, `<h3>` ou `<h4>` selon `niveau`, toujours en `typo.titre.3` : 20 px, graisse 600, ligne de 28 px, police des titres de la marque, consigne de capitale 0,7, à toutes les largeurs (réponse Q10, l'étroit en dette avec B6) ;
  - texte en `typo.corps.moyen` et `texte.principal` ;
  - écart de 4 px entre le titre et le texte, de 16 px entre l'image, le bloc titre et texte, et les actions.
- **Image.** En haut, pleine largeur, sans marge, au format fixe 16:9, recadrée au centre (`object-fit: cover`). Ses coins hauts sont arrondis à 12 px moins l'épaisseur du contour. C'est un `<img>` simple : `alt` vaut `texteAlternatif`, ou `""` s'il est donné vide.
- **Carte à lien :**
  - le titre contient `<a href>` ; son `::after` couvre toute la carte ;
  - une seule tabulation par carte, et le nom du lien est le titre seul ;
  - un clic n'importe où sur la carte suit le lien ;
  - la carte n'a pas d'`overflow: hidden` ;
  - au survol comme au focus, le contour passe en `bordure.forte` et le titre se souligne ;
  - au focus, s'ajoute l'anneau du bouton autour de toute la carte, sur la page ;
  - le titre reste en `texte.principal` ;
  - le texte d'une carte à lien ne contient ni lien ni bouton (règle D50).
- **Carte à actions :** une tabulation par bouton.

**Gardes (lexicales, code de `src/` et de l'atelier, commentaires exclus) :**
- `VTextField`, `v-text-field`, `VField` et `VInput` ne paraissent que dans `ChampTexte.vue` ;
- `VCard` et ses composés, `v-card` et ses classes ne paraissent que dans `Carte.vue` ;
- `VBtn` et `v-btn` ne paraissent que dans `Bouton.vue` ;
- chaque `.vue` de `atelier/composants/` passe par la fabrique.

**Preuve :**
- sur chaque thème, en développement et en version construite : ces couleurs et ces dimensions, avec survol et focus forcés ;
- sur le premier thème : le clavier, l'arbre d'accessibilité et les refus ;
- dans la ligne « champ + bouton normal » : deux boîtes de 40 px, mêmes bords haut et bas à 0 px près ;
- une planche PNG par thème dans `local/champ-carte-captures/`, hors dépôt.

**Hors lot :**
- **Champ :** compteur, effacement, préfixe, suffixe, autres variantes, densités, affichage du mot de passe.
- **Carte :** autre format d'image.
- **Communs :** titre de carte en étroit, jetons de mouvement, d'élévation et de soulignement. Le bloc B du complément ira dans KNOWN_ISSUES au commit de la documentation.

### Ajouts trouvés en écrivant l'attendu, à valider à l'arrêt

1. **La hauteur de capitale du titre de carte (DS11).**
   - Le constat : `typo.titre.3` est un titre 3, qui porte la consigne commune de hauteur de capitale (`police.titre.hauteur-capitale`, 0,7, `font-size-adjust: cap-height`). La table Vuetify ne connaît que quatre champs de style (`fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `src/tokens/vuetify.js`) [F]. Sans variable de plus, le titre de carte de l'atelier perdrait la consigne que `jetons.css` applique.
   - L'ajout : `ds-titre-carte-hauteur-capitale` → `police.titre.hauteur-capitale`, un nombre, que le lecteur de la table sait déjà écrire (`typeof valeur === 'number'`) [F].
2. **« 28 px » dans le plan.** Le plan disait « titre de carte, 28 px en large, 24 en étroit » : ce sont les hauteurs de ligne. La taille du texte est de 20 px en large et 18 px en étroit [F, `typo.titre.3` et `largeur.etroit.tokens.json`]. La réponse Q10 se lit donc ainsi : 20 px sur une ligne de 28 px, à toutes les largeurs.
3. **Données d'un site réel, retirées de la recopie** du complément « trous du design system ». Ce sont des numéros de pièces de l'inventaire hors dépôt, le nombre de polices d'icônes d'un site réel et un compte d'occurrences (`CLAUDE.md` : aucune donnée issue d'une plateforme réelle dans le dépôt). Le texte complet reste dans la boîte aux lettres, hors dépôt.

### Script et commande

Lancé sous Node 24.22.3 depuis la racine du dépôt, le script lu sur l'entrée standard pour que `culori` se résolve depuis la racine, sans fichier ajouté au dépôt : `fnm exec --using=24.22.3 node --input-type=module - < attendu-champ-carte.mjs`.

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { wcagContrast } from 'culori';
const T = 'tokens';
const lire = (f) => JSON.parse(readFileSync(f, 'utf8'));
const aplatir = (o, p = [], m = new Map()) => {
  for (const [k, v] of Object.entries(o)) {
    if (k === '$root') { m.set(p.join('.'), v); continue; }
    if (k.startsWith('$') || !v || typeof v !== 'object') continue;
    if ('$value' in v) m.set([...p, k].join('.'), v); else aplatir(v, [...p, k], m);
  }
  return m;
};
const PAIRES = [
  ['bordure.defaut', 'fond.surface'], ['bordure.defaut', 'fond.app'],
  ['bordure.forte', 'fond.surface'], ['bordure.forte', 'fond.app'],
  ['bordure.erreur', 'fond.surface'], ['bordure.erreur', 'fond.app'],
  ['texte.secondaire', 'fond.surface'], ['texte.secondaire', 'fond.app'],
  ['texte.erreur', 'fond.surface'], ['texte.erreur', 'fond.app'],
  ['texte.principal', 'fond.surface'], ['texte.principal', 'fond.app'],
  ['texte.desactive', 'fond.desactive'], ['bordure.discrete', 'fond.app'],
  ['fond.surface', 'fond.app'], ['bordure.defaut', 'bordure.forte'],
  ['bordure.focus', 'fond.surface'], ['bordure.focus', 'fond.app'],
];
for (const d of readdirSync(T).filter((d) => existsSync(join(T, d, 'entree.json'))).sort()) {
  const r = lire(join(T, d, 'marque.resolver.json'));
  for (const mode of ['clair', 'sombre']) {
    const fichiers = [...['primitives', 'marque', 'roles'].flatMap((s) => r.sets[s].sources.map((x) => x.$ref)), ...r.modifiers.mode.contexts[mode].map((x) => x.$ref)];
    const j = new Map();
    for (const f of fichiers) for (const [k, v] of aplatir(lire(join(T, d, f)))) j.set(k, v);
    const val = (n) => { const v = j.get(n)?.$value; if (v === undefined) throw new Error(n); return typeof v === 'string' && v.startsWith('{') ? val(v.slice(1, -1)) : v; };
    const hex = (n) => val(n).hex;
    const px = (n) => { const v = val(n); return `${v.value}${v.unit}`; };
    const ligne = [`${d}-${mode}`, `rayon.12 ${px('rayon.12')}`];
    for (const [a, b] of PAIRES) ligne.push(`${a}/${b} ${hex(a)}/${hex(b)} ${wcagContrast(hex(a), hex(b)).toFixed(2)}`);
    console.log(ligne.join(' | '));
  }
}
```
