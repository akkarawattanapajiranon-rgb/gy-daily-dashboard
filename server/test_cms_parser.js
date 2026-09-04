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

async function fetchRealCmsMixingData(dateStr) {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const m = String(parseInt(monthStr, 10));
    const d = String(parseInt(dayStr, 10)).padStart(2, '0');
    const y = yearStr.slice(2);

    const loginRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', qs.stringify({
      userid,
      userpwd,
      tnsname: 'ORA'
    }));

    const $ = cheerio.load(loginRes.data);
    const orapwd = $('input[name="orapwd"]').val();

    if (!orapwd) throw new Error('No orapwd obtained');

    const params = new URLSearchParams();
    params.append('report', 'mixer_oee.sql');
    params.append('extraparams', '');
    params.append('inputprompt', '');
    params.append('cmpd', '%');
    params.append('cmpdtext', '%');
    params.append('cmpd_prompt', '');
    params.append('tnsname', 'THPA1DB'); 
    params.append('userid', userid);
    params.append('userpwd', 'notused');
    params.append('rowlimit', '15000');
    params.append('language', 'E');
    params.append('ar_runnum', '');
    params.append('unit', 'M');
    params.append('priv', 'X');
    params.append('orapwd', orapwd);
    params.append('mixer', '1,2,3,12,13,81,83,84,');
    params.append('navuserlang', 'en-US');

    params.append('cb1', '1');
    params.append('cb2', '2');
    params.append('cb3', '3');
    params.append('cb4', '12');
    params.append('cb5', '13');
    params.append('cb81', '81');
    params.append('cb82', '83');
    params.append('cb83', '84');
    
    params.append('crew', 'ALL');
    params.append('startmonth', m);
    params.append('startday', d);
    params.append('startyear', y);
    params.append('endmonth', m);
    params.append('endday', d);
    params.append('endyear', y);
    
    params.append('action', 'runtable');
    params.append('reportentry', 'mixer_oee');

    const reportRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmsform.cgi', params.toString());
    const $r = cheerio.load(reportRes.data);

    const result = {
      date: dateStr,
      mixing1: { batch: 0, ar: 0, pr: 0, qr: 0, oee2: 0 },
      mixing2: { batch: 0, ar: 0, pr: 0, qr: 0, oee2: 0 },
      totalOee2: 0
    };

    $r('table tr').each((i, el) => {
      const cells = $r(el).find('td, th');
      if (cells.length >= 18) {
        const mixNum = $r(cells[0]).text().trim();
        const batchCount = parseFloat($r(cells[2]).text().replace(/,/g, '').trim()) || 0;
        const ar = parseFloat($r(cells[13]).text().replace(/,/g, '').trim()) || 0;
        const pr = parseFloat($r(cells[15]).text().replace(/,/g, '').trim()) || 0;
        const qr = parseFloat($r(cells[16]).text().replace(/,/g, '').trim()) || 0;
        const oee2 = parseFloat($r(cells[17]).text().replace(/,/g, '').trim()) || 0;

        if (mixNum === '1') {
          result.mixing1 = { batch: batchCount, ar, pr, qr, oee2 };
        } else if (mixNum === '2') {
          result.mixing2 = { batch: batchCount, ar, pr, qr, oee2 };
        } else if (mixNum.toLowerCase().includes('total')) {
          result.totalOee2 = oee2;
        }
      }
    });

    return result;
  } catch (err) {
    return { error: err.message };
  }
}

async function testAll() {
  for (const date of ['2026-09-01', '2026-09-02', '2026-09-03']) {
    console.log(`\n=== REAL CMS MIXING DATA FOR ${date} ===`);
    const data = await fetchRealCmsMixingData(date);
    console.log(JSON.stringify(data, null, 2));
  }
}

testAll();
