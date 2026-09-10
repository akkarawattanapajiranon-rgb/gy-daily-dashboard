const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

try {
  oracledb.initOracleClient({ libDir: 'C:\\instantclient_19_23\\instantclient_19_23' });
} catch (e) {}

async function checkLatest() {
  console.log('=== Checking MAX(DT) in QUAD Oracle DB ===');
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'quadextr',
      password: 'quadextr',
      connectString: '10.124.147.20:1521/XE'
    });

    const sql = `
      SELECT TO_CHAR(MAX(DT), 'YYYY-MM-DD HH24:MI:SS') AS "latestDt", COUNT(*) AS "totalRows"
      FROM SNAP_FB_04
    `;
    const res = await conn.execute(sql);
    console.log('QUAD MAX(DT) result:', res.rows[0]);

    const sqlRecent = `
      SELECT * FROM (
        SELECT TO_CHAR(DT, 'YYYY-MM-DD HH24:MI:SS') AS "dt", RUN_NUM AS "runNum"
        FROM SNAP_FB_04
        ORDER BY DT DESC
      ) WHERE ROWNUM <= 5
    `;
    const resRecent = await conn.execute(sqlRecent);
    console.log('Recent 5 rows in QUAD:', resRecent.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}

checkLatest();
