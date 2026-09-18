$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut("C:\Users\aa11909\OneDrive - Goodyear\Desktop\OHPA Dashboard.lnk")
Write-Output "OHPA IconLocation: $($sc.IconLocation)"
