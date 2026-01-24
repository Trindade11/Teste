"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Save, Loader2 } from "lucide-react"
import { getCompanyProfile, saveCompanyProfile } from "@/services/api"

interface CompanyProfile {
  name: string
  description: string
  industry?: string
  size?: string
  mission?: string
  vision?: string
  values?: string[]
  updatedBy?: string
  updatedAt?: string
}

export function CompanyDescription() {
  const [profile, setProfile] = useState<CompanyProfile>({
    name: '',
    description: '',
    industry: '',
    size: '',
    mission: '',
    vision: '',
    values: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [valuesInput, setValuesInput] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getCompanyProfile()
      if (response.data) {
        setProfile(response.data)
        setValuesInput(response.data.values?.join('; ') || '')
      }
    } catch (err) {
      console.error('Error loading company profile:', err)
      setError('Erro ao carregar perfil da empresa')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(false)

      console.log('🔍 Iniciando salvamento do perfil da empresa...')

      if (!profile.name || !profile.description) {
        setError('Nome e descrição são obrigatórios')
        console.error('❌ Validação falhou: campos obrigatórios vazios')
        return
      }

      const values = valuesInput
        .split(';')
        .map(v => v.trim())
        .filter(Boolean)

      const profileData = {
        ...profile,
        values,
      }

      console.log('📤 Enviando dados:', profileData)

      const response = await saveCompanyProfile(profileData)
      
      console.log('✅ Resposta recebida:', response)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await loadProfile()
    } catch (err) {
      console.error('❌ Error saving company profile:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar perfil da empresa'
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Descrição da Empresa</h2>
            <p className="text-sm text-muted-foreground">
              Defina as informações básicas da sua organização
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
            Perfil da empresa salvo com sucesso!
          </div>
        )}

        <div className="space-y-6">
          {/* Nome da Empresa */}
          <div className="space-y-2">
            <Label htmlFor="company-name" className="text-sm font-medium">
              Nome da Empresa
            </Label>
            <Input
              id="company-name"
              value={profile.name}
              disabled
              placeholder="Carregado da ingestão de dados"
              className="w-full bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O nome da empresa é definido durante a ingestão de dados
            </p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="company-description" className="text-sm font-medium">
              Descrição da Empresa *
            </Label>
            <Textarea
              id="company-description"
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              placeholder="Descreva sua empresa, o que ela faz, seus principais produtos/serviços..."
              className="w-full min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Esta descrição será usada como contexto base para os processos de IA
            </p>
          </div>

          {/* Setor/Indústria */}
          <div className="space-y-2">
            <Label htmlFor="company-industry" className="text-sm font-medium">
              Setor/Indústria
            </Label>
            <Input
              id="company-industry"
              value={profile.industry || ''}
              onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
              placeholder="Ex: Serviços Financeiros, Tecnologia, Saúde..."
            />
          </div>

          {/* Tamanho */}
          <div className="space-y-2">
            <Label htmlFor="company-size" className="text-sm font-medium">
              Tamanho da Empresa
            </Label>
            <Input
              id="company-size"
              value={profile.size || ''}
              onChange={(e) => setProfile({ ...profile, size: e.target.value })}
              placeholder="Ex: 1-50, 51-200, 201-500, 500+"
            />
          </div>

          {/* Missão */}
          <div className="space-y-2">
            <Label htmlFor="company-mission" className="text-sm font-medium">
              Missão
            </Label>
            <Textarea
              id="company-mission"
              value={profile.mission || ''}
              onChange={(e) => setProfile({ ...profile, mission: e.target.value })}
              placeholder="Qual é a missão da sua empresa?"
              className="w-full min-h-[80px]"
            />
          </div>

          {/* Visão */}
          <div className="space-y-2">
            <Label htmlFor="company-vision" className="text-sm font-medium">
              Visão
            </Label>
            <Textarea
              id="company-vision"
              value={profile.vision || ''}
              onChange={(e) => setProfile({ ...profile, vision: e.target.value })}
              placeholder="Qual é a visão de futuro da sua empresa?"
              className="w-full min-h-[80px]"
            />
          </div>

          {/* Valores */}
          <div className="space-y-2">
            <Label htmlFor="company-values" className="text-sm font-medium">
              Valores
            </Label>
            <Input
              id="company-values"
              value={valuesInput}
              onChange={(e) => setValuesInput(e.target.value)}
              placeholder="Separe os valores por ponto-e-vírgula (;)"
            />
            <p className="text-xs text-muted-foreground">
              Ex: Integridade; Inovação; Excelência; Colaboração
            </p>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Perfil
                </>
              )}
            </Button>
          </div>

          {profile.updatedBy && profile.updatedAt && (
            <div className="text-xs text-muted-foreground pt-4 border-t">
              Última atualização por {profile.updatedBy} em{' '}
              {new Date(parseInt(profile.updatedAt)).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
