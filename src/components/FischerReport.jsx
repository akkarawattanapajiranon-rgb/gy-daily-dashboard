import React from 'react';
import { Scissors, Gauge, RefreshCw, Layers, Zap } from 'lucide-react';

export default function FischerReport({ data, isLoading }) {
  const oee = data?.oee || {};
  const checksheet = data?.checksheet || {};
  const shifts = checksheet?.shifts || {};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5 col-span-1 md:col-span-2 lg:col-span-3">
      {/* Component Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
          <Scissors className="w-5 h-5 text-indigo-500" />
          SHEAR FISCHER - Performance & Check Sheet Summary
        </h2>
        <div className="text-xs text-slate-400 font-medium">
          {data?.date ? `วันที่: ${data.date}` : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-36 text-slate-400">
          <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-indigo-500 rounded-full mr-2" />
          กำลังคำนวณข้อมูล Fischer...
        </div>
      ) : !data || (!oee.hasData && !checksheet.hasData) ? (
        <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
          <Scissors className="w-8 h-8 text-slate-300" />
          <p className="text-sm">ไม่พบข้อมูล Shear Fischer สำหรับวันที่เลือก</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LEFT BOX: OEE Metrics (from OEE - 2026 TRACKING - SHEAR FISCHER.xlsx) */}
          <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-indigo-600" />
                OEE Summary (oee_summary_SEP 26)
              </h3>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                Target: {oee.target_pct || 60}%
              </span>
            </div>

            {oee.hasData ? (
              <>
                {/* Main OEE Big Numbers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-indigo-100 rounded-lg p-3 text-center shadow-2xs">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">OEE 2 (Actual)</p>
                    <p className={`text-2xl font-black ${oee.oee2_pct >= (oee.target_pct || 60) ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {oee.oee2_pct.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-lg p-3 text-center shadow-2xs">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">OEE 1</p>
                    <p className="text-2xl font-black text-slate-700">
                      {oee.oee1_pct.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Sub Metrics Grid: SR, AR, PR, QR */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div className="bg-white border border-slate-200/60 rounded-md p-2 text-center">
                    <p className="text-[10px] text-slate-400 font-bold">SR</p>
                    <p className="text-sm font-black text-slate-800">{oee.sr_pct.toFixed(2)}%</p>
                  </div>
                  <div className="bg-white border border-slate-200/60 rounded-md p-2 text-center">
                    <p className="text-[10px] text-slate-400 font-bold">AR</p>
                    <p className="text-sm font-black text-slate-800">{oee.ar_pct.toFixed(2)}%</p>
                  </div>
                  <div className="bg-white border border-slate-200/60 rounded-md p-2 text-center">
                    <p className="text-[10px] text-slate-400 font-bold">PR</p>
                    <p className="text-sm font-black text-slate-800">{oee.pr_pct.toFixed(2)}%</p>
                  </div>
                  <div className="bg-white border border-slate-200/60 rounded-md p-2 text-center">
                    <p className="text-[10px] text-slate-400 font-bold">QR</p>
                    <p className="text-sm font-black text-slate-800">{oee.qr_pct.toFixed(2)}%</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                ยังไม่ได้กรอกข้อมูล OEE ประจำวันนี้
              </div>
            )}
          </div>

          {/* RIGHT BOX: Production, Angle Change & Speed Mode (from Check Sheet) */}
          <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                ยอดผลิต & Angle Change (คำนวณจาก Check Sheet)
              </h3>
              <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                รวม {checksheet.totalProduce || 0} คัน
              </span>
            </div>

            {checksheet.hasData ? (
              <>
                {/* 4 Cards Summary */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white border border-slate-100 rounded-lg p-2.5 text-center shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">WBR</p>
                    <p className="text-lg font-black text-blue-600">{checksheet.totalWbr} <span className="text-[10px] font-normal text-slate-400">คัน</span></p>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-lg p-2.5 text-center shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Sapphire</p>
                    <p className="text-lg font-black text-purple-600">{checksheet.totalSapphire} <span className="text-[10px] font-normal text-slate-400">คัน</span></p>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-lg p-2.5 text-center shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Angle Chg</p>
                    <p className="text-lg font-black text-amber-600">{checksheet.totalAngleChanges} <span className="text-[10px] font-normal text-slate-400">ครั้ง</span></p>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-lg p-2.5 text-center shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Produce</p>
                    <p className="text-lg font-black text-slate-800">{checksheet.totalProduce} <span className="text-[10px] font-normal text-slate-400">คัน</span></p>
                  </div>
                </div>

                {/* Speed Mode % (Normal vs Sticky) */}
                <div className="bg-white border border-slate-200/60 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1 text-slate-700">
                      <Zap className="w-3.5 h-3.5 text-emerald-500" />
                      Speed Mode Ratio (เฉพาะ WBR)
                    </span>
                    <div className="flex gap-3 text-[11px]">
                      <span className="text-emerald-700 font-bold">Normal: {checksheet.normalPct}%</span>
                      <span className="text-amber-700 font-bold">Sticky: {checksheet.stickyPct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-3 flex overflow-hidden">
                    <div
                      className="bg-emerald-500 h-[100%] transition-all duration-500"
                      style={{ width: `${checksheet.normalPct}%` }}
                      title={`Normal: ${checksheet.normalPct}%`}
                    />
                    <div
                      className="bg-amber-500 h-[100%] transition-all duration-500"
                      style={{ width: `${checksheet.stickyPct}%` }}
                      title={`Sticky: ${checksheet.stickyPct}%`}
                    />
                  </div>
                </div>

                {/* Shift Breakdown Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 text-slate-600">
                        <th className="text-left p-1.5 border border-slate-200 font-bold">Shift (กะ)</th>
                        <th className="text-center p-1.5 border border-slate-200 font-bold text-amber-700">Angle Change</th>
                        <th className="text-center p-1.5 border border-slate-200 font-bold text-blue-700">WBR (คัน)</th>
                        <th className="text-center p-1.5 border border-slate-200 font-bold text-purple-700">Sapphire (คัน)</th>
                        <th className="text-center p-1.5 border border-slate-200 font-bold text-slate-800">ยอดรวม (คัน)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['shift1', 'shift2', 'shift3'].map((sKey, sIdx) => {
                        const s = shifts[sKey] || { angleChanges: 0, wbr: 0, sapphire: 0, total: 0 };
                        return (
                          <tr key={sKey} className="bg-white">
                            <td className="p-1.5 border border-slate-200 font-semibold text-slate-700">กะ {sIdx + 1}</td>
                            <td className="p-1.5 border border-slate-200 text-center font-bold text-amber-600">{s.angleChanges}</td>
                            <td className="p-1.5 border border-slate-200 text-center text-blue-600 font-medium">{s.wbr}</td>
                            <td className="p-1.5 border border-slate-200 text-center text-purple-600 font-medium">{s.sapphire}</td>
                            <td className="p-1.5 border border-slate-200 text-center font-extrabold text-slate-800">{s.total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                ยังไม่มีข้อมูล Check sheet ประจำวันนี้
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
