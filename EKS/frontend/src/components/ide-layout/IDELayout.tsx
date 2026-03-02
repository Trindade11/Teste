'use client';

import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { DocumentEditor } from './DocumentEditor';
import { ContextPanel } from './ContextPanel';

export function IDELayout() {
  const [activeContextTab, setActiveContextTab] = useState<'search' | 'active'>('search');
  const [isDocumentActive, setIsDocumentActive] = useState(false);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Agent Workspace</h1>
          <span className="text-xs text-muted-foreground">Chat cria documentos · Edite e aceite</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        {isDocumentActive ? (
          <PanelGroup direction="vertical">
            {/* Document Editor (Top) */}
            <Panel defaultSize={60} minSize={30}>
              <DocumentEditor onDocumentStateChange={setIsDocumentActive} />
            </Panel>

            <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors" />

            {/* Context Panels (Bottom) - SÓ APARECE COM DOCUMENTO */}
            <Panel defaultSize={40} minSize={20}>
              <ContextPanel
                activeTab={activeContextTab}
                onTabChange={setActiveContextTab}
              />
            </Panel>
          </PanelGroup>
        ) : (
          <DocumentEditor onDocumentStateChange={setIsDocumentActive} />
        )}
      </div>
    </div>
  );
}
