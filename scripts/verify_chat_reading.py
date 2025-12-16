#!/usr/bin/env python3
"""
Script to verify complete reading of chat files
Ensures 100% content coverage before proceeding
"""

import os
from pathlib import Path
from typing import Dict, List

def analyze_chat_files(chat_dir: Path) -> Dict:
    """Analyze all chat files and return statistics"""
    
    chat_files = sorted([
        f for f in chat_dir.glob("chat*.txt") 
        if f.is_file()
    ])
    
    results = {
        "total_files": len(chat_files),
        "files": [],
        "total_chars": 0,
        "total_lines": 0,
        "total_words": 0
    }
    
    for chat_file in chat_files:
        try:
            content = chat_file.read_text(encoding='utf-8')
            
            file_stats = {
                "name": chat_file.name,
                "path": str(chat_file),
                "chars": len(content),
                "lines": content.count('\n') + 1,
                "words": len(content.split()),
                "size_kb": chat_file.stat().st_size / 1024
            }
            
            results["files"].append(file_stats)
            results["total_chars"] += file_stats["chars"]
            results["total_lines"] += file_stats["lines"]
            results["total_words"] += file_stats["words"]
            
        except Exception as e:
            print(f"❌ Error reading {chat_file.name}: {e}")
    
    return results

def print_analysis(results: Dict):
    """Print formatted analysis"""
    
    print("\n" + "="*80)
    print("📊 CHAT FILES ANALYSIS - Verification for Complete Reading")
    print("="*80)
    
    print(f"\n📁 Total Files: {results['total_files']}")
    print(f"📝 Total Characters: {results['total_chars']:,}")
    print(f"📄 Total Lines: {results['total_lines']:,}")
    print(f"💬 Total Words: {results['total_words']:,}")
    
    # Estimate tokens (rough: ~4 chars per token)
    estimated_tokens = results['total_chars'] // 4
    print(f"🎯 Estimated Tokens: ~{estimated_tokens:,}")
    
    print("\n" + "-"*80)
    print("📋 Individual File Statistics:")
    print("-"*80)
    
    for i, file_info in enumerate(results['files'], 1):
        print(f"\n{i}. {file_info['name']}")
        print(f"   Characters: {file_info['chars']:,}")
        print(f"   Lines: {file_info['lines']:,}")
        print(f"   Words: {file_info['words']:,}")
        print(f"   Size: {file_info['size_kb']:.2f} KB")
        
        # Show percentage of total
        pct = (file_info['chars'] / results['total_chars']) * 100
        print(f"   % of Total: {pct:.1f}%")
    
    print("\n" + "="*80)
    print("⚠️  CONTEXT WINDOW CHECK")
    print("="*80)
    
    # Check against typical context windows
    windows = {
        "GPT-4 Turbo": 128000,
        "Claude 3": 200000,
        "Cascade (current)": 200000
    }
    
    for model, window in windows.items():
        fits = estimated_tokens <= window
        status = "✅ FITS" if fits else "❌ TOO LARGE"
        pct_used = (estimated_tokens / window) * 100
        print(f"{model:20s}: {window:,} tokens | {status} ({pct_used:.1f}% used)")
    
    print("\n" + "="*80)
    
    # Reading verification
    print("\n🔍 READING VERIFICATION NEEDED:")
    print("   Each file must be read with read_file tool to ensure 100% coverage")
    print("   Files with truncation warning need offset+limit reading")
    print("\n")

def main():
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    chat_dir = project_root / "chat"
    
    if not chat_dir.exists():
        print(f"❌ Chat directory not found: {chat_dir}")
        return
    
    # Analyze
    results = analyze_chat_files(chat_dir)
    
    # Print results
    print_analysis(results)
    
    # Return for external use
    return results

if __name__ == "__main__":
    results = main()
