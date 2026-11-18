# Attendu : finitions du bouton (police du libellé, survol des pleins)

Message de Quentin du 18/11/2026, tel quel :

> Lot « finitions-bouton ». Nouveau mode : deux arrêts seulement (1. attendu + planche d'options ; 2. fin : planche finale + CI de la branche). Entre les deux, enchaîne tes commits sans attendre mon accord.
>
> 1. Police (décision de Quentin, D44) : typo.libelle prend toujours la police du produit, même si l'entrée de la marque déclare polices.texte. Le corps de texte garde la règle de D16.
> 2. Survol des pleins : aujourd'hui en clair, certains pleins s'éclaircissent (voile blanc), d'autres plongent au pas 12 (danger, primaire « moyen »). Quentin veut une seule règle, un changement léger, le même sens pour tous. Propose 2 ou 3 règles uniques ; pour chacune, calcule toutes les couleurs de survol (5 marques, statuts, clair et sombre) et vérifie que le texte reste à 4,5 ou plus. Planche comparative dans local/survol-options/, sans rien changer au dépôt. Attends son choix avant de l'appliquer.
> Branche finitions-bouton depuis main (fc5634e).

Les deux points ferment les deux lignes « à trancher par Quentin » de `KNOWN_ISSUES.md` (D43).

## 1. Police du libellé (D44)

Attendus écrits à la main avant le code :

- Un jeton de police du produit que la couche marque ne remplace pas : `police.produit` (`fontFamily`, `["system-ui", "sans-serif"]` [H], valeur inchangée), dans `tokens/commun/police.tokens.json`, groupe `police` (déjà là, consigne de hauteur de capitale des titres). `marque.police.texte` du commun devient l'alias `{police.produit}` : une marque sans `polices.texte` garde la police du produit, comme aujourd'hui.
- `typo.libelle.fontFamily` → `{police.produit}`. Les autres styles ne changent pas : titres 4, corps et mention gardent `{marque.police.texte}` (D16), titres 1 à 3 et affichage gardent `{marque.police.titre}`.
- Libellé résolu, dans les cinq marques et les deux modes : `system-ui, sans-serif`. Corps résolu, inchangé : Atelier Lavandine `Arial, sans-serif` ; Écume et Sel `Verdana, sans-serif` ; Grenat Papeterie `Helvetica, Arial, sans-serif` ; Maison Alberto `system-ui, sans-serif` (police du produit, sans `polices.texte`) ; Orbe Café `Orbe Sans, Arial, sans-serif`.
- Table Vuetify : une 17e variable, `ds-libelle-police` → `typo.libelle`, champ `fontFamily`, écrite en liste CSS (un nom qui contient une espace entre guillemets). L'enveloppe lit `--v-ds-libelle-police` au lieu de `--v-font-body`. `--v-font-body` (corps de la marque) ne change pas.
- Preuve : sur chaque thème, la police calculée du libellé de chaque bouton est `system-ui, sans-serif`, et la variable `ds-libelle-police` égale le jeton.
- `test/police-produit.test.js` P1 reçoit `police.produit` (correction datée de son en-tête) ; `npm run typo` reste à 0 échec.

## 2. Survol des pleins (D45)

### Constat [F]

En clair, la règle des pleins (D04) donne quatre survols selon la classe : voile blanc de 8 % (sombre : Grenat Papeterie, Orbe Café, qui s'éclaircissent), voile noir de 15 % (soutenu : Atelier Lavandine), pas 10 (clair : Écume et Sel, avertissement), pas 12 (moyen : Maison Alberto, erreur, succès, info, qui plongent). ΔE (OKLab × 100) du repos au survol : 4,6 à 22,3, deux sens. En sombre, une règle (pas 11 → pas 12) : ΔE 5,2 à 12,2, tout s'éclaircit.

### Trois règles uniques

Chacune remplace tous les survols de pleins (primaire, quatre statuts), quelle que soit la classe ; plein et texte ne changent pas.

1. **Le survol s'éloigne de la page** : clarté OKLCH du plein − 0,05 en clair, + 0,05 en sombre ; teinte et chroma gardées, chroma réduite si la couleur sort du gamut sRGB. Clair : ΔE 4,7 à 5,1, tout fonce, texte ≥ 4,80. Sombre : ΔE 4,0 à 5,1, tout s'éclaircit, texte ≥ 10,28.
2. **Le survol fonce partout** : clarté OKLCH − 0,05 en clair comme en sombre. Clair : identique à 1. Sombre : ΔE 4,6 à 5,1, tout fonce, texte ≥ 7,51.
3. **Voile noir partout** : plein sous un voile noir de 10 % en clair comme en sombre (composition source-over en sRGB, la formule des voiles de D04). Clair : ΔE 2,9 à 6,5, tout fonce, texte ≥ 4,70 ; Grenat Papeterie à 2,9 et Orbe Café à 3,1, au bord du visible. Sombre : ΔE 5,7 à 7,1, tout fonce, texte ≥ 7,29.

Toutes tiennent 4,5:1 : le plus bas est l'avertissement en clair (texte foncé `#442d01`, 5,77 au repos), à 4,80 (1 et 2) et 4,70 (3).

Écartés : voile blanc de 10 % en sombre (ΔE 0,8 sur le primaire d'Écume et Sel, invisible) ; voile de la couleur du texte (survol à la Material), qui fonce les pleins à texte foncé et éclaircit ceux à texte blanc, deux sens.

### Couleurs de survol, texte du plein entre parenthèses

Statuts identiques dans les cinq marques [F]. En clair, les options 1 et 2 sont identiques.

| Plein | Clair : repos → actuel | Clair : 1 et 2 | Clair : 3 | Sombre : repos → actuel | Sombre : 1 | Sombre : 2 | Sombre : 3 |
|---|---|---|---|---|---|---|---|
| Atelier Lavandine, principal | #8a4fd8 → #7543b8 (6,46) | #7b3ec7 (6,26) | #7c47c2 (5,94) | #c4a4fe → #ddcefd (12,83) | #d4b5ff (10,62) | #b494ed (7,53) | #b094e5 (7,36) |
| Écume et Sel, principal | #7fdbff → #6fcbee (7,08) | #6fcbee (7,08) | #72c5e6 (6,70) | #c9efff → #ebf9ff (17,42) | #ddffff (17,68) | #b9deee (13,15) | #b5d7e6 (12,34) |
| Grenat Papeterie, principal | #7a1f3d → #85314d (8,26) | #6a0d30 (12,26) | #6e1c37 (11,14) | #fc96ae → #fec7d2 (12,77) | #ffa7be (10,28) | #eb869e (7,53) | #e3879d (7,33) |
| Maison Alberto, principal | #836304 → #402e00 (13,05) | #745500 (6,90) | #765904 (6,56) | #ffd060 → #feeecb (16,33) | #ffe17e (14,56) | #eec04e (10,96) | #e6bb56 (10,35) |
| Orbe Café, principal | #2b4c7e → #3c5a88 (6,98) | #1e3e6f (10,64) | #274471 (9,76) | #86b6fe → #bdd7fe (12,80) | #97c6ff (10,58) | #77a6ed (7,57) | #79a4e5 (7,38) |
| erreur (danger) | #cb1d2a → #6a0000 (13,02) | #b9001a (6,82) | #b71a26 (6,58) | #ff978f → #fcc9c4 (12,78) | #ffaaa2 (10,30) | #ee8780 (7,52) | #e68881 (7,33) |
| succès | #00774a → #003a12 (13,01) | #00683c (6,90) | #006b43 (6,60) | #00cd84 → #03f39e (12,79) | #31de93 (10,72) | #00bd75 (7,63) | #00b977 (7,33) |
| avertissement | #e5a000 → #d39300 (4,90) | #d49000 (4,80) | #ce9000 (4,70) | #ffd595 → #fff0da (16,71) | #ffe6ac (15,31) | #eec585 (11,56) | #e6c086 (10,93) |
| info | #006da6 → #013452 (13,01) | #005e96 (6,90) | #006295 (6,60) | #5dbcff → #addafd (12,65) | #73ccff (10,51) | #4cacee (7,51) | #54a9e6 (7,29) |

Calcul : culori (`oklch`, `toGamut('rgb', 'oklch')`, `interpolate` en `rgb`, `wcagContrast`, `differenceEuclidean('oklab')`), sur les jetons résolus par un lecteur indépendant de `src/`, le même que celui de `docs/attendus/bouton.md`. Script de la règle choisie plus bas ; celui des trois options, hors dépôt, dans `local/survol-options/`.

### Choix de Quentin (18/11/2026)

Règle 1, intensité 0,05 : le survol d'un plein est le plein dont la clarté OKLCH baisse de 0,05 en clair et monte de 0,05 en sombre, teinte et chroma gardées, chroma réduite si la couleur sort du gamut sRGB (`toGamut('rgb', 'oklch')`, méthode de CSS Color 4). Valeurs attendues : colonnes « Clair : 1 et 2 » et « Sombre : 1 » du tableau. L'accent, qui ne se clique pas, suit la même règle en clair (Atelier Lavandine `#f2b705` → `#e1a700`, Écume et Sel `#bf3704` → `#ae2400`, Grenat Papeterie `#6d675b` → `#5f594d`, Maison Alberto `#ba4c99` → `#a93c8a`, Orbe Café `#b3422b` → `#a2321b`) ; en sombre, il garde ses valeurs du clair (D04).

Contrôles attendus : `npm run contraste` à 0 échec ; texte actif du bouton à 4,5:1 au moins au survol dans les dix thèmes (le plus bas : 4,80, avertissement en clair, hors bouton ; parmi les boutons, danger en clair à 6,82 et principal d'Atelier Lavandine en clair à 6,26) ; preuve : les couleurs de survol forcé égalent les jetons.

### Script et commande

Placé à la racine du dépôt le temps du calcul (pour trouver culori), lancé sous Node 24.22.3 par `node attendu-survol.mjs`, puis supprimé. Il lit les jetons d'avant le changement (plein et texte ne changent pas).

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { wcagContrast, formatHex, oklch, toGamut, differenceEuclidean } from 'culori';
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
const versRgb = toGamut('rgb', 'oklch');
const survol = (hex, d) => { const c = oklch(hex); return formatHex(versRgb({ ...c, l: Math.min(1, Math.max(0, c.l + d)) })); };
const dE = (a, b) => 100 * differenceEuclidean('oklab')(a, b);
for (const d of readdirSync(T).filter((d) => existsSync(join(T, d, 'entree.json'))).sort()) {
  const r = lire(join(T, d, 'marque.resolver.json'));
  for (const mode of ['clair', 'sombre']) {
    const fichiers = [...['primitives', 'marque', 'roles'].flatMap((s) => r.sets[s].sources.map((x) => x.$ref)), ...r.modifiers.mode.contexts[mode].map((x) => x.$ref)];
    const j = new Map();
    for (const f of fichiers) for (const [k, v] of aplatir(lire(join(T, d, f)))) j.set(k, v);
    const hex = (n) => { const v = j.get(n)?.$value; if (v === undefined) throw new Error(n); return typeof v === 'string' ? hex(v.slice(1, -1)) : v.hex; };
    const ligne = [`${d}-${mode}`];
    for (const e of ['primaire', 'erreur', 'succes', 'avertissement', 'info', ...(mode === 'clair' ? ['accent'] : [])]) {
      const plein = hex(`marque.${e}.plein`), texte = hex(`marque.${e}.sur-plein`);
      const s = survol(plein, mode === 'clair' ? -0.05 : 0.05);
      ligne.push(`${e} ${plein} → ${s} texte ${wcagContrast(texte, s).toFixed(2)} ΔE ${dE(plein, s).toFixed(2)}`);
    }
    console.log(ligne.join(' | '));
  }
}
```

### Ce que la règle choisie entraîne

- `src/tokens/pleins.js` : un seul survol, calculé depuis le plein, pour chaque classe, statuts compris ; valeur DTCG et formule en `$extensions`, comme les voiles de D04. En sombre, le survol devient lui aussi une valeur calculée (D04 disait « sans valeur calculée »).
- Statuts : plein et texte restent figés (`STATUTS_FIGES`), seul le survol change ; la couche marque d'Orbe Café cesse d'être identique à celle d'avant l'étape 4, et les tests qui la figent reçoivent les nouvelles valeurs.
- L'accent, qui ne se clique pas, suit la même règle en clair ; en sombre, il garde ses valeurs du clair (D04).
- Bouton inversé : en clair, son texte survolé (`marque.primaire.aplat-survol`) est le survol du plein ; en sombre, la valeur du clair, figée. La paire est la même que texte du plein sur survol (`fond.interactif.inverse` = texte du plein) : elle tient avec la règle.
- `docs/attendus/bouton.md` garde ses valeurs d'origine ; les tests du bouton (`AJOUTS_BOUTON`, B1 à B4) et la preuve reçoivent les nouvelles.
