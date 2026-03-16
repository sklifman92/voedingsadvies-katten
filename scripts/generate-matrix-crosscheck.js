const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'analysis');
const todayStamp = new Date().toISOString().slice(0, 10);
const rawCsvPath = path.join(outputDir, `matrix-crosscheck-raw-${todayStamp}.csv`);
const summaryCsvPath = path.join(outputDir, `matrix-crosscheck-summary-${todayStamp}.csv`);
const reportMdPath = path.join(outputDir, `matrix-crosscheck-report-${todayStamp}.md`);
const matrixWorkbookPath = path.join(rootDir, 'Voeding prijzen en afbeeldingen', 'inkoopmatrix_21_beslisboom_urls.xlsx');

const EXPECTED_MATRIX_IDS = {
  balanced:   { brok: ['MX-01', 'MX-02', 'MX-03'], nat: ['MX-10', 'MX-11', 'MX-12'] },
  sterilised: { brok: ['MX-04', 'MX-05', 'MX-06'], nat: ['MX-13', 'MX-14', 'MX-15'] },
  sensitive:  { brok: ['MX-07', 'MX-08', 'MX-09'], nat: ['MX-16', 'MX-17', 'MX-18'] },
  hairball:   { brok: ['MX-19', 'MX-08', 'MX-09'], nat: ['MX-10', 'MX-11', 'MX-12'] },
  actief:     { brok: ['MX-20', 'MX-02', 'MX-03'], nat: ['MX-10', 'MX-11', 'MX-12'] },
  senior:     { brok: ['MX-21'],                  nat: ['MX-10', 'MX-11', 'MX-12'] },
  kitten:     { brok: ['MX-22', 'MX-23', 'MX-24'], nat: ['MX-25', 'MX-26', 'MX-27'] },
};

