"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield,
  Users,
  Eye,
  EyeOff,
  Settings,
  Database,
  FileText,
  Building2,
  Target,
  FolderKanban,
  Network,
  User,
  Bot,
  Palette,
  AlertCircle,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  useSettingsPermissionsStore,
  type SettingsMenuItem,
} from "@/store/settingsPermissionsStore";

const MENU_ICONS: Record<SettingsMenuItem, typeof Settings> = {
  theme: Palette,
  company: Building2,
  strategy: Target,
  projects: FolderKanban,
  ontology: Network,
  ingest: Database,
  meetings: FileText,
  profile: User,
  agents: Bot,
};

const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  data: { label: "Gestão de Dados", description: "Ingestão e importação" },
  curator: { label: "Curadoria Ontológica", description: "OKRs, projetos e ontologia" },
  personal: { label: "Configurações Pessoais", description: "Perfil e agentes" },
  admin: { label: "Administração", description: "Tema e aparência" },
};

export function MenuPermissionsManager() {
  const {
    menuConfig,
    enforceRoleRestrictions,
    setMenuVisibility,
    setEnforceRoleRestrictions,
    resetToDefaults,
  } = useSettingsPermissionsStore();

  const [hasChanges, setHasChanges] = useState(false);

  const handleToggleVisibility = (menuId: SettingsMenuItem, currentValue: boolean) => {
    setMenuVisibility(menuId, !currentValue);
    setHasChanges(true);
  };

  const handleToggleEnforcement = () => {
    setEnforceRoleRestrictions(!enforceRoleRestrictions);
    setHasChanges(true);
  };

  const handleReset = () => {
    resetToDefaults();
    setHasChanges(true);
  };

  // Agrupar menus por categoria
  const menusByCategory = menuConfig.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuConfig>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permissões de Menu
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure quais itens de menu são visíveis para usuários não-admin.
        </p>
      </div>

      {/* Enforcement Toggle */}
      <Card className={cn(
        "p-4",
        enforceRoleRestrictions
          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
          : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            {enforceRoleRestrictions ? (
              <ToggleRight className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-amber-600 mt-0.5" />
            )}
            <div>
              <p className={cn(
                "text-sm font-medium",
                enforceRoleRestrictions
                  ? "text-green-900 dark:text-green-100"
                  : "text-amber-900 dark:text-amber-100"
              )}>
                {enforceRoleRestrictions
                  ? "Restrições de Role Ativas"
                  : "Modo de Teste (Todos Veem Tudo)"}
              </p>
              <p className={cn(
                "text-xs mt-1",
                enforceRoleRestrictions
                  ? "text-green-700 dark:text-green-300"
                  : "text-amber-700 dark:text-amber-300"
              )}>
                {enforceRoleRestrictions
                  ? "Usuários só veem os menus permitidos abaixo."
                  : "Para testes, todos os usuários veem todos os menus. Ative para aplicar restrições."}
              </p>
            </div>
          </div>
          <Button
            variant={enforceRoleRestrictions ? "default" : "outline"}
            size="sm"
            onClick={handleToggleEnforcement}
          >
            {enforceRoleRestrictions ? "Desativar" : "Ativar"}
          </Button>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Como funciona
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <li>• <strong>Admin</strong>: sempre vê todos os menus</li>
              <li>• <strong>Usuário</strong>: vê apenas menus com "Visível para Usuários" ativado</li>
              <li>• Menus marcados como "Admin Only" nunca aparecem para usuários</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Menu Configuration by Category */}
      {Object.entries(menusByCategory).map(([category, items]) => {
        const categoryInfo = CATEGORY_LABELS[category] || { label: category, description: "" };
        return (
          <Card key={category} className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">{categoryInfo.label}</h3>
              <p className="text-xs text-muted-foreground">{categoryInfo.description}</p>
            </div>
            <div className="space-y-2">
              {items.map((item) => {
                const Icon = MENU_ICONS[item.id];
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      item.adminOnly
                        ? "bg-muted/30 border-muted"
                        : "bg-background border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        item.visibleToUsers
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-gray-100 dark:bg-gray-800"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          item.visibleToUsers
                            ? "text-green-600"
                            : "text-gray-500"
                        )} />
                      </div>
                      <div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          {item.label}
                          {item.adminOnly && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Admin Only
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    {!item.adminOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(item.id, item.visibleToUsers)}
                        className={cn(
                          "gap-1",
                          item.visibleToUsers
                            ? "text-green-600 hover:text-green-700"
                            : "text-gray-500 hover:text-gray-600"
                        )}
                      >
                        {item.visibleToUsers ? (
                          <>
                            <Eye className="h-4 w-4" />
                            Visível
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Oculto
                          </>
                        )}
                      </Button>
                    )}

                    {item.adminOnly && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Somente Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrões
        </Button>
        {hasChanges && (
          <p className="text-xs text-muted-foreground">
            Alterações são salvas automaticamente
          </p>
        )}
      </div>
    </div>
  );
}
