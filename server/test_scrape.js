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
    const tnsname = $('input[name="tnsname"]').val() || 'THPA1DB';

    if (!orapwd) throw new Error('No orapwd found');
    console.log('Got orapwd:', orapwd);

    console.log('Fetching report...');
    const params = new URLSearchParams();
    params.append('userid', userid);
    params.append('orapwd', orapwd);
    params.append('tnsname', tnsname);
    params.append('report', 'mixer_oee.sql');
    params.append('action', 'runtable');
    
    // Checkboxes
    ['1', '2', '3', '12', '13'].forEach(v => params.append('mixer', v));
    ['81', '83', '84'].forEach(v => params.append('pigsys', v));
    
    params.append('cmpd', '%');
    params.append('crew', 'ALL');
    
    // Set date to 2026-09-01
    params.append('startmonth', '9');
    params.append('startday', '1');
    params.append('startyear', '26');
    params.append('endmonth', '9');
    params.append('endday', '1');
    params.append('endyear', '26');

    const reportRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmsform.cgi', params.toString());
    
    console.log('Report HTML Length:', reportRes.data.length);
    console.log(reportRes.data.substring(0, 1500)); // Print start of HTML
    
    const $r = cheerio.load(reportRes.data);
    $r('tr').each((i, el) => {
      console.log($r(el).text().replace(/\s+/g, ' '));
    });

  } catch (err) {
    console.error(err);
  }
}

testFetch();
