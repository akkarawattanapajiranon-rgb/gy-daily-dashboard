const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { findMonthlyFile } = require('./month_utils');

const WASTE_BASE_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report';

function parseWasteData(dateStr) {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const monthNum = parseInt(monthStr, 10);
    const dayNum = parseInt(dayStr, 10);

    if (!fs.existsSync(WASTE_BASE_DIR)) {
      return { error: 'Waste Report directory not found' };
    }

    const monthDirs = fs.readdirSync(WASTE_BASE_DIR);
    const monthFolder = monthDirs.find(d => {
      const l = d.toLowerCase();
      return l.includes(`${monthNum}.`) || l.includes(`${monthStr}.`) || l.includes(monthStr);
    });

    if (!monthFolder) {
      return { error: `Month folder ${monthNum} not found in Waste Report` };
    }

    const monthFolderPath = path.join(WASTE_BASE_DIR, monthFolder);
    const monthFiles = fs.readdirSync(monthFolderPath);

    const frictionFileName = monthFiles.find(f => f.toLowerCase().includes('friction') && !f.startsWith('~$'));
    const millingFileName = monthFiles.find(f => f.toLowerCase().includes('milling') && !f.startsWith('~$'));

    let frictionSummary = 0;
    let millingSummary = 0;
    const frictionMap = {};
    const millingMap = {};

    // 1. Read Friction Summary from "Grap" Sheet or Daily Sheet
    if (frictionFileName) {
      const wb = XLSX.readFile(path.join(monthFolderPath, frictionFileName));
      const grapSheet = wb.Sheets['Grap'];
      if (grapSheet) {
        const grapData = XLSX.utils.sheet_to_json(grapSheet, { header: 1, defval: '' });
        const dayColIdx = dayNum; // Col 1 = Day 1, Col 2 = Day 2...
        if (grapData[1] && grapData[1][dayColIdx] !== undefined) {
          frictionSummary = Number(grapData[1][dayColIdx]) || 0;
        }
        if (grapData[2] && grapData[2][dayColIdx] !== undefined && grapData[2][dayColIdx] > 0) {
          millingSummary = Number(grapData[2][dayColIdx]) || 0;
        }
      }

      // Read Daily Sheet for Top Defects
      const dailySheet = wb.Sheets[String(dayNum)];
      if (dailySheet) {
        const rows = XLSX.utils.sheet_to_json(dailySheet, { header: 1, defval: '' });
        rows.forEach((r, rIdx) => {
          if (rIdx < 2) return;
          const defectName = String(r[5] || r[3] || '').trim();
          const code = String(r[4] || r[6] || '').trim();

          let rowSum = 0;
          for (let c = 6; c < r.length; c++) {
            const v = parseFloat(r[c]);
            if (!isNaN(v) && v > 0) rowSum += v;
          }

          if (rowSum > 0 && defectName && !defectName.toLowerCase().includes('defect')) {
            const key = code || defectName;
            if (!frictionMap[key]) frictionMap[key] = { code: key, amount: 0, reason: defectName };
            frictionMap[key].amount += rowSum;
          }
        });
      }
    }

    // 2. Read Milling Summary from Milling File
    if (millingFileName) {
      const wb = XLSX.readFile(path.join(monthFolderPath, millingFileName));
      const grapSheet = wb.Sheets['Grap'];
      if (grapSheet) {
        const grapData = XLSX.utils.sheet_to_json(grapSheet, { header: 1, defval: '' });
        const dayColIdx = dayNum;
        if (grapData[2] && grapData[2][dayColIdx] !== undefined && grapData[2][dayColIdx] > 0) {
          millingSummary = Number(grapData[2][dayColIdx]) || millingSummary;
        }
      }

      const dailySheet = wb.Sheets[String(dayNum)];
      if (dailySheet) {
        const rows = XLSX.utils.sheet_to_json(dailySheet, { header: 1, defval: '' });
        rows.forEach((r, rIdx) => {
          if (rIdx < 2) return;
          const defectName = String(r[5] || r[1] || '').trim();
          const code = String(r[3] || r[0] || '').trim();

          let rowSum = 0;
          for (let c = 6; c <= 9; c++) {
            const v = parseFloat(r[c]);
            if (!isNaN(v) && v > 0) rowSum += v;
          }

          if (rowSum > 0 && defectName && !defectName.toLowerCase().includes('defect')) {
            const key = code || defectName;
            if (!millingMap[key]) millingMap[key] = { code: key, amount: 0, reason: defectName };
            millingMap[key].amount += rowSum;
          }
        });
      }
    }

    const millingTop = Object.values(millingMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
    const frictionTop = Object.values(frictionMap).sort((a, b) => b.amount - a.amount).slice(0, 5);

    millingTop.forEach((item, index) => { item.isHigh = index < 2; });
    frictionTop.forEach((item, index) => { item.isHigh = index < 2; });

    return {
      date: dateStr,
      millingSummary: Number(millingSummary.toFixed(1)),
      frictionSummary: Number(frictionSummary.toFixed(1)),
      millingTop,
      frictionTop,
      dataDate: dateStr,
      hasData: millingSummary > 0 || frictionSummary > 0
    };

  } catch (e) {
    return { error: e.message };
  }
}

console.log('Waste Data 2026-05-15:', parseWasteData('2026-05-15'));
console.log('Waste Data 2026-04-10:', parseWasteData('2026-04-10'));
console.log('Waste Data 2026-03-05:', parseWasteData('2026-03-05'));
console.log('Waste Data 2026-02-14:', parseWasteData('2026-02-14'));
