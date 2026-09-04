const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const WORKAWAY_DIR = "T:\\10.30 A.M. Production Meeting\\1) Disposition (Non-moving)";

function getWorkawayFile(yearStr) {
  if (!fs.existsSync(WORKAWAY_DIR)) return null;
  const files = fs.readdirSync(WORKAWAY_DIR);
  
  // Prefer 'Slow Moving Work away 2026.xlsx' or matching year
  const match = files.find(f => f.toLowerCase().includes('slow moving work away') && f.includes(yearStr) && f.endsWith('.xlsx') && !f.startsWith('~$'));
  if (match) return path.join(WORKAWAY_DIR, match);

  const fallback = files.find(f => f.toLowerCase().includes('slow moving work away') && f.endsWith('.xlsx') && !f.startsWith('~$'));
  return fallback ? path.join(WORKAWAY_DIR, fallback) : null;
}

function getWorkawayTop10() {
  try {
    const file = path.join(WORKAWAY_DIR, 'Work awayTop 5 อันดับ.xlsx');
    if (!fs.existsSync(file)) return [];

    const wb = XLSX.readFile(file);
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return [];

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const list = [];
    let grandTotal = 0;

    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      const code = String(r[0]).trim();
      const qty = Number(r[1]) || 0;
      if (code && code.toUpperCase() !== 'SUM' && qty > 0) {
        list.push({ code, qty });
        grandTotal += qty;
      }
    }

    list.sort((a, b) => b.qty - a.qty);
    return list.slice(0, 10).map((item, idx) => ({
      rank: idx + 1,
      code: item.code,
      qty: item.qty,
      qtyMt: Number((item.qty / 1000).toFixed(2)),
      percentage: grandTotal > 0 ? Number(((item.qty / grandTotal) * 100).toFixed(1)) : 0
    }));
  } catch (e) {
    console.error('Error parsing Workaway Top 10:', e.message);
    return [];
  }
}

function parseWorkawayData(dateStr) {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const monthNum = parseInt(monthStr, 10);
    const dayNum = parseInt(dayStr, 10);

    const file = getWorkawayFile(yearStr);
    if (!file || !fs.existsSync(file)) {
      return { error: `Workaway Inventory file not found for ${yearStr}` };
    }

    const wb = XLSX.readFile(file);
    const monthNamesUpper = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
    const targetMonthName = monthNamesUpper[monthNum - 1];

    // Find sheet matching month name
    const sheetName = wb.SheetNames.find(s => s.toUpperCase().includes(targetMonthName)) || wb.SheetNames[wb.SheetNames.length - 1];
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      return { error: `Sheet ${sheetName} not found in ${path.basename(file)}` };
    }

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (data.length < 16) {
      return { error: `Insufficient data rows in sheet ${sheetName}` };
    }

    const headerRow = data[0];
    const targetRow = data[1];
    const minRow = data[2];
    const consumeRow = data[3];
    const newGenRow = data[4];
    const newGenBtaRow = data[5];
    const newGenWbrRow = data[6];
    const slowMovingRow = data[7];
    const dispositionWaRow = data[8];
    const pushoutRow = data[9];
    const oldMovingRow = data[10];
    const confirmScrapRow = data[11];
    const dispositionRow = data[12];
    const newDispRow = data[13];
    const consumeDispRow = data[14];
    const sumRow = data[15];

    const dailyTrend = [];
    let selectedDayIndex = -1;

    for (let col = 1; col < headerRow.length; col++) {
      const rawDateVal = headerRow[col];
      if (rawDateVal === '' || rawDateVal === undefined) continue;

      let dDay = null;
      let dMonth = monthNum;
      let label = `Col ${col}`;

      if (typeof rawDateVal === 'number') {
        try {
          const d = XLSX.SSF.parse_date_code(rawDateVal);
          if (d) {
            dDay = d.d;
            dMonth = d.m;
            label = `${d.d}/${d.m}`;
          }
        } catch (e) {}
      } else if (typeof rawDateVal === 'string') {
        const s = rawDateVal.trim();
        const m = s.match(/^(\d{1,2})[-/](\d{1,2})/);
        if (m) {
          dDay = parseInt(m[1], 10);
          dMonth = parseInt(m[2], 10);
          label = `${dDay}/${dMonth}`;
        } else {
          const parsed = parseInt(s, 10);
          if (!isNaN(parsed) && parsed > 0 && parsed <= 31) {
            dDay = parsed;
            label = `${dDay}/${monthNum}`;
          }
        }
      }

      const sumVal = Number(sumRow[col]);
      const targetVal = Number(targetRow[col]) || 35056;
      const minVal = Number(minRow[col]) || 20000;
      const consumeVal = Number(consumeRow[col]) || 0;
      const newGenVal = Number(newGenRow[col]) || 0;
      const slowMovingVal = Number(slowMovingRow[col]) || 0;
      const dispositionVal = Number(dispositionRow[col]) || 0;

      // Check if this column has actual data recorded
      const hasColumnData = !isNaN(sumVal) && sumVal > 0;

      if (dDay !== null) {
        if (dDay === dayNum) {
          selectedDayIndex = dailyTrend.length;
        }

        dailyTrend.push({
          day: dDay,
          month: dMonth,
          dateLabel: label,
          target: targetVal,
          minTarget: minVal,
          sum: !isNaN(sumVal) ? Number(sumVal.toFixed(1)) : 0,
          consume: Number(consumeVal.toFixed(1)),
          newGenerate: Number(newGenVal.toFixed(1)),
          newGenerateBTA: Number(Number(newGenBtaRow[col] || 0).toFixed(1)),
          newGenerateWBR: Number(Number(newGenWbrRow[col] || 0).toFixed(1)),
          slowMoving: Number(slowMovingVal.toFixed(1)),
          disposition: Number(dispositionVal.toFixed(1)),
          hasData: hasColumnData
        });
      }
    }

    // Filter daily trend up to the selected date (e.g. if selected date is 3/9, show up to 3/9)
    const filteredTrend = dailyTrend.filter(d => d.month < monthNum || (d.month === monthNum && d.day <= dayNum));

    // Pick active day data (exact selected day if found, otherwise activeItem)
    let activeItem = null;
    if (selectedDayIndex >= 0) {
      activeItem = dailyTrend[selectedDayIndex];
    } else {
      const itemsWithData = filteredTrend.filter(item => item.hasData);
      if (itemsWithData.length > 0) {
        activeItem = itemsWithData[itemsWithData.length - 1];
      } else if (filteredTrend.length > 0) {
        activeItem = filteredTrend[0];
      }
    }

    const top10 = getWorkawayTop10();

    return {
      date: dateStr,
      sheet: sheetName,
      file: path.basename(file),
      hasData: activeItem ? activeItem.hasData : false,
      summary: activeItem ? {
        activeDate: activeItem.dateLabel,
        sum: activeItem.sum,
        target: activeItem.target,
        minTarget: activeItem.minTarget,
        consume: activeItem.consume,
        newGenerate: activeItem.newGenerate,
        slowMoving: activeItem.slowMoving,
        disposition: activeItem.disposition,
        hasData: activeItem.hasData
      } : null,
      dailyTrend: filteredTrend,
      top10
    };

  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parseWorkawayData };
