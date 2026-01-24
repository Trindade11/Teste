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
import { ArrowLeft, Save, Upload, RotateCcw, Palette, Image as ImageIcon, Database, User, Bot, Building2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { DataIngestion } from "@/components/admin/DataIngestion"
import { ProfileDataEditor } from "@/components/settings/ProfileDataEditor"
import { MyAgents } from "@/components/settings/MyAgents"
import { CompanyDescription } from "@/components/settings/CompanyDescription"

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { config, setColors, setLogo, setIconColor, setInstitutionName, setInstitutionShortName, resetTheme } = useThemeStore()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [activeSection, setActiveSection] = useState<'theme' | 'ingest' | 'profile' | 'agents' | 'company'>('theme')

  const [tempColors, setTempColors] = useState(config.colors)
  const [tempIconColor, setTempIconColor] = useState(config.iconColor)
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
    setTempColors(config.colors)
    setTempIconColor(config.iconColor)
    setTempLogo(config.logo)
    setTempInstitutionName(config.institutionName || '')
    setTempInstitutionShortName(config.institutionShortName || '')
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
                    {activeSection === 'profile' && (
                      <ProfileDataEditor />
                    )}
                    {activeSection === 'agents' && (
                      <MyAgents />
                    )}
                    {activeSection === 'ingest' && (
                      <DataIngestion />
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

