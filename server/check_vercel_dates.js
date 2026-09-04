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

async function inspectVercelDates() {
  const res = await fetchUrl('https://bta-waste-report.vercel.app/api/reports');
  if (res.status !== 200 || !Array.isArray(res.data)) return;

  const datesMap = {};
  res.data.forEach(r => {
    const d = r.date || r.createdAt || 'Unknown';
    datesMap[d] = (datesMap[d] || 0) + 1;
  });

  const sortedDates = Object.keys(datesMap).sort().reverse();
  console.log('Top 30 Latest Dates in Vercel API:');
  sortedDates.slice(0, 30).forEach(d => console.log(`  Date: "${d}" -> ${datesMap[d]} records`));
}

inspectVercelDates();
