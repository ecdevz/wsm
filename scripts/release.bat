@echo off
REM 🚀 Local Release Script for baileys-session-manager-mongodb (Windows)
REM This script helps you create releases locally that trigger GitHub Actions deployment

setlocal enabledelayedexpansion

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Make sure you're in the project root.
    exit /b 1
)

REM Check if git working directory is clean
git status --porcelain > temp_status.txt
set /p git_status=<temp_status.txt
del temp_status.txt

if not "!git_status!"=="" (
    echo ❌ Git working directory is not clean. Please commit your changes first.
    git status --short
    exit /b 1
)

REM Get current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set current_branch=%%i

if not "!current_branch!"=="main" (
    echo ⚠️ You are on branch '!current_branch!'. Consider creating releases from 'main' branch.
    set /p continue=Do you want to continue? (y/N): 
    if /i not "!continue!"=="y" (
        echo ❌ Release cancelled
        exit /b 1
    )
)

echo 🚀 Local Release Helper
echo This script will help you create a release that triggers GitHub Actions deployment.
echo.

REM Get version type
echo Select version type:
echo 1) patch (1.0.0 → 1.0.1) - Bug fixes
echo 2) minor (1.0.0 → 1.1.0) - New features  
echo 3) major (1.0.0 → 2.0.0) - Breaking changes
echo 4) prerelease (1.0.0 → 1.0.1-0) - Pre-release version
echo.

set /p choice=Enter your choice (1-4): 

if "!choice!"=="1" set version_type=patch
if "!choice!"=="2" set version_type=minor
if "!choice!"=="3" set version_type=major
if "!choice!"=="4" set version_type=prerelease

if "!version_type!"=="" (
    echo ❌ Invalid choice
    exit /b 1
)

REM Get current version
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set current_version=%%i
echo ℹ️ Current version: !current_version!

REM Calculate new version (for display only)
for /f "tokens=*" %%i in ('npm version !version_type! --dry-run') do set new_version_raw=%%i
set new_version=!new_version_raw:~1!
echo ℹ️ New version will be: !new_version!

echo.
set /p confirm=Do you want to create this release? (y/N): 

if /i not "!confirm!"=="y" (
    echo ❌ Release cancelled
    exit /b 1
)

REM Run validation
echo ℹ️ Running validation...
call npm run validate
if errorlevel 1 (
    echo ❌ Validation failed
    exit /b 1
)

echo ✅ Validation passed

REM Update version
echo ℹ️ Updating version...
call npm version !version_type!
if errorlevel 1 (
    echo ❌ Version update failed
    exit /b 1
)

REM Get the actual new version
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set actual_version=%%i
set tag=v!actual_version!

echo ✅ Version updated to: !actual_version!

REM Push changes
echo ℹ️ Pushing changes to GitHub...
git push origin main
git push origin !tag!

echo ✅ Changes pushed to GitHub

REM Instructions
echo.
echo 🚀 Next Steps
echo 1. 🔄 GitHub Actions will automatically:
echo    - Run tests on multiple Node.js versions
echo    - Build the project
echo    - Publish to NPM when you create a GitHub release
echo.
echo 2. 🏷️ Create a GitHub release:
echo    - Go to: https://github.com/ecdevz/wsm/releases/new
echo    - Choose tag: !tag!
echo    - Fill in release notes
echo    - Click 'Publish release'
echo.
echo 3. 📦 Or trigger manual deployment:
echo    - Go to Actions tab in your repository
echo    - Select '📦 Publish to NPM' workflow
echo    - Click 'Run workflow'
echo.

echo ✅ Release preparation complete!
echo ℹ️ Tag created: !tag!
echo ℹ️ Monitor deployment: https://github.com/ecdevz/wsm/actions

pause