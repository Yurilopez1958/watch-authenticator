# Watch Authenticator — Public tunnel launcher
# Doble clic: arranca el dev server (si no está), levanta ngrok HTTPS,
# y muestra una ventana con el código QR y la URL para escanear desde el móvil.

$ErrorActionPreference = 'SilentlyContinue'
$port = 3000

$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')

function Test-Port($p) {
    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $tcp.BeginConnect('127.0.0.1', $p, $null, $null)
        $ok  = $iar.AsyncWaitHandle.WaitOne(500, $false)
        if ($ok -and $tcp.Connected) { $tcp.EndConnect($iar); return $true }
        return $false
    } catch { return $false } finally { $tcp.Close() }
}

# 1) Dev server
# Uses Corepack (bundled with Node.js) instead of the npm-installed pnpm.cmd,
# because the latter is a symlink to a Claude AppContainer-private path.
if (-not (Test-Port $port)) {
    Write-Host "Starting Next.js dev server..." -ForegroundColor Cyan
    $corepack = 'C:\Program Files\nodejs\corepack.cmd'
    $webDir   = 'C:\Users\Yuri\Documents\watch-authenticator\apps\web'
    $inner = "Set-Location '$webDir'; & '$corepack' pnpm dev"
    Start-Process powershell -ArgumentList @(
        '-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass',
        '-Command', $inner
    ) -WindowStyle Minimized
    for ($i = 0; $i -lt 45; $i++) {
        Start-Sleep -Seconds 2
        if (Test-Port $port) { Write-Host "Dev server up." -ForegroundColor Green; break }
    }
}

# 2) Ngrok
$ngrokRunning = $false
try {
    $info = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -ErrorAction Stop -TimeoutSec 2
    if ($info.tunnels.Count -gt 0) { $ngrokRunning = $true }
} catch {}

if (-not $ngrokRunning) {
    Write-Host "Starting ngrok tunnel..." -ForegroundColor Cyan
    $ngrokExe = (Get-Command ngrok -ErrorAction SilentlyContinue).Source
    if (-not $ngrokExe) {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show('ngrok not found in PATH. Install with: winget install Ngrok.Ngrok', 'Error', 'OK', 'Error') | Out-Null
        exit 1
    }
    Start-Process $ngrokExe -ArgumentList 'http', $port, '--log=stdout' -WindowStyle Hidden
    Start-Sleep -Seconds 4
}

# 3) URL
$url = $null
for ($i = 0; $i -lt 20; $i++) {
    try {
        $info = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -ErrorAction Stop -TimeoutSec 2
        if ($info.tunnels.Count -gt 0 -and $info.tunnels[0].public_url) {
            $url = $info.tunnels[0].public_url
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

if (-not $url) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show('Could not get the ngrok URL after 20 seconds. Check ngrok status manually.', 'Watch Authenticator', 'OK', 'Error') | Out-Null
    exit 1
}

# 4) Clipboard
Set-Clipboard -Value $url

# 5) Window with QR code
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Web

$bg     = [System.Drawing.Color]::FromArgb(10, 15, 31)
$panel  = [System.Drawing.Color]::FromArgb(17, 26, 46)
$accent = [System.Drawing.Color]::FromArgb(96, 165, 250)
$fg     = [System.Drawing.Color]::FromArgb(230, 237, 247)
$muted  = [System.Drawing.Color]::FromArgb(148, 163, 184)

$form = New-Object System.Windows.Forms.Form
$form.Text = 'Watch Authenticator — Public link'
$form.Size = New-Object System.Drawing.Size(520, 660)
$form.StartPosition = 'CenterScreen'
$form.BackColor = $bg
$form.ForeColor = $fg
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
$form.FormBorderStyle = 'FixedSingle'
$form.MaximizeBox = $false

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Scan with your phone'
$title.ForeColor = $accent
$title.Font = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
$title.Location = New-Object System.Drawing.Point(20, 18)
$title.Size = New-Object System.Drawing.Size(480, 32)
$title.TextAlign = 'MiddleCenter'
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = 'Open the camera app and point it at the QR code'
$subtitle.ForeColor = $muted
$subtitle.Location = New-Object System.Drawing.Point(20, 55)
$subtitle.Size = New-Object System.Drawing.Size(480, 22)
$subtitle.TextAlign = 'MiddleCenter'
$form.Controls.Add($subtitle)

$qrEncoded = [System.Web.HttpUtility]::UrlEncode($url)
$qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=380x380&margin=10&color=0a0f1f&bgcolor=ffffff&data=$qrEncoded"

$pic = New-Object System.Windows.Forms.PictureBox
$pic.Location = New-Object System.Drawing.Point(60, 90)
$pic.Size = New-Object System.Drawing.Size(380, 380)
$pic.SizeMode = 'Zoom'
$pic.BackColor = [System.Drawing.Color]::White
$pic.BorderStyle = 'FixedSingle'
try { $pic.ImageLocation = $qrUrl } catch {}
$form.Controls.Add($pic)

$urlLabel = New-Object System.Windows.Forms.Label
$urlLabel.Text = 'or open this URL directly:'
$urlLabel.ForeColor = $muted
$urlLabel.Font = New-Object System.Drawing.Font('Segoe UI', 9)
$urlLabel.Location = New-Object System.Drawing.Point(20, 485)
$urlLabel.Size = New-Object System.Drawing.Size(480, 18)
$urlLabel.TextAlign = 'MiddleCenter'
$form.Controls.Add($urlLabel)

$urlBox = New-Object System.Windows.Forms.TextBox
$urlBox.Text = $url
$urlBox.ReadOnly = $true
$urlBox.Font = New-Object System.Drawing.Font('Consolas', 10)
$urlBox.Location = New-Object System.Drawing.Point(40, 510)
$urlBox.Size = New-Object System.Drawing.Size(420, 30)
$urlBox.BorderStyle = 'FixedSingle'
$urlBox.BackColor = $panel
$urlBox.ForeColor = $accent
$urlBox.TextAlign = 'Center'
$form.Controls.Add($urlBox)

$status = New-Object System.Windows.Forms.Label
$status.Text = "URL copied to clipboard"
$status.ForeColor = $accent
$status.Location = New-Object System.Drawing.Point(20, 545)
$status.Size = New-Object System.Drawing.Size(480, 22)
$status.TextAlign = 'MiddleCenter'
$form.Controls.Add($status)

$copyBtn = New-Object System.Windows.Forms.Button
$copyBtn.Text = 'Copy URL'
$copyBtn.Location = New-Object System.Drawing.Point(110, 580)
$copyBtn.Size = New-Object System.Drawing.Size(120, 32)
$copyBtn.BackColor = $accent
$copyBtn.ForeColor = [System.Drawing.Color]::Black
$copyBtn.FlatStyle = 'Flat'
$copyBtn.Add_Click({ Set-Clipboard -Value $url; $status.Text = 'URL copied to clipboard' })
$form.Controls.Add($copyBtn)

$openBtn = New-Object System.Windows.Forms.Button
$openBtn.Text = 'Open in browser'
$openBtn.Location = New-Object System.Drawing.Point(280, 580)
$openBtn.Size = New-Object System.Drawing.Size(140, 32)
$openBtn.BackColor = $panel
$openBtn.ForeColor = $fg
$openBtn.FlatStyle = 'Flat'
$openBtn.Add_Click({ Start-Process $url })
$form.Controls.Add($openBtn)

$form.ShowDialog() | Out-Null
