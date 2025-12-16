'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { OrgNode } from '@/lib/orgChartData';

interface OrgChartManagerProps {
  onRefresh?: () => void;
}

export function OrgChartManager({ onRefresh }: OrgChartManagerProps) {
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  
  // Estados de edição
  const [editRole, setEditRole] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editLeadsAreas, setEditLeadsAreas] = useState('');
  const [editAccessAreas, setEditAccessAreas] = useState('');
  const [editManagerId, setEditManagerId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadNodes = async () => {
    setLoading(true);
    try {
      const mockApi = (await import('@/lib/mockApi')).mockApi;
      const result = await mockApi.getAllOrgChartNodes();
      
      if (result.success && result.data) {
        setNodes(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar organograma:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadNodes();
  }, []);

  const departments = Array.from(new Set(nodes.map(n => n.department))).sort();

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = 
      !search ||
      node.name.toLowerCase().includes(search.toLowerCase()) ||
      node.email.toLowerCase().includes(search.toLowerCase()) ||
      node.role.toLowerCase().includes(search.toLowerCase());
    
    const matchesDept = filterDepartment === 'all' || node.department === filterDepartment;
    
    return matchesSearch && matchesDept;
  });

  const handleSelectNode = (node: OrgNode) => {
    setSelectedNode(node);
    setEditRole(node.role);
    setEditDepartment(node.department);
    setEditLeadsAreas(node.leadsAreas.join('; '));
    setEditAccessAreas(node.accessAreas.join('; '));
    setEditManagerId(node.managerId || '');
  };

  const handleSave = async () => {
    if (!selectedNode) return;
    
    setSaving(true);
    
    // TODO: Implementar chamada real para API quando backend estiver pronto
    // Por enquanto, apenas simula salvamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('Salvando alterações:', {
      nodeId: selectedNode.id,
      role: editRole,
      department: editDepartment,
      leadsAreas: editLeadsAreas.split(';').map(s => s.trim()).filter(Boolean),
      accessAreas: editAccessAreas.split(';').map(s => s.trim()).filter(Boolean),
      managerId: editManagerId || undefined
    });
    
    setSaving(false);
    alert('✅ Alterações salvas! (mock - backend não implementado ainda)');
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return '—';
    const manager = nodes.find(n => n.id === managerId);
    return manager ? manager.name : managerId;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
      {/* Lista de funcionários */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex flex-col">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Estrutura Organizacional</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void loadNodes();
                onRefresh?.();
              }}
              disabled={loading}
            >
              Atualizar
            </Button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-2 text-xs">
            <input
              type="text"
              placeholder="Buscar por nome, email ou função..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">Todos os departamentos</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-muted-foreground">
            {filteredNodes.length} de {nodes.length} funcionários
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando organograma...</p>
        ) : filteredNodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum funcionário encontrado.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2 pr-2">Nome</th>
                  <th className="text-left py-2 pr-2">Função</th>
                  <th className="text-left py-2 pr-2">Departamento</th>
                  <th className="text-left py-2 pr-2">Gestor</th>
                  <th className="text-left py-2 pr-2">Lidera</th>
                  <th className="text-left py-2 pl-2 w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredNodes.map((node) => (
                  <tr
                    key={node.id}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/60 cursor-pointer"
                    onClick={() => handleSelectNode(node)}
                  >
                    <td className="py-2 pr-2 font-medium">{node.name}</td>
                    <td className="py-2 pr-2 text-xs">{node.role}</td>
                    <td className="py-2 pr-2 text-xs">{node.department}</td>
                    <td className="py-2 pr-2 text-xs text-muted-foreground">
                      {getManagerName(node.managerId)}
                    </td>
                    <td className="py-2 pr-2 text-xs">
                      {node.leadsAreas.length > 0 ? `${node.leadsAreas.length} área(s)` : '—'}
                    </td>
                    <td className="py-2 pl-2 text-xs">
                      <Button
                        type="button"
                        variant={selectedNode?.id === node.id ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectNode(node);
                        }}
                      >
                        {selectedNode?.id === node.id ? 'Editando' : 'Editar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Painel de edição */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <h2 className="text-sm font-semibold mb-3">Editar funcionário</h2>

        {!selectedNode ? (
          <p className="text-xs text-muted-foreground">
            Selecione um funcionário na tabela para editar sua função, departamento e relações hierárquicas.
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            {/* Info do funcionário */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <div className="font-medium">{selectedNode.name}</div>
              <div className="text-xs text-muted-foreground">{selectedNode.email}</div>
              <div className="text-xs">
                <span className="text-muted-foreground">Status:</span>{' '}
                <span className={selectedNode.status === 'Ativo' ? 'text-emerald-600' : 'text-red-600'}>
                  {selectedNode.status}
                </span>
              </div>
            </div>

            {/* Formulário de edição */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Função
                </label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="Ex: Analista de Processos"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="Ex: Sistemas"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Gestor (ID)
                </label>
                <select
                  value={editManagerId}
                  onChange={(e) => setEditManagerId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                >
                  <option value="">Nenhum (Topo da hierarquia)</option>
                  {nodes
                    .filter(n => n.id !== selectedNode.id)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(node => (
                      <option key={node.id} value={node.id}>
                        {node.name} ({node.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Áreas que lidera (separar por ;)
                </label>
                <textarea
                  value={editLeadsAreas}
                  onChange={(e) => setEditLeadsAreas(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm min-h-[60px]"
                  placeholder="Ex: Sistemas; TI; Compliance"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Áreas com acesso (separar por ;)
                </label>
                <textarea
                  value={editAccessAreas}
                  onChange={(e) => setEditAccessAreas(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm min-h-[60px]"
                  placeholder="Ex: Atendimento; Estruturado; Legal"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Áreas que o funcionário pode visualizar documentos
                </p>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedNode(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>

            {/* Info sobre integração futura */}
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
              <div className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                🔄 Integração com MongoDB
              </div>
              <p className="text-xs text-muted-foreground">
                Esta interface está preparada para integração com grafo MongoDB. Atualmente em modo mock.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
