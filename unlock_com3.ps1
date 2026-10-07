# 此脚本需要以【管理员身份】运行
# 右键点击此文件 -> "使用 PowerShell 运行" 或在管理员 PowerShell 中执行

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EasyInput COM3 端口解锁工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[错误] 请以管理员身份运行此脚本！" -ForegroundColor Red
    Write-Host "方法：右键 PowerShell -> 以管理员身份运行 -> 再执行此脚本" -ForegroundColor Yellow
    Read-Host "按回车退出"
    exit 1
}

Write-Host "[1/4] 正在查找占用 COM3 的进程..." -ForegroundColor Yellow
# 查找 EasyInput 相关进程
$procs = Get-Process -Name "EasyInput*" -ErrorAction SilentlyContinue
if ($procs) {
    Write-Host "  发现 EasyInput 进程，正在终止..." -ForegroundColor Red
    $procs | Stop-Process -Force
    Start-Sleep -Seconds 1
    Write-Host "  已终止 EasyInput 进程" -ForegroundColor Green
} else {
    Write-Host "  未发现 EasyInput.exe 进程" -ForegroundColor Gray
}

Write-Host "[2/4] 正在禁用 USB 设备 (COM3)..." -ForegroundColor Yellow
$instanceId = "USB\VID_303A&PID_1001&MI_00\8&7638f18&0&0000"
try {
    Disable-PnpDevice -InstanceId $instanceId -Confirm:$false -ErrorAction Stop
    Write-Host "  设备已禁用" -ForegroundColor Green
} catch {
    Write-Host "  Disable-PnpDevice 失败，尝试 pnputil..." -ForegroundColor Yellow
    pnputil /disable-device $instanceId 2>$null
}

Write-Host "[3/4] 等待 2 秒释放驱动句柄..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "[4/4] 正在重新启用 USB 设备 (COM3)..." -ForegroundColor Yellow
try {
    Enable-PnpDevice -InstanceId $instanceId -Confirm:$false -ErrorAction Stop
    Write-Host "  设备已重新启用" -ForegroundColor Green
} catch {
    Write-Host "  Enable-PnpDevice 失败，尝试 pnputil..." -ForegroundColor Yellow
    pnputil /enable-device $instanceId 2>$null
}

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "正在验证 COM3 是否可访问..." -ForegroundColor Yellow
[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Ports") | Out-Null
try {
    $p = New-Object System.IO.Ports.SerialPort("COM3", 115200)
    $p.Open()
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  成功！COM3 已解锁，可正常使用！" -ForegroundColor Green
    Write-Host "  请回到浏览器点击「连接 COM3」" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    $p.Close()
    $p.Dispose()
} catch {
    Write-Host ""
    Write-Host "COM3 仍然被锁定: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "最终方案：请手动拔下 EasyInput 的 USB 数据线，等 3 秒后重新插上。" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "按回车退出"
