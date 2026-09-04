import { mockData } from '../data/mockData';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function getFirebaseSnapshot(dateStr) {
  try {
    const docRef = doc(db, 'daily_snapshots', dateStr);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn(`Firebase snapshot query for ${dateStr} failed:`, e.message);
  }
  return null;
}

export async function fetchWasteData(dateStr) {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];

  // 1. Primary Source: Direct query to Firestore collection 'gy_reports' (same DB as bta-waste-report.vercel.app)
  try {
    const q = query(collection(db, 'gy_reports'), where('date', '==', targetDate));
    const snap = await getDocs(q);
    if (!snap.empty) {
      let millingSummary = 0;
      let frictionSummary = 0;
      let beadSummary = 0;
      const millingMap = {};
      const frictionMap = {};
      const beadMap = {};

      snap.forEach(doc => {
        const report = doc.data();
        const w = Number(report.weight) || 0;
        const code = String(report.defectCode || report.materialCode || 'Waste').trim();
        const reason = String(report.defectName || report.cause || code).trim();
        const wasteType = String(report.wasteType || '').trim();
        const materialCode = String(report.materialCode || '').trim();
        const dept = String(report.dept || '').trim();

        let cat = 'Friction';
        if (wasteType.toLowerCase() === 'milling') {
          cat = 'Milling';
        } else {
          if (materialCode === 'G' || materialCode === 'A' || wasteType.toLowerCase() === 'bead') {
            cat = 'Bead';
          } else {
            cat = 'Friction';
          }
        }

        if (cat === 'Bead') {
          beadSummary += w;
          if (!beadMap[code]) beadMap[code] = { code, amount: 0, reason };
          beadMap[code].amount += w;
        } else if (cat === 'Milling') {
          millingSummary += w;
          if (!millingMap[code]) millingMap[code] = { code, amount: 0, reason };
          millingMap[code].amount += w;
        } else {
          frictionSummary += w;
          if (!frictionMap[code]) frictionMap[code] = { code, amount: 0, reason };
          frictionMap[code].amount += w;
        }
      });

      const millingTop = Object.values(millingMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
      const frictionTop = Object.values(frictionMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
      const beadTop = Object.values(beadMap).sort((a, b) => b.amount - a.amount).slice(0, 5);

      millingTop.forEach((item, index) => { item.isHigh = index < 2; });
      frictionTop.forEach((item, index) => { item.isHigh = index < 2; });
      beadTop.forEach((item, index) => { item.isHigh = index < 2; });

      return {
        millingSummary: Number(millingSummary.toFixed(1)),
        frictionSummary: Number(frictionSummary.toFixed(1)),
        beadSummary: Number(beadSummary.toFixed(1)),
        millingTop,
        frictionTop,
        beadTop,
        dataDate: targetDate,
        hasData: true
      };
    }
  } catch (fsErr) {
    console.warn('Direct Firestore query failed, falling back to backend server...', fsErr.message);
  }

  // 2. Secondary Source: Local Express backend (/api/waste?date=...)
  try {
    const res = await fetch(`/api/waste?date=${targetDate}`);
    if (res.ok) {
      const data = await res.json();
      if (data && !data.error && data.hasData) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend waste fetch failed, attempting Vercel API query...', err.message);
  }

  // 3. Fallback: Firebase Snapshot
  const snapshot = await getFirebaseSnapshot(targetDate);
  if (snapshot && snapshot.waste) {
    return snapshot.waste;
  }

  // 4. Fallback: Fetch from Vercel API endpoint (/api/reports)
  try {
    let reports = null;
    try {
      const gRes = await fetch('https://bta-waste-report.vercel.app/api/get-all-waste');
      if (gRes.ok) {
        const json = await gRes.json();
        reports = Array.isArray(json) ? json : (json.reports || json.data || json.waste || null);
      }
    } catch (gErr) {}

    if (!reports || !Array.isArray(reports)) {
      const rRes = await fetch('https://bta-waste-report.vercel.app/api/reports');
      if (rRes.ok) {
        const json = await rRes.json();
        reports = Array.isArray(json) ? json : null;
      }
    }

    if (Array.isArray(reports)) {
      const dayReports = reports.filter(r => r.date === targetDate);
      if (dayReports.length > 0) {
        let millingSummary = 0;
        let frictionSummary = 0;
        let beadSummary = 0;
        const millingMap = {};
        const frictionMap = {};
        const beadMap = {};

        dayReports.forEach(report => {
          const w = Number(report.weight) || 0;
          const code = String(report.defectCode || report.materialCode || 'Waste').trim();
          const reason = String(report.defectName || report.cause || code).trim();
          const wasteType = String(report.wasteType || '').trim();
          const materialCode = String(report.materialCode || '').trim();
          const dept = String(report.dept || '').trim();

          let cat = 'Friction';
          if (wasteType.toLowerCase() === 'milling') {
            cat = 'Milling';
          } else {
            if (materialCode === 'G' || materialCode === 'A' || wasteType.toLowerCase() === 'bead') {
              cat = 'Bead';
            } else {
              cat = 'Friction';
            }
          }

          if (cat === 'Bead') {
            beadSummary += w;
            if (!beadMap[code]) beadMap[code] = { code, amount: 0, reason };
            beadMap[code].amount += w;
          } else if (cat === 'Milling') {
            millingSummary += w;
            if (!millingMap[code]) millingMap[code] = { code, amount: 0, reason };
            millingMap[code].amount += w;
          } else {
            frictionSummary += w;
            if (!frictionMap[code]) frictionMap[code] = { code, amount: 0, reason };
            frictionMap[code].amount += w;
          }
        });

        const millingTop = Object.values(millingMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
        const frictionTop = Object.values(frictionMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
        const beadTop = Object.values(beadMap).sort((a, b) => b.amount - a.amount).slice(0, 5);

        millingTop.forEach((item, index) => { item.isHigh = index < 2; });
        frictionTop.forEach((item, index) => { item.isHigh = index < 2; });
        beadTop.forEach((item, index) => { item.isHigh = index < 2; });

        return {
          millingSummary: Number(millingSummary.toFixed(1)),
          frictionSummary: Number(frictionSummary.toFixed(1)),
          beadSummary: Number(beadSummary.toFixed(1)),
          millingTop,
          frictionTop,
          beadTop,
          dataDate: targetDate,
          hasData: true
        };
      }
    }
  } catch (vErr) {
    console.warn('Vercel waste fetch failed:', vErr.message);
  }

  return {
    millingSummary: 0,
    frictionSummary: 0,
    beadSummary: 0,
    millingTop: [],
    frictionTop: [],
    beadTop: [],
    dataDate: targetDate,
    hasData: false
  };
}

export async function fetchCmsData(dateStr) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    let url = '/api/cms';
    if (dateStr) {
      url += `?date=${dateStr}`;
    }
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error('Failed to fetch CMS proxy data');
    
    return await res.json();
  } catch (err) {
    console.warn('CMS Fetch Error, checking Firebase snapshot...', err.message);
    const snap = await getFirebaseSnapshot(dateStr);
    if (snap && snap.cms) return snap.cms;
    return null;
  }
}

export async function fetchTarget3Roll(dateStr) {
  try {
    const res = await fetch("https://roll-planning-default-rtdb.firebaseio.com/saved_plans.json");
    if (!res.ok) throw new Error('Failed to fetch target 3 roll data');
    
    const plansData = await res.json();
    let totalRolls = 0;
    const plans = Array.isArray(plansData) ? plansData : Object.values(plansData || {});
    const targetPlan = plans.find(plan => plan.date === dateStr);
    
    if (targetPlan && targetPlan.jobs) {
      totalRolls = targetPlan.jobs.reduce((sum, item) => sum + (Number(item.rolls) || 0), 0);
    }
    
    return totalRolls;
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr);
    if (snap && snap.target3Roll !== undefined) return snap.target3Roll;
    return null;
  }
}

export async function fetchBreakdownData(dateStr) {
  try {
    const url = `/api/breakdown?date=${dateStr}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed breakdown fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr);
    if (snap && snap.breakdown) return snap.breakdown;
    return null;
  }
}

export async function fetchFischerData(dateStr) {
  try {
    const url = `/api/fischer?date=${dateStr}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed fischer fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr);
    if (snap && snap.fischer) return snap.fischer;
    return null;
  }
}

export async function fetch3RollDetail(dateStr) {
  try {
    const url = `/api/3roll?date=${dateStr}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed 3roll fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr);
    if (snap && snap.roll3) return snap.roll3;
    return null;
  }
}

export async function fetchQuadDetail(dateStr) {
  try {
    const url = `/api/quad?date=${dateStr}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed quad fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr);
    if (snap && snap.quad) return snap.quad;
    return null;
  }
}

export async function fetchTuberDetail(dateStr) {
  try {
    const url = `/api/tuber?date=${dateStr}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed tuber fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr);
    if (snap && snap.tuber) return snap.tuber;
    return null;
  }
}

export async function fetchWorkawayData(dateStr) {
  try {
    const url = `/api/workaway?date=${dateStr}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed workaway fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr);
    if (snap && snap.workaway) return snap.workaway;
    return null;
  }
}

export async function fetchWeeklyOeeData(dateStr) {
  try {
    const url = `/api/oee-weekly?date=${dateStr}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed weekly oee fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr);
    if (snap && snap.weeklyOee) return snap.weeklyOee;
    return null;
  }
}






