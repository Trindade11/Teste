'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Globe,
  Search,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Download,
  FolderKanban,
  X,
  Eye,
  AlertTriangle,
  Users,
  Building2,
  Shield,
} from 'lucide-react';
import { api } from '../../lib/api';

interface DiscoveredPage {
  url: string;
  title: string;
  level: number;
  sizeKb?: number;
}

interface DiscoveredPdf {
  url: string;
  filename: string;
  sizeKb?: number;
}

interface SitePreview {
  rootUrl: string;
  rootTitle: string;
  domain: string;
  pages: DiscoveredPage[];
  pdfs: DiscoveredPdf[];
  stats: {
    totalPages: number;
    totalPdfs: number;
    estimatedKb: number;
  };
}

const MAX_SELECTED_MB = 30;

interface LinkableProject {
  id: string;
  name: string;
}

const VISIBILITY_OPTIONS = [
  {
    value: 'individual',
    label: 'Individual',
    description: 'Só você acessa e valida',
    icon: Users,
    color: 'border-gray-400 bg-gray-50',
    activeColor: 'border-gray-600 bg-gray-100',
  },
  {
    value: 'department',
    label: 'Área/Depto',
    description: 'Visível para a equipe — gestor revisa',
    icon: Building2,
    color: 'border-blue-300 bg-blue-50',
    activeColor: 'border-blue-500 bg-blue-100',
  },
  {
    value: 'corporate',
    label: 'Corporativo',
    description: 'Toda a empresa — diretoria revisa',
    icon: Shield,
    color: 'border-purple-300 bg-purple-50',
    activeColor: 'border-purple-500 bg-purple-100',
  },
];

