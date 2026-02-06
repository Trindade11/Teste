#!/usr/bin/env python3
"""
Script para testar e refinar o prompt de extração de entidades de reuniões.
Permite iterar rapidamente no prompt sem usar o frontend.

Uso:
    python test_extraction_prompt.py [--model gpt-4o-mini|o4-mini]
"""

import os
import json
import time
import argparse
from pathlib import Path
from dotenv import load_dotenv
import httpx

# Carregar variáveis de ambiente
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# Configurações dos modelos disponíveis
MODELS = {
    "gpt-4o-mini": {
        "endpoint": os.getenv("AZURE_OPENAI_ENDPOINT"),
        "key": os.getenv("AZURE_OPENAI_KEY"),
        "deployment": os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
        "api_version": os.getenv("AZURE_OPENAI_API_VERSION"),
    },
    "o4-mini": {
        "endpoint": os.getenv("AZURE_OPENAI_ENDPOINT_o4-mini"),
        "key": os.getenv("AZURE_OPENAI_KEY_o4-mini"),
        "deployment": os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME_o4-mini"),
        "api_version": os.getenv("AZURE_OPENAI_API_VERSION_o4-mini"),
    },
}

# ============================================================================
# PROMPT DE EXTRAÇÃO - EDITE AQUI PARA REFINAR
# ============================================================================
EXTRACTION_PROMPT = """Você é um analista sênior de inteligência organizacional. Sua missão é extrair ABSOLUTAMENTE TUDO de relevante desta transcrição de reunião.

IMPORTANTE: Seja EXAUSTIVO. É melhor extrair demais do que de menos. Esta extração servirá como memória organizacional permanente.

## ESTRUTURA DE SAÍDA (JSON)

### 1. RESUMO EXECUTIVO (summary)
Resumo DETALHADO com 300-500 palavras cobrindo:
- Objetivo e contexto da reunião
- Todos os pontos principais discutidos
- Decisões tomadas
- Próximos passos definidos

### 2. TÓPICOS PRINCIPAIS (keyTopics) - MÍNIMO 8 TÓPICOS
Para CADA assunto substantivo discutido:
- topic: nome do tópico (2-5 palavras)
- description: explicação detalhada (3-4 frases)
- relevance: 0.0 a 1.0

### 3. DECISÕES (decisions) - EXTRAIA TODAS
Qualquer escolha, definição ou direcionamento tomado:
- value: a decisão (máx 15 palavras)
- description: contexto completo, motivação, alternativas (mín 60 palavras)
- relatedPerson: quem decidiu
- relatedArea: área impactada
- impact: impacto esperado
- confidence: 0.6-1.0

PROCURE por frases como:
- "Vamos usar/fazer/adotar X"
- "A estratégia/direção é"
- "Decidimos/definimos que"
- "Não vamos fazer X"
- "O foco vai ser"
- "A plataforma será"

### 4. TAREFAS (tasks) - EXTRAIA TODAS
Qualquer ação necessária ou atribuída:
- value: título da tarefa
- description: detalhamento completo (mín 50 palavras)
- assignee: responsável (se identificável)
- relatedArea: área envolvida
- deadline: prazo (se mencionado)
- priority: high/medium/low
- confidence: 0.6-1.0

PROCURE por:
- "Precisamos/temos que fazer"
- "Você fica de/vai fazer"
- "Vou verificar/levantar/agendar"
- "A partir de [data]"
- "O próximo passo é"

### 5. ACTION ITEMS (action_items) - COM RESPONSÁVEL
Ações específicas com dono claro:
- value: ação específica
- description: detalhamento
- assignee: responsável (OBRIGATÓRIO)
- deadline: prazo
- priority: urgência
- confidence: 0.7-1.0

### 6. RISCOS (risks) - EXTRAIA TODOS
Problemas, preocupações, limitações ou ameaças:
- value: título do risco
- description: descrição completa, causas, consequências, mitigações (mín 60 palavras)
- relatedPerson: quem levantou
- relatedArea: área afetada
- priority: high/medium/low
- impact: impacto potencial
- confidence: 0.6-1.0

PROCURE por:
- "O problema/desafio é"
- "A dificuldade/limitação"
- "Isso afasta/prejudica"
- "Falta de X"
- "Não conseguimos/não temos"
- "Governança dificulta"

### 7. INSIGHTS (insights) - EXTRAIA TODOS
Aprendizados, oportunidades, observações estratégicas:
- value: título do insight
- description: explicação completa, importância, aplicação (mín 60 palavras)
- relatedPerson: quem contribuiu
- relatedArea: área beneficiada
- impact: impacto potencial
- confidence: 0.6-1.0

PROCURE por:
- "O que funciona/funcionou bem"
- "Uma oportunidade seria"
- "Aprendemos/percebemos que"
- "O mercado/cliente quer"
- "A vantagem é"
- "Transferência de conhecimento"

### 8. ENTIDADES MENCIONADAS (mentioned_entities)
Pessoas EXTERNAS, empresas, produtos, ferramentas, clientes:
- value: nome exato
- entityType: person_external | organization | product | tool | client
- description: contexto da menção
- mentions: vezes citado
- confidence: 0.6-1.0

EXTRAIR:
- Clientes potenciais (ex: Pirelli)
- Produtos discutidos (ex: Maverick, OneOps)
- Especialistas externos (ex: Rafael, Bruno)
- Ferramentas específicas (ex: Notion, Monday, Gemini, ChatGPT)
- Empresas parceiras/concorrentes

NÃO EXTRAIR:
- Participantes da reunião
- Projeto/empresa do contexto

## METAS DE EXTRAÇÃO (seja agressivo)
- Decisões: mínimo 4
- Tasks + Action Items: mínimo 5
- Riscos: mínimo 3
- Insights: mínimo 4
- Entidades: mínimo 5

Se a reunião for substantiva, você deve encontrar MAIS que isso.

Responda APENAS com JSON válido.

TRANSCRIÇÃO:
"""


