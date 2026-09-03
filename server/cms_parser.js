const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('querystring');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const CMS_USER = process.env.CMS_USER || 'aa11909';
const CMS_PASS = process.env.CMS_PASS || 'GOODYEARthailand1234';

// In-memory cache for CMS data (TTL: 10 minutes)
const cmsCache = new Map(); // key: dateStr, value: { data, timestamp }
const pendingRequests = new Map(); // key: dateStr, value: Promise

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Execute raw live HTTP query to Goodyear Oracle CMS system
 */
async function queryCmsServer(dateStr) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, timeout: 25000 }));

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const m = String(parseInt(monthStr, 10));
  const d = String(parseInt(dayStr, 10)).padStart(2, '0');
  const y = yearStr.slice(2);

  // Step 1: Login
  const loginRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmslogin.cgi', qs.stringify({
    userid: CMS_USER,
    userpwd: CMS_PASS,
    tnsname: 'ORA'
  }));

  const $ = cheerio.load(loginRes.data);
  const orapwd = $('input[name="orapwd"]').val();

  if (!orapwd) {
    throw new Error('Could not obtain orapwd from CMS login page');
  }

  // Step 2: Submit report parameters
  const params = new URLSearchParams();
  params.append('report', 'mixer_oee.sql');
  params.append('extraparams', '');
  params.append('inputprompt', '');
  params.append('cmpd', '%');
  params.append('cmpdtext', '%');
  params.append('cmpd_prompt', '');
  params.append('tnsname', 'THPA1DB'); 
  params.append('userid', CMS_USER);
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
  params.append('startmonth', m);
  params.append('startday', d);
  params.append('startyear', y);
  params.append('endmonth', m);
  params.append('endday', d);
  params.append('endyear', y);
  
  params.append('action', 'runtable');
  params.append('reportentry', 'mixer_oee');

  const reportRes = await client.post('https://cms.thpa1.ap.goodyear.com/cgi-bin/cms/cmsform.cgi', params.toString());
  
  // Parse response HTML
  const rawHtml = reportRes.data || '';
  const unescapedHtml = rawHtml.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const $r = cheerio.load(unescapedHtml);

  const result = {
    date: dateStr,
    mixing1: { batch: 0, ar: 0, pr: 0, qr: 0, oee2: 0 },
    mixing2: { batch: 0, ar: 0, pr: 0, qr: 0, oee2: 0 },
    totalOee2: 0
  };

  let foundRows = 0;
  $r('table tr').each((i, row) => {
    const tds = $r(row).find('td');
    if (tds.length >= 18) {
      const mixNum = $r(tds[0]).text().replace(/,/g, '').trim();
      const batchCount = parseFloat($r(tds[2]).text().replace(/,/g, '').trim()) || 0;
      const ar = parseFloat($r(tds[13]).text().replace(/,/g, '').trim()) || 0;
      const pr = parseFloat($r(tds[15]).text().replace(/,/g, '').trim()) || 0;
      const qr = parseFloat($r(tds[16]).text().replace(/,/g, '').trim()) || 0;
      const oee2 = parseFloat($r(tds[17]).text().replace(/,/g, '').trim()) || 0;

      if (mixNum === '1') {
        result.mixing1 = { batch: batchCount, ar, pr, qr, oee2 };
        foundRows++;
      } else if (mixNum === '2') {
        result.mixing2 = { batch: batchCount, ar, pr, qr, oee2 };
        foundRows++;
      } else if (mixNum.toLowerCase().includes('total')) {
        result.totalOee2 = oee2;
        foundRows++;
      }
    }
  });

  if (foundRows === 0) {
    console.warn(`[CMS] Query succeeded but 0 data rows found for ${dateStr}`);
  } else {
    console.log(`[CMS] Successfully fetched live Mixing data for ${dateStr} (Total OEE2: ${result.totalOee2}%)`);
  }

  return result;
}

/**
 * Main function with caching, request deduplication, and retry logic
 */
async function fetchLiveCmsData(dateStr) {
  // 1. Check cache first
  const cached = cmsCache.get(dateStr);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[CMS] Serving cached data for ${dateStr}`);
    return cached.data;
  }

  // 2. Request deduplication (if already fetching for this date, wait for existing promise)
  if (pendingRequests.has(dateStr)) {
    console.log(`[CMS] Waiting for in-flight request for ${dateStr}...`);
    return pendingRequests.get(dateStr);
  }

  // 3. Create execution promise
  const fetchPromise = (async () => {
    try {
      // Attempt 1
      const data = await queryCmsServer(dateStr);
      cmsCache.set(dateStr, { data, timestamp: Date.now() });
      return data;
    } catch (err1) {
      console.warn(`[CMS] Attempt 1 failed for ${dateStr} (${err1.message}). Retrying in 1.5s...`);
      await new Promise(r => setTimeout(r, 1500));
      
      try {
        // Attempt 2 (Retry)
        const data = await queryCmsServer(dateStr);
        cmsCache.set(dateStr, { data, timestamp: Date.now() });
        return data;
      } catch (err2) {
        console.error(`[CMS] Attempt 2 failed for ${dateStr}:`, err2.message);
        
        // Return stale cache if available
        if (cached) {
          console.log(`[CMS] Returning stale cached data for ${dateStr}`);
          return cached.data;
        }
        return null;
      }
    } finally {
      pendingRequests.delete(dateStr);
    }
  })();

  pendingRequests.set(dateStr, fetchPromise);
  return fetchPromise;
}

module.exports = { fetchLiveCmsData };
