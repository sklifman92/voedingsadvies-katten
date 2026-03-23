# Kleuradvies — HAAR. Centrum voor kattenwelzijn

## Beoordeling huidig palet

### Het kernprobleem: achtergronden zitten in dezelfde tint als het accent

Dat is de diepere oorzaak van het "viezige" gevoel. De achtergronden (`#EDE5D8`, `#F2EAE0`, `#E4DDD0`) zitten allemaal in dezelfde warm-oranje hoekaas als de terracotta accentkleur (`#B35C3A`). De hele pagina is daardoor "ingekleurd" — ook de neutrale vlakken voelen oranjig-bruin aan. Er is geen echte rust.

In HSL-termen:

| Kleur | Hue | Saturation | Probleem |
|---|---|---|---|
| `#EDE5D8` (bg) | 31° | 22% | Veel te verzadigd voor een achtergrond |
| `#F2EAE0` (surface) | 28° | 24% | Zelfde probleem, nog geler |
| `#E4DDD0` (surface-2) | 31° | 18% | Minder erg maar nog steeds viezig |
| `#B35C3A` (accent) | 18° | 52% | Prima — dit is de gewenste tint |

De achtergronden lekken de accentkleur in de "neutrale" ruimte. Dat geeft het sepia/oud-papier gevoel.

### Wat de sage-green mist

De saliegroen (`#6B8060`) is te grijs — het zit dicht bij een muisgrijs-groen. Daardoor valt het niet op als accentkleur en voelt het vaag aan in plaats van fris en herkenbaar.

### Ontbrekende kleuren

Het palet heeft **geen complementaire kleur** aan de terracotta. Op de kleurencirkel zit het complement van terracotta (~18°) bij blauw-teal (~198°). Een subtiel teal-accent zou het palet veel meer balans en frisheid geven zonder de warme toon te verliezen.

Ook mist het palet een **warm goud/amber** voor premium-highlights — nuttig voor badges als "Aanbevolen" of "Prijstip."

---

## Nieuw kleurenpalet

### Design-principes

- Achtergronden lezen als **bijna-wit** met fluisterwarme tint — niet als beige
- De terracotta accent mag sterk aanwezig zijn juíst omdat de achtergrond neutraal is
- Sage green wordt frisser en duidelijker groen
- Nieuw: **warm teal** als complementaire kleur (fris, medisch-vertrouwen, kattenkleur)
- Nieuw: **warm goud** voor premium/highlight accenten

### Palet vergelijking

#### Achtergronden

| Naam | Oud | Nieuw | Effect |
|---|---|---|---|
| Pagina-achtergrond | `#EDE5D8` | `#F4EFE9` | S: 22%→13% — veel minder viezig |
| Surface (kaarten) | `#F2EAE0` | `#FDFAF7` | Bijna wit, fris als hoogwaardig papier |
| Surface-2 (verdiept) | `#E4DDD0` | `#EDE7DF` | Duidelijker diepte zonder bruine kleur |
| Surface warm (decoratief) | `#D6C1A9` | `#E8DDD2` | Lichter, minder vuil geel-bruin |

#### Terracotta (grotendeels behouden — het is goed)

| Naam | Oud | Nieuw | Effect |
|---|---|---|---|
| Roest light | `#E9A98C` | `#F5C5AA` | Frisser, peach-toon ipv oranje-bruin |
| Roest mid (accent) | `#B35C3A` → `#B65A3A` | `#C1633E` | Iets levendiger, warmer rood-oranje |
| Roest dark | `#8C3F2B` | `#9A4A2E` | Nauwelijks verschil |
| Roest deep | `#7A3624` | `#7A3624` | Behouden |

#### Sage green (verfrist)

| Naam | Oud | Nieuw | Effect |
|---|---|---|---|
| Sage light | `#E0E6DA` | `#E4EDE0` | Frisser groen, minder grijs |
| Sage mid | `#A8B5A2` | `#9EB59A` | Iets meer saturatie, beter als accent |
| Sage dark | `#6B8060` | `#5C7B51` | Duidelijker groen, geen muisgrijs meer |
| Sage deep | `#5A6E50` | `#4A6640` | Volwassener groen |

#### Nieuw: Warm teal (complementair accent)

| Naam | Hex | Gebruik |
|---|---|---|
| Teal light | `#E0EDEA` | Subtiele achtergrond bij info-boxes |
| Teal mid | `#5C9E94` | Info-badges, drinkwater-iconen, vocht-hints |
| Teal dark | `#3D7A72` | Hover-states, sterke info-accenten |

Teal werkt complementair op de kleurencirkel met terracotta. Praktisch voor de app: kattenvoeding draait ook om vocht/hydratatie — teal is semantisch passend.

#### Nieuw: Warm goud (premium accent)

| Naam | Hex | Gebruik |
|---|---|---|
| Goud light | `#F5E6C0` | Achtergrond bij "Aanbevolen" badges |
| Goud mid | `#C89A30` | "Prijstip", "Premium" badges, sterrenscore |
| Goud dark | `#9A7420` | Tekst op goud-achtergrond |

