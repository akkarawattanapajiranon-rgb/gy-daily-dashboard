process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

async function test() {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, withCredentials: true }));

  try {
    console.log("Trying db_server...");
    let res = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', new URLSearchParams({
      userid: 'aa11909',
      userpwd: 'GOODYEARthailand1234',
      tnsname: 'db_server'
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    console.log("Length:", res.data.length);
    console.log(res.data.substring(0, 300));
  } catch (e) { console.error(e.message); }

  try {
    console.log("\nTrying ORA...");
    let res2 = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', new URLSearchParams({
      userid: 'aa11909',
      userpwd: 'GOODYEARthailand1234',
      tnsname: 'ORA'
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    console.log("Length:", res2.data.length);
    console.log(res2.data.substring(0, 300));
  } catch (e) { console.error(e.message); }
}
test();
