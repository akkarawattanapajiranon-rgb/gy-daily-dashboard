import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

export default function MachineOEE({ weeklyData, isLoading }) {
  const [selectedWeekNum, setSelectedWeekNum] = useState(null);

  // Set default selected week to active current week when data loads
  useEffect(() => {
    if (weeklyData?.activeWeek?.weekNum) {
      setSelectedWeekNum(weeklyData.activeWeek.weekNum);
    }
  }, [weeklyData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full flex flex-col justify-center items-center text-slate-400 text-xs min-h-[220px]">
        <div className="animate-spin w-5 h-5 border-2 border-slate-300 border-t-amber-500 rounded-full mb-2" />
        <span>กำลังคำนวณ Weekly OEE2 (WTD)...</span>
      </div>
    );
  }

  const weeks = weeklyData?.weeks || [];
  const currentWeekObj = weeks.find(w => w.weekNum === selectedWeekNum) || weeklyData?.activeWeek || {};

  const quad = currentWeekObj.quad || { avg: null, target: 62 };
  const tuber = currentWeekObj.tuber || { avg: null, target: 62 };
  const fischer = currentWeekObj.fischer || { avg: null, target: 60 };
  const mixing = currentWeekObj.mixing || { avg: null, target: 76.6 };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-yellow" />
            Machine OEE 2 (Weekly WTD)
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ค่าเฉลี่ยสะสมประจำสัปดาห์ (จันทร์-อาทิตย์) จากวันที่มีข้อมูลจริง
          </p>
        </div>

        {/* Week Pills / Tabs */}
        {weeks.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {weeks.map(w => {
              const isSelected = w.weekNum === (selectedWeekNum || currentWeekObj.weekNum);
              return (
                <button
                  key={w.weekNum}
                  onClick={() => setSelectedWeekNum(w.weekNum)}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                    isSelected
                      ? 'bg-brand-blue text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title={w.label}
                >
                  W{w.weekNum}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Week Info Subtitle */}
      {currentWeekObj.label && (
        <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            {currentWeekObj.label}
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            {currentWeekObj.quad?.count > 0 ? `เฉลี่ยจาก ${currentWeekObj.quad.count} วันที่มีข้อมูล` : 'ไม่มีข้อมูลในสัปดาห์นี้'}
          </span>
        </div>
      )}

      {/* Machine OEE Bars */}
      <div className="space-y-3.5 my-auto">
        <OEEBar
          label="Mixing (Total OEE2)"
          value={mixing.avg}
          target={76.6}
        />
        <OEEBar
          label="QUAD"
          value={quad.avg}
          target={62}
        />
        <OEEBar
          label="Tuber 6x8"
          value={tuber.avg}
          target={62}
        />
        <OEEBar
          label="FISCHER"
          value={fischer.avg}
          target={60}
        />
      </div>
    </div>
  );
}

function OEEBar({ label, value, target }) {
  const hasVal = typeof value === 'number' && !isNaN(value) && value > 0;
  const isMet = hasVal && value >= target;

  let colorClass = 'bg-slate-200';
  let textClass = 'text-slate-400';
  if (hasVal) {
    if (isMet) {
      colorClass = 'bg-emerald-500';
      textClass = 'text-emerald-600';
    } else {
      colorClass = 'bg-rose-500';
      textClass = 'text-rose-600';
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-800 font-extrabold text-sm">{label}</span>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
            Target {target}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {hasVal && (
            isMet ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                ตาม Target
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                <AlertTriangle className="w-3 h-3" />
                ต่ำกว่า Target
              </span>
            )
          )}
          <span className={`text-sm font-black ${textClass}`}>
            {hasVal ? `${value.toFixed(2)}%` : '-'}
          </span>
        </div>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden relative">
        {/* Target marker line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10 opacity-70"
          style={{ left: `${target}%` }}
          title={`Target: ${target}%`}
        />

        {hasVal ? (
          <div
            className={`${colorClass} h-2.5 rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        ) : (
          <div className="bg-slate-200 h-2.5 rounded-full w-0" />
        )}
      </div>
    </div>
  );
}
