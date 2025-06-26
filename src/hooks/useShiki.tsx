
import { useState, useEffect } from 'react';
import { createHighlighter, type Highlighter } from 'shiki';

export const useShiki = () => {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initHighlighter = async () => {
      try {
        const shikiHighlighter = await createHighlighter({
          themes: ['github-dark'],
          langs: ['bash', 'powershell', 'python', 'javascript', 'typescript', 'c', 'java', 'json', 'text']
        });
        setHighlighter(shikiHighlighter);
      } catch (error) {
        console.error('Failed to initialize Shiki:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initHighlighter();
  }, []);

  const highlightCode = (code: string, language: string) => {
    // Debug logging per capire cosa riceve
    console.log('HIGHLIGHT CODE INPUT:', {
      codeLength: code?.length,
      language,
      codePreview: code?.substring(0, 200) + (code?.length > 200 ? '...' : ''),
      hasHighlighter: !!highlighter
    });

    if (!highlighter) {
      // Fallback migliore quando Shiki non è disponibile
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      
      console.log('SHIKI NOT READY - using fallback');
      return `<pre style="white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto;"><code>${escapedCode}</code></pre>`;
    }

    try {
      // Map some common language names to Shiki supported ones
      const langMap: Record<string, string> = {
        'shell': 'bash',
        'sh': 'bash',
        'ps1': 'powershell',
        'py': 'python',
        'js': 'javascript',
        'ts': 'typescript'
      };

      const shikiLang = langMap[language] || language;
      
      // Check if language is supported
      const supportedLangs = highlighter.getLoadedLanguages();
      const finalLang = supportedLangs.includes(shikiLang as any) ? shikiLang : 'text';

      console.log('SHIKI HIGHLIGHTING:', { originalLang: language, finalLang });

      const highlighted = highlighter.codeToHtml(code, {
        lang: finalLang as any,
        theme: 'github-dark'
      });

      console.log('SHIKI SUCCESS - highlighted length:', highlighted.length);
      return highlighted;
    } catch (error) {
      console.error('Shiki highlighting error:', error);
      
      // Fallback migliorato con escape HTML
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
        
      console.log('SHIKI ERROR FALLBACK - using escaped HTML');
      return `<pre style="white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto; background: #0d1117; color: #c9d1d9; padding: 12px; border-radius: 6px;"><code>${escapedCode}</code></pre>`;
    }
  };

  return { highlightCode, isLoading };
};
