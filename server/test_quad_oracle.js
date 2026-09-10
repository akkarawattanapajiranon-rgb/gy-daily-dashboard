const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

try {
  oracledb.initOracleClient({ libDir: 'C:\\instantclient_19_23\\instantclient_19_23' });
} catch (e) {
  console.log('initClient:', e.message);
}

async function testQuad() {
  console.log('--- Testing QUAD Oracle DB (10.124.147.20:1521/XE) ---');
  let conn;
  try {
    const t0 = Date.now();
    conn = await oracledb.getConnection({
      user: 'quadextr',
      password: 'quadextr',
      connectString: '10.124.147.20:1521/XE'
    });
    console.log(`Connected to QUAD in ${Date.now() - t0}ms`);

    const date = '2026-09-10';
    const startDt = `${date} 07:00:00`;
    const nextDate = '2026-09-11';
    const endDt = `${nextDate} 07:00:00`;

    const sql = `
      SELECT
        TO_CHAR(s4.DT, 'YYYY-MM-DD HH24:MI:SS') AS "dt",
        s4.RUN_NUM AS "runNum",
        tr.RECIPENAME AS "recipeName"
      FROM SNAP_FB_04 s4
        JOIN RUN_SUMM rs ON rs.RUN_NUM = s4.RUN_NUM
        JOIN TBLRECIPES tr ON tr.RECIPEID = rs.RECIPEID
      WHERE s4.DT > TO_DATE(:startDt, 'YYYY-MM-DD HH24:MI:SS')
        AND s4.DT <= TO_DATE(:endDt, 'YYYY-MM-DD HH24:MI:SS')
        AND ROWNUM <= 20
      ORDER BY s4.DT DESC
    `;

    const res = await conn.execute(sql, { startDt, endDt });
    console.log('QUAD Query Result rows count:', res.rows ? res.rows.length : 0);
    if (res.rows && res.rows.length > 0) {
      console.log('First QUAD sample:', res.rows[0]);
    }
  } catch (err) {
    console.error('QUAD Oracle ERROR:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}

async function testDuplex() {
  console.log('--- Testing DUPLEX Oracle DB (10.124.147.45:1521/XE) ---');
  let conn;
  try {
    const t0 = Date.now();
    conn = await oracledb.getConnection({
      user: 'quadextr',
      password: 'quadextr',
      connectString: '10.124.147.45:1521/XE'
    });
    console.log(`Connected to DUPLEX in ${Date.now() - t0}ms`);

    const date = '2026-09-10';
    const startDt = `${date} 07:00:00`;
    const nextDate = '2026-09-11';
    const endDt = `${nextDate} 07:00:00`;

    const sql = `
      SELECT
        TO_CHAR(s4.DT, 'YYYY-MM-DD HH24:MI:SS') AS "dt",
        s4.RUN_NUM AS "runNum",
        tr.RECIPENAME AS "recipeName"
      FROM SNAP_FB_04 s4
        JOIN RUN_SUMM rs ON rs.RUN_NUM = s4.RUN_NUM
        JOIN TBLRECIPES tr ON tr.RECIPEID = rs.RECIPEID
      WHERE s4.DT > TO_DATE(:startDt, 'YYYY-MM-DD HH24:MI:SS')
        AND s4.DT <= TO_DATE(:endDt, 'YYYY-MM-DD HH24:MI:SS')
        AND ROWNUM <= 20
      ORDER BY s4.DT DESC
    `;

    const res = await conn.execute(sql, { startDt, endDt });
    console.log('DUPLEX Query Result rows count:', res.rows ? res.rows.length : 0);
    if (res.rows && res.rows.length > 0) {
      console.log('First DUPLEX sample:', res.rows[0]);
    }
  } catch (err) {
    console.error('DUPLEX Oracle ERROR:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}

async function run() {
  await testQuad();
  await testDuplex();
}

run();
