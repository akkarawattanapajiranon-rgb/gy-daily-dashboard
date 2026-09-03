import React from 'react';
import { Cpu, Tag, Clock, Package } from 'lucide-react';

export default function TuberReport({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 text-center text-slate-400">
        <Cpu className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <p>ไม่พบข้อมูล TUBER สำหรับวันที่เลือก</p>
      </div>
    );
  }

  const { oee, output } = data;
  const hasOee = oee && oee.hasData;
  const hasOutput = output && output.hasData;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">TUBER Performance & Output</h3>
            <p className="text-[11px] text-slate-400">ข้อมูล OEE และยอดผลิตแยกกะจาก Tuber Booker Sheet (6" x 8")</p>
          </div>
        </div>

        {hasOutput && (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-semibold text-slate-600">รวมทั้งวัน:</span>
            <span className="text-sm font-black text-emerald-700">{output.grandTotal.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">ชิ้น/เมตร</span>
          </div>
        )}
      </div>

      {/* OEE Metrics Cards */}
      {hasOee ? (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 rounded-lg p-2 text-center min-w-0">
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight whitespace-nowrap">OEE2</p>
            <p className="text-sm sm:text-base font-black text-emerald-900 whitespace-nowrap">{oee.oee2_pct}%</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center min-w-0">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">OEE1</p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-700 whitespace-nowrap">{oee.oee1_pct}%</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center min-w-0">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">SR</p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-700 whitespace-nowrap">{oee.sr_pct}%</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center min-w-0">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">AR</p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-700 whitespace-nowrap">{oee.ar_pct}%</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center min-w-0">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">PR</p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-700 whitespace-nowrap">{oee.pr_pct}%</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center min-w-0">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">QR</p>
            <p className="text-xs sm:text-sm font-extrabold text-emerald-600 whitespace-nowrap">{oee.qr_pct}%</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center min-w-0">
            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight whitespace-nowrap">BD %</p>
            <p className="text-xs sm:text-sm font-extrabold text-rose-600 whitespace-nowrap">{oee.bd_pct}%</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-2.5 text-center text-xs text-amber-700">
          ⚠️ ไม่มีข้อมูล OEE บันทึกในไฟล์ Excel สำหรับวันที่เลือก
        </div>
      )}



      {/* Shift 1, 2, 3 Breakdown Tables */}
      {hasOutput && output.shifts && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map(shiftNum => {
            const shiftData = output.shifts[shiftNum];
            return (
              <div key={shiftNum} className="border border-slate-200/70 rounded-lg overflow-hidden bg-slate-50/40 flex flex-col">
                <div className="bg-slate-100/80 px-2.5 py-1.5 border-b border-slate-200/70 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    {shiftData?.name || `กะ ${shiftNum}`}
                  </span>
                  <span className="text-[11px] font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {shiftData?.totalQty ? shiftData.totalQty.toLocaleString() : 0}
                  </span>
                </div>

                <div className="p-1.5 flex-1 overflow-x-auto">
                  {shiftData?.items && shiftData.items.length > 0 ? (
                    <table className="w-full text-[10px] text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[8px]">
                          <th className="py-1 px-1">Part ID</th>
                          <th className="py-1 px-1">Code</th>
                          <th className="py-1 px-1 text-right">เป้าหมาย</th>
                          <th className="py-1 px-1 text-right">ยอดทำได้</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {shiftData.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white transition-colors">
                            <td className="py-0.5 px-1 font-mono text-slate-600 truncate max-w-[70px]" title={item.partId}>
                              {item.partId || '-'}
                            </td>
                            <td className="py-0.5 px-1 font-bold text-emerald-700">{item.code || '-'}</td>
                            <td className="py-0.5 px-1 text-right text-slate-500">
                              {item.qtyTarget > 0 ? item.qtyTarget.toLocaleString() : '-'}
                            </td>
                            <td className="py-0.5 px-1 text-right font-extrabold text-slate-800">
                              {item.qtyProduced > 0 ? item.qtyProduced.toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-[10px] text-slate-400 py-4">ไม่มีรายการรันในกะนี้</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
