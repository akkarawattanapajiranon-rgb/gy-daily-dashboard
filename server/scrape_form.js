process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const cheerio = require('cheerio');

async function scrapeForm() {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, withCredentials: true }));

  try {
    let res = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', new URLSearchParams({
      userid: 'aa11909',
      userpwd: 'GOODYEARthailand1234',
      tnsname: 'ORA'
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    
    const $ = cheerio.load(res.data);
    const orapwd = $('input[name="orapwd"]').val();

    if (orapwd) {
      let res2 = await client.get('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmsform.cgi');
      console.log(res2.data.substring(0, 1000));
    }
  } catch (e) { console.error(e.message); }
}

scrapeForm();
