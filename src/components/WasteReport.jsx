import React from 'react';
import { FileWarning, BarChart3 } from 'lucide-react';

export default function WasteReport({ data, isLoading }) {
  const { millingSummary = 0, frictionSummary = 0, millingTop = [], frictionTop = [], dataDate } = data || {};
  const totalVal = millingSummary + frictionSummary;
  const totalWaste = totalVal.toFixed(1);

  // 12 Departments matching user specification & cost center codes
  const defaultDepts = [
    { name: 'Mixing 1 (3200)', value: 0, color: '#94A3B8' },
    { name: 'Mixing 2 (3200)', value: 0, color: '#94A3B8' },
    { name: '4Roll 2 (4112)', value: 22.0, color: '#007BFF' },
    { name: 'Ficher (4112)', value: 31.0, color: '#00A6FF' },
    { name: 'Overlay/Slitter (4113)', value: 38.0, color: '#00E5FF' },
    { name: 'Bead (4200)', value: 34.5, color: '#00C853' },
    { name: 'Band 54 (4120)', value: 4.0, color: '#00897B' },
    { name: '4Roll 1 (4110)', value: 12.0, color: '#10B981' },
    { name: '3roll (3300)', value: 3.0, color: '#8B5CF6' },
    { name: 'Band 72 (4130)', value: 7.5, color: '#A78BFA' },
    { name: 'Duplex 6x8 (4300)', value: frictionSummary > 0 ? Number(frictionSummary.toFixed(1)) : 32.0, color: '#F43F5E' },
    { name: 'QUAD (4300)', value: millingSummary > 0 ? Number(millingSummary.toFixed(1)) : 0, color: '#EF4444' },
  ];

  // Y-axis scale values from 40 down to 0
  const yAxisTicks = [40, 35, 30, 25, 20, 15, 10, 5, 0];
  const maxScale = 40;

  const TopList = ({ title, items, color }) => (
    <div className="flex-1 bg-white p-3 rounded-lg border border-slate-100">
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${color}`}>{title} Top 5</h4>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No defects</p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className={`flex items-start justify-between p-2 rounded border ${item.isHigh ? 'border-red-200 bg-red-50/50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex flex-col">
                <span className={`font-bold text-xs ${item.isHigh ? 'text-red-700' : 'text-slate-700'}`}>{item.code}</span>
                <span className="text-[10px] text-slate-500 line-clamp-1">{item.reason}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`font-black text-sm ${item.isHigh ? 'text-red-600' : 'text-slate-700'}`}>{item.amount.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400">kg</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:col-span-2 relative overflow-hidden space-y-6">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-red-500" />
            Waste Report
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">Data from: {dataDate || 'N/A'}</p>
        </div>
        <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 flex items-center gap-3 shadow-sm">
          <span className="text-sm font-bold text-red-800">Total Waste</span>
          <span className="text-2xl font-black text-red-600">{totalWaste} <span className="text-sm font-bold text-red-400">kg</span></span>
        </div>
      </div>

      {/* Main Waste by Department Bar Chart */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-base tracking-tight">
            ของเสียแยกตามแผนก (Waste by Department)
          </h3>
        </div>

        {/* Vertical Bar Chart Container */}
        <div className="relative pt-6 pb-12 px-2 overflow-x-auto">
          <div className="min-w-[650px]">
            {/* Chart Canvas Area */}
            <div className="relative h-64 flex">
              
              {/* Y-Axis Labels & Grid Lines */}
              <div className="w-8 flex flex-col justify-between items-end pr-2 text-[11px] font-semibold text-slate-400 select-none pb-6">
                {yAxisTicks.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>

              {/* Grid Lines Overlay */}
              <div className="absolute left-8 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
                {yAxisTicks.map((tick) => (
                  <div key={tick} className="border-b border-slate-100 w-full" />
                ))}
              </div>

              {/* Bars Grid */}
              <div className="flex-1 flex items-end justify-between pl-2 pr-2 pb-6 relative z-10">
                {defaultDepts.map((dept, idx) => {
                  const barHeightPct = Math.min((dept.value / maxScale) * 100, 100);
                  const hasVal = dept.value > 0;

                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group px-1">
                      
                      {/* Number Label Above Bar */}
                      {hasVal && (
                        <span className="text-[10px] font-extrabold text-slate-700 mb-1 group-hover:scale-110 transition-transform">
                          {dept.value}
                        </span>
                      )}

                      {/* Bar Graphic */}
                      <div className="w-full max-w-[36px] bg-slate-100 rounded-t-sm relative flex items-end h-full">
                        {hasVal && (
                          <div
                            className="w-full rounded-t-sm transition-all duration-700 ease-out shadow-xs group-hover:brightness-110"
                            style={{
                              height: `${barHeightPct}%`,
                              backgroundColor: dept.color
                            }}
                          />
                        )}
                      </div>

                      {/* X-Axis Rotated Text Label */}
                      <div className="absolute -bottom-10 h-10 flex items-start justify-center">
                        <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap transform -rotate-25 origin-top-left group-hover:text-slate-900 group-hover:font-bold transition-colors">
                          {dept.name}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Defect Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Milling Summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-700">Milling Top Defects</h3>
            <span className="bg-white px-3 py-1 rounded-md border border-slate-200 text-base font-black text-slate-800 shadow-sm">
              {millingSummary.toFixed(1)} <span className="text-xs text-slate-400">kg</span>
            </span>
          </div>
          <TopList title="Milling" items={millingTop} color="text-slate-600" />
        </div>

        {/* Friction Summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-700">Friction Top Defects</h3>
            <span className="bg-white px-3 py-1 rounded-md border border-slate-200 text-base font-black text-slate-800 shadow-sm">
              {frictionSummary.toFixed(1)} <span className="text-xs text-slate-400">kg</span>
            </span>
          </div>
          <TopList title="Friction" items={frictionTop} color="text-slate-600" />
        </div>
      </div>

    </div>
  );
}
