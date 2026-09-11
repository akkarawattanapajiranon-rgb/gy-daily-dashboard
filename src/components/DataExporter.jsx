import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Copy, Calendar, RefreshCw, CheckCircle2, Table, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getFirebaseSnapshot, getLocalSnapshot, fetchFast } from '../services/api.js';

export const METRIC_TARGETS = {
  mixerBatchmix: { target: 1300, type: 'higher', unit: '', label: '≥ 1,300' },
  mixerOee2: { target: 76.6, type: 'higher', unit: '%', label: '≥ 76.6%' },
  quadOee2: { target: 62.0, type: 'higher', unit: '%', label: '≥ 62.0%' },
  tuberOee2: { target: 62.0, type: 'higher', unit: '%', label: '≥ 62.0%' },
  fischerOee2: { target: 60.0, type: 'higher', unit: '%', label: '≥ 60.0%' },
  bdMixer: { target: 0.5827, type: 'lower', unit: '%', label: '≤ 0.58%' },
  bdExtruder: { target: 0.5098, type: 'lower', unit: '%', label: '≤ 0.51%' },
  bdCalender: { target: 0.4662, type: 'lower', unit: '%', label: '≤ 0.47%' },
  bdCutting: { target: 0.1166, type: 'lower', unit: '%', label: '≤ 0.12%' },
  frictionWaste: { target: 285, type: 'lower', unit: 'kg', label: '≤ 285 kg' },
  millingWaste: { target: 265, type: 'lower', unit: 'kg', label: '≤ 265 kg' },
};

export function getStatusColor(metricKey, value, customTarget = null) {
  const config = METRIC_TARGETS[metricKey];
  if (!config || value === null || value === undefined || value === '') {
    return { text: 'text-slate-700', bg: '', isGreen: false, isRed: false };
  }

  const num = Number(value);
  if (isNaN(num)) {
    return { text: 'text-slate-700', bg: '', isGreen: false, isRed: false };
  }

  const target = customTarget !== null && customTarget !== undefined ? Number(customTarget) : config.target;
  const isMet = config.type === 'higher' ? num >= target : num <= target;

  if (isMet) {
    return {
      text: 'text-emerald-700 font-black',
      bg: 'bg-emerald-50/60',
      isGreen: true,
      isRed: false,
    };
  } else {
    return {
      text: 'text-rose-600 font-black',
      bg: 'bg-rose-50/60',
      isGreen: false,
      isRed: true,
    };
  }
}

