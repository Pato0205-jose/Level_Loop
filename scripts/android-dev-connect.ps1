# Prepara el celular Android para hablar con el backend local.
# Ejecutar antes de npx expo run:android (con USB conectado).

$sdk = $env:ANDROID_HOME
if (-not $sdk) {
  $sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}

$adb = Join-Path $sdk "platform-tools\adb.exe"

if (Test-Path $adb) {
  $devices = & $adb devices 2>&1 | Out-String
  if ($devices -match 'offline') {
    Write-Host "AVISO: dispositivo offline. Reiniciando adb..."
    & $adb kill-server | Out-Null
    Start-Sleep -Seconds 2
    & $adb start-server | Out-Null
    Start-Sleep -Seconds 2
    $devices = & $adb devices 2>&1 | Out-String
  }

  if ($devices -notmatch '\tdevice') {
    Write-Host "AVISO: no hay dispositivo listo. En el celular:"
    Write-Host "  - Desbloquea la pantalla"
    Write-Host "  - Acepta 'Permitir depuracion USB'"
    Write-Host "  - Cambia el cable o el puerto USB si sigue offline"
    Write-Host "  - Luego ejecuta: adb kill-server && adb start-server"
  }

  & $adb reverse tcp:3000 tcp:3000
  if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: adb reverse tcp:3000 tcp:3000"
    Write-Host "     El telefono puede usar http://127.0.0.1:3000"
  } else {
    Write-Host "AVISO: adb reverse fallo. Conecta el celular por USB con depuracion activada."
  }
} else {
  Write-Host "AVISO: adb no encontrado en $adb"
}

try {
  $rule = Get-NetFirewallRule -DisplayName "Level Loop API" -ErrorAction SilentlyContinue
  if (-not $rule) {
    New-NetFirewallRule `
      -DisplayName "Level Loop API" `
      -Direction Inbound `
      -LocalPort 3000 `
      -Protocol TCP `
      -Action Allow `
      -ErrorAction Stop | Out-Null
    Write-Host "OK: regla firewall puerto 3000 creada"
  } else {
    Write-Host "OK: regla firewall ya existe"
  }
} catch {
  Write-Host "AVISO: no se pudo crear regla firewall (ejecuta PowerShell como administrador)."
  Write-Host "       Sin esto, la IP Wi-Fi (10.x.x.x) puede no funcionar desde el celular."
}

Write-Host ""
Write-Host "Siguiente: cd backend && npm run dev"
Write-Host "Luego:     npx expo run:android  (o pulsa r en Metro)"
