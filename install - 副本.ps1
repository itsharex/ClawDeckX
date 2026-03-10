#Requires -Version 5.1
<#
.SYNOPSIS
    ClawDeckX - One-Click Launcher for Windows
.DESCRIPTION
    Install, update, uninstall, and manage ClawDeckX on Windows.
    Equivalent functionality to install.sh for Linux/macOS.
.NOTES
    Run in PowerShell: irm https://raw.githubusercontent.com/ClawDeckX/ClawDeckX/main/install.ps1 | iex
    Or: .\install.ps1
#>

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# ==============================================================================
# ClawDeckX - One-Click Launcher (Windows)
# ==============================================================================

# Constants
$BINARY_NAME = "clawdeckx.exe"
$TASK_NAME = "ClawDeckX"

# Script-level variables
$script:INSTALLED_LOCATION = ""
$script:CURRENT_VERSION = ""
$script:CONFIG_DIR = ""
$script:DATA_DIR = ""
$script:INSTALLED_BINARY = ""
$script:TASK_INSTALLED = $false
$script:SERVICE_RUNNING = $false

# -- Color helpers -------------------------------------------------------------
function Write-C {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Write-Banner {
    Write-Host ""
    Write-Host "  ___ _             ___          _  __  __" -ForegroundColor Blue
    Write-Host " / __| |__ ___ __ _|   \ ___ __| |/ / \ \/ /" -ForegroundColor Blue
    Write-Host "| (__| / _` \ V  V / |) / -_) _| ' <   >  <" -ForegroundColor Blue
    Write-Host " \___|_\__,_|\_/\_/|___/\___|__|_|\_\/_/\_\" -ForegroundColor Blue
    Write-Host ""
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "=======================================================" -ForegroundColor Yellow
    Write-Host "  $Title" -ForegroundColor Yellow
    Write-Host "=======================================================" -ForegroundColor Yellow
    Write-Host ""
}

function Read-YesNo {
    param(
        [string]$Prompt,
        [bool]$DefaultYes = $true
    )
    if ($DefaultYes) {
        $suffix = "[Y/n]"
    } else {
        $suffix = "[y/N]"
    }
    $reply = Read-Host "$Prompt $suffix"
    if ([string]::IsNullOrWhiteSpace($reply)) {
        return $DefaultYes
    }
    return ($reply -match '^[Yy]')
}

function Read-Choice {
    param(
        [string]$Prompt,
        [int]$Min = 1,
        [int]$Max = 4
    )
    $reply = Read-Host "$Prompt"
    if ($reply -match '^\d+$') {
        $val = [int]$reply
        if ($val -ge $Min -and $val -le $Max) { return $val }
    }
    return $Max
}

# -- Check if running as Administrator ----------------------------------------
function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]$identity
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# -- Check if ClawDeckX is installed ------------------------------------------
function Test-Installed {
    $localBinary = Join-Path $PWD $BINARY_NAME
    if (Test-Path $localBinary) {
        $script:INSTALLED_LOCATION = $localBinary
        try {
            $raw = & $localBinary --version 2>$null
            if ($raw -match '(\d+\.\d+\.\d+)') {
                $script:CURRENT_VERSION = $Matches[1]
            } else {
                $script:CURRENT_VERSION = "$raw"
            }
        } catch {
            $script:CURRENT_VERSION = "unknown"
        }
        $dir = Split-Path $localBinary -Parent
        $script:CONFIG_DIR = Join-Path $dir "data"
        $script:DATA_DIR = Join-Path $dir "data"
        return $true
    }
    return $false
}

# -- Scheduled Task management -------------------------------------------------
# NOTE: ClawDeckX is a regular console app, not a native Windows service.
# We use Scheduled Tasks which work with any EXE and don't require admin.

function Test-AutoStartInstalled {
    $script:TASK_INSTALLED = $false
    try {
        $task = Get-ScheduledTask -TaskName $TASK_NAME -ErrorAction SilentlyContinue
        if ($task) {
            $script:TASK_INSTALLED = $true
            return $true
        }
    } catch {
        $null = $_
    }
    return $false
}

