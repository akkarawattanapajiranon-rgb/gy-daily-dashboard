import React, { useState, useEffect } from 'react';
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
import { Calendar, RefreshCw } from 'lucide-react';
import { 
  fetchWasteData, 
  fetchCmsData, 
  fetchTarget3Roll, 
  fetchBreakdownData, 
  fetchFischerData, 
  fetch3RollDetail,
  fetchQuadDetail,
  fetchTuberDetail,
  fetchWorkawayData,
  fetchWeeklyOeeData
} from './services/api';

function App() {
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
  const [quadData, setQuadData] = useState(null);
  const [tuberData, setTuberData] = useState(null);
  const [workawayData, setWorkawayData] = useState(null);
  const [weeklyOeeData, setWeeklyOeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  const loadData = async (dateStr) => {
    setIsLoading(true);
    try {
      const dateToFetch = dateStr || selectedDate;
      const [waste, cms, target3Roll, breakdown, fischer, roll3, quad, tuber, workaway, weeklyOee] = await Promise.all([
        fetchWasteData(dateToFetch),
        fetchCmsData(dateToFetch),
        fetchTarget3Roll(dateToFetch),
        fetchBreakdownData(dateToFetch),
        fetchFischerData(dateToFetch),
        fetch3RollDetail(dateToFetch),
        fetchQuadDetail(dateToFetch),
        fetchTuberDetail(dateToFetch),
        fetchWorkawayData(dateToFetch),
        fetchWeeklyOeeData(dateToFetch)
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
      } else {
        setMixingData({
          mixing1: { batch: 0, ar: 0, pr: 0, qr: 0, oee2: 0 },
          mixing2: { batch: 0, ar: 0, pr: 0, qr: 0, oee2: 0 },
          totalOee2: 0
        });
      }

      setOutput3RollData({
        actual: roll3?.totalRolls || 0,
        target: target3Roll || 0,
        unit: 'meters'
      });

      setBreakdownData(breakdown);
      setFischerData(fischer);
      setRoll3Detail(roll3);
      setQuadData(quad);
      setTuberData(tuber);
      setWorkawayData(workaway);
      setWeeklyOeeData(weeklyOee);
    } catch (error) {
      console.error('Error in loadData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };


  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="bg-brand-blue text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">MU_DOR (Daily Operations Report)</h1>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-5 h-5 text-brand-yellow" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={handleDateChange}
                className="bg-white/10 text-white border border-white/20 rounded-md px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-yellow/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-brand-yellow animate-pulse' : 'bg-emerald-400 animate-pulse'}`}></div>
            <span className="text-sm font-medium">{isLoading ? 'Updating...' : 'Live Data'}</span>
            <button onClick={() => loadData()} disabled={isLoading} className="ml-2 hover:bg-white/20 p-1.5 rounded-md transition-colors" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Top Grid: Machine OEE, Mixing, Output */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <MachineOEE weeklyData={weeklyOeeData} isLoading={isLoading} />
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
    </div>
  );
}

export default App;
