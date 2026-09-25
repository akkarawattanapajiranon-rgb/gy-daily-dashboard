import React, { useState, useEffect, useCallback, useRef } from 'react';
import { mockData } from './data/mockData';
import MixingKPIs from './components/MixingKPIs';
import MachineOEE from './components/MachineOEE';
import Output3Roll from './components/Output3Roll';
import WasteReport from './components/WasteReport';
import BreakdownStats from './components/BreakdownStats';
import FischerReport from './components/FischerReport';
import QuadReport from './components/QuadReport';
import TuberReport from './components/TuberReport';
import WorkawayReport from './components/WorkawayReport';
import ExtruderTimeline from './components/extruder-timeline/ExtruderTimeline';
import SafetyLspReport from './components/SafetyLspReport';
import DataExporter from './components/DataExporter';
import Roll42Report from './components/Roll42Report';
import ComponentDelayContainer from './components/ComponentDelayContainer';
import { Calendar, RefreshCw, LayoutDashboard, Clock, ShieldCheck, Download, Layers, AlertTriangle } from 'lucide-react';
import { 
  fetchWasteData, 
  fetchCmsData, 
  fetchTarget3Roll, 
  fetchBreakdownData, 
  fetchFischerData, 
  fetch3RollDetail,
  fetch4Roll2Detail,
  fetchQuadDetail,
  fetchTuberDetail,
  fetchWorkawayData,
  fetchWeeklyOeeData,
  fetchFast,
  getLocalSnapshot
} from './services/api';

