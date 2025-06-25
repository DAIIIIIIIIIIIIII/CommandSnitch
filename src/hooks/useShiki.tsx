
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
    if (!highlighter) return code;

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

      return highlighter.codeToHtml(code, {
        lang: finalLang as any,
        theme: 'github-dark'
      });
    } catch (error) {
      console.error('Shiki highlighting error:', error);
      return `<pre><code>${code}</code></pre>`;
    }
  };

  return { highlightCode, isLoading };
};
