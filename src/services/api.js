import { mockData } from '../data/mockData';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchWasteData(dateStr) {
  try {
    let targetDate = dateStr;
    
    // If no date provided, fetch the latest record to determine the date
    if (!targetDate) {
      const qLatest = query(collection(db, 'gy_reports'), orderBy('createdAt', 'desc'), limit(1));
      const snapLatest = await getDocs(qLatest);
      if (!snapLatest.empty) {
        targetDate = snapLatest.docs[0].data().date;
      } else {
        targetDate = new Date().toISOString().split('T')[0]; // fallback to today
      }
    }

    // Query documents for the target date
    const q = query(collection(db, 'gy_reports'), where('date', '==', targetDate));
    const snapshot = await getDocs(q);
    
    const recentReports = [];
    snapshot.forEach(doc => recentReports.push(doc.data()));

    let millingSummary = 0;
    let frictionSummary = 0;
    const millingMap = {};
    const frictionMap = {};

    recentReports.forEach(report => {
      const w = Number(report.weight) || 0;
      const key = report.defectCode;
      const reason = report.defectName || 'Unknown';

      if (report.wasteType === 'Milling') {
        millingSummary += w;
        if (!millingMap[key]) millingMap[key] = { code: key, amount: 0, reason };
        millingMap[key].amount += w;
      } else {
        frictionSummary += w;
        if (!frictionMap[key]) frictionMap[key] = { code: key, amount: 0, reason };
        frictionMap[key].amount += w;
      }
    });

    // Sort and get top 5
    const millingTop = Object.values(millingMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
    const frictionTop = Object.values(frictionMap).sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Mark high values (e.g. top 2)
    millingTop.forEach((item, index) => { item.isHigh = index < 2; });
    frictionTop.forEach((item, index) => { item.isHigh = index < 2; });

    return {
      millingSummary: Number(millingSummary.toFixed(1)),
      frictionSummary: Number(frictionSummary.toFixed(1)),
      millingTop,
      frictionTop,
      dataDate: targetDate
    };
  } catch (err) {
    console.error('Firebase Fetch Error:', err);
    return mockData.wasteReport;
  }
}

export async function fetchCmsData(dateStr) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

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
    console.error('CMS Fetch Error:', err);
    return null; // Return null so App.jsx handles fallback via mock state if needed, though App.jsx does partial update
  }
}

export async function fetchTarget3Roll(dateStr) {
  try {
    const res = await fetch("https://roll-planning-default-rtdb.firebaseio.com/saved_plans.json");
    if (!res.ok) throw new Error('Failed to fetch target 3 roll data');
    
    const plansData = await res.json();
    let totalRolls = 0;
    
    // plansData might be an object or array depending on how it was saved in RTDB.
    // If it's an object with push IDs as keys, convert to array.
    const plans = Array.isArray(plansData) ? plansData : Object.values(plansData || {});

    // Find the plan for the selected date
    const targetPlan = plans.find(plan => plan.date === dateStr);
    
    if (targetPlan && targetPlan.jobs) {
      totalRolls = targetPlan.jobs.reduce((sum, item) => sum + (Number(item.rolls) || 0), 0);
    }
    
    return totalRolls;
  } catch (err) {
    console.error('Target 3 Roll Fetch Error:', err);
    return null;
  }
}

export async function fetchBreakdownData(dateStr) {
  try {
    const url = `/api/breakdown?date=${dateStr}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Breakdown Fetch Error:', err);
    return null;
  }
}

