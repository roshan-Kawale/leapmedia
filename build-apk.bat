@echo off
REM Build APK for Testing
REM This script builds a debug APK for testing purposes

echo 🚀 Building APK for testing...

REM Check if we're in the right directory
if not exist "android" (
    echo ❌ Error: android directory not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Navigate to android directory
cd android

REM Clean previous builds
echo 🧹 Cleaning previous builds...
call gradlew clean

REM Build debug APK
echo 🔨 Building debug APK...
call gradlew assembleDebug

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
    echo ✅ APK built successfully!
    
    REM Find the APK file and copy it to project root
    for %%f in (app\build\outputs\apk\debug\*.apk) do (
        echo 📱 APK location: %%f
        echo 📋 Copying APK to project root...
        copy "%%f" "..\VideoPermissionsApp-debug.apk" >nul
        echo 📋 APK copied to: ..\VideoPermissionsApp-debug.apk
        goto :found
    )
    :found
) else (
    echo ❌ Build failed with exit code: %ERRORLEVEL%
)

REM Return to project root
cd ..

echo 🎯 Build process completed!
pause
