$desktop = [Environment]::GetFolderPath('Desktop')
$toolsExe = "c:\Users\aa11909\OneDrive - Goodyear\Documents\AI\DOR\daily-dashboard\tools\DOR_Dashboard.exe"

Copy-Item -Path $toolsExe -Destination "public\download\DOR_Dashboard.exe" -Force

$wsh = New-Object -ComObject WScript.Shell
$lnkPath = Join-Path $desktop "DOR Dashboard.lnk"
$sc = $wsh.CreateShortcut($lnkPath)
$sc.TargetPath = $toolsExe
$sc.WorkingDirectory = "c:\Users\aa11909\OneDrive - Goodyear\Documents\AI\DOR\daily-dashboard\tools"
$sc.Description = "Goodyear MU_DOR Daily Operations Report Dashboard"
$sc.IconLocation = "shell32.dll,220"
$sc.Save()

$exePath = Join-Path $desktop "DOR Dashboard.exe"
Copy-Item -Path $toolsExe -Destination $exePath -Force

Write-Output "Successfully created:"
Get-ChildItem -Path $desktop -Filter "*DOR*" | Select-Object Name, FullName, LastWriteTime
