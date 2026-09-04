process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const https = require('https');

function fetchHttps(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log('Fetching https://bta-waste-report.vercel.app/api/get-all-waste ...');
    const res = await fetchHttps('https://bta-waste-report.vercel.app/api/get-all-waste');
    console.log('Status:', res.status);
    const data = res.body;

    if (typeof data === 'object') {
      fs.writeFileSync('server/vercel_waste_sample.json', JSON.stringify(data, null, 2));
      console.log('Saved data to server/vercel_waste_sample.json');
      if (Array.isArray(data)) {
        console.log(`Array length: ${data.length}`);
        console.log('Sample Record 0:', JSON.stringify(data[0], null, 2));
      } else {
        const keys = Object.keys(data);
        console.log('Object keys:', keys.slice(0, 10));
        console.log('Sample under key 0:', JSON.stringify(data[keys[0]], null, 2));
      }
    } else {
      console.log('Body snippet:', String(data).slice(0, 500));
    }
  } catch (err) {
    console.error('Err:', err.message);
  }
}

run();
