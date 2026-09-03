const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('querystring');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

async function testFetch() {
  try {
    const userid = 'aa11909';
    const userpwd = 'GOODYEARthailand1234';

    console.log('Logging in...');
    const loginRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', qs.stringify({
      userid,
      userpwd,
      tnsname: 'ORA'
    }));

    const $ = cheerio.load(loginRes.data);
    const orapwd = $('input[name="orapwd"]').val();

    if (!orapwd) throw new Error('No orapwd found');
    console.log('Got orapwd:', orapwd);

    console.log('Fetching report...');
    const params = new URLSearchParams();
    params.append('userid', userid);
    params.append('orapwd', orapwd);
    params.append('userpwd', 'notused');
    params.append('tnsname', 'db_server');
    params.append('report', 'mixer_oee.sql');
    params.append('action', 'runtext');
    params.append('rowlimit', '15000');
    params.append('language', 'E');
    params.append('unit', 'M');
    params.append('priv', 'X');
    
    // Checkboxes
    params.append('cb1', '1');
    params.append('cb2', '2');
    params.append('cb3', '3');
    params.append('cb4', '12');
    params.append('cb5', '13');
    params.append('cb81', '81');
    params.append('cb82', '83');
    params.append('cb83', '84');
    
    params.append('cmpd', '%');
    params.append('cmpd_prompt', '');
    params.append('cmpdselect', '');
    params.append('crew', 'ALL');
    
    // Set date to 2026-08-30
    params.append('startmonth', '8');
    params.append('startday', '30');
    params.append('startyear', '26');
    params.append('endmonth', '8');
    params.append('endday', '30');
    params.append('endyear', '26');

    // Also send reportentry just in case
    params.append('reportentry', 'mixer_oee');
    params.append('extraparams', '');

    const reportRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmsform.cgi', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('Report HTML Length:', reportRes.data.length);
    console.log(reportRes.data.substring(0, 1500));
    
    const $r = cheerio.load(reportRes.data);
    $r('tr').each((i, el) => {
      console.log($r(el).text().replace(/\s+/g, ' ').trim());
    });

  } catch (err) {
    console.error(err);
  }
}

testFetch();
