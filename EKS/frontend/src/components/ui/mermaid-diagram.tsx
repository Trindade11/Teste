'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useThemeStore } from '@/store/themeStore';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const { config: theme } = useThemeStore();
  const elementRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Mermaid configuration with theme colors
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'monospace',
      fontSize: 12,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
      themeVariables: {
        primaryColor: theme.colors.primary,
        primaryTextColor: '#ffffff',
        primaryBorderColor: theme.colors.primary,
        lineColor: theme.colors.primary,
        sectionBkgColor: theme.colors.secondary,
        altSectionBkgColor: theme.colors.background,
        gridColor: theme.colors.accent,
        secondaryColor: theme.colors.accent,
        tertiaryColor: theme.colors.background,
      },
    });

    return () => {
      // Clean up
      mermaid.initialize({ startOnLoad: true });
    };
  }, [theme.colors]);

  useEffect(() => {
    if (!elementRef.current || !chart) return;

    const renderDiagram = async () => {
      try {
        setError(null);
        
        // Generate unique ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Validate and clean chart
        const cleanChart = chart.trim();
        if (!cleanChart) {
          throw new Error('Empty chart');
        }

        const { svg } = await mermaid.render(id, cleanChart);
        if (elementRef.current) {
          elementRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        // Fallback to text
        if (elementRef.current) {
          elementRef.current.innerHTML = `<pre class="text-xs text-muted-foreground p-2 bg-muted/30 rounded whitespace-pre-wrap">${chart}</pre>`;
        }
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-sm text-red-600">Diagram rendering failed</div>
        <div className="text-xs text-red-500 mt-1">{error}</div>
        <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      ref={elementRef} 
      className={`mermaid-container flex items-center justify-center ${className}`}
      style={{ minHeight: '200px' }}
    />
  );
}
