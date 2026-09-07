const fs = require('fs');
const path = require('path');

const batPath = 'C:\\Users\\aa11909\\OneDrive - Goodyear\\Documents\\AI\\DOR\\daily-dashboard\\start_server.bat';
const startupDir = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const vbsPath = path.join(startupDir, 'start_gy_dashboard.vbs');

const vbsContent = 'Set WshShell = CreateObject("WScript.Shell")\r\nWshShell.Run "cmd /c """ & "' + batPath + '" & """", 0, False\r\n';

fs.writeFileSync(vbsPath, vbsContent, 'utf8');
console.log('[Auto-start Setup] Created startup VBS script at:', vbsPath);
