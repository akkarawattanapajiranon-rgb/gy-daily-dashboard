import React, { useState } from 'react';
import { Layers, Target, TrendingDown, ArrowDownRight, ArrowUpRight, ShieldAlert, CheckCircle, Award, BarChart3 } from 'lucide-react';

export default function WorkawayReport({ data, isLoading }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full flex flex-col justify-center items-center text-slate-400 text-xs min-h-[300px]">
        <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full mb-3" />
        <span>กำลังโหลดข้อมูล Workaway Inventory...</span>
      </div>
    );
  }

  if (!data || data.error || !data.dailyTrend || data.dailyTrend.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Dashboard of Workaway Inventory
          </h2>
        </div>
        <div className="py-12 text-center text-slate-400 text-sm">
          {data?.error || 'ไม่มีข้อมูล Workaway Inventory สำหรับวันที่เลือก'}
        </div>
      </div>
    );
  }

  const summary = data.summary || {};
  const dailyTrend = data.dailyTrend || [];
  const top10 = data.top10 || [];
  
  // Calculate max scaling for SVG chart
  const maxVal = Math.max(
    ...dailyTrend.map(d => Math.max(d.sum || 0, d.target || 35056, d.newGenerate || 0, d.consume || 0)),
    80000
  ) * 1.1;

  const minVal = 0;
  const chartHeight = 230;
  const chartWidth = 680;
  const paddingX = 40;
  const paddingY = 20;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const getX = (index) => {
    if (dailyTrend.length <= 1) return paddingX + usableWidth / 2;
    return paddingX + (index / (dailyTrend.length - 1)) * usableWidth;
  };

  const getY = (val) => {
    const ratio = (val - minVal) / (maxVal - minVal);
    return chartHeight - paddingY - ratio * usableHeight;
  };

  // Coordinates for lines
  const pointsSum = dailyTrend.map((d, i) => `${getX(i)},${getY(d.sum)}`).join(' ');
  const pointsTarget = dailyTrend.map((d, i) => `${getX(i)},${getY(d.target || 35056)}`).join(' ');
  const pointsMin = dailyTrend.map((d, i) => `${getX(i)},${getY(d.minTarget || 20000)}`).join(' ');

  // Current active totals
  const currentSum = summary.sum || 0;
  const targetVal = summary.target || 35056;
  const minTargetVal = summary.minTarget || 20000;
  const isOverTarget = currentSum > targetVal;

  const maxTopQty = top10.length > 0 ? top10[0].qty : 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-brand-blue flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Dashboard of Workaway Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ข้อมูลคลัง Workaway และสรุป Top 10 Code ยางตกค้างสูงสุด [{data.sheet || 'SEPTEMBER 2026'}]
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOverTarget ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              ยอดรวมเกิน Target ({Math.round(currentSum - targetVal).toLocaleString()} kg)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              อยู่ภายใน Target
            </span>
          )}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Card 1: Sum Total Inventory */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
            Total Workaway ({summary.activeDate || 'ล่าสุด'})
          </span>
          <div className="mt-1">
            <div className="text-2xl font-black text-blue-900">
              {(currentSum / 1000).toFixed(1)} <span className="text-xs font-semibold text-blue-700">MT</span>
            </div>
            <div className="text-[11px] text-blue-600 font-medium">
              {currentSum.toLocaleString()} kg
            </div>
          </div>
        </div>

        {/* Card 2: Target (Max) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wide flex items-center justify-between">
            Max Target
            <Target className="w-3.5 h-3.5 text-rose-500" />
          </span>
          <div className="mt-1">
            <div className="text-2xl font-black text-slate-800">
              {(targetVal / 1000).toFixed(1)} <span className="text-xs font-semibold text-slate-500">MT</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {targetVal.toLocaleString()} kg
            </div>
          </div>
        </div>

        {/* Card 3: Minimum Target */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide flex items-center justify-between">
            Min Target
            <Target className="w-3.5 h-3.5 text-amber-500" />
          </span>
          <div className="mt-1">
            <div className="text-2xl font-black text-slate-800">
              {(minTargetVal / 1000).toFixed(1)} <span className="text-xs font-semibold text-slate-500">MT</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {minTargetVal.toLocaleString()} kg
            </div>
          </div>
        </div>

        {/* Card 4: Daily Consume */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide flex items-center justify-between">
            Consume (ใช้ออก)
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
          </span>
          <div className="mt-1">
            <div className="text-2xl font-black text-emerald-700">
              {((summary.consume || 0) / 1000).toFixed(1)} <span className="text-xs font-semibold text-slate-500">MT</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {(summary.consume || 0).toLocaleString()} kg
            </div>
          </div>
        </div>

        {/* Card 5: Daily New Generate */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wide flex items-center justify-between">
            New Generate (เกิดขึ้นใหม่)
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-500" />
          </span>
          <div className="mt-1">
            <div className="text-2xl font-black text-purple-700">
              {((summary.newGenerate || 0) / 1000).toFixed(1)} <span className="text-xs font-semibold text-slate-500">MT</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {(summary.newGenerate || 0).toLocaleString()} kg
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Trend Chart & TOP 10 Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Monthly Trend Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              แนวโน้มคลัง Workaway รายวัน (Monthly Trend)
            </h3>

            {/* Chart Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span>Total (Sum)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-rose-500 border border-dashed border-rose-500 inline-block" />
                <span className="text-rose-600">Target (35.1 MT)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-amber-500 border border-dashed border-amber-500 inline-block" />
                <span className="text-amber-600">Min (20 MT)</span>
              </div>
            </div>
          </div>

          {/* SVG Interactive Trend Chart */}
          <div className="relative w-full overflow-x-auto my-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto max-h-[280px] min-w-[480px]"
            >
              {/* Gridlines */}
              {[0, 20000, 35056, 50000, 70000].map((gridVal, i) => {
                const y = getY(gridVal);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={paddingX - 6}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[9px] fill-slate-400 font-medium"
                    >
                      {(gridVal / 1000).toFixed(0)}k
                    </text>
                  </g>
                );
              })}

              {/* Target Line (35,056 kg) */}
              <polyline
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                points={pointsTarget}
              />

              {/* Min Target Line (20,000 kg) */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                points={pointsMin}
              />

              {/* Bars for Consume & New Generate */}
              {dailyTrend.map((d, i) => {
                const x = getX(i);
                const barWidth = 5;
                
                const consumeHeight = (d.consume / maxVal) * usableHeight;
                const newGenHeight = (d.newGenerate / maxVal) * usableHeight;
                
                const consumeY = chartHeight - paddingY - consumeHeight;
                const newGenY = chartHeight - paddingY - newGenHeight;

                return (
                  <g key={`bars-${i}`}>
                    {/* Consume Bar */}
                    {d.consume > 0 && (
                      <rect
                        x={x - barWidth - 1}
                        y={consumeY}
                        width={barWidth}
                        height={consumeHeight}
                        fill="#10b981"
                        rx="1"
                        opacity="0.85"
                      />
                    )}
                    {/* New Generate Bar */}
                    {d.newGenerate > 0 && (
                      <rect
                        x={x + 1}
                        y={newGenY}
                        width={barWidth}
                        height={newGenHeight}
                        fill="#8b5cf6"
                        rx="1"
                        opacity="0.85"
                      />
                    )}
                  </g>
                );
              })}

              {/* Sum Line (Total Inventory) */}
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsSum}
              />

              {/* Interactive Points on Line */}
              {dailyTrend.map((d, i) => {
                const x = getX(i);
                const y = getY(d.sum);
                const isHovered = hoveredPoint?.day === d.day;
                const hasData = d.hasData;

                return (
                  <g
                    key={`point-${i}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(d)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Invisible hit box */}
                    <rect
                      x={x - 12}
                      y={paddingY}
                      width={24}
                      height={usableHeight}
                      fill="transparent"
                    />

                    {/* Date X Label */}
                    <text
                      x={x}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      className={`text-[9px] font-bold ${hasData ? 'fill-slate-600' : 'fill-slate-300'}`}
                    >
                      {d.day}
                    </text>

                    {hasData && (
                      <>
                        {/* Circle indicator */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 6 : 4}
                          fill={isHovered ? "#1d4ed8" : "#2563eb"}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />

                        {/* Value label above point */}
                        {(isHovered || i === dailyTrend.length - 1 || i % 4 === 0) && (
                          <text
                            x={x}
                            y={y - 8}
                            textAnchor="middle"
                            className="text-[9px] font-black fill-blue-900"
                          >
                            {Math.round(d.sum / 1000)}k
                          </text>
                        )}
                      </>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip display if hovered */}
            {hoveredPoint && (
              <div className="absolute top-2 right-4 bg-slate-900/90 text-white text-xs p-2.5 rounded-lg shadow-xl backdrop-blur-xs space-y-1 z-10 border border-slate-700">
                <div className="font-bold border-b border-slate-700 pb-1 text-amber-400">
                  วันที่ {hoveredPoint.dateLabel}
                </div>
                <div className="flex justify-between gap-4 text-slate-200">
                  <span>Total Workaway:</span>
                  <span className="font-bold text-blue-400">{hoveredPoint.sum.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-200">
                  <span>Consume:</span>
                  <span className="font-bold text-emerald-400">{hoveredPoint.consume.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-200">
                  <span>New Generate:</span>
                  <span className="font-bold text-purple-400">{hoveredPoint.newGenerate.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-200">
                  <span>Slow Moving:</span>
                  <span className="font-bold text-slate-300">{hoveredPoint.slowMoving.toLocaleString()} kg</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: TOP 10 Workaway Rubber Codes (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              TOP 10 Code ยาง Workaway ตกค้างสูงสุด
            </h3>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              {data.top10File || 'Work awayTop 5 อันดับ.xlsx'}
            </span>
          </div>

          {top10.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <BarChart3 className="w-8 h-8 opacity-30 text-slate-400" />
              <span className="font-medium">ยังไม่มีข้อมูล Top 10 Code ยาง สำหรับวันที่เลือก</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {top10.map((item) => {
                const ratio = Math.min(100, Math.max(8, (item.qty / maxTopQty) * 100));

                let rankBadge = "bg-slate-100 text-slate-600 font-medium";
                if (item.rank === 1) rankBadge = "bg-amber-400 text-amber-950 font-black shadow-xs ring-2 ring-amber-300";
                else if (item.rank === 2) rankBadge = "bg-slate-300 text-slate-900 font-bold";
                else if (item.rank === 3) rankBadge = "bg-amber-700 text-white font-bold";

                return (
                  <div key={item.code} className="bg-white border border-slate-200/80 rounded-lg p-2 hover:border-indigo-300 transition-colors shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 flex items-center justify-center text-[10px] rounded-full ${rankBadge}`}>
                          {item.rank}
                        </span>
                        <span className="font-extrabold text-slate-800 tracking-tight">
                          {item.code}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-slate-900">{item.qty.toLocaleString()}</span>
                        <span className="text-[10px] font-medium text-slate-400">kg</span>
                        <span className="text-[10px] font-semibold text-indigo-600 ml-1">({item.qtyMt} MT)</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.rank === 1 ? 'bg-amber-500' :
                          item.rank === 2 ? 'bg-indigo-500' :
                          item.rank === 3 ? 'bg-blue-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
