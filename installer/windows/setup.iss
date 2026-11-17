#define MyAppName "RT300"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "AXON"

[Setup]
AppId={{44FD2B10-8A4C-40A2-83EF-52C5827BB302}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\RT300
DisableProgramGroupPage=yes
PrivilegesRequired=admin
MinVersion=10.0.14393
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..\..\release
OutputBaseFilename=RT300-Setup-{#MyAppVersion}-x64
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\RT300.Server.exe

[Files]
Source: "..\..\build\windows\RT300.Server.dist\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\..\rt300-frontend\dist\*"; DestDir: "{app}\frontend"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\..\img\Restaurantes\*"; DestDir: "{commonappdata}\RT300\imagenes"; Flags: ignoreversion onlyifdoesntexist recursesubdirs createallsubdirs
Source: "RT300.Service.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "RT300.Service.xml"; DestDir: "{app}"; Flags: ignoreversion
Source: "configurar.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Dirs]
Name: "{commonappdata}\RT300\data"
Name: "{commonappdata}\RT300\cache"
Name: "{commonappdata}\RT300\logs"
Name: "{commonappdata}\RT300\imagenes"

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\configurar.ps1"" -InstallDir ""{app}"" -DataDir ""{commonappdata}\RT300"""; Description: "Configurar RT300"; Flags: postinstall waituntilterminated

[UninstallRun]
Filename: "{app}\RT300.Service.exe"; Parameters: "stop"; Flags: runhidden waituntilterminated skipifdoesntexist
Filename: "{app}\RT300.Service.exe"; Parameters: "uninstall"; Flags: runhidden waituntilterminated skipifdoesntexist
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""RT300"""; Flags: runhidden waituntilterminated

[UninstallDelete]
Type: filesandordirs; Name: "{commonappdata}\RT300\cache"
Type: filesandordirs; Name: "{commonappdata}\RT300\logs"

[Code]
function InitializeSetup(): Boolean;
begin
  Result := IsWin64 and RegKeyExists(HKLM64,
    'SOFTWARE\ODBC\ODBCINST.INI\ODBC Driver 18 for SQL Server');
  if not Result then
    MsgBox('RT300 requiere Windows Server 2016+ de 64 bits y Microsoft ODBC Driver 18 for SQL Server.', mbError, MB_OK);
end;
