param(
    [string]$InstallDir = "$env:ProgramFiles\RT300",
    [string]$DataDir = "$env:ProgramData\RT300"
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

function New-Secret([int]$Bytes = 48) {
    $buffer = New-Object byte[] $Bytes
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($buffer) } finally { $rng.Dispose() }
    return [Convert]::ToBase64String($buffer)
}

function Quote-Env([string]$Value) {
    return '"' + $Value.Replace('\', '\\').Replace('"', '\"').Replace("`r", '').Replace("`n", '') + '"'
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'Configuración de RT300'
$form.Size = New-Object System.Drawing.Size(650, 650)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.Font = New-Object System.Drawing.Font('Segoe UI', 9)

$fields = @(
    @{ Label='Puerto de RT300'; Name='Port'; Value='8080'; Password=$false },
    @{ Label='IP o nombre de SQL Server'; Name='DbHost'; Value='192.168.0.2'; Password=$false },
    @{ Label='Puerto de SQL Server'; Name='DbPort'; Value='1433'; Password=$false },
    @{ Label='Base de datos'; Name='DbName'; Value='tbpos_new'; Password=$false },
    @{ Label='Usuario de base de datos'; Name='DbUser'; Value='rt300_app'; Password=$false },
    @{ Label='Contraseña de base de datos'; Name='DbPassword'; Value=''; Password=$true },
    @{ Label='URL del servicio SOAP'; Name='Wsdl'; Value='http://192.168.0.2/RT300WS/RT300.asmx'; Password=$false },
    @{ Label='Contraseña técnica SOAP'; Name='GatewayPassword'; Value=''; Password=$true },
    @{ Label='Carpeta de imágenes'; Name='Images'; Value="$DataDir\imagenes"; Password=$false }
)

$controls = @{}
$y = 22
foreach ($field in $fields) {
    $label = New-Object System.Windows.Forms.Label
    $label.Text = $field.Label
    $label.Location = New-Object System.Drawing.Point(20, $y)
    $label.Size = New-Object System.Drawing.Size(220, 25)
    $form.Controls.Add($label)

    $box = New-Object System.Windows.Forms.TextBox
    $box.Name = $field.Name
    $box.Text = $field.Value
    $box.Location = New-Object System.Drawing.Point(245, $y)
    $box.Size = New-Object System.Drawing.Size(365, 25)
    $box.UseSystemPasswordChar = $field.Password
    $form.Controls.Add($box)
    $controls[$field.Name] = $box
    $y += 48
}

$httpsNote = New-Object System.Windows.Forms.Label
$httpsNote.Text = 'Acceso inicial: http://IP-DEL-SERVIDOR:PUERTO. Para HTTPS se recomienda un certificado del dominio interno.'
$httpsNote.Location = New-Object System.Drawing.Point(20, $y)
$httpsNote.Size = New-Object System.Drawing.Size(590, 38)
$form.Controls.Add($httpsNote)
$y += 48

$status = New-Object System.Windows.Forms.Label
$status.Location = New-Object System.Drawing.Point(20, $y)
$status.Size = New-Object System.Drawing.Size(590, 42)
$form.Controls.Add($status)

$save = New-Object System.Windows.Forms.Button
$save.Text = 'Guardar y comprobar'
$save.Location = New-Object System.Drawing.Point(430, $y + 45)
$save.Size = New-Object System.Drawing.Size(180, 34)
$form.Controls.Add($save)

$save.Add_Click({
    try {
        $port = 0
        $dbPort = 0
        if (-not [int]::TryParse($controls.Port.Text, [ref]$port) -or $port -lt 1 -or $port -gt 65535) {
            throw 'El puerto de RT300 no es válido.'
        }
        if (-not [int]::TryParse($controls.DbPort.Text, [ref]$dbPort) -or $dbPort -lt 1 -or $dbPort -gt 65535) {
            throw 'El puerto de SQL Server no es válido.'
        }
        foreach ($required in @('DbHost', 'DbName', 'DbUser', 'DbPassword', 'Wsdl')) {
            if ([string]::IsNullOrWhiteSpace($controls[$required].Text)) { throw "Falta completar: $required" }
        }

        New-Item -ItemType Directory -Force -Path $DataDir, "$DataDir\data", "$DataDir\cache", "$DataDir\logs", $controls.Images.Text | Out-Null
        $serverIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Where-Object { $_.IPAddress -notlike '127.*' -and $_.AddressState -eq 'Preferred' } |
            Select-Object -First 1 -ExpandProperty IPAddress)
        if (-not $serverIp) { $serverIp = 'localhost' }

        $lines = @(
            'FLASK_ENV=production',
            ('SECRET_KEY=' + (Quote-Env (New-Secret))),
            ('JWT_SECRET_KEY=' + (Quote-Env (New-Secret))),
            ('RT300_HOST="0.0.0.0"'),
            ('RT300_PORT=' + $port),
            ('FRONTEND_DIR=' + (Quote-Env "$InstallDir\frontend")),
            ('DB_DRIVER="ODBC Driver 18 for SQL Server"'),
            ('DB_HOST=' + (Quote-Env $controls.DbHost.Text.Trim())),
            ('DB_PORT=' + $dbPort),
            ('DB_NAME=' + (Quote-Env $controls.DbName.Text.Trim())),
            ('DB_USER=' + (Quote-Env $controls.DbUser.Text.Trim())),
            ('DB_PASSWORD=' + (Quote-Env $controls.DbPassword.Text)),
            'DB_TRUST_CERT=yes',
            'GATEWAY_MODE=soap',
            ('GATEWAY_WSDL_URL=' + (Quote-Env $controls.Wsdl.Text.Trim())),
            ('GATEWAY_PASSWORD=' + (Quote-Env $controls.GatewayPassword.Text)),
            ('IMAGENES_DIR=' + (Quote-Env $controls.Images.Text.Trim())),
            ('IMAGENES_CACHE_DIR=' + (Quote-Env "$DataDir\cache")),
            ('IMAGENES_SUBIDAS_DIR=' + (Quote-Env "$DataDir\subidas")),
            ('AJUSTES_DB=' + (Quote-Env "$DataDir\data\ajustes.sqlite")),
            ('REVOCADOS_DB=' + (Quote-Env "$DataDir\data\revocados.sqlite")),
            ('CORS_ORIGINS=' + (Quote-Env "http://$serverIp`:$port,http://localhost:$port")),
            'COOKIE_SECURE=false',
            'PROXY_HOPS=0'
        )
        $configPath = "$DataDir\config.env"
        [IO.File]::WriteAllLines($configPath, $lines, (New-Object Text.UTF8Encoding($false)))

        foreach ($folder in @($DataDir, "$DataDir\data", "$DataDir\cache", "$DataDir\logs")) {
            & icacls.exe $folder /inheritance:r /grant:r 'SYSTEM:(OI)(CI)(F)' 'Administrators:(OI)(CI)(F)' 'LOCAL SERVICE:(OI)(CI)(M)' | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "No se pudieron proteger los permisos de $folder." }
        }
        & icacls.exe $controls.Images.Text /inheritance:r /grant:r 'SYSTEM:(OI)(CI)(F)' 'Administrators:(OI)(CI)(F)' 'LOCAL SERVICE:(OI)(CI)(RX)' | Out-Null
        & icacls.exe $configPath /inheritance:r /grant:r 'SYSTEM:(F)' 'Administrators:(F)' 'LOCAL SERVICE:(R)' | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'No se pudieron restringir los permisos de config.env.' }

        $status.Text = 'Comprobando SQL Server y SOAP...'
        $form.Refresh()
        $result = & "$InstallDir\RT300.Server.exe" --config $configPath --check 2>&1
        if ($LASTEXITCODE -ne 0) { throw ($result -join "`r`n") }

        & "$InstallDir\RT300.Service.exe" stop 2>$null | Out-Null
        & "$InstallDir\RT300.Service.exe" install | Out-Null
        & "$InstallDir\RT300.Service.exe" start | Out-Null
        & netsh.exe advfirewall firewall delete rule name='RT300' | Out-Null
        & netsh.exe advfirewall firewall add rule name='RT300' dir=in action=allow protocol=TCP localport=$port profile=domain,private | Out-Null

        [System.Windows.Forms.MessageBox]::Show("RT300 quedó configurado.`r`n`r`nAbra: http://$serverIp`:$port", 'RT300', 'OK', 'Information') | Out-Null
        $form.Close()
    } catch {
        $status.Text = 'No se guardó la configuración.'
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Error de configuración', 'OK', 'Error') | Out-Null
    }
})

[void]$form.ShowDialog()
