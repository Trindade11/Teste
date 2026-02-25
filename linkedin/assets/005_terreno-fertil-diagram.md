# Diagrama Mermaid - Terreno Fértil: Knowledge Engineering de Negócio

## Código Mermaid

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#f3f9ff', 'primaryTextColor': '#0d47a1', 'primaryBorderColor': '#2196f3', 'lineColor': '#42a5f5', 'sectionBkgColor': '#e3f2fd', 'altSectionBkgColor': '#bbdefb', 'gridColor': '#90caf9'}}}%%
flowchart TD
    subgraph TerrenoFértil["🌱 TERRENO FÉRTIL<br/>Knowledge Engineering de Negócio"]
        ROOT[Knowledge Engineering<br/>de Negócio<br/>🏗️ Fundamento da IA Corporativa]
        
        ROOT --> CAPTURA
        ROOT --> EXTER
        ROOT --> CURA
        ROOT --> ESTRUT
        ROOT --> CICLO
        
        subgraph CAPTURA_SUB["1️⃣ CAPTURA DO REAL"]
            CAPTURA["𝗖𝗮𝗽𝘁𝘂𝗿𝗮 𝗱𝗼 𝗿𝗲𝗮𝗹"]
            CAPTURA_DESC["• O que foi decidido<br/>• Por quê<br/>• Quais premissas<br/>• Reuniões, e-mails, alinhamentos"]
            CAPTURA --> CAPTURA_DESC
        end
        
        subgraph EXTER_SUB["2️⃣ EXTERNALIZAÇÃO DO TÁCITO"]
            EXTER["𝗘𝘅𝘁𝗲𝗿𝗻𝗮𝗹𝗶𝘇𝗮çã𝗼 𝗱𝗼 𝘁á𝗰𝗶𝘁𝗼"]
            EXTER_DESC["• Estratégia não está no ERP<br/>• Está na cabeça das pessoas<br/>• Converter em artefato explícito<br/>• Trabalho mais valioso"]
            EXTER --> EXTER_DESC
        end
        
        subgraph CURA_SUB["3️⃣ CURADORIA E VALIDAÇÃO"]
            CURA["𝗖𝘂𝗿𝗮𝗱𝗼𝗿𝗶𝗮 𝗲 𝘃𝗮𝗹𝗶𝗱𝗮çã𝗼"]
            CURA_DESC["• Humano valida o mundo da IA<br/>• Sem isso: base podre<br/>• Respostas convincentes<br/>• Sobre fundamento frágil"]
            CURA --> CURA_DESC
        end
        
        subgraph ESTRUT_SUB["4️⃣ ESTRUTURAÇÃO SEMÂNTICA"]
            ESTRUT["𝗘𝘀𝘁𝗿𝘂𝘁𝘂𝗿𝗮çã𝗼 𝘀𝗲𝗺â𝗻𝘁𝗶𝗰𝗮"]
            ESTRUT_DESC["• Não é conectar dados<br/>• É dar forma ao significado<br/>• Conceitos, relações, proveniência<br/>• Significado estruturado"]
            ESTRUT --> ESTRUT_DESC
        end
        
        subgraph CICLO_SUB["5️⃣ CICLO DE VIDA"]
            CICLO["𝗖𝗶𝗰𝗹𝗼 𝗱𝗲 𝘃𝗶𝗱𝗮"]
            CICLO_DESC["• Memória viva<br/>• Versões, atualização<br/>• Obsolescência<br/>• Evolução contínua"]
            CICLO --> CICLO_DESC
        end
    end
    
    %% Estilo visual
    style ROOT fill:#1565c0,color:#ffffff,stroke:#0d47a1,stroke-width:3px
    style CAPTURA fill:#42a5f5,color:#ffffff,stroke:#1976d2
    style EXTER fill:#42a5f5,color:#ffffff,stroke:#1976d2
    style CURA fill:#42a5f5,color:#ffffff,stroke:#1976d2
    style ESTRUT fill:#42a5f5,color:#ffffff,stroke:#1976d2
    style CICLO fill:#42a5f5,color:#ffffff,stroke:#1976d2
    
    style TerrenoFértil fill:#f3f9ff,stroke:#2196f3,stroke-width:2px
    style CAPTURA_SUB fill:#e3f2fd,stroke:#42a5f5
    style EXTER_SUB fill:#e3f2fd,stroke:#42a5f5
    style CURA_SUB fill:#e3f2fd,stroke:#42a5f5
    style ESTRUT_SUB fill:#e3f2fd,stroke:#42a5f5
    style CICLO_SUB fill:#e3f2fd,stroke:#42a5f5
```

## Versão Simplificada (para LinkedIn)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#f8fff8', 'primaryTextColor': '#1b5e20', 'primaryBorderColor': '#4caf50', 'lineColor': '#66bb6a'}}}%%
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
```

## Como Gerar a Imagem

1. **Opção 1 - Mermaid Live**: 
   - Acesse https://mermaid.live
   - Copie o código da versão simplificada
   - Exporte como PNG/SVG

2. **Opção 2 - VS Code**:
   - Instale extensão "Mermaid Preview"
   - Cole o código em arquivo .md
   - Use preview para exportar

3. **Opção 3 - Online**:
   - https://mermaidchart.com
   - https://diagrams.net (draw.io) - suporta Mermaid

## Sugestão para o Post

Use a **versão simplificada** (verde) — mais limpa e legível no LinkedIn. O azul mais detalhado pode ser usado em artigos ou apresentações futuras.

---

*Diagrama criado em: 13/02/2026*
*Para uso no post LinkedIn "Terreno Fértil"*
