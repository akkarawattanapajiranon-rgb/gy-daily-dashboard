const pptxgen = require('pptxgenjs');
const { parseLspData } = require('./lsp_parser');

async function generateLspPpt(team = 'Staff', month = 'SEP') {
  const data = parseLspData();
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';

  const isStaff = team.toLowerCase() === 'staff';
  const rawList = isStaff ? (data.staffWorkers || []) : (data.leaderWorkers || []);
  
  // Exclude inactive personnel
  const workers = isStaff ? rawList.filter(w =>
    w.legacy !== '12752' && w.legacy !== '5645' &&
    !(w.name && (
      w.name.toLowerCase().includes('amphai') || w.name.includes('อำไพ') ||
      w.name.toLowerCase().includes('itsawat') || w.name.includes('อิษวัต')
    ))
  ) : rawList;

  const targetMonth = month.toUpperCase();
  const getCount = (w) => {
    const val = w.monthly && w.monthly[targetMonth];
    if (val !== undefined && val !== '' && val !== null) {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const passList = workers.filter(w => getCount(w) >= 4).map((w, i) => ({
    orderNum: i + 1,
    name: w.name || '-',
    count: getCount(w)
  }));

  const inProgressList = workers.filter(w => {
    const c = getCount(w);
    return c >= 1 && c < 4;
  }).map((w, i) => ({
    orderNum: i + 1,
    name: w.name || '-',
    count: getCount(w)
  }));

  const noAuditList = workers.filter(w => getCount(w) === 0).map((w, i) => ({
    orderNum: i + 1,
    name: w.name || '-',
    count: 0
  }));

  const teamLabel = isStaff ? 'Staff' : 'Leader Shopfloor (FLM)';
  const fileInfo = data.file || 'LSP Tracking.xlsx';
  const lastUpdate = data.lastModifiedFormatted || 'N/A';
  const commonSubtitle = `เดือน: ${targetMonth} 2026 | ทีม: ${teamLabel} | ข้อมูลอัปเดต: ${lastUpdate}`;

  const makeTableRows = (items, statusColorHex) => {
    const headers = [
      { text: 'ลำดับ', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center', fontSize: 9 } },
      { text: 'ชื่อ - สกุล', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'left', fontSize: 9 } },
      { text: 'จำนวนครั้งที่ทำ', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center', fontSize: 9 } }
    ];

    const rows = [headers];

    if (!items || items.length === 0) {
      rows.push([
        { text: '-', options: { align: 'center', fontSize: 8.5 } },
        { text: 'ไม่มีรายชื่อในหมวดหมู่นี้', options: { fontSize: 8.5, italic: true } },
        { text: '-', options: { align: 'center', fontSize: 8.5 } }
      ]);
    } else {
      items.forEach((w, idx) => {
        const isAlt = idx % 2 === 1;
        const rowFill = isAlt ? 'F8FAFC' : 'FFFFFF';
        rows.push([
          { text: String(w.orderNum), options: { align: 'center', fontSize: 8.5, fill: { color: rowFill } } },
          { text: String(w.name), options: { align: 'left', fontSize: 8.5, fill: { color: rowFill } } },
          { text: `${w.count} ครั้ง`, options: { align: 'center', bold: true, color: statusColorHex, fontSize: 8.5, fill: { color: rowFill } } }
        ]);
      });
    }

    return rows;
  };

  const renderCategorySlide = (title, subtitle, chunkItems, badgeColor, badgeText, statusColorHex, pageInfo = '') => {
    const slide = pres.addSlide();

    // 1. Header Dark Bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 1.15,
      fill: { color: '0F172A' },
      line: { color: '0F172A' }
    });

    // 2. Title & Subtitle
    slide.addText(pageInfo ? `${title} ${pageInfo}` : title, {
      x: 0.6,
      y: 0.18,
      w: 9.2,
      h: 0.45,
      fontSize: 16,
      bold: true,
      color: 'FFFFFF'
    });

    slide.addText(subtitle, {
      x: 0.6,
      y: 0.65,
      w: 9.2,
      h: 0.35,
      fontSize: 10,
      color: '94A3B8'
    });

    // 3. Status Badge Pill
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 10.2,
      y: 0.3,
      w: 2.5,
      h: 0.52,
      fill: { color: badgeColor },
      line: { color: badgeColor },
      r: 6
    });

    slide.addText(badgeText, {
      x: 10.2,
      y: 0.3,
      w: 2.5,
      h: 0.52,
      fontSize: 11,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle'
    });

    // 4. Tables: 2-column side-by-side if > 10 items, else centered single table
    if (chunkItems.length > 10) {
      const mid = Math.ceil(chunkItems.length / 2);
      const leftChunk = chunkItems.slice(0, mid);
      const rightChunk = chunkItems.slice(mid);

      const leftRows = makeTableRows(leftChunk, statusColorHex);
      const rightRows = makeTableRows(rightChunk, statusColorHex);

      slide.addTable(leftRows, {
        x: 0.6,
        y: 1.35,
        w: 5.7,
        colW: [0.7, 3.5, 1.5],
        rowH: 0.23
      });

      slide.addTable(rightRows, {
        x: 7.033,
        y: 1.35,
        w: 5.7,
        colW: [0.7, 3.5, 1.5],
        rowH: 0.23
      });
    } else {
      // Single centered table
      const rows = makeTableRows(chunkItems, statusColorHex);
      slide.addTable(rows, {
        x: 3.266,
        y: 1.35,
        w: 6.8,
        colW: [0.9, 4.2, 1.7],
        rowH: 0.26
      });
    }
  };

  const renderSection = (title, items, badgeColor, badgeLabel, statusColorHex) => {
    const maxPerSlide = 36; // 18 on left + 18 on right
    if (items.length <= maxPerSlide) {
      renderCategorySlide(title, commonSubtitle, items, badgeColor, badgeLabel, statusColorHex);
    } else {
      const totalPages = Math.ceil(items.length / maxPerSlide);
      for (let p = 0; p < totalPages; p++) {
        const chunk = items.slice(p * maxPerSlide, (p + 1) * maxPerSlide);
        const pageText = `(ส่วนที่ ${p + 1}/${totalPages})`;
        renderCategorySlide(title, commonSubtitle, chunk, badgeColor, badgeLabel, statusColorHex, pageText);
      }
    }
  };

  // Slide 1: ทำครบ 4 ครั้งขึ้นไป
  renderSection(
    'หน้า 1: รายชื่อที่ทำครบ 4 ครั้งขึ้นไป (Pass)',
    passList,
    '059669',
    `ทำครบ: ${passList.length} คน`,
    '059669'
  );

  // Slide 2: ทำตั้งแต่ 1-3 ครั้ง
  renderSection(
    'หน้า 2: รายชื่อที่ทำตั้งแต่ 1 - 3 ครั้ง (In Progress)',
    inProgressList,
    'D97706',
    `ทำแล้ว 1-3 ครั้ง: ${inProgressList.length} คน`,
    'D97706'
  );

  // Slide 3: ยังไม่ทำเลย
  renderSection(
    'หน้า 3: รายชื่อคนที่ยังไม่ทำเลย (0 ครั้ง / Alert)',
    noAuditList,
    'E11D48',
    `ยังไม่ทำ: ${noAuditList.length} คน`,
    'E11D48'
  );

  return await pres.write({ outputType: 'nodebuffer' });
}

module.exports = { generateLspPpt };
