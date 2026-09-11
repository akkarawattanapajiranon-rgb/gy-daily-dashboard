import React, { useState, useEffect } from 'react';
import { ShieldCheck, Upload, FileSpreadsheet, Search, CheckCircle2, AlertTriangle, Users, ExternalLink, TrendingUp, UserCheck, Clock, Layers, Filter, Building2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import cachedLspFallback from '../data/lsp_data_cache.json';

// Staff: Group by first 3 characters, with BCB-Aero+Retread separated: BCA, BCB, BCB-Aero+Retread, LT, GBS+FI +Eng
export const getStaffCategoryGroup = (dept) => {
  const d = String(dept || '').trim().toUpperCase();
  if (d.startsWith('BCA')) return 'BCA';
  if (d === 'BCB-A' || d.startsWith('BCB-A') || d === 'BCB-R' || d.startsWith('BCB-R')) return 'BCB-Aero+Retread';
  if (d.startsWith('BCB')) return 'BCB';
  if (d.startsWith('LT')) return 'LT';
  return 'GBS+FI +Eng';
};

// Leader: Group by Cost Center Code:
// BCA: 3200, 4110, 4300
// BCB (WBR): 5110, 5120, 5130
// BCB (AERO): A5110, A5120, A5130
// BCB (Sapphire): S5110, S5120, S5130
// RETREAD: 6320
// ENG: 1100, 1110
export const getLeaderCategoryGroup = (costCenter) => {
  const cc = String(costCenter || '').trim().toUpperCase();
  if (['3200', '4110', '4300'].includes(cc)) return 'BCA';
  if (['5110', '5120', '5130'].includes(cc)) return 'BCB (WBR)';
  if (['A5110', 'A5120', 'A5130'].includes(cc)) return 'BCB (AERO)';
  if (['S5110', 'S5120', 'S5130'].includes(cc)) return 'BCB (Sapphire)';
  if (['6320'].includes(cc)) return 'RETREAD';
  if (['1100', '1110'].includes(cc)) return 'ENG';
  return 'OTHER';
};

export const getGroupBadgeColor = (grp) => {
  switch (grp) {
    case 'BCA':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'BCB-Aero+Retread':
    case 'BCB-A':
      return 'bg-sky-50 text-sky-800 border-sky-300';
    case 'BCB':
    case 'BCB (WBR)':
      return 'bg-blue-50 text-blue-800 border-blue-300';
    case 'BCB (AERO)':
      return 'bg-sky-50 text-sky-800 border-sky-300';
    case 'BCB (Sapphire)':
      return 'bg-indigo-50 text-indigo-800 border-indigo-300';
    case 'RETREAD':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'LT':
      return 'bg-purple-50 text-purple-800 border-purple-300';
    case 'GBS+FI +Eng':
      return 'bg-teal-50 text-teal-800 border-teal-300';
    case 'ENG':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
};

export default function SafetyLspReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRealDept, setSelectedRealDept] = useState('ALL'); // Real Department filter (PRODUCTION, QUALITY, ENG, ESH, HR, LT)
  const [activeTeam, setActiveTeam] = useState('Staff'); // 'Staff' or 'Leader'
  const [customFileLoaded, setCustomFileLoaded] = useState(false);

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const defaultWorkers = cachedLspFallback?.staff || [];
  const defaultLeaders = cachedLspFallback?.leaders || [];

  const loadLspData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lsp');
      if (res.ok) {
        const json = await res.json();
        if (json && json.hasData) {
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
      hasData: true,
      lastModifiedFormatted: '11/09/2026 08:50 น.'
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

        const sheetA = wb.SheetNames.find(s => s.startsWith('A') || s.toUpperCase().includes('SALARY')) || wb.SheetNames[1] || wb.SheetNames[0];
        const sheetB = wb.SheetNames.find(s => s.startsWith('B') || s.toUpperCase().includes('HOURLY')) || wb.SheetNames[2];

        const parsedStaff = [];
        const parsedLeaders = [];

        // Parse Sheet A
        if (wb.Sheets[sheetA]) {
          const rowsA = XLSX.utils.sheet_to_json(wb.Sheets[sheetA], { header: 1, defval: '' });
          rowsA.slice(3).forEach((r) => {
            const legacy = String(r[1] || '').trim();
            const name = String(r[2] || '').trim();
            const title = String(r[3] || '').trim();
            const dept = String(r[4] || 'BCA').trim();
            const areaCode = String(r[5] || '').trim();

            if (!name || !legacy || name.toLowerCase().includes('total') || name.toLowerCase().includes('average')) return;
            if (
              legacy === '12925' || name.toLowerCase().includes('krittanan') || name.includes('กฤตนันท์') ||
              legacy === '12752' || name.toLowerCase().includes('amphai') || name.includes('อำไพ') ||
              legacy === '5645' || name.toLowerCase().includes('itsawat') || name.includes('อิษวัต')
            ) return;

            const monthly = {};
            let totalAct = 0;
            months.forEach((m, mIdx) => {
              const actIdx = 9 + (mIdx * 2);
              let val = '';
              if (r[actIdx] !== undefined && r[actIdx] !== '') {
                val = Number(r[actIdx]);
                if (isNaN(val)) val = '';
              }
              monthly[m] = val;
              if (typeof val === 'number') totalAct += val;
            });

            const rawDept = String(r[4] || '').trim().toUpperCase();
            const bc = String(r[5] || '').trim();
            const costCenter = String(r[6] || '').trim();
            const department = rawDept || (bc.startsWith('LT') ? 'LT' : 'PRODUCTION');

            parsedStaff.push({
              id: parsedStaff.length + 1,
              legacy,
              name,
              title,
              dept: bc || department,
              bc,
              department,
              costCenter,
              areaCode: bc,
              categoryGroup: getStaffCategoryGroup(bc || department),
              isLspTarget: true,
              group: 'Staff',
              monthly,
              ytdPct: Math.min(100, Math.round((totalAct / 48) * 100))
            });
          });
        }

        // Parse Sheet B
        if (sheetB && wb.Sheets[sheetB]) {
          const rowsB = XLSX.utils.sheet_to_json(wb.Sheets[sheetB], { header: 1, defval: '' });
          rowsB.slice(3).forEach((r) => {
            const legacy = String(r[1] || '').trim();
            const name = String(r[2] || '').trim();
            const title = String(r[3] || '').trim();
            const areaCode = String(r[4] || '').trim();

            if (!name || !legacy || name.toLowerCase().includes('total') || name.toLowerCase().includes('average')) return;

            const monthly = {};
            let totalAct = 0;
            months.forEach((m, mIdx) => {
              const actIdx = 7 + (mIdx * 2);
              let val = '';
              if (r[actIdx] !== undefined && r[actIdx] !== '') {
                val = Number(r[actIdx]);
                if (isNaN(val)) val = '';
              }
              monthly[m] = val;
              if (typeof val === 'number') totalAct += val;
            });

            parsedLeaders.push({
              id: parsedLeaders.length + 1,
              legacy,
              name,
              title,
              dept: 'FLM',
              areaCode,
              categoryGroup: getLeaderCategoryGroup(areaCode),
              isLspTarget: true,
              group: 'Leader',
              monthly,
              ytdPct: Math.min(100, Math.round((totalAct / 48) * 100))
            });
          });
        }

        const fileDate = file.lastModified ? new Date(file.lastModified) : new Date();
        const dd = String(fileDate.getDate()).padStart(2, '0');
        const mm = String(fileDate.getMonth() + 1).padStart(2, '0');
        const yyyy = fileDate.getFullYear();
        const hh = String(fileDate.getHours()).padStart(2, '0');
        const mi = String(fileDate.getMinutes()).padStart(2, '0');

        setData({
          file: file.name,
          lastModifiedFormatted: `${dd}/${mm}/${yyyy} ${hh}:${mi} น.`,
          year: '2026',
          staffWorkers: parsedStaff.length > 0 ? parsedStaff : defaultWorkers,
          leaderWorkers: parsedLeaders.length > 0 ? parsedLeaders : defaultLeaders,
          hasData: true
        });
        setCustomFileLoaded(true);
      } catch (err) {
        alert('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const CURRENT_MONTH_KEY = 'SEP'; // September (Month 9)
  const CURRENT_MONTH_INDEX = 9;
  const displayLastUpdate = data?.lastModifiedFormatted || '11/09/2026 08:50 น.';

  const getWorkerSepCount = (w) => {
    const val = w.monthly && w.monthly[CURRENT_MONTH_KEY];
    if (val !== undefined && val !== '' && val !== null) {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const rawStaffList = data?.staffWorkers || data?.staff || defaultWorkers;
  const staffList = rawStaffList.filter(w =>
    w.legacy !== '12752' && w.legacy !== '5645' &&
    !(w.name && (
      w.name.toLowerCase().includes('amphai') || w.name.includes('อำไพ') ||
      w.name.toLowerCase().includes('itsawat') || w.name.includes('อิษวัต')
    ))
  );
  const leaderList = data?.leaderWorkers || defaultLeaders;
  const activeWorkers = activeTeam === 'Staff' ? staffList : leaderList;

  // Filter Categories
  const staffCategories = ['ALL', 'BCA', 'BCB', 'BCB-Aero+Retread', 'LT', 'GBS+FI +Eng'];
  const leaderCategories = ['ALL', 'BCA', 'BCB (WBR)', 'BCB (AERO)', 'BCB (Sapphire)', 'RETREAD', 'ENG'];
  const categories = activeTeam === 'Staff' ? staffCategories : leaderCategories;

  const getWorkerCategory = (w) => {
    if (w.categoryGroup) return w.categoryGroup;
    return activeTeam === 'Staff' ? getStaffCategoryGroup(w.dept) : getLeaderCategoryGroup(w.areaCode);
  };

  const getCategoryCount = (cat) => {
    if (cat === 'ALL') return activeWorkers.length;
    return activeWorkers.filter(w => getWorkerCategory(w) === cat).length;
  };

  // Real Departments list for Staff (QUALITY, PRODUCTION, ENG, ESH, HR, LT)
  const realDepartments = ['ALL', 'QUALITY', 'PRODUCTION', 'ENG', 'ESH', 'HR', 'LT'];

  const filteredWorkers = activeWorkers.filter(w => {
    const cat = getWorkerCategory(w);
    const matchesDept = selectedDept === 'ALL' || cat === selectedDept;

    // Real Department matching (for Staff)
    const workerRealDept = (w.department || (w.categoryGroup === 'LT' ? 'LT' : '') || '').toUpperCase();
    const matchesRealDept = activeTeam !== 'Staff' || selectedRealDept === 'ALL' || workerRealDept === selectedRealDept;

    const matchesSearch = !searchTerm ||
      (w.name && w.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.legacy && String(w.legacy).includes(searchTerm)) ||
      (w.title && w.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.areaCode && String(w.areaCode).includes(searchTerm)) ||
      (w.dept && w.dept.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.department && w.department.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesDept && matchesRealDept && matchesSearch;
  });

  const displayWorkers = filteredWorkers;
  const totalWorkers = displayWorkers.length;
  const sepAuditsSum = displayWorkers.reduce((acc, w) => acc + getWorkerSepCount(w), 0);
  const avgSepAudits = (sepAuditsSum / (totalWorkers || 1)).toFixed(1);
  const onTargetCount = displayWorkers.filter(w => getWorkerSepCount(w) >= 4).length;
  const inProgressCount = displayWorkers.filter(w => { const c = getWorkerSepCount(w); return c >= 1 && c < 4; }).length;
  const belowTargetCount = totalWorkers - onTargetCount;

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
                <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                  <span className="text-xs md:text-sm text-emerald-200/80">
                    Thailand EHS Safety Audit Monitor & Employee Conformance Tracking ({data.file})
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 text-emerald-300 rounded-lg border border-emerald-400/40 font-extrabold text-xs shadow-md">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    ข้อมูลอัปเดตล่าสุด: {displayLastUpdate} (ตามวันแก้ไขไฟล์ Excel)
                  </span>
                </div>
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

      {/* Team View Switcher Bar (Staff vs Leader Shopfloor) */}
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
          <span>👔 ทีม Staff ({staffList.length} คน) • [BCA, BCB, BCB-Aero+Retread, LT, GBS+FI +Eng]</span>
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
          <span>👷 ทีม Leader Shopfloor / FLM ({leaderList.length} คน) • [BCA, BCB WBR/AERO/Sapphire, Retread, Eng]</span>
        </button>
      </div>

      {/* KPI Cards (4 Top Stat Cards - Dynamic per Active Team / Selected Category) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Personnel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {activeTeam === 'Staff' ? 'Staff Members' : 'Shopfloor Leaders'}
              {selectedDept !== 'ALL' && <span className="ml-1 text-slate-700">({selectedDept})</span>}
            </div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalWorkers} คน</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">
              {selectedDept === 'ALL' ? '100% Tracked Active' : `กลุ่ม ${selectedDept}`}
            </div>
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
        {/* Category Group Filter Tabs & Department Dropdown */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-400 uppercase mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              GROUP:
            </span>
            {categories.map(cat => {
              const count = getCategoryCount(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedDept(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedDept === cat
                      ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    selectedDept === cat ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Department Filter Dropdown (Active for Staff: QUALITY, PRODUCTION, ENG, ESH, HR, LT) */}
          {activeTeam === 'Staff' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-slate-500 uppercase">DEPT:</span>
              <select
                value={selectedRealDept}
                onChange={(e) => setSelectedRealDept(e.target.value)}
                className="text-xs font-bold bg-blue-50/80 text-blue-900 border border-blue-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
              >
                <option value="ALL">ทุก Department ({staffList.length} คน)</option>
                <option value="QUALITY">QUALITY ({staffList.filter(w => (w.department || '').toUpperCase() === 'QUALITY').length} คน)</option>
                <option value="PRODUCTION">PRODUCTION ({staffList.filter(w => (w.department || '').toUpperCase() === 'PRODUCTION').length} คน)</option>
                <option value="ENG">ENG ({staffList.filter(w => (w.department || '').toUpperCase() === 'ENG').length} คน)</option>
                <option value="ESH">ESH ({staffList.filter(w => (w.department || '').toUpperCase() === 'ESH').length} คน)</option>
                <option value="HR">HR ({staffList.filter(w => (w.department || '').toUpperCase() === 'HR').length} คน)</option>
                <option value="LT">LT ({staffList.filter(w => (w.department || '').toUpperCase() === 'LT').length} คน)</option>
              </select>
            </div>
          )}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name / ID / cost center / dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
      </div>

      {/* AOP vs ACT Color Legend Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 font-bold text-slate-700">
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-amber-300 rounded-xl shadow-sm font-extrabold text-[11px] border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Last Update: {displayLastUpdate}</span>
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
              {selectedDept !== 'ALL' && <span className="text-emerald-600 ml-1.5">[{selectedDept}]</span>}
              <span className="ml-2 text-xs font-normal text-slate-500">({filteredWorkers.length} คน)</span>
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
                <th className="p-3 w-32">กลุ่ม / แผนก</th>
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
              {filteredWorkers.map((w, idx) => {
                const grp = getWorkerCategory(w);
                return (
                  <tr key={w.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 pl-4 text-center font-bold text-slate-400">{w.id || idx + 1}</td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{w.legacy}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{w.name}</div>
                      {w.title && (
                        <div className="text-[10px] text-blue-600 font-semibold mt-0.5">{w.title}</div>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-500">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getGroupBadgeColor(grp)}`}>
                        {grp}
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
                );
              })}
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
