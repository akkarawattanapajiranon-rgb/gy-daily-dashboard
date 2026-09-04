const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const { findMonthlyFile } = require('./month_utils');

const WASTE_BASE_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report';

function getOfficialWasteData(dateStr) {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const monthNum = parseInt(monthStr, 10);
    const dayNum = parseInt(dayStr, 10);
    const daySheetName = String(dayNum);

    if (!fs.existsSync(WASTE_BASE_DIR)) {
      return { error: 'Waste Report directory not found' };
    }

    const monthDirs = fs.readdirSync(WASTE_BASE_DIR);
    const monthFolder = monthDirs.find(d => {
      const l = d.toLowerCase();
      return l.includes(`${monthNum}.`) || l.includes(`${monthStr}.`) || l.includes(monthStr);
    });

    if (!monthFolder) {
      return { error: `Month folder for month ${monthNum} not found in Waste Report` };
    }

    const monthFolderPath = path.join(WASTE_BASE_DIR, monthFolder);
    const monthFiles = fs.readdirSync(monthFolderPath);

    const frictionFile = monthFiles.find(f => f.toLowerCase().includes('friction') && !f.startsWith('~$'));
    const millingFile = monthFiles.find(f => f.toLowerCase().includes('milling') && !f.startsWith('~$'));

    let frictionSummary = 0;
    let millingSummary = 0;
    const frictionMap = {};
    const millingMap = {};

    // 1. Parse Friction File
    if (frictionFile) {
      const wb = XLSX.readFile(path.join(monthFolderPath, frictionFile));
      const ws = wb.Sheets[daySheetName];
      if (ws) {
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        
        // Header summary numbers
        if (rows[0] && rows[0][8] !== undefined && !isNaN(rows[0][8])) {
          frictionSummary = Number(rows[0][8]) || 0;
        }

        // Parse defect rows
        rows.forEach((r, idx) => {
          if (idx < 2) return;
          const defectName = String(r[5] || r[3] || '').trim();
          const code = String(r[4] || r[6] || '').trim();

          // Sum 1st, 2nd, 3rd shift quantities
          let itemTotal = 0;
          for (let col = 8; col < r.length; col++) {
            const val = parseFloat(r[col]);
            if (!isNaN(val) && val > 0) itemTotal += val;
          }

          if (itemTotal > 0 && (defectName || code)) {
            const key = code || defectName;
            if (!frictionMap[key]) frictionMap[key] = { code: key, amount: 0, reason: defectName || key };
            frictionMap[key].amount += itemTotal;
          }
        });
      }
    }

    // 2. Parse Milling File
    if (millingFile) {
      const wb = XLSX.readFile(path.join(monthFolderPath, millingFile));
      const ws = wb.Sheets[daySheetName];
      if (ws) {
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Header summary numbers
        if (rows[1] && rows[1][8] !== undefined && !isNaN(rows[1][8])) {
          millingSummary = Number(rows[1][8]) || 0;
        }

        rows.forEach((r, idx) => {
          if (idx < 2) return;
          const defectName = String(r[5] || r[3] || '').trim();
          const code = String(r[3] || r[4] || '').trim();

          let itemTotal = 0;
          for (let col = 6; col <= 8; col++) {
            const val = parseFloat(r[col]);
            if (!isNaN(val) && val > 0) itemTotal += val;
          }

          if (itemTotal > 0 && (defectName || code)) {
            const key = code || defectName;
            if (!millingMap[key]) millingMap[key] = { code: key, amount: 0, reason: defectName || key };
            millingMap[key].amount += itemTotal;
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
      frictionTop
    };

  } catch (e) {
    return { error: e.message };
  }
}

console.log('Result for 2026-06-02:', getOfficialWasteData('2026-06-02'));
console.log('Result for 2026-06-15:', getOfficialWasteData('2026-06-15'));
