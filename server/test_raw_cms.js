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

async function testPrint() {
  const loginRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', qs.stringify({
    userid,
    userpwd,
    tnsname: 'THPA1DB'
  }));

  const $ = cheerio.load(loginRes.data);
  const orapwd = $('input[name="orapwd"]').val();

  const params = new URLSearchParams();
  params.append('report', 'mixer_oee.sql');
  params.append('extraparams', 'start=9/01/26 end=9/01/26 crew=ALL mixer=1,2,3,12,13,81,83,84 cmpd=%');
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
  console.log('=== RAW HTML ===');
  console.log(reportRes.data);
}

testPrint();
