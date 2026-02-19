#!/usr/bin/env python3
"""
Script para converter livro_nivel2.md para PDF com suporte a Mermaid
"""
import re
import subprocess
import sys
import os
from pathlib import Path

def check_dependencies():
    """Verifica se as dependências estão instaladas"""
    try:
        import markdown
        from playwright.sync_api import sync_playwright
        return True
    except ImportError:
        print("Instalando dependências necessárias...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "markdown", "playwright"])
        print("Instalando navegador do Playwright...")
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
        return True

def render_mermaid_diagrams(md_content):
    """Identifica e marca diagramas que precisam de tratamento especial"""
    # Tipos de diagramas que geralmente precisam de mais espaço horizontal
    landscape_types = ['gantt', 'quadrantChart', 'gitgraph']
    wide_types = ['flowchart', 'sequenceDiagram']
    
    def process_mermaid_block(match):
        content = match.group(1)
        
        # Detectar tipo de diagrama
        diagram_type = None
        for line in content.split('\n'):
            line = line.strip()
            if line in landscape_types:
                diagram_type = 'landscape'
                break
            elif line in wide_types:
                diagram_type = 'wide'
                break
        
        # Adicionar classe CSS apropriada
        if diagram_type == 'landscape':
            return f'<div class="mermaid landscape-diagram">\n{content}\n</div>'
        elif diagram_type == 'wide':
            return f'<div class="mermaid wide-diagram">\n{content}\n</div>'
        else:
            return f'<div class="mermaid">\n{content}\n</div>'
    
    # Processar todos os blocos Mermaid
    return re.sub(r'```mermaid\s*\n(.*?)\n```', process_mermaid_block, md_content, flags=re.DOTALL)

def convert_md_to_html(md_file):
    """Converte Markdown para HTML"""
    import markdown
    
    # Extensões para suportar tabelas, código, etc
    extensions = [
        'extra',
        'codehilite',
        'tables',
        'fenced_code',
        'toc'
    ]
    
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Processar blocos Mermaid com tratamento inteligente
    md_content = render_mermaid_diagrams(md_content)
    
    # Converter Mermaid para HTML que será renderizado
    # Vamos usar a biblioteca mermaid.js via CDN
    html_template = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ontology Engineering & Enterprise Knowledge Systems</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1100px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }}
        h1, h2, h3, h4, h5, h6 {{
            color: #2c3e50;
            margin-top: 1.5em;
        }}
        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }}
        pre {{
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }}
        pre code {{
            background-color: transparent;
            padding: 0;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        th {{
            background-color: #4CAF50;
            color: white;
        }}
        blockquote {{
            border-left: 4px solid #4CAF50;
            margin: 20px 0;
            padding-left: 20px;
            color: #666;
        }}
        .mermaid {{
            background-color: white;
            margin: 20px 0;
            text-align: center;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            padding: 10px;
            overflow: hidden;
            page-break-inside: avoid;
        }}
        /* Para diagramas complexos, usar página inteira */
        .mermaid.landscape-diagram {{
            page-break-after: always;
            page-break-before: always;
            transform: rotate(90deg);
            transform-origin: center center;
            position: relative;
            width: 297mm; /* A4 width */
            height: 210mm; /* A4 height */
            margin: -29.7mm 0; /* Compensar rotação */
        }}
        .mermaid svg {{
            max-width: 100% !important;
            height: auto !important;
            max-height: 400px; /* Reduzido para retrato */
        }}
        /* Para diagramas muito largos */
        .mermaid.wide-diagram svg {{
            max-height: 600px;
            width: 100% !important;
        }}
    </style>
</head>
<body>
{content}
<script>
    mermaid.initialize({{
        startOnLoad: true,
        theme: 'default',
        fontSize: 12,
        flowchart: {{ useMaxWidth: true, htmlLabels: true, curve: 'basis' }},
        sequence: {{ useMaxWidth: true }},
        gantt: {{ useMaxWidth: true, fontSize: 11 }}
    }});
</script>
</body>
</html>"""
    
    md = markdown.Markdown(extensions=extensions)
    html_content = md.convert(md_content)
    
    return html_template.format(content=html_content)

def convert_html_to_pdf(html_file, pdf_file):
    """Converte HTML para PDF usando Playwright"""
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Carregar o arquivo HTML
        page.goto(f"file://{Path(html_file).absolute()}")
        
        # Aguardar Mermaid renderizar (pode levar alguns segundos)
        page.wait_for_timeout(5000)  # 5 segundos para renderizar todos os diagramas
        
        # Gerar PDF
        page.pdf(
            path=str(pdf_file),
            landscape=False,  # Retrato
            format="A4",
            margin={"top": "20mm", "right": "20mm", "bottom": "20mm", "left": "20mm"},
            print_background=True
        )
        
        browser.close()

def main():
    md_file = Path("livro_nivel2.md")
    html_file = Path("livro_nivel2_temp.html")
    pdf_file = Path("livro_nivel2.pdf")
    
    if not md_file.exists():
        print(f"Erro: {md_file} não encontrado!")
        return 1
    
    print("Verificando dependências...")
    check_dependencies()
    
    print("Convertendo Markdown para HTML...")
    html_content = convert_md_to_html(md_file)
    
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("Convertendo HTML para PDF...")
    convert_html_to_pdf(str(html_file), str(pdf_file))
    
    # Limpar arquivo temporário
    html_file.unlink()
    
    print(f"\nPDF gerado com sucesso: {pdf_file.absolute()}")
    return 0

if __name__ == "__main__":
    sys.exit(main())

