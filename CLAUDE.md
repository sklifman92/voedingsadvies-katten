# VoerWij — projectinstructies

@.claude/IDENTITY.md
@.claude/SOUL.md
@.claude/AGENTS.md
@.claude/TOOLS.md

## Wat is VoerWij
Een app voor voedingsadvies voor katten. Gericht op katteneigenaren die bewust
willen omgaan met wat hun kat eet. De app combineert kennis over kattenvoeding
met een persoonlijke aanpak.

## Doelgroep
- Katteneigenaren, 25–45 jaar
- Bewust, geïnteresseerd in gezondheid (ook van hun huisdier)
- Actief op Instagram, volgen lifestyle en dierenaccounts

## Tech stack
- Frontend: **HTML/JS** — statische website, geen framework
- Runtime: **Node.js** (npm) — lokaal via `npx serve`
- Scripting: **Python 3** — data-verwerking, web scraping, PDF-verwerking
- Email: **Nodemailer** (Node.js)
- Scraping: **requests + BeautifulSoup4** (Python)
- PDF: **pdftoppm** (poppler) voor het renderen van adviesrapporten
- Data: CSV, XLSX, PDF bestanden in `data/`
- Dev-poort: 3000 (Node) / 8080 (VS Code launch)

## Mapstructuur project
```
VoerWijs/
  voedingsadvies-app.html          ← hoofdapp
  betaling.html                    ← Stripe betalingspagina
  server.js                        ← Node.js server
  data/
    csv/                           ← voerlijsten (brok + natvoer)
    afbeeldingen/                  ← SKU product afbeeldingen
    excel/                         ← inkooplijst + inkoopmatrix
    rapporten/                     ← PDF-adviesrapporten + werkboek
  brand/                           ← logo's (Blauw/, Roest/) + merkafbeeldingen
  docs/                            ← technische docs, instructies, inkoopstrategie
  dev/                             ← huisstijl.html, kleurvergelijking.html, analysis/, test-results/
  marketing/                       ← contentplan, Instagram posts
```

## Codeerconventies
- Componentnamen in PascalCase
- Functies beschrijvend benoemen in het Nederlands of Engels
- Commentaar in het Nederlands
- Geen magic numbers — gebruik benoemde variabelen

## Marketing — Instagram
- Primair kanaal: **Instagram**
- Toon: warm, deskundig maar toegankelijk, licht humoristisch
- Doelstelling: community opbouwen rondom bewuste kattenvoeding

### Content-output formaat
Bij elke contentaanvraag lever ik altijd:
1. **Format** — Reel / Carrousel / Story / Static post
2. **Hook** — eerste zin die scrollen stopt
3. **Body** — kernwaarde in 3–5 punten
4. **CTA** — concrete actie
5. **Caption** — klaar om te plaatsen
6. **Hashtags** — 10–15 stuks (mix niche/medium/breed)
7. **Automatiseringsvoorstel** — hoe plan/publiceer je dit via Make?

### Instagram-logica
- Saves + shares > likes > comments voor bereik
- Eerste 3 seconden bepalen of iemand blijft
- Carrousels: begin sterk, slide 2 = de haak, laatste slide = CTA
- Reels: hook in woordvorm + visueel binnen 2 sec

## Automatisering
- Tool: **Make (Integromat)**
- Basispatroon: Google Sheet (content kalender) → Make → Instagram
- Zie .claude/AGENTS.md voor agent-gedrag rondom content

## Wat ik NIET doe in dit project
- Geen technische diepgang die niet relevant is voor de app
- Geen generieke marketing zonder VoerWij-context
