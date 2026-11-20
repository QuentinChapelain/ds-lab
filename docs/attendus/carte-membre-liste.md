# Attendu : `MemberCard` et `MemberList`

Demande de Claude (`2026-11-20-07-de-claude-demande-etape-8-carte-membre-et-liste.md`), plan de Claude Code (`2026-11-20-08-de-claude-code-plan-etape-8.md`), réponses (`2026-11-20-09-…`, corrigé par `2026-11-20-10-…`), arrêt sur le nom des tokens (`2026-11-20-11-…`) et sa réponse (`2026-11-20-12-…`), tous dans la boîte aux lettres, hors dépôt. Go de Quentin le 20/11/2026 à 13 h 42, repris à 14 h 13. Les messages sont résumés ici avec les noms de code des composants ; les tableaux chiffrés et le script sont donnés en entier.

## Demande, résumée

Deux modules montés à la main sur données fictives, référence de la génération à venir : `MemberCard` (`DsAvatar` à gauche, nom, promo, puis une suite de `DsTag`, lien vers le profil) et `MemberList` (une colonne de `MemberCard`). Un module n'a aucune valeur en dur : il assemble `DsCard`, `DsAvatar` et `DsTag` et ne possède que la mise en page. Toute valeur qui manque est un trou, comblé dans les tokens ou le composant, ou porté en dette.

Ordre : les fonds de `DsTag` et `DsAvatar` en sombre d'abord, seuls, avec un arrêt sur image ; puis `MemberCard` ; puis `MemberList`.

## Réponses, résumées

| # | Réponse |
|---|---|
| Q1 | Deux rôles à part ; `fond.composant` et `fond.marque.discret` ne bougent pas |
| Q2 | Pas 5 en sombre ; Quentin confirme sur les planches de l'arrêt 1 |
| Q3 | **`fond.teinte`** (ton neutre) et **`fond.marque.teinte`** (ton marque), couleurs Vuetify `teinte` et `marque-teinte`. « Teinte » nomme le fond teinté, pas une couleur (à dire dans D59). Aucun nom de rôle ne porte `neutre` (T1, NM4) |
| Q4 | Nom du membre en titre 4, par `DsCard` `size="small"` |
| Q5 | `MemberCard`, `MemberList`, sans préfixe, dans `atelier/modules/` ; fiches dans `docs/modules/` ; NM5, CP9, CP10 ; famille L |
| Q6 | `href` obligatoire |
| Q7 | `largeur.colonne` à 640 px ; 720 px en seconde planche à l'arrêt 3 si c'est peu coûteux |
| Q8 | Liste vide : rien de rendu ; état vide et chargement en dette |
| Q9 | Parenthèse des titres des fiches retirée, champ `fr` de `noms.json` retiré ; pas de contrôle lexical |
| Q10 | Dette de la CI réécrite (fait, commit précédent) |
| Q11 | `DsAvatar` `size="large"` dans `MemberCard` |

Aussi accepté : slot `prepend` (seul `DsAvatar`, refusé avec `image`) et prop `subtitle` sur `DsCard` ; props `cohort` et `tags` ; `role="list"` ; dix membres fictifs ; trois arrêts sur image.

Consignes : noms de code partout (`DsTag`, `DsCard`, `DsAvatar`, `MemberCard`, `MemberList`), dans les décisions, les fiches nouvelles, cet attendu et les comptes rendus. Dans les `$description`, le ton neutre se dit par l'usage (classer), pas par la couleur.

## Fonds teintés de `DsTag` et `DsAvatar`

### Ce que le dépôt impose [F]

- **M4** : les rôles sont les mêmes dans tous les contextes. Un rôle ne vise donc pas le pas 3 en clair et le pas 5 en sombre ; il passe par un emplacement de mode, comme `couleur.surface`.
- **M2** : en sombre, `fond.composant` reste sous son survol et son appui. Monter `fond.composant` au pas 5 le rendrait égal à `fond.composant.appui` ; `texte.secondaire` y tomberait à 4,34 ; monter `fond.marque.discret` ferait tomber `texte.marque.grand` d'Atelier Lavandine sombre à 2,95 sur ce fond, et changerait la couleur de ses titres de marque. D'où deux rôles à part.
- **T1** : aucun segment de nom de rôle parmi `neutre`, `bleu`, `terre`, `sable`, `marine`, `or`.

### Emplacements et rôles

