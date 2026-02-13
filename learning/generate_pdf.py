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
    """Substitui blocos Mermaid por imagens renderizadas ou HTML"""
    # Por enquanto, vamos manter os blocos Mermaid como estão
    # e usar uma extensão do markdown que suporte Mermaid
    # ou converter para HTML que será renderizado pelo navegador
    return md_content

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
    
    # Processar blocos Mermaid antes de converter para HTML
    # Substituir ```mermaid por <div class="mermaid"> para que o Mermaid.js possa renderizar
    md_content = re.sub(r'```mermaid\s*\n(.*?)\n```', r'<div class="mermaid">\n\1\n</div>', md_content, flags=re.DOTALL)
    
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
        .mermaid svg {{
            max-width: 100% !important;
            height: auto !important;
            max-height: 500px;
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
            landscape=True,
            format="A4",
            margin={"top": "15mm", "right": "15mm", "bottom": "15mm", "left": "15mm"},
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

