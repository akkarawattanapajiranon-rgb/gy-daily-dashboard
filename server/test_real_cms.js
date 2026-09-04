require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

const CMS_USER = process.env.CMS_USER;
const CMS_PASS = process.env.CMS_PASS;

async function testRealCms(targetDate) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, timeout: 10000 }));

  try {
    const loginData = new URLSearchParams({
      userid: CMS_USER,
      userpwd: CMS_PASS,
      tnsname: 'ORA'
    });

    console.log(`\nAttempting CMS login to cms.thpa1.ap.goodyear.com for date: ${targetDate}...`);
    const loginRes = await client.post('https://cms.thpa1.ap.goodyear.com/portal/auth', loginData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    console.log('Login HTTP status:', loginRes.status);
    const cookies = await jar.getCookies('https://cms.thpa1.ap.goodyear.com');
    console.log('Cookies retrieved:', cookies.map(c => `${c.key}=${c.value.substring(0, 15)}...`));

    const [yearStr, monthStr, dayStr] = targetDate.split('-');
    const formattedDate = `${parseInt(monthStr, 10)}/${parseInt(dayStr, 10)}/${yearStr.slice(2)}`;
    const cmsUrl = `https://cms.thpa1.ap.goodyear.com/cgi-bin/r2w.exe?r=mixer_oee.sql&p1=${formattedDate}&p2=${formattedDate}`;

    console.log('Fetching CMS URL:', cmsUrl);
    const reportRes = await client.get(cmsUrl);
    const html = reportRes.data;

    console.log('\n--- CMS RAW HTML RESPONSE ---');
    console.log(html);

    const $ = cheerio.load(html);
    const rows = $('table tr');
    console.log(`\nFound ${rows.length} table rows.`);

    rows.each((i, row) => {
      const text = $(row).text().replace(/\s+/g, ' ').trim();
      console.log(`Row ${i}:`, text);
    });

  } catch (err) {
    console.error('CMS Error:', err.message);
  }
}

testRealCms('2026-09-01');
testRealCms('2026-09-02');
