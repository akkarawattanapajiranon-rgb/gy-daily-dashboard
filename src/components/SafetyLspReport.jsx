import React, { useState, useEffect } from 'react';
import { ShieldCheck, Upload, FileSpreadsheet, Search, CheckCircle2, AlertTriangle, Users, ExternalLink, Award, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SafetyLspReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [customFileLoaded, setCustomFileLoaded] = useState(false);

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const defaultWorkers = [
    { id: 2, legacy: '12750', name: 'Akkarawat Tanapatjiranon (อัครวัฒน์ ธนภัทรจิรานนท์)', dept: 'BCA', areaCode: '3200', isLspTarget: true, monthly: { JAN: 4, FEB: 0, MAR: 4, APR: 5, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 4, OCT: 4, NOV: 4, DEC: 4 }, ytdPct: 63 },
    { id: 12, legacy: '1461', name: 'Kamol Chansue (กมล จันเสือ)', dept: 'BCA', areaCode: '3200', isLspTarget: true, monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 5, MAY: 4, JUN: 6, JUL: 4, AUG: 4, SEP: 4, OCT: 4, NOV: 4, DEC: 4 }, ytdPct: 77 },
    { id: 13, legacy: '12921', name: 'Kant Limpitaks (กันต์ ลิมปิทักษ์)', dept: 'BCA-Q', areaCode: '1022', isLspTarget: true, monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 5, MAY: 4, JUN: 4, JUL: 4, AUG: 5, SEP: 4, OCT: 4, NOV: 4, DEC: 4 }, ytdPct: 71 },
    { id: 16, legacy: '12108', name: 'Kritsana Iyerakanjankun (กฤษณะ ไอียรากาญจนกุล)', dept: 'BCA-E', areaCode: '1100', isLspTarget: true, monthly: { JAN: 4, FEB: 0, MAR: 4, APR: 5, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 4, OCT: 4, NOV: 4, DEC: 4 }, ytdPct: 60 },
    { id: 19, legacy: '12768', name: 'Narada Tempombribun (นารดา เต็มพรมบริบูรณ์)', dept: 'BCA-HR', areaCode: '1050', isLspTarget: true, monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 4, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 4, OCT: 4, NOV: 4, DEC: 4 }, ytdPct: 69 },
    { id: 21, legacy: '12364', name: 'Nithit Raktham (นิธิศ รักธรรม)', dept: 'BCA-E', areaCode: '6320', isLspTarget: true, monthly: { JAN: 4, FEB: 0, MAR: 4, APR: 4, MAY: 4, JUN: 4, JUL: 1, AUG: 4, SEP: 5, OCT: 4, NOV: 4, DEC: 4 }, ytdPct: 54 },
    { id: 22, legacy: '12357', name: 'Paisal Phoompong (ไพศาล พูมพงษ์)', dept: 'BCA', areaCode: '3200', isLspTarget: true, monthly: { JAN: 4, FEB: 2, MAR: 4, APR: 4, MAY: 4, JUN: 4, JUL: 5, AUG: 4, SEP: 6, OCT: 4, NOV: 4, DEC: 4 }, ytdPct: 68 },
    { id: 23, legacy: '10661', name: 'Parintorn Premshue (ปริญทร เปรมชู)', dept: 'BCA', areaCode: '3200', isLspTarget: true, monthly: { JAN: 4, FEB: 0, MAR: 4, APR: 4, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 5, OCT: 4, NOV: 4, DEC: 4 }, ytdPct: 60 },
    { id: 24, legacy: '10062', name: 'Phichet Dee-On (พิเชษฐ์ ดีอ่อน)', dept: 'BCA-Q', areaCode: '1022', isLspTarget: true, monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 4, MAY: 5, JUN: 4, JUL: 4, AUG: 5, SEP: 4, OCT: 4, NOV: 4, DEC: 4 }, ytdPct: 71 },
    { id: 25, legacy: '12445', name: 'Pinthusorn Prasertpolkrang (พินทุสร ประเสริฐพลกรัง)', dept: 'BCA-Q', areaCode: '1022', isLspTarget: true, monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 5, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 4, OCT: 4, NOV: 4, DEC: 4 }, ytdPct: 65 },
    { id: 35, legacy: '10558', name: 'Suruttapong Siriluk (สุรุจพงศ์ ศิริลักษณ์)', dept: 'BCA-E', areaCode: '1100', isLspTarget: true, monthly: { JAN: 4, FEB: 3, MAR: 4, APR: 4, MAY: 4, JUN: 0, JUL: 4, AUG: 5, SEP: 3, OCT: 6, NOV: 4, DEC: 4 }, ytdPct: 60 },
    { id: 41, legacy: '1308', name: 'Vinai Fuangfoo (วินัย ฟักฟู)', dept: 'BCA-HR', areaCode: '1053', isLspTarget: true, monthly: { JAN: 4, FEB: 5, MAR: 4, APR: 4, MAY: 5, JUN: 4, JUL: 4, AUG: 4, SEP: 4, OCT: 4, NOV: 4, DEC: 4 }, ytdPct: 75 },
    { id: 43, legacy: '12001', name: 'Wata Phattanapong (วรา พัฒนพงศ์)', dept: 'BCA-EHS', areaCode: '1056', isLspTarget: true, monthly: { JAN: 4, FEB: 4, MAR: 5, APR: 4, MAY: 4, JUN: 4, JUL: 8, AUG: 4, SEP: 4, OCT: 5, NOV: 4, DEC: 4 }, ytdPct: 75 }
  ];

  const loadLspData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lsp');
      if (res.ok) {
        const json = await res.json();
        if (json && json.workers && json.workers.length > 0) {
          setData(json);
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    // Fallback data
    const totalWorkers = defaultWorkers.length;
    const avgYtd = Math.round(defaultWorkers.reduce((acc, w) => acc + w.ytdPct, 0) / totalWorkers);
    const onTargetCount = defaultWorkers.filter(w => w.ytdPct >= 65).length;
    const belowTargetCount = totalWorkers - onTargetCount;

    setData({
      file: 'LSP Tracking.xlsx (System Data)',
      year: '2026',
      totalWorkers,
      avgYtd,
      onTargetCount,
      belowTargetCount,
      workers: defaultWorkers,
      hasData: true
    });
    setLoading(false);
  };

  useEffect(() => {
    loadLspData();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellStubs: true });
        const sheetName = wb.SheetNames.find(s => s.toUpperCase().includes('LSP') || s.toUpperCase().includes('2026')) || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (rows.length > 2) {
          let headerRowIndex = -1;
          rows.forEach((r, idx) => {
            if (r.some(c => String(c).toUpperCase().includes('JAN') || String(c).toUpperCase().includes('WORKER'))) {
              headerRowIndex = idx;
            }
          });

          if (headerRowIndex !== -1) {
            const header = rows[headerRowIndex].map(c => String(c).trim().toUpperCase());
            const idCol = header.findIndex(c => c.includes('##') || c.includes('ID') || c.includes('NO'));
            const legacyCol = header.findIndex(c => c.includes('LEGACY'));
            const workerCol = header.findIndex(c => c.includes('WORKER') || c.includes('NAME'));
            const deptCol = header.findIndex(c => c.includes('DEPT') || c.includes('AREA') || c.includes('GROUP'));
            const ytdCol = header.findIndex(c => c.includes('YTD'));

            const monthCols = {};
            months.forEach(m => {
              monthCols[m] = header.findIndex(c => c === m);
            });

            const parsedWorkers = [];
            rows.slice(headerRowIndex + 1).forEach(r => {
              const name = String(r[workerCol !== -1 ? workerCol : 2] || '').trim();
              const legacy = String(r[legacyCol !== -1 ? legacyCol : 1] || '').trim();
              const rowId = String(r[idCol !== -1 ? idCol : 0] || '').trim();

              if (!name || name.toLowerCase().includes('total') || name.toLowerCase().includes('average')) return;
              if (rowId === '20' || legacy === '12925' || name.toLowerCase().includes('krittanan') || name.includes('กฤตนันท์')) return;

              const monthlyData = {};
              let totalAudits = 0;
              months.forEach(m => {
                const idx = monthCols[m];
                const val = idx !== -1 ? Number(r[idx]) || 0 : 0;
                monthlyData[m] = val;
                totalAudits += val;
              });

              let ytdRaw = ytdCol !== -1 ? String(r[ytdCol] || '') : '';
              let ytdPct = parseFloat(ytdRaw.replace('%', '')) || 0;
              if (!ytdPct && totalAudits > 0) {
                ytdPct = Math.min(100, Math.round((totalAudits / 48) * 100));
              }

              parsedWorkers.push({
                id: r[idCol !== -1 ? idCol : 0] || parsedWorkers.length + 1,
                legacy: legacy,
                name,
                dept: String(r[deptCol !== -1 ? deptCol : 4] || 'BCA').trim(),
                areaCode: String(r[deptCol !== -1 ? deptCol + 1 : 5] || '').trim(),
                isLspTarget: true,
                monthly: monthlyData,
                ytdPct
              });
            });

            if (parsedWorkers.length > 0) {
              const totalWorkers = parsedWorkers.length;
              const avgYtd = Math.round(parsedWorkers.reduce((acc, w) => acc + w.ytdPct, 0) / (totalWorkers || 1));
              const onTargetCount = parsedWorkers.filter(w => w.ytdPct >= 65).length;
              const belowTargetCount = totalWorkers - onTargetCount;

              setData({
                file: file.name,
                year: '2026',
                totalWorkers,
                avgYtd,
                onTargetCount,
                belowTargetCount,
                workers: parsedWorkers,
                hasData: true
              });
              setCustomFileLoaded(true);
            }
          }
        }
      } catch (err) {
        alert('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const departments = data ? ['ALL', ...new Set(data.workers.filter(w => String(w.id) !== '20' && w.legacy !== '12925').map(w => w.dept).filter(Boolean))] : ['ALL'];

  const filteredWorkers = data ? data.workers.filter(w => {
    if (String(w.id) === '20' || w.legacy === '12925' || (w.name && (w.name.toLowerCase().includes('krittanan') || w.name.includes('กฤตนันท์')))) return false;
    const matchesDept = selectedDept === 'ALL' || w.dept === selectedDept;
    const matchesSearch = !searchTerm || w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.legacy.includes(searchTerm);
    return matchesDept && matchesSearch;
  }) : [];

  const getBadgeStyle = (val) => {
    const num = Number(val);
    if (val !== undefined && val !== '' && !isNaN(num)) {
      if (num >= 4) return 'bg-emerald-500 text-white font-black shadow-sm'; // ครบ 4 หรือมากกว่า -> เขียว
      if (num >= 1) return 'bg-amber-400 text-amber-950 font-black shadow-sm'; // ทำแล้ว ยังไม่ครบ 4 -> เหลือง
      return 'bg-rose-500 text-white font-black shadow-sm'; // 0 -> แดง
    }
    return 'bg-rose-500 text-white font-black shadow-sm'; // ยังไม่ทำ / ว่าง -> แดง
  };

  if (loading || !data) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <span>Loading EHS Safety LSP Tracking Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl backdrop-blur-md">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                  EHS Safety - 2026 LSP Tracking
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/30 text-emerald-300 rounded-full border border-emerald-400/30">
                    Life Saving Principles
                  </span>
                </h1>
                <p className="text-xs md:text-sm text-emerald-200/80 mt-1">
                  Thailand EHS Safety Audit Monitor & Employee Conformance Tracking ({data.file})
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://goodyearcorp.sharepoint.com/:x:/r/sites/ThailandEHS/Shared%20Documents/LSP%20Tracking/2026%20LSP%20tracking/LSP%20Tracking.xlsx?web=1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition-all backdrop-blur-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
              <span>SharePoint File</span>
            </a>

            <label className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{customFileLoaded ? 'Uploaded New File' : 'Import LSP.xlsx'}</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* KPI Cards (4 Top Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Personnel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Workers</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{data.totalWorkers} คน</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">100% Tracked Active</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Average YTD % */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average YTD Completion</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{data.avgYtd}%</div>
            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, data.avgYtd)}%` }}></div>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: On Target */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">On Target (≥ 65%)</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{data.onTargetCount} คน</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">High Conformance</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Action Needed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action Needed (&lt; 65%)</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{data.belowTargetCount} คน</div>
            <div className="text-[11px] font-semibold text-rose-600 mt-1">Needs LSP Audits</div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Dept Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase mr-2">Dept:</span>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDept === dept
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search worker name / ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* AOP vs ACT Color Legend Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px]">AOP vs ACT Rules</span>
          <span>เกณฑ์เป้าหมาย AOP = 4 ครั้ง/เดือน</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-extrabold text-[11px]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-xl shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span>ยังไม่ทำ (0 ครั้ง) = สีแดง 🔴</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-amber-950 rounded-xl shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-950"></span>
            <span>ทำแล้วแต่ยังไม่ครบ 4 (1-3 ครั้ง) = สีเหลือง 🟡</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-xl shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            <span>ครบ 4 หรือมากกว่า (≥ 4 ครั้ง) = สีเขียว 🟢</span>
          </div>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-slate-800 text-sm">2026 Worker LSP Audit Conformance Matrix</h2>
          </div>
          <div className="text-xs font-semibold text-slate-400">
            AOP Target = 4 Audits / Month per Target Worker
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3 pl-4 text-center w-12">##</th>
                <th className="p-3 w-20">Legacy</th>
                <th className="p-3 min-w-[200px]">Worker Name</th>
                <th className="p-3 w-24">Dept</th>
                {months.map(m => (
                  <th key={m} className="p-2 text-center min-w-[42px]">
                    <div className="text-[9px] text-emerald-400 font-normal">AOP 4</div>
                    <div className="font-extrabold">{m}</div>
                  </th>
                ))}
                <th className="p-3 text-center min-w-[100px]">YTD %</th>
                <th className="p-3 text-center pr-4 w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredWorkers.map((w, idx) => (
                <tr key={w.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 pl-4 text-center font-bold text-slate-400">{w.id}</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">{w.legacy}</td>
                  <td className="p-3 font-bold text-slate-800">{w.name}</td>
                  <td className="p-3 font-semibold text-slate-500">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-bold text-slate-700">
                      {w.dept}
                    </span>
                  </td>
                  {months.map(m => {
                    const val = w.monthly && w.monthly[m] !== undefined ? w.monthly[m] : 0;
                    return (
                      <td key={m} className="p-1 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] transition-transform hover:scale-110 ${getBadgeStyle(val)}`}>
                          {val !== undefined && val !== '' ? val : 0}
                        </span>
                      </td>
                    );
                  })}
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            w.ytdPct >= 70 ? 'bg-emerald-500' : w.ytdPct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, w.ytdPct)}%` }}
                        ></div>
                      </div>
                      <span className="font-extrabold text-slate-800 text-[11px] w-8">{w.ytdPct}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-center pr-4">
                    {w.ytdPct >= 65 ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Pass
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Alert
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredWorkers.length === 0 && (
                <tr>
                  <td colSpan={17} className="p-8 text-center text-slate-400 font-semibold">
                    No matching worker records found.
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
