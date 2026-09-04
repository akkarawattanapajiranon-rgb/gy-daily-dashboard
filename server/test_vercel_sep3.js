process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const https = require('https');

function fetchUrl(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    }).on('error', reject);
  });
}

async function testSep3FromVercelApi() {
  console.log('Fetching https://bta-waste-report.vercel.app/api/reports ...');
  const res = await fetchUrl('https://bta-waste-report.vercel.app/api/reports');
  if (res.status !== 200 || !Array.isArray(res.data)) {
    console.error('Failed to fetch array from Vercel API');
    return;
  }

  console.log(`Total Vercel Records: ${res.data.length}`);

  const targetDate = '2026-09-03';
  const dayRecords = res.data.filter(r => r.date === targetDate);
  console.log(`\nRecords for ${targetDate}: ${dayRecords.length}`);

  let millingSummary = 0;
  let frictionSummary = 0;
  let beadSummary = 0;

  const millingMap = {};
  const frictionMap = {};
  const beadMap = {};

  dayRecords.forEach(r => {
    const w = parseFloat(r.weight) || 0;
    const wasteType = (r.wasteType || '').trim();
    const code = String(r.defectCode || r.materialCode || 'Waste').trim();
    const reason = String(r.defectName || r.cause || code).trim();
    const dept = (r.dept || '').toLowerCase();

    let cat = 'Friction';
    if (wasteType === 'Milling' || dept.includes('milling') || dept.includes('compound') || dept.includes('extruder')) {
      cat = 'Milling';
    } else if (wasteType === 'Bead' || dept.includes('bead')) {
      cat = 'Bead';
    } else if (wasteType === 'Friction' || dept.includes('friction') || dept.includes('roll') || dept.includes('band')) {
      cat = 'Friction';
    } else {
      // Check code prefix or reason
      if (code.startsWith('M') || reason.toLowerCase().includes('lumpy') || reason.toLowerCase().includes('tailing')) {
        cat = 'Milling';
      } else if (code.startsWith('B') || reason.toLowerCase().includes('bead')) {
        cat = 'Bead';
      } else {
        cat = 'Friction';
      }
    }

    if (cat === 'Bead') {
      beadSummary += w;
      if (!beadMap[code]) beadMap[code] = { code, amount: 0, reason };
      beadMap[code].amount += w;
    } else if (cat === 'Milling') {
      millingSummary += w;
      if (!millingMap[code]) millingMap[code] = { code, amount: 0, reason };
      millingMap[code].amount += w;
    } else {
      frictionSummary += w;
      if (!frictionMap[code]) frictionMap[code] = { code, amount: 0, reason };
      frictionMap[code].amount += w;
    }
  });

  const totalWaste = millingSummary + frictionSummary + beadSummary;

  console.log('\n--- VERCEL API PARSED RESULTS FOR 2026-09-03 ---');
  console.log('Total Waste:', totalWaste.toFixed(2), 'kg');
  console.log('Milling Summary:', millingSummary.toFixed(2), 'kg');
  console.log('Friction Summary:', frictionSummary.toFixed(2), 'kg');
  console.log('Bead Summary:', beadSummary.toFixed(2), 'kg');

  console.log('\nSample Day 3 Records:');
  console.log(dayRecords.slice(0, 5));
}

testSep3FromVercelApi();
