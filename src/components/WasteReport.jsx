import React from 'react';
import { FileWarning, PieChart, Layers, BarChart2 } from 'lucide-react';

export default function WasteReport({ data, isLoading }) {
  const { millingSummary = 0, frictionSummary = 0, millingTop = [], frictionTop = [], deptBreakdown = [], dataDate } = data || {};
  const totalVal = millingSummary + frictionSummary;
  const totalWaste = totalVal.toFixed(1);

  // Compute department breakdown if not provided directly
  const departments = (deptBreakdown && deptBreakdown.length > 0) ? deptBreakdown : [
    {
      dept: 'Friction',
      amount: Number(frictionSummary.toFixed(1)),
      percentage: totalVal > 0 ? parseFloat((frictionSummary / totalVal * 100).toFixed(1)) : 0,
      color: 'from-rose-500 to-red-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      textColor: 'text-rose-700',
      badgeBg: 'bg-rose-100 text-rose-800'
    },
    {
      dept: 'Milling',
      amount: Number(millingSummary.toFixed(1)),
      percentage: totalVal > 0 ? parseFloat((millingSummary / totalVal * 100).toFixed(1)) : 0,
      color: 'from-indigo-500 to-blue-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      badgeBg: 'bg-indigo-100 text-indigo-800'
    }
  ];

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:col-span-2 relative overflow-hidden space-y-5">
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

      {/* Department Breakdown Graph Section */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">สัดส่วน Waste แยกตามแผนก (Department Breakdown)</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            รวม {departments.length} แผนก
          </span>
        </div>

        {/* Stacked Department Proportion Bar Graph */}
        <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden flex shadow-inner">
          {departments.map((deptItem, idx) => {
            const widthPct = deptItem.percentage;
            if (widthPct <= 0) return null;
            const barColors = [
              'bg-gradient-to-r from-rose-500 to-red-600',
              'bg-gradient-to-r from-indigo-500 to-blue-600',
              'bg-gradient-to-r from-amber-500 to-orange-600',
              'bg-gradient-to-r from-emerald-500 to-teal-600'
            ];
            return (
              <div
                key={idx}
                className={`${barColors[idx % barColors.length]} h-full transition-all duration-500 relative group`}
                style={{ width: `${widthPct}%` }}
                title={`แผนก ${deptItem.dept}: ${deptItem.amount} kg (${widthPct}%)`}
              />
            );
          })}
        </div>

        {/* Department Cards Grid with Exact Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 pt-1">
          {departments.map((deptItem, idx) => {
            const isFriction = deptItem.dept.toLowerCase().includes('friction');
            const cardBg = isFriction ? 'bg-rose-50/60 border-rose-200/70' : 'bg-indigo-50/60 border-indigo-200/70';
            const textColor = isFriction ? 'text-rose-800' : 'text-indigo-800';
            const badgeBg = isFriction ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700';
            const barColor = isFriction ? 'bg-rose-500' : 'bg-indigo-600';

            return (
              <div key={idx} className={`p-3 rounded-lg border ${cardBg} flex flex-col justify-between space-y-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${barColor}`} />
                    <span className={`font-bold text-xs ${textColor}`}>แผนก {deptItem.dept}</span>
                  </div>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${badgeBg}`}>
                    {deptItem.percentage}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-800">{deptItem.amount.toFixed(1)}</span>
                  <span className="text-xs font-semibold text-slate-500">kg</span>
                </div>

                {/* Individual Department Progress Bar */}
                <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                  <div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${Math.min(deptItem.percentage, 100)}%` }} />
                </div>
              </div>
            );
          })}
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
