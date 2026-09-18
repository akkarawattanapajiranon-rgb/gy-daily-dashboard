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
$sc.IconLocation = "C:\WINDOWS\system32\shell32.dll,220"
$sc.Save()

Write-Output "Created Shortcut:"
Get-Item $lnkPath | Select-Object Name, FullName, Length, LastWriteTime
