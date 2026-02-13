# Script para gerar imagem do diagrama Terreno Fértil

$code = @"
flowchart TD
    ROOT[🌱 Terreno Fértil<br/>Knowledge Engineering de Negócio]
    
    ROOT --> N1["1️⃣ CAPTURA DO REAL<br/>O que foi decidido, por quê, premissas"]
    ROOT --> N2["2️⃣ EXTERNALIZAÇÃO DO TÁCITO<br/>Estratégia na cabeça → artefato explícito"]
    ROOT --> N3["3️⃣ CURADORIA E VALIDAÇÃO<br/>Humano valida o mundo da IA"]
    ROOT --> N4["4️⃣ ESTRUTURAÇÃO SEMÂNTICA<br/>Dar forma ao significado"]
    ROOT --> N5["5️⃣ CICLO DE VIDA<br/>Memória viva: versões, atualização"]
    
    style ROOT fill:#2e7d32,color:#ffffff,stroke:#1b5e20,stroke-width:3px
    style N1 fill:#66bb6a,color:#ffffff,stroke:#388e3c
    style N2 fill:#66bb6a,color:#ffffff,stroke:#388e3c
    style N3 fill:#66bb6a,color:#ffffff,stroke:#388e3c
    style N4 fill:#66bb6a,color:#ffffff,stroke:#388e3c
    style N5 fill:#66bb6a,color:#ffffff,stroke:#388e3c
"@

# Codificar para URL (método alternativo)
Add-Type -AssemblyName System.Web
$encodedCode = [System.Web.HttpUtility]::UrlEncode($code)

# Abrir no navegador
$url = "https://mermaid.live/edit#$encodedCode"
Write-Host "🌐 Abrindo Mermaid Live com o diagrama..." -ForegroundColor Green
Write-Host "📋 URL: $url" -ForegroundColor Yellow
Start-Process $url

Write-Host "💡 No navegador: Actions → Export as PNG" -ForegroundColor Cyan
Write-Host "📁 Salve como: terreno-fertil-knowledge-engineering.png" -ForegroundColor Cyan
