import React from 'react';
import { Wrench, AlertTriangle, CheckCircle } from 'lucide-react';

const EQUIPMENT_COLORS = {
  'Banbury':   { bar: '#3b82f6', bg: '#eff6ff' },
  'Extruder':  { bar: '#8b5cf6', bg: '#f5f3ff' },
  'Calender':  { bar: '#f97316', bg: '#fff7ed' },
  'Cutting':   { bar: '#06b6d4', bg: '#ecfeff' },
};

function BDBar({ label, targetPct, actualPct, colors }) {
  const isOverTarget = actualPct > targetPct;
  const maxVal = Math.max(targetPct, actualPct, 0.01);
  const scale = 100 / (maxVal * 1.3); // normalize to fill bar

  const targetWidth = Math.min(targetPct * scale, 100);
  const actualWidth = Math.min(actualPct * scale, 100);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Target: {(targetPct * 100).toFixed(2)}%</span>
          <span className={`font-bold ${isOverTarget ? 'text-red-600' : 'text-emerald-600'}`}>
            Actual: {(actualPct * 100).toFixed(2)}%
          </span>
          {isOverTarget
            ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            : <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="relative h-6 rounded-md overflow-hidden" style={{ background: '#f1f5f9' }}>
        {/* Target bar */}
        <div
          className="absolute top-0 left-0 h-full opacity-30 rounded-md transition-all duration-500"
          style={{ width: `${targetWidth}%`, background: colors.bar }}
        />
        {/* Actual bar */}
        <div
          className="absolute top-0 left-0 h-full rounded-md transition-all duration-700"
          style={{
            width: `${actualWidth}%`,
            background: isOverTarget ? '#ef4444' : colors.bar,
          }}
        />
        {/* Target line marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white/80"
          style={{ left: `${targetWidth}%` }}
        />
      </div>
    </div>
  );
}

export default function BreakdownStats({ data, isLoading }) {
  const equipments = ['Banbury', 'Extruder', 'Calender', 'Cutting'];

  // Calculate overall BD% weighted average
  let totalFailTarget = 0, totalFailActual = 0, totalSch = 0;
  if (data && !data.error) {
    equipments.forEach(eq => {
      const d = data[eq];
      if (d) {
        totalFailTarget += d.fail_hr_target || 0;
        totalFailActual += d.fail_hr_actual || 0;
        totalSch += d.sch_hr || 0;
      }
    });
  }
  const overallTarget = totalSch > 0 ? (totalFailTarget / totalSch) : 0;
  const overallActual = totalSch > 0 ? (totalFailActual / totalSch) : 0;
  const overallOver = overallActual > overallTarget;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 col-span-1 md:col-span-2 lg:col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
          <Wrench className="w-5 h-5 text-slate-400" />
          Engineering Breakdown (BD%)
        </h2>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-300 opacity-50" />
            <span className="text-slate-500">Target</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span className="text-slate-500">Actual</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full mr-2" />
          Loading Breakdown data...
        </div>
      ) : !data || data.error ? (
        <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
          <Wrench className="w-8 h-8" />
          <p className="text-sm">{data?.error || 'No breakdown data available'}</p>
          <p className="text-xs text-slate-300">Check if T: drive file is accessible</p>
        </div>
      ) : (
        <>
          {/* Overall Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Overall BD% Target</p>
              <p className="text-2xl font-black text-slate-700">{(overallTarget * 100).toFixed(2)}%</p>
            </div>
            <div className={`border rounded-lg p-3 text-center ${overallOver ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className={`text-xs font-semibold uppercase mb-1 ${overallOver ? 'text-red-500' : 'text-emerald-600'}`}>
                Overall BD% Actual
              </p>
              <p className={`text-2xl font-black ${overallOver ? 'text-red-600' : 'text-emerald-700'}`}>
                {(overallActual * 100).toFixed(2)}%
              </p>
              <p className="text-xs mt-1 text-slate-400">
                Loss: {(totalFailActual).toFixed(1)} hrs
              </p>
            </div>
          </div>

          {/* Per-equipment bars */}
          <div>
            {equipments.map(eq => {
              const d = data[eq];
              if (!d) return null;
              const colors = EQUIPMENT_COLORS[eq] || { bar: '#6b7280', bg: '#f9fafb' };
              return (
                <BDBar
                  key={eq}
                  label={eq}
                  targetPct={d.target_bd_pct || 0}
                  actualPct={d.actual_bd_pct || 0}
                  colors={colors}
                />
              );
            })}
          </div>

          {/* Fail hour table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-2 border border-slate-200 font-semibold text-slate-600">Area</th>
                  <th className="text-center p-2 border border-slate-200 font-semibold text-slate-600">Sch Hr</th>
                  <th className="text-center p-2 border border-slate-200 font-semibold text-blue-600">Target Fail Hr</th>
                  <th className="text-center p-2 border border-slate-200 font-semibold text-slate-600">Actual Fail Hr</th>
                  <th className="text-center p-2 border border-slate-200 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {equipments.map(eq => {
                  const d = data[eq];
                  if (!d) return null;
                  const over = d.fail_hr_actual > d.fail_hr_target;
                  return (
                    <tr key={eq} className={over ? 'bg-red-50' : ''}>
                      <td className="p-2 border border-slate-200 font-medium">{eq}</td>
                      <td className="p-2 border border-slate-200 text-center text-slate-500">{d.sch_hr}</td>
                      <td className="p-2 border border-slate-200 text-center text-blue-600 font-medium">{d.fail_hr_target}</td>
                      <td className={`p-2 border border-slate-200 text-center font-bold ${over ? 'text-red-600' : 'text-emerald-600'}`}>
                        {d.fail_hr_actual}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        {over
                          ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">OVER</span>
                          : <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">OK</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
