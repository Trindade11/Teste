"""
Script para analisar cobertura de leitura dos arquivos de chat.
Garante que 100% do conteúdo foi lido antes de prosseguir.
"""

import os
from pathlib import Path
from typing import Dict, List, Tuple
import json
from datetime import datetime

class ChatCoverageAnalyzer:
    def __init__(self, chat_dir: str):
        self.chat_dir = Path(chat_dir)
        self.coverage_file = self.chat_dir.parent / ".specify" / "memory" / "chat_coverage.json"
        self.coverage_file.parent.mkdir(parents=True, exist_ok=True)
        
    def scan_all_chats(self) -> Dict[str, Dict]:
        """Escaneia todos os arquivos de chat e retorna estatísticas."""
        chat_files = {}
        
        for file_path in self.chat_dir.glob("chat*.txt"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                chat_files[file_path.name] = {
                    'path': str(file_path),
                    'total_chars': len(content),
                    'total_lines': content.count('\n') + 1,
                    'total_words': len(content.split()),
                    'size_kb': file_path.stat().st_size / 1024,
                    'last_modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                }
            except Exception as e:
                print(f"⚠️  Erro ao ler {file_path.name}: {e}")
                
        return chat_files
    
    def calculate_totals(self, chat_files: Dict) -> Dict:
        """Calcula totais gerais."""
        return {
            'total_files': len(chat_files),
            'total_characters': sum(f['total_chars'] for f in chat_files.values()),
            'total_lines': sum(f['total_lines'] for f in chat_files.values()),
            'total_words': sum(f['total_words'] for f in chat_files.values()),
            'total_size_kb': sum(f['size_kb'] for f in chat_files.values()),
        }
    
    def load_read_history(self) -> Dict:
        """Carrega histórico de leituras anteriores."""
        if self.coverage_file.exists():
            with open(self.coverage_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'read_sessions': [], 'files_read': {}}
    
    def mark_as_read(self, chat_files: Dict):
        """Marca arquivos como lidos na sessão atual."""
        history = self.load_read_history()
        
        session = {
            'timestamp': datetime.now().isoformat(),
            'files_analyzed': list(chat_files.keys()),
            'total_chars_read': sum(f['total_chars'] for f in chat_files.values())
        }
        
        history['read_sessions'].append(session)
        history['files_read'] = chat_files
        history['last_scan'] = self.calculate_totals(chat_files)
        
        with open(self.coverage_file, 'w', encoding='utf-8') as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
    
    def generate_report(self) -> str:
        """Gera relatório visual de cobertura."""
        chat_files = self.scan_all_chats()
        totals = self.calculate_totals(chat_files)
        history = self.load_read_history()
        
        report = []
        report.append("=" * 80)
        report.append("📊 ANÁLISE DE COBERTURA DOS CHATS - EKS Project")
        report.append("=" * 80)
        report.append("")
        
        # Totais
        report.append("📈 TOTAIS GERAIS:")
        report.append(f"  • Arquivos encontrados: {totals['total_files']}")
        report.append(f"  • Total de caracteres:  {totals['total_characters']:,}")
        report.append(f"  • Total de linhas:      {totals['total_lines']:,}")
        report.append(f"  • Total de palavras:    {totals['total_words']:,}")
        report.append(f"  • Tamanho total:        {totals['total_size_kb']:.2f} KB")
        report.append("")
        
        # Detalhes por arquivo
        report.append("📄 DETALHES POR ARQUIVO:")
        report.append("-" * 80)
        
        for filename in sorted(chat_files.keys()):
            info = chat_files[filename]
            report.append(f"\n  {filename}")
            report.append(f"    Caracteres: {info['total_chars']:,}")
            report.append(f"    Linhas:     {info['total_lines']:,}")
            report.append(f"    Palavras:   {info['total_words']:,}")
            report.append(f"    Tamanho:    {info['size_kb']:.2f} KB")
            report.append(f"    Modificado: {info['last_modified']}")
        
        report.append("")
        report.append("-" * 80)
        
        # Histórico de leituras
        if history.get('read_sessions'):
            report.append("")
            report.append("📚 HISTÓRICO DE LEITURAS:")
            report.append(f"  • Sessões anteriores: {len(history['read_sessions'])}")
            last_session = history['read_sessions'][-1]
            report.append(f"  • Última leitura: {last_session['timestamp']}")
            report.append(f"  • Caracteres lidos: {last_session['total_chars_read']:,}")
        else:
            report.append("")
            report.append("📚 HISTÓRICO DE LEITURAS:")
            report.append("  • Nenhuma sessão de leitura registrada ainda")
        
        report.append("")
        report.append("=" * 80)
        
        # Calcula estimativa de tokens (aproximação: 1 token ≈ 4 caracteres)
        estimated_tokens = totals['total_characters'] / 4
        report.append(f"🔢 ESTIMATIVA DE TOKENS: ~{estimated_tokens:,.0f} tokens")
        report.append(f"   (Janela de contexto necessária: ~{estimated_tokens:,.0f} tokens)")
        report.append("")
        
        # Recomendação
        if estimated_tokens > 100000:
            report.append("⚠️  RECOMENDAÇÃO:")
            report.append("   O conteúdo é muito grande para uma única leitura.")
            report.append("   Sugestão: Processar em chunks ou criar sumários progressivos.")
        else:
            report.append("✅ RECOMENDAÇÃO:")
            report.append("   Conteúdo pode ser processado em uma única sessão.")
        
        report.append("=" * 80)
        
        return "\n".join(report)
    
    def read_all_chats_content(self) -> Dict[str, str]:
        """Lê o conteúdo completo de todos os chats."""
        contents = {}
        for file_path in sorted(self.chat_dir.glob("chat*.txt")):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    contents[file_path.name] = f.read()
            except Exception as e:
                print(f"⚠️  Erro ao ler {file_path.name}: {e}")
        return contents


def main():
    # Diretório dos chats
    chat_dir = Path(__file__).parent.parent.parent / "chat"
    
    analyzer = ChatCoverageAnalyzer(str(chat_dir))
    
    # Gera relatório
    report = analyzer.generate_report()
    print(report)
    
    # Salva relatório em arquivo
    report_file = chat_dir.parent / ".specify" / "memory" / "chat_analysis_report.txt"
    report_file.parent.mkdir(parents=True, exist_ok=True)
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n💾 Relatório salvo em: {report_file}")
    
    # Marca como lidos
    chat_files = analyzer.scan_all_chats()
    analyzer.mark_as_read(chat_files)
    
    print(f"✅ Cobertura atualizada em: {analyzer.coverage_file}")


if __name__ == "__main__":
    main()