function runPython(code) {
  return execFileSync('python3', ['-c', code], {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

function loadWorkbookData() {
  const pythonCode = `
import json
from openpyxl import load_workbook

wb = load_workbook(r'''${matrixWorkbookPath}''', data_only=True)

rows = []
ws = wb['Inkoopmatrix_21']
headers = [c.value for c in ws[1]]
for row in ws.iter_rows(min_row=2, values_only=True):
    if not any(row):
        continue
    item = {}
    for key, value in zip(headers, row):
        item[key] = value
    rows.append(item)

tree = []
ws = wb['Beslisboom']
headers = [c.value for c in ws[1]]
for row in ws.iter_rows(min_row=2, values_only=True):
    if not any(row):
        continue
    item = {}
    for key, value in zip(headers, row):
        item[key] = value
    tree.append(item)

print(json.dumps({
  'matrixRows': rows,
  'decisionTree': tree
}, ensure_ascii=False))
`;

  return JSON.parse(runPython(pythonCode));
}

function waitForServer(port, timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const http = require('http');
    const tryPing = () => {
      const req = http.get(`http://127.0.0.1:${port}/voedingsadvies-app.html`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Server op poort ${port} startte niet binnen ${timeoutMs} ms.`));
          return;
        }
        setTimeout(tryPing, 250);
      });
    };
    tryPing();
  });
}

function normalizeText(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ');
  return normalized === '-' ? '' : normalized;
}

function normalizeWorkbookProfile(value) {
  const key = normalizeText(value);
  if (key === 'balanced') return 'balanced';
  if (key === 'kitten') return 'kitten';
  if (key === 'sterilised/gewicht') return 'sterilised';
  if (key === 'sensitive') return 'sensitive';
  if (key === 'sensitive/haarbal') return 'sensitive';
  if (key === 'lean') return 'lean';
  if (key === 'high protein/lean') return 'lean';
  if (key === 'single protein/sensitive') return 'sensitive';
  if (key === 'hairball') return 'hairball';
  if (key === 'hairball specialist') return 'hairball';
  if (key === 'actief/outdoor') return 'actief';
  if (key === 'actief / outdoor') return 'actief';
  if (key === 'actief / outdoor specialist') return 'actief';
  if (key === 'senior') return 'senior';
  if (key === 'senior / light specialist') return 'senior';
  return key;
}

function normalizeWorkbookTier(value) {
  const key = normalizeText(value);
  if (key === 'laag') return 'laag';
  if (key === 'midden') return 'midden';
  if (key === 'hoog') return 'hoog';
  if (key === 'specialist') return 'specialist';
  return key;
}

function getAgeLabel(years) {
  if (years === 0) return 'kitten_0';
  if (years >= 10) return 'senior_10plus';
  return 'adult';
}

function getGoalSetLabel(goals) {
  if (!goals.length) return 'geen_specifiek_doel';
  return goals.slice().sort().join('+');
}

function getExpectedMatrixLane(scenario) {
  if (scenario.ageYears === 0) return 'kitten';
  if (scenario.ageYears >= 10 || scenario.activity === 'inactief') return 'senior';
  if (scenario.castrated || scenario.bcs >= 6 || scenario.goals.includes('overgewicht')) return 'sterilised';
  if (scenario.goals.includes('gevoelig')) return 'sensitive';
  if (scenario.goals.includes('haarbal')) return 'hairball';
  if (scenario.activity === 'actief' || scenario.lifestyle === 'buiten' || scenario.goals.includes('ondergewicht') || scenario.bcs <= 3) return 'actief';
  return 'balanced';
}

function getExpectedMatrixIds(expectedLane, foodType) {
  const expected = EXPECTED_MATRIX_IDS[expectedLane] || { brok: [], nat: [] };
  if (foodType === 'brok') return { brok: expected.brok.slice(), nat: [] };
  if (foodType === 'natvoer') return { brok: [], nat: expected.nat.slice() };
  return { brok: expected.brok.slice(), nat: expected.nat.slice() };
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(headers.map((key) => csvEscape(row[key])).join(','));
  }
  fs.writeFileSync(filePath, lines.join('\n'));
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function makeGoalPowerSet(goalKeys) {
  const results = [];
  const total = 1 << goalKeys.length;
  for (let mask = 0; mask < total; mask += 1) {
    const goals = [];
    for (let i = 0; i < goalKeys.length; i += 1) {
      if (mask & (1 << i)) goals.push(goalKeys[i]);
    }
    results.push(goals);
  }
  return results;
}

function sameIdList(a = [], b = []) {
  return a.join('|') === b.join('|');
}

function diffIds(expected = [], actual = []) {
  const actualSet = new Set(actual);
  return expected.filter((id) => !actualSet.has(id));
}

function topPatterns(rows, keyFn, limit = 5) {
  return Array.from(groupBy(rows, keyFn).entries())
    .map(([key, items]) => ({ key, count: items.length }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const workbook = loadWorkbookData();
  const port = 3031;
  const server = spawn('node', ['server.js'], {
    cwd: rootDir,
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });

  try {
    await waitForServer(port);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    await page.goto(`http://127.0.0.1:${port}/voedingsadvies-app.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof D !== 'undefined' && D.loaded === true, null, { timeout: 20000 });

    const appMatrixProducts = await page.evaluate(() => {
      return Object.values(MATRIX_PRODUCTS).map((item) => ({
        id: item.id,
        type: item.type,
        profile: item.profile,
        tier: item.tier,
        merk: item.merk,
        lijn: item.lijn,
        smaak: item.smaak,
        leverancier: item.leverancier,
        prijs_dag: item.prijs_dag,
        prijs_maand: item.prijs_maand,
        url: item.url,
      }));
    });

    const workbookById = new Map(workbook.matrixRows.map((row) => [String(row.Matrix_ID || '').trim(), row]));
    const appById = new Map(appMatrixProducts.map((row) => [row.id, row]));

    const workbookComparisonRows = [];
    for (const [id, workbookRow] of workbookById.entries()) {
      const appRow = appById.get(id);
      const mismatches = [];

      if (!appRow) {
        mismatches.push('ontbreekt_in_app');
      } else {
        const checks = [
          ['type', normalizeText(workbookRow.Type) === normalizeText(appRow.type)],
          ['profile', normalizeWorkbookProfile(workbookRow.Profiel) === normalizeText(appRow.profile)],
          ['tier', normalizeWorkbookTier(workbookRow['Budget/Lane']) === normalizeText(appRow.tier)],
          ['merk', normalizeText(workbookRow.Merk) === normalizeText(appRow.merk)],
          ['lijn', normalizeText(workbookRow.Lijn) === normalizeText(appRow.lijn)],
          ['smaak', normalizeText(workbookRow.Smaak) === normalizeText(appRow.smaak)],
          ['leverancier', normalizeText(workbookRow['Geselecteerde leverancier']) === normalizeText(appRow.leverancier)],
          ['url', normalizeText(workbookRow['Product URL']) === normalizeText(appRow.url)],
        ];
        for (const [field, ok] of checks) {
          if (!ok) mismatches.push(field);
        }
      }

      workbookComparisonRows.push({
        matrix_id: id,
        workbook_profile: workbookRow.Profiel,
        workbook_lane: workbookRow['Budget/Lane'],
        workbook_merk: workbookRow.Merk,
        workbook_lijn: workbookRow.Lijn,
        workbook_smaak: workbookRow.Smaak,
        app_profile: appRow?.profile || '',
        app_tier: appRow?.tier || '',
        app_merk: appRow?.merk || '',
        app_lijn: appRow?.lijn || '',
        app_smaak: appRow?.smaak || '',
        status: mismatches.length ? 'afwijking' : 'ok',
        mismatch_fields: mismatches.join(' | '),
      });
    }

    const ageYearsList = [0, 4, 10];
    const lifestyleList = ['binnen', 'buiten'];
    const castratedList = [false, true];
    const bcsList = [2, 3, 5, 7, 8];
    const activityList = ['inactief', 'gemiddeld', 'actief'];
    const goalSets = makeGoalPowerSet(['gevoelig', 'vacht', 'haarbal', 'overgewicht', 'ondergewicht']);
    const foodTypes = ['brok', 'natvoer', 'both'];

    const scenarios = [];
    let scenarioId = 1;
    for (const ageYears of ageYearsList) {
      for (const lifestyle of lifestyleList) {
        for (const castrated of castratedList) {
          for (const bcs of bcsList) {
            for (const activity of activityList) {
              for (const goals of goalSets) {
                for (const foodType of foodTypes) {
                  scenarios.push({
                    scenarioId: `SC-${String(scenarioId).padStart(5, '0')}`,
                    ageYears,
                    lifestyle,
                    castrated,
                    bcs,
                    activity,
                    goals,
                    foodType,
                  });
                  scenarioId += 1;
                }
              }
            }
          }
        }
      }
    }

    const appResults = await page.evaluate((scenarioBatch) => {
      function matrixIdForRow(row) {
        if (!row) return '';
        if (row.id && MATRIX_PRODUCTS[row.id]) return row.id;
        const match = Object.values(MATRIX_PRODUCTS).find((item) => rowMatchesSpec(row, item));
        return match ? match.id : '';
      }

      function applyScenario(s) {
        D.step5BrokPool = [];
        D.step5NatvoerPool = [];
        Object.assign(P, {
          draftId: '',
          ownerName: 'Expertise check',
          catName: 'Testkat',
          catEmail: '',
          catRas: 'Europese korthaar',
          catLeeftijd: String(s.ageYears),
          geslacht: 'poes',
          leefstijl: s.lifestyle,
          castrated: s.castrated,
          gewicht: s.bcs >= 6 ? '5.8' : '4.2',
          bcs: s.bcs,
          activiteit: s.activity,
          eetgedrag: 'rustig',
          drinkgedrag: 'gemiddeld',
          ontlasting: s.goals.includes('gevoelig') ? 'gevoelig' : 'goed',
          vachtbeeld: s.goals.includes('vacht') ? 'dof' : 'glanzend',
          doelen: s.goals.slice(),
          vachtProbs: s.goals.includes('vacht') ? ['dof'] : [],
          bijzonderheden: '',
          foodType: s.foodType,
          textuurPref: [],
          graanvrij: undefined,
          biologisch: undefined,
          budgetMax: null,
          step5BrokSel: null,
          step5NatvoerSel: null,
        });
      }

      return scenarioBatch.map((scenario) => {
        applyScenario(scenario);
        const primaryProfile = getPrimaryAdviceProfile();
        const decisionProfile = getDecisionProfile();
        const matrixTiers = getMatrixTiers();
        const planFoods = getPlanFoods();
        const displayOptions = getDisplayFoodOptions(planFoods);

        return {
          scenarioId: scenario.scenarioId,
          primaryProfile,
          decisionProfile,
          matrixBrokIds: (matrixTiers.brok || []).map((item) => item?.id).filter(Boolean),
          matrixNatIds: (matrixTiers.nat || []).map((item) => item?.id).filter(Boolean),
          displayOptions: displayOptions.map((option) => ({
            label: option.label,
            summary: option.summary,
            isRecommended: option.isRecommended,
            matrixId: matrixIdForRow(option.row),
            type: option.row.type,
            merk: option.row.merk,
            lijn: option.row.lijn,
            smaak: option.row.smaak,
            prijs: option.row.prijs,
          })),
        };
      });
    }, scenarios);

    await browser.close();

    const resultsByScenarioId = new Map(appResults.map((item) => [item.scenarioId, item]));
    const rawRows = [];

    for (const scenario of scenarios) {
      const appResult = resultsByScenarioId.get(scenario.scenarioId);
      const expectedLane = getExpectedMatrixLane(scenario);
      const expectedIds = getExpectedMatrixIds(expectedLane, scenario.foodType);
      const laneMatch = appResult.decisionProfile === expectedLane;
      const matrixIdsMatch = sameIdList(expectedIds.brok, appResult.matrixBrokIds) && sameIdList(expectedIds.nat, appResult.matrixNatIds);
      const displayIds = appResult.displayOptions.map((item) => item.matrixId).filter(Boolean);
      const unexpectedBrok = diffIds(appResult.matrixBrokIds, expectedIds.brok);
      const missingBrok = diffIds(expectedIds.brok, appResult.matrixBrokIds);
      const unexpectedNat = diffIds(appResult.matrixNatIds, expectedIds.nat);
      const missingNat = diffIds(expectedIds.nat, appResult.matrixNatIds);

      rawRows.push({
        scenario_id: scenario.scenarioId,
        leeftijd: getAgeLabel(scenario.ageYears),
        leeftijd_jaren: scenario.ageYears,
        leefstijl: scenario.lifestyle,
        castraat: scenario.castrated ? 'ja' : 'nee',
        bcs_score: scenario.bcs,
        activiteit: scenario.activity,
        doelen: getGoalSetLabel(scenario.goals),
        food_type: scenario.foodType,
        expected_matrix_lane: expectedLane,
        expected_matrix_brok_ids: expectedIds.brok.join(' | '),
        expected_matrix_nat_ids: expectedIds.nat.join(' | '),
        app_primary_profile: appResult.primaryProfile,
        app_decision_profile: appResult.decisionProfile,
        app_matrix_brok_ids: appResult.matrixBrokIds.join(' | '),
        app_matrix_nat_ids: appResult.matrixNatIds.join(' | '),
        lane_match: laneMatch ? 'ja' : 'nee',
        matrix_ids_match: matrixIdsMatch ? 'ja' : 'nee',
        missing_matrix_brok_ids: missingBrok.join(' | '),
        unexpected_matrix_brok_ids: unexpectedBrok.join(' | '),
        missing_matrix_nat_ids: missingNat.join(' | '),
        unexpected_matrix_nat_ids: unexpectedNat.join(' | '),
        advies_1: appResult.displayOptions[0] ? `${appResult.displayOptions[0].label}: ${appResult.displayOptions[0].merk} ${appResult.displayOptions[0].lijn} ${appResult.displayOptions[0].smaak}`.trim() : '',
        advies_1_matrix_id: appResult.displayOptions[0]?.matrixId || '',
        advies_2: appResult.displayOptions[1] ? `${appResult.displayOptions[1].label}: ${appResult.displayOptions[1].merk} ${appResult.displayOptions[1].lijn} ${appResult.displayOptions[1].smaak}`.trim() : '',
        advies_2_matrix_id: appResult.displayOptions[1]?.matrixId || '',
        advies_3: appResult.displayOptions[2] ? `${appResult.displayOptions[2].label}: ${appResult.displayOptions[2].merk} ${appResult.displayOptions[2].lijn} ${appResult.displayOptions[2].smaak}`.trim() : '',
        advies_3_matrix_id: appResult.displayOptions[2]?.matrixId || '',
        alle_advies_matrix_ids: displayIds.join(' | '),
      });
    }

    const summaryGroups = groupBy(rawRows, (row) => [
      row.food_type,
      row.expected_matrix_lane,
      row.app_primary_profile,
      row.app_decision_profile,
      row.lane_match,
      row.matrix_ids_match,
      row.app_matrix_brok_ids,
      row.app_matrix_nat_ids,
      row.advies_1,
      row.advies_2,
      row.advies_3,
    ].join('||'));

    const summaryRows = Array.from(summaryGroups.values()).map((group) => {
      const row = group[0];
      const examples = group.slice(0, 3).map((item) => (
        `${item.scenario_id}: ${item.leeftijd}, ${item.leefstijl}, castraat=${item.castraat}, bcs=${item.bcs_score}, act=${item.activiteit}, doelen=${item.doelen}`
      )).join(' || ');
      return {
        combinaties: group.length,
        food_type: row.food_type,
        expected_matrix_lane: row.expected_matrix_lane,
        app_primary_profile: row.app_primary_profile,
        app_decision_profile: row.app_decision_profile,
        lane_match: row.lane_match,
        matrix_ids_match: row.matrix_ids_match,
        app_matrix_brok_ids: row.app_matrix_brok_ids,
        app_matrix_nat_ids: row.app_matrix_nat_ids,
        advies_1: row.advies_1,
        advies_2: row.advies_2,
        advies_3: row.advies_3,
        voorbeeld_condities: examples,
      };
    }).sort((a, b) => {
      if (a.lane_match !== b.lane_match) return a.lane_match === 'nee' ? -1 : 1;
      if (a.matrix_ids_match !== b.matrix_ids_match) return a.matrix_ids_match === 'nee' ? -1 : 1;
      if (a.expected_matrix_lane !== b.expected_matrix_lane) {
        return String(a.expected_matrix_lane).localeCompare(String(b.expected_matrix_lane));
      }
      return String(a.food_type).localeCompare(String(b.food_type));
    });

    const laneMismatchRows = rawRows.filter((row) => row.lane_match === 'nee');
    const matrixIdMismatchRows = rawRows.filter((row) => row.matrix_ids_match === 'nee');
    const workbookMismatchRows = workbookComparisonRows.filter((row) => row.status === 'afwijking');
    const kittenRows = rawRows.filter((row) => row.leeftijd === 'kitten_0');
    const kittenLaneMismatchCount = kittenRows.filter((row) => row.lane_match === 'nee').length;
    const kittenMatrixMismatchCount = kittenRows.filter((row) => row.matrix_ids_match === 'nee').length;

    const lanePatterns = topPatterns(laneMismatchRows, (row) => `${row.expected_matrix_lane} -> ${row.app_decision_profile}`);
    const matrixPatterns = topPatterns(matrixIdMismatchRows, (row) => `${row.expected_matrix_lane} (${row.food_type})`);

    const reportLines = [
      '# Matrix cross-check',
      '',
      `Gegenereerd op ${new Date().toISOString()}.`,
      '',
      '## Kerncijfers',
      '',
      `- Workbook-rijen in \`Inkoopmatrix_21\`: ${workbook.matrixRows.length}`,
      `- App-matrixproducten in \`MATRIX_PRODUCTS\`: ${appMatrixProducts.length}`,
      `- Workbook/app-veldafwijkingen op SKU-niveau: ${workbookMismatchRows.length}`,
      `- Doorgerekende scenario\\'s: ${rawRows.length}`,
      `- Scenario\\'s met lane-mismatch t.o.v. de beslisboom: ${laneMismatchRows.length}`,
      `- Scenario\\'s met afwijkende matrix-ID\\'s t.o.v. de verwachte lane: ${matrixIdMismatchRows.length}`,
      `- Kitten-scenario\\'s: ${kittenRows.length} totaal, lane-mismatch ${kittenLaneMismatchCount}, matrix-ID-mismatch ${kittenMatrixMismatchCount}`,
      '',
      '## Conclusie',
      '',
    ];

    if (!laneMismatchRows.length && !matrixIdMismatchRows.length && !workbookMismatchRows.length) {
      reportLines.push('- De app volgt in alle doorgerekende scenario\'s dezelfde lane en dezelfde matrixproducten als de beslisboom verwacht.');
      reportLines.push('- De kittenlane is inhoudelijk aangesloten: kittens krijgen een eigen \`kitten\`-profiel en de verwachte MX-22 t/m MX-27-producten.');
      reportLines.push('- Er zijn geen workbook/app-afwijkingen meer op SKU-niveau gevonden.');
    } else {
      if (laneMismatchRows.length) {
        reportLines.push(`- Er blijven ${laneMismatchRows.length} lane-mismatches over. Grootste patronen:`);
        lanePatterns.forEach((item) => {
          reportLines.push(`  - ${item.key}: ${item.count} scenario's`);
        });
      } else {
        reportLines.push('- Geen lane-mismatches gevonden.');
      }

      if (matrixIdMismatchRows.length) {
        reportLines.push(`- Er blijven ${matrixIdMismatchRows.length} matrix-ID-mismatches over. Grootste patronen:`);
        matrixPatterns.forEach((item) => {
          reportLines.push(`  - ${item.key}: ${item.count} scenario's`);
        });
      } else {
        reportLines.push('- Geen matrix-ID-mismatches gevonden.');
      }

      if (workbookMismatchRows.length) {
        reportLines.push(`- Er zijn ${workbookMismatchRows.length} workbook/app-afwijkingen op veldniveau.`);
      } else {
        reportLines.push('- Geen workbook/app-afwijkingen op SKU-niveau.');
      }
    }

    reportLines.push(
      '',
      '## Bestanden',
      '',
      `- Ruwe conditietabel: ${path.relative(rootDir, rawCsvPath)}`,
      `- Samenvatting per unieke uitkomst: ${path.relative(rootDir, summaryCsvPath)}`,
      '',
      '## Workbook vs app detailafwijkingen',
      ''
    );

    if (!workbookMismatchRows.length) {
      reportLines.push('- Geen structurele SKU-afwijkingen gevonden.');
    } else {
      workbookMismatchRows.forEach((row) => {
        reportLines.push(`- ${row.matrix_id}: afwijking in ${row.mismatch_fields}. Workbook "${row.workbook_merk} ${row.workbook_lijn} ${row.workbook_smaak}" vs app "${row.app_merk} ${row.app_lijn} ${row.app_smaak}".`);
      });
    }

    writeCsv(rawCsvPath, [
      'scenario_id', 'leeftijd', 'leeftijd_jaren', 'leefstijl', 'castraat', 'bcs_score', 'activiteit', 'doelen',
      'food_type', 'expected_matrix_lane', 'expected_matrix_brok_ids', 'expected_matrix_nat_ids',
      'app_primary_profile', 'app_decision_profile', 'app_matrix_brok_ids', 'app_matrix_nat_ids',
      'lane_match', 'matrix_ids_match', 'missing_matrix_brok_ids', 'unexpected_matrix_brok_ids',
      'missing_matrix_nat_ids', 'unexpected_matrix_nat_ids',
      'advies_1', 'advies_1_matrix_id', 'advies_2', 'advies_2_matrix_id', 'advies_3', 'advies_3_matrix_id',
      'alle_advies_matrix_ids',
    ], rawRows);

    writeCsv(summaryCsvPath, [
      'combinaties', 'food_type', 'expected_matrix_lane', 'app_primary_profile', 'app_decision_profile',
      'lane_match', 'matrix_ids_match', 'app_matrix_brok_ids', 'app_matrix_nat_ids',
      'advies_1', 'advies_2', 'advies_3', 'voorbeeld_condities',
    ], summaryRows);

    fs.writeFileSync(reportMdPath, reportLines.join('\n'));

    console.log(JSON.stringify({
      rawCsvPath,
      summaryCsvPath,
      reportMdPath,
      scenarioCount: rawRows.length,
      laneMismatchCount: laneMismatchRows.length,
      matrixIdMismatchCount: matrixIdMismatchRows.length,
      workbookMismatchCount: workbookMismatchRows.length,
    }, null, 2));
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
