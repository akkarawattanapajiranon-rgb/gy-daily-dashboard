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

    const loginRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', qs.stringify({
      userid,
      userpwd,
      tnsname: 'THPA1DB'
    }));

    const $ = cheerio.load(loginRes.data);
    const orapwd = $('input[name="orapwd"]').val();

    if (!orapwd) throw new Error('No orapwd found');
    console.log('Got orapwd:', orapwd);

    const params = new URLSearchParams();
    params.append('report', 'mixer_oee.sql');
    params.append('extraparams', 'start=8/30/26 end=8/30/26 crew=ALL mixer=1,2,3,12,13,81,83,84 cmpd=%');
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
    console.log('Report HTML Length:', reportRes.data.length);
    console.log(reportRes.data.substring(0, 1000));
    
    const $r = cheerio.load(reportRes.data);
    $r('tr').each((i, el) => {
      console.log($r(el).text().replace(/\s+/g, ' ').trim());
    });
  } catch (err) {
    console.error(err);
  }
}

testFetch();
