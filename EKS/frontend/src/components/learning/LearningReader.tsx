"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Send,
  Sparkles,
  Network
} from "lucide-react";

// Mock do conteúdo do livro (capítulo de exemplo)
const CHAPTER_CONTENT = `
# Capítulo 5: Taxonomia, Ontologia e Knowledge Graph

## 5.1 Taxonomia — classificar é o primeiro passo

Uma **taxonomia** é uma estrutura hierárquica de classificação. É o modelo mais simples de organização do conhecimento: categorias e subcategorias.

Taxonomias são úteis. Elas criam ordem onde havia caos. Todo sistema de pastas, todo menu de navegação, toda classificação de produtos é uma taxonomia.

Mas taxonomias têm uma limitação fundamental: elas só expressam **relações hierárquicas** (é-um, pertence-a). No mundo real, as relações entre conceitos são muito mais ricas do que "A é subcategoria de B".

Uma pessoa *pertence a* um departamento, mas também *gerencia* projetos, *participa de* reuniões, *é responsável por* decisões, e *possui* competências. Uma taxonomia não captura nada disso.

## 5.2 Ontologia — estruturar é o segundo

Uma **ontologia** vai além da taxonomia porque define não apenas a hierarquia de classes, mas também:

- **Relações arbitrárias** entre classes (não apenas "é-um")
- **Propriedades** de cada classe (atributos e seus tipos)
- **Restrições** (cardinalidade, domínio, alcance)
- **Axiomas** (regras lógicas que devem ser verdadeiras)

Enquanto uma taxonomia diz "Gerente é um tipo de Pessoa", uma ontologia diz:

- Gerente é uma Pessoa
- Gerente gerencia exatamente um Departamento
- Gerente pode ter zero ou mais Subordinados diretos
`;

interface LearningReaderProps {
  chapterTitle?: string;
  onBack?: () => void;
}

export function LearningReader({ chapterTitle = "Capítulo 5: Taxonomia vs Ontologia", onBack }: LearningReaderProps) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "graph" | "notes">("chat");
  const [selectedText, setSelectedText] = useState<string | null>(null);

  // Simulação de chat
  const [messages, setMessages] = useState([
    { role: "agent", content: "Olá! Sou seu Tutor Ontológico. Estou lendo este capítulo com você. Se tiver dúvidas sobre a diferença entre Taxonomia e Ontologia, é só perguntar!" }
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    setMessages([...messages, { role: "user", content: inputMessage }]);
    setInputMessage("");
    
    // Simulação de resposta (demo)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "agent", 
        content: "Excelente pergunta. No contexto do EKS, usamos Ontologias justamente para capturar essas relações ricas. Veja no painel 'Grafo' como isso é representado visualmente." 
      }]);
      setActiveTab("graph");
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      
      {/* Área de Leitura (Esquerda/Centro) */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 relative",
        showSidebar ? "mr-0" : "mr-0"
      )}>
        
        {/* Topbar de Leitura */}
        <div className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="font-semibold text-lg">{chapterTitle}</h1>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Learning Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted rounded-full text-muted-foreground" title="Buscar">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-muted rounded-full text-muted-foreground" title="Marcar página">
              <Bookmark className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-border mx-2" />
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className={cn(
                "p-2 rounded-full transition-colors",
                showSidebar ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
              )}
              title="Toggle Sidebar"
            >
              {showSidebar ? <Maximize2 className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Conteúdo do Livro */}
        <div className="flex-1 overflow-y-auto px-[15%] py-12">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: CHAPTER_CONTENT.replace(/\n/g, '<br />').replace(/# (.*)/, '<h1 class="text-3xl font-bold mb-6">$1</h1>').replace(/## (.*)/, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>') 
            }} />
          </div>
          
          {/* Navegação de Capítulos */}
          <div className="flex justify-between mt-20 pt-8 border-t">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
              <span>Capítulo Anterior</span>
            </button>
            <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
              <span>Próximo: Lógica Formal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Contextual (Direita) */}
      <div className={cn(
        "w-[400px] border-l bg-muted/10 flex flex-col transition-all duration-300 transform",
        showSidebar ? "translate-x-0" : "translate-x-full w-0 border-l-0"
      )}>
        
        {/* Tabs da Sidebar */}
        <div className="flex items-center border-b bg-card">
          <button 
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
              activeTab === "chat" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Tutor
          </button>
          <button 
            onClick={() => setActiveTab("graph")}
            className={cn(
              "flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
              activeTab === "graph" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Network className="w-4 h-4" />
            Grafo Vivo
          </button>
          <button 
            onClick={() => setActiveTab("notes")}
            className={cn(
              "flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
              activeTab === "notes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="w-4 h-4" />
            Notas
          </button>
        </div>

        {/* Conteúdo da Sidebar */}
        <div className="flex-1 overflow-hidden flex flex-col">
          
          {/* CHAT MODE */}
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn(
                    "flex gap-3 max-w-[90%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      msg.role === "agent" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {msg.role === "agent" ? <Sparkles className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full bg-current" />}
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm",
                      msg.role === "agent" ? "bg-card border shadow-sm" : "bg-primary text-primary-foreground"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t bg-card">
                <div className="relative">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Pergunte sobre o texto..."
                    className="w-full bg-muted/50 border-0 rounded-full pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* GRAPH MODE (META-VIEW) */}
          {activeTab === "graph" && (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b bg-card/50">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Network className="w-4 h-4 text-primary" />
                  Visualização em Tempo Real
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Este grafo é gerado a partir dos dados reais do EKS, ilustrando o conceito de <strong>Hierarquia vs Rede</strong>.
                </p>
              </div>
              <div className="flex-1 bg-slate-950 flex items-center justify-center relative overflow-hidden group">
                {/* Mock Visual do Grafo */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-slate-950" />
                
                {/* Nós Mockados */}
                <div className="relative z-10 animate-pulse">
                  <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-4 border-slate-900 shadow-xl shadow-blue-500/20">
                    Dept
                  </div>
                  <div className="absolute top-20 right-20 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold border-4 border-slate-900">
                    Proj
                  </div>
                  <div className="absolute bottom-10 left-10 w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold border-4 border-slate-900">
                    Pessoa
                  </div>
                  
                  {/* Linhas (SVG) */}
                  <svg className="absolute top-0 left-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2 overflow-visible pointer-events-none">
                    <line x1="0" y1="0" x2="100" y2="80" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" />
                    <line x1="0" y1="0" x2="-40" y2="100" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" />
                  </svg>
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur rounded-lg p-3 text-xs border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-slate-300">Departamento (Hierarquia)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-slate-300">Pessoa (Conexão Transversal)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTES MODE */}
          {activeTab === "notes" && (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="font-medium text-foreground mb-1">Caderno de Estudos</h3>
              <p className="text-sm max-w-[200px]">
                Seus destaques e anotações aparecerão aqui. Selecione o texto para começar.
              </p>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