| Jeton | Fichier | Clair | Sombre |
|---|---|---|---|
| `couleur.teinte` (emplacement) | `tokens/commun/primitives.tokens.json` (écrit à la main, comme `couleur.surface`) ; en sombre `tokens/commun/mode.sombre.tokens.json` (écrit par `sombreTokens`) | `{couleur.neutre.3}` | `{couleur.neutre.5}` |
| `marque.primaire.teinte` (emplacement) | `tokens/commun/aplat.tokens.json` (écrit par `aplatTokens`) ; en sombre `tokens/commun/mode.sombre.tokens.json` | `{marque.primaire.3}` | `{marque.primaire.5}` |
| **`fond.teinte`** (rôle) | `tokens/commun/semantique.tokens.json` | `{couleur.teinte}` | même alias |
| **`fond.marque.teinte`** (rôle) | `tokens/commun/semantique.tokens.json` | `{marque.primaire.teinte}` | même alias |

- En sombre, `{marque.primaire.5}` se résout sur l'échelle sombre de la marque (`echelles.sombre.tokens.json`, lue après `mode.sombre.tokens.json`) : la saisie d'une marque ne change pas, ni les fichiers des marques écrits par elle.
- `$description` (une phrase, DOC3) :
  - `fond.teinte` : « Fond teinté d'une pièce statique qui porte un texte court pour classer, posée sur la page ou sur une surface ; jamais un fond cliquable. »
  - `fond.marque.teinte` : « Fond teinté de la marque d'une pièce statique qui porte un texte court ou des initiales pour mettre en avant, posée sur la page ou sur une surface ; jamais un fond cliquable. »
  - Le pas et la raison vont dans `$extensions["ds-lab.note"]`.
- `fond.composant` perd son exemple d'usage, qui n'est plus vrai : « Fond d'un composant au repos, plus soutenu que la surface. » (sa note ne change pas).
- `fond.marque.discret` ne change pas.

### Couleurs et rapports [F]

Calculés par le script en fin de document (culori 4.0.2, `wcagContrast`, `differenceCiede2000`), sur les jetons d'avant le changement, la valeur future des deux rôles étant lue directement au pas 3 (clair) ou 5 (sombre).

**`fond.teinte`, le même dans les cinq marques :**

| Mode | Valeur | `texte.principal` dessus | Contre `fond.surface` | Contre `fond.app` |
|---|---|---|---|---|
| clair | `#f3f2f1` (inchangé) | `#363026` 11,68 | 1,12 | 1,08 |
| sombre | **`#282828`** (était `#1b1b1b`) | `#d8d5ce` **10,06** | **1,20** (était 1,03) | 1,27 (était 1,09) |

**`fond.marque.teinte`, par thème :**

| Thème | Valeur | `texte.marque` dessus | Contre `fond.surface` | Contre `fond.app` | ΔE2000 avec `fond.teinte` |
|---|---|---|---|---|---|
| atelier-lavandine-clair | `#f5f1fe` | `#470c7e` 11,65 | 1,11 | 1,07 | 7,1 |
| atelier-lavandine-sombre | `#2c243b` | `#ddcefd` 10,07 | 1,20 | 1,27 | 13,6 |
| ecume-et-sel-clair | `#e3f6fe` | `#003647` 11,66 | 1,11 | 1,07 | 8,2 |
| ecume-et-sel-sombre | `#22292c` | `#ebf9ff` 13,74 | 1,20 | 1,27 | **4,1** (était 0,0) |
| grenat-papeterie-clair | `#fcf0f2` | `#2d000f` 16,88 | 1,11 | 1,07 | 5,5 |
| grenat-papeterie-sombre | `#461825` | `#fec7d2` 10,10 | 1,20 | 1,26 | 19,4 |
| maison-alberto-clair | `#fbf3e1` | `#402e00` 11,82 | 1,10 | 1,07 | 7,4 |
| maison-alberto-sombre | `#2b271e` | `#feeecb` 12,97 | 1,19 | 1,26 | 5,8 |
| orbe-cafe-clair | `#f1f3f7` | `#103060` 11,71 | 1,11 | 1,07 | 2,7 |
| orbe-cafe-sombre | `#19283f` | `#bdd7fe` 10,11 | 1,20 | 1,26 | 12,2 |

En clair, les deux rôles ont exactement les valeurs de `fond.composant` et `fond.marque.discret`.

### Ce qui change, et rien d'autre

