const fs = require('fs');
const path = require('path');

const projectDir = 'C:\\Users\\aa11909\\OneDrive - Goodyear\\Documents\\AI\\DOR\\daily-dashboard';

// 1. Single combined VBScript file content
const vbsLines = [
  'Set WshShell = CreateObject("WScript.Shell")',
  'WshShell.CurrentDirectory = "' + projectDir + '"',
  'WshShell.Run "node server/server.js", 0, False'
];
const vbsContent = vbsLines.join('\r\n') + '\r\n';

// Write single VBS in project folder
const singleVbsPath = path.join(projectDir, 'Start_Dashboard_Server.vbs');
fs.writeFileSync(singleVbsPath, vbsContent, 'utf8');
console.log('[OK] Created single file:', singleVbsPath);

// Copy single VBS to Windows Startup folder
const startupDir = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const startupVbsPath = path.join(startupDir, 'Start_Dashboard_Server.vbs');
fs.writeFileSync(startupVbsPath, vbsContent, 'utf8');
console.log('[OK] Placed single file in Windows Startup:', startupVbsPath);

// Clean up old duplicate files
const oldFiles = [
  path.join(projectDir, 'start_server.bat'),
  path.join(projectDir, 'start-dashboard.bat'),
  path.join(projectDir, 'start_gy_dashboard.vbs'),
  path.join(startupDir, 'start_gy_dashboard.vbs'),
  path.join(startupDir, 'start-dashboard.bat')
];

oldFiles.forEach(f => {
  if (fs.existsSync(f)) {
    try {
      fs.unlinkSync(f);
      console.log('[Cleaned] Removed old file:', f);
    } catch(e) {}
  }
});
