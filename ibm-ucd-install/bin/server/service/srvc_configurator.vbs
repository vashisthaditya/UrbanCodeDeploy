' Licensed Materials - Property of IBM* and/or HCL**
' UrbanCode Deploy
' UrbanCode Build
' UrbanCode Release
' AnthillPro
' (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
' (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
'
' U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
' GSA ADP Schedule Contract with IBM Corp.
'
' * Trademark of International Business Machines
' ** Trademark of HCL Technologies Limited
dim login, passwd, startmode, aloop, StdIn, fso, file, containerhome
containerhome = "@SERVER_HOME@"
Set StdIn = WScript.StdIn
serviceName = WScript.Arguments.Item(0)
aloop = true
strComputer = "."

'--- account warning

WScript.Echo "Service must be started manually after installation or if you set autostart option" & _ 
             "it will start automatically after system reboot." & vbCrLf
WScript.Echo "Note!" & vbCrLf & _
             "You can only run the service as account with 'Log On as Service' rights." & vbCrLf & _
             "To add the rights to an account you can do following:" & vbCrLf & _
             "1. Click Start > Settings > Control Panel." & vbCrLf & _
             "2. Double-click Administrative Tools." & vbCrLf & _
             "3. Double-click Local Security Policy." & vbCrLf & _
             "4. Open Local Policies." & vbCrLf & _
             "5. Open User Rights Assignment." & vbCrLf & _
             "6. Open Log On as a Service." & vbCrLf & _
             "7. Click Add." & vbCrLf & _
             "8. Select the user you want to grant logon service access to and click OK." & vbCrLf & _
             "9. Click OK to save the updated policy." & vbCrLf

'--- gathering service parameters


Do While aloop = True

    WScript.Echo "Enter the user account name including domain path to run the service as " & _
                 "(for local use '.\' before login ), by default will be used local system " & _
                 "account. [Default: '.\localsystem']"
    login = StdIn.ReadLine
    
    If login <> "" And login <> ".\localsystem" Then
        WScript.Echo "Please enter your password for desired account."
        passwd = StdIn.ReadLine
    End If

    WScript.Echo "Do you want to start the '" & serviceName & "' service automatically? y,N [Default: N]"
    startmode = StdIn.ReadLine

    Set objWMIService = GetObject("winmgmts:" _
        & "{impersonationLevel=impersonate}!\\" & strComputer & "\root\cimv2")
    Set colRunningServices = objWMIService.ExecQuery _
        ("Select * from Win32_Service where Name = '" & serviceName & "'")

    For Each objService in colRunningServices
        If login >= "" Then
            If login = "" Or login = ".\localsystem" then
                errServiceChange = objService.Change( , , , , , , ".\localsystem" , "")
            Else
                errServiceChange = objService.Change( , , , , , , login , passwd)
            End If
        End If
    
        If (startmode = "y" Or startmode = "Y" Or startmode = "yes" Or startmode = "YES" Or startmode = "Yes") Then
            objService.ChangeStartMode("Automatic")
        Else 
            objService.ChangeStartMode("Manual")
        End If
    Next

    If login >= "" Then
        If errServiceChange = 22 Then
            WScript.Echo "Wrong domain path (for local account add '.\' before your login name) " & _
                         "or a given account doesn't exist. Try again." & vbCrLf
            aloop = True
        Elseif errServiceChange > 0 Then
            WScript.Echo "ERROR:" & errServiceChange & " during service configuration." & vbCrLf
            aloop = False
        Elseif errServiceChange = 0 Then
            aloop = False
            WScript.Echo "Service '" & serviceName & "' has been successfully installed and configured." & vbCrLf
            WScript.Echo "Start it manually or reboot system if your service has set an autostart option." & vbCrLf
            Set fso = CreateObject("Scripting.FileSystemObject")
            Set file = fso.OpenTextFile(containerhome & "\conf\server\installed.properties", 8, True)
            file.WriteLine("install.service.name=" & serviceName)
            file.Close                
        End If
    End If
Loop
