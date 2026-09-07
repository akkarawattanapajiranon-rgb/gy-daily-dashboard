import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Copy, Calendar, RefreshCw, CheckCircle2, Table, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DataExporter() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-07');
  const [dataRows, setDataRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchExportData = async (start, end) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/export-metrics?startDate=${start}&endDate=${end}`);
      if (res.ok) {
        const json = await res.json();
        setDataRows(json.rows || []);
      } else {
        console.error('Failed to fetch export metrics');
      }
    } catch (err) {
      console.error('Error fetching export metrics:', err);
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
  const avgBatch = Math.round(dataRows.reduce((a, b) => a + b.mixerBatchmix, 0));
  const avgMixerOee = (dataRows.reduce((a, b) => a + b.mixerOee2, 0) / totalDays).toFixed(1);
  const avgQuadOee = (dataRows.reduce((a, b) => a + b.quadOee2, 0) / totalDays).toFixed(1);
  const avgTuberOee = (dataRows.reduce((a, b) => a + b.tuberOee2, 0) / totalDays).toFixed(1);
  const avgFischerOee = (dataRows.reduce((a, b) => a + b.fischerOee2, 0) / totalDays).toFixed(1);
  const avgBdMixer = (dataRows.reduce((a, b) => a + b.bdMixer, 0) / totalDays).toFixed(2);
  const avgBdExtruder = (dataRows.reduce((a, b) => a + b.bdExtruder, 0) / totalDays).toFixed(2);
  const avgBdCalender = (dataRows.reduce((a, b) => a + b.bdCalender, 0) / totalDays).toFixed(2);
  const avgBdCutting = (dataRows.reduce((a, b) => a + b.bdCutting, 0) / totalDays).toFixed(2);
  const totalFrictionWaste = (dataRows.reduce((a, b) => a + b.frictionWaste, 0)).toFixed(1);
  const totalMillingWaste = (dataRows.reduce((a, b) => a + b.millingWaste, 0)).toFixed(1);

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
          </div>
        </div>
      </div>

      {/* Date Range Selector Control Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-extrabold text-sm text-slate-800">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>ระบุช่วงวันที่ต้องการดึงข้อมูล (Select Date Range):</span>
        </div>

        {/* Custom Date Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">From Date (เริ่ม):</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <span className="text-slate-400 font-bold self-end mb-2.5">ถึง</span>
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
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-600" />
            <h2 className="font-extrabold text-slate-800 text-sm">
              Data Preview ({startDate} ถึง {endDate} - รวม {dataRows.length} วัน)
            </h2>
          </div>
          <div className="text-xs font-semibold text-slate-400">
            แสดงข้อมูล 11 ตัวเลขตามหัวข้อที่เลือก
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 pl-4 sticky left-0 bg-slate-900 z-10 min-w-[100px]">Date</th>
                <th className="p-3 text-right bg-blue-950 text-blue-200 min-w-[110px]">Mixer-Batchmix</th>
                <th className="p-3 text-right bg-blue-900 text-blue-200 min-w-[100px]">Mixer-OEE2</th>
                <th className="p-3 text-right min-w-[95px]">Quad-OEE2</th>
                <th className="p-3 text-right min-w-[95px]">Tuber-OEE2</th>
                <th className="p-3 text-right min-w-[100px]">Ficher-OEE2</th>
                <th className="p-3 text-right bg-rose-950 text-rose-200 min-w-[90px]">BD-Mixer</th>
                <th className="p-3 text-right bg-rose-900 text-rose-200 min-w-[95px]">BD-Extruder</th>
                <th className="p-3 text-right bg-rose-900 text-rose-200 min-w-[95px]">BD-Calender</th>
                <th className="p-3 text-right bg-rose-900 text-rose-200 min-w-[90px]">BD-Cutting</th>
                <th className="p-3 text-right bg-amber-950 text-amber-200 min-w-[110px]">Friction Waste</th>
                <th className="p-3 text-right bg-amber-900 text-amber-200 pr-4 min-w-[105px]">Milling Waste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {dataRows.map((r) => (
                <tr key={r.date} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 pl-4 font-bold text-slate-800 sticky left-0 bg-white shadow-sm">
                    {r.date}
                  </td>
                  <td className="p-3 text-right font-black text-blue-900 bg-blue-50/30">
                    {r.mixerBatchmix.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-bold text-blue-700 bg-blue-50/20">
                    {r.mixerOee2}%
                  </td>
                  <td className="p-3 text-right font-bold text-slate-700">
                    {r.quadOee2}%
                  </td>
                  <td className="p-3 text-right font-bold text-slate-700">
                    {r.tuberOee2}%
                  </td>
                  <td className="p-3 text-right font-bold text-slate-700">
                    {r.fischerOee2}%
                  </td>
                  <td className="p-3 text-right font-bold text-rose-700 bg-rose-50/20">
                    {r.bdMixer}%
                  </td>
                  <td className="p-3 text-right font-bold text-rose-700 bg-rose-50/20">
                    {r.bdExtruder}%
                  </td>
                  <td className="p-3 text-right font-bold text-rose-700 bg-rose-50/20">
                    {r.bdCalender}%
                  </td>
                  <td className="p-3 text-right font-bold text-rose-700 bg-rose-50/20">
                    {r.bdCutting}%
                  </td>
                  <td className="p-3 text-right font-bold text-amber-800 bg-amber-50/30">
                    {r.frictionWaste} kg
                  </td>
                  <td className="p-3 text-right font-bold text-amber-800 bg-amber-50/30 pr-4">
                    {r.millingWaste} kg
                  </td>
                </tr>
              ))}

              {/* Summary Row */}
              {dataRows.length > 0 && (
                <tr className="bg-slate-900 text-white font-extrabold">
                  <td className="p-3 pl-4 sticky left-0 bg-slate-900 shadow-sm text-emerald-400">
                    Average / Total
                  </td>
                  <td className="p-3 text-right text-blue-300">
                    {avgBatch.toLocaleString()} (Total)
                  </td>
                  <td className="p-3 text-right text-blue-300">
                    {avgMixerOee}%
                  </td>
                  <td className="p-3 text-right text-emerald-300">
                    {avgQuadOee}%
                  </td>
                  <td className="p-3 text-right text-emerald-300">
                    {avgTuberOee}%
                  </td>
                  <td className="p-3 text-right text-emerald-300">
                    {avgFischerOee}%
                  </td>
                  <td className="p-3 text-right text-rose-300">
                    {avgBdMixer}%
                  </td>
                  <td className="p-3 text-right text-rose-300">
                    {avgBdExtruder}%
                  </td>
                  <td className="p-3 text-right text-rose-300">
                    {avgBdCalender}%
                  </td>
                  <td className="p-3 text-right text-rose-300">
                    {avgBdCutting}%
                  </td>
                  <td className="p-3 text-right text-amber-300">
                    {totalFrictionWaste} kg
                  </td>
                  <td className="p-3 text-right text-amber-300 pr-4">
                    {totalMillingWaste} kg
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
