# Watch Authenticator — local launcher
# Doble clic: arranca el dev server de Next.js (si no está) y abre el navegador.
#
# Usa Corepack (incluido con Node.js en C:\Program Files\nodejs\) en lugar de
# pnpm.cmd, porque el pnpm.cmd instalado vía npm dentro del AppContainer de
# Claude es un symlink que apunta a una ruta privada del sandbox y no es
# accesible desde un shell de escritorio normal.

$ErrorActionPreference = 'SilentlyContinue'
$port      = 3000
$url       = "http://localhost:$port"
$corepack  = 'C:\Program Files\nodejs\corepack.cmd'
$webDir    = 'C:\Users\Yuri\Documents\watch-authenticator\apps\web'

function Test-Port($p) {
    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $tcp.BeginConnect('127.0.0.1', $p, $null, $null)
        $ok  = $iar.AsyncWaitHandle.WaitOne(500, $false)
        if ($ok -and $tcp.Connected) { $tcp.EndConnect($iar); return $true }
        return $false
    } catch { return $false } finally { $tcp.Close() }
}

if (Test-Port $port) {
    Start-Process $url
    return
}

# corepack pnpm dev — corepack downloads pnpm on first use, then caches it.
# Allows running pnpm without a per-user global install.
$inner = "Set-Location '$webDir'; & '$corepack' pnpm dev"

Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command', $inner
) -WindowStyle Minimized

# Wait for the port to come up, then open the browser
for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 2
    if (Test-Port $port) { break }
}

Start-Process $url
