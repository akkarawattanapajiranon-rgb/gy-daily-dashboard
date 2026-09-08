const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const LSP_PATHS = [
  'T:\\10.30 A.M. Production Meeting\\1 Safety\\LSP update 2026\\LSP Tracking.xlsx',
  'C:\\Users\\aa11909\\OneDrive - Goodyear\\LSP Tracking.xlsx',
  'C:\\Users\\aa11909\\OneDrive - Goodyear\\Documents\\LSP Tracking.xlsx',
  'C:\\Users\\aa11909\\OneDrive - Goodyear\\ENGINEERING BREAKDOWN\\LSP Tracking.xlsx',
  'C:\\Users\\aa11909\\Downloads\\LSP Tracking.xlsx',
  'C:\\Users\\aa11909\\Documents\\LSP Tracking.xlsx',
  'T:\\10.30 A.M. Production Meeting\\5 BTA\\LSP Tracking.xlsx',
  'T:\\10.30 A.M. Production Meeting\\0 TRAINNING\\LSP Tracking.xlsx'
];

function getLspFilePath() {
  for (const p of LSP_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseLspData() {
  try {
    const file = getLspFilePath();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    // Target legacy lists to ensure exact team grouping and order
    const staffLegacies = ['12750', '1461', '12921', '12106', '12108', '12769', '12364', '12367', '12357', '10661', '10082', '10062', '12445', '10553', '10558', '1308', '12001'];
    const leaderLegacies = ['3141', '1312', '1425', '1232', '1339', '1327', '9823', '1333', '1459', '3062', '12249', '12583'];

    let parsedStaff = [];
    let parsedLeaders = [];

    if (file && fs.existsSync(file)) {
      const wb = XLSX.readFile(file, { cellStubs: true });

      // 1. Parse Sheet A (Salary Staff)
      const sheetA = wb.SheetNames.find(s => s.startsWith('A') || s.toUpperCase().includes('SALARY')) || wb.SheetNames[1] || wb.SheetNames[0];
      if (wb.Sheets[sheetA]) {
        const rowsA = XLSX.utils.sheet_to_json(wb.Sheets[sheetA], { header: 1, defval: '' });
        rowsA.slice(3).forEach((r, idx) => {
          const legacy = String(r[1] || '').trim();
          const name = String(r[2] || '').trim();
          const title = String(r[3] || '').trim();
          const dept = String(r[4] || 'BCA').trim();
          const areaCode = String(r[5] || '').trim();

          if (!name || !legacy || name.toLowerCase().includes('total') || name.toLowerCase().includes('average')) return;
          if (legacy === '12925' || name.toLowerCase().includes('krittanan') || name.includes('กฤตนันท์')) return;

          const monthly = {};
          let totalAct = 0;
          months.forEach((m, mIdx) => {
            const actIdx = 8 + (mIdx * 2);
            let val = '';
            if (r[actIdx] !== undefined && r[actIdx] !== '') {
              val = Number(r[actIdx]);
              if (isNaN(val)) val = '';
            }
            monthly[m] = val;
            if (typeof val === 'number') totalAct += val;
          });

          parsedStaff.push({
            id: r[0] || idx + 1,
            legacy,
            name,
            title,
            dept,
            areaCode,
            isLspTarget: true,
            group: 'Staff',
            monthly,
            ytdPct: Math.min(100, Math.round((totalAct / 48) * 100))
          });
        });
      }

      // 2. Parse Sheet B (Hourly Leaders)
      const sheetB = wb.SheetNames.find(s => s.startsWith('B') || s.toUpperCase().includes('HOURLY')) || wb.SheetNames[2] || wb.SheetNames[1];
      if (wb.Sheets[sheetB]) {
        const rowsB = XLSX.utils.sheet_to_json(wb.Sheets[sheetB], { header: 1, defval: '' });
        rowsB.slice(3).forEach((r, idx) => {
          const legacy = String(r[1] || '').trim();
          const name = String(r[2] || '').trim();
          const title = String(r[3] || '').trim();
          const areaCode = String(r[4] || '').trim();

          if (!name || !legacy || name.toLowerCase().includes('total') || name.toLowerCase().includes('average')) return;

          const monthly = {};
          let totalAct = 0;
          months.forEach((m, mIdx) => {
            const actIdx = 7 + (mIdx * 2);
            let val = '';
            if (r[actIdx] !== undefined && r[actIdx] !== '') {
              val = Number(r[actIdx]);
              if (isNaN(val)) val = '';
            }
            monthly[m] = val;
            if (typeof val === 'number') totalAct += val;
          });

          parsedLeaders.push({
            id: r[0] || idx + 1,
            legacy,
            name,
            title,
            dept: 'FLM',
            areaCode,
            isLspTarget: true,
            group: 'Leader',
            monthly,
            ytdPct: Math.min(100, Math.round((totalAct / 48) * 100))
          });
        });
      }
    }

    // Filter staff and leaders matching target lists if present
    const finalStaff = parsedStaff.filter(w => staffLegacies.includes(w.legacy) || w.dept.toUpperCase().startsWith('BCA'));
    const finalLeaders = parsedLeaders.filter(w => leaderLegacies.includes(w.legacy));

    const staffResult = finalStaff.length > 0 ? finalStaff : parsedStaff;
    const leaderResult = finalLeaders.length > 0 ? finalLeaders : parsedLeaders;

    const totalWorkers = staffResult.length;
    const avgYtd = Math.round(staffResult.reduce((acc, w) => acc + w.ytdPct, 0) / (totalWorkers || 1));
    const onTargetCount = staffResult.filter(w => w.ytdPct >= 65).length;
    const belowTargetCount = totalWorkers - onTargetCount;

    let lastModified = null;
    let lastModifiedFormatted = null;
    if (file && fs.existsSync(file)) {
      try {
        const stats = fs.statSync(file);
        lastModified = stats.mtime.toISOString();
        const d = new Date(stats.mtime);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        lastModifiedFormatted = `${dd}/${mm}/${yyyy} ${hh}:${mi} น.`;
      } catch (err) {}
    }

    return {
      file: file ? path.basename(file) : 'LSP Tracking.xlsx',
      lastModified,
      lastModifiedFormatted,
      year: '2026',
      totalWorkers,
      avgYtd,
      onTargetCount,
      belowTargetCount,
      staffWorkers: staffResult,
      leaderWorkers: leaderResult,
      workers: staffResult,
      hasData: true
    };
  } catch (e) {
    return { error: e.message, hasData: false };
  }
}

module.exports = { parseLspData };
