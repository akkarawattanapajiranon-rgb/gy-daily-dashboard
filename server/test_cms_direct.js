const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('querystring');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testDirectCms() {
  console.log('--- TESTING DIRECT ORACLE CMS LOGIN & FETCH ---');
  const startTime = Date.now();
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, timeout: 30000 }));

  try {
    console.log('1. Sending login request to https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi ...');
    const loginRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', qs.stringify({
      userid: 'aa11909',
      userpwd: 'GOODYEARthailand1234',
      tnsname: 'ORA'
    }));

    console.log(`Login response status: ${loginRes.status} (took ${Date.now() - startTime}ms)`);
    const $ = cheerio.load(loginRes.data);
    const orapwd = $('input[name="orapwd"]').val();
    console.log('Extracted orapwd:', orapwd ? `${orapwd.slice(0, 10)}...` : 'NULL/MISSING');

    if (!orapwd) {
      console.error('Login HTML preview:', loginRes.data.slice(0, 500));
      return;
    }

    console.log('2. Submitting report parameters to cmsform.cgi for 2026-09-03 ...');
    const params = new URLSearchParams();
    params.append('report', 'mixer_oee.sql');
    params.append('extraparams', '');
    params.append('inputprompt', '');
    params.append('cmpd', '%');
    params.append('cmpdtext', '%');
    params.append('cmpd_prompt', '');
    params.append('tnsname', 'THPA1DB'); 
    params.append('userid', 'aa11909');
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
    params.append('startmonth', '9');
    params.append('startday', '03');
    params.append('startyear', '26');
    params.append('endmonth', '9');
    params.append('endday', '03');
    params.append('endyear', '26');
    params.append('action', 'runtable');
    params.append('reportentry', 'mixer_oee');

    const formTime = Date.now();
    const reportRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmsform.cgi', params.toString());
    console.log(`Report response status: ${reportRes.status} (took ${Date.now() - formTime}ms)`);

    const rawHtml = reportRes.data || '';
    const unescapedHtml = rawHtml.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const $r = cheerio.load(unescapedHtml);

    let foundRows = 0;
    $r('table tr').each((i, row) => {
      const tds = $r(row).find('td');
      if (tds.length >= 18) {
        const mixNum = $r(tds[0]).text().replace(/,/g, '').trim();
        const batchCount = parseFloat($r(tds[2]).text().replace(/,/g, '').trim()) || 0;
        const oee2 = parseFloat($r(tds[17]).text().replace(/,/g, '').trim()) || 0;
        console.log(` Row -> Mixer: ${mixNum}, Batch: ${batchCount}, OEE2: ${oee2}%`);
        foundRows++;
      }
    });

    console.log(`Total rows found: ${foundRows}`);

  } catch (err) {
    console.error('CMS Test Error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
    }
  }
}

testDirectCms();
