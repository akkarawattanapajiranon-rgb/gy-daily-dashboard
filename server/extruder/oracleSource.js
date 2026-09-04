const { dayBounds, capRows, MAX_SAMPLES_PER_LINE } = require('./buildTimeline');

let oracledb = null;
try {
  oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
  if (oracledb.CLOB) {
    oracledb.fetchAsString = [oracledb.CLOB];
  }
} catch (e) {
  console.log('[oracleSource] oracledb package not loaded:', e.message);
}

let clientInitialised = false;
function initThickClient() {
  if (!oracledb || clientInitialised) return;
  const libDir = process.env.ORACLE_CLIENT_LIB_DIR;
  try {
    oracledb.initOracleClient(libDir ? { libDir } : {});
    clientInitialised = true;
  } catch (e) {
    console.warn('[oracleSource] initOracleClient warning:', e.message);
  }
}

function lineConfigs() {
  const user = process.env.EXTRUDER_ORA_USER || "";
  const password = process.env.EXTRUDER_ORA_PASS || "";
  return [
    { line: "QUAD", connectString: process.env.EXTRUDER_QUAD_DSN || "", user, password },
    { line: "DUPLEX", connectString: process.env.EXTRUDER_DUPLEX_DSN || "", user, password },
  ];
}

const TIMELINE_SQL = `
SELECT * FROM (
  SELECT
    TO_CHAR(s4.DT, 'YYYY-MM-DD HH24:MI:SS')      AS "dt",
    s4.RUN_NUM                                   AS "runNum",
    tr.RECIPENAME                                AS "recipeName",
    rs.RECIPEID                                  AS "recipeId",
    s4.PVREAL60                                  AS "tatawAct",
    p27.PARAMETERREAL                            AS "tawSpec",
    s4.PVREAL60 / NULLIF(p27.PARAMETERREAL, 0)   AS "efficiency"
  FROM QUADEXTR.SNAP_FB_04 s4
    JOIN QUADEXTR.RUN_SUMM   rs ON rs.RUN_NUM  = s4.RUN_NUM
    JOIN QUADEXTR.TBLRECIPES tr ON tr.RECIPEID = rs.RECIPEID
    LEFT JOIN QUADEXTR.TBLRECIPEPARAMETERS p27
      ON p27.RECIPEID = tr.RECIPEID AND p27.PARAMETERID = 27
  WHERE s4.DT >  TO_DATE(:startDt, 'YYYY-MM-DD HH24:MI:SS')
    AND s4.DT <= TO_DATE(:endDt,   'YYYY-MM-DD HH24:MI:SS')
  ORDER BY s4.DT DESC
) WHERE ROWNUM <= :maxRows
`;

const CONNECT_TIMEOUT_MS = 8000;
const CALL_TIMEOUT_MS = 15000;
const LINE_TIMEOUT_MS = 20000;

async function withTimeout(p, ms, what) {
  let timer;
  try {
    return await Promise.race([
      p,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${what} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function loadLineRows(cfg, date, sinceDt) {
  if (!cfg.connectString) {
    return { rows: [], truncated: false, error: `${cfg.line}: no DSN configured` };
  }
  if (!oracledb) {
    return { rows: [], truncated: false, error: `${cfg.line}: oracledb module not available` };
  }

  const { start, end } = dayBounds(date);
  const startDt = sinceDt && sinceDt > start ? sinceDt : start;

  let conn;
  try {
    initThickClient();
    conn = await withTimeout(
      oracledb.getConnection({
        user: cfg.user,
        password: cfg.password,
        connectString: `${cfg.connectString}?transport_connect_timeout=${Math.round(CONNECT_TIMEOUT_MS / 1000)}&retry_count=0`,
      }),
      CONNECT_TIMEOUT_MS,
      `${cfg.line} connect`
    );
    conn.callTimeout = CALL_TIMEOUT_MS;

    const result = await withTimeout(
      conn.execute(TIMELINE_SQL, {
        startDt,
        endDt: end,
        maxRows: MAX_SAMPLES_PER_LINE + 1,
      }),
      LINE_TIMEOUT_MS,
      `${cfg.line} query`
    );

    const { rows, truncated } = capRows(result.rows || [], MAX_SAMPLES_PER_LINE);
    return { rows, truncated, error: null };
  } catch (err) {
    return {
      rows: [],
      truncated: false,
      error: `${cfg.line}: ${err instanceof Error ? err.message : "historian unreachable"}`,
    };
  } finally {
    if (conn) await withTimeout(conn.close(), 5000, `${cfg.line} close`).catch(() => {});
  }
}

module.exports = {
  lineConfigs,
  loadLineRows
};