- **Paires** (`tokens/commun/paires.json`) : les 74 restent ; deux s'ajoutent à la fin, type texte (4,5) : `texte.principal` sur `fond.teinte`, `texte.marque` sur `fond.marque.teinte`. 76 paires ; `npm run contraste` reste à 0.
- **Table Vuetify** (`tokens/commun/vuetify.json`), à la même place, toujours 40 couleurs par thème :
  - `composant` devient **`teinte`** : fond `fond.teinte`, texte `texte.principal` ;
  - `marque-discret` devient **`marque-teinte`** : fond `fond.marque.teinte`, texte `texte.marque`.
  - Elles n'ont pas d'autre lecteur que `DsTag` et `DsAvatar` [F, `git grep`].
- **Composants** : `DsTag` neutre lit `teinte`, `DsTag` marque et `DsAvatar` lisent `marque-teinte`. Aucun autre composant ne change.
- **Fichiers régénérés** : `jetons.css`, `vuetify.json` et `roles.html` des cinq marques ; `tokens/commun/mode.sombre.tokens.json` et `aplat.tokens.json` ; les fiches de `DsTag` et `DsAvatar` (tokens et contrastes). Si une autre sortie change, ou si une planche claire diffère d'un pixel, arrêt et compte rendu, sans correction.
- **Tests mis à jour, chacun avec sa raison** : A2 (dernière paire), A4 (noms des couleurs), V1 et V2 (noms des couleurs), M3 (clés de `mode.sombre.tokens.json`), T1 (rôles ajoutés), H4 (description de `fond.composant`), les tests des paires (76), les tests des aplats (emplacement ajouté), U (fiches). Les tests nouveaux (A5, A6, `test/avatar-etiquette.test.js`) tiennent les emplacements, les rôles et le tableau ci-dessus. Tout autre test qui rougit arrête le commit.
- **Preuve** : `DsTag` et `DsAvatar` vérifient leurs fonds contre les nouvelles couleurs ; les vérifications restent au même nombre, à 0 échec.

### Arrêt 1

Planches avant (état de `main`) et après, construites, sur les thèmes sombres : par thème, une image avec avant à gauche et après à droite, les vitrines de `DsTag` (deux tons) et de `DsAvatar`, sur la page et sur une surface. Écume et Sel et Atelier Lavandine en premier. Écart en pixels de toutes les planches claires de la preuve, avant et après : 0 attendu.

## `DsCard`, `MemberCard`, `MemberList` (commits suivants)

Le plan (point 3 à 6) fait foi, avec les réponses ci-dessus. En résumé :

- **`DsCard`** : slot `prepend` (seul `DsAvatar` ; refusé avec `image` ; carte horizontale, `DsAvatar` à gauche, écart `ecart.entre-composants`) ; prop `subtitle` (`typo.corps.petit`, `texte.secondaire`) ; prop `size`, `medium` (titre 3, défaut) ou `small` (titre 4) ; quatre variables `ds-titre-4-*` ; la story « en situation » de `DsTag` perd son style écrit à la main.
- **`MemberCard`** : `name` (obligatoire), `href` (obligatoire), `image`, `cohort`, `tags` (`{ text, tone }`), `headingLevel` (2, 3 ou 4, défaut 3). Rendu : `DsCard` `size="small"` avec `href` et `subtitle`, `DsAvatar` `size="large"` `decorative` en `prepend`, suite de `DsTag` en `<ul role="list">` ; refus des `on…`, de `aria-label`, `aria-labelledby` et de tout slot.
- **`MemberList`** : `members` (obligatoire), `headingLevel` ; `aria-labelledby` admis ; `<ul role="list">` ; une colonne, écart `ecart.entre-composants`, largeur jusqu'à `largeur.colonne` (640 px) ; liste vide : rien de rendu.
- **Données** : dix membres fictifs dans `atelier/stories/membres.js` (six photos dessinées en SVG, trois sans photo, une en échec ; un nom long, un nom d'un mot ; un membre sans promo ; suites de zéro à huit `DsTag`, une longue ; ancres seulement).
- **Contrôles** : test de rendu par module (deux jobs de CI), arbre d'accessibilité (liste de dix, un titre de niveau 3 par membre avec un lien nommé par le nom seul, `DsAvatar` absent), dix haltes de Tab ; L1 (aucun import de `vuetify` dans `atelier/modules/`), L2 (aucune valeur nue dans le style d'un module), L3 (menus et refus mot pour mot).
- **Arrêts** : arrêt 2 après `MemberCard` (à l'œil : le détachement de `DsCard` en sombre) ; arrêt 3 après `MemberList` (à l'œil : la largeur de colonne).

