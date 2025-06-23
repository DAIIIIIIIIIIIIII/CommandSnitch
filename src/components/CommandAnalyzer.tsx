
import React, { useState } from 'react';
import { Search, AlertTriangle, Code, Copy, Check, Loader2 } from 'lucide-react';
import { analyzeCommand } from '../utils/commandParser';

const CommandAnalyzer = () => {
  const [command, setCommand] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const analysis = await analyzeCommand(command.trim());
      setResult(analysis);
      setIsExpanded(true);
    } catch (error) {
      console.error('Errore nell\'analisi del comando:', error);
      setResult({
        type: 'Errore',
        description: 'Errore nell\'analisi del comando',
        warnings: ['Si è verificato un errore durante l\'analisi'],
        urls: [],
        parameters: {},
        extractedCode: `Errore: ${error}`
      });
      setIsExpanded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setCommand('');
    setResult(null);
    setIsExpanded(false);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-start justify-center p-4">
      <div className={`bg-gray-800 rounded-lg shadow-2xl border border-gray-700 transition-all duration-300 ${
        isExpanded ? 'w-full max-w-4xl' : 'w-96'
      }`}>
        {/* Header compatto */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4 animate-spin" />
              )}
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Incolla il comando e premi invio"
                className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
                disabled={isLoading}
              />
            </div>
            {!isExpanded && (
              <p className="text-xs text-gray-400 text-center">
                {isLoading ? 'Scaricamento e analisi in corso...' : 'Incolla il comando e premi invio'}
              </p>
            )}
          </form>
        </div>

        {/* Risultati espansi */}
        {isExpanded && result && (
          <div className="border-t border-gray-700 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Analisi Comando</h3>
              </div>
              <button
                onClick={reset}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Nuovo comando
              </button>
            </div>

            {/* Tipo di comando */}
            <div className="bg-gray-700 rounded-md p-3">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-medium text-blue-400">TIPO:</span>
                <span className="text-sm text-white">{result.type}</span>
              </div>
              <div className="text-xs text-gray-300">{result.description}</div>
            </div>

            {/* Avvisi di sicurezza */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">AVVISI DI SICUREZZA</span>
                </div>
                <ul className="space-y-1">
                  {result.warnings.map((warning: string, index: number) => (
                    <li key={index} className="text-xs text-red-300">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Codice estratto */}
            {result.extractedCode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-400">CODICE CHE VERREBBE ESEGUITO:</span>
                  <button
                    onClick={() => copyToClipboard(result.extractedCode)}
                    className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copiato!' : 'Copia'}</span>
                  </button>
                </div>
                <pre className="bg-gray-900 rounded-md p-3 text-xs text-green-300 overflow-x-auto border border-gray-600 max-h-96 overflow-y-auto">
                  <code>{result.extractedCode}</code>
                </pre>
              </div>
            )}

            {/* URL rilevati */}
            {result.urls && result.urls.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-yellow-400">URL RILEVATI:</span>
                <div className="space-y-1">
                  {result.urls.map((url: string, index: number) => (
                    <div key={index} className="bg-gray-700 rounded p-2">
                      <code className="text-xs text-yellow-300 break-all">{url}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parametri del comando */}
            {result.parameters && Object.keys(result.parameters).length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-purple-400">PARAMETRI:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(result.parameters).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-gray-700 rounded p-2">
                      <div className="text-xs text-purple-300 font-medium">{key}:</div>
                      <div className="text-xs text-white break-all">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandAnalyzer;
