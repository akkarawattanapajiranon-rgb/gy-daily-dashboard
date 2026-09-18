$desktop = [Environment]::GetFolderPath('Desktop')
$vbsPath = "c:\Users\aa11909\OneDrive - Goodyear\Documents\AI\DOR\daily-dashboard\launch_dor_silent.vbs"
$workingDir = "c:\Users\aa11909\OneDrive - Goodyear\Documents\AI\DOR\daily-dashboard"

$wsh = New-Object -ComObject WScript.Shell
$lnkPath = Join-Path $desktop "DOR Dashboard.lnk"
$sc = $wsh.CreateShortcut($lnkPath)
$sc.TargetPath = "C:\WINDOWS\system32\wscript.exe"
$sc.Arguments = "`"$vbsPath`""
$sc.WorkingDirectory = $workingDir
$sc.Description = "Goodyear MU_DOR Daily Operations Report Dashboard"
$sc.IconLocation = "shell32.dll,220"
$sc.Save()

# Also copy launch_dor_silent.vbs directly to Desktop if the user wants .vbs file on Desktop directly
Copy-Item -Path $vbsPath -Destination (Join-Path $desktop "DOR Dashboard.vbs") -Force

Write-Output "Created DOR VBS Launcher and Desktop Shortcut successfully:"
Get-ChildItem -Path $desktop -Filter "*DOR*" | Select-Object Name, FullName, LastWriteTime
