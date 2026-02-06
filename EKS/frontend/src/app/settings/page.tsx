"use client"

import { useState, useRef } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useThemeStore } from "@/store/themeStore"
import { useAuthStore } from "@/store/authStore"
import { ArrowLeft, Save, Upload, RotateCcw, Palette, Image as ImageIcon, Database, User, Bot, Building2, FileText, Target, FolderKanban, Network, Shield } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { DataIngestion } from "@/components/admin/DataIngestion"
import { MeetingTranscriptIngestion } from "@/components/admin/MeetingTranscriptIngestion"
import { ProfileDataEditor } from "@/components/settings/ProfileDataEditor"
import { MyAgents } from "@/components/settings/MyAgents"
import { CompanyDescription } from "@/components/settings/CompanyDescription"
import { StrategicObjectives } from "@/components/settings/StrategicObjectives"
import { ProjectIngestion } from "@/components/settings/ProjectIngestion"
import { OntologyViewer } from "@/components/settings/OntologyViewer"
import { MenuPermissionsManager } from "@/components/settings/MenuPermissionsManager"
import { ExternalParticipantsManager } from "@/components/settings/ExternalParticipantsManager"
import { useSettingsPermissionsStore } from "@/store/settingsPermissionsStore"

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { config, setColors, setLogo, setIconColor, setInstitutionName, setInstitutionShortName, resetTheme } = useThemeStore()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [activeSection, setActiveSection] = useState<'theme' | 'ingest' | 'meetings' | 'profile' | 'agents' | 'company' | 'strategy' | 'projects' | 'ontology' | 'permissions' | 'external-participants'>('theme')
  const { getVisibleMenus } = useSettingsPermissionsStore()
  const userRole = user?.role || 'user'
  const visibleMenus = getVisibleMenus(userRole)

  // Force visible colors by checking if saved colors are too light
  const getValidColor = (color: string | undefined, fallback: string) => {
    if (!color) return fallback;
    
    // Check if it's a very light color (like the old HSL values)
    if (color.includes('hsl')) {
      const match = color.match(/\d+\.?\d*%/g);
      if (match && match.length >= 2) {
        const lightness = parseFloat(match[1]);
        if (lightness > 85) return fallback; // Too light, use fallback
      }
    }
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      if (brightness > 230) return fallback; // Too light, use fallback
    }
    return color;
  };

  const [tempColors, setTempColors] = useState({
    primary: getValidColor(config.colors.primary, '#3b82f6'),
    secondary: getValidColor(config.colors.secondary, '#6366f1'),
    accent: getValidColor(config.colors.accent, '#8b5cf6'),
    background: config.colors.background || '#ffffff',
  })
  const [tempIconColor, setTempIconColor] = useState(config.iconColor || '#3b82f6')
  const [tempLogo, setTempLogo] = useState<string | null>(config.logo)
  const [tempInstitutionName, setTempInstitutionName] = useState(config.institutionName || '')
  const [tempInstitutionShortName, setTempInstitutionShortName] = useState(config.institutionShortName || '')
  const [isSaving, setIsSaving] = useState(false)

  const toHexForColorInput = (value: string) => {
    const v = value.trim()
    if (!v) return '#000000'
    if (v.startsWith('#') && (v.length === 7 || v.length === 4)) return v
    // If value is hsl(...) or HSL components, we can't reliably convert without parsing and converting.
    // Fall back to a sensible default color for the picker.
    return '#3b82f6'
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setTempLogo(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      setColors(tempColors)
      setIconColor(tempIconColor)
      setLogo(tempLogo)
      setInstitutionName(tempInstitutionName)
      setInstitutionShortName(tempInstitutionShortName)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    resetTheme()
    // Force update with new default colors
    setTempColors({
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#8b5cf6',
      background: '#ffffff',
    })
    setTempIconColor('#3b82f6')
    setTempLogo(null)
    setTempInstitutionName('')
    setTempInstitutionShortName('')
  }

  // Check if user is admin
  const role = (user as unknown as { role?: string } | null)?.role
  const isAdmin = role === 'admin' || role === 'Administrador'
  
  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <p className="text-muted-foreground">Acesso negado. Apenas administradores podem acessar esta página.</p>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        <Header />
        <div className="flex h-full w-full overflow-hidden pt-16">
          {/* Desktop Layout */}
          <div className="flex h-full w-full">
            {/* Sidebar */}
            <div
              className={`h-full border-r border-border bg-card transition-all duration-300 ${
                sidebarOpen ? "w-64" : "w-0"
              } overflow-hidden`}
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content */}
            <div className="flex-1 h-full overflow-y-auto p-8">
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Configurações</h1>
                    <p className="text-muted-foreground">
                      Gerencie as configurações da plataforma
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/')}
                      className="gap-2"
                      type="button"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Voltar
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="gap-2"
                      disabled={isSaving}
                      type="button"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
                  {/* Internal settings menu */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
                      Configurações
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('theme')}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        activeSection === 'theme'
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-background border-transparent text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="text-sm font-medium">Configurações de Tema</span>
                      </div>
                      <div className="text-xs mt-1">
                        Cores, ícones e logo
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('ingest')}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        activeSection === 'ingest'
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-background border-transparent text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span className="text-sm font-medium">Ingestão de Dados</span>
                      </div>
                      <div className="text-xs mt-1">
                        Importar organograma via CSV
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('company')}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        activeSection === 'company'
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-background border-transparent text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Descrição da Empresa</span>
                      </div>
                      <div className="text-xs mt-1">
                        Informações básicas da organização
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('strategy')}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        activeSection === 'strategy'
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-background border-transparent text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span className="text-sm font-medium">Objetivos Estratégicos</span>
                      </div>
                      <div className="text-xs mt-1">
                        OKRs e metas organizacionais
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('projects')}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        activeSection === 'projects'
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-background border-transparent text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4" />
                        <span className="text-sm font-medium">Ingestão de Projetos</span>
                      </div>
                      <div className="text-xs mt-1">
                        Cadastrar projetos vinculados aos OKRs
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('external-participants')}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        activeSection === 'external-participants'
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-background border-transparent text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">Participantes Externos</span>
                      </div>
                      <div className="text-xs mt-1">
                        Parceiros estratégicos, operacionais e táticos
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('meetings')}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        activeSection === 'meetings'
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-background border-transparent text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">Transcrições de Reunião</span>
                      </div>
                      <div className="text-xs mt-1">
                        Importar transcrições do Teams/Zoom
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('ontology')}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        activeSection === 'ontology'
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-background border-transparent text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        <span className="text-sm font-medium">Ontologia do Projeto</span>
                      </div>
                      <div className="text-xs mt-1">
                        Taxonomia, tesauro e visão geral do grafo
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('profile')}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        activeSection === 'profile'
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-background border-transparent text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">Dados do Perfil</span>
                      </div>
                      <div className="text-xs mt-1">
                        Editar informações do onboarding
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSection('agents')}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                        activeSection === 'agents'
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-background border-transparent text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <span className="text-sm font-medium">Meus Agentes</span>
                      </div>
                      <div className="text-xs mt-1">
                        Gerenciar agentes de IA personalizados
                      </div>
                    </button>
                    
                    {/* Admin Only: Permissions */}
                    {userRole === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setActiveSection('permissions')}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                          activeSection === 'permissions'
                            ? 'bg-muted border-border text-foreground'
                            : 'bg-background border-transparent text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span className="text-sm font-medium">Permissões de Menu</span>
                        </div>
                        <div className="text-xs mt-1">
                          Configurar visibilidade para usuários
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-6">
                    {activeSection === 'theme' && (
                      <>
                        <div>
                          <h2 className="text-xl font-semibold">Configurações de Tema</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            Personalize as cores e o logo da plataforma
                          </p>
                        </div>

                        {/* Logo Upload */}
                        <Card className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-5 w-5 text-primary" />
                              <h3 className="text-xl font-semibold">Logo da Plataforma</h3>
                            </div>

                            <div className="flex items-center gap-4">
                              {tempLogo ? (
                                <div className="w-24 h-24 border-2 border-border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                                  <img
                                    src={tempLogo}
                                    alt="Logo"
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-24 h-24 border-2 border-border rounded-lg flex items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
                                  EH
                                </div>
                              )}

                              <div className="flex flex-col gap-2">
                                <input
                                  ref={logoInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoUpload}
                                  className="hidden"
                                />
                                <Button
                                  onClick={() => logoInputRef.current?.click()}
                                  variant="outline"
                                  className="gap-2"
                                  type="button"
                                >
                                  <Upload className="h-4 w-4" />
                                  Upload Logo
                                </Button>
                                {tempLogo && (
                                  <Button
                                    onClick={() => setTempLogo(null)}
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                  >
                                    Remover Logo
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Recomendado: PNG ou SVG, tamanho máximo 2MB
                            </p>
                          </div>
                        </Card>

                        {/* Institution Naming */}
                        <Card className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5 text-primary" />
                              <h3 className="text-xl font-semibold">Nome da Instituição</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Institution Name */}
                              <div className="space-y-2">
                                <Label htmlFor="institutionName">Nome Completo</Label>
                                <Input
                                  id="institutionName"
                                  value={tempInstitutionName}
                                  onChange={(e) => setTempInstitutionName(e.target.value)}
                                  placeholder="Alocc Gestão Patrimonial"
                                  className="flex-1"
                                />
                                <p className="text-xs text-muted-foreground">Nome completo da instituição</p>
                              </div>

                              {/* Institution Short Name */}
                              <div className="space-y-2">
                                <Label htmlFor="institutionShortName">Nome Abreviado</Label>
                                <Input
                                  id="institutionShortName"
                                  value={tempInstitutionShortName}
                                  onChange={(e) => setTempInstitutionShortName(e.target.value)}
                                  placeholder="Alocc"
                                  className="flex-1"
                                />
                                <p className="text-xs text-muted-foreground">Nome curto para exibição em espaços reduzidos</p>
                              </div>
                            </div>
                          </div>
                        </Card>

                        {/* Colors */}
                        <Card className="p-6">
                          <div className="space-y-6">
                            <div className="flex items-center gap-2">
                              <Palette className="h-5 w-5 text-primary" />
                              <h3 className="text-xl font-semibold">Cores do Tema</h3>
                            </div>

                            {/* Color Preview Cards */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                  Preview das cores aplicadas nos cards de navegação:
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setTempColors({
                                      primary: '#3b82f6',
                                      secondary: '#6366f1',
                                      accent: '#8b5cf6',
                                      background: '#ffffff',
                                    });
                                  }}
                                  className="text-xs"
                                >
                                  Forçar Cores Visíveis
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="text-center">
                                  <div 
                                    className="h-16 rounded-lg border-2 mb-2 flex items-center justify-center"
                                    style={{ 
                                      backgroundColor: tempColors.primary || '#3b82f6',
                                      borderColor: tempColors.primary || '#3b82f6'
                                    }}
                                  >
                                    <span className="text-white text-xs font-medium">Primary</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">Estratégia</p>
                                </div>
                                <div className="text-center">
                                  <div 
                                    className="h-16 rounded-lg border-2 mb-2 flex items-center justify-center"
                                    style={{ 
                                      backgroundColor: tempColors.secondary || '#6366f1',
                                      borderColor: tempColors.secondary || '#6366f1'
                                    }}
                                  >
                                    <span className="text-white text-xs font-medium">Secondary</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">Projetos</p>
                                </div>
                                <div className="text-center">
                                  <div 
                                    className="h-16 rounded-lg border-2 mb-2 flex items-center justify-center"
                                    style={{ 
                                      backgroundColor: tempColors.accent || '#8b5cf6',
                                      borderColor: tempColors.accent || '#8b5cf6'
                                    }}
                                  >
                                    <span className="text-white text-xs font-medium">Accent</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">Insights</p>
                                </div>
                                <div className="text-center">
                                  <div 
                                    className="h-16 rounded-lg border-2 mb-2 flex items-center justify-center bg-slate-500 border-slate-500"
                                  >
                                    <span className="text-white text-xs font-medium">Muted</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">Visão Externa</p>
                                </div>
                              </div>
                            </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Primary Color */}
                      <div className="space-y-2">
                        <Label htmlFor="primary">Cor Primária</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary"
                            type="color"
                            value={toHexForColorInput(tempColors.primary)}
                            onChange={(e) => setTempColors({ ...tempColors, primary: e.target.value })}
                            className="w-20 h-10 cursor-pointer"
                          />
                          <Input
                            value={tempColors.primary}
                            onChange={(e) => setTempColors({ ...tempColors, primary: e.target.value })}
                            placeholder="hsl(221.2 83.2% 53.3%)"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Cor principal dos botões e links</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Usado em: Estratégia (navegação)
                        </p>
                      </div>

                      {/* Secondary Color */}
                      <div className="space-y-2">
                        <Label htmlFor="secondary">Cor Secundária</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondary"
                            type="color"
                            value={toHexForColorInput(tempColors.secondary)}
                            onChange={(e) => setTempColors({ ...tempColors, secondary: e.target.value })}
                            className="w-20 h-10 cursor-pointer"
                          />
                          <Input
                            value={tempColors.secondary}
                            onChange={(e) => setTempColors({ ...tempColors, secondary: e.target.value })}
                            placeholder="hsl(210 40% 96.1%)"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Cor de fundo secundária</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          Usado em: Projetos (navegação)
                        </p>
                      </div>

                      {/* Accent Color */}
                      <div className="space-y-2">
                        <Label htmlFor="accent">Cor de Destaque</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accent"
                            type="color"
                            value={toHexForColorInput(tempColors.accent)}
                            onChange={(e) => setTempColors({ ...tempColors, accent: e.target.value })}
                            className="w-20 h-10 cursor-pointer"
                          />
                          <Input
                            value={tempColors.accent}
                            onChange={(e) => setTempColors({ ...tempColors, accent: e.target.value })}
                            placeholder="hsl(262.1 83.3% 57.8%)"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Cor para elementos destacados</p>
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                          Usado em: Insights (navegação)
                        </p>
                      </div>

                      {/* Icon Color */}
                      <div className="space-y-2">
                        <Label htmlFor="iconColor">Cor dos Ícones</Label>
                        <div className="flex gap-2">
                          <Input
                            id="iconColor"
                            type="color"
                            value={toHexForColorInput(tempIconColor)}
                            onChange={(e) => setTempIconColor(e.target.value)}
                            className="w-20 h-10 cursor-pointer"
                          />
                          <Input
                            value={tempIconColor}
                            onChange={(e) => setTempIconColor(e.target.value)}
                            placeholder="hsl(221.2 83.2% 53.3%)"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Cor padrão dos ícones da interface</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Usado em: Ícones em toda a interface
                        </p>
                      </div>
                    </div>

                            <div className="flex gap-3 pt-4">
                              <Button onClick={handleReset} variant="outline" className="gap-2" type="button">
                                <RotateCcw className="h-4 w-4" />
                                Restaurar Padrão
                              </Button>
                            </div>
                          </div>
                        </Card>

                        {/* Preview */}
                        <Card className="p-6">
                          <div className="space-y-4">
                            <h3 className="text-xl font-semibold">Preview</h3>
                            <div className="flex gap-4 flex-wrap">
                              <Button style={{ backgroundColor: tempColors.primary }}>
                                Botão Primário
                              </Button>
                              <Button variant="secondary" style={{ backgroundColor: tempColors.secondary }}>
                                Botão Secundário
                              </Button>
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ color: tempIconColor }}
                              >
                                <Palette className="h-6 w-6" />
                              </div>
                            </div>
                          </div>
                        </Card>
                      </>
                    )}
                    {activeSection === 'company' && (
                      <CompanyDescription />
                    )}
                    {activeSection === 'strategy' && (
                      <StrategicObjectives />
                    )}
                    {activeSection === 'projects' && (
                      <ProjectIngestion />
                    )}
                    {activeSection === 'ontology' && (
                      <OntologyViewer />
                    )}
                    {activeSection === 'profile' && (
                      <ProfileDataEditor />
                    )}
                    {activeSection === 'agents' && (
                      <MyAgents />
                    )}
                    {activeSection === 'ingest' && (
                      <DataIngestion />
                    )}
                    {activeSection === 'meetings' && (
                      <MeetingTranscriptIngestion />
                    )}
                    {activeSection === 'external-participants' && (
                      <ExternalParticipantsManager />
                    )}
                    {activeSection === 'permissions' && userRole === 'admin' && (
                      <MenuPermissionsManager />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

