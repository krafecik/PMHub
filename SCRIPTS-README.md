# Scripts de Gerenciamento da Aplicação

Este diretório contém scripts PowerShell para facilitar o gerenciamento da aplicação CPOPM.

## Scripts Disponíveis

### `start-app.ps1`
Inicia a aplicação (backend e frontend) em janelas separadas do PowerShell.

**Funcionalidades:**
- ✅ Verifica se as portas estão em uso
- ✅ Encerra processos que estejam usando as portas necessárias
- ✅ Verifica se Node.js está instalado
- ✅ Verifica e instala dependências automaticamente
- ✅ Inicia backend e frontend em janelas separadas

**Uso:**
```powershell
# Iniciar com portas padrão (backend: 3000, frontend: 3056)
.\start-app.ps1

# Iniciar com portas customizadas
.\start-app.ps1 -BackendPort 3001 -FrontendPort 3057

# Ignorar verificação de portas
.\start-app.ps1 -SkipPortCheck
```

**Parâmetros:**
- `-BackendPort <int>`: Porta do backend (padrão: 3000)
- `-FrontendPort <int>`: Porta do frontend (padrão: 3056)
- `-SkipPortCheck`: Ignora a verificação e liberação de portas

### `stop-app.ps1`
Encerra todos os processos que estão usando as portas do backend e frontend.

**Uso:**
```powershell
# Parar aplicação com portas padrão
.\stop-app.ps1

# Parar aplicação com portas customizadas
.\stop-app.ps1 -BackendPort 3001 -FrontendPort 3057
```

**Parâmetros:**
- `-BackendPort <int>`: Porta do backend (padrão: 3000)
- `-FrontendPort <int>`: Porta do frontend (padrão: 3056)

## Requisitos

- Windows PowerShell 5.1 ou PowerShell 7+
- Node.js instalado e no PATH
- Permissões de administrador (pode ser necessário para encerrar alguns processos)

## Exemplo de Uso Completo

```powershell
# 1. Iniciar a aplicação
.\start-app.ps1

# A aplicação será iniciada em duas janelas separadas:
# - Uma para o backend (porta 3000)
# - Uma para o frontend (porta 3056)

# 2. Para parar a aplicação
.\stop-app.ps1
```

## Solução de Problemas

### Erro: "Porta ainda está em uso"
Se o script não conseguir liberar uma porta, você pode:
1. Executar o script como administrador
2. Verificar manualmente qual processo está usando a porta:
   ```powershell
   Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
   ```
3. Encerrar o processo manualmente pelo Gerenciador de Tarefas

### Erro: "Node.js não está instalado"
Certifique-se de que o Node.js está instalado e adicionado ao PATH do sistema.

### Erro: "Dependências não encontradas"
O script tentará instalar automaticamente as dependências. Se falhar, execute manualmente:
```powershell
cd backend
npm install
cd ../frontend
npm install
```

## Notas

- O script `start-app.ps1` mantém uma janela do PowerShell aberta enquanto as aplicações estão rodando
- Para encerrar completamente, use `stop-app.ps1` ou feche as janelas manualmente
- As portas padrão podem ser alteradas editando os arquivos de configuração ou usando os parâmetros do script

