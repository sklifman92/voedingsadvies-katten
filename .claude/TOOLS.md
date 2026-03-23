# VoerWij — tools & omgeving

## Lokale omgeving
- OS: macOS
- Runtime: Node.js + Python 3
- Projectpad: `~/Desktop/Project Voedingadvies katten/`
- Dev server: `npx serve -l 8080 .` (VS Code launch) of `npm start` (poort 3000)

## Handige commando's
```bash
npm start                    # start development server op poort 3000
npx serve -l 8080 .          # statische server (VS Code launch config)
npm install                  # installeer dependencies
npm run <script>             # voer npm script uit

# Python data-verwerking
python3 -c "..."             # losse Python expressie
pip3 install <pakket>        # installeer Python pakket

# PDF verwerking
pdftoppm -r 150 -png "pad/naar/rapport.pdf" /tmp/output_page
```

## Python bibliotheken (geïnstalleerd)
- `requests` — HTTP requests
- `beautifulsoup4 (bs4)` — web scraping / HTML parsing
- `json` (standaard) — data verwerking

## Node.js bibliotheken
- `nodemailer` — e-mail verzenden
- `serve` (npx) — statische webserver

## Data bestanden
| Bestand | Locatie | Inhoud |
|---|---|---|
| Brok CSV | `data/csv/brok-voerlijst-2026-03-11.csv` | Brokvoerlijst |
| Natvoer CSV | `data/csv/natvoer-voerlijst-2026-03-11.csv` | Natvoerlijst |
| Inkooplijst | `data/excel/inkooplijst voer.xlsx` | Prijzen voer |
| Inkoopmatrix | `data/excel/inkoopmatrix_21_beslisboom_urls.xlsx` | Beslisboom + URLs |
| PDF rapporten | `data/rapporten/` | Voorbeeldadviezen |
| Product afbeeldingen | `data/afbeeldingen/` | SKU afbeeldingen (MX-01 t/m MX-27) |

## Externe bronnen (scraping toegestaan)
- `www.haarkattentrimsalon.nl` — referentiedata

## MCP servers (actief)
- `Claude_Preview` — preview_start (VS Code preview)

## Notities voor Claude
- De app draait als statische HTML — geen build stap nodig
- PDF-bestanden worden gerenderd via pdftoppm naar PNG voor verwerking
- Lees CSV/XLSX altijd met Python, niet met Node tenzij gevraagd
- Check altijd of poort 3000 vrij is voor je de server start: `lsof -ti:3000`
