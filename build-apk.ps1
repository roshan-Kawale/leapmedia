# Build APK for Testing
# This script builds a debug APK for testing purposes

Write-Host "🚀 Building APK for testing..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "android")) {
    Write-Host "❌ Error: android directory not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Navigate to android directory
Set-Location android

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
.\gradlew clean

# Build debug APK
Write-Host "🔨 Building debug APK..." -ForegroundColor Yellow
.\gradlew assembleDebug

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ APK built successfully!" -ForegroundColor Green
    
    # Find the APK file
    $apkPath = Get-ChildItem -Path "app\build\outputs\apk\debug" -Filter "*.apk" | Select-Object -First 1
    
    if ($apkPath) {
        Write-Host "📱 APK location: $($apkPath.FullName)" -ForegroundColor Cyan
        Write-Host "📏 APK size: $([math]::Round($apkPath.Length / 1MB, 2)) MB" -ForegroundColor Cyan
        
        # Copy APK to project root for easy access
        $projectRoot = Split-Path (Split-Path $PWD)
        $destinationPath = Join-Path $projectRoot "VideoPermissionsApp-debug.apk"
        Copy-Item $apkPath.FullName $destinationPath -Force
        Write-Host "📋 APK copied to: $destinationPath" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
}

# Return to project root
Set-Location ..

Write-Host "🎯 Build process completed!" -ForegroundColor Green
