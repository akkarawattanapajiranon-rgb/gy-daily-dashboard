import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, btaWasteDb } from './firebase.js';

const snapshotModules = import.meta.glob('../data/snapshots/*.json', { eager: true });

export function getLocalSnapshot(dateStr) {
  if (!dateStr) return null;
  const key = `../data/snapshots/${dateStr}.json`;
  if (snapshotModules[key]) {
    return snapshotModules[key].default || snapshotModules[key];
  }
  return null;
}

const snapshotPromiseCache = {};

export async function getFirebaseSnapshot(dateStr, forceRefresh = false) {
  if (!dateStr) return getLocalSnapshot(dateStr);
  if (forceRefresh) {
    delete snapshotPromiseCache[dateStr];
  } else if (snapshotPromiseCache[dateStr]) {
    return snapshotPromiseCache[dateStr];
  }

  snapshotPromiseCache[dateStr] = (async () => {
    try {
      const docRef = doc(db, 'daily_snapshots', dateStr);
      const snap = await Promise.race([
        getDoc(docRef),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase timeout')), 1500))
      ]);
      if (snap && snap.exists()) {
        const data = snap.data();
        const local = getLocalSnapshot(dateStr);
        return { ...local, ...data, weeklyOee: data?.weeklyOee || local?.weeklyOee };
      }
    } catch (e) {
      console.warn(`Firebase snapshot query for ${dateStr} failed:`, e.message);
    }
    return getLocalSnapshot(dateStr);
  })();

  return snapshotPromiseCache[dateStr];
}