---

## Compleet nieuw CSS-variabelen blok

```css
:root {
  /* ── Achtergronden (FRIS — niet langer viezig) ── */
  --beige-lightest:  #FDFAF7;   /* bijna wit — kaartoppervlak */
  --beige-light:     #F4EFE9;   /* pagina-achtergrond */
  --beige-mid:       #EDE7DF;   /* verdiepte vlakken */
  --beige-warm:      #E8DDD2;   /* decoratief warm vlak */

  /* ── Terracotta (accentkleur — sterk en warm) ── */
  --roest-light:     #F5C5AA;
  --roest-mid:       #C1633E;
  --roest-dark:      #9A4A2E;
  --roest-deep:      #7A3624;

  /* ── Sage green (verfrist) ── */
  --sage-light:      #E4EDE0;
  --sage-mid:        #9EB59A;
  --sage-dark:       #5C7B51;
  --sage-deep:       #4A6640;

  /* ── Warm teal (nieuw — complementair) ── */
  --teal-light:      #E0EDEA;
  --teal-mid:        #5C9E94;
  --teal-dark:       #3D7A72;

  /* ── Warm goud (nieuw — premium) ── */
  --goud-light:      #F5E6C0;
  --goud-mid:        #C89A30;
  --goud-dark:       #9A7420;

  /* ── Tekst ── */
  --text-darkest:    #1E1208;
  --text-dark:       #3D2218;
  --text-muted:      #8C7068;

  /* ── Design tokens ── */
  --color-bg:            var(--beige-light);
  --color-surface:       var(--beige-lightest);
  --color-surface-2:     var(--beige-mid);
  --color-border:        rgba(74,46,42,0.12);
  --color-border-strong: rgba(74,46,42,0.28);
  --color-text-primary:  var(--text-darkest);
  --color-text-body:     var(--text-dark);
  --color-text-muted:    var(--text-muted);
  --color-accent:        var(--roest-mid);
  --color-accent-dark:   var(--roest-dark);
  --color-green:         var(--sage-dark);
  --color-green-dark:    var(--sage-deep);
  --color-teal:          var(--teal-mid);
  --color-gold:          var(--goud-mid);

  /* ── Shadows (iets lichter want achtergrond is frisser) ── */
  --shadow-sm: 0 1px 4px rgba(74,46,42,0.08), 0 0 0 1px rgba(74,46,42,0.05);
  --shadow-md: 0 4px 16px rgba(74,46,42,0.10), 0 0 0 1px rgba(74,46,42,0.06);
  --shadow-lg: 0 8px 28px rgba(74,46,42,0.12), 0 0 0 1px rgba(74,46,42,0.06);
}
```

---

## Aanbevelingen buiten het kleurenpalet

### 1. Typografie — prima, maar gebruik de cursieve variant meer
Sansita heeft een prachtige cursief-variant die zelden wordt ingezet. De tagline "Elke kat is anders" in *Sansita cursief* is meteen herkenbaar en warmer dan de rechte variant.

### 2. Logo op donkere achtergrond
Bij gebruik op `--roest-deep` (`#7A3624`) werkt de huidige `filter: brightness(0) invert(1)` goed. Op middentinten (terracotta of teal) werkt het minder goed — overweeg een kleurige versie van het logo voor die situaties.

### 3. Rapport-specifiek: formele context = neutrale achtergrond
Voor het adviesrapport is `#FDFAF7` (bijna wit) als achtergrond het meest professioneel en printvriendelijk. Dit past beter bij een officieel document dan de warme beige.

### 4. Donkere modus / nachtmodus
Het huidige palet werkt goed in de lichte versie. Een donkere variant zou simpelweg het diepe roest (`#7A3624`) als achtergrond gebruiken met lichte tekst. Dit zou de app een premium-gevoel geven voor avondgebruik.

### 5. Spacing en witruimte
De app gebruikt al veel witruimte, maar door de achtergronden frisser te maken zal die witruimte nóg meer ademen. Geen aanpassing nodig aan de spacing-tokens.

---

## Implementatiestrategie

**Volgorde van uitrollen:**

1. **`css/style.css`** — CSS-variabelen vervangen (één blok, laag risico)
2. **`huisstijl.html`** — CSS-variabelen updaten voor de style guide
3. **Inline `voedingsadvies-app.html`** — variabelen worden automatisch opgepikt; hardcoded hex-waarden (bijv. `#EDE5D8` direct in een `style=""`) moeten handmatig worden bijgewerkt
4. **Visuele check** — in browser vergelijken voor/na

De terracotta-waarden in de app worden op sommige plekken hardcoded gebruikt als `#B65A3A` (licht afwijkend van `#B35C3A`). Dit is een historische inkonsistentie — consolideer naar `#C1633E` als de nieuwe standaard.
