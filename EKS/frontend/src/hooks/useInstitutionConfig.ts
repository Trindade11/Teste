/**
 * Hook para acessar configurações de instituição de forma centralizada
 */
import { useThemeStore } from '@/store/themeStore'
import { getTenantConfig } from '@/lib/tenant-config'

export function useInstitutionConfig() {
  const { config } = useThemeStore()
  const tenantConfig = getTenantConfig()

  // Prioridade: config do tema > tenant config > defaults
  const institutionName = config.institutionName || tenantConfig.institutionName || 'Alocc Gestão Patrimonial'
  const institutionShortName = config.institutionShortName || tenantConfig.institutionShortName || 'Alocc'
  const hubName = tenantConfig.features?.showCompanyBranding 
    ? `${institutionShortName} Hub` 
    : tenantConfig.name

  return {
    institutionName,
    institutionShortName,
    hubName,
    tenantName: tenantConfig.name,
    tenantShortName: tenantConfig.shortName,
  }
}
