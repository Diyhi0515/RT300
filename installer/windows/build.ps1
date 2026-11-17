param(
    [string]$WinSwPath = "$PSScriptRoot\RT300.Service.exe",
    [string]$IsccPath = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
$backend = Join-Path $root 'rt300-backend'
$frontend = Join-Path $root 'rt300-frontend'
$output = Join-Path $root 'build\windows'

if (-not (Test-Path $WinSwPath)) {
    throw "Falta WinSW renombrado como RT300.Service.exe en $PSScriptRoot. Use WinSW x64 2.12.0 y verifique su firma/hash antes de compilar."
}
if (-not (Test-Path $IsccPath)) { throw "No se encontró Inno Setup 6: $IsccPath" }

Push-Location $frontend
try {
    npm ci
    npm run build
} finally { Pop-Location }

Push-Location $backend
try {
    py -3.13 -m pip install -r requirements-windows-build.txt
    py -3.13 -m nuitka rt300_server.py `
        --mode=standalone `
        --output-dir="$output" `
        --output-filename=RT300.Server.exe `
        --assume-yes-for-downloads `
        --include-package=app `
        --include-package=zeep `
        --include-package=flask_openapi3 `
        --windows-console-mode=disable
} finally { Pop-Location }

& $IsccPath (Join-Path $PSScriptRoot 'setup.iss')
