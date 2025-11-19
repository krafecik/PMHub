# Script para iniciar a aplicação PM Hub
# Verifica e libera portas, depois inicia backend e frontend

param(
    [int]$BackendPort = 3055,
    [int]$FrontendPort = 3056,
    [switch]$SkipPortCheck
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

# Função para matar processos em uma porta
function Stop-ProcessByPort {
    param(
        [int]$Port,
        [string]$ServiceName
    )
    
    Write-Info "Verificando porta $Port ($ServiceName)..."
    
    if (Test-Port -Port $Port) {
        Write-Warning "Porta $Port está em uso!"
        
        $processIds = Get-ProcessByPort -Port $Port
        
        if ($processIds.Count -eq 0) {
            Write-Warning "Não foi possível identificar o processo usando a porta $Port"
            return $false
        }
        
        foreach ($processId in $processIds) {
            try {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Warning "Encerrando processo: $($process.ProcessName) (PID: $processId)"
                    Stop-Process -Id $processId -Force -ErrorAction Stop
                    Write-Success "Processo $($process.ProcessName) (PID: $processId) encerrado com sucesso"
                }
            }
            catch {
                Write-Error "Erro ao encerrar processo PID $processId : $_"
                return $false
            }
        }
        
        # Aguardar um pouco para a porta ser liberada
        Start-Sleep -Seconds 2
        
        if (Test-Port -Port $Port) {
            Write-Error "A porta $Port ainda está em uso após tentativa de encerramento"
            return $false
        }
        
        Write-Success "Porta $Port liberada com sucesso"
    }
    else {
        Write-Success "Porta $Port está livre"
    }
    
    return $true
}

# Função para verificar se Node.js está instalado
function Test-NodeInstalled {
    try {
        $nodeVersion = node --version
        Write-Success "Node.js encontrado: $nodeVersion"
        return $true
    }
    catch {
        Write-Error "Node.js não está instalado ou não está no PATH"
        return $false
    }
}

# Função para verificar se as dependências estão instaladas
function Test-Dependencies {
    param([string]$Path, [string]$Name)
    
    if (-not (Test-Path "$Path/node_modules")) {
        Write-Warning "Dependências de $Name não encontradas. Instalando..."
        Set-Location $Path
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Erro ao instalar dependências de $Name"
            return $false
        }
        Write-Success "Dependências de $Name instaladas"
    }
    else {
        Write-Success "Dependências de $Name encontradas"
    }
    
    return $true
}

# Função para iniciar o backend
function Start-Backend {
    $backendPath = Join-Path $PSScriptRoot "backend"
    
    if (-not (Test-Path $backendPath)) {
        Write-Error "Diretório backend não encontrado: $backendPath"
        return $false
    }
    
    Write-Info "Iniciando backend na porta $BackendPort..."
    
    # Criar nova janela do PowerShell para o backend
    $backendScript = @"
Set-Location '$backendPath'
`$env:PORT = '$BackendPort'
Write-Host '🚀 Iniciando Backend na porta $BackendPort...' -ForegroundColor Cyan
npm run start:dev
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript
    
    Write-Success "Backend iniciado em nova janela"
    return $true
}

# Função para iniciar o frontend
function Start-Frontend {
    $frontendPath = Join-Path $PSScriptRoot "frontend"
    
    if (-not (Test-Path $frontendPath)) {
        Write-Error "Diretório frontend não encontrado: $frontendPath"
        return $false
    }
    
    Write-Info "Iniciando frontend na porta $FrontendPort..."
    
    # Criar nova janela do PowerShell para o frontend
    $frontendScript = @"
Set-Location '$frontendPath'
Write-Host '🎨 Iniciando Frontend na porta $FrontendPort...' -ForegroundColor Cyan
npm run dev
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript
    
    Write-Success "Frontend iniciado em nova janela"
    return $true
}

# ============================================
# MAIN EXECUTION
# ============================================

Write-Info "=========================================="
Write-Info "  PM Hub - Iniciador de Aplicação"
Write-Info "=========================================="
Write-Output ""

# Verificar Node.js
if (-not (Test-NodeInstalled)) {
    exit 1
}

Write-Output ""

# Verificar e liberar portas
if (-not $SkipPortCheck) {
    Write-Info "Verificando portas..."
    Write-Output ""
    
    if (-not (Stop-ProcessByPort -Port $BackendPort -ServiceName "Backend")) {
        Write-Error "Não foi possível liberar a porta do backend"
        exit 1
    }
    
    Write-Output ""
    
    if (-not (Stop-ProcessByPort -Port $FrontendPort -ServiceName "Frontend")) {
        Write-Error "Não foi possível liberar a porta do frontend"
        exit 1
    }
    
    Write-Output ""
}
else {
    Write-Warning "Verificação de portas ignorada (--SkipPortCheck)"
    Write-Output ""
}

# Verificar dependências
Write-Info "Verificando dependências..."
Write-Output ""

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

if (-not (Test-Dependencies -Path $backendPath -Name "Backend")) {
    exit 1
}

Write-Output ""

if (-not (Test-Dependencies -Path $frontendPath -Name "Frontend")) {
    exit 1
}

Write-Output ""

# Aguardar um pouco antes de iniciar
Start-Sleep -Seconds 1

# Iniciar aplicações
Write-Info "Iniciando aplicações..."
Write-Output ""

if (-not (Start-Backend)) {
    Write-Error "Erro ao iniciar backend"
    exit 1
}

Start-Sleep -Seconds 2

if (-not (Start-Frontend)) {
    Write-Error "Erro ao iniciar frontend"
    exit 1
}

Write-Output ""
Write-Success "=========================================="
Write-Success "  Aplicação iniciada com sucesso!"
Write-Success "=========================================="
Write-Output ""
Write-Info "Backend:  http://localhost:$BackendPort"
Write-Info "Frontend: http://localhost:$FrontendPort"
Write-Output ""
Write-Warning "Pressione Ctrl+C para encerrar este script"
Write-Warning "As janelas do backend e frontend continuarão abertas"
Write-Output ""

# Manter o script rodando
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
catch {
    Write-Output ""
    Write-Info "Script encerrado"
}

