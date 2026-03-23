# Matrix cross-check

Gegenereerd op 2026-03-15T20:06:49.878Z.

## Kerncijfers

- Workbook-rijen in `Inkoopmatrix_21`: 27
- App-matrixproducten in `MATRIX_PRODUCTS`: 27
- Workbook/app-veldafwijkingen op SKU-niveau: 0
- Doorgerekende scenario\'s: 17280
- Scenario\'s met lane-mismatch t.o.v. de beslisboom: 0
- Scenario\'s met afwijkende matrix-ID\'s t.o.v. de verwachte lane: 0
- Kitten-scenario\'s: 5760 totaal, lane-mismatch 0, matrix-ID-mismatch 0

## Conclusie

- De app volgt in alle doorgerekende scenario's dezelfde lane en dezelfde matrixproducten als de beslisboom verwacht.
- De kittenlane is inhoudelijk aangesloten: kittens krijgen een eigen `kitten`-profiel en de verwachte MX-22 t/m MX-27-producten.
- Er zijn geen workbook/app-afwijkingen meer op SKU-niveau gevonden.

## Bestanden

- Ruwe conditietabel: analysis/matrix-crosscheck-raw-2026-03-15.csv
- Samenvatting per unieke uitkomst: analysis/matrix-crosscheck-summary-2026-03-15.csv

## Workbook vs app detailafwijkingen

- Geen structurele SKU-afwijkingen gevonden.