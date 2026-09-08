const oracledb = require('oracledb');

const libDir = process.env.ORACLE_CLIENT_LIB_DIR || 'C:\\instantclient_19_23\\instantclient_19_23';
try {
  oracledb.initOracleClient({ libDir });
} catch (e) {
  console.log('initOracleClient:', e.message);
}

async function testConn(name, dsn) {
  console.log(`Testing ${name} (${dsn})...`);
  try {
    const conn = await oracledb.getConnection({
      user: 'quadextr',
      password: 'quadextr',
      connectString: dsn
    });
    const res = await conn.execute('SELECT SYSDATE FROM DUAL');
    console.log(`✅ ${name} SUCCESS! Date:`, res.rows[0]);
    await conn.close();
  } catch (err) {
    console.error(`❌ ${name} ERROR:`, err.message);
  }
}

(async () => {
  await testConn('QUAD', '10.124.147.20:1521/XE');
  await testConn('DUPLEX', '10.124.147.45:1521/XE');
})();