export default function DataExporter() {
  const todayStr = new Date().toISOString().split('T')[0];

  const getInitialDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');

    const start = `${yyyy}-${mm}-01`;
    const end = `${yyyy}-${mm}-${dd}`;
    return { start, end };
  };

  const initialDates = getInitialDates();
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [dataRows, setDataRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchExportData = async (start, end, force = false) => {
    setLoading(true);
    try {
      const url = `/api/export-metrics?startDate=${start}&endDate=${end}${force ? '&refresh=true' : ''}`;
      const res = await fetchFast(url, 5000);
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.rows && json.rows.length > 0) {
          setDataRows(json.rows);
          return;
        }
      }
      throw new Error('API unavailable, falling back to snapshots');
    } catch (err) {
      console.warn('Falling back to snapshot metrics calculation:', err.message);
      const dates = [];
      const sDate = new Date(start);
      const eDate = new Date(end);
      const curr = new Date(sDate);
      let count = 0;
      while (curr <= eDate && count < 60) {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, '0');
        const dd = String(curr.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
        curr.setDate(curr.getDate() + 1);
        count++;
      }

      const rows = await Promise.all(dates.map(async (dStr) => {
        const snap = (await getFirebaseSnapshot(dStr)) || getLocalSnapshot(dStr) || {};
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
      }));

      setDataRows(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExportData(startDate, endDate);
  }, [startDate, endDate]);

  const handlePresetSelect = (presetKey) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');

    if (presetKey === '1-3') {
      setStartDate(`${yyyy}-${mm}-01`);
      setEndDate(`${yyyy}-${mm}-03`);
    } else if (presetKey === '4-7') {
      setStartDate(`${yyyy}-${mm}-04`);
      setEndDate(`${yyyy}-${mm}-07`);
    } else if (presetKey === '7days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 6);
      const pastStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
      setStartDate(pastStr);
      setEndDate(todayStr);
    } else if (presetKey === 'month') {
      setStartDate(`${yyyy}-${mm}-01`);
      const lastDay = new Date(yyyy, today.getMonth() + 1, 0).getDate();
      setEndDate(`${yyyy}-${mm}-${String(lastDay).padStart(2, '0')}`);
    } else if (presetKey === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    }
  };

  // 1. Download Excel (.xlsx)
  const downloadExcel = () => {
    if (dataRows.length === 0) return;

    const formattedData = dataRows.map(r => ({
      'Date (วันที่)': r.date,
      'Mixer-Batchmix (Batches)': r.mixerBatchmix,
      'Mixer-OEE2 (%)': r.mixerOee2,
      'Quad-OEE2 (%)': r.quadOee2,
      'Tuber-OEE2 (%)': r.tuberOee2,
      'Ficher-OEE2 (%)': r.fischerOee2,
      'BD-Mixer (%)': r.bdMixer,
      'BD-Extruder (%)': r.bdExtruder,
      'BD-Calender (%)': r.bdCalender,
      'BD-Cutting (%)': r.bdCutting,
      'Friction Waste (kg)': r.frictionWaste,
      'Milling Waste (kg)': r.millingWaste
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Operational Metrics');
    XLSX.writeFile(wb, `Operational_Metrics_${startDate}_to_${endDate}.xlsx`);
  };

  // 2. Download CSV (.csv) with UTF-8 BOM
  const downloadCSV = () => {
    if (dataRows.length === 0) return;

    const headers = [
      'Date', 'Mixer-Batchmix', 'Mixer-OEE2', 'Quad-OEE2', 'Tuber-OEE2', 'Ficher-OEE2',
      'BD-Mixer', 'BD-Extruder', 'BD-Calender', 'BD-Cutting', 'Friction Waste', 'Milling Waste'
    ];

    const csvRows = [headers.join(',')];
    dataRows.forEach(r => {
      csvRows.push([
        r.date, r.mixerBatchmix, r.mixerOee2, r.quadOee2, r.tuberOee2, r.fischerOee2,
        r.bdMixer, r.bdExtruder, r.bdCalender, r.bdCutting, r.frictionWaste, r.millingWaste
      ].join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Operational_Metrics_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Copy to Clipboard TSV (Tab separated for easy Excel paste)
  const copyToClipboard = () => {
    if (dataRows.length === 0) return;

    const headers = [
      'Date', 'Mixer-Batchmix', 'Mixer-OEE2', 'Quad-OEE2', 'Tuber-OEE2', 'Ficher-OEE2',
      'BD-Mixer', 'BD-Extruder', 'BD-Calender', 'BD-Cutting', 'Friction Waste', 'Milling Waste'
    ];

    const rows = [headers.join('\t')];
    dataRows.forEach(r => {
      rows.push([
        r.date, r.mixerBatchmix, r.mixerOee2, r.quadOee2, r.tuberOee2, r.fischerOee2,
        r.bdMixer, r.bdExtruder, r.bdCalender, r.bdCutting, r.frictionWaste, r.millingWaste
      ].join('\t'));
    });

    navigator.clipboard.writeText(rows.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Averages / Totals calculation for Summary Row
  const totalDays = dataRows.length || 1;
  const totalBatch = Math.round(dataRows.reduce((a, b) => a + b.mixerBatchmix, 0));
  const avgBatch = Math.round(totalBatch / totalDays);
  const avgMixerOee = (dataRows.reduce((a, b) => a + b.mixerOee2, 0) / totalDays).toFixed(1);
  const avgQuadOee = (dataRows.reduce((a, b) => a + b.quadOee2, 0) / totalDays).toFixed(1);
  const avgTuberOee = (dataRows.reduce((a, b) => a + b.tuberOee2, 0) / totalDays).toFixed(1);
  const avgFischerOee = (dataRows.reduce((a, b) => a + b.fischerOee2, 0) / totalDays).toFixed(1);
  const avgBdMixer = (dataRows.reduce((a, b) => a + b.bdMixer, 0) / totalDays).toFixed(2);
  const avgBdExtruder = (dataRows.reduce((a, b) => a + b.bdExtruder, 0) / totalDays).toFixed(2);
  const avgBdCalender = (dataRows.reduce((a, b) => a + b.bdCalender, 0) / totalDays).toFixed(2);
  const avgBdCutting = (dataRows.reduce((a, b) => a + b.bdCutting, 0) / totalDays).toFixed(2);
  const totalFrictionWaste = (dataRows.reduce((a, b) => a + b.frictionWaste, 0)).toFixed(1);
  const avgFrictionWaste = (Number(totalFrictionWaste) / totalDays).toFixed(1);
  const totalMillingWaste = (dataRows.reduce((a, b) => a + b.millingWaste, 0)).toFixed(1);
  const avgMillingWaste = (Number(totalMillingWaste) / totalDays).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl backdrop-blur-md">
                <FileSpreadsheet className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                  Operational Data Exporter
                  <span className="text-xs font-bold px-2.5 py-1 bg-blue-500/30 text-blue-300 rounded-full border border-blue-400/30">
                    11 Core Metrics
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-blue-200/80 mt-1">
                  ดาวน์โหลดข้อมูลตัวเลขการผลิต OEE, Breakdown และ Waste เลือกช่วงวันที่ได้ตามต้องการ
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadExcel}
              disabled={loading || dataRows.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              onClick={downloadCSV}
              disabled={loading || dataRows.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>CSV (.csv)</span>
            </button>
            <button
              onClick={copyToClipboard}
              disabled={loading || dataRows.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-blue-400" />}
              <span>{copied ? 'คัดลอกแล้ว!' : 'Copy Table'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Filter Bar & Quick Select */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1">เลือกด่วน (Quick Presets):</span>
          <button
            onClick={() => handlePresetSelect('1-3')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            วันที่ 1 - 3
          </button>
          <button
            onClick={() => handlePresetSelect('4-7')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            วันที่ 4 - 7
          </button>
          <button
            onClick={() => handlePresetSelect('7days')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            ย้อนหลัง 7 วัน
          </button>
          <button
            onClick={() => handlePresetSelect('month')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            ทั้งเดือนนี้ (MTD)
          </button>
          <button
            onClick={() => handlePresetSelect('today')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            วันนี้ (Today)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">From Date (เริ่มต้น):</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">To Date (สิ้นสุด):</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <button
            onClick={() => fetchExportData(startDate, endDate)}
            className="self-end px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm mb-0.5 flex items-center gap-1.5 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>ดึงข้อมูล</span>
          </button>
        </div>
      </div>

      {/* Interactive Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-600" />
            <h2 className="font-extrabold text-slate-800 text-sm">
              Data Preview ({startDate} ถึง {endDate} - รวม {dataRows.length} วัน)
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              ตาม Target (เขียว)
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              ไม่ถึง / เกิน Target (แดง)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 pl-4 sticky left-0 bg-slate-900 z-10 min-w-[100px]">Date</th>
                <th className="p-3 text-right bg-blue-950 text-blue-200 min-w-[115px]">
                  <div>Mixer-Batchmix</div>
                  <div className="text-[9px] font-normal text-emerald-300 normal-case">Target ≥ 1,300</div>
                </th>
                <th className="p-3 text-right bg-blue-900 text-blue-200 min-w-[105px]">
                  <div>Mixer-OEE2</div>
                  <div className="text-[9px] font-normal text-blue-300 normal-case">Target ≥ 76.6%</div>
                </th>
                <th className="p-3 text-right min-w-[100px]">
                  <div>Quad-OEE2</div>
                  <div className="text-[9px] font-normal text-slate-300 normal-case">Target ≥ 62.0%</div>
                </th>
                <th className="p-3 text-right min-w-[100px]">
                  <div>Tuber-OEE2</div>
                  <div className="text-[9px] font-normal text-slate-300 normal-case">Target ≥ 62.0%</div>
                </th>
                <th className="p-3 text-right min-w-[105px]">
                  <div>Ficher-OEE2</div>
                  <div className="text-[9px] font-normal text-slate-300 normal-case">Target ≥ 60.0%</div>
                </th>
                <th className="p-3 text-right bg-rose-950 text-rose-200 min-w-[95px]">
                  <div>BD-Mixer</div>
                  <div className="text-[9px] font-normal text-rose-300 normal-case">Target ≤ 0.58%</div>
                </th>
                <th className="p-3 text-right bg-rose-900 text-rose-200 min-w-[100px]">
                  <div>BD-Extruder</div>
                  <div className="text-[9px] font-normal text-rose-300 normal-case">Target ≤ 0.51%</div>
                </th>
                <th className="p-3 text-right bg-rose-900 text-rose-200 min-w-[100px]">
                  <div>BD-Calender</div>
                  <div className="text-[9px] font-normal text-rose-300 normal-case">Target ≤ 0.47%</div>
                </th>
                <th className="p-3 text-right bg-rose-900 text-rose-200 min-w-[95px]">
                  <div>BD-Cutting</div>
                  <div className="text-[9px] font-normal text-rose-300 normal-case">Target ≤ 0.12%</div>
                </th>
                <th className="p-3 text-right bg-amber-950 text-amber-200 min-w-[115px]">
                  <div>Friction Waste</div>
                  <div className="text-[9px] font-normal text-amber-300 normal-case">Target ≤ 285 kg</div>
                </th>
                <th className="p-3 text-right bg-amber-900 text-amber-200 pr-4 min-w-[110px]">
                  <div>Milling Waste</div>
                  <div className="text-[9px] font-normal text-amber-300 normal-case">Target ≤ 265 kg</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {dataRows.map((r) => {
                const cBatch = getStatusColor('mixerBatchmix', r.mixerBatchmix, r.targets?.mixerBatchmix);
                const cMixerOee = getStatusColor('mixerOee2', r.mixerOee2, r.targets?.mixerOee2);
                const cQuadOee = getStatusColor('quadOee2', r.quadOee2, r.targets?.quadOee2);
                const cTuberOee = getStatusColor('tuberOee2', r.tuberOee2, r.targets?.tuberOee2);
                const cFischerOee = getStatusColor('fischerOee2', r.fischerOee2, r.targets?.fischerOee2);
                const cBdMixer = getStatusColor('bdMixer', r.bdMixer, r.targets?.bdMixer);
                const cBdExtruder = getStatusColor('bdExtruder', r.bdExtruder, r.targets?.bdExtruder);
                const cBdCalender = getStatusColor('bdCalender', r.bdCalender, r.targets?.bdCalender);
                const cBdCutting = getStatusColor('bdCutting', r.bdCutting, r.targets?.bdCutting);
                const cFriction = getStatusColor('frictionWaste', r.frictionWaste, r.targets?.frictionWaste);
                const cMilling = getStatusColor('millingWaste', r.millingWaste, r.targets?.millingWaste);

                return (
                  <tr key={r.date} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 pl-4 font-bold text-slate-800 sticky left-0 bg-white shadow-sm">
                      {r.date}
                    </td>
                    <td className={`p-3 text-right ${cBatch.text} ${cBatch.bg}`}>
                      {r.mixerBatchmix.toLocaleString()}
                    </td>
                    <td className={`p-3 text-right ${cMixerOee.text} ${cMixerOee.bg}`}>
                      {r.mixerOee2}%
                    </td>
                    <td className={`p-3 text-right ${cQuadOee.text} ${cQuadOee.bg}`}>
                      {r.quadOee2}%
                    </td>
                    <td className={`p-3 text-right ${cTuberOee.text} ${cTuberOee.bg}`}>
                      {r.tuberOee2}%
                    </td>
                    <td className={`p-3 text-right ${cFischerOee.text} ${cFischerOee.bg}`}>
                      {r.fischerOee2}%
                    </td>
                    <td className={`p-3 text-right ${cBdMixer.text} ${cBdMixer.bg}`}>
                      {r.bdMixer}%
                    </td>
                    <td className={`p-3 text-right ${cBdExtruder.text} ${cBdExtruder.bg}`}>
                      {r.bdExtruder}%
                    </td>
                    <td className={`p-3 text-right ${cBdCalender.text} ${cBdCalender.bg}`}>
                      {r.bdCalender}%
                    </td>
                    <td className={`p-3 text-right ${cBdCutting.text} ${cBdCutting.bg}`}>
                      {r.bdCutting}%
                    </td>
                    <td className={`p-3 text-right ${cFriction.text} ${cFriction.bg}`}>
                      {r.frictionWaste} kg
                    </td>
                    <td className={`p-3 text-right pr-4 ${cMilling.text} ${cMilling.bg}`}>
                      {r.millingWaste} kg
                    </td>
                  </tr>
                );
              })}

              {/* Summary Row */}
              {dataRows.length > 0 && (
                <tr className="bg-slate-900 text-white font-extrabold border-t-2 border-slate-700">
                  <td className="p-3 pl-4 sticky left-0 bg-slate-900 shadow-sm text-emerald-400">
                    Average / Total
                  </td>
                  <td className={`p-3 text-right ${avgBatch >= 1300 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    <div>{totalBatch.toLocaleString()} (Total)</div>
                    <div className="text-[10px] font-normal text-slate-300">เฉลี่ย {avgBatch.toLocaleString()}/วัน</div>
                  </td>
                  <td className={`p-3 text-right ${Number(avgMixerOee) >= 76.6 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {avgMixerOee}%
                  </td>
                  <td className={`p-3 text-right ${Number(avgQuadOee) >= 62.0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {avgQuadOee}%
                  </td>
                  <td className={`p-3 text-right ${Number(avgTuberOee) >= 62.0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {avgTuberOee}%
                  </td>
                  <td className={`p-3 text-right ${Number(avgFischerOee) >= 60.0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {avgFischerOee}%
                  </td>
                  <td className={`p-3 text-right ${Number(avgBdMixer) <= 0.5827 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {avgBdMixer}%
                  </td>
                  <td className={`p-3 text-right ${Number(avgBdExtruder) <= 0.5098 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {avgBdExtruder}%
                  </td>
                  <td className={`p-3 text-right ${Number(avgBdCalender) <= 0.4662 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {avgBdCalender}%
                  </td>
                  <td className={`p-3 text-right ${Number(avgBdCutting) <= 0.1166 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {avgBdCutting}%
                  </td>
                  <td className={`p-3 text-right ${Number(avgFrictionWaste) <= 285 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    <div>{totalFrictionWaste} kg</div>
                    <div className="text-[10px] font-normal text-slate-300">เฉลี่ย {avgFrictionWaste} kg/วัน</div>
                  </td>
                  <td className={`p-3 text-right pr-4 ${Number(avgMillingWaste) <= 265 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    <div>{totalMillingWaste} kg</div>
                    <div className="text-[10px] font-normal text-slate-300">เฉลี่ย {avgMillingWaste} kg/วัน</div>
                  </td>
                </tr>
              )}

              {dataRows.length === 0 && !loading && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400 font-semibold">
                    ไม่พบข้อมูลในช่วงวันที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
