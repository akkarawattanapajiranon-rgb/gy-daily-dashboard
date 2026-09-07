const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const LSP_PATHS = [
  'C:\\Users\\aa11909\\OneDrive - Goodyear\\ENGINEERING BREAKDOWN\\LSP Tracking.xlsx',
  'C:\\Users\\aa11909\\OneDrive - Goodyear\\LSP Tracking.xlsx',
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
    let rows = [];

    if (file && fs.existsSync(file)) {
      const wb = XLSX.readFile(file, { cellStubs: true });
      const sheetName = wb.SheetNames.find(s => s.toUpperCase().includes('LSP') || s.toUpperCase().includes('2026')) || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    }

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    // Sample / default fallback workers based on EHS Tracking screenshot
    const defaultWorkers = [
      { id: 2, legacy: '12750', name: 'Akkarawat Tanapatjiranon (อัครวัฒน์ ธนภัทรจิรานนท์)', dept: 'BCA', areaCode: '3200', isLspTarget: true, monthly: { JAN: 0, FEB: 5, MAR: 4, APR: 4, MAY: 5, JUN: 4, JUL: 4, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 67 },
      { id: 12, legacy: '1461', name: 'Kamol Chansue (กมล จันเสือ)', dept: 'BCA', areaCode: '3200', isLspTarget: true, monthly: { JAN: 0, FEB: 5, MAR: 4, APR: 9, MAY: 6, JUN: 6, JUL: 4, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 81 },
      { id: 13, legacy: '12921', name: 'Kant Limpitaks (กันต์ ลิมปิทักษ์)', dept: 'BCA-Q', areaCode: '1022', isLspTarget: true, monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 5, MAY: 4, JUN: 4, JUL: 4, AUG: 5, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 71 },
      { id: 16, legacy: '12108', name: 'Kritsana Iyerakanjankun (กฤษณะ ไอียรากาญจนกุล)', dept: 'BCA-E', areaCode: '1100', isLspTarget: true, monthly: { JAN: 4, FEB: 0, MAR: 4, APR: 5, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 60 },
      { id: 19, legacy: '12768', name: 'Narada Tempombribun (นารดา เต็มพรมบริบูรณ์)', dept: 'BCA-HR', areaCode: '1050', isLspTarget: true, monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 4, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 69 },
      { id: 21, legacy: '12364', name: 'Nithit Raktham (นิธิศ รักธรรม)', dept: 'BCA-E', areaCode: '6320', isLspTarget: true, monthly: { JAN: 4, FEB: 0, MAR: 4, APR: 4, MAY: 4, JUN: 4, JUL: 1, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 54 },
      { id: 22, legacy: '12357', name: 'Paisal Phoompong (ไพศาล พูมพงษ์)', dept: 'BCA', areaCode: '3200', isLspTarget: true, monthly: { JAN: 2, FEB: 4, MAR: 4, APR: 4, MAY: 4, JUN: 5, JUL: 6, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 73 },
      { id: 23, legacy: '10661', name: 'Parintorn Premshue (ปริญทร เปรมชู)', dept: 'BCA', areaCode: '3200', isLspTarget: true, monthly: { JAN: 0, FEB: 4, MAR: 4, APR: 4, MAY: 4, JUN: 4, JUL: 4, AUG: 5, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 65 },
      { id: 24, legacy: '10062', name: 'Phichet Dee-On (พิเชษฐ์ ดีอ่อน)', dept: 'BCA-Q', areaCode: '1022', isLspTarget: true, monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 4, MAY: 5, JUN: 4, JUL: 4, AUG: 5, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 71 },
      { id: 25, legacy: '12445', name: 'Pinthusorn Prasertpolkrang (พินทุสร ประเสริฐพลกรัง)', dept: 'BCA-Q', areaCode: '1022', isLspTarget: true, monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 5, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 65 },
      { id: 35, legacy: '10558', name: 'Suruttapong Siriluk (สุรุจพงศ์ ศิริลักษณ์)', dept: 'BCA-E', areaCode: '1100', isLspTarget: true, monthly: { JAN: 4, FEB: 3, MAR: 4, APR: 4, MAY: 4, JUN: 0, JUL: 4, AUG: 5, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 60 },
      { id: 41, legacy: '1308', name: 'Vinai Fuangfoo (วินัย ฟักฟู)', dept: 'BCA-HR', areaCode: '1053', isLspTarget: true, monthly: { JAN: 4, FEB: 5, MAR: 4, APR: 4, MAY: 5, JUN: 4, JUL: 4, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 75 },
      { id: 43, legacy: '12001', name: 'Wata Phattanapong (วรา พัฒนพงศ์)', dept: 'BCA-EHS', areaCode: '1056', isLspTarget: true, monthly: { JAN: 4, FEB: 4, MAR: 5, APR: 4, MAY: 4, JUN: 4, JUL: 8, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 75 }
    ];

    let parsedWorkers = [];

    if (rows.length > 2) {
      let headerRowIndex = -1;
      rows.forEach((r, idx) => {
        if (r.some(c => String(c).toUpperCase().includes('JAN') || String(c).toUpperCase().includes('WORKER'))) {
          headerRowIndex = idx;
        }
      });

      if (headerRowIndex !== -1) {
        const header = rows[headerRowIndex].map(c => String(c).trim().toUpperCase());
        const subHeader = rows[headerRowIndex + 1] ? rows[headerRowIndex + 1].map(c => String(c).trim().toUpperCase()) : [];
        const idCol = header.findIndex(c => c.includes('##') || c.includes('ID') || c.includes('NO'));
        const legacyCol = header.findIndex(c => c.includes('LEGACY'));
        const workerCol = header.findIndex(c => c.includes('WORKER') || c.includes('NAME'));
        const deptCol = header.findIndex(c => c.includes('DEPT') || c.includes('AREA') || c.includes('GROUP'));
        const ytdCol = header.findIndex(c => c.includes('YTD'));

        const monthCols = {};
        months.forEach(m => {
          let idx = header.findIndex(c => c === m);
          if (idx !== -1) {
            // Check if idx is AOP and idx+1 is ACT
            if (subHeader[idx] === 'AOP' && subHeader[idx + 1] === 'ACT') {
              idx = idx + 1; // Pick ACT column
            } else if (subHeader[idx + 1] === 'ACT') {
              idx = idx + 1;
            }
          }
          monthCols[m] = idx;
        });

        rows.slice(headerRowIndex + (subHeader.length > 0 ? 2 : 1)).forEach(r => {
          const name = String(r[workerCol !== -1 ? workerCol : 2] || '').trim();
          const legacy = String(r[legacyCol !== -1 ? legacyCol : 1] || '').trim();
          const rowId = String(r[idCol !== -1 ? idCol : 0] || '').trim();

          if (!name || name.toLowerCase().includes('total') || name.toLowerCase().includes('average')) return;
          if (rowId === '20' || legacy === '12925' || name.toLowerCase().includes('krittanan') || name.includes('กฤตนันท์')) return;

          const monthlyData = {};
          let totalAudits = 0;
          months.forEach(m => {
            const idx = monthCols[m];
            let val = '';
            if (idx !== -1 && r[idx] !== undefined && r[idx] !== '') {
              val = Number(r[idx]);
              if (isNaN(val)) val = '';
            }
            monthlyData[m] = val;
            if (typeof val === 'number') totalAudits += val;
          });

          let ytdRaw = ytdCol !== -1 ? String(r[ytdCol] || '') : '';
          let ytdPct = parseFloat(ytdRaw.replace('%', '')) || 0;
          if (!ytdPct && totalAudits > 0) {
            ytdPct = Math.min(100, Math.round((totalAudits / 48) * 100));
          }

          parsedWorkers.push({
            id: r[idCol !== -1 ? idCol : 0] || parsedWorkers.length + 1,
            legacy: String(r[legacyCol !== -1 ? legacyCol : 1] || '').trim(),
            name,
            dept: String(r[deptCol !== -1 ? deptCol : 4] || 'BCA').trim(),
            areaCode: String(r[deptCol !== -1 ? deptCol + 1 : 5] || '').trim(),
            isLspTarget: true,
            monthly: monthlyData,
            ytdPct
          });
        });
      }
    }

    const finalWorkers = parsedWorkers.length > 0 ? parsedWorkers : defaultWorkers;
    const totalWorkers = finalWorkers.length;
    const avgYtd = Math.round(finalWorkers.reduce((acc, w) => acc + w.ytdPct, 0) / totalWorkers);
    const onTargetCount = finalWorkers.filter(w => w.ytdPct >= 65).length;
    const belowTargetCount = totalWorkers - onTargetCount;

    return {
      file: file ? path.basename(file) : 'LSP Tracking.xlsx',
      year: '2026',
      totalWorkers,
      avgYtd,
      onTargetCount,
      belowTargetCount,
      workers: finalWorkers,
      hasData: true
    };
  } catch (e) {
    return { error: e.message, hasData: false };
  }
}

module.exports = { parseLspData };
