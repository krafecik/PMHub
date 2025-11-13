# Script para parar a aplicação CPOPM
# Encerra processos nas portas do backend e frontend

param(
    [int]$BackendPort = 3000,
    [int]$FrontendPort = 3056
)

$ErrorActionPreference = "Stop"

# Cores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Info { Write-ColorOutput Cyan $args }
function Write-Warning { Write-ColorOutput Yellow $args }

# Função para verificar se uma porta está em uso
function Test-Port {
    param([int]$Port)
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        return $connection
    }
    catch {
        return $false
    }
}

# Função para obter processos usando uma porta
function Get-ProcessByPort {
    param([int]$Port)
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        return $processIds
    }
    catch {
        return @()
    }
}

# Função para parar processos em uma porta
function Stop-ProcessByPort {
    param(
        [int]$Port,
        [string]$ServiceName
    )
    
    Write-Info "Verificando porta $Port ($ServiceName)..."
    
    if (-not (Test-Port -Port $Port)) {
        Write-Success "Porta $Port não está em uso"
        return $true
    }
    
    $processIds = Get-ProcessByPort -Port $Port
    
    if ($processIds.Count -eq 0) {
        Write-Warning "Porta $Port está em uso, mas não foi possível identificar o processo"
        return $false
    }
    
    $stopped = $false
    foreach ($pid in $processIds) {
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Info "Encerrando processo: $($process.ProcessName) (PID: $pid)"
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Success "Processo $($process.ProcessName) (PID: $pid) encerrado"
                $stopped = $true
            }
        }
        catch {
            Write-Error "Erro ao encerrar processo PID $pid : $_"
        }
    }
    
    if ($stopped) {
        Start-Sleep -Seconds 1
        if (-not (Test-Port -Port $Port)) {
            Write-Success "Porta $Port liberada com sucesso"
            return $true
        }
        else {
            Write-Warning "Porta $Port ainda está em uso"
            return $false
        }
    }
    
    return $false
}

# ============================================
# MAIN EXECUTION
# ============================================

Write-Info "=========================================="
Write-Info "  CPOPM - Parar Aplicação"
Write-Info "=========================================="
Write-Output ""

$allStopped = $true

# Parar backend
if (-not (Stop-ProcessByPort -Port $BackendPort -ServiceName "Backend")) {
    $allStopped = $false
}

Write-Output ""

# Parar frontend
if (-not (Stop-ProcessByPort -Port $FrontendPort -ServiceName "Frontend")) {
    $allStopped = $false
}

Write-Output ""

if ($allStopped) {
    Write-Success "=========================================="
    Write-Success "  Aplicação encerrada com sucesso!"
    Write-Success "=========================================="
    exit 0
}
else {
    Write-Warning "Algumas portas ainda podem estar em uso"
    exit 1
}

