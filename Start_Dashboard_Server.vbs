Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\aa11909\OneDrive - Goodyear\Documents\AI\DOR\daily-dashboard"
WshShell.Run "node server/server.js", 0, False
