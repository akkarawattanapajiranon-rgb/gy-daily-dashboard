import React from 'react';
import { Settings } from 'lucide-react';

export default function MachineOEE({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-yellow" />
          Machine OEE 2
        </h2>
      </div>

      <div className="space-y-4 my-auto">
        <OEEBar label="QUAD" value={data?.quad} />
        <OEEBar label="Tuber 6x8" value={data?.tuber6x8} />
        <OEEBar label="FISCER" value={data?.fiscer} />
      </div>
    </div>
  );
}

function OEEBar({ label, value }) {
  const hasVal = typeof value === 'number' && !isNaN(value) && value > 0;
  const colorClass = hasVal ? (value >= 90 ? 'bg-emerald-500' : value >= 85 ? 'bg-brand-yellow' : 'bg-red-500') : 'bg-slate-200';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1 font-medium">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-900 font-bold">
          {hasVal ? `${value}%` : '-'}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        {hasVal ? (
          <div className={`${colorClass} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }}></div>
        ) : (
          <div className="bg-slate-200 h-2.5 rounded-full w-0"></div>
        )}
      </div>
    </div>
  );
}
