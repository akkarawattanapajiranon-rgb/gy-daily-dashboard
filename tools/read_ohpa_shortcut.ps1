$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut("C:\Users\aa11909\OneDrive - Goodyear\Desktop\OHPA Dashboard.lnk")
[PSCustomObject]@{
  TargetPath = $sc.TargetPath
  Arguments = $sc.Arguments
  WorkingDirectory = $sc.WorkingDirectory
  IconLocation = $sc.IconLocation
} | Format-List
