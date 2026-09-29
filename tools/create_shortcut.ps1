$targetBat = "C:\Users\aa11909\OneDrive - Goodyear\Documents\AI\DOR\daily-dashboard\launch_dor.bat"
$workDir = "C:\Users\aa11909\OneDrive - Goodyear\Documents\AI\DOR\daily-dashboard"
$icon = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe,0"

$desktopFolders = @(
    "C:\Users\aa11909\OneDrive - Goodyear\Desktop",
    "C:\Users\aa11909\Desktop"
)

$wsh = New-Object -ComObject WScript.Shell

foreach ($folder in $desktopFolders) {
    if (Test-Path $folder) {
        $lnkPath = Join-Path $folder "DOR Dashboard.lnk"
        $shortcut = $wsh.CreateShortcut($lnkPath)
        $shortcut.TargetPath = $targetBat
        $shortcut.WorkingDirectory = $workDir
        $shortcut.IconLocation = $icon
        $shortcut.Description = "Goodyear DOR Daily Dashboard"
        $shortcut.Save()
        Write-Output "Created shortcut: $lnkPath"
    }
}
