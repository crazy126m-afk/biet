' BIET - Silent 24/7 Server Launcher
' Double-clicking this script launches the server in the background without keeping a CMD window open.

Set WshShell = CreateObject("WScript.Shell")
strPath = WshShell.CurrentDirectory
WshShell.Run "python """ & strPath & "\server.py""", 0, False

MsgBox "BIET is now running 24/7 in the background!" & vbCrLf & vbCrLf & _
       "Access URL: http://localhost:8000" & vbCrLf & _
       "Download APK: http://localhost:8000/BIET.apk" & vbCrLf & vbCrLf & _
       "To stop the server at any time, run 'stop_server.bat'.", _
       vbInformation, "BIET - 24/7 Active"
