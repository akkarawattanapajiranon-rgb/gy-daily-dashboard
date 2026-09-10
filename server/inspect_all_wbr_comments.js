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

console.log('--- Inspecting Sheet Comments & Delay Mins ---');
wb.SheetNames.slice(0, 10).forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  if (!ws) return;
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const shifts = [
    { name: 'กะ 1', delayCol: 15, commentCols: [8, 9, 10, 11] },
    { name: 'กะ 2', delayCol: 29, commentCols: [22, 23, 24, 25] },
    { name: 'กะ 3', delayCol: 43, commentCols: [36, 37, 38, 39] }
  ];

  data.forEach((row, rowIdx) => {
    const mc = String(row[0] || row[1] || '').trim();
    if (!mc || mc.toUpperCase().includes('TOTAL') || mc.toUpperCase().includes('PERFORMANCE') || mc.toUpperCase().includes('GOAL') || mc.toUpperCase().includes('2-HOURS') || mc.toUpperCase().includes('DATE:')) {
      return;
    }

    shifts.forEach(s => {
      const rawDelay = row[s.delayCol];
      const delayMin = (typeof rawDelay === 'number' && !isNaN(rawDelay)) ? rawDelay : (parseInt(rawDelay, 10) || 0);

      const comments = [];
      s.commentCols.forEach((colIdx) => {
        const colLetter = XLSX.utils.encode_col(colIdx);
        const cellAddr = `${colLetter}${rowIdx + 1}`;
        const cell = ws[cellAddr];
        if (cell && cell.c && cell.c.length > 0) {
          const rawComment = cell.c.map(x => (x.t || '').trim()).filter(Boolean).join(' | ');
          const cleaned = cleanCellCommentText(rawComment);
          if (cleaned) comments.push(cleaned);
        }
      });

      if (delayMin > 0 || comments.length > 0) {
        console.log(`[Sheet ${sheetName}][${mc}][${s.name}] DelayMin=${delayMin} | Comments:`, comments);
      }
    });
  });
});
