export const mockData = {
  mixing: {
    mixing1: { batch: 629, ar: 85.8, pr: 89.8, qr: 88.4, oee2: 68.1 },
    mixing2: { batch: 622, ar: 83.8, pr: 88.2, qr: 100.0, oee2: 73.9 },
    totalOee2: 70.9
  },
  machineOEE2: {
    quad: 92.4,
    tuber6x8: 88.7,
    fiscer: 85.1
  },
  output3Roll: {
    actual: 12500,
    target: 14000,
    unit: 'meters'
  },
  wasteReport: {
    millingSummary: 45.2,
    frictionSummary: 32.8,
    millingTop: [
      { code: 'M-101', amount: 25.4, reason: 'Temperature high', isHigh: true },
      { code: 'M-105', amount: 15.2, reason: 'Contamination', isHigh: true },
      { code: 'M-102', amount: 4.6, reason: 'Size variant' }
    ],
    frictionTop: [
      { code: 'F-204', amount: 18.5, reason: 'Edge defect', isHigh: true },
      { code: 'F-201', amount: 10.1, reason: 'Thickness variation', isHigh: true },
      { code: 'F-203', amount: 4.2, reason: 'Tension loss' }
    ],
    dataDate: '2026-09-03'
  },
  breakdownStats: {
    overallPercentage: 4.2,
    totalLossTime: '2h 15m',
    machines: [
      { name: 'Mixing 1', lossTime: '45m', reason: 'Motor trip' },
      { name: 'Tuber 6x8', lossTime: '1h 30m', reason: 'Belt replacement' }
    ]
  }
};