## Écart entre la promo et la suite de `DsTag` (réponse à l'arrêt 2)

Demande : 8 px, comme la ligne « en situation » de `DsTag`, par un rôle, jamais une valeur en dur ; à 4 px, la promo et les `DsTag` font un seul bloc.

- **Rôle** : `ecart.entre-blocs` → `{espace.8}`, « Écart entre deux blocs d'information d'un même composant, comme l'en-tête d'une carte, titre et sous-titre, et son contenu. » Hors du contrôle d'ordre des écarts, comme `ecart.entre-etiquettes`. `ecart.entre-etiquettes` et `ecart.icone-texte` valent aussi 8 px, mais leur description ne dit pas cet usage.
- **Variable** : `ds-ecart-entre-blocs`, 8px dans les dix thèmes (60 variables).
- **Place** : dans `DsCard`, entre `subtitle` et le slot `default` : le titre et le sous-titre forment l'en-tête, le contenu est un autre bloc. Sans sous-titre, l'écart entre le titre et le contenu reste `ecart.dans-composant`.
- **Ce qui change** : l'écart entre le sous-titre et le contenu, 4 → 8 px, dans `MemberCard` et dans les cas à sous-titre de la story « Variantes » de `DsCard` ; rien d'autre. La ligne « en situation » de `DsTag` lit le même rôle et reste identique au pixel.

## Largeur de colonne de `MemberList`

- **Primitive** : `taille.640` (147 entrées à l'index de la réduction).
- **Rôle** : `largeur.colonne` → `{taille.640}`, « Largeur maximale d'une colonne de contenu, comme une liste d'annuaire ; sur un écran plus étroit, la colonne prend toute la largeur de son parent. » La mesure est dans la note de l'équipe (DOC3).
- **Variable** : `ds-largeur-colonne`, 640px dans les dix thèmes (61 variables).
- **`MemberList`** : `width: 100%`, `max-width` à cette variable. Page de 1 280 px : la liste fait 640 px. Page de 360 px : toute la largeur de son parent, sans défilement en largeur.

## Script et commande

Lancé sous Node 24.22.3 depuis la racine du dépôt, lu sur l'entrée standard pour que `culori` se résolve depuis la racine, sans fichier ajouté au dépôt : `fnm exec --using=24.22.3 node --input-type=module - < attendu-teinte.mjs`. Il écrit une ligne par thème.

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { wcagContrast, differenceCiede2000 } from 'culori';
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
// fond.teinte et fond.marque.teinte n'existent pas encore : leur future valeur est lue directement,
// pas 3 en clair, pas 5 en sombre, du neutre et du primaire.
const PAS = { clair: 3, sombre: 5 };
const de2000 = differenceCiede2000();
for (const d of readdirSync(T).filter((d) => existsSync(join(T, d, 'entree.json'))).sort()) {
  const r = lire(join(T, d, 'marque.resolver.json'));
  for (const mode of ['clair', 'sombre']) {
    const fichiers = [...['primitives', 'marque', 'roles'].flatMap((s) => r.sets[s].sources.map((x) => x.$ref)), ...r.modifiers.mode.contexts[mode].map((x) => x.$ref)];
    const j = new Map();
    for (const f of fichiers) for (const [k, v] of aplatir(lire(join(T, d, f)))) j.set(k, v);
    const val = (n) => { const v = j.get(n)?.$value; if (v === undefined) throw new Error(n); return typeof v === 'string' && v.startsWith('{') ? val(v.slice(1, -1)) : v; };
    const hex = (n) => val(n).hex;
    const tn = hex(`couleur.neutre.${PAS[mode]}`);
    const tm = hex(`marque.primaire.${PAS[mode]}`);
    const c = (a, b) => wcagContrast(a, b).toFixed(2);
    const s = hex('fond.surface'), a = hex('fond.app'), tp = hex('texte.principal'), tma = hex('texte.marque');
    console.log([`${d}-${mode}`,
      `fond.teinte ${tn}`, `texte.principal ${tp} ${c(tp, tn)}`, `/surface ${s} ${c(tn, s)}`, `/app ${a} ${c(tn, a)}`,
      `fond.marque.teinte ${tm}`, `texte.marque ${tma} ${c(tma, tm)}`, `/surface ${c(tm, s)}`, `/app ${c(tm, a)}`,
      `dE2000 ${de2000(tn, tm).toFixed(1)}`,
      `avant: fond.composant ${hex('fond.composant')} fond.marque.discret ${hex('fond.marque.discret')}`].join(' | '));
  }
}
```
