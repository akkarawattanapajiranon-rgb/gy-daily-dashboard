import React, { useState } from 'react';
import AeroComponentDelay from './AeroComponentDelay';
import WbrComponentDelay from './WbrComponentDelay';
import { Layers, Plane, Truck } from 'lucide-react';

export default function ComponentDelayContainer({ date }) {
  const [activeSubTab, setActiveSubTab] = useState('aero'); // 'aero' | 'wbr'

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation Bar */}
      <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Component Delay Reports
            </h2>
            <p className="text-xs text-slate-500">
              เลือกดูรายงาน Component Delay ของแผนก Aero หรือ WBR (Radial)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveSubTab('aero')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'aero'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Plane className="w-4 h-4" />
            Component Delay Aero
          </button>
          <button
            onClick={() => setActiveSubTab('wbr')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'wbr'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Truck className="w-4 h-4" />
            Component Delay WBR
          </button>
        </div>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'aero' ? (
        <AeroComponentDelay date={date} />
      ) : (
        <WbrComponentDelay date={date} />
      )}
    </div>
  );
}
