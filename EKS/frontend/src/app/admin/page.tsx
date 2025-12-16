'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Network } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Button } from '@/components/ui/button';
import { OrgChartManager } from '@/components/admin/OrgChartManager';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  organizationType: 'cocreate' | 'cvc' | 'startup';
  company: string;
  createdAt?: string;
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Tab system
  const [activeTab, setActiveTab] = useState<'users' | 'orgchart'>('users');

  // Lista e loading
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [filterOrg, setFilterOrg] = useState<'all' | 'cocreate' | 'cvc' | 'startup'>('all');

  // Formulário de criação
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [organizationType, setOrganizationType] = useState<'cocreate' | 'cvc' | 'startup'>('startup');
  const [company, setCompany] = useState('');
  const [creating, setCreating] = useState(false);

  // Painel de edição
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editOrg, setEditOrg] = useState<'cocreate' | 'cvc' | 'startup'>('startup');
  const [editCompany, setEditCompany] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Reset de senha
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Combo de empresas (em ordem alfabética)
  const companyOptions = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.company) {
        set.add(u.company);
      }
    });

    const arr = Array.from(set);
    arr.sort((a, b) => a.localeCompare(b));
    return arr;
  }, [users]);

  const [companySelectValue, setCompanySelectValue] = useState<string>('');
  const [editCompanySelectValue, setEditCompanySelectValue] = useState<string>('');

  // Sempre que as opções mudarem, define valor padrão no create (primeira opção)
  useEffect(() => {
    if (!companySelectValue && companyOptions.length > 0) {
      const first = companyOptions[0];
      setCompanySelectValue(first);
      setCompany(first);
    }
  }, [companyOptions, companySelectValue]);

  const handleCompanySelectChange = (value: string) => {
    if (value === '__new__') {
      setCompanySelectValue(value);
      setCompany('');
    } else {
      setCompanySelectValue(value);
      setCompany(value);
    }
  };

  const handleEditCompanySelectChange = (value: string) => {
    if (value === '__new__') {
      setEditCompanySelectValue(value);
      setEditCompany('');
    } else {
      setEditCompanySelectValue(value);
      setEditCompany(value);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    const response = await api.listUsers();

    if (response.success && response.data) {
      setUsers(response.data as AdminUser[]);
    } else {
      setError(response.error || 'Falha ao carregar usuários');
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccessMessage(null);

    const response = await api.createUser({
      name,
      email,
      password,
      role,
      organizationType,
      company,
    });

    if (!response.success) {
      // Mostra detalhes de validação se disponíveis
      let errorMsg = response.error || 'Falha ao criar usuário';
      if (response.details && Array.isArray(response.details)) {
        const details = response.details.map((d: any) => d.message).join(', ');
        errorMsg = `${errorMsg}: ${details}`;
      }
      setError(errorMsg);
      setCreating(false);
      return;
    }

    setName('');
    setEmail('');
    setPassword('');
    await loadUsers();
    setCreating(false);
    setSuccessMessage('Usuário criado com sucesso.');
  };

  const handleSelectUser = (u: AdminUser) => {
    setSelectedUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditOrg(u.organizationType);
    setEditCompany(u.company);
    // Define select de empresa para edição (se não existir na lista, cai em "Outra...")
    if (companyOptions.includes(u.company)) {
      setEditCompanySelectValue(u.company);
    } else {
      setEditCompanySelectValue('__new__');
    }
    setResetPasswordValue('');
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setSelectedUser(null);
    setResetPasswordValue('');
    setSavingEdit(false);
    setResettingPassword(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const updates: Record<string, unknown> = {};
    if (editName !== selectedUser.name) updates.name = editName;
    if (editEmail !== selectedUser.email) updates.email = editEmail;
    if (editRole !== selectedUser.role) updates.role = editRole;
    if (editOrg !== selectedUser.organizationType) updates.organizationType = editOrg;
    if (editCompany !== selectedUser.company) updates.company = editCompany;

    if (Object.keys(updates).length === 0) {
      setSuccessMessage('Nenhuma alteração para salvar.');
      return;
    }

    setSavingEdit(true);
    setError(null);
    setSuccessMessage(null);

    const response = await api.updateUser(selectedUser.id, updates);

    if (!response.success) {
      setError(response.error || 'Falha ao atualizar usuário');
      setSavingEdit(false);
      return;
    }

    await loadUsers();
    setSavingEdit(false);
    setSuccessMessage('Usuário atualizado com sucesso.');
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!selectedUser) return;
    if (!resetPasswordValue.trim()) {
      setError('Informe a nova senha para reset.');
      return;
    }

    setResettingPassword(true);
    setError(null);
    setSuccessMessage(null);

    const response = await api.resetPassword(selectedUser.id, resetPasswordValue.trim());

    if (!response.success) {
      setError(response.error || 'Falha ao resetar senha');
      setResettingPassword(false);
      return;
    }

    setResettingPassword(false);
    setResetPasswordValue('');
    setSuccessMessage('Senha resetada com sucesso.');
  };

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();

    return users.filter((u) => {
      const matchesSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.company.toLowerCase().includes(term);

      const matchesRole = filterRole === 'all' || u.role === filterRole;
      const matchesOrg = filterOrg === 'all' || u.organizationType === filterOrg;

      return matchesSearch && matchesRole && matchesOrg;
    });
  }, [users, search, filterRole, filterOrg]);

  return (
    <ProtectedRoute requireAdmin>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Sidebar padrão à esquerda */}
        <div className="hidden md:flex h-full border-r border-border bg-card w-64">
          <Sidebar />
        </div>

        {/* Conteúdo central: painel de administração */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para o Hub</span>
              </button>
              <div>
                <h1 className="text-lg font-semibold">Admin – Gestão de Usuários</h1>
                <p className="text-xs text-muted-foreground">
                  Apenas admins da CoCreate podem acessar esta área. Usuário atual: {user?.email}
                </p>
              </div>
            </div>
          </header>

          {/* Tabs */}
          <div className="border-b border-border bg-card/50 px-6">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-4 h-4" />
                Usuários
              </button>
              <button
                onClick={() => setActiveTab('orgchart')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'orgchart'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Network className="w-4 h-4" />
                Organograma
              </button>
            </div>
          </div>

          {/* Conteúdo das tabs */}
          <main className="flex-1 p-6 overflow-auto bg-muted/30">
            {activeTab === 'users' && (
              <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.3fr] gap-6">
                {/* Lista de usuários + filtros */}
                <section className="bg-card rounded-xl border border-border shadow-sm p-4 flex flex-col">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Usuários Cadastrados</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadUsers()}
                    disabled={loading}
                  >
                    Atualizar
                  </Button>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr] gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou empresa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as 'all' | 'admin' | 'user')}
                    className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="all">Role: Todos</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                  <select
                    value={filterOrg}
                    onChange={(e) =>
                      setFilterOrg(e.target.value as 'all' | 'cocreate' | 'cvc' | 'startup')
                    }
                    className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="all">Org: Todas</option>
                    <option value="cocreate">CoCreate</option>
                    <option value="cvc">CVC</option>
                    <option value="startup">Startup</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando usuários...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground border-b border-border">
                      <tr>
                        <th className="text-left py-2 pr-2">Nome</th>
                        <th className="text-left py-2 pr-2">Email</th>
                        <th className="text-left py-2 pr-2">Role</th>
                        <th className="text-left py-2 pr-2">Org</th>
                        <th className="text-left py-2 pr-2">Empresa</th>
                        <th className="text-left py-2 pl-2 w-24">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-border/60 last:border-0 hover:bg-muted/60 cursor-pointer"
                          onClick={() => handleSelectUser(u)}
                        >
                          <td className="py-2 pr-2 font-medium">{u.name}</td>
                          <td className="py-2 pr-2 text-xs text-muted-foreground">{u.email}</td>
                          <td className="py-2 pr-2 text-xs">{u.role}</td>
                          <td className="py-2 pr-2 text-xs">{u.organizationType}</td>
                          <td className="py-2 pr-2 text-xs">{u.company}</td>
                          <td className="py-2 pl-2 text-xs">
                            <Button
                              type="button"
                              variant={selectedUser?.id === u.id ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectUser(u);
                              }}
                            >
                              {selectedUser?.id === u.id ? 'Editando' : 'Editar'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {error && (
                <p className="mt-3 text-xs text-red-600">{error}</p>
              )}
              {successMessage && (
                <p className="mt-2 text-xs text-emerald-600">{successMessage}</p>
              )}
            </section>

            {/* Coluna direita: editar + criar usuário */}
            <section className="space-y-4">
              {/* Editar usuário selecionado */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                <h2 className="text-sm font-semibold mb-3">Editar usuário selecionado</h2>

                {!selectedUser ? (
                  <p className="text-xs text-muted-foreground">
                    Selecione um usuário na tabela para editar dados ou resetar a senha.
                  </p>
                ) : (
                  <form onSubmit={handleSaveEdit} className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Nome</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de organização</label>
                        <select
                          value={editOrg}
                          onChange={(e) =>
                            setEditOrg(e.target.value as 'cocreate' | 'cvc' | 'startup')
                          }
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="cocreate">CoCreate</option>
                          <option value="cvc">CVC</option>
                          <option value="startup">Startup</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Empresa</label>
                      <select
                        value={editCompanySelectValue || editCompany || ''}
                        onChange={(e) => handleEditCompanySelectChange(e.target.value)}
                        className="w-full px-3 py-2 mb-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Selecione uma empresa</option>
                        {companyOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="__new__">Outra...</option>
                      </select>
                      {editCompanySelectValue === '__new__' && (
                        <input
                          type="text"
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="Nome da nova empresa"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <Button type="submit" className="flex-1" disabled={savingEdit}>
                        {savingEdit ? 'Salvando...' : 'Salvar alterações'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="flex-1"
                        onClick={handleCancelEdit}
                      >
                        Cancelar
                      </Button>
                    </div>

                    {/* Reset de senha */}
                    <div className="mt-4 pt-3 border-t border-border/60">
                      <h3 className="text-xs font-semibold mb-2">Resetar senha</h3>
                      <p className="text-[11px] text-muted-foreground mb-2">
                        Define uma nova senha para o usuário selecionado. Recomende que ele troque a senha no primeiro
                        acesso.
                      </p>
                      <div className="flex flex-col gap-2">
                        <input
                          type="password"
                          placeholder="Nova senha"
                          value={resetPasswordValue}
                          onChange={(e) => setResetPasswordValue(e.target.value)}
                          className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={resettingPassword}
                          onClick={() => void handleResetPassword()}
                        >
                          {resettingPassword ? 'Resetando...' : 'Resetar senha'}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Formulário de criação */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                <h2 className="text-sm font-semibold mb-4">Criar novo usuário</h2>

                <form onSubmit={handleCreateUser} className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nome</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Senha inicial</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      O usuário deverá trocar a senha no primeiro acesso (política a definir na próxima etapa).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de organização</label>
                      <select
                        value={organizationType}
                        onChange={(e) =>
                          setOrganizationType(e.target.value as 'cocreate' | 'cvc' | 'startup')
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="cocreate">CoCreate</option>
                        <option value="cvc">CVC</option>
                        <option value="startup">Startup</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Empresa</label>
                    <select
                      value={companySelectValue}
                      onChange={(e) => handleCompanySelectChange(e.target.value)}
                      className="w-full px-3 py-2 mb-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Selecione uma empresa</option>
                      {companyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__new__">Outra...</option>
                    </select>
                    {companySelectValue === '__new__' && (
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Nome da nova empresa"
                      />
                    )}
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={creating}>
                    {creating ? 'Criando usuário...' : 'Criar usuário'}
                  </Button>
                </form>
              </div>
            </section>
              </div>
            )}

            {activeTab === 'orgchart' && (
              <OrgChartManager onRefresh={() => void loadUsers()} />
            )}
          </main>
        </div>

        {/* Mantém ChatPanel para futuro, mas oculto aqui por enquanto */}
        <div className="hidden md:flex h-full border-l border-border bg-card w-0">
          <ChatPanel />
        </div>
      </div>
    </ProtectedRoute>
  );
}