export default function WebIngest() {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState(1);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<SitePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [selectedPdfs, setSelectedPdfs] = useState<Set<string>>(new Set());
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([0, 1]));

  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projects, setProjects] = useState<LinkableProject[]>([]);
  
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  
  const [selectedOkrs, setSelectedOkrs] = useState<string[]>([]);
  const [okrs, setOkrs] = useState<any[]>([]);
  
  const [availableOkrs, setAvailableOkrs] = useState<any[]>([]);
  
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [visibility, setVisibility] = useState<string>('corporate');

  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<any>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);

  // Filter OKRs based on selected objectives
  useEffect(() => {
    if (selectedObjectives.length === 0) {
      setAvailableOkrs([]);
      setSelectedOkrs([]);
      return;
    }
    
    const relatedOkrs = okrs.filter((okr: any) => 
      okr.objectiveId && selectedObjectives.includes(okr.objectiveId)
    );
    setAvailableOkrs(relatedOkrs);
    
    // Remove selected OKRs that are no longer available
    setSelectedOkrs(prev => prev.filter(okrId => 
      relatedOkrs.some(okr => okr.id === okrId)
    ));
  }, [selectedObjectives, okrs]);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const [projRes, okrRes, objRes] = await Promise.all([
        api.getProjects(),
        api.getOkrsList(),
        api.getObjectivesList()
      ]);
      
      if (projRes.success && projRes.data) {
        setProjects((projRes.data as any[]).map((p: any) => ({ id: p.id, name: p.name })));
      }
      if (okrRes.success && okrRes.data) {
        setOkrs(okrRes.data as any[]);
      }
      if (objRes.success && objRes.data) {
        setObjectives(objRes.data as any[]);
      }
    } catch {
      /* noop */
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handlePreview = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      setPreviewError('URL inválida. Inclua http:// ou https://');
      return;
    }

    setIsPreviewing(true);
    setPreviewError(null);
    setPreview(null);
    setSelectedPages(new Set());
    setSelectedPdfs(new Set());
    setIngestResult(null);

    try {
      const res = await api.previewWebSite(trimmed, depth);
      if (res.success) {
        const previewData = res as unknown as SitePreview;
        setPreview(previewData);
        
        // Auto-selecionar somente a página raiz para evitar ingestões pesadas por padrão
        const initialSelection = new Set<string>();
        
        previewData.pages?.forEach((p: DiscoveredPage) => {
          // Sempre seleciona a raiz
          if (p.level === 0) {
            initialSelection.add(p.url);
          }
        });
        
        setSelectedPages(initialSelection);
      } else {
        setPreviewError((res as any).error || 'Falha ao mapear o site');
      }
    } catch (e: any) {
      setPreviewError(e?.message || 'Erro ao conectar com o servidor');
    } finally {
      setIsPreviewing(false);
    }
  };

  const togglePage = (pageUrl: string) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageUrl)) next.delete(pageUrl);
      else next.add(pageUrl);
      return next;
    });
  };

  const togglePdf = (pdfUrl: string) => {
    setSelectedPdfs((prev) => {
      const next = new Set(prev);
      if (next.has(pdfUrl)) next.delete(pdfUrl);
      else next.add(pdfUrl);
      return next;
    });
  };

  const selectAllPages = () => {
    if (!preview) return;
    if (selectedPages.size === preview.pages.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(preview.pages.map((p) => p.url)));
    }
  };

  const groupedPages = React.useMemo(() => {
    if (!preview) return {};
    const groups: Record<number, DiscoveredPage[]> = {};
    for (const p of preview.pages) {
      if (!groups[p.level]) groups[p.level] = [];
      groups[p.level].push(p);
    }
    return groups;
  }, [preview]);

  const formatSize = (kb?: number) => {
    if (!kb) return 'Desconhecido';
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const selectedPagesList = preview?.pages.filter(p => selectedPages.has(p.url)) || [];
  const selectedPdfsList = preview?.pdfs.filter(p => selectedPdfs.has(p.url)) || [];

  const totalSelectedKb = 
    selectedPagesList.reduce((acc, p) => acc + (p.sizeKb || 0), 0) +
    selectedPdfsList.reduce((acc, p) => acc + (p.sizeKb || 0), 0);

  const totalSelectedMb = totalSelectedKb / 1024;
  const estimatedMb = totalSelectedMb.toFixed(2);
  const sizeWarning = totalSelectedKb > 10240; // 10MB warning
  const exceedsHardLimit = totalSelectedMb > MAX_SELECTED_MB;

  // Estimativa rústica: ~15 seg por 100KB de texto + 10 seg por PDF (overhead de extração)
  const estimatedSeconds = Math.ceil((totalSelectedKb / 100) * 15) + (selectedPdfsList.length * 10);
  const estimatedTimeStr = estimatedSeconds > 60 
    ? `~${Math.ceil(estimatedSeconds / 60)} min` 
    : `~${estimatedSeconds} seg`;

  const handleIngest = async () => {
    if (!preview || selectedPages.size === 0) return;

    if (exceedsHardLimit) {
      setIngestError(
        `Total selecionado (${estimatedMb} MB) excede o limite de ${MAX_SELECTED_MB} MB. Remova páginas/PDFs antes de ingerir.`
      );
      return;
    }

    setIsIngesting(true);
    setIngestError(null);
    setIngestResult(null);

    const pageLevels: Record<string, number> = {};
    preview.pages.forEach((p) => {
      pageLevels[p.url] = p.level;
    });

    try {
      const res = await api.ingestWebSite({
        url: preview.rootUrl,
        title: preview.rootTitle,
        selectedPages: Array.from(selectedPages),
        downloadPdfs: selectedPdfs.size > 0,
        selectedPdfs: Array.from(selectedPdfs),
        projectIds: selectedProjects.length > 0 ? selectedProjects : undefined,
        objectiveIds: selectedObjectives.length > 0 ? selectedObjectives : undefined,
        okrIds: selectedOkrs.length > 0 ? selectedOkrs : undefined,
        pageLevels,
        visibility,
        previewData: preview, // Send preview data for size validation
      });

      if (res.success) {
        setIngestResult(res);
      } else {
        setIngestError((res as any).error || 'Falha na ingestão');
      }
    } catch (e: any) {
      setIngestError(e?.message || 'Erro ao conectar com o servidor');
    } finally {
      setIsIngesting(false);
    }
  };

  const resetAll = () => {
    setUrl('');
    setPreview(null);
    setPreviewError(null);
    setSelectedPages(new Set());
    setSelectedPdfs(new Set());
    setSelectedProjects([]);
    setSelectedObjectives([]);
    setSelectedOkrs([]);
    setIngestResult(null);
    setIngestError(null);
  };

  if (ingestResult) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
          <h2 className="text-xl font-semibold text-gray-900">Ingestão concluída!</h2>
          <p className="text-sm text-gray-500 text-center">
            {ingestResult.pageCount} página(s) ingeridas de{' '}
            <span className="font-medium">{ingestResult.domain}</span>
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Entidades extraídas</span>
            <span className="font-medium text-gray-900">
              Tasks: {ingestResult.extractedEntities?.tasks ?? 0} · Decisões:{' '}
              {ingestResult.extractedEntities?.decisions ?? 0} · Riscos:{' '}
              {ingestResult.extractedEntities?.risks ?? 0} · Insights:{' '}
              {ingestResult.extractedEntities?.insights ?? 0}
            </span>
          </div>
          {ingestResult.pages?.map((p: any) => (
            <div key={p.url} className="flex justify-between text-xs text-gray-500">
              <span className="truncate max-w-xs">{p.title || p.url}</span>
              <span>{p.chunkCount} chunks</span>
            </div>
          ))}
        </div>
        {visibility !== 'individual' && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Conhecimento enviado para <strong>curadoria</strong>. O{' '}
              {visibility === 'department' ? 'gestor da área' : 'diretor do departamento'} irá
              revisar e aprovar.
            </span>
          </div>
        )}
        <button
          onClick={resetAll}
          className="w-full py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Ingerir outro site
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Ingestão de Site / URL
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Mapeie a arquitetura de um site, selecione as páginas relevantes e importe para o EKS.
          </p>
        </div>

        {/* URL + Depth */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL do site *</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isPreviewing && handlePreview()}
                placeholder="https://exemplo.com/documentos"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handlePreview}
                disabled={isPreviewing || !url.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isPreviewing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Mapear Site
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profundidade de navegação
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    depth === d
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {d === 0 ? 'Só raiz' : `${d} nível${d > 1 ? 'is' : ''}`}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Nível 0 = só a URL informada · Nível 1 = links diretos · Nível 2-3 = navegação mais
              profunda
            </p>
          </div>
        </div>

        {previewError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {previewError}
          </div>
        )}

        {/* Site Preview */}
        {preview && (
          <>
            {/* Stats */}
            <div className={`border rounded-lg p-4 transition-colors ${
              sizeWarning ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{preview.rootTitle}</p>
                  <p className="text-xs text-gray-400">{preview.domain}</p>
                </div>
                <div className="flex gap-4 text-xs text-gray-600">
                  <span className="flex flex-col items-end">
                    <span className="font-medium text-gray-900">{selectedPages.size}</span>
                    <span>Páginas</span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-medium text-gray-900">{selectedPdfs.size}</span>
                    <span>PDFs</span>
                  </span>
                  <span className={`flex flex-col items-end ${sizeWarning ? 'text-amber-700' : 'text-green-700'}`}>
                    <span className="font-medium">{estimatedMb} MB</span>
                    <span>Total Selecionado ({Math.round(totalSelectedKb)} KB)</span>
                  </span>
                </div>
              </div>
              {sizeWarning && (
                <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-100/50 rounded p-2 border border-amber-200/50">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Volume de dados alto. O processamento pode levar bastante tempo ({estimatedTimeStr}). Considere remover páginas secundárias.
                </div>
              )}
              {exceedsHardLimit && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded p-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Limite máximo de {MAX_SELECTED_MB} MB excedido. Reduza a seleção para continuar.
                </div>
              )}
            </div>

            {/* Page Selection */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  Selecionar Páginas ({selectedPages.size}/{preview.pages.length})
                </span>
                <button
                  onClick={selectAllPages}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedPages.size === preview.pages.length
                    ? 'Desmarcar tudo'
                    : 'Selecionar tudo'}
                </button>
              </div>

              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {Object.entries(groupedPages)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([level, pages]) => {
                    const lvl = Number(level);
                    const isExpanded = expandedLevels.has(lvl);
                    return (
                      <div key={level}>
                        {lvl > 0 && (
                          <button
                            onClick={() =>
                              setExpandedLevels((prev) => {
                                const next = new Set(prev);
                                if (next.has(lvl)) next.delete(lvl);
                                else next.add(lvl);
                                return next;
                              })
                            }
                            className="flex items-center gap-2 w-full px-4 py-2 bg-gray-50 text-xs text-gray-500 font-medium hover:bg-gray-100"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                            Nível {lvl} ({pages.length} página{pages.length > 1 ? 's' : ''})
                          </button>
                        )}
                        {(lvl === 0 || isExpanded) &&
                          pages.map((page) => (
                            <label
                              key={page.url}
                              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 ${
                                lvl > 0 ? 'pl-8' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPages.has(page.url)}
                                onChange={() => togglePage(page.url)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 truncate">
                                  {page.title || page.url}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{page.url}</p>
                              </div>
                              <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                {formatSize(page.sizeKb)}
                              </span>
                              <Eye className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 ml-1" />
                            </label>
                          ))}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* PDF Selection */}
            {preview.pdfs.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-500" />
                    PDFs disponíveis ({preview.pdfs.length})
                  </span>
                  <button
                    onClick={() => {
                      if (selectedPdfs.size === preview.pdfs.length) {
                        setSelectedPdfs(new Set());
                      } else {
                        setSelectedPdfs(new Set(preview.pdfs.map((p) => p.url)));
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedPdfs.size === preview.pdfs.length
                      ? 'Desmarcar tudo'
                      : 'Baixar todos'}
                  </button>
                </div>
                <div className="divide-y divide-gray-50 max-h-40 overflow-y-auto">
                  {preview.pdfs.map((pdf) => (
                    <label
                      key={pdf.url}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPdfs.has(pdf.url)}
                        onChange={() => togglePdf(pdf.url)}
                        className="rounded border-gray-300 text-red-500 focus:ring-red-400"
                      />
                      <Download className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{pdf.filename}</p>
                        <p className="text-xs text-gray-400 truncate">{pdf.url}</p>
                      </div>
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {formatSize(pdf.sizeKb)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Project Link */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-500" />
                Vínculos Estratégicos (opcional)
              </label>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Projetos - Multi-select */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Projetos Relacionados</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {projects.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjects([...selectedProjects, p.id]);
                            } else {
                              setSelectedProjects(selectedProjects.filter(id => id !== p.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                        />
                        <span className="text-sm text-gray-700">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Objetivos - Multi-select */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Objetivos Estratégicos</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {objectives.map((o) => (
                      <label key={o.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedObjectives.includes(o.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedObjectives([...selectedObjectives, o.id]);
                            } else {
                              setSelectedObjectives(selectedObjectives.filter(id => id !== o.id));
                            }
                          }}
                          className="rounded border-gray-300 text-purple-500 focus:ring-purple-400"
                        />
                        <span className="text-sm text-gray-700">{o.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* OKRs - Multi-select, only shows if objectives are selected */}
                {selectedObjectives.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      OKRs (Key Results) {availableOkrs.length > 0 && `(${availableOkrs.length} disponíveis)`}
                    </label>
                    {availableOkrs.length === 0 ? (
                      <div className="text-sm text-gray-400 italic border border-gray-200 rounded-lg p-3">
                        Nenhum OKR encontrado para os objetivos selecionados
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                        {availableOkrs.map((o) => (
                          <label key={o.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={selectedOkrs.includes(o.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOkrs([...selectedOkrs, o.id]);
                                } else {
                                  setSelectedOkrs(selectedOkrs.filter(id => id !== o.id));
                                }
                              }}
                              className="rounded border-gray-300 text-green-500 focus:ring-green-400"
                            />
                            <span className="text-sm text-gray-700">{o.title}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Visibility */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Visibilidade do Conhecimento *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = visibility === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVisibility(opt.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected ? opt.activeColor : opt.color
                      } ${isSelected ? 'shadow-sm' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 mb-1 ${
                          isSelected ? 'text-gray-800' : 'text-gray-500'
                        }`}
                      />
                      <p
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {ingestError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {ingestError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="px-4 py-2.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <X className="w-4 h-4 inline mr-1" />
                Limpar
              </button>
              <button
                onClick={handleIngest}
                disabled={isIngesting || selectedPages.size === 0 || exceedsHardLimit}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isIngesting ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ingerindo {selectedPages.size} página(s)...</span>
                    </div>
                    <span className="text-[10px] text-blue-200 mt-0.5">
                      Tempo estimado: {estimatedTimeStr}
                    </span>
                  </div>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Ingerir {selectedPages.size} página(s)
                    {selectedPdfs.size > 0 && ` + ${selectedPdfs.size} PDF(s)`}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
