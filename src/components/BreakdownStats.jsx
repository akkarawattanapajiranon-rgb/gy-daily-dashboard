import React from 'react';
import { Wrench, AlertTriangle, CheckCircle, MinusCircle } from 'lucide-react';

const EQUIPMENT_COLORS = {
  'Banbury':  { bar: '#3b82f6' },
  'Extruder': { bar: '#8b5cf6' },
  'Calender': { bar: '#f97316' },
  'Cutting':  { bar: '#06b6d4' },
};

function BDBar({ label, targetPct, actualPct, hasData, colors }) {
  const isOver = hasData && actualPct > targetPct;
  const maxVal = Math.max(targetPct, hasData ? actualPct : 0, 0.001);
  const scale = 100 / (maxVal * 1.4);

  const targetWidth = Math.min(targetPct * scale, 100);
  const actualWidth = hasData ? Math.min(actualPct * scale, 100) : 0;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-slate-700 w-24">{label}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">
            Target: <span className="font-semibold text-slate-600">{targetPct.toFixed(2)}%</span>
          </span>
          {hasData ? (
            <span className={`font-bold ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
              Actual: {actualPct.toFixed(2)}%
            </span>
          ) : (
            <span className="text-slate-300 italic text-xs">Actual: —</span>
          )}
          {hasData
            ? isOver
              ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              : <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            : <MinusCircle className="w-3.5 h-3.5 text-slate-300" />
          }
        </div>
      </div>

      {/* Bar track */}
      <div className="relative h-5 rounded-full overflow-hidden bg-slate-100">
        {/* Target fill (light) */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${targetWidth}%`, background: colors.bar, opacity: 0.2 }}
        />
        {/* Actual fill */}
        {hasData && (
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
            style={{
              width: `${actualWidth}%`,
              background: isOver ? '#ef4444' : colors.bar,
            }}
          />
        )}
        {/* Target marker line */}
        <div
          className="absolute top-0 h-full w-0.5 bg-white/70 z-10"
          style={{ left: `${targetWidth}%` }}
        />
        {/* Target label on bar */}
        <div
          className="absolute top-0.5 h-4 flex items-center z-20 pr-1"
          style={{ left: `calc(${targetWidth}% + 3px)` }}
        >
          <span className="text-[9px] text-slate-400 font-medium">{targetPct.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}

export default function BreakdownStats({ data, isLoading }) {
  const equipments = ['Banbury', 'Extruder', 'Calender', 'Cutting'];

  const total = data ? data['_total'] : null;
  const totalOver = total?.hasData && total.actual_bd_pct > total.target_bd_pct;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 col-span-1 md:col-span-2 lg:col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
          <Wrench className="w-5 h-5 text-slate-400" />
          Engineering Breakdown (BD%)
          {data?._sheet && (
            <span className="text-xs font-normal text-slate-400 ml-1">[{data._sheet}]</span>
          )}
        </h2>
        <div className="flex gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-5 h-2 rounded-full bg-blue-200" />
            Target
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-5 h-2 rounded-full bg-blue-500" />
            Actual
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full mr-2" />
          กำลังโหลดข้อมูล Breakdown...
        </div>
      ) : !data || data.error ? (
        <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
          <Wrench className="w-8 h-8" />
          <p className="text-sm">{data?.error || 'ไม่พบข้อมูล Breakdown'}</p>
          <p className="text-xs text-slate-300">ตรวจสอบว่า T: drive เชื่อมต่ออยู่</p>
        </div>
      ) : (
        <>
          {/* Overall Summary */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Overall BD% Target</p>
              <p className="text-2xl font-black text-slate-700">
                {total ? `${total.target_bd_pct.toFixed(2)}%` : '—'}
              </p>
            </div>
            <div className={`border rounded-xl p-3 text-center ${
              !total?.hasData
                ? 'bg-slate-50 border-slate-200'
                : totalOver
                  ? 'bg-red-50 border-red-200'
                  : 'bg-emerald-50 border-emerald-200'
            }`}>
              <p className={`text-xs font-semibold uppercase mb-1 ${
                !total?.hasData ? 'text-slate-400' : totalOver ? 'text-red-500' : 'text-emerald-600'
              }`}>
                Overall BD% Actual
              </p>
              {total?.hasData ? (
                <>
                  <p className={`text-2xl font-black ${totalOver ? 'text-red-600' : 'text-emerald-700'}`}>
                    {total.actual_bd_pct.toFixed(2)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {totalOver ? '▲ เกิน Target' : '✓ ต่ำกว่า Target'}
                  </p>
                </>
              ) : (
                <p className="text-xl font-bold text-slate-300 mt-1">ยังไม่มีข้อมูล</p>
              )}
            </div>
          </div>

          {/* Per-equipment bars */}
          <div className="mb-5">
            {equipments.map(eq => {
              const d = data[eq];
              if (!d) return null;
              const colors = EQUIPMENT_COLORS[eq] || { bar: '#6b7280' };
              return (
                <BDBar
                  key={eq}
                  label={eq}
                  targetPct={d.target_bd_pct || 0}
                  actualPct={d.actual_bd_pct ?? 0}
                  hasData={d.hasData}
                  colors={colors}
                />
              );
            })}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-left p-2 border border-slate-200 font-semibold">Area</th>
                  <th className="text-center p-2 border border-slate-200 font-semibold text-blue-600">Target BD%</th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">Actual BD%</th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {equipments.map(eq => {
                  const d = data[eq];
                  if (!d) return null;
                  const over = d.hasData && d.actual_bd_pct > d.target_bd_pct;
                  return (
                    <tr key={eq} className={over ? 'bg-red-50' : ''}>
                      <td className="p-2 border border-slate-200 font-medium">{eq}</td>
                      <td className="p-2 border border-slate-200 text-center text-blue-600 font-medium">
                        {d.target_bd_pct.toFixed(2)}%
                      </td>
                      <td className={`p-2 border border-slate-200 text-center font-bold ${
                        !d.hasData ? 'text-slate-300' : over ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {d.hasData ? `${d.actual_bd_pct.toFixed(2)}%` : '—'}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        {!d.hasData
                          ? <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full text-xs">รอข้อมูล</span>
                          : over
                            ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">OVER</span>
                            : <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">OK</span>
                        }
                      </td>
                    </tr>
                  );
                })}
                {/* Total row */}
                {total && (
                  <tr className={`font-bold ${total.hasData && total.actual_bd_pct > total.target_bd_pct ? 'bg-red-50' : 'bg-slate-50'}`}>
                    <td className="p-2 border border-slate-200">Total</td>
                    <td className="p-2 border border-slate-200 text-center text-blue-600">
                      {total.target_bd_pct.toFixed(2)}%
                    </td>
                    <td className={`p-2 border border-slate-200 text-center ${
                      !total.hasData ? 'text-slate-300' : totalOver ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {total.hasData ? `${total.actual_bd_pct.toFixed(2)}%` : '—'}
                    </td>
                    <td className="p-2 border border-slate-200 text-center">
                      {!total.hasData
                        ? <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full text-xs">รอข้อมูล</span>
                        : totalOver
                          ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">OVER</span>
                          : <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">OK</span>
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
