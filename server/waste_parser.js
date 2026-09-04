const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { matchesMonth } = require('./month_utils');

const DIRS_TO_SEARCH = [
  'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026',
  'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report'
];

function parseWasteData(dateStr) {
  try {
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

    const DEFECT_NAME_MAP = {
      '1': 'CALENDER DEFECT',
      '6': '3 ROLLS / ROLL ENDS',
      '10': 'CALENDER STOP',
      '11': 'COAT OFF / BEAD COAT',
      '24': 'BEAD DEFECT',
      '30': 'FISCHER STOP / DEFECT',
      '34': 'WIRE BEAD DEFECT',
      '39': 'CALENDER STOP / CORD DEFECT',
      '44': '3 ROLLS / ROLL ENDS',
      '50': 'STOCK OUT',
      '51': 'COAT OFF',
      '52': 'WRINKLE / CORD DEFECT',
      '56': 'FISCHER DEFECT'
    };

    // Helper to add defect items into summary and top maps
    const addRecord = (category, weight, code, reason) => {
      if (isNaN(weight) || weight <= 0) return;
      hasData = true;
      const rawCode = String(code || reason || 'Waste').trim();
      const mappedReason = DEFECT_NAME_MAP[rawCode] || (reason && reason !== rawCode ? reason : (DEFECT_NAME_MAP[rawCode] || rawCode));
      const key = rawCode;
      const desc = mappedReason;

      if (category === 'Bead') {
        beadSummary += weight;
        if (!beadMap[key]) beadMap[key] = { code: key, amount: 0, reason: desc };
        beadMap[key].amount += weight;
      } else if (category === 'Milling') {
        millingSummary += weight;
        if (!millingMap[key]) millingMap[key] = { code: key, amount: 0, reason: desc };
        millingMap[key].amount += weight;
      } else {
        frictionSummary += weight;
        if (!frictionMap[key]) frictionMap[key] = { code: key, amount: 0, reason: desc };
        frictionMap[key].amount += weight;
      }
    };

    // 1. Search in 2026 Directory: 1Miling WASTE_2019\Milling WASTE_2026
    const dir2026 = DIRS_TO_SEARCH[0];
    if (fs.existsSync(dir2026)) {
      const files = fs.readdirSync(dir2026);
      const mFile = files.find(f => {
        if (f.startsWith('~$')) return false;
        const l = f.toLowerCase();
        return (l.includes(`${monthNum}-`) || l.includes(`_${monthNum} `) || matchesMonth(l, monthNum)) && l.includes('milling');
      });

      if (mFile) {
        const wb = XLSX.readFile(path.join(dir2026, mFile));

        // 1.1 Read detailed sheets: N, P, V, A, G, RT27
        const detailSheets = ['N', 'P', 'V', 'A', 'G', 'RT27'];
        detailSheets.forEach(sName => {
          const sheet = wb.Sheets[sName];
          if (!sheet) return;
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          rows.forEach((r, rIdx) => {
            if (rIdx < 3) return;
            const recDay = parseInt(r[1], 10);
            if (recDay === dayNum) {
              const areaCode = String(r[3] || r[2] || '').trim();
              const weight = parseFloat(r[5]) || 0;
              const defectCode = String(r[6] || '').trim();
              const remark = String(r[7] || '').trim();

              if (weight > 0) {
                let category = 'Friction';
                if (sName === 'A' || sName === 'G' || areaCode === '130' || areaCode === '42' || remark.toLowerCase().includes('bead')) {
                  category = 'Bead';
                } else if (sName === 'RT27' || areaCode === '135' || areaCode === '136' || areaCode === '137' || areaCode === '139' || areaCode === '140' || remark.toLowerCase().includes('milling')) {
                  category = 'Milling';
                }
                addRecord(category, weight, defectCode, remark);
              }
            }
          });
        });

        // 1.2 Read MillingWaste / MillingWaste(M) sheet
        const mWSheet = wb.Sheets['MillingWaste'] || wb.Sheets['MillingWaste(M)'];
        if (mWSheet) {
          const rows = XLSX.utils.sheet_to_json(mWSheet, { header: 1, defval: '' });
          rows.forEach((r, rIdx) => {
            if (rIdx < 2) return;
            const recDay = parseInt(r[1], 10);
            if (recDay === dayNum) {
              const matCode = String(r[2] || '').trim();
              const areaCode = String(r[3] || '').trim();
              const weight = parseFloat(r[5]) || 0;
              const cause = String(r[7] || r[6] || '').trim();
              const mcType = String(r[10] || '').trim();

              if (weight > 0) {
                let category = 'Milling';
                const lowerCombine = (mcType + ' ' + cause).toLowerCase();
                if (areaCode === '133' || areaCode === '128' || areaCode === '129' || lowerCombine.includes('3 roll') || lowerCombine.includes('friction') || lowerCombine.includes('calender') || lowerCombine.includes('fischer')) {
                  category = 'Friction';
                } else if (areaCode === '130' || areaCode === '42' || lowerCombine.includes('bead')) {
                  category = 'Bead';
                }
                addRecord(category, weight, matCode, cause || mcType);
              }
            }
          });
        }
      }
    }

    // 2. Search in Waste Report (Old structure / fallback)
    const dirOld = DIRS_TO_SEARCH[1];
    if (!hasData && fs.existsSync(dirOld)) {
      const monthDirs = fs.readdirSync(dirOld);
      const monthFolder = monthDirs.find(d => {
        const l = d.toLowerCase();
        return matchesMonth(l, monthNum) || l.includes(`${monthNum}.`) || l.includes(`${monthStr}.`);
      });

      if (monthFolder) {
        const monthFolderPath = path.join(dirOld, monthFolder);
        const monthFiles = fs.readdirSync(monthFolderPath);
        const frictionFileName = monthFiles.find(f => f.toLowerCase().includes('friction') && !f.startsWith('~$'));
        const millingFileName = monthFiles.find(f => f.toLowerCase().includes('milling') && !f.startsWith('~$'));

        [frictionFileName, millingFileName].forEach((fileName, fileIdx) => {
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

              let rowSum = 0;
              const startCol = 6;
              const endCol = fileIdx === 1 ? 9 : r.length;
              for (let c = startCol; c <= endCol; c++) {
                const v = parseFloat(r[c]);
                if (!isNaN(v) && v > 0) rowSum += v;
              }

              if (rowSum > 0 && defectName && !defectName.toLowerCase().includes('defect') && !defectName.toLowerCase().includes('ห้ามลบ')) {
                const lowerDept = currentDept.toLowerCase();
                const lowerDesc = currentDesc.toLowerCase();

                let category = fileIdx === 1 ? 'Milling' : 'Friction';
                if (lowerDept.includes('bead') || lowerDesc === 'a' || lowerDesc.includes('bead')) {
                  category = 'Bead';
                } else if (lowerDesc.includes('compound') || lowerDesc.includes('milling') || lowerDept.includes('apex') || lowerDept.includes('hex bead')) {
                  category = 'Milling';
                } else if (lowerDept.includes('3 roll') || lowerDesc.includes('friction')) {
                  category = 'Friction';
                }

                addRecord(category, rowSum, code, defectName);
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
      hasData: hasData && totalVal > 0
    };

  } catch (e) {
    return {
      date: dateStr,
      millingSummary: 0,
      frictionSummary: 0,
      beadSummary: 0,
      millingTop: [],
      frictionTop: [],
      beadTop: [],
      dataDate: dateStr,
      hasData: false,
      error: e.message
    };
  }
}

module.exports = { parseWasteData };
