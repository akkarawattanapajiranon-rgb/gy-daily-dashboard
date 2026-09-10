const oracledb = require('oracledb');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

try {
  oracledb.initOracleClient({ libDir: 'C:\\instantclient_19_23\\instantclient_19_23' });
} catch (e) {}

async function inspectRawQuad() {
  console.log('=== Inspecting QUAD Oracle DB Rows for Date 9 and Date 10 ===');
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'quadextr',
      password: 'quadextr',
      connectString: '10.124.147.20:1521/XE'
    });

    const dates = [
      { label: 'Date 9 (Sep 9 07:00 to Sep 10 07:00)', start: '2026-09-09 07:00:00', end: '2026-09-10 07:00:00' },
      { label: 'Date 10 (Sep 10 07:00 to Sep 10 14:00)', start: '2026-09-10 07:00:00', end: '2026-09-10 14:00:00' }
    ];

    for (const d of dates) {
      console.log(`\n--- ${d.label} ---`);
      const sql = `
        SELECT
          TO_CHAR(s4.DT, 'YYYY-MM-DD HH24:MI:SS') AS "dt",
          s4.RUN_NUM AS "runNum",
          tr.RECIPENAME AS "recipeName",
          s4.PVREAL60 AS "tatawAct",
          p27.PARAMETERREAL AS "tawSpec",
          s4.PVREAL6 AS "hpress1",
          s4.PVREAL15 AS "hpress2",
          s4.PVREAL24 AS "hpress3",
          s4.PVREAL33 AS "hpress4",
          s4.PVREAL27 AS "lineSpeed",
          s4.PVREAL21 AS "s21",
          s4.PVREAL22 AS "s22",
          s4.PVREAL23 AS "s23",
          s4.PVREAL24 AS "s24"
        FROM SNAP_FB_04 s4
          JOIN RUN_SUMM rs ON rs.RUN_NUM = s4.RUN_NUM
          JOIN TBLRECIPES tr ON tr.RECIPEID = rs.RECIPEID
          LEFT JOIN TBLRECIPEPARAMETERS p27 ON p27.RECIPEID = tr.RECIPEID AND p27.PARAMETERID = 27
        WHERE s4.DT > TO_DATE(:startDt, 'YYYY-MM-DD HH24:MI:SS')
          AND s4.DT <= TO_DATE(:endDt, 'YYYY-MM-DD HH24:MI:SS')
          AND ROWNUM <= 30
        ORDER BY s4.DT DESC
      `;

      const res = await conn.execute(sql, { startDt: d.start, endDt: d.end });
      console.log(`Count: ${res.rows ? res.rows.length : 0}`);
      if (res.rows && res.rows.length > 0) {
        console.log('Sample rows:', res.rows.slice(0, 5));
      }
    }
  } catch (err) {
    console.error('Oracle Error:', err.message);
  } finally {
    if (conn) await conn.close();
  }
}

inspectRawQuad();
