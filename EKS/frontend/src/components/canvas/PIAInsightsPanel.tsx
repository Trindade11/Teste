import React from 'react';
import { CheckCircle2, AlertCircle, Clock, TrendingUp, Users, Zap } from 'lucide-react';

export const PIAInsightsPanel: React.FC = () => {
  const alignmentScore = 85;
  
  const implementedFeatures = [
    { name: 'Mapa Vivo da Empresa', status: 'implemented', score: 100 },
    { name: 'Fluxo Macro → Micro', status: 'implemented', score: 100 },
    { name: 'Processos Multi-Área', status: 'implemented', score: 100, highlight: 'Gap Resolvido' },
    { name: 'Validação de Handoffs', status: 'implemented', score: 100 },
    { name: 'Integração com Onboarding', status: 'implemented', score: 100 },
    { name: 'Agente Coletor', status: 'implemented', score: 100 },
    { name: 'Visualização Mermaid', status: 'implemented', score: 100, highlight: 'Melhor que BPMN' },
  ];

  const pendingFeatures = [
    { name: 'Agente Analista', status: 'specified', score: 50, priority: 1 },
    { name: 'Ressonância Semântica', status: 'planned', score: 0, priority: 2 },
    { name: 'Agente Monitor', status: 'planned', score: 0, priority: 3 },
  ];

  const gaps = [
    { 
      title: 'Conflitos Entre Usuários',
      description: 'Resolver descrições conflitantes de processos',
      status: 'not_resolved',
      priority: 'high'
    },
    { 
      title: 'Processos Sombra',
      description: 'Detectar workflows reais vs documentados',
      status: 'planned',
      priority: 'medium'
    },
    { 
      title: 'Extração de Regras',
      description: 'NLP para business rules automáticas',
      status: 'specified',
      priority: 'high'
    },
  ];

  const opportunities = [
    { 
      title: 'Auto-Documentação',
      description: 'Exportar PDF/Markdown do processo',
      impact: 'high'
    },
    { 
      title: 'Campeões de Processo',
      description: 'Identificar top contributors',
      impact: 'medium'
    },
    { 
      title: 'Sugestão de Padronização',
      description: 'Detectar processos similares',
      impact: 'high'
    },
  ];

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Análise de Alinhamento PIA
              </h1>
              <p className="text-slate-600">
                Validação da implementação contra documentação original
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-emerald-600 mb-1">
                {alignmentScore}%
              </div>
              <div className="text-sm text-slate-500">Alinhamento Geral</div>
            </div>
          </div>
        </div>

        {/* Scorecard Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Implementado */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Implementado</h2>
                <p className="text-sm text-slate-500">7 de 10 aspectos</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {implementedFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{feature.name}</div>
                    {feature.highlight && (
                      <div className="text-xs text-emerald-600 font-semibold mt-1">
                        ⭐ {feature.highlight}
                      </div>
                    )}
                  </div>
                  <div className="text-emerald-600 font-bold">{feature.score}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pendente */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-amber-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Pendente</h2>
                <p className="text-sm text-slate-500">3 de 10 aspectos</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {pendingFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{feature.name}</div>
                    <div className="text-xs text-amber-600 mt-1">
                      Prioridade {feature.priority}
                    </div>
                  </div>
                  <div className="text-amber-600 font-bold">{feature.score}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Estratégicos */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 border border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Insights Estratégicos</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur rounded-lg p-4">
              <div className="font-bold text-blue-900 mb-2">1. Curador é o Epicentro</div>
              <p className="text-sm text-slate-700">
                Humano insubstituível para visão estratégica macro, resolução de ambiguidades e decisões de negócio.
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur rounded-lg p-4">
              <div className="font-bold text-blue-900 mb-2">2. Visualização Acelera Validação</div>
              <p className="text-sm text-slate-700">
                Mermaid em tempo real é game changer. Curador vê gaps instantaneamente.
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur rounded-lg p-4">
              <div className="font-bold text-blue-900 mb-2">3. Multi-Área é a Norma</div>
              <p className="text-sm text-slate-700">
                80% dos processos são multi-área. Design para complexidade real, não simplicidade artificial.
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur rounded-lg p-4">
              <div className="font-bold text-blue-900 mb-2">4. Ressonância &gt; Gamificação</div>
              <p className="text-sm text-slate-700">
                Conexão semântica é motivação intrínseca forte. Pontos/badges são motivação extrínseca fraca.
              </p>
            </div>
          </div>
        </div>

        {/* Gaps Identificados */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Gaps Identificados</h2>
          </div>
          
          <div className="space-y-3">
            {gaps.map((gap, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-bold text-slate-900">{gap.title}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      gap.priority === 'high' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {gap.priority === 'high' ? 'Alta' : 'Média'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{gap.description}</p>
                </div>
                <div className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                  gap.status === 'not_resolved' 
                    ? 'bg-red-100 text-red-700'
                    : gap.status === 'specified'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {gap.status === 'not_resolved' ? 'Não Resolvido' : 
                   gap.status === 'specified' ? 'Especificado' : 'Planejado'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Oportunidades */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Oportunidades Futuras</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {opportunities.map((opp, idx) => (
              <div key={idx} className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-bold text-purple-900">{opp.title}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    opp.impact === 'high' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-purple-200 text-purple-700'
                  }`}>
                    {opp.impact === 'high' ? 'Alto' : 'Médio'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{opp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Próximos Passos */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Recomendações Prioritárias</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <div className="text-lg font-bold mb-2">1. PIA Analyst</div>
              <p className="text-sm text-emerald-50 mb-3">
                Validação automática de handoffs é crítica para qualidade
              </p>
              <div className="text-xs text-emerald-200">Prazo: 1 semana</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <div className="text-lg font-bold mb-2">2. Ressonância Básica</div>
              <p className="text-sm text-emerald-50 mb-3">
                Diferencial do EKS. Motivação intrínseca.
              </p>
              <div className="text-xs text-emerald-200">Prazo: 3 dias</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
              <div className="text-lg font-bold mb-2">3. Resolução de Conflitos</div>
              <p className="text-sm text-emerald-50 mb-3">
                Gap crítico não resolvido da spec original
              </p>
              <div className="text-xs text-emerald-200">Prazo: 1 semana</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
