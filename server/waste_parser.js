const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { matchesMonth } = require('./month_utils');

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
      return matchesMonth(l, monthNum) || l.includes(`${monthNum}.`) || l.includes(`${monthStr}.`);
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
    let beadSummary = 0;

    const frictionMap = {};
    const millingMap = {};
    const beadMap = {};

    let hasDailyFrictionDetails = false;

    // 1. Read Friction File (contains Friction, Bead, and some Milling)
    if (frictionFileName) {
      const wb = XLSX.readFile(path.join(monthFolderPath, frictionFileName));

      // Check Daily Sheet for detailed defect breakdown & accurate summary
      const dailySheet = wb.Sheets[String(dayNum)];
      if (dailySheet) {
        hasDailyFrictionDetails = true;
        const rows = XLSX.utils.sheet_to_json(dailySheet, { header: 1, defval: '' });
        let currentDept = '';

        rows.forEach((r, rIdx) => {
          if (rIdx < 2) return;
          const dept = String(r[0] || '').trim();
          const desc = String(r[3] || '').trim();
          const code = String(r[4] || r[6] || '').trim();
          const defectName = String(r[5] || r[3] || '').trim();

          if (dept) currentDept = dept;

          const lowerDept = currentDept.toLowerCase();
          const lowerDesc = desc.toLowerCase();

          // Determine category: Bead vs Milling vs Friction
          let category = 'Friction';
          if (lowerDept.includes('bead') || lowerDesc === 'a' || lowerDesc.includes('bead')) {
            category = 'Bead';
          } else if (lowerDesc.includes('milling') || lowerDept.includes('apex') || lowerDept.includes('hex bead')) {
            category = 'Milling';
          }

          let rowSum = 0;
          for (let c = 6; c < r.length; c++) {
            const v = parseFloat(r[c]);
            if (!isNaN(v) && v > 0) rowSum += v;
          }

          if (rowSum > 0 && defectName && !defectName.toLowerCase().includes('defect') && !defectName.toLowerCase().includes('ห้ามลบ')) {
            const key = code || defectName;
            if (category === 'Bead') {
              beadSummary += rowSum;
              if (!beadMap[key]) beadMap[key] = { code: key, amount: 0, reason: defectName };
              beadMap[key].amount += rowSum;
            } else if (category === 'Milling') {
              millingSummary += rowSum;
              if (!millingMap[key]) millingMap[key] = { code: key, amount: 0, reason: defectName };
              millingMap[key].amount += rowSum;
            } else {
              frictionSummary += rowSum;
              if (!frictionMap[key]) frictionMap[key] = { code: key, amount: 0, reason: defectName };
              frictionMap[key].amount += rowSum;
            }
          }
        });
      }

      // Fallback summary from Grap sheet if daily sheet was empty
      if (!hasDailyFrictionDetails) {
        const grapSheet = wb.Sheets['Grap'];
        if (grapSheet) {
          const grapData = XLSX.utils.sheet_to_json(grapSheet, { header: 1, defval: '' });
          const dayColIdx = dayNum;
          if (grapData[1] && grapData[1][dayColIdx] !== undefined && grapData[1][dayColIdx] !== '') {
            frictionSummary = Number(grapData[1][dayColIdx]) || 0;
          }
          if (grapData[2] && grapData[2][dayColIdx] !== undefined && grapData[2][dayColIdx] > 0) {
            millingSummary = Number(grapData[2][dayColIdx]) || 0;
          }
        }
      }
    }

    // 2. Read Milling File
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

          if (rowSum > 0 && defectName && !defectName.toLowerCase().includes('defect') && !defectName.toLowerCase().includes('ห้ามลบ')) {
            const key = code || defectName;
            if (!millingMap[key]) millingMap[key] = { code: key, amount: 0, reason: defectName };
            millingMap[key].amount += rowSum;
          }
        });
      }
    }

    const millingTop = Object.values(millingMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
    const frictionTop = Object.values(frictionMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
    const beadTop = Object.values(beadMap).sort((a, b) => b.amount - a.amount).slice(0, 5);

    millingTop.forEach((item, index) => { item.isHigh = index < 2; });
    frictionTop.forEach((item, index) => { item.isHigh = index < 2; });
    beadTop.forEach((item, index) => { item.isHigh = index < 2; });

    return {
      date: dateStr,
      millingSummary: Number(millingSummary.toFixed(1)),
      frictionSummary: Number(frictionSummary.toFixed(1)),
      beadSummary: Number(beadSummary.toFixed(1)),
      millingTop,
      frictionTop,
      beadTop,
      dataDate: dateStr,
      hasData: millingSummary > 0 || frictionSummary > 0 || beadSummary > 0
    };

  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parseWasteData };
