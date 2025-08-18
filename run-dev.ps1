Write-Host "Starting React Native Development Environment..." -ForegroundColor Green

Write-Host "`nStep 1: Checking ADB connection..." -ForegroundColor Yellow
$adbDevices = & adb devices 2>&1
Write-Host $adbDevices

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: ADB failed. Make sure Android SDK is in PATH." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if any devices are connected
$deviceLines = $adbDevices | Where-Object { $_ -match "\tdevice$" }
if ($deviceLines.Count -eq 0) {
    Write-Host "WARNING: No devices found. Please connect your device and enable USB debugging." -ForegroundColor Yellow
    Write-Host "Continuing anyway..." -ForegroundColor Yellow
}

Write-Host "`nStep 2: Setting up port forwarding..." -ForegroundColor Yellow
try {
    & adb reverse tcp:8081 tcp:8081 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Port forwarding successful!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Port forwarding failed. Make sure device is connected." -ForegroundColor Yellow
        Write-Host "You can still continue - the app might work if you're on the same WiFi." -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARNING: Could not set up port forwarding: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`nStep 3: Starting Metro Bundler..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c", "npx react-native start" -WindowStyle Normal

Write-Host "`nStep 4: Waiting for Metro to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "`nStep 5: Installing and running the app..." -ForegroundColor Yellow
& npx react-native run-android

Write-Host "`nDevelopment setup complete!" -ForegroundColor Green
Write-Host "`nTroubleshooting:" -ForegroundColor Cyan
Write-Host "If you see 'Unable to load script' error:" -ForegroundColor White
Write-Host "1. Make sure your device is connected via USB" -ForegroundColor White
Write-Host "2. Run: adb reverse tcp:8081 tcp:8081" -ForegroundColor White  
Write-Host "3. Shake the device and select 'Reload' or press 'r' in Metro terminal" -ForegroundColor White
Write-Host "4. Or try: adb shell input keyevent 82" -ForegroundColor White

Read-Host "`nPress Enter to exit"