export async function fetchWasteData(dateStr, forceRefresh = false) {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];

  const processReports = (dayReports) => {
    let millingSummary = 0;
    let frictionSummary = 0;
    let beadSummary = 0;
    const millingMap = {};
    const frictionMap = {};
    const beadMap = {};

    dayReports.forEach(report => {
      const w = Number(report.weight) || 0;
      if (w <= 0) return;
      const code = String(report.defectCode || report.materialCode || 'Waste').trim();
      const reason = String(report.defectName || report.cause || code).trim();
      const wasteType = String(report.wasteType || '').trim();
      const materialCode = String(report.materialCode || '').trim();
      const dept = String(report.dept || '').trim();

      let cat = 'Friction';
      const lowerW = wasteType.toLowerCase();
      const lowerDept = dept.toLowerCase();

      if (lowerW === 'milling' || lowerDept.includes('milling')) {
        cat = 'Milling';
      } else if (lowerW === 'bead' || materialCode === 'G' || materialCode === 'A' || lowerDept.includes('bead')) {
        cat = 'Bead';
      } else {
        cat = 'Friction';
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

    const totalW = millingSummary + frictionSummary + beadSummary;

    return {
      millingSummary: Number(millingSummary.toFixed(1)),
      frictionSummary: Number(frictionSummary.toFixed(1)),
      beadSummary: Number(beadSummary.toFixed(1)),
      millingTop,
      frictionTop,
      beadTop,
      dataDate: targetDate,
      hasData: totalW > 0
    };
  };

  // 1. Direct Real-time Firestore Query to gy-waste-report (collection gy_reports)
  try {
    const q = query(collection(btaWasteDb, 'gy_reports'), where('date', '==', targetDate));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const dayReports = [];
      snap.forEach(docSnap => dayReports.push(docSnap.data()));
      const result = processReports(dayReports);
      if (result.hasData) return result;
    }
  } catch (err) {
    console.warn('Direct gy-waste-report Firestore query failed:', err.message);
  }

  // 2. Backup Source: Direct API from https://bta-waste-report.vercel.app/api/get-all-waste
  try {
    let res = await fetchFast('https://bta-waste-report.vercel.app/api/get-all-waste', 2500);
    if (!res.ok) {
      res = await fetchFast('https://bta-waste-report.vercel.app/api/reports', 2500);
    }
    if (res.ok) {
      const reports = await res.json();
      if (Array.isArray(reports)) {
        const dayReports = reports.filter(r => r.date === targetDate);
        if (dayReports.length > 0) {
          const result = processReports(dayReports);
          if (result.hasData) return result;
        }
      }
    }
  } catch (err) {
    console.warn('bta-waste-report API query failed:', err.message);
  }

  // Strict Policy: Do not fall back to local Excel or local snapshots for Waste
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

export async function fetchFast(url, timeoutMs = 2500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function fetchCmsData(dateStr, forceRefresh = false) {
  try {
    let url = '/api/cms';
    if (dateStr) url += `?date=${dateStr}`;
    if (forceRefresh) url += `&_t=${Date.now()}`;
    const res = await fetchFast(url, 2500);
    const contentType = res.headers.get('content-type');
    if (!res.ok || (contentType && contentType.includes('text/html'))) {
      throw new Error('Static HTML response from host');
    }
    return await res.json();
  } catch (err) {
    console.warn('CMS Fetch Timeout/Error, fallback to snapshot:', err.message);
    const snap = await getFirebaseSnapshot(dateStr, forceRefresh);
    if (snap && snap.cms) return snap.cms;
    return null;
  }
}

export async function fetchTarget3Roll(dateStr, forceRefresh = false) {
  try {
    let url = "https://roll-planning-default-rtdb.firebaseio.com/saved_plans.json";
    if (forceRefresh) url += `?_t=${Date.now()}`;
    const res = await fetchFast(url, 2500);
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
    const snap = await getFirebaseSnapshot(dateStr, forceRefresh);
    if (snap && snap.target3Roll !== undefined) return snap.target3Roll;
    return null;
  }
}

export async function fetchBreakdownData(dateStr, forceRefresh = false) {
  try {
    let url = `/api/breakdown?date=${dateStr}`;
    if (forceRefresh) url += `&_t=${Date.now()}`;
    const res = await fetchFast(url, 2500);
    const contentType = res.headers.get('content-type');
    if (!res.ok || (contentType && contentType.includes('text/html'))) throw new Error('Failed breakdown fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr, forceRefresh);
    if (snap && snap.breakdown) return snap.breakdown;
    return null;
  }
}

export async function fetchFischerData(dateStr, forceRefresh = false) {
  try {
    let url = `/api/fischer?date=${dateStr}`;
    if (forceRefresh) url += `&_t=${Date.now()}`;
    const res = await fetchFast(url, 2500);
    const contentType = res.headers.get('content-type');
    if (!res.ok || (contentType && contentType.includes('text/html'))) throw new Error('Failed fischer fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr, forceRefresh);
    if (snap && snap.fischer) return snap.fischer;
    return null;
  }
}

export async function fetch3RollDetail(dateStr, forceRefresh = false) {
  try {
    let url = `/api/3roll?date=${dateStr}`;
    if (forceRefresh) url += `&_t=${Date.now()}`;
    const res = await fetchFast(url, 2500);
    const contentType = res.headers.get('content-type');
    if (!res.ok || (contentType && contentType.includes('text/html'))) throw new Error('Failed 3roll fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr, forceRefresh);
    if (snap && snap.roll3) return snap.roll3;
    return null;
  }
}

export async function fetch4Roll2Detail(dateStr, forceRefresh = false) {
  try {
    let url = `/api/4roll2?date=${dateStr}`;
    if (forceRefresh) url += `&_t=${Date.now()}`;
    const res = await fetchFast(url, 2500);
    const contentType = res.headers.get('content-type');
    if (!res.ok || (contentType && contentType.includes('text/html'))) throw new Error('Failed 4roll2 fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr, forceRefresh);
    if (snap && snap.roll42) return snap.roll42;
    return null;
  }
}

export async function fetchQuadDetail(dateStr, forceRefresh = false) {
  try {
    let url = `/api/quad?date=${dateStr}`;
    if (forceRefresh) url += `&_t=${Date.now()}`;
    const res = await fetchFast(url, 2500);
    const contentType = res.headers.get('content-type');
    if (!res.ok || (contentType && contentType.includes('text/html'))) throw new Error('Failed quad fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr, forceRefresh);
    if (snap && snap.quad) return snap.quad;
    return null;
  }
}

export async function fetchTuberDetail(dateStr, forceRefresh = false) {
  try {
    let url = `/api/tuber?date=${dateStr}`;
    if (forceRefresh) url += `&_t=${Date.now()}`;
    const res = await fetchFast(url, 2500);
    const contentType = res.headers.get('content-type');
    if (!res.ok || (contentType && contentType.includes('text/html'))) throw new Error('Failed tuber fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr, forceRefresh);
    if (snap && snap.tuber) return snap.tuber;
    return null;
  }
}

export async function fetchWorkawayData(dateStr, forceRefresh = false) {
  try {
    let url = `/api/workaway?date=${dateStr}`;
    if (forceRefresh) url += `&_t=${Date.now()}`;
    const res = await fetchFast(url, 2500);
    const contentType = res.headers.get('content-type');
    if (!res.ok || (contentType && contentType.includes('text/html'))) throw new Error('Failed workaway fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr, forceRefresh);
    if (snap && snap.workaway) return snap.workaway;
    return null;
  }
}

export async function fetchWeeklyOeeData(dateStr, forceRefresh = false) {
  try {
    let url = `/api/oee-weekly?date=${dateStr}`;
    if (forceRefresh) url += `&_t=${Date.now()}`;
    const res = await fetchFast(url, 2500);
    const contentType = res.headers.get('content-type');
    if (!res.ok || (contentType && contentType.includes('text/html'))) throw new Error('Failed weekly oee fetch');
    return await res.json();
  } catch (err) {
    const snap = await getFirebaseSnapshot(dateStr, forceRefresh);
    if (snap && snap.weeklyOee) return snap.weeklyOee;
    const local = getLocalSnapshot(dateStr);
    if (local && local.weeklyOee) return local.weeklyOee;
    return null;
  }
}






