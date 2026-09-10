const { getExtruderTimeline } = require('./extruder/dayStore');
const { dayBounds } = require('./extruder/buildTimeline');
const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

try {
  oracledb.initOracleClient({ libDir: 'C:\\instantclient_19_23\\instantclient_19_23' });
} catch (e) {}

async function testPastDates() {
  const dates = ['2026-09-09', '2026-09-08', '2026-09-07', '2026-09-06'];

  console.log('=== Checking QUAD Rows directly from Oracle for Past Dates ===');

  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'quadextr',
      password: 'quadextr',
      connectString: '10.124.147.20:1521/XE'
    });

    for (const date of dates) {
      const { start, end } = dayBounds(date);
      const sql = `
        SELECT
          TO_CHAR(s4.DT, 'YYYY-MM-DD HH24:MI:SS') AS "dt",
          s4.RUN_NUM AS "runNum",
          tr.RECIPENAME AS "recipeName",
          rs.RECIPEID AS "recipeId",
          s4.PVREAL60 AS "tatawAct",
          p27.PARAMETERREAL AS "tawSpec"
        FROM SNAP_FB_04 s4
          JOIN RUN_SUMM rs ON rs.RUN_NUM = s4.RUN_NUM
          JOIN TBLRECIPES tr ON tr.RECIPEID = rs.RECIPEID
          LEFT JOIN TBLRECIPEPARAMETERS p27 ON p27.RECIPEID = tr.RECIPEID AND p27.PARAMETERID = 27
        WHERE s4.DT > TO_DATE(:startDt, 'YYYY-MM-DD HH24:MI:SS')
          AND s4.DT <= TO_DATE(:endDt, 'YYYY-MM-DD HH24:MI:SS')
          AND ROWNUM <= 20
        ORDER BY s4.DT DESC
      `;

      const res = await conn.execute(sql, { startDt: start, endDt: end });
      console.log(`Date ${date} (${start} to ${end}): QUAD direct rows = ${res.rows ? res.rows.length : 0}`);
      if (res.rows && res.rows.length > 0) {
        console.log('  Sample row:', res.rows[0]);
      }
    }
  } catch (err) {
    console.error('Oracle Error:', err.message);
  } finally {
    if (conn) await conn.close();
  }

  console.log('\n=== Checking dayStore.js getExtruderTimeline for Past Dates ===');
  for (const date of dates) {
    const data = await getExtruderTimeline(date);
    const quadLine = data.lines.find(l => l.line === 'QUAD');
    const duplexLine = data.lines.find(l => l.line === 'DUPLEX');
    console.log(`Date ${date}: QUAD samples = ${quadLine?.samples?.length || 0} (err: ${quadLine?.error}), DUPLEX samples = ${duplexLine?.samples?.length || 0}`);
  }
}

testPastDates();
