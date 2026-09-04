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

async function testVercelEndpoints() {
  const endpoints = [
    'https://bta-waste-report.vercel.app/api/get-all-waste',
    'https://bta-waste-report.vercel.app/api/waste',
    'https://bta-waste-report.vercel.app/api/reports'
  ];

  for (const ep of endpoints) {
    console.log(`\nTesting endpoint: ${ep}`);
    try {
      const res = await fetchUrl(ep);
      console.log('Status:', res.status);
      if (res.data) {
        console.log('Keys/Type:', Array.isArray(res.data) ? `Array [${res.data.length}]` : Object.keys(res.data));
        console.log('Sample:', JSON.stringify(res.data).slice(0, 300));
      } else {
        console.log('Text snippet:', String(res.text).slice(0, 300));
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

testVercelEndpoints();