class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Tab render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-sm text-center my-6">
          <div className="inline-flex p-3 bg-rose-50 text-rose-600 rounded-2xl mb-3">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">เกิดข้อผิดพลาดในการแสดงผลหน้านี้</h3>
          <p className="text-xs text-rose-600 mt-1 font-mono max-w-lg mx-auto bg-rose-50 p-2 rounded-lg">
            {this.state.error?.message || 'Unknown render error'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            ลองใหม่อีกครั้ง (Reload Tab)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const getInitialTab = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t && ['dor', 'aero', 'extruder', 'safety', 'exporter'].includes(t.toLowerCase())) {
        return t.toLowerCase();
      }
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash && ['dor', 'aero', 'extruder', 'safety', 'exporter'].includes(hash)) {
        return hash;
      }
    } catch (e) {}
    return 'dor';
  };

  const isAppMode = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isLspPath = window.location.pathname.startsWith('/lsp');
      return isLspPath || params.get('mode') === 'app' || params.get('standalone') === 'true' || params.get('app') === 'true';
    } catch (e) {}
    return false;
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [appMode] = useState(isAppMode);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url);
    } catch (e) {}
  };
  const [wasteData, setWasteData] = useState({
    millingSummary: 0,
    frictionSummary: 0,
    beadSummary: 0,
    millingTop: [],
    frictionTop: [],
    beadTop: [],
    dataDate: 'N/A'
  });
  const [mixingData, setMixingData] = useState({
    mixing1: { batch: 0, ar: 0, pr: 0, qr: 0, oee2: 0 },
    mixing2: { batch: 0, ar: 0, pr: 0, qr: 0, oee2: 0 },
    totalOee2: 0
  });
  const [output3RollData, setOutput3RollData] = useState({
    actual: 0,
    target: 0,
    unit: 'meters'
  });
  const [breakdownData, setBreakdownData] = useState(null);
  const [fischerData, setFischerData] = useState(null);
  const [roll3Detail, setRoll3Detail] = useState(null);
  const [roll42Data, setRoll42Data] = useState(null);
  const [quadData, setQuadData] = useState(null);
  const [tuberData, setTuberData] = useState(null);
  const [workawayData, setWorkawayData] = useState(null);
  const [weeklyOeeData, setWeeklyOeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const todayStr = React.useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const minDateStr = React.useMemo(() => {
    const d = new Date();
    const cutoff = new Date(d.getTime() - 14 * 86400000); // Past 15 days window (today - 14 days)
    return `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const applySnapshotData = (snap) => {
    if (!snap) return false;
    if (snap.waste) setWasteData(snap.waste);
    if (snap.cms) {
      setMixingData({
        mixing1: { 
          batch: Number(snap.cms.mixing1?.batch) || 0,
          ar: Number(snap.cms.mixing1?.ar) || 0,
          pr: Number(snap.cms.mixing1?.pr) || 0,
          qr: Number(snap.cms.mixing1?.qr) || 0,
          oee2: Number(snap.cms.mixing1?.oee2) || 0 
        },
        mixing2: { 
          batch: Number(snap.cms.mixing2?.batch) || 0,
          ar: Number(snap.cms.mixing2?.ar) || 0,
          pr: Number(snap.cms.mixing2?.pr) || 0,
          qr: Number(snap.cms.mixing2?.qr) || 0,
          oee2: Number(snap.cms.mixing2?.oee2) || 0 
        },
        totalOee2: Number(snap.cms.totalOee2) || 0
      });
    }
    setOutput3RollData({
      actual: snap.roll3?.totalRolls || 0,
      target: snap.target3Roll || 0,
      unit: 'meters'
    });
    if (snap.breakdown) setBreakdownData(snap.breakdown);
    if (snap.fischer) setFischerData(snap.fischer);
    if (snap.roll3) setRoll3Detail(snap.roll3);
    if (snap.roll42) setRoll42Data(snap.roll42);
    if (snap.quad) setQuadData(snap.quad);
    if (snap.tuber) setTuberData(snap.tuber);
    if (snap.workaway) setWorkawayData(snap.workaway);
    if (snap.weeklyOee) setWeeklyOeeData(snap.weeklyOee);
    return true;
  };

  const loadData = useCallback(async (dateStr, forceRefresh = false) => {
    const dateToFetch = dateStr || selectedDate;
    
    // 1. Instant 0ms Preload: If cached local snapshot exists, paint UI immediately!
    if (!forceRefresh) {
      const localSnap = getLocalSnapshot(dateToFetch);
      if (localSnap) {
        applySnapshotData(localSnap);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
    } else {
      setIsLoading(true);
    }

    try {
      const [waste, cms, target3Roll, breakdown, fischer, roll3, roll42, quad, tuber, workaway, weeklyOee] = await Promise.all([
        fetchWasteData(dateToFetch, forceRefresh),
        fetchCmsData(dateToFetch, forceRefresh),
        fetchTarget3Roll(dateToFetch, forceRefresh),
        fetchBreakdownData(dateToFetch, forceRefresh),
        fetchFischerData(dateToFetch, forceRefresh),
        fetch3RollDetail(dateToFetch, forceRefresh),
        fetch4Roll2Detail(dateToFetch, forceRefresh),
        fetchQuadDetail(dateToFetch, forceRefresh),
        fetchTuberDetail(dateToFetch, forceRefresh),
        fetchWorkawayData(dateToFetch, forceRefresh),
        fetchWeeklyOeeData(dateToFetch, forceRefresh)
      ]);

      if (waste) {
        setWasteData(waste);
      }
      
      if (cms) {
        setMixingData({
          mixing1: { 
            batch: Number(cms.mixing1?.batch) || 0,
            ar: Number(cms.mixing1?.ar) || 0,
            pr: Number(cms.mixing1?.pr) || 0,
            qr: Number(cms.mixing1?.qr) || 0,
            oee2: Number(cms.mixing1?.oee2) || 0 
          },
          mixing2: { 
            batch: Number(cms.mixing2?.batch) || 0,
            ar: Number(cms.mixing2?.ar) || 0,
            pr: Number(cms.mixing2?.pr) || 0,
            qr: Number(cms.mixing2?.qr) || 0,
            oee2: Number(cms.mixing2?.oee2) || 0 
          },
          totalOee2: Number(cms.totalOee2) || 0
        });
      }

      setOutput3RollData({
        actual: roll3?.totalRolls || 0,
        target: target3Roll || 0,
        unit: 'meters'
      });

      if (breakdown) setBreakdownData(breakdown);
      if (fischer) setFischerData(fischer);
      if (roll3) setRoll3Detail(roll3);
      if (roll42) setRoll42Data(roll42);
      if (quad) setQuadData(quad);
      if (tuber) setTuberData(tuber);
      if (workaway) setWorkawayData(workaway);
      if (weeklyOee) setWeeklyOeeData(weeklyOee);
    } catch (error) {
      console.error('Error in loadData:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!appMode) {
      loadData(selectedDate);
    }
  }, [selectedDate, appMode]);

  // Emergency Watchdog: Prevent loading spinner from ever being stuck
  useEffect(() => {
    if (isLoading) {
      const watchdog = setTimeout(() => {
        setIsLoading(false);
      }, 12000);
      return () => clearTimeout(watchdog);
    }
  }, [isLoading]);

  // Wake-from-Sleep Auto-Recovery (Triggers only when PC wakes from standby/sleep)
  useEffect(() => {
    let lastActiveTime = Date.now();

    const heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActiveTime;
      lastActiveTime = now;

      // If timer was suspended for > 35s (computer slept or lid closed)
      if (elapsed > 35000) {
        console.log(`[App] Computer resumed from sleep (${Math.round(elapsed / 1000)}s paused). Auto-refreshing...`);
        setIsLoading(false);

        // Auto-advance date if PC was asleep across midnight
        const d = new Date();
        const curToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setSelectedDate(prev => {
          const prevD = new Date(now - elapsed);
          const prevToday = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}-${String(prevD.getDate()).padStart(2, '0')}`;
          if (prev === prevToday && curToday !== prevToday) {
            return curToday;
          }
          return prev;
        });

        loadData(undefined, true);
      }
    }, 10000);

    return () => clearInterval(heartbeatTimer);
  }, [loadData]);

  // Periodic 3-Minute Background Live Poller (Keeps dashboard active & updated)
  useEffect(() => {
    if (appMode) return;
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('[App] 3-Minute auto-poll refreshing live data...');
        loadData(selectedDate, false);
      }
    }, 180000);

    return () => clearInterval(pollInterval);
  }, [selectedDate, appMode, loadData]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleLiveRefresh = async () => {
    // Force re-fetch ข้อมูลสดจาก API ทั้งหน้า 1 (DOR) และ หน้า 5 (Data Exporter)
    setRefreshTrigger(prev => prev + 1);
    await loadData(selectedDate, true);
    try {
      const yyyyMm = selectedDate.substring(0, 7);
      fetchFast(`/api/export-metrics?startDate=${yyyyMm}-01&endDate=${selectedDate}&refresh=true`, 25000).catch(() => {});
    } catch (e) {}
  };

  // LSP Dedicated Standalone Desktop Mode: Show ONLY LSP (No other tabs)
  if (appMode) {
    return (
      <div className="min-h-screen bg-slate-100 p-3 md:p-6 font-sans">
        <div className="max-w-7xl mx-auto space-y-6">
          <TabErrorBoundary>
            <SafetyLspReport />
          </TabErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="bg-white p-2 md:p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <nav className="flex items-center justify-between gap-1.5 md:gap-2.5 w-full">
            <button
              onClick={() => setActiveTab('dor')}
              className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm md:text-base whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'dor'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              <span>หน้า 1: MU_DOR</span>
            </button>

            <button
              onClick={() => setActiveTab('aero')}
              className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm md:text-base whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'aero'
                  ? 'bg-indigo-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4 md:w-5 md:h-5 text-indigo-300 shrink-0" />
              <span>หน้า 2: Delay (Aero & WBR)</span>
            </button>

            <button
              onClick={() => setActiveTab('extruder')}
              className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm md:text-base whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'extruder'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-brand-yellow shrink-0" />
              <span>หน้า 3: Extruder (TAW)</span>
            </button>

            <button
              onClick={() => setActiveTab('safety')}
              className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm md:text-base whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'safety'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 shrink-0" />
              <span>หน้า 4: Safety (LSP)</span>
            </button>

            <button
              onClick={() => setActiveTab('exporter')}
              className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm md:text-base whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'exporter'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Download className="w-4 h-4 md:w-5 md:h-5 text-blue-300 shrink-0" />
              <span>หน้า 5: Export Data</span>
            </button>
          </nav>
        </div>

        {/* PAGE 1: Daily Operations Report (MU_DOR) */}
        {activeTab === 'dor' && (
          <div className="space-y-6">
            {/* Header */}
            <header className="bg-brand-blue text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">MU_DOR (Daily Operations Report)</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Calendar className="w-5 h-5 text-brand-yellow" />
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={handleDateChange}
                    className="bg-white/10 text-white border border-white/20 rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-yellow/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleLiveRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 active:scale-95 px-3.5 py-1.5 rounded-lg backdrop-blur-sm transition-all cursor-pointer border border-white/20 shadow-md group"
                  title="กดเพื่อ รีเฟรชหน้าเว็บ (F5) อ่านและ Parsing ข้อมูลจากไฟล์ Excel บนไดรฟ์ T: และ CMS สดๆ ทันที 100%"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-brand-yellow animate-pulse' : 'bg-emerald-400 animate-pulse'}`}></div>
                  <span className="text-xs md:text-sm font-bold tracking-wide">{isLoading ? 'Updating...' : 'Live Data (กดดึงข้อมูลสด F5)'}</span>
                  <RefreshCw className={`w-4 h-4 text-emerald-300 group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </header>

            {/* Top Grid: Machine OEE, Mixing, Output */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <MachineOEE weeklyData={weeklyOeeData} isLoading={isLoading} mixingData={mixingData} />
              </div>
              <div className="lg:col-span-1">
                <MixingKPIs data={mixingData} />
              </div>
              <div className="lg:col-span-1">
                <Output3Roll data={output3RollData} rollDetail={roll3Detail} isLoading={isLoading} />
              </div>
            </div>

            {/* Fischer Shear Section */}
            <div className="grid grid-cols-1 gap-6">
              <FischerReport data={fischerData} isLoading={isLoading} />
            </div>

            {/* Quad & Tuber Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <QuadReport data={quadData} loading={isLoading} />
              <TuberReport data={tuberData} loading={isLoading} />
            </div>

            {/* 4 Roll #2 Section */}
            <div className="grid grid-cols-1 gap-6">
              <Roll42Report data={roll42Data} loading={isLoading} />
            </div>

            {/* Workaway Inventory Section */}
            <div className="grid grid-cols-1 gap-6">
              <WorkawayReport data={workawayData} isLoading={isLoading} />
            </div>

            {/* Waste and Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <WasteReport data={wasteData} isLoading={isLoading} />
              <BreakdownStats data={breakdownData} isLoading={isLoading} />
            </div>
          </div>
        )}

        {/* PAGE 2: Component Delay (Aero & WBR) */}
        {activeTab === 'aero' && (
          <div className="space-y-6">
            <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2.5">
                  <Layers className="w-7 h-7 text-indigo-400" />
                  Component Delay Reports (Aero & WBR)
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Calendar className="w-5 h-5 text-indigo-300" />
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={handleDateChange}
                    className="bg-white/10 text-white border border-white/20 rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  />
                </div>
              </div>
              <button
                onClick={handleLiveRefresh}
                disabled={isLoading}
                className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 active:scale-95 px-3.5 py-1.5 rounded-lg backdrop-blur-sm transition-all cursor-pointer border border-white/20 shadow-md group"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-brand-yellow animate-pulse' : 'bg-emerald-400 animate-pulse'}`}></div>
                <span className="text-xs md:text-sm font-bold tracking-wide">{isLoading ? 'Updating...' : 'Live Data (กดดึงข้อมูลสด F5)'}</span>
                <RefreshCw className={`w-4 h-4 text-emerald-300 group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </header>
            <ComponentDelayContainer date={selectedDate} />
          </div>
        )}

        {/* PAGE 3: Extruder — TAW Actual vs Spec */}
        {activeTab === 'extruder' && (
          <div className="space-y-6">
            <ExtruderTimeline 
              endpoint="/api/extruder-timeline" 
              pollMs={600000} 
              date={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        )}

        {/* PAGE 4: Safety (EHS & LSP) */}
        {activeTab === 'safety' && (
          <div className="space-y-6">
            <TabErrorBoundary>
              <SafetyLspReport />
            </TabErrorBoundary>
          </div>
        )}

        {/* PAGE 5: โหลดข้อมูลตัวเลข (Export) */}
        {activeTab === 'exporter' && (
          <div className="space-y-6">
            <TabErrorBoundary>
              <DataExporter 
                refreshTrigger={refreshTrigger}
                selectedDate={selectedDate}
                onRefreshPage1={() => loadData(selectedDate, true)}
              />
            </TabErrorBoundary>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
