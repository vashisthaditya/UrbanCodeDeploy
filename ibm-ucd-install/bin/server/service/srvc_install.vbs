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
dim srvc, installOK, login, passwd, startmode, fso, file, StdIn
Set StdIn = WScript.StdIn
srvc = False
installOK = False
strServiceName = WScript.Arguments.Item(0)
login = WScript.Arguments.Item(1)
passwd = WScript.Arguments.Item(2)
startmode = WScript.Arguments.Item(3)
strComputer = "."

'--- checking if given service already exists

    WScript.Echo "Checking if service with given name is already installed..."


    Set objWMIService = GetObject("winmgmts:" _
        & "{impersonationLevel=impersonate}!\\" & strComputer & "\root\cimv2")
    Set colRunningServices = objWMIService.ExecQuery _
        ("Select * from Win32_Service where Name = '" & strServiceName & "'")
    
    If colRunningServices.Count > 0 Then
        For Each objCurrService in colRunningServices
            If objCurrService.Name = strServiceName Then
                WScript.Echo "You have already installed service named '" & objCurrService.Name & "'."
                WScript.Echo "Aborting sevice installation, you can install it later manually (see documentation)." & vbCrLf
                Set fso = CreateObject("Scripting.FileSystemObject")
                Set file = fso.CreateTextFile("srvc.properties", True)
                file.WriteLine("install.service.status=failed")
                file.Close                
                srvc = True
            end if
        Next
            
'--- calling jvm service installation script
    Else
        WScript.Echo "Service '" & strServiceName & "' is not installed. Installing..."
        Dim oWSH: Set oWSH = CreateObject( "WScript.Shell" )
        Dim nRet: nRet = oWSH.Run( "_service.cmd install " & strServiceName, 0, True  )  
        WScript.Echo "Service '" & strServiceName & "' has been successfully installed."
        Set fso = CreateObject("Scripting.FileSystemObject")
        Set file = fso.CreateTextFile("srvc.properties", True)
        file.WriteLine("install.service.status=OK")
        file.Close                
        installOK = True
    End If
    

'--- setting the service parameters

    If (srvc = False And installOK = True) Then

        Set objCurrService = objWMIService.Get("Win32_Service.Name='" & strServiceName & "'")

        If (objCurrService.Name = strServiceName) Then
    
            If login >= "" Then
                If (login = "" Or login = ".\localsystem") Then
                    errServiceChange = objCurrService.Change( , , , , , , ".\localsystem" , "")
                Else
                    errServiceChange = objCurrService.Change( , , , , , , login , passwd)
                End If
            End If
    
            If login >= "" Then
                If errServiceChange = 22 Then
                    WScript.Echo "Wrong domain path (for local account add '.\' before your login name) or a given account doesn't exist. You must set these values manually later." & vbCrLf
                ElseIf errServiceChange > 0 Then
                    WScript.Echo "ERROR:" & errServiceChange & " during service configuration. Reconfigure parameters manually." & vbCrLf                    
                End If
            End If
            
            If (startmode = "y" Or startmode = "Y" Or startmode = "yes" Or startmode = "YES" Or startmode = "Yes" Or startmode = "true" Or startmode = "TRUE" Or startmode = "True") Then
                objCurrService.ChangeStartMode("Automatic")
                startStatus = objCurrService.StartService()
                
                If startStatus = 0 Then
                    WScript.Echo "Service " & objCurrService.Name & " started successfully"
                Else
                    WScript.Echo "Service " & objCurrService.Name & " failed to start. Return code: " & startStatus
                End If
            Else 
                objCurrService.ChangeStartMode("Manual")

                WScript.Echo "Please start the " & objCurrService.Name & " service manually."
            End If
        End If
    End If
