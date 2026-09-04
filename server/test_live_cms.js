const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('querystring');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, timeout: 10000 }));

const userid = process.env.CMS_USER || 'aa11909';
const userpwd = process.env.CMS_PASS || 'GOODYEARthailand1234';

async function fetchCmsMixerOee(targetDate) {
  try {
    const [yearStr, monthStr, dayStr] = targetDate.split('-');
    // Format date e.g. 9/1/26 or 9/01/26
    const m = parseInt(monthStr, 10);
    const d = parseInt(dayStr, 10);
    const y = yearStr.slice(2);
    const dateFormatted = `${m}/${d}/${y}`;

    console.log(`\n================ Fetching CMS Mixer OEE for ${targetDate} (${dateFormatted}) ================`);

    const loginRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', qs.stringify({
      userid,
      userpwd,
      tnsname: 'THPA1DB'
    }));

    const $ = cheerio.load(loginRes.data);
    const orapwd = $('input[name="orapwd"]').val();

    if (!orapwd) throw new Error('No orapwd obtained from login');
    console.log('Got orapwd successfully!');

    const params = new URLSearchParams();
    params.append('report', 'mixer_oee.sql');
    params.append('extraparams', `start=${dateFormatted} end=${dateFormatted} crew=ALL mixer=1,2,3,12,13,81,83,84 cmpd=%`);
    params.append('inputprompt', '');
    params.append('cmpd', '');
    params.append('cmpd_prompt', '');
    params.append('tnsname', 'db_server');
    params.append('userid', userid);
    params.append('userpwd', 'notused');
    params.append('rowlimit', '15000');
    params.append('language', 'E');
    params.append('ar_runnum', '');
    params.append('unit', 'M');
    params.append('priv', 'X');
    params.append('orapwd', orapwd);
    params.append('mixer', '');
    params.append('navuserlang', 'en-US');
    params.append('action', 'runtable');

    const reportRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmsform.cgi', params.toString());
    const $r = cheerio.load(reportRes.data);

    console.log('HTML Length:', reportRes.data.length);

    $r('tr').each((i, el) => {
      const text = $r(el).text().replace(/\s+/g, ' ').trim();
      if (text) {
        console.log(`Row ${i}:`, text);
      }
    });

  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}

async function run() {
  await fetchCmsMixerOee('2026-09-01');
  await fetchCmsMixerOee('2026-09-02');
  await fetchCmsMixerOee('2026-09-03');
}

run();
