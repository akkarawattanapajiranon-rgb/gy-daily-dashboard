import React from 'react';
import { Package, Layers, Target } from 'lucide-react';

export default function Output3Roll({ data = {}, rollDetail, isLoading }) {
  const actualVal = rollDetail?.hasData ? rollDetail.totalRolls : (data.actual || 0);
  const targetVal = data.target || 0;
  const percent = targetVal > 0 ? Math.min(100, Math.round((actualVal / targetVal) * 100)) : 0;
  const breakdown = rollDetail?.codeBreakdown || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
          <Package className="w-5 h-5 text-brand-yellow" />
          Output 3 Roll
        </h2>
        {rollDetail?.sheet && (
          <span className="text-[11px] font-medium text-slate-400">[{rollDetail.sheet}]</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-400 text-xs">
          <div className="animate-spin w-5 h-5 border-2 border-slate-300 border-t-amber-500 rounded-full mr-2" />
          กำลังโหลด Output 3 Roll...
        </div>
      ) : (
        <>
          {/* Main Total Rolls Output Display */}
          <div className="text-center bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
              จำนวนม้วนทั้งหมด (TOTAL ROLLS)
            </p>
            <div className="text-4xl font-black text-brand-blue">
              {actualVal.toLocaleString()} <span className="text-sm font-semibold text-slate-500">ม้วน</span>
            </div>
          </div>

          {/* Target Order Display (from web link) */}
          <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-bold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-500" />
                จำนวนที่สั่งทำ (Target Order)
              </span>
              <span className="text-slate-900 font-black text-xs bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                {targetVal > 0 ? `${targetVal.toLocaleString()} ม้วน` : '0 ม้วน'}
              </span>
            </div>

            {targetVal > 0 && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-500">
                  <span>ความคืบหน้า (Progress)</span>
                  <span className="text-slate-900 font-bold">{percent}%</span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                  <div className="bg-brand-blue h-2 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Code Breakdown (Col C - LOCAL TREATMENT CODE) */}
          <div className="flex-grow pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                จำแนกตาม Code (Col C)
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {breakdown.length} รหัส
              </span>
            </div>

            {breakdown.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-2">ไม่มีข้อมูล Code ประจำวัน</p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 bg-blue-50 text-blue-800 border border-blue-100 px-1.5 py-0.5 rounded text-[11px]">
                        {item.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">{item.count} <span className="text-[10px] font-normal text-slate-400">ม้วน</span></span>
                      <span className="text-[10px] font-semibold text-slate-400 w-10 text-right">
                        {item.pct !== undefined ? item.pct : item.percentage}%
                      </span>
                    </div>
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
