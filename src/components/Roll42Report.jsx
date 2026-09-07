import React from 'react';
import { Layers, Activity, CheckCircle2, Clock, BarChart2 } from 'lucide-react';

export default function Roll42Report({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse flex items-center justify-center min-h-[220px]">
        <div className="flex items-center gap-3 text-slate-400 font-bold">
          <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <span>Loading 4 Roll #2 Output Data...</span>
        </div>
      </div>
    );
  }

  const hasData = data && data.hasData;
  const totalRolls = data?.totalRolls || 0;
  const totalMeters = data?.totalMeters || 0;
  const shifts = data?.shifts || {
    shift1: { rolls: 0, meters: 0 },
    shift2: { rolls: 0, meters: 0 },
    shift3: { rolls: 0, meters: 0 }
  };
  const topCodes = data?.topCodes || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              4 Roll #2 Production Output
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                Productivity Check Sheet
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              ยอดการผลิตรายกะและสรุปความยาวม้วน (4 Roll 2 Check Sheet)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasData ? (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live File Active</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-black">
              No Data Today
            </span>
          )}
        </div>
      </div>

      {/* Main KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Rolls Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
          <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Total Rolls Produced</div>
          <div className="text-3xl font-black mt-1 flex items-baseline gap-2">
            {totalRolls.toLocaleString()} <span className="text-sm font-bold text-indigo-200">ม้วน (Rolls)</span>
          </div>
          <div className="text-[11px] text-indigo-200/80 mt-2 flex items-center gap-1 font-semibold">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>4 Roll 2 Daily Production</span>
          </div>
        </div>

        {/* Total Meters Card */}
        <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
          <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">Total Output Length</div>
          <div className="text-3xl font-black mt-1 text-emerald-400 flex items-baseline gap-2">
            {totalMeters.toLocaleString()} <span className="text-sm font-bold text-blue-200">เมตร (Meters)</span>
          </div>
          <div className="text-[11px] text-blue-200/80 mt-2 flex items-center gap-1 font-semibold">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sum of All Component Lenghts</span>
          </div>
        </div>
      </div>

      {/* Shifts Breakdown Progress Bar */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            Shift Output Breakdown (แยกรายกะ 1 / 2 / 3)
          </span>
          <span className="text-slate-400 font-semibold">Total: {totalRolls} ม้วน</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Shift 1 */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">Shift 1</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                {shifts.shift1.rolls} ม้วน
              </span>
            </div>
            <div className="text-lg font-black text-slate-800 mt-1">
              {shifts.shift1.meters.toLocaleString()} <span className="text-xs font-normal text-slate-500">M</span>
            </div>
          </div>

          {/* Shift 2 */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">Shift 2</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                {shifts.shift2.rolls} ม้วน
              </span>
            </div>
            <div className="text-lg font-black text-slate-800 mt-1">
              {shifts.shift2.meters.toLocaleString()} <span className="text-xs font-normal text-slate-500">M</span>
            </div>
          </div>

          {/* Shift 3 */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">Shift 3</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                {shifts.shift3.rolls} ม้วน
              </span>
            </div>
            <div className="text-lg font-black text-slate-800 mt-1">
              {shifts.shift3.meters.toLocaleString()} <span className="text-xs font-normal text-slate-500">M</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Component Codes Table */}
      {topCodes.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Component Codes Produced Today</span>
            <span className="text-[11px] text-slate-400 font-medium">{topCodes.length} Specs</span>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 text-slate-700 font-bold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-2.5 pl-3">Component / Spec</th>
                    <th className="p-2.5 text-center">Roll Count</th>
                    <th className="p-2.5 text-right pr-3">Total Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-medium">
                  {topCodes.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white transition-colors">
                      <td className="p-2 pl-3 font-bold text-slate-800">{item.code}</td>
                      <td className="p-2 text-center font-bold text-indigo-700">
                        <span className="px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100">
                          {item.rolls} ม้วน
                        </span>
                      </td>
                      <td className="p-2 text-right pr-3 font-bold text-slate-700">
                        {item.meters.toLocaleString()} m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
