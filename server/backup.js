const fs = require('fs');
const path = require('path');
const lsp = require('./lsp_parser');

function createBackup() {
  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const stamp = `${dateStr}_${timeStr}`;

  // 1. Copy T Drive Excel file if exists
  const tFile = 'T:\\10.30 A.M. Production Meeting\\1 Safety\\LSP update 2026\\LSP Tracking.xlsx';
  let excelBackupPath = null;
  if (fs.existsSync(tFile)) {
    excelBackupPath = path.join(backupDir, `LSP_Tracking_Backup_${stamp}.xlsx`);
    fs.copyFileSync(tFile, excelBackupPath);
    console.log(`[Backup Success] Excel file copied to: ${excelBackupPath}`);
  } else {
    console.log('[Backup Notice] T drive file not accessible for direct copy.');
  }

  // 2. Backup current parsed data
  const parsedData = lsp.parseLspData();
  const jsonBackupPath = path.join(backupDir, `lsp_data_snapshot_${stamp}.json`);
  fs.writeFileSync(jsonBackupPath, JSON.stringify(parsedData, null, 2), 'utf8');
  console.log(`[Backup Success] Data snapshot saved to: ${jsonBackupPath}`);

  return { excelBackupPath, jsonBackupPath, stamp };
}

if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };
