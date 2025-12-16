#!/usr/bin/env python3
"""
Project Coverage Analyzer
Garante que 100% do projeto EKS foi lido/analisado
"""
import os
from pathlib import Path
from typing import List, Dict
import json

class ProjectAnalyzer:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.total_chars = 0
        self.total_files = 0
        self.file_stats: List[Dict] = []
        
        # Extensions to analyze
        self.extensions = {
            '.md', '.ts', '.tsx', '.js', '.jsx',
            '.py', '.json', '.yml', '.yaml',
            '.env.example', '.txt'
        }
        
        # Directories to skip
        self.skip_dirs = {
            'node_modules', '.next', '.git', '__pycache__',
            'dist', 'build', '.venv', 'venv'
        }
    
    def should_analyze(self, path: Path) -> bool:
        """Check if file should be analyzed"""
        # Skip if in skip_dirs
        for skip in self.skip_dirs:
            if skip in path.parts:
                return False
        
        # Check extension
        if path.suffix in self.extensions:
            return True
        
        # Special cases
        if path.name in ['.env.example', 'Dockerfile', '.gitignore']:
            return True
        
        return False
    
    def analyze_file(self, file_path: Path) -> Dict:
        """Analyze single file"""
        try:
            content = file_path.read_text(encoding='utf-8')
            chars = len(content)
            lines = content.count('\n') + 1
            
            return {
                'path': str(file_path.relative_to(self.project_root)),
                'size_bytes': file_path.stat().st_size,
                'chars': chars,
                'lines': lines,
                'extension': file_path.suffix,
                'readable': True
            }
        except Exception as e:
            return {
                'path': str(file_path.relative_to(self.project_root)),
                'error': str(e),
                'readable': False
            }
    
    def scan_project(self) -> Dict:
        """Scan entire project"""
        print(f"🔍 Scanning project: {self.project_root}")
        
        for root, dirs, files in os.walk(self.project_root):
            # Remove skip_dirs from dirs to prevent walking into them
            dirs[:] = [d for d in dirs if d not in self.skip_dirs]
            
            for file in files:
                file_path = Path(root) / file
                
                if self.should_analyze(file_path):
                    stats = self.analyze_file(file_path)
                    
                    if stats.get('readable'):
                        self.total_chars += stats['chars']
                        self.total_files += 1
                        self.file_stats.append(stats)
        
        return self.generate_report()
    
    def generate_report(self) -> Dict:
        """Generate analysis report"""
        # Sort by chars (largest first)
        self.file_stats.sort(key=lambda x: x.get('chars', 0), reverse=True)
        
        # Group by extension
        by_extension = {}
        for stat in self.file_stats:
            ext = stat.get('extension', 'other')
            if ext not in by_extension:
                by_extension[ext] = {
                    'count': 0,
                    'chars': 0,
                    'lines': 0
                }
            by_extension[ext]['count'] += 1
            by_extension[ext]['chars'] += stat.get('chars', 0)
            by_extension[ext]['lines'] += stat.get('lines', 0)
        
        # Calculate percentages
        for stat in self.file_stats:
            stat['percentage'] = (stat.get('chars', 0) / self.total_chars * 100) if self.total_chars > 0 else 0
        
        return {
            'project_root': str(self.project_root),
            'total_files': self.total_files,
            'total_chars': self.total_chars,
            'total_lines': sum(s.get('lines', 0) for s in self.file_stats),
            'by_extension': by_extension,
            'largest_files': self.file_stats[:20],  # Top 20
            'all_files': self.file_stats
        }
    
    def print_report(self, report: Dict):
        """Pretty print report"""
        print("\n" + "="*80)
        print("📊 PROJECT COVERAGE ANALYSIS")
        print("="*80)
        
        print(f"\n📂 Project: {report['project_root']}")
        print(f"📄 Total files: {report['total_files']:,}")
        print(f"🔤 Total characters: {report['total_chars']:,}")
        print(f"📝 Total lines: {report['total_lines']:,}")
        
        print(f"\n💾 Estimated tokens (chars/4): ~{report['total_chars']//4:,}")
        
        print("\n📊 By Extension:")
        print("-" * 80)
        for ext, stats in sorted(report['by_extension'].items(), 
                                 key=lambda x: x[1]['chars'], 
                                 reverse=True):
            percentage = (stats['chars'] / report['total_chars'] * 100)
            print(f"  {ext:15} | Files: {stats['count']:4} | "
                  f"Chars: {stats['chars']:10,} ({percentage:5.1f}%) | "
                  f"Lines: {stats['lines']:8,}")
        
        print("\n📄 Top 20 Largest Files:")
        print("-" * 80)
        for i, file in enumerate(report['largest_files'], 1):
            print(f"  {i:2}. {file['path']:60} | "
                  f"{file['chars']:8,} chars ({file['percentage']:5.2f}%)")
        
        print("\n" + "="*80)
        
        # Check if within context window
        print("\n🤖 AI Context Window Check:")
        estimated_tokens = report['total_chars'] // 4
        
        if estimated_tokens < 100_000:
            print(f"  ✅ Project fits in single context ({estimated_tokens:,} tokens)")
        elif estimated_tokens < 200_000:
            print(f"  ⚠️  Project is large ({estimated_tokens:,} tokens) - may need multiple passes")
        else:
            print(f"  ❌ Project exceeds typical context ({estimated_tokens:,} tokens) - needs chunking")
        
        print("="*80 + "\n")
    
    def save_report(self, report: Dict, output_file: str = "project-coverage.json"):
        """Save report to JSON"""
        output_path = self.project_root / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        print(f"💾 Report saved to: {output_path}")


def main():
    import sys
    
    # Get project root from argument or use current directory
    project_root = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    
    analyzer = ProjectAnalyzer(project_root)
    report = analyzer.scan_project()
    analyzer.print_report(report)
    analyzer.save_report(report)
    
    # Return exit code based on coverage
    estimated_tokens = report['total_chars'] // 4
    if estimated_tokens > 200_000:
        print("⚠️  WARNING: Project may require multiple read passes")
        return 1
    return 0


if __name__ == "__main__":
    exit(main())