function Install-AutoStart {
    Write-Section "Install Auto-Start Service / 安装自动启动服务"

    $binaryPath = $script:INSTALLED_BINARY
    if (-not $binaryPath) { $binaryPath = $script:INSTALLED_LOCATION }

    Write-C "Installing Scheduled Task for auto-start on user logon..." Cyan
    Write-C "正在安装计划任务，用户登录时自动启动..." Cyan
    Write-C "Note: ClawDeckX will start automatically when you log in" Yellow
    Write-C "说明：ClawDeckX 将在您登录时自动运行" Yellow
    Write-Host ""
    Install-ScheduledTask $binaryPath
}

function Install-ScheduledTask {
    param([string]$BinaryPath)

    $workDir = Split-Path $BinaryPath -Parent
    $action = New-ScheduledTaskAction -Execute $BinaryPath -WorkingDirectory $workDir
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)

    try {
        Register-ScheduledTask -TaskName $TASK_NAME -Action $action -Trigger $trigger -Settings $settings -Description "ClawDeckX - AI Gateway Management Service" -Force | Out-Null
        Write-C "✓ Scheduled Task created / 计划任务已创建" Green
        Write-C "✓ Task will start automatically on user logon / 任务将在用户登录时自动启动" Green
        Write-C "⚠ Task is NOT started yet / 任务尚未启动" Yellow
    } catch {
        Write-C "✗ Could not create Scheduled Task / 无法创建计划任务: $_" Red
    }
}

function Stop-ClawDeckXService {
    Write-Section "Stop ClawDeckX / 停止 ClawDeckX"
    Stop-ClawDeckXProcess
    Write-Host ""
    Write-C "You can now start ClawDeckX manually with: / 现在可以手动启动 ClawDeckX：" Cyan
    Write-C "  .\$BINARY_NAME" Green
}

