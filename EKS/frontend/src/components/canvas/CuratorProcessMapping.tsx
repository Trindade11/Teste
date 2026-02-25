"use client";

import { useState, useEffect } from "react";
import { 
  GitBranch, 
  Plus,
  Save,
  Eye,
  Trash2,
  Building2,
  ArrowRight,
  ArrowLeft,
  Layers,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/ui/mermaid-diagram";
import { cn } from "@/lib/utils";

interface Department {
  id: string;
  name: string;
  memberCount: number;
}

interface MacroProcess {
  id: string;
  name: string;
  description: string;
  participatingDepartments: string[]; // Department IDs
  inputDepartments: string[]; // Where process starts (can be multiple)
  outputDepartments: string[]; // Where process ends (can be multiple)
  isCritical: boolean;
  status: 'draft' | 'published';
  createdAt: Date;
}

export function CuratorProcessMapping() {
  const [view, setView] = useState<'list' | 'form' | 'visualization'>('list');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [processes, setProcesses] = useState<MacroProcess[]>([]);
  const [editingProcess, setEditingProcess] = useState<MacroProcess | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    participatingDepartments: [] as string[],
    inputDepartments: [] as string[],
    outputDepartments: [] as string[],
    isCritical: false
  });

  useEffect(() => {
    loadDepartments();
    loadProcesses();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/pia/organizational-structure`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDepartments(data.data.departments.map((d: any, idx: number) => ({
            id: `dept-${idx}`,
            name: d.name,
            memberCount: d.memberCount
          })));
        }
      } else {
        // Fallback to mock data
        setDepartments([
          { id: 'dept-1', name: 'Vendas', memberCount: 5 },
          { id: 'dept-2', name: 'Marketing', memberCount: 3 },
          { id: 'dept-3', name: 'Financeiro', memberCount: 2 },
          { id: 'dept-4', name: 'Operações', memberCount: 4 },
          { id: 'dept-5', name: 'TI', memberCount: 2 },
          { id: 'dept-6', name: 'Compliance', memberCount: 2 }
        ]);
      }
    } catch (err) {
      console.error('Error loading departments:', err);
      setError('Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  };

  const loadProcesses = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/curator/macro-processes`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProcesses(data.data.processes || []);
        }
      } else {
        // Fallback to mock data
        setProcesses([
          {
            id: 'proc-1',
            name: 'Ciclo de Vendas',
            description: 'Processo completo desde geração de lead até fechamento',
            participatingDepartments: ['dept-1', 'dept-2', 'dept-3'],
            inputDepartments: ['dept-2'],
            outputDepartments: ['dept-3'],
            isCritical: true,
            status: 'published',
            createdAt: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error('Error loading processes:', err);
    }
  };

  const startNewProcess = () => {
    setFormData({
      name: '',
      description: '',
      participatingDepartments: [],
      inputDepartments: [],
      outputDepartments: [],
      isCritical: false
    });
    setEditingProcess(null);
    setView('form');
  };

  const editProcess = (process: MacroProcess) => {
    setFormData({
      name: process.name,
      description: process.description,
      participatingDepartments: process.participatingDepartments,
      inputDepartments: process.inputDepartments,
      outputDepartments: process.outputDepartments,
      isCritical: process.isCritical
    });
    setEditingProcess(process);
    setView('form');
  };

  const toggleDepartment = (deptId: string, field: 'participatingDepartments' | 'inputDepartments' | 'outputDepartments') => {
    setFormData(prev => {
      const current = prev[field];
      const updated = current.includes(deptId)
        ? current.filter(id => id !== deptId)
        : [...current, deptId];
      return { ...prev, [field]: updated };
    });
  };

  const saveProcess = async () => {
    if (!formData.name.trim()) {
      setError('Nome do processo é obrigatório');
      return;
    }

    if (formData.participatingDepartments.length === 0) {
      setError('Selecione pelo menos uma área participante');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      
      const payload = {
        ...formData,
        id: editingProcess?.id,
        status: 'draft'
      };

      const response = await fetch(`${apiUrl}/api/curator/macro-processes`, {
        method: editingProcess ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadProcesses();
          setView('list');
        }
      } else {
        // Fallback: add to local state for demo
        const newProcess: MacroProcess = {
          id: editingProcess?.id || `proc-${Date.now()}`,
          name: formData.name,
          description: formData.description,
          participatingDepartments: formData.participatingDepartments,
          inputDepartments: formData.inputDepartments,
          outputDepartments: formData.outputDepartments,
          isCritical: formData.isCritical,
          status: 'draft',
          createdAt: new Date()
        };

        if (editingProcess) {
          setProcesses(prev => prev.map(p => p.id === editingProcess.id ? newProcess : p));
        } else {
          setProcesses(prev => [...prev, newProcess]);
        }
        setView('list');
      }
    } catch (err) {
      console.error('Error saving process:', err);
      setError('Erro ao salvar processo');
    } finally {
      setLoading(false);
    }
  };

  const deleteProcess = async (processId: string) => {
    if (!confirm('Tem certeza que deseja excluir este processo?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      
      const response = await fetch(`${apiUrl}/api/curator/macro-processes/${processId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        await loadProcesses();
      } else {
        // Fallback: remove from local state
        setProcesses(prev => prev.filter(p => p.id !== processId));
      }
    } catch (err) {
      console.error('Error deleting process:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMermaid = (): string => {
    if (processes.length === 0) return '';

    let mermaid = 'flowchart LR\n';
    
    // Create department nodes
    const allDepts = new Set<string>();
    processes.forEach(proc => {
      proc.participatingDepartments.forEach(d => allDepts.add(d));
    });

    allDepts.forEach(deptId => {
      const dept = departments.find(d => d.id === deptId);
      if (dept) {
        mermaid += `  ${deptId}[${dept.name}]\n`;
      }
    });

    // Create process flows
    processes.forEach((proc, idx) => {
      const procNode = `proc${idx}`;
      mermaid += `  ${procNode}{{${proc.name}}}\n`;
      
      // Input connections
      proc.inputDepartments.forEach(deptId => {
        mermaid += `  ${deptId} -->|Input| ${procNode}\n`;
      });

      // Output connections
      proc.outputDepartments.forEach(deptId => {
        mermaid += `  ${procNode} -->|Output| ${deptId}\n`;
      });

      // Style critical processes
      if (proc.isCritical) {
        mermaid += `  style ${procNode} fill:#ff9800,stroke:#e65100,color:#000\n`;
      }
    });

    return mermaid;
  };

  const getDepartmentName = (deptId: string): string => {
    return departments.find(d => d.id === deptId)?.name || deptId;
  };

  return (
    <div className="h-full w-full flex flex-col bg-muted/30">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GitBranch className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Mapeamento Macro de Processos</h2>
              <p className="text-xs text-muted-foreground">
                Curador Ontológico - Definição de processos organizacionais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'list' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setView('visualization')}
                  disabled={processes.length === 0}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar Mapa
                </Button>
                <Button size="sm" onClick={startNewProcess}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Processo
                </Button>
              </>
            )}
            {view === 'form' && (
              <Button variant="outline" size="sm" onClick={() => setView('list')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
            {view === 'visualization' && (
              <Button variant="outline" size="sm" onClick={() => setView('list')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar à Lista
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {view === 'list' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <GitBranch className="w-4 h-4" />
                  <span className="text-xs font-medium">Processos Mapeados</span>
                </div>
                <div className="text-2xl font-bold">{processes.length}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-orange-500 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Processos Críticos</span>
                </div>
                <div className="text-2xl font-bold">
                  {processes.filter(p => p.isCritical).length}
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-green-500 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Publicados</span>
                </div>
                <div className="text-2xl font-bold">
                  {processes.filter(p => p.status === 'published').length}
                </div>
              </div>
            </div>

            {/* Process List */}
            <div className="space-y-3">
              {processes.map((proc) => (
                <div
                  key={proc.id}
                  className="rounded-xl border-2 border-border bg-card hover:border-primary/50 transition-all p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-lg flex-shrink-0",
                      proc.isCritical ? "bg-orange-500/10" : "bg-primary/10"
                    )}>
                      <GitBranch className={cn(
                        "w-5 h-5",
                        proc.isCritical ? "text-orange-500" : "text-primary"
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{proc.name}</h3>
                        {proc.isCritical && (
                          <Badge className="bg-orange-500/10 text-orange-600 text-xs">
                            Crítico
                          </Badge>
                        )}
                        <Badge variant={proc.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                          {proc.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {proc.description}
                      </p>

                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-muted-foreground mb-1">Áreas Participantes:</div>
                          <div className="flex flex-wrap gap-1">
                            {proc.participatingDepartments.map(deptId => (
                              <Badge key={deptId} variant="outline" className="text-[10px]">
                                {getDepartmentName(deptId)}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-muted-foreground mb-1">Input:</div>
                          <div className="flex flex-wrap gap-1">
                            {proc.inputDepartments.map(deptId => (
                              <Badge key={deptId} variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600">
                                <ArrowRight className="w-3 h-3 mr-1" />
                                {getDepartmentName(deptId)}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-muted-foreground mb-1">Output:</div>
                          <div className="flex flex-wrap gap-1">
                            {proc.outputDepartments.map(deptId => (
                              <Badge key={deptId} variant="outline" className="text-[10px] bg-green-500/10 text-green-600">
                                <ArrowLeft className="w-3 h-3 mr-1" />
                                {getDepartmentName(deptId)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={() => editProcess(proc)}>
                          <Edit2 className="w-3 h-3 mr-2" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteProcess(proc.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {processes.length === 0 && (
                <div className="text-center py-12 rounded-lg border-2 border-dashed border-border bg-muted/30">
                  <GitBranch className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum processo macro mapeado ainda
                  </p>
                  <Button onClick={startNewProcess}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Processo
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'form' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="rounded-xl border-2 border-border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingProcess ? 'Editar Processo' : 'Novo Processo Macro'}
              </h3>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Nome do Processo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Ciclo de Vendas, Onboarding de Cliente, etc."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o processo macro..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                {/* Crítico */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="critical"
                    checked={formData.isCritical}
                    onChange={(e) => setFormData(prev => ({ ...prev, isCritical: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="critical" className="text-sm font-medium cursor-pointer">
                    Marcar como processo crítico
                  </label>
                </div>

                {/* Áreas Participantes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Áreas Participantes * (multi-área)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {departments.map(dept => (
                      <button
                        key={dept.id}
                        onClick={() => toggleDepartment(dept.id, 'participatingDepartments')}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left",
                          formData.participatingDepartments.includes(dept.id)
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card hover:border-primary/50"
                        )}
                      >
                        <Layers className={cn(
                          "w-4 h-4 flex-shrink-0",
                          formData.participatingDepartments.includes(dept.id) ? "text-primary" : "text-muted-foreground"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{dept.name}</div>
                          <div className="text-xs text-muted-foreground">{dept.memberCount} membros</div>
                        </div>
                        {formData.participatingDepartments.includes(dept.id) && (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Departments */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Áreas de Input (onde o processo inicia)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.participatingDepartments.map(deptId => {
                      const dept = departments.find(d => d.id === deptId);
                      if (!dept) return null;
                      return (
                        <button
                          key={deptId}
                          onClick={() => toggleDepartment(deptId, 'inputDepartments')}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border transition-all text-left",
                            formData.inputDepartments.includes(deptId)
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-border bg-card hover:border-blue-500/50"
                          )}
                        >
                          <ArrowRight className={cn(
                            "w-4 h-4",
                            formData.inputDepartments.includes(deptId) ? "text-blue-500" : "text-muted-foreground"
                          )} />
                          <span className="text-sm">{dept.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Output Departments */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Áreas de Output (onde o processo termina)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.participatingDepartments.map(deptId => {
                      const dept = departments.find(d => d.id === deptId);
                      if (!dept) return null;
                      return (
                        <button
                          key={deptId}
                          onClick={() => toggleDepartment(deptId, 'outputDepartments')}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border transition-all text-left",
                            formData.outputDepartments.includes(deptId)
                              ? "border-green-500 bg-green-500/10"
                              : "border-border bg-card hover:border-green-500/50"
                          )}
                        >
                          <ArrowLeft className={cn(
                            "w-4 h-4",
                            formData.outputDepartments.includes(deptId) ? "text-green-500" : "text-muted-foreground"
                          )} />
                          <span className="text-sm">{dept.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4">
                  <Button onClick={saveProcess} disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingProcess ? 'Atualizar Processo' : 'Salvar Processo'}
                  </Button>
                  <Button variant="outline" onClick={() => setView('list')}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'visualization' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="rounded-xl border-2 border-primary/20 bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Mapa de Processos Macro</h3>
              </div>
              
              {processes.length > 0 ? (
                <MermaidDiagram chart={generateMermaid()} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Nenhum processo para visualizar</p>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium mb-3">Legenda</div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/10 border-2 border-primary" />
                  <span>Processo Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500/10 border-2 border-orange-500" />
                  <span>Processo Crítico</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                  <span>Input</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
