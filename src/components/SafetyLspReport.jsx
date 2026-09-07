import React, { useState, useEffect } from 'react';
import { ShieldCheck, Upload, FileSpreadsheet, Search, CheckCircle2, AlertTriangle, Users, ExternalLink, Award, TrendingUp, UserCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SafetyLspReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [activeTeam, setActiveTeam] = useState('Staff'); // 'Staff' or 'Leader'
  const [customFileLoaded, setCustomFileLoaded] = useState(false);

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const defaultWorkers = [
    { id: 2, legacy: '12750', name: 'Akkarawat Tanapatjiranon (อัครวัฒน์ ธนภัทรจิรานนท์)', dept: 'BCA', areaCode: '3200', isLspTarget: true, group: 'Staff', monthly: { JAN: 0, FEB: 5, MAR: 4, APR: 4, MAY: 5, JUN: 4, JUL: 4, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 67 },
    { id: 12, legacy: '1461', name: 'Kamol Chansue (กมล จันเสือ)', dept: 'BCA', areaCode: '3200', isLspTarget: true, group: 'Staff', monthly: { JAN: 0, FEB: 5, MAR: 4, APR: 9, MAY: 6, JUN: 6, JUL: 4, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 81 },
    { id: 13, legacy: '12921', name: 'Kant Limpitaks (กันต์ ลิมปิทักษ์)', dept: 'BCA-Q', areaCode: '1022', isLspTarget: true, group: 'Staff', monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 4, MAY: 4, JUN: 4, JUL: 5, AUG: 4, SEP: 0, OCT: '', NOV: '', DEC: '' }, ytdPct: 71 },
    { id: 16, legacy: '12106', name: 'Kritsana Iyerakanjankun (กฤษณะ ไอยรากาญจนกุล)', dept: 'BCA-E', areaCode: '1100', isLspTarget: true, group: 'Staff', monthly: { JAN: 0, FEB: 4, MAR: 4, APR: 4, MAY: 4, JUN: 5, JUL: 4, AUG: 4, SEP: 1, OCT: '', NOV: '', DEC: '' }, ytdPct: 63 },
    { id: 19, legacy: '12769', name: 'Narada Tempombribun (นารดา เต็มพรมบริบูรณ์)', dept: 'BCA-HR', areaCode: '1050', isLspTarget: true, group: 'Staff', monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 4, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 0, OCT: '', NOV: '', DEC: '' }, ytdPct: 69 },
    { id: 21, legacy: '12364', name: 'Nithit Raktham (นิธิศ รักธรรม)', dept: 'BCA-E', areaCode: '6320', isLspTarget: true, group: 'Staff', monthly: { JAN: 0, FEB: 4, MAR: 4, APR: 4, MAY: 4, JUN: 1, JUL: 5, AUG: 4, SEP: 0, OCT: '', NOV: '', DEC: '' }, ytdPct: 54 },
    { id: 22, legacy: '12367', name: 'Paisal Phoompong (ไพศาล พูมพงษ์)', dept: 'BCA', areaCode: '3200', isLspTarget: true, group: 'Staff', monthly: { JAN: 2, FEB: 4, MAR: 4, APR: 4, MAY: 4, JUN: 5, JUL: 6, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 73 },
    { id: 23, legacy: '10661', name: 'Parintorn Premshue (ปริญทร เปรมชู)', dept: 'BCA', areaCode: '3200', isLspTarget: true, group: 'Staff', monthly: { JAN: 0, FEB: 4, MAR: 4, APR: 4, MAY: 4, JUN: 4, JUL: 4, AUG: 5, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 65 },
    { id: 24, legacy: '10082', name: 'Phichet Dee-On (พิเชษฐ์ ดีอ่อน)', dept: 'BCA-Q', areaCode: '1022', isLspTarget: true, group: 'Staff', monthly: { JAN: 4, FEB: 4, MAR: 4, APR: 5, MAY: 4, JUN: 5, JUL: 4, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 75 },
    { id: 25, legacy: '12445', name: 'Pinthusorn Prasertpolkrang (พินทุสร ประเสริฐพลกรัง)', dept: 'BCA-Q', areaCode: '1022', isLspTarget: true, group: 'Staff', monthly: { JAN: 4, FEB: 4, MAR: 5, APR: 4, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 73 },
    { id: 35, legacy: '10553', name: 'Sunuttapong Siriluk (สุณัฐพงศ์ ศิริลักษณ์)', dept: 'BCA-E', areaCode: '1100', isLspTarget: true, group: 'Staff', monthly: { JAN: 3, FEB: 4, MAR: 4, APR: 4, MAY: 0, JUN: 5, JUL: 3, AUG: 6, SEP: 1, OCT: '', NOV: '', DEC: '' }, ytdPct: 63 },
    { id: 41, legacy: '1308', name: 'Vinai Fuangfoo (วินัย ฟักฟู)', dept: 'BCA-HR', areaCode: '1053', isLspTarget: true, group: 'Staff', monthly: { JAN: 5, FEB: 5, MAR: 4, APR: 5, MAY: 5, JUN: 4, JUL: 4, AUG: 4, SEP: 0, OCT: '', NOV: '', DEC: '' }, ytdPct: 75 },
    { id: 43, legacy: '12001', name: 'Wata Phattanapong (วรา พัฒนพงศ์)', dept: 'BCA-EHS', areaCode: '1056', isLspTarget: true, group: 'Staff', monthly: { JAN: 4, FEB: 5, MAR: 4, APR: 4, MAY: 4, JUN: 6, JUL: 4, AUG: 5, SEP: 3, OCT: '', NOV: '', DEC: '' }, ytdPct: 81 }
  ];

  const defaultLeaders = [
    { id: 5, legacy: '3141', name: 'Boonnue Umpimai (บุญเหลือ อุ้มพิมาย)', title: 'Production Team Leader', dept: 'FLM', areaCode: '3200', group: 'Leader', monthly: { JAN: 0, FEB: 0, MAR: 4, APR: 4, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 4, OCT: '', NOV: '', DEC: '' }, ytdPct: 58 },
    { id: 7, legacy: '1312', name: 'Chet Srimook (เชษฐ์ ศรีมุก)', title: 'Production Team Leader', dept: 'FLM', areaCode: '4300', group: 'Leader', monthly: { JAN: 0, FEB: 5, MAR: 7, APR: 4, MAY: 8, JUN: 9, JUL: 5, AUG: 6, SEP: 4, OCT: '', NOV: '', DEC: '' }, ytdPct: 90 },
    { id: 27, legacy: '1425', name: 'Preecha Chamwechesart (ปรีชา ชาญเวชศาสตร์)', title: 'Production Team Leader', dept: 'FLM', areaCode: '4110', group: 'Leader', monthly: { JAN: 0, FEB: 0, MAR: 3, APR: 0, MAY: 5, JUN: 7, JUL: 4, AUG: 7, SEP: 4, OCT: '', NOV: '', DEC: '' }, ytdPct: 63 },
    { id: 28, legacy: '1232', name: 'Rawat Puykunthod (เรวัตร์ ปุยขุนทด)', title: 'Production Team Leader', dept: 'FLM', areaCode: '4110', group: 'Leader', monthly: { JAN: 0, FEB: 0, MAR: 0, APR: 0, MAY: 5, JUN: 8, JUL: 4, AUG: 7, SEP: 2, OCT: '', NOV: '', DEC: '' }, ytdPct: 54 },
    { id: 30, legacy: '1339', name: 'Sek Kangsuk (เสก กองสุข)', title: 'Production Team Leader', dept: 'FLM', areaCode: '4300', group: 'Leader', monthly: { JAN: 0, FEB: 4, MAR: 4, APR: 6, MAY: 5, JUN: 5, JUL: 4, AUG: 5, SEP: 4, OCT: '', NOV: '', DEC: '' }, ytdPct: 77 },
    { id: 33, legacy: '1327', name: 'Sivarin Juntasit (ศิวรินทร์ จันทสิทธิ์)', title: 'Production Team Leader', dept: 'FLM', areaCode: '4110', group: 'Leader', monthly: { JAN: 0, FEB: 0, MAR: 5, APR: 0, MAY: 4, JUN: 5, JUL: 4, AUG: 5, SEP: 4, OCT: '', NOV: '', DEC: '' }, ytdPct: 56 },
    { id: 40, legacy: '9823', name: 'Suphol Sophaboon (สุพล โสภะบุญ)', title: 'Production Team Leader', dept: 'FLM', areaCode: '4110', group: 'Leader', monthly: { JAN: 4, FEB: 4, MAR: 7, APR: 2, MAY: 4, JUN: 4, JUL: 4, AUG: 5, SEP: 4, OCT: '', NOV: '', DEC: '' }, ytdPct: 71 },
    { id: 41, legacy: '1333', name: 'Suthin Saenphai (สุทิน แสนภัย)', title: 'Group Leader', dept: 'FLM', areaCode: '4110', group: 'Leader', monthly: { JAN: 0, FEB: 0, MAR: 0, APR: 0, MAY: 4, JUN: 4, JUL: 4, AUG: 4, SEP: 4, OCT: '', NOV: '', DEC: '' }, ytdPct: 42 },
    { id: 45, legacy: '1459', name: 'Vichai Jomkamsing (วิชัย จอมคำสิงห์)', title: 'Production Team Leader', dept: 'FLM', areaCode: '4300', group: 'Leader', monthly: { JAN: 12, FEB: 0, MAR: 0, APR: 0, MAY: 4, JUN: 4, JUL: 8, AUG: 7, SEP: 4, OCT: '', NOV: '', DEC: '' }, ytdPct: 81 },
    { id: 46, legacy: '3062', name: 'Vinai Klinsrisuk (วินัย กลิ่นศรีสุข)', title: 'Production Team Leader', dept: 'FLM', areaCode: '3200', group: 'Leader', monthly: { JAN: 2, FEB: 1, MAR: 3, APR: 0, MAY: 6, JUN: 4, JUL: 4, AUG: 4, SEP: 4, OCT: '', NOV: '', DEC: '' }, ytdPct: 58 },
    { id: 50, legacy: '12249', name: 'Chariphan Phonlaaiad (ชารีพันธุ์ พลละเอียด)', title: 'Production Team Leader', dept: 'FLM', areaCode: '4110', group: 'Leader', monthly: { JAN: 0, FEB: 0, MAR: 0, APR: 1, MAY: 6, JUN: 4, JUL: 5, AUG: 5, SEP: 4, OCT: '', NOV: '', DEC: '' }, ytdPct: 52 },
    { id: 51, legacy: '12583', name: 'Niran Laedee (นิรันดร์ แลดี)', title: 'Production Team Leader', dept: 'FLM', areaCode: '3200', group: 'Leader', monthly: { JAN: 0, FEB: 0, MAR: 0, APR: 0, MAY: 4, JUN: 4, JUL: 4, AUG: 5, SEP: 4, OCT: '', NOV: '', DEC: '' }, ytdPct: 44 }
  ];

  const loadLspData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lsp');
      if (res.ok) {
        const json = await res.json();
        if (json) {
          setData(json);
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    setData({
      file: 'LSP Tracking.xlsx (System Data)',
      year: '2026',
      staffWorkers: defaultWorkers,
      leaderWorkers: defaultLeaders,
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
            const subHeader = rows[headerRowIndex + 1] ? rows[headerRowIndex + 1].map(c => String(c).trim().toUpperCase()) : [];
            const idCol = header.findIndex(c => c.includes('##') || c.includes('ID') || c.includes('NO'));
            const legacyCol = header.findIndex(c => c.includes('LEGACY'));
            const workerCol = header.findIndex(c => c.includes('WORKER') || c.includes('NAME'));
            const titleCol = header.findIndex(c => c.includes('TITLE') || c.includes('BUSINESS'));
            const deptCol = header.findIndex(c => c.includes('DEPT') || c.includes('AREA') || c.includes('GROUP'));
            const ytdCol = header.findIndex(c => c.includes('YTD'));

            const monthCols = {};
            months.forEach(m => {
              let idx = header.findIndex(c => c === m);
              if (idx !== -1) {
                if (subHeader[idx] === 'AOP' && subHeader[idx + 1] === 'ACT') {
                  idx = idx + 1;
                } else if (subHeader[idx + 1] === 'ACT') {
                  idx = idx + 1;
                }
              }
              monthCols[m] = idx;
            });

            const parsedStaff = [];
            const parsedLeaders = [];

            rows.slice(headerRowIndex + (subHeader.length > 0 ? 2 : 1)).forEach(r => {
              const name = String(r[workerCol !== -1 ? workerCol : 2] || '').trim();
              const legacy = String(r[legacyCol !== -1 ? legacyCol : 1] || '').trim();
              const rowId = String(r[idCol !== -1 ? idCol : 0] || '').trim();
              const dept = String(r[deptCol !== -1 ? deptCol : 4] || 'BCA').trim();
              const title = String(r[titleCol !== -1 ? titleCol : 3] || '').trim();

              if (!name || name.toLowerCase().includes('total') || name.toLowerCase().includes('average')) return;
              if (rowId === '20' || legacy === '12925' || name.toLowerCase().includes('krittanan') || name.includes('กฤตนันท์')) return;
              if (dept.toUpperCase().includes('BCB')) return;

              const isLeader = title.toLowerCase().includes('leader') || dept.toLowerCase().includes('flm');

              const monthlyData = {};
              let totalAudits = 0;
              months.forEach(m => {
                const idx = monthCols[m];
                let val = '';
                if (idx !== -1 && r[idx] !== undefined && r[idx] !== '') {
                  val = Number(r[idx]);
                  if (isNaN(val)) val = '';
                }
                monthlyData[m] = val;
                if (typeof val === 'number') totalAudits += val;
              });

              let ytdRaw = ytdCol !== -1 ? String(r[ytdCol] || '') : '';
              let ytdPct = parseFloat(ytdRaw.replace('%', '')) || 0;
              if (!ytdPct && totalAudits > 0) {
                ytdPct = Math.min(100, Math.round((totalAudits / 48) * 100));
              }

              const item = {
                id: r[idCol !== -1 ? idCol : 0] || (isLeader ? parsedLeaders.length + 1 : parsedStaff.length + 1),
                legacy: legacy,
                name,
                title,
                dept: isLeader ? 'FLM' : dept,
                areaCode: String(r[deptCol !== -1 ? deptCol + 1 : 5] || '').trim(),
                isLspTarget: true,
                group: isLeader ? 'Leader' : 'Staff',
                monthly: monthlyData,
                ytdPct
              };

              if (isLeader) parsedLeaders.push(item);
              else parsedStaff.push(item);
            });

            setData({
              file: file.name,
              year: '2026',
              staffWorkers: parsedStaff.length > 0 ? parsedStaff : defaultWorkers,
              leaderWorkers: parsedLeaders.length > 0 ? parsedLeaders : defaultLeaders,
              hasData: true
            });
            setCustomFileLoaded(true);
          }
        }
      } catch (err) {
        alert('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const CURRENT_MONTH_KEY = 'SEP'; // September (Month 9)
  const CURRENT_MONTH_INDEX = 9;

  const getWorkerSepCount = (w) => {
    const val = w.monthly && w.monthly[CURRENT_MONTH_KEY];
    if (val !== undefined && val !== '' && val !== null) {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const staffList = data?.staffWorkers || defaultWorkers;
  const leaderList = data?.leaderWorkers || defaultLeaders;
  const activeWorkers = activeTeam === 'Staff' ? staffList : leaderList;

  const totalWorkers = activeWorkers.length;
  const sepAuditsSum = activeWorkers.reduce((acc, w) => acc + getWorkerSepCount(w), 0);
  const avgSepAudits = (sepAuditsSum / (totalWorkers || 1)).toFixed(1);
  const onTargetCount = activeWorkers.filter(w => getWorkerSepCount(w) >= 4).length;
  const inProgressCount = activeWorkers.filter(w => { const c = getWorkerSepCount(w); return c >= 1 && c < 4; }).length;
  const belowTargetCount = totalWorkers - onTargetCount;

  const departments = ['ALL', ...new Set(activeWorkers.map(w => w.dept).filter(Boolean))];

  const filteredWorkers = activeWorkers.filter(w => {
    const matchesDept = selectedDept === 'ALL' || w.dept === selectedDept;
    const matchesSearch = !searchTerm || w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.legacy.includes(searchTerm);
    return matchesDept && matchesSearch;
  });

  const getBadgeStyle = (val, monthIndex) => {
    const num = Number(val);
    const isHasVal = val !== undefined && val !== '' && val !== null && !isNaN(num);

    if (isHasVal) {
      if (num >= 4) return 'bg-emerald-500 text-white font-black shadow-sm';
      if (num >= 1) return 'bg-amber-400 text-amber-950 font-black shadow-sm';
      if (num === 0) {
        if (monthIndex <= CURRENT_MONTH_INDEX) {
          return 'bg-rose-500 text-white font-black shadow-sm';
        }
        return 'bg-slate-100 text-slate-400 border border-slate-200 font-medium';
      }
    }

    if (monthIndex <= CURRENT_MONTH_INDEX) {
      return 'bg-rose-500 text-white font-black shadow-sm';
    }
    return 'bg-slate-100 text-slate-400 border border-slate-200 font-medium';
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

      {/* Team View Switcher Bar (Separating Staff vs Leader Shopfloor) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-2">
        <button
          onClick={() => { setActiveTeam('Staff'); setSelectedDept('ALL'); }}
          className={`flex-1 py-3 px-5 rounded-xl text-xs font-black flex items-center justify-center gap-2.5 transition-all w-full ${
            activeTeam === 'Staff'
              ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900/20'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>👔 ทีม Staff ({staffList.length} คน)</span>
        </button>

        <button
          onClick={() => { setActiveTeam('Leader'); setSelectedDept('ALL'); }}
          className={`flex-1 py-3 px-5 rounded-xl text-xs font-black flex items-center justify-center gap-2.5 transition-all w-full ${
            activeTeam === 'Leader'
              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/20'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold'
          }`}
        >
          <UserCheck className="w-4 h-4 text-blue-200" />
          <span>👷 ทีม Leader Shopfloor / FLM ({leaderList.length} คน)</span>
        </button>
      </div>

      {/* KPI Cards (4 Top Stat Cards - Dynamic per Active Team) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Personnel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {activeTeam === 'Staff' ? 'Total Staff Workers' : 'Total Shopfloor Leaders'}
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalWorkers} คน</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">100% Tracked Active</div>
          </div>
          <div className={`p-3 rounded-xl ${activeTeam === 'Staff' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
            {activeTeam === 'Staff' ? <Users className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
          </div>
        </div>

        {/* Card 2: Average Current Month Audits */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">SEP Average Audits</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{avgSepAudits} <span className="text-xs text-slate-500 font-normal">/ 4 ครั้ง</span></div>
            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (Number(avgSepAudits) / 4) * 100)}%` }}></div>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: On Target */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">On Target (SEP ≥ 4)</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{onTargetCount} คน</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">Pass (ครบเป้าหมาย)</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Action Needed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Action Needed (SEP &lt; 4)</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{belowTargetCount} คน</div>
            <div className="text-[11px] font-semibold text-rose-600 mt-1">{inProgressCount} ทำแล้วแต่ยังไม่ครบ, {belowTargetCount - inProgressCount} ยังไม่เริ่ม</div>
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
          <span className="text-xs font-bold text-slate-400 uppercase mr-2">Filter:</span>
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>เดือน 10-12 (ยังไม่ถึงเวลา) = ไม่ขึ้นสถานะ ⚪</span>
          </div>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-slate-800 text-sm">
              2026 {activeTeam === 'Staff' ? 'Staff' : 'Leader Shopfloor (FLM)'} LSP Audit Conformance Matrix
            </h2>
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
                <th className="p-3 min-w-[220px]">
                  {activeTeam === 'Staff' ? 'Staff Name' : 'Leader Name & Business Title'}
                </th>
                <th className="p-3 w-24">Dept</th>
                {months.map(m => (
                  <th key={m} className="p-2 text-center min-w-[42px]">
                    <div className="text-[9px] text-emerald-400 font-normal">AOP 4</div>
                    <div className="font-extrabold">{m}</div>
                  </th>
                ))}
                <th className="p-3 text-center min-w-[130px]">SEP (เดือนปัจจุบัน)</th>
                <th className="p-3 text-center pr-4 w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredWorkers.map((w, idx) => (
                <tr key={w.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 pl-4 text-center font-bold text-slate-400">{w.id}</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px]">{w.legacy}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{w.name}</div>
                    {w.title && (
                      <div className="text-[10px] text-blue-600 font-semibold mt-0.5">{w.title}</div>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-slate-500">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      w.dept === 'FLM' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {w.dept}
                    </span>
                  </td>
                  {months.map((m, mIdx) => {
                    const monthNum = mIdx + 1;
                    const val = w.monthly && w.monthly[m] !== undefined ? w.monthly[m] : '';
                    const isFutureBlank = (val === '' || val === undefined || val === null) && monthNum > CURRENT_MONTH_INDEX;
                    return (
                      <td key={m} className="p-1 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] transition-transform hover:scale-110 ${getBadgeStyle(val, monthNum)}`}>
                          {isFutureBlank ? '-' : (val !== undefined && val !== '' ? val : 0)}
                        </span>
                      </td>
                    );
                  })}
                  <td className="p-3 text-center font-bold">
                    {(() => {
                      const sepVal = getWorkerSepCount(w);
                      return (
                        <div className="flex items-center justify-center">
                          <span className={`px-2.5 py-1 rounded-lg font-black text-xs min-w-[70px] text-center shadow-sm ${
                            sepVal >= 4 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            sepVal >= 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {sepVal} / 4 ครั้ง
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-3 text-center pr-4">
                    {(() => {
                      const sepVal = getWorkerSepCount(w);
                      if (sepVal >= 4) {
                        return (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Pass
                          </span>
                        );
                      } else if (sepVal >= 1) {
                        return (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1 shadow-sm">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Alert ({sepVal}/4)
                          </span>
                        );
                      } else {
                        return (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-extrabold text-[10px] inline-flex items-center gap-1 shadow-sm">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Alert (0/4)
                          </span>
                        );
                      }
                    })()}
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
