/**
 * Tenant Configuration System
 * Permite white-label customizando branding, logo, cores, etc.
 */

export interface TenantConfig {
  // Branding
  name: string; // ex: "Alok Innovation Hub", "TechCorp Platform"
  shortName: string; // ex: "AIH", "TCP" (usado em logo/favicon)
  tagline: string; // ex: "Corporate Innovation Platform"
  
  // Institution Naming
  institutionName: string; // ex: "Alocc Gestão Patrimonial"
  institutionShortName: string; // ex: "Alocc"
  
  // Visual
  logo?: {
    url: string;
    alt: string;
  };
  favicon?: string;
  
  // Colors (opcional, sobrescreve CSS vars)
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  
  // Contact/Support
  supportEmail?: string;
  
  // Features flags
  features?: {
    showPublicRegistration?: boolean;
    enableMultiTenant?: boolean;
    showCompanyBranding?: boolean; // Se true, mostra "{company} Hub", se false só mostra tenant.name
  };
}

// Mock tenant config (em produção virá de API ou .env)
export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  name: "Enterprise Innovation Hub",
  shortName: "EIH",
  tagline: "AI-Powered Knowledge Management",
  institutionName: "Alocc Gestão Patrimonial",
  institutionShortName: "Alocc",
  supportEmail: "support@innovationhub.ai",
  features: {
    showPublicRegistration: false,
    enableMultiTenant: false,
    showCompanyBranding: true, // Mostra "Alok Hub" em vez de apenas "Enterprise Innovation Hub"
  },
};

/**
 * Carrega tenant config (mock por enquanto)
 * Em produção, virá de API baseado no domínio ou .env
 */
export function getTenantConfig(): TenantConfig {
  // TODO: buscar de API ou .env baseado no domínio
  // Ex: if (window.location.hostname === 'alok.hub.ai') return ALOK_CONFIG
  
  return DEFAULT_TENANT_CONFIG;
}