def parse_vtt(vtt_content: str) -> str:
    """Extrai texto limpo de arquivo VTT."""
    lines = vtt_content.split('\n')
    transcript_parts = []
    current_speaker = None
    
    for line in lines:
        line = line.strip()
        if not line or line == 'WEBVTT':
            continue
        if '-->' in line:
            continue
        if line.startswith('<v '):
            # Extrai speaker e texto
            end_tag = line.find('>')
            if end_tag > 0:
                speaker = line[3:end_tag]
                text = line[end_tag+1:].replace('</v>', '').strip()
                if speaker != current_speaker:
                    current_speaker = speaker
                    transcript_parts.append(f"\n{speaker}: {text}")
                else:
                    transcript_parts.append(text)
        elif not any(c.isdigit() and '-' in line for c in line[:10]):
            # Linha de texto sem tag de speaker
            if line and not line[0].isdigit():
                transcript_parts.append(line)
    
    return ' '.join(transcript_parts)


def call_azure_openai(transcript: str, model_name: str = "gpt-4o-mini") -> dict:
    """Chama Azure OpenAI com o prompt de extração."""
    config = MODELS.get(model_name)
    if not config:
        raise ValueError(f"Modelo '{model_name}' não configurado. Use: {list(MODELS.keys())}")
    
    url = f"{config['endpoint']}/openai/deployments/{config['deployment']}/chat/completions?api-version={config['api_version']}"
    
    headers = {
        "Content-Type": "application/json",
        "api-key": config['key'],
    }
    
    payload = {
        "messages": [
            {
                "role": "system",
                "content": "Você é um assistente especializado em extrair conhecimento estruturado de reuniões."
            },
            {
                "role": "user", 
                "content": EXTRACTION_PROMPT + transcript
            }
        ],
        "temperature": 0.3,
        "max_tokens": 8000,
        "response_format": {"type": "json_object"}
    }
    
    print(f"\n🚀 Chamando Azure OpenAI ({model_name})...")
    print(f"   Endpoint: {config['endpoint']}")
    print(f"   Deployment: {config['deployment']}")
    
    start_time = time.time()
    
    with httpx.Client(timeout=120.0) as client:
        response = client.post(url, headers=headers, json=payload)
        response.raise_for_status()
    
    elapsed = time.time() - start_time
    print(f"   ⏱️  Tempo: {elapsed:.2f}s")
    
    result = response.json()
    content = result['choices'][0]['message']['content']
    
    return json.loads(content)


