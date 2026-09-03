import React from 'react';
import { Clock, Wrench } from 'lucide-react';

export default function BreakdownStats({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 col-span-1 md:col-span-2 lg:col-span-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
          <Wrench className="w-5 h-5 text-slate-400" />
          Breakdown & Loss Time
        </h2>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Total Breakdown</p>
          <p className="text-2xl font-black text-slate-800">{data.overallPercentage}%</p>
        </div>
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Total Loss Time</p>
          <p className="text-2xl font-black text-slate-800 flex items-center justify-center gap-1">
            <Clock className="w-4 h-4 text-slate-400" />
            {data.totalLossTime}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Affected Machines</h3>
        <ul className="space-y-3">
          {data.machines.map((machine, index) => (
            <li key={index} className="flex items-start justify-between bg-white border border-slate-100 rounded-lg p-3 shadow-sm">
              <div>
                <p className="font-bold text-slate-900">{machine.name}</p>
                <p className="text-sm text-slate-500">{machine.reason}</p>
              </div>
              <div className="bg-red-50 text-red-700 font-semibold px-2 py-1 rounded text-sm whitespace-nowrap">
                {machine.lossTime}
              </div>
            </li>
          ))}
          {data.machines.length === 0 && (
            <li className="text-sm text-slate-500 italic text-center py-4">No breakdowns reported.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
