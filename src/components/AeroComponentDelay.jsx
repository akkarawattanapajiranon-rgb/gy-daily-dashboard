import React, { useState, useEffect } from 'react';
import { Clock, Layers, ShieldAlert, Cpu, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { getFirebaseSnapshot, getLocalSnapshot, fetchFast } from '../services/api';

export default function AeroComponentDelay({ date }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'Extrusion' | 'Comp'

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetchFast(`/api/aero-delay?date=${date}`, 3000);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setData(json);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Aero delay API failed, fallback to snapshot:', err.message);
      }

      // Snapshot fallback
      const snap = (await getFirebaseSnapshot(date)) || getLocalSnapshot(date);
      if (isMounted) {
        if (snap && snap.aeroDelay) {
          setData(snap.aeroDelay);
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
        <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full" />
        <span className="text-sm font-medium">กำลังโหลดข้อมูล Component Delay Aero...</span>
      </div>
    );
  }

  if (!data || data.error || !data.items || data.items.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Component Delay Aero
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
            {date}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
          <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          {data?.error || 'ไม่มีรายงาน Component Delay ประจำวันที่เลือก'}
        </div>
      </div>
    );
  }

  const filteredItems = (data.items || []).filter(item => {
    if (filter === 'ALL') return true;
    return item.category === filter;
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Component Delay Aero
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                  {data._sheet || 'Report'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                รายงานสรุปเวลาสูญเสียรอส่วนประกอบยาง (Extrusion & Component Preparation)
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({data.summary?.totalItems || 0})
          </button>
          <button
            onClick={() => setFilter('Extrusion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'Extrusion'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Extrusion ({data.summary?.extrusionCount || 0})
          </button>
          <button
            onClick={() => setFilter('Comp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === 'Comp'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Comp ({data.summary?.compCount || 0})
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Delay */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Total Component Delay</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.totalDelayHours}</span>
            <span className="text-xs font-bold text-indigo-200">ชม. ({data.totalDelayMin?.toLocaleString()} นาที)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            รวมรายการที่ Delay ทั้งหมด {data.summary?.totalItems || 0} รายการ
          </div>
        </div>

        {/* Extrusion Delay */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Extrusion Delay (Tread / SW)
            </span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-950">{data.totalExtrusionHours}</span>
            <span className="text-xs font-bold text-blue-700">ชม. ({data.totalExtrusionMin?.toLocaleString()} นาที)</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-700/80 font-medium">
            ยางคอมปาวด์หนา / ดอกยาง / แก้มยาง
          </div>
        </div>

        {/* Comp Delay */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Comp Delay (Band / Bead / Liner...)
            </span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-950">{data.totalCompHours}</span>
            <span className="text-xs font-bold text-amber-700">ชม. ({data.totalCompMin?.toLocaleString()} นาที)</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700/80 font-medium">
            ผ้าใบ / ขอบยาง / ท่อขอบ / ผ้าแชฟเฟอร์
          </div>
        </div>
      </div>

      {/* List Table of Items */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200">
              <th className="py-3 px-4 w-16">เครื่อง</th>
              <th className="py-3 px-4 w-32">ประเภท (Source)</th>
              <th className="py-3 px-4 w-32">ส่วนประกอบ</th>
              <th className="py-3 px-4">รายละเอียดจากรายงาน (Description)</th>
              <th className="py-3 px-4 w-36 text-center">ช่วงเวลา</th>
              <th className="py-3 px-4 w-28 text-right">เวลาที่ Delay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                  ไม่มีรายการ Delay ในหมวดหมู่นี้
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
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {item.componentName}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-mono text-[11px]">
                    {item.rawText}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.timeRangeStr ? (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[11px] border border-slate-200">
                        {item.timeRangeStr}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    {item.durationMin > 0 ? (
                      <span className="text-indigo-700">
                        {item.durationHours} ชม. <span className="text-[10px] text-slate-500 font-normal">({item.durationMin} นาที)</span>
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
