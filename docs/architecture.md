# VoerWijs — architectuur

## Overzicht
Statische HTML/JS applicatie voor voedingsadvies voor katten.
Geen framework, geen build stap — direct serveerbaar via `npx serve`.

## Mapstructuur
```
VoerWijs/
  voedingsadvies-app.html          ← hoofdapp
  betaling.html                    ← Stripe betalingspagina
  server.js                        ← Node.js server (Nodemailer, Stripe webhook)
  css/
    style.css                      ← styling
  data/
    csv/                           ← voerlijsten (brok + natvoer)
    afbeeldingen/                  ← SKU product afbeeldingen
    excel/                         ← inkooplijst + inkoopmatrix
    rapporten/                     ← voorbeeld PDF-adviesrapporten
  brand/                           ← logo's en merkbestanden
  dev/
    analysis/                      ← marktanalyse en checklists
    test-results/                  ← visuele test screenshots
  docs/                            ← technische documentatie (deze map)
  marketing/                       ← contentplan, TikTok posts
  .env                             ← API keys (in .gitignore)
  .env.example                     ← template zonder waarden
```

## Tech stack
| Laag | Technologie |
|---|---|
| Frontend | HTML/CSS/JS — statisch, geen framework |
| Server | Node.js (`server.js`) |
| Email | Nodemailer |
| Betaling | Stripe API |
| Scripting | Python 3 (data-verwerking, scraping, PDF) |
| PDF verwerking | pdftoppm (poppler) |

## Externe koppelingen
| Service | Doel |
|---|---|
| Stripe | Betalingen + webhook |
| Instagram Graph API | Content publiceren (via Make) |
| Make (Integromat) | Automatisering content kalender |
| haarkattentrimsalon.nl | Referentiedata (scraping) |

## Dev server starten
```bash
lsof -ti:3000          # check of poort vrij is
npm start              # start server op poort 3000
# of:
npx serve -l 8080 .   # statische server (VS Code launch)
```
