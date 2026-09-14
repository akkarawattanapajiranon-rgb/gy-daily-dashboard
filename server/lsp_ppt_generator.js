const pptxgen = require('pptxgenjs');
const { parseLspData } = require('./lsp_parser');

async function generateLspPpt(team = 'Staff', month = 'SEP') {
  const data = parseLspData();
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  const isStaff = team.toLowerCase() === 'staff';
  const rawList = isStaff ? (data.staffWorkers || []) : (data.leaderWorkers || []);
  
  // Exclude non-active if staff
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
    ...w,
    count: getCount(w),
    statusText: 'Pass (ครบเป้าหมาย)'
  }));

  const inProgressList = workers.filter(w => {
    const c = getCount(w);
    return c >= 1 && c < 4;
  }).map((w, i) => ({
    orderNum: i + 1,
    ...w,
    count: getCount(w),
    statusText: `In Progress (${getCount(w)}/4)`
  }));

  const noAuditList = workers.filter(w => getCount(w) === 0).map((w, i) => ({
    orderNum: i + 1,
    ...w,
    count: 0,
    statusText: 'ยังไม่ทำ (0/4)'
  }));

  const teamLabel = isStaff ? 'Staff' : 'Leader Shopfloor (FLM)';
  const fileInfo = data.file || 'LSP Tracking.xlsx';
  const lastUpdate = data.lastModifiedFormatted || 'N/A';
  const commonSubtitle = `เดือน: ${targetMonth} 2026 | ทีม: ${teamLabel} | ไฟล์: ${fileInfo} (อัปเดต: ${lastUpdate})`;

  const renderCategorySlide = (title, subtitle, workerChunk, badgeColor, badgeText, statusColorHex, pageInfo = '') => {
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
      y: 0.15,
      w: 9.5,
      h: 0.45,
      fontSize: 16,
      bold: true,
      color: 'FFFFFF'
    });

    slide.addText(subtitle, {
      x: 0.6,
      y: 0.62,
      w: 9.5,
      h: 0.4,
      fontSize: 9.5,
      color: '94A3B8'
    });

    // 3. Status Badge Pill
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 10.3,
      y: 0.3,
      w: 2.4,
      h: 0.52,
      fill: { color: badgeColor },
      line: { color: badgeColor },
      r: 6
    });

    slide.addText(badgeText, {
      x: 10.3,
      y: 0.3,
      w: 2.4,
      h: 0.52,
      fontSize: 11,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle'
    });

    // 4. Conformance Table
    const headers = [
      { text: 'ลำดับ', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center', fontSize: 8 } },
      { text: 'Legacy', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center', fontSize: 8 } },
      { text: 'ชื่อ - สกุล / ตำแหน่งงาน', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, fontSize: 8 } },
      { text: 'กลุ่ม / แผนก', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center', fontSize: 8 } },
      { text: 'จำนวนตรวจ (ครั้ง)', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center', fontSize: 8 } },
      { text: 'สถานะ Conformance', options: { fill: { color: '1E293B' }, color: 'FFFFFF', bold: true, align: 'center', fontSize: 8 } }
    ];

    const tableRows = [headers];

    if (workerChunk.length === 0) {
      tableRows.push([
        { text: '-', options: { align: 'center', fontSize: 8 } },
        { text: '-', options: { align: 'center', fontSize: 8 } },
        { text: 'ไม่มีรายชื่อในหมวดหมู่นี้', options: { fontSize: 8, italic: true } },
        { text: '-', options: { align: 'center', fontSize: 8 } },
        { text: '-', options: { align: 'center', fontSize: 8 } },
        { text: '-', options: { align: 'center', fontSize: 8 } }
      ]);
    } else {
      workerChunk.forEach((w, idx) => {
        const isAlt = idx % 2 === 1;
        const rowFill = isAlt ? 'F8FAFC' : 'FFFFFF';
        const grp = w.categoryGroup || w.dept || '-';
        const nameWithTitle = (w.name || '-') + (w.title ? `\n${w.title}` : '');

        tableRows.push([
          { text: String(w.orderNum || idx + 1), options: { align: 'center', fontSize: 7.5, fill: { color: rowFill } } },
          { text: String(w.legacy || '-'), options: { align: 'center', fontSize: 7.5, fill: { color: rowFill } } },
          { text: nameWithTitle, options: { fontSize: 7.5, fill: { color: rowFill } } },
          { text: String(grp), options: { align: 'center', fontSize: 7.5, fill: { color: rowFill } } },
          { text: `${w.count} / 4 ครั้ง`, options: { align: 'center', bold: true, color: statusColorHex, fontSize: 7.5, fill: { color: rowFill } } },
          { text: w.statusText, options: { align: 'center', bold: true, color: statusColorHex, fontSize: 7.5, fill: { color: rowFill } } }
        ]);
      });
    }

    slide.addTable(tableRows, {
      x: 0.6,
      y: 1.25,
      w: 12.133,
      colW: [0.7, 1.1, 5.733, 1.6, 1.5, 1.5],
      rowH: 0.2
    });
  };

  const renderPaginatedSection = (title, items, badgeColor, badgeLabel, statusColorHex) => {
    const pageSize = 24;
    if (items.length <= pageSize) {
      renderCategorySlide(title, commonSubtitle, items, badgeColor, badgeLabel, statusColorHex);
    } else {
      const totalPages = Math.ceil(items.length / pageSize);
      for (let p = 0; p < totalPages; p++) {
        const chunk = items.slice(p * pageSize, (p + 1) * pageSize);
        const pageText = `(ส่วนที่ ${p + 1}/${totalPages})`;
        renderCategorySlide(title, commonSubtitle, chunk, badgeColor, badgeLabel, statusColorHex, pageText);
      }
    }
  };

  // 1. หน้าแรก: สำหรับ รายชื่อ ที่ ทำครบ 4 ครั้ง ขึ้นไป
  renderPaginatedSection(
    'หน้า 1: รายชื่อที่ทำครบเป้าหมาย 4 ครั้งขึ้นไป (Pass)',
    passList,
    '059669',
    `ทำครบ ${passList.length} คน`,
    '059669'
  );

  // 2. หน้า 2: สำหรับ รายชื่อ ที่ ทำตั้งแต่ 1-3 ครั้ง
  renderPaginatedSection(
    'หน้า 2: รายชื่อที่ทำตั้งแต่ 1 - 3 ครั้ง (In Progress)',
    inProgressList,
    'D97706',
    `ทำแล้ว 1-3 ครั้ง: ${inProgressList.length} คน`,
    'D97706'
  );

  // 3. หน้า 3: สำหรับ คนที่ ยังไม่ทำเลย
  renderPaginatedSection(
    'หน้า 3: รายชื่อคนที่ยังไม่ทำเลย (0 ครั้ง / Alert)',
    noAuditList,
    'E11D48',
    `ยังไม่ทำ: ${noAuditList.length} คน`,
    'E11D48'
  );

  return await pres.write({ outputType: 'nodebuffer' });
}

module.exports = { generateLspPpt };