function Stop-ClawDeckXProcess {
    $procs = Get-Process -Name "clawdeckx" -ErrorAction SilentlyContinue
    if ($procs) {
        Write-C "Killing process... / 正在终止进程..." Blue
        $procs | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

function Start-ClawDeckXService {
    Write-C "Starting ClawDeckX... / 正在启动 ClawDeckX..." Cyan

    $binaryPath = $script:INSTALLED_LOCATION
    if (-not $binaryPath) { $binaryPath = $script:INSTALLED_BINARY }

    Write-C "Launching process... / 正在启动进程..." Blue
    try {
        Start-Process -FilePath $binaryPath -WorkingDirectory (Split-Path $binaryPath -Parent) -WindowStyle Hidden
        Start-Sleep -Seconds 3
        if (Test-ProcessRunning) {
            Write-C "✓ ClawDeckX started successfully / ClawDeckX 启动成功" Green
            return $true
        } else {
            Write-C "⚠ Failed to start ClawDeckX / 启动 ClawDeckX 失败" Yellow
            return $false
        }
    } catch {
        Write-C "⚠ Failed to start ClawDeckX / 启动 ClawDeckX 失败: $_" Yellow
        return $false
    }
}

function Test-ProcessRunning {
    $procs = Get-Process -Name "clawdeckx" -ErrorAction SilentlyContinue
    return ($null -ne $procs)
}

function Stop-AllClawDeckX {
    Write-C "Stopping ClawDeckX... / 正在停止 ClawDeckX..." Cyan
    Stop-ClawDeckXProcess
    Write-C "✓ ClawDeckX stopped / ClawDeckX 已停止" Green
}

# -- Update --------------------------------------------------------------------
function Update-ClawDeckX {
    param([string]$LatestVersion, [string]$Repo)

    Write-Section "Update ClawDeckX / 更新 ClawDeckX"

    Write-C "Current version / 当前版本： $($script:CURRENT_VERSION)" Cyan
    Write-C "Latest version  / 最新版本： $LatestVersion" Cyan
    Write-Host ""

    $arch = Get-Architecture

    $apiUrl = "https://api.github.com/repos/$Repo/releases/latest"
    $assetPattern = "clawdeckx-windows-${arch}.exe"
    $downloadUrl = Get-DownloadUrl $apiUrl $assetPattern

    if (-not $downloadUrl) {
        Write-C "Error: Could not find download URL for windows/$arch" Red
        Write-C "错误：无法找到 windows/$arch 的下载链接" Red
        return
    }

    if ($script:CURRENT_VERSION -eq $LatestVersion) {
        Write-C "✓ Already up to date! / 已经是最新版本！" Green
        Write-Host ""
        if (-not (Read-YesNo "Force re-download? / 强制重新下载?" $false)) {
            return
        }
    } else {
        if (-not (Read-YesNo "Proceed with update? / 确认更新?" $true)) {
            return
        }
    }

    Write-Host ""
    if (Test-ProcessRunning) {
        Write-C "⚠ ClawDeckX is currently running / ClawDeckX 正在运行" Yellow
        Write-C "The program needs to be stopped before updating. / 更新前需要停止程序。" Yellow
        Write-Host ""
        if (-not (Read-YesNo "Stop ClawDeckX now and continue? / 立即停止并继续更新?" $true)) {
            Write-C "Update cancelled. / 更新已取消" Yellow
            return
        }
        Stop-AllClawDeckX
        Start-Sleep -Seconds 2
    }

    Write-Host ""
    Write-C "Downloading update... / 正在下载更新..." Blue

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
        Invoke-WebRequest -Uri $downloadUrl -OutFile $script:INSTALLED_LOCATION -UseBasicParsing
        Write-C "✓ Download complete! / 下载完成" Green
    } catch {
        Write-C "✗ Download failed / 下载失败: $_" Red
        return
    }

    Write-Host ""
    Write-Host "=======================================================" -ForegroundColor Green
    Write-C "✅ Update complete! / 更新完成！" Green
    Write-Host "=======================================================" -ForegroundColor Green
    Write-Host ""

    if (Read-YesNo "Start ClawDeckX now? / 立即启动 ClawDeckX?" $true) {
        $started = Start-ClawDeckXService
        if ($started -and (Test-ProcessRunning)) {
            Write-Host ""
            Write-C "You can access ClawDeckX at: / 可以访问 ClawDeckX：" Cyan
            Write-C "  http://localhost:18791" Green
            Write-Host ""
            if (Test-AutoStartInstalled) { Show-ServiceCommands }
        }
    } else {
        Write-Host ""
        Write-C "You can start it later with: / 稍后可以使用以下命令启动：" Yellow
        Write-C "  .\$BINARY_NAME" Green
        if (Test-AutoStartInstalled) { Show-ServiceCommands }
    }
}

# -- Uninstall -----------------------------------------------------------------
function Uninstall-ClawDeckX {
    Write-Section "Uninstall ClawDeckX / 卸载 ClawDeckX"

    if (-not $script:INSTALLED_LOCATION) {
        Write-C "ClawDeckX is not installed / ClawDeckX 未安装" Red
        return
    }

    Write-C "Found installation / 发现安装： $($script:INSTALLED_LOCATION)" Cyan
    Write-C "Current version / 当前版本：    $($script:CURRENT_VERSION)" Cyan
    Write-Host ""

    Write-C "Choose uninstall mode: / 选择卸载模式：" Yellow
    Write-Host "  1) Quick uninstall (remove everything) / 快速卸载（删除所有）"
    Write-Host "  2) Custom uninstall (select what to remove) / 自定义卸载（选择删除内容）"
    Write-Host ""
    $mode = Read-Choice "Enter your choice / 输入选择 [1-2]:" 1 2

    if ($mode -eq 1) {
        Write-Host ""
        Write-C "Quick uninstall will remove: / 快速卸载将删除：" Cyan
        Write-Host "  - $($script:INSTALLED_LOCATION) (二进制文件)"

        $removeService = $false
        if (Test-AutoStartInstalled) {
            Write-Host "  - ClawDeckX (计划任务)"
            Write-C "    Note: Task will be removed automatically / 说明：任务将自动删除" Yellow
            $removeService = $true
        }

        if (Test-Path $script:CONFIG_DIR) {
            Write-Host "  - $($script:CONFIG_DIR) (配置目录)"
        }
        if ($script:DATA_DIR -ne $script:CONFIG_DIR -and (Test-Path $script:DATA_DIR)) {
            Write-Host "  - $($script:DATA_DIR) (数据目录)"
        }

        Write-Host ""
        if (Read-YesNo "Confirm quick uninstall? / 确认快速卸载?" $false) {
            Invoke-Uninstall -RemoveService $true -RemoveConfig $true -RemoveData $true
        } else {
            Write-C "Uninstall cancelled / 卸载已取消" Yellow
        }
    } else {
        Write-Host ""
        Write-C "Custom uninstall / 自定义卸载" Cyan
        Write-Host ""

        $removeService = $false
        if (Test-AutoStartInstalled) {
            Write-C "Scheduled Task detected / 检测到计划任务: ClawDeckX" Yellow
            Write-C "  Task will be removed during uninstall / 卸载时将删除任务" Cyan
            Write-Host ""
            $removeService = Read-YesNo "Also remove Scheduled Task? / 同时删除计划任务?" $true
        } else {
            Write-C "No auto-start task found / 未发现自动启动任务" Cyan
        }

        $removeConfig = $false
        if (Test-Path $script:CONFIG_DIR) {
            $removeConfig = Read-YesNo "Also remove config directory? / 同时删除配置目录 ($($script:CONFIG_DIR))?" $false
        } else {
            Write-C "No config directory found / 未发现配置目录" Cyan
        }

        $removeData = $false
        if ($script:DATA_DIR -ne $script:CONFIG_DIR -and (Test-Path $script:DATA_DIR)) {
            $removeData = Read-YesNo "Also remove data directory? / 同时删除数据目录 ($($script:DATA_DIR))?" $false
        }

        Write-Host ""
        Write-C "Summary: / 摘要：" Yellow
        Write-Host "  - Binary / 二进制文件: " -NoNewline; Write-C "will be removed / 将被删除" Red
        if ($removeService) {
            Write-Host "  - Scheduled Task / 计划任务: " -NoNewline; Write-C "will be removed / 将被删除" Red
        }
        if ($removeConfig) {
            Write-Host "  - Config / 配置: " -NoNewline; Write-C "will be removed / 将被删除" Red
        }
        if ($removeData) {
            Write-Host "  - Data / 数据: " -NoNewline; Write-C "will be removed / 将被删除" Red
        }

        Write-Host ""
        if (Read-YesNo "Confirm custom uninstall? / 确认自定义卸载?" $false) {
            Invoke-Uninstall -RemoveService $removeService -RemoveConfig $removeConfig -RemoveData $removeData
        } else {
            Write-C "Uninstall cancelled / 卸载已取消" Yellow
        }
    }
}

function Invoke-Uninstall {
    param(
        [bool]$RemoveService,
        [bool]$RemoveConfig,
        [bool]$RemoveData
    )

    if ($RemoveService -and (Test-AutoStartInstalled)) {
        Write-C "Removing Scheduled Task... / 正在删除计划任务..." Blue
        try { Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false } catch { $null = $_ }
        Write-C "✓ Removed Scheduled Task / 计划任务已删除" Green
    }

    Stop-ClawDeckXProcess

    if (Test-Path $script:INSTALLED_LOCATION) {
        Remove-Item -Path $script:INSTALLED_LOCATION -Force
        Write-C "✓ Removed binary / 二进制文件已删除" Green
    }

    if ($RemoveConfig -and $script:CONFIG_DIR -and (Test-Path $script:CONFIG_DIR)) {
        Remove-Item -Path $script:CONFIG_DIR -Recurse -Force
        Write-C "✓ Removed config directory / 配置目录已删除" Green
    }

    if ($RemoveData -and $script:DATA_DIR -and ($script:DATA_DIR -ne $script:CONFIG_DIR) -and (Test-Path $script:DATA_DIR)) {
        Remove-Item -Path $script:DATA_DIR -Recurse -Force
        Write-C "✓ Removed data directory / 数据目录已删除" Green
    }

    Write-Host ""
    Write-Host "=======================================================" -ForegroundColor Green
    Write-C "✅ Uninstall complete! / 卸载完成！" Green
    Write-Host "=======================================================" -ForegroundColor Green
}

# -- Helpers -------------------------------------------------------------------
function Get-Architecture {
    switch ($env:PROCESSOR_ARCHITECTURE) {
        "AMD64"   { return "amd64" }
        "x86"     { return "amd64" }
        "ARM64"   { return "arm64" }
        default {
            Write-C "Error: Unsupported architecture / 错误：不支持的架构: $($env:PROCESSOR_ARCHITECTURE)" Red
            exit 1
        }
    }
}

function Get-DownloadUrl {
    param([string]$ApiUrl, [string]$AssetPattern)
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
        $release = Invoke-RestMethod -Uri $ApiUrl -UseBasicParsing
        foreach ($asset in $release.assets) {
            if ($asset.name -like "*$AssetPattern*") {
                return $asset.browser_download_url
            }
        }
    } catch {
        Write-C "Warning: Could not fetch release info / 警告：无法获取发布信息: $_" Yellow
    }
    return $null
}

