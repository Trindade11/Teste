'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, RefreshCw, Users, Building, MapPin, Link2 } from 'lucide-react';
import { api } from '@/lib/api';

interface IngestUser {
  email: string;
  name: string;
  action: 'created' | 'updated';
  department: string;
  accessAreas: string[];
  accessTypes: string[];
}

interface IngestError {
  row: number;
  email: string;
  error: string;
}

interface IngestResult {
  success: boolean;
  summary: {
    totalRows: number;
    usersCreated: number;
    usersUpdated: number;
    departmentsCreated: number;
    organizationsCreated: number;
    relationshipsCreated: number;
    errors: IngestError[];
  };
  users: IngestUser[];
}

interface DbStatus {
  nodeCounts: Record<string, number>;
  relationshipCounts: Record<string, number>;
  sampleUsers: Array<{
    email: string;
    name: string;
    status: string;
    department: string;
    organization: string;
    accessTypes: string[];
  }>;
  isEmpty: boolean;
}

export function DataIngestion() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDbStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await api.getIngestStatus();
      if (response.success && response.data) {
        setDbStatus(response.data);
        setError(null);
      } else {
        setError(response.error || 'Falha ao carregar estado do banco');
      }
    } catch (err) {
      console.error('Failed to fetch DB status:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Por favor, selecione um arquivo CSV');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await api.uploadOrgChart(file);

      if (!response.success) {
        throw new Error(response.error || 'Falha ao processar arquivo');
      }

      setResult({ success: true, ...response.data! });
      fetchDbStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fetchDbStatus();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Ingestão Inicial de Dados</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Importe dados do organograma via arquivo CSV. <strong>Os dados existentes serão atualizados, não deletados.</strong>
        </p>
      </div>

      {/* Current Database Status */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Estado Atual do Banco</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDbStatus}
              disabled={loadingStatus}
            >
              <RefreshCw className={`h-4 w-4 ${loadingStatus ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loadingStatus ? (
            <div className="text-center py-4 text-muted-foreground">
              Carregando...
            </div>
          ) : dbStatus ? (
            <>
              {/* Node Counts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
                  <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                  <p className="text-2xl font-bold text-blue-600">{dbStatus.nodeCounts['User'] || 0}</p>
                  <p className="text-xs text-muted-foreground">Usuários</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3 text-center">
                  <Building className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                  <p className="text-2xl font-bold text-purple-600">{dbStatus.nodeCounts['Department'] || 0}</p>
                  <p className="text-xs text-muted-foreground">Departamentos</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                  <Building className="h-5 w-5 mx-auto text-green-600 mb-1" />
                  <p className="text-2xl font-bold text-green-600">{dbStatus.nodeCounts['Organization'] || 0}</p>
                  <p className="text-xs text-muted-foreground">Organizações</p>
                </div>
              </div>

              {/* Relationship Counts */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                  <Link2 className="h-3 w-3" />
                  <span>MEMBER_OF: {dbStatus.relationshipCounts['MEMBER_OF'] || 0}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                  <Link2 className="h-3 w-3" />
                  <span>HAS_ACCESS_TO: {dbStatus.relationshipCounts['HAS_ACCESS_TO'] || 0}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                  <Link2 className="h-3 w-3" />
                  <span>BELONGS_TO: {dbStatus.relationshipCounts['BELONGS_TO'] || 0}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                  <Link2 className="h-3 w-3" />
                  <span>WORKS_AT: {dbStatus.relationshipCounts['WORKS_AT'] || 0}</span>
                </div>
              </div>

              {/* Sample Users */}
              {dbStatus.sampleUsers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Amostra de usuários (10 primeiros)</h4>
                  <div className="max-h-48 overflow-auto border border-border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Nome</th>
                          <th className="text-left p-2">E-mail</th>
                          <th className="text-left p-2">Departamento</th>
                          <th className="text-left p-2">Tipos de Acesso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbStatus.sampleUsers.map((user, idx) => (
                          <tr key={idx} className="border-t border-border">
                            <td className="p-2">{user.name}</td>
                            <td className="p-2">{user.email}</td>
                            <td className="p-2">{user.department || '—'}</td>
                            <td className="p-2">{user.accessTypes?.join(', ') || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {dbStatus.isEmpty && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    O banco está vazio. Faça o upload do CSV para a carga inicial.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Não foi possível carregar o estado do banco
            </div>
          )}
        </div>
      </Card>

      {/* Upload Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Upload de Arquivo</h3>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!file ? (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Arraste um arquivo CSV ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formato esperado: UTF-8, delimitador ponto-e-vírgula (;)
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Selecionar Arquivo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'Processando...' : 'Importar Dados'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={uploading}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Colunas esperadas:</strong></p>
            <p>name; company; jobTitle; department; access; relationshipType; accessTypes; email; status; role; managerEmail</p>
          </div>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Resultado da Importação</h3>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{result.summary.totalRows}</p>
                <p className="text-xs text-muted-foreground">Linhas processadas</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{result.summary.usersCreated}</p>
                <p className="text-xs text-muted-foreground">Usuários criados</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{result.summary.usersUpdated}</p>
                <p className="text-xs text-muted-foreground">Usuários atualizados</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">{result.summary.errors.length}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>

            {/* Errors */}
            {result.summary.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <h4 className="text-sm font-medium">Erros encontrados</h4>
                </div>
                <div className="max-h-40 overflow-auto border border-border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Linha</th>
                        <th className="text-left p-2">E-mail</th>
                        <th className="text-left p-2">Erro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.summary.errors.map((err, idx) => (
                        <tr key={idx} className="border-t border-border">
                          <td className="p-2">{err.row}</td>
                          <td className="p-2">{err.email || '—'}</td>
                          <td className="p-2 text-red-600">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Usuários processados</h4>
              <div className="max-h-80 overflow-auto border border-border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">E-mail</th>
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Ação</th>
                      <th className="text-left p-2">Departamento</th>
                      <th className="text-left p-2">Tipos de Acesso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.users.map((user, idx) => (
                      <tr key={idx} className="border-t border-border hover:bg-muted/50">
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">{user.name}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            user.action === 'created' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          }`}>
                            {user.action === 'created' ? 'Criado' : 'Atualizado'}
                          </span>
                        </td>
                        <td className="p-2">{user.department}</td>
                        <td className="p-2">{user.accessTypes.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Button variant="outline" onClick={handleReset}>
              Nova Importação
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
