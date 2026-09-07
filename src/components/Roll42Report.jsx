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
  const shifts = data?.shifts || {
    shift1: { name: 'กะ 1 (Shift 1)', qty: 0, items: [] },
    shift2: { name: 'กะ 2 (Shift 2)', qty: 0, items: [] },
    shift3: { name: 'กะ 3 (Shift 3)', qty: 0, items: [] }
  };
  const topCodes = data?.topCodes || [];

  const totalCarts = topCodes.filter(c => c.unit === 'คัน').reduce((sum, c) => sum + (c.qty || 0), 0);
  const totalRollsCount = topCodes.filter(c => c.unit === 'ม้วน').reduce((sum, c) => sum + (c.qty || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              4 Roll #2 Production Output (แยก 3 กะ)
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                Productivity Check Sheet
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              รายงานผลผลิตการรันคอมโพเนนต์ 4 Roll #2 จำแนกรายกะ (กะ 1, กะ 2, กะ 3)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
        {/* Total Carts Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
          <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Total Carts (จำนวนคัน)</div>
          <div className="text-3xl font-black mt-1 flex items-baseline gap-2 text-indigo-200">
            {totalCarts.toLocaleString()} <span className="text-sm font-bold text-indigo-300">คัน</span>
          </div>
          <div className="text-[11px] text-indigo-200/80 mt-2 flex items-center gap-1 font-semibold">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dual Liner & VMI Ply 1/2</span>
          </div>
        </div>

        {/* Total Rolls Card */}
        <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
          <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">Total Rolls (จำนวนม้วน)</div>
          <div className="text-3xl font-black mt-1 text-emerald-400 flex items-baseline gap-2">
            {totalRollsCount.toLocaleString()} <span className="text-sm font-bold text-blue-200">ม้วน</span>
          </div>
          <div className="text-[11px] text-blue-200/80 mt-2 flex items-center gap-1 font-semibold">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>R2.5 Ply & Gumstrip Rolls</span>
          </div>
        </div>
      </div>

      {/* 3 SHIFTS BREAKDOWN (กะ 1 / กะ 2 / กะ 3 SIDE-BY-SIDE) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            รายการ Output แยก 3 กะ (Shift 1 / Shift 2 / Shift 3 Output)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(sNum => {
            const shiftKey = `shift${sNum}`;
            const shift = shifts[shiftKey] || { name: `กะ ${sNum}`, qty: 0, items: [] };
            const isShift1 = sNum === 1;
            const isShift2 = sNum === 2;

            const shiftCarts = shift.items ? shift.items.filter(i => i.unit === 'คัน').reduce((acc, i) => acc + (i.qty || 0), 0) : 0;
            const shiftRolls = shift.items ? shift.items.filter(i => i.unit === 'ม้วน').reduce((acc, i) => acc + (i.qty || 0), 0) : 0;

            let shiftSummaryText = '0';
            if (shiftCarts > 0 && shiftRolls > 0) {
              shiftSummaryText = `${shiftCarts} คัน, ${shiftRolls} ม้วน`;
            } else if (shiftCarts > 0) {
              shiftSummaryText = `${shiftCarts} คัน`;
            } else if (shiftRolls > 0) {
              shiftSummaryText = `${shiftRolls} ม้วน`;
            }

            const headerBg = isShift1
              ? 'bg-indigo-900 text-white'
              : isShift2
              ? 'bg-blue-900 text-white'
              : 'bg-slate-900 text-white';

            const badgeBg = isShift1
              ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200'
              : isShift2
              ? 'bg-blue-500/20 border-blue-400/30 text-blue-200'
              : 'bg-slate-500/20 border-slate-400/30 text-slate-200';

            return (
              <div key={sNum} className="bg-slate-50/80 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                {/* Shift Card Header */}
                <div className={`p-4 ${headerBg} flex items-center justify-between`}>
                  <div>
                    <h3 className="font-black text-sm">{shift.name}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${badgeBg}`}>
                    {shiftSummaryText}
                  </span>
                </div>

                {/* Shift Items Table */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  {shift.items && shift.items.length > 0 ? (
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-200 text-slate-700 font-bold uppercase text-[9px]">
                          <tr>
                            <th className="p-2 pl-3">SAP Code</th>
                            <th className="p-2">Component</th>
                            <th className="p-2 text-right pr-3">จำนวนผลิต</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 font-medium">
                          {shift.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white transition-colors">
                              <td className="p-2 pl-3 font-mono text-[11px] text-slate-500">{item.sapCode}</td>
                              <td className="p-2 font-black text-indigo-900">{item.code}</td>
                              <td className="p-2 text-right pr-3 font-extrabold text-slate-700">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 text-[11px] font-black">
                                  {item.qty} {item.unit || 'ม้วน'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-medium text-xs">
                      ไม่มีรายการรันในกะนี้
                    </div>
                  )}

                  {/* Shift Footer Summary */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs font-extrabold text-slate-700">
                    <span>รวมกะ {sNum}:</span>
                    <span className="text-indigo-800 font-black">
                      {shiftSummaryText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
