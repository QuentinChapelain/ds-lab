13 lignes.
Lot « bouton » (étape 6a). PLAN SEULEMENT : aucun fichier modifié, aucun commit.

0. Contrôle : git status ; HEAD attendu 866cc6e = origin/main ; CI de main verte. Supprime la branche locale marque-seul (sans objet).
1. Crée la branche lot-bouton.
2. Plan pour :
- une enveloppe maison du bouton (Vue 3, Vuetify 4 dessous) ; propose où elle vit ; ajoute @vitejs/plugin-vue ;
- menu : rôle principal | secondaire | discret | danger | danger-discret ; taille 40 | 32 px ; arrondi 8 px fixe ; icône avant le texte (option) ; pleine largeur (option) ; désactivé (aria-disabled, refusé sur type=submit) ; chargement. Rien d'autre ;
- jetons manquants pour les 10 thèmes : rôles « désactivé », rôle d'arrondi, hauteurs, survol du plein d'erreur (dis s'il existe déjà) ;
- garde : aucun v-btn hors de l'enveloppe ; témoin v-btn retiré ;
- clavier et lecteur d'écran : focus visible, chargement et désactivé annoncés ; vérifications ajoutées à la preuve ;
- vitrine Storybook : 5 rôles × 2 tailles × états, 5 marques fictives, clair et sombre ;
- D43 dans docs/decisions.md ; attendu dans docs/attendus/bouton.md.
3. Pour chaque point : fichiers touchés, tests ajoutés, découpage en commits. Dis ce que v-btn fait avec disabled et loading, lu dans son code, pas supposé. Marque [H] ce que tu supposes.

## Réponses au plan, validées le 18/11/2026

9 lignes.
Plan accepté, avec ces réponses :
1. Oui : désactivé + type=submit lève l'erreur, aucun bouton rendu.
2. Noms validés : variante, taille normale|petite, hauteur.controle.normale|petite, rayon.controle.
3. Jetons, pas de valeurs fixes : anneau de focus 2 px ; icône 20 et 16 px ; écart icône-texte 8 px (nouveau rôle, Material 3 met 8). Valeurs à juger sur la planche.
4. Liste blanche : tout autre attribut lève une erreur.
5. Pas de greffon. La preuve enregistre en plus une planche PNG par thème : chaque variante et taille au repos, au survol, au focus, désactivée, en chargement. Dans local/bouton-captures/, hors dépôt.
Ajout KNOWN_ISSUES : bouton sur aplat de marque (fond et focus inverses) hors de ce lot.
Commence par le commit 1 (attendu) et montre-le-moi avant de continuer.
FIN-DU-MESSAGE

## Valeurs attendues, écrites à la main le 18/11/2026

Ce que le code devra donner. Les couleurs sont lues dans les jetons par un résolveur écrit à part, sans rien importer de `src/` ; les rapports sont calculés par culori 4.0.2 (`wcagContrast`). Script et commande en fin de section.

### Jetons ajoutés

Primitives (`tokens/commun/primitives.tokens.json`), en px : `hauteur.32`, `hauteur.40`, `epaisseur.2`, `taille-icone.16`, `taille-icone.20`. `espace.8` et `rayon.8` existent déjà.

Rôles (`tokens/commun/semantique.tokens.json`) :

| Rôle | Alias | Valeur |
|---|---|---|
| `fond.erreur.fort.survol` | `{marque.erreur.plein-survol}` | l'emplacement existe dans les 5 marques, clair et sombre (pas 12 de l'échelle d'erreur, statut figé, D04) ; seul le rôle manque |
| `fond.desactive` | `{couleur.neutre.3}` | voir le tableau des couleurs |
| `texte.desactive` | `{couleur.neutre.9}` | voir le tableau des couleurs |
| `rayon.controle` | `{rayon.8}` | 8 px |
| `hauteur.controle.normale` | `{hauteur.40}` | 40 px |
| `hauteur.controle.petite` | `{hauteur.32}` | 32 px |
| `epaisseur.focus` | `{epaisseur.2}` | 2 px |
| `taille-icone.normale` | `{taille-icone.20}` | 20 px |
| `taille-icone.petite` | `{taille-icone.16}` | 16 px |
| `ecart.icone-texte` | `{espace.8}` | 8 px ; hors du contrôle d'ordre des écarts, comme `marge-interieure.composant` |

Paires ajoutées (`tokens/commun/paires.json`) : `texte.sur-erreur` sur `fond.erreur.fort.survol` (texte, 4,5) ; `texte.desactive` sur `fond.desactive` et sur `fond.app` (texte, avec exception écrite : composant inactif, exempté par WCAG 1.4.3 ; affichées « ~ », sans échec).

Rôles existants repris : `typo.libelle` (14 px, graisse 600, ligne de 20 px) et `marge-interieure.composant` (16 px de chaque côté) aux deux tailles [H, à juger sur la planche] ; `bordure.forte` pour le contour du secondaire ; `bordure.discrete` pour le contour du secondaire désactivé ; `bordure.focus` pour l'anneau, décalé de 2 px, sur le fond de la page (DS2).

### Couleurs et rapports

Le bouton est posé sur la page (`fond.app`). Rapport : texte sur son fond, ou trait sur `fond.app`.

Ce qui varie avec la marque : principal, discret et anneau de focus.

| Thème | Principal : fond / texte, rapport ; survol, rapport | Discret : texte, rapport ; survol, rapport | Focus, rapport |
|---|---|---|---|
| atelier-lavandine-clair | `#8a4fd8` / `#ffffff` 5,01 ; `#7543b8` 6,46 | `#8247ce` 5,42 ; `#f5f1fe` 5,05 | `#8247ce` 5,42 |
| atelier-lavandine-sombre | `#c4a4fe` / `#131019` 9,04 ; `#ddcefd` 12,83 | `#c4a4fe` 9,00 ; `#1d1925` 8,28 | `#c4a4fe` 9,00 |
| ecume-et-sel-clair | `#7fdbff` / `#003647` 8,33 ; `#6fcbee` 7,08 | `#21708b` 5,40 ; `#e3f6fe` 5,03 | `#21708b` 5,40 |
| ecume-et-sel-sombre | `#c9efff` / `#121212` 15,41 ; `#ebf9ff` 17,42 | `#c9efff` 15,41 ; `#1b1b1b` 14,17 | `#c9efff` 15,41 |
| grenat-papeterie-clair | `#7a1f3d` / `#ffffff` 10,04 ; `#85314d` 8,26 | `#4f0020` 15,00 ; `#fcf0f2` 13,95 | `#4f0020` 15,00 |
| grenat-papeterie-sombre | `#fc96ae` / `#1e0d11` 9,02 ; `#fec7d2` 12,77 | `#fc96ae` 9,02 ; `#2f1119` 8,32 | `#fc96ae` 9,02 |
| maison-alberto-clair | `#836304` / `#ffffff` 5,60 ; `#402e00` 13,05 | `#836304` 5,41 ; `#fbf3e1` 5,07 | `#836304` 5,41 |
| maison-alberto-sombre | `#ffd060` / `#121212` 12,88 ; `#feeecb` 16,33 | `#ffd060` 12,88 ; `#1d1b17` 11,83 | `#ffd060` 12,88 |
| orbe-cafe-clair | `#2b4c7e` / `#ffffff` 8,61 ; `#3c5a88` 6,98 | `#4c6994` 5,40 ; `#f1f3f7` 5,03 | `#4c6994` 5,40 |
| orbe-cafe-sombre | `#86b6fe` / `#0e1218` 9,06 ; `#bdd7fe` 12,80 | `#86b6fe` 9,04 ; `#111b2a` 8,35 | `#86b6fe` 9,04 |

Ce qui ne dépend que du mode, identique dans les cinq marques (neutres et statuts communs) :

| Mode | Secondaire : fond / texte, rapport ; survol, rapport ; contour, rapport | Danger : fond / texte, rapport ; survol, rapport | Danger discret : texte, rapport ; survol, rapport | Désactivé : fond / texte, rapport ; sur la page ; contour |
|---|---|---|---|---|
| clair | `#ffffff` / `#363026` 13,06 ; `#ecebe9` 10,96 ; `#958f84` 3,10 | `#cb1d2a` / `#ffffff` 5,60 ; `#6a0000` 13,02 | `#cb1d2a` 5,41 ; `#fff0ee` 5,06 | `#f3f2f1` / `#8a8478` 3,32 ; 3,59 ; `#d8d6d2` |
| sombre | `#181818` / `#d8d5ce` 12,12 ; `#212121` 10,99 ; `#6a665c` 3,27 | `#ff978f` / `#1a0f0e` 9,01 ; `#fcc9c4` 12,78 | `#ff978f` 8,99 ; `#231918` 8,23 | `#1b1b1b` / `#7d786c` 3,92 ; 4,26 ; `#303030` |

Fond de la page : `#fbfbfb` en clair, `#121212` en sombre, dans les cinq marques.

Seuils : chaque texte actif tient 4,5:1 au repos et au survol (le plus bas : 5,01, principal d'Atelier Lavandine en clair) ; le contour du secondaire et l'anneau tiennent 3:1 sur la page (le plus bas : 3,10). Le désactivé est exempté (WCAG 1.4.3) et reste entre 3,32 et 4,26 [F]. Les valeurs du désactivé, le survol du secondaire en sombre (`#212121` sur une surface `#181818`) et l'écart entre repos et survol du danger en clair (`#cb1d2a` → `#6a0000`) sont à juger sur la planche [H].

### Comportement attendu

- Enveloppe `atelier/composants/Bouton.vue`, seul fichier où paraissent `VBtn` et `v-btn` (garde) ; le témoin est retiré.
- Props : `variante` (principal par défaut), `taille` (normale par défaut), `icone`, `pleineLargeur`, `desactive`, `chargement`, `type` (button par défaut). Attributs admis en plus : `id`, `aria-*`, `data-*`, écouteurs ; tout autre attribut lève une erreur, aucun bouton rendu.
- Désactivé : `aria-disabled="true"`, jamais l'attribut `disabled` ; atteint par Tab ; ni clic émis ni action par défaut (souris, Entrée, Espace). Avec `type="submit"` : erreur « bouton : désactivé refusé sur type=submit », aucun bouton rendu.
- Chargement : `aria-busy="true"` et `aria-disabled="true"` ; le focus reste sur le bouton ; libellé invisible, largeur et nom accessible inchangés ; roue `aria-hidden`, aucun `progressbar` sans nom ; une zone `role="status"` dit « Chargement en cours » ; un formulaire n'est pas envoyé, même par Entrée dans un champ.
- Focus visible au clavier : anneau `bordure.focus`, épaisseur `epaisseur.focus`, décalé de 2 px ; aucun voile de Vuetify au survol, au focus ni à l'appui ; pas d'ondulation, pas d'élévation.
- Icône avant le texte, `aria-hidden`, à la taille de `taille-icone.*`, séparée du texte par `ecart.icone-texte`.
- Pleine largeur : largeur du bouton égale à celle de son parent ; sinon, il garde la sienne.
- Preuve : ces points, pour les 10 thèmes, en développement et en version construite ; elle enregistre en plus une planche PNG par thème dans `local/bouton-captures/` (5 variantes × 2 tailles × repos, survol, focus, désactivé, chargement), hors dépôt.

Hors lot : bouton sur aplat de marque (fond et anneau inverses), état d'appui, durée de transition (aucun jeton de durée n'existe).

### Script et commande

Placé à la racine du dépôt le temps du calcul (pour trouver culori), lancé sous Node 24.22.3 par `node attendu-bouton.mjs`, puis supprimé.

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
const ATTENDU = {
  'fond.erreur.fort.survol': '{marque.erreur.plein-survol}',
  'fond.desactive': '{couleur.neutre.3}', 'texte.desactive': '{couleur.neutre.9}',
};
const BOUTON = [
  ['principal', 'fond.interactif.fort', 'texte.sur-interactif', 'fond.interactif.fort.survol'],
  ['secondaire', 'fond.surface', 'texte.principal', 'fond.composant.survol'],
  ['discret', 'fond.app', 'texte.interactif', 'fond.interactif.discret'],
  ['danger', 'fond.erreur.fort', 'texte.sur-erreur', 'fond.erreur.fort.survol'],
  ['danger-discret', 'fond.app', 'texte.erreur', 'fond.erreur.discret'],
];
for (const d of readdirSync(T).filter((d) => existsSync(join(T, d, 'entree.json'))).sort()) {
  const r = lire(join(T, d, 'marque.resolver.json'));
  for (const mode of ['clair', 'sombre']) {
    const fichiers = [...['primitives', 'marque', 'roles'].flatMap((s) => r.sets[s].sources.map((x) => x.$ref)), ...r.modifiers.mode.contexts[mode].map((x) => x.$ref)];
    const j = new Map();
    for (const f of fichiers) for (const [k, v] of aplatir(lire(join(T, d, f)))) j.set(k, v);
    for (const [k, v] of Object.entries(ATTENDU)) j.set(k, { $value: v });
    const hex = (n) => { const v = j.get(n)?.$value; if (v === undefined) throw new Error(n); return typeof v === 'string' ? hex(v.slice(1, -1)) : v.hex; };
    const ligne = [`${d}-${mode}`];
    for (const [nom, fond, texte, survol] of BOUTON) ligne.push(`${nom} ${hex(fond)}/${hex(texte)} ${wcagContrast(hex(texte), hex(fond)).toFixed(2)} survol ${hex(survol)} ${wcagContrast(hex(texte), hex(survol)).toFixed(2)}`);
    ligne.push(`contour ${hex('bordure.forte')} ${wcagContrast(hex('bordure.forte'), hex('fond.app')).toFixed(2)}`);
    ligne.push(`focus ${hex('bordure.focus')} ${wcagContrast(hex('bordure.focus'), hex('fond.app')).toFixed(2)}`);
    ligne.push(`désactivé ${hex('fond.desactive')}/${hex('texte.desactive')} ${wcagContrast(hex('texte.desactive'), hex('fond.desactive')).toFixed(2)} sur page ${wcagContrast(hex('texte.desactive'), hex('fond.app')).toFixed(2)} contour ${hex('bordure.discrete')}`);
    console.log(ligne.join(' | '));
  }
}
```

## Correction du 18/11/2026, validée avant le commit des jetons

Les rôles `rayon.controle`, `hauteur.controle.*`, `epaisseur.focus` et `taille-icone.*` portaient le nom d'un groupe de primitives (`rayon.*`, déjà là ; `hauteur.*`, `epaisseur.*`, `taille-icone.*`, de cet attendu). Le lecteur range un groupe entier dans la couche des rôles dès que son nom paraît dans les rôles (`partager`, `src/tokens/resolver.js`) : les primitives de ces groupes passaient pour des rôles [F, test R3 de `test/resolver.test.js` en échec]. Aucun groupe de rôles ne partageait jusqu'ici son nom avec un groupe de primitives (`espace` et `ecart`, `taille-texte` et `typo`). Décision : renommer, sans toucher au lecteur.

- `rayon.controle` devient `arrondi.controle` → `{rayon.8}` (8 px) ; les primitives `rayon.*` gardent leur nom, que la migration écrit dans ses sorties.
- Primitives : `taille.16`, `taille.20`, `taille.32`, `taille.40` et `trait.2` remplacent `hauteur.32|40`, `taille-icone.16|20` et `epaisseur.2`.
- Rôles inchangés, cibles nouvelles : `hauteur.controle.normale` → `{taille.40}`, `hauteur.controle.petite` → `{taille.32}`, `epaisseur.focus` → `{trait.2}`, `taille-icone.normale` → `{taille.20}`, `taille-icone.petite` → `{taille.16}`.

Valeurs en px, couleurs et rapports inchangés.

## Correction du 18/11/2026, validée avant le commit de l'enveloppe

Le décalage de l'anneau de focus (2 px, DS2) n'avait pas de jeton. Décision : un rôle `decalage.focus` → `{trait.2}` (2 px), passé au thème par la variable `ds-decalage-focus` de la table Vuetify, et vérifié par la preuve avec les autres variables `ds-`. L'enveloppe lit cette variable, sans valeur écrite à la main.

## Correction du 18/11/2026, validée sur la planche, avant le commit de l'enveloppe

- Le contour du bouton secondaire était écrit à la main (1 px). Décision : un rôle `epaisseur.contour` → `{trait.1}` (1 px, primitive ajoutée), passé au thème par la variable `ds-epaisseur-contour`, et vérifié par la preuve avec la couleur du contour.
- La roue de chargement est dessinée par l'enveloppe : la roue indéterminée de Vuetify 4.3.4 (`VProgressCircular`) fige la page quand le thème change sur place, même seule dans une story [F]. Sa vitesse (un tour par seconde) reste écrite à la main, sans jeton : le dépôt n'a aucun jeton de durée ; le mouvement sera un sujet à part (dette).
