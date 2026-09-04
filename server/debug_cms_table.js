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

async function debugTable() {
  const loginRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', qs.stringify({
    userid,
    userpwd,
    tnsname: 'ORA'
  }));

  const $ = cheerio.load(loginRes.data);
  const orapwd = $('input[name="orapwd"]').val();

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
  params.append('startmonth', '9');
  params.append('startday', '03');
  params.append('startyear', '26');
  params.append('endmonth', '9');
  params.append('endday', '03');
  params.append('endyear', '26');
  params.append('action', 'runtable');
  params.append('reportentry', 'mixer_oee');

  const reportRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmsform.cgi', params.toString());
  const $r = cheerio.load(reportRes.data);

  $r('tr').each((i, row) => {
    const tds = $r(row).find('td');
    const ths = $r(row).find('th');
    console.log(`Row ${i}: tds=${tds.length}, ths=${ths.length}`);
    const textArr = [];
    $r(row).find('td, th').each((_, c) => textArr.push($r(c).text().trim()));
    console.log(`Row ${i} text:`, textArr);
  });
}

debugTable();
