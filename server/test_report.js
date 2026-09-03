process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const cheerio = require('cheerio');

async function testReport(tns1, tns2) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, withCredentials: true }));

  try {
    let res = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', new URLSearchParams({
      userid: 'aa11909',
      userpwd: 'GOODYEARthailand1234',
      tnsname: tns1
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    
    const $ = cheerio.load(res.data);
    const orapwd = $('input[name="orapwd"]').val();
    console.log(`Login with ${tns1} gave orapwd:`, !!orapwd);

    if (orapwd) {
      let res2 = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmsform.cgi', new URLSearchParams({
        report_name: 'mixer_oee.sql',
        userid: 'aa11909',
        orapwd: orapwd,
        tnsname: tns2
      }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      
      console.log(`Report with ${tns2} length:`, res2.data.length);
      if (tns1 === 'ORA' && tns2 === 'ORA') {
        console.log(res2.data);
      }
    }
  } catch (e) { console.error(e.message); }
}

async function runAll() {
  await testReport('ORA', 'ORA');
  await testReport('db_server', 'db_server');
  await testReport('ORA', 'db_server');
  await testReport('db_server', 'ORA');
}
runAll();
