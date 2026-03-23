# Huisstijl — HAAR. Centrum voor kattenwelzijn

Merkidentiteit en visuele richtlijnen voor de VoerWijs-app en bijbehorende uitingen.

---

## Merk

| | |
|---|---|
| **Merk** | HAAR. Centrum voor kattenwelzijn |
| **Product** | VoerWijs — persoonlijk voedingsadvies voor katten |
| **Toon** | Warm, deskundig, toegankelijk, licht humoristisch |
| **Wat het NIET is** | Klinisch, angstgedreven, overdreven enthousiast |

---

## Kleurenpalet

### Primaire kleuren

| Naam | CSS-variabele | Hex | Gebruik |
|---|---|---|---|
| Roest mid | `--roest-mid` / `--color-accent` | `#B35C3A` | Primaire accentkleur, knoppen, links, highlights |
| Roest dark | `--roest-dark` / `--color-accent-dark` | `#8C3F2B` | Hover-states, actieve elementen |
| Roest deep | `--roest-deep` | `#7A3624` | Headers, donkere achtergronden |
| Roest light | `--roest-light` | `#E9A98C` | Achtergrond-accenten, zachte highlights |

### Neutrale/beige kleuren

| Naam | CSS-variabele | Hex | Gebruik |
|---|---|---|---|
| Beige lightest | `--beige-lightest` / `--color-surface` | `#F2EAE0` | Header-achtergrond, oppervlakken |
| Beige light | `--beige-light` / `--color-bg` | `#EDE5D8` | Pagina-achtergrond |
| Beige mid | `--beige-mid` / `--color-surface-2` | `#E4DDD0` | Kaarten, verdiepte vlakken |
| Beige warm | `--beige-warm` | `#D6C1A9` | Decoratieve elementen |

### Salie/groen (secundair)

| Naam | CSS-variabele | Hex | Gebruik |
|---|---|---|---|
| Sage dark | `--sage-dark` / `--color-green` | `#6B8060` | Positieve signalen, check-iconen |
| Sage deep | `--sage-deep` / `--color-green-dark` | `#5A6E50` | Hover-state groen |
| Sage mid | `--sage-mid` | `#A8B5A2` | Subtiele groene accenten |
| Sage light | `--sage-light` | `#E0E6DA` | Lichte groene achtergronden |

### Tekstkleuren

| Naam | CSS-variabele | Hex | Gebruik |
|---|---|---|---|
| Tekst primair | `--color-text-primary` | `#261510` | Koppen, sterke nadruk |
| Tekst body | `--color-text-body` | `#3D2218` | Lopende tekst |
| Tekst muted | `--color-text-muted` | `#8A6860` | Bijschriften, secundaire info |

---

## Typografie

### Lettertypen

| Rol | Familie | Gewichten | Gebruik |
|---|---|---|---|
| **Heading** | Sansita (serif) | 400, 700, 800, 900 — ook cursief | Paginatitels, sectietitels, kaatnamen in rapport |
| **Body** | Nunito Sans (sans-serif) | 300, 400, 600, 700, 800 | Alle overige tekst |

**Google Fonts import:**
```
Sansita:ital,wght@0,400;0,700;0,800;0,900;1,400;1,700
Nunito+Sans:wght@300;400;600;700;800
```

### Typografische schaal (richtlijn)

| Element | Font | Grootte | Gewicht |
|---|---|---|---|
| Paginatitel (H1) | Sansita | clamp(2rem, 5vw, 3.2rem) | 800 |
| Sectietitel (H2) | Sansita | clamp(1.55rem, 3vw, 2rem) | 800 |
| Subtitel / kicker | Nunito Sans | 0.68–0.72rem | 800, uppercase, letter-spacing 2–3px |
| Body tekst | Nunito Sans | 0.9–0.95rem | 400–600, line-height 1.7–1.85 |
| Labels / meta | Nunito Sans | 0.72–0.82rem | 600–700 |
| Fijndruk / disclaimer | Nunito Sans | 0.78–0.8rem | 400, italic |

