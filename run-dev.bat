@echo off
echo Starting React Native Development Environment...

echo.
echo Step 1: Checking ADB connection...
adb devices
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ADB failed. Make sure Android SDK is in PATH.
    pause
    exit /b 1
)

echo.
echo Step 2: Setting up port forwarding...
adb reverse tcp:8081 tcp:8081
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Port forwarding failed. Make sure device is connected.
    echo You can still continue - the app might work if you're on the same WiFi.
)

echo.
echo Step 3: Starting Metro Bundler...
start "Metro Bundler" cmd /c "npx react-native start"

echo.
echo Step 4: Waiting for Metro to start...
timeout /t 5 /nobreak > nul

echo.
echo Step 5: Installing and running the app...
npx react-native run-android

echo.
echo Development setup complete!
echo.
echo If you see "Unable to load script" error:
echo 1. Make sure your device is connected via USB
echo 2. Run: adb reverse tcp:8081 tcp:8081
echo 3. Reload the app by shaking the device and selecting "Reload"
echo.
pause
