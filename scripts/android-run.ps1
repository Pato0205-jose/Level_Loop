# Arranca la app en Android: repara adb, configura reverse y ejecuta expo run:android.
param(
  [int]$Port = 8082
)

$ErrorActionPreference = "Continue"

$sdk = $env:ANDROID_HOME
if (-not $sdk) {
  $sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
}

$adb = Join-Path $sdk "platform-tools\adb.exe"

function Get-AdbDevicesText {
  if (-not (Test-Path $adb)) { return "" }
  return (& $adb devices 2>&1 | Out-String)
}

function Test-AdbDeviceReady {
  param([string]$Text)
  return $Text -match '\tdevice'
}

function Restart-Adb {
  Write-Host "Reiniciando adb..."
  & $adb kill-server | Out-Null
  Start-Sleep -Seconds 2
  & $adb start-server | Out-Null
  Start-Sleep -Seconds 2
}

if (-not (Test-Path $adb)) {
  Write-Host "ERROR: adb no encontrado en $adb"
  exit 1
}

$devices = Get-AdbDevicesText
if (-not (Test-AdbDeviceReady $devices) -or ($devices -match 'offline')) {
  Restart-Adb
}

$ready = $false
for ($attempt = 1; $attempt -le 3; $attempt++) {
  $devices = Get-AdbDevicesText
  if (Test-AdbDeviceReady $devices -and $devices -notmatch 'offline') {
    $ready = $true
    break
  }
  Write-Host "Intento $attempt/3: celular no listo (offline o no autorizado)."
  if ($attempt -lt 3) {
    Restart-Adb
  }
}

if (-not $ready) {
  Write-Host ""
  Write-Host "ERROR: no hay dispositivo Android listo."
  Write-Host "  1. Desbloquea el celular"
  Write-Host "  2. Acepta 'Permitir depuracion USB'"
  Write-Host "  3. Desconecta y vuelve a conectar el cable USB"
  Write-Host "  4. Ejecuta: npm run android:fix-adb"
  exit 1
}

Write-Host "OK: dispositivo detectado"
& $adb devices

& $adb reverse tcp:3000 tcp:3000
if ($LASTEXITCODE -eq 0) {
  Write-Host "OK: adb reverse tcp:3000 tcp:3000"
}

$repoRoot = Split-Path $PSScriptRoot -Parent
Push-Location $repoRoot
try {
  Write-Host "Sincronizando IP LAN en .env..."
  node (Join-Path $repoRoot "scripts\sync-api-ip.mjs")
  npx expo run:android --port $Port @args
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
