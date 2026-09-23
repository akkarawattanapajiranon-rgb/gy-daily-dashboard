import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const startDate = req.query.startDate || req.query.date || new Date().toISOString().split('T')[0];
  const endDate = req.query.endDate || startDate;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];

    const curr = new Date(start);
    let count = 0;
    while (curr <= end && count < 60) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
      curr.setDate(curr.getDate() + 1);
      count++;
    }

    const rows = dates.map(dStr => {
      let snap = {};
      const possiblePaths = [
        path.join(process.cwd(), 'src', 'data', 'snapshots', `${dStr}.json`),
        path.join(process.cwd(), 'server', 'snapshots', `${dStr}.json`),
        path.join(process.cwd(), 'dist', 'data', 'snapshots', `${dStr}.json`),
      ];
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          try {
            snap = JSON.parse(fs.readFileSync(p, 'utf8'));
            break;
          } catch (e) {}
        }
      }

      const cms = snap.cms || {};
      const quad = snap.quad || {};
      const tuber = snap.tuber || {};
      const fischer = snap.fischer || {};
      const bd = snap.breakdown || {};
      const waste = snap.waste || {};

      const batch1 = Number(cms.mixing1?.batch) || 0;
      const batch2 = Number(cms.mixing2?.batch) || 0;

      return {
        date: dStr,
        mixerBatchmix: batch1 + batch2,
        mixerOee2: Number(Number(cms.totalOee2 || 0).toFixed(2)),
        quadOee2: Number(Number(quad.oee?.oee2_pct || 0).toFixed(2)),
        tuberOee2: Number(Number(tuber.oee?.oee2_pct || 0).toFixed(2)),
        fischerOee2: Number(Number(fischer.oee?.oee2_pct || 0).toFixed(2)),
        bdMixer: Number(Number(bd.Banbury?.actual_bd_pct || 0).toFixed(4)),
        bdExtruder: Number(Number(bd.Extruder?.actual_bd_pct || 0).toFixed(4)),
        bdCalender: Number(Number(bd.Calender?.actual_bd_pct || 0).toFixed(4)),
        bdCutting: Number(Number(bd.Cutting?.actual_bd_pct || 0).toFixed(4)),
        frictionWaste: Number(Number(waste.frictionSummary || 0).toFixed(2)),
        millingWaste: Number(Number(waste.millingSummary || 0).toFixed(2)),
        targets: {
          mixerBatchmix: 1300,
          mixerOee2: 76.6,
          quadOee2: 62.0,
          tuberOee2: 62.0,
          fischerOee2: 60.0,
          bdMixer: Number(Number(bd.Banbury?.target_bd_pct || 0.5827).toFixed(4)),
          bdExtruder: Number(Number(bd.Extruder?.target_bd_pct || 0.5098).toFixed(4)),
          bdCalender: Number(Number(bd.Calender?.target_bd_pct || 0.4662).toFixed(4)),
          bdCutting: Number(Number(bd.Cutting?.target_bd_pct || 0.1166).toFixed(4)),
          frictionWaste: 285,
          millingWaste: 265
        }
      };
    });

    res.status(200).json({ startDate, endDate, totalDays: rows.length, rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