def analyze_extraction(result: dict) -> None:
    """Analisa e exibe estatísticas da extração."""
    print("\n" + "="*80)
    print("📊 ANÁLISE DA EXTRAÇÃO")
    print("="*80)
    
    # Summary - pode ser string ou dict
    summary = result.get('summary', '')
    if isinstance(summary, dict):
        summary = summary.get('text', str(summary))
    summary_str = str(summary)
    print(f"\n📝 RESUMO: {len(summary_str)} caracteres, {len(summary_str.split())} palavras")
    if len(summary_str.split()) < 200:
        print("   ⚠️  ALERTA: Resumo muito curto (mínimo 200 palavras)")
    print(f"\n{summary_str[:500]}...")
    
    # Key Topics
    topics = result.get('keyTopics', [])
    print(f"\n📌 TÓPICOS: {len(topics)}")
    for t in topics:
        desc_len = len(t.get('description', ''))
        print(f"   - {t.get('topic', 'N/A')} (relevance: {t.get('relevance', 0):.0%}, desc: {desc_len} chars)")
    
    # Entities
    entity_types = ['decisions', 'tasks', 'action_items', 'risks', 'insights', 'mentioned_entities']
    
    print(f"\n🎯 ENTIDADES EXTRAÍDAS:")
    total_entities = 0
    
    for etype in entity_types:
        entities = result.get(etype, [])
        count = len(entities)
        total_entities += count
        icon = {"decisions": "🔨", "tasks": "📋", "action_items": "✅", "risks": "⚠️", "insights": "💡", "mentioned_entities": "🏷️"}.get(etype, "•")
        print(f"\n   {icon} {etype.upper()}: {count}")
        
        for e in entities:
            value = e.get('value', 'N/A')[:60]
            conf = e.get('confidence', 0)
            assignee = e.get('assignee', '')
            person = e.get('relatedPerson', '')
            responsible = assignee or person
            resp_str = f" [{responsible}]" if responsible else ""
            print(f"      • {value}{resp_str} (conf: {conf:.0%})")
    
    print(f"\n📈 TOTAL DE ENTIDADES: {total_entities}")
    
    # Alertas
    print("\n⚠️  ALERTAS:")
    if len(result.get('decisions', [])) == 0:
        print("   - NENHUMA DECISÃO extraída - revisar prompt")
    if len(result.get('tasks', [])) + len(result.get('action_items', [])) < 3:
        print("   - Poucas tarefas/ações extraídas - revisar prompt")
    if len(result.get('risks', [])) == 0:
        print("   - NENHUM RISCO extraído - revisar prompt")


def save_result(result: dict, output_path: str) -> None:
    """Salva resultado em arquivo JSON."""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Resultado salvo em: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Testar prompt de extração de reuniões")
    parser.add_argument("--model", default="gpt-4o-mini", choices=list(MODELS.keys()),
                        help="Modelo a usar (default: gpt-4o-mini)")
    parser.add_argument("--vtt", default="../CoCreateAI - MOVE.vtt",
                        help="Caminho para arquivo VTT")
    parser.add_argument("--output", default="extraction_result.json",
                        help="Arquivo de saída")
    args = parser.parse_args()
    
    # Resolver caminhos
    script_dir = Path(__file__).parent
    vtt_path = script_dir / args.vtt
    output_path = script_dir / args.output
    
    print("="*80)
    print("🧪 TESTE DE EXTRAÇÃO DE REUNIÃO")
    print("="*80)
    print(f"📄 Arquivo: {vtt_path}")
    print(f"🤖 Modelo: {args.model}")
    
    # Ler e parsear VTT
    if not vtt_path.exists():
        print(f"❌ Arquivo não encontrado: {vtt_path}")
        return
    
    vtt_content = vtt_path.read_text(encoding='utf-8')
    transcript = parse_vtt(vtt_content)
    
    print(f"📊 Transcrição: {len(transcript)} caracteres")
    
    # Chamar API
    try:
        result = call_azure_openai(transcript, args.model)
        
        # Analisar resultado
        analyze_extraction(result)
        
        # Salvar
        save_result(result, str(output_path))
        
        print("\n" + "="*80)
        print("✅ TESTE CONCLUÍDO - Edite EXTRACTION_PROMPT no script e rode novamente")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
