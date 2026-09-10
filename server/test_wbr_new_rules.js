const XLSX = require('xlsx');
const p = 'N:\\New 2 Hours Reporting\\Production record 2026\\09 Sep 2026ไฟล์เดียวรวมทุกวัน\\BTB_Radial Sep 2026.xls';
const wb = XLSX.readFile(p, { cellComments: true });

function cleanCellCommentText(commentStr) {
  if (!commentStr) return '';
  return String(commentStr)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/[^\u0E00-\u0E7F\w\s.,:;()\/><=+\-*#"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

console.log('=== Testing WBR Parser with New User Rules ===');

wb.SheetNames.slice(0, 10).forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  if (!ws) return;
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const shifts = [
    { name: 'กะ 1', delayCol: 15, commentCols: [8, 9, 10, 11], timeLabels: ['7.00-9.00', '9.00-11.00', '11.00-13.00', '13.00-15.00'] },
    { name: 'กะ 2', delayCol: 29, commentCols: [22, 23, 24, 25], timeLabels: ['15.00-17.00', '17.00-19.00', '19.00-21.00', '21.00-23.00'] },
    { name: 'กะ 3', delayCol: 43, commentCols: [36, 37, 38, 39], timeLabels: ['23.00-1.00', '1.00-3.00', '3.00-5.00', '5.00-7.00'] }
  ];

  const matched = [];

  data.forEach((row, rowIdx) => {
    const mc = String(row[0] || row[1] || '').trim();
    if (!mc || mc.toUpperCase().includes('TOTAL') || mc.toUpperCase().includes('PERFORMANCE') || mc.toUpperCase().includes('GOAL') || mc.toUpperCase().includes('2-HOURS') || mc.toUpperCase().includes('DATE:')) {
      return;
    }

    shifts.forEach(s => {
      const rawDelay = row[s.delayCol];
      const delayMin = (typeof rawDelay === 'number' && !isNaN(rawDelay)) ? rawDelay : (parseInt(rawDelay, 10) || 0);

      // Rule 1: Only keep if delayMin > 0
      if (delayMin <= 0) return;

      // Rule 2: Check comments for "d/l" or "delay"
      const matchingComments = [];
      s.commentCols.forEach((colIdx, slotIdx) => {
        const colLetter = XLSX.utils.encode_col(colIdx);
        const cellAddr = `${colLetter}${rowIdx + 1}`;
        const cell = ws[cellAddr];
        if (cell && cell.c && cell.c.length > 0) {
          const rawComment = cell.c.map(x => (x.t || '').trim()).filter(Boolean).join(' | ');
          const cleaned = cleanCellCommentText(rawComment);
          if (cleaned) {
            const lower = cleaned.toLowerCase();
            if (lower.includes('d/l') || lower.includes('delay')) {
              matchingComments.push(`[${s.timeLabels[slotIdx]}] ${cleaned}`);
            }
          }
        }
      });

      const detail = matchingComments.length > 0 ? matchingComments.join(' ; ') : null;

      matched.push({
        sheet: sheetName,
        machine: mc,
        shift: s.name,
        delayMin,
        detail
      });
    });
  });

  if (matched.length > 0) {
    console.log(`\nSheet '${sheetName}' Total Delays found: ${matched.length}`);
    console.log(matched);
  }
});