function Get-LatestVersion {
    param([string]$Repo)
    $apiUrl = "https://api.github.com/repos/$Repo/releases/latest"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
        $release = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing
        $tag = $release.tag_name
        if ($tag) {
            return $tag -replace '^v', ''
        }
    } catch {
        Write-C "Warning: Could not fetch latest version / 警告：无法获取最新版本" Yellow
    }
    return "latest"
}

function Show-ServiceCommands {
    Write-Host ""
    Write-C "Management commands / 管理命令：" Yellow
    Write-C "  .\$BINARY_NAME                                      - Start manually / 手动启动" Green
    Write-C "  Get-Process clawdeckx                               - Check if running / 检查运行状态" Green
    Write-C "  Stop-Process -Name clawdeckx -Force                 - Stop / 停止" Green
    Write-C "  Get-ScheduledTask -TaskName ClawDeckX               - Check auto-start / 检查自动启动" Green
    Write-C "  Unregister-ScheduledTask -TaskName ClawDeckX        - Remove auto-start / 删除自动启动" Green
}

# ==============================================================================
# MAIN
# ==============================================================================

Write-Banner

$REPO = "ClawDeckX/ClawDeckX"
$LATEST_VERSION = Get-LatestVersion $REPO

Write-C ":: ClawDeckX Launcher - $LATEST_VERSION ::" Cyan
Write-Host ""

