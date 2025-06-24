import React, { useState } from 'react';
import { Search, AlertTriangle, Code, Copy, Check, RotateCcw, ExternalLink, Package } from 'lucide-react';
import { analyzeCommand } from '../utils/commandParser';

const CommandAnalyzer = () => {
  const [command, setCommand] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;

    setIsLoading(true);
    setIsSubmitted(true);
    try {
      const analysis = await analyzeCommand(command.trim());
      setResult(analysis);
      setIsExpanded(true);
    } catch (error) {
      console.error('Error analyzing command:', error);
      setResult({
        type: 'Error',
        description: 'Error analyzing command',
        warnings: ['An error occurred during analysis'],
        urls: [],
        parameters: {},
        extractedCode: `Error: ${error}`,
        codeLanguage: 'text'
      });
      setIsExpanded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCommandToClipboard = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setCommand('');
    setResult(null);
    setIsExpanded(false);
    setIsLoading(false);
    setIsSubmitted(false);
  };

  const getLanguageColorClass = (language: string) => {
    switch (language) {
      case 'bash':
        return 'text-green-300';
      case 'powershell':
        return 'text-blue-300';
      case 'python':
        return 'text-yellow-300';
      case 'javascript':
        return 'text-orange-300';
      case 'c':
        return 'text-purple-300';
      case 'java':
        return 'text-red-300';
      default:
        return 'text-green-300';
    }
  };

  const highlightCode = (code: string, language: string) => {
    // Simple syntax highlighting based on language
    const colorClass = getLanguageColorClass(language);
    
    // Basic keyword highlighting for different languages
    let highlightedCode = code;
    
    if (language === 'bash') {
      highlightedCode = code
        .replace(/(#!\/bin\/bash|#!\/bin\/sh)/g, '<span class="text-purple-400">$1</span>')
        .replace(/(\$\w+)/g, '<span class="text-cyan-300">$1</span>')
        .replace(/(echo|cd|ls|mkdir|rm|cp|mv|grep|sed|awk)/g, '<span class="text-blue-400">$1</span>');
    } else if (language === 'powershell') {
      highlightedCode = code
        .replace(/(\$\w+)/g, '<span class="text-cyan-300">$1</span>')
        .replace(/(function|param|if|else|foreach|while)/g, '<span class="text-purple-400">$1</span>')
        .replace(/(Get-|Set-|New-|Remove-|Invoke-)\w+/g, '<span class="text-blue-400">$&</span>');
    } else if (language === 'python') {
      highlightedCode = code
        .replace(/(def|class|import|from|if|else|elif|for|while|try|except|finally|with|as)/g, '<span class="text-purple-400">$1</span>')
        .replace(/(print|input|len|range|str|int|float|list|dict)/g, '<span class="text-blue-400">$1</span>')
        .replace(/(['"][^'"]*['"])/g, '<span class="text-green-400">$1</span>');
    } else if (language === 'javascript') {
      highlightedCode = code
        .replace(/(function|const|let|var|if|else|for|while|try|catch|finally|class|extends)/g, '<span class="text-purple-400">$1</span>')
        .replace(/(console|document|window|Array|Object|String|Number)/g, '<span class="text-blue-400">$1</span>')
        .replace(/(['"][^'"]*['"])/g, '<span class="text-green-400">$1</span>');
    }
    
    return highlightedCode;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-start justify-center p-4">
      <div className={`bg-gray-800 rounded-lg shadow-2xl border border-gray-700 transition-all duration-300 ${
        isExpanded ? 'w-full max-w-4xl' : 'w-96'
      }`}>
        {/* Header */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative flex items-center space-x-2">
              <div className="relative flex-1">
                {!isSubmitted && <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />}
                {isSubmitted && !isLoading && (
                  <button
                    type="button"
                    onClick={copyCommandToClipboard}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                {isLoading && (
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4">
                    <div className="animate-bounce">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    </div>
                  </div>
                )}
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Paste the command and press enter"
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoFocus
                  disabled={isLoading || isSubmitted}
                />
              </div>
              {isSubmitted && (
                <button
                  type="button"
                  onClick={reset}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
                  title="New command"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
            {!isExpanded && (
              <p className="text-xs text-gray-400 text-center">
                {isLoading ? 'Downloading and analyzing...' : 'Paste the command and press enter'}
              </p>
            )}
          </form>
        </div>

        {/* Expanded results */}
        {isExpanded && result && (
          <div className="border-t border-gray-700 p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Command Analysis</h3>
            </div>

            {/* Command type */}
            <div className="bg-gray-700 rounded-md p-3">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-medium text-blue-400">TYPE:</span>
                <span className="text-sm text-white">{result.type}</span>
              </div>
              <div className="text-xs text-gray-300">{result.description}</div>
            </div>

            {/* Package information */}
            {result.packageInfo && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-md p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">PACKAGE INSTALLATION</span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-green-300">
                    <span className="font-medium">Package:</span> {result.packageInfo.packageName}
                  </div>
                  <div className="text-xs text-green-300">
                    <span className="font-medium">Manager:</span> {result.packageInfo.packageManager}
                  </div>
                </div>
              </div>
            )}

            {/* Security warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-md p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">SECURITY WARNINGS</span>
                </div>
                <ul className="space-y-1">
                  {result.warnings.map((warning: string, index: number) => (
                    <li key={index} className="text-xs text-red-300">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Package to install or Code that would be executed */}
            {result.extractedCode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-400">
                    {result.packageInfo ? `PACKAGE TO INSTALL: ${result.packageInfo.packageName}` : 'CODE THAT WOULD BE EXECUTED:'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 uppercase">{result.codeLanguage}</span>
                    {result.packageInfo?.searchUrl && (
                      <a
                        href={result.packageInfo.searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-blue-300 hover:text-blue-200 transition-colors"
                      >
                        <span>View package information</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
                <pre className={`bg-gray-900 rounded-md p-3 text-xs overflow-x-auto border border-gray-600 max-h-96 overflow-y-auto ${getLanguageColorClass(result.codeLanguage)}`}>
                  <code 
                    dangerouslySetInnerHTML={{ 
                      __html: highlightCode(result.extractedCode, result.codeLanguage) 
                    }}
                  />
                </pre>
              </div>
            )}

            {/* URLs detected in code */}
            {result.urls && result.urls.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-yellow-400">URLS DETECTED IN CODE:</span>
                <div className="space-y-1">
                  {result.urls.map((url: string, index: number) => (
                    <div key={index} className="bg-gray-700 rounded p-2">
                      <code className="text-xs text-yellow-300 break-all">{url}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Command parameters */}
            {result.parameters && Object.keys(result.parameters).length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-purple-400">PARAMETERS:</span>
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