---

## Ruimte en vorm

### Border-radius

| Token | Waarde | Gebruik |
|---|---|---|
| `--radius-sm` | `8px` | Kleine elementen, fact-bubbles |
| `--radius-md` | `12px` | Kaarten, knoppen |
| `--radius-lg` | `18px` | Grotere kaarten, modals |
| `--radius-pill` | `999px` | Badges, tags, pills |
| Formele elementen | `4px` | Rapport-kaarten, tabel-wrappers (zakelijke context) |

### Schaduwen

```css
--shadow-sm: 0 1px 4px rgba(74,46,42,0.10), 0 0 0 1px rgba(74,46,42,0.06);
--shadow-md: 0 4px 16px rgba(74,46,42,0.12), 0 0 0 1px rgba(74,46,42,0.07);
--shadow-lg: 0 8px 28px rgba(74,46,42,0.15), 0 0 0 1px rgba(74,46,42,0.07);
```

---

## UI-patronen

### Knoppen

| Type | Achtergrond | Tekst | Gebruik |
|---|---|---|---|
| Primair | `#B35C3A` | `#fff` | Hoofdactie per pagina |
| Secundair | `rgba(182,90,58,0.09)` + border | `#B65A3A` | Nevenacties, bestellen |
| Ghost | Transparant + border | `rgba(74,46,42,0.5)` | Terugknop, herstarten |

### Badges / kickers

- **Marketing-context** (wizard): pill-stijl met `border-radius: 999px` en lichte achtergrond
- **Rapport-context** (formeel): geen achtergrond, uppercase tekst, `letter-spacing: 2.5px`, gedempte kleur

### Highlight-boxes

```
border-left: 4px solid #B35C3A
border-radius: 0 3px 3px 0
background: #fff
```
Gebruik voor: aandachtspunten, praktische tips, disclaimers.

### Rapport-accentlijn

```
background: linear-gradient(90deg, #4A2E2A 0%, #B65A3A 50%, #C47A5A 100%)
height: 4px
```
Staat bovenaan elk adviesrapport als formele document-markering.

---

## Logo

- Bestand: `assets/haar-centrum-logo.svg`
- Gebruik op lichte achtergrond: normaal
- Gebruik op donkere achtergrond: `filter: brightness(0) invert(1)` (wit)
- Minimale hoogte: 32px (navigatie), 38px (sluitblok rapport)

---

## Toon & stem

### Wat VoerWijs/HAAR. zegt

- "Wist je dat de meeste katten chronisch te weinig drinken?"
- "Elke kat is anders — VoerWijs helpt jou uitvinden wat werkt."
- "Goed eten voor je kat hoeft niet ingewikkeld te zijn."

### Wat VoerWijs/HAAR. NIET zegt

- Angstmarketing: "je kat gaat dood als je dit niet doet"
- Overdreven enthousiast: "Amazing! Incredible!"
- Klinisch of wetenschappelijk koud

### Aanspreking

- Eigenaren: **u** (formeel in rapporten), **je** (informeel op website/social)
- Rapporten: altijd **u** — professioneel adviesklimaat
- Instagram: **je** — persoonlijk en warm

---

## Fotostijl

- Natuurlijk licht, geen flashfotografie
- Echte katten van eigenaren (geen stockfoto's)
- Warme tinten passend bij het palet (beige, terracotta, groen)
- Geen gestileerde of te perfecte composities

---

## Instagram-richtlijnen

- Formaten: Reel, Carrousel, Story, Static post
- Verhouding saves/shares > likes > comments (algoritme)
- Hook binnen eerste 3 seconden (Reel) of eerste slide (Carrousel)
- Carrousel: eerste slide stopt het scrollen, slide 2 = de haak, laatste = CTA
- Hashtag-mix: 3–4 niche (`#bewustekattenvoeding`), 5–6 medium (`#kattenliefhebbers`), 2–3 breed (`#catsofinstagram`)
