import React from 'react';
import { Package } from 'lucide-react';

export default function Output3Roll({ data }) {
  const targetVal = data.target || 0;
  const percent = targetVal > 0 ? Math.min(100, Math.round((data.actual / targetVal) * 100)) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
          <Package className="w-5 h-5 text-brand-yellow" />
          Output 3 Roll
        </h2>
      </div>

      <div className="flex-grow flex flex-col justify-center">
        <div className="text-center mb-6">
          <div className="text-5xl font-black text-brand-blue mb-2">
            {data.actual.toLocaleString()}
          </div>
          <div className="text-sm text-slate-500 uppercase tracking-widest font-semibold">
            {data.unit}
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between text-sm mb-1 font-medium">
            <span className="text-slate-500">Progress to Target ({targetVal.toLocaleString()})</span>
            <span className="text-slate-900">{percent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="bg-brand-blue h-3 rounded-full" style={{ width: `${percent}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
