import React, { useState, useEffect } from 'react';
import { Clock, Layers, ShieldAlert, Cpu, Activity, Info, CheckCircle2 } from 'lucide-react';
import { getFirebaseSnapshot, getLocalSnapshot, fetchFast } from '../services/api';

export default function WbrComponentDelay({ date }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'Extrusion' | 'Comp' | 'Shift1' | 'Shift2' | 'Shift3'

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetchFast(`/api/wbr-delay?date=${date}`, 3000);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setData(json);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('WBR delay API failed, fallback to snapshot:', err.message);
      }

      // Snapshot fallback
      const snap = (await getFirebaseSnapshot(date)) || getLocalSnapshot(date);
      if (isMounted) {
        if (snap && snap.wbrDelay) {
          setData(snap.wbrDelay);
        } else {
          setData(null);
        }
        setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [date]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-center h-48 text-slate-400 gap-3">
        <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full" />
        <span className="text-sm font-medium">กำลังโหลดข้อมูล Component Delay WBR...</span>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Component Delay WBR (Radial)
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
            {date}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
          <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          {data?.error || 'ไม่พบไฟล์รายงาน Component Delay WBR ประจำวันที่เลือก'}
        </div>
      </div>
    );
  }

  const filteredItems = (data.items || []).filter(item => {
    if (filter === 'ALL') return true;
    if (filter === 'Extrusion') return item.category === 'Extrusion';
    if (filter === 'Comp') return item.category === 'Comp';
    if (filter === 'Shift1') return item.shift === 'กะ 1';
    if (filter === 'Shift2') return item.shift === 'กะ 2';
    if (filter === 'Shift3') return item.shift === 'กะ 3';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl">
              <Layers className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Component Delay WBR (Radial)
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  {data._sheet ? `Sheet ${data._sheet}` : 'BTB Radial'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                รายงานเวลาสูญเสีย Component Delay และ Cell Comments (กะ 1: P/I..L | กะ 2: AD/W..Z | กะ 3: AR/AK..AN)
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({data.items?.length || 0})
          </button>
          <button
            onClick={() => setFilter('Extrusion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'Extrusion'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Extrusion
          </button>
          <button
            onClick={() => setFilter('Comp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'Comp'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Comp
          </button>
          <button
            onClick={() => setFilter('Shift1')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'Shift1'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            กะ 1
          </button>
          <button
            onClick={() => setFilter('Shift2')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'Shift2'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            กะ 2
          </button>
          <button
            onClick={() => setFilter('Shift3')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'Shift3'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            กะ 3
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Delay */}
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Total WBR Delay</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.totalDelayHours}</span>
            <span className="text-xs font-bold text-emerald-200">ชม. ({data.totalDelayMin?.toLocaleString()} นาที)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            จำนวนบันทึกทั้งสิ้น {data.summary?.totalItems || 0} รายการ
          </div>
        </div>

        {/* Shift 1 Delay */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              กะ 1 Delay (7.00 - 15.00)
            </span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-950">{data.shift1Hours}</span>
            <span className="text-xs font-bold text-emerald-700">ชม. ({data.shift1Min?.toLocaleString()} นาที)</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-800/80 font-medium">
            ช่อง P (นาที) & Comments I..L
          </div>
        </div>

        {/* Shift 2 Delay */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50/60 border border-teal-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              กะ 2 Delay (15.00 - 23.00)
            </span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-950">{data.shift2Hours}</span>
            <span className="text-xs font-bold text-teal-700">ชม. ({data.shift2Min?.toLocaleString()} นาที)</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-800/80 font-medium">
            ช่อง AD (นาที) & Comments W..Z
          </div>
        </div>

        {/* Shift 3 Delay */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50/60 border border-cyan-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-600" />
              กะ 3 Delay (23.00 - 7.00)
            </span>
            <Activity className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-950">{data.shift3Hours}</span>
            <span className="text-xs font-bold text-cyan-700">ชม. ({data.shift3Min?.toLocaleString()} นาที)</span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-800/80 font-medium">
            ช่อง AR (นาที) & Comments AK..AN
          </div>
        </div>
      </div>

      {/* List Table of Items */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse min-w-[680px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
              <th className="py-3 px-4 w-20">เครื่อง</th>
              <th className="py-3 px-4 w-24">กะ</th>
              <th className="py-3 px-4 w-24">Code</th>
              <th className="py-3 px-4 w-28">ประเภท</th>
              <th className="py-3 px-4">รายละเอียด Delay / Cell Comments</th>
              <th className="py-3 px-4 w-32 text-right">เวลาที่ Delay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                  ไม่มีรายการ Delay ในเงื่อนไขที่เลือก
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-black text-slate-900">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200">
                      {item.machine}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded border border-emerald-200">
                      {item.shift}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    {item.code || <span className="text-slate-300 italic">-</span>}
                  </td>
                  <td className="py-3 px-4">
                    {item.category === 'Extrusion' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full border border-blue-200">
                        Extrusion
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-full border border-amber-200">
                        Comp
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-800 text-[11px]">
                    {item.detail ? (
                      <span className="font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200 block text-slate-900">
                        {item.detail}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic font-sans flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        ไม่มี Comment (บันทึกเฉพาะนาที Delay)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    {item.delayMin > 0 ? (
                      <span className="text-emerald-700">
                        {item.delayMin} นาที <span className="text-[10px] text-slate-500 font-normal">({item.delayHours} ชม.)</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">0 นาที</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
