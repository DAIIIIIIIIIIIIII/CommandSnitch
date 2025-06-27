
import React, { useState } from 'react';
import { Search, AlertTriangle, Code, Copy, Check, RotateCcw, ExternalLink, Package, FileX } from 'lucide-react';
import { analyzeCommand } from '../utils/commandParser';
import { useShiki } from '../hooks/useShiki';

const CommandAnalyzer = () => {
  const [command, setCommand] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const { highlightCode, isLoading: shikiLoading } = useShiki();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;

    setIsLoading(true);
    setIsSubmitted(true);
    setShowSlowMessage(false);
    
    // Immediately show the command with basic info
    const immediateResult = {
      type: 'Analyzing...',
      description: 'Command analysis in progress',
      warnings: [],
      urls: [],
      parameters: {},
      extractedCode: command.trim(),
      codeLanguage: 'text'
    };
    setResult(immediateResult);
    setIsExpanded(true);
    
    // Set timeout to show slow message after 5 seconds
    const slowTimeout = setTimeout(() => {
      setShowSlowMessage(true);
    }, 5000);

    try {
      const analysis = await analyzeCommand(command.trim());
      setResult(analysis);
    } catch (error) {
      console.error('Error analyzing command:', error);
      setResult({
        type: 'Error',
        description: 'Error analyzing command',
        warnings: ['An error occurred during analysis'],
        urls: [],
        parameters: {},
        extractedCode: command.trim(),
        codeLanguage: 'text'
      });
    } finally {
      clearTimeout(slowTimeout);
      setIsLoading(false);
      setShowSlowMessage(false);
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
    setShowSlowMessage(false);
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

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderUrlWithButton = (url: string, index: number) => (
    <div key={index} className="bg-gray-700 rounded-xl p-2 flex items-center justify-between">
      <code className="text-xs text-yellow-300 break-all flex-1 mr-2">{url}</code>
      <button
        onClick={() => openUrl(url)}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
        title="Open URL in new tab"
      >
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-start justify-end pr-8 pt-32">
      <div className={`bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 transition-all duration-700 ease-out ${
        isExpanded 
          ? 'w-full max-w-4xl transform translate-x-[-50%] translate-y-8' 
          : 'w-96'
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
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Paste the command and press enter"
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoFocus
                  disabled={isLoading || isSubmitted}
                />
              </div>
              {isSubmitted && (
                <button
                  type="button"
                  onClick={reset}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-colors"
                  title="New command"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Expanded results */}
        {isExpanded && result && (
          <div className="border-t border-gray-700 p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Command Analysis</h3>
              {isLoading && (
                <div className="flex items-center space-x-2 text-xs text-blue-400">
                  <div className="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full"></div>
                  <span>{showSlowMessage ? 'This is taking a bit longer than usual...' : 'Analyzing...'}</span>
                </div>
              )}
            </div>

            {/* Command type */}
            <div className="bg-gray-700 rounded-xl p-3">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-medium text-blue-400">TYPE:</span>
                <span className="text-sm text-white">{result.type}</span>
              </div>
              <div className="text-xs text-gray-300">{result.description}</div>
            </div>

            {/* Binary file warning */}
            {result.binaryInfo?.isBinary && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <FileX className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">BINARY FILE DETECTED</span>
                </div>
                <div className="space-y-2 text-xs">
                  {result.binaryInfo.fileName && (
                    <div className="text-red-300">
                      <span className="font-medium">File:</span> {result.binaryInfo.fileName}
                    </div>
                  )}
                  {result.binaryInfo.fileExtension && (
                    <div className="text-red-300">
                      <span className="font-medium">Type:</span> {result.binaryInfo.fileExtension}
                    </div>
                  )}
                  {result.binaryInfo.mimeType && (
                    <div className="text-red-300">
                      <span className="font-medium">MIME:</span> {result.binaryInfo.mimeType}
                    </div>
                  )}
                  <div className="text-red-200 mt-2 p-2 bg-red-900/30 rounded-lg">
                    ⚠️ This command downloads a binary file, not a script. Binary files cannot be previewed and may contain executable code.
                  </div>
                </div>
              </div>
            )}

            {/* Package information */}
            {result.packageInfo && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">PACKAGE INSTALLATION</span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-green-300">
                    <span className="font-medium">Manager:</span> {result.packageInfo.packageManager}
                  </div>
                </div>
              </div>
            )}

            {/* Security warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3">
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
            {result.extractedCode && !result.binaryInfo?.isBinary && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-400">
                    {result.packageInfo ? 'PACKAGE TO INSTALL:' : 'CODE THAT WOULD BE EXECUTED:'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 uppercase">{result.codeLanguage}</span>
                    {result.packageInfo?.searchUrl && (
                      <button
                        onClick={() => openUrl(result.packageInfo!.searchUrl!)}
                        className="inline-flex items-center space-x-1 text-xs text-blue-300 hover:text-blue-200 transition-colors"
                      >
                        <span>View package information</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {shikiLoading ? (
                  <div className="bg-gray-900 rounded-xl p-3 text-xs border border-gray-600">
                    <div className="text-gray-400">Loading syntax highlighter...</div>
                  </div>
                ) : (
                  <div 
                    className="bg-gray-900 rounded-xl border border-gray-600 overflow-y-auto text-xs [&>pre]:!m-0 [&>pre]:!p-3 [&>pre]:!bg-transparent [&>pre]:!overflow-x-auto"
                    style={{ maxHeight: 'none' }}
                    dangerouslySetInnerHTML={{ 
                      __html: highlightCode(
                        result.packageInfo ? result.packageInfo.packageName : result.extractedCode, 
                        result.codeLanguage
                      ) 
                    }}
                  />
                )}
              </div>
            )}

            {/* Binary file info instead of code */}
            {result.binaryInfo?.isBinary && result.extractedCode && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-red-400">BINARY FILE WARNING:</span>
                <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-3 text-xs">
                  <div 
                    className="text-red-200 whitespace-pre-wrap font-mono"
                    dangerouslySetInnerHTML={{ 
                      __html: result.extractedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    }}
                  />
                </div>
              </div>
            )}

            {/* URLs detected in code */}
            {result.urls && result.urls.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-yellow-400">URLS DETECTED IN CODE:</span>
                <div className="space-y-1">
                  {[...new Set(result.urls)].map((url: string, index: number) => 
                    renderUrlWithButton(url, index)
                  )}
                </div>
              </div>
            )}

            {/* Command parameters */}
            {result.parameters && Object.keys(result.parameters).length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-purple-400">PARAMETERS:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(result.parameters).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-gray-700 rounded-xl p-2">
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
