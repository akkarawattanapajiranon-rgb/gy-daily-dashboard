import React from 'react';
import { Wrench, Clock, AlertCircle } from 'lucide-react';

export default function BreakdownStats({ data, isLoading }) {
  const equipments = ['Banbury', 'Extruder', 'Calender', 'Cutting'];

  const total = data ? data['_total'] : null;
  const totalOver = total?.hasData && total.actual_bd_pct > total.target_bd_pct;
  const topLoss = data?.topLoss || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 col-span-1 md:col-span-2 lg:col-span-2 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
          <Wrench className="w-5 h-5 text-slate-400" />
          Engineering Breakdown (BD%)
          {data?._sheet && (
            <span className="text-xs font-normal text-slate-400 ml-1">[{data._sheet}]</span>
          )}
        </h2>
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
          <div className="grid grid-cols-2 gap-3">
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

          {/* Top 5 Machine Loss Section */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Top 5 Machine Lossประจำวัน (นาที)
            </h3>
            {topLoss.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-slate-400 text-xs italic">
                ไม่มีรายงานเครื่องเสียประจำวันที่เลือก
              </div>
            ) : (
              <div className="space-y-2">
                {topLoss.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {item.machine} <span className="text-xs font-normal text-slate-500">({item.zone})</span>
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            <span className="font-semibold text-slate-700">อาการ:</span> {item.symptom || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-md text-xs font-black shrink-0">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {item.durationMin} นาที
                      </div>
                    </div>
                    {item.cause && (
                      <p className="text-xs text-slate-500 mt-1 pl-7">
                        <span className="font-semibold text-slate-600">สาเหตุ:</span> {item.cause}
                      </p>
                    )}
                    {item.action && (
                      <p className="text-xs text-slate-500 mt-0.5 pl-7">
                        <span className="font-semibold text-slate-600">การแก้ไข:</span> {item.action} {item.fixBy ? `(${item.fixBy})` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
