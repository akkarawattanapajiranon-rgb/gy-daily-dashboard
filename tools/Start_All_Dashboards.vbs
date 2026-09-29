Set WshShell = CreateObject("WScript.Shell")

' ====================================================
' 1. Start DOR Backend Server & Open Dashboard (Port 3001)
' Starts silently and opens DOR Dashboard in clean app window
' ====================================================
WshShell.CurrentDirectory = "C:\Users\aa11909\OneDrive - Goodyear\Documents\AI\DOR\daily-dashboard"
WshShell.Run Chr(34) & "C:\Users\aa11909\OneDrive - Goodyear\Documents\AI\DOR\daily-dashboard\launch_dor.bat" & Chr(34), 0, False

' Pause 3 seconds before starting next service
WScript.Sleep 3000

' ====================================================
' 2. Start OHPA Dashboard (Port 3000)
' Starts OHPA server and opens dashboard in browser
' ====================================================
WshShell.Run Chr(34) & "C:\Users\aa11909\OneDrive - Goodyear\Documents\AI\OHPA\launch_dashboard.bat" & Chr(34), 0, False

Set WshShell = Nothing
