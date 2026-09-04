import React from 'react';
import { FileWarning } from 'lucide-react';

export default function WasteReport({ data, isLoading }) {
  const { millingSummary = 0, frictionSummary = 0, beadSummary = 0, millingTop = [], frictionTop = [], beadTop = [], dataDate } = data || {};
  const totalVal = millingSummary + frictionSummary + beadSummary;
  const totalWaste = totalVal.toFixed(1);

  const getWasteBadgeStyle = (val, maxTarget) => {
    if (val <= maxTarget) {
      return {
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        statusText: `✓ ไม่เกิน Target (${maxTarget} kg)`,
        statusColor: 'text-emerald-600'
      };
    }
    return {
      badgeClass: 'bg-red-50 text-red-600 border-red-200',
      statusText: `▲ เกิน Target (${maxTarget} kg)`,
      statusColor: 'text-red-500'
    };
  };

  const millingStyle = getWasteBadgeStyle(millingSummary, 265);
  const frictionStyle = getWasteBadgeStyle(frictionSummary, 285);
  const beadStyle = getWasteBadgeStyle(beadSummary, 30);

  const TopList = ({ title, items, color }) => (
    <div className="flex-1 bg-white p-3 rounded-lg border border-slate-100 mt-2">
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:col-span-2 relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
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

      {/* Top 5 Defect Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Milling Summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-1">
            <div>
              <h3 className="font-bold text-slate-800">Milling</h3>
              <p className={`text-[10px] font-semibold ${millingStyle.statusColor}`}>
                {millingStyle.statusText}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-md border text-lg font-black shadow-2xs ${millingStyle.badgeClass}`}>
              {millingSummary.toFixed(1)} <span className="text-xs font-semibold opacity-75">kg</span>
            </span>
          </div>
          <TopList title="Milling" items={millingTop} color="text-slate-600" />
        </div>

        {/* Friction Summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-1">
            <div>
              <h3 className="font-bold text-slate-800">Friction</h3>
              <p className={`text-[10px] font-semibold ${frictionStyle.statusColor}`}>
                {frictionStyle.statusText}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-md border text-lg font-black shadow-2xs ${frictionStyle.badgeClass}`}>
              {frictionSummary.toFixed(1)} <span className="text-xs font-semibold opacity-75">kg</span>
            </span>
          </div>
          <TopList title="Friction" items={frictionTop} color="text-slate-600" />
        </div>

        {/* Bead Summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-1">
            <div>
              <h3 className="font-bold text-slate-800">Bead</h3>
              <p className={`text-[10px] font-semibold ${beadStyle.statusColor}`}>
                {beadStyle.statusText}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-md border text-lg font-black shadow-2xs ${beadStyle.badgeClass}`}>
              {beadSummary.toFixed(1)} <span className="text-xs font-semibold opacity-75">kg</span>
            </span>
          </div>
          <TopList title="Bead" items={beadTop} color="text-slate-600" />
        </div>
      </div>

    </div>
  );
}
