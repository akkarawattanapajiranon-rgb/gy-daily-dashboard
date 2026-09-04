import React from 'react';
import { Activity, Layers } from 'lucide-react';

export default function MixingKPIs({ data = {} }) {
  const m1 = data.mixing1 || {};
  const m2 = data.mixing2 || {};

  // Compute total metrics (from backend or weighted/simple average)
  const totalAr = data.totalAr !== undefined && data.totalAr > 0
    ? data.totalAr
    : (((m1.ar || 0) + (m2.ar || 0)) / 2);

  const totalPr = data.totalPr !== undefined && data.totalPr > 0
    ? data.totalPr
    : (((m1.pr || 0) + (m2.pr || 0)) / 2);

  const totalQr = data.totalQr !== undefined && data.totalQr > 0
    ? data.totalQr
    : (((m1.qr || 0) + (m2.qr || 0)) / 2);

  const totalOee2 = data.totalOee2 !== undefined 
    ? data.totalOee2 
    : (((m1.oee2 || 0) + (m2.oee2 || 0)) / 2);

  // Threshold Color Helpers
  // AR >= 89% -> Green, < 89% -> Red
  const getArColor = (val) => (!val ? 'text-slate-400' : val >= 89 ? 'text-emerald-400' : 'text-rose-400');
  
  // PR >= 91% -> Green, < 91% -> Red
  const getPrColor = (val) => (!val ? 'text-slate-400' : val >= 91 ? 'text-emerald-400' : 'text-rose-400');
  
  // QR >= 95% -> Green, < 95% -> Red
  const getQrColor = (val) => (!val ? 'text-slate-400' : val >= 95 ? 'text-emerald-400' : 'text-rose-400');
  
  // OEE2 >= 76.6% -> Green, < 76.6% -> Red
  const getOeeTextColor = (val) => (!val ? 'text-slate-300' : val >= 76.6 ? 'text-emerald-400' : 'text-rose-400');
  const getOeeBadgeStyle = (val) => (!val ? 'bg-white/10 border-white/20' : val >= 76.6 ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-rose-500/20 border-rose-500/40');

  // Generic color helper for individual machines (M1/M2)
  const getMetricColor = (val) => {
    if (!val) return 'text-slate-400';
    if (val >= 90) return 'text-emerald-500';
    if (val >= 80) return 'text-amber-500';
    return 'text-red-500';
  };

  const MiniMetric = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold ${getMetricColor(value)}`}>{value ? `${value}%` : '-'}</span>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-yellow" />
          Mixing Performance
        </h2>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        
        {/* Mixing 1 */}
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-brand-blue text-base">Mixing 1</p>
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Batch</span>
              <span className="text-sm font-black text-slate-700">{m1.batch || 0}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 mb-2">
            <span className="text-sm font-bold text-slate-600">OEE 2</span>
            <span className={`text-xl font-black ${getMetricColor(m1.oee2)}`}>{m1.oee2 || 0}%</span>
          </div>

          <div className="grid grid-cols-3 gap-2 px-1">
            <MiniMetric label="AR" value={m1.ar} />
            <MiniMetric label="PR" value={m1.pr} />
            <MiniMetric label="QR" value={m1.qr} />
          </div>
        </div>

        {/* Mixing 2 */}
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-brand-blue text-base">Mixing 2</p>
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Batch</span>
              <span className="text-sm font-black text-slate-700">{m2.batch || 0}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 mb-2">
            <span className="text-sm font-bold text-slate-600">OEE 2</span>
            <span className={`text-xl font-black ${getMetricColor(m2.oee2)}`}>{m2.oee2 || 0}%</span>
          </div>

          <div className="grid grid-cols-3 gap-2 px-1">
            <MiniMetric label="AR" value={m2.ar} />
            <MiniMetric label="PR" value={m2.pr} />
            <MiniMetric label="QR" value={m2.qr} />
          </div>
        </div>

        {/* Total Card (Total Batch, Total AR / PR / QR, and Total OEE 2) */}
        <div className="mt-auto bg-gradient-to-r from-brand-blue to-[#002f6c] p-4 rounded-xl border border-brand-blue/20 flex flex-col justify-between shadow-md relative overflow-hidden gap-3">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <Layers className="w-24 h-24 text-white" />
          </div>
          
          {/* Total Batch Mix */}
          <div className="flex justify-between items-center w-full z-10">
             <span className="text-brand-yellow font-bold text-sm">ยอดรวม Batch Mix</span>
             <span className="text-2xl font-black text-white drop-shadow-sm">{ (m1.batch||0) + (m2.batch||0) }</span>
          </div>

          {/* Total AR, PR, QR Grid */}
          <div className="grid grid-cols-3 gap-2 w-full z-10 pt-2 border-t border-white/10">
            <div className="flex flex-col items-center bg-white/10 p-1.5 rounded-lg border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">AR รวม</span>
              <span className={`text-base font-black ${getArColor(totalAr)}`}>
                {totalAr ? `${Number(totalAr).toFixed(1)}%` : '-'}
              </span>
            </div>
            <div className="flex flex-col items-center bg-white/10 p-1.5 rounded-lg border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">PR รวม</span>
              <span className={`text-base font-black ${getPrColor(totalPr)}`}>
                {totalPr ? `${Number(totalPr).toFixed(1)}%` : '-'}
              </span>
            </div>
            <div className="flex flex-col items-center bg-white/10 p-1.5 rounded-lg border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">QR รวม</span>
              <span className={`text-base font-black ${getQrColor(totalQr)}`}>
                {totalQr ? `${Number(totalQr).toFixed(1)}%` : '-'}
              </span>
            </div>
          </div>

          {/* Total OEE 2 Row */}
          <div className="flex justify-between items-center w-full z-10 pt-2 border-t border-white/10">
            <p className="text-brand-yellow font-bold text-sm leading-tight">
              OEE 2 รวมทั้ง 2 เครื่อง
            </p>
            <div className={`px-4 py-1 rounded-lg backdrop-blur-sm border ${getOeeBadgeStyle(totalOee2)}`}>
              <span className={`text-2xl font-black ${getOeeTextColor(totalOee2)} drop-shadow-md`}>
                {Number(totalOee2).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