# -- Already installed? --------------------------------------------------------
if (Test-Installed) {
    Write-C "✓ ClawDeckX is already installed / ClawDeckX 已安装" Green
    Write-C "Location / 位置：        $($script:INSTALLED_LOCATION)" Cyan
    Write-C "Current version / 当前版本： $($script:CURRENT_VERSION)" Cyan
    Write-C "Latest version / 最新版本：  $LATEST_VERSION" Cyan

    $script:SERVICE_RUNNING = $false
    if (Test-AutoStartInstalled) {
        Write-C "Auto-start / 自动启动：      Installed / 已安装 (计划任务)" Cyan
    }
    if (Test-ProcessRunning) {
        $script:SERVICE_RUNNING = $true
        Write-C "Status / 状态：          Running / 运行中" Green
    } else {
        Write-C "Status / 状态：          Stopped / 已停止" Yellow
    }

    Write-Host ""

    $isLatest = ($script:CURRENT_VERSION -eq $LATEST_VERSION)

    if ($isLatest) {
        Write-C "✓ Already up to date! / 已是最新版本！" Green
        Write-Host ""
        Write-C "What would you like to do? / 您想做什么?" Yellow
        Write-Host "  1) Re-download current version / 重新下载当前版本"
    } else {
        Write-C "New version available! / 有新版本可用！" Yellow
        Write-Host ""
        Write-C "What would you like to do? / 您想做什么?" Yellow
        Write-Host "  1) Update to latest version / 更新到最新版本"
    }

    $hasAutoStart = Test-AutoStartInstalled
    if ($script:SERVICE_RUNNING) {
        Write-Host "  2) Stop ClawDeckX / 停止 ClawDeckX"
        Write-Host "  3) Uninstall / 卸载"
        Write-Host "  4) Exit / 退出"
    } elseif ($hasAutoStart) {
        Write-Host "  2) Start ClawDeckX / 启动 ClawDeckX"
        Write-Host "  3) Uninstall / 卸载"
        Write-Host "  4) Exit / 退出"
    } else {
        Write-Host "  2) Uninstall / 卸载"
        Write-Host "  3) Exit / 退出"
    }

    Write-Host ""
    $choice = Read-Choice "Enter your choice / 输入选择 [1-4]:" 1 4

    switch ($choice) {
        1 {
            Update-ClawDeckX -LatestVersion $LATEST_VERSION -Repo $REPO
            return
        }
        2 {
            if ($script:SERVICE_RUNNING) {
                Stop-ClawDeckXService
                return
            } elseif ($hasAutoStart) {
                Write-Host ""
                $null = Start-ClawDeckXService
                if (Test-ProcessRunning) {
                    Write-Host ""
                    Write-C "You can access ClawDeckX at: / 可以访问 ClawDeckX：" Cyan
                    Write-C "  http://localhost:18791" Green
                    Write-Host ""
                    Show-ServiceCommands
                }
                return
            } else {
                Uninstall-ClawDeckX
                return
            }
        }
        3 {
            if ($script:SERVICE_RUNNING -or $hasAutoStart) {
                Uninstall-ClawDeckX
            } else {
                Write-C "Exiting / 退出" Yellow
            }
            return
        }
        default {
            Write-C "Exiting / 退出" Yellow
            return
        }
    }
}

