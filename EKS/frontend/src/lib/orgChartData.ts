/**
 * Organizational Chart Data Model
 * Fonte: Nodes.csv
 * Preparado para integração futura com grafo MongoDB
 */

import { getTenantConfig } from './tenant-config';

export interface OrgNode {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;                    // Função (ex: Analista de Processos, CEO)
  department: string;               // Departamento onde está alocado
  leadsAreas: string[];             // Departamento(s) que lidera
  accessAreas: string[];            // Áreas que tem acesso (leitura de docs)
  status: 'Ativo' | 'Inativo';
  
  // Campos calculados para navegação no organograma
  managerId?: string;               // ID do gestor direto
  peerIds?: string[];               // IDs dos pares (mesmo departamento, mesmo nível)
  subordinateIds?: string[];        // IDs dos subordinados diretos
}

export interface OrgChartRelationship {
  fromId: string;
  toId: string;
  type: 'reports_to' | 'peer' | 'has_access_to';
}

// Função para criar nó com nome configurável
function createOrgNode(data: Omit<OrgNode, 'company'>): OrgNode {
  const tenantConfig = getTenantConfig();
  return {
    ...data,
    company: tenantConfig.institutionName || 'Alocc Gestão Patrimonial'
  };
}

// Dataset completo parseado do CSV
const orgChartDataRaw: Omit<OrgNode, 'company'>[] = [
  {
    id: 'agatha.mendes',
    name: 'Ágatha Mendes',
    email: 'agatha.mendes@alocc.com.br',
    role: 'Analista de Apoio',
    department: 'Apoio',
    leadsAreas: [],
    accessAreas: ['Apoio'],
    status: 'Ativo'
  },
  {
    id: 'alessandra.bouhid',
    name: 'Alessandra Bouhid',
    email: 'alessandra@tna.com.br',
    role: 'Analista de Wealth Management',
    department: 'TNA  Parceiro',
    leadsAreas: [],
    accessAreas: ['TNA-RJ 2'],
    status: 'Ativo'
  },
  {
    id: 'amanda.andrade',
    name: 'Amanda Andrade',
    email: 'amanda@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Wealth Management',
    department: 'TNA  Parceiro',
    leadsAreas: [],
    accessAreas: ['TNA-RJ 2'],
    status: 'Ativo'
  },
  {
    id: 'anabeatriz.diniz',
    name: 'Ana Beatriz Diniz',
    email: 'anabeatriz@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Wealth Management',
    department: 'TNA  Parceiro',
    leadsAreas: [],
    accessAreas: ['TNA-RJ 4'],
    status: 'Ativo'
  },
  {
    id: 'andrea.martins',
    name: 'Andrea Martins',
    email: 'andrea.martins@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Líder do Atendimento',
    department: 'Atendimento',
    leadsAreas: ['Atendimento'],
    accessAreas: ['Atendimento'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'anne.bazhuni',
    name: 'Anne Bazhuni',
    email: 'anne.bazhuni@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Estruturado',
    department: 'Estruturado',
    leadsAreas: [],
    accessAreas: ['Estruturado'],
    status: 'Ativo',
    managerId: 'luiza.hime'
  },
  {
    id: 'beatriz.carvalho',
    name: 'Beatriz Carvalho',
    email: 'beatriz.carvalho@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Atendimento',
    department: 'Atendimento',
    leadsAreas: [],
    accessAreas: ['Atendimento'],
    status: 'Ativo',
    managerId: 'andrea.martins'
  },
  {
    id: 'beatriz.cunha',
    name: 'Beatriz Cunha',
    email: 'beatriz.cunha@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Operacional',
    department: 'Operacional',
    leadsAreas: [],
    accessAreas: ['Operacional'],
    status: 'Ativo',
    managerId: 'rafael.pasqua'
  },
  {
    id: 'bernardo.daudt',
    name: 'Bernardo Daudt',
    email: 'bernardo.daudt@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Líder Legal',
    department: 'Legal',
    leadsAreas: ['Legal'],
    accessAreas: ['Legal'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'bernardo.machado',
    name: 'Bernardo Machado',
    email: 'bernardo.machado@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Projetos',
    department: 'Sistemas',
    leadsAreas: ['Sistemas'],
    accessAreas: ['TNA-RJ 2', 'TNA-RJ 4', 'Atendimento', 'Estruturado', 'Operacional', 'Legal', 'Sistemas', 'Administrativo', 'Investimentos', 'Risco', 'Comitê de Operações', 'TI', 'Comitê Estratégico', 'Compliance', 'Movimentações', 'TNA-SP'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'carla.santos',
    name: 'Carla Santos',
    email: 'carla.santos@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Administrativo',
    department: 'Administrativo',
    leadsAreas: [],
    accessAreas: ['Administrativo'],
    status: 'Ativo',
    managerId: 'joao.novis'
  },
  {
    id: 'carolina.pestana',
    name: 'Carolina Pestana',
    email: 'carolina.pestana@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Apoio',
    department: 'Apoio',
    leadsAreas: [],
    accessAreas: ['Apoio'],
    status: 'Ativo',
    managerId: 'elber.maia'
  },
  {
    id: 'clarice.lima',
    name: 'Clarice Lima',
    email: 'clarice.lima@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Wealth Management',
    department: 'TNA  Parceiro',
    leadsAreas: [],
    accessAreas: ['TNA-RJ 2'],
    status: 'Ativo'
  },
  {
    id: 'daniela.moreno',
    name: 'Daniela Moreno',
    email: 'daniela.moreno@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Estruturado',
    department: 'Estruturado',
    leadsAreas: [],
    accessAreas: ['Estruturado'],
    status: 'Ativo',
    managerId: 'luiza.hime'
  },
  {
    id: 'eduardo.otero',
    name: 'Eduardo Otero',
    email: 'eduardo.otero@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Líder Investimentos',
    department: 'Investimentos',
    leadsAreas: ['Investimentos'],
    accessAreas: ['Investimentos'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'elber.maia',
    name: 'Elber Maia',
    email: 'elber.maia@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Líder Apoio',
    department: 'Apoio',
    leadsAreas: ['Apoio'],
    accessAreas: ['Apoio'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'fabiana.fantoni',
    name: 'Fabiana Fantoni',
    email: 'fabiana.fantoni@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Wealth Management',
    department: 'TNA  Parceiro',
    leadsAreas: [],
    accessAreas: ['TNA-SP'],
    status: 'Ativo'
  },
  {
    id: 'fatima.nogueira',
    name: 'Fátima Nogueira',
    email: 'fatima.nogueira@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Administrativo',
    department: 'Administrativo',
    leadsAreas: [],
    accessAreas: ['Administrativo'],
    status: 'Ativo',
    managerId: 'joao.novis'
  },
  {
    id: 'fernanda.barbieri',
    name: 'Fernanda Barbieri',
    email: 'fernanda.barbieri@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Atendimento',
    department: 'Atendimento',
    leadsAreas: [],
    accessAreas: ['Atendimento'],
    status: 'Ativo',
    managerId: 'andrea.martins'
  },
  {
    id: 'hans.boehme',
    name: 'Hans Boehme',
    email: 'hans@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Diretor(a) Operacional',
    department: 'Comitê de Operações',
    leadsAreas: ['Atendimento', 'Legal', 'Sistemas', 'Investimentos', 'Apoio', 'Administrativo', 'TI', 'Estruturado', 'Operacional', 'Operacional', 'Compliance', 'Movimentação', 'Risco'],
    accessAreas: ['Comitê de Operações'],
    status: 'Ativo',
    managerId: 'ricardo.taboaco'
  },
  {
    id: 'izabella.guarita',
    name: 'Izabella Guaritá',
    email: 'izabella.guarita@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Estruturado',
    department: 'Estruturado',
    leadsAreas: [],
    accessAreas: ['Estruturado'],
    status: 'Ativo',
    managerId: 'luiza.hime'
  },
  {
    id: 'giulia.paes',
    name: 'Giulia Paes',
    email: 'giulia.paes@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Risco',
    department: 'Risco',
    leadsAreas: [],
    accessAreas: ['Risco'],
    status: 'Ativo',
    managerId: 'thiago.pereira'
  },
  {
    id: 'joao.novis',
    name: 'João Pedro Novis',
    email: 'joao.novis@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Líder Administrativo',
    department: 'Administrativo',
    leadsAreas: ['Administrativo'],
    accessAreas: ['Administrativo'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'joel.junior',
    name: 'Joel Junior',
    email: 'joel.junior@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de TI',
    department: 'TI',
    leadsAreas: [],
    accessAreas: ['TI'],
    status: 'Ativo',
    managerId: 'leandro.martins'
  },
  {
    id: 'leandro.martins',
    name: 'Leandro Martins',
    email: 'leandro.martins@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Líder TI',
    department: 'TI',
    leadsAreas: ['TI'],
    accessAreas: ['TI'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'leticia.faria',
    name: 'Letícia Faria',
    email: 'laticia.faria@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Risco',
    department: 'Risco',
    leadsAreas: [],
    accessAreas: ['Risco'],
    status: 'Ativo',
    managerId: 'thiago.pereira'
  },
  {
    id: 'leticia.martini',
    name: 'Leticia Martini',
    email: 'leticia.martini@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Atendimento',
    department: 'Atendimento',
    leadsAreas: [],
    accessAreas: ['Atendimento'],
    status: 'Ativo',
    managerId: 'andrea.martins'
  },
  {
    id: 'luiza.hime',
    name: 'Luiza Hime',
    email: 'luiza.hime@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Líder Estruturado',
    department: 'Estruturado',
    leadsAreas: ['Estruturado'],
    accessAreas: ['Estruturado'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'marco.tulio',
    name: 'Marco Túlio',
    email: 'marco.túlio@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Wealth Management',
    department: 'TNA  Parceiro',
    leadsAreas: [],
    accessAreas: ['TNA-SP'],
    status: 'Ativo'
  },
  {
    id: 'maria.taboaco',
    name: 'Maria Taboaço',
    email: 'maria.taboaco@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Wealth Management',
    department: 'TNA  Parceiro',
    leadsAreas: [],
    accessAreas: ['TNA-RJ 2', 'TNA-RJ 4', 'Atendimento', 'Estruturado', 'Operacional', 'Legal', 'Sistemas', 'Administrativo', 'Investimentos', 'Risco', 'Comitê de Operações', 'TI', 'Comitê Estratégico', 'Compliance', 'Movimentações', 'TNA-SP'],
    status: 'Ativo'
  },
  {
    id: 'nando.salem',
    name: 'Nando Salem',
    email: 'nandosalem@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Wealth Management',
    department: 'TNA  Parceiro',
    leadsAreas: [],
    accessAreas: ['TNA-SP'],
    status: 'Ativo'
  },
  {
    id: 'nicole.derenzi',
    name: 'Nicole Derenzi',
    email: 'nicole.derenzi@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Wealth Management',
    department: 'TNA  Parceiro',
    leadsAreas: [],
    accessAreas: ['TNA-RJ 2'],
    status: 'Ativo'
  },
  {
    id: 'patricia.marinho',
    name: 'Patricia Marinho',
    email: 'patricia.marinho@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Líder de Projetos',
    department: 'Sistemas',
    leadsAreas: ['Sistemas'],
    accessAreas: ['TNA-RJ 2', 'TNA-RJ 4', 'Atendimento', 'Estruturado', 'Operacional', 'Legal', 'Sistemas', 'Administrativo', 'Investimentos', 'Risco', 'Comitê de Operações', 'TI', 'Comitê Estratégico', 'Compliance', 'Movimentações', 'TNA-SP'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'paulo.meirelles',
    name: 'Paulo Meirelles',
    email: 'paulo@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Diretor(a) de Wealth Management',
    department: 'Comitê Estratégico',
    leadsAreas: [],
    accessAreas: ['TNA-RJ 2', 'TNA-RJ 4', 'Atendimento', 'Estruturado', 'Operacional', 'Legal', 'Sistemas', 'Administrativo', 'Investimentos', 'Risco', 'Comitê de Operações', 'TI', 'Comitê Estratégico', 'Compliance', 'Movimentações', 'TNA-SP'],
    status: 'Ativo',
    managerId: 'ricardo.taboaco'
  },
  {
    id: 'rafael.nelli',
    name: 'Rafael Nelli',
    email: 'rafael.nelli@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Wealth Management',
    department: 'TNA  Parceiro',
    leadsAreas: [],
    accessAreas: ['TNA-SP'],
    status: 'Ativo'
  },
  {
    id: 'rafael.pasqua',
    name: 'Rafael Pasqua',
    email: 'rafael.pasqua@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Líder Operacional',
    department: 'Operacional',
    leadsAreas: ['Operacional'],
    accessAreas: ['Operacional'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'ricardo.taboaco',
    name: 'Ricardo Taboaço',
    email: 'taboaco@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'CEO',
    department: 'Comitê Estratégico',
    leadsAreas: ['Comitê de Operações'],
    accessAreas: ['TNA-RJ 2', 'TNA-RJ 4', 'Atendimento', 'Estruturado', 'Operacional', 'Legal', 'Sistemas', 'Administrativo', 'Investimentos', 'Risco', 'Comitê de Operações', 'TI', 'Comitê Estratégico', 'Compliance', 'Movimentações', 'TNA-SP'],
    status: 'Ativo'
  },
  {
    id: 'roberto.fonseca',
    name: 'Roberto Fonseca',
    email: 'roberto@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Diretor(a) de Wealth Management',
    department: 'Comitê Estratégico',
    leadsAreas: [],
    accessAreas: ['TNA-RJ 2', 'TNA-RJ 4', 'Atendimento', 'Estruturado', 'Operacional', 'Legal', 'Sistemas', 'Administrativo', 'Investimentos', 'Risco', 'Comitê de Operações', 'TI', 'Comitê Estratégico', 'Compliance', 'Movimentações', 'TNA-SP'],
    status: 'Ativo',
    managerId: 'ricardo.taboaco'
  },
  {
    id: 'rodrigo.garcia',
    name: 'Rodrigo Garcia',
    email: 'rodrigo@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Líder Compliance',
    department: 'Compliance',
    leadsAreas: ['Compliance', 'Movimentação'],
    accessAreas: ['Compliance'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'rodrigo.trindade',
    name: 'Rodrigo Trindade',
    email: 'rodrigo.trindade@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Processos',
    department: 'Sistemas',
    leadsAreas: [],
    accessAreas: ['TNA-RJ 2', 'TNA-RJ 4', 'Atendimento', 'Estruturado', 'Operacional', 'Legal', 'Sistemas', 'Administrativo', 'Investimentos', 'Risco', 'Comitê de Operações', 'TI', 'Comitê Estratégico', 'Compliance', 'Movimentações', 'TNA-SP'],
    status: 'Ativo',
    managerId: 'patricia.marinho',
    peerIds: ['bernardo.machado']
  },
  {
    id: 'sigrid.guimaraes',
    name: 'Sigrid Guimarães',
    email: 'sigrid@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Diretor(a) Operacional',
    department: 'Comitê de Operações',
    leadsAreas: ['Marketing'],
    accessAreas: ['Comitê de Operações'],
    status: 'Ativo',
    managerId: 'ricardo.taboaco'
  },
  {
    id: 'talita.resende',
    name: 'Talita Rezende',
    email: 'talita.resende@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Operacional',
    department: 'Operacional',
    leadsAreas: [],
    accessAreas: ['Operacional'],
    status: 'Ativo',
    managerId: 'rafael.pasqua'
  },
  {
    id: 'thiago.pereira',
    name: 'Thiago Pereira',
    email: 'thiago.pereira@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Líder Risco',
    department: 'Risco',
    leadsAreas: ['Risco'],
    accessAreas: ['Risco'],
    status: 'Ativo',
    managerId: 'hans.boehme'
  },
  {
    id: 'veronica.nieckele',
    name: 'Veronica Nieckele',
    email: 'verinica@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Diretor(a) de Wealth Management',
    department: 'Comitê Estratégico',
    leadsAreas: ['Comitê de Operações'],
    accessAreas: ['TNA-RJ 2', 'TNA-RJ 4', 'Atendimento', 'Estruturado', 'Operacional', 'Legal', 'Sistemas', 'Administrativo', 'Investimentos', 'Risco', 'Comitê de Operações', 'TI', 'Comitê Estratégico', 'Compliance', 'Movimentações', 'TNA-SP'],
    status: 'Ativo',
    managerId: 'ricardo.taboaco'
  },
  {
    id: 'yan.saraiva',
    name: 'Yan Saraiva',
    email: 'yan.saraiva@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista Movimentação',
    department: 'Movimentação',
    leadsAreas: [],
    accessAreas: ['Movimentações'],
    status: 'Ativo',
    managerId: 'rodrigo.garcia'
  },
  {
    id: 'rodrigo.albuquerque',
    name: 'Rodrigo Albuquerque',
    email: 'rodrigo.albuquerque@tna.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Wealth Management',
    department: 'TNA  Parceiro',
    leadsAreas: [],
    accessAreas: ['TNA-RJ 2'],
    status: 'Ativo'
  },
  {
    id: 'andre.poppe',
    name: 'Andre Poppe',
    email: 'andre.poppe@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Risco',
    department: 'Risco',
    leadsAreas: [],
    accessAreas: ['Risco'],
    status: 'Ativo',
    managerId: 'thiago.pereira'
  },
  {
    id: 'bruno.silvestre',
    name: 'Bruno Silvestre',
    email: 'bruno.silvestre@alocc.com.br',
    company: 'Alocc Gestão Patrimonial',
    role: 'Analista de Risco',
    department: 'Risco',
    leadsAreas: [],
    accessAreas: ['Risco'],
    status: 'Ativo',
    managerId: 'thiago.pereira'
  }
];

// Exportar nós com nome configurável
export const orgChartNodes: OrgNode[] = orgChartDataRaw.map(node => createOrgNode(node));
export function getNodeById(id: string): OrgNode | undefined {
  return orgChartNodes.find(node => node.id === id);
}

export function getNodeByEmail(email: string): OrgNode | undefined {
  return orgChartNodes.find(node => node.email.toLowerCase() === email.toLowerCase());
}

export function getManager(nodeId: string): OrgNode | undefined {
  const node = getNodeById(nodeId);
  if (!node || !node.managerId) return undefined;
  return getNodeById(node.managerId);
}

export function getPeers(nodeId: string): OrgNode[] {
  const node = getNodeById(nodeId);
  if (!node) return [];
  
  // Prioridade 1: peerIds explícitos definidos no nó
  if (node.peerIds && node.peerIds.length > 0) {
    return node.peerIds
      .map(id => getNodeById(id))
      .filter((n): n is OrgNode => n !== undefined);
  }
  
  // Prioridade 2: pessoas no mesmo departamento com o mesmo gestor
  return orgChartNodes.filter(n => 
    n.id !== nodeId &&
    n.department === node.department &&
    n.managerId === node.managerId
  );
}

export function getSubordinates(nodeId: string): OrgNode[] {
  return orgChartNodes.filter(n => n.managerId === nodeId);
}

export function getLeaders(): OrgNode[] {
  return orgChartNodes.filter(n => n.leadsAreas.length > 0);
}

export function getByDepartment(department: string): OrgNode[] {
  return orgChartNodes.filter(n => n.department === department);
}
