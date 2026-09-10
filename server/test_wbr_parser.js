const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const WBR_DIR = 'N:\\New 2 Hours Reporting\\Production record 2026';

const MONTH_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function getWbrFilePath(yearStr, monthNum) {
  if (!fs.existsSync(WBR_DIR)) return null;

  const monthShort = MONTH_SHORT[monthNum - 1];
  const monthPad = String(monthNum).padStart(2, '0');

  const subdirs = fs.readdirSync(WBR_DIR);
  const targetSubdir = subdirs.find(d => {
    const l = d.toLowerCase();
    return (l.startsWith(monthPad) || l.includes(monthShort)) && l.includes(yearStr);
  });

  const searchDir = targetSubdir ? path.join(WBR_DIR, targetSubdir) : WBR_DIR;
  if (!fs.existsSync(searchDir)) return null;

  const files = fs.readdirSync(searchDir).filter(f => (f.endsWith('.xls') || f.endsWith('.xlsx')) && !f.startsWith('~$'));
  const match = files.find(f => {
    const l = f.toLowerCase();
    return l.includes('btb_radial') || (l.includes('radial') && l.includes(monthShort));
  });

  return match ? path.join(searchDir, match) : null;
}

function cleanCellCommentText(commentStr) {
  if (!commentStr) return '';
  return String(commentStr)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/[^\u0E00-\u0E7F\w\s.,:;()\/><=+\-*#"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseWbrDelay(dateStr) {
  try {
    const [year, month, day] = dateStr.split('-');
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);

    const file = getWbrFilePath(year, monthNum);
    if (!file || !fs.existsSync(file)) {
      return { error: `WBR Radial report not found for ${dateStr}` };
    }

    const wb = XLSX.readFile(file, { cellComments: true });
    const sheetName = wb.SheetNames.find(s => s.trim() === String(dayNum) || s.trim() === String(dayNum).padStart(2, '0')) || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      return { error: `Sheet ${sheetName} not found in WBR report` };
    }

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Shift Column Maps (0-indexed):
    // Shift 1: Delay Col P (idx 15), Comment Cols I..L (idx 8..11)
    // Shift 2: Delay Col AD (idx 29), Comment Cols W..Z (idx 22..25)
    // Shift 3: Delay Col AR (idx 43), Comment Cols AK..AN (idx 36..39)

    const shifts = [
      { name: 'กะ 1', delayCol: 15, commentCols: [8, 9, 10, 11], timeLabels: ['7.00-9.00', '9.00-11.00', '11.00-13.00', '13.00-15.00'] },
      { name: 'กะ 2', delayCol: 29, commentCols: [22, 23, 24, 25], timeLabels: ['15.00-17.00', '17.00-19.00', '19.00-21.00', '21.00-23.00'] },
      { name: 'กะ 3', delayCol: 43, commentCols: [36, 37, 38, 39], timeLabels: ['23.00-1.00', '1.00-3.00', '3.00-5.00', '5.00-7.00'] }
    ];

    const items = [];

    data.forEach((row, rowIdx) => {
      const mc = String(row[0] || row[1] || '').trim();
      if (!mc || mc.toUpperCase().includes('TOTAL') || mc.toUpperCase().includes('PERFORMANCE') || mc.toUpperCase().includes('GOAL') || mc.toUpperCase().includes('2-HOURS') || mc.toUpperCase().includes('DATE:')) {
        return;
      }

      shifts.forEach(s => {
        const rawDelay = row[s.delayCol];
        const delayMin = (typeof rawDelay === 'number' && !isNaN(rawDelay)) ? rawDelay : (parseInt(rawDelay, 10) || 0);
        
        // Collect comments in this shift's 2-hour interval cells
        const comments = [];
        s.commentCols.forEach((colIdx, slotIdx) => {
          const colLetter = XLSX.utils.encode_col(colIdx);
          const cellAddr = `${colLetter}${rowIdx + 1}`;
          const cell = ws[cellAddr];
          if (cell && cell.c && cell.c.length > 0) {
            const rawComment = cell.c.map(x => (x.t || '').trim()).filter(Boolean).join(' | ');
            const cleaned = cleanCellCommentText(rawComment);
            if (cleaned) {
              comments.push(`[${s.timeLabels[slotIdx]}] ${cleaned}`);
            }
          }
        });

        // Record item if delayMin > 0 OR comments exist
        if (delayMin > 0 || comments.length > 0) {
          const detail = comments.length > 0 ? comments.join(' ; ') : null;
          
          let category = 'Comp';
          if (detail) {
            const lower = detail.toLowerCase();
            if (lower.includes('tread') || lower.includes('sidewall') || lower.includes(' sw ') || lower.includes('extrusion')) {
              category = 'Extrusion';
            }
          }

          items.push({
            id: `r${rowIdx + 1}-${s.name}`,
            machine: mc,
            code: String(row[2] || '').trim(),
            shift: s.name,
            delayMin: delayMin,
            delayHours: parseFloat((delayMin / 60).toFixed(1)),
            detail: detail,
            category: category
          });
        }
      });
    });

    const shift1Min = items.filter(i => i.shift === 'กะ 1').reduce((a, b) => a + b.delayMin, 0);
    const shift2Min = items.filter(i => i.shift === 'กะ 2').reduce((a, b) => a + b.delayMin, 0);
    const shift3Min = items.filter(i => i.shift === 'กะ 3').reduce((a, b) => a + b.delayMin, 0);
    const totalDelayMin = shift1Min + shift2Min + shift3Min;

    return {
      _file: path.basename(file),
      _sheet: sheetName,
      _date: dateStr,
      totalDelayMin,
      totalDelayHours: parseFloat((totalDelayMin / 60).toFixed(1)),
      shift1Min,
      shift1Hours: parseFloat((shift1Min / 60).toFixed(1)),
      shift2Min,
      shift2Hours: parseFloat((shift2Min / 60).toFixed(1)),
      shift3Min,
      shift3Hours: parseFloat((shift3Min / 60).toFixed(1)),
      summary: {
        totalItems: items.length,
        itemsWithDetail: items.filter(i => i.detail !== null).length,
        itemsOnlyMin: items.filter(i => i.detail === null).length
      },
      items
    };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parseWbrDelay };

if (require.main === module) {
  console.log(JSON.stringify(parseWbrDelay('2026-09-03'), null, 2));
}
