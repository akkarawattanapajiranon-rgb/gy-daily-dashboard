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
import { Calendar, RefreshCw } from 'lucide-react';
import { 
  fetchWasteData, 
  fetchCmsData, 
  fetchTarget3Roll, 
  fetchBreakdownData, 
  fetchFischerData, 
  fetch3RollDetail,
  fetchQuadDetail,
  fetchTuberDetail
} from './services/api';

function App() {
  const [wasteData, setWasteData] = useState(mockData.wasteReport);
  const [mixingData, setMixingData] = useState(mockData.mixing);
  const [output3RollData, setOutput3RollData] = useState(mockData.output3Roll);
  const [breakdownData, setBreakdownData] = useState(null);
  const [fischerData, setFischerData] = useState(null);
  const [roll3Detail, setRoll3Detail] = useState(null);
  const [quadData, setQuadData] = useState(null);
  const [tuberData, setTuberData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  const loadData = async (dateStr) => {
    setIsLoading(true);
    try {
      const dateToFetch = dateStr || selectedDate;
      const [waste, cms, target3Roll, breakdown, fischer, roll3, quad, tuber] = await Promise.all([
        fetchWasteData(dateToFetch),
        fetchCmsData(dateToFetch),
        fetchTarget3Roll(dateToFetch),
        fetchBreakdownData(dateToFetch),
        fetchFischerData(dateToFetch),
        fetch3RollDetail(dateToFetch),
        fetchQuadDetail(dateToFetch),
        fetchTuberDetail(dateToFetch)
      ]);

      if (waste) {
        setWasteData(waste);
      }
      
      if (cms) {
        setMixingData(prev => ({
          ...prev,
          mixing1: { 
            ...prev.mixing1, 
            batch: cms.mixing1.batch,
            ar: cms.mixing1.ar,
            pr: cms.mixing1.pr,
            qr: cms.mixing1.qr,
            oee2: cms.mixing1.oee2 
          },
          mixing2: { 
            ...prev.mixing2, 
            batch: cms.mixing2.batch,
            ar: cms.mixing2.ar,
            pr: cms.mixing2.pr,
            qr: cms.mixing2.qr,
            oee2: cms.mixing2.oee2 
          },
          totalOee2: cms.totalOee2
        }));
      }

      if (target3Roll !== null) {
        setOutput3RollData(prev => ({
          ...prev,
          target: target3Roll
        }));
      }

      if (breakdown) {
        setBreakdownData(breakdown);
      }

      if (fischer) {
        setFischerData(fischer);
      }

      if (roll3) {
        setRoll3Detail(roll3);
      }

      if (quad) {
        setQuadData(quad);
      }

      if (tuber) {
        setTuberData(tuber);
      }
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

  // Dynamic Machine OEE 2 values (Strictly matched with reports below; null when no data)
  const machineOEEData = {
    quad: quadData?.oee?.hasData ? quadData.oee.oee2_pct : null,
    tuber6x8: tuberData?.oee?.hasData ? tuberData.oee.oee2_pct : null,
    fiscer: fischerData?.oee?.hasData ? fischerData.oee.oee2_pct : null
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

        {/* Top Grid: Mixing, Machine OEE, Output */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <MixingKPIs data={mixingData} />
          </div>
          <div className="lg:col-span-1">
            <MachineOEE data={machineOEEData} />
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

        {/* Bottom Grid: Waste and Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <WasteReport data={wasteData} isLoading={isLoading} />
          <BreakdownStats data={breakdownData} isLoading={isLoading} />
        </div>

      </div>
    </div>
  );
}

export default App;
