"use client";

import { useState } from "react";
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  FileText,
  CheckSquare,
  Users,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/onboarding-store";
import { OnboardingWizard } from "@/components/canvas/OnboardingWizard";
import { OrgChartValidationCard } from "@/components/org-chart/OrgChartValidationCard";

interface CanvasNode {
  id: string;
  type: "knowledge" | "task" | "person" | "insight";
  title: string;
  content?: string;
  x: number;
  y: number;
  color?: string;
}

export function Canvas() {
  const { isOpen } = useOnboardingStore();
  const [zoom, setZoom] = useState(100);
  const [nodes, setNodes] = useState<CanvasNode[]>([
    {
      id: "1",
      type: "knowledge",
      title: "Conhecimento Base",
      content: "Informações sobre o mercado de startups",
      x: 100,
      y: 100,
    },
    {
      id: "2",
      type: "task",
      title: "Preparar Pitch Deck",
      content: "Criar apresentação para investidores",
      x: 400,
      y: 100,
    },
    {
      id: "3",
      type: "person",
      title: "João Silva",
      content: "Mentor - Especialista em SaaS",
      x: 250,
      y: 300,
    },
    {
      id: "4",
      type: "insight",
      title: "Oportunidade Identificada",
      content: "Mercado de IA generativa em expansão",
      x: 500,
      y: 300,
    },
  ]);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (isOpen) {
    return <OnboardingWizard />;
  }

  const getNodeIcon = (type: CanvasNode["type"]) => {
    switch (type) {
      case "knowledge":
        return <FileText className="w-4 h-4" />;
      case "task":
        return <CheckSquare className="w-4 h-4" />;
      case "person":
        return <Users className="w-4 h-4" />;
      case "insight":
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getNodeColor = (type: CanvasNode["type"]) => {
    switch (type) {
      case "knowledge":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950";
      case "task":
        return "border-green-500 bg-green-50 dark:bg-green-950";
      case "person":
        return "border-purple-500 bg-purple-50 dark:bg-purple-950";
      case "insight":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950";
    }
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    nodeId: string,
    nodeX: number,
    nodeY: number
  ) => {
    setSelectedNode(nodeId);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - nodeX,
      y: e.clientY - nodeY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedNode) return;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNode
          ? {
              ...node,
              x: e.clientX - dragOffset.x,
              y: e.clientY - dragOffset.y,
            }
          : node
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const addNode = (type: CanvasNode["type"]) => {
    const newNode: CanvasNode = {
      id: crypto.randomUUID(),
      type,
      title: `Novo ${type === "knowledge" ? "Conhecimento" : type === "task" ? "Tarefa" : type === "person" ? "Pessoa" : "Insight"}`,
      content: "Clique para editar",
      x: 200 + Math.random() * 200,
      y: 200 + Math.random() * 200,
    };
    setNodes((prev) => [...prev, newNode]);
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-muted/30"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Org Chart Validation Card */}
      <div className="absolute top-4 left-4 right-4 z-20 max-w-2xl">
        <OrgChartValidationCard />
      </div>

      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-card border border-border rounded-lg p-2 shadow-lg">
        <Button variant="ghost" size="icon" onClick={() => addNode("knowledge")}>
          <FileText className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => addNode("task")}>
          <CheckSquare className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => addNode("person")}>
          <Users className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => addNode("insight")}>
          <Lightbulb className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom((z) => Math.max(50, z - 10))}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs w-12 text-center">{zoom}%</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoom((z) => Math.min(200, z + 10))}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button variant="ghost" size="icon">
          <Grid3X3 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Canvas Nodes */}
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top left",
        }}
      >
        {nodes.map((node) => (
          <div
            key={node.id}
            className={cn(
              "absolute cursor-move select-none rounded-lg border-2 p-3 shadow-md transition-shadow min-w-[180px] max-w-[250px]",
              getNodeColor(node.type),
              selectedNode === node.id && "ring-2 ring-primary shadow-lg"
            )}
            style={{
              left: node.x,
              top: node.y,
            }}
            onMouseDown={(e) => handleMouseDown(e, node.id, node.x, node.y)}
          >
            <div className="flex items-center gap-2 mb-2">
              {getNodeIcon(node.type)}
              <span className="font-medium text-sm truncate">{node.title}</span>
            </div>
            {node.content && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {node.content}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Canvas Vazio</p>
            <p className="text-sm mt-1">
              Use a barra de ferramentas para adicionar elementos
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          size="lg"
          className="rounded-full shadow-lg"
          onClick={() => addNode("knowledge")}
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