# -- Check admin warning -------------------------------------------------------
if (Test-IsAdmin) {
    Write-Host ""
    Write-C "⚠ Warning: Running as Administrator is not recommended" Red
    Write-C "  不建议以管理员身份运行，可能导致权限和安全问题" Red
    Write-Host ""
    Write-C "You can run this script as a normal user." Yellow
    Write-C "可以以普通用户身份运行此脚本。" Yellow
    Write-Host ""
    if (-not (Read-YesNo "Continue as Administrator? / 以管理员身份继续?" $false)) {
        return
    }
}

# -- Fresh install -------------------------------------------------------------

$arch = Get-Architecture
Write-C "✓ Detected System / 检测到系统: windows/$arch" Green

Write-C "Fetching latest release info... / 正在获取最新版本信息... ($LATEST_VERSION)" Yellow

$apiUrl = "https://api.github.com/repos/$REPO/releases/latest"
$assetPattern = "clawdeckx-windows-${arch}.exe"
$downloadUrl = Get-DownloadUrl $apiUrl $assetPattern

if (-not $downloadUrl) {
    Write-C "Error: Could not find a release asset for windows/$arch" Red
    Write-C "错误：无法找到 windows/$arch 的发布资源" Red
    Write-Host "This might be because: / 可能的原因："
    Write-Host "1. No release has been published yet. / 尚未发布任何版本。"
    Write-Host "2. The asset naming does not match. / 资源文件名不匹配。"
    return
}

Write-C "✓ Found asset / 找到资源: $downloadUrl" Green

$script:INSTALLED_BINARY = Join-Path $PWD $BINARY_NAME
Write-C "Downloading $BINARY_NAME ... / 正在下载 $BINARY_NAME ..." Yellow

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
    Invoke-WebRequest -Uri $downloadUrl -OutFile $script:INSTALLED_BINARY -UseBasicParsing
    Write-C "✓ Download complete! / 下载完成" Green
} catch {
    Write-C "✗ Download failed / 下载失败: $_" Red
    return
}

Write-Host ""
Write-C "Installing to current directory / 正在安装到当前目录 ($PWD) ..." Blue
Write-C "✓ Installed / 已安装: $($script:INSTALLED_BINARY)" Green

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-C "✅ Installation complete! / 安装完成！" Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""
Write-C "Binary location / 二进制文件位置：        $($script:INSTALLED_BINARY)" Cyan
Write-C "Config & Data directory / 配置和数据目录： $(Join-Path (Split-Path $script:INSTALLED_BINARY -Parent) 'data')" Cyan
Write-Host ""
Write-C "✓ Installed in current directory / 已安装在当前目录" Green
Write-Host ""

# Ask if user wants to install auto-start service
$serviceJustInstalled = $false
if (-not (Test-AutoStartInstalled)) {
    Write-C "Would you like to install auto-start service?" Yellow
    Write-C "是否安装自动启动服务?（系统重启后自动运行）" Yellow
    if (Read-YesNo "Install auto-start service? / 安装自动启动服务?" $true) {
        Install-AutoStart
        $serviceJustInstalled = $true
    }
}

# Ask if user wants to start now
if ($serviceJustInstalled) {
    Write-Host ""
    Write-C "Note: Service is installed but NOT started." Cyan
    Write-C "说明：服务已安装但未启动。" Cyan
    Write-Host ""
}

if (Read-YesNo "Start ClawDeckX now? / 立即启动 ClawDeckX?" $true) {
    Write-C ">> Starting ClawDeckX... / 正在启动 ClawDeckX..." Blue
    Write-Host "----------------------------------------"
    Write-Host ""
    Write-C "First run: running in foreground so you can see initialization output." Cyan
    Write-C "首次运行：前台启动以便您查看初始化输出（用户名、密码等）" Cyan
    Write-C "Press Ctrl+C to stop. / 按 Ctrl+C 停止。" Yellow
    Write-Host "----------------------------------------"
    Write-Host ""

    $binaryPath = $script:INSTALLED_BINARY
    if (-not $binaryPath) { $binaryPath = $script:INSTALLED_LOCATION }
    & $binaryPath $args
} else {
    Write-Host ""
    Write-C "You can start it later with: / 稍后可以使用以下命令启动：" Yellow
    Write-C "  .\$BINARY_NAME" Green
    Show-ServiceCommands
}