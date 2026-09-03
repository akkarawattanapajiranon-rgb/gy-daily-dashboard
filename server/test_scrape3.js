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

    console.log('Fetching report for 8/30/26...');
    const params = new URLSearchParams();
    params.append('userid', userid);
    params.append('orapwd', orapwd);
    params.append('tnsname', 'db_server'); // Try db_server again because the screenshot says db_server
    params.append('userpwd', 'notused');
    params.append('report', 'mixer_oee.sql');
    params.append('action', 'runtable');
    
    // Instead of cb1, cb2 etc, we use extraparams!
    params.append('extraparams', 'start=8/30/26 end=8/30/26 crew=ALL mixer=1,2,3,12,13,81,83,84 cmpd=%');

    const reportRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmsform.cgi', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('Report HTML Length:', reportRes.data.length);
    console.log(reportRes.data);
    
    const $r = cheerio.load(reportRes.data);
    $r('tr').each((i, el) => {
      console.log($r(el).text().replace(/\s+/g, ' ').trim());
    });

  } catch (err) {
    console.error(err);
  }
}

testFetch();
