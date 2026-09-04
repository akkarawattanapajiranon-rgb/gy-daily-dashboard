const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DIR_2026 = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026';
const DIR_OLD = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report';

function parseWasteUnified(dateStr) {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const monthNum = parseInt(monthStr, 10);
  const dayNum = parseInt(dayStr, 10);

  let frictionSummary = 0;
  let millingSummary = 0;
  let beadSummary = 0;

  const frictionMap = {};
  const millingMap = {};
  const beadMap = {};

  let hasData = false;

  // 1. Try 2026 Directory: 1Miling WASTE_2019/Milling WASTE_2026
  if (fs.existsSync(DIR_2026)) {
    const files = fs.readdirSync(DIR_2026);
    const mFileName = files.find(f => {
      if (f.startsWith('~$')) return false;
      const l = f.toLowerCase();
      return l.includes(`${monthNum}-`) || l.includes(`_${monthNum} `) || l.includes(`${monthNum}.`);
    });

    if (mFileName) {
      const wbM = XLSX.readFile(path.join(DIR_2026, mFileName));

      // 1.1 Read 'By day' sheet if present
      const byDaySheet = wbM.Sheets['By day'];
      if (byDaySheet) {
        const rows = XLSX.utils.sheet_to_json(byDaySheet, { header: 1, defval: '' });
        rows.forEach((r, rIdx) => {
          if (rIdx < 2) return;
          // By day format: Dept / Area / Shift / Weight / Defect Code / Remark
          const dept = String(r[0] || r[1] || '').trim();
          const shift = r[2];
          const weight = parseFloat(r[3] || r[5]);
          const defectCode = String(r[4] || r[6] || '').trim();
          const remark = String(r[5] || r[7] || '').trim();

          // Match day from sheet if column exists or row represents day
          let category = 'Friction';
          const lowerDept = dept.toLowerCase();
          const lowerRemark = remark.toLowerCase();

          if (lowerDept.includes('a') || lowerDept.includes('bead') || lowerRemark.includes('bead')) {
            category = 'Bead';
          } else if (lowerDept.includes('milling') || lowerDept.includes('compound') || lowerRemark.includes('lumpy') || lowerRemark.includes('clean')) {
            category = 'Milling';
          }

          if (!isNaN(weight) && weight > 0) {
            hasData = true;
            const key = defectCode || remark || 'Waste';
            if (category === 'Bead') {
              beadSummary += weight;
              if (!beadMap[key]) beadMap[key] = { code: key, amount: 0, reason: remark || defectCode };
              beadMap[key].amount += weight;
            } else if (category === 'Milling') {
              millingSummary += weight;
              if (!millingMap[key]) millingMap[key] = { code: key, amount: 0, reason: remark || defectCode };
              millingMap[key].amount += weight;
            } else {
              frictionSummary += weight;
              if (!frictionMap[key]) frictionMap[key] = { code: key, amount: 0, reason: remark || defectCode };
              frictionMap[key].amount += weight;
            }
          }
        });
      }

      // 1.2 Read 'MillingWaste' sheet for raw incident records
      const mWSheet = wbM.Sheets['MillingWaste'] || wbM.Sheets['MillingWaste(M)'];
      if (mWSheet) {
        const rows = XLSX.utils.sheet_to_json(mWSheet, { header: 1, defval: '' });
        rows.forEach((r, rIdx) => {
          if (rIdx < 2) return;
          const recDay = parseInt(r[1], 10);
          if (recDay === dayNum) {
            const matCode = String(r[2] || '').trim();
            const weight = parseFloat(r[5]) || 0;
            const cause = String(r[6] || r[7] || '').trim();
            const mcType = String(r[10] || '').trim();

            if (weight > 0) {
              hasData = true;
              const key = matCode || cause || 'MillingWaste';
              let category = 'Milling';
              const lowerMc = mcType.toLowerCase();
              if (lowerMc.includes('3 roll') || lowerMc.includes('friction')) {
                category = 'Friction';
              } else if (lowerMc.includes('bead')) {
                category = 'Bead';
              }

              if (category === 'Milling') {
                millingSummary += weight;
                if (!millingMap[key]) millingMap[key] = { code: key, amount: 0, reason: cause || matCode };
                millingMap[key].amount += weight;
              } else if (category === 'Friction') {
                frictionSummary += weight;
                if (!frictionMap[key]) frictionMap[key] = { code: key, amount: 0, reason: cause || matCode };
                frictionMap[key].amount += weight;
              } else {
                beadSummary += weight;
                if (!beadMap[key]) beadMap[key] = { code: key, amount: 0, reason: cause || matCode };
                beadMap[key].amount += weight;
              }
            }
          }
        });
      }
    }
  }

  // 2. Fallback to Old Directory: Waste Report (or combine if needed)
  if (!hasData && fs.existsSync(DIR_OLD)) {
    const monthDirs = fs.readdirSync(DIR_OLD);
    const monthFolder = monthDirs.find(d => d.toLowerCase().includes(`${monthNum}.`) || d.toLowerCase().includes(`${monthStr}.`));

    if (monthFolder) {
      const monthFolderPath = path.join(DIR_OLD, monthFolder);
      const monthFiles = fs.readdirSync(monthFolderPath);
      const fFileName = monthFiles.find(f => f.toLowerCase().includes('friction') && !f.startsWith('~$'));
      const mFileName = monthFiles.find(f => f.toLowerCase().includes('milling') && !f.startsWith('~$'));

      [fFileName, mFileName].forEach((fileName, isMillingFile) => {
        if (!fileName) return;
        const wb = XLSX.readFile(path.join(monthFolderPath, fileName));
        const dailySheet = wb.Sheets[String(dayNum)];
        if (dailySheet) {
          const rows = XLSX.utils.sheet_to_json(dailySheet, { header: 1, defval: '' });
          let currentDept = '';
          let currentDesc = '';

          rows.forEach((r, rIdx) => {
            if (rIdx < 2) return;
            const dept = String(r[0] || '').trim();
            const desc = String(r[3] || r[2] || '').trim();
            const code = String(r[4] || r[3] || r[6] || '').trim();
            const defectName = String(r[5] || r[1] || r[3] || '').trim();

            if (dept) currentDept = dept;
            if (desc) currentDesc = desc;

            const lowerDept = currentDept.toLowerCase();
            const lowerDesc = currentDesc.toLowerCase();

            let category = isMillingFile ? 'Milling' : 'Friction';
            if (lowerDept.includes('bead') || lowerDesc === 'a' || lowerDesc.includes('bead')) {
              category = 'Bead';
            } else if (lowerDesc.includes('compound') || lowerDesc.includes('milling') || lowerDept.includes('apex') || lowerDept.includes('hex bead')) {
              category = 'Milling';
            } else if (lowerDept.includes('3 roll') || lowerDesc.includes('friction')) {
              category = 'Friction';
            }

            let rowSum = 0;
            const startCol = 6;
            const endCol = isMillingFile ? 9 : r.length;
            for (let c = startCol; c <= endCol; c++) {
              const v = parseFloat(r[c]);
              if (!isNaN(v) && v > 0) rowSum += v;
            }

            if (rowSum > 0 && defectName && !defectName.toLowerCase().includes('defect') && !defectName.toLowerCase().includes('ห้ามลบ')) {
              hasData = true;
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
      });
    }
  }

  const millingTop = Object.values(millingMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
  const frictionTop = Object.values(frictionMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
  const beadTop = Object.values(beadMap).sort((a, b) => b.amount - a.amount).slice(0, 5);

  millingTop.forEach((item, index) => { item.isHigh = index < 2; });
  frictionTop.forEach((item, index) => { item.isHigh = index < 2; });
  beadTop.forEach((item, index) => { item.isHigh = index < 2; });

  const totalVal = millingSummary + frictionSummary + beadSummary;

  return {
    date: dateStr,
    millingSummary: Number(millingSummary.toFixed(1)),
    frictionSummary: Number(frictionSummary.toFixed(1)),
    beadSummary: Number(beadSummary.toFixed(1)),
    millingTop,
    frictionTop,
    beadTop,
    dataDate: dateStr,
    hasData: totalVal > 0
  };
}

console.log('Testing 2026-05-03:', parseWasteUnified('2026-05-03'));
console.log('Testing 2026-09-03:', parseWasteUnified('2026-09-03'));
